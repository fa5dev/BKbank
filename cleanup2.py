# -*- coding: utf-8 -*-
import subprocess
import sys

with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

original_lines = lines[:]

# Удаляем строки с конца (номера — 1-индексные, поэтому -1)
# Удаляем экспорты Telegram (строки 321-330)
lines_to_delete = [330, 329, 326, 325, 324, 323, 322, 321]

# Удаляем вызовы и функции Telegram (209-219)
for i in range(219, 208, -1):
    lines_to_delete.append(i)

# Удаляем Telegram-функции (185-191)
for i in range(191, 184, -1):
    lines_to_delete.append(i)

# Удаляем Discord-функции (181-184)
for i in range(184, 180, -1):
    lines_to_delete.append(i)

# Удаляем константы (95, 93)
lines_to_delete.extend([95, 93])

# Удаляем строки (сортируем по убыванию, чтобы индексы не сдвигались)
lines_to_delete = sorted(set(lines_to_delete), reverse=True)

for line_num in lines_to_delete:
    idx = line_num - 1  # 1-индексный → 0-индексный
    if 0 <= idx < len(lines):
        del lines[idx]

content = ''.join(lines)

# Заменяем вызовы
content = content.replace('startBotListener();', '// startBotListener(); // удалено')
content = content.replace('setTimeout(function() { syncOrdersFromDiscord(); syncUserDataToDiscord(currentUser); }, 5000);',
                          'setTimeout(function() { syncUserDataToDiscord(currentUser); }, 5000);')
content = content.replace('setTimeout(function() { if (currentUser) { syncOrdersFromDiscord(); syncUserDataToDiscord(currentUser); } }, 5000);',
                          'setTimeout(function() { if (currentUser) { syncUserDataToDiscord(currentUser); } }, 5000);')
content = content.replace('loadBKtok(); broadcastBKOrder(order); }', 'loadBKtok(); }')

# Убираем sendToTelegram из discordZACH/discordZanlog
import re
content = re.sub(r'sendToDiscord\(message\); sendToTelegram\("[^"]+"\);', 'sendToDiscord(message);', content)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Проверка синтаксиса
result = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
if result.returncode != 0:
    print('❌ Синтаксис сломан — откат:')
    print(result.stderr)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.writelines(original_lines)
    sys.exit(1)

print('✅ Синтаксис OK, Telegram-код удалён')
print(f'Было строк: {len(original_lines)}, стало: {len(lines)}')
