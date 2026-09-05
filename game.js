"use strict";


/* =========================================================
                    CANVAS
========================================================= */

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");


function resize() {

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;

}


window.addEventListener(
    "resize",
    resize
);

resize();


/* =========================================================
                    UI
========================================================= */

const scoreUI =
    document.getElementById("score");

const waveUI =
    document.getElementById("wave");

const comboUI =
    document.getElementById("combo");

const coinsUI =
    document.getElementById("coins");

const weaponUI =
    document.getElementById("weapon");

const healthBar =
    document.getElementById("healthBar");

const shieldBar =
    document.getElementById("shieldBar");

const bossUI =
    document.getElementById("bossUI");

const bossBar =
    document.getElementById("bossBar");

const startScreen =
    document.getElementById("startScreen");

const pauseScreen =
    document.getElementById("pauseScreen");

const gameOverScreen =
    document.getElementById("gameOver");

const shopScreen =
    document.getElementById("shopScreen");


/* =========================================================
                    SAVE DATA
========================================================= */

let save =
    JSON.parse(
        localStorage.getItem(
            "GalaxyStrikeSave"
        ) || "{}"
    );


let highScore =
    save.highScore || 0;


let coins =
    save.coins || 0;


let upgrades = {

    health:
        save.health || 0,

    damage:
        save.damage || 0,

    speed:
        save.speed || 0,

    shield:
        save.shield || 0,

    fire:
        save.fire || 0

};


document.getElementById(
    "highScore"
).textContent = highScore;


/* =========================================================
                    GAME STATE
========================================================= */

let running = false;

let paused = false;

let score = 0;

let wave = 1;

let kills = 0;

let combo = 1;

let comboTimer = 0;

let spawnTimer = 0;

let asteroidTimer = 0;

let powerTimer = 0;

let screenShake = 0;

let boss = null;

let lastTime = 0;


/* =========================================================
                    PLAYER
========================================================= */

const player = {

    x:
        canvas.width / 2,

    y:
        canvas.height - 120,

    width: 35,

    height: 50,

    speed: 5.5,

    health: 120,

    maxHealth: 120,

    shield: 120,

    maxShield: 120,

    damage: 22,

    fireRate: 260,

    weapon: 1,

    lastShot: 0,

    invulnerable: 0,

    dashCooldown: 0,

    shieldCooldown: 0,

    shieldActive: false

};


function applyUpgrades() {

    player.maxHealth =
        120 +
        upgrades.health * 20;

    player.health =
        player.maxHealth;


    player.maxShield =
        120 +
        upgrades.shield * 25;

    player.shield =
        player.maxShield;


    player.damage =
        22 +
        upgrades.damage * 5;


    player.speed =
        5.5 +
        upgrades.speed * 0.5;


    player.fireRate =
        Math.max(
            100,
            260 -
            upgrades.fire * 16
        );

}


/* =========================================================
                    INPUT
========================================================= */

const keys = {};


window.addEventListener(
    "keydown",
    e => {

        const key =
            e.key.toLowerCase();

        keys[key] = true;


        if (
            e.code === "Space"
        ) {

            keys.space = true;

            e.preventDefault();

        }


        if (key === "p") {

            togglePause();

        }


        if (key === "e") {

            activateShield();

        }


        if (e.key === "Shift") {

            dash();

        }


        if (e.key === "1") {

            changeWeapon(1);

        }


        if (e.key === "2") {

            changeWeapon(2);

        }


        if (e.key === "3") {

            changeWeapon(3);

        }

    }
);


window.addEventListener(
    "keyup",
    e => {

        const key =
            e.key.toLowerCase();

        keys[key] = false;


        if (
            e.code === "Space"
        ) {

            keys.space = false;

        }

    }
);


/* =========================================================
                MOBILE INPUT
========================================================= */

function hold(
    id,
    key
) {

    const button =
        document.getElementById(id);


    button.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            keys[key] = true;

        },
        { passive: false }
    );


    button.addEventListener(
        "touchend",
        e => {

            e.preventDefault();

            keys[key] = false;

        },
        { passive: false }
    );

}


hold("mUp", "arrowup");

hold("mDown", "arrowdown");

hold("mLeft", "arrowleft");

hold("mRight", "arrowright");


