// ============================================================================
// js/verify-fix.js — Мгновенная верификация + защита устройств
// ============================================================================
(function () {
    'use strict';

    // --- Останавливаем Telegram-опрос ---
    setInterval(function () {
        if (typeof window.botListenerInterval !== 'undefined' && window.botListenerInterval) {
            clearInterval(window.botListenerInterval);
            window.botListenerInterval = null;
        }
        if (typeof window.tgListenerInterval !== 'undefined' && window.tgListenerInterval) {
            clearInterval(window.tgListenerInterval);
            window.tgListenerInterval = null;
        }
    }, 1000);

    // --- Перехватываем старую модалку через MutationObserver ---
    function replaceOldModal() {
        var modals = document.querySelectorAll('.modal-form');
        modals.forEach(function (modal) {
            var text = modal.textContent || '';
            if (text.includes('Подтверждение через Telegram') || text.includes('@BKparlog_bot')) {
                var codeMatch = text.match(/\/verify\s+(\w+)\s+(\d+)/);
                if (codeMatch) {
                    var uname = codeMatch[1];
                    var ucode = codeMatch[2];
                    console.log('[verify-fix] Заменяю старую модалку на новую:', uname, ucode);
                    modal.remove();
                    showVerificationStep(uname, 'ОЖИДАНИЕ', ucode);
                }
            }
        });
    }

    // --- Перехватываем кнопки регистрации ---
    function patchRegistrationButtons() {
        // Ищем модалку регистрации
        var modals = document.querySelectorAll('.modal-form');
        modals.forEach(function (modal) {
            var text = modal.textContent || '';
            if (text.includes('Регистрация') || text.includes('Зарегистрироваться')) {
                // Находим кнопку "Зарегистрироваться"
                var regBtn = modal.querySelector('.gold-button');
                if (regBtn && regBtn.textContent.includes('Зарегистрироваться') && !regBtn._patched) {
                    // Проверяем canRegister перед вызовом
                    var originalOnclick = regBtn.getAttribute('onclick');
                    regBtn.setAttribute('onclick', '');
                    regBtn.onclick = function (e) {
                        if (window.BKFingerprint) {
                            var chk = window.BKFingerprint.canRegister();
                            if (!chk.ok) {
                                var errEl = document.getElementById('registerError');
                                if (errEl) {
                                    errEl.textContent = chk.reason;
                                    errEl.classList.remove('hidden');
                                } else {
                                    if (typeof showToast === 'function') showToast('⛔ ' + chk.reason, 'error');
                                }
                                return false;
                            }
                        }
                        // Если проверка прошла — вызываем оригинальную функцию
                        if (originalOnclick) {
                            eval(originalOnclick);
                        } else if (typeof window.completeRegistration === 'function') {
                            window.completeRegistration();
                        }
                        return false;
                    };
                    regBtn._patched = true;
                    console.log('[verify-fix] Кнопка "Зарегистрироваться" пропатчена');
                }
            }
        });
    }

    var observer = new MutationObserver(function () {
        replaceOldModal();
        patchRegistrationButtons();
        // Убираем overlay, если нет модалки
        var overlays = document.querySelectorAll('.modal-overlay');
        var modals = document.querySelectorAll('.modal-form');
        if (overlays.length > 0 && modals.length === 0) {
            setTimeout(function() {
                var overlaysNow = document.querySelectorAll('.modal-overlay');
                var modalsNow = document.querySelectorAll('.modal-form');
                if (overlaysNow.length > 0 && modalsNow.length === 0) {
                    overlaysNow.forEach(function(el) { el.remove(); });
                    document.body.style.overflow = 'auto';
                }
            }, 500);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // --- showVerificationStep ---
    function showVerificationStep(username, phone, code) {
        if (window.BKFingerprint) {
            var chk = window.BKFingerprint.canRegister();
            if (!chk.ok) {
                if (typeof showToast === 'function') showToast('⛔ ' + chk.reason, 'error');
                return;
            }
        }

        if (typeof UI !== 'undefined') UI.closeAllModals();

        var savedCode = localStorage.getItem('verifyCode_' + username);
        if (!savedCode && code) {
            localStorage.setItem('verifyCode_' + username, code);
        }
        var savedPending = localStorage.getItem('pendingReg_' + username);
        if (!savedPending) {
            var pendingData = {
                name: (window.regData && window.regData.name) || username,
                username: username,
                password: (window.regData && window.regData.password) || 'temp_' + Date.now(),
                phone: 'ОЖИДАНИЕ',
                email: ''
            };
            localStorage.setItem('pendingReg_' + username, JSON.stringify(pendingData));
        }

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'modal-overlay';
        document.body.appendChild(overlay);

        var modal = document.createElement('div');
        modal.className = 'modal-form';
        modal.innerHTML =
            '<div class="form-title">📱 Подтверждение регистрации</div>' +
            '<p style="text-align:center; margin:15px 0; color:#FFD700;">Ваш код подтверждения:</p>' +
            '<div style="text-align:center; background:rgba(255,215,0,0.1); border:2px dashed #FFD700; border-radius:16px; padding:20px; margin:15px 0;">' +
                '<div style="font-size:2.5rem; font-weight:800; letter-spacing:8px; color:#FFD700;">' + code + '</div>' +
                '<button class="gold-button" style="margin-top:15px; width:auto; padding:8px 20px; font-size:0.9rem;" onclick="navigator.clipboard.writeText(\'' + code + '\'); if(typeof showToast===\'function\') showToast(\'📋 Код скопирован\', \'success\');">📋 Скопировать код</button>' +
            '</div>' +
            '<p style="text-align:center; color:#888; font-size:0.9rem; margin:10px 0;">Введите код ниже, чтобы завершить регистрацию</p>' +
            '<div id="verifyError" class="error-text hidden"></div>' +
            '<input id="verifyCodeInput" class="form-input" placeholder="🔑 Введите код" style="text-align:center; font-size:1.4rem; letter-spacing:4px; font-weight:700;">' +
            '<button class="gold-button" onclick="window.submitVerifyCode(\'' + username + '\')">✅ Подтвердить</button>' +
            '<button class="dark-button" onclick="window.cancelVerification(\'' + username + '\')">❌ Отмена</button>';

        document.body.appendChild(modal);

        setTimeout(function () {
            var input = document.getElementById('verifyCodeInput');
            if (input) input.focus();
        }, 200);
    }

    // --- submitVerifyCode ---
    function submitVerifyCode(username) {
        var input = document.getElementById('verifyCodeInput');
        var errorEl = document.getElementById('verifyError');
        if (!input) return;
        var entered = input.value.trim();
        if (!entered) {
            if (errorEl) { errorEl.textContent = 'Введите код'; errorEl.classList.remove('hidden'); }
            return;
        }
        var savedCode = localStorage.getItem('verifyCode_' + username);
        if (!savedCode) {
            if (errorEl) { errorEl.textContent = 'Регистрация не найдена, начните заново'; errorEl.classList.remove('hidden'); }
            return;
        }
        if (savedCode !== entered) {
            if (errorEl) { errorEl.textContent = '❌ Неверный код. Попробуйте снова.'; errorEl.classList.remove('hidden'); }
            input.value = '';
            input.focus();
            return;
        }
        localStorage.setItem('verified_' + username, 'true');
        if (typeof showToast === 'function') showToast('✅ Код принят! Завершаем регистрацию...', 'success');
        if (typeof UI !== 'undefined') UI.closeAllModals();
        setTimeout(function () {
            if (typeof finishRegistrationAfterVerify === 'function') {
                finishRegistrationAfterVerify(username);
            } else if (typeof window.finishRegistrationAfterVerify === 'function') {
                window.finishRegistrationAfterVerify(username);
            }
        }, 800);
    }

    // --- Патчим finishRegistrationAfterVerify ---
    var patchAttempts = 0;
    var patchInterval = setInterval(function () {
        patchAttempts++;
        if (patchAttempts > 50) { clearInterval(patchInterval); return; }
        if (typeof window.finishRegistrationAfterVerify === 'function' && !window.finishRegistrationAfterVerify._patched) {
            var original = window.finishRegistrationAfterVerify;
            window.finishRegistrationAfterVerify = async function (username) {
                await original(username);
                if (window.BKFingerprint) {
                    try {
                        window.BKFingerprint.markDeviceRegistered(username);
                        console.log('[verify-fix] ✅ Устройство отмечено:', username);
                    } catch (e) {
                        console.error('[verify-fix] markDeviceRegistered error:', e);
                    }
                }
            };
            window.finishRegistrationAfterVerify._patched = true;
            clearInterval(patchInterval);
            console.log('[verify-fix] finishRegistrationAfterVerify пропатчен');
        }
    }, 100);

    // --- Патчим destroyAccount: очищаем журнал устройств ---
    var destroyAttempts = 0;
    var destroyInterval = setInterval(function () {
        destroyAttempts++;
        if (destroyAttempts > 50) { clearInterval(destroyInterval); return; }
        if (typeof window.destroyAccount === 'function' && !window.destroyAccount._patched) {
            var originalDestroy = window.destroyAccount;
            window.destroyAccount = async function () {
                // Запоминаем username ДО удаления
                var usernameBefore = window.currentUser || null;
                await originalDestroy();

                // После удаления — чистим журнал устройств
                if (window.BKFingerprint) {
                    try {
                        window.BKFingerprint.resetRegistrationLog();
                        console.log('[verify-fix] ✅ Журнал устройств очищен после удаления аккаунта');
                    } catch (e) {
                        console.error('[verify-fix] resetRegistrationLog error:', e);
                    }
                }

                // Дополнительно чистим verifyCode и pendingReg для этого пользователя
                if (usernameBefore) {
                    localStorage.removeItem('verifyCode_' + usernameBefore);
                    localStorage.removeItem('pendingReg_' + usernameBefore);
                    localStorage.removeItem('verified_' + usernameBefore);
                    console.log('[verify-fix] ✅ Данные верификации удалены для:', usernameBefore);
                }

                // Убираем overlay на всякий случай
                document.querySelectorAll('.modal-overlay').forEach(function(el) { el.remove(); });
                document.querySelectorAll('.modal-form').forEach(function(el) { el.remove(); });
                document.body.style.overflow = 'auto';
                document.body.style.pointerEvents = 'auto';
            };
            window.destroyAccount._patched = true;
            clearInterval(destroyInterval);
            console.log('[verify-fix] destroyAccount пропатчен');
        }
    }, 100);

    // --- Переключение вкладок ---
    function switchTab(tabName) {
        // Секции, которые относятся к вкладкам
        var tabSections = {
            'bktok': 'bktok-section',
            'tasks': 'tasks-section',
            'cases': 'cases-section',
            'support': 'support-section',
            'chats': 'chats-section'
        };

        // Группы вкладок
        var groupBktok = ['bktok', 'tasks', 'cases'];
        var groupSupport = ['support', 'chats'];

        var targetSection = tabSections[tabName];
        if (!targetSection) return;

        // Определяем, к какой группе относится вкладка
        var group = groupBktok.includes(tabName) ? groupBktok : groupSupport;

        // Скрываем все секции группы
        group.forEach(function (t) {
            var sec = document.getElementById(tabSections[t]);
            if (sec) sec.classList.add('hidden');
        });

        // Показываем нужную
        var target = document.getElementById(targetSection);
        if (target) target.classList.remove('hidden');

        // Обновляем активные классы на кнопках
        document.querySelectorAll('.tab-btn').forEach(function (btn) {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Вызываем обработчики для конкретных секций
        try {
            if (tabName === 'bktok' && typeof window.loadBKtok === 'function') {
                window.loadBKtok();
            } else if (tabName === 'tasks' && typeof window.renderTasks === 'function') {
                window.renderTasks();
            } else if (tabName === 'cases' && typeof window.renderCases === 'function') {
                window.renderCases();
            } else if (tabName === 'support' && typeof window.renderAISupport === 'function') {
                window.renderAISupport();
            } else if (tabName === 'chats' && typeof window.renderPrivateChats === 'function') {
                window.renderPrivateChats();
            }
        } catch (e) {
            console.warn('[verify-fix] switchTab handler error:', e);
        }

        console.log('[verify-fix] Переключено на вкладку:', tabName);
    }

    window.switchTab = switchTab;

    // --- Патчим navigateTo: при переходе на bktok/support — активируем нужную вкладку ---
    var navAttempts = 0;
    var navInterval = setInterval(function () {
        navAttempts++;
        if (navAttempts > 50) { clearInterval(navInterval); return; }
        if (typeof window.navigateTo === 'function' && !window.navigateTo._patched) {
            var originalNavigate = window.navigateTo;
            window.navigateTo = function (section) {
                // Сначала вызываем оригинальный navigateTo
                originalNavigate(section);

                // Если перешли на bktok — активируем вкладку "bktok"
                if (section === 'bktok') {
                    setTimeout(function () {
                        // Скрываем tasks и cases
                        var tasksSec = document.getElementById('tasks-section');
                        var casesSec = document.getElementById('cases-section');
                        if (tasksSec) tasksSec.classList.add('hidden');
                        if (casesSec) casesSec.classList.add('hidden');
                        // Показываем bktok
                        var bktokSec = document.getElementById('bktok-section');
                        if (bktokSec) bktokSec.classList.remove('hidden');
                        // Обновляем активные вкладки
                        document.querySelectorAll('.tab-btn').forEach(function (btn) {
                            var tab = btn.getAttribute('data-tab');
                            if (tab === 'bktok') btn.classList.add('active');
                            else if (['tasks', 'cases', 'support', 'chats'].includes(tab)) btn.classList.remove('active');
                        });
                        // Загружаем биржу
                        if (typeof window.loadBKtok === 'function') {
                            try { window.loadBKtok(); } catch (e) {}
                        }
                    }, 50);
                }

                // Если перешли на support — активируем вкладку "support"
                if (section === 'support') {
                    setTimeout(function () {
                        var chatsSec = document.getElementById('chats-section');
                        if (chatsSec) chatsSec.classList.add('hidden');
                        var supportSec = document.getElementById('support-section');
                        if (supportSec) supportSec.classList.remove('hidden');
                        document.querySelectorAll('.tab-btn').forEach(function (btn) {
                            var tab = btn.getAttribute('data-tab');
                            if (tab === 'support') btn.classList.add('active');
                            else if (tab === 'chats') btn.classList.remove('active');
                        });
                    }, 50);
                }
            };
            window.navigateTo._patched = true;
            clearInterval(navInterval);
            console.log('[verify-fix] navigateTo пропатчен');
        }
    }, 100);

    window.showVerificationStep = showVerificationStep;
    window.submitVerifyCode = submitVerifyCode;

    console.log('[verify-fix] Мгновенная верификация + защита устройств активированы');
})();
