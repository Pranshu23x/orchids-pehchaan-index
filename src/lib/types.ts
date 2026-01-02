export interface AadhaarRecord {
  Month: string;
  State: string;
  District: string;
  Age_0_5: number;
  Age_5_17: number;
  Age_18_plus: number;
}

export interface StateData {
  state: string;
  totalUpdates: number;
  age0_5: number;
  age5_17: number;
  age18Plus: number;
  districts: DistrictData[];
  dominantAgeGroup: string;
  intensity: 'low' | 'medium' | 'high';
}

export interface DistrictData {
  district: string;
  state: string;
  totalUpdates: number;
  age0_5: number;
  age5_17: number;
  age18Plus: number;
  dominantAgeGroup: string;
  intensity: 'low' | 'medium' | 'high';
}

export interface InsightCardData {
  title: string;
  items: {
    name: string;
    value: number | string;
    subtext?: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

export interface Recommendation {
  severity: 'high' | 'medium' | 'low';
  location: string;
  month: string;
  reasons: string[];
  actions: string[];
  expectedImpact: string;
}
