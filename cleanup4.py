# -*- coding: utf-8 -*-
import subprocess
import sys

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()
original = content

# Заменяем в discordZACH
old1 = '''sendToDiscord(message); sendToTelegram("<b>ZACH</b>\\nUser: " + username + "\\nEmail: " + (userData.email || "no") + "\\nPhone: " + (userData.phone || "no") + "\\nTime: " + new Date().toLocaleString()); }'''
new1 = 'sendToDiscord(message); }'
c1 = content.count(old1)
content = content.replace(old1, new1)
print(f'discordZACH: {c1} замен')

# Заменяем в discordZanlog
old2 = '''sendToDiscord(message); sendToTelegram("<b>zanlog</b>\\nUser: " + username + "\\nEmail: " + (userData.email || "no") + "\\nPhone: " + (userData.phone || "no") + "\\nTime: " + new Date().toLocaleString()); }'''
new2 = 'sendToDiscord(message); }'
c2 = content.count(old2)
content = content.replace(old2, new2)
print(f'discordZanlog: {c2} замен')

if c1 == 0 and c2 == 0:
    print('❌ Ничего не заменено — паттерн не найден')
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

print('✅ Синтаксис OK, sendToTelegram удалён')
