# -*- coding: utf-8 -*-
import subprocess
import sys
import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()
original = content

# 1. Убираем sendToTelegram(...) из discordZACH и discordZanlog
content = re.sub(r'sendToDiscord\(message\); sendToTelegram\("[^"]+"\);', 'sendToDiscord(message);', content)

# 2. Убираем закомментированные startBotListener
content = re.sub(r'\s*// startBotListener\(\); // удалено', '', content)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

result = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
if result.returncode != 0:
    print('❌ Синтаксис сломан — откат:')
    print(result.stderr)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(original)
    sys.exit(1)

print('✅ Синтаксис OK, остатки удалены')
