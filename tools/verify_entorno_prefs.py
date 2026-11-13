with open('entorno_config.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'BLOQUE: CONFIGURACIÓN DE CUADRANTES' in line:
        for j in range(i-2, min(len(lines), i+45)):
            print(f"{j+1}: {lines[j].strip()[:100].encode('ascii', 'replace').decode('ascii')}")
        break
