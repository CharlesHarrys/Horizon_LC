import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ReceiptText,
  Boxes,
  Store,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar = () => {
  const { currentView, setCurrentView, activeCompany } = useApp();

  const navItems = [
    {
      id: 'dashboards',
      label: 'Dashboards Ejecutivos',
      icon: LayoutDashboard,
      badge: 'Real-time',
    },
    {
      id: 'accounting',
      label: 'Contabilidad Transaccional',
      icon: BookOpen,
    },
    {
      id: 'procurement',
      label: 'Compras SAR & OCR',
      icon: ReceiptText,
      badge: 'Paste OCR',
    },
    {
      id: 'inventory',
      label: 'Inventarios & Kardex CPP',
      icon: Boxes,
    },
    {
      id: 'pos',
      label: 'Fast POS & Facturación CAI',
      icon: Store,
      badge: 'SAR CAI',
    },
    {
      id: 'ledger',
      label: 'Ledgers & Balances',
      icon: FileSpreadsheet,
    },
    {
      id: 'audit',
      label: 'Auditoría Forense',
      icon: ShieldCheck,
      badge: '100% Cuadre',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
          ERP
        </div>
        <div>
          <div className="font-bold text-white tracking-tight leading-tight text-sm">Enterprise ERP</div>
          <div className="text-[10px] text-slate-400 font-mono">SAR Honduras Edition</div>
        </div>
      </div>

      {/* Active Company Banner */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-850/40">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-brand-400" />
          <span className="truncate font-medium text-slate-200">
            {activeCompany?.trade_name || activeCompany?.legal_name || 'Sin empresa activa'}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
          RTN: {activeCompany?.tax_id || '---'}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Módulos Principales
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-brand-700 text-brand-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Footer Status */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between bg-slate-950/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Core Engine 2.0</span>
        </div>
        <span className="font-mono text-slate-400">PostgreSQL</span>
      </div>
    </aside>
  );
};
