const SHEET_ID_EQUIPE = typeof SHEET_ID !== "undefined" ? SHEET_ID : "1wtpLYneJyQFe4-o90XLFzhWs2oXaWi6vhUMq55__d6o";

async function loadSheet(sheetName) {
    const url = `https://opensheet.elk.sh/${SHEET_ID_EQUIPE}/${sheetName}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(`Erreur lors du chargement de ${sheetName}:`, e);
        return [];
    }
}

async function loadSheet(sheetName) {
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${sheetName}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(`Erreur lors du chargement de ${sheetName}:`, e);
        return [];
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    const teamElement = document.getElementById("team-name");
    if (!teamElement || !teamElement.dataset.team) {
        // Si nous ne sommes pas sur une page d'équipe valide, on interrompt
        return;
    }

    const team = teamElement.dataset.team;

    // --- Lightbox pour l'image de l'équipe ---
    const teamPhoto = document.getElementById("team-photo");
    if (teamPhoto) {
        const lightbox = document.createElement("div");
        lightbox.id = "lightbox";
        lightbox.style.cssText = `
            display:none; position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.85); justify-content:center; align-items:center;
            z-index:9999; cursor:pointer;
        `;

        const lbImg = document.createElement("img");
        lbImg.style.cssText = "max-width:90%; max-height:90%; border-radius:10px;";
        lightbox.appendChild(lbImg);
        document.body.appendChild(lightbox);

        lightbox.addEventListener("click", () => {
            lightbox.style.display = "none";
        });

        teamPhoto.addEventListener("click", () => {
            lbImg.src = teamPhoto.src;
            lightbox.style.display = "flex";
        });
    }

    // --- Charger les joueurs ---
    const players = await loadSheet("joueurs");
    const teamPlayers = players.filter(p => p.equipe === team);

    const list = document.getElementById("players-list");
    if (list) {
        list.innerHTML = "";
        if (teamPlayers.length === 0) {
            list.innerHTML = "<li>Aucun joueur répertorié</li>";
        } else {
            teamPlayers.forEach(p => {
                list.innerHTML += `
                    <li>
                        <strong>${p.numero || "-"}</strong> — ${p.nom} (${p.poste || "N/C"})
                    </li>
                `;
            });
        }
    }

    // --- Charger les résultats ---
    const results = await loadSheet("resultats");

    let wins = 0;
    let losses = 0;

    results.forEach(r => {
        if (r.score && (r.equipe === team || r.adversaire === team)) {

            // Normalisation du score (accepte 3-0, 3/0, 3−0, 3 – 0, etc.)
            let scoreStr = r.score
                .replace(/[−–—]/g, "-")
                .replace("/", "-")
                .replace(":", "-")
                .replace(/\s+/g, "");

            const score = scoreStr.split("-").map(n => parseInt(n.trim(), 10));
            if (score.length === 2 && !isNaN(score[0]) && !isNaN(score[1])) {
                const s1 = score[0];
                const s2 = score[1];

                const teamIsLeft = (r.equipe === team);
                const us = teamIsLeft ? s1 : s2;
                const them = teamIsLeft ? s2 : s1;

                if (us > them) wins++;
                else losses++;
            }
        }
    });

    const matches = wins + losses;
    const winrate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

    const matchesEl = document.getElementById("matches");
    const winrateEl = document.getElementById("winrate");
    const winsEl = document.getElementById("wins");
    const lossesEl = document.getElementById("losses");
    const coachEl = document.getElementById("coach");

    if (matchesEl) matchesEl.textContent = matches;
    if (winrateEl) winrateEl.textContent = winrate + "%";
    if (winsEl) winsEl.textContent = wins;
    if (lossesEl) lossesEl.textContent = losses;

    if (coachEl) {
        const coach = (teamPlayers.length > 0 && teamPlayers[0].coach) ? teamPlayers[0].coach : "Non renseigné";
        coachEl.textContent = coach;
    }
});
