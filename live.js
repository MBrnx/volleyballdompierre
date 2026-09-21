/**
 * live.js — Dynamic score fetching & YouTube live streams
 * Volleyball Dompierre-sur-Helpe
 */

// 1. DÉFINITION DES ÉQUIPES ET DÉDUCTIONS DES CLÉS WORKER
const CHANNELS = [
    { id: "UC5s-uZuZifwvuuVujHY6ePQ", name: "Sénior A",           key: "senior-a", url: "https://www.youtube.com/@VolleyBallDompierresurHelpeA" },
    { id: "UC2ZTwbLwwcxfIThKBoJGc7g", name: "Sénior B",           key: "senior-b", url: "https://www.youtube.com/@VolleyBallDompierresurHelpeB" },
    { id: "UCRk46QoaBZQPx38D1YX5UVA", name: "Sénior C",           key: "senior-c", url: "https://www.youtube.com/@VolleyBallDompierresurHelpeC" },
    { id: "UCYG_J9PXD-oR5vzEMb8SW6g", name: "Sénior D",           key: "senior-d", url: "https://www.youtube.com/@VolleyBallDompierresurHelpeD" },
    { id: "UCfSWqmK7M_fRx67tOPLq7XQ", name: "Sénior Féminines A", key: "femmes-a", url: "https://www.youtube.com/@VolleyBallDompierresurHelpeFeA" },
    { id: "UCYj7-P4c4AvRp4p0WgSmuhA", name: "Sénior Féminines B", key: "femmes-b", url: "https://www.youtube.com/@VolleyBallDompierresurHelpeFeB" }
];

/*// Flux de secours (Lives de test 24/24)
const FALLBACK_TEST_LIVES = [
    { videoId: "a47ckXKZjxI", channelId: "UC5s-uZuZifwvuuVujHY6ePQ" }, // Sénior A
    { videoId: "NiRIbKwAejk", channelId: "UCfSWqmK7M_fRx67tOPLq7XQ" }  // Sénior Féminines A
];*/

const WORKER_URL = "https://ytb-vbd.wild-rice-d0a1.workers.dev";

// Variables globales (AUCUNE ÉQUIPE SÉLECTIONNÉE PAR DÉFAUT)
let currentVideoId = null;
let currentMatchKey = null; 

// 2. UTILITAIRES
function embedUrl(videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&enablejsapi=1&fs=0`;
}

// 3. GÉNÉRATION DE LA GRILLE DES CHAÎNES
function buildChannelLinks() {
    const grid = document.getElementById("channels-grid");
    if (!grid) return;

    grid.innerHTML = "";
    CHANNELS.forEach(ch => {
        const a = document.createElement("a");
        a.href = ch.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.className = "channel-link";
        a.innerHTML = `
            <svg class="yt-icon" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z" fill="#FF0000"/>
                <path d="M9.7 15.5l6.3-3.5-6.3-3.5v7z" fill="#fff"/>
            </svg>
            ${ch.name}
        `;
        grid.appendChild(a);
    });
}

// 4. CHARGEMENT ET BASCULEMENT DE FLUX EN DIRECT
function loadMain(videoId, teamName, channelId) {
    currentVideoId = videoId;

    // Résolution précise de la clé KV
    const foundChannel = CHANNELS.find(c => c.id === channelId);
    if (foundChannel) {
        currentMatchKey = foundChannel.key;
    } else {
        const matchByName = CHANNELS.find(c => c.name.toLowerCase() === teamName.toLowerCase());
        currentMatchKey = matchByName ? matchByName.key : null;
    }

    const mainPlayer = document.getElementById("main-player");
    const mainTeamName = document.getElementById("main-team-name");

    if (mainPlayer) {
        mainPlayer.src = embedUrl(videoId);
    }
    if (mainTeamName) {
        mainTeamName.textContent = teamName;
    }

    // Mise à jour visuelle des vignettes
    document.querySelectorAll(".thumb-card").forEach(card => {
        card.classList.toggle("active", card.dataset.videoId === videoId);
    });

    // Interrogation immédiate du Worker si une clé est valide
    if (currentMatchKey) {
        fetchLiveScore();
    }
}

// 5. AFFICHAGE DES VIGNETTES MULTI-LIVES
function buildThumbs(lives) {
    const container = document.getElementById("thumbs-container");
    if (!container) return;

    container.innerHTML = "";

    lives.forEach(live => {
        const card = document.createElement("div");
        card.className = "thumb-card" + (live.videoId === currentVideoId ? " active" : "");
        card.dataset.videoId = live.videoId;

        const defaultThumb = `https://img.youtube.com/vi/${live.videoId}/hqdefault.jpg`;
        const svgFallback = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90'><rect width='100%' height='100%' fill='%23222'/><text x='50%' y='50%' fill='%23fff' font-size='12' text-anchor='middle' dy='.3em'>LIVE VBD</text></svg>";

        card.innerHTML = `
            <div class="thumb-img-wrap">
                <img src="${defaultThumb}" onerror="this.onerror=null; this.src='${svgFallback}';" alt="Live ${live.teamName}" loading="lazy">
                <div class="thumb-play-icon">▶</div>
                <div class="thumb-en-cours">EN COURS</div>
            </div>
            <div class="thumb-label" style="padding: 6px; font-size: 0.85rem; text-align: center;">
                <span>${live.teamName}</span>
            </div>
        `;

        card.addEventListener("click", () => loadMain(live.videoId, live.teamName, live.channelId));
        container.appendChild(card);
    });
}

