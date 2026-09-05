/* PC GAME SPEED + PERFORMANCE FIX
   Desktop only. Mobile gameplay is intentionally untouched.

   IMPORTANT:
   The original game is frame-based. Its movement values (player, enemies,
   bullets, asteroids and powerups) are applied once per frame, so the game
   feels slow on PC and becomes even slower when FPS drops.

   This layer keeps the normal game loop, makes the WHOLE desktop game faster,
   and adds extra catch-up only when the browser misses frames.
*/
(function () {
    "use strict";

    const mobile =
        window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (mobile) return;

    /* Desktop gameplay multiplier.
       1.75 = 75% faster than the original frame-based movement. */
    const GAME_SPEED = 1.75;
    const TARGET_FRAME_MS = 1000 / 60;
    const MAX_FRAME_CATCHUP = 2.0;

    /*
       Do NOT replace requestAnimationFrame and do NOT create extra game loops.
       We only add the missing movement after the game's normal update.
    */
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

    /*
       Wait until game.js has created all its top-level functions/arrays.
       Then wrap the update functions once.
    */
    function install() {
        if (typeof updatePlayer !== "function" || typeof updateBullets !== "function") {
            setTimeout(install, 20);
            return;
        }

        /* Player: original speed + 75% extra. */
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
                    const extra = GAME_SPEED - 1;
                    player.x += (dx / len) * player.speed * extra;
                    player.y += (dy / len) * player.speed * extra;
                    clampPlayer();
                }
            }
        };

        /* Bullets: make both player and enemy projectiles faster. */
        const originalBullets = updateBullets;
        updateBullets = function () {
            originalBullets();
            const extra = GAME_SPEED - 1;
            if (typeof bullets !== "undefined") bullets.forEach(b => move(b, extra));
            if (typeof enemyBullets !== "undefined") enemyBullets.forEach(b => move(b, extra));
        };

        /* Enemies: faster downward movement and faster zig-zag motion. */
        const originalEnemies = updateEnemies;
        updateEnemies = function () {
            originalEnemies();
            const extra = GAME_SPEED - 1;
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

        /* Asteroids: faster falling + rotation. */
        const originalAsteroids = updateAsteroids;
        updateAsteroids = function () {
            originalAsteroids();
            const extra = GAME_SPEED - 1;
            if (typeof asteroids !== "undefined") asteroids.forEach(a => {
                a.y += a.speed * extra;
                a.rotation += a.rotationSpeed * extra;
            });
        };

        /* Powerups: faster drops. */
        const originalPowerups = updatePowerups;
        updatePowerups = function () {
            originalPowerups();
            const extra = GAME_SPEED - 1;
            if (typeof powerups !== "undefined") powerups.forEach(p => {
                p.y += p.speed * extra;
            });
        };

        /* Particles: faster effects without changing their appearance. */
        const originalParticles = updateParticles;
        updateParticles = function () {
            originalParticles();
            const extra = GAME_SPEED - 1;
            if (typeof particles !== "undefined") particles.forEach(p => {
                p.x += p.vx * extra;
                p.y += p.vy * extra;
                p.life -= 0.025 * extra;
            });
        };

        /* Boss: faster movement and shooting timer. */
        const originalBoss = updateBoss;
        updateBoss = function () {
            originalBoss();
            const extra = GAME_SPEED - 1;
            if (typeof boss !== "undefined" && boss) {
                if (boss.y < 130) boss.y += 1.5 * extra;
                else boss.x += boss.speed * boss.direction * extra;
                if (Number.isFinite(boss.shootTimer)) {
                    boss.shootTimer -= 16 * extra;
                }
            }
        };

        /* Faster enemy/item spawning. */
        const originalSpawning = updateSpawning;
        updateSpawning = function () {
            originalSpawning();
            const extra = GAME_SPEED - 1;
            if (typeof spawnTimer !== "undefined") spawnTimer -= 16 * extra;
            if (typeof asteroidTimer !== "undefined") asteroidTimer -= 16 * extra;
            if (typeof powerTimer !== "undefined") powerTimer -= 16 * extra;
        };

        /*
           Frame-drop catch-up.
           If the PC actually falls below 60 FPS, add the movement that would
           have happened during the missing time. This is separate from the
           1.75x gameplay-speed increase above.
        */
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
                        player.x += (dx / len) * player.speed * missing;
                        player.y += (dy / len) * player.speed * missing;
                        clampPlayer();
                    }
                }

                if (typeof bullets !== "undefined") bullets.forEach(b => move(b, missing));
                if (typeof enemyBullets !== "undefined") enemyBullets.forEach(b => move(b, missing));
                if (typeof enemies !== "undefined") enemies.forEach(e => e.y += e.speed * missing);
                if (typeof asteroids !== "undefined") asteroids.forEach(a => {
                    a.y += a.speed * missing;
                    a.rotation += a.rotationSpeed * missing;
                });
                if (typeof powerups !== "undefined") powerups.forEach(p => p.y += p.speed * missing);

                if (typeof spawnTimer !== "undefined") spawnTimer -= 16 * missing;
                if (typeof asteroidTimer !== "undefined") asteroidTimer -= 16 * missing;
                if (typeof powerTimer !== "undefined") powerTimer -= 16 * missing;
            }

            requestAnimationFrame(catchUp);
        }

        /* Keep player noticeably quicker, but not absurdly fast. */
        if (typeof player !== "undefined") {
            player.speed = Math.max(player.speed, 6.5);
        }

        requestAnimationFrame(catchUp);
    }

    install();
})();
