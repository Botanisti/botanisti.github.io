/* =========================================================
   Raflahenksu – kevyt vanilla JS (ei riippuvuuksia)
   ========================================================= */
(function () {
  'use strict';

  var CONTACT_EMAIL = 'susanna@raflahenksu.fi';

  /* ---- Vuosiluku footeriin ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  /* ---- Header-varjo vieritettäessä ---- */
  var header = document.querySelector('.site-header');
  var onScroll = function () {
    if (header) { header.classList.toggle('scrolled', window.scrollY > 8); }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobiilivalikko ---- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
    };
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setMenu(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setMenu(false); }
    });
  }

  /* ---- Reveal-animaatio (IntersectionObserver) ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Lukujen laskuanimaatio ---- */
  var nums = document.querySelectorAll('.stat-num[data-count]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (nums.length && 'IntersectionObserver' in window && !reduceMotion) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var start = null, dur = 1100;
        var step = function (ts) {
          if (start === null) { start = ts; }
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) { requestAnimationFrame(step); }
        };
        requestAnimationFrame(step);
        countObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { countObs.observe(el); });
  }

  /* ---- Roolin esivalinta CTA-napeista (#yhteys) ---- */
  document.querySelectorAll('a[href="#yhteys"][data-role]').forEach(function (link) {
    link.addEventListener('click', function () {
      var role = link.getAttribute('data-role');
      var input = document.querySelector('input[name="role"][value="' + role + '"]');
      if (input) { input.checked = true; }
      var job = link.getAttribute('data-job');
      var msg = document.getElementById('message');
      if (job && msg && !msg.value) { msg.value = 'Haen paikkaa: ' + job + '\n\n'; }
    });
  });

  /* ---- Yhteydenottolomake -> avaa sähköposti (ei backendiä) ---- */
  var form = document.getElementById('contact-form');
  var note = document.getElementById('form-note');

  var setNote = function (text, kind) {
    if (!note) { return; }
    note.textContent = text;
    note.className = 'form-note' + (kind ? ' ' + kind : '');
  };

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var phone = form.phone.value.trim();
      var message = form.message.value.trim();
      var consent = form.consent.checked;
      var role = (form.querySelector('input[name="role"]:checked') || {}).value === 'tekija'
        ? 'Työnhakija' : 'Yritys';

      // Kevyt validointi
      var firstInvalid = null;
      var mark = function (field, bad) {
        field.setAttribute('aria-invalid', String(bad));
        if (bad && !firstInvalid) { firstInvalid = field; }
      };
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      mark(form.name, !name);
      mark(form.email, !emailOk);
      mark(form.message, !message);

      if (!name || !emailOk || !message) {
        setNote('Täytä nimi, kelvollinen sähköposti ja viesti.', 'err');
        if (firstInvalid) { firstInvalid.focus(); }
        return;
      }
      if (!consent) {
        setNote('Hyväksy tietojen käsittely lähettääksesi viestin.', 'err');
        form.consent.focus();
        return;
      }

      var subject = 'Yhteydenotto (' + role + '): ' + name;
      var bodyLines = [
        'Rooli: ' + role,
        'Nimi: ' + name,
        'Sähköposti: ' + email,
        'Puhelin: ' + (phone || '-'),
        '',
        'Viesti:',
        message
      ];
      var mailto = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));

      window.location.href = mailto;
      setNote('Avataan sähköpostiohjelmasi valmiiksi täytetyllä viestillä. Jos mitään ei tapahtunut, kirjoita suoraan osoitteeseen ' + CONTACT_EMAIL + '.', 'ok');
    });

    // Poista virhemerkintä kun käyttäjä korjaa
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') {
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  }
})();
