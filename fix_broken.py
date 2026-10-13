# -*- coding: utf-8 -*-
import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Исправляем: "function // sendTelegramReply(" → "function sendTelegramReply("
# и то же для sendToTelegram, sendTelegramMessage
fixes = [
    ('function // sendTelegramReply', 'function sendTelegramReply'),
    ('function // sendTelegramMessage', 'function sendTelegramMessage'),
    ('function // sendToTelegram', 'function sendToTelegram'),
    ('async function // sendTelegramReply', 'async function sendTelegramReply'),
    ('async function // sendTelegramMessage', 'async function sendTelegramMessage'),
    ('async function // sendToTelegram', 'async function sendToTelegram'),
]

count = 0
for old, new in fixes:
    c = content.count(old)
    content = content.replace(old, new)
    if c > 0:
        print(f'✅ Исправлено: {old} → {new} ({c})')
        count += c

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Всего исправлено: {count}')
