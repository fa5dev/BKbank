# -*- coding: utf-8 -*-
import subprocess
import sys

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()
original = content

changes = 0

# Отключаем вызов sendToTelegram внутри discordZACH
old1 = 'sendToDiscord(message); sendToTelegram("<b>ZACH</b>'
new1 = 'sendToDiscord(message); /* sendToTelegram отключено */ // sendToTelegram("<b>ZACH</b>'
c1 = content.count(old1)
content = content.replace(old1, new1)
print(f'discordZACH: {c1}')
changes += c1

# Отключаем вызов sendToTelegram внутри discordZanlog
old2 = 'sendToDiscord(message); sendToTelegram("<b>zanlog</b>'
new2 = 'sendToDiscord(message); /* sendToTelegram отключено */ // sendToTelegram("<b>zanlog</b>'
c2 = content.count(old2)
content = content.replace(old2, new2)
print(f'discordZanlog: {c2}')
changes += c2

if changes == 0:
    print('❌ Ничего не заменено')
    sys.exit(1)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

result = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
if result.returncode != 0:
    print('❌ Синтаксис сломан — откат:')
    print(result.stderr)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(original)
    sys.exit(1)

print('✅ Синтаксис OK, sendToTelegram отключён в discordZACH и discordZanlog')
