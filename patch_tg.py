# -*- coding: utf-8 -*-
import subprocess
import sys

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()
original = content

# Заменяем все вызовы startBotListener() на закомментированные
count = content.count('startBotListener();')
content = content.replace('startBotListener();', '// startBotListener(); // отключено: используем Discord')

print(f'startBotListener() закомментировано: {count}')

if count == 0:
    print('❌ Ничего не заменено')
    sys.exit(1)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Проверка синтаксиса
result = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
if result.returncode != 0:
    print('❌ Синтаксис сломан — откат:')
    print(result.stderr)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(original)
    sys.exit(1)

print('✅ Синтаксис OK, Telegram-опрос отключён')
