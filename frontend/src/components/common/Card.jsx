import React from 'react';

export const Card = ({ title, subtitle, actions, children, className = '', headerClassName = '', bodyClassName = '' }) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
