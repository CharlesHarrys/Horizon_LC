with open('entorno_config.html', 'r', encoding='utf-8') as f:
    c = f.read()

import re
pos = c.find('function ingresarANivel(')
print('pos of ingresarANivel:', pos)
if pos != -1:
    print(c[pos:pos+1500])
