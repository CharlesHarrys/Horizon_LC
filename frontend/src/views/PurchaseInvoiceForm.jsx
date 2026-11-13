import React, { useState, useEffect, useRef } from 'react';
import {
  ReceiptText,
  UploadCloud,
  FileImage,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Calculator,
  Save,
  Send,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { procurementApi } from '../api/procurement';
import { accountingApi } from '../api/accounting';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatCurrency, formatSarInvoiceNumber } from '../utils/formatters';

export const PurchaseInvoiceForm = () => {
  const { activeCompany, showToast } = useApp();
  const [suppliers, setSuppliers] = useState([]);
  const [caiRanges, setCaiRanges] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estado del Archivo / OCR
  const [pastedImage, setPastedImage] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const dropZoneRef = useRef(null);

  // Formulario
  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_tax_id: '',
    supplier_legal_name: '',
    invoice_number: '',
    cai: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    cai_deadline: '2026-12-31',
    apply_retention_1_percent: true,
    lines: [
      {
        line_type: 'EXPENSE',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_type: 'TAX_15',
        account_id: '',
      },
    ],
  });

  // Cargar catálogos
  const loadInitialData = async () => {
    if (!activeCompany?.id) return;
    try {
      setLoading(true);
      const [supRes, caiRes, accRes] = await Promise.all([
        procurementApi.getSuppliers(activeCompany.id, { limit: 100 }),
        procurementApi.getCaiRanges(activeCompany.id),
        accountingApi.getAccountsByCompany(activeCompany.id, { is_postable: true, limit: 200 }),
      ]);
      setSuppliers(supRes.items || []);
      setCaiRanges(caiRes || []);
      setAccounts(accRes.items || []);
    } catch (err) {
      showToast('Error cargando catálogos: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [activeCompany?.id]);

  // Manejador Global de Paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            await processPastedImage(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeCompany?.id]);

  const processPastedImage = async (file) => {
    if (!activeCompany?.id) return;
    try {
      setOcrProcessing(true);
      setPastedImage(URL.createObjectURL(file));

      const uploadData = new FormData();
      uploadData.append('company_id', activeCompany.id);
      uploadData.append('file', file);
      uploadData.append('description', 'Captura fiscal pegada desde portapapeles (Ctrl+V)');

      const result = await procurementApi.processFiscalScreenshot(uploadData);
      setOcrData(result);

      if (result.extracted_data) {
        const ext = result.extracted_data;
        setFormData((prev) => ({
          ...prev,
          invoice_number: ext.invoice_number || prev.invoice_number,
          cai: ext.cai || prev.cai,
          supplier_tax_id: ext.supplier_tax_id || prev.supplier_tax_id,
          supplier_legal_name: ext.supplier_name || prev.supplier_legal_name,
        }));
      }

      showToast('Captura procesada con WebP, hash SHA-256 e inferencia OCR extraída', 'success');
    } catch (err) {
      showToast('Error procesando imagen OCR: ' + err.message, 'error');
    } finally {
      setOcrProcessing(false);
    }
  };

  // Cálculos Fiscales en Vivo
  const calculateTotals = () => {
    let subtotal_exempt = 0;
    let subtotal_15 = 0;
    let subtotal_18 = 0;
    let isv_15 = 0;
    let isv_18 = 0;

    formData.lines.forEach((line) => {
      const net = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
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

    const total_taxable = subtotal_15 + subtotal_18;
    const total_amount = subtotal_exempt + total_taxable + isv_15 + isv_18;
    const isv_retention_1_percent = formData.apply_retention_1_percent ? total_taxable * 0.01 : 0;
    const net_payable = total_amount - isv_retention_1_percent;

    return {
      subtotal_exempt,
      subtotal_15,
      subtotal_18,
      isv_15,
      isv_18,
      total_amount,
      isv_retention_1_percent,
      net_payable,
    };
  };

  const totals = calculateTotals();

  // Agregar / Eliminar Línea
  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          line_type: 'EXPENSE',
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_type: 'TAX_15',
          account_id: accounts[0]?.id || '',
        },
      ],
    }));
  };

  const removeLine = (index) => {
    if (formData.lines.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const updateLine = (index, field, value) => {
    setFormData((prev) => {
      const newLines = [...prev.lines];
      newLines[index] = { ...newLines[index], [field]: value };
      return { ...prev, lines: newLines };
    });
  };

  const handleSupplierChange = (e) => {
    const sId = e.target.value;
    const sup = suppliers.find((s) => s.id === sId);
    setFormData((prev) => ({
      ...prev,
      supplier_id: sId,
      supplier_tax_id: sup ? sup.tax_id : '',
      supplier_legal_name: sup ? sup.legal_name : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      showToast('Por favor seleccione un proveedor.', 'error');
      return;
    }
    if (!formData.invoice_number) {
      showToast('Por favor ingrese el número formal de factura (000-000-00-00000000).', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        company_id: activeCompany.id,
        supplier_id: formData.supplier_id,
        invoice_number: formData.invoice_number,
        cai: formData.cai || 'E1B45F-98A76B-014E80-99EAA2-56D8F1-44',
        supplier_tax_id: formData.supplier_tax_id,
        supplier_legal_name: formData.supplier_legal_name,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        cai_deadline: formData.cai_deadline,
        apply_retention_1_percent: formData.apply_retention_1_percent,
        lines: formData.lines.map((l) => ({
          line_type: l.line_type,
          description: l.description || 'Gasto Operativo',
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          tax_type: l.tax_type,
          account_id: l.account_id || accounts[0]?.id,
        })),
      };

      const created = await procurementApi.createInvoice(payload);
      showToast(`Factura de compra ${created.invoice_number} registrada exitosamente`, 'success');

      // Reset form
      setFormData({
        supplier_id: '',
        supplier_tax_id: '',
        supplier_legal_name: '',
        invoice_number: '',
        cai: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        cai_deadline: '2026-12-31',
        apply_retention_1_percent: true,
        lines: [
          {
            line_type: 'EXPENSE',
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_type: 'TAX_15',
            account_id: '',
          },
        ],
      });
      setPastedImage(null);
      setOcrData(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recepción y Facturación Fiscal SAR</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro de compras con soporte Paste & OCR (Ctrl + V), cálculo de retención 1% ISV y posteo contable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" size="md">
            Módulo SAR Compras v2.0
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo / Central: Datos del Documento y Líneas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Cabecera Fiscal */}
          <Card title="Cabecera del Documento Fiscal SAR" subtitle="Valide CAI, RTN de 14 dígitos y correlativo de 16 dígitos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proveedor *</label>
                <select
                  value={formData.supplier_id}
                  onChange={handleSupplierChange}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">-- Seleccione Proveedor --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.legal_name} ({s.tax_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Factura SAR (16 dígitos) *</label>
                <input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: formatSarInvoiceNumber(e.target.value) })}
                  placeholder="001-001-01-00000001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-medium focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Autorización CAI *</label>
                <input
                  type="text"
                  required
                  value={formData.cai}
                  onChange={(e) => setFormData({ ...formData, cai: e.target.value })}
                  placeholder="E1B45F-98A76B-014E80-99EAA2-56D8F1-44"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Emisión *</label>
                <input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
          </Card>

          {/* Renglones Heterogéneos */}
          <Card
            title="Líneas Heterogéneas de Compra"
            subtitle="Admite inventario, activos fijos o imputación a cuentas de gasto directas"
            actions={
              <Button size="sm" variant="secondary" onClick={addLine} icon={Plus}>
                Agregar Renglón
              </Button>
            }
          >
            <div className="space-y-3">
              {formData.lines.map((line, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* Tipo de Línea */}
                    <div className="col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tipo Imputación</label>
                      <select
                        value={line.line_type}
                        onChange={(e) => updateLine(idx, 'line_type', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                      >
                        <option value="EXPENSE">Gasto Directo</option>
                        <option value="INVENTORY">Inventario</option>
                        <option value="FIXED_ASSET">Activo Fijo</option>
                      </select>
                    </div>

                    {/* Descripción */}
                    <div className="col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Descripción</label>
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                        placeholder="Concepto del bien o servicio"
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                      />
                    </div>

                    {/* Impuesto */}
                    <div className="col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tasa ISV</label>
                      <select
                        value={line.tax_type}
                        onChange={(e) => updateLine(idx, 'tax_type', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold"
                      >
                        <option value="TAX_15">Gravado 15%</option>
                        <option value="TAX_18">Gravado 18%</option>
                        <option value="EXEMPT">Exento</option>
                      </select>
                    </div>

                    {/* Botón Eliminar */}
                    <div className="col-span-1 text-right pt-4">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center pt-2 border-t border-slate-200/60">
                    <div className="col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cantidad</label>
                      <input
                        type="number"
                        min="0.0001"
                        step="any"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Precio Unitario (HNL)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-6">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cuenta Contable</label>
                      <select
                        value={line.account_id}
                        onChange={(e) => updateLine(idx, 'account_id', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Panel Derecho: Paste & OCR y Resumen de Totales */}
        <div className="space-y-6">
          {/* Zona de Paste & OCR */}
          <Card title="Evidencia Digital & Paste OCR" subtitle="Presione Ctrl + V en cualquier lugar para pegar captura">
            <div
              ref={dropZoneRef}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-6 text-center bg-slate-50/60 transition-colors flex flex-col items-center justify-center min-h-[160px]"
            >
              {ocrProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent" />
                  <span className="text-xs font-medium text-slate-600">Comprimiendo WebP y analizando OCR...</span>
                </div>
              ) : pastedImage ? (
                <div className="space-y-3 w-full">
                  <img src={pastedImage} alt="Evidencia" className="max-h-36 mx-auto rounded-lg shadow-sm border border-slate-200" />
                  <div className="text-[10px] font-mono text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Hash SHA-256 inmutable generado
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">Pegar captura (Ctrl + V)</div>
                  <p className="text-[10px] text-slate-400">Capturas de facturas SAR, recibos o guías de remisión</p>
                </div>
              )}
            </div>
          </Card>

          {/* Resumen de Liquidación Fiscal */}
          <Card title="Liquidación Fiscal SAR" subtitle="Cálculo automático de retenciones y total a pagar">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Subtotal Exento:</span>
                <span className="font-mono font-medium">{formatCurrency(totals.subtotal_exempt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gravado 15%:</span>
                <span className="font-mono font-medium">{formatCurrency(totals.subtotal_15)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Impuesto ISV 15%:</span>
                <span className="font-mono font-medium">{formatCurrency(totals.isv_15)}</span>
              </div>
              {totals.subtotal_18 > 0 && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Gravado 18%:</span>
                    <span className="font-mono font-medium">{formatCurrency(totals.subtotal_18)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Impuesto ISV 18%:</span>
                    <span className="font-mono font-medium">{formatCurrency(totals.isv_18)}</span>
                  </div>
                </>
              )}

              {/* Checkbox Retención 1% ISV SAR */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.apply_retention_1_percent}
                    onChange={(e) => setFormData({ ...formData, apply_retention_1_percent: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Aplicar Retención 1% ISV (SAR)</span>
                </label>
              </div>

              {formData.apply_retention_1_percent && (
                <div className="flex justify-between py-1 text-rose-600 font-semibold border-b border-slate-100">
                  <span>Retención 1% ISV:</span>
                  <span className="font-mono">-{formatCurrency(totals.isv_retention_1_percent)}</span>
                </div>
              )}

              <div className="flex justify-between pt-3 text-sm font-bold text-slate-900 border-t-2 border-slate-200">
                <span>Total Neto a Pagar:</span>
                <span className="font-mono text-brand-600">{formatCurrency(totals.net_payable)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button type="submit" variant="primary" loading={submitting} icon={Save} className="w-full">
                Guardar Factura de Compra
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};
