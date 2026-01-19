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
window.addEventListener("DOMContentLoaded", () => {
  const actusList = document.getElementById("actus-list");
  const form = document.getElementById("add-actu-form");

  // --- Lightbox ---
  const lightbox = document.createElement("div");
  lightbox.id = "lightbox";
  lightbox.style.cssText = `
    display:none; position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.85); justify-content:center; align-items:center;
    z-index:9999; cursor:pointer;
  `;

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
      lbImg.src = img.src;
      lightbox.style.display = "flex";
    });
  }

  // --- Chargement des actus depuis Google Sheets ---
  async function loadActus() {
    const data = await loadData("actualites");

    // Trier du plus récent au plus ancien
    data.sort((a, b) => {
      const da = new Date(a.date.split("/").reverse().join("-"));
      const db = new Date(b.date.split("/").reverse().join("-"));
      return db - da;
    });

    actusList.innerHTML = "";

    data.forEach(a => {
      createActuCard(a.author, a.content, a.image, a.date);
    });
  }

  // --- Création d'une carte ---
    function parseFrenchDate(str) {
        if (!str) return new Date();

        // Format AAAA-MM-JJ → direct
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return new Date(str);
        }

        // Format JJ/MM/AAAA ou J/M/AAAA
        if (str.includes("/")) {
            const parts = str.split("/");
            if (parts.length === 3) {
            const [day, month, year] = parts;
            return new Date(`${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`);
            }
        }

        // Format JJ-MM-AAAA
        if (str.includes("-")) {
            const parts = str.split("-");
            if (parts.length === 3) {
            const [day, month, year] = parts;
            return new Date(`${year}-${month}-${day}`);
            }
        }

        // Dernier recours : laisser JS deviner
        return new Date(str);
    }


    function createActuCard(author, content, image = null, date = null) {
    const card = document.createElement("div");
    card.classList.add("card", "card-actu", "p-3", "mb-3");

    const dateObj = parseFrenchDate(date);
    const dateStr = dateObj.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
        <div><strong>${author}</strong> <small class="text-muted">${dateStr}</small></div>
        </div>
        <p>${content}</p>
        ${image ? `<img src="${image}" class="img-fluid rounded mt-2">` : ""}
    `;

    actusList.append(card);

    const imgEl = card.querySelector("img");
    if (imgEl) enableLightbox(imgEl);
    }


  loadActus();

  // --- Désactivation du formulaire ---
    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            alert("L’ajout d’actus est désactivé.");
        });
    }

});


function showSection(sectionId, btn) {
    document.querySelectorAll('.section-content').forEach(sec => sec.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    document.querySelectorAll('main button[data-section]').forEach(b => {
        b.classList.remove('btn-success');
        b.classList.add('btn-outline-success');
    });

    btn.classList.remove('btn-outline-success');
    btn.classList.add('btn-success');

    // --- Cacher / afficher le bouton filtre ---
    const btnFiltres = document.getElementById("btn-filtres");

    if (sectionId === "evenements") {
        btnFiltres.style.display = "none";
    } else {
        btnFiltres.style.display = "inline-block";
    }
}

document.querySelectorAll('main button[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-section');
        showSection(section, btn);
    });
});

// Calendrier interactif
const SHEET_ID = "1FBm9gqxWGxO9x5nQyjExJkZTqXg6HMg9HFLZhoYkU2s";

const btnFiltres = document.getElementById("btn-filtres");
const zoneFiltres = document.getElementById("zone-filtres");

// ----------------------
// Chargement Google Sheet
// ----------------------
async function loadData(sheetName) {
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${sheetName}`;
    const response = await fetch(url);
    return await response.json();
}

