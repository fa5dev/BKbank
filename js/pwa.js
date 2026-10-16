// ============================================================================
// js/pwa.js — Регистрация Service Worker и PWA
// ============================================================================
(function () {
    'use strict';

    if (!('serviceWorker' in navigator)) {
        console.warn('[pwa] Service Worker не поддерживается');
        return;
    }

    // Определяем базовый путь (для GitHub Pages — /BKbank/)
    var basePath = '/';
    if (location.hostname.indexOf('github.io') !== -1) {
        basePath = '/BKbank/';
    }

    window.addEventListener('load', function () {
        navigator.serviceWorker.register(basePath + 'sw.js', { scope: basePath })
            .then(function (registration) {
                console.log('[pwa] Service Worker зарегистрирован:', registration.scope);
            })
            .catch(function (err) {
                console.error('[pwa] Ошибка регистрации SW:', err);
            });
    });

    console.log('[pwa] Модуль PWA активирован (basePath=' + basePath + ')');
})();
