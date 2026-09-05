"use strict";

/* =========================================================
                    GALAXY STRIKE
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


/* =========================================================
                    CANVAS
========================================================= */

function resizeCanvas() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player.x = canvas.width / 2;
    player.y = canvas.height - 130;
}

window.addEventListener("resize", resizeCanvas);


/* =========================================================
                    DOM
========================================================= */

const scoreElement =
    document.getElementById("score");

const waveElement =
    document.getElementById("wave");

const comboElement =
    document.getElementById("combo");

const coinsElement =
    document.getElementById("coins");

const weaponNameElement =
    document.getElementById("weaponName");

const healthBar =
    document.getElementById("healthBar");

const shieldBar =
    document.getElementById("shieldBar");

const bossContainer =
    document.getElementById("bossContainer");

const bossHealthBar =
    document.getElementById("bossHealth");

const startScreen =
    document.getElementById("startScreen");

const pauseScreen =
    document.getElementById("pauseScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const shopScreen =
    document.getElementById("shopScreen");


/* =========================================================
                    GAME STATE
========================================================= */

let gameRunning = false;
let paused = false;

let score = 0;
let coins = 0;

let wave = 1;

let enemiesKilled = 0;

let combo = 1;

let comboTimer = 0;

let spawnTimer = 0;

let asteroidTimer = 0;

let powerTimer = 0;

let bossActive = false;

let currentBoss = null;

let lastTime = 0;

let shake = 0;


/* =========================================================
                    SAVED DATA
========================================================= */

let savedData = JSON.parse(
    localStorage.getItem("galaxyStrikeData") || "{}"
);


let highScore =
    savedData.highScore || 0;


let upgrades = {

    health:
        savedData.health || 0,

    damage:
        savedData.damage || 0,

    speed:
        savedData.speed || 0,

    shield:
        savedData.shield || 0,

    fireRate:
        savedData.fireRate || 0

};


/* =========================================================
                    PLAYER
========================================================= */

const player = {

    x: 0,

    y: 0,

    width: 34,

    height: 48,

    speed: 6,

    health: 100,

    maxHealth: 100,

    shield: 100,

    maxShield: 100,

    damage: 20,

    fireRate: 230,

    lastShot: 0,

    weapon: 1,

    invulnerable: 0,

    dashCooldown: 0,

    shieldCooldown: 0,

    shieldActive: false

};


function applyUpgrades() {

    player.maxHealth =
        100 + upgrades.health * 20;

    player.health =
        player.maxHealth;

    player.maxShield =
        100 + upgrades.shield * 25;

    player.shield =
        player.maxShield;

    player.damage =
        20 + upgrades.damage * 5;

    player.speed =
        6 + upgrades.speed * 0.6;

    player.fireRate =
        Math.max(
            80,
            230 - upgrades.fireRate * 15
        );
}


/* =========================================================
                    INPUT
========================================================= */

const keys = {};


window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    if (e.code === "Space") {

        keys.space = true;

        e.preventDefault();
    }


    if (e.key.toLowerCase() === "p") {

        togglePause();
    }


    if (e.key === "1") {

        player.weapon = 1;

        updateWeaponUI();
    }


    if (e.key === "2") {

        player.weapon = 2;

        updateWeaponUI();
    }


    if (e.key === "3") {

        player.weapon = 3;

        updateWeaponUI();
    }


    if (e.key === "e") {

        activateShield();
    }


    if (e.key === "Shift") {

        dash();
    }

});


window.addEventListener("keyup", e => {

    keys[e.key.toLowerCase()] = false;

    if (e.code === "Space") {

        keys.space = false;
    }

});


/* =========================================================
                TOUCH CONTROLS
========================================================= */

function holdButton(id, key) {

    const element =
        document.getElementById(id);

    element.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            keys[key] = true;

        },
        { passive: false }
    );


    element.addEventListener(
        "touchend",
        e => {

            e.preventDefault();

            keys[key] = false;

        },
        { passive: false }
    );
}


holdButton("up", "arrowup");
holdButton("down", "arrowdown");
holdButton("left", "arrowleft");
holdButton("right", "arrowright");


document
    .getElementById("mobileShoot")
    .addEventListener("touchstart", e => {

        e.preventDefault();

        keys.space = true;

    });


document
    .getElementById("mobileShoot")
    .addEventListener("touchend", () => {

        keys.space = false;

    });


document
    .getElementById("mobileShield")
    .addEventListener("touchstart", e => {

        e.preventDefault();

        activateShield();

    });


document
    .getElementById("mobileDash")
    .addEventListener("touchstart", e => {

        e.preventDefault();

        dash();

    });


/* =========================================================
                    STARS
========================================================= */