// ----------------------
// Récupération des filtres
// ----------------------
function getFilters() {
    const equipeCheckboxes = document.querySelectorAll(".filter-equipe");
    const selectedEquipes = Array.from(equipeCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    const lieuRadio = document.querySelector(".filter-lieu:checked");
    const lieu = lieuRadio ? lieuRadio.value : "tous";

    return { equipes: selectedEquipes, lieu };
}

// ----------------------
// MATCHS À VENIR
// ----------------------
async function loadMatchsAvenir() {
    const data = await loadData("matchs_avenir");
    const filters = getFilters();

    // Tri par date
    data.sort((a, b) => {
        const da = new Date(a.date.split("/").reverse().join("-"));
        const db = new Date(b.date.split("/").reverse().join("-"));
        return da - db;
    });

    const container = document.querySelector("#avenir .list-group");
    container.innerHTML = "";

    // --- FILTRAGE ---
    const filtered = data.filter(row => {
        const lieuMatch = row.lieu ? row.lieu.toLowerCase() : "";
        const domExt = lieuMatch.includes("dompierre") ? "domicile" : "extérieur";

        // équipe dans équipe OU adversaire
        if (!filters.equipes.some(eq =>
            row.equipe.toLowerCase().includes(eq.toLowerCase()) ||
            row.adversaire.toLowerCase().includes(eq.toLowerCase())
        )) {
            return false;
        }

        if (filters.lieu !== "tous" && filters.lieu !== domExt) return false;

        return true;
    });

    // --- AUCUN MATCH ---
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="bg-light p-3 mt-3 border rounded text-center text-muted">
                Aucun match à venir
            </div>`;
        return;
    }

    // --- AFFICHAGE PAR DATE ---
    let currentDate = "";

    filtered.forEach(row => {
        const lieuMatch = row.lieu ? row.lieu.toLowerCase() : "";
        const domExt = lieuMatch.includes("dompierre") ? "domicile" : "extérieur";

        // Nouveau jour → séparation + titre
        if (row.date !== currentDate) {
            currentDate = row.date;

            container.innerHTML += `
                <div class="day-separator mt-4 mb-2">
                    <div class="day-line"></div>
                    <h5 class="day-title text-primary">${currentDate}</h5>
                    <div class="day-line"></div>
                </div>`;
        }

        // Carte de match
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

// ----------------------
// RÉSULTATS
// ----------------------
async function loadResultats() {
    const data = await loadData("resultats");
    const filters = getFilters();

    data.sort((a, b) => {
        const da = new Date(a.date.split("/").reverse().join("-"));
        const db = new Date(b.date.split("/").reverse().join("-"));
        return db - da;
    });

    const container = document.querySelector("#resultats .list-group");
    container.innerHTML = "";

    const filtered = data.filter(row => {
        const lieuMatch = row.lieu ? row.lieu.toLowerCase() : "";
        const domExt = lieuMatch.includes("dompierre") ? "domicile" : "extérieur";

        if (!filters.equipes.some(eq =>
            row.equipe.toLowerCase().includes(eq.toLowerCase()) ||
            row.adversaire.toLowerCase().includes(eq.toLowerCase())
        )) {
            return false;
        }
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

// ----------------------
// ÉVÉNEMENTS
// ----------------------
async function loadEvenements() {
    const data = await loadData("evenements");

    data.sort((a, b) => {
        const da = new Date(a.date.split("/").reverse().join("-"));
        const db = new Date(b.date.split("/").reverse().join("-"));
        return da - db;
    });

    const container = document.querySelector("#evenements .list-group");
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
                <small>${row.description}</small>
            </li>`;
    });
}

// ----------------------
// Mise à jour automatique quand on change un filtre
// ----------------------
document.querySelectorAll(".filter-equipe, .filter-lieu").forEach(input => {
    input.addEventListener("change", () => {
        loadMatchsAvenir();
        loadResultats();
    });
});

// Masquer le filtre dans la section Événements
document.querySelectorAll("button[data-section]").forEach(btn => {
    btn.addEventListener("click", () => {
        const section = btn.dataset.section;

        if (section === "evenements") {
            zoneFiltres.style.display = "none";
        }
    });
});

btnFiltres.addEventListener("click", () => {
    const visible = zoneFiltres.style.display === "block";
    zoneFiltres.style.display = visible ? "none" : "block";
});

document.getElementById("reset-filtres").addEventListener("click", () => {

    // Réinitialiser les équipes
    document.querySelectorAll(".filter-equipe").forEach(cb => {
        cb.checked = true;
        cb.dispatchEvent(new Event("change")); 
    });

    // Réinitialiser le lieu
    const lieuTous = document.getElementById("lieuTous");
    lieuTous.checked = true;
    lieuTous.dispatchEvent(new Event("change")); 
});

// ----------------------
// Chargement initial
// ----------------------
loadMatchsAvenir();
loadResultats();
loadEvenements();