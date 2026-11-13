import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  ShoppingCart,
  Trash2,
  CreditCard,
  Banknote,
  Building,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { inventoryApi } from '../api/inventory';
import { salesApi } from '../api/sales';
import { accountingApi } from '../api/accounting';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const FastPosRegister = () => {
  const { activeCompany, showToast } = useApp();
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [caiRanges, setCaiRanges] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carrito de Compras
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de Pago
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CREDIT_CARD, BANK_TRANSFER, CREDIT
  const [cashReceived, setCashReceived] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [lastIssuedInvoice, setLastIssuedInvoice] = useState(null);

  const loadData = async () => {
    if (!activeCompany?.id) return;
    try {
      setLoading(true);
      const [whRes, itmRes, custRes, caiRes, accRes] = await Promise.all([
        inventoryApi.getWarehouses(activeCompany.id),
        inventoryApi.getItems(activeCompany.id, { limit: 100 }),
        salesApi.getCustomers(activeCompany.id, { limit: 100 }),
        salesApi.getCaiRanges(activeCompany.id),
        accountingApi.getAccountsByCompany(activeCompany.id, { is_postable: true, limit: 200 }),
      ]);

      const whList = whRes || [];
      setWarehouses(whList);
      if (whList.length > 0) setSelectedWarehouseId(whList[0].id);

      setItems(itmRes.items || []);
      const custList = custRes.items || [];
      setCustomers(custList);
      if (custList.length > 0) setSelectedCustomerId(custList[0].id);

      setCaiRanges(caiRes || []);
      setAccounts(accRes.items || []);
    } catch (err) {
      showToast('Error inicializando terminal POS: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany?.id]);

  // Filtrar artículos para el catálogo interactivo
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery))
  );

  // Agregar al carrito
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          item,
          quantity: 1,
          unit_price: 150.0, // Precio base por defecto
          tax_type: 'TAX_15',
          discount_percentage: 0,
        },
      ];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  // Cálculos del Carrito
  const calculateCartTotals = () => {
    let subtotal_exempt = 0;
    let subtotal_15 = 0;
    let subtotal_18 = 0;
    let total_discount = 0;
    let isv_15 = 0;
    let isv_18 = 0;

    cart.forEach((line) => {
      const gross = line.quantity * line.unit_price;
      const disc = gross * ((line.discount_percentage || 0) / 100);
      const net = gross - disc;
      total_discount += disc;

      if (line.tax_type === 'TAX_15') {
        subtotal_15 += net;
        isv_15 += net * 0.15;
      } else if (line.tax_type === 'TAX_18') {
        subtotal_18 += net;
        isv_18 += net * 0.18;
      } else {
        subtotal_exempt += net;
      }
    });

    const total = subtotal_exempt + subtotal_15 + subtotal_18 + isv_15 + isv_18;

    return {
      subtotal_exempt,
      subtotal_15,
      subtotal_18,
      total_discount,
      isv_15,
      isv_18,
      total,
    };
  };

  const cartTotals = calculateCartTotals();
  const cashNum = Number(cashReceived) || 0;
  const changeDue = Math.max(0, cashNum - cartTotals.total);

  // Emisión y Posteo de Factura Fiscal
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('El carrito de compras está vacío.', 'error');
      return;
    }
    if (!selectedWarehouseId) {
      showToast('Debe seleccionar una bodega para la descarga de existencias.', 'error');
      return;
    }
    if (!selectedCustomerId) {
      showToast('Debe seleccionar un cliente.', 'error');
      return;
    }

    try {
      setSubmittingInvoice(true);
      const cashAcc = accounts.find((a) => a.code.startsWith('1.1.01')) || accounts[0];
      const arAcc = accounts.find((a) => a.code.startsWith('1.1.02')) || accounts[0];

      const payload = {
        company_id: activeCompany.id,
        warehouse_id: selectedWarehouseId,
        customer_id: selectedCustomerId,
        sale_type: paymentMethod === 'CREDIT' ? 'CREDIT' : 'CASH',
        issue_date: new Date().toISOString().split('T')[0],
        cash_or_bank_account_id: cashAcc?.id,
        ar_account_id: arAcc?.id,
        lines: cart.map((c) => ({
          item_id: c.item.id,
          quantity: c.quantity,
          unit_price: c.unit_price,
          tax_type: c.tax_type,
          discount_percentage: c.discount_percentage,
        })),
      };

      const invoice = await salesApi.createAndIssueInvoice(payload);
      setLastIssuedInvoice(invoice);
      setIsPaymentModalOpen(false);
      setCart([]);
      setCashReceived('');
      showToast(`Factura Fiscal ${invoice.invoice_number} emitida con éxito`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fast POS Mostrador & Facturación Fiscal SAR</h1>
          <p className="text-xs text-slate-500 mt-1">
            Terminal de punto de venta con auto-correlativo CAI, descarga en Kardex al CPP y asiento contable dual
          </p>
        </div>

        {/* Selector de Bodega y Cliente */}
        <div className="flex items-center gap-3">
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                Bodega: {w.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                Cliente: {c.legal_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catálogo de Productos (7 columnas) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por SKU, nombre de artículo o código de barra..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:ring-brand-500 focus:border-brand-500 shadow-sm"
            />
          </div>

          {/* Grid de Artículos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:border-brand-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                    <Badge variant="info" size="sm">
                      {item.unit_of_measure}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mt-1 line-clamp-2">{item.name}</h4>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-bold text-brand-600 font-mono">L 150.00</span>
                  <button className="p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito de Venta y Liquidación (5 columnas) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Ticket de Venta / Carrito"
            subtitle={`${cart.length} productos seleccionados`}
            bodyClassName="p-4"
          >
            {/* Lista de Renglones en Carrito */}
            <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto space-y-2 mb-4">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Haga clic en los artículos de la izquierda para agregarlos al ticket
                </div>
              ) : (
                cart.map((line) => (
                  <div key={line.item.id} className="pt-2 pb-2 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{line.item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatCurrency(line.unit_price)} + ISV 15%
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(line.item.id, -1)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold w-6 text-center">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.item.id, 1)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-xs font-bold font-mono text-slate-900">
                        {formatCurrency(line.quantity * line.unit_price * 1.15)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(line.item.id)}
                      className="text-slate-300 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Totales y Desglose */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-200/60">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Gravado 15%:</span>
                <span className="font-mono">{formatCurrency(cartTotals.subtotal_15)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Impuesto ISV 15%:</span>
                <span className="font-mono">{formatCurrency(cartTotals.isv_15)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total a Cobrar:</span>
                <span className="font-mono text-brand-600">{formatCurrency(cartTotals.total)}</span>
              </div>
            </div>

            {/* Botón de Cobro */}
            <div className="mt-4">
              <Button
                variant="success"
                size="lg"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={cart.length === 0}
                className="w-full text-base font-bold shadow-md shadow-emerald-600/20"
                icon={CreditCard}
              >
                Cobrar Ticket ({formatCurrency(cartTotals.total)})
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Cobro Multimétodo */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Liquidación y Emisión de Factura Fiscal SAR"
        subtitle={`Total a Pagar: ${formatCurrency(cartTotals.total)}`}
      >
        <div className="space-y-6">
          {/* Selector de Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'CASH', label: 'Efectivo', icon: Banknote },
                { id: 'CREDIT_CARD', label: 'Tarjeta', icon: CreditCard },
                { id: 'BANK_TRANSFER', label: 'Transferencia ACH', icon: Building },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Si es Efectivo: Campo de Efectivo Recibido y Cambio */}
          {paymentMethod === 'CASH' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Efectivo Recibido (HNL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Monto entregado por el cliente"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-semibold pt-2 border-t border-slate-200">
                <span className="text-slate-500">Cambio a Devolver:</span>
                <span className="text-base font-bold text-emerald-600 font-mono">{formatCurrency(changeDue)}</span>
              </div>
            </div>
          )}

          {/* Información del Rango CAI Asignado */}
          <div className="p-3 bg-brand-50/60 rounded-lg border border-brand-100 text-[11px] text-brand-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Correlativo SAR asignado automáticamente en secuencia</span>
            </div>
            <div className="font-mono text-[10px] text-brand-700">
              CAI: {caiRanges[0]?.cai || '7B8C9D-0A1B2C-3D4E5F-6A7B8C-9D0E1F-22'}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={handleCheckout}
              loading={submittingInvoice}
              icon={CheckCircle2}
            >
              Confirmar y Emitir Factura
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
