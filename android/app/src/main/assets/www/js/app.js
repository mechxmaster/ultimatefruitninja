/**
 * Ultimate Fruit Ninja - Application UI Controller & Navigation
 * Wires modals, screens, button sounds, blade previews, high scores,
 * achievements list, settings, and PWA registration.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Instantiate game engine
    const game = new window.GameEngine();
    window.gameEngine = game;
    game.startLoop();

    // Sound effect on any arcade button click
    const attachButtonSounds = () => {
        document.querySelectorAll('button, .mode-card').forEach(el => {
            el.addEventListener('click', () => {
                window.audioManager.playClick();
            });
        });
    };
    attachButtonSounds();

    // Helper to open/close modals
    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    };

    const closeModal = (modal) => {
        if (modal) modal.classList.add('hidden');
    };

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            closeModal(modal);
        });
    });

    // Close modal on click outside card
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && overlay.id !== 'game-over-modal' && overlay.id !== 'pause-modal') {
                closeModal(overlay);
            }
        });
    });

    // --- MAIN MENU BUTTONS ---
    document.getElementById('btn-play-quick').addEventListener('click', () => {
        game.startRound('classic');
    });

    document.getElementById('btn-open-modes').addEventListener('click', () => {
        openModal('mode-select-modal');
    });

    document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.getAttribute('data-mode');
            closeModal(document.getElementById('mode-select-modal'));
            game.startRound(mode);
        });
    });

    document.getElementById('btn-open-blades').addEventListener('click', () => {
        renderBladesList();
        openModal('blades-modal');
    });

    document.getElementById('btn-open-scores').addEventListener('click', () => {
        renderHighScores('classic');
        openModal('high-scores-modal');
    });

    document.getElementById('btn-open-achievements').addEventListener('click', () => {
        renderAchievementsList();
        openModal('achievements-modal');
    });

    document.getElementById('btn-open-settings').addEventListener('click', () => {
        syncSettingsUI();
        openModal('settings-modal');
    });

    document.getElementById('btn-open-tutorial').addEventListener('click', () => {
        openModal('tutorial-modal');
    });

    document.getElementById('btn-launch-interactive-tutorial').addEventListener('click', () => {
        closeModal(document.getElementById('tutorial-modal'));
        document.getElementById('tutorial-hud-banner').classList.remove('hidden');
        game.startRound('tutorial');
    });

    // --- HUD BUTTONS ---
    document.getElementById('btn-pause-game').addEventListener('click', () => {
        game.pauseGame();
    });

    // --- PAUSE MODAL BUTTONS ---
    document.getElementById('btn-resume-game').addEventListener('click', () => {
        game.resumeGame();
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
        closeModal(document.getElementById('pause-modal'));
        game.startRound(game.mode);
    });

    document.getElementById('btn-pause-settings').addEventListener('click', () => {
        syncSettingsUI();
        openModal('settings-modal');
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
        closeModal(document.getElementById('pause-modal'));
        game.showScreen('main-menu');
    });

    // --- GAME OVER BUTTONS ---
    document.getElementById('btn-play-again').addEventListener('click', () => {
        closeModal(document.getElementById('game-over-modal'));
        game.startRound(game.mode);
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
        closeModal(document.getElementById('game-over-modal'));
        game.showScreen('main-menu');
    });

    // --- BLADES DOJO RENDERING ---
    const renderBladesList = () => {
        const container = document.getElementById('blades-list');
        container.innerHTML = '';

        const equipped = window.storageManager.getEquippedBlade();
        const blades = window.BLADE_CONFIGS;

        Object.values(blades).forEach(blade => {
            const isUnlocked = window.storageManager.isBladeUnlocked(blade.id);
            const isEquipped = blade.id === equipped;

            const card = document.createElement('div');
            card.className = `blade-card ${isEquipped ? 'equipped' : ''}`;

            card.innerHTML = `
                <canvas class="blade-preview-canvas" width="64" height="64" data-blade="${blade.id}"></canvas>
                <div class="blade-info">
                    <div class="blade-name">${blade.name}</div>
                    <div class="blade-desc">${isUnlocked ? blade.subtitle : blade.unlockDesc}</div>
                </div>
                <div>
                    <button class="btn-equip ${isEquipped ? 'equipped' : isUnlocked ? '' : 'locked'}" data-blade="${blade.id}">
                        ${isEquipped ? 'EQUIPPED' : isUnlocked ? 'EQUIP' : 'LOCKED'}
                    </button>
                </div>
            `;

            container.appendChild(card);

            // Draw preview trail on the mini canvas
            const canvas = card.querySelector('.blade-preview-canvas');
            drawBladePreview(canvas, blade);

            // Equip handler
            const btn = card.querySelector('.btn-equip');
            if (isUnlocked && !isEquipped) {
                btn.addEventListener('click', () => {
                    window.storageManager.setEquippedBlade(blade.id);
                    window.bladeManager.setBlade(blade.id);
                    window.audioManager.playClick();
                    renderBladesList();
                });
            }
        });
    };

    const drawBladePreview = (canvas, config) => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 64, 64);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // S-curve slash trail
        ctx.beginPath();
        ctx.moveTo(10, 54);
        ctx.quadraticCurveTo(48, 48, 54, 10);

        // Glow
        ctx.strokeStyle = config.mainColor === 'rainbow' ? '#ff00aa' : config.glowColor;
        ctx.lineWidth = 10;
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        // Main
        ctx.beginPath();
        ctx.moveTo(10, 54);
        ctx.quadraticCurveTo(48, 48, 54, 10);
        ctx.strokeStyle = config.mainColor === 'rainbow' ? '#00e5ff' : config.mainColor;
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.9;
        ctx.stroke();

        // Core
        ctx.beginPath();
        ctx.moveTo(10, 54);
        ctx.quadraticCurveTo(48, 48, 54, 10);
        ctx.strokeStyle = config.coreColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0;
        ctx.stroke();

        ctx.restore();
    };

    // --- HIGH SCORES LEADERBOARD ---
    const renderHighScores = (mode) => {
        const list = document.getElementById('scores-list');
        list.innerHTML = '';

        const scores = window.storageManager.getHighScores(mode);
        if (scores.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; color: #888; padding: 24px;">
                    No recorded scores yet. Start slicing!
                </div>
            `;
            return;
        }

        scores.forEach((entry, idx) => {
            const rank = idx + 1;
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

            const row = document.createElement('div');
            row.className = 'score-row';
            row.innerHTML = `
                <div class="score-rank">${rankIcon}</div>
                <div class="score-details">
                    <div class="score-pts">${entry.score} PTS</div>
                    <div class="score-meta">${entry.date} • ${entry.difficulty.toUpperCase()} • ${entry.fruitsSliced} Slices</div>
                </div>
                <div style="font-family: var(--font-arcade); color: var(--gold-primary); font-size: 1rem;">
                    ${entry.highestCombo}x COMBO
                </div>
            `;
            list.appendChild(row);
        });
    };

    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.getAttribute('data-tab');
            renderHighScores(mode);
        });
    });

    // --- ACHIEVEMENTS LIST ---
    const renderAchievementsList = () => {
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';

        const achs = Object.values(window.storageManager.data.achievements);
        achs.forEach(ach => {
            const item = document.createElement('div');
            item.className = `achievement-item ${ach.unlocked ? 'unlocked' : ''}`;
            item.innerHTML = `
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-info">
                    <div class="ach-title">${ach.title}</div>
                    <div class="ach-desc">${ach.desc}</div>
                </div>
                <div class="ach-status">
                    ${ach.unlocked ? '✅ COMPLETED' : '🔒 LOCKED'}
                </div>
            `;
            list.appendChild(item);
        });
    };

    // --- SETTINGS SYNC ---
    const syncSettingsUI = () => {
        const s = window.storageManager.getSettings();
        document.getElementById('setting-difficulty').value = s.difficulty || 'normal';
        document.getElementById('setting-sound').checked = s.soundFx;
        document.getElementById('setting-music').checked = s.music;
        document.getElementById('setting-volume').value = s.volume;
        document.getElementById('setting-vibration').checked = s.vibration;
        document.getElementById('setting-motion').checked = s.reducedMotion;
        document.getElementById('setting-sensitivity').value = s.sensitivity;
        document.getElementById('setting-contrast').checked = s.highContrast;
    };

    // Settings change handlers
    document.getElementById('setting-difficulty').addEventListener('change', (e) => {
        window.storageManager.updateSettings({ difficulty: e.target.value });
        game.applySettings();
    });

    document.getElementById('setting-sound').addEventListener('change', (e) => {
        window.storageManager.updateSettings({ soundFx: e.target.checked });
        game.applySettings();
    });

    document.getElementById('setting-music').addEventListener('change', (e) => {
        window.storageManager.updateSettings({ music: e.target.checked });
        game.applySettings();
    });

    document.getElementById('setting-volume').addEventListener('input', (e) => {
        window.storageManager.updateSettings({ volume: parseFloat(e.target.value) });
        game.applySettings();
    });

    document.getElementById('setting-vibration').addEventListener('change', (e) => {
        window.storageManager.updateSettings({ vibration: e.target.checked });
        game.applySettings();
    });

    document.getElementById('setting-motion').addEventListener('change', (e) => {
        window.storageManager.updateSettings({ reducedMotion: e.target.checked });
        game.applySettings();
    });

    document.getElementById('setting-sensitivity').addEventListener('input', (e) => {
        window.storageManager.updateSettings({ sensitivity: parseFloat(e.target.value) });
        game.applySettings();
    });

    document.getElementById('setting-contrast').addEventListener('change', (e) => {
        window.storageManager.updateSettings({ highContrast: e.target.checked });
        game.applySettings();
    });

    document.getElementById('btn-reset-data').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all high scores, blade unlocks, and achievements?')) {
            window.storageManager.resetAllData();
            game.applySettings();
            syncSettingsUI();
            alert('All game data has been reset to defaults.');
        }
    });

    // --- PWA SERVICE WORKER REGISTRATION ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered successfully', reg.scope))
                .catch(err => console.log('Service Worker registration failed:', err));
        });
    }

    // Refresh menu best score
    const best = window.storageManager.getPersonalBest('classic');
    document.getElementById('menu-best-val').textContent = best;
});
