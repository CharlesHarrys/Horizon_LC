with open('entorno_config.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

for i, line in enumerate(c.split('\n'), 1):
    if 'rolUsuarioSesion' in line:
        print(f"{i}: {line.strip()[:100].encode('ascii', 'replace').decode('ascii')}")
