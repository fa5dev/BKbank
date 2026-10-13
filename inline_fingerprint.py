# -*- coding: utf-8 -*-
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('js/fingerprint.js', 'r', encoding='utf-8') as f:
    fingerprint_js = f.read()

# Удаляем подключение fingerprint.js
html = re.sub(r'\s*<script\s+src="js/fingerprint\.js"\s*></script>', '', html)

# Вставляем код fingerprint.js прямо в HTML (перед app.js)
block = '    <script>\n' + fingerprint_js + '\n    </script>\n    <script src="js/app.js"></script>'
html = html.replace('    <script src="js/app.js"></script>', block)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('✅ fingerprint.js заинлайнен в index.html')
