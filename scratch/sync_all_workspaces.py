import os
import shutil
import re

def update_workspace_cxc():
    path = "workspace_cxc.html"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add button to header next to btn-registrar-abono-main if not present
    if "modal-quick-customer" not in content:
        btn_html = """      <button onclick="openModal('modal-quick-customer')" class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer">
        <span>＋</span>
        <span>Nuevo Cliente</span>
      </button>
      <button id="btn-registrar-abono-main" """
        content = content.replace('<button id="btn-registrar-abono-main" ', btn_html, 1)

        modal_cxc_html = """  <!-- MODAL: ALTA RÁPIDA DE CLIENTE (FICHA 3 NIVELES) -->
  <div id="modal-quick-customer" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 hidden">
    <div class="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
      <div class="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <span class="font-bold text-base">＋</span>
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900">Ficha Maestra de Cliente (CxC)</h3>
            <p class="text-[10px] text-slate-500 font-medium font-mono">Despliegue Progresivo en 3 Niveles con Pre-Imputación</p>
          </div>
        </div>
        <button onclick="closeModal('modal-quick-customer')" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl font-bold">&times;</button>
      </div>

      <form id="form-quick-customer-cxc" onsubmit="saveQuickCustomerCxC(event)" class="p-4 space-y-3 text-xs overflow-y-auto custom-scrollbar flex-1 font-sans">
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
                <span id="cxc-rtn-badge" class="text-[9px] font-mono text-slate-400">0/14</span>
              </div>
              <input type="text" id="cxc-cust-taxid" required maxlength="14" oninput="validarRTNCxC(this.value)" placeholder="08011990123456" 
                     class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs font-mono font-bold outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Razón Social:</label>
              <input type="text" id="cxc-cust-name" required placeholder="COMERCIAL HONDUREÑA S.A." 
                     class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs font-bold outline-none uppercase" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Nombre Comercial:</label>
              <input type="text" id="cxc-cust-tradename" placeholder="Marca Comercial" 
                     class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-slate-900 text-xs outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Giro / Segmento:</label>
              <select id="cxc-cust-category" onchange="actualizarPreimputacionCxCCust(this.value)"
                      class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-1.5 text-slate-900 text-xs font-bold outline-none">
                <option value="VENTA_MERCADERIA_GENERAL" selected>🛒 Mercadería General</option>
                <option value="CLIENTE_MAYORISTA">🏢 Distribuidor Mayorista</option>
                <option value="EXONERADO_DIPLOMATICO_OCE">🏛 Exonerado OCE / SAG</option>
                <option value="SERVICIOS_TECNICOS">🔧 Servicios Técnicos</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Moneda:</label>
              <select id="cxc-cust-currency" class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-1.5 text-slate-900 text-xs outline-none font-mono">
                <option value="HNL" selected>HNL (Lempiras)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Cuenta Contable:</label>
              <select id="cxc-cust-account" class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-1.5 text-slate-900 text-[10px] font-mono outline-none">
                <option value="4.1.01.01.0001">4.1.01.01.0001 - Venta de Mercaderías</option>
                <option value="4.1.02.01.0001">4.1.02.01.0001 - Ingresos por Servicios</option>
              </select>
            </div>
            <div class="flex items-end">
              <div id="cxc-cust-preimputacion-badge" class="w-full bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-emerald-900 flex items-center justify-between">
                <span>⚡ Ingresos: <strong id="cxc-cust-badge-cuenta-desc">4.1.01.01.0001 Ventas</strong></span>
                <span id="cxc-cust-badge-exempt-desc" class="text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded font-bold">Gravado 15%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- NIVEL 2 -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button type="button" onclick="toggleNivel2CxCCust()" class="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/80 text-left transition font-bold text-xs text-slate-700">
            <span class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono flex items-center justify-center font-bold">2</span>
              <span>Nivel 2: Contacto, Crédito y Banco de Cobro</span>
            </span>
            <span id="chevron-nivel2-cxccust" class="text-slate-400 font-mono text-xs">▼ Desplegar</span>
          </button>
          <div id="nivel2-cxccust-content" class="hidden p-3 bg-white space-y-2 border-t border-slate-100 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Teléfono:</label>
                <input type="text" id="cxc-cust-phone" placeholder="9988-7766" class="w-full input-std" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Correo:</label>
                <input type="email" id="cxc-cust-email" placeholder="cobranzas@cliente.hn" class="w-full input-std" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Días Crédito:</label>
                <input type="number" id="cxc-cust-credit-days" value="0" min="0" class="w-full input-std font-mono font-bold" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Límite Crédito (L):</label>
                <input type="number" id="cxc-cust-limit" value="50000" step="1000" class="w-full input-std font-mono font-bold" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Dirección:</label>
                <input type="text" id="cxc-cust-address" placeholder="Tegucigalpa" class="w-full input-std" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Banco:</label>
                <select id="cxc-cust-bank" class="w-full select-std">
                  <option value="">-- Sin banco --</option>
                  <option value="Banco Ficohsa">Banco Ficohsa</option>
                  <option value="Banco Atlántida">Banco Atlántida</option>
                  <option value="BAC Credomatic">BAC Credomatic</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">No. Cuenta Bancaria:</label>
                <input type="text" id="cxc-cust-bank-acc" placeholder="001-201-000000" class="w-full input-std font-mono" />
              </div>
            </div>
          </div>
        </div>

        <!-- NIVEL 3 -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button type="button" onclick="toggleNivel3CxCCust()" class="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/80 text-left transition font-bold text-xs text-slate-700">
            <span class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono flex items-center justify-center font-bold">3</span>
              <span>Nivel 3: Régimen SAR y Datos Complementarios</span>
            </span>
            <span id="chevron-nivel3-cxccust" class="text-slate-400 font-mono text-xs">▼ Desplegar</span>
          </button>
          <div id="nivel3-cxccust-content" class="hidden p-3 bg-white space-y-2 border-t border-slate-100 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Persona de Contacto:</label>
                <input type="text" id="cxc-cust-contact" placeholder="Ing. Contacto" class="w-full input-std" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Sitio Web:</label>
                <input type="text" id="cxc-cust-web" placeholder="https://..." class="w-full input-std" />
              </div>
            </div>
            <div>
              <label class="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Notas / Observaciones:</label>
              <input type="text" id="cxc-cust-notes" placeholder="Condiciones de crédito..." class="w-full input-std" />
            </div>
            <div class="bg-cyan-50/60 border border-cyan-200/70 rounded-xl p-2.5">
              <label class="flex items-center gap-2 text-slate-800 cursor-pointer text-xs font-bold">
                <input type="checkbox" id="cxc-cust-exempt" class="rounded text-cyan-600 focus:ring-0">
                <span>Cliente Exonerado de ISV (Régimen SAG / Carnet OCE)</span>
              </label>
            </div>
          </div>
        </div>

        <div class="pt-3 flex justify-end gap-2.5 border-t border-slate-100 shrink-0">
          <button type="button" onclick="closeModal('modal-quick-customer')" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">Cancelar</button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md">💾 Guardar Cliente</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
    function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

    function toggleNivel2CxCCust() {
      const c = document.getElementById('nivel2-cxccust-content');
      const chev = document.getElementById('chevron-nivel2-cxccust');
      if (!c || !chev) return;
      const isHidden = c.classList.contains('hidden');
      if (isHidden) { c.classList.remove('hidden'); chev.textContent = '▲ Plegar'; }
      else { c.classList.add('hidden'); chev.textContent = '▼ Desplegar'; }
    }

    function toggleNivel3CxCCust() {
      const c = document.getElementById('nivel3-cxccust-content');
      const chev = document.getElementById('chevron-nivel3-cxccust');
      if (!c || !chev) return;
      const isHidden = c.classList.contains('hidden');
      if (isHidden) { c.classList.remove('hidden'); chev.textContent = '▲ Plegar'; }
      else { c.classList.add('hidden'); chev.textContent = '▼ Desplegar'; }
    }

    function validarRTNCxC(val) {
      const clean = (val || '').replace(/[^0-9]/g, '');
      const badge = document.getElementById('cxc-rtn-badge');
      if (!badge) return;
      if (clean.length === 14) {
        badge.className = "text-[9px] font-mono font-bold text-emerald-600";
        badge.textContent = "✓ 14/14 Válido";
      } else {
        badge.className = "text-[9px] font-mono text-amber-600";
        badge.textContent = `${clean.length}/14`;
      }
    }

    function actualizarPreimputacionCxCCust(category) {
      const accSel = document.getElementById('cxc-cust-account');
      const descEl = document.getElementById('cxc-cust-badge-cuenta-desc');
      const exemptEl = document.getElementById('cxc-cust-badge-exempt-desc');
      const chkExempt = document.getElementById('cxc-cust-exempt');

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

    async function saveQuickCustomerCxC(e) {
      e.preventDefault();
      const taxId = (document.getElementById('cxc-cust-taxid')?.value || '').trim().replace(/[^0-9]/g, '');
      const name = (document.getElementById('cxc-cust-name')?.value || '').trim().toUpperCase();
      if (!taxId || !name) {
        alert("Ingrese RTN/DNI y Razón Social");
        return;
      }

      const tradeName = (document.getElementById('cxc-cust-tradename')?.value || '').trim();
      const category = document.getElementById('cxc-cust-category')?.value || 'VENTA_MERCADERIA_GENERAL';
      const currency = document.getElementById('cxc-cust-currency')?.value || 'HNL';
      const phone = (document.getElementById('cxc-cust-phone')?.value || '').trim() || 'N/A';
      const email = (document.getElementById('cxc-cust-email')?.value || '').trim();
      const address = (document.getElementById('cxc-cust-address')?.value || '').trim() || 'Tegucigalpa';
      const creditDays = parseInt(document.getElementById('cxc-cust-credit-days')?.value || '0', 10);
      const limit = parseFloat(document.getElementById('cxc-cust-limit')?.value) || 50000;
      const bank = document.getElementById('cxc-cust-bank')?.value || '';
      const bankAcc = (document.getElementById('cxc-cust-bank-acc')?.value || '').trim();
      const contact = (document.getElementById('cxc-cust-contact')?.value || '').trim();
      const web = (document.getElementById('cxc-cust-web')?.value || '').trim();
      const notes = (document.getElementById('cxc-cust-notes')?.value || '').trim();
      const isExempt = !!document.getElementById('cxc-cust-exempt')?.checked;

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
        console.warn("Fallo persistencia API customer en CxC:", err);
      }

      closeModal('modal-quick-customer');
      alert(`✓ Cliente registrado: ${name}`);
    }
  </script>
"""
        content = content.replace("</body>", modal_cxc_html + "\n</body>")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated workspace_cxc.html successfully.")
    else:
        print("workspace_cxc.html already has modal-quick-customer.")

def sync_copies():
    files = [
        "workspace_compras.html",
        "workspace_cxp.html",
        "workspace_ventas.html",
        "workspace_cxc.html",
    ]
    targets = ["templates", "backend/templates", "frontend/public"]

    for t in targets:
        os.makedirs(t, exist_ok=True)
        for f in files:
            if os.path.exists(f):
                dst = os.path.join(t, f)
                shutil.copy2(f, dst)
                print(f"Copied {f} -> {dst}")

if __name__ == "__main__":
    update_workspace_cxc()
    sync_copies()
