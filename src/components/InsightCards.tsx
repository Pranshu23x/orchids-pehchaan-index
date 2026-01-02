'use client';

import { motion } from 'framer-motion';
import { StateData, DistrictData } from '@/lib/types';
import { formatNumber } from '@/lib/data-utils';
import { TrendingUp, MapPin, Users, FileText } from 'lucide-react';

interface InsightCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}

function InsightCard({ title, subtitle, icon, children, delay = 0 }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white border border-slate-200 rounded-xl p-5"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="text-slate-400">{icon}</div>
          <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1 ml-6">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

interface TopStatesCardProps {
  states: StateData[];
  delay?: number;
}

export function TopStatesCard({ states, delay = 0 }: TopStatesCardProps) {
  const topStates = states.slice(0, 5);

  return (
    <InsightCard
      title="States with Most Updates"
      subtitle="Monthly Aadhaar update count"
      icon={<TrendingUp size={16} />}
      delay={delay}
    >
      <div className="space-y-3">
        {topStates.map((state, idx) => (
          <div key={state.state} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-4">{idx + 1}</span>
              <span className="text-sm text-slate-700">{state.state}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {formatNumber(state.totalUpdates)} <span className="text-slate-400 font-normal">updates</span>
              </span>
              {idx < 3 && (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

interface TopDistrictsCardProps {
  districts: DistrictData[];
  delay?: number;
}

export function TopDistrictsCard({ districts, delay = 0 }: TopDistrictsCardProps) {
  return (
    <InsightCard
      title="Districts with Most Updates"
      subtitle="Monthly Aadhaar update count"
      icon={<MapPin size={16} />}
      delay={delay}
    >
      <div className="space-y-3">
        {districts.slice(0, 5).map((district, idx) => (
          <div key={`${district.state}-${district.district}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-slate-400 w-4">{idx + 1}</span>
              <div className="min-w-0">
                <span className="text-sm text-slate-700 block truncate">{district.district}</span>
                <span className="text-xs text-slate-400">{district.state}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium text-slate-900">
                {formatNumber(district.totalUpdates)} <span className="text-slate-400 font-normal">updates</span>
              </span>
              {idx < 3 && (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

interface DemographicBreakdownProps {
  states: StateData[];
  delay?: number;
}

export function DemographicBreakdown({ states, delay = 0 }: DemographicBreakdownProps) {
  const total0_5 = states.reduce((sum, s) => sum + s.age0_5, 0);
  const total5_17 = states.reduce((sum, s) => sum + s.age5_17, 0);
  const total18Plus = states.reduce((sum, s) => sum + s.age18Plus, 0);
  const totalAll = total0_5 + total5_17 + total18Plus;

  const breakdown = [
    { label: 'Children (0-5 years)', count: total0_5, percent: totalAll > 0 ? Math.round((total0_5 / totalAll) * 100) : 0 },
    { label: 'Youth (5-17 years)', count: total5_17, percent: totalAll > 0 ? Math.round((total5_17 / totalAll) * 100) : 0 },
    { label: 'Adults (18+ years)', count: total18Plus, percent: totalAll > 0 ? Math.round((total18Plus / totalAll) * 100) : 0 },
  ];

  return (
    <InsightCard
      title="Updates by Age Group"
      subtitle="Who is updating their Aadhaar"
      icon={<Users size={16} />}
      delay={delay}
    >
      <div className="space-y-4">
        {breakdown.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-700">{item.label}</span>
              <span className="text-sm font-medium text-slate-900">{formatNumber(item.count)} updates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-700 rounded-full" 
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8">{item.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

interface SummaryStatsProps {
  totalUpdates: number;
  totalStates: number;
  totalDistricts: number;
  highActivityCount: number;
}

export function SummaryStats({ totalUpdates, totalStates, totalDistricts, highActivityCount }: SummaryStatsProps) {
  const stats = [
    { label: 'Aadhaar Updates This Month', value: formatNumber(totalUpdates), suffix: 'updates', icon: <FileText size={14} /> },
    { label: 'States Reporting', value: totalStates.toString(), suffix: 'states', icon: <MapPin size={14} /> },
    { label: 'Districts Reporting', value: totalDistricts.toString(), suffix: 'districts', icon: <MapPin size={14} /> },
    { label: 'Districts with Above-Normal Updates', value: highActivityCount.toString(), suffix: 'districts', icon: <TrendingUp size={14} />, highlight: highActivityCount > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="bg-white border border-slate-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            {stat.icon}
            <span className="text-xs">{stat.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-semibold tracking-tight ${
              'highlight' in stat && stat.highlight ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {stat.value}
            </span>
            <span className="text-sm text-slate-400">{stat.suffix}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface TLDRBoxProps {
  states: StateData[];
  month: string;
}

export function TLDRBox({ states, month }: TLDRBoxProps) {
  const topStates = states.slice(0, 3).map(s => s.state);
  const totalAdult = states.reduce((sum, s) => sum + s.age18Plus, 0);
  const totalAll = states.reduce((sum, s) => sum + s.totalUpdates, 0);
  const adultPercent = totalAll > 0 ? Math.round((totalAdult / totalAll) * 100) : 0;
  const totalUpdates = formatNumber(totalAll);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900 text-white rounded-xl p-5"
    >
      <h3 className="text-sm font-medium text-slate-300 mb-3">{month} — Summary</h3>
      <ul className="space-y-2.5 text-sm leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="text-slate-500 mt-0.5">•</span>
          <span><strong>{totalUpdates}</strong> Aadhaar updates processed this month</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-slate-500 mt-0.5">•</span>
          <span><strong>{topStates.join(', ')}</strong> had the most updates</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-slate-500 mt-0.5">•</span>
          <span>Adult updates (18+) made up <strong>{adultPercent}%</strong> of all requests</span>
        </li>
      </ul>
    </motion.div>
  );
}
