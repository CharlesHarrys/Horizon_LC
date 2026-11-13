    // ===================== HZ: DIRECTORIO Y REGISTRO DE PROVEEDORES (compartido) =====================
    const HZ_SUP = { list: [], loaded: false, selected: null, query: '' };

    const HZ_CATEGORIAS = {
      MERCADERIA_INVENTARIO:       { label: 'Mercadería / Inventario',        cuenta: '1.1.03.01.0001 · Inventario de Mercaderías',        ret: 'Sin retenciones especiales',      hon: false, rent: false },
      MANTENIMIENTO_HERRAMIENTAS:  { label: 'Mantenimiento y Herramientas',   cuenta: '5.2.01.02.0002 · Mantenimiento de Herramientas',    ret: 'Gasto operativo · crédito ISV',   hon: false, rent: false },
      SERVICIOS_PROFESIONALES:     { label: 'Servicios Profesionales',        cuenta: '5.2.01.03.0002 · Honorarios Profesionales',         ret: 'Retención 12.5% honorarios',      hon: true,  rent: false },
      ALQUILERES_LOCALES:          { label: 'Alquileres de Locales',          cuenta: '5.2.01.03.0001 · Alquiler de Locales Comerciales',  ret: 'Retención 10% alquileres',        hon: false, rent: true  },
      SERVICIOS_PUBLICOS:          { label: 'Servicios Públicos',             cuenta: '5.2.01.04.0001 · Servicios Públicos',               ret: 'Gasto directo energía/agua',      hon: false, rent: false },
      LOGISTICA_ADUANAS:           { label: 'Logística y Aduanas',            cuenta: '2.1.01.02.0001 · Fletes y Transporte Aduanal',      ret: 'Acreedores de flete (Landed Cost)', hon: false, rent: false }
    };

    function hzCompanyId() { return window.CURRENT_COMPANY_ID || '00000000-0000-0000-0000-000000000001'; }
    function hzEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    function hzFmtRtn(r) { const d = String(r || '').replace(/\D/g, ''); return d.length === 14 ? `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}` : (r || ''); }
    function hzSupCfg() { return window.HZ_SUP_CFG || {}; }

    function hzFormatApiError(data, fallback) {
      if (!data) return fallback;
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) return data.detail.map(d => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`).join(' · ');
      return fallback;
    }

    function hzToast(html, tone) {
      const t = document.createElement('div');
      const color = tone === 'warn' ? 'bg-amber-600' : (tone === 'error' ? 'bg-rose-600' : 'bg-slate-900');
      t.className = `fixed bottom-5 right-5 z-[80] ${color} text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs flex items-center gap-2 hz-anim`;
      t.innerHTML = html;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 4500);
    }

    function hzSupNormalizar(raw) {
      return {
        id: raw.id || null,
        tax_id: String(raw.tax_id || raw.supplier_tax_id || '').replace(/\D/g, ''),
        legal_name: raw.legal_name || raw.supplier_name || '',
        trade_name: raw.trade_name || '',
        business_category: raw.business_category || '',
        default_currency: raw.default_currency || 'HNL',
        default_account_id: raw.default_account_id || null,
        credit_days: raw.credit_days || 0,
        _local: !!raw._local
      };
    }

    async function hzSupCargarDirectorio(force) {
      if (HZ_SUP.loaded && !force) return HZ_SUP.list;
      let apiList = [];
      try {
        const r = await fetch(`/api/v1/procurement/suppliers/company/${hzCompanyId()}?only_active=true&limit=500`);
        if (r.ok) apiList = (await r.json()).map(hzSupNormalizar);
      } catch (e) { console.warn('Directorio de proveedores: API no disponible, se usan datos locales.', e); }

      const cfg = hzSupCfg();
      const extra = (typeof cfg.extraSuppliers === 'function' ? cfg.extraSuppliers() : []).map(hzSupNormalizar);
      const demo = apiList.length ? [] : (cfg.demoSuppliers || []).map(hzSupNormalizar);
      const local = HZ_SUP.list.filter(s => s._local);
      const merged = [];
      const seen = new Set();
      [...apiList, ...local, ...extra, ...demo].forEach(s => {
        if (!s.tax_id || seen.has(s.tax_id)) return;
        seen.add(s.tax_id);
        merged.push(s);
      });
      merged.sort((a, b) => a.legal_name.localeCompare(b.legal_name, 'es'));
      HZ_SUP.list = merged;
      HZ_SUP.loaded = true;
      return merged;
    }

    // ---------- Pop-up 1: buscador ----------
    async function hzSupAbrirBuscador(prefill) {
      hzSupCerrarRegistro(true);
      const modal = document.getElementById('modalBuscarProveedor');
      modal.classList.remove('hidden');
      const inp = document.getElementById('hz-sup-search');
      inp.value = prefill || '';
      await hzSupCargarDirectorio(true);
      hzSupFiltrar();
      setTimeout(() => inp.focus(), 50);
    }

    function hzSupCerrarBuscador() { document.getElementById('modalBuscarProveedor').classList.add('hidden'); }

    function hzSupLimpiarFiltro() {
      const inp = document.getElementById('hz-sup-search');
      inp.value = '';
      hzSupFiltrar();
      inp.focus();
    }

    function hzSupFiltrar() {
      const q = (document.getElementById('hz-sup-search').value || '').trim().toLowerCase();
      HZ_SUP.query = q;
      const qDigits = q.replace(/\D/g, '');
      const rows = HZ_SUP.list.filter(s => {
        if (!q) return true;
        const cat = (HZ_CATEGORIAS[s.business_category] || {}).label || '';
        return s.legal_name.toLowerCase().includes(q) || s.trade_name.toLowerCase().includes(q) ||
               cat.toLowerCase().includes(q) || (qDigits && s.tax_id.includes(qDigits));
      });
      const tbody = document.getElementById('hz-sup-tbody');
      tbody.innerHTML = rows.map(s => {
        const cat = HZ_CATEGORIAS[s.business_category];
        const cuenta = cat ? cat.cuenta : '—';
        const tag = s._local ? '<span class="ml-1 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">local</span>' : '';
        return `<tr onclick="hzSupSeleccionar('${s.tax_id}')" ondblclick="hzSupSeleccionar('${s.tax_id}')" class="cursor-pointer hover:bg-blue-50/60 transition">
          <td class="px-4 py-2.5 font-mono font-bold text-blue-700 whitespace-nowrap">${hzFmtRtn(s.tax_id)}</td>
          <td class="px-3 py-2.5"><div class="font-semibold text-slate-800">${hzEsc(s.legal_name)}${tag}</div>${s.trade_name ? `<div class="text-[10px] text-slate-400">${hzEsc(s.trade_name)}</div>` : ''}</td>
          <td class="px-3 py-2.5 text-slate-600">${cat ? hzEsc(cat.label) : '<span class="text-slate-300">—</span>'}</td>
          <td class="px-3 py-2.5 font-mono text-[11px] text-slate-600">${hzEsc(cuenta)}${s.default_account_id ? ' <span class="text-emerald-600" title="Cuenta asignada en el maestro">✓</span>' : ''}</td>
          <td class="px-3 py-2.5 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.default_currency === 'USD' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">${hzEsc(s.default_currency)}</span></td>
        </tr>`;
      }).join('');
      document.getElementById('hz-sup-empty').classList.toggle('hidden', rows.length > 0);
      document.getElementById('hz-sup-count').textContent = `${rows.length} de ${HZ_SUP.list.length} proveedores`;
      const btn = document.getElementById('hz-sup-btn-nuevo');
      btn.classList.toggle('ring-4', rows.length === 0 && !!q);
      btn.classList.toggle('ring-emerald-200', rows.length === 0 && !!q);
    }

    function hzSupSeleccionar(taxId) {
      const sup = HZ_SUP.list.find(s => s.tax_id === taxId);
      if (!sup) return;
      hzSupAplicarSeleccion(sup);
    }

    function hzSupAplicarSeleccion(sup) {
      HZ_SUP.selected = sup;
      hzSupCerrarBuscador();
      hzSupCerrarRegistro(true);
      const cfg = hzSupCfg();
      if (typeof cfg.onSelected === 'function') cfg.onSelected(sup);
    }

    // ---------- Transición buscador -> registro ----------
    function hzSupIrARegistro() {
      const q = (document.getElementById('hz-sup-search').value || '').trim();
      hzSupCerrarBuscador();
      hzSupAbrirRegistro(q);
    }

    function hzSupAbrirRegistro(prefill) {
      hzSupCerrarBuscador();
      const modal = document.getElementById('modalRegistroProveedor');
      // Reset de la ficha
      ['hzs-rtn', 'hzs-name', 'hzs-trade', 'hzs-email', 'hzs-phone', 'hzs-address', 'hzs-bank-acc', 'hzs-contact', 'hzs-web', 'hzs-notes'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
      document.getElementById('hzs-credit-days').value = 0;
      document.getElementById('hzs-credit-limit').value = 0;
      document.getElementById('hzs-bank').value = '';
      document.getElementById('hzs-bank-type').value = 'CHEQUES';
      document.getElementById('hzs-currency').value = 'HNL';
      document.getElementById('hzs-scope').value = 'LOCAL_HONDURAS';
      document.getElementById('hzs-category').value = 'MERCADERIA_INVENTARIO';
      ['hzs-ret-isr', 'hzs-ret-hon', 'hzs-ret-rent', 'hzs-ret-isv'].forEach(id => { const e = document.getElementById(id); if (e) e.checked = false; });
      hzSupPreimputacion('MERCADERIA_INVENTARIO');
      [2, 3].forEach(n => hzSupToggle(n, false));
      hzSupMostrarError('');
      document.getElementById('hzs-dup').classList.add('hidden');

      // Traslado automático de lo escrito en el buscador
      if (prefill) {
        const digits = prefill.replace(/\D/g, '');
        const letters = prefill.replace(/[\d\s\-.]/g, '');
        if (digits.length >= 1 && letters.length === 0) document.getElementById('hzs-rtn').value = digits.slice(0, 14);
        else document.getElementById('hzs-name').value = prefill;
      }
      hzSupValidarRTN(document.getElementById('hzs-rtn').value);
      modal.classList.remove('hidden');
      setTimeout(() => document.getElementById(document.getElementById('hzs-rtn').value ? 'hzs-name' : 'hzs-rtn').focus(), 50);
    }

    function hzSupVolverABuscador() {
      const q = document.getElementById('hzs-rtn').value || document.getElementById('hzs-name').value || '';
      hzSupCerrarRegistro(true);
      hzSupAbrirBuscador(q);
    }

    function hzSupCerrarRegistro(silent) { document.getElementById('modalRegistroProveedor').classList.add('hidden'); }

    function hzSupToggle(nivel, forceOpen) {
      const panel = document.getElementById(`hzs-n${nivel}`);
      const chev = document.getElementById(`hzs-chev-${nivel}`);
      if (!panel) return;
      const open = typeof forceOpen === 'boolean' ? forceOpen : panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !open);
      if (open) { panel.classList.add('hz-anim'); } else { panel.classList.remove('hz-anim'); }
      chev.classList.toggle('rotate-180', open);
    }

    function hzSupValidarRTN(val) {
      const clean = (val || '').replace(/\D/g, '');
      const badge = document.getElementById('hzs-rtn-badge');
      if (clean.length === 14) { badge.className = 'text-[10px] font-mono font-bold text-emerald-600 mb-1'; badge.textContent = '✓ 14/14 dígitos'; }
      else { badge.className = 'text-[10px] font-mono text-amber-600 mb-1'; badge.textContent = `${clean.length}/14 dígitos`; }
      const dup = document.getElementById('hzs-dup');
      const found = clean.length === 14 ? HZ_SUP.list.find(s => s.tax_id === clean) : null;
      if (found) {
        dup.classList.remove('hidden');
        dup.innerHTML = `<span>⚠️ Este RTN ya está registrado como <strong>${hzEsc(found.legal_name)}</strong>.</span>
          <button type="button" onclick="hzSupSeleccionar('${found.tax_id}')" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0">Seleccionar existente</button>`;
      } else { dup.classList.add('hidden'); }
    }

    function hzSupPreimputacion(cat) {
      const c = HZ_CATEGORIAS[cat] || HZ_CATEGORIAS.MERCADERIA_INVENTARIO;
      document.getElementById('hzs-pre-cuenta').textContent = c.cuenta;
      document.getElementById('hzs-pre-ret').textContent = c.ret;
      document.getElementById('hzs-ret-hon').checked = c.hon;
      document.getElementById('hzs-ret-rent').checked = c.rent;
    }

    function hzSupMostrarError(msg) {
      const e = document.getElementById('hzs-error');
      if (!msg) { e.classList.add('hidden'); e.textContent = ''; return; }
      e.textContent = msg;
      e.classList.remove('hidden');
    }

    async function hzSupGuardar() {
      const g = id => (document.getElementById(id)?.value || '').trim();
      const rtn = g('hzs-rtn').replace(/\D/g, '');
      const nombre = g('hzs-name');
      if (rtn.length !== 14) { hzSupMostrarError('El RTN debe contener exactamente 14 dígitos numéricos.'); document.getElementById('hzs-rtn').focus(); return; }
      if (!nombre) { hzSupMostrarError('Ingrese la razón social del proveedor.'); document.getElementById('hzs-name').focus(); return; }
      hzSupMostrarError('');

      const currency = g('hzs-currency') || 'HNL';
      const days = parseInt(g('hzs-credit-days') || '0', 10);
      const limit = parseFloat(g('hzs-credit-limit') || '0');
      const payload = {
        company_id: hzCompanyId(),
        tax_id: rtn,
        legal_name: nombre,
        trade_name: g('hzs-trade') || null,
        supplier_scope: g('hzs-scope') || 'LOCAL_HONDURAS',
        default_currency: currency,
        business_category: g('hzs-category') || 'MERCADERIA_INVENTARIO',
        email: g('hzs-email') || null,
        phone: g('hzs-phone') || null,
        address: g('hzs-address') || null,
        credit_days: isNaN(days) ? 0 : days,
        credit_limit: isNaN(limit) ? 0 : limit,
        bank_name: g('hzs-bank') || null,
        bank_account_type: g('hzs-bank-type') || 'CHEQUES',
        bank_account_number: g('hzs-bank-acc') || null,
        bank_currency: currency,
        contact_person: g('hzs-contact') || null,
        website: g('hzs-web') || null,
        notes: g('hzs-notes') || null,
        subject_to_isr_1_percent: !!document.getElementById('hzs-ret-isr').checked,
        subject_to_honorarios_12_5: !!document.getElementById('hzs-ret-hon').checked,
        subject_to_rent_10: !!document.getElementById('hzs-ret-rent').checked,
        is_isv_withholding_agent: !!document.getElementById('hzs-ret-isv').checked,
        is_active: true
      };

      const btn = document.getElementById('hzs-btn-guardar');
      btn.disabled = true; btn.classList.add('opacity-60');
      try {
        let saved = null;
        try {
          const r = await fetch('/api/v1/procurement/suppliers/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await r.json().catch(() => null);
          if (!r.ok) { hzSupMostrarError(hzFormatApiError(data, `No se pudo guardar el proveedor (HTTP ${r.status}).`)); return; }
          saved = hzSupNormalizar(data);
        } catch (netErr) {
          // Sin conexión con el backend: se conserva en memoria de la sesión y se marca como local.
          console.warn('Persistencia API no disponible; proveedor guardado solo en memoria local.', netErr);
          saved = hzSupNormalizar({ ...payload, _local: true });
          hzToast('<span>⚠️ Sin conexión con el servidor: proveedor guardado solo en esta sesión.</span>', 'warn');
        }
        HZ_SUP.list = HZ_SUP.list.filter(s => s.tax_id !== saved.tax_id);
        HZ_SUP.list.unshift(saved);
        hzSupAplicarSeleccion(saved);
        hzToast(`<span>✓ Proveedor registrado:</span><strong>${hzEsc(saved.legal_name)}</strong>`);
      } finally {
        btn.disabled = false; btn.classList.remove('opacity-60');
      }
    }

    document.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape') return;
      const reg = document.getElementById('modalRegistroProveedor');
      const bus = document.getElementById('modalBuscarProveedor');
      if (reg && !reg.classList.contains('hidden')) hzSupCerrarRegistro();
      else if (bus && !bus.classList.contains('hidden')) hzSupCerrarBuscador();
    });
    // ===================== FIN HZ: PROVEEDORES =====================

