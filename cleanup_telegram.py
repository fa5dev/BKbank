# -*- coding: utf-8 -*-
import subprocess
import sys
import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()
original = content

# 1. Удаляем константы Telegram
content = re.sub(r'\s*const TG_TOKEN_PASSWORD_ENCRYPTED = "[^"]+";', '', content)
content = re.sub(r'\s*const TG_BOT_TOKEN_ENCRYPTED = "[^"]+";', '', content)
content = re.sub(r'\s*const TG_ADMIN_ID_ENCRYPTED = "[^"]+";', '', content)
content = re.sub(r'\s*const TG_LOG_CHANNEL_ENCRYPTED = "[^"]+";', '', content)

# 2. Удаляем функции Telegram (по паттерну "function getTGPassword" до закрывающей "}")
for func in ['getTGPassword', 'getTelegramToken', 'getTelegramAdminID', 'getTelegramChannelID',
             'sendToTelegram', 'sendTelegramReply', 'sendTelegramMessage',
             'startBotListener', 'checkBotForVerify', 'startTGBridge', 'listenTGBridge',
             'decryptBKPayload', 'encryptBKPayload', 'broadcastBKOrder', 'broadcastChatMessage',
             'loadOrdersFromDiscord', 'syncOrdersFromDiscord']:
    pattern = r'\s*function ' + func + r'\s*\([^)]*\)\s*\{[^}]*\}'
    content = re.sub(pattern, '', content, count=1)
    pattern2 = r'\s*async function ' + func + r'\s*\([^)]*\)\s*\{[^}]*\}'
    content = re.sub(pattern2, '', content, count=1)

# 3. Удаляем setInterval для syncOrdersFromDiscord
content = re.sub(r'\s*setInterval\(function\(\) \{ if \(currentUser && UI\.currentSection === \'bktok\'\) \{ syncOrdersFromDiscord\(\); \} \}, 30000\);', '', content)

# 4. Закомментируем startBotListener()
content = content.replace('startBotListener();', '// startBotListener(); // удалено')

# 5. Убираем syncOrdersFromDiscord() из setTimeout
content = content.replace('setTimeout(function() { syncOrdersFromDiscord(); syncUserDataToDiscord(currentUser); }, 5000);',
                          'setTimeout(function() { syncUserDataToDiscord(currentUser); }, 5000);')
content = content.replace('setTimeout(function() { if (currentUser) { syncOrdersFromDiscord(); syncUserDataToDiscord(currentUser); } }, 5000);',
                          'setTimeout(function() { if (currentUser) { syncUserDataToDiscord(currentUser); } }, 5000);')

# 6. Убираем broadcastBKOrder(order) из createOrder
content = content.replace('loadBKtok(); broadcastBKOrder(order); }', 'loadBKtok(); }')

# 7. Убираем sendToTelegram из discordZACH / discordZanlog
content = re.sub(r'sendToDiscord\(message\); sendToTelegram\("[^"]+"\);', 'sendToDiscord(message);', content)

# 8. Удаляем экспорты Telegram в window
for line in ['window.startBotListener = startBotListener;',
             'window.sendToTelegram = sendToTelegram;',
             'window.getTelegramToken = getTelegramToken;',
             'window.getTelegramChannelID = getTelegramChannelID;',
             'window.getTelegramAdminID = getTelegramAdminID;',
             'window.getTGPassword = getTGPassword;',
             'window.sendTelegramMessage = sendTelegramMessage;',
             'window.checkBotForVerify = checkBotForVerify;']:
    content = content.replace(line, '')

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

print('✅ Синтаксис OK, Telegram-код удалён')
