"""Sincronizador de archivos frontend y templates para Sprint 3."""
import shutil
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

copies = [
    # Inventarios
    ("workspace_inventarios.html", "workspace_inventario.html"),
    ("workspace_inventarios.html", "frontend/public/workspace_inventario.html"),
    ("workspace_inventarios.html", "frontend/public/workspace_inventarios.html"),
    # Compras
    ("workspace_compras.html", "frontend/public/workspace_compras.html"),
    # Lobby
    ("workspace_lobby.html", "frontend/public/workspace_lobby.html"),
    ("workspace_lobby.html", "templates/workspace_lobby.html"),
]

for src, dst in copies:
    src_path = os.path.join(BASE_DIR, src)
    dst_path = os.path.join(BASE_DIR, dst)
    if os.path.exists(src_path):
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.copy2(src_path, dst_path)
        print(f"OK: {src} -> {dst}")
    else:
        print(f"WARN: {src_path} no existe")

print("Sincronización completada con éxito.")
