/* PC PERFORMANCE + MOVEMENT FIX
   Desktop only. Mobile gameplay is intentionally untouched.

   The game uses a lot of Canvas shadowBlur/glow effects. Those are expensive
   when redrawn every frame, especially in the neon visual layer. This file
   adaptively lowers blur quality when the PC cannot sustain a high frame rate.
*/
(function () {
    "use strict";

    const mobile =
        window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0;

    if (mobile) return;

    const TARGET = 60;
    let qualityBlur = 10;
    let lastFrame = performance.now();
    let fps = TARGET;
    let samples = 0;

    /* Keep PC movement responsive without forcing mobile movement speed. */
    function applyPCSpeed() {
        if (typeof player !== "undefined") {
            player.speed = Math.max(player.speed, 7.0);
        }
    }

    applyPCSpeed();
    window.addEventListener("load", applyPCSpeed);
    setInterval(applyPCSpeed, 500);

    /*
       Canvas glow is the biggest rendering cost in this game's neon layer.
       Adapt the maximum blur instead of replacing the neon artwork.
    */
    if (typeof ctx !== "undefined" && typeof CanvasRenderingContext2D !== "undefined") {
        const proto = CanvasRenderingContext2D.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, "shadowBlur");

        if (descriptor && descriptor.get && descriptor.set) {
            Object.defineProperty(ctx, "shadowBlur", {
                configurable: true,
                enumerable: true,
                get() {
                    return descriptor.get.call(ctx);
                },
                set(value) {
                    const v = Number(value);
                    descriptor.set.call(
                        ctx,
                        Number.isFinite(v) ? Math.min(v, qualityBlur) : 0
                    );
                }
            });
        }
    }

    /* Measure the real desktop rendering rate and adjust quality gradually. */
    function monitor(now) {
        const dt = now - lastFrame;
        lastFrame = now;

        if (dt > 0 && dt < 250) {
            const instant = 1000 / dt;
            fps = fps * 0.9 + instant * 0.1;
            samples++;

            if (samples > 20) {
                if (fps < 42) {
                    qualityBlur = 2;
                } else if (fps < 50) {
                    qualityBlur = 4;
                } else if (fps < 57) {
                    qualityBlur = 7;
                } else {
                    qualityBlur = 10;
                }
            }
        }

        requestAnimationFrame(monitor);
    }

    requestAnimationFrame(monitor);
})();