document
    .getElementById("mShoot")
    .addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            keys.space = true;

        },
        { passive: false }
    );


document
    .getElementById("mShoot")
    .addEventListener(
        "touchend",
        () => {

            keys.space = false;

        }
    );


document
    .getElementById("mShield")
    .addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            activateShield();

        },
        { passive: false }
    );


document
    .getElementById("mDash")
    .addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            dash();

        },
        { passive: false }
    );


document
    .getElementById("gun1")
    .addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            changeWeapon(1);

        },
        { passive: false }
    );


document
    .getElementById("gun2")
    .addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            changeWeapon(2);

        },
        { passive: false }
    );


document
    .getElementById("gun3")
    .addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            changeWeapon(3);

        },
        { passive: false }
    );


/* =========================================================
                    WEAPONS
========================================================= */

function changeWeapon(number) {

    player.weapon = number;

    const names = {

        1: "LASER",

        2: "DUAL",

        3: "PLASMA"

    };


    weaponUI.textContent =
        names[number];

}


/* =========================================================
                    DIFFICULTY
========================================================= */

function difficulty() {

    /*
        1-3   VERY EASY
        4-6   EASY
        7-10  MEDIUM
        11-15 HARD
        16+   VERY HARD
    */


    if (wave <= 3) {

        return {

            speed: 0.8,

            health: 20,

            spawn: 1450,

            bullet: 2.2,

            asteroid: 2600

        };

    }


    if (wave <= 6) {

        return {

            speed:
                0.95 +
                (wave - 3) * 0.08,

            health:
                25 +
                (wave - 3) * 5,

            spawn:
                1250 -
                (wave - 3) * 70,

            bullet: 2.7,

            asteroid: 2200

        };

    }


    if (wave <= 10) {

        return {

            speed:
                1.25 +
                (wave - 6) * 0.12,

            health:
                42 +
                (wave - 6) * 7,

            spawn:
                1000 -
                (wave - 6) * 50,

            bullet: 3.2,

            asteroid: 1700

        };

    }


    if (wave <= 15) {

        return {

            speed:
                1.75 +
                (wave - 10) * 0.13,

            health:
                75 +
                (wave - 10) * 10,

            spawn:
                750 -
                (wave - 10) * 30,

            bullet: 3.8,

            asteroid: 1300

        };

    }


    return {

        speed:
            Math.min(
                3.5,
                2.4 +
                (wave - 15) * 0.1
            ),

        health:
            125 +
            (wave - 15) * 15,

        spawn:
            Math.max(
                350,
                600 -
                (wave - 15) * 12
            ),

        bullet:
            Math.min(
                5.5,
                4 +
                (wave - 15) * 0.08
            ),

        asteroid: 1000

    };

}


/* =========================================================
                    STARS
========================================================= */

const stars = [];


for (
    let i = 0;
    i < 280;
    i++
) {

    stars.push({

        x:
            Math.random() *
            canvas.width,

        y:
            Math.random() *
            canvas.height,

        size:
            Math.random() * 2 + 0.4,

        speed:
            Math.random() * 2 + 0.4,

        alpha:
            Math.random()

    });

}


/* =========================================================
                    PARTICLES
========================================================= */

const particles = [];


function particle(
    x,
    y,
    color,
    amount = 10
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

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


function updateParticles() {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];


        p.x += p.vx;

        p.y += p.vy;

        p.life -= 0.025;

        p.size *= 0.98;


        if (
            p.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }

}


function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha =
            p.life;

        ctx.fillStyle =
            p.color;

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

    const now =
        performance.now();


    if (
        now -
        player.lastShot <
        player.fireRate
    ) {

        return;

    }


    player.lastShot =
        now;


    sound(
        650,
        0.05,
        "square",
        0.025
    );


    const damage =
        player.damage;


    if (
        player.weapon === 1
    ) {

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


    if (
        player.weapon === 2
    ) {

        bullets.push({

            x:
                player.x - 12,

            y:
                player.y - 25,

            vx: -0.5,

            vy: -13,

            radius: 4,

            damage:
                damage * 0.8,

            color: "#ffff00"

        });


        bullets.push({

            x:
                player.x + 12,

            y:
                player.y - 25,

            vx: 0.5,

            vy: -13,

            radius: 4,

            damage:
                damage * 0.8,

            color: "#ffff00"

        });

    }


    if (
        player.weapon === 3
    ) {

        bullets.push({

            x: player.x,

            y: player.y - 32,

            vx: 0,

            vy: -16,

            radius: 7,

            damage:
                damage * 1.8,

            color: "#ff33ff"

        });

    }

}


