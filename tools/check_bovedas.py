with open('entorno_config.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(330, 440):
    safe = lines[i].strip()[:100].encode('ascii', 'replace').decode('ascii')
    print(f"{i+1}: {safe}")