const stars = [];


for (let i = 0; i < 300; i++) {

    stars.push({

        x:
            Math.random() * window.innerWidth,

        y:
            Math.random() * window.innerHeight,

        size:
            Math.random() * 2 + 0.5,

        speed:
            Math.random() * 3 + 0.5,

        alpha:
            Math.random()

    });

}


/* =========================================================
                    PARTICLES
========================================================= */

const particles = [];


function createParticle(
    x,
    y,
    color,
    count = 10
) {

    for (let i = 0; i < count; i++) {

        particles.push({

            x,

            y,

            vx:
                (Math.random() - 0.5) * 8,

            vy:
                (Math.random() - 0.5) * 8,

            size:
                Math.random() * 4 + 1,

            life: 1,

            color

        });

    }

}


function updateParticles(dt) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.life -= 0.025;

        p.size *= 0.98;


        if (p.life <= 0) {

            particles.splice(i, 1);

        }

    }

}


function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha = p.life;

        ctx.fillStyle = p.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    ctx.globalAlpha = 1;

}


/* =========================================================
                    BULLETS
========================================================= */

const bullets = [];

const enemyBullets = [];


/* =========================================================
                    SHOOT
========================================================= */

function shoot() {

    const now = performance.now();


    if (
        now - player.lastShot <
        player.fireRate
    ) {

        return;

    }


    player.lastShot = now;


    playShootSound();


    const damage =
        player.damage;


    if (player.weapon === 1) {

        bullets.push({

            x: player.x,

            y: player.y - 30,

            vx: 0,

            vy: -13,

            radius: 4,

            damage,

            color: "#00ffff"

        });

    }


    if (player.weapon === 2) {

        for (const offset of [-12, 12]) {

            bullets.push({

                x: player.x + offset,

                y: player.y - 25,

                vx: offset * 0.03,

                vy: -13,

                radius: 4,

                damage: damage * 0.8,

                color: "#ffff00"

            });

        }

    }


    if (player.weapon === 3) {

        bullets.push({

            x: player.x,

            y: player.y - 30,

            vx: 0,

            vy: -16,

            radius: 7,

            damage: damage * 1.8,

            color: "#ff3cff"

        });

    }

}


/* =========================================================
                UPDATE BULLETS
========================================================= */

function updateBullets() {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const b = bullets[i];

        b.x += b.vx;

        b.y += b.vy;


        if (b.y < -30) {

            bullets.splice(i, 1);

        }

    }


    for (
        let i = enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const b =
            enemyBullets[i];

        b.x += b.vx;

        b.y += b.vy;


        if (
            b.x < -50 ||
            b.x > canvas.width + 50 ||
            b.y > canvas.height + 50
        ) {

            enemyBullets.splice(i, 1);

        }

    }

}


/* =========================================================
                    ENEMIES
========================================================= */

const enemies = [];


function spawnEnemy() {

    const types = [

        "fighter",

        "tank",

        "zigzag",

        "shooter"

    ];


    const type =
        types[
            Math.floor(
                Math.random() * types.length
            )
        ];


    let enemy = {

        x:
            Math.random() *
            (canvas.width - 80) +
            40,

        y: -60,

        type,

        width: 35,

        height: 35,

        speed:
            1.5 + wave * 0.08,

        health:
            30 + wave * 5,

        maxHealth:
            30 + wave * 5,

        shootTimer:
            Math.random() * 1500,

        phase:
            Math.random() * Math.PI * 2,

        angle: 0

    };


    if (type === "tank") {

        enemy.width = 50;

        enemy.height = 50;

        enemy.health =
            100 + wave * 12;

        enemy.maxHealth =
            enemy.health;

        enemy.speed *= 0.55;

    }


    if (type === "zigzag") {

        enemy.health =
            40 + wave * 5;

        enemy.maxHealth =
            enemy.health;

    }


    if (type === "shooter") {

        enemy.health =
            50 + wave * 6;

        enemy.maxHealth =
            enemy.health;

    }


    enemies.push(enemy);

}


/* =========================================================
                    ASTEROIDS
========================================================= */

const asteroids = [];


function spawnAsteroid() {

    asteroids.push({

        x:
            Math.random() *
            canvas.width,

        y: -70,

        radius:
            Math.random() * 25 + 15,

        speed:
            Math.random() * 2 + 1,

        rotation:
            Math.random() * Math.PI * 2,

        rotationSpeed:
            (Math.random() - 0.5) * 0.05,

        health: 50

    });

}


/* =========================================================
                    POWER UPS
========================================================= */

const powerups = [];


