import glob

for f in sorted(glob.glob('*.html')):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        c = fp.read()
    cnt = c.lower().count('gerencia')
    if cnt > 0:
        print(f"{f}: {cnt} matches")
        for i, line in enumerate(c.split('\n'), 1):
            if 'gerencia' in line.lower():
                print(f"  {i}: {line.strip()[:100].encode('ascii', 'replace').decode('ascii')}")
