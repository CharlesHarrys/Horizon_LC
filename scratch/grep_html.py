import re
import sys

pat = re.compile(sys.argv[2], re.I)
with open(sys.argv[1], "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if pat.search(line):
            print(f"{i}: {line.strip()[:170]}")