function spawnPowerup(
    x,
    y
) {

    const types = [

        "health",

        "shield",

        "weapon",

        "coin",

        "rapid"

    ];


    powerups.push({

        x,

        y,

        type:
            types[
                Math.floor(
                    Math.random() *
                    types.length
                )
            ],

        radius: 15,

        vy: 2

    });

}


function collectPowerup(p) {

    if (p.type === "health") {

        player.health =
            Math.min(
                player.maxHealth,
                player.health + 30
            );

        createParticle(
            p.x,
            p.y,
            "#ff3333",
            25
        );

    }


    if (p.type === "shield") {

        player.shield =
            Math.min(
                player.maxShield,
                player.shield + 50
            );

        createParticle(
            p.x,
            p.y,
            "#00aaff",
            25
        );

    }


    if (p.type === "weapon") {

        player.weapon =
            Math.min(
                3,
                player.weapon + 1
            );

        updateWeaponUI();

        createParticle(
            p.x,
            p.y,
            "#ff00ff",
            30
        );

    }


    if (p.type === "coin") {

        coins += 50;

    }


    if (p.type === "rapid") {

        player.fireRate *= 0.5;

        setTimeout(() => {

            player.fireRate =
                Math.max(
                    80,
                    230 -
                    upgrades.fireRate * 15
                );

        }, 6000);

    }

}


/* =========================================================
                    BOSSES
========================================================= */

function spawnBoss() {

    bossActive = true;

    currentBoss = {

        x:
            canvas.width / 2,

        y: -150,

        width: 150,

        height: 100,

        health:
            1500 + wave * 250,

        maxHealth:
            1500 + wave * 250,

        speed: 2,

        direction: 1,

        shootTimer: 0

    };


    bossContainer.style.display =
        "block";

}


/* =========================================================
                BOSS SHOOTING
========================================================= */

function bossShoot() {

    if (!currentBoss) return;


    const dx =
        player.x -
        currentBoss.x;

    const dy =
        player.y -
        currentBoss.y;

    const distance =
        Math.hypot(dx, dy);


    enemyBullets.push({

        x: currentBoss.x,

        y: currentBoss.y + 50,

        vx: dx / distance * 5,

        vy: dy / distance * 5,

        radius: 8,

        color: "#ff0044"

    });

}


