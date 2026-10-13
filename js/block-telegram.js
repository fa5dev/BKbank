// ============================================================================
// js/block-telegram.js — блокирует Telegram-опрос и мёртвые запросы
// ============================================================================
(function () {
    'use strict';

    // --- Блокируем setInterval для Telegram ---
    var _originalSetInterval = window.setInterval;
    window.setInterval = function (fn, delay) {
        var fnStr = fn.toString();
        if (fnStr.includes('checkBotForVerify') ||
            fnStr.includes('listenTGBridge') ||
            fnStr.includes('getUpdates')) {
            console.log('[block-telegram] Заблокирован setInterval');
            return -1;
        }
        return _originalSetInterval.apply(window, arguments);
    };

    // --- Блокируем fetch ---
    var _originalFetch = window.fetch;
    window.fetch = function (url, options) {
        var urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        var method = (options && options.method) || 'GET';

        // Блокируем все запросы к corsproxy.io (Telegram)
        if (urlStr.includes('corsproxy.io')) {
            console.log('[block-telegram] Заблокирован fetch к corsproxy.io');
            return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Блокируем GET-запросы к Discord-вебхукам (загрузка сообщений)
        // POST-запросы (отправка) пропускаем
        if (urlStr.includes('discord.com/api/webhooks') || urlStr.includes('discord.com/api/v10/webhooks')) {
            if (method !== 'POST') {
                console.log('[block-telegram] Заблокирован GET к Discord-вебхуку');
                return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
            }
        }

        return _originalFetch.apply(window, arguments);
    };

    console.log('[block-telegram] Перехват setInterval и fetch активирован');
})();
