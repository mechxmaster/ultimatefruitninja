/**
 * Ultimate Fruit Ninja - Blade & Trail System
 * Handles touch/mouse gestures, glowing trails, 7 blade cosmetic variations,
 * and high-precision line-segment to circle collision detection.
 */

const BLADE_CONFIGS = {
    classic_blue: {
        id: 'classic_blue',
        name: 'Classic Blue',
        subtitle: 'The sharp traditional ninja katana',
        coreColor: '#ffffff',
        mainColor: '#00d2ff',
        glowColor: '#0066ff',
        sparkColor: '#80e5ff',
        particleType: 'spark',
        trailWidth: 10,
        unlockedDefault: true,
        unlockDesc: 'Default starter blade'
    },
    flame: {
        id: 'flame',
        name: 'Flame Blade',
        subtitle: 'Forged in the heart of Mount Fuji',
        coreColor: '#fffbca',
        mainColor: '#ff6600',
        glowColor: '#ff1a00',
        sparkColor: '#ffa500',
        particleType: 'ember',
        trailWidth: 12,
        unlockedDefault: false,
        unlockDesc: 'Slice 100 total fruits'
    },
    neon: {
        id: 'neon',
        name: 'Neon Blade',
        subtitle: 'High-frequency electric cyber katana',
        coreColor: '#ffffff',
        mainColor: '#ff007f',
        glowColor: '#9d00ff',
        sparkColor: '#ff80df',
        particleType: 'neon',
        trailWidth: 9,
        unlockedDefault: false,
        unlockDesc: 'Reach a 4x Combo'
    },
    rainbow: {
        id: 'rainbow',
        name: 'Rainbow Blade',
        subtitle: 'Prismatic blade that bends spectrums',
        coreColor: '#ffffff',
        mainColor: 'rainbow',
        glowColor: '#ffffff',
        sparkColor: '#ffdd55',
        particleType: 'stardust',
        trailWidth: 11,
        unlockedDefault: false,
        unlockDesc: 'Score 300 points in any mode'
    },
    golden: {
        id: 'golden',
        name: 'Golden Blade',
        subtitle: 'Pure imperial gold with sacred blessings',
        coreColor: '#ffffff',
        mainColor: '#ffd700',
        glowColor: '#e69500',
        sparkColor: '#fff4a3',
        particleType: 'star',
        trailWidth: 13,
        unlockedDefault: false,
        unlockDesc: 'Slice a Golden Bonus Fruit'
    },
    nature: {
        id: 'nature',
        name: 'Nature Emerald',
        subtitle: 'Infused with the spirit of ancient bamboo',
        coreColor: '#e6fffa',
        mainColor: '#00ff88',
        glowColor: '#008f4c',
        sparkColor: '#88ffbb',
        particleType: 'leaf',
        trailWidth: 10,
        unlockedDefault: false,
        unlockDesc: 'Complete a Zen Mode round'
    },
    crystal: {
        id: 'crystal',
        name: 'Crystal Frost',
        subtitle: 'Glacial edge freezing fruit in mid-air',
        coreColor: '#ffffff',
        mainColor: '#80e5ff',
        glowColor: '#00bfff',
        sparkColor: '#d9f7ff',
        particleType: 'frost',
        trailWidth: 11,
        unlockedDefault: false,
        unlockDesc: 'Score 500 points in Classic Mode'
    }
};

class BladeManager {
    constructor() {
        this.activeBladeId = 'classic_blue';
        this.points = []; // [{x, y, time, vx, vy}]
        this.maxAge = 180; // ms trail lifetime
        this.minSliceSpeed = 180; // px/sec minimum speed to trigger slicing
        this.isSwiping = false;
        this.lastX = 0;
        this.lastY = 0;
        this.lastTime = 0;
        this.currentSpeed = 0;
        this.rainbowHue = 0;
        this.sensitivity = 1.0;
    }

    setBlade(bladeId) {
        if (BLADE_CONFIGS[bladeId]) {
            this.activeBladeId = bladeId;
        }
    }

    getConfig() {
        return BLADE_CONFIGS[this.activeBladeId] || BLADE_CONFIGS.classic_blue;
    }

    startSwipe(x, y) {
        this.isSwiping = true;
        this.points = [];
        const now = performance.now();
        this.lastX = x;
        this.lastY = y;
        this.lastTime = now;
        this.currentSpeed = 0;
        this.points.push({ x, y, time: now, vx: 0, vy: 0 });
    }

