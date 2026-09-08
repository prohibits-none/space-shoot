/* PC SPEED SYNC
   Desktop only. Match the mobile gameplay pace instead of stacking multiple
   movement passes. The original game update runs once per frame; this file
   adds one controlled extra pass for moving world objects and timers.
*/
(function () {
    "use strict";

    const isMobile = window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) return;

    // Mobile-feeling pace. Kept in one place so every moving object gets the
    // same treatment and PC does not become slower than mobile.
    const WORLD = 1.0;
    const BULLETS = 1.0;
    const ENEMIES = 1.0;
    const ASTEROIDS = 1.0;
    const POWERUPS = 1.0;
    const PARTICLES = 1.0;
    const BOSS = 1.0;
    const TIMERS = 1.0;

    function install() {
        if (typeof updateBullets !== "function" ||
            typeof updateEnemies !== "function" ||
            typeof updateAsteroids !== "function" ||
            typeof updatePowerups !== "function") {
            setTimeout(install, 30);
            return;
        }

        if (window.__spaceShootPcSpeedInstalled) return;
        window.__spaceShootPcSpeedInstalled = true;

        const move = (o, factor) => {
            if (!o) return;
            if (Number.isFinite(o.vx)) o.x += o.vx * factor;
            if (Number.isFinite(o.vy)) o.y += o.vy * factor;
        };

        const originalBullets = updateBullets;
        updateBullets = function () {
            originalBullets();
            if (typeof bullets !== "undefined") bullets.forEach(b => move(b, BULLETS));
            if (typeof enemyBullets !== "undefined") enemyBullets.forEach(b => move(b, BULLETS));
        };

        const originalEnemies = updateEnemies;
        updateEnemies = function () {
            originalEnemies();
            if (typeof enemies === "undefined") return;
            enemies.forEach(e => {
                e.y += e.speed * ENEMIES;
                if (Number.isFinite(e.phase)) e.phase += 0.04 * ENEMIES;
                if (e.type === "zigzag") e.x += Math.sin(e.phase) * 2.5 * ENEMIES;
            });
        };

        const originalAsteroids = updateAsteroids;
        updateAsteroids = function () {
            originalAsteroids();
            if (typeof asteroids === "undefined") return;
            asteroids.forEach(a => {
                a.y += a.speed * ASTEROIDS;
                if (Number.isFinite(a.rotationSpeed)) a.rotation += a.rotationSpeed * ASTEROIDS;
            });
        };

        const originalPowerups = updatePowerups;
        updatePowerups = function () {
            originalPowerups();
            if (typeof powerups === "undefined") return;
            powerups.forEach(p => p.y += p.speed * POWERUPS);
        };

        if (typeof updateParticles === "function") {
            const originalParticles = updateParticles;
            updateParticles = function () {
                originalParticles();
                if (typeof particles === "undefined") return;
                particles.forEach(p => {
                    p.x += p.vx * PARTICLES;
                    p.y += p.vy * PARTICLES;
                    p.life -= 0.025 * PARTICLES;
                });
            };
        }

        if (typeof updateBoss === "function") {
            const originalBoss = updateBoss;
            updateBoss = function () {
                originalBoss();
                if (typeof boss === "undefined" || !boss) return;
                if (boss.y < 130) boss.y += 1.5 * BOSS;
                else if (Number.isFinite(boss.speed) && Number.isFinite(boss.direction))
                    boss.x += boss.speed * boss.direction * BOSS;
            };
        }

        if (typeof updateSpawning === "function") {
            const originalSpawning = updateSpawning;
            updateSpawning = function () {
                originalSpawning();
                if (typeof spawnTimer !== "undefined") spawnTimer -= 16 * TIMERS;
                if (typeof asteroidTimer !== "undefined") asteroidTimer -= 16 * TIMERS;
                if (typeof powerTimer !== "undefined") powerTimer -= 16 * TIMERS;
            };
        }
    }

    install();
})();
