/* PC TURBO MODE
   Desktop only. Mobile is intentionally untouched.
   The previous PC patch was too conservative. This pass makes the desktop
   game aggressively fast: player, bullets, enemies, asteroids, powerups,
   particles, boss movement and spawn cadence all get a strong boost.
*/
(function () {
    "use strict";

    const isMobile = window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) return;

    // Extra movement is applied after the normal game update.
    // Original movement + 3 extra passes = about 4x frame-based movement.
    const BOOST = 3.0;
    const TIMER_BOOST = 3.0;

    function install() {
        if (typeof updatePlayer !== "function" ||
            typeof updateBullets !== "function" ||
            typeof updateEnemies !== "function" ||
            typeof updateAsteroids !== "function" ||
            typeof updatePowerups !== "function") {
            setTimeout(install, 20);
            return;
        }

        if (window.__spaceShootPcTurboInstalled) return;
        window.__spaceShootPcTurboInstalled = true;

        // PLAYER: the base game uses dx/dy * 120, so repeat that movement
        // three additional times to make PC controls feel properly fast.
        const originalPlayer = updatePlayer;
        updatePlayer = function () {
            originalPlayer();
            if (typeof player === "undefined" || typeof canvas === "undefined") return;

            let dx = 0;
            let dy = 0;
            if (keys.w || keys.arrowup) dy--;
            if (keys.s || keys.arrowdown) dy++;
            if (keys.a || keys.arrowleft) dx--;
            if (keys.d || keys.arrowright) dx++;

            if (dx || dy) {
                const len = Math.hypot(dx, dy) || 1;
                player.x += (dx / len) * 120 * BOOST;
                player.y += (dy / len) * 120 * BOOST;
                player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
                player.y = Math.max(70, Math.min(canvas.height - 35, player.y));
            }
        };

        // BULLETS: player and enemy projectiles become much faster.
        const originalBullets = updateBullets;
        updateBullets = function () {
            originalBullets();
            if (typeof bullets !== "undefined") bullets.forEach(b => {
                if (Number.isFinite(b.vx)) b.x += b.vx * BOOST;
                if (Number.isFinite(b.vy)) b.y += b.vy * BOOST;
            });
            if (typeof enemyBullets !== "undefined") enemyBullets.forEach(b => {
                if (Number.isFinite(b.vx)) b.x += b.vx * BOOST;
                if (Number.isFinite(b.vy)) b.y += b.vy * BOOST;
            });
        };

        // ENEMIES: fast downward movement and faster zig-zag motion.
        const originalEnemies = updateEnemies;
        updateEnemies = function () {
            originalEnemies();
            if (typeof enemies === "undefined") return;
            enemies.forEach(e => {
                if (Number.isFinite(e.speed)) e.y += e.speed * BOOST;
                if (Number.isFinite(e.phase)) e.phase += 0.04 * BOOST;
                if (e.type === "zigzag") e.x += Math.sin(e.phase) * 2.5 * BOOST;
            });
        };

        // ASTEROIDS: faster falling and rotation.
        const originalAsteroids = updateAsteroids;
        updateAsteroids = function () {
            originalAsteroids();
            if (typeof asteroids === "undefined") return;
            asteroids.forEach(a => {
                if (Number.isFinite(a.speed)) a.y += a.speed * BOOST;
                if (Number.isFinite(a.rotationSpeed)) a.rotation += a.rotationSpeed * BOOST;
            });
        };

        // POWERUPS: much faster movement.
        const originalPowerups = updatePowerups;
        updatePowerups = function () {
            originalPowerups();
            if (typeof powerups === "undefined") return;
            powerups.forEach(p => {
                if (Number.isFinite(p.speed)) p.y += p.speed * BOOST;
            });
        };

        // PARTICLES: faster explosions/trails.
        if (typeof updateParticles === "function") {
            const originalParticles = updateParticles;
            updateParticles = function () {
                originalParticles();
                if (typeof particles === "undefined") return;
                particles.forEach(p => {
                    if (Number.isFinite(p.vx)) p.x += p.vx * BOOST;
                    if (Number.isFinite(p.vy)) p.y += p.vy * BOOST;
                    p.life -= 0.025 * BOOST;
                });
            };
        }

        // BOSS: fast entry and horizontal movement.
        if (typeof updateBoss === "function") {
            const originalBoss = updateBoss;
            updateBoss = function () {
                originalBoss();
                if (typeof boss === "undefined" || !boss) return;
                if (boss.y < 130) boss.y += 1.5 * BOOST;
                else if (Number.isFinite(boss.speed) && Number.isFinite(boss.direction))
                    boss.x += boss.speed * boss.direction * BOOST;
            };
        }

        // SPAWNING: enemies, asteroids and powerups appear much more quickly.
        if (typeof updateSpawning === "function") {
            const originalSpawning = updateSpawning;
            updateSpawning = function () {
                originalSpawning();
                if (typeof spawnTimer !== "undefined") spawnTimer -= 16 * TIMER_BOOST;
                if (typeof asteroidTimer !== "undefined") asteroidTimer -= 16 * TIMER_BOOST;
                if (typeof powerTimer !== "undefined") powerTimer -= 16 * TIMER_BOOST;
            };
        }

        // Faster shooting/cooldowns on PC too.
        if (typeof player !== "undefined") {
            player.fireRate = Math.max(45, player.fireRate * 0.35);
            player.dashCooldown = 0;
            player.shieldCooldown = 0;
        }
    }

    install();
})();
