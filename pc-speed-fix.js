/* PC keyboard movement speed fix */
(function () {
    "use strict";

    function applyPCSpeed() {
        if (typeof player !== "undefined") {
            player.speed = 7.0;
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyPCSpeed);
    } else {
        applyPCSpeed();
    }

    window.addEventListener("load", applyPCSpeed);

    // applyUpgrades() can reset player.speed when a new game starts.
    // Keep the PC keyboard speed responsive without changing mobile joystick speed.
    setInterval(applyPCSpeed, 250);
})();
