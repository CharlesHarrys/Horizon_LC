with open('entorno_config.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re
import subprocess

scripts = re.findall(r'<script>(.*?)</script>', c, re.DOTALL)
print(f"Total script blocks: {len(scripts)}")

for i, s in enumerate(scripts):
    fname = f"scratch_test_script_{i}.js"
    with open(fname, 'w', encoding='utf-8') as sf:
        sf.write(s)
    # Check syntax with node if available
    try:
        res = subprocess.run(["node", "-c", fname], capture_output=True, text=True)
        print(f"Script {i} node check: code={res.returncode}")
        if res.returncode != 0:
            print(f"  STDERR: {res.stderr}")
    except Exception as e:
        print(f"Node not available: {e}")
