/**
 * Ultimate Fruit Ninja - Procedural Fruit & Bomb Engine
 * Renders 10 distinct procedural fruits, sliced fruit halves with realistic internal anatomy,
 * and animated sparking bombs.
 */

const FRUIT_TYPES = {
    watermelon: {
        id: 'watermelon',
        name: 'Watermelon',
        radius: 46,
        points: 10,
        juiceColor: '#ff2a55',
        splatColor: 'rgba(255, 30, 75, 0.45)',
        skinColor: '#1d7734',
        innerColor: '#ff224a',
        rindColor: '#c5f7af'
    },
    orange: {
        id: 'orange',
        name: 'Orange',
        radius: 38,
        points: 10,
        juiceColor: '#ff8800',
        splatColor: 'rgba(255, 136, 0, 0.45)',
        skinColor: '#ff7700',
        innerColor: '#ffa726',
        rindColor: '#fff5db'
    },
    apple: {
        id: 'apple',
        name: 'Apple',
        radius: 36,
        points: 10,
        juiceColor: '#f12b2c',
        splatColor: 'rgba(235, 40, 45, 0.42)',
        skinColor: '#d61828',
        innerColor: '#fffde0',
        rindColor: '#c70a1a'
    },
    banana: {
        id: 'banana',
        name: 'Banana',
        radius: 37,
        points: 10,
        juiceColor: '#f9e04c',
        splatColor: 'rgba(240, 218, 50, 0.40)',
        skinColor: '#f5cc1b',
        innerColor: '#fffde0',
        rindColor: '#ded26c'
    },
    pineapple: {
        id: 'pineapple',
        name: 'Pineapple',
        radius: 44,
        points: 15,
        juiceColor: '#f2bd1d',
        splatColor: 'rgba(235, 175, 20, 0.45)',
        skinColor: '#c47d18',
        innerColor: '#ffea6c',
        rindColor: '#a6640c'
    },
    strawberry: {
        id: 'strawberry',
        name: 'Strawberry',
        radius: 32,
        points: 10,
        juiceColor: '#e81745',
        splatColor: 'rgba(232, 23, 69, 0.45)',
        skinColor: '#e01638',
        innerColor: '#ff6685',
        rindColor: '#fff0f3'
    },
    peach: {
        id: 'peach',
        name: 'Peach',
        radius: 36,
        points: 10,
        juiceColor: '#ff7a70',
        splatColor: 'rgba(255, 122, 112, 0.45)',
        skinColor: '#ff5e62',
        innerColor: '#ffb199',
        rindColor: '#ffe0b2'
    },
    coconut: {
        id: 'coconut',
        name: 'Coconut',
        radius: 42,
        points: 15,
        juiceColor: '#ffffff',
        splatColor: 'rgba(250, 250, 250, 0.45)',
        skinColor: '#5c3a21',
        innerColor: '#f7f7f7',
        rindColor: '#3d2614'
    },
    lemon: {
        id: 'lemon',
        name: 'Lemon',
        radius: 34,
        points: 10,
        juiceColor: '#ffea00',
        splatColor: 'rgba(255, 234, 0, 0.45)',
        skinColor: '#ffd700',
        innerColor: '#fff9a6',
        rindColor: '#fffae0'
    },
    golden: {
        id: 'golden',
        name: 'Golden Dragon Fruit',
        radius: 40,
        points: 50,
        juiceColor: '#ffd700',
        splatColor: 'rgba(255, 215, 0, 0.55)',
        skinColor: '#ffd700',
        innerColor: '#fff8b3',
        rindColor: '#ffae00'
    },
    bomb: {
        id: 'bomb',
        name: 'Bomb',
        radius: 38,
        points: 0,
        isBomb: true,
        juiceColor: '#333333',
        splatColor: 'rgba(40, 40, 40, 0.6)'
    },
    freeze: {
        id: 'freeze',
        name: 'Freeze Fruit',
        radius: 39,
        points: 20,
        isPowerup: true,
        powerupType: 'freeze',
        juiceColor: '#00e5ff',
        splatColor: 'rgba(0, 229, 255, 0.5)',
        skinColor: '#00b4d8',
        innerColor: '#caf0f8',
        rindColor: '#90e0ef'
    },
    frenzy: {
        id: 'frenzy',
        name: 'Frenzy Fruit',
        radius: 39,
        points: 20,
        isPowerup: true,
        powerupType: 'frenzy',
        juiceColor: '#d90429',
        splatColor: 'rgba(217, 4, 41, 0.5)',
        skinColor: '#7b2cbf',
        innerColor: '#e0aaff',
        rindColor: '#9d4edd'
    },
    double: {
        id: 'double',
        name: 'Double Score Fruit',
        radius: 39,
        points: 20,
        isPowerup: true,
        powerupType: 'double',
        juiceColor: '#00f5d4',
        splatColor: 'rgba(0, 245, 212, 0.5)',
        skinColor: '#3a86ff',
        innerColor: '#8338ec',
        rindColor: '#ff006e'
    }
};

