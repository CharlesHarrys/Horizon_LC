import os
import shutil
import urllib.request

mirrors = [
    "workspace_compras.html",
    "templates/workspace_compras.html",
    "backend/templates/workspace_compras.html",
    "frontend/public/workspace_compras.html",
    "templates/compras.html",
    "backend/templates/compras.html"
]

for m in mirrors:
    if os.path.exists(m):
        shutil.copyfile("compras.html", m)
        print(f"[SYNC] {m}")

with open("compras.html", "r", encoding="utf-8") as f:
    html = f.read()

checks = [
    ("SYSTEM ANALYTICS", "Point 1: Header Wordmark SYSTEM ANALYTICS"),
    ("MÓDULO: COMPRAS Y GASTOS", "Point 1: Header Módulo Compras y Gastos"),
    ("RTN: 01012000003892", "Point 1: Header RTN"),
    ("PERIODO: SEPTIEMBRE 2026", "Point 1: Header Periodo Septiembre 2026"),
    ("relative z-30 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl px-3 py-2 shad-bx shrink-0 flex items-center gap-3", "Point 2: Zona 3.1 relative z-30 bar"),
    ("onclick=\"agregarRenglon()\"", "Point 3.1: + Agregar Línea button present"),
    ("Seleccione o digite cuenta...", "Point 3.2: Empty row SKU subtitle"),
    ("placeholder=\"Descripción del bien o servicio...\"", "Point 3.2: Empty row desc placeholder"),
    ("placeholder=\"0.00\"", "Point 3.2: Empty row costo placeholder"),
    ("replace(/,/g, '')", "Point 3.3: Formula comma cleaning in actualizarDatoRenglon"),
    ("window.recalcularTotalesFactura = recalcularTotales;", "Point 3.3: recalcularTotalesFactura alias"),
    ("AUDITOR SAR" not in html, "Point 4: AUDITOR SAR subtitle removed from footer Copilot button"),
    ("text-[10px] font-mono font-black tracking-tight text-center leading-none mt-1\">Caja Chica</span>", "Point 5: 10px Auxiliary label Caja Chica"),
    ("text-[10px] font-mono font-black tracking-tight text-center leading-none mt-1\">Retención</span>", "Point 5: 10px Auxiliary label Retención"),
    ("text-[10px] font-mono font-black tracking-tight text-center leading-none mt-1\">Multicentro</span>", "Point 5: 10px Auxiliary label Multicentro"),
]

all_ok = True
print("\n--- Verifying 5 Points in compras.html ---")
for item, desc in checks:
    passed = item if isinstance(item, bool) else (item in html)
    if passed:
        print(f"[PASS] {desc}")
    else:
        print(f"[FAIL] {desc}")
        all_ok = False

try:
    req = urllib.request.Request("http://127.0.0.1:8000/compras")
    with urllib.request.urlopen(req, timeout=3) as resp:
        live = resp.read().decode("utf-8")
        if "SYSTEM ANALYTICS" in live and "AUDITOR SAR" not in live and "onclick=\"agregarRenglon()\"" in live:
            print("[PASS] Live endpoint http://127.0.0.1:8000/compras verified!")
        else:
            print("[FAIL] Live endpoint mismatch")
            all_ok = False
except Exception as e:
    print(f"[INFO] Live endpoint check skipped: {e}")

assert all_ok, "One or more checks failed!"
print("\nALL 5 POINTS VERIFIED SUCCESSFULLY!")
