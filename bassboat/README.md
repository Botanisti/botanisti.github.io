# Bass Boat 2026 — PWA

Mobiilisovellus (PWA) Bass Boat 2026 -risteilylle (Baltic Princess, 3.–4.10.2026).
Osoite: **https://botanisti.github.io/bassboat/**

Sisältö on koottu dokumentista *BASS BOAT BIBLE 2026*.

## Mitä sovelluksessa on

- **Now** – juokseva aikataulu: mitä soi nyt jokaisella lavalla (edistymispalkki ja
  "ends in X min"), mitä seuraavaksi, omat tähdellä merkityt keikat ja oheisohjelma.
  Päivittyy itsestään 30 sekunnin välein.
- **Timetable** – koko aikataulu lavoittain tai aikajärjestyksessä (lauantai-ilta / sunnuntai).
  ☆-tähdellä voi koota oman aikataulun ("★ Mine"); se tallentuu puhelimeen.
- **Artists** – haku esiintyjän tai lavan nimellä. Esiintyjäkortissa kaikki keikat,
  lava, kansi (deck), tila (LIVE / alkaa X kuluttua / soitettu) ja hakulinkit
  Spotifyyn, SoundCloudiin, YouTubeen ja Instagramiin.
- **Info** – laivakartta, lavojen sijainnit ja kaikki tärkeät tiedot (ikäraja, turvatarkastus, tax free jne.).

Toimii **täysin offline**: ensimmäisen avauksen jälkeen kaikki on puhelimen välimuistissa
(laivalla netti on merellä heikko). Kaikki ajat näytetään Suomen aikaa (laivan aika),
vaikka puhelin vaihtaisi Ruotsin aikaan Tukholman lähellä.

Asennus puhelimeen: avaa osoite → iPhone: Jaa → *Lisää Koti-valikkoon*,
Android/Chrome: valikko → *Asenna sovellus*.

## Testaus tietyllä kellonajalla

Lisää osoitteeseen `?now=`, niin näet miltä sovellus näyttää sillä hetkellä:

```
https://botanisti.github.io/bassboat/?now=2026-10-04T01:30
```

## Julkaisu (GitHub Pages)

Sovellus on `botanisti.github.io`-repon kansiossa `bassboat/`, ja GitHub Pages
julkaisee sen automaattisesti `main`-haarasta.
Osoite: **https://botanisti.github.io/bassboat/**

Sovellus on pelkkiä staattisia tiedostoja, eikä siinä ole buildia, palvelinta tai tietokantaa.
Polut ovat suhteellisia, joten saman kansion voi siirtää myös omalle serverille
(esim. relive.ennovate.fi/bassboat) sellaisenaan.

## Aikataulun muuttaminen

1. Muokkaa `js/data.js` (keikat, lavat, info).
2. Vaihda `sw.js`:n alussa `CACHE_VERSION` (esim. `bb26-v1` → `bb26-v2`).
3. Commitoi ja pushaa `main`-haaraan. Puhelimiin tulee ilmoitus *"New schedule available – Reload"*.

## Huomiot lähdedatasta

- **Speedcore Circus**: aikataulusivulla 03.00–07.00 (Trance Saloon), infokortissa
  "Sunday 03.30–07.00". Sovelluksessa käytetään aikataulusivun 03:00.
- **Hardcore Letkajenkka**: vain alkamisaika (21:00) tiedossa.
- Pool Party, Frenchcore Buffet ja Sunnarit on tulkittu sunnuntaiksi (laiva lähtee
  lauantai-iltana, joten päiväohjelma voi olla vain sunnuntaina).
