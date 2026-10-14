// ============================================================================
// js/bat-animation.js — Медленная и плавная анимация мыши
// ============================================================================
(function () {
    'use strict';

    var BAT_IMAGE = 'assets/images/logo.png';

    function flyBat() {
        if (sessionStorage.getItem('bat_shown') === 'true') return;
        sessionStorage.setItem('bat_shown', 'true');

        var logo = document.querySelector('.logo-img');
        if (!logo) return;

        var logoRect = logo.getBoundingClientRect();
        var logoCenterX = logoRect.left + logoRect.width / 2;
        var logoCenterY = logoRect.top + logoRect.height / 2;
        var logoSize = logoRect.width;

        // Скрываем настоящий логотип
        logo.style.transition = 'opacity 0.5s ease';
        logo.style.opacity = '0';

        // Создаём мышь
        var bat = document.createElement('img');
        bat.src = BAT_IMAGE;
        bat.style.cssText = [
            'position: fixed',
            'pointer-events: none',
            'z-index: 99999',
            'filter: drop-shadow(0 0 50px rgba(255, 215, 0, 0.9))',
            'width: ' + logoSize + 'px',
            'height: auto',
            'left: 50vw',
            'top: 50vh',
            'transform: translate(-50%, -50%) scale(0.1) rotate(-60deg)',
            'opacity: 0',
            'will-change: transform, left, top, opacity',
            'backface-visibility: hidden',
            'transition: none'
        ].join('; ');
        document.body.appendChild(bat);

        // Форсируем reflow
        void bat.offsetWidth;

        // === ФАЗА 1: Плавное появление и рост (1.2 сек) ===
        bat.style.transition = [
            'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            'opacity 0.8s ease'
        ].join(', ');
        bat.style.transform = 'translate(-50%, -50%) scale(18) rotate(0deg)';
        bat.style.opacity = '1';

        // === ФАЗА 2: Пауза (мышь закрывает GUI) — 1.2 сек ===
        setTimeout(function () {
            // === ФАЗА 3: Плавный полёт к логотипу (2 сек) ===
            bat.style.transition = [
                'left 2s cubic-bezier(0.4, 0, 0.2, 1)',
                'top 2s cubic-bezier(0.4, 0, 0.2, 1)',
                'transform 2s cubic-bezier(0.4, 0, 0.2, 1)',
                'opacity 0.5s ease'
            ].join(', ');

            bat.style.left = logoCenterX + 'px';
            bat.style.top = logoCenterY + 'px';
            bat.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';

            // === ФАЗА 4: Мышь исчезает, логотип появляется (0.5 сек) ===
            setTimeout(function () {
                bat.style.transition = 'opacity 0.5s ease';
                bat.style.opacity = '0';

                logo.style.opacity = '1';

                setTimeout(function () {
                    if (bat && bat.parentNode) bat.parentNode.removeChild(bat);
                }, 500);
            }, 2000); // 2 сек — полёт
        }, 2400); // 1.2 сек (появление) + 1.2 сек (пауза)

        console.log('[bat-animation] Медленная плавная анимация запущена');
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(flyBat, 300);
    } else {
        window.addEventListener('load', function () {
            setTimeout(flyBat, 300);
        });
    }

    console.log('[bat-animation] Анимация активирована');
})();
