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

// --- VERSION SECOURS : ACTUS LOCALES ---
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

  // --- Actus locales ---
  const localActus = [
    {
      author: "VolleyBall Dompierre",
      content: "Bienvenue sur notre site du VolleyBall Dompierre !",
      image: null,
      date: new Date(),
      _id: "1"
    }
  ];

  // --- Création d'une carte ---
  function createActuCard(author, content, image = null, date = null) {
    const card = document.createElement("div");
    card.classList.add("card", "card-actu", "p-3", "mb-3");

    const dateObj = date ? new Date(date) : new Date();
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

  // --- Chargement des actus ---
  function loadActus() {
    actusList.innerHTML = "";
    localActus.forEach(a => {
      createActuCard(a.author, a.content, a.image, a.date);
    });
  }

  loadActus();

  // --- Désactivation du formulaire ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Version de secours : l’ajout d’actus est désactivé.");
  });
});
