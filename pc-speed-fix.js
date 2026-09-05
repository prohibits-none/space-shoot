/* PC GAME SPEED + PERFORMANCE FIX
   Desktop only. Mobile gameplay is intentionally untouched.

   Player speed is kept at the comfortable level already tuned.
   Everything else is boosted more strongly so the whole game feels alive
   instead of looking like objects are moving at low FPS.
*/
(function () {
    "use strict";

    const mobile =
        window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (mobile) return;

    // Keep the ship at the already-good speed.
    const PLAYER_SPEED_MULTIPLIER = 1.75;

    // Make the rest of the game noticeably faster.
    const WORLD_SPEED_MULTIPLIER = 2.35;

    const TARGET_FRAME_MS = 1000 / 60;
    const MAX_FRAME_CATCHUP = 2.0;

    function move(o, factor) {
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
        if (typeof updatePlayer !== "function" || typeof updateBullets !== "function") {
            setTimeout(install, 20);
            return;
        }

        // PLAYER: keep the current tuned speed, don't apply the world boost.
        const originalPlayer = updatePlayer;
        updatePlayer = function () {
            originalPlayer();

            if (typeof keys !== "undefined" && typeof player !== "undefined") {
                let dx = 0;
                let dy = 0;
                if (keys.w || keys.arrowup) dy--;
                if (keys.s || keys.arrowdown) dy++;
                if (keys.a || keys.arrowleft) dx--;
                if (keys.d || keys.arrowright) dx++;

                if (dx || dy) {
                    const len = Math.hypot(dx, dy) || 1;
                    const extra = PLAYER_SPEED_MULTIPLIER - 1;
                    player.x += (dx / len) * player.speed * extra;
                    player.y += (dy / len) * player.speed * extra;
                    clampPlayer();
                }
            }
        };

        // BULLETS: substantially faster in both directions.
        const originalBullets = updateBullets;
        updateBullets = function () {
            originalBullets();
            const extra = WORLD_SPEED_MULTIPLIER - 1;
            if (typeof bullets !== "undefined") bullets.forEach(b => move(b, extra));
            if (typeof enemyBullets !== "undefined") enemyBullets.forEach(b => move(b, extra));
        };

        // ENEMIES: faster movement and zig-zag animation.
        const originalEnemies = updateEnemies;
        updateEnemies = function () {
            originalEnemies();
            const extra = WORLD_SPEED_MULTIPLIER - 1;
            if (typeof enemies !== "undefined") {
                enemies.forEach(e => {
                    e.y += e.speed * extra;
                    e.phase += 0.04 * extra;
                    if (e.type === "zigzag") {
                        e.x += Math.sin(e.phase) * 2.5 * extra;
                    }
                    if (Number.isFinite(e.shootTimer)) {
                        e.shootTimer -= 16 * extra;
                    }
                });
            }
        };

        // ASTEROIDS: faster falling and rotation.
        const originalAsteroids = updateAsteroids;
        updateAsteroids = function () {
            originalAsteroids();
            const extra = WORLD_SPEED_MULTIPLIER - 1;
            if (typeof asteroids !== "undefined") asteroids.forEach(a => {
                a.y += a.speed * extra;
                a.rotation += a.rotationSpeed * extra;
            });
        };

        // POWERUPS: faster drops.
        const originalPowerups = updatePowerups;
        updatePowerups = function () {
            originalPowerups();
            const extra = WORLD_SPEED_MULTIPLIER - 1;
            if (typeof powerups !== "undefined") powerups.forEach(p => {
                p.y += p.speed * extra;
            });
        };

        // PARTICLES: faster movement without changing their visual size.
        const originalParticles = updateParticles;
        updateParticles = function () {
            originalParticles();
            const extra = WORLD_SPEED_MULTIPLIER - 1;
            if (typeof particles !== "undefined") particles.forEach(p => {
                p.x += p.vx * extra;
                p.y += p.vy * extra;
                p.life -= 0.025 * extra;
            });
        };

        // BOSS: faster movement and shooting timer.
        const originalBoss = updateBoss;
        updateBoss = function () {
            originalBoss();
            const extra = WORLD_SPEED_MULTIPLIER - 1;
            if (typeof boss !== "undefined" && boss) {
                if (boss.y < 130) boss.y += 1.5 * extra;
                else boss.x += boss.speed * boss.direction * extra;
                if (Number.isFinite(boss.shootTimer)) {
                    boss.shootTimer -= 16 * extra;
                }
            }
        };

        // Faster spawning, so the game feels more active.
        const originalSpawning = updateSpawning;
        updateSpawning = function () {
            originalSpawning();
            const extra = WORLD_SPEED_MULTIPLIER - 1;
            if (typeof spawnTimer !== "undefined") spawnTimer -= 16 * extra;
            if (typeof asteroidTimer !== "undefined") asteroidTimer -= 16 * extra;
            if (typeof powerTimer !== "undefined") powerTimer -= 16 * extra;
        };

        // If a desktop frame is actually missed, compensate the moving world.
        let last = performance.now();

        function catchUp(now) {
            const elapsed = Math.min(100, now - last);
            last = now;

            if (elapsed > TARGET_FRAME_MS &&
                typeof running !== "undefined" && running &&
                typeof paused !== "undefined" && !paused) {

                const missing = Math.min(
                    MAX_FRAME_CATCHUP,
                    elapsed / TARGET_FRAME_MS - 1
                );

                if (typeof player !== "undefined" && typeof keys !== "undefined") {
                    let dx = 0, dy = 0;
                    if (keys.w || keys.arrowup) dy--;
                    if (keys.s || keys.arrowdown) dy++;
                    if (keys.a || keys.arrowleft) dx--;
                    if (keys.d || keys.arrowright) dx++;
                    if (dx || dy) {
                        const len = Math.hypot(dx, dy) || 1;
                        player.x += (dx / len) * player.speed * (PLAYER_SPEED_MULTIPLIER - 1) * missing;
                        player.y += (dy / len) * player.speed * (PLAYER_SPEED_MULTIPLIER - 1) * missing;
                        clampPlayer();
                    }
                }

                const worldMissing = missing * (WORLD_SPEED_MULTIPLIER - 1);
                if (typeof bullets !== "undefined") bullets.forEach(b => move(b, worldMissing));
                if (typeof enemyBullets !== "undefined") enemyBullets.forEach(b => move(b, worldMissing));
                if (typeof enemies !== "undefined") enemies.forEach(e => e.y += e.speed * worldMissing);
                if (typeof asteroids !== "undefined") asteroids.forEach(a => {
                    a.y += a.speed * worldMissing;
                    a.rotation += a.rotationSpeed * worldMissing;
                });
                if (typeof powerups !== "undefined") powerups.forEach(p => p.y += p.speed * worldMissing);
                if (typeof spawnTimer !== "undefined") spawnTimer -= 16 * worldMissing;
                if (typeof asteroidTimer !== "undefined") asteroidTimer -= 16 * worldMissing;
                if (typeof powerTimer !== "undefined") powerTimer -= 16 * worldMissing;
            }

            requestAnimationFrame(catchUp);
        }

        if (typeof player !== "undefined") {
            player.speed = Math.max(player.speed, 6.5);
        }

        requestAnimationFrame(catchUp);
    }

    install();
})();
