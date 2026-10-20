/**
 * Ultimate Fruit Ninja - Persistence & Storage System
 * Manages LocalStorage with schema versioning, persistent high scores,
 * achievement progression, unlocked blades, and game configuration.
 */

const STORAGE_KEY = 'ultimate_fruit_ninja_v1';

const DEFAULT_STATE = {
    settings: {
        difficulty: 'normal', // relaxed, easy, normal, fast
        soundFx: true,
        music: true,
        volume: 0.8,
        vibration: true,
        reducedMotion: false,
        sensitivity: 1.0,
        highContrast: false
    },
    equippedBlade: 'classic_blue',
    unlockedBlades: ['classic_blue'],
    highScores: {
        classic: [],
        zen: [],
        arcade: []
    },
    personalBests: {
        classic: 0,
        zen: 0,
        arcade: 0
    },
    stats: {
        totalFruitsSliced: 0,
        totalBombsHit: 0,
        totalCombos: 0,
        totalGamesPlayed: 0,
        highestCombo: 0,
        modesPlayed: {}
    },
    achievements: {
        first_slice: { id: 'first_slice', title: 'First Slice', desc: 'Slice your first airborne fruit', icon: '🍉', unlocked: false, progress: 0, goal: 1 },
        first_combo: { id: 'first_combo', title: 'Combo Master', desc: 'Slice 3 or more fruits in a single swipe', icon: '⚡', unlocked: false, progress: 0, goal: 3 },
        fruit_100: { id: 'fruit_100', title: 'Fruit Fanatic', desc: 'Slice 100 total fruits', icon: '🍓', unlocked: false, progress: 0, goal: 100 },
        fruit_500: { id: 'fruit_500', title: 'Fruit Ninja Master', desc: 'Slice 500 total fruits', icon: '⚔️', unlocked: false, progress: 0, goal: 500 },
        score_100: { id: 'score_100', title: 'Centurion', desc: 'Score 100 points in one match', icon: '💯', unlocked: false, progress: 0, goal: 100 },
        score_300: { id: 'score_300', title: 'High Roller', desc: 'Score 300 points in one match', icon: '🏆', unlocked: false, progress: 0, goal: 300 },
        combo_5: { id: 'combo_5', title: 'Combo King', desc: 'Slice 5 or more fruits in one swipe', icon: '👑', unlocked: false, progress: 0, goal: 5 },
        zen_master: { id: 'zen_master', title: 'Zen Master', desc: 'Complete a peaceful Zen Mode round', icon: '🌸', unlocked: false, progress: 0, goal: 1 },
        arcade_champion: { id: 'arcade_champion', title: 'Arcade Champion', desc: 'Score 200+ points in Arcade Mode', icon: '⏱️', unlocked: false, progress: 0, goal: 200 },
        all_modes: { id: 'all_modes', title: 'Tri-Athlete', desc: 'Play Classic, Zen, and Arcade modes', icon: '🥋', unlocked: false, progress: 0, goal: 3 },
        bomb_dodger: { id: 'bomb_dodger', title: 'Bomb Dodger', desc: 'Reach 150 points in Classic Mode without hitting a bomb', icon: '🛡️', unlocked: false, progress: 0, goal: 150 },
        golden_fruit: { id: 'golden_fruit', title: 'Golden Touch', desc: 'Slice a rare Golden Bonus Fruit', icon: '🌟', unlocked: false, progress: 0, goal: 1 }
    },
    tutorialCompleted: false
};

class StorageManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
            const parsed = JSON.parse(raw);
            // Merge with default state to ensure schema forward-compatibility
            return {
                ...DEFAULT_STATE,
                ...parsed,
                settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
                highScores: { ...DEFAULT_STATE.highScores, ...(parsed.highScores || {}) },
                personalBests: { ...DEFAULT_STATE.personalBests, ...(parsed.personalBests || {}) },
                stats: { ...DEFAULT_STATE.stats, ...(parsed.stats || {}) },
                achievements: { ...DEFAULT_STATE.achievements, ...(parsed.achievements || {}) }
            };
        } catch (e) {
            console.error('Failed to parse storage, using defaults', e);
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save to localStorage', e);
        }
    }

    getSettings() {
        return this.data.settings;
    }

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    }

    getEquippedBlade() {
        return this.data.equippedBlade || 'classic_blue';
    }

    setEquippedBlade(bladeId) {
        if (this.data.unlockedBlades.includes(bladeId)) {
            this.data.equippedBlade = bladeId;
            this.save();
            return true;
        }
        return false;
    }

    unlockBlade(bladeId) {
        if (!this.data.unlockedBlades.includes(bladeId)) {
            this.data.unlockedBlades.push(bladeId);
            this.save();
            this.showBladeUnlockedToast(bladeId);
        }
    }

    isBladeUnlocked(bladeId) {
        return this.data.unlockedBlades.includes(bladeId);
    }

    recordScore(mode, score, details = {}) {
        const entry = {
            score: score,
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            difficulty: details.difficulty || this.data.settings.difficulty,
            fruitsSliced: details.fruitsSliced || 0,
            highestCombo: details.highestCombo || 0
        };

        if (!this.data.highScores[mode]) {
            this.data.highScores[mode] = [];
        }

        this.data.highScores[mode].push(entry);
        this.data.highScores[mode].sort((a, b) => b.score - a.score);
        // Keep top 10
        if (this.data.highScores[mode].length > 10) {
            this.data.highScores[mode] = this.data.highScores[mode].slice(0, 10);
        }

        const isNewBest = score > (this.data.personalBests[mode] || 0);
        if (isNewBest) {
            this.data.personalBests[mode] = score;
        }

        // Update stats
        this.data.stats.totalGamesPlayed++;
        this.data.stats.totalFruitsSliced += details.fruitsSliced || 0;
        this.data.stats.totalCombos += details.totalCombos || 0;
        if (details.highestCombo > (this.data.stats.highestCombo || 0)) {
            this.data.stats.highestCombo = details.highestCombo;
        }
        this.data.stats.modesPlayed[mode] = true;

        this.checkAllUnlocks(mode, score, details);
        this.save();

        return { isNewBest, personalBest: this.data.personalBests[mode] };
    }

    getHighScores(mode) {
        return this.data.highScores[mode] || [];
    }

    getPersonalBest(mode) {
        return this.data.personalBests[mode] || 0;
    }

    checkAllUnlocks(mode, score, details) {
        // Achievement: first_slice
        if (details.fruitsSliced > 0) {
            this.unlockAchievement('first_slice');
        }

        // Achievement: first_combo & combo_5
        if (details.highestCombo >= 3) {
            this.unlockAchievement('first_combo');
        }
        if (details.highestCombo >= 5) {
            this.unlockAchievement('combo_5');
        }

        // Achievement: fruit counts
        if (this.data.stats.totalFruitsSliced >= 100) {
            this.unlockAchievement('fruit_100');
            this.unlockBlade('flame');
        }
        if (this.data.stats.totalFruitsSliced >= 500) {
            this.unlockAchievement('fruit_500');
        }

        // Blade: Neon (4x combo)
        if (details.highestCombo >= 4) {
            this.unlockBlade('neon');
        }

        // Blade: Rainbow (score 300)
        if (score >= 300) {
            this.unlockAchievement('score_300');
            this.unlockBlade('rainbow');
        }

        // Score 100
        if (score >= 100) {
            this.unlockAchievement('score_100');
        }

        // Zen master & Nature blade
        if (mode === 'zen') {
            this.unlockAchievement('zen_master');
            this.unlockBlade('nature');
        }

        // Arcade champion
        if (mode === 'arcade' && score >= 200) {
            this.unlockAchievement('arcade_champion');
        }

        // Classic score 500 -> Crystal blade
        if (mode === 'classic' && score >= 500) {
            this.unlockBlade('crystal');
        }

        // Classic bomb dodger
        if (mode === 'classic' && score >= 150 && (!details.bombsHit || details.bombsHit === 0)) {
            this.unlockAchievement('bomb_dodger');
        }

        // Tri-athlete
        const modesCount = Object.keys(this.data.stats.modesPlayed).length;
        if (modesCount >= 3) {
            this.unlockAchievement('all_modes');
        }
    }

    recordGoldenFruitSlice() {
        this.unlockAchievement('golden_fruit');
        this.unlockBlade('golden');
    }

    unlockAchievement(achId) {
        const ach = this.data.achievements[achId];
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            ach.unlockedAt = new Date().toISOString();
            this.save();
            this.showAchievementToast(ach);
            if (window.audioManager) {
                window.audioManager.playAchievement();
            }
        }
    }

    showAchievementToast(ach) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="toast-icon">${ach.icon}</div>
            <div class="toast-content">
                <div class="toast-tag">ACHIEVEMENT UNLOCKED!</div>
                <div class="toast-title">${ach.title}</div>
                <div class="toast-desc">${ach.desc}</div>
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, 3600);
    }

    showBladeUnlockedToast(bladeId) {
        const config = window.BLADE_CONFIGS ? window.BLADE_CONFIGS[bladeId] : null;
        if (!config) return;

        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'blade-toast';
        toast.innerHTML = `
            <div class="toast-icon">🗡️</div>
            <div class="toast-content">
                <div class="toast-tag" style="color: #00e5ff;">NEW BLADE UNLOCKED!</div>
                <div class="toast-title">${config.name}</div>
                <div class="toast-desc">${config.subtitle}</div>
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, 3800);
    }

    resetAllData() {
        this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.save();
    }
}

window.storageManager = new StorageManager();
