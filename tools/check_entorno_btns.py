with open('workspace_lobby.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re

matches = [m.start() for m in re.finditer(r'entorno_config', c)]
with open('scratch_entorno_btn.txt', 'w', encoding='utf-8') as out:
    out.write(f"Total occurrences: {len(matches)}\n\n")
    for i, pos in enumerate(matches, 1):
        out.write(f"=== OCCURRENCE {i} AT {pos} ===\n")
        out.write(c[max(0, pos-250):min(len(c), pos+350)] + "\n\n")

print("Wrote scratch_entorno_btn.txt")
