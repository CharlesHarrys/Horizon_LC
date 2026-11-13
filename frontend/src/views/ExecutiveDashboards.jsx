import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Activity,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  ShieldCheck,
  PackageCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dashboardsApi } from '../api/dashboards';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const ExecutiveDashboards = () => {
  const { activeCompany, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('financial');
  const [financialData, setFinancialData] = useState(null);
  const [operationalData, setOperationalData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!activeCompany?.id) return;
    try {
      setLoading(true);
      const [finRes, opRes] = await Promise.all([
        dashboardsApi.getFinancialDashboard(activeCompany.id),
        dashboardsApi.getOperationalDashboard(activeCompany.id),
      ]);
      setFinancialData(finRes);
      setOperationalData(opRes);
    } catch (err) {
      showToast('Error cargando métricas de dashboard: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany?.id]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel Ejecutivo & Dashboards</h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas financieras, operativas y de rotación en tiempo real para {activeCompany?.trade_name || activeCompany?.legal_name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de Tabs */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 border border-slate-300/60">
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'financial'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard Financiero
            </button>
            <button
              onClick={() => setActiveTab('operational')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'operational'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard Operativo & Stock
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            loading={loading}
            icon={RefreshCw}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD FINANCIERO */}
      {/* ========================================================================= */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* StatCards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Ingresos YTD (Ventas)"
              value={formatCurrency(financialData?.ytd_revenue)}
              subtext="Acumulado año en curso"
              icon={DollarSign}
              color="brand"
              trend={12.4}
            />
            <StatCard
              title="Margen Bruto Real"
              value={`${formatNumber(financialData?.gross_margin_percentage || 0, 1)}%`}
              subtext={`Utilidad Bruta: ${formatCurrency(financialData?.ytd_gross_profit)}`}
              icon={TrendingUp}
              color="emerald"
            />
            <StatCard
              title="Gastos Operativos (OPEX)"
              value={formatCurrency(financialData?.ytd_operating_expenses)}
              subtext="Gastos de Admón y Ventas"
              icon={PieChart}
              color="purple"
            />
            <StatCard
              title="Razón de Liquidez Corriente"
              value={`${formatNumber(financialData?.current_ratio || 1.0, 2)}x`}
              subtext="Activo Cte / Pasivo Cte"
              icon={Activity}
              color="amber"
            />
          </div>

          {/* Charts & Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Comparativa Mensual (Ingresos vs Costos) */}
            <Card
              title="Comparativa Mensual: Ingresos vs Costos de Venta"
              subtitle="Desempeño operativo en moneda de curso legal (HNL)"
              className="lg:col-span-2"
            >
              <div className="h-64 flex flex-col justify-end space-y-4">
                <div className="grid grid-cols-3 gap-4 h-48 items-end pt-4 border-b border-slate-100">
                  {/* Barra Ingresos */}
                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-xs font-semibold text-brand-700">
                      {formatCurrency(financialData?.ytd_revenue)}
                    </span>
                    <div
                      className="w-full max-w-[60px] bg-brand-500 rounded-t-lg transition-all duration-500"
                      style={{ height: '85%' }}
                    />
                    <span className="text-xs font-medium text-slate-500">Ingresos</span>
                  </div>

                  {/* Barra Costos */}
                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-xs font-semibold text-rose-700">
                      {formatCurrency(financialData?.ytd_cogs)}
                    </span>
                    <div
                      className="w-full max-w-[60px] bg-rose-400 rounded-t-lg transition-all duration-500"
                      style={{ height: '45%' }}
                    />
                    <span className="text-xs font-medium text-slate-500">Costo Ventas</span>
                  </div>

                  {/* Barra Utilidad Neta */}
                  <div className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-xs font-semibold text-emerald-700">
                      {formatCurrency(financialData?.ytd_net_income)}
                    </span>
                    <div
                      className="w-full max-w-[60px] bg-emerald-500 rounded-t-lg transition-all duration-500"
                      style={{ height: '55%' }}
                    />
                    <span className="text-xs font-medium text-slate-500">Utilidad Neta</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-brand-500" /> Ingresos
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-rose-400" /> Costo Mercaderías
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-500" /> Utilidad Operativa
                  </div>
                </div>
              </div>
            </Card>

            {/* Desglose de Gastos OPEX */}
            <Card
              title="Estructura de Gastos (OPEX)"
              subtitle="Distribución por cuenta auxiliar"
            >
              <div className="space-y-4">
                {financialData?.expenses_breakdown?.length > 0 ? (
                  financialData.expenses_breakdown.map((exp, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 truncate">{exp.category_name}</span>
                        <span className="text-slate-900 font-mono">{formatCurrency(exp.amount)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${Math.min(exp.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Sin gastos OPEX registrados en el período
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DASHBOARD OPERATIVO & INVENTARIOS */}
      {/* ========================================================================= */}
      {activeTab === 'operational' && (
        <div className="space-y-6">
          {/* StatCards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Días de Inventario (DSI)"
              value={`${formatNumber(operationalData?.days_sales_of_inventory || 0, 0)} días`}
              subtext="Rotación de existencias"
              icon={Activity}
              color="brand"
            />
            <StatCard
              title="Valorización de Inventario"
              value={formatCurrency(operationalData?.total_inventory_valuation)}
              subtext="Valuación continua al CPP"
              icon={Boxes}
              color="emerald"
            />
            <StatCard
              title="Cuentas por Cobrar (CxC)"
              value={formatCurrency(operationalData?.open_receivables_total)}
              subtext="Cartera pendiente clientes"
              icon={Wallet}
              color="amber"
            />
            <StatCard
              title="SKUs Bajo Punto de Reorden"
              value={operationalData?.low_stock_skus_count || 0}
              subtext="Alertas de abastecimiento"
              icon={AlertTriangle}
              color="rose"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Valorización por Bodega */}
            <Card
              title="Existencias y Valorización por Bodega"
              subtitle="Saldos físicos consolidados"
            >
              <div className="divide-y divide-slate-100">
                {operationalData?.warehouses_valuation?.map((wh) => (
                  <div key={wh.warehouse_id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{wh.warehouse_name}</div>
                      <div className="text-xs text-slate-400 font-mono">Código: {wh.warehouse_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        {formatCurrency(wh.total_valuation_hnl)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatNumber(wh.total_stock_units, 0)} unidades físicas
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Alertas de Reorden */}
            <Card
              title="Alertas de Stock Crítico"
              subtitle="Productos que requieren emisión de orden de compra"
            >
              <div className="divide-y divide-slate-100">
                {operationalData?.low_stock_alerts?.length > 0 ? (
                  operationalData.low_stock_alerts.map((item) => (
                    <div key={item.item_id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-400 font-mono">SKU: {item.sku}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="error" size="sm">
                          Déficit: -{formatNumber(item.deficit, 0)} {item.unit_of_measure}
                        </Badge>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Stock: {formatNumber(item.current_stock, 0)} / Mín: {formatNumber(item.reorder_point, 0)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Todos los productos cuentan con existencias sobre el punto de reorden
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