    moveSwipe(x, y, particlePool) {
        if (!this.isSwiping) {
            this.startSwipe(x, y);
            return;
        }

        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        if (dt <= 0) return;

        const dx = x - this.lastX;
        const dy = y - this.lastY;
        const dist = Math.hypot(dx, dy);
        const speed = (dist / dt) * this.sensitivity;
        this.currentSpeed = speed;

        const vx = (dx / dt);
        const vy = (dy / dt);

        this.points.push({ x, y, time: now, vx, vy, speed });
        this.lastX = x;
        this.lastY = y;
        this.lastTime = now;

        // Emit blade particles if moving fast enough
        if (dist > 8 && particlePool) {
            const config = this.getConfig();
            particlePool.spawnBladeParticle(x, y, vx, vy, config);
        }

        // Play whoosh occasionally on rapid swipe
        if (speed > 800 && Math.random() < 0.2) {
            window.audioManager.playWhoosh(Math.min(1.5, speed / 1200));
        }
    }

    endSwipe() {
        this.isSwiping = false;
        this.currentSpeed = 0;
    }

    update(currentTime) {
        // Prune old points
        while (this.points.length > 0 && (currentTime - this.points[0].time) > this.maxAge) {
            this.points.shift();
        }
        this.rainbowHue = (this.rainbowHue + 3) % 360;
    }

    draw(ctx, currentTime) {
        if (this.points.length < 2) return;

        const config = this.getConfig();
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Multi-segment tapered rendering
        for (let i = 1; i < this.points.length; i++) {
            const p0 = this.points[i - 1];
            const p1 = this.points[i];

            const age0 = currentTime - p0.time;
            const age1 = currentTime - p1.time;
            const life0 = Math.max(0, 1 - age0 / this.maxAge);
            const life1 = Math.max(0, 1 - age1 / this.maxAge);
            const avgLife = (life0 + life1) / 2;

            if (avgLife <= 0.05) continue;

            const baseWidth = config.trailWidth * (0.2 + 0.8 * avgLife);

            // Determine colors
            let mainColor = config.mainColor;
            let glowColor = config.glowColor;
            if (mainColor === 'rainbow') {
                const h = (this.rainbowHue + i * 15) % 360;
                mainColor = `hsl(${h}, 100%, 60%)`;
                glowColor = `hsl(${h}, 100%, 75%)`;
            }

            // Outer glow pass
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = glowColor;
            ctx.globalAlpha = 0.45 * avgLife;
            ctx.lineWidth = baseWidth * 2.2;
            ctx.stroke();

            // Mid vibrant color pass
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = mainColor;
            ctx.globalAlpha = 0.85 * avgLife;
            ctx.lineWidth = baseWidth;
            ctx.stroke();

            // Core bright laser pass
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = config.coreColor;
            ctx.globalAlpha = 0.95 * avgLife;
            ctx.lineWidth = Math.max(2, baseWidth * 0.4);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Checks collision between current active swipe segments and a circular target
     * Returns intersection details or null
     */
    checkCollision(targetX, targetY, radius) {
        if (this.points.length < 2) return null;

        // Generous collision hitbox padding for crisp, satisfying slicing
        const sliceRadius = radius + 18;
        const sliceRadiusSq = sliceRadius * sliceRadius;

        // Iterate over recent segments
        const checkWindow = Math.min(10, this.points.length);
        for (let i = this.points.length - 1; i >= this.points.length - checkWindow + 1; i--) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];

            const lineDx = p2.x - p1.x;
            const lineDy = p2.y - p1.y;
            const lenSq = lineDx * lineDx + lineDy * lineDy;

            if (lenSq === 0) continue;

            // Projection of target onto line segment
            let t = ((targetX - p1.x) * lineDx + (targetY - p1.y) * lineDy) / lenSq;
            t = Math.max(0, Math.min(1, t));

            const closestX = p1.x + t * lineDx;
            const closestY = p1.y + t * lineDy;
            const distSq = (targetX - closestX) ** 2 + (targetY - closestY) ** 2;

            if (distSq <= sliceRadiusSq) {
                // Sliced! Return slice angle and velocity
                const angle = Math.atan2(lineDy, lineDx);
                return {
                    hitX: closestX,
                    hitY: closestY,
                    angle: angle,
                    speed: Math.hypot(lineDx, lineDy) * 60,
                    vx: p2.vx || (lineDx / 0.016),
                    vy: p2.vy || (lineDy / 0.016)
                };
            }
        }

        return null;
    }
}

window.bladeManager = new BladeManager();
window.BLADE_CONFIGS = BLADE_CONFIGS;
