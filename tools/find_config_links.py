with open('workspace_lobby.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Find all onclick or href that mention config or gerencia
for i, line in enumerate(c.split('\n'), 1):
    if any(k in line.lower() for k in ['entorno', 'config', 'geren']):
        safe = line.strip()[:100].encode('ascii', 'replace').decode('ascii')
        print(f"{i}: {safe}")
