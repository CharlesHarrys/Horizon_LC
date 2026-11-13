import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { accountingApi } from '../api/accounting';
import { reportingApi } from '../api/reporting';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';

export const GeneralLedgerViewer = () => {
  const { activeCompany, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('ledger'); // ledger, trial_balance
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Datos
  const [ledgerData, setLedgerData] = useState(null);
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Drill-down Modal
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [entryDetail, setEntryDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Cargar cuentas
  const loadAccounts = async () => {
    if (!activeCompany?.id) return;
    try {
      const res = await accountingApi.getAccountsByCompany(activeCompany.id, { is_postable: true, limit: 300 });
      const list = res.items || [];
      setAccounts(list);
      if (list.length > 0 && !selectedAccountId) {
        setSelectedAccountId(list[0].id);
      }
    } catch (err) {
      showToast('Error cargando cuentas: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [activeCompany?.id]);

  // Cargar datos según tab activo
  const loadReportData = async () => {
    if (!activeCompany?.id) return;
    try {
      setLoading(true);
      if (activeTab === 'ledger') {
        if (!selectedAccountId) return;
        const res = await reportingApi.getAccountLedger(selectedAccountId, {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        setLedgerData(res);
      } else {
        const res = await reportingApi.getTrialBalance(activeCompany.id, {
          fiscal_year: 2026,
          as_of_date: endDate || undefined,
        });
        setTrialBalanceData(res);
      }
    } catch (err) {
      showToast('Error cargando reporte contable: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, selectedAccountId, activeCompany?.id]);

  // Drill-down a partida contable
  const openEntryDetail = async (entryId) => {
    try {
      setSelectedEntryId(entryId);
      setLoadingDetail(true);
      const detail = await accountingApi.getJournalEntryById(entryId);
      setEntryDetail(detail);
    } catch (err) {
      showToast('Error cargando detalle de partida: ' + err.message, 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mayor Auxiliar & Balances Contables</h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspección continua de movimientos con cálculo de saldo progresivo y Balance de Comprobación
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 border border-slate-300/60">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mayor Auxiliar de Cuenta
            </button>
            <button
              onClick={() => setActiveTab('trial_balance')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'trial_balance'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Balance de Comprobación
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={loadReportData} loading={loading} icon={RefreshCw}>
            Filtrar
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MAYOR AUXILIAR DE CUENTA */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Barra de Filtros */}
          <Card bodyClassName="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cuenta Contable</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({a.nature})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Resumen de Cabecera de Cuenta */}
          {ledgerData && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Inicial</span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                  {formatCurrency(ledgerData.initial_balance)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Debe (Cargos)</span>
                <div className="text-lg font-bold text-emerald-600 font-mono mt-1">
                  +{formatCurrency(ledgerData.total_debit)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Haber (Abonos)</span>
                <div className="text-lg font-bold text-rose-600 font-mono mt-1">
                  -{formatCurrency(ledgerData.total_credit)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm bg-gradient-to-tr from-brand-50 to-white">
                <span className="text-[10px] uppercase font-bold text-brand-600">Saldo Final Progresivo</span>
                <div className="text-lg font-bold text-brand-700 font-mono mt-1">
                  {formatCurrency(ledgerData.final_balance)}
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Movimientos Continuos */}
          <Card title="Movimientos Cronológicos del Mayor" subtitle="Cálculo de partida continua con drill-down a partida">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">No. Partida</th>
                    <th className="py-2.5 px-3">Concepto / Glosa</th>
                    <th className="py-2.5 px-3">Tercero / CC</th>
                    <th className="py-2.5 px-3 text-right">Debe</th>
                    <th className="py-2.5 px-3 text-right">Haber</th>
                    <th className="py-2.5 px-3 text-right font-bold">Saldo Progresivo</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ledgerData?.movements?.length > 0 ? (
                    ledgerData.movements.map((mov, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600 font-sans">{formatDate(mov.entry_date)}</td>
                        <td className="py-2.5 px-3 font-semibold text-brand-700">{mov.entry_number}</td>
                        <td className="py-2.5 px-3 text-slate-800 font-sans max-w-xs truncate">{mov.concept}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans">{mov.third_party_name || mov.cost_center_id || '---'}</td>
                        <td className="py-2.5 px-3 text-right text-slate-900">
                          {mov.debit > 0 ? formatCurrency(mov.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900">
                          {mov.credit > 0 ? formatCurrency(mov.credit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-brand-600">
                          {formatCurrency(mov.progressive_balance)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => openEntryDetail(mov.entry_id)}
                            className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                            title="Ver partida contable"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-400 font-sans">
                        Sin movimientos contables para la cuenta en el rango seleccionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BALANCE DE COMPROBACIÓN */}
      {/* ========================================================================= */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-6">
          {/* Banner de Cuadre */}
          {trialBalanceData && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                trialBalanceData.is_balanced
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6 text-emerald-600" />
                <div>
                  <div className="font-bold text-sm">
                    {trialBalanceData.is_balanced
                      ? 'Balance de Comprobación Cuadrado (Partida Doble 100%)'
                      : '¡Alerta de Descuadre Contable!'}
                  </div>
                  <div className="text-xs opacity-80">
                    Total Período Debe: {formatCurrency(trialBalanceData.total_period_debit)} | Total Período Haber:{' '}
                    {formatCurrency(trialBalanceData.total_period_credit)}
                  </div>
                </div>
              </div>
              <Badge variant={trialBalanceData.is_balanced ? 'success' : 'error'} size="lg">
                Diferencia: {formatCurrency(trialBalanceData.discrepancy)}
              </Badge>
            </div>
          )}

          {/* Tabla de Sumas y Saldos */}
          <Card title="Balance de Comprobación de Sumas y Saldos" subtitle="Catálogo consolidado">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Cuenta Contable</th>
                    <th className="py-2.5 px-3 text-center">Tipo</th>
                    <th className="py-2.5 px-3 text-right">Mov. Debe</th>
                    <th className="py-2.5 px-3 text-right">Mov. Haber</th>
                    <th className="py-2.5 px-3 text-right">Saldo Deudor</th>
                    <th className="py-2.5 px-3 text-right">Saldo Acreedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {trialBalanceData?.accounts?.map((acc) => (
                    <tr
                      key={acc.account_id}
                      className={acc.is_postable ? 'hover:bg-slate-50' : 'bg-slate-50/50 font-bold text-slate-900'}
                    >
                      <td className="py-2 px-3">{acc.account_code}</td>
                      <td className="py-2 px-3 font-sans">{acc.account_name}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge size="sm">{acc.nature}</Badge>
                      </td>
                      <td className="py-2 px-3 text-right">{acc.period_debit > 0 ? formatCurrency(acc.period_debit) : '-'}</td>
                      <td className="py-2 px-3 text-right">{acc.period_credit > 0 ? formatCurrency(acc.period_credit) : '-'}</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                        {acc.final_debit > 0 ? formatCurrency(acc.final_debit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-brand-700 font-semibold">
                        {acc.final_credit > 0 ? formatCurrency(acc.final_credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Drill-Down de Partida de Diario */}
      <Modal
        isOpen={!!selectedEntryId}
        onClose={() => setSelectedEntryId(null)}
        title={`Partida de Diario: ${entryDetail?.entry_number || 'Cargando...'}`}
        subtitle={entryDetail?.concept}
        maxWidth="max-w-3xl"
      >
        {loadingDetail ? (
          <div className="text-center py-12 text-slate-400">Cargando partida contable...</div>
        ) : entryDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400">Fecha Asiento:</span>
                <div className="font-semibold">{formatDate(entryDetail.entry_date)}</div>
              </div>
              <div>
                <span className="text-slate-400">Estado:</span>
                <div>
                  <Badge variant="success">{entryDetail.status}</Badge>
                </div>
              </div>
              <div>
                <span className="text-slate-400">Trazabilidad Thread ID:</span>
                <div className="font-mono text-[10px] truncate">{entryDetail.thread_id}</div>
              </div>
            </div>

            {/* Renglones Contables */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Cuenta</th>
                    <th className="py-2 px-3">Descripción Renglón</th>
                    <th className="py-2 px-3 text-right">Debe</th>
                    <th className="py-2 px-3 text-right">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {entryDetail.lines?.map((line) => (
                    <tr key={line.id}>
                      <td className="py-2 px-3 font-sans">
                        <div className="font-semibold text-slate-900">{line.account_code}</div>
                        <div className="text-[11px] text-slate-500">{line.account_name}</div>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-700">{line.description || '---'}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan="2" className="py-2.5 px-3 text-slate-900 text-right font-sans">
                      Sumas Iguales:
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600">{formatCurrency(entryDetail.total_debit)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600">{formatCurrency(entryDetail.total_credit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
