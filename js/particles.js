/**
 * Ultimate Fruit Ninja - Particle & Visual Effects Engine
 * High-performance object-pooled particle system for juicy fruit splats,
 * blade trails, bomb detonations, floating score popups, and ambient zen sakura petals.
 */

class ParticlePool {
    constructor() {
        this.juiceParticles = [];
        this.bladeParticles = [];
        this.splats = [];
        this.popups = [];
        this.explosions = [];
        this.ambientParticles = [];
        this.maxSplats = 18; // Limit background splats for pristine performance
    }

    reset() {
        this.juiceParticles = [];
        this.bladeParticles = [];
        this.splats = [];
        this.popups = [];
        this.explosions = [];
        this.ambientParticles = [];
    }

    /** Spawn fruit slice burst */
    spawnFruitSlice(x, y, fruitConfig, sliceAngle, intensity = 1.0) {
        const count = Math.floor((28 + Math.random() * 14) * intensity);
        const juiceColor = fruitConfig.juiceColor || '#ff2244';

        // 1. Splat on background wall
        this.spawnWallSplat(x, y, fruitConfig.splatColor || juiceColor);

        // 2. Radial droplet spray
        for (let i = 0; i < count; i++) {
            const angle = sliceAngle + (Math.random() - 0.5) * Math.PI * 1.5;
            const speed = 150 + Math.random() * 450 * intensity;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 80; // slightly upward bias

            this.juiceParticles.push({
                x,
                y,
                vx,
                vy,
                radius: 2 + Math.random() * 4.5,
                color: juiceColor,
                alpha: 1.0,
                life: 1.0,
                decay: 0.8 + Math.random() * 1.2
            });
        }
    }

    /** Background wall juice splatter that drips slightly and fades */
    spawnWallSplat(x, y, color) {
        // Drop oldest splat if at limit
        if (this.splats.length >= this.maxSplats) {
            this.splats.shift();
        }

        const droplets = [];
        const numDroplets = 4 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numDroplets; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 12 + Math.random() * 38;
            droplets.push({
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist,
                r: 2.5 + Math.random() * 5.5
            });
        }

