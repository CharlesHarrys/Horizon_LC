import React from 'react';
import { Building2, Bell, Shield, Calendar, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header = () => {
  const { companies, activeCompany, switchCompany, reloadCompanies, loading } = useApp();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between flex-shrink-0 z-10">
      {/* Selector de Empresa Activa */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa Activa:</span>
        </div>
        <select
          value={activeCompany?.id || ''}
          onChange={(e) => {
            const found = companies.find((c) => c.id === e.target.value);
            if (found) switchCompany(found);
          }}
          className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg focus:ring-brand-500 focus:border-brand-500 block px-3 py-1.5"
        >
          {companies.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.trade_name || comp.legal_name} ({comp.tax_id})
            </option>
          ))}
        </select>
        <button
          onClick={reloadCompanies}
          title="Recargar empresas"
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Badges de Estado Fiscal & Auditoría */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Partida Doble Balanceada</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Período: {new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}</span>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200 shadow-sm">
          ADM
        </div>
      </div>
    </header>
  );
};
