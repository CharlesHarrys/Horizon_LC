import os
import re

def update_workspace_cxp():
    path = "workspace_cxp.html"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    modal_cxp_html = """  <!-- MODAL 2: ALTA RÁPIDA DE NUEVO PROVEEDOR (FICHA 3 NIVELES) -->
  <div id="modal-quick-supplier" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden font-sans flex flex-col max-h-[92vh]">
      <div class="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-emerald-600 font-bold text-base">＋</span>
          <div>
            <h3 class="font-bold text-sm text-slate-900">Ficha Maestra de Proveedor / Acreedor</h3>
            <p class="text-[10px] text-slate-500 font-mono">Despliegue Progresivo en 3 Niveles con Pre-Imputación Contable</p>
          </div>
        </div>
        <button onclick="closeModal('modal-quick-supplier')" class="text-slate-400 hover:text-slate-700 font-mono text-base font-bold">&times;</button>
      </div>

      <form id="form-quick-supplier" onsubmit="event.preventDefault(); saveQuickSupplier();" class="p-4 space-y-3 text-xs overflow-y-auto custom-scrollbar flex-1">
        <!-- NIVEL 1: ESENCIAL Y CONTABLE -->
        <div class="space-y-2 border border-slate-200 rounded-2xl p-3 bg-white">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono flex items-center justify-center font-bold">1</span>
              <span>Nivel 1: Datos Fiscales, Giro y Pre-Imputación</span>
            </span>
            <span class="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Obligatorio</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="flex justify-between items-center mb-0.5">
                <label class="text-[10px] text-slate-500 font-bold block">RTN (14 DÍGITOS):</label>
                <span id="cxp-rtn-badge" class="text-[9px] font-mono text-slate-400">0/14</span>
              </div>
              <input type="text" id="quick-supplier-rtn" maxlength="14" required oninput="validarRTNCxP(this.value)" placeholder="08011995123456" class="w-full input-std font-mono font-bold" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold mb-0.5 block">RAZÓN SOCIAL:</label>
              <input type="text" id="quick-supplier-name" required placeholder="Distribuidora Comercial S.A." class="w-full input-std font-bold" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="text-[10px] text-slate-500 font-bold mb-0.5 block">NOMBRE COMERCIAL:</label>
              <input type="text" id="quick-supplier-tradename" placeholder="Marca o Rótulo" class="w-full input-std" />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold mb-0.5 block">ALCANCE:</label>
              <select id="quick-supplier-scope" class="w-full select-std">
                <option value="LOCAL_HONDURAS" selected>🇭🇳 Local Honduras</option>
                <option value="EXTRANJERO_IMPORTACION">🚢 Importación / Exterior</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold mb-0.5 block">MONEDA:</label>
              <select id="quick-supplier-currency" class="w-full select-std">
                <option value="HNL" selected>HNL (Lempiras)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] text-slate-500 font-bold mb-0.5 block">GIRO COMERCIAL / CATEGORÍA:</label>
              <select id="quick-supplier-category" onchange="actualizarPreimputacionCxP(this.value)" class="w-full select-std font-bold text-slate-800">
                <option value="MERCADERIA_INVENTARIO" selected>📦 Mercadería e Inventario</option>
                <option value="MANTENIMIENTO_HERRAMIENTAS">🛠 Mantenimiento y Herramientas</option>
                <option value="SERVICIOS_PROFESIONALES">⚖️ Servicios Profesionales (Honorarios)</option>
                <option value="ALQUILERES_LOCALES">🏢 Alquileres Locales Comerciales</option>
                <option value="SERVICIOS_PUBLICOS">⚡ Servicios Públicos (ENEE / SANAA)</option>
                <option value="LOGISTICA_ADUANAS">🚚 Logística y Fletes Aduanales</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-bold mb-0.5 block">CUENTA PRE-IMPUTADA:</label>
              <select id="quick-supplier-account" class="w-full select-std font-mono text-[10px]">
                <option value="">⚙️ Auto-Asignación según Giro</option>
                <option value="1.1.03.01.0001">1.1.03.01.0001 - Inventario de Mercaderías</option>
                <option value="5.2.01.02.0002">5.2.01.02.0002 - Mantenimiento de Herramientas</option>
                <option value="5.2.01.03.0002">5.2.01.03.0002 - Honorarios Profesionales</option>
                <option value="5.2.01.03.0001">5.2.01.03.0001 - Alquileres Comerciales</option>
                <option value="5.2.01.04.0001">5.2.01.04.0001 - Servicios Públicos</option>
                <option value="2.1.01.02.0001">2.1.01.02.0001 - Fletes y Transporte</option>
              </select>
            </div>
          </div>

          <div id="cxp-badge-preimputacion" class="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2 text-[10px] font-mono text-emerald-900 flex items-center justify-between">
            <span>⚡ Imputación: <strong id="cxp-badge-cuenta-desc">1.1.03.01.0001 Inventario</strong></span>
            <span id="cxp-badge-ret-desc" class="text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded font-bold">Sin retenciones especiales</span>
          </div>
        </div>

        <!-- NIVEL 2: CONTACTO, CRÉDITO Y BANCOS ACH -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button type="button" onclick="toggleNivel2CxP()" class="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/80 text-left transition font-bold text-xs text-slate-700">
            <span class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono flex items-center justify-center font-bold">2</span>
              <span>Nivel 2: Contacto, Crédito y Bancos ACH</span>
            </span>
            <span id="chevron-nivel2-cxp" class="text-slate-400 font-mono text-xs">▼ Desplegar</span>
          </button>
          <div id="nivel2-cxp-content" class="hidden p-3 bg-white space-y-2 border-t border-slate-100 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">TELÉFONO:</label>
                <input type="text" id="quick-supplier-phone" placeholder="2239-0000" class="w-full input-std font-mono" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">CORREO ELECTRÓNICO:</label>
                <input type="email" id="quick-supplier-email" placeholder="facturacion@proveedor.hn" class="w-full input-std" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">DÍAS CRÉDITO:</label>
                <input type="number" id="quick-supplier-credit-days" value="0" min="0" class="w-full input-std font-mono font-bold" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">LÍMITE CRÉDITO (L):</label>
                <input type="number" id="quick-supplier-credit-limit" value="0.00" step="1000" class="w-full input-std font-mono font-bold" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">DIRECCIÓN FISCAL:</label>
                <input type="text" id="quick-supplier-address" placeholder="Tegucigalpa" class="w-full input-std" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">BANCO ACH:</label>
                <select id="quick-supplier-bank" class="w-full select-std">
                  <option value="">-- Sin banco --</option>
                  <option value="Banco Ficohsa">Banco Ficohsa</option>
                  <option value="Banco Atlántida">Banco Atlántida</option>
                  <option value="BAC Credomatic">BAC Credomatic</option>
                  <option value="Banco Banpaís">Banco Banpaís</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">TIPO CUENTA:</label>
                <select id="quick-supplier-bank-type" class="w-full select-std">
                  <option value="CHEQUES">Cheques</option>
                  <option value="AHORRO">Ahorro</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">NO. CUENTA BANCARIA:</label>
                <input type="text" id="quick-supplier-bank-acc" placeholder="001-201-000000" class="w-full input-std font-mono" />
              </div>
            </div>
          </div>
        </div>

        <!-- NIVEL 3: COMPLEMENTARIO Y PERFIL FISCAL SAR -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button type="button" onclick="toggleNivel3CxP()" class="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/80 text-left transition font-bold text-xs text-slate-700">
            <span class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono flex items-center justify-center font-bold">3</span>
              <span>Nivel 3: Perfil Fiscal SAR (Retenciones) y Complementario</span>
            </span>
            <span id="chevron-nivel3-cxp" class="text-slate-400 font-mono text-xs">▼ Desplegar</span>
          </button>
          <div id="nivel3-cxp-content" class="hidden p-3 bg-white space-y-2 border-t border-slate-100 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">PERSONA CONTACTO:</label>
                <input type="text" id="quick-supplier-contact" placeholder="Lic. Ejecutivo" class="w-full input-std" />
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">SITIO WEB:</label>
                <input type="text" id="quick-supplier-web" placeholder="https://..." class="w-full input-std" />
              </div>
            </div>
            <div>
              <label class="text-[9px] text-slate-500 font-bold mb-0.5 block">OBSERVACIONES:</label>
              <input type="text" id="quick-supplier-notes" placeholder="Notas internas..." class="w-full input-std" />
            </div>
            <div class="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2 space-y-1">
              <span class="font-bold text-[10px] text-amber-900 uppercase block">Retenciones SAR:</span>
              <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                <label class="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input type="checkbox" id="quick-supplier-ret-isr" class="rounded text-amber-600 focus:ring-0">
                  <span>1% Anticipo ISR</span>
                </label>
                <label class="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input type="checkbox" id="quick-supplier-ret-hon" class="rounded text-amber-600 focus:ring-0">
                  <span>12.5% Honorarios</span>
                </label>
                <label class="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input type="checkbox" id="quick-supplier-ret-rent" class="rounded text-amber-600 focus:ring-0">
                  <span>10% Alquileres</span>
                </label>
                <label class="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input type="checkbox" id="quick-supplier-ret-isv" class="rounded text-amber-600 focus:ring-0">
                  <span>Agente Retención ISV</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button type="button" onclick="closeModal('modal-quick-supplier')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
            Cancelar
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5">
            <span>💾</span><span>Guardar y Seleccionar</span>
          </button>
        </div>
      </form>
    </div>
  </div>"""

    # Replace modal
    pattern = r'<div id="modal-quick-supplier".*?</div>\s*</div>\s*(?=<!-- =+ -->|<div id="modal-chequevoucher")'
    new_content, count = re.subn(pattern, modal_cxp_html + "\n\n", content, flags=re.DOTALL)
    print(f"Replaced modal-quick-supplier in workspace_cxp.html: {count} matches")

    # Add JS helper functions and update saveQuickSupplier
    js_helpers = """    function toggleNivel2CxP() {
      const c = document.getElementById('nivel2-cxp-content');
      const chev = document.getElementById('chevron-nivel2-cxp');
      if (!c || !chev) return;
      const isHidden = c.classList.contains('hidden');
      if (isHidden) { c.classList.remove('hidden'); chev.textContent = '▲ Plegar'; }
      else { c.classList.add('hidden'); chev.textContent = '▼ Desplegar'; }
    }

    function toggleNivel3CxP() {
      const c = document.getElementById('nivel3-cxp-content');
      const chev = document.getElementById('chevron-nivel3-cxp');
      if (!c || !chev) return;
      const isHidden = c.classList.contains('hidden');
      if (isHidden) { c.classList.remove('hidden'); chev.textContent = '▲ Plegar'; }
      else { c.classList.add('hidden'); chev.textContent = '▼ Desplegar'; }
    }

    function validarRTNCxP(val) {
      const clean = (val || '').replace(/[^0-9]/g, '');
      const badge = document.getElementById('cxp-rtn-badge');
      if (!badge) return;
      if (clean.length === 14) {
        badge.className = "text-[9px] font-mono font-bold text-emerald-600";
        badge.textContent = "✓ 14/14 Válido";
      } else {
        badge.className = "text-[9px] font-mono text-amber-600";
        badge.textContent = `${clean.length}/14`;
      }
    }

    function actualizarPreimputacionCxP(category) {
      const accSel = document.getElementById('quick-supplier-account');
      const descEl = document.getElementById('cxp-badge-cuenta-desc');
      const retEl = document.getElementById('cxp-badge-ret-desc');
      const retHon = document.getElementById('quick-supplier-ret-hon');
      const retRent = document.getElementById('quick-supplier-ret-rent');

      if (category === 'MERCADERIA_INVENTARIO') {
        if (accSel) accSel.value = '1.1.03.01.0001';
        if (descEl) descEl.textContent = '1.1.03.01.0001 Inventario';
        if (retEl) retEl.textContent = 'Sin retenciones especiales';
        if (retHon) retHon.checked = false;
        if (retRent) retRent.checked = false;
      } else if (category === 'MANTENIMIENTO_HERRAMIENTAS') {
        if (accSel) accSel.value = '5.2.01.02.0002';
        if (descEl) descEl.textContent = '5.2.01.02.0002 Mantenimiento';
        if (retEl) retEl.textContent = 'Gasto operativo deducción ISV';
        if (retHon) retHon.checked = false;
        if (retRent) retRent.checked = false;
      } else if (category === 'SERVICIOS_PROFESIONALES') {
        if (accSel) accSel.value = '5.2.01.03.0002';
        if (descEl) descEl.textContent = '5.2.01.03.0002 Honorarios';
        if (retEl) retEl.textContent = 'Retención 12.5% SAR auto-aplicada';
        if (retHon) retHon.checked = true;
        if (retRent) retRent.checked = false;
      } else if (category === 'ALQUILERES_LOCALES') {
        if (accSel) accSel.value = '5.2.01.03.0001';
        if (descEl) descEl.textContent = '5.2.01.03.0001 Alquileres';
        if (retEl) retEl.textContent = 'Retención 10% Alquileres SAR';
        if (retHon) retHon.checked = false;
        if (retRent) retRent.checked = true;
      } else if (category === 'SERVICIOS_PUBLICOS') {
        if (accSel) accSel.value = '5.2.01.04.0001';
        if (descEl) descEl.textContent = '5.2.01.04.0001 Servicios Públicos';
        if (retEl) retEl.textContent = 'Gasto directo energía/agua';
        if (retHon) retHon.checked = false;
        if (retRent) retRent.checked = false;
      } else if (category === 'LOGISTICA_ADUANAS') {
        if (accSel) accSel.value = '2.1.01.02.0001';
        if (descEl) descEl.textContent = '2.1.01.02.0001 Fletes y Aduanas';
        if (retEl) retEl.textContent = 'Acreedores de flete';
        if (retHon) retHon.checked = false;
        if (retRent) retRent.checked = false;
      }
    }

    async function saveQuickSupplier() {
      const rtn = (document.getElementById('quick-supplier-rtn')?.value || '').trim().replace(/[^0-9]/g, '');
      const name = (document.getElementById('quick-supplier-name')?.value || '').trim();
      if (!rtn || rtn.length !== 14) {
        alert("El RTN debe contener exactamente 14 dígitos.");
        return;
      }
      if (!name) {
        alert("Ingrese la Razón Social.");
        return;
      }

      const tradeName = (document.getElementById('quick-supplier-tradename')?.value || '').trim();
      const scope = document.getElementById('quick-supplier-scope')?.value || 'LOCAL_HONDURAS';
      const currency = document.getElementById('quick-supplier-currency')?.value || 'HNL';
      const category = document.getElementById('quick-supplier-category')?.value || 'MERCADERIA_INVENTARIO';

      const email = (document.getElementById('quick-supplier-email')?.value || '').trim();
      const phone = (document.getElementById('quick-supplier-phone')?.value || '').trim();
      const creditDays = parseInt(document.getElementById('quick-supplier-credit-days')?.value || '0', 10);
      const creditLimit = parseFloat(document.getElementById('quick-supplier-credit-limit')?.value || '0');
      const address = (document.getElementById('quick-supplier-address')?.value || '').trim();
      const bankName = document.getElementById('quick-supplier-bank')?.value || '';
      const bankType = document.getElementById('quick-supplier-bank-type')?.value || 'CHEQUES';
      const bankAcc = (document.getElementById('quick-supplier-bank-acc')?.value || '').trim();

      const contactPerson = (document.getElementById('quick-supplier-contact')?.value || '').trim();
      const website = (document.getElementById('quick-supplier-web')?.value || '').trim();
      const notes = (document.getElementById('quick-supplier-notes')?.value || '').trim();
      const retIsr = !!document.getElementById('quick-supplier-ret-isr')?.checked;
      const retHon = !!document.getElementById('quick-supplier-ret-hon')?.checked;
      const retRent = !!document.getElementById('quick-supplier-ret-rent')?.checked;
      const isvAgent = !!document.getElementById('quick-supplier-ret-isv')?.checked;

      const payload = {
        company_id: window.CURRENT_COMPANY_ID || "00000000-0000-0000-0000-000000000001",
        tax_id: rtn,
        legal_name: name,
        trade_name: tradeName || null,
        supplier_scope: scope,
        default_currency: currency,
        business_category: category,
        email: email || null,
        phone: phone || null,
        address: address || null,
        credit_days: isNaN(creditDays) ? 0 : creditDays,
        credit_limit: isNaN(creditLimit) ? 0.0 : creditLimit,
        bank_name: bankName || null,
        bank_account_type: bankType,
        bank_account_number: bankAcc || null,
        bank_currency: currency,
        contact_person: contactPerson || null,
        website: website || null,
        notes: notes || null,
        subject_to_isr_1_percent: retIsr,
        subject_to_honorarios_12_5: retHon,
        subject_to_rent_10: retRent,
        is_isv_withholding_agent: isvAgent,
        is_active: true
      };

      try {
        await fetch('/api/v1/procurement/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn("Fallo persistencia API supplier, usando memoria local:", e);
      }

      const newSup = { supplier_tax_id: rtn, supplier_name: name, total_debt: 0.0, total_overdue: 0.0, invoices_count: 0 };
      if (typeof state !== 'undefined' && state.suppliers) {
        state.suppliers.unshift(newSup);
      }
      closeModal('modal-quick-supplier');
      closeModal('modal-supplier-search');
      if (typeof selectSupplier === 'function') {
        selectSupplier(rtn);
      }
    }"""

    # Replace saveQuickSupplier function
    pattern_js = r'function saveQuickSupplier\(\)\s*\{.*?selectSupplier\(rtn\);\s*\}'
    new_content, count_js = re.subn(pattern_js, js_helpers, new_content, flags=re.DOTALL)
    print(f"Replaced saveQuickSupplier in workspace_cxp.html: {count_js} matches")

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Updated workspace_cxp.html successfully.")

update_workspace_cxp()
