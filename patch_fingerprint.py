# -*- coding: utf-8 -*-
import subprocess
import sys

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()
original = content

changes = 0

# Патч 1: nextRegStep — проверка canRegister
old1 = "function nextRegStep() { const errorEl = document.getElementById('registerError');"
new1 = "function nextRegStep() { const errorEl = document.getElementById('registerError'); if (window.BKFingerprint) { const chk = window.BKFingerprint.canRegister(); if (!chk.ok) { return showError(errorEl, chk.reason); } }"
c1 = content.count(old1)
content = content.replace(old1, new1)
print(f'nextRegStep: {c1}')
changes += c1

# Патч 2: completeRegistration — проверка canRegister после CAPTCHA
old2 = "if (parseInt(captcha) !== captchaAnswer) return showError(errorEl, 'Неверный ответ');"
new2 = "if (parseInt(captcha) !== captchaAnswer) return showError(errorEl, 'Неверный ответ'); if (window.BKFingerprint) { const chk = window.BKFingerprint.canRegister(); if (!chk.ok) return showError(errorEl, chk.reason); }"
c2 = content.count(old2)
content = content.replace(old2, new2)
print(f'completeRegistration: {c2}')
changes += c2

# Патч 3: finishRegistrationAfterVerify — markDeviceRegistered
old3 = "secureSetItem('bankUsers', users); realSetItem('dataKey_' + username, encryptedDataKey);"
new3 = "secureSetItem('bankUsers', users); if (window.BKFingerprint) { try { window.BKFingerprint.markDeviceRegistered(username); } catch(e) { console.error('markDeviceRegistered error:', e); } } realSetItem('dataKey_' + username, encryptedDataKey);"
c3 = content.count(old3)
content = content.replace(old3, new3)
print(f'finishRegistrationAfterVerify: {c3}')
changes += c3

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

print('✅ Синтаксис OK, патч применён')
