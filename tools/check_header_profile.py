with open('workspace_lobby.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(480, min(580, len(lines))):
    safe = lines[i].strip()[:100].encode('ascii', 'replace').decode('ascii')
    print(f"{i+1}: {safe}")
