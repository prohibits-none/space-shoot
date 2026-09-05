/* PC frame-rate compensation
   The game simulation is frame-based (timers use ~16ms and movement is per frame).
   On slower desktop browsers this makes EVERYTHING feel slow: movement, enemies,
   bullets, asteroids and power-ups. This wrapper catches up missed simulation frames.
   Mobile controls/gameplay are untouched because this is only a timing layer.
*/
(function () {
    "use strict";

    const nativeRAF = window.requestAnimationFrame.bind(window);
    const STEP = 1000 / 60;
    const MAX_STEPS = 5;
    let previous = performance.now();
    let suppressNested = false;
    let installed = false;

    function fixedRAF(callback) {
        if (suppressNested) return 0;

        return nativeRAF(function (realTime) {
            const elapsed = Math.min(100, Math.max(STEP, realTime - previous));
            previous = realTime;

            // At normal/high FPS keep the original one-update-per-frame behavior.
            // Only catch up when the desktop actually misses 60 FPS frames.
            let steps = elapsed > STEP * 1.45
                ? Math.min(MAX_STEPS, Math.max(1, Math.round(elapsed / STEP)))
                : 1;

            suppressNested = false;
            for (let i = 0; i < steps; i++) {
                if (i > 0) suppressNested = true;
                callback(realTime - (steps - 1 - i) * STEP);
            }
            suppressNested = false;
        });
    }

    // Install before game.js starts its main loop.
    window.requestAnimationFrame = fixedRAF;
    installed = true;
})();
