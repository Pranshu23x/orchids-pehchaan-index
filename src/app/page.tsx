'use client';

import { useState, useEffect, useMemo, Suspense, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { IndiaMap, MapTooltip } from '@/components/IndiaMap';
import { MonthSelector, LoadingSkeleton } from '@/components/MonthSelector';
import { 
  parseCSV, 
  aggregateByState, 
  getUniqueMonths, 
  getTopDistricts,
  formatMonth,
  formatNumber
} from '@/lib/data-utils';
import { AadhaarRecord, StateData } from '@/lib/types';
import { Activity, TrendingUp, MapPin, ChevronRight, FileText, ChevronDown, Info, BarChart2 } from 'lucide-react';

const COLORS = {
  primary: '#0F172A',
  accent: '#1E3A8A',
  amber: '#D97706',
  emerald: '#15803D',
  slate: '#64748B',
  red: '#B91C1C',
};

const PIE_COLORS = ['#1E3A8A', '#15803D', '#D97706'];

const FALLBACK_SUGGESTIONS = [
  {
    whyReasons: [
      'High population density in the region leading to increased service demand',
      'Recent government mandate requiring Aadhaar updates for welfare schemes',
      'Migration patterns causing address change requirements',
    ],
    actions: [
      'Deploy additional mobile enrollment units to the district',
      'Extend operating hours at existing Aadhaar centers',
      'Set up temporary camps in high-traffic areas',
    ],
  },
  {
    whyReasons: [
      'Upcoming elections requiring updated voter ID linkage',
      'Bank account linking deadlines approaching',
      'School enrollment season requiring child Aadhaar updates',
    ],
    actions: [
      'Coordinate with local banks for on-site enrollment drives',
      'Partner with schools for children Aadhaar camps',
      'Increase awareness campaigns about update procedures',
    ],
  },
  {
    whyReasons: [
      'New biometric update requirements for senior citizens',
      'SIM card re-verification drives by telecom operators',
      'Healthcare scheme registrations requiring Aadhaar linkage',
    ],
    actions: [
      'Set up dedicated counters for elderly residents',
      'Collaborate with telecom providers for joint camps',
      'Streamline document verification process',
    ],
  },
  {
    whyReasons: [
      'Post-pandemic recovery leading to delayed updates catching up',
      'New housing developments requiring fresh address registrations',
      'LPG subsidy scheme updates requiring Aadhaar verification',
    ],
    actions: [
      'Prioritize address update requests to reduce backlog',
      'Deploy staff to new residential areas',
      'Coordinate with gas agencies for bulk processing',
    ],
  },
  {
    whyReasons: [
      'Employment verification requirements from IT sector companies',
      'Passport application surge requiring Aadhaar updates',
      'Insurance policy linkage deadlines approaching',
    ],
    actions: [
      'Set up corporate enrollment partnerships',
      'Coordinate with passport offices for integrated services',
      'Extend weekend operations at major centers',
    ],
  },
  {
    whyReasons: [
      'Agricultural subsidy disbursement requiring farmer Aadhaar updates',
      'Rural employment guarantee scheme registrations',
      'Seasonal migration patterns from agricultural regions',
    ],
    actions: [
      'Deploy mobile vans to rural and farming communities',
      'Coordinate with agriculture department for farmer camps',
      'Set up enrollment points at mandis and agricultural markets',
    ],
  },
  {
    whyReasons: [
      'Marriage registrations leading to name change updates',
      'College admission season requiring student verification',
      'Property registration mandates requiring Aadhaar proof',
    ],
    actions: [
      'Expedite name change request processing',
      'Partner with universities for student enrollment drives',
      'Set up counters at sub-registrar offices',
    ],
  },
];

const BRAND_NAMES = [
  { lang: 'English', name: 'Pehchaan Index' },
  { lang: 'Hindi', name: 'पहचान सूचकांक' },
  { lang: 'Tamil', name: 'அடையாள குறியீடு' },
  { lang: 'Bengali', name: 'পরিচয় সূচক' },
  { lang: 'Telugu', name: 'గుర్తింపు సూచిక' },
];

const cardHoverProps = {
  whileHover: { y: -4, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' },
  transition: { type: 'spring', stiffness: 400, damping: 25 }
};

const amberCardHoverProps = {
  whileHover: { y: -4, boxShadow: '0 20px 50px rgba(217,119,6,0.25)' },
  transition: { type: 'spring', stiffness: 400, damping: 25 }
};

function AnimatedBrandName() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BRAND_NAMES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-5 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="text-base font-semibold tracking-tight text-[#0F172A] absolute whitespace-nowrap"
        >
          {BRAND_NAMES[currentIndex].name}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
}

interface AIRecommendationProps {
  aiInsight: {
    district: string;
    state: string;
    updates: number;
  };
  aiLoading: boolean;
  aiInsightData: AIInsightData | null;
  showAIInsights: boolean;
  setShowAIInsights: (show: boolean) => void;
}

function AIRecommendation({ aiInsight, aiLoading, aiInsightData, showAIInsights, setShowAIInsights }: AIRecommendationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reasonsRef = useRef<HTMLUListElement>(null);
  const actionsRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current,
        { 
          y: 30, 
          opacity: 0, 
          scale: 0.98,
        },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
        }
      );

      gsap.fromTo(headerRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: 'power2.out' }
      );

      gsap.fromTo(buttonRef.current,
        { x: 20, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.5, delay: 0.3, ease: 'back.out(1.7)' }
      );

      if (glowRef.current) {
        gsap.to(glowRef.current, {
          backgroundPosition: '200% center',
          duration: 3,
          repeat: -1,
          ease: 'none',
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    if (!aiInsightData || aiLoading || !showAIInsights) return;

    const ctx = gsap.context(() => {
      if (reasonsRef.current) {
        const items = reasonsRef.current.querySelectorAll('li');
        gsap.fromTo(items,
          { x: -30, opacity: 0, filter: 'blur(4px)' },
          { 
            x: 0, 
            opacity: 1, 
            filter: 'blur(0px)',
            duration: 0.6,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.1
          }
        );
      }

      if (actionsRef.current) {
        const items = actionsRef.current.querySelectorAll('li');
        gsap.fromTo(items,
          { x: 30, opacity: 0, filter: 'blur(4px)' },
          { 
            x: 0, 
            opacity: 1, 
            filter: 'blur(0px)',
            duration: 0.6,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.2
          }
        );
      }
    }, contentRef);

    return () => ctx.revert();
  }, [aiInsightData, aiLoading, showAIInsights]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    gsap.to(containerRef.current, {
      '--mouse-x': `${x}px`,
      '--mouse-y': `${y}px`,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 overflow-hidden shadow-[0_8px_32px_rgba(30,58,138,0.12)] hover:shadow-[0_20px_60px_rgba(30,58,138,0.2)] transition-all duration-500"
      style={{ 
        '--mouse-x': '50%', 
        '--mouse-y': '50%',
      } as React.CSSProperties}
    >
      <div 
        ref={glowRef}
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(30,58,138,0.15) 25%, rgba(217,119,6,0.1) 50%, rgba(30,58,138,0.15) 75%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
      />
      
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(30,58,138,0.06), transparent 40%)',
        }}
      />

      <div ref={headerRef} className="p-3 sm:p-5 border-l-4 border-[#1E3A8A] rounded-l-3xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
              <Info size={16} className="text-white sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-[#1E3A8A] tracking-wide">AI Recommendation</div>
              <div className="text-xs sm:text-sm text-[#64748B] mt-0.5 line-clamp-2 sm:line-clamp-none">
                <strong className="text-[#0F172A]">{aiInsight.district}, {aiInsight.state}</strong> — {formatNumber(aiInsight.updates)} updates
              </div>
            </div>
          </div>
          <button
            ref={buttonRef}
            onClick={() => setShowAIInsights(!showAIInsights)}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-md hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 text-[#0F172A] text-[10px] sm:text-xs font-semibold border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-full sm:w-auto"
          >
            <ChevronDown size={12} className={`transition-transform duration-300 sm:w-[14px] sm:h-[14px] ${showAIInsights ? 'rotate-180' : ''}`} />
            {showAIInsights ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAIInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div ref={contentRef} className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/70 shadow-inner">
                {aiLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Why this is happening</span>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-start gap-2 sm:gap-3">
                            <span className="text-[#64748B] mt-0.5">•</span>
                            <div 
                              className="h-3 sm:h-4 rounded-lg w-full overflow-hidden"
                              style={{
                                background: 'linear-gradient(90deg, #E5E7EB 0%, #F8FAFC 50%, #E5E7EB 100%)',
                                backgroundSize: '200% 100%',
                                animation: `shimmer 1.5s ease-in-out infinite ${i * 0.15}s`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="w-2 h-2 rounded-full bg-[#1E3A8A] animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Recommended actions</span>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-start gap-2 sm:gap-3">
                            <span className="text-[#64748B] mt-0.5">•</span>
                            <div 
                              className="h-3 sm:h-4 rounded-lg w-full overflow-hidden"
                              style={{
                                background: 'linear-gradient(90deg, #E5E7EB 0%, #F8FAFC 50%, #E5E7EB 100%)',
                                backgroundSize: '200% 100%',
                                animation: `shimmer 1.5s ease-in-out infinite ${i * 0.15 + 0.3}s`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : aiInsightData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="w-2 h-2 rounded-full bg-[#D97706]" />
                        <span className="text-[10px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Why this is happening</span>
                      </div>
                      <ul ref={reasonsRef} className="space-y-2 sm:space-y-3">
                        {aiInsightData.whyReasons.map((reason, i) => (
                          <li key={i} className="text-xs sm:text-sm text-[#0F172A] flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/50 transition-colors duration-200">
                            <span className="text-[#D97706] mt-0.5 font-bold">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {aiInsightData.actions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <div className="w-2 h-2 rounded-full bg-[#1E3A8A]" />
                          <span className="text-[10px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Recommended actions</span>
                        </div>
                        <ul ref={actionsRef} className="space-y-2 sm:space-y-3">
                          {aiInsightData.actions.map((action, i) => (
                            <li key={i} className="text-xs sm:text-sm text-[#0F172A] flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/50 transition-colors duration-200">
                              <span className="text-[#1E3A8A] mt-0.5 font-bold">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 text-xs sm:text-sm text-[#64748B]">
                    Click the button above to generate AI insights
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

interface AIInsightData {
  whyReasons: string[];
  actions: string[];
}

function Dashboard() {
  const [records, setRecords] = useState<AadhaarRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [aiInsightData, setAiInsightData] = useState<AIInsightData | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [fallbackIndex] = useState(() => Math.floor(Math.random() * FALLBACK_SUGGESTIONS.length));
  
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const statsCardsRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/data.csv')
      .then(res => res.text())
      .then(csv => {
        const parsed = parseCSV(csv);
        setRecords(parsed);
        const months = getUniqueMonths(parsed);
        setSelectedMonth(months[0] || '');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAiInsightData(FALLBACK_SUGGESTIONS[fallbackIndex]);
      setAiLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [fallbackIndex]);

  useLayoutEffect(() => {
    if (isLoading || !mainRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );

      if (statsCardsRef.current) {
        const cards = statsCardsRef.current.querySelectorAll('.stat-card');
        gsap.fromTo(cards,
          { y: 40, opacity: 0, scale: 0.95 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            delay: 0.3
          }
        );
      }

      if (chartsRef.current) {
        const chartCards = chartsRef.current.querySelectorAll('.chart-card');
        gsap.fromTo(chartCards,
          { y: 60, opacity: 0, scale: 0.96 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            delay: 0.6
          }
        );
      }
    }, mainRef);

    return () => ctx.revert();
  }, [isLoading]);

  const months = useMemo(() => getUniqueMonths(records), [records]);
  
  const stateData = useMemo(() => {
    if (!selectedMonth) return [];
    return aggregateByState(records, selectedMonth);
  }, [records, selectedMonth]);

  const topDistricts = useMemo(() => getTopDistricts(stateData, 12), [stateData]);

  const summaryStats = useMemo(() => {
    const totalUpdates = stateData.reduce((sum, s) => sum + s.totalUpdates, 0);
    const totalDistricts = stateData.reduce((sum, s) => sum + s.districts.length, 0);
    const highActivityCount = stateData.flatMap(s => s.districts).filter(d => d.intensity === 'high').length;
    return { totalUpdates, totalStates: stateData.length, totalDistricts, highActivityCount };
  }, [stateData]);

  const ageData = useMemo(() => {
    const total0_5 = stateData.reduce((sum, s) => sum + s.age0_5, 0);
    const total5_17 = stateData.reduce((sum, s) => sum + s.age5_17, 0);
    const total18Plus = stateData.reduce((sum, s) => sum + s.age18Plus, 0);
    return [
      { name: 'Children (0-5)', value: total0_5, color: PIE_COLORS[0] },
      { name: 'Youth (5-17)', value: total5_17, color: PIE_COLORS[1] },
      { name: 'Adults (18+)', value: total18Plus, color: PIE_COLORS[2] },
    ];
  }, [stateData]);

  const barChartData = useMemo(() => {
    return stateData.slice(0, 10).map(s => ({
      name: s.state.length > 14 ? s.state.slice(0, 14) + '...' : s.state,
      updates: s.totalUpdates,
      fullName: s.state,
    }));
  }, [stateData]);

  const trendData = useMemo(() => {
    const monthlyTotals = months.slice(0, 6).reverse().map(m => {
      const data = aggregateByState(records, m);
      return {
        month: formatMonth(m).split(' ')[0].slice(0, 3),
        updates: data.reduce((sum, s) => sum + s.totalUpdates, 0),
      };
    });
    return monthlyTotals;
  }, [records, months]);

  const totalAll = ageData.reduce((sum, d) => sum + d.value, 0);

  const aiInsight = useMemo(() => {
    if (!topDistricts[0] || !stateData.length) return null;
    const top = topDistricts[0];
    const avgUpdates = summaryStats.totalUpdates / Math.max(summaryStats.totalDistricts, 1);
    const topRatio = top.totalUpdates / avgUpdates;
    const childrenPct = totalAll > 0 ? Math.round(((ageData[0].value + ageData[1].value) / totalAll) * 100) : 0;
    
    return {
      district: top.district,
      state: top.state,
      updates: top.totalUpdates,
      ratio: topRatio,
      childrenPct,
      avgUpdates,
    };
    }, [topDistricts, stateData, summaryStats, totalAll, ageData]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div ref={mainRef} className="min-h-screen text-[#0F172A] overflow-y-auto" style={{ fontFamily: "'Inter', 'Source Sans 3', system-ui, sans-serif", backgroundImage: 'url(/bg-gradient.jpg)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
      <header ref={headerRef} className="sticky top-0 z-50 mx-3 sm:mx-6 mt-2 sm:mt-4 rounded-2xl sm:rounded-full bg-white/70 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 border border-white/50 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1E3A8A] flex items-center justify-center flex-shrink-0">
              <Activity size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="min-w-0">
              <AnimatedBrandName />
              <p className="text-[10px] sm:text-[11px] text-[#64748B] max-w-[200px] sm:max-w-lg leading-tight">Tracks monthly Aadhaar update activity across India</p>
            </div>
          </div>
          <MonthSelector 
            months={months} 
            selectedMonth={selectedMonth} 
            onMonthChange={setSelectedMonth} 
          />
        </div>
      </header>

      <main className="p-3 sm:p-6 max-w-[1800px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMonth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 sm:space-y-5"
          >
            {aiInsight && (
              <AIRecommendation 
                aiInsight={aiInsight}
                aiLoading={aiLoading}
                aiInsightData={aiInsightData}
                showAIInsights={showAIInsights}
                setShowAIInsights={setShowAIInsights}
              />
            )}

            <div ref={statsCardsRef} className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
              <motion.div 
                className="stat-card col-span-1 lg:col-span-3 bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                {...cardHoverProps}
              >
                <div className="flex items-center gap-2 text-[#64748B] mb-1 sm:mb-2">
                  <FileText size={12} className="sm:w-[14px] sm:h-[14px]" />
                  <span className="text-[9px] sm:text-[11px] uppercase tracking-wider font-medium">Total Updates</span>
                </div>
                <div className="text-xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">{formatNumber(summaryStats.totalUpdates)}</div>
                <div className="text-[9px] sm:text-[11px] text-[#64748B] mt-1 hidden sm:block">Aadhaar updates processed this month</div>
              </motion.div>

              <motion.div 
                className="stat-card col-span-1 lg:col-span-3 bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                {...cardHoverProps}
              >
                <div className="flex items-center gap-2 text-[#64748B] mb-1 sm:mb-2">
                  <MapPin size={12} className="sm:w-[14px] sm:h-[14px]" />
                  <span className="text-[9px] sm:text-[11px] uppercase tracking-wider font-medium">Coverage</span>
                </div>
                <div className="text-xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">{summaryStats.totalStates}</div>
                <div className="text-[9px] sm:text-[11px] text-[#64748B] mt-1"><span className="hidden sm:inline">states/UTs · </span>{summaryStats.totalDistricts} districts</div>
              </motion.div>

              <motion.div 
                className="stat-card col-span-1 lg:col-span-3 bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-[#D97706]/40 shadow-[0_8px_30px_rgba(217,119,6,0.15)]"
                {...amberCardHoverProps}
              >
                <div className="flex items-center gap-2 text-[#D97706] mb-1 sm:mb-2">
                  <TrendingUp size={12} className="sm:w-[14px] sm:h-[14px]" />
                  <span className="text-[9px] sm:text-[11px] uppercase tracking-wider font-medium">Above Normal</span>
                </div>
                <div className="text-xl sm:text-3xl font-semibold tracking-tight text-[#D97706]">{summaryStats.highActivityCount}</div>
                <div className="text-[9px] sm:text-[11px] text-[#64748B] mt-1 hidden sm:block">districts with above-normal monthly updates</div>
              </motion.div>

              <motion.div 
                className="stat-card col-span-1 lg:col-span-3 bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                {...cardHoverProps}
              >
                <div className="mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#64748B] font-medium">6-Month Trend</span>
                </div>
                <div className="h-[50px] sm:h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} hide />
                      <Area type="monotone" dataKey="updates" stroke={COLORS.accent} fill="url(#colorUpdates)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
              <motion.div 
                className="chart-card col-span-1 lg:col-span-5 bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative"
                {...cardHoverProps}
              >
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-medium text-[#0F172A]">Update Distribution by State</h3>
                  <p className="text-[10px] sm:text-[11px] text-[#64748B]">Darker color indicates higher volume</p>
                </div>
                <div className="h-[300px] sm:h-[480px]">
                  <IndiaMap 
                    stateData={stateData} 
                    onStateHover={setHoveredState}
                    selectedState={hoveredState}
                  />
                </div>
                <MapTooltip state={hoveredState} month={formatMonth(selectedMonth)} />
              </motion.div>

              <div className="col-span-1 lg:col-span-4 space-y-3 sm:space-y-4">
                <motion.div 
                  className="chart-card bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                  {...cardHoverProps}
                >
                  <div className="mb-3 sm:mb-4 flex items-center gap-2">
                    <BarChart2 size={12} className="text-[#64748B] sm:w-[14px] sm:h-[14px]" />
                    <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#64748B] font-medium">Top States by Updates</span>
                  </div>
                  <div className="h-[200px] sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 15 }}>
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 8, fill: '#64748B' }} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(v) => formatNumber(v)}
                          label={{ value: 'Monthly Aadhaar updates', position: 'bottom', offset: 0, fontSize: 9, fill: '#64748B' }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 9, fill: '#0F172A' }} 
                          axisLine={false} 
                          tickLine={false}
                          width={70}
                        />
                        <Tooltip 
                          contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '11px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => [formatNumber(value) + ' updates', 'Total']}
                        />
                        <Bar dataKey="updates" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div 
                  className="chart-card bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                  {...cardHoverProps}
                >
                  <div className="mb-2 sm:mb-3">
                    <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#64748B] font-medium">Age Distribution</span>
                    <p className="text-[9px] sm:text-[10px] text-[#64748B] mt-1 hidden sm:block">Adult updates indicate address/phone changes</p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 h-[100px] sm:h-[140px]">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ageData}
                            cx="50%"
                            cy="50%"
                            innerRadius="50%"
                            outerRadius="85%"
                            dataKey="value"
                            stroke="none"
                          >
                            {ageData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-2 sm:space-y-3">
                      {ageData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ background: item.color }} />
                            <span className="text-[9px] sm:text-xs text-[#0F172A] truncate max-w-[60px] sm:max-w-none">{item.name}</span>
                          </div>
                          <span className="text-[9px] sm:text-xs font-medium text-[#0F172A]">{totalAll > 0 ? Math.round((item.value / totalAll) * 100) : 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="col-span-1 lg:col-span-3 space-y-3 sm:space-y-4">
                <motion.div 
                  className="chart-card bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                  {...cardHoverProps}
                >
                  <div className="mb-2 sm:mb-3">
                    <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#64748B] font-medium">Top Districts</span>
                    <span className="text-[9px] sm:text-[10px] text-[#64748B] block mt-0.5 hidden sm:block">Districts with highest monthly updates</span>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 max-h-[200px] sm:max-h-[320px] overflow-y-auto pr-1">
                    {topDistricts.slice(0, 8).map((district, idx) => (
                      <div key={`${district.state}-${district.district}`} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-[#E5E7EB] last:border-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className={`text-[9px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center font-medium ${idx < 3 ? 'bg-[#D97706]/10 text-[#D97706]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{idx + 1}</span>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm text-[#0F172A] truncate max-w-[100px] sm:max-w-none">{district.district}</div>
                            <div className="text-[9px] sm:text-[10px] text-[#64748B] truncate">{district.state}</div>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-[#0F172A] text-right flex-shrink-0">
                          {formatNumber(district.totalUpdates)}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div 
                  className="chart-card bg-white/80 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hidden lg:block"
                  {...cardHoverProps}
                >
                  <div className="mb-2 sm:mb-3">
                    <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#64748B] font-medium">Summary</span>
                  </div>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex items-start gap-2">
                      <ChevronRight size={12} className="text-[#1E3A8A] mt-0.5 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                      <span className="text-[#0F172A]">
                        <strong>{formatNumber(summaryStats.totalUpdates)}</strong> updates processed
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight size={12} className="text-[#1E3A8A] mt-0.5 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                      <span className="text-[#0F172A]">
                        Adults (18+): <strong>{totalAll > 0 ? Math.round((ageData[2].value / totalAll) * 100) : 0}%</strong> of updates
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight size={12} className="text-[#D97706] mt-0.5 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                      <span className="text-[#0F172A]">
                        <strong>{summaryStats.highActivityCount}</strong> above-normal districts
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-6 sm:mt-8 mb-4 sm:mb-6 mx-3 sm:mx-6">
        <div className="max-w-[1800px] mx-auto bg-white/60 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/50 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-center sm:text-left">
              <p className="text-[#0F172A] font-bold text-xs sm:text-sm">Made by Pranshu</p>
              <p className="text-[#0F172A] font-bold text-xs sm:text-sm">Looking for collaborators for UIDAI hackathon</p>
            </div>
            <button
              onClick={() => window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://pranshukumar.vercel.app/?utm_source=ig&utm_medium=social&utm_content=link_in_bio" } }, "*")}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-300 text-[#0F172A] text-xs sm:text-sm font-semibold border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
            >
              Visit Website
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
