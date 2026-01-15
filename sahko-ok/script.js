(function () {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Sulje valikko kun klikataan linkkiä (mobiili)
    links.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        if (links.classList.contains("open")) {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  // Demo-lomake: tuottaa kopioitavan viestin (ei lähetä verkkoon)
  const form = document.getElementById("contactForm");
  const result = document.getElementById("formResult");

  if (form && result) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString().trim();
      const contact = (fd.get("contact") || "").toString().trim();
      const location = (fd.get("location") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();

      const composed =
`Yhteydenottopyyntö – Sähkö OK T. Nuutinen Oy

Nimi: ${name}
Yhteystieto: ${contact}
Kohteen sijainti: ${location || "-"}
Kuvaus: ${message}`;

      result.style.display = "block";
      result.textContent = composed;

      // Automaattinen valinta kopiointia varten
      const range = document.createRange();
      range.selectNodeContents(result);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }
})();