/* =========================================================
                    DRAW SPACE
========================================================= */

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );


    gradient.addColorStop(
        0,
        "#010314"
    );

    gradient.addColorStop(
        0.5,
        "#071332"
    );

    gradient.addColorStop(
        1,
        "#010107"
    );


    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    for (const star of stars) {

        star.y += star.speed;


        if (star.y > canvas.height) {

            star.y = 0;

            star.x =
                Math.random() *
                canvas.width;

        }


        ctx.globalAlpha =
            star.alpha;

        ctx.fillStyle =
            "#ffffff";

        ctx.beginPath();

        ctx.arc(
            star.x,
            star.y,
            star.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    ctx.globalAlpha = 1;

}


/* =========================================================
                DRAW PLAYER
========================================================= */

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );


    if (player.invulnerable > 0) {

        ctx.globalAlpha =
            Math.sin(
                Date.now() * 0.03
            ) > 0
                ? 0.4
                : 1;

    }


    /* engine flame */

    ctx.fillStyle =
        "#ff7b00";

    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "#ff4500";


    ctx.beginPath();

    ctx.moveTo(-10, 20);

    ctx.lineTo(0, 45);

    ctx.lineTo(10, 20);

    ctx.closePath();

    ctx.fill();


    /* ship */

    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "#00eaff";

    ctx.fillStyle =
        "#00bfff";


    ctx.beginPath();

    ctx.moveTo(0, -30);

    ctx.lineTo(24, 25);

    ctx.lineTo(0, 17);

    ctx.lineTo(-24, 25);

    ctx.closePath();

    ctx.fill();


    /* cockpit */

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        0,
        -8,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* wings */

    ctx.fillStyle =
        "#1766ff";

    ctx.fillRect(
        -27,
        15,
        15,
        7
    );

    ctx.fillRect(
        12,
        15,
        15,
        7
    );


    /* shield */

    if (player.shieldActive) {

        ctx.strokeStyle =
            "#00eaff";

        ctx.lineWidth = 4;

        ctx.shadowBlur = 30;

        ctx.shadowColor =
            "#00eaff";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            42,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
                DRAW BULLETS
========================================================= */

function drawBullets() {

    for (const b of bullets) {

        ctx.fillStyle =
            b.color;

        ctx.shadowBlur = 20;

        ctx.shadowColor =
            b.color;

        ctx.beginPath();

        ctx.arc(
            b.x,
            b.y,
            b.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    for (const b of enemyBullets) {

        ctx.fillStyle =
            b.color || "#ff4444";

        ctx.shadowBlur = 15;

        ctx.shadowColor =
            b.color || "#ff4444";

        ctx.beginPath();

        ctx.arc(
            b.x,
            b.y,
            b.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

}


/* =========================================================
                DRAW ENEMIES
========================================================= */

function drawEnemies() {

    for (const e of enemies) {

        ctx.save();

        ctx.translate(
            e.x,
            e.y
        );


        if (e.type === "fighter") {

            ctx.fillStyle =
                "#ff304f";

            ctx.shadowBlur = 15;

            ctx.shadowColor =
                "#ff304f";


            ctx.beginPath();

            ctx.moveTo(
                0,
                25
            );

            ctx.lineTo(
                -25,
                -15
            );

            ctx.lineTo(
                0,
                -7
            );

            ctx.lineTo(
                25,
                -15
            );

            ctx.closePath();

            ctx.fill();

        }


        if (e.type === "tank") {

            ctx.fillStyle =
                "#ff7b00";

            ctx.fillRect(
                -25,
                -25,
                50,
                50
            );

            ctx.fillStyle =
                "#ffd000";

            ctx.fillRect(
                -10,
                -35,
                20,
                70
            );

        }


        if (e.type === "zigzag") {

            ctx.strokeStyle =
                "#b83cff";

            ctx.lineWidth = 5;

            ctx.shadowBlur = 20;

            ctx.shadowColor =
                "#b83cff";

            ctx.beginPath();

            ctx.moveTo(
                -25,
                -20
            );

            ctx.lineTo(
                0,
                20
            );

            ctx.lineTo(
                25,
                -20
            );

            ctx.stroke();

        }


        if (e.type === "shooter") {

            ctx.fillStyle =
                "#00ff88";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                25,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle =
                "#001";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                9,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }


        ctx.restore();


        /* health bar */

        const barWidth =
            e.width;

        ctx.fillStyle =
            "#222";

        ctx.fillRect(
            e.x - barWidth / 2,
            e.y - e.height / 2 - 10,
            barWidth,
            4
        );


        ctx.fillStyle =
            "#ff3333";

        ctx.fillRect(
            e.x - barWidth / 2,
            e.y - e.height / 2 - 10,
            barWidth *
                (e.health / e.maxHealth),
            4
        );

    }

}


/* =========================================================
                DRAW ASTEROIDS
========================================================= */

function drawAsteroids() {

    for (const a of asteroids) {

        ctx.save();

        ctx.translate(
            a.x,
            a.y
        );

        ctx.rotate(
            a.rotation
        );


        ctx.fillStyle =
            "#777";

        ctx.strokeStyle =
            "#aaa";

        ctx.lineWidth = 3;


        ctx.beginPath();


        for (
            let i = 0;
            i < 9;
            i++
        ) {

            const angle =
                i / 9 *
                Math.PI *
                2;

            const radius =
                a.radius *
                (
                    0.75 +
                    Math.random() * 0.25
                );


            const x =
                Math.cos(angle) *
                radius;

            const y =
                Math.sin(angle) *
                radius;


            if (i === 0) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);

            }

        }


        ctx.closePath();

        ctx.fill();

        ctx.stroke();

        ctx.restore();

    }

}


/* =========================================================
                    DRAW BOSS
========================================================= */

function drawBoss() {

    if (!currentBoss) return;


    const b =
        currentBoss;


    ctx.save();

    ctx.translate(
        b.x,
        b.y
    );


    ctx.fillStyle =
        "#7d00ff";

    ctx.shadowBlur = 40;

    ctx.shadowColor =
        "#ff00ff";


    ctx.beginPath();

    ctx.moveTo(
        -75,
        -30
    );

    ctx.lineTo(
        -40,
        -55
    );

    ctx.lineTo(
        0,
        -40
    );

    ctx.lineTo(
        40,
        -55
    );

    ctx.lineTo(
        75,
        -30
    );

    ctx.lineTo(
        55,
        45
    );

    ctx.lineTo(
        0,
        60
    );

    ctx.lineTo(
        -55,
        45
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "#ff2255";


    ctx.beginPath();

    ctx.arc(
        0,
        5,
        18,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


/* =========================================================
                PLAYER MOVEMENT
========================================================= */

function updatePlayer() {

    let dx = 0;
    let dy = 0;


    if (
        keys.w ||
        keys.arrowup
    ) {

        dy--;

    }


    if (
        keys.s ||
        keys.arrowdown
    ) {

        dy++;

    }


    if (
        keys.a ||
        keys.arrowleft
    ) {

        dx--;

    }


    if (
        keys.d ||
        keys.arrowright
    ) {

        dx++;

    }


    if (dx || dy) {

        const length =
            Math.hypot(dx, dy);


        dx /= length;
        dy /= length;


        player.x +=
            dx *
            player.speed;

        player.y +=
            dy *
            player.speed;

    }


    player.x =
        Math.max(
            30,
            Math.min(
                canvas.width - 30,
                player.x
            )
        );


    player.y =
        Math.max(
            70,
            Math.min(
                canvas.height - 40,
                player.y
            )
        );


    if (keys.space) {

        shoot();

    }


    if (player.invulnerable > 0) {

        player.invulnerable--;

    }


    if (player.dashCooldown > 0) {

        player.dashCooldown--;

    }


    if (player.shieldCooldown > 0) {

        player.shieldCooldown--;

    }

}


/* =========================================================
                    DASH
========================================================= */

function dash() {

    if (
        player.dashCooldown > 0
    ) {

        return;

    }


    let dx = 0;
    let dy = -1;


    if (keys.a) dx--;

    if (keys.d) dx++;

    if (keys.w) dy--;

    if (keys.s) dy++;


    const length =
        Math.hypot(dx, dy);


    dx /= length;
    dy /= length;


    player.x +=
        dx * 130;

    player.y +=
        dy * 130;


    player.x =
        Math.max(
            30,
            Math.min(
                canvas.width - 30,
                player.x
            )
        );


    player.y =
        Math.max(
            60,
            Math.min(
                canvas.height - 40,
                player.y
            )
        );


    player.invulnerable = 40;

    player.dashCooldown = 120;

    createParticle(
        player.x,
        player.y,
        "#00ffff",
        35
    );

}


/* =========================================================
                    SHIELD
========================================================= */

function activateShield() {

    if (
        player.shieldCooldown > 0 ||
        player.shield <= 0
    ) {

        return;

    }


    player.shieldActive = true;

    player.shieldCooldown = 180;


    setTimeout(() => {

        player.shieldActive = false;

    }, 2500);

}


/* =========================================================
                PLAYER DAMAGE
========================================================= */

function damagePlayer(amount) {

    if (
        player.invulnerable > 0 ||
        player.shieldActive
    ) {

        return;

    }


    if (player.shield > 0) {

        const absorbed =
            Math.min(
                player.shield,
                amount
            );

        player.shield -=
            absorbed;

        amount -=
            absorbed;

    }


    if (amount > 0) {

        player.health -=
            amount;

    }


    player.invulnerable = 45;

    shake = 12;

    createParticle(
        player.x,
        player.y,
        "#ff3333",
        20
    );


    if (player.health <= 0) {

        gameOver();

    }

}


/* =========================================================
                COLLISION HELPER
========================================================= */

function distance(
    a,
    b
) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


/* =========================================================
                BULLET COLLISIONS
========================================================= */

function handleBulletCollisions() {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        let hit = false;


        /* enemies */

        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];


            if (
                Math.abs(
                    bullet.x -
                    enemy.x
                ) <
                enemy.width / 2 + 8
                &&
                Math.abs(
                    bullet.y -
                    enemy.y
                ) <
                enemy.height / 2 + 8
            ) {

                enemy.health -=
                    bullet.damage;

                bullets.splice(
                    i,
                    1
                );

                hit = true;


                createParticle(
                    bullet.x,
                    bullet.y,
                    "#ffffff",
                    5
                );


                if (
                    enemy.health <= 0
                ) {

                    killEnemy(
                        enemy,
                        j
                    );

                }

                break;

            }

        }


        if (hit) continue;


        /* boss */

        if (
            currentBoss &&
            bullet.x >
                currentBoss.x -
                currentBoss.width / 2 &&
            bullet.x <
                currentBoss.x +
                currentBoss.width / 2 &&
            bullet.y >
                currentBoss.y -
                currentBoss.height / 2 &&
            bullet.y <
                currentBoss.y +
                currentBoss.height / 2
        ) {

            currentBoss.health -=
                bullet.damage;

            bullets.splice(
                i,
                1
            );


            createParticle(
                bullet.x,
                bullet.y,
                "#ff00ff",
                5
            );


            if (
                currentBoss.health <= 0
            ) {

                killBoss();

            }

        }

    }

}


/* =========================================================
                ENEMY BULLET COLLISIONS
========================================================= */

function handleEnemyBulletCollisions() {

    for (
        let i = enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const b =
            enemyBullets[i];


        if (
            distance(
                b,
                player
            ) <
            b.radius + 18
        ) {

            enemyBullets.splice(
                i,
                1
            );


            damagePlayer(
                15
            );

        }

    }

}


/* =========================================================
                ENEMY MOVEMENT
========================================================= */

function updateEnemies() {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const e =
            enemies[i];


        e.y +=
            e.speed;


        e.phase += 0.04;


        if (
            e.type === "zigzag"
        ) {

            e.x +=
                Math.sin(
                    e.phase
                ) * 3;

        }


        if (
            e.type === "shooter"
        ) {

            e.shootTimer -=
                16;


            if (
                e.shootTimer <= 0
            ) {

                shootEnemy(
                    e
                );

                e.shootTimer =
                    1500 -
                    Math.min(
                        1000,
                        wave * 30
                    );

            }

        }


        if (
            distance(
                e,
                player
            ) <
            e.width / 2 + 20
        ) {

            enemies.splice(
                i,
                1
            );

            damagePlayer(
                30
            );

            createParticle(
                e.x,
                e.y,
                "#ff3300",
                30
            );

            continue;

        }


        if (
            e.y >
            canvas.height + 100
        ) {

            enemies.splice(
                i,
                1
            );

            combo = 1;

        }

    }

}


/* =========================================================
                SHOOT ENEMY
========================================================= */

function shootEnemy(enemy) {

    const dx =
        player.x -
        enemy.x;

    const dy =
        player.y -
        enemy.y;

    const len =
        Math.hypot(dx, dy);


    enemyBullets.push({

        x: enemy.x,

        y: enemy.y,

        vx:
            dx / len * 4,

        vy:
            dy / len * 4,

        radius: 6,

        color: "#00ff88"

    });

}


/* =========================================================
                KILL ENEMY
========================================================= */

function killEnemy(
    enemy,
    index
) {

    enemies.splice(
        index,
        1
    );


    const baseScore =
        enemy.type === "tank"
            ? 100
            : 50;


    score +=
        baseScore * combo;


    coins +=
        enemy.type === "tank"
            ? 15
            : 5;


    enemiesKilled++;


    combo =
        Math.min(
            20,
            combo + 0.25
        );


    comboTimer = 180;


    createParticle(
        enemy.x,
        enemy.y,
        "#ff5500",
        35
    );


    if (
        Math.random() <
        0.12
    ) {

        spawnPowerup(
            enemy.x,
            enemy.y
        );

    }


    playExplosionSound();


    if (
        enemiesKilled % 10 === 0
    ) {

        nextWave();

    }

}


/* =========================================================
                KILL BOSS
========================================================= */

function killBoss() {

    score +=
        5000 * wave;

    coins +=
        500;

    createParticle(
        currentBoss.x,
        currentBoss.y,
        "#ff00ff",
        150
    );


    currentBoss = null;

    bossActive = false;

    bossContainer.style.display =
        "none";


    nextWave();

    playBossExplosion();

}


/* =========================================================
                UPDATE BOSS
========================================================= */

function updateBoss() {

    if (!currentBoss) return;


    if (
        currentBoss.y <
        130
    ) {

        currentBoss.y +=
            1.5;

        return;

    }


    currentBoss.x +=
        currentBoss.speed *
        currentBoss.direction;


    if (
        currentBoss.x <
        100 ||
        currentBoss.x >
        canvas.width - 100
    ) {

        currentBoss.direction *=
            -1;

    }


    currentBoss.shootTimer -=
        16;


    if (
        currentBoss.shootTimer <= 0
    ) {

        bossShoot();

        bossShoot();

        currentBoss.shootTimer =
            500;

    }


    bossHealthBar.style.width =
        (
            currentBoss.health /
            currentBoss.maxHealth *
            100
        ) + "%";


    if (
        distance(
            currentBoss,
            player
        ) <
        100
    ) {

        damagePlayer(
            40
        );

    }

}


/* =========================================================
                UPDATE ASTEROIDS
========================================================= */

function updateAsteroids() {

    for (
        let i = asteroids.length - 1;
        i >= 0;
        i--
    ) {

        const a =
            asteroids[i];


        a.y +=
            a.speed;

        a.rotation +=
            a.rotationSpeed;


        if (
            distance(
                a,
                player
            ) <
            a.radius + 20
        ) {

            asteroids.splice(
                i,
                1
            );

            damagePlayer(
                20
            );

            continue;

        }


        if (
            a.y >
            canvas.height + 100
        ) {

            asteroids.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
                POWERUP UPDATE
========================================================= */

function updatePowerups() {

    for (
        let i = powerups.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            powerups[i];


        p.y +=
            p.vy;


        if (
            distance(
                p,
                player
            ) <
            p.radius + 20
        ) {

            collectPowerup(
                p
            );

            powerups.splice(
                i,
                1
            );

            continue;

        }


        if (
            p.y >
            canvas.height + 30
        ) {

            powerups.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
                DRAW POWERUPS
========================================================= */

function drawPowerups() {

    const icons = {

        health: "❤️",

        shield: "🛡️",

        weapon: "🔫",

        coin: "💰",

        rapid: "⚡"

    };


    for (const p of powerups) {

        ctx.font = "25px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.shadowBlur = 20;

        ctx.shadowColor =
            "#ffffff";


        ctx.fillText(
            icons[p.type],
            p.x,
            p.y
        );

    }

}


/* =========================================================
                NEXT WAVE
========================================================= */

function nextWave() {

    wave++;

    waveElement.textContent =
        wave;


    createParticle(
        canvas.width / 2,
        canvas.height / 2,
        "#00ffff",
        80
    );


    if (
        wave % 5 === 0 &&
        !bossActive
    ) {

        spawnBoss();

    }

}


/* =========================================================
                SPAWNING
========================================================= */

function updateSpawning() {

    spawnTimer -= 16;


    const spawnRate =
        Math.max(
            180,
            900 -
            wave * 45
        );


    if (
        spawnTimer <= 0 &&
        !bossActive
    ) {

        spawnEnemy();

        spawnTimer =
            spawnRate;

    }


    asteroidTimer -= 16;


    if (
        asteroidTimer <= 0
    ) {

        spawnAsteroid();

        asteroidTimer =
            1300;

    }


    powerTimer -= 16;


    if (
        powerTimer <= 0
    ) {

        if (
            Math.random() <
            0.35
        ) {

            spawnPowerup(
                Math.random() *
                    canvas.width,
                -20
            );

        }

        powerTimer =
            8000;

    }

}


/* =========================================================
                UI
========================================================= */

function updateUI() {

    scoreElement.textContent =
        Math.floor(score);

    coinsElement.textContent =
        coins;

    waveElement.textContent =
        wave;

    comboElement.textContent =
        "x" +
        combo.toFixed(1);


    healthBar.style.width =
        (
            player.health /
            player.maxHealth *
            100
        ) + "%";


    shieldBar.style.width =
        (
            player.shield /
            player.maxShield *
            100
        ) + "%";

}


function updateWeaponUI() {

    const names = {

        1: "LASER",

        2: "DUAL CANNON",

        3: "PLASMA"

    };


    weaponNameElement.textContent =
        names[player.weapon];

}


/* =========================================================
                COMBO
========================================================= */

function updateCombo() {

    if (
        comboTimer > 0
    ) {

        comboTimer--;

    } else {

        combo =
            Math.max(
                1,
                combo - 0.01
            );

    }

}


/* =========================================================
                GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    if (!gameRunning) {

        requestAnimationFrame(
            gameLoop
        );

        return;

    }


    if (paused) {

        requestAnimationFrame(
            gameLoop
        );

        return;

    }


    const dt =
        Math.min(
            32,
            timestamp - lastTime
        );


    lastTime =
        timestamp;


    updatePlayer();

    updateBullets();

    updateEnemies();

    updateAsteroids();

    updatePowerups();

    updateBoss();

    updateParticles();

    handleBulletCollisions();

    handleEnemyBulletCollisions();

    updateSpawning();

    updateCombo();


    if (shake > 0) {

        shake *= 0.9;

    }


    /* ================= DRAW ================= */

    ctx.save();


    if (shake > 0) {

        ctx.translate(
            (Math.random() - 0.5) *
                shake,
            (Math.random() - 0.5) *
                shake
        );

    }


    drawBackground();

    drawAsteroids();

    drawPowerups();

    drawEnemies();

    drawBoss();

    drawBullets();

    drawParticles();

    drawPlayer();


    ctx.restore();


    updateUI();


    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
                START GAME
========================================================= */

function startGame() {

    gameRunning = true;

    paused = false;

    score = 0;

    wave = 1;

    enemiesKilled = 0;

    combo = 1;

    spawnTimer = 0;

    asteroidTimer = 500;

    powerTimer = 3000;

    bossActive = false;

    currentBoss = null;


    enemies.length = 0;

    bullets.length = 0;

    enemyBullets.length = 0;

    asteroids.length = 0;

    powerups.length = 0;

    particles.length = 0;


    applyUpgrades();


    player.x =
        canvas.width / 2;

    player.y =
        canvas.height - 130;

    player.weapon = 1;

    player.invulnerable = 0;

    player.dashCooldown = 0;

    player.shieldCooldown = 0;

    player.shieldActive = false;


    startScreen.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    pauseScreen.classList.add(
        "hidden"
    );


    updateWeaponUI();

    updateUI();


    playStartSound();

}


/* =========================================================
                GAME OVER
========================================================= */

function gameOver() {

    gameRunning = false;


    if (
        score > highScore
    ) {

        highScore =
            Math.floor(score);

    }


    saveData();


    document.getElementById(
        "finalScore"
    ).textContent =
        Math.floor(score);


    document.getElementById(
        "finalWave"
    ).textContent =
        wave;


    document.getElementById(
        "finalHighScore"
    ).textContent =
        highScore;


    gameOverScreen.classList.remove(
        "hidden"
    );


    playGameOverSound();

}


/* =========================================================
                PAUSE
========================================================= */

function togglePause() {

    if (!gameRunning) return;


    paused =
        !paused;


    if (paused) {

        pauseScreen.classList.remove(
            "hidden"
        );

    } else {

        pauseScreen.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
                SAVE
========================================================= */

function saveData() {

    localStorage.setItem(
        "galaxyStrikeData",
        JSON.stringify({

            highScore,

            health:
                upgrades.health,

            damage:
                upgrades.damage,

            speed:
                upgrades.speed,

            shield:
                upgrades.shield,

            fireRate:
                upgrades.fireRate,

            coins

        })
    );

}


/* =========================================================
                SHOP
========================================================= */

function openShop() {

    document.getElementById(
        "shopCoins"
    ).textContent =
        coins;

    shopScreen.classList.remove(
        "hidden"
    );

}


function closeShop() {

    shopScreen.classList.add(
        "hidden"
    );

}


document
    .querySelectorAll(".upgrade")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const type =
                    button.dataset.upgrade;


                const prices = {

                    health: 100,

                    damage: 150,

                    speed: 100,

                    shield: 200,

                    fireRate: 250

                };


                const price =
                    prices[type];


                if (
                    coins < price
                ) {

                    alert(
                        "Not enough coins!"
                    );

                    return;

                }


                coins -= price;

                upgrades[type]++;


                saveData();


                document.getElementById(
                    "shopCoins"
                ).textContent =
                    coins;


                applyUpgrades();

            }
        );

    });


/* =========================================================
                BUTTONS
========================================================= */

document
    .getElementById("startButton")
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById("restartButton")
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById("resumeButton")
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById("quitButton")
    .addEventListener(
        "click",
        () => {

            paused = false;

            gameRunning = false;

            pauseScreen.classList.add(
                "hidden"
            );

            startScreen.classList.remove(
                "hidden"
            );

        }
    );


document
    .getElementById("menuButton")
    .addEventListener(
        "click",
        () => {

            gameOverScreen.classList.add(
                "hidden"
            );

            startScreen.classList.remove(
                "hidden"
            );

        }
    );


document
    .getElementById("shopButton")
    .addEventListener(
        "click",
        openShop
    );


document
    .getElementById("closeShop")
    .addEventListener(
        "click",
        closeShop
    );


/* =========================================================
                    SOUND ENGINE
========================================================= */

let audioContext = null;


function getAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    return audioContext;

}


function beep(
    frequency,
    duration,
    type = "sine",
    volume = 0.04
) {

    try {

        const audio =
            getAudio();


        const oscillator =
            audio.createOscillator();


        const gain =
            audio.createGain();


        oscillator.type =
            type;


        oscillator.frequency.value =
            frequency;


        gain.gain.value =
            volume;


        oscillator.connect(gain);

        gain.connect(
            audio.destination
        );


        oscillator.start();


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime +
                duration
        );


        oscillator.stop(
            audio.currentTime +
            duration
        );

    } catch (error) {

        /* Audio unavailable */

    }

}


function playShootSound() {

    beep(
        700,
        0.06,
        "square",
        0.025
    );

}


function playExplosionSound() {

    beep(
        100,
        0.2,
        "sawtooth",
        0.06
    );

}


function playBossExplosion() {

    beep(
        60,
        0.7,
        "sawtooth",
        0.1
    );

    setTimeout(
        () =>
            beep(
                300,
                0.3,
                "square",
                0.06
            ),
        100
    );

}


function playStartSound() {

    beep(
        300,
        0.1
    );

    setTimeout(
        () =>
            beep(
                500,
                0.1
            ),
        100
    );

    setTimeout(
        () =>
            beep(
                800,
                0.2
            ),
        200
    );

}


function playGameOverSound() {

    beep(
        500,
        0.2,
        "sawtooth",
        0.06
    );

    setTimeout(
        () =>
            beep(
                250,
                0.4,
                "sawtooth",
                0.06
            ),
        200
    );

}


/* =========================================================
                INITIALIZATION
========================================================= */

resizeCanvas();

applyUpgrades();

document.getElementById(
    "highScore"
).textContent =
    highScore;


coins =
    savedData.coins || 0;


updateWeaponUI();

updateUI();


requestAnimationFrame(
    gameLoop
);