/* =========================================================
                    ENEMIES
========================================================= */

const enemies = [];


function spawnEnemy() {

    const d =
        difficulty();


    const types = [

        "fighter",

        "fighter",

        "zigzag",

        "shooter",

        "tank"

    ];


    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];


    let health =
        d.health;


    let speed =
        d.speed;


    let size = 35;


    if (
        type === "tank"
    ) {

        health *= 3;

        speed *= 0.55;

        size = 52;

    }


    if (
        type === "shooter"
    ) {

        health *= 1.4;

    }


    enemies.push({

        x:
            Math.random() *
            (canvas.width - 80)
            + 40,

        y: -70,

        type,

        health,

        maxHealth: health,

        speed,

        size,

        phase:
            Math.random() *
            Math.PI * 2,

        shootTimer:
            1300 +
            Math.random() *
            1500

    });

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

        y: -60,

        radius:
            Math.random() *
            20 + 15,

        speed:
            Math.random() *
            1.4 + 0.8,

        rotation:
            Math.random() *
            Math.PI * 2,

        rotationSpeed:
            (Math.random() - 0.5) *
            0.04

    });

}


/* =========================================================
                    POWERUPS
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

        speed: 1.8

    });

}


function collectPowerup(
    p
) {

    if (
        p.type === "health"
    ) {

        player.health =
            Math.min(
                player.maxHealth,
                player.health + 40
            );

        particle(
            p.x,
            p.y,
            "#ff3333",
            30
        );

    }


    if (
        p.type === "shield"
    ) {

        player.shield =
            Math.min(
                player.maxShield,
                player.shield + 60
            );

        particle(
            p.x,
            p.y,
            "#00aaff",
            30
        );

    }


    if (
        p.type === "weapon"
    ) {

        player.weapon =
            Math.min(
                3,
                player.weapon + 1
            );

        changeWeapon(
            player.weapon
        );

        particle(
            p.x,
            p.y,
            "#ff00ff",
            35
        );

    }


    if (
        p.type === "coin"
    ) {

        coins += 50;

    }


    if (
        p.type === "rapid"
    ) {

        player.fireRate *= 0.5;


        setTimeout(
            () => {

                player.fireRate =
                    Math.max(
                        100,
                        260 -
                        upgrades.fire *
                        16
                    );

            },
            6000
        );

    }

}


/* =========================================================
                    BOSS
========================================================= */

function spawnBoss() {

    const health =
        wave <= 10
            ? 900
            : 1400 +
              wave * 220;


    boss = {

        x:
            canvas.width / 2,

        y: -120,

        width: 150,

        height: 100,

        health,

        maxHealth: health,

        speed:
            wave <= 10
                ? 1.2
                : 2,

        direction: 1,

        shootTimer: 900

    };


    bossUI.style.display =
        "block";


    bossBar.style.width =
        "100%";

}


/* =========================================================
                BOSS UPDATE
========================================================= */

function updateBoss() {

    if (!boss) {

        return;

    }


    if (
        boss.y < 130
    ) {

        boss.y += 1.5;

        return;

    }


    boss.x +=
        boss.speed *
        boss.direction;


    if (
        boss.x < 100 ||
        boss.x >
        canvas.width - 100
    ) {

        boss.direction *= -1;

    }


    boss.shootTimer -= 16;


    if (
        boss.shootTimer <= 0
    ) {

        bossShoot();

        boss.shootTimer =
            wave <= 10
                ? 900
                : 550;

    }


    bossBar.style.width =
        (
            boss.health /
            boss.maxHealth *
            100
        ) + "%";


    if (
        dist(
            boss,
            player
        ) < 95
    ) {

        damagePlayer(30);

    }

}


function bossShoot() {

    if (!boss) return;


    const dx =
        player.x -
        boss.x;

    const dy =
        player.y -
        boss.y;

    const len =
        Math.hypot(
            dx,
            dy
        );


    const d =
        difficulty();


    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        enemyBullets.push({

            x: boss.x,

            y: boss.y + 40,

            vx:
                dx / len *
                d.bullet +
                i * 0.8,

            vy:
                dy / len *
                d.bullet,

            radius: 7,

            color: "#ff174f"

        });

    }

}


