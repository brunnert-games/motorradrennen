'use strict';

// =====================================================================
//  RENNSTRECKEN
//  Hier kannst du die Strecken verändern oder ganz neue bauen!
//
//  Eine Strecke besteht aus vielen Abschnitten. Jeder Abschnitt hat:
//
//    laenge : wie lang der Abschnitt ist (100 = kurz, 300 = lang)
//    kurve  : 0 oder weglassen = geradeaus
//             positive Zahl = Rechtskurve, negative Zahl = Linkskurve
//             1 bis 2 = sanft,  3 bis 4 = mittel,  5 bis 6 = sehr eng
//    huegel : wie hoch es rauf (+) oder runter (-) geht, z.B. 30 oder -30
//
//  Am Ende wird die Strecke automatisch wieder auf die Starthöhe gebracht.
//
//  Nur für Motocross-Strecken (modus: 'cross') gibt es noch:
//    { sprung: 15 } : eine Sprungschanze mit Graben. Die Zahl ist die Breite
//                     des Grabens (10 = klein, 15 = mittel, 25 = riesig).
//                     Wer zu langsam ist, fällt hinein!
//    { wellen: 6 }  : viele kleine Buckel hintereinander (hier 6 Stück)
//
//  modus   : 'rennen' = Rennmotorräder, 'cross' = Cross-Motorräder
//  runden  : wie viele Runden gefahren werden
//  plakate : was auf den Werbeplakaten am Rand steht
//  deko    : was neben der Strecke steht (baum, tanne, busch, kaktus, fels)
// =====================================================================

