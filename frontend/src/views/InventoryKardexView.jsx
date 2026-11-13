import React, { useState, useEffect } from 'react';
import { Boxes, Search, ArrowDownLeft, ArrowUpRight, Repeat, ShieldCheck, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { inventoryApi } from '../api/inventory';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

export const InventoryKardexView = () => {
  const { activeCompany, showToast } = useApp();
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [kardexData, setKardexData] = useState(null);
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadInitial = async () => {
    if (!activeCompany?.id) return;
    try {
      setLoading(true);
      const [itmRes, slRes] = await Promise.all([
        inventoryApi.getItems(activeCompany.id, { limit: 100 }),
        inventoryApi.getStockLevels(activeCompany.id),
      ]);
      const itemList = itmRes.items || [];
      setItems(itemList);
      setStockLevels(slRes || []);
      if (itemList.length > 0 && !selectedItemId) {
        setSelectedItemId(itemList[0].id);
      }
    } catch (err) {
      showToast('Error cargando inventario: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, [activeCompany?.id]);

  const loadKardex = async () => {
    if (!selectedItemId) return;
    try {
      setLoading(true);
      const res = await inventoryApi.getKardexByItem(selectedItemId);
      setKardexData(res);
    } catch (err) {
      showToast('Error cargando Kardex: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItemId) loadKardex();
  }, [selectedItemId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kardex Valuado Continuo (CPP) & Multi-Bodega</h1>
          <p className="text-xs text-slate-500 mt-1">
            Libro auxiliar de movimientos físicos y monetarios al Costo Promedio Ponderado
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadKardex} loading={loading} icon={RefreshCw}>
          Actualizar Kardex
        </Button>
      </div>

      {/* Selector de Artículo */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Seleccionar Artículo / SKU</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.sku} - {i.name} ({i.unit_of_measure})
                </option>
              ))}
            </select>
          </div>
          {kardexData && (
            <div className="flex items-center gap-4 pt-4 sm:pt-0">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex-1">
                <span className="text-slate-400 block text-[10px]">Stock Físico Consolidado:</span>
                <span className="font-bold font-mono text-base text-slate-900">
                  {formatNumber(kardexData.current_stock, 2)} {kardexData.unit_of_measure}
                </span>
              </div>
              <div className="bg-brand-50 p-3 rounded-lg border border-brand-100 text-xs flex-1">
                <span className="text-brand-600 block text-[10px]">CPP Actual Vigente:</span>
                <span className="font-bold font-mono text-base text-brand-700">
                  {formatCurrency(kardexData.average_unit_cost)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tabla de Movimientos de Kardex */}
      <Card title="Movimientos Físicos y Monetarios" subtitle="Cálculo continuo del CPP por transacción">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Bodega</th>
                <th className="py-2.5 px-3 text-right">Cant. Entrada</th>
                <th className="py-2.5 px-3 text-right">Costo Entrada</th>
                <th className="py-2.5 px-3 text-right">Cant. Salida</th>
                <th className="py-2.5 px-3 text-right">Costo Salida</th>
                <th className="py-2.5 px-3 text-right font-bold">Saldo Stock</th>
                <th className="py-2.5 px-3 text-right font-bold text-brand-700">CPP Resultante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {kardexData?.movements?.length > 0 ? (
                kardexData.movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans">{formatDate(mov.movement_date)}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <Badge
                        size="sm"
                        variant={
                          mov.movement_type.includes('IN')
                            ? 'success'
                            : mov.movement_type.includes('OUT')
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {mov.movement_type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-sans">{mov.warehouse_name}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                      {mov.quantity_in > 0 ? formatNumber(mov.quantity_in, 2) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">{mov.unit_cost_in > 0 ? formatCurrency(mov.unit_cost_in) : '-'}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                      {mov.quantity_out > 0 ? formatNumber(mov.quantity_out, 2) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">{mov.unit_cost_out > 0 ? formatCurrency(mov.unit_cost_out) : '-'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatNumber(mov.balance_quantity, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-brand-600">
                      {formatCurrency(mov.average_unit_cost)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400 font-sans">
                    Sin movimientos de Kardex registrados para el artículo seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
