import os

dirs = ['.', 'templates', 'backend/templates', 'frontend/public', 'frontend']
for d in dirs:
    if os.path.exists(d):
        files = [f for f in os.listdir(d) if f.endswith('.html')]
        print(f"=== {d} ===")
        for f in sorted(files):
            p = os.path.join(d, f)
            print(f"  {f} ({os.path.getsize(p)} bytes)")
