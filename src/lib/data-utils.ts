import { AadhaarRecord, StateData, DistrictData, Recommendation } from './types';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function parseCSV(csvText: string): AadhaarRecord[] {
  const lines = csvText.trim().split('\n');
  
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    return {
      Month: values[0],
      State: normalizeCase(values[1]),
      District: normalizeCase(values[2]),
      Age_0_5: parseInt(values[3], 10),
      Age_5_17: parseInt(values[4], 10),
      Age_18_plus: parseInt(values[5], 10),
    };
  });
}

export function getDominantAgeGroup(age0_5: number, age5_17: number, age18Plus: number): string {
  const max = Math.max(age0_5, age5_17, age18Plus);
  if (max === age18Plus) return 'Adult (18+)';
  if (max === age5_17) return 'Youth (5-17)';
  return 'Child (0-5)';
}

export function calculateIntensity(
  value: number,
  values: number[]
): 'low' | 'medium' | 'high' {
  const sorted = [...values].sort((a, b) => a - b);
  const p33 = sorted[Math.floor(sorted.length * 0.33)];
  const p66 = sorted[Math.floor(sorted.length * 0.66)];
  
  if (value <= p33) return 'low';
  if (value <= p66) return 'medium';
  return 'high';
}

export function aggregateByState(
  records: AadhaarRecord[],
  month: string
): StateData[] {
  const filtered = records.filter(r => r.Month === month);
  const stateMap = new Map<string, {
    age0_5: number;
    age5_17: number;
    age18Plus: number;
    districts: DistrictData[];
  }>();

  filtered.forEach(record => {
    const total = record.Age_0_5 + record.Age_5_17 + record.Age_18_plus;
    const existing = stateMap.get(record.State) || {
      age0_5: 0,
      age5_17: 0,
      age18Plus: 0,
      districts: [],
    };

    existing.age0_5 += record.Age_0_5;
    existing.age5_17 += record.Age_5_17;
    existing.age18Plus += record.Age_18_plus;
    existing.districts.push({
      district: record.District,
      state: record.State,
      totalUpdates: total,
      age0_5: record.Age_0_5,
      age5_17: record.Age_5_17,
      age18Plus: record.Age_18_plus,
      dominantAgeGroup: getDominantAgeGroup(record.Age_0_5, record.Age_5_17, record.Age_18_plus),
      intensity: 'low',
    });

    stateMap.set(record.State, existing);
  });

  const states = Array.from(stateMap.entries()).map(([state, data]) => ({
    state,
    totalUpdates: data.age0_5 + data.age5_17 + data.age18Plus,
    age0_5: data.age0_5,
    age5_17: data.age5_17,
    age18Plus: data.age18Plus,
    districts: data.districts,
    dominantAgeGroup: getDominantAgeGroup(data.age0_5, data.age5_17, data.age18Plus),
    intensity: 'low' as const,
  }));

  const totals = states.map(s => s.totalUpdates);
  const districtTotals = states.flatMap(s => s.districts.map(d => d.totalUpdates));

  states.forEach(state => {
    state.intensity = calculateIntensity(state.totalUpdates, totals);
    state.districts.forEach(district => {
      district.intensity = calculateIntensity(district.totalUpdates, districtTotals);
    });
  });

  return states.sort((a, b) => b.totalUpdates - a.totalUpdates);
}

export function getUniqueMonths(records: AadhaarRecord[]): string[] {
  const months = new Set(records.map(r => r.Month));
  return Array.from(months).sort().reverse();
}

export function getTopDistricts(states: StateData[], limit: number = 5): DistrictData[] {
  return states
    .flatMap(s => s.districts)
    .sort((a, b) => b.totalUpdates - a.totalUpdates)
    .slice(0, limit);
}

export function getDemographicAlerts(states: StateData[]): {
  state: string;
  district: string;
  alert: string;
  severity: 'high' | 'medium';
}[] {
  const alerts: {
    state: string;
    district: string;
    alert: string;
    severity: 'high' | 'medium';
  }[] = [];

  states.forEach(state => {
    state.districts.forEach(district => {
      const childRatio = district.age0_5 / district.totalUpdates;
      const youthRatio = district.age5_17 / district.totalUpdates;
      const adultRatio = district.age18Plus / district.totalUpdates;

      if (childRatio > 0.4) {
        alerts.push({
          state: state.state,
          district: district.district,
          alert: `High child enrollment (${(childRatio * 100).toFixed(0)}%)`,
          severity: 'high',
        });
      } else if (adultRatio > 0.75) {
        alerts.push({
          state: state.state,
          district: district.district,
          alert: `Adult-heavy updates (${(adultRatio * 100).toFixed(0)}%)`,
          severity: 'medium',
        });
      } else if (youthRatio > 0.35) {
        alerts.push({
          state: state.state,
          district: district.district,
          alert: `Youth surge detected (${(youthRatio * 100).toFixed(0)}%)`,
          severity: 'medium',
        });
      }
    });
  });

  return alerts.slice(0, 5);
}

export function generateRecommendations(
  states: StateData[],
  month: string
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const allDistricts = states.flatMap(s => s.districts);
  const avgTotal = allDistricts.reduce((sum, d) => sum + d.totalUpdates, 0) / allDistricts.length;

  states.forEach(state => {
    const stateMedian = state.districts.reduce((sum, d) => sum + d.totalUpdates, 0) / state.districts.length;

    state.districts
      .filter(d => d.intensity === 'high')
      .forEach(district => {
        const multiplier = (district.totalUpdates / stateMedian).toFixed(1);
        const reasons: string[] = [];
        const actions: string[] = [];

        if (parseFloat(multiplier) > 1.5) {
          reasons.push(`${multiplier}× state median update volume`);
        }

        const adultRatio = district.age18Plus / district.totalUpdates;
        const childRatio = district.age0_5 / district.totalUpdates;
        const youthRatio = district.age5_17 / district.totalUpdates;

        if (adultRatio > 0.65) {
          reasons.push('Adult-heavy demographic skew');
          actions.push('Extended update windows');
          actions.push('Priority processing for biometric updates');
        }
        if (childRatio > 0.25) {
          reasons.push('High child enrollment activity');
          actions.push('School-based enrollment camps');
          actions.push('Parent awareness campaigns');
        }
        if (youthRatio > 0.3) {
          reasons.push('Youth update surge');
          actions.push('College enrollment integration');
        }

        if (district.totalUpdates > avgTotal * 1.5) {
          actions.push('Temporary capacity expansion');
          actions.push('Targeted awareness campaigns');
        }

        if (reasons.length > 0) {
          recommendations.push({
            severity: district.totalUpdates > avgTotal * 2 ? 'high' : 'medium',
            location: `${district.district}, ${state.state}`,
            month: formatMonth(month),
            reasons,
            actions: actions.length > 0 ? actions : ['Monitor situation closely'],
            expectedImpact: district.totalUpdates > avgTotal * 2
              ? '~25–35% load normalization'
              : '~15–20% efficiency improvement',
          });
        }
      });
  });

  return recommendations
    .sort((a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0))
    .slice(0, 4);
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
