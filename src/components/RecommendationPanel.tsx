'use client';

import { motion } from 'framer-motion';
import { Recommendation } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

interface RecommendationPanelProps {
  recommendations: Recommendation[];
}

export function RecommendationPanel({ recommendations }: RecommendationPanelProps) {
  if (recommendations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white border border-slate-200 rounded-xl p-6"
      >
        <h3 className="text-base font-medium text-slate-800 mb-2">What To Do Next</h3>
        <p className="text-sm text-slate-500">
          No unusual activity detected. All districts are within normal update ranges.
        </p>
      </motion.div>
    );
  }

  const highPriority = recommendations.filter(r => r.severity === 'high').slice(0, 2);
  const others = recommendations.filter(r => r.severity !== 'high').slice(0, 2);
  const displayRecs = [...highPriority, ...others].slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white border border-slate-200 rounded-xl p-6"
    >
      <h3 className="text-base font-medium text-slate-800 mb-2">What To Do Next</h3>
      <p className="text-xs text-slate-500 mb-5">Suggested actions based on update volume this month</p>
      
      <div className="space-y-4">
        {displayRecs.map((rec, idx) => (
          <RecommendationItem key={idx} recommendation={rec} index={idx} isHighPriority={idx < highPriority.length} />
        ))}
      </div>
    </motion.div>
  );
}

interface RecommendationItemProps {
  recommendation: Recommendation;
  index: number;
  isHighPriority: boolean;
}

function RecommendationItem({ recommendation, index, isHighPriority }: RecommendationItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 * index }}
      className={`rounded-lg border p-4 ${
        isHighPriority 
          ? 'border-amber-200 bg-amber-50' 
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-sm font-medium ${isHighPriority ? 'text-amber-800' : 'text-slate-800'}`}>
          {recommendation.location}
        </span>
        {isHighPriority && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">High volume</span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-slate-500 mb-1">What's happening</h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            {recommendation.reasons[0]}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-medium text-slate-500 mb-1">What can help</h4>
          <ul className="space-y-1.5">
            {recommendation.actions.slice(0, 2).map((action, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                <ChevronRight size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