        this.splats.push({
            x,
            y,
            baseRadius: 18 + Math.random() * 14,
            dripY: 0,
            dripLength: 15 + Math.random() * 25,
            color: color,
            alpha: 0.65,
            life: 6.0, // seconds
            maxLife: 6.0,
            droplets: droplets
        });
    }

    /** Spawn blade trail particles */
    spawnBladeParticle(x, y, vx, vy, bladeConfig) {
        const type = bladeConfig.particleType || 'spark';
        const color = bladeConfig.sparkColor || '#00d2ff';

        let pVx = -vx * 0.15 + (Math.random() - 0.5) * 60;
        let pVy = -vy * 0.15 + (Math.random() - 0.5) * 60;

        if (type === 'ember') {
            pVy -= 50; // Fire rises
        }

        this.bladeParticles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: pVx,
            vy: pVy,
            type: type,
            color: color,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 8,
            radius: type === 'leaf' ? 5 : type === 'star' ? 4.5 : 3,
            alpha: 1.0,
            life: 1.0,
            decay: type === 'ember' ? 1.6 : 3.0
        });
    }

    /** Bomb Detonation visual effects */
    spawnBombExplosion(x, y) {
        // Shockwave ring
        this.explosions.push({
            x,
            y,
            radius: 10,
            maxRadius: 350,
            alpha: 1.0,
            lineWidth: 25,
            type: 'shockwave'
        });

        // 60 fiery explosion fragments
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 550;
            const isSmoke = i > 40;

            this.explosions.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: isSmoke ? 14 + Math.random() * 18 : 6 + Math.random() * 10,
                color: isSmoke ? '#2b2b2b' : (Math.random() > 0.4 ? '#ff3700' : '#ffea00'),
                alpha: 1.0,
                decay: isSmoke ? 0.7 : 1.3,
                type: isSmoke ? 'smoke' : 'fire'
            });
        }
    }

    /** Floating score or combo banner */
    spawnTextPopup(x, y, text, color = '#ffd700', size = 26, isCombo = false) {
        this.popups.push({
            x,
            y,
            text,
            color,
            size,
            isCombo,
            vy: isCombo ? -75 : -90,
            scale: 0.2,
            targetScale: 1.0,
            alpha: 1.0,
            life: isCombo ? 1.6 : 0.9,
            maxLife: isCombo ? 1.6 : 0.9
        });
    }

    /** Ambient Sakura Petals for Zen Mode */
    spawnSakuraPetal(width, height) {
        if (this.ambientParticles.length > 25) return;
        this.ambientParticles.push({
            x: Math.random() * width,
            y: -20,
            vx: 20 + Math.random() * 40,
            vy: 30 + Math.random() * 45,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: 1 + Math.random() * 2,
            w: 8 + Math.random() * 4,
            h: 12 + Math.random() * 5,
            alpha: 0.75 + Math.random() * 0.2,
            color: '#ffb7c5'
        });
    }

    update(dt) {
        // 1. Update Juice Particles
        for (let i = this.juiceParticles.length - 1; i >= 0; i--) {
            const p = this.juiceParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 850 * dt; // gravity
            p.life -= p.decay * dt;
            p.alpha = Math.max(0, p.life);

            if (p.life <= 0) {
                this.juiceParticles.splice(i, 1);
            }
        }

        // 2. Update Wall Splats
        for (let i = this.splats.length - 1; i >= 0; i--) {
            const s = this.splats[i];
            s.life -= dt;
            if (s.dripY < s.dripLength) {
                s.dripY += 6 * dt;
            }
            s.alpha = Math.max(0, (s.life / s.maxLife) * 0.65);
            if (s.life <= 0) {
                this.splats.splice(i, 1);
            }
        }

        // 3. Update Blade Particles
        for (let i = this.bladeParticles.length - 1; i >= 0; i--) {
            const p = this.bladeParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rotSpeed * dt;
            p.life -= p.decay * dt;
            p.alpha = Math.max(0, p.life);

            if (p.life <= 0) {
                this.bladeParticles.splice(i, 1);
            }
        }

        // 4. Update Explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const e = this.explosions[i];
            if (e.type === 'shockwave') {
                e.radius += 550 * dt;
                e.alpha = Math.max(0, 1 - e.radius / e.maxRadius);
                if (e.radius >= e.maxRadius) {
                    this.explosions.splice(i, 1);
                }
            } else {
                e.x += e.vx * dt;
                e.y += e.vy * dt;
                e.vy += (e.type === 'fire' ? 200 : -30) * dt;
                e.radius += 8 * dt;
                e.alpha -= e.decay * dt;
                if (e.alpha <= 0) {
                    this.explosions.splice(i, 1);
                }
            }
        }

        // 5. Update Popups
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const pop = this.popups[i];
            pop.y += pop.vy * dt;
            pop.life -= dt;
            pop.alpha = Math.min(1.0, pop.life / (pop.maxLife * 0.4));
            if (pop.scale < pop.targetScale) {
                pop.scale = Math.min(pop.targetScale, pop.scale + dt * 5.0);
            }
            if (pop.life <= 0) {
                this.popups.splice(i, 1);
            }
        }

        // 6. Update Ambient Sakura
        for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
            const pet = this.ambientParticles[i];
            pet.x += pet.vx * dt + Math.sin(pet.rotation) * 15 * dt;
            pet.y += pet.vy * dt;
            pet.rotation += pet.rotSpeed * dt;

            if (pet.y > window.innerHeight + 50) {
                this.ambientParticles.splice(i, 1);
            }
        }
    }

    drawSplats(ctx) {
        // Draw background wall juice splats
        for (let s of this.splats) {
            ctx.save();
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = s.color;

            // Main splat blot
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.baseRadius, 0, Math.PI * 2);
            ctx.fill();

            // Satellite droplets
            for (let d of s.droplets) {
                ctx.beginPath();
                ctx.arc(s.x + d.dx, s.y + d.dy, d.r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dripping tail
            if (s.dripY > 2) {
                ctx.beginPath();
                ctx.moveTo(s.x - 3, s.y);
                ctx.quadraticCurveTo(s.x - 1, s.y + s.dripY * 0.7, s.x, s.y + s.dripY);
                ctx.quadraticCurveTo(s.x + 1, s.y + s.dripY * 0.7, s.x + 3, s.y);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    drawParticles(ctx) {
        // 1. Ambient Sakura
        for (let pet of this.ambientParticles) {
            ctx.save();
            ctx.translate(pet.x, pet.y);
            ctx.rotate(pet.rotation);
            ctx.globalAlpha = pet.alpha;
            ctx.fillStyle = pet.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, pet.w, pet.h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 2. Juice Particles
        for (let p of this.juiceParticles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 3. Blade Particles
        for (let p of this.bladeParticles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;

            if (p.type === 'star' || p.type === 'stardust') {
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const a1 = (i * Math.PI * 2) / 5;
                    const a2 = a1 + Math.PI / 5;
                    const x1 = Math.cos(a1) * p.radius * 1.8;
                    const y1 = Math.sin(a1) * p.radius * 1.8;
                    const x2 = Math.cos(a2) * (p.radius * 0.7);
                    const y2 = Math.sin(a2) * (p.radius * 0.7);
                    if (i === 0) ctx.moveTo(x1, y1);
                    else ctx.lineTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
                ctx.closePath();
                ctx.fill();
            } else if (p.type === 'leaf') {
                ctx.beginPath();
                ctx.ellipse(0, 0, p.radius * 1.5, p.radius * 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'frost') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-p.radius, 0);
                ctx.lineTo(p.radius, 0);
                ctx.moveTo(0, -p.radius);
                ctx.lineTo(0, p.radius);
                ctx.stroke();
            } else {
                // Spark / ember
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // 4. Explosions
        for (let e of this.explosions) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, e.alpha);

            if (e.type === 'shockwave') {
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffeedd';
                ctx.lineWidth = e.lineWidth * e.alpha;
                ctx.stroke();
            } else {
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // 5. Popups & Combos
        for (let pop of this.popups) {
            ctx.save();
            ctx.translate(pop.x, pop.y);
            ctx.scale(pop.scale, pop.scale);
            ctx.globalAlpha = Math.max(0, pop.alpha);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = pop.isCombo
                ? `900 ${pop.size}px 'Luckiest Guy', Impact, sans-serif`
                : `800 ${pop.size}px 'Luckiest Guy', sans-serif`;

            // Dark drop stroke for supreme contrast
            ctx.strokeStyle = '#1a0505';
            ctx.lineWidth = pop.isCombo ? 7 : 5;
            ctx.strokeText(pop.text, 0, 0);

            // Vibrant text fill with glow
            ctx.fillStyle = pop.color;
            ctx.shadowColor = pop.color;
            ctx.shadowBlur = pop.isCombo ? 18 : 8;
            ctx.fillText(pop.text, 0, 0);

            ctx.restore();
        }
    }
}

window.ParticlePool = ParticlePool;