/* =========================================================
                    UPDATE PLAYER
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


    if (
        dx !== 0 ||
        dy !== 0
    ) {

        const len =
            Math.hypot(
                dx,
                dy
            );


        dx /= len;

        dy /= len;


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
                canvas.height - 35,
                player.y
            )
        );


    if (
        keys.space
    ) {

        shoot();

    }


    if (
        player.invulnerable > 0
    ) {

        player.invulnerable--;

    }


    if (
        player.dashCooldown > 0
    ) {

        player.dashCooldown--;

    }


    if (
        player.shieldCooldown > 0
    ) {

        player.shieldCooldown--;

    }

}


/* =========================================================
                    SHIELD REGEN
========================================================= */

function regenerateShield() {

    if (
        player.shieldActive
    ) {

        return;

    }


    /*
        More generous shield regeneration
        during early waves.
    */

    const amount =
        wave <= 5
            ? 0.12
            : 0.05;


    player.shield =
        Math.min(
            player.maxShield,
            player.shield + amount
        );

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


    const len =
        Math.hypot(
            dx,
            dy
        );


    dx /= len;

    dy /= len;


    player.x +=
        dx * 120;

    player.y +=
        dy * 120;


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
                canvas.height - 35,
                player.y
            )
        );


    player.invulnerable =
        45;


    player.dashCooldown =
        wave <= 5
            ? 70
            : 100;


    particle(
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


    player.shieldActive =
        true;


    player.shieldCooldown =
        wave <= 5
            ? 100
            : 150;


    setTimeout(
        () => {

            player.shieldActive =
                false;

        },
        2500
    );

}


/* =========================================================
                    DAMAGE
========================================================= */

