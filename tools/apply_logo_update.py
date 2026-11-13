import os
import re
import glob
import shutil

LOGO_HTML = """<div class="flex items-center gap-2.5 select-none cursor-pointer group">
          <!-- Isotipo: Eclipse / Sol Negro Naciente -->
          <div class="w-10 h-10 rounded-xl bg-[#f5f5f5] border border-[#e8e6e5] shadow-2xs flex items-center justify-center shrink-0 p-1 group-hover:border-[#3ba6f1]/60 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
              <!-- Corona de Fotones Cian (Arco exterior) -->
              <path d="M4.5 13.5C4.5 9.35786 7.85786 6 12 6C16.1421 6 19.5 9.35786 19.5 13.5" stroke="#3ba6f1" stroke-width="2.2" stroke-linecap="round"></path>
              <!-- Singularidad Central (Semiesfera negra sobre el horizonte) -->
              <path d="M7 13.5C7 10.7386 9.23858 8.5 12 8.5C14.7614 8.5 17 10.7386 17 13.5H7Z" fill="#0f172a"></path>
              <!-- Horizonte de Sucesos (Plano ecuatorial) -->
              <path d="M2 13.5H22" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"></path>
              <!-- Destello de Acreción Central en Cian -->
              <path d="M6 16.5H18" stroke="#3ba6f1" stroke-width="2" stroke-linecap="round"></path>
              <!-- Eco Gravitacional Inferior -->
              <path d="M9.5 19H14.5" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"></path>
            </svg>
          </div>
          <!-- Wordmark tipográfico -->
          <div class="flex flex-col leading-none" style="font-family: 'Inter', sans-serif;">
            <div class="flex items-center gap-1">
              <span class="text-[16px] font-extrabold tracking-tight text-slate-900 uppercase">HORIZON</span>
              <span class="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#3ba6f1]/15 text-[#0284c7] tracking-wider">LC</span>
            </div>
            <span class="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">SYSTEM ANALYTICS</span>
          </div>
        </div>"""

LOGO_HTML_BORDER_R = """<div class="flex items-center gap-2.5 select-none cursor-pointer group border-r border-slate-200 pr-4" onclick="window.location.href='workspace_lobby.html'">
      <!-- Isotipo: Eclipse / Sol Negro Naciente -->
      <div class="w-10 h-10 rounded-xl bg-[#f5f5f5] border border-[#e8e6e5] shadow-2xs flex items-center justify-center shrink-0 p-1 group-hover:border-[#3ba6f1]/60 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
          <!-- Corona de Fotones Cian (Arco exterior) -->
          <path d="M4.5 13.5C4.5 9.35786 7.85786 6 12 6C16.1421 6 19.5 9.35786 19.5 13.5" stroke="#3ba6f1" stroke-width="2.2" stroke-linecap="round"></path>
          <!-- Singularidad Central (Semiesfera negra sobre el horizonte) -->
          <path d="M7 13.5C7 10.7386 9.23858 8.5 12 8.5C14.7614 8.5 17 10.7386 17 13.5H7Z" fill="#0f172a"></path>
          <!-- Horizonte de Sucesos (Plano ecuatorial) -->
          <path d="M2 13.5H22" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"></path>
          <!-- Destello de Acreción Central en Cian -->
          <path d="M6 16.5H18" stroke="#3ba6f1" stroke-width="2" stroke-linecap="round"></path>
          <!-- Eco Gravitacional Inferior -->
          <path d="M9.5 19H14.5" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"></path>
        </svg>
      </div>
      <!-- Wordmark tipográfico -->
      <div class="flex flex-col leading-none" style="font-family: 'Inter', sans-serif;">
        <div class="flex items-center gap-1">
          <span class="text-[16px] font-extrabold tracking-tight text-slate-900 uppercase">HORIZON</span>
          <span class="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#3ba6f1]/15 text-[#0284c7] tracking-wider">LC</span>
        </div>
        <span class="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">SYSTEM ANALYTICS</span>
      </div>
    </div>"""

LOBBY_LOGO_HTML = """<!-- Logo / Isotipo Horizon LC -->
        <a href="workspace_lobby.html" class="flex items-center gap-2.5 pl-1 shrink-0 select-none group" title="Horizon LC - System Analytics">
          <!-- Isotipo: Eclipse / Sol Negro Naciente -->
          <div class="w-10 h-10 rounded-xl bg-[#f5f5f5] border border-[#e8e6e5] shadow-2xs flex items-center justify-center shrink-0 p-1 group-hover:border-[#3ba6f1]/60 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
              <!-- Corona de Fotones Cian (Arco exterior) -->
              <path d="M4.5 13.5C4.5 9.35786 7.85786 6 12 6C16.1421 6 19.5 9.35786 19.5 13.5" stroke="#3ba6f1" stroke-width="2.2" stroke-linecap="round"></path>
              <!-- Singularidad Central (Semiesfera negra sobre el horizonte) -->
              <path d="M7 13.5C7 10.7386 9.23858 8.5 12 8.5C14.7614 8.5 17 10.7386 17 13.5H7Z" fill="#0f172a"></path>
              <!-- Horizonte de Sucesos (Plano ecuatorial) -->
              <path d="M2 13.5H22" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"></path>
              <!-- Destello de Acreción Central en Cian -->
              <path d="M6 16.5H18" stroke="#3ba6f1" stroke-width="2" stroke-linecap="round"></path>
              <!-- Eco Gravitacional Inferior -->
              <path d="M9.5 19H14.5" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"></path>
            </svg>
          </div>
          <!-- Wordmark tipográfico -->
          <div class="flex flex-col leading-none" style="font-family: 'Inter', sans-serif;">
            <div class="flex items-center gap-1">
              <span class="text-[16px] font-extrabold tracking-tight text-slate-900 uppercase">HORIZON</span>
              <span class="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#3ba6f1]/15 text-[#0284c7] tracking-wider">LC</span>
            </div>
            <span class="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">SYSTEM ANALYTICS</span>
            <span id="lobby-company-name" class="hidden">Horizon Ledger</span>
            <span id="lobby-company-rtn" class="hidden"></span>
          </div>
        </a>"""

