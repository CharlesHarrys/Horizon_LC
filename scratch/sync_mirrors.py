import os
import shutil

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
        print(f"Synced: {m}")
