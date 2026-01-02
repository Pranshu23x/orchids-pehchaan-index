'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { formatMonth } from '@/lib/data-utils';

interface MonthSelectorProps {
  months: string[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ months, selectedMonth, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        className="appearance-none w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all duration-200"
      >
        {months.map((month) => (
          <option key={month} value={month}>
            {formatMonth(month)}
          </option>
        ))}
      </select>
      <ChevronDown 
        size={14} 
        className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none sm:w-4 sm:h-4" 
      />
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4 sm:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="h-6 sm:h-8 w-36 sm:w-48 bg-slate-200 rounded-lg" />
              <div className="h-3 sm:h-4 w-48 sm:w-72 bg-slate-200 rounded" />
            </div>
            <div className="h-8 sm:h-10 w-full sm:w-40 bg-slate-200 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 sm:h-24 bg-slate-200 rounded-lg" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="lg:col-span-5 h-[300px] sm:h-[500px] bg-slate-200 rounded-xl" />
            <div className="lg:col-span-7 space-y-4">
              <div className="h-40 sm:h-48 bg-slate-200 rounded-xl" />
              <div className="h-40 sm:h-48 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-200 rounded" />
        <div className="h-3 sm:h-4 w-24 sm:w-32 bg-slate-200 rounded" />
      </div>
      <div className="space-y-2 sm:space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 sm:h-4 w-20 sm:w-24 bg-slate-200 rounded" />
            <div className="h-3 sm:h-4 w-12 sm:w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