def update_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping missing: {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    original = content

    if 'Corona de Fotones Cian' in content:
        return False

    if 'logistica_general' in filepath:
        m = re.search(r'<!-- Logo Horizon LC -->\s*<div class="flex items-center gap-2\.5">.*?HL.*?LOG[IÍ]STICA &amp; CADENA DE SUMINISTRO.*?</div>\s*</div>', content, re.DOTALL)
        if m:
            content = content[:m.start()] + '<!-- Logo Horizon LC -->\n        ' + LOGO_HTML + content[m.end():]
            print(f"Updated logistica logo in {filepath}")

    elif 'lobby' in filepath or filepath.endswith('dashboard.html'):
        pat = r'<a href="/" class="flex items-center gap-2\.5 pl-1 shrink-0 hover:opacity-85 transition-opacity" title="Horizon Ledger ERP - Dashboard Principal">.*?</a>'
        m = re.search(pat, content, re.DOTALL)
        if m:
            content = content[:m.start()] + LOBBY_LOGO_HTML + content[m.end():]
            print(f"Updated lobby logo in {filepath}")

    if 'cxp' in filepath or 'libro_compras_ledger' in filepath:
        pat = r'<div class="flex items-center gap-2">\s*<span class="w-6 h-6 rounded-(?:lg|md) bg-slate-900 text-white font-black text-xs.*?HL.*?HORIZON LEDGER CORE.*?</div>\s*</div>'
        m = re.search(pat, content, re.DOTALL)
        if m:
            content = content[:m.start()] + LOGO_HTML + content[m.end():]
            print(f"Updated cxp/ledger logo in {filepath}")

    pat_erp = r'(?:<!-- Identidad del ERP -->\s*)?<div class="flex items-center gap-2 border-r border-slate-200 pr-4">\s*<div class="w-6 h-6 rounded-lg bg-slate-950 flex items-center justify-center text-white font-black text-\[10px\]">\s*HL\s*</div>\s*<div class="flex flex-col leading-none">\s*<span class="font-extrabold text-xs tracking-tight text-slate-950">Horizon Ledger</span>\s*<span class="text-\[8\.5px\] font-mono uppercase text-slate-400 font-bold">ERP</span>\s*</div>\s*</div>'
    m_erp = re.search(pat_erp, content, re.DOTALL)
    if m_erp:
        content = content[:m_erp.start()] + '<!-- Identidad del ERP / Logo Horizon LC -->\n    ' + LOGO_HTML_BORDER_R + content[m_erp.end():]
        print(f"Updated standard ERP logo in {filepath}")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Sync modified root files directly into templates and backend/templates
root_files_to_sync = [
    ('workspace_logistica_general.html', ['templates/workspace_logistica_general.html', 'backend/templates/workspace_logistica_general.html']),
    ('workspace_lobby.html', ['templates/workspace_lobby.html', 'backend/templates/workspace_lobby.html']),
    ('workspace_ventas.html', ['templates/workspace_ventas.html', 'templates/ventas.html', 'backend/templates/workspace_ventas.html', 'backend/templates/ventas.html']),
    ('workspace_contabilidad.html', ['templates/contabilidad.html', 'backend/templates/contabilidad.html']),
    ('workspace_bancos.html', ['templates/bancos.html', 'backend/templates/bancos.html']),
    ('workspace_cxc.html', ['templates/workspace_cxc.html', 'backend/templates/workspace_cxc.html']),
    ('workspace_cxp.html', ['templates/workspace_cxp.html', 'templates/cxp.html', 'backend/templates/workspace_cxp.html', 'backend/templates/cxp.html']),
    ('workspace_cartera.html', ['templates/cartera.html', 'backend/templates/cartera.html']),
    ('workspace_estados_financieros.html', ['templates/estados_financieros.html', 'backend/templates/estados_financieros.html']),
    ('workspace_libros_fiscales.html', ['templates/libros_fiscales.html', 'backend/templates/libros_fiscales.html']),
    ('libro_compras_ledger.html', ['templates/libro_compras_ledger.html', 'backend/templates/libro_compras_ledger.html']),
    ('workspace_produccion.html', ['templates/produccion.html', 'backend/templates/produccion.html']),
    ('workspace_proveedores_estados_cuenta.html', ['templates/proveedores_estados_cuenta.html', 'backend/templates/proveedores_estados_cuenta.html']),
    ('workspace_proyecciones.html', ['templates/proyecciones.html', 'backend/templates/proyecciones.html']),
    ('compras.html', ['templates/compras.html', 'templates/workspace_compras.html', 'backend/templates/compras.html', 'backend/templates/workspace_compras.html']),
    ('entorno_config.html', ['templates/entorno_config.html', 'backend/templates/entorno_config.html']),
]

for src, destinations in root_files_to_sync:
    if os.path.exists(src):
        for dst in destinations:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            print(f"Synced {src} -> {dst}")

for td in ['templates', 'backend/templates']:
    for f in glob.glob(os.path.join(td, '*.html')):
        update_file(f)

print("ALL TEMPLATES SYNCED AND UPDATED.")
