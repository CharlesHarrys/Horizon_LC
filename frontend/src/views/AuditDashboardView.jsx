import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, RotateCcw, Lock, Unlock, FileCheck, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dashboardsApi } from '../api/dashboards';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatNumber } from '../utils/formatters';

export const AuditDashboardView = () => {
  const { activeCompany, showToast } = useApp();
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAudit = async () => {
    if (!activeCompany?.id) return;
    try {
      setLoading(true);
      const res = await dashboardsApi.getAuditDashboard(activeCompany.id);
      setAuditData(res);
    } catch (err) {
      showToast('Error cargando auditoría: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [activeCompany?.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Auditoría Forense & Semáforo de Integridad</h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión continua de consistencia contable, política de cero borrado físico y partidas reversadas
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadAudit} loading={loading} icon={RefreshCw}>
          Actualizar Auditoría
        </Button>
      </div>

      {/* Semáforo de Integridad */}
      <div
        className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${
          auditData?.is_double_entry_consistent
            ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-300'
            : 'bg-gradient-to-r from-rose-500/10 to-red-500/5 border-rose-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
              auditData?.is_double_entry_consistent ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-600 shadow-rose-500/30'
            } shadow-lg`}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">
              {auditData?.is_double_entry_consistent
                ? 'Semáforo Verde: Integridad Contable del 100%'
                : 'Semáforo Rojo: Discrepancia en Partida Doble'}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Todos los asientos contables asientan estrictamente \(\sum \text{Debe} == \sum \text{Haber}\) sin alteración de datos
            </div>
          </div>
        </div>
        <Badge variant={auditData?.is_double_entry_consistent ? 'success' : 'error'} size="lg">
          {auditData?.is_double_entry_consistent ? 'INTEGRIDAD CERTIFICADA' : 'REVISIÓN REQUERIDA'}
        </Badge>
      </div>

      {/* Métricas Forenses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Asientos Asentados"
          value={formatNumber(auditData?.posted_entries_count || 0, 0)}
          subtext="Partidas en firme POSTED"
          icon={FileCheck}
          color="brand"
        />
        <StatCard
          title="Transacciones Reversadas"
          value={formatNumber(auditData?.reversed_entries_count || 0, 0)}
          subtext="Cero borrado físico"
          icon={RotateCcw}
          color="purple"
        />
        <StatCard
          title="Tasa de Reversión"
          value={`${formatNumber(auditData?.reversal_rate_percentage || 0, 1)}%`}
          subtext="Límite aceptable: < 5%"
          icon={AlertOctagon}
          color="amber"
        />
        <StatCard
          title="Períodos Bloqueados (Soft Close)"
          value={formatNumber(auditData?.locked_fiscal_periods_count || 0, 0)}
          subtext={`Abiertos: ${auditData?.open_fiscal_periods_count || 0}`}
          icon={Lock}
          color="emerald"
        />
      </div>

      {/* Alertas Forenses */}
      <Card title="Registro de Alertas Forenses & Auditoría" subtitle="Eventos detectados por el motor de reglas">
        {auditData?.forensic_alerts?.length > 0 ? (
          <div className="space-y-3">
            {auditData.forensic_alerts.map((al, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-900">{al.type}</span>
                <span className="text-rose-700">{al.detail}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            No se registran anomalías forenses ni violaciones a las reglas fiscales SAR.
          </div>
        )}
      </Card>
    </div>
  );
};
