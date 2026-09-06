/* =========================================================
   SPACE SHOOT - PLAYER SESSION + GLOBAL LEADERBOARD
   Uses Supabase anonymous authentication.
========================================================= */

(() => {
    const cfg = window.SPACE_SHOOT_CONFIG || {};
    const configured =
        cfg.supabaseUrl &&
        cfg.supabaseAnonKey &&
        !cfg.supabaseUrl.includes("YOUR_") &&
        !cfg.supabaseAnonKey.includes("YOUR_");

    const playerIdEl = document.getElementById("playerId");
    const playerNameEl = document.getElementById("playerName");
    const leaderboardList = document.getElementById("leaderboardList");
    const leaderboardStatus = document.getElementById("leaderboardStatus");
    const leaderboardScreen = document.getElementById("leaderboardScreen");

    const localKey = "GalaxyStrikePlayer";
    let player = JSON.parse(localStorage.getItem(localKey) || "null");
    let supabase = null;
    let lastSubmittedScore = -1;

    function makeLocalPlayer() {
        const id = "PILOT-" + crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
        player = { id, name: "Pilot" };
        localStorage.setItem(localKey, JSON.stringify(player));
    }

    if (!player) makeLocalPlayer();

    function showPlayer() {
        if (playerIdEl) playerIdEl.textContent = player.id;
        if (playerNameEl) playerNameEl.value = player.name || "Pilot";
    }

    function status(message, error = false) {
        if (!leaderboardStatus) return;
        leaderboardStatus.textContent = message;
        leaderboardStatus.dataset.error = error ? "true" : "false";
    }

    function saveName() {
        const clean = (playerNameEl?.value || "Pilot")
            .replace(/[^a-zA-Z0-9 _-]/g, "")
            .trim()
            .slice(0, 18) || "Pilot";
        player.name = clean;
        localStorage.setItem(localKey, JSON.stringify(player));
        if (playerNameEl) playerNameEl.value = clean;
        return clean;
    }

    async function initCloud() {
        if (!configured) {
            status("Leaderboard setup needed — your Player ID is saved locally.");
            return;
        }

        try {
            supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (!data.session) {
                const result = await supabase.auth.signInAnonymously();
                if (result.error) throw result.error;
                player.id = result.data.user.id;
                localStorage.setItem(localKey, JSON.stringify(player));
            } else {
                player.id = data.session.user.id;
                localStorage.setItem(localKey, JSON.stringify(player));
            }

            showPlayer();
            status("Online • global scores enabled");
            loadLeaderboard();
        } catch (error) {
            console.error("Leaderboard auth error:", error);
            status("Offline leaderboard — check Supabase setup.", true);
        }
    }

    async function loadLeaderboard() {
        if (!supabase || !leaderboardList) return;

        leaderboardList.innerHTML = "<div class='leaderboardLoading'>Loading global scores…</div>";

        const { data, error } = await supabase
            .from("space_shoot_leaderboard")
            .select("player_id, player_name, best_score")
            .order("best_score", { ascending: false })
            .limit(10);

        if (error) {
            console.error(error);
            leaderboardList.innerHTML = "<div class='leaderboardLoading'>Could not load scores.</div>";
            return;
        }

        if (!data.length) {
            leaderboardList.innerHTML = "<div class='leaderboardLoading'>No scores yet. Be the first! 🚀</div>";
            return;
        }

        leaderboardList.innerHTML = data.map((row, index) => {
            const medal = ["🥇", "🥈", "🥉"][index] || `#${index + 1}`;
            const mine = row.player_id === player.id ? " mine" : "";
            return `<div class="leaderboardRow${mine}">
                <span class="rank">${medal}</span>
                <span class="pilot">${escapeHtml(row.player_name)}</span>
                <strong>${Number(row.best_score).toLocaleString()}</strong>
            </div>`;
        }).join("");
    }

    async function submitScore(score) {
        score = Math.floor(Number(score) || 0);
        if (!supabase || score <= 0 || score === lastSubmittedScore) return;
        lastSubmittedScore = score;

        const name = saveName();
        const { error } = await supabase.rpc("submit_space_shoot_score", {
            p_player_name: name,
            p_score: score
        });

        if (error) {
            console.error("Score submission error:", error);
            status("Score could not be submitted.", true);
            return;
        }

        status("Score submitted to the global leaderboard! 🏆");
        loadLeaderboard();
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
        }[char]));
    }

    window.SpaceShootLeaderboard = {
        submitScore,
        loadLeaderboard,
        getPlayer: () => ({ ...player }),
        saveName
    };

    document.getElementById("savePlayerBtn")?.addEventListener("click", () => {
        saveName();
        status("Player profile saved.");
    });

    document.getElementById("leaderboardBtn")?.addEventListener("click", () => {
        leaderboardScreen?.classList.remove("hidden");
        loadLeaderboard();
    });

    document.getElementById("closeLeaderboardBtn")?.addEventListener("click", () => {
        leaderboardScreen?.classList.add("hidden");
    });

    // Detect the existing game's Game Over screen without changing its game loop.
    const observer = new MutationObserver(() => {
        if (!document.getElementById("gameOver")?.classList.contains("hidden")) {
            const score = Number(document.getElementById("finalScore")?.textContent || 0);
            if (score > 0) submitScore(score);
        }
    });

    observer.observe(document.getElementById("gameOver"), { attributes: true, attributeFilter: ["class"] });

    showPlayer();
    initCloud();
})();
