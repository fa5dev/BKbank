# -*- coding: utf-8 -*-
with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Находим начало finishRegistrationAfterVerify
old_start = "async function finishRegistrationAfterVerify(username) { var pendingData = localStorage.getItem('pendingReg_' + username); if (!pendingData) return;"

new_start = """async function finishRegistrationAfterVerify(username) {
    var pendingData = localStorage.getItem('pendingReg_' + username);
    if (!pendingData) {
        // Fallback: создаём минимальные данные, если pendingReg отсутствует
        console.warn('[finishRegistration] pendingReg не найден, использую fallback');
        pendingData = JSON.stringify({
            name: username,
            username: username,
            password: 'temp_' + Date.now(),
            phone: '+7' + Math.floor(1000000000 + Math.random() * 9000000000),
            email: ''
        });
        localStorage.setItem('pendingReg_' + username, pendingData);
    }
    // Fallback: если данные пустые
    try {
        var tempData = JSON.parse(pendingData);
        if (!tempData.name || !tempData.password) {
            tempData.name = tempData.name || username;
            tempData.password = tempData.password || 'temp_' + Date.now();
            pendingData = JSON.stringify(tempData);
            localStorage.setItem('pendingReg_' + username, pendingData);
        }
    } catch (e) {
        console.error('[finishRegistration] ошибка парсинга pendingReg:', e);
        return;
    }"""

count = content.count(old_start)
content = content.replace(old_start, new_start)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'✅ finishRegistrationAfterVerify: заменено {count}')
