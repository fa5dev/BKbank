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

    // --- Блокируем fetch к corsproxy.io и мёртвому Discord-вебхуку ---
    var _originalFetch = window.fetch;
    window.fetch = function (url, options) {
        var urlStr = typeof url === 'string' ? url : (url && url.url) || '';

        // Блокируем corsproxy.io (Telegram-опрос и sendMessage)
        if (urlStr.includes('corsproxy.io')) {
            console.log('[block-telegram] Заблокирован fetch к corsproxy.io');
            return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Блокируем мёртвый Discord-вебхук
        if (urlStr.includes('discord.com/api/webhooks/1505494117894066277')) {
            console.log('[block-telegram] Заблокирован fetch к мёртвому Discord-вебхуку');
            return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        return _originalFetch.apply(window, arguments);
    };

    console.log('[block-telegram] Перехват setInterval и fetch активирован');
})();
