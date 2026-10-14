// ============================================================================
// js/recovery.js — Восстановление пароля через резервный код
// ============================================================================
(function () {
    'use strict';

    function generateRecoveryCode() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var parts = [];
        for (var p = 0; p < 3; p++) {
            var part = '';
            for (var i = 0; i < 4; i++) {
                part += chars[Math.floor(Math.random() * chars.length)];
            }
            parts.push(part);
        }
        return parts.join('-');
    }

    function hashRecoveryCode(code) {
        var clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return CryptoJS.SHA256('RECOVERY_' + clean).toString();
    }

    function showRecoveryCodeModal(username, code) {
        if (typeof UI !== 'undefined') UI.closeAllModals();

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'modal-overlay';
        document.body.appendChild(overlay);

        var modal = document.createElement('div');
        modal.className = 'modal-form';
        modal.innerHTML = `
            <div class="form-title">Резервный код</div>
            <p style="text-align:center; margin:15px 0; color:#FF5E5E; font-weight:700;">Сохраните этот код!</p>
            <p style="text-align:center; color:#888; font-size:0.9rem; margin-bottom:20px;">Он понадобится для восстановления пароля. Мы не сможем его восстановить.</p>
            <div style="text-align:center; background:rgba(255,215,0,0.1); border:2px dashed #FFD700; border-radius:16px; padding:20px; margin:15px 0;">
                <div style="font-size:2rem; font-weight:800; letter-spacing:4px; color:#FFD700; font-family:monospace;">${code}</div>
                <button class="gold-button" style="margin-top:15px; width:auto; padding:8px 20px; font-size:0.9rem;" onclick="navigator.clipboard.writeText('${code}'); if(typeof showToast==='function') showToast('Код скопирован', 'success');">Скопировать код</button>
            </div>
            <p style="text-align:center; color:#888; font-size:0.85rem;">Пользователь: <b>${username}</b></p>
            <button class="gold-button" onclick="window.closeRecoveryModal()">Я сохранил код</button>
        `;

        document.body.appendChild(modal);
    }

    function closeRecoveryModal() {
        if (typeof UI !== 'undefined') UI.closeAllModals();
        document.querySelectorAll('.modal-overlay').forEach(function(el) { el.remove(); });
        document.querySelectorAll('.modal-form').forEach(function(el) { el.remove(); });
        document.body.style.overflow = 'auto';
    }

    function showForgotPasswordModal() {
        if (typeof UI !== 'undefined') UI.closeAllModals();

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'modal-overlay';
        document.body.appendChild(overlay);

        var modal = document.createElement('div');
        modal.className = 'modal-form';
        modal.innerHTML = `
            <div class="form-title">Восстановление пароля</div>
            <p style="text-align:center; color:#888; font-size:0.9rem; margin-bottom:20px;">Введите логин и резервный код, который вы сохранили при регистрации.</p>
            <div id="recoveryError" class="error-text hidden"></div>
            <input id="recoveryUsername" class="form-input" placeholder="Логин (никнейм)">
            <input id="recoveryCode" class="form-input" placeholder="Резервный код" style="font-family:monospace; letter-spacing:2px;">
            <input type="password" id="recoveryNewPassword" class="form-input" placeholder="Новый пароль (мин. 6 символов)">
            <input type="password" id="recoveryConfirmPassword" class="form-input" placeholder="Подтвердите новый пароль">
            <button class="gold-button" onclick="window.BKRecovery.resetPassword()">Сбросить пароль</button>
            <button class="dark-button" onclick="window.closeRecoveryModal()">Отмена</button>
        `;

        document.body.appendChild(modal);
    }

    async function resetPassword() {
        var usernameEl = document.getElementById('recoveryUsername');
        var codeEl = document.getElementById('recoveryCode');
        var newPassEl = document.getElementById('recoveryNewPassword');
        var confirmEl = document.getElementById('recoveryConfirmPassword');
        var errorEl = document.getElementById('recoveryError');

        if (!usernameEl || !codeEl || !newPassEl || !confirmEl) return;

        var username = usernameEl.value.trim();
        var code = codeEl.value.trim();
        var newPassword = newPassEl.value;
        var confirm = confirmEl.value;

        if (!username || !code || !newPassword || !confirm) {
            if (errorEl) { errorEl.textContent = 'Заполните все поля'; errorEl.classList.remove('hidden'); }
            return;
        }

        if (newPassword.length < 6) {
            if (errorEl) { errorEl.textContent = 'Пароль не менее 6 символов'; errorEl.classList.remove('hidden'); }
            return;
        }

        if (newPassword !== confirm) {
            if (errorEl) { errorEl.textContent = 'Пароли не совпадают'; errorEl.classList.remove('hidden'); }
            return;
        }

        try {
            // 1. Проверяем резервный код
            var storedHash = localStorage.getItem('recoveryCodeHash_' + username);
            if (!storedHash) {
                if (errorEl) { errorEl.textContent = 'Резервный код не установлен'; errorEl.classList.remove('hidden'); }
                return;
            }

            var enteredHash = hashRecoveryCode(code);
            if (enteredHash !== storedHash) {
                if (errorEl) { errorEl.textContent = 'Неверный резервный код'; errorEl.classList.remove('hidden'); }
                return;
            }

            // 2. Генерируем новый хеш пароля
            var newHash = (typeof window.hashPassword === 'function') ? window.hashPassword(newPassword) : CryptoJS.SHA256(newPassword).toString();

            // 3. Сохраняем новый хеш в localStorage (отдельно, чтобы вход работал)
            localStorage.setItem('passwordHash_' + username, newHash);
            console.log('[recovery] Новый хеш пароля сохранён для:', username);

            // 4. Пытаемся обновить в bankUsers (если MASTER_KEY доступен)
            try {
                if (typeof window.secureGetItem === 'function') {
                    var users = await window.secureGetItem('bankUsers');
                    if (users && users[username]) {
                        users[username].passwordHash = newHash;
                        if (typeof window.secureSetItem === 'function') {
                            window.secureSetItem('bankUsers', users);
                            console.log('[recovery] bankUsers обновлён');
                        }
                    }
                }
            } catch (e3) {
                console.warn('[recovery] Не удалось обновить bankUsers:', e3.message);
            }

            // 5. Генерируем новый резервный код
            var newCode = generateRecoveryCode();
            localStorage.setItem('recoveryCodeHash_' + username, hashRecoveryCode(newCode));

            // 6. Очищаем старую сессию
            try { sessionStorage.removeItem('currentSession'); } catch (e) {}
            try { localStorage.removeItem('currentSession'); } catch (e) {}

            console.log('[recovery] Пароль сброшен для:', username);

            // 7. Показываем новый код
            if (typeof UI !== 'undefined') UI.closeAllModals();
            showRecoveryCodeModal(username, newCode);

        } catch (e) {
            console.error('[recovery] Ошибка:', e);
            if (errorEl) { errorEl.textContent = 'Ошибка: ' + e.message; errorEl.classList.remove('hidden'); }
        }
    }

    // Патч finishRegistrationAfterVerify
    var attempts = 0;
    var patchInterval = setInterval(function () {
        attempts++;
        if (attempts > 50) { clearInterval(patchInterval); return; }
        if (typeof window.finishRegistrationAfterVerify === 'function' && !window.finishRegistrationAfterVerify._recoveryPatched) {
            var originalFinish = window.finishRegistrationAfterVerify;
            window.finishRegistrationAfterVerify = async function (username) {
                var recoveryCode = generateRecoveryCode();
                var recoveryHash = hashRecoveryCode(recoveryCode);

                await originalFinish(username);

                try {
                    var users = await (typeof window.secureGetItem === 'function' ? window.secureGetItem('bankUsers') : Promise.resolve(JSON.parse(localStorage.getItem('bankUsers') || '{}')));
                    if (users && users[username]) {
                        users[username].recoveryCodeHash = recoveryHash;
                        if (typeof secureSetItem === 'function') {
                            window.secureSetItem('bankUsers', users);
                        } else {
                            localStorage.setItem('bankUsers', JSON.stringify(users));
                        }
                        console.log('[recovery] Код сохранён для:', username);
                        setTimeout(function () {
                            showRecoveryCodeModal(username, recoveryCode);
                        }, 1500);
                    }
                } catch (e) {
                    console.error('[recovery] Ошибка:', e);
                }
            };
            window.finishRegistrationAfterVerify._recoveryPatched = true;
            clearInterval(patchInterval);
            console.log('[recovery] finishRegistrationAfterVerify пропатчен');
        }
    }, 100);

    window.BKRecovery = {
        generateRecoveryCode: generateRecoveryCode,
        hashRecoveryCode: hashRecoveryCode,
        showRecoveryCodeModal: showRecoveryCodeModal,
        showForgotPasswordModal: showForgotPasswordModal,
        resetPassword: resetPassword
    };

    window.closeRecoveryModal = closeRecoveryModal;

    console.log('[recovery] Модуль восстановления пароля загружен');
})();
