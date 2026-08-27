const SHEET_ID = "1wtpLYneJyQFe4-o90XLFzhWs2oXaWi6vhUMq55__d6o";

async function loadSheet(sheetName) {
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${sheetName}`;
    const res = await fetch(url);
    return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {

    // --- Lightbox pour l'image de l'équipe ---
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

    document.getElementById("team-photo").addEventListener("click", () => {
        lbImg.src = document.getElementById("team-photo").src;
        lightbox.style.display = "flex";
    });

    const team = document.getElementById("team-name").dataset.team;

    // --- Charger les joueurs ---
    const players = await loadSheet("joueurs");
    const teamPlayers = players.filter(p => p.equipe === team);

    const list = document.getElementById("players-list");
    teamPlayers.forEach(p => {
        list.innerHTML += `
            <li>
                <strong>${p.numero}</strong> — ${p.nom} (${p.poste})
            </li>
        `;
    });

    // --- Charger les résultats ---
    const results = await loadSheet("resultats");

    let wins = 0;
    let losses = 0;

    results.forEach(r => {
        if (r.equipe === team || r.adversaire === team) {

            // Normalisation du score (accepte 3-0, 3/0, 3−0, 3 – 0, etc.)
            let scoreStr = r.score
                .replace(/[−–—]/g, "-")  // tous les tirets typographiques
                .replace("/", "-")
                .replace(":", "-")
                .replace(/\s+/g, "");

            const score = scoreStr.split("-").map(n => parseInt(n.trim()));
            const s1 = score[0];
            const s2 = score[1];

            // Détection automatique du côté de l'équipe
            const teamIsLeft = (r.equipe === team);

            const us = teamIsLeft ? s1 : s2;
            const them = teamIsLeft ? s2 : s1;

            if (us > them) wins++;
            else losses++;
        }
    });

    const matches = wins + losses;
    const winrate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

    document.getElementById("matches").textContent = matches;
    document.getElementById("winrate").textContent = winrate + "%";

    document.getElementById("wins").textContent = wins;
    document.getElementById("losses").textContent = losses;

    // --- Coach ---
    const coach = teamPlayers.length > 0 ? teamPlayers[0].coach : "Non renseigné";
    document.getElementById("coach").textContent = coach;
});
