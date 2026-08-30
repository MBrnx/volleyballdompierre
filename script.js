// --- Google Sheets ---
const SHEET_ID = "1wtpLYneJyQFe4-o90XLFzhWs2oXaWi6vhUMq55__d6o"; // ID de la feuille Google Sheets
const PAGE_ID = ""; 
const ACCESS_TOKEN = "";

document.addEventListener("DOMContentLoaded", () => {

    // --- Navbar ---
    fetch("navbar.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("navbar-placeholder").innerHTML = data;

        const navbarCollapse = document.getElementById("navbarNav");
        const navbarToggler = document.querySelector(".navbar-toggler");
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navbarCollapse, { toggle: false });

        document.addEventListener("click", (e) => {
        if (!navbarCollapse.contains(e.target) && !navbarToggler.contains(e.target)) {
            if (navbarCollapse.classList.contains("show")) bsCollapse.hide();
        }
        });

        navbarCollapse.addEventListener("hidden.bs.collapse", () => {
        navbarCollapse.classList.remove("closing");
        });

        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach(link => {
        if (link.href === window.location.href) link.classList.add("active");
        });

        requestAnimationFrame(() => window.scrollTo(0, 0));
    })
    .catch(error => console.error("Erreur de chargement de la navbar:", error));

    // --- Footer ---
    fetch("footer.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("footer-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Erreur de chargement du footer:", error));

    // --- Back to top ---
    const backToTopButton = document.getElementById("back-to-top");
    const circle = document.querySelector(".progress-ring__circle");

    if (circle) {
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    window.addEventListener("scroll", () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = scrollTop / scrollHeight;
        const offset = circumference - scrollPercent * circumference;

        circle.style.strokeDashoffset = offset;
        backToTopButton.style.display = scrollTop > 100 ? "flex" : "none";
    });

    backToTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
    }

    // --- Scrollspy ---
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY + 200;

    document.querySelectorAll("section").forEach(section => {
        if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
            navLinks.forEach(link => link.classList.remove("active"));
            const activeLink = document.querySelector(`a[href="#${section.id}"]`);
            if (activeLink) activeLink.classList.add("active");
        }
    });
    });

    // --- ACTUS LOCALES ---
    const actusList = document.getElementById("actus-list");
    const form = document.getElementById("add-actu-form");

    // --- Pagination ---
    const NB_PAR_PAGE = 5;
    let actusData = [];
    let nbVisible = NB_PAR_PAGE;

    // --- Lightbox ---
    const lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.style.cssText = `
        display:none; position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.85); justify-content:center; align-items:center;
        z-index:9999; cursor:pointer;
    `;

    document.querySelectorAll(".team-link").forEach(link => {
        link.style.cursor = "pointer";

        link.addEventListener("click", () => {
            const team = link.dataset.team;
            window.location.href = `equipes/${team}.html`;
        });
    });

    const lbImg = document.createElement("img");
    lbImg.id = "lightbox-img";
    lbImg.style.cssText = "max-width:90%; max-height:90%; border-radius:10px;";

    lightbox.appendChild(lbImg);
    document.body.appendChild(lightbox);

    lightbox.addEventListener("click", () => {
        lightbox.style.display = "none";
    });

    function enableLightbox(img) {
        img.style.cursor = "pointer";

        img.addEventListener("click", () => {

            const isFull = img.dataset.full === "true";

            if (isFull) {
                // Mode plein écran
                lbImg.src = img.src;
                lbImg.style.maxWidth = "100%";
                lbImg.style.maxHeight = "100%";
                lightbox.style.background = "rgba(0,0,0,0.95)";
                lightbox.style.display = "flex";
            } else {
                // Lightbox normale
                lbImg.src = img.src;
                lbImg.style.maxWidth = "90%";
                lbImg.style.maxHeight = "90%";
                lightbox.style.background = "rgba(0,0,0,0.85)";
                lightbox.style.display = "flex";
            }
        });
    }

    function parseImages(imageField) {
        if (!imageField) return [];

        // 1) On sépare les images (une par ligne, ou séparées par virgule)
        const rawImages = imageField
            .split(/[,;\n\r]+/) // séparateurs autorisés
            .map(i => i.trim())
            .filter(i => i.length > 0);

        // 2) On analyse chaque image individuellement
        return rawImages.map(i => {
            // On sépare l’URL et le tag éventuel
            const parts = i.split("|").map(p => p.trim());

            return {
                url: parts[0],            // l’URL propre
                full: parts[1] === "full" // tag détecté
            };
        });
    }

    // --- Chargement des actus ---
    async function loadActus() {
        if (!actusList) return;

        const data = await loadData("actualites");

        data.sort((a, b) => {
            const da = new Date(a.date.split("/").reverse().join("-"));
            const db = new Date(b.date.split("/").reverse().join("-"));
            return db - da;
        });

        actusData = data;
        nbVisible = NB_PAR_PAGE;

        afficherActus();
        updateLoadMoreButton(); 
    }

    function afficherActus() {
        if (!actusList) return;

        actusList.innerHTML = "";

        actusData.slice(0, nbVisible).forEach(a => {
            createActuCard(a.author, a.content, a.image, a.date);
        });
    }

    const btnLoadMore = document.getElementById("load-more");
    const actusInfo = document.getElementById("actus-info");

    function updateLoadMoreButton() {
        if (!btnLoadMore || !actusInfo) return;

        const reste = actusData.length - nbVisible;

        if (reste <= 0) {
            btnLoadMore.style.display = "none";
            actusInfo.textContent = "Tu as vu toutes les actualités 🎉";
            return;
        }

        const prochain = Math.min(NB_PAR_PAGE, reste);

        btnLoadMore.textContent = 
            reste > NB_PAR_PAGE
            ? `Afficher ${prochain} actus supplémentaires (${reste} restantes)`
            : `Afficher les ${reste} dernières actus`;

        btnLoadMore.style.display = "inline-block";

        actusInfo.textContent = `${nbVisible} actus affichées sur ${actusData.length}`;
    }

    if (btnLoadMore) {
        btnLoadMore.addEventListener("click", () => {
            nbVisible += NB_PAR_PAGE;
            afficherActus();
            updateLoadMoreButton();
        });
    }

    function parseFrenchDate(str) {
        if (!str) return new Date();

        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str);

        if (str.includes("/")) {
            const [day, month, year] = str.split("/");
            return new Date(`${year}-${month}-${day}`);
        }

        return new Date(str);
    }

    function makeLinksClickable(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, url => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    }

    function createActuCard(author, content, image = null, date = null) {
        if (!actusList) return;

        const card = document.createElement("div");
        card.classList.add("card", "card-actu", "p-3", "mb-3");

        const dateObj = parseFrenchDate(date);
        const dateStr = dateObj.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const images = parseImages(image);
        let imagesHTML = "";

        for (const img of images) {
            imagesHTML += `
                <div class="actu-image-wrapper">
                    <img src="${img.url}" data-full="${img.full}" class="actu-image img-fluid rounded" style="max-width:180px;">
                </div>
            `;
        }

        // --- 1 seule image ---
        if (images.length === 1) {
            const hasText = content && content.trim().length > 0;

            if (hasText) {
                // Texte à gauche, image à droite
                card.innerHTML = `
                    <div class="actu-row d-flex flex-column flex-md-row align-items-stretch gap-3">
                        <div class="actu-texte flex-grow-1 single-image-text">
                            <div class="mb-2">
                                <strong>${author}</strong>
                                <small class="text-muted">${dateStr}</small>
                            </div>
                            <p>${makeLinksClickable(content)}</p>
                        </div>
                        <div class="actu-image-single">
                            <img src="${images[0].url}" data-full="${images[0].full}" class="actu-img-fill">
                        </div>
                    </div>
                `;
            } else {
                // Pas de texte → image centrée, plus grande
                card.innerHTML = `
                    <div class="text-center">
                        <div class="mb-2">
                            <strong>${author}</strong>
                            <small class="text-muted">${dateStr}</small>
                        </div>
                        <img src="${images[0].url}" data-full="${images[0].full}"
                            class="img-fluid rounded"
                            style="max-height: 500px; width: auto; max-width: 100%; cursor: pointer;">
                    </div>
                `;
            }
        }

        // --- Plusieurs images → sous le texte, en ligne
        else {
            card.innerHTML = `
                <div class="actu-row d-flex flex-column gap-3">
                    <div class="actu-texte">
                        <div class="mb-2">
                            <strong>${author}</strong>
                            <small class="text-muted">${dateStr}</small>
                        </div>
                        <p>${makeLinksClickable(content)}</p>
                    </div>

                    <div class="actu-images d-flex flex-wrap gap-2">
                        ${imagesHTML}
                    </div>
                </div>
            `;
        }

        actusList.append(card);

        // Lightbox sur toutes les images
        card.querySelectorAll("img").forEach(img => enableLightbox(img));
    }



    loadActus();

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            alert("L’ajout d’actus est désactivé.");
        });
    }

    // --- Sections ---
    function showSection(sectionId, btn) {
        // Masquer toutes les sections
        document.querySelectorAll('.section-content').forEach(sec => sec.style.display = 'none');
        document.getElementById(sectionId).style.display = 'block';

        // Mettre à jour le style des boutons principaux
        document.querySelectorAll('main button[data-section]').forEach(b => {
            b.classList.remove('btn-success');
            b.classList.add('btn-outline-success');
        });

        btn.classList.remove('btn-outline-success');
        btn.classList.add('btn-success');

        // Gestion du bouton Filtres
        const btnFiltres = document.getElementById("btn-filtres");

        if (sectionId === "evenements") {
            // Pas de filtres sur Événements
            if (btnFiltres) btnFiltres.style.display = "none";
        }
        else if (sectionId === "classement") {
            // Pas de filtres sur Classement
            if (btnFiltres) btnFiltres.style.display = "none";

            // Charger le classement Excellence par défaut
            loadClassement("Classement_Avesnois");

            // Activer le bon bouton interne
            document.querySelectorAll("#classement-tabs button").forEach(b => {
                b.classList.remove("btn-success");
                b.classList.add("btn-outline-success");
            });

            const defaultBtn = document.querySelector('#classement-tabs button[data-classement="Classement_Avesnois"]');
            if (defaultBtn) {
                defaultBtn.classList.remove("btn-outline-success");
                defaultBtn.classList.add("btn-success");
            }
        }
        else {
            // Pour toutes les autres sections : filtres visibles
            if (btnFiltres) btnFiltres.style.display = "inline-block";
        }
                // Pour toutes les sections qui utilisent les filtres (avenir + resultats)
        if (sectionId === "avenir" || sectionId === "resultats") {

            // Décocher toutes les équipes
            document.querySelectorAll(".filter-equipe").forEach(cb => {
                cb.checked = false;
            });

            // Remettre le lieu sur "tous"
            const lieuTous = document.querySelector('input[name="filter-lieu"][value="tous"]');
            if (lieuTous) lieuTous.checked = true;

            // Recharger les données
            loadMatchsAvenir();
            loadResultats();
        }
    }

    document.querySelectorAll('main button[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-section');
        showSection(section, btn);
    });
    });

    // --- Google Sheets ---
    async function loadData(sheetName) {
        const url = `https://opensheet.elk.sh/${SHEET_ID}/${sheetName}`;
        const response = await fetch(url);
        return await response.json();
    }

    // --- Matchs à venir ---
    async function loadMatchsAvenir() {
    const container = document.querySelector("#avenir .list-group");
    if (!container) return;

    const data = await loadData("matchs_avenir");
    const filters = getFilters();

    data.sort((a, b) => {
        const da = new Date(a.date.split("/").reverse().join("-"));
        const db = new Date(b.date.split("/").reverse().join("-"));
        return da - db;
    });

    container.innerHTML = "";

    const filtered = data.filter(row => {
        const lieuMatch = row.lieu ? row.lieu.toLowerCase() : "";
        const domExt = lieuMatch.includes("dompierre") ? "domicile" : "extérieur";

        if (!filters.equipes.some(eq =>
            row.equipe.trim().toLowerCase() === eq.trim().toLowerCase() ||
            row.adversaire.trim().toLowerCase() === eq.trim().toLowerCase()
        )) return false;


        if (filters.lieu !== "tous" && filters.lieu !== domExt) return false;

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
        <div class="bg-light p-3 mt-3 border rounded text-center text-muted">
            Aucun match à venir
        </div>`;
        return;
    }

    let currentDate = "";

    filtered.forEach(row => {
        const lieuMatch = row.lieu ? row.lieu.toLowerCase() : "";
        const domExt = lieuMatch.includes("dompierre") ? "domicile" : "extérieur";

        if (row.date !== currentDate) {
        currentDate = row.date;

        container.innerHTML += `
            <div class="day-separator mt-4 mb-2">
            <div class="day-line"></div>
            <h5 class="day-title text-primary">${currentDate}</h5>
            <div class="day-line"></div>
            </div>`;
        }

        container.innerHTML += `
        <div class="match-card border rounded p-3 mb-2">
            <h6 class="mb-1">${row.equipe} – ${row.adversaire}</h6>
            <p class="mb-1 text-muted">
            ${row.heure} — <em>${row.matchs || ""}</em> — ${domExt}
            </p>
            <small class="text-secondary">${row.lieu}</small>
        </div>`;
    });
    }

    // --- Résultats ---
    async function loadResultats() {
    const container = document.querySelector("#resultats .list-group");
    if (!container) return; // 🔥 Correction

    const data = await loadData("resultats");
    const filters = getFilters();

    data.sort((a, b) => {
        const da = new Date(a.date.split("/").reverse().join("-"));
        const db = new Date(b.date.split("/").reverse().join("-"));
        return db - da;
    });

    container.innerHTML = "";

    const filtered = data.filter(row => {
        const lieuMatch = row.lieu ? row.lieu.toLowerCase() : "";
        const domExt = lieuMatch.includes("dompierre") ? "domicile" : "extérieur";

        if (!filters.equipes.some(eq =>
        row.equipe.toLowerCase().includes(eq.toLowerCase()) ||
        row.adversaire.toLowerCase().includes(eq.toLowerCase())
        )) return false;

        if (filters.lieu !== "tous" && filters.lieu !== domExt) return false;

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
        <li class="list-group-item text-center text-muted">
            Aucun résultat disponible
        </li>`;
        return;
    }

    let currentDate = "";

    filtered.forEach(row => {
        const lieuMatch = row.lieu ? row.lieu.toLowerCase() : "";
        const domExt = lieuMatch.includes("dompierre") ? "domicile" : "extérieur";

        if (row.date !== currentDate) {
        currentDate = row.date;
        container.innerHTML += `
            <div class="bg-light p-2 mt-3 border rounded">
            <strong>${currentDate}</strong>
            </div>`;
        }

        container.innerHTML += `
        <div class="list-group-item">
            <h5>${row.equipe} ${row.score} ${row.adversaire}</h5>
            <p>${row.resume || ""}</p>
            <small class="text-muted">${domExt}</small>
        </div>`;
    });
    }

    // --- Événements ---
    async function loadEvenements() {
    const container = document.querySelector("#evenements .list-group");
    if (!container) return; // 🔥 Correction

    const data = await loadData("evenements");

    data.sort((a, b) => {
        const da = new Date(a.date.split("/").reverse().join("-"));
        const db = new Date(b.date.split("/").reverse().join("-"));
        return da - db;
    });

    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = `
        <li class="list-group-item text-center text-muted">
            Aucun événement prévu
        </li>`;
        return;
    }

    let currentDate = "";

    data.forEach(row => {
        if (row.date !== currentDate) {
        currentDate = row.date;
        container.innerHTML += `
            <div class="bg-light p-2 mt-3 border rounded">
            <strong>${currentDate}</strong>
            </div>`;
        }

        container.innerHTML += `
        <li class="list-group-item">
            <strong>${row.titre}</strong><br>
            <div class="event-description">
                ${makeLinksClickable(row.description).replace(/\n/g, '<br>')}
            </div>
        </li>`;
    });
    }

    // --- Classement ---
    async function loadClassement(sheetName) {
        const container = document.querySelector("#classement .list-group");
        if (!container) return;

        let data;
        try {
            data = await loadData(sheetName);
        } catch (e) {
            container.innerHTML = `
                <li class="list-group-item text-center text-danger">
                    Pas de données disponibles pour le moment
                </li>`;
            return;
        }

        if (!Array.isArray(data)) {
            container.innerHTML = `
                <li class="list-group-item text-center text-danger">
                    Pas de données disponibles pour le moment
                </li>`;
            return;
        }

        container.innerHTML = "";

        data.sort((a, b) => Number(a.Rang) - Number(b.Rang));

        data.forEach(row => {
            container.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${row.Rang}. ${row.Equipe}</strong><br>
                        <small class="text-muted">
                            ${row.MJ} MJ — ${row.MG} MG — ${row.MP} MP — ${row.MB} MB
                        </small>
                    </div>
                    <span class="badge bg-primary rounded-pill">${row.Pts} pts</span>
                </li>
            `;
        });
    }


    document.querySelectorAll("#classement-tabs button").forEach(btn => {
        btn.addEventListener("click", () => {
            const sheet = btn.getAttribute("data-classement");

            // Style des boutons
            document.querySelectorAll("#classement-tabs button").forEach(b => {
                b.classList.remove("btn-success");
                b.classList.add("btn-outline-success");
            });

            btn.classList.remove("btn-outline-success");
            btn.classList.add("btn-success");

            loadClassement(sheet);
        });
    });



    // --- Filtres ---
    function getFilters() {
        const equipeCheckboxes = document.querySelectorAll(".filter-equipe");

        let selectedEquipes = Array.from(equipeCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Si aucune équipe n'est cochée → toutes les équipes sont sélectionnées
        if (selectedEquipes.length === 0) {
            selectedEquipes = Array.from(equipeCheckboxes).map(cb => cb.value);
        }

        const lieuRadio = document.querySelector(".filter-lieu:checked");
        const lieu = lieuRadio ? lieuRadio.value : "tous";

        return { equipes: selectedEquipes, lieu };
    }

    document.querySelectorAll(".filter-equipe, .filter-lieu").forEach(input => {
        input.addEventListener("change", () => {
            loadMatchsAvenir();
            loadResultats();
        });
    });

    // --- Bouton filtres ---
    const btnFiltres = document.getElementById("btn-filtres");
    const zoneFiltres = document.getElementById("zone-filtres");

    if (btnFiltres && zoneFiltres) {
    btnFiltres.addEventListener("click", () => {
        const visible = zoneFiltres.style.display === "block";
        zoneFiltres.style.display = visible ? "none" : "block";
    });
    }

    // --- Reset filtres ---
    const resetFiltres = document.getElementById("reset-filtres");
    if (resetFiltres) {
    resetFiltres.addEventListener("click", () => {
        document.querySelectorAll(".filter-equipe").forEach(cb => {
        cb.checked = true;
        cb.dispatchEvent(new Event("change"));
        });

        const lieuTous = document.getElementById("lieuTous");
        if (lieuTous) {
        lieuTous.checked = true;
        lieuTous.dispatchEvent(new Event("change"));
        }
    });
    }

    // --- Chargement initial ---
    loadMatchsAvenir();
    loadResultats();
    loadEvenements();
    loadClassement("Classement_Avesnois");

    // --- Image cards ---
    document.querySelectorAll(".card-img-top").forEach(img => {

        // Ignore les images vides
        if (!img.src || img.src.trim() === "") return;

        img.style.cursor = "pointer";
        img.setAttribute("data-bs-toggle", "modal");
        img.setAttribute("data-bs-target", "#imageModal");

        img.addEventListener("click", () => {
            document.getElementById('modalImage').src = img.src;
        });
    });

    // --- Reset filtres au premier chargement ---
    window.addEventListener("DOMContentLoaded", () => {

        // Décocher toutes les équipes
        document.querySelectorAll(".filter-equipe").forEach(cb => {
            cb.checked = false;
        });

        // Lieu = tous
        const lieuTous = document.querySelector('input[name="filter-lieu"][value="tous"]');
        if (lieuTous) lieuTous.checked = true;

        // Charger les données
        loadMatchsAvenir();
        loadResultats();
    });

    function changeMainLive(channelId) {
        document.getElementById("mainLivePlayer").src =
            "https://www.youtube.com/embed/live_stream?channel=" + channelId;
    }

    /* // --- DARK MODE ---

    // Bouton dans la navbar
    const toggleDark = document.getElementById("toggle-dark");

    // Appliquer le mode sombre si l'utilisateur l'avait activé
    if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    }

    // Activer automatiquement si le système est en mode sombre
    if (window.matchMedia("(prefers-color-scheme: dark)").matches &&
        localStorage.getItem("darkMode") === null) {
    document.body.classList.add("dark");
    localStorage.setItem("darkMode", true);
    }

    // Gestion du clic sur le bouton
    if (toggleDark) {
    toggleDark.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    });
    }

    // Attendre que tout soit chargé (HTML + navbar injectée)
    window.addEventListener("load", () => {

        const toggleDark = document.getElementById("toggle-dark");

        if (toggleDark) {
            toggleDark.addEventListener("click", () => {
                document.body.classList.toggle("dark");
                localStorage.setItem("darkMode", document.body.classList.contains("dark"));
            });
        }

        // Charger le mode sombre si activé
        if (localStorage.getItem("darkMode") === "true") {
            document.body.classList.add("dark");
        }

        // Activer automatiquement si le système est en mode sombre
        if (window.matchMedia("(prefers-color-scheme: dark)").matches &&
            localStorage.getItem("darkMode") === null) {
            document.body.classList.add("dark");
            localStorage.setItem("darkMode", true);
        }
    }); */


    // --- End of script.js ---

});