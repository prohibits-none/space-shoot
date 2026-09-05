/* =========================================================
   GALAXY STRIKE — NEON SHIP / ENEMY / BULLET / SPACE VISUALS
   Procedural canvas art inspired by the supplied neon sci-fi reference.
   No external images or assets required.
========================================================= */
(function () {
    "use strict";

    if (typeof ctx === "undefined" || typeof canvas === "undefined") return;

    const TAU = Math.PI * 2;
    let visualTime = 0;

    const starsLayer = Array.from({ length: 110 }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.7 + 0.25,
        speed: Math.random() * 0.45 + 0.12,
        twinkle: Math.random() * TAU,
        depth: Math.random() * 0.8 + 0.2,
        hue: i % 7 === 0 ? 195 : (i % 11 === 0 ? 290 : 0)
    }));

    function hexToRgb(hex) {
        const n = parseInt(hex.replace("#", ""), 16);
        return {
            r: (n >> 16) & 255,
            g: (n >> 8) & 255,
            b: n & 255
        };
    }

    function rgba(hex, alpha) {
        const c = hexToRgb(hex);
        return `rgba(${c.r},${c.g},${c.b},${alpha})`;
    }

    function glow(color, blur) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
    }

    function poly(points, fill, stroke, width = 1, blur = 0) {
        ctx.beginPath();
        points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
        if (fill) ctx.fillStyle = fill;
        if (stroke) ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        if (blur) glow(stroke || fill, blur);
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function roundedCore(x, y, radius, color) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.8);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.18, color);
        g.addColorStop(0.45, rgba(color, 0.8));
        g.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2.8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        glow(color, 18);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawEngine(x, y, width, length, color) {
        const pulse = 0.82 + Math.sin(visualTime * 0.012 + x) * 0.16;
        const g = ctx.createLinearGradient(x, y, x, y + length);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.18, color);
        g.addColorStop(0.62, rgba(color, 0.72));
        g.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = g;
        glow(color, 24);
        ctx.beginPath();
        ctx.moveTo(x - width * 0.5, y);
        ctx.lineTo(x, y + length * pulse);
        ctx.lineTo(x + width * 0.5, y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawBackgroundNeon() {
        visualTime = performance.now();
        const w = canvas.width;
        const h = canvas.height;

        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, "#01020b");
        bg.addColorStop(0.45, "#07052a");
        bg.addColorStop(1, "#02020b");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Deep violet/cyan nebula clouds.
        const nebulae = [
            [w * 0.18, h * 0.28, Math.max(w, h) * 0.52, "#7b00ff", 0.15],
            [w * 0.78, h * 0.48, Math.max(w, h) * 0.48, "#005cff", 0.13],
            [w * 0.42, h * 0.78, Math.max(w, h) * 0.42, "#ff00d9", 0.09]
        ];
        nebulae.forEach((n, i) => {
            const drift = Math.sin(visualTime * 0.00018 + i) * 18;
            const g = ctx.createRadialGradient(n[0] + drift, n[1], 0, n[0], n[1], n[2]);
            g.addColorStop(0, rgba(n[3], n[4]));
            g.addColorStop(0.45, rgba(n[3], n[4] * 0.35));
            g.addColorStop(1, rgba(n[3], 0));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        });

        // Subtle diagonal energy haze.
        ctx.save();
        ctx.translate(w * 0.5, h * 0.55);
        ctx.rotate(-0.28);
        const haze = ctx.createLinearGradient(-w, 0, w, 0);
        haze.addColorStop(0, "rgba(0,0,0,0)");
        haze.addColorStop(0.46, "rgba(0,180,255,0.025)");
        haze.addColorStop(0.54, "rgba(255,0,220,0.035)");
        haze.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = haze;
        ctx.fillRect(-w, -h, w * 2, h * 2);
        ctx.restore();

        // Fast starfield with occasional blue/purple stars.
        starsLayer.forEach(s => {
            s.y += s.speed * s.depth * 0.00075;
            if (s.y > 1.02) {
                s.y = -0.02;
                s.x = Math.random();
            }
            const twinkle = 0.45 + Math.sin(visualTime * 0.002 + s.twinkle) * 0.3;
            const x = s.x * w;
            const y = s.y * h;
            const color = s.hue === 195 ? "#6feaff" : s.hue === 290 ? "#e49aff" : "#ffffff";
            ctx.globalAlpha = Math.max(0.18, twinkle) * s.depth;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, s.r, 0, TAU);
            ctx.fill();
            if (s.r > 1.25) {
                ctx.globalAlpha *= 0.35;
                ctx.fillRect(x - s.r * 3, y - 0.35, s.r * 6, 0.7);
                ctx.fillRect(x - 0.35, y - s.r * 3, 0.7, s.r * 6);
            }
        });
        ctx.globalAlpha = 1;

        // A few distant glowing dust points.
        for (let i = 0; i < 18; i++) {
            const x = ((i * 157.7 + 31) % 997) / 997 * w;
            const y = ((i * 313.1 + 77) % 991) / 991 * h;
            ctx.fillStyle = i % 3 === 0 ? "#8c3dff" : "#153c91";
            ctx.globalAlpha = 0.16;
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.globalAlpha = 1;
    }

    function drawPlayerNeon() {
        ctx.save();
        ctx.translate(player.x, player.y);
        const flicker = 0.92 + Math.sin(visualTime * 0.018) * 0.08;

        if (player.invulnerable > 0) {
            ctx.globalAlpha = Math.sin(visualTime * 0.035) > 0 ? 0.42 : 1;
        }

        // Engine plumes.
        drawEngine(-9, 17, 9, 34 * flicker, "#00d9ff");
        drawEngine(9, 17, 9, 34 * flicker, "#006dff");
        drawEngine(0, 14, 11, 48 * flicker, "#ff3cff");

        // Outer wing blades.
        poly([[-13, 10], [-35, 27], [-27, 4], [-17, -1]], "#d8f5ff", "#45cfff", 1.5, 14);
        poly([[13, 10], [35, 27], [27, 4], [17, -1]], "#d8f5ff", "#45cfff", 1.5, 14);
        poly([[-18, 3], [-31, 15], [-24, -9], [-12, -17]], "#235cff", "#00eaff", 2, 18);
        poly([[18, 3], [31, 15], [24, -9], [12, -17]], "#235cff", "#00eaff", 2, 18);

        // Main armored hull.
        const hull = ctx.createLinearGradient(0, -36, 0, 28);
        hull.addColorStop(0, "#f7fdff");
        hull.addColorStop(0.18, "#9edfff");
        hull.addColorStop(0.5, "#1477c9");
        hull.addColorStop(0.78, "#071d55");
        hull.addColorStop(1, "#020617");
        poly([[0, -39], [13, -9], [25, 24], [8, 18], [0, 29], [-8, 18], [-25, 24], [-13, -9]], hull, "#6be8ff", 1.6, 20);

        // Purple side armor.
        poly([[-13, -8], [-22, 8], [-12, 17], [-5, 7]], "#6e25d8", "#c45cff", 1.2, 15);
        poly([[13, -8], [22, 8], [12, 17], [5, 7]], "#6e25d8", "#c45cff", 1.2, 15);

        // Nose crystal and cockpit.
        poly([[0, -31], [8, -7], [0, 2], [-8, -7]], "#dffcff", "#9bf7ff", 1.2, 18);
        const cockpit = ctx.createRadialGradient(0, -9, 1, 0, -9, 10);
        cockpit.addColorStop(0, "#ffffff");
        cockpit.addColorStop(0.2, "#8fffff");
        cockpit.addColorStop(0.65, "#00aaff");
        cockpit.addColorStop(1, "#003d9e");
        ctx.fillStyle = cockpit;
        glow("#00eaff", 24);
        ctx.beginPath();
        ctx.arc(0, -9, 8.5, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Center energy seam.
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        glow("#00eaff", 10);
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(0, 21);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Active shield ring.
        if (player.shieldActive) {
            const pulse = 42 + Math.sin(visualTime * 0.01) * 3;
            ctx.strokeStyle = "#00eaff";
            ctx.lineWidth = 3;
            glow("#00eaff", 28);
            ctx.beginPath();
            ctx.arc(0, 0, pulse, 0, TAU);
            ctx.stroke();
            ctx.strokeStyle = rgba("#a900ff", 0.65);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, pulse + 5, -0.8, 1.2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    function enemyPalette(type) {
        if (type === "fighter") return ["#ff244f", "#ff7b20", "#ff003d"];
        if (type === "zigzag") return ["#a800ff", "#ff43ff", "#5b17d8"];
        if (type === "shooter") return ["#00eaff", "#4cffc7", "#006bff"];
        return ["#ff8a00", "#ffd21f", "#d43b00"];
    }

    function drawEnemyShip(e) {
        const size = e.size;
        const [main, edge, core] = enemyPalette(e.type);
        const s = size / 35;

        ctx.save();
        ctx.translate(e.x, e.y);

        // Engine glow points down, since enemies face the player.
        drawEngine(-9 * s, -8 * s, 7 * s, 22 * s, main);
        drawEngine(9 * s, -8 * s, 7 * s, 22 * s, main);

        if (e.type === "tank") {
            poly([[-25, -14], [-12, -28], [0, -22], [12, -28], [25, -14], [18, 25], [0, 31], [-18, 25]], "#1b202d", main, 2, 22);
            poly([[-24, -9], [-7, -19], [-4, 22], [-18, 17]], "#303846", edge, 1, 12);
            poly([[24, -9], [7, -19], [4, 22], [18, 17]], "#303846", edge, 1, 12);
            poly([[0, -23], [9, -6], [8, 20], [0, 27], [-8, 20], [-9, -6]], "#151a25", edge, 1.5, 16);
            roundedCore(0, 3, 7 * s, core);
            ctx.strokeStyle = edge;
            ctx.lineWidth = 2;
            glow(edge, 12);
            ctx.beginPath();
            ctx.moveTo(-30, 6);
            ctx.lineTo(-17, -2);
            ctx.moveTo(30, 6);
            ctx.lineTo(17, -2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (e.type === "shooter") {
            poly([[0, 28], [-20, 6], [-14, -20], [0, -29], [14, -20], [20, 6]], "#061a29", edge, 2, 20);
            poly([[-13, 5], [-29, -2], [-19, -17], [-8, -6]], main, edge, 1.5, 16);
            poly([[13, 5], [29, -2], [19, -17], [8, -6]], main, edge, 1.5, 16);
            roundedCore(0, 1, 8 * s, core);
            ctx.strokeStyle = rgba(edge, 0.75);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 1, 15 * s, 0, TAU);
            ctx.stroke();
        } else if (e.type === "zigzag") {
            poly([[0, 28], [-9, 12], [-29, -13], [-13, -7], [0, 2], [13, -7], [29, -13], [9, 12]], "#160b2d", edge, 2, 22);
            poly([[-5, 14], [-19, -9], [-8, -4], [0, 4]], main, edge, 1, 14);
            poly([[5, 14], [19, -9], [8, -4], [0, 4]], main, edge, 1, 14);
            roundedCore(0, 7, 6 * s, core);
        } else {
            poly([[0, 30], [-9, 11], [-28, 3], [-18, -16], [-5, -8], [0, -29], [5, -8], [18, -16], [28, 3], [9, 11]], "#240812", edge, 2, 22);
            poly([[-4, -23], [-12, 0], [0, 9], [4, -1]], main, edge, 1, 15);
            poly([[4, -23], [12, 0], [0, 9], [-4, -1]], main, edge, 1, 15);
            roundedCore(0, 5, 7 * s, core);
        }

        // Small luminous wing tips.
        ctx.fillStyle = edge;
        glow(edge, 10);
        ctx.beginPath();
        ctx.arc(-size * 0.42, size * 0.12, Math.max(1.5, size * 0.045), 0, TAU);
        ctx.arc(size * 0.42, size * 0.12, Math.max(1.5, size * 0.045), 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    function drawEnemiesNeon() {
        for (const e of enemies) {
            drawEnemyShip(e);

            const width = e.size;
            const ratio = Math.max(0, e.health / e.maxHealth);
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(e.x - width / 2, e.y - e.size / 2 - 10, width, 4);
            ctx.fillStyle = enemyPalette(e.type)[1];
            glow(enemyPalette(e.type)[1], 8);
            ctx.fillRect(e.x - width / 2, e.y - e.size / 2 - 10, width * ratio, 4);
            ctx.shadowBlur = 0;
        }
    }

    function drawBulletsNeon() {
        const drawOne = (b, enemy) => {
            const speed = Math.hypot(b.vx, b.vy) || 1;
            const ux = b.vx / speed;
            const uy = b.vy / speed;
            const trail = enemy ? 16 : 23;
            const x2 = b.x - ux * trail;
            const y2 = b.y - uy * trail;

            ctx.save();
            ctx.lineCap = "round";
            ctx.strokeStyle = rgba(b.color, 0.18);
            ctx.lineWidth = b.radius * 3.8;
            glow(b.color, 22);
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = Math.max(1.2, b.radius * 0.9);
            glow(b.color, 16);
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 1.15, 0, TAU);
            ctx.fill();
            ctx.restore();
        };

        for (const b of bullets) drawOne(b, false);
        for (const b of enemyBullets) drawOne(b, true);
    }

    function drawBossNeon() {
        if (!boss) return;

        ctx.save();
        ctx.translate(boss.x, boss.y);
        const pulse = 1 + Math.sin(visualTime * 0.006) * 0.035;
        ctx.scale(pulse, pulse);

        const wing = "#b400ff";
        const edge = "#ff3fd7";
        const armor = "#181327";

        // Huge rear energy plume.
        drawEngine(-36, 36, 18, 54, "#ff1bc7");
        drawEngine(36, 36, 18, 54, "#ff1bc7");
        drawEngine(0, 43, 22, 70, "#ff7b19");

        // Outer angular wings.
        poly([[-78, -27], [-45, -55], [-23, -38], [-31, 38], [-61, 26]], armor, edge, 2, 30);
        poly([[78, -27], [45, -55], [23, -38], [31, 38], [61, 26]], armor, edge, 2, 30);
        poly([[-72, -20], [-52, -42], [-40, -31], [-54, 13]], wing, "#f16cff", 2, 24);
        poly([[72, -20], [52, -42], [40, -31], [54, 13]], wing, "#f16cff", 2, 24);

        // Main boss hull.
        poly([[-48, -43], [-28, -65], [0, -51], [28, -65], [48, -43], [39, 39], [17, 55], [0, 47], [-17, 55], [-39, 39]], armor, edge, 2.5, 32);
        poly([[-30, -45], [-13, -53], [0, -39], [13, -53], [30, -45], [20, 24], [0, 39], [-20, 24]], "#28112e", "#ff285e", 2, 24);

        // Purple energy claws.
        poly([[-40, 10], [-63, 28], [-51, 2], [-34, -10]], "#6518b8", "#d54dff", 2, 22);
        poly([[40, 10], [63, 28], [51, 2], [34, -10]], "#6518b8", "#d54dff", 2, 22);

        // Reactor core.
        const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 36);
        coreGlow.addColorStop(0, "#ffffff");
        coreGlow.addColorStop(0.12, "#ff8aff");
        coreGlow.addColorStop(0.32, "#ff174f");
        coreGlow.addColorStop(0.7, "rgba(255,0,100,0.45)");
        coreGlow.addColorStop(1, "rgba(255,0,100,0)");
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(0, 2, 36, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        glow("#ff174f", 30);
        ctx.beginPath();
        ctx.arc(0, 2, 13, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ff164f";
        ctx.beginPath();
        ctx.arc(0, 2, 9, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Twin weapon cores.
        roundedCore(-31, 15, 6, "#ff6a00");
        roundedCore(31, 15, 6, "#ff6a00");

        ctx.restore();
    }

    function drawAsteroidsNeon() {
        for (const a of asteroids) {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation);
            const r = a.radius;
            const points = [];
            for (let i = 0; i < 9; i++) {
                const ang = i / 9 * TAU;
                const wobble = 0.84 + ((i * 37) % 13) / 100;
                points.push([Math.cos(ang) * r * wobble, Math.sin(ang) * r * wobble]);
            }
            poly(points, "#17182b", "#4e4e72", 1.5, 8);
            ctx.strokeStyle = "rgba(0,220,255,0.32)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(-r * 0.2, -r * 0.18, r * 0.34, 0, TAU);
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawPowerupsNeon() {
        const colors = { health: "#ff3b58", shield: "#00d9ff", weapon: "#ff3cff", coin: "#ffd21f", rapid: "#7dff39" };
        const symbols = { health: "+", shield: "S", weapon: "W", coin: "$", rapid: "⚡" };
        for (const p of powerups) {
            const c = colors[p.type] || "#ffffff";
            const pulse = 17 + Math.sin(visualTime * 0.009 + p.x) * 2;
            ctx.save();
            ctx.strokeStyle = c;
            ctx.lineWidth = 2;
            glow(c, 20);
            ctx.beginPath();
            ctx.arc(p.x, p.y, pulse, 0, TAU);
            ctx.stroke();
            ctx.fillStyle = "rgba(5,7,22,0.82)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 12, 0, TAU);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 15px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(symbols[p.type], p.x, p.y + 1);
            ctx.restore();
        }
    }

    // Replace the game's original drawing functions without touching gameplay logic.
    drawBackground = drawBackgroundNeon;
    drawPlayer = drawPlayerNeon;
    drawEnemies = drawEnemiesNeon;
    drawBullets = drawBulletsNeon;
    drawBoss = drawBossNeon;
    drawAsteroids = drawAsteroidsNeon;
    drawPowerups = drawPowerupsNeon;

    // Sci-fi HUD/control styling is injected so the existing HTML keeps working.
    const style = document.createElement("style");
    style.textContent = `
        #hud { padding: 14px 18px !important; font-family: Arial, Helvetica, sans-serif; }
        .hudSide, .hudCenter { filter: drop-shadow(0 0 8px rgba(0,220,255,.28)); }
        .hudSide { padding: 8px 12px; border: 1px solid rgba(0,220,255,.38); background: linear-gradient(135deg,rgba(3,12,36,.72),rgba(10,2,35,.42)); clip-path: polygon(0 0,92% 0,100% 28%,92% 100%,0 100%); }
        .hudSide.right { clip-path: polygon(8% 0,100% 0,100% 100%,8% 100%,0 72%,0 28%); }
        .title { letter-spacing: 5px !important; text-shadow: 0 0 8px #00eaff,0 0 22px #006eff !important; }
        #bossUI { top: 72px !important; }
        #bossText { letter-spacing: 3px; text-shadow: 0 0 8px #ff174f,0 0 22px #b400ff !important; }
        .bossOuter { border-color: #ff72df !important; box-shadow: 0 0 14px rgba(255,0,180,.45), inset 0 0 12px rgba(255,0,180,.2); }
        #bossBar { background: linear-gradient(90deg,#ff003c,#ff21c8,#7d00ff) !important; box-shadow: 0 0 14px #ff21c8; }
        button { border-color: #00dfff !important; background: linear-gradient(135deg,rgba(0,225,255,.11),rgba(112,0,255,.10)) !important; box-shadow: inset 0 0 14px rgba(0,225,255,.05),0 0 8px rgba(0,225,255,.12); }
        button:hover { border-color:#ff45ff !important; box-shadow:0 0 18px rgba(255,45,255,.35) !important; }
        #mobileJoystick { box-shadow:0 0 18px rgba(0,220,255,.45), inset 0 0 22px rgba(0,40,120,.55) !important; border-color:rgba(73,232,255,.82) !important; background:radial-gradient(circle,rgba(50,110,255,.26),rgba(10,6,40,.72)) !important; }
        #joystickStick { box-shadow:0 0 20px #00eaff, inset 0 0 12px rgba(255,255,255,.35) !important; background:radial-gradient(circle at 35% 30%,#fff,#00d9ff 45%,#2455ff) !important; }
        #mobileFire { box-shadow:0 0 16px #ff2bdb, inset 0 0 14px rgba(255,255,255,.18) !important; border-color:#ff42e4 !important; background:radial-gradient(circle,rgba(255,45,224,.35),rgba(42,3,56,.72)) !important; }
    `;
    document.head.appendChild(style);
})();