const STRECKEN = [
  {
    name: 'Grüner Ring',
    modus: 'rennen',
    beschreibung: 'Sonnige Strecke mit Wald, Wiesen und sanften Hügeln.',
    runden: 4,
    seed: 7,
    nebelDichte: 3,
    sonne: { x: 0.75, y: 90, r: 34 },
    wolken: true,
    tafelberge: false,
    baumSilhouetten: true,
    farben: {
      himmelOben: '#2f80d8',
      himmelUnten: '#bfe3ff',
      sonne: '#fff6c2',
      nebel: '#d4ecf7',
      berge: '#6f8fb0',
      huegel: '#3f8a3a',
      gras1: '#4fae3b',
      gras2: '#47a235',
      strasse1: '#6c6c6c',
      strasse2: '#676767',
      kerb1: '#d62828',
      kerb2: '#f4f4f4',
      linie: '#ffffff',
    },
    deko: ['baum', 'baum', 'tanne', 'busch'],
    plakate: ['VOLLGAS!', 'MOTO-CUP', 'SUPER SPEED', 'NICHT BREMSEN!'],
    abschnitte: [
      { laenge: 200 },                          // Start-Ziel-Gerade
      { laenge: 120, kurve: 3 },
      { laenge: 100, huegel: 20 },
      { laenge: 150, kurve: -2, huegel: -20 },
      { laenge: 100 },
      { laenge: 80, kurve: 5 },                 // Haarnadelkurve
      { laenge: 120, huegel: 30 },
      { laenge: 100, kurve: -3 },
      { laenge: 60 },
      { laenge: 100, kurve: -4, huegel: -30 },
      { laenge: 150 },
      { laenge: 120, kurve: 2 },
      { laenge: 80, kurve: -2 },
      { laenge: 120, kurve: 2, huegel: 20 },
      { laenge: 200, huegel: -20 },
      { laenge: 100, kurve: 4 },
      { laenge: 100 },
      { laenge: 150, kurve: 3, huegel: 15 },
      { laenge: 120, kurve: -3 },
      { laenge: 150 },
    ],
  },
  {
    name: 'Wüsten-Canyon',
    modus: 'rennen',
    beschreibung: 'Abendrennen durch die Wüste – steile Hügel und enge Kurven!',
    runden: 3,
    seed: 42,
    nebelDichte: 4,
    sonne: { x: 0.3, y: 120, r: 50 },
    wolken: false,
    tafelberge: true,
    baumSilhouetten: false,
    farben: {
      himmelOben: '#2b1d4f',
      himmelUnten: '#ff9248',
      sonne: '#ffd166',
      nebel: '#f2a65a',
      berge: '#8a3b4a',
      huegel: '#b5523b',
      gras1: '#e2b66e',
      gras2: '#d8aa60',
      strasse1: '#5e5753',
      strasse2: '#58514d',
      kerb1: '#1d4ed8',
      kerb2: '#f4f4f4',
      linie: '#ffffff',
    },
    deko: ['kaktus', 'kaktus', 'fels', 'busch'],
    plakate: ['WÜSTEN-RALLYE', 'TURBO', 'HEISS!', 'KAKTUS-CUP'],
    abschnitte: [
      { laenge: 200 },                          // Start-Ziel-Gerade
      { laenge: 100, kurve: -4 },
      { laenge: 150, huegel: 40 },
      { laenge: 100, kurve: 5, huegel: -20 },
      { laenge: 80 },
      { laenge: 100, kurve: -5 },               // Schikane: links ...
      { laenge: 100, kurve: 5 },                // ... und gleich rechts
      { laenge: 200, huegel: -40 },
      { laenge: 150, kurve: 2, huegel: 30 },
      { laenge: 100, huegel: -30 },
      { laenge: 120, kurve: -6 },               // die engste Kurve!
      { laenge: 150 },
      { laenge: 100, kurve: 3, huegel: 25 },
      { laenge: 100, kurve: 3, huegel: -25 },
      { laenge: 200 },
      { laenge: 80, kurve: -4 },                // Schlangenlinien
      { laenge: 80, kurve: 4 },
      { laenge: 80, kurve: -4 },
      { laenge: 150, huegel: 50 },              // großer Sprunghügel
      { laenge: 150, kurve: -2, huegel: -50 },
      { laenge: 120, kurve: 5 },
      { laenge: 200 },
      { laenge: 150, kurve: -3, huegel: 20 },
      { laenge: 150, kurve: 2 },
      { laenge: 200, huegel: -20 },
    ],
  },
  {
    name: 'Wald-Cross',
    modus: 'cross',
    beschreibung: 'Matschige Motocross-Strecke im Wald – spring über die Wassergräben!',
    runden: 3,
    tempoFaktor: 0.85,       // Cross-Motorräder sind etwas langsamer
    seed: 11,
    nebelDichte: 3,
    sonne: { x: 0.6, y: 80, r: 30 },
    wolken: true,
    tafelberge: false,
    baumSilhouetten: true,
    grabenText: 'Platsch! Mehr Gas beim Sprung!',
    farben: {
      himmelOben: '#5b8fc7',
      himmelUnten: '#d8e8f0',
      sonne: '#fffbe0',
      nebel: '#d9e3dc',
      berge: '#6d8a7a',
      huegel: '#2f6b35',
      gras1: '#3f8f34',
      gras2: '#38842f',
      strasse1: '#8b5a2b',
      strasse2: '#83542a',
      kerb1: '#6b4423',
      kerb2: '#7a4f2a',
      linie: null,           // keine weißen Linien auf der Erde
      spur: '#6e4521',       // Reifenspuren im Matsch
      rampe1: '#c99a5b',
      rampe2: '#b8874a',
      kante: '#e9d8a6',      // die Absprungkante
      graben: '#3a7bd5',     // Wasser im Graben
      grabenGlanz: '#7fb2f0',
      staub: '#7a4f2a',
    },
    deko: ['tanne', 'tanne', 'baum', 'busch', 'zuschauer'],
    plakate: ['MOTOCROSS', 'SPRING!', 'MATSCH-CUP', 'FULL GAS'],
    abschnitte: [
      { laenge: 200 },                          // Start-Ziel-Gerade
      { laenge: 80, kurve: 4 },
      { laenge: 60 },
      { sprung: 14 },                           // erster Sprung
      { laenge: 60 },
      { wellen: 5 },
      { laenge: 100, kurve: -5 },
      { laenge: 60, huegel: 15 },
      { laenge: 60, huegel: -15 },
      { laenge: 80, kurve: 3 },
      { laenge: 80 },
      { sprung: 18 },
      { laenge: 120, kurve: -3, huegel: 10 },
      { laenge: 80, kurve: 5, huegel: -10 },
      { wellen: 8 },
      { laenge: 80 },
      { sprung: 12 },                           // Doppelsprung ...
      { laenge: 40 },
      { sprung: 12 },                           // ... gleich nochmal!
      { laenge: 100, kurve: -4 },
      { laenge: 80, huegel: 20 },
      { laenge: 80, kurve: 4, huegel: -20 },
      { laenge: 150 },
      { sprung: 22 },                           // Riesensprung
      { laenge: 100, kurve: 3 },
      { wellen: 6 },
      { laenge: 120, kurve: -3 },
      { laenge: 100 },
      { laenge: 100, kurve: 4 },
      { laenge: 150 },
    ],
  },
  {
    name: 'Vulkan-Cross',
    modus: 'cross',
    beschreibung: 'Am feuerspeienden Vulkan – riesige Sprünge über heiße Lava!',
    runden: 3,
    tempoFaktor: 0.85,
    seed: 99,
    nebelDichte: 3,
    sonne: { x: 0.8, y: 70, r: 26 },
    wolken: false,
    tafelberge: false,
    baumSilhouetten: false,
    vulkan: true,
    grabenText: 'Heiße Lava! Mehr Gas!',
    farben: {
      himmelOben: '#1a0f14',
      himmelUnten: '#7a2d1c',
      sonne: '#ff8a5c',
      nebel: '#5a2a22',
      berge: '#2b1d1d',
      huegel: '#3a2622',
      gras1: '#3b3330',
      gras2: '#352d2a',
      strasse1: '#5a4636',
      strasse2: '#544131',
      kerb1: '#2a211c',
      kerb2: '#3a2e27',
      linie: null,
      spur: '#45352a',
      rampe1: '#94775c',
      rampe2: '#82664d',
      kante: '#ffd166',
      graben: '#ff5a1f',     // Lava!
      grabenGlanz: '#ffb703',
      staub: '#6b5546',
    },
    deko: ['fels', 'fels', 'totbaum', 'zuschauer'],
    plakate: ['VULKAN-CROSS', 'HEISS!', 'LAVA-SPRUNG', 'MUTIG!'],
    abschnitte: [
      { laenge: 200 },                          // Start-Ziel-Gerade
      { laenge: 60, kurve: -3 },
      { laenge: 60 },
      { sprung: 16 },
      { wellen: 6 },
      { laenge: 100, kurve: 5 },
      { laenge: 80, huegel: 25 },
      { laenge: 80, huegel: -25 },
      { laenge: 80 },
      { sprung: 20 },
      { laenge: 100, kurve: -5 },
      { laenge: 80, kurve: 5 },
      { laenge: 80 },
      { sprung: 14 },                           // Dreifachsprung!
      { laenge: 30 },
      { sprung: 14 },
      { laenge: 30 },
      { sprung: 14 },
      { laenge: 120, kurve: -4, huegel: 15 },
      { wellen: 10 },
      { laenge: 100, kurve: 6 },
      { laenge: 150 },
      { sprung: 25 },                           // Mega-Sprung über den Lavasee
      { laenge: 100, kurve: -3, huegel: -15 },
      { laenge: 80, kurve: 3 },
      { wellen: 5 },
      { laenge: 120, kurve: -4 },
      { laenge: 150 },
    ],
  },
];
