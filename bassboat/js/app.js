(() => {
  'use strict';

  const D = window.BB_DATA;
  const TZ = D.event.timeZone;
  const MIN = 60 * 1000;

  // ---------- time ----------

  // "?now=2026-10-03T23:15" lets you preview the live view at any moment.
  const nowOverride = (() => {
    const p = new URLSearchParams(location.search).get('now');
    if (!p) return null;
    const t = Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(p) ? p : p + D.event.utcOffset);
    return Number.isNaN(t) ? null : t - Date.now();
  })();
  const now = () => Date.now() + (nowOverride || 0);

  function parseWhen(s) {
    const [day, hm] = s.split(' ');
    return Date.parse(`${D.event.dates[day]}T${hm}:00${D.event.utcOffset}`);
  }

  const fmtTime = new Intl.DateTimeFormat('fi-FI', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const fmtDay = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short' });
  const hhmm = (t) => fmtTime.format(t).replace('.', ':');
  const dayName = (t) => fmtDay.format(t);

  function duration(ms) {
    const m = Math.max(0, Math.round(ms / MIN));
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
  }

  // ---------- data ----------

  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const stages = new Map(D.stages.map((s) => [s.id, s]));

  const sets = D.sets.map(([stage, artist, start, end, note], i) => ({
    id: i,
    stage: stages.get(stage),
    artist,
    slug: slug(artist),
    start: parseWhen(start),
    end: parseWhen(end),
    note: note || '',
  })).sort((a, b) => a.start - b.start || a.stage.name.localeCompare(b.stage.name));

  const happenings = D.happenings.map(([title, where, start, end, text]) => {
    const s = parseWhen(start);
    return { title, where, start: s, end: end ? parseWhen(end) : null, text };
  });

  // One entry per act name. "Cloud Nine & Bobb" also shows up on Bobb's page.
  const artists = (() => {
    const map = new Map();
    for (const set of sets) {
      if (!map.has(set.slug)) map.set(set.slug, { name: set.artist, slug: set.slug, sets: [], related: [] });
      map.get(set.slug).sets.push(set);
    }
    for (const set of sets) {
      const parts = set.artist.split(' & ').map(slug);
      if (parts.length < 2) continue;
      for (const p of parts) {
        const a = map.get(p);
        if (a && a.slug !== set.slug) a.related.push(set);
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  })();
  const artistBySlug = new Map(artists.map((a) => [a.slug, a]));

  const firstStart = sets[0].start;
  const lastEnd = Math.max(...sets.map((s) => s.end));

  // Saturday night runs until 07:00 Sunday; after that it's "Sunday".
  const nightEnd = parseWhen('sun 07:00');
  const dayOf = (set) => (set.start < nightEnd ? 'night' : 'sunday');

  const status = (set, t = now()) => (t < set.start ? 'upcoming' : t >= set.end ? 'past' : 'live');

  // ---------- favourites ----------

  const FAV_KEY = 'bb26:favs';
  const favs = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); }
  })();
  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id);
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch { /* private mode */ }
  }
  const favKey = (set) => `${set.stage.id}|${set.slug}|${set.start}`;

  // ---------- ui state ----------

  const ui = (() => {
    const defaults = { ttDay: null, ttMode: 'stage', ttFavs: false, q: '' };
    try { return { ...defaults, ...JSON.parse(sessionStorage.getItem('bb26:ui') || '{}') }; } catch { return defaults; }
  })();
  const saveUi = () => { try { sessionStorage.setItem('bb26:ui', JSON.stringify(ui)); } catch { /* ignore */ } };

  // ---------- helpers ----------

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $view = document.getElementById('view');
  const $sheet = document.getElementById('sheet');

  const stageTag = (st) =>
    `<span class="tag" style="--c:${st.color}">${esc(st.name)}</span>`;
  const whereLine = (st) => `${esc(st.where)} · Deck ${esc(st.deck)}`;

  const star = (set) => {
    const on = favs.has(favKey(set));
    return `<button type="button" class="star${on ? ' on' : ''}" data-fav="${esc(favKey(set))}"
      aria-pressed="${on}" aria-label="${on ? 'Remove from' : 'Add to'} my schedule: ${esc(set.artist)}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>
    </button>`;
  };

  const progress = (set, t) => Math.min(100, Math.max(0, ((t - set.start) / (set.end - set.start)) * 100));

  function setRow(set, t, { showStage = true, showDay = false } = {}) {
    const st = status(set, t);
    const live = st === 'live';
    return `<li class="row ${st}" style="--c:${set.stage.color}">
      <a class="row-main" href="#artist/${set.slug}">
        <span class="row-time">${showDay ? `<small>${dayName(set.start)}</small>` : ''}${hhmm(set.start)}<small>${hhmm(set.end)}</small></span>
        <span class="row-body">
          <span class="row-name">${esc(set.artist)}${live ? ' <span class="live-dot">LIVE</span>' : ''}</span>
          ${showStage ? `<span class="row-sub">${esc(set.stage.name)} · Deck ${esc(set.stage.deck)}</span>` : ''}
          ${live ? `<span class="bar"><i style="width:${progress(set, t).toFixed(1)}%"></i></span>` : ''}
        </span>
      </a>
      ${star(set)}
    </li>`;
  }

  // ---------- views ----------

  function viewNow() {
    const t = now();
    let html = '';

    if (t < firstStart) {
      html += `<section class="hero">
        <p class="eyebrow">Music starts in</p>
        <p class="countdown">${duration(firstStart - t)}</p>
        <p class="muted">${dayName(firstStart)} ${hhmm(firstStart)} · ${esc(sets[0].artist)} @ ${esc(sets[0].stage.name)}</p>
      </section>`;
    } else if (t >= lastEnd) {
      html += `<section class="hero">
        <p class="eyebrow">That's a wrap</p>
        <p class="countdown">See you in 2027</p>
        <p class="muted">The Kraken sleeps. Thanks for sailing with Bass Boat.</p>
      </section>`;
    }

    // Now playing, one card per stage
    const order = D.stages.map((s) => s.id);
    const live = sets.filter((s) => status(s, t) === 'live')
      .sort((a, b) => order.indexOf(a.stage.id) - order.indexOf(b.stage.id));
    if (live.length) {
      html += `<h2 class="h">Now playing <span class="count">${live.length}</span></h2><div class="cards">`;
      for (const s of live) {
        const next = sets.find((n) => n.stage === s.stage && n.start >= s.end && n.slug !== s.slug);
        html += `<article class="card" style="--c:${s.stage.color}">
          <div class="card-head">${stageTag(s.stage)}<span class="muted">Deck ${esc(s.stage.deck)}</span></div>
          <a class="card-name" href="#artist/${s.slug}">${esc(s.artist)}</a>
          <div class="card-time">${hhmm(s.start)} – ${hhmm(s.end)} <span class="muted">· ends in ${duration(s.end - t)}</span></div>
          <span class="bar"><i style="width:${progress(s, t).toFixed(1)}%"></i></span>
          ${next ? `<div class="card-next">Next <a href="#artist/${next.slug}">${esc(next.artist)}</a> <span class="muted">${hhmm(next.start)}</span></div>` : ''}
          ${star(s)}
        </article>`;
      }
      html += '</div>';
    } else if (t >= firstStart && t < lastEnd) {
      html += `<section class="hero small"><p class="eyebrow">Quiet moment</p><p class="muted">Nothing on stage right now — see what's coming up below.</p></section>`;
    }

    // Side program happening now
    const onNow = happenings.filter((h) => t >= h.start && t < (h.end || h.start + 30 * MIN));
    if (onNow.length) {
      html += '<h2 class="h">Also on now</h2><ul class="list">';
      html += onNow.map((h) => `<li class="row live mini"><span class="row-body"><span class="row-name">${esc(h.title)}</span><span class="row-sub">${esc(h.where)} · until ${h.end ? hhmm(h.end) : '?'}</span></span></li>`).join('');
      html += '</ul>';
    }

    // Your starred sets coming up
    const myNext = sets.filter((s) => favs.has(favKey(s)) && s.start > t).slice(0, 5);
    if (myNext.length) {
      html += '<h2 class="h">Your next</h2><ul class="list">';
      html += myNext.map((s) => setRow(s, t, { showDay: true })).join('');
      html += '</ul>';
    }

    // Up next across the boat
    const windowEnd = t < firstStart ? firstStart + 90 * MIN : t + 90 * MIN;
    let upNext = sets.filter((s) => s.start > t && s.start <= windowEnd);
    if (!upNext.length) upNext = sets.filter((s) => s.start > t).slice(0, 6);
    if (upNext.length) {
      html += '<h2 class="h">Up next</h2><ul class="list">';
      html += upNext.map((s) => setRow(s, t, { showDay: s.start - t > 12 * 60 * MIN })).join('');
      html += '</ul>';
    }

    const upHappen = happenings.filter((h) => h.start > t).slice(0, 3);
    if (upHappen.length) {
      html += '<h2 class="h">Side program</h2><ul class="list">';
      html += upHappen.map((h) => `<li class="row upcoming mini"><span class="row-time">${dayName(h.start)}<small>${hhmm(h.start)}</small></span><span class="row-body"><span class="row-name">${esc(h.title)}</span><span class="row-sub">${esc(h.where)}</span></span></li>`).join('');
      html += '</ul>';
    }

    html += `<p class="foot">All times in Finnish time (ship time). Your phone may switch to Swedish time near Stockholm — this app won't.</p>`;
    return html;
  }

  function viewTimetable() {
    const t = now();
    if (!ui.ttDay) ui.ttDay = t >= nightEnd ? 'sunday' : 'night';
    const daySets = sets.filter((s) => dayOf(s) === ui.ttDay && (!ui.ttFavs || favs.has(favKey(s))));

    let html = `<div class="toolbar">
      <div class="seg" role="group" aria-label="Day">
        <button type="button" data-tt-day="night" aria-pressed="${ui.ttDay === 'night'}">Sat night</button>
        <button type="button" data-tt-day="sunday" aria-pressed="${ui.ttDay === 'sunday'}">Sunday</button>
      </div>
      <div class="seg" role="group" aria-label="Group by">
        <button type="button" data-tt-mode="stage" aria-pressed="${ui.ttMode === 'stage'}">Stages</button>
        <button type="button" data-tt-mode="time" aria-pressed="${ui.ttMode === 'time'}">By time</button>
      </div>
      <button type="button" class="chip${ui.ttFavs ? ' on' : ''}" data-tt-favs aria-pressed="${ui.ttFavs}">★ Mine</button>
    </div>`;

    if (!daySets.length) {
      html += `<p class="empty">${ui.ttFavs ? 'No starred sets on this day yet. Tap ☆ on any set to build your own schedule.' : 'Nothing scheduled.'}</p>`;
      return html;
    }

    if (ui.ttMode === 'time') {
      html += '<ul class="list">' + daySets.map((s) => setRow(s, t)).join('') + '</ul>';
    } else {
      for (const st of D.stages) {
        const list = daySets.filter((s) => s.stage.id === st.id);
        if (!list.length) continue;
        html += `<section class="stage" style="--c:${st.color}">
          <h2 class="stage-h"><span>${esc(st.name)}</span><small>${whereLine(st)}</small></h2>
          <ul class="list">${list.map((s) => setRow(s, t, { showStage: false })).join('')}</ul>
        </section>`;
      }
    }

    if (ui.ttDay === 'sunday' && !ui.ttFavs) {
      html += '<h2 class="h">Side program</h2><ul class="list">';
      html += happenings.filter((h) => h.start >= nightEnd).map((h) => `<li class="row ${t >= (h.end || h.start) ? 'past' : 'upcoming'} mini"><span class="row-time">${hhmm(h.start)}<small>${h.end ? hhmm(h.end) : ''}</small></span><span class="row-body"><span class="row-name">${esc(h.title)}</span><span class="row-sub">${esc(h.where)}</span></span></li>`).join('');
      html += '</ul>';
    } else if (!ui.ttFavs) {
      html += '<h2 class="h">Side program</h2><ul class="list">';
      html += happenings.filter((h) => h.start < nightEnd).map((h) => `<li class="row ${t >= (h.end || h.start + 30 * MIN) ? 'past' : 'upcoming'} mini"><span class="row-time">${hhmm(h.start)}<small>${h.end ? hhmm(h.end) : ''}</small></span><span class="row-body"><span class="row-name">${esc(h.title)}</span><span class="row-sub">${esc(h.where)}</span></span></li>`).join('');
      html += '</ul>';
    }
    return html;
  }

  function artistStatus(a, t) {
    const all = [...a.sets, ...a.related];
    const live = all.find((s) => status(s, t) === 'live');
    if (live) return { cls: 'live', text: `LIVE · ${live.stage.name}` };
    const next = all.filter((s) => s.start > t).sort((x, y) => x.start - y.start)[0];
    if (next) return { cls: 'upcoming', text: `${dayName(next.start)} ${hhmm(next.start)} · ${next.stage.name}` };
    return { cls: 'past', text: 'Played' };
  }

  function viewArtists() {
    return `<div class="search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>
      <input id="q" type="search" placeholder="Search artist or stage" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(ui.q)}" aria-label="Search artists">
    </div>
    <ul id="artist-list" class="list artists"></ul>`;
  }

  function renderArtistList() {
    const t = now();
    const q = slug(ui.q).replace(/-/g, '');
    const el = document.getElementById('artist-list');
    if (!el) return;
    const matches = artists.filter((a) => {
      if (!q) return true;
      const hay = [a.name, ...a.sets.map((s) => `${s.stage.name} ${s.stage.where}`)].map((x) => slug(x).replace(/-/g, '')).join(' ');
      return hay.includes(q);
    });
    if (!matches.length) {
      el.innerHTML = `<li class="empty">No artist matches “${esc(ui.q)}”.</li>`;
      return;
    }
    let letter = '';
    el.innerHTML = matches.map((a) => {
      const st = artistStatus(a, t);
      const L = /[a-z]/i.test(a.name[0]) ? a.name[0].toUpperCase() : '#';
      const head = !q && L !== letter ? `<li class="letter" aria-hidden="true">${(letter = L)}</li>` : '';
      const colors = [...new Set(a.sets.map((s) => s.stage.color))];
      return `${head}<li class="row ${st.cls}" style="--c:${colors[0]}">
        <a class="row-main" href="#artist/${a.slug}">
          <span class="dots">${colors.map((c) => `<i style="background:${c}"></i>`).join('')}</span>
          <span class="row-body">
            <span class="row-name">${esc(a.name)}</span>
            <span class="row-sub">${esc(st.text)}</span>
          </span>
          <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
        </a>
      </li>`;
    }).join('');
  }

  const ICONS = {
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4M14 13h3"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6z"/>',
    food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.7 0-3 2-3 5s1 4 3 4v9"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
    ear: '<path d="M7 10a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.6"/><path d="M10 10a2 2 0 0 1 4 0c0 1.5-2 2-2 3.5"/>',
    heart: '<path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20z"/><path d="M7 12h3l1.5-2.5 2 5L15 12h2"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    camera: '<path d="M4 7h3.5L9 5h6l1.5 2H20v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
    smoke: '<path d="M3 15h14v3H3zM19 15v3M21 15v3M18 12c0-2-2-2-2-4s2-2 2-4"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM5 11h14"/><circle cx="7.5" cy="13.5" r=".5"/><circle cx="16.5" cy="13.5" r=".5"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 0 1 0 6M18 14c2 .7 3 2.8 3 6"/>',
  };

  function viewInfo() {
    let html = `<section class="hero small">
      <p class="eyebrow">${esc(D.event.ship)} · ${esc(D.event.route)}</p>
      <p class="muted">Terminal opens 16:30 · be there by 18:30 on Sat 3.10.<br>Silja Line Turku Terminal, Linnankatu 91</p>
    </section>

    <h2 class="h">Deck plan</h2>
    <a class="map" href="img/deckplan.jpg" target="_blank" rel="noopener">
      <img src="img/deckplan.jpg" alt="Deck plan of Baltic Princess with all Bass Boat stages marked" loading="lazy" width="1920" height="1080">
      <span>Tap to zoom</span>
    </a>

    <h2 class="h">Where is it?</h2>
    <ul class="list wheres">
      ${D.stages.map((s) => `<li class="row mini" style="--c:${s.color}"><span class="deck">${esc(s.deck)}</span><span class="row-body"><span class="row-name">${esc(s.name)}</span><span class="row-sub">${esc(s.where)}</span></span></li>`).join('')}
      <li class="row mini" style="--c:#888"><span class="deck">5</span><span class="row-body"><span class="row-name">Sailors Tattoo</span><span class="row-sub">Cabins 5702 & 5704 · Sat 19:00–02:00</span></span></li>
      <li class="row mini" style="--c:#888"><span class="deck">7</span><span class="row-body"><span class="row-name">Merch Shop</span><span class="row-sub">Piano Bar · Sat 20:00–02:00 · Sun 12:00–16:30</span></span></li>
      <li class="row mini" style="--c:#888"><span class="deck">6</span><span class="row-body"><span class="row-name">Info desk · Lost & found</span><span class="row-sub">Ship's info desk</span></span></li>
    </ul>

    <h2 class="h">Essential info</h2>
    <div class="info">
      ${D.info.map((i) => `<details>
        <summary><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[i.icon] || ''}</svg><span>${esc(i.title)}</span></summary>
        <p>${esc(i.text)}</p>
      </details>`).join('')}
    </div>
    <p class="foot">Source: Bass Boat Bible 2026. All times Finnish time (ship time).</p>`;
    return html;
  }

  // ---------- artist sheet ----------

  function openArtist(slugName) {
    const a = artistBySlug.get(slugName);
    if (!a) { location.replace('#artists'); return; }
    const t = now();
    const all = [...a.sets, ...a.related].sort((x, y) => x.start - y.start);
    const st = artistStatus(a, t);
    const q = encodeURIComponent(a.name);
    const note = a.sets.find((s) => s.note)?.note;

    $sheet.innerHTML = `<div class="sheet-inner" style="--c:${a.sets[0].stage.color}">
      <button type="button" class="close" data-close aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
      <p class="eyebrow ${st.cls}">${st.cls === 'live' ? '<span class="live-dot">LIVE</span>' : ''} ${esc(st.cls === 'live' ? st.text.replace('LIVE · ', 'Now on ') : st.cls === 'past' ? 'Already played' : 'Next: ' + st.text)}</p>
      <h2 id="sheet-title" class="sheet-title">${esc(a.name)}</h2>
      ${note ? `<p class="note">${esc(note)}</p>` : ''}
      <h3 class="h">${all.length > 1 ? 'Sets' : 'Set'}</h3>
      <ul class="list">
        ${all.map((s) => {
          const ss = status(s, t);
          const extra = ss === 'live' ? `ends in ${duration(s.end - t)}` : ss === 'upcoming' ? `in ${duration(s.start - t)}` : 'played';
          return `<li class="row ${ss}" style="--c:${s.stage.color}">
            <span class="row-main">
              <span class="row-time"><small>${dayName(s.start)}</small>${hhmm(s.start)}<small>${hhmm(s.end)}</small></span>
              <span class="row-body">
                ${s.slug !== a.slug ? `<span class="row-name">${esc(s.artist)}</span>` : ''}
                <span class="row-name">${esc(s.stage.name)}</span>
                <span class="row-sub">${whereLine(s.stage)}</span>
                <span class="row-sub">${extra}</span>
                ${ss === 'live' ? `<span class="bar"><i style="width:${progress(s, t).toFixed(1)}%"></i></span>` : ''}
              </span>
            </span>
            ${star(s)}
          </li>`;
        }).join('')}
      </ul>
      <h3 class="h">Listen</h3>
      <div class="links">
        <a href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener">Spotify</a>
        <a href="https://soundcloud.com/search?q=${q}" target="_blank" rel="noopener">SoundCloud</a>
        <a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">YouTube</a>
        <a href="https://www.instagram.com/explore/search/keyword/?q=${q}" target="_blank" rel="noopener">Instagram</a>
      </div>
      <p class="foot">Links open a search — needs internet, which may be limited at sea.</p>
    </div>`;
    if (!$sheet.open) $sheet.showModal();
    $sheet.scrollTop = 0;
  }

  function closeSheet() {
    if ($sheet.open) $sheet.close();
  }

  $sheet.addEventListener('close', () => {
    if (location.hash.startsWith('#artist/')) location.replace(`#${baseTab}`);
  });
  $sheet.addEventListener('click', (e) => {
    if (e.target === $sheet || e.target.closest('[data-close]')) closeSheet();
  });

  // ---------- router ----------

  let current = '';
  let baseTab = 'now';

  function route() {
    const h = location.hash.slice(1) || 'now';
    if (h.startsWith('artist/')) {
      if (!current) { current = 'artists'; baseTab = 'artists'; render(); }
      openArtist(h.slice(7));
      return;
    }
    closeSheet();
    const tab = ['now', 'timetable', 'artists', 'info'].includes(h) ? h : 'now';
    const changed = tab !== current;
    current = baseTab = tab;
    render();
    if (changed) { window.scrollTo(0, 0); }
  }

  function render() {
    document.querySelectorAll('.tabs a').forEach((a) => {
      a.toggleAttribute('aria-current', a.dataset.tab === baseTab);
      if (a.dataset.tab === baseTab) a.setAttribute('aria-current', 'page');
    });
    const views = { now: viewNow, timetable: viewTimetable, artists: viewArtists, info: viewInfo };
    if (baseTab === 'artists' && document.getElementById('q')) {
      renderArtistList(); // keep the search box (and keyboard) as is
    } else {
      $view.innerHTML = views[baseTab]();
      if (baseTab === 'artists') renderArtistList();
    }
    if (baseTab === 'timetable') {
      const live = $view.querySelector('.row.live');
      if (live && !render.scrolled) { render.scrolled = true; live.scrollIntoView({ block: 'center' }); }
    }
  }

  // ---------- events ----------

  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      toggleFav(fav.dataset.fav);
      const on = favs.has(fav.dataset.fav);
      document.querySelectorAll(`[data-fav="${CSS.escape(fav.dataset.fav)}"]`).forEach((b) => {
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
      });
      if (navigator.vibrate) navigator.vibrate(10);
      return;
    }
    const day = e.target.closest('[data-tt-day]');
    if (day) { ui.ttDay = day.dataset.ttDay; render.scrolled = true; saveUi(); render(); return; }
    const mode = e.target.closest('[data-tt-mode]');
    if (mode) { ui.ttMode = mode.dataset.ttMode; saveUi(); render(); return; }
    if (e.target.closest('[data-tt-favs]')) { ui.ttFavs = !ui.ttFavs; saveUi(); render(); }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'q') { ui.q = e.target.value; saveUi(); renderArtistList(); }
  });

  window.addEventListener('hashchange', route);

  // Clock + live refresh
  const $clock = document.getElementById('clock');
  function tick() {
    $clock.textContent = hhmm(now());
    if (!$sheet.open && !(baseTab === 'artists' && document.activeElement?.id === 'q')) render();
    else if ($sheet.open) {
      const h = location.hash;
      if (h.startsWith('#artist/')) { const y = $sheet.scrollTop; openArtist(h.slice(8)); $sheet.scrollTop = y; }
    }
  }
  route();
  $clock.textContent = hhmm(now());
  setInterval(tick, 30 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  // ---------- service worker ----------

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const $u = document.getElementById('update');
      const offer = (w) => {
        $u.hidden = false;
        document.getElementById('update-btn').onclick = () => w.postMessage('skipWaiting');
      };
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
        });
      });
      // Check for a new schedule whenever the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
  }
})();
