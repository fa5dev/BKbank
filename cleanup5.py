# -*- coding: utf-8 -*-
import subprocess
import sys

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()
original = content

# Заменяем функцию startChartUpdates — убираем вызов startTGBridge
old = 'function startChartUpdates() { startTGBridge(); }'
new = 'function startChartUpdates() { /* startTGBridge удалено */ }'

count = content.count(old)
content = content.replace(old, new)
print(f'startChartUpdates: {count} замен')

# На всякий случай — убираем все оставшиеся startTGBridge
content = content.replace('startTGBridge();', '/* startTGBridge удалено */')
content = content.replace('await startTGBridge();', '/* startTGBridge удалено */')

if count == 0:
    print('❌ startChartUpdates не найден — проверь вручную')

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

result = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
if result.returncode != 0:
    print('❌ Синтаксис сломан — откат:')
    print(result.stderr)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(original)
    sys.exit(1)

print('✅ Синтаксис OK, startTGBridge удалён')
