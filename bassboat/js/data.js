/*
 * Bass Boat 2026 — Year of the Kraken
 * Baltic Princess, 3.–4.10.2026, Turku — Stockholm — Turku
 *
 * Source: BASS BOAT BIBLE 2026 (field edition).
 * All times are Finnish time (ship time, UTC+3).
 * "sat" = Saturday 3.10., "sun" = Sunday 4.10.
 *
 * To change the schedule: edit the lists below and bump CACHE_VERSION in sw.js.
 */
window.BB_DATA = {
  event: {
    name: 'Bass Boat 2026',
    tagline: 'Year of the Kraken',
    ship: 'Baltic Princess',
    route: 'Turku — Stockholm — Turku',
    dates: { sat: '2026-10-03', sun: '2026-10-04' },
    utcOffset: '+03:00',
    timeZone: 'Europe/Helsinki',
  },

  stages: [
    { id: 'main', name: 'Mainstage', where: 'Starlight Palace', deck: '6–7', color: '#4aa8d8' },
    { id: 'kraken', name: 'Kraken Stage', where: 'Fast Lane, aft', deck: '6', color: '#e3263a' },
    { id: 'engine', name: 'Engine Room', where: 'Sun Deck / Klubi', deck: '10', color: '#35c26a' },
    { id: 'trance', name: 'Trance Saloon', where: "Captain's Pub", deck: '7', color: '#e0b13a' },
    { id: 'broiler', name: 'Broiler Room', where: 'Exec Suite 9713', deck: '9', color: '#e05ab8' },
    { id: 'toilet', name: 'Toilet Stage', where: 'By the Tax Free Shop', deck: '6', color: '#ff8a3d' },
    { id: 'acoustic', name: 'Acoustic Stage', where: 'Piano Bar', deck: '7', color: '#b58cff' },
    { id: 'frenchcore', name: 'Frenchcore Buffet', where: 'Grande Buffet', deck: '7', color: '#ff5fa2' },
    { id: 'pool', name: 'Pool Party', where: 'Spa', deck: '2', color: '#3fd6d0' },
    { id: 'sunnarit', name: 'Sunnarit', where: 'Engine Room', deck: '10', color: '#9be15d' },
  ],

  // [stage, artist, start, end, note?]
  sets: [
    // MAINSTAGE — STARLIGHT DECK 6-7
    ['main', 'Respawned', 'sat 20:30', 'sat 21:45'],
    ['main', 'Nenerchy', 'sat 21:45', 'sat 22:30'],
    ['main', 'Atmozfears', 'sat 22:30', 'sat 23:30'],
    ['main', 'Venjent', 'sat 23:30', 'sun 00:30'],
    ['main', 'The Purge', 'sun 00:30', 'sun 01:25'],
    ['main', 'Bass Boat Soundtrack', 'sun 01:25', 'sun 01:30'],
    ['main', 'Rooler', 'sun 01:30', 'sun 02:30'],
    ['main', 'Dikke Baap', 'sun 02:30', 'sun 03:30'],
    ['main', 'Explorers of the Internet', 'sun 03:30', 'sun 04:30'],
    ['main', 'LevenKhan', 'sun 04:30', 'sun 05:30'],
    ['main', 'Bionator Project', 'sun 05:30', 'sun 06:30'],

    // KRAKEN STAGE — DECK 6
    ['kraken', 'Ancient Weaponz', 'sat 21:00', 'sat 22:00'],
    ['kraken', 'Zhaipaa', 'sat 22:00', 'sat 23:00'],
    ['kraken', 'Hardstyle Mafia', 'sat 23:00', 'sun 00:00'],
    ['kraken', 'Infliction', 'sun 00:00', 'sun 01:00'],
    ['kraken', 'Used', 'sun 01:00', 'sun 02:00'],
    ['kraken', 'Rawtio', 'sun 02:00', 'sun 02:53'],
    ['kraken', 'Namara', 'sun 02:53', 'sun 03:53'],
    ['kraken', 'Galrav', 'sun 03:53', 'sun 05:00'],
    ['kraken', 'Terrorina', 'sun 05:00', 'sun 06:00'],

    // ENGINE ROOM — DECK 10
    ['engine', 'Heikki L & Markson', 'sat 22:00', 'sat 23:00'],
    ['engine', 'TMPR', 'sat 23:00', 'sun 00:00'],
    ['engine', 'Milla Lehto', 'sun 00:00', 'sun 01:00'],
    ['engine', 'Ravewalker', 'sun 01:00', 'sun 01:30'],
    ['engine', 'Expace', 'sun 01:30', 'sun 02:30'],
    ['engine', 'Zacharian', 'sun 02:30', 'sun 03:30'],
    ['engine', 'Superstrongman', 'sun 03:30', 'sun 04:30'],

    // TRANCE SALOON — CAPTAIN'S PUB DECK 7
    ['trance', 'TAI', 'sat 21:00', 'sat 22:00'],
    ['trance', 'Lunar State', 'sat 22:00', 'sat 23:00'],
    ['trance', 'Tozin', 'sat 23:00', 'sun 00:00'],
    ['trance', 'Jay Crystal', 'sun 00:00', 'sun 01:00'],
    ['trance', 'Miikka L', 'sun 01:00', 'sun 02:00'],
    ['trance', 'Japster', 'sun 02:00', 'sun 03:00'],
    ['trance', 'Speedcore Circus', 'sun 03:00', 'sun 07:00',
      'Absolute chaos in the early morning hours. Speedcore, circus games and complete madness. Hard to explain — come see it yourself.'],

    // BROILER ROOM — EXEC SUITE 9713
    ['broiler', 'Cloud Nine & Bobb', 'sat 22:00', 'sat 23:30'],
    ['broiler', 'Gas Gas', 'sun 00:30', 'sun 02:00'],

    // ACOUSTIC STAGE — PIANO BAR DECK 7
    ['acoustic', 'Sami Neiro & Olga', 'sat 22:00', 'sat 22:30'],
    ['acoustic', 'Sami Neiro & Olga', 'sun 13:00', 'sun 13:30'],
    ['acoustic', 'Sami Neiro & Olga', 'sun 15:00', 'sun 15:30'],

    // TOILET STAGE — DECK 6
    ['toilet', 'Janneez', 'sat 23:00', 'sun 00:00'],
    ['toilet', 'Happyduck', 'sun 00:00', 'sun 01:00'],
    ['toilet', 'Arctic Melody', 'sun 01:00', 'sun 02:00'],

    // FRENCHCORE BUFFET — BUFFET DECK 7
    ['frenchcore', 'Pink Nightmare', 'sun 08:00', 'sun 10:00'],
    ['frenchcore', 'The Renovator', 'sun 08:00', 'sun 10:00'],
    ['frenchcore', 'Surprise Guest', 'sun 08:00', 'sun 10:00'],

    // POOL PARTY SPA — DECK 2
    ['pool', 'Tozin', 'sun 12:00', 'sun 12:45'],
    ['pool', 'Happyduck', 'sun 12:45', 'sun 13:30'],
    ['pool', 'Arctic Melody', 'sun 13:30', 'sun 14:15'],
    ['pool', 'Janneez', 'sun 14:15', 'sun 15:00'],

    // SUNNARIT — ENGINE ROOM DECK 10
    ['sunnarit', 'Triple M', 'sun 12:00', 'sun 13:00'],
    ['sunnarit', 'Bobb', 'sun 13:00', 'sun 14:00'],
    ['sunnarit', 'Ex1le', 'sun 14:00', 'sun 14:45'],
    ['sunnarit', 'Kvune', 'sun 14:45', 'sun 15:30'],
    ['sunnarit', 'Chuba', 'sun 15:30', 'sun 16:15'],
    ['sunnarit', 'Arkestra', 'sun 16:15', 'sun 17:00'],
  ],

  // Side program & opening hours: [title, where, start, end|null, description]
  happenings: [
    ['Sailors Tattoo', 'Cabins 5702 & 5704, deck 5', 'sat 19:00', 'sun 02:00', 'Get inked on board.'],
    ['Merch Shop', 'Piano Bar, deck 7', 'sat 20:00', 'sun 02:00', 'Bass Boat merch and earplugs.'],
    ['Hardcore Letkajenkka', 'In front of cabin 5501, deck 5', 'sat 21:00', null,
      'Hardcore Letkajenkka starts at 21:00 in front of cabin 5501 at deck 5. Be there on time.'],
    ['Merch Shop', 'Piano Bar, deck 7', 'sun 12:00', 'sun 16:30', 'Bass Boat merch and earplugs.'],
    ['Open Decks', "Captain's Pub, deck 7", 'sun 13:00', 'sun 17:00',
      "Open Decks is karaoke for DJs. Sign up, step behind the decks and show what you've got."],
    ['Hardstyle Bingo', 'Mainstage, Starlight Palace', 'sun 14:00', 'sun 15:30',
      'Big kicks, stupid prizes and absolutely no dignity. Win Bass Boat 2027 tickets + merch if luck is on your side.'],
  ],

  info: [
    { icon: 'id', title: 'Age limit',
      text: 'The cruise has an 18+ age limit. Remember to bring an official government-issued photo ID (ID card, passport, driver\'s license) and present it when requested.' },
    { icon: 'pin', title: 'Transport & arriving',
      text: 'Silja Line Turku Terminal — Linnankatu 91, 20100 Turku. Terminal opens at 16:30. Be at the terminal by 18:30 at the latest on Saturday 3 October.' },
    { icon: 'clock', title: 'Boarding & disembarking',
      text: 'Entry to Baltic Princess is through Tallink Silja\'s Turku terminal. Cruise reservations are exchanged for boarding cards at the terminal. Remember to add all group members\' correct names and birth dates to your booking. Security checks are conducted at entry. Glass, sharp or dangerous objects, illegal substances, alcohol and own food are prohibited on board.' },
    { icon: 'ticket', title: 'Tickets',
      text: 'Remember to register all passengers\' birth dates in Tallink\'s booking system — this speeds up boarding card printing at the terminal. Present a valid ticket with a unique code at entry.' },
    { icon: 'shield', title: 'Security check & prohibited items',
      text: 'Security staff conduct checks on everyone at the terminal. Prohibited items include own alcohol, food, drugs, firearms, sharp objects, explosives, fireworks and flares. All soft drinks and juice cartons over 0.33 l are also prohibited. Drug offences are reported directly to police.' },
    { icon: 'food', title: 'Food & drinks',
      text: 'Thirsty party-goers are served by numerous bars, pubs and restaurants on board with diverse selections. We recommend booking dining, especially the buffet, in advance. Own alcoholic drinks or food cannot be brought on board.' },
    { icon: 'bag', title: 'Shopping on board',
      text: 'Tax Free: 3.10. 19:30–23:00 and 4.10. 09:00–12:30, 13:30–18:15. Snus sales 09:00–12:30. Outbound: one bottle of wine OR six canned products. Return: no restrictions.' },
    { icon: 'shield', title: 'Safety & comfort',
      text: 'Always follow the instructions of organizers and security staff. You may bring one shoulder-carriable portable speaker per person on board — tow-behind or trolley speakers are not allowed. Be considerate of neighbouring cabins: you don\'t need a big one, the music plays everywhere on Bass Boat. Have fun, but be careful and look after your friends too.' },
    { icon: 'ear', title: 'Protect your hearing',
      text: 'Use earplugs or hearing protection at concerts, especially near the stages. Earplugs are available for purchase at the merch point in Piano Bar on deck 7.' },
    { icon: 'heart', title: 'First aid & medical care',
      text: 'A first aid station is available on board. Register at the ship\'s info desk or ask security staff for help. If needed, first aid will be called directly to your location.' },
    { icon: 'box', title: 'Lost & found',
      text: 'During the event, lost items are delivered to the ship\'s Info desk on deck 6.' },
    { icon: 'camera', title: 'Cameras & photography',
      text: 'Phone photography and filming is allowed and encouraged. Professional cameras, video cameras and recorders are prohibited. An aftermovie and quality photos will be produced and shared on Bass Boat channels after the event.' },
    { icon: 'smoke', title: 'Smoking',
      text: 'Smoking is only permitted in designated smoking areas. Smoking is strictly prohibited in all indoor areas. €100 fine for smoking indoors.' },
    { icon: 'car', title: 'Parking',
      text: 'Plenty of paid parking is available near the terminal. Be prepared for police breathalyzer checks when leaving parking.' },
    { icon: 'people', title: 'Accessibility',
      text: 'Accessibility needs are handled by Baltic Princess.' },
  ],
};
