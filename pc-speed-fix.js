/* PC GAMEPLAY SPEED COMPENSATION
   Desktop only. Mobile gameplay is intentionally untouched.

   The game's core movement is frame-based. If the browser renders at 30 FPS,
   objects move roughly half as far per second. This adds only the missing
   movement/timer portion instead of replacing or slowing requestAnimationFrame.
*/
(function () {
    "use strict";

    const mobile =
        window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (mobile) return;

    const TARGET_FRAME_MS = 1000 / 60;
    const MAX_EXTRA = 2.5;
    let last = performance.now();

    function move(o, factor) {
        if (!o) return;
        if (Number.isFinite(o.vx)) o.x += o.vx * factor;
        if (Number.isFinite(o.vy)) o.y += o.vy * factor;
    }

    function compensate(now) {
        const elapsed = Math.min(100, now - last);
        last = now;

        if (elapsed > TARGET_FRAME_MS && typeof running !== "undefined" && running && !paused) {
            const extra = Math.min(MAX_EXTRA, elapsed / TARGET_FRAME_MS - 1);

            // Player movement: add only the frames the main loop missed.
            if (typeof keys !== "undefined" && typeof player !== "undefined") {
                let dx = 0;
                let dy = 0;
                if (keys.w || keys.arrowup) dy--;
                if (keys.s || keys.arrowdown) dy++;
                if (keys.a || keys.arrowleft) dx--;
                if (keys.d || keys.arrowright) dx++;

                if (dx || dy) {
                    const len = Math.hypot(dx, dy) || 1;
                    player.x += (dx / len) * player.speed * extra;
                    player.y += (dy / len) * player.speed * extra;
                    player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
                    player.y = Math.max(70, Math.min(canvas.height - 35, player.y));
                }
            }

            // Bullets.
            if (typeof bullets !== "undefined") bullets.forEach(o => move(o, extra));
            if (typeof enemyBullets !== "undefined") enemyBullets.forEach(o => move(o, extra));

            // Enemies, including the zig-zag vertical movement.
            if (typeof enemies !== "undefined") enemies.forEach(o => {
                o.y += o.speed * extra;
            });

            // Asteroids and powerups.
            if (typeof asteroids !== "undefined") asteroids.forEach(o => {
                o.y += o.speed * extra;
                o.rotation += o.rotationSpeed * extra;
            });
            if (typeof powerups !== "undefined") powerups.forEach(o => {
                o.y += o.speed * extra;
            });

            // Particles.
            if (typeof particles !== "undefined") particles.forEach(o => {
                o.x += o.vx * extra;
                o.y += o.vy * extra;
                o.life -= 0.025 * extra;
            });

            // Frame-based spawning/timers.
            if (typeof spawnTimer !== "undefined") spawnTimer -= 16 * extra;
            if (typeof asteroidTimer !== "undefined") asteroidTimer -= 16 * extra;
            if (typeof powerTimer !== "undefined") powerTimer -= 16 * extra;
            if (typeof comboTimer !== "undefined") comboTimer -= extra;

            // Boss movement only; shooting uses its own frame timer in game.js.
            if (typeof boss !== "undefined" && boss) {
                if (boss.y < 130) boss.y += 1.5 * extra;
                else boss.x += boss.speed * boss.direction * extra;
            }
        }

        requestAnimationFrame(compensate);
    }

    requestAnimationFrame(compensate);
})();
