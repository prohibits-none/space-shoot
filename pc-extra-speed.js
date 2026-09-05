/* PC EXTRA GAMEPLAY SPEED
   Adds a stronger speed pass to the already-installed desktop speed fix.
   Mobile is untouched.
*/
(function () {
    "use strict";

    const mobile = window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (mobile) return;

    const EXTRA = 0.55; // makes non-player objects noticeably faster

    function move(o) {
        if (Number.isFinite(o.vx)) o.x += o.vx * EXTRA;
        if (Number.isFinite(o.vy)) o.y += o.vy * EXTRA;
    }

    function install() {
        if (typeof updateBullets !== "function" || typeof updateEnemies !== "function" ||
            typeof updateAsteroids !== "function" || typeof updatePowerups !== "function") {
            setTimeout(install, 25);
            return;
        }

        const bulletsUpdate = updateBullets;
        updateBullets = function () {
            bulletsUpdate();
            if (typeof bullets !== "undefined") bullets.forEach(move);
            if (typeof enemyBullets !== "undefined") enemyBullets.forEach(move);
        };

        const enemiesUpdate = updateEnemies;
        updateEnemies = function () {
            enemiesUpdate();
            if (typeof enemies !== "undefined") enemies.forEach(e => {
                e.y += e.speed * EXTRA;
                if (e.type === "zigzag") e.x += Math.sin(e.phase) * 2.5 * EXTRA;
            });
        };

        const asteroidUpdate = updateAsteroids;
        updateAsteroids = function () {
            asteroidUpdate();
            if (typeof asteroids !== "undefined") asteroids.forEach(a => {
                a.y += a.speed * EXTRA;
                a.rotation += a.rotationSpeed * EXTRA;
            });
        };

        const powerUpdate = updatePowerups;
        updatePowerups = function () {
            powerUpdate();
            if (typeof powerups !== "undefined") powerups.forEach(p => p.y += p.speed * EXTRA);
        };

        const particleUpdate = updateParticles;
        updateParticles = function () {
            particleUpdate();
            if (typeof particles !== "undefined") particles.forEach(p => {
                p.x += p.vx * EXTRA;
                p.y += p.vy * EXTRA;
            });
        };

        const bossUpdate = updateBoss;
        updateBoss = function () {
            bossUpdate();
            if (typeof boss !== "undefined" && boss) {
                if (boss.y < 130) boss.y += 1.5 * EXTRA;
                else boss.x += boss.speed * boss.direction * EXTRA;
            }
        };
    }

    install();
})();