function damagePlayer(
    amount
) {

    if (
        player.invulnerable > 0 ||
        player.shieldActive
    ) {

        return;

    }


    if (
        player.shield > 0
    ) {

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


    if (
        amount > 0
    ) {

        player.health -=
            amount;

    }


    player.invulnerable =
        45;


    screenShake = 10;


    particle(
        player.x,
        player.y,
        "#ff3333",
        20
    );


    if (
        player.health <= 0
    ) {

        gameOver();

    }

}


/* =========================================================
                    BULLET UPDATE
========================================================= */

function updateBullets() {

    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const b =
            bullets[i];


        b.x += b.vx;

        b.y += b.vy;


        if (
            b.y < -40 ||
            b.x < -40 ||
            b.x >
            canvas.width + 40
        ) {

            bullets.splice(
                i,
                1
            );

        }

    }


    for (
        let i =
            enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const b =
            enemyBullets[i];


        b.x += b.vx;

        b.y += b.vy;


        if (
            b.x < -60 ||
            b.x >
            canvas.width + 60 ||
            b.y >
            canvas.height + 60
        ) {

            enemyBullets.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
                ENEMY UPDATE
========================================================= */

function updateEnemies() {

    for (
        let i =
            enemies.length - 1;
        i >= 0;
        i--
    ) {

        const e =
            enemies[i];


        e.y +=
            e.speed;


        e.phase +=
            0.04;


        if (
            e.type ===
            "zigzag"
        ) {

            e.x +=
                Math.sin(
                    e.phase
                ) * 2.5;

        }


        if (
            e.type ===
            "shooter"
        ) {

            e.shootTimer -= 16;


            if (
                e.shootTimer <= 0
            ) {

                enemyShoot(e);

                e.shootTimer =
                    Math.max(
                        800,
                        1700 -
                        wave * 30
                    );

            }

        }


        if (
            dist(
                e,
                player
            ) <
            e.size / 2 + 18
        ) {

            enemies.splice(
                i,
                1
            );


            damagePlayer(
                25
            );


            continue;

        }


        if (
            e.y >
            canvas.height + 80
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
                ENEMY SHOOT
========================================================= */

function enemyShoot(
    enemy
) {

    const dx =
        player.x -
        enemy.x;

    const dy =
        player.y -
        enemy.y;

    const len =
        Math.hypot(
            dx,
            dy
        );


    const d =
        difficulty();


    enemyBullets.push({

        x: enemy.x,

        y: enemy.y,

        vx:
            dx / len *
            d.bullet,

        vy:
            dy / len *
            d.bullet,

        radius:
            wave <= 5
                ? 4
                : 6,

        color:
            "#00ff88"

    });

}


/* =========================================================
                ASTEROID UPDATE
========================================================= */

function updateAsteroids() {

    for (
        let i =
            asteroids.length - 1;
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
            dist(
                a,
                player
            ) <
            a.radius + 18
        ) {

            asteroids.splice(
                i,
                1
            );


            damagePlayer(
                18
            );


            continue;

        }


        if (
            a.y >
            canvas.height + 80
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
        let i =
            powerups.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            powerups[i];


        p.y +=
            p.speed;


        if (
            dist(
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
            canvas.height + 40
        ) {

            powerups.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
                COLLISIONS
========================================================= */

function collisions() {

    /* PLAYER BULLETS */

    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const b =
            bullets[i];


        let removed =
            false;


        for (
            let j =
                enemies.length - 1;
            j >= 0;
            j--
        ) {

            const e =
                enemies[j];


            if (
                Math.abs(
                    b.x - e.x
                ) <
                e.size / 2 + 6
                &&
                Math.abs(
                    b.y - e.y
                ) <
                e.size / 2 + 8
            ) {

                e.health -=
                    b.damage;


                bullets.splice(
                    i,
                    1
                );


                removed =
                    true;


                particle(
                    b.x,
                    b.y,
                    "#ffffff",
                    5
                );


                if (
                    e.health <= 0
                ) {

                    killEnemy(
                        e,
                        j
                    );

                }


                break;

            }

        }


        if (
            removed
        ) {

            continue;

        }


        /* BOSS */

        if (
            boss &&
            Math.abs(
                b.x - boss.x
            ) <
            boss.width / 2
            &&
            Math.abs(
                b.y - boss.y
            ) <
            boss.height / 2
        ) {

            boss.health -=
                b.damage;


            bullets.splice(
                i,
                1
            );


            particle(
                b.x,
                b.y,
                "#ff00ff",
                4
            );


            if (
                boss.health <= 0
            ) {

                killBoss();

            }

        }

    }


    /* ENEMY BULLETS */

    for (
        let i =
            enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const b =
            enemyBullets[i];


        if (
            dist(
                b,
                player
            ) <
            b.radius + 17
        ) {

            enemyBullets.splice(
                i,
                1
            );


            damagePlayer(
                12
            );

        }

    }

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


    const points =
        enemy.type === "tank"
            ? 120
            : 50;


    score +=
        points *
        combo;


    coins +=
        enemy.type === "tank"
            ? 15
            : 5;


    kills++;


    combo =
        Math.min(
            15,
            combo + 0.25
        );


    comboTimer =
        180;


    particle(
        enemy.x,
        enemy.y,
        "#ff5500",
        30
    );


    if (
        Math.random() < 0.12
    ) {

        spawnPowerup(
            enemy.x,
            enemy.y
        );

    }


    sound(
        100,
        0.18,
        "sawtooth",
        0.04
    );


    /*
        Wave progression.

        Early waves require fewer kills.
        Later waves require more.
    */

    const requiredKills =
        wave <= 3
            ? 6
            : wave <= 6
                ? 9
                : 12;


    if (
        kills >=
        requiredKills
    ) {

        nextWave();

    }

}


/* =========================================================
                    BOSS DEATH
========================================================= */

function killBoss() {

    score +=
        5000 * wave;


    coins +=
        500;


    particle(
        boss.x,
        boss.y,
        "#ff00ff",
        150
    );


    sound(
        60,
        0.7,
        "sawtooth",
        0.08
    );


    boss = null;


    bossUI.style.display =
        "none";


    nextWave();

}


/* =========================================================
                    NEXT WAVE
========================================================= */

function nextWave() {

    wave++;

    kills = 0;


    /*
        Boss every 5 waves.
    */

    if (
        wave % 5 === 0
    ) {

        spawnBoss();

    }


    particle(
        canvas.width / 2,
        canvas.height / 2,
        "#00ffff",
        70
    );


    sound(
        500,
        0.15,
        "sine",
        0.04
    );


    setTimeout(
        () => {

            sound(
                800,
                0.2,
                "sine",
                0.04
            );

        },
        150
    );

}


/* =========================================================
                    SPAWNING
========================================================= */

function updateSpawning() {

    const d =
        difficulty();


    spawnTimer -= 16;


    if (
        spawnTimer <= 0 &&
        !boss
    ) {

        spawnEnemy();


        /*
            Don't overwhelm the player
            in early waves.
        */

        if (
            wave >= 7 &&
            Math.random() <
            0.18
        ) {

            spawnEnemy();

        }


        if (
            wave >= 12 &&
            Math.random() <
            0.20
        ) {

            spawnEnemy();

        }


        spawnTimer =
            d.spawn;

    }


    asteroidTimer -= 16;


    if (
        asteroidTimer <= 0
    ) {

        /*
            No asteroids in wave 1-2.
        */

        if (
            wave >= 3
        ) {

            spawnAsteroid();

        }


        asteroidTimer =
            d.asteroid;

    }


    powerTimer -= 16;


    if (
        powerTimer <= 0
    ) {

        /*
            Give more powerups
            during early game.
        */

        const chance =
            wave <= 5
                ? 0.75
                : 0.35;


        if (
            Math.random() <
            chance
        ) {

            spawnPowerup(

                Math.random() *
                    canvas.width,

                -20

            );

        }


        powerTimer =
            wave <= 5
                ? 5000
                : 8000;

    }

}


/* =========================================================
                    DISTANCE
========================================================= */

function dist(
    a,
    b
) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


/* =========================================================
                    DRAW BACKGROUND
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
        "#010318"
    );


    gradient.addColorStop(
        0.5,
        "#07143b"
    );


    gradient.addColorStop(
        1,
        "#010107"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    for (
        const star of stars
    ) {

        star.y +=
            star.speed;


        if (
            star.y >
            canvas.height
        ) {

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


    if (
        player.invulnerable > 0
    ) {

        ctx.globalAlpha =
            Math.sin(
                Date.now() * 0.03
            ) > 0
                ? 0.35
                : 1;

    }


    /* ENGINE */

    ctx.fillStyle =
        "#ff6500";


    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "#ff4500";


    ctx.beginPath();

    ctx.moveTo(
        -9,
        20
    );

    ctx.lineTo(
        0,
        45
    );

    ctx.lineTo(
        9,
        20
    );

    ctx.closePath();

    ctx.fill();


    /* SHIP */

    ctx.fillStyle =
        "#00bfff";


    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "#00eaff";


    ctx.beginPath();

    ctx.moveTo(
        0,
        -32
    );

    ctx.lineTo(
        25,
        25
    );

    ctx.lineTo(
        0,
        15
    );

    ctx.lineTo(
        -25,
        25
    );

    ctx.closePath();

    ctx.fill();


    /* COCKPIT */

    ctx.fillStyle =
        "white";


    ctx.beginPath();

    ctx.arc(
        0,
        -8,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* WINGS */

    ctx.fillStyle =
        "#1766ff";


    ctx.fillRect(
        -28,
        15,
        16,
        7
    );


    ctx.fillRect(
        12,
        15,
        16,
        7
    );


    /* SHIELD */

    if (
        player.shieldActive
    ) {

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
            44,
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

    for (
        const b of bullets
    ) {

        ctx.fillStyle =
            b.color;


        ctx.shadowBlur =
            18;


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


    for (
        const b of enemyBullets
    ) {

        ctx.fillStyle =
            b.color;


        ctx.shadowBlur =
            15;


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

}


/* =========================================================
                    DRAW ENEMIES
========================================================= */

function drawEnemies() {

    for (
        const e of enemies
    ) {

        ctx.save();


        ctx.translate(
            e.x,
            e.y
        );


        if (
            e.type ===
            "fighter"
        ) {

            ctx.fillStyle =
                "#ff3150";


            ctx.shadowBlur =
                18;


            ctx.shadowColor =
                "#ff3150";


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


        if (
            e.type ===
            "tank"
        ) {

            ctx.fillStyle =
                "#ff7800";


            ctx.shadowBlur =
                15;


            ctx.shadowColor =
                "#ff7800";


            ctx.fillRect(
                -25,
                -25,
                50,
                50
            );


            ctx.fillStyle =
                "#ffd000";


            ctx.fillRect(
                -9,
                -32,
                18,
                64
            );

        }


        if (
            e.type ===
            "zigzag"
        ) {

            ctx.strokeStyle =
                "#c238ff";


            ctx.lineWidth = 5;


            ctx.shadowBlur =
                18;


            ctx.shadowColor =
                "#c238ff";


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


        if (
            e.type ===
            "shooter"
        ) {

            ctx.fillStyle =
                "#00ff88";


            ctx.shadowBlur =
                18;


            ctx.shadowColor =
                "#00ff88";


            ctx.beginPath();

            ctx.arc(
                0,
                0,
                24,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.fillStyle =
                "#00150b";


            ctx.beginPath();

            ctx.arc(
                0,
                0,
                8,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }


        ctx.restore();


        /* HEALTH */

        const width =
            e.size;


        ctx.fillStyle =
            "#222";


        ctx.fillRect(
            e.x - width / 2,
            e.y - e.size / 2 - 8,
            width,
            4
        );


        ctx.fillStyle =
            "#ff3333";


        ctx.fillRect(
            e.x - width / 2,
            e.y - e.size / 2 - 8,
            width *
            (
                e.health /
                e.maxHealth
            ),
            4
        );

    }

}


/* =========================================================
                    DRAW ASTEROIDS
========================================================= */

function drawAsteroids() {

    for (
        const a of asteroids
    ) {

        ctx.save();


        ctx.translate(
            a.x,
            a.y
        );


        ctx.rotate(
            a.rotation
        );


        ctx.fillStyle =
            "#707070";


        ctx.strokeStyle =
            "#aaaaaa";


        ctx.lineWidth = 2;


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
                    0.8 +
                    Math.random() *
                    0.2
                );


            const x =
                Math.cos(angle) *
                radius;


            const y =
                Math.sin(angle) *
                radius;


            if (
                i === 0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }


        ctx.closePath();

        ctx.fill();

        ctx.stroke();


        ctx.restore();

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


    for (
        const p of powerups
    ) {

        ctx.font =
            "24px Arial";


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.shadowBlur =
            15;


        ctx.shadowColor =
            "white";


        ctx.fillText(
            icons[p.type],
            p.x,
            p.y
        );

    }

}


/* =========================================================
                    DRAW BOSS
========================================================= */

function drawBoss() {

    if (!boss) {

        return;

    }


    ctx.save();


    ctx.translate(
        boss.x,
        boss.y
    );


    ctx.fillStyle =
        "#7d00ff";


    ctx.shadowBlur =
        35;


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
                    UPDATE UI
========================================================= */

function updateUI() {

    scoreUI.textContent =
        Math.floor(score);


    waveUI.textContent =
        wave;


    comboUI.textContent =
        "x" +
        combo.toFixed(1);


    coinsUI.textContent =
        coins;


    healthBar.style.width =
        Math.max(
            0,
            player.health /
            player.maxHealth *
            100
        ) + "%";


    shieldBar.style.width =
        Math.max(
            0,
            player.shield /
            player.maxShield *
            100
        ) + "%";

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
                    SAVE
========================================================= */

function saveGame() {

    localStorage.setItem(

        "GalaxyStrikeSave",

        JSON.stringify({

            highScore,

            coins,

            health:
                upgrades.health,

            damage:
                upgrades.damage,

            speed:
                upgrades.speed,

            shield:
                upgrades.shield,

            fire:
                upgrades.fire

        })

    );

}


/* =========================================================
                    START
========================================================= */

function startGame() {

    running = true;

    paused = false;


    score = 0;

    wave = 1;

    kills = 0;

    combo = 1;

    comboTimer = 0;


    spawnTimer = 0;

    asteroidTimer = 2000;

    powerTimer = 2500;


    boss = null;


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
        canvas.height - 120;


    player.weapon = 1;


    player.invulnerable = 0;

    player.dashCooldown = 0;

    player.shieldCooldown = 0;

    player.shieldActive = false;


    changeWeapon(1);


    startScreen.classList.add(
        "hidden"
    );


    gameOverScreen.classList.add(
        "hidden"
    );


    pauseScreen.classList.add(
        "hidden"
    );


    bossUI.style.display =
        "none";


    sound(
        300,
        0.1
    );


    setTimeout(
        () =>
            sound(
                500,
                0.1
            ),
        100
    );


    setTimeout(
        () =>
            sound(
                800,
                0.2
            ),
        200
    );

}


/* =========================================================
                    GAME OVER
========================================================= */

function gameOver() {

    running = false;


    highScore =
        Math.max(
            highScore,
            Math.floor(score)
        );


    saveGame();


    document.getElementById(
        "finalScore"
    ).textContent =
        Math.floor(score);


    document.getElementById(
        "finalWave"
    ).textContent =
        wave;


    document.getElementById(
        "finalBest"
    ).textContent =
        highScore;


    gameOverScreen.classList.remove(
        "hidden"
    );


    sound(
        400,
        0.2,
        "sawtooth",
        0.06
    );


    setTimeout(
        () =>
            sound(
                200,
                0.4,
                "sawtooth",
                0.06
            ),
        200
    );

}


/* =========================================================
                    PAUSE
========================================================= */

function togglePause() {

    if (!running) {

        return;

    }


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

        lastTime =
            performance.now();

    }

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
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const type =
                        button.dataset.type;


                    const prices = {

                        health: 100,

                        damage: 150,

                        speed: 100,

                        shield: 200,

                        fire: 250

                    };


                    const price =
                        prices[type];


                    if (
                        coins < price
                    ) {

                        alert(
                            "You need more coins!"
                        );

                        return;

                    }


                    coins -=
                        price;


                    upgrades[type]++;


                    saveGame();


                    document.getElementById(
                        "shopCoins"
                    ).textContent =
                        coins;


                    applyUpgrades();

                }
            );

        }
    );


/* =========================================================
                    BUTTONS
========================================================= */

document
    .getElementById("startBtn")
    .onclick =
    startGame;


document
    .getElementById("restartBtn")
    .onclick =
    startGame;


document
    .getElementById("resumeBtn")
    .onclick =
    togglePause;


document
    .getElementById("quitBtn")
    .onclick =
    () => {

        running = false;

        paused = false;

        pauseScreen.classList.add(
            "hidden"
        );

        startScreen.classList.remove(
            "hidden"
        );

    };


document
    .getElementById("menuBtn")
    .onclick =
    () => {

        gameOverScreen.classList.add(
            "hidden"
        );

        startScreen.classList.remove(
            "hidden"
        );

    };


document
    .getElementById("openShopBtn")
    .onclick =
    openShop;


document
    .getElementById("closeShopBtn")
    .onclick =
    closeShop;


/* =========================================================
                    SOUND
========================================================= */

let audio =
    null;


function getAudio() {

    if (!audio) {

        audio =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    return audio;

}


function sound(
    frequency,
    duration,
    type = "sine",
    volume = 0.035
) {

    try {

        const ac =
            getAudio();


        const oscillator =
            ac.createOscillator();


        const gain =
            ac.createGain();


        oscillator.type =
            type;


        oscillator.frequency.value =
            frequency;


        gain.gain.value =
            volume;


        oscillator.connect(
            gain
        );


        gain.connect(
            ac.destination
        );


        oscillator.start();


        gain.gain.exponentialRampToValueAtTime(

            0.001,

            ac.currentTime +
            duration

        );


        oscillator.stop(

            ac.currentTime +
            duration

        );

    } catch {

        /* Audio not available */

    }

}


/* =========================================================
                    MAIN LOOP
========================================================= */

function loop(time) {

    requestAnimationFrame(
        loop
    );


    if (!running) {

        drawBackground();

        return;

    }


    if (paused) {

        return;

    }


    lastTime =
        time;


    updatePlayer();

    regenerateShield();

    updateBullets();

    updateEnemies();

    updateAsteroids();

    updatePowerups();

    updateBoss();

    updateParticles();

    collisions();

    updateSpawning();

    updateCombo();


    if (
        screenShake > 0
    ) {

        screenShake *=
            0.9;

    }


    ctx.save();


    if (
        screenShake > 0
    ) {

        ctx.translate(

            (
                Math.random() -
                0.5
            ) *
            screenShake,

            (
                Math.random() -
                0.5
            ) *
            screenShake

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

}


/* =========================================================
                    INITIALIZE
========================================================= */

applyUpgrades();

updateUI();

changeWeapon(1);

requestAnimationFrame(
    loop
);
