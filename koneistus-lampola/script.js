(function () {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    links.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        if (links.classList.contains("open")) {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  const form = document.getElementById("contactForm");
  const result = document.getElementById("formResult");

  if (form && result) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString().trim();
      const contact = (fd.get("contact") || "").toString().trim();
      const topic = (fd.get("topic") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();

      const composed =
`Yhteydenottopyyntö – Koneistus Lampola (Tmi)

Nimi: ${name}
Yhteystieto: ${contact}
Aihe: ${topic || "-"}
Kuvaus: ${message}

Puhelinyhteys: 0400 484 596
Käyntiosoite: Paarmamäentie 3, 16900 Lammi`;

      result.style.display = "block";
      result.textContent = composed;

      const range = document.createRange();
      range.selectNodeContents(result);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }
})();
