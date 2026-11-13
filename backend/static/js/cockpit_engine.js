/**
 * Horizon Ledger - Cockpit Engine JS
 * Motor interactivo para el Dashboard Executive FinTech Cockpit
 */

window.QUADRANT_DATA = {
  ingresos: {
    title: "Ingresos & Ventas",
    tag: "BLOQUE 01",
    icon: "⚡",
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    options: [
      { key: "1", title: "Punto de Venta POS & Facturación SAR", desc: "Emisión de facturas fiscales con CAI, arqueo ciego y ticket térmico.", link: "/ventas", badge: "En Línea" },
      { key: "2", title: "Libro Fiscal de Ventas & DET Live", desc: "Registro de facturas exentas, gravadas 15% y 18% para declaración mensual.", link: "/libro-ventas", badge: "SAR OK" },
      { key: "3", title: "Cuentas por Cobrar (CxC) & Cartera", desc: "Antigüedad de saldos de clientes, recibos de caja y límite de crédito.", link: "/cxc", badge: "Auditoría" }
    ]
  },
  egresos: {
    title: "Egresos & Stock",
    tag: "BLOQUE 02",
    icon: "🛒",
    colorClass: "bg-amber-50 text-amber-700 border-amber-200",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    options: [
      { key: "1", title: "Registro de Compras & Proveedores CxP", desc: "Validación de CAI de compra, retención del 1% y fechas de vencimiento.", link: "/compras", badge: "Crédito Fiscal" },
      { key: "2", title: "Inventario Perpetuo & Kardex CPP", desc: "Control de existencias multi-bodega con costeo Promedio Ponderado continuo.", link: "/inventario", badge: "CPP 0.00" },
      { key: "3", title: "Lotes de Dispersión y Pago ACH", desc: "Agrupación de facturas para pago masivo bancario y archivo de transferencia.", link: "/compras#lotes", badge: "Lotes ACH" }
    ]
  },
  tesoreria: {
    title: "Tesorería & Bancos",
    tag: "BLOQUE 03",
    icon: "🏦",
    colorClass: "bg-sky-50 text-sky-700 border-sky-200",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    options: [
      { key: "1", title: "Conciliación Bancaria Predictiva (IA Match)", desc: "Cruce inteligente del 98% entre extracto bancario y libro mayor auxiliar.", link: "/bancos", badge: "98% Match" },
      { key: "2", title: "Conciliación de Adquirencia POS", desc: "Liquidación de lotes de tarjeta Visa/Mastercard (BAC, Ficohsa, Banpaís).", link: "/adquirencia", badge: "Vouchers" },
      { key: "3", title: "Monitor de Extractos & Alertas Mail", desc: "Ingesta directa de transacciones vía correo y estados de cuenta en PDF.", link: "/bancos#alertas", badge: "Sync Auto" }
    ]
  },
  contabilidad: {
    title: "Contabilidad & Cierre",
    tag: "BLOQUE 04",
    icon: "⚖️",
    colorClass: "bg-rose-50 text-rose-700 border-rose-200",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    options: [
      { key: "1", title: "Contabilidad Central & Libro Diario", desc: "Registro de asientos manuales y automáticos con validación estricta de partida doble.", link: "/contabilidad", badge: "Cuadrado" },
      { key: "2", title: "Balance de Comprobación & NIIF", desc: "Estados de Situación Financiera, Balances de Sumas y Saldos a 6 columnas.", link: "/contabilidad#balance", badge: "NIIF PyMES" },
      { key: "3", title: "Generación de Declaración SAR-252 (ISV)", desc: "Mapeo fiscal consolidado listo para exportación al módulo DET de la administración.", link: "/contabilidad#sar252", badge: "SAR Fiscal" }
    ]
  }
};

window.currentOpenModule = null;

window.openQuadrantModal = function(moduleId) {
  const data = window.QUADRANT_DATA[moduleId];
  if (!data) return;
  window.currentOpenModule = moduleId;

  const titleEl = document.getElementById('modal-title');
  const tagEl = document.getElementById('modal-tag');
  const iconEl = document.getElementById('modal-icon-box');
  const listContainer = document.getElementById('modal-options-list');
  const searchInput = document.getElementById('modal-search-input');
  const overlay = document.getElementById('quadrant-modal-overlay');

  if (titleEl) titleEl.textContent = data.title;
  if (tagEl) {
    tagEl.textContent = data.tag;
    tagEl.className = `mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${data.badgeColor}`;
  }
  if (iconEl) {
    iconEl.textContent = data.icon;
    iconEl.className = `w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold border ${data.colorClass}`;
  }

  if (listContainer) {
    listContainer.innerHTML = '';
    data.options.forEach(opt => {
      const item = document.createElement('a');
      item.href = opt.link;
      item.className = 'process-option group block';
      item.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="mono text-xs font-bold text-slate-400 group-hover:text-slate-900 group-hover:border-slate-400 bg-slate-50 border border-slate-200 w-6 h-6 rounded-lg flex items-center justify-center">${opt.key}</span>
          <div>
            <h4 class="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors">${opt.title}</h4>
            <p class="text-[10.5px] text-slate-400 mt-0.5 leading-snug">${opt.desc}</p>
          </div>
        </div>
        <span class="mono text-[9.5px] font-bold px-2 py-0.5 rounded border ${data.badgeColor} shrink-0 ml-3">${opt.badge}</span>
      `;
      listContainer.appendChild(item);
    });
  }

  if (searchInput) searchInput.value = '';
  if (overlay) {
    overlay.classList.add('open');
    setTimeout(() => { if (searchInput) searchInput.focus(); }, 100);
  }
};

window.closeQuadrantModal = function() {
  const overlay = document.getElementById('quadrant-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  window.currentOpenModule = null;
};

window.handleModalBackdropClick = function(e) {
  if (e.target.id === 'quadrant-modal-overlay') window.closeQuadrantModal();
};

window.filterModalOptions = function() {
  const input = document.getElementById('modal-search-input');
  if (!input) return;
  const query = input.value.toLowerCase();
  const options = document.querySelectorAll('#modal-options-list .process-option');
  options.forEach(opt => {
    const text = opt.innerText.toLowerCase();
    opt.style.display = text.includes(query) ? 'flex' : 'none';
  });
};
