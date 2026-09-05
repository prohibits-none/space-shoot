/* =========================================================
   MOBILE JOYSTICK + FIRE BUTTON
   The old mobile controls stay in the DOM for compatibility,
   while this layer provides the new touch controls.
========================================================= */
(function () {
    "use strict";

    const joystick = document.getElementById("mobileJoystick");
    const stick = document.getElementById("joystickStick");
    const fire = document.getElementById("mobileFire");

    if (!joystick || !stick || !fire) return;

    let active = false;
    let pointerId = null;
    const maxDistance = 42;

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

        const dead = 10;
        keys.arrowleft = dx < -dead;
        keys.arrowright = dx > dead;
        keys.arrowup = dy < -dead;
        keys.arrowdown = dy > dead;
    }

    function resetMove() {
        active = false;
        pointerId = null;
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