/**
 * Active airborne fruit or bomb
 */
class Fruit {
    constructor(typeKey, x, y, vx, vy, angularVelocity = 0) {
        this.typeKey = typeKey;
        this.config = FRUIT_TYPES[typeKey] || FRUIT_TYPES.watermelon;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.rotation = Math.random() * Math.PI * 2;
        this.angularVelocity = angularVelocity || (Math.random() - 0.5) * 3.5;
        this.radius = this.config.radius;
        this.isBomb = !!this.config.isBomb;
        this.isPowerup = !!this.config.isPowerup;
        this.powerupType = this.config.powerupType;
        this.isSliced = false;
        this.active = true;
        this.spawnTime = performance.now();
        this.fuseTimer = 0;
        this.hasPenalized = false;
    }

    update(dt, gravity) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += gravity * dt;
        this.rotation += this.angularVelocity * dt;
        this.fuseTimer += dt;
    }

    draw(ctx) {
        if (!this.active || this.isSliced) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.isBomb) {
            this.drawBomb(ctx);
        } else {
            this.drawFruitBody(ctx, this.typeKey);
        }

        ctx.restore();
    }

    drawBomb(ctx) {
        const r = this.radius;

        // Metallic Bomb body
        const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#555555');
        grad.addColorStop(0.3, '#222222');
        grad.addColorStop(0.85, '#111111');
        grad.addColorStop(1, '#050505');

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Fuse collar
        ctx.fillStyle = '#777777';
        ctx.fillRect(-r * 0.22, -r - 7, r * 0.44, 8);
        ctx.fillStyle = '#999999';
        ctx.fillRect(-r * 0.2, -r - 9, r * 0.4, 2);

        // Curved rope fuse
        ctx.beginPath();
        ctx.moveTo(0, -r - 7);
        ctx.quadraticCurveTo(r * 0.3, -r - 18, r * 0.15, -r - 28);
        ctx.strokeStyle = '#c49a45';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Sparking fuse tip
        const sparkPhase = (this.fuseTimer * 25) % (Math.PI * 2);
        const sparkX = r * 0.15;
        const sparkY = -r - 28;

        // Glowing spark
        const sparkGrad = ctx.createRadialGradient(sparkX, sparkY, 1, sparkX, sparkY, 12);
        sparkGrad.addColorStop(0, '#ffffff');
        sparkGrad.addColorStop(0.3, '#fffb00');
        sparkGrad.addColorStop(0.7, '#ff3700');
        sparkGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = sparkGrad;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 12 + Math.sin(sparkPhase) * 3, 0, Math.PI * 2);
        ctx.fill();

        // Warning skull/hazard emblem
        ctx.fillStyle = '#ff2222';
        ctx.font = `bold ${Math.floor(r * 0.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', 0, 2);
    }

    drawFruitBody(ctx, typeKey) {
        const r = this.radius;

        switch (typeKey) {
            case 'watermelon':
                this.drawWatermelon(ctx, r);
                break;
            case 'orange':
                this.drawOrange(ctx, r);
                break;
            case 'apple':
                this.drawApple(ctx, r);
                break;
            case 'banana':
                this.drawBanana(ctx, r);
                break;
            case 'pineapple':
                this.drawPineapple(ctx, r);
                break;
            case 'strawberry':
                this.drawStrawberry(ctx, r);
                break;
            case 'peach':
                this.drawPeach(ctx, r);
                break;
            case 'coconut':
                this.drawCoconut(ctx, r);
                break;
            case 'lemon':
                this.drawLemon(ctx, r);
                break;
            case 'golden':
                this.drawGoldenFruit(ctx, r);
                break;
            case 'freeze':
            case 'frenzy':
            case 'double':
                this.drawPowerupFruit(ctx, r, typeKey);
                break;
            default:
                this.drawApple(ctx, r);
        }
    }

    drawWatermelon(ctx, r) {
        // Base rind sphere
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
        grad.addColorStop(0, '#38a84e');
        grad.addColorStop(0.85, '#1e6830');
        grad.addColorStop(1, '#11401c');

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dark green jagged stripes
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = '#0d3314';
        ctx.lineWidth = 5;
        for (let a = -r + 10; a <= r - 10; a += 16) {
            ctx.beginPath();
            ctx.moveTo(a, -r);
            ctx.bezierCurveTo(a + 8, -r * 0.4, a - 8, r * 0.4, a, r);
            ctx.stroke();
        }
        ctx.restore();

        // Gloss highlight
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fill();
    }

    drawOrange(ctx, r) {
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
        grad.addColorStop(0, '#ffaa00');
        grad.addColorStop(0.7, '#ff7700');
        grad.addColorStop(1, '#d45500');

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Stem & green leaf
        ctx.fillStyle = '#4d8000';
        ctx.beginPath();
        ctx.ellipse(r * 0.15, -r + 2, 9, 4, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5c3a21';
        ctx.beginPath();
        ctx.arc(0, -r + 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.ellipse(-r * 0.32, -r * 0.32, r * 0.28, r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.fill();
    }

    drawApple(ctx, r) {
        // Red gradient
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
        grad.addColorStop(0, '#ff3b4b');
        grad.addColorStop(0.75, '#cc001b');
        grad.addColorStop(1, '#800010');

        ctx.beginPath();
        // Hearty apple silhouette
        ctx.moveTo(0, -r + 6);
        ctx.bezierCurveTo(r * 0.8, -r, r * 1.15, -r * 0.2, r * 0.9, r * 0.6);
        ctx.bezierCurveTo(r * 0.7, r * 1.05, 0, r * 0.9, 0, r * 0.95);
        ctx.bezierCurveTo(0, r * 0.9, -r * 0.7, r * 1.05, -r * 0.9, r * 0.6);
        ctx.bezierCurveTo(-r * 1.15, -r * 0.2, -r * 0.8, -r, 0, -r + 6);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Apple stem
        ctx.strokeStyle = '#4a2800';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, -r + 6);
        ctx.quadraticCurveTo(6, -r - 8, 8, -r - 12);
        ctx.stroke();

        // Green leaf
        ctx.fillStyle = '#52b719';
        ctx.beginPath();
        ctx.ellipse(10, -r - 6, 7, 3.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Gloss
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.25, r * 0.25, r * 0.12, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();
    }

    drawBanana(ctx, r) {
        // Curved crescent banana
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, r * 0.4);
        ctx.quadraticCurveTo(0, -r * 0.9, r * 0.9, r * 0.4);
        ctx.quadraticCurveTo(0, -r * 0.3, -r * 0.9, r * 0.4);

        const grad = ctx.createLinearGradient(0, -r, 0, r);
        grad.addColorStop(0, '#ffee55');
        grad.addColorStop(0.7, '#f7d000');
        grad.addColorStop(1, '#d4a400');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Brown tip
        ctx.fillStyle = '#5c3a21';
        ctx.beginPath();
        ctx.arc(-r * 0.9, r * 0.4, 4, 0, Math.PI * 2);
        ctx.arc(r * 0.9, r * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawPineapple(ctx, r) {
        // Body ellipse
        const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.1, r * 0.2, 0, 4, r * 1.1);
        grad.addColorStop(0, '#f5af19');
        grad.addColorStop(0.75, '#b06500');
        grad.addColorStop(1, '#663700');

        ctx.beginPath();
        ctx.ellipse(0, 4, r * 0.8, r * 0.95, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Criss-cross diamond scales
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(92, 53, 0, 0.45)';
        ctx.lineWidth = 2.5;
        for (let i = -r * 1.2; i <= r * 1.2; i += 12) {
            ctx.beginPath();
            ctx.moveTo(i, -r);
            ctx.lineTo(i + r * 1.2, r * 1.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(i, -r);
            ctx.lineTo(i - r * 1.2, r * 1.5);
            ctx.stroke();
        }
        ctx.restore();

        // Crown green leaves
        ctx.fillStyle = '#2d8a39';
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 5, -r * 0.7);
            ctx.quadraticCurveTo(i * 10, -r * 1.4, i * 8, -r * 1.55);
            ctx.quadraticCurveTo(i * 4, -r * 1.1, (i + 1) * 5, -r * 0.7);
            ctx.fill();
        }
    }

    drawStrawberry(ctx, r) {
        // Heart berry shape
        const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#ff3b60');
        grad.addColorStop(0.75, '#e00d36');
        grad.addColorStop(1, '#94001c');

        ctx.beginPath();
        ctx.moveTo(0, -r + 6);
        ctx.bezierCurveTo(r * 0.9, -r * 0.8, r * 0.9, r * 0.2, 0, r * 1.05);
        ctx.bezierCurveTo(-r * 0.9, r * 0.2, -r * 0.9, -r * 0.8, 0, -r + 6);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Tiny yellow seeds
        ctx.fillStyle = '#ffea75';
        const seedOffsets = [
            [-0.4, -0.4], [0, -0.5], [0.4, -0.4],
            [-0.5, -0.1], [-0.1, -0.1], [0.3, -0.1],
            [-0.3, 0.3], [0.1, 0.3], [0, 0.6]
        ];
        seedOffsets.forEach(([sx, sy]) => {
            ctx.beginPath();
            ctx.ellipse(sx * r, sy * r, 1.8, 1.0, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Green calyx top leaves
        ctx.fillStyle = '#40a829';
        for (let a = -2; a <= 2; a++) {
            ctx.beginPath();
            ctx.moveTo(0, -r + 6);
            ctx.lineTo(a * 9, -r - 2);
            ctx.lineTo(a * 4, -r + 4);
            ctx.fill();
        }
    }

    drawPeach(ctx, r) {
        const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.15, 0, 0, r);
        grad.addColorStop(0, '#ffd175');
        grad.addColorStop(0.5, '#ff7070');
        grad.addColorStop(1, '#c2233c');

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Peach crease
        ctx.strokeStyle = 'rgba(120, 20, 20, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(r * 0.15, 0, 0, r);
        ctx.stroke();

        // Stem & leaf
        ctx.fillStyle = '#3a8718';
        ctx.beginPath();
        ctx.ellipse(r * 0.2, -r + 2, 8, 4, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCoconut(ctx, r) {
        // Dark brown hairy shell
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.15, 0, 0, r);
        grad.addColorStop(0, '#784e2d');
        grad.addColorStop(0.7, '#472a14');
        grad.addColorStop(1, '#241407');

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Three coconut eye dots
        ctx.fillStyle = '#170c03';
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.15, 4.5, 0, Math.PI * 2);
        ctx.arc(r * 0.1, -r * 0.3, 4, 0, Math.PI * 2);
        ctx.arc(-r * 0.1, -r * 0.38, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLemon(ctx, r) {
        // Pointy oval lemon
        const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#fff45c');
        grad.addColorStop(0.8, '#ffd000');
        grad.addColorStop(1, '#cca000');

        ctx.beginPath();
        ctx.moveTo(-r * 1.15, 0);
        ctx.quadraticCurveTo(-r * 0.7, -r * 0.85, 0, -r * 0.85);
        ctx.quadraticCurveTo(r * 0.7, -r * 0.85, r * 1.15, 0);
        ctx.quadraticCurveTo(r * 0.7, r * 0.85, 0, r * 0.85);
        ctx.quadraticCurveTo(-r * 0.7, r * 0.85, -r * 1.15, 0);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Highlight
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.25, r * 0.3, r * 0.12, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();
    }

    drawGoldenFruit(ctx, r) {
        // Pulsing shimmering gold
        const time = performance.now() / 250;
        const pulse = 1 + Math.sin(time) * 0.08;

        const auraGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.5 * pulse);
        auraGrad.addColorStop(0, 'rgba(255, 235, 100, 0.7)');
        auraGrad.addColorStop(0.6, 'rgba(255, 180, 0, 0.35)');
        auraGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(0, 0, r * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();

        // 8-pointed star fruit
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#fff570');
        grad.addColorStop(0.7, '#ffc400');
        grad.addColorStop(1, '#b8860b');

        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a1 = (i * Math.PI) / 4;
            const a2 = a1 + Math.PI / 8;
            const x1 = Math.cos(a1) * r;
            const y1 = Math.sin(a1) * r;
            const x2 = Math.cos(a2) * (r * 0.65);
            const y2 = Math.sin(a2) * (r * 0.65);
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sparkle glints
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.3, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPowerupFruit(ctx, r, typeKey) {
        const time = performance.now() / 200;
        let c1, c2, symbol;

        if (typeKey === 'freeze') {
            c1 = '#caf0f8';
            c2 = '#0077b6';
            symbol = '❄';
        } else if (typeKey === 'frenzy') {
            c1 = '#e0aaff';
            c2 = '#5a189a';
            symbol = '⚡';
        } else {
            c1 = '#a0c4ff';
            c2 = '#023e8a';
            symbol = '2X';
        }

        const auraGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.4);
        auraGrad.addColorStop(0, c1);
        auraGrad.addColorStop(0.7, c2);
        auraGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = c2;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(r * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, 2);
    }
}

/**
 * Sliced Fruit Half - flies outward under physics with realistic exposed internal flesh
 */
class FruitHalf {
    constructor(typeKey, x, y, vx, vy, rotation, angularVelocity, cutAngle, isUpperHalf = true) {
        this.typeKey = typeKey;
        this.config = FRUIT_TYPES[typeKey] || FRUIT_TYPES.watermelon;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.rotation = rotation;
        this.angularVelocity = angularVelocity;
        this.cutAngle = cutAngle;
        this.isUpperHalf = isUpperHalf;
        this.radius = this.config.radius;
        this.active = true;
    }

    update(dt, gravity) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += gravity * dt;
        this.rotation += this.angularVelocity * dt;
    }

    draw(ctx) {
        if (!this.active) return;
        const r = this.radius;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Clip to half circle along cut plane
        ctx.beginPath();
        if (this.isUpperHalf) {
            ctx.arc(0, 0, r + 2, 0, Math.PI, true);
        } else {
            ctx.arc(0, 0, r + 2, 0, Math.PI, false);
        }
        ctx.closePath();
        ctx.clip();

        // Draw internal sliced cross section
        this.drawCrossSection(ctx, r, this.typeKey);

        ctx.restore();
    }

    drawCrossSection(ctx, r, typeKey) {
        // Outer skin rim
        ctx.fillStyle = this.config.skinColor || '#228833';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Pale inner rind
        ctx.fillStyle = this.config.rindColor || '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
        ctx.fill();

        // Juicy Flesh
        ctx.fillStyle = this.config.innerColor || '#ff2244';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
        ctx.fill();

        // Internal details (seeds, spokes, cores)
        if (typeKey === 'watermelon') {
            // Black teardrop watermelon seeds
            ctx.fillStyle = '#1a1a1a';
            for (let a = 0.4; a < Math.PI * 2 - 0.4; a += 0.7) {
                const sx = Math.cos(a) * (r * 0.55);
                const sy = Math.sin(a) * (r * 0.55);
                ctx.beginPath();
                ctx.ellipse(sx, sy, 3, 1.8, a, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (typeKey === 'orange' || typeKey === 'lemon') {
            // Citrus segment spokes
            ctx.strokeStyle = this.config.rindColor;
            ctx.lineWidth = 1.8;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * (r * 0.8), Math.sin(a) * (r * 0.8));
                ctx.stroke();
            }
            ctx.fillStyle = this.config.rindColor;
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (typeKey === 'apple') {
            // Core and 2 seeds
            ctx.fillStyle = '#eddab4';
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3a2010';
            ctx.beginPath();
            ctx.ellipse(-4, 0, 2.5, 1.5, Math.PI / 4, 0, Math.PI * 2);
            ctx.ellipse(4, 0, 2.5, 1.5, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (typeKey === 'coconut') {
            // Hollow inner center
            ctx.fillStyle = '#261408';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
            ctx.fill();
        } else if (typeKey === 'peach') {
            // Peach pit
            ctx.fillStyle = '#7a3e1d';
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.3, r * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cut surface shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-r, -2, r * 2, 4);
    }
}

window.FRUIT_TYPES = FRUIT_TYPES;
window.Fruit = Fruit;
window.FruitHalf = FruitHalf;
