import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'brand' }) => {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.brand}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {(subtext || trend) && (
          <div className="mt-1.5 flex items-center text-xs text-slate-500 gap-1.5">
            {trend && (
              <span className={`font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
            <span>{subtext}</span>
          </div>
        )}
      </div>
    </div>
  );
};
