/* PC SPEED FIX — safe desktop boost
   The old turbo patch moved the player a second time inside a wrapper around
   updatePlayer. Because game.js already moves the ship by a large amount per
   frame, that caused teleporting. This file deliberately never changes the
   player's x/y position or duplicates world movement.
*/
(function () {
    "use strict";

    const isMobile = window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (isMobile) return;

    // Let game.js remain the single owner of movement, collisions and timing.
    // Keep a flag available for any future desktop-only tuning without adding
    // another movement pass.
    window.SPACE_SHOOT_PC_SAFE_SPEED = true;
})();
