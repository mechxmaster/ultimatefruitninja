/**
 * Ultimate Fruit Ninja - Main Game Engine
 * Manages game loop, 2D physics simulation, wave spawner, input collision handling,
 * combo detection, game modes (Classic, Zen, Arcade, Tutorial), and UI integration.
 */

const DIFFICULTY_PRESETS = {
    relaxed: { gravity: 680, launchVel: 740, minFruits: 1, maxFruits: 2, bombChance: 0, interval: 2.6 },
    easy:    { gravity: 780, launchVel: 840, minFruits: 1, maxFruits: 3, bombChance: 0.12, interval: 2.3 },
    normal:  { gravity: 920, launchVel: 960, minFruits: 2, maxFruits: 4, bombChance: 0.25, interval: 2.0 },
    fast:    { gravity: 1040, launchVel: 1060, minFruits: 2, maxFruits: 5, bombChance: 0.35, interval: 1.6 }
};

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.blade = window.bladeManager;
        this.particles = new window.ParticlePool();
        this.storage = window.storageManager;
        this.audio = window.audioManager;

        // Game State
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER, TUTORIAL
        this.mode = 'classic'; // classic, zen, arcade, tutorial
        this.difficulty = 'normal';

        // Gameplay variables
        this.score = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.gameTimeRemaining = 90; // seconds for Arcade/Zen
        this.fruitsSlicedSession = 0;
        this.bombsHitSession = 0;
        this.totalCombosSession = 0;
        this.highestComboSession = 0;

        // Wave spawner
        this.spawnTimer = 0;
        this.waveCount = 0;
        this.fruits = [];
        this.fruitHalves = [];

        // Swipe & Combo tracking
        this.currentSwipeSlices = [];
        this.lastSliceTime = 0;
        this.comboResetTimer = 0;

        // Arcade Powerups
        this.freezeTimer = 0;
        this.frenzyTimer = 0;
        this.doubleScoreTimer = 0;

        // Screen Shake
        this.shakeTime = 0;
        this.shakeIntensity = 0;

        // Time tracking
        this.lastTime = performance.now();
        this.animationFrameId = null;

        // Tutorial step
        this.tutorialStep = 0;
        this.tutorialFruit = null;
        this.tutorialCompleted = false;

        this.initCanvasSize();
        this.setupEventListeners();
        this.applySettings();
    }

    initCanvasSize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;

        this.canvas.width = Math.floor(this.width * dpr);
        this.canvas.height = Math.floor(this.height * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    applySettings() {
        const s = this.storage.getSettings();
        this.difficulty = s.difficulty || 'normal';
        this.blade.setBlade(this.storage.getEquippedBlade());
        this.blade.sensitivity = s.sensitivity || 1.0;
        this.audio.setSoundEnabled(s.soundFx);
        this.audio.setMusicEnabled(s.music);
        this.audio.setMasterVolume(s.volume);
        this.audio.setVibrationEnabled(s.vibration);

        if (s.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.initCanvasSize();
        });

        // Universal coordinate getter for mouse and touch
        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            let clientX = e.clientX;
            let clientY = e.clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            }
            if (clientX === undefined) clientX = 0;
            if (clientY === undefined) clientY = 0;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const isInteractiveTarget = (e) => {
            return e.target && (
                e.target.closest('button') ||
                e.target.closest('.modal-card') ||
                e.target.closest('.hud-btn') ||
                e.target.closest('.mode-card') ||
                e.target.closest('select') ||
                e.target.closest('input') ||
                e.target.closest('label')
            );
        };

        const handleStart = (e) => {
            if (this.state === 'PAUSED') return;
            if (isInteractiveTarget(e)) return;

            this.audio.resume();
            const { x, y } = getCanvasCoords(e);
            this.blade.startSwipe(x, y);
            this.currentSwipeSlices = [];
        };

        const handleMove = (e) => {
            if (this.state === 'PAUSED') return;

            // Check if mouse button is held OR touch is active OR already swiping
            const isMouseDown = (e.buttons !== undefined && (e.buttons & 1) === 1);
            const isTouch = (e.touches && e.touches.length > 0);
            
            if (!this.blade.isSwiping && !isMouseDown && !isTouch) {
                return;
            }

            const { x, y } = getCanvasCoords(e);
            this.blade.moveSwipe(x, y, this.particles);
            this.checkSlices();
        };

        const handleEnd = (e) => {
            if (this.blade.isSwiping) {
                this.evaluateCombo();
                this.blade.endSwipe();
            }
        };

        // Pointer Events (Unified modern API)
        window.addEventListener('pointerdown', handleStart, { passive: true });
        window.addEventListener('pointermove', handleMove, { passive: true });
        window.addEventListener('pointerup', handleEnd, { passive: true });
        window.addEventListener('pointercancel', handleEnd, { passive: true });

        // Touch Events fallback with preventDefault to block mobile pull-to-refresh & pinch zoom
        window.addEventListener('touchstart', (e) => {
            if (!isInteractiveTarget(e)) {
                handleStart(e);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!isInteractiveTarget(e)) {
                if (e.cancelable) e.preventDefault();
                handleMove(e);
            }
        }, { passive: false });

        window.addEventListener('touchend', handleEnd, { passive: true });
        window.addEventListener('touchcancel', handleEnd, { passive: true });

        // Mouse Events fallback
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !isInteractiveTarget(e)) {
                handleStart(e);
            }
        });
        window.addEventListener('mousemove', (e) => {
            if ((e.buttons & 1) === 1 && !isInteractiveTarget(e)) {
                handleMove(e);
            }
        });
        window.addEventListener('mouseup', handleEnd);

        // Keyboard navigation
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (this.state === 'PLAYING') {
                    this.pauseGame();
                } else if (this.state === 'PAUSED') {
                    this.resumeGame();
                }
            }
        });
    }

    startRound(mode = 'classic') {
        this.mode = mode;
        this.state = mode === 'tutorial' ? 'TUTORIAL' : 'PLAYING';

        this.score = 0;
        this.lives = 3;
        this.fruitsSlicedSession = 0;
        this.bombsHitSession = 0;
        this.totalCombosSession = 0;
        this.highestComboSession = 0;
        this.waveCount = 0;
        this.spawnTimer = 0.5; // Start initial wave quickly

        this.fruits = [];
        this.fruitHalves = [];
        this.particles.reset();

        this.freezeTimer = 0;
        this.frenzyTimer = 0;
        this.doubleScoreTimer = 0;

        if (this.mode === 'arcade' || this.mode === 'zen') {
            this.gameTimeRemaining = 90;
        }

        if (this.mode === 'tutorial') {
            this.initTutorial();
        }

        this.updateHUD();
        this.showScreen('game-screen');

        if (this.storage.getSettings().music) {
            this.audio.startMusic();
        }
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        document.getElementById('pause-modal').classList.remove('hidden');
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.lastTime = performance.now();
        document.getElementById('pause-modal').classList.add('hidden');
    }

    endGame() {
        this.state = 'GAMEOVER';
        this.audio.playGameOver();

        const result = this.storage.recordScore(this.mode, this.score, {
            difficulty: this.difficulty,
            fruitsSliced: this.fruitsSlicedSession,
            highestCombo: this.highestComboSession,
            totalCombos: this.totalCombosSession,
            bombsHit: this.bombsHitSession
        });

        // Populate Game Over Screen
        document.getElementById('final-score-val').textContent = this.score;
        document.getElementById('stat-sliced-val').textContent = this.fruitsSlicedSession;
        document.getElementById('stat-combo-val').textContent = `${this.highestComboSession}x`;
        document.getElementById('stat-best-val').textContent = result.personalBest;

        const newBestBadge = document.getElementById('new-best-badge');
        if (result.isNewBest && this.score > 0) {
            newBestBadge.classList.remove('hidden');
        } else {
            newBestBadge.classList.add('hidden');
        }

        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    // --- GAME LOOP ---
    startLoop() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.lastTime = performance.now();
        const loop = (now) => {
            let dt = (now - this.lastTime) / 1000;
            this.lastTime = now;

            // Clamping delta time to prevent physics jump on tab-switch
            if (dt > 0.1) dt = 0.1;

            this.update(dt, now);
            this.render(now);

            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    update(dt, currentTime) {
        this.blade.update(currentTime);

        // Screen shake decay
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) this.shakeIntensity = 0;
        }

        // Ambient sakura petals for Zen Mode or Menu
        if (this.mode === 'zen' || this.state === 'MENU') {
            if (Math.random() < 0.25) {
                this.particles.spawnSakuraPetal(this.width, this.height);
            }
        }

        this.particles.update(dt);

        if (this.state === 'PAUSED') return;

        // Timers for Arcade mode
        if (this.state === 'PLAYING') {
            if (this.mode === 'arcade' || this.mode === 'zen') {
                this.gameTimeRemaining -= dt;
                if (this.mode === 'arcade' && this.gameTimeRemaining <= 10 && this.gameTimeRemaining > 0) {
                    if (Math.floor(this.gameTimeRemaining) !== Math.floor(this.gameTimeRemaining + dt)) {
                        this.audio.playTick(true);
                    }
                }
                if (this.gameTimeRemaining <= 0) {
                    this.gameTimeRemaining = 0;
                    this.endGame();
                    return;
                }
            }

            // Powerup timers
            if (this.freezeTimer > 0) {
                this.freezeTimer -= dt;
                dt *= 0.45; // Slow-mo physics time dilation
            }
            if (this.doubleScoreTimer > 0) {
                this.doubleScoreTimer -= dt;
            }
            if (this.frenzyTimer > 0) {
                this.frenzyTimer -= dt;
            }

            // Spawning fruits
            if (this.mode !== 'tutorial') {
                this.updateSpawner(dt);
            } else {
                this.updateTutorial(dt);
            }
        } else if (this.state === 'MENU') {
            // Ambient fruits floating on menu background
            this.updateMenuFruits(dt);
        }

        // Physics updates
        const diffConfig = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
        const gravity = diffConfig.gravity;

        // 1. Update Airborne Fruits & Bombs
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            fruit.update(dt, gravity);

            // Check if dropped below screen
            if (fruit.y > this.height + 80 && fruit.vy > 0) {
                // If it's a regular fruit falling unsliced in Classic mode -> strike penalty!
                if (this.state === 'PLAYING' && this.mode === 'classic' && !fruit.isBomb && !fruit.hasPenalized) {
                    fruit.hasPenalized = true;
                    this.loseLife(fruit.x);
                }
                this.fruits.splice(i, 1);
            }
        }

        // 2. Update Sliced Fruit Halves
        for (let i = this.fruitHalves.length - 1; i >= 0; i--) {
            const half = this.fruitHalves[i];
            half.update(dt, gravity);

            if (half.y > this.height + 120 && half.vy > 0) {
                this.fruitHalves.splice(i, 1);
            }
        }

        // Combo timeout reset
        if (this.currentSwipeSlices.length > 0 && currentTime - this.lastSliceTime > 300) {
            this.evaluateCombo();
        }

        this.updateHUD();
    }

    updateSpawner(dt) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnWave();
            const diffConfig = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
            this.spawnTimer = diffConfig.interval * (this.frenzyTimer > 0 ? 0.4 : 1.0);
        }
    }

    spawnWave() {
        this.waveCount++;
        const diffConfig = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
        let fruitCount = diffConfig.minFruits + Math.floor(Math.random() * (diffConfig.maxFruits - diffConfig.minFruits + 1));
        if (this.frenzyTimer > 0) fruitCount += 3;

        const availableTypes = ['watermelon', 'orange', 'apple', 'banana', 'pineapple', 'strawberry', 'peach', 'coconut', 'lemon'];
        const bombAllowed = (this.mode === 'classic' && diffConfig.bombChance > 0) || this.mode === 'arcade';

        let bombSpawnedInWave = false;

        for (let i = 0; i < fruitCount; i++) {
            const padding = Math.min(this.width * 0.15, 80);
            const x = padding + Math.random() * (this.width - padding * 2);
            const y = this.height + 40;

            // Arcing velocity towards screen center
            const centerTargetX = this.width * 0.5 + (Math.random() - 0.5) * (this.width * 0.4);
            const baseLaunch = diffConfig.launchVel * (0.85 + Math.random() * 0.25);
            const timeToApex = baseLaunch / diffConfig.gravity;
            const vx = (centerTargetX - x) / timeToApex;
            const vy = -baseLaunch;

            // Determine if bomb or special powerup fruit
            let typeKey;
            const rand = Math.random();

            if (bombAllowed && !bombSpawnedInWave && rand < diffConfig.bombChance) {
                typeKey = 'bomb';
                bombSpawnedInWave = true;
            } else if (this.mode === 'arcade' && rand < 0.18) {
                // Special Arcade powerups
                const powerups = ['freeze', 'frenzy', 'double'];
                typeKey = powerups[Math.floor(Math.random() * powerups.length)];
            } else if (rand < 0.05) {
                // Rare Golden Bonus Fruit!
                typeKey = 'golden';
            } else {
                typeKey = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            }

            const fruit = new window.Fruit(typeKey, x, y, vx, vy);
            this.fruits.push(fruit);
        }
    }

    updateMenuFruits(dt) {
        if (this.fruits.length < 3 && Math.random() < 0.02) {
            const availableTypes = ['watermelon', 'orange', 'apple', 'banana', 'strawberry', 'golden'];
            const typeKey = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            const x = this.width * 0.2 + Math.random() * (this.width * 0.6);
            const vx = (Math.random() - 0.5) * 120;
            const vy = -700 - Math.random() * 200;
            this.fruits.push(new window.Fruit(typeKey, x, this.height + 40, vx, vy));
        }
    }

    loseLife(strikeX) {
        this.lives--;
        this.audio.playMiss();
        this.particles.spawnTextPopup(strikeX || this.width * 0.5, this.height * 0.45, '❌ STRIKE!', '#ff3344', 36);

        if (this.lives <= 0) {
            this.lives = 0;
            this.endGame();
        }
    }

    checkSlices() {
        const now = performance.now();

        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            if (!fruit.active || fruit.isSliced) continue;

            const hit = this.blade.checkCollision(fruit.x, fruit.y, fruit.radius);
            if (hit) {
                this.sliceFruit(fruit, hit);
                this.fruits.splice(i, 1);
            }
        }
    }

    sliceFruit(fruit, hit) {
        fruit.isSliced = true;
        this.lastSliceTime = performance.now();

        // 1. Bomb Sliced!
        if (fruit.isBomb) {
            this.bombsHitSession++;
            this.audio.playExplosion();
            this.particles.spawnBombExplosion(fruit.x, fruit.y);
            this.triggerScreenShake(0.6, 25);

            if (this.mode === 'classic') {
                // Standard mode bomb ends round immediately
                this.particles.spawnTextPopup(fruit.x, fruit.y, 'BOMB!', '#ff0033', 44);
                this.endGame();
            } else if (this.mode === 'arcade') {
                // Arcade bomb penalty: -10 points, -3 seconds
                this.score = Math.max(0, this.score - 10);
                this.gameTimeRemaining = Math.max(0, this.gameTimeRemaining - 3);
                this.particles.spawnTextPopup(fruit.x, fruit.y, '-10 PTS / -3s', '#ff2222', 32);
            }
            return;
        }

        // 2. Fruit Sliced!
        this.fruitsSlicedSession++;
        this.currentSwipeSlices.push(fruit);

        // Calculate score
        let pts = fruit.config.points || 10;
        if (this.doubleScoreTimer > 0) pts *= 2;
        this.score += pts;

        // Splitting into two halves along cut angle
        const cutAngle = hit.angle;
        const normAngle = cutAngle + Math.PI / 2;
        const pushMag = 180 + Math.random() * 60;
        const nx = Math.cos(normAngle) * pushMag;
        const ny = Math.sin(normAngle) * pushMag;

        // Half 1 (Upper/Right)
        this.fruitHalves.push(new window.FruitHalf(
            fruit.typeKey,
            fruit.x + nx * 0.08,
            fruit.y + ny * 0.08,
            fruit.vx + nx,
            fruit.vy + ny - 60,
            fruit.rotation,
            -4.5 - Math.random() * 2,
            cutAngle,
            true
        ));

        // Half 2 (Lower/Left)
        this.fruitHalves.push(new window.FruitHalf(
            fruit.typeKey,
            fruit.x - nx * 0.08,
            fruit.y - ny * 0.08,
            fruit.vx - nx,
            fruit.vy - ny - 60,
            fruit.rotation,
            4.5 + Math.random() * 2,
            cutAngle,
            false
        ));

        // Spawn juicy particles & wall splats
        this.particles.spawnFruitSlice(fruit.x, fruit.y, fruit.config, cutAngle);

        // Sound effects
        if (fruit.typeKey === 'golden') {
            this.audio.playGoldenChime();
            this.storage.recordGoldenFruitSlice();
            this.particles.spawnTextPopup(fruit.x, fruit.y, `+${pts} GOLDEN!`, '#ffe600', 38);
        } else {
            this.audio.playSlice(fruit.typeKey);
            this.particles.spawnTextPopup(fruit.x, fruit.y, `+${pts}`, '#ffd700', 24);
        }

        // Powerup activations
        if (fruit.isPowerup) {
            if (fruit.powerupType === 'freeze') {
                this.freezeTimer = 6.0;
                this.particles.spawnTextPopup(fruit.x, fruit.y, 'FREEZE TIME!', '#00e5ff', 36);
            } else if (fruit.powerupType === 'frenzy') {
                this.frenzyTimer = 5.0;
                this.particles.spawnTextPopup(fruit.x, fruit.y, 'FRUIT FRENZY!', '#d90429', 36);
            } else if (fruit.powerupType === 'double') {
                this.doubleScoreTimer = 8.0;
                this.particles.spawnTextPopup(fruit.x, fruit.y, 'DOUBLE POINTS!', '#00f5d4', 36);
            }
        }
    }

    evaluateCombo() {
        const count = this.currentSwipeSlices.length;
        if (count >= 3) {
            this.totalCombosSession++;
            if (count > this.highestComboSession) {
                this.highestComboSession = count;
            }

            let bonus = 0;
            let msg = '';
            let color = '#ffd700';

            if (count === 3) {
                bonus = 3;
                msg = '3x COMBO!';
                color = '#00f0ff';
            } else if (count === 4) {
                bonus = 8;
                msg = '4x GREAT COMBO!';
                color = '#ff9900';
            } else if (count === 5) {
                bonus = 15;
                msg = '5x MEGA COMBO!';
                color = '#ff0077';
            } else {
                bonus = 25 + (count - 6) * 5;
                msg = `${count}x BLADE MASTER!`;
                color = '#ffdd00';
            }

            if (this.doubleScoreTimer > 0) bonus *= 2;
            this.score += bonus;

            // Trigger combo sounds and glowing screen popups
            this.audio.playCombo(count);
            const lastFruit = this.currentSwipeSlices[this.currentSwipeSlices.length - 1];
            const px = lastFruit ? lastFruit.x : this.width * 0.5;
            const py = lastFruit ? lastFruit.y : this.height * 0.4;
            this.particles.spawnTextPopup(px, py - 40, `${msg} (+${bonus})`, color, 34, true);

            this.storage.checkAllUnlocks(this.mode, this.score, {
                fruitsSliced: this.fruitsSlicedSession,
                highestCombo: this.highestComboSession,
                totalCombos: this.totalCombosSession
            });
        }

        this.currentSwipeSlices = [];
    }

    triggerScreenShake(duration = 0.4, intensity = 15) {
        if (this.storage.getSettings().reducedMotion) return;
        this.shakeTime = duration;
        this.shakeIntensity = intensity;
    }

    // --- TUTORIAL LOGIC ---
    initTutorial() {
        this.tutorialStep = 1;
        this.spawnTutorialStep();
    }

    spawnTutorialStep() {
        const cx = this.width * 0.5;
        const cy = this.height + 40;
        const instructEl = document.getElementById('tutorial-instruction');

        if (this.tutorialStep === 1) {
            instructEl.textContent = 'Swipe your finger/mouse across the fruit to slice it!';
            this.fruits = [new window.Fruit('watermelon', cx, cy, 0, -820)];
        } else if (this.tutorialStep === 2) {
            instructEl.textContent = 'Slice 3 fruits in ONE continuous swipe for a COMBO!';
            this.fruits = [
                new window.Fruit('orange', cx - 90, cy, 40, -820),
                new window.Fruit('apple', cx, cy, 0, -850),
                new window.Fruit('banana', cx + 90, cy, -40, -820)
            ];
        } else if (this.tutorialStep === 3) {
            instructEl.textContent = 'BEWARE! Do NOT slice bombs or your round will end!';
            this.fruits = [
                new window.Fruit('strawberry', cx - 80, cy, 30, -820),
                new window.Fruit('bomb', cx + 80, cy, -30, -820)
            ];
        } else if (this.tutorialStep === 4) {
            instructEl.textContent = 'In Classic Mode, letting fruit drop costs 1 life. Slice them before they fall!';
            this.fruits = [
                new window.Fruit('peach', cx - 50, cy, 20, -780),
                new window.Fruit('pineapple', cx + 50, cy, -20, -780)
            ];
        } else {
            instructEl.textContent = 'Mastery Achieved! You are ready for the Dojo!';
            this.storage.unlockAchievement('first_slice');
            this.storage.data.tutorialCompleted = true;
            this.storage.save();
            setTimeout(() => {
                this.showScreen('main-menu');
            }, 2500);
        }
    }

    updateTutorial(dt) {
        if (this.fruits.length === 0 && this.fruitHalves.length === 0) {
            this.tutorialStep++;
            if (this.tutorialStep <= 4) {
                setTimeout(() => this.spawnTutorialStep(), 1000);
            } else {
                this.spawnTutorialStep();
            }
        }
    }

    // --- RENDERING ---
    render(currentTime) {
        this.ctx.save();

        // Screen shake
        if (this.shakeTime > 0) {
            const rx = (Math.random() - 0.5) * this.shakeIntensity;
            const ry = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(rx, ry);
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw wall juice splats
        this.particles.drawSplats(this.ctx);

        // 2. Draw sliced fruit halves
        for (let half of this.fruitHalves) {
            half.draw(this.ctx);
        }

        // 3. Draw airborne whole fruits & bombs
        for (let fruit of this.fruits) {
            fruit.draw(this.ctx);
        }

        // 4. Draw blade trail
        this.blade.draw(this.ctx, currentTime);

        // 5. Draw particles (juices, blade sparks, explosions, popups)
        this.particles.drawParticles(this.ctx);

        // 6. Freeze screen tint effect
        if (this.freezeTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 200, 255, 0.12)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        this.ctx.restore();
    }

    updateHUD() {
        const scoreEl = document.getElementById('hud-score-val');
        if (scoreEl) scoreEl.textContent = this.score;

        // Lives indicators
        const livesContainer = document.getElementById('hud-lives-container');
        if (livesContainer) {
            if (this.mode === 'classic') {
                livesContainer.style.display = 'flex';
                for (let i = 1; i <= 3; i++) {
                    const sword = document.getElementById(`life-${i}`);
                    if (sword) {
                        if (i <= this.lives) {
                            sword.classList.remove('lost');
                        } else {
                            sword.classList.add('lost');
                        }
                    }
                }
            } else {
                livesContainer.style.display = 'none';
            }
        }

        // Timer indicator for Arcade/Zen
        const timerContainer = document.getElementById('hud-timer-container');
        const timerVal = document.getElementById('hud-timer-val');
        if (timerContainer && timerVal) {
            if (this.mode === 'arcade' || this.mode === 'zen') {
                timerContainer.style.display = 'flex';
                timerVal.textContent = Math.ceil(this.gameTimeRemaining);
                if (this.gameTimeRemaining <= 10 && this.mode === 'arcade') {
                    timerVal.classList.add('urgent');
                } else {
                    timerVal.classList.remove('urgent');
                }
            } else {
                timerContainer.style.display = 'none';
            }
        }

        // Double Score badge
        const doubleBadge = document.getElementById('hud-double-badge');
        if (doubleBadge) {
            doubleBadge.style.display = this.doubleScoreTimer > 0 ? 'block' : 'none';
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.app-screen').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');

        if (screenId === 'main-menu') {
            this.state = 'MENU';
            document.getElementById('pause-modal').classList.add('hidden');
            document.getElementById('game-over-modal').classList.add('hidden');
            const best = this.storage.getPersonalBest('classic');
            document.getElementById('menu-best-val').textContent = best;
        }
    }
}

window.GameEngine = GameEngine;