// 6. INTERROGATION DU WORKER (DETECTION DES FLUX)
async function checkAllLives() {
    try {
        const res = await fetch(WORKER_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const rawLives = data.lives || [];

        // Traitement direct des vrais lives remontés par le Worker
        return rawLives.map(live => {
            const channelMatch = CHANNELS.find(c => c.id === live.channelId);
            return {
                videoId: live.videoId,
                channelId: live.channelId,
                teamName: channelMatch ? channelMatch.name : (live.channelName || "Équipe Dompierre")
            };
        });

    } catch (e) {
        console.warn("Aucun live détecté ou Worker indisponible.", e);
        // On retourne un tableau vide en production
        return [];
    }
}

// 7. GESTION DU OVERLAY SCORE SÉCURISÉ
function updateOverlay(data) {
    if (!data || typeof data !== 'object') return;

    const scoreHomeEl = document.getElementById("score-home");
    const scoreAwayEl = document.getElementById("score-away");
    const awayNameEl  = document.getElementById("away-name");
    const setInfoEl   = document.getElementById("set-info");
    const setsScoreEl = document.getElementById("sets-score");

    if (scoreHomeEl && Number.isInteger(data.homeScore)) {
        scoreHomeEl.textContent = data.homeScore;
    }
    if (scoreAwayEl && Number.isInteger(data.awayScore)) {
        scoreAwayEl.textContent = data.awayScore;
    }
    if (awayNameEl && data.awayName) {
        awayNameEl.textContent = data.awayName;
    }
    if (setInfoEl && data.currentSet !== undefined) {
        setInfoEl.textContent = `Set ${data.currentSet}`;
    }
    if (setsScoreEl && data.setsSummary) {
        setsScoreEl.textContent = `(${data.setsSummary})`;
    }
}

async function fetchLiveScore() {
    if (!currentMatchKey) return; // Bloque toute requête infondée

    try {
        const response = await fetch(`${WORKER_URL}/score?match=${currentMatchKey}`);
        if (!response.ok) return;

        const data = await response.json();
        updateOverlay(data);
    } catch (error) {
        // Silencieux pour préserver la vidéo
    }
}

// 8. INITIALISATION GLOBALE DU MODULE
async function initLiveModule() {
    buildChannelLinks();

    const videoContainer = document.getElementById("video-container");
    const fullscreenBtn  = document.getElementById("fullscreen-btn");

    if (fullscreenBtn && videoContainer) {
        fullscreenBtn.addEventListener("click", () => {
            if (!document.fullscreenElement) {
                if (videoContainer.requestFullscreen) videoContainer.requestFullscreen();
                else if (videoContainer.webkitRequestFullscreen) videoContainer.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        });
    }

    const lives = await checkAllLives();

    const loader = document.getElementById("live-loading");
    if (loader) loader.style.display = "none";

    if (lives.length === 0) {
        const noLiveSec = document.getElementById("no-live-section");
        if (noLiveSec) noLiveSec.style.display = "block";
        return;
    }

    const liveSec = document.getElementById("live-section");
    if (liveSec) liveSec.style.display = "block";

    const countLabel = document.getElementById("live-count-label");
    if (countLabel) {
        countLabel.textContent = lives.length === 1
            ? "1 équipe en direct"
            : `${lives.length} équipes en direct simultanément`;
    }

    // Chargement dynamique (définit la vraie clé d'équipe)
    loadMain(lives[0].videoId, lives[0].teamName, lives[0].channelId);

    if (lives.length > 1) {
        buildThumbs(lives);
        const thumbsContainer = document.getElementById("thumbs-container");
        if (thumbsContainer) thumbsContainer.style.display = "flex";
    }

    // Boucle automatique de rafraîchissement
    setInterval(fetchLiveScore, 3000);
}

// Démarrage sécurisé
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiveModule);
} else {
    initLiveModule();
}
