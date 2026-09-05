/* =========================================================
   MOBILE JOYSTICK + FIRE BUTTON
   Smooth, lower-sensitivity analog movement for mobile.
========================================================= */
(function () {
    "use strict";

    const joystick = document.getElementById("mobileJoystick");
    const stick = document.getElementById("joystickStick");
    const fire = document.getElementById("mobileFire");

    if (!joystick || !stick || !fire) return;

    let active = false;
    let pointerId = null;
    let joyX = 0;
    let joyY = 0;
    let lastMoveTime = performance.now();

    const maxDistance = 42;
    const deadZone = 12;

    // Keep forward/up movement exactly as it was.
    const mobileSensitivity = 0.58;

    // Very small boost for left/right movement.
    const horizontalSensitivity = 0.64;

    // Small boost for moving down.
    const downSensitivity = 0.62;

    const maxMobileSpeed = 3.2;

    function setMove(x, y) {
        const rect = joystick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = x - cx;
        let dy = y - cy;
        const distance = Math.hypot(dx, dy);

        if (distance > maxDistance) {
            dx = dx / distance * maxDistance;
            dy = dy / distance * maxDistance;
        }

        stick.style.transform = `translate(${dx}px, ${dy}px)`;

        const usableDistance = Math.max(0, distance - deadZone);
        const usableRange = maxDistance - deadZone;
        const strength = Math.min(1, usableDistance / usableRange);
        const easedStrength = Math.pow(strength, 1.35);

        if (distance <= deadZone) {
            joyX = 0;
            joyY = 0;
        } else {
            const length = Math.hypot(dx, dy) || 1;
            joyX = (dx / length) * easedStrength;
            joyY = (dy / length) * easedStrength;
        }

        // Disable the old digital joystick movement while this analog
        // controller is active, preventing double/over-sensitive movement.
        keys.arrowleft = false;
        keys.arrowright = false;
        keys.arrowup = false;
        keys.arrowdown = false;
    }

    function resetMove() {
        active = false;
        pointerId = null;
        joyX = 0;
        joyY = 0;
        stick.style.transform = "translate(0, 0)";
        keys.arrowleft = false;
        keys.arrowright = false;
        keys.arrowup = false;
        keys.arrowdown = false;
    }

    joystick.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        active = true;
        pointerId = e.pointerId;
        joystick.setPointerCapture(e.pointerId);
        setMove(e.clientX, e.clientY);
    });

    joystick.addEventListener("pointermove", function (e) {
        if (!active || e.pointerId !== pointerId) return;
        e.preventDefault();
        setMove(e.clientX, e.clientY);
    });

    joystick.addEventListener("pointerup", function (e) {
        if (e.pointerId === pointerId) resetMove();
    });

    joystick.addEventListener("pointercancel", resetMove);
    joystick.addEventListener("lostpointercapture", resetMove);

    function movePlayerSmoothly(now) {
        const dt = Math.min(32, now - lastMoveTime) / 16.67;
        lastMoveTime = now;

        if (active && typeof running !== "undefined" && running &&
            typeof paused !== "undefined" && !paused &&
            typeof player !== "undefined") {

            const xSensitivity = horizontalSensitivity;
            const ySensitivity = joyY > 0
                ? downSensitivity
                : mobileSensitivity;

            player.x += joyX * maxMobileSpeed * xSensitivity * dt;
            player.y += joyY * maxMobileSpeed * ySensitivity * dt;

            player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
            player.y = Math.max(70, Math.min(canvas.height - 35, player.y));
        }

        requestAnimationFrame(movePlayerSmoothly);
    }

    requestAnimationFrame(movePlayerSmoothly);

    function startFire(e) {
        e.preventDefault();
        keys.space = true;
    }

    function stopFire(e) {
        if (e) e.preventDefault();
        keys.space = false;
    }

    fire.addEventListener("pointerdown", startFire);
    fire.addEventListener("pointerup", stopFire);
    fire.addEventListener("pointercancel", stopFire);
    fire.addEventListener("pointerleave", function (e) {
        if (e.buttons === 0) stopFire(e);
    });

    window.addEventListener("blur", function () {
        resetMove();
        keys.space = false;
    });
})();