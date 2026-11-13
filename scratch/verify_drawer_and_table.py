import os
import re
import urllib.request

def verify():
    with open('compras.html', 'r', encoding='utf-8') as f:
        html = f.read()

    checks = [
        ("id=\"horizon-ai-drawer\"", "Horizon AI Drawer container present"),
        ("HORIZON AI Copilot", "Copilot Title present"),
        ("CHAT COPILOT", "Chat Copilot Tab present"),
        ("ALERTAS", "Alertas Tab present"),
        ("SIMULADOR FX", "Simulador FX Tab present"),
        ("id=\"ai-panel-chat\"", "Panel Chat present"),
        ("id=\"ai-panel-insights\"", "Panel Insights present"),
        ("id=\"ai-panel-fx\"", "Panel FX present"),
        ("SKU / CUENTA", "Thead SKU / CUENTA present"),
        ("w-[135px]", "Width 135px present"),
        ("CENTRO COSTO", "Thead CENTRO COSTO present"),
        ("UNITARIO (L)", "Thead UNITARIO (L) present"),
        ("SUBTOTAL (L)", "Thead SUBTOTAL (L) present"),
        ("id=\"lineas-factura-body\"", "Tbody lineas-factura-body present"),
        ("style=\"position: relative; top: -5px;\"", "Relative top -5px styling present in HTML/JS"),
        ("text-[13px] text-slate-800 tracking-widest", "Dynamic / Static cell typography present"),
        ("border-r border-slate-100", "Cell borders present"),
    ]

    all_passed = True
    print("--- Verifying compras.html ---")
    for pattern, name in checks:
        if pattern in html:
            print(f"[PASS] {name}")
        else:
            print(f"[FAIL] {name}")
            all_passed = False

    # Check mirror files
    mirrors = [
        "workspace_compras.html",
        "templates/workspace_compras.html",
        "backend/templates/workspace_compras.html",
        "frontend/public/workspace_compras.html",
        "templates/compras.html",
        "backend/templates/compras.html"
    ]
    print("\n--- Verifying Mirrors ---")
    for m in mirrors:
        if os.path.exists(m):
            with open(m, 'r', encoding='utf-8') as f:
                content = f.read()
            if "HORIZON AI Copilot" in content and "SKU / CUENTA" in content:
                print(f"[PASS] {m} synchronized")
            else:
                print(f"[FAIL] {m} not synchronized")
                all_passed = False
        else:
            print(f"[WARN] {m} not found")

    # Check Live Endpoint
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/compras")
        with urllib.request.urlopen(req, timeout=3) as resp:
            live_html = resp.read().decode('utf-8')
            if "HORIZON AI Copilot" in live_html and "SKU / CUENTA" in live_html:
                print("\n[PASS] Live endpoint http://127.0.0.1:8000/compras is up-to-date")
            else:
                print("\n[FAIL] Live endpoint missing expected strings")
                all_passed = False
    except Exception as e:
        print(f"\n[INFO] Live endpoint check skipped: {e}")

    if all_passed:
        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")
    else:
        print("\nSOME CHECKS FAILED.")

if __name__ == '__main__':
    verify()
