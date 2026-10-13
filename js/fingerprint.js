// ============================================================================
// js/fingerprint.js — Клиентская верификация устройств
// ============================================================================
// Без сервера. Использует deviceId + отпечаток браузера + localStorage.
// Обходится очисткой хранилища, но усложняет накрутку.
// ============================================================================

(function () {
    'use strict';

    const DEVICE_KEY = 'bk_device_id';
    const FP_KEY = 'bk_fingerprint';
    const REG_LOG_KEY = 'bk_registration_log';
    const COOLDOWN_MS = 60 * 60 * 1000; // 1 час между регистрациями

    // Генерация UUID v4
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // Получить или создать deviceId
    function getDeviceId() {
        let id = localStorage.getItem(DEVICE_KEY);
        if (!id) {
            id = uuidv4();
            try {
                localStorage.setItem(DEVICE_KEY, id);
            } catch (e) {
                console.warn('[fingerprint] localStorage недоступен');
            }
        }
        return id;
    }

    // Собрать отпечаток браузера
    function getFingerprint() {
        const cached = localStorage.getItem(FP_KEY);
        if (cached) return cached;

        const parts = [
            navigator.userAgent || '',
            navigator.language || '',
            navigator.hardwareConcurrency || '',
            screen.width + 'x' + screen.height,
            screen.colorDepth || '',
            new Date().getTimezoneOffset(),
            Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            navigator.platform || '',
        ];

        // Canvas fingerprint
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('BK-Bank fingerprint', 2, 15);
            parts.push(canvas.toDataURL().slice(-50));
        } catch (e) {
            parts.push('no-canvas');
        }

        const raw = parts.join('|');
        // Простой хеш (не криптографический)
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            hash = (hash << 5) - hash + raw.charCodeAt(i);
            hash |= 0;
        }
        const fp = 'fp_' + Math.abs(hash).toString(36);

        try {
            localStorage.setItem(FP_KEY, fp);
        } catch (e) {}

        return fp;
    }

    // Загрузить журнал регистраций
    function getRegistrationLog() {
        try {
            return JSON.parse(localStorage.getItem(REG_LOG_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    // Сохранить журнал регистраций
    function saveRegistrationLog(log) {
        try {
            localStorage.setItem(REG_LOG_KEY, JSON.stringify(log));
        } catch (e) {}
    }

    // Проверка: зарегистрирован ли deviceId
    function isDeviceRegistered() {
        const id = getDeviceId();
        const fp = getFingerprint();
        const log = getRegistrationLog();
        return log.some(function (entry) {
            return entry.deviceId === id || entry.fingerprint === fp;
        });
    }

    // Проверка: можно ли регистрироваться (кулдаун)
    function canRegister() {
        const log = getRegistrationLog();
        if (log.length === 0) return { ok: true };

        if (isDeviceRegistered()) {
            return { ok: false, reason: 'На этом устройстве уже есть аккаунт BK-Bank.' };
        }

        const last = log[log.length - 1];
        if (last && last.timestamp) {
            const elapsed = Date.now() - last.timestamp;
            if (elapsed < COOLDOWN_MS) {
                const left = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
                return { ok: false, reason: 'Подождите ' + left + ' мин. перед новой регистрацией.' };
            }
        }

        return { ok: true };
    }

    // Отметить устройство как зарегистрированное
    function markDeviceRegistered(username) {
        const log = getRegistrationLog();
        log.push({
            deviceId: getDeviceId(),
            fingerprint: getFingerprint(),
            username: username,
            timestamp: Date.now(),
            userAgent: navigator.userAgent.slice(0, 100),
        });
        saveRegistrationLog(log);
    }

    // Сброс (для отладки)
    function resetRegistrationLog() {
        try {
            localStorage.removeItem(REG_LOG_KEY);
        } catch (e) {}
    }

    // Экспорт в window
    window.BKFingerprint = {
        getDeviceId,
        getFingerprint,
        isDeviceRegistered,
        canRegister,
        markDeviceRegistered,
        resetRegistrationLog,
    };

    console.log('[fingerprint] Модуль верификации устройств загружен');
})();
