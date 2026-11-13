import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-brand-50 border-brand-200 text-brand-900',
      icon: Info,
      iconColor: 'text-brand-600',
    },
  };

  const config = typeConfig[toast.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${config.bg}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
