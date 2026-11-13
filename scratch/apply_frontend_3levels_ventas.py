import os
import re

def update_workspace_ventas():
    path = "workspace_ventas.html"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    modal_customer_html = """  <!-- MODAL 2: ALTA RÁPIDA DE CLIENTE (FICHA 3 NIVELES) -->
  <div id="modal-quick-customer" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 hidden">
    <div class="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
      
      <div class="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900">Ficha Maestra de Cliente Comercial</h3>
            <p class="text-[10px] text-slate-500 font-medium font-mono">Despliegue Progresivo en 3 Niveles con Pre-Imputación de Ingresos</p>
          </div>
        </div>
        <button onclick="closeModal('modal-quick-customer')" class="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form id="form-quick-customer" onsubmit="saveQuickCustomer(event)" class="p-4 space-y-3 text-xs overflow-y-auto custom-scrollbar flex-1">
        <!-- NIVEL 1: ESENCIAL Y CONTABLE -->
        <div class="space-y-2 border border-slate-200 rounded-2xl p-3 bg-white">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono flex items-center justify-center font-bold">1</span>
              <span>Nivel 1: Identificación Fiscal, Segmento y Pre-Imputación</span>
            </span>
            <span class="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Obligatorio</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="flex justify-between items-center mb-0.5">
                <label class="text-[10px] text-slate-500 font-bold block uppercase">RTN o DNI:</label>
                <span id="ventas-rtn-badge" class="text-[9px] font-mono text-slate-400">0/14</span>
              </div>
              <input type="text" id="quick-cust-taxid" required maxlength="14" oninput="validarRTNVentas(this.value)" placeholder="08011990123456" 
                     class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs font-mono font-bold outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Razón Social:</label>
              <input type="text" id="quick-cust-name" required placeholder="COMERCIAL HONDUREÑA S.A." 
                     class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs font-bold outline-none uppercase" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Nombre Comercial:</label>
              <input type="text" id="quick-cust-tradename" placeholder="Marca Comercial" 
                     class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Giro / Segmento:</label>
              <select id="quick-cust-category" onchange="actualizarPreimputacionCliente(this.value)"
                      class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-1.5 text-slate-900 text-xs font-bold outline-none">
                <option value="VENTA_MERCADERIA_GENERAL" selected>🛒 Mercadería General</option>
                <option value="CLIENTE_MAYORISTA">🏢 Distribuidor Mayorista</option>
                <option value="EXONERADO_DIPLOMATICO_OCE">🏛 Exonerado OCE / SAG</option>
                <option value="SERVICIOS_TECNICOS">🔧 Servicios Técnicos</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Moneda Facturación:</label>
              <select id="quick-cust-currency" class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-1.5 text-slate-900 text-xs outline-none font-mono">
                <option value="HNL" selected>HNL (Lempiras)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Cuenta Contable de Ingresos:</label>
              <select id="quick-cust-account" class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-1.5 text-slate-900 text-[10px] font-mono outline-none">
                <option value="">⚙️ Auto-Asignación (4.1.01.01.0001)</option>
                <option value="4.1.01.01.0001">4.1.01.01.0001 - Venta de Mercaderías</option>
                <option value="4.1.02.01.0001">4.1.02.01.0001 - Ingresos por Servicios</option>
              </select>
            </div>
            <div class="flex items-end">
              <div id="cust-preimputacion-badge" class="w-full bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-emerald-900 flex items-center justify-between">
                <span>⚡ Ingresos: <strong id="cust-badge-cuenta-desc">4.1.01.01.0001 Ventas</strong></span>
                <span id="cust-badge-exempt-desc" class="text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded font-bold">Gravado 15%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- NIVEL 2: CONTACTO, CRÉDITO Y BANCOS (PLEGABLE) -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button type="button" onclick="toggleNivel2Customer()" class="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/80 text-left transition font-bold text-xs text-slate-700">
            <span class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono flex items-center justify-center font-bold">2</span>
              <span>Nivel 2: Contacto, Términos de Crédito y Banco</span>
            </span>
            <span id="chevron-nivel2-cust" class="text-slate-400 font-mono text-xs">▼ Desplegar</span>
          </button>
          <div id="nivel2-cust-content" class="hidden p-3 bg-white space-y-2 border-t border-slate-100 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Teléfono de Contacto:</label>
                <input type="text" id="quick-cust-phone" placeholder="9988-7766" 
                       class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Correo para Factura Electrónica:</label>
                <input type="email" id="quick-cust-email" placeholder="cobranzas@cliente.hn" 
                       class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Días Crédito:</label>
                <input type="number" id="quick-cust-credit-days" value="0" min="0" placeholder="0 = Contado" 
                       class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs font-mono font-bold outline-none" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Límite Crédito (L):</label>
                <input type="number" id="quick-cust-limit" value="50000" step="1000" 
                       class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 font-black font-mono text-xs outline-none" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Dirección Fiscal:</label>
                <input type="text" id="quick-cust-address" placeholder="Tegucigalpa, M.D.C." 
                       class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Banco de Devolución / Cobro:</label>
                <select id="quick-cust-bank" class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-1.5 text-slate-900 text-xs outline-none">
                  <option value="">-- Sin banco --</option>
                  <option value="Banco Ficohsa">Banco Ficohsa</option>
                  <option value="Banco Atlántida">Banco Atlántida</option>
                  <option value="BAC Credomatic">BAC Credomatic</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Número de Cuenta Bancaria:</label>
                <input type="text" id="quick-cust-bank-acc" placeholder="001-201-000000" 
                       class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs font-mono outline-none" />
              </div>
            </div>
          </div>
        </div>

        <!-- NIVEL 3: COMPLEMENTARIO Y EXONERACIÓN SAR (PLEGABLE) -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button type="button" onclick="toggleNivel3Customer()" class="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/80 text-left transition font-bold text-xs text-slate-700">
            <span class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono flex items-center justify-center font-bold">3</span>
              <span>Nivel 3: Régimen de Exoneración SAR y Complementarios</span>
            </span>
            <span id="chevron-nivel3-cust" class="text-slate-400 font-mono text-xs">▼ Desplegar</span>
          </button>
          <div id="nivel3-cust-content" class="hidden p-3 bg-white space-y-2 border-t border-slate-100 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Persona de Contacto:</label>
                <input type="text" id="quick-cust-contact" placeholder="Ing. Mario Flores" 
                       class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Sitio Web:</label>
                <input type="text" id="quick-cust-web" placeholder="https://..." 
                       class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none" />
              </div>
            </div>
            <div>
              <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Observaciones Comerciales:</label>
              <input type="text" id="quick-cust-notes" placeholder="Régimen especial, notas de despacho..." 
                     class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none" />
            </div>
            <div class="bg-cyan-50/60 border border-cyan-200/70 rounded-xl p-2.5">
              <label class="flex items-center gap-2 text-slate-800 cursor-pointer text-xs font-bold">
                <input type="checkbox" id="quick-cust-exempt" class="rounded text-cyan-600 focus:ring-0">
                <span>Cliente Exonerado de Impuesto Sobre Ventas (ISV 0% bajo Orden de Compra Exenta OCE / SAG)</span>
              </label>
            </div>
          </div>
        </div>

        <div class="pt-3 flex justify-end gap-2.5 border-t border-slate-100 shrink-0">
          <button type="button" onclick="closeModal('modal-quick-customer')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer">Cancelar</button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer">💾 Guardar Cliente</button>
        </div>
      </form>

    </div>
  </div>"""

    pattern = r'<div id="modal-quick-customer".*?</div>\s*</div>\s*(?=<!-- =+ -->|<div id="modal-catalog-search")'
    new_content, count = re.subn(pattern, modal_customer_html + "\n\n", content, flags=re.DOTALL)
    print(f"Replaced modal-quick-customer in workspace_ventas.html: {count} matches")

    js_helpers_ventas = """    function toggleNivel2Customer() {
      const c = document.getElementById('nivel2-cust-content');
      const chev = document.getElementById('chevron-nivel2-cust');
      if (!c || !chev) return;
      const isHidden = c.classList.contains('hidden');
      if (isHidden) { c.classList.remove('hidden'); chev.textContent = '▲ Plegar'; }
      else { c.classList.add('hidden'); chev.textContent = '▼ Desplegar'; }
    }

    function toggleNivel3Customer() {
      const c = document.getElementById('nivel3-cust-content');
      const chev = document.getElementById('chevron-nivel3-cust');
      if (!c || !chev) return;
      const isHidden = c.classList.contains('hidden');
      if (isHidden) { c.classList.remove('hidden'); chev.textContent = '▲ Plegar'; }
      else { c.classList.add('hidden'); chev.textContent = '▼ Desplegar'; }
    }

    function validarRTNVentas(val) {
      const clean = (val || '').replace(/[^0-9]/g, '');
      const badge = document.getElementById('ventas-rtn-badge');
      if (!badge) return;
      if (clean.length === 14) {
        badge.className = "text-[9px] font-mono font-bold text-emerald-600";
        badge.textContent = "✓ 14/14 Válido";
      } else {
        badge.className = "text-[9px] font-mono text-amber-600";
        badge.textContent = `${clean.length}/14`;
      }
    }

    function actualizarPreimputacionCliente(category) {
      const accSel = document.getElementById('quick-cust-account');
      const descEl = document.getElementById('cust-badge-cuenta-desc');
      const exemptEl = document.getElementById('cust-badge-exempt-desc');
      const chkExempt = document.getElementById('quick-cust-exempt');

      if (category === 'EXONERADO_DIPLOMATICO_OCE') {
        if (accSel) accSel.value = '4.1.01.01.0001';
        if (descEl) descEl.textContent = '4.1.01.01.0001 Ventas';
        if (exemptEl) { exemptEl.textContent = 'Exonerado ISV (0%)'; exemptEl.className = 'text-cyan-800 bg-cyan-100 px-1 py-0.2 rounded font-bold'; }
        if (chkExempt) chkExempt.checked = true;
      } else if (category === 'SERVICIOS_TECNICOS') {
        if (accSel) accSel.value = '4.1.02.01.0001';
        if (descEl) descEl.textContent = '4.1.02.01.0001 Servicios';
        if (exemptEl) { exemptEl.textContent = 'Gravado 15%'; exemptEl.className = 'text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded font-bold'; }
        if (chkExempt) chkExempt.checked = false;
      } else {
        if (accSel) accSel.value = '4.1.01.01.0001';
        if (descEl) descEl.textContent = '4.1.01.01.0001 Ventas';
        if (exemptEl) { exemptEl.textContent = 'Gravado 15%'; exemptEl.className = 'text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded font-bold'; }
        if (chkExempt) chkExempt.checked = false;
      }
    }

    async function saveQuickCustomer(e) {
      e.preventDefault();
      const taxId = (document.getElementById('quick-cust-taxid')?.value || '').trim().replace(/[^0-9]/g, '');
      const name = (document.getElementById('quick-cust-name')?.value || '').trim().toUpperCase();
      if (!taxId || !name) {
        alert("Ingrese RTN/DNI y Razón Social");
        return;
      }

      const tradeName = (document.getElementById('quick-cust-tradename')?.value || '').trim();
      const category = document.getElementById('quick-cust-category')?.value || 'VENTA_MERCADERIA_GENERAL';
      const currency = document.getElementById('quick-cust-currency')?.value || 'HNL';
      const phone = (document.getElementById('quick-cust-phone')?.value || '').trim() || 'N/A';
      const email = (document.getElementById('quick-cust-email')?.value || '').trim();
      const address = (document.getElementById('quick-cust-address')?.value || '').trim() || 'Tegucigalpa';
      const creditDays = parseInt(document.getElementById('quick-cust-credit-days')?.value || '0', 10);
      const limit = parseFloat(document.getElementById('quick-cust-limit')?.value) || 50000;
      const bank = document.getElementById('quick-cust-bank')?.value || '';
      const bankAcc = (document.getElementById('quick-cust-bank-acc')?.value || '').trim();
      const contact = (document.getElementById('quick-cust-contact')?.value || '').trim();
      const web = (document.getElementById('quick-cust-web')?.value || '').trim();
      const notes = (document.getElementById('quick-cust-notes')?.value || '').trim();
      const isExempt = !!document.getElementById('quick-cust-exempt')?.checked;

      const payload = {
        company_id: window.CURRENT_COMPANY_ID || "00000000-0000-0000-0000-000000000001",
        tax_id: taxId,
        legal_name: name,
        trade_name: tradeName || null,
        business_category: category,
        default_currency: currency,
        email: email || null,
        phone: phone,
        address: address,
        credit_days: isNaN(creditDays) ? 0 : creditDays,
        credit_limit: limit,
        bank_name: bank || null,
        bank_account_number: bankAcc || null,
        contact_person: contact || null,
        website: web || null,
        notes: notes || null,
        is_tax_exempt: isExempt,
        is_active: true
      };

      try {
        await fetch('/api/v1/sales/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn("Fallo persistencia API customer, usando memoria:", err);
      }

      const newCust = { tax_id: taxId, name, phone, address, credit_limit: limit, balance: 0, is_final_consumer: false };
      if (typeof state !== 'undefined' && state.customersList) {
        state.customersList.unshift(newCust);
      }
      if (typeof selectCustomer === 'function') {
        selectCustomer(taxId);
      }
      closeModal('modal-quick-customer');
      if (typeof showToast === 'function') {
        showToast(`✓ Cliente registrado: ${name}`);
      }
    }"""

    pattern_js = r'function saveQuickCustomer\(e\)\s*\{.*?showToast\(.*?\);\s*\}'
    new_content, count_js = re.subn(pattern_js, js_helpers_ventas, new_content, flags=re.DOTALL)
    print(f"Replaced saveQuickCustomer in workspace_ventas.html: {count_js} matches")

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Updated workspace_ventas.html successfully.")

update_workspace_ventas()
