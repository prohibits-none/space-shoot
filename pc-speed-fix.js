/* PC GAMEPLAY SPEED TUNER
   Desktop only. Mobile is untouched.

   The base game is frame-based. We boost the world after the normal update,
   but deliberately do NOT create a second animation loop. The previous
   catch-up loop could make motion uneven, so it has been removed.
*/
(function () {
    "use strict";

    const isMobile =
        window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (isMobile) return;

    // Your ship stays at the current comfortable speed.
    const PLAYER_EXTRA = 0;

    // Make the rest of the game clearly faster.
    const BULLET_EXTRA = 1.15;
    const ENEMY_EXTRA = 1.00;
    const ASTEROID_EXTRA = 1.00;
    const POWERUP_EXTRA = 0.90;
    const PARTICLE_EXTRA = 0.75;
    const BOSS_EXTRA = 0.85;
    const TIMER_EXTRA = 0.90;

    function moveVelocity(o, factor) {
        if (!o) return;
        if (Number.isFinite(o.vx)) o.x += o.vx * factor;
        if (Number.isFinite(o.vy)) o.y += o.vy * factor;
    }

    function clampPlayer() {
        if (typeof player === "undefined" || typeof canvas === "undefined") return;
        player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
        player.y = Math.max(70, Math.min(canvas.height - 35, player.y));
    }

    function install() {
        if (typeof updatePlayer !== "function" ||
            typeof updateBullets !== "function" ||
            typeof updateEnemies !== "function") {
            setTimeout(install, 30);
            return;
        }

        if (window.__spaceShootPcSpeedInstalled) return;
        window.__spaceShootPcSpeedInstalled = true;

        const originalPlayer = updatePlayer;
        updatePlayer = function () {
            originalPlayer();
            if (PLAYER_EXTRA <= 0) return;

            if (typeof keys === "undefined" || typeof player === "undefined") return;
            let dx = 0, dy = 0;
            if (keys.w || keys.arrowup) dy--;
            if (keys.s || keys.arrowdown) dy++;
            if (keys.a || keys.arrowleft) dx--;
            if (keys.d || keys.arrowright) dx++;

            if (dx || dy) {
                const len = Math.hypot(dx, dy) || 1;
                player.x += (dx / len) * player.speed * PLAYER_EXTRA;
                player.y += (dy / len) * player.speed * PLAYER_EXTRA;
                clampPlayer();
            }
        };

        const originalBullets = updateBullets;
        updateBullets = function () {
            originalBullets();
            if (typeof bullets !== "undefined") bullets.forEach(b => moveVelocity(b, BULLET_EXTRA));
            if (typeof enemyBullets !== "undefined") enemyBullets.forEach(b => moveVelocity(b, BULLET_EXTRA));
        };

        const originalEnemies = updateEnemies;
        updateEnemies = function () {
            originalEnemies();
            if (typeof enemies === "undefined") return;
            enemies.forEach(e => {
                e.y += e.speed * ENEMY_EXTRA;
                e.phase += 0.04 * ENEMY_EXTRA;
                if (e.type === "zigzag") e.x += Math.sin(e.phase) * 2.5 * ENEMY_EXTRA;
            });
        };

        const originalAsteroids = updateAsteroids;
        updateAsteroids = function () {
            originalAsteroids();
            if (typeof asteroids === "undefined") return;
            asteroids.forEach(a => {
                a.y += a.speed * ASTEROID_EXTRA;
                a.rotation += a.rotationSpeed * ASTEROID_EXTRA;
            });
        };

        const originalPowerups = updatePowerups;
        updatePowerups = function () {
            originalPowerups();
            if (typeof powerups === "undefined") return;
            powerups.forEach(p => p.y += p.speed * POWERUP_EXTRA);
        };

        if (typeof updateParticles === "function") {
            const originalParticles = updateParticles;
            updateParticles = function () {
                originalParticles();
                if (typeof particles === "undefined") return;
                particles.forEach(p => {
                    p.x += p.vx * PARTICLE_EXTRA;
                    p.y += p.vy * PARTICLE_EXTRA;
                    p.life -= 0.025 * PARTICLE_EXTRA;
                });
            };
        }

        if (typeof updateBoss === "function") {
            const originalBoss = updateBoss;
            updateBoss = function () {
                originalBoss();
                if (typeof boss === "undefined" || !boss) return;
                if (boss.y < 130) boss.y += 1.5 * BOSS_EXTRA;
                else boss.x += boss.speed * boss.direction * BOSS_EXTRA;
            };
        }

        const originalSpawning = updateSpawning;
        updateSpawning = function () {
            originalSpawning();
            if (typeof spawnTimer !== "undefined") spawnTimer -= 16 * TIMER_EXTRA;
            if (typeof asteroidTimer !== "undefined") asteroidTimer -= 16 * TIMER_EXTRA;
            if (typeof powerTimer !== "undefined") powerTimer -= 16 * TIMER_EXTRA;
        };
    }

    install();
})();
