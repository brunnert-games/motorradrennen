'use strict';

// =====================================================================
//  MOTORRAD-RENNEN – das eigentliche Spiel
//
//  Wie funktioniert die 3D-Straße?
//  Die Strecke besteht aus vielen kurzen Straßenstücken (Segmenten).
//  Stücke, die weit weg sind, werden kleiner und weiter oben gemalt,
//  Stücke in der Nähe groß und unten. Wir malen von vorne nach hinten
//  ungefähr 300 Stücke – und schon sieht es aus wie eine echte Straße!
// =====================================================================

// ----- Einstellungen (hier darf man rumprobieren!) -----
const BREITE = 1024;              // Breite des Bildes in Pixeln
const HOEHE = 576;                // Höhe des Bildes in Pixeln
const SEG_LAENGE = 200;           // Länge eines Straßenstücks
const KERB_LAENGE = 3;            // Länge der rot-weißen Kerb-Streifen (in Stücken)
const STRASSEN_BREITE = 2000;     // halbe Straßenbreite
const KAMERA_HOEHE = 1000;        // wie hoch die Kamera über der Straße schwebt
const SICHTWEITE = 300;           // wie viele Straßenstücke man nach vorne sieht
const SICHTWINKEL = 100;          // Blickwinkel der Kamera in Grad
const KAMERA_TIEFE = 1 / Math.tan((SICHTWINKEL / 2) * Math.PI / 180);
const SPIELER_ABSTAND = KAMERA_HOEHE * KAMERA_TIEFE; // Abstand Kamera -> Motorrad
const SCHRITT = 1 / 60;           // das Spiel rechnet 60-mal pro Sekunde
const MAX_TEMPO = SEG_LAENGE / SCHRITT;
const BESCHLEUNIGUNG = MAX_TEMPO / 5;
const BREMSKRAFT = -MAX_TEMPO;
const AUSROLLEN = -MAX_TEMPO / 5;
const GRAS_BREMSE = -MAX_TEMPO / 2;
const GRAS_LIMIT = MAX_TEMPO / 4; // so schnell kann man auf dem Gras höchstens fahren
const FLIEHKRAFT = 0.3;           // wie stark einen die Kurve nach außen drückt
const SCHWERKRAFT = 9000;         // wie schnell man nach einem Sprung wieder runterfällt
const KMH_FAKTOR = 300 / MAX_TEMPO;
const MOTORRAD_BREITE = 0.16;     // in halben Straßenbreiten
const ZIEL_LINIE = 40;            // Straßenstück mit der Start-Ziel-Linie
const SCHRIFT = '"Trebuchet MS", system-ui, sans-serif';

// ----- Fahrer -----
const MOTORRAD_FARBEN = [
  { name: 'Rot', motorrad: '#e11d2a', anzug: '#262626', helm: '#ffffff' },
  { name: 'Blau', motorrad: '#1d6fe1', anzug: '#0d2b5c', helm: '#ffd400' },
  { name: 'Grün', motorrad: '#22b14c', anzug: '#1a1a1a', helm: '#22b14c' },
  { name: 'Gelb', motorrad: '#ffcc00', anzug: '#1b1b1b', helm: '#ffcc00' },
  { name: 'Orange', motorrad: '#ff7a00', anzug: '#2a2a2a', helm: '#ffffff' },
  { name: 'Pink', motorrad: '#ff4fb0', anzug: '#5a1a4a', helm: '#ffffff' },
  { name: 'Lila', motorrad: '#8a4dff', anzug: '#26124d', helm: '#c4a8ff' },
];

// tempo = wie schnell der Gegner im Vergleich zum schnellsten Motorrad fährt
const GEGNER_LISTE = [
  { name: 'Tom', nummer: 7, tempo: 0.95, motorrad: '#1d6fe1', anzug: '#0d2b5c', helm: '#ffd400' },
  { name: 'Lea', nummer: 12, tempo: 0.92, motorrad: '#ffcc00', anzug: '#1b1b1b', helm: '#ffcc00' },
  { name: 'Ben', nummer: 23, tempo: 0.90, motorrad: '#22b14c', anzug: '#1a1a1a', helm: '#ffffff' },
  { name: 'Mia', nummer: 31, tempo: 0.88, motorrad: '#ff4fb0', anzug: '#5a1a4a', helm: '#ffffff' },
  { name: 'Paul', nummer: 44, tempo: 0.86, motorrad: '#ff7a00', anzug: '#2a2a2a', helm: '#ff7a00' },
  { name: 'Emma', nummer: 58, tempo: 0.84, motorrad: '#8a4dff', anzug: '#26124d', helm: '#c4a8ff' },
  { name: 'Finn', nummer: 66, tempo: 0.82, motorrad: '#f4f4f4', anzug: '#333333', helm: '#e11d2a' },
];

// Schwierigkeitsstufen:
//   faktor       : wie schnell die Gegner fahren (1 = so schnell wie dein Motorrad)
//   kurvenBremse : wie stark die Gegner in Kurven langsamer werden
//   reichweite   : wie weit ein voller Tank reicht (in Runden, bei Vollgas)
//   kanister     : wie viele Benzinkanister pro Runde auf der Strecke liegen
//   fuellung     : wie viel ein Kanister nachfüllt (0.3 = 30 %)
const STUFEN = [
  { name: '🐢 Leicht', info: 'viele Kanister', faktor: 0.93, kurvenBremse: 0.02, reichweite: 1.6, kanister: 5, fuellung: 0.35 },
  { name: '🐇 Mittel', info: 'einige Kanister', faktor: 0.99, kurvenBremse: 0.012, reichweite: 1.25, kanister: 4, fuellung: 0.3 },
  { name: '🚀 Schwer', info: 'wenige Kanister', faktor: 1.04, kurvenBremse: 0.006, reichweite: 1.0, kanister: 3, fuellung: 0.3 },
];

// ----- Zustand -----
const leinwand = document.getElementById('leinwand');
leinwand.width = BREITE;
leinwand.height = HOEHE;
const ctx = leinwand.getContext('2d');

const tasten = {};
let strecke = null;      // die gebaute Strecke mit allen Segmenten
let hintergrund = null;  // vorgemalte Berge, Hügel, Wolken
let spiel = null;        // alles, was sich während des Rennens ändert
let gewaehlteStrecke = 0;
let gewaehlteFarbe = 0;
let gewaehlteStufe = 1;

// ----- kleine Rechen-Helfer -----
function begrenzen(wert, min, max) { return Math.max(min, Math.min(max, wert)); }
function rundum(z, laenge) { z %= laenge; return z < 0 ? z + laenge : z; }
function abstand(von, bis, laenge) {
  const d = rundum(bis - von, laenge);
  return d > laenge / 2 ? d - laenge : d;
}
function mischen(a, b, p) { return a + (b - a) * p; }
function sanftRein(a, b, p) { return a + (b - a) * p * p; }
function sanftRaus(a, b, p) { return a + (b - a) * (1 - (1 - p) * (1 - p)); }
function sanftReinRaus(a, b, p) { return a + (b - a) * (0.5 - Math.cos(p * Math.PI) / 2); }
function ueberlappen(x1, b1, x2, b2) { return Math.abs(x1 - x2) < (b1 + b2) / 2; }
function nebelFaktor(entfernung, dichte) { return 1 / Math.exp(entfernung * entfernung * dichte); }
function zufallsGenerator(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function zeitText(sekunden) {
  if (sekunden == null) return '–:––';
  const m = Math.floor(sekunden / 60);
  return m + ':' + (sekunden - m * 60).toFixed(1).padStart(4, '0');
}
function fahrerFarben(roh) {
  return {
    motorrad: roh.motorrad,
    motorradDunkel: abdunkeln(roh.motorrad, 0.7),
    motorradHell: aufhellen(roh.motorrad, 0.35),
    anzug: roh.anzug,
    anzugDunkel: abdunkeln(roh.anzug, 0.75),
    helm: roh.helm,
    helmHell: aufhellen(roh.helm, 0.5),
    helmDunkel: abdunkeln(roh.helm, 0.65),
  };
}

// =====================================================================
//  STRECKE BAUEN
// =====================================================================
function streckeBauen(def) {
  const segmente = [];
  let hoehe = 0;

  function stueck(kurve, neueHoehe, extra) {
    const n = segmente.length;
    const alteHoehe = n === 0 ? 0 : segmente[n - 1].p2.welt.y;
    segmente.push(Object.assign({
      index: n,
      p1: { welt: { y: alteHoehe, z: n * SEG_LAENGE }, kam: {}, bild: {} },
      p2: { welt: { y: neueHoehe, z: (n + 1) * SEG_LAENGE }, kam: {}, bild: {} },
      kurve,
      hell: Math.floor(n / KERB_LAENGE) % 2 === 0,
      deko: [],
      fahrer: [],
      nebel: 1,
      clip: HOEHE,
    }, extra));
  }

  // Ein Abschnitt: die Kurve wird sanft stärker, bleibt, und wird sanft wieder schwächer
  function abschnitt(laenge, kurve, huegel) {
    laenge = Math.max(4, Math.round(laenge));
    const start = hoehe;
    const ende = hoehe + huegel * SEG_LAENGE;
    const rein = Math.round(laenge / 4);
    const raus = rein;
    for (let i = 0; i < laenge; i++) {
      let k = kurve;
      if (i < rein) k = sanftRein(0, kurve, i / rein);
      else if (i >= laenge - raus) k = sanftRaus(kurve, 0, (i - (laenge - raus)) / raus);
      stueck(k, sanftReinRaus(start, ende, (i + 1) / laenge));
    }
    hoehe = ende;
  }

  // Eine Sprungschanze: steile Rampe hoch, ein Graben (Wasser oder Lava),
  // dann eine Landerampe wieder runter. weite = Breite des Grabens.
  function sprung(weite) {
    weite = Math.max(6, Math.round(weite));
    const basis = hoehe;
    const rampenHoehe = weite * 0.4 * SEG_LAENGE;
    const anlauf = Math.round(weite * 0.8);
    for (let i = 0; i < anlauf; i++) {
      stueck(0, basis + (rampenHoehe * (i + 1)) / anlauf, { rampe: true, kante: i === anlauf - 1 });
    }
    stueck(0, basis - 100, { graben: true });                       // Kante runter
    for (let i = 0; i < weite - 2; i++) stueck(0, basis - 100, { graben: true, wasser: true });
    stueck(0, basis + rampenHoehe * 0.8, { graben: true, rampe: true }); // Wand der Landerampe
    const landung = Math.max(15, weite);
    for (let i = 0; i < landung; i++) {
      stueck(0, basis + rampenHoehe * 0.8 * (1 - (i + 1) / landung), { rampe: true });
    }
  }

  // Wellen: viele kleine Buckel hintereinander
  function wellen(anzahl) {
    const basis = hoehe;
    const buckel = 14;
    for (let b = 0; b < anzahl; b++) {
      for (let i = 0; i < buckel; i++) {
        stueck(0, basis + 1.2 * SEG_LAENGE * (0.5 - Math.cos((2 * Math.PI * (i + 1)) / buckel) / 2), { welle: true });
      }
    }
  }

  for (const a of def.abschnitte) {
    if (a.sprung) sprung(a.sprung);
    else if (a.wellen) wellen(a.wellen);
    else abschnitt(a.laenge, a.kurve || 0, a.huegel || 0);
  }
  abschnitt(120, 0, -hoehe / SEG_LAENGE); // zurück auf Starthöhe

  dekoVerteilen(segmente, def);
  return { segmente, laenge: segmente.length * SEG_LAENGE };
}

// offset: wo die Deko steht. -1 / +1 = linker / rechter Straßenrand, größer = weiter weg
function dekoVerteilen(segmente, def) {
  const zufall = zufallsGenerator(def.seed || 1);
  const cross = def.modus === 'cross';
  const anzahl = segmente.length;
  const neu = (i, typ, offset, extra) => {
    if (i >= 0 && i < anzahl) segmente[i].deko.push(Object.assign({ typ, offset }, extra));
  };

  // Start-Ziel-Bereich: Tribünen links, Fahnen rechts
  for (let i = 5; i < 175; i += 42) neu(i, 'tribuene', -1.35);
  for (let i = anzahl - 40; i < anzahl; i += 42) neu(i, 'tribuene', -1.35);
  for (let i = 8; i < 175; i += 10) {
    neu(i, 'fahne', 1.3, { farbe: FAN_FARBEN[Math.floor(zufall() * FAN_FARBEN.length)] });
  }

  // Werbeplakate
  let p = 0;
  for (let i = 230; i < anzahl - 80; i += 260) {
    neu(i, 'plakat', (p % 2 ? 1 : -1) * 1.5, { text: def.plakate[p % def.plakate.length] });
    p++;
  }

  // Kurven: Pfeil-Schilder vor der Kurve, Reifenstapel außen
  for (let i = 1; i < anzahl; i++) {
    const k = segmente[i].kurve;
    const vorher = segmente[i - 1].kurve;
    const aussen = k > 0 ? -1 : 1;
    if (Math.abs(k) > 1.5 && Math.abs(vorher) <= 1.5) {
      for (let j = 0; j < 5; j++) neu(i - 6 + j * 6, 'schild', aussen * 1.25, { richtung: Math.sign(k) });
    }
    if (Math.abs(k) > 2.5 && i % 8 === 0) {
      if (cross) neu(i, 'strohballen', aussen * 1.3);
      else neu(i, 'reifen', aussen * 2.0);
    }
  }

  // Sprünge: Warnschilder vorher, Strohballen an beiden Seiten der Schanze
  for (let i = 1; i < anzahl; i++) {
    const vorher = segmente[i - 1];
    if (!segmente[i].rampe || vorher.rampe || vorher.graben) continue;
    for (const seite of [-1, 1]) {
      neu(i - 40, 'sprungschild', seite * 1.25);
      neu(i - 20, 'sprungschild', seite * 1.25);
    }
    for (let j = i; j < anzahl && (segmente[j].rampe || segmente[j].graben); j += 4) {
      neu(j, 'strohballen', -1.2);
      neu(j, 'strohballen', 1.2);
    }
  }

  // Landschaft
  for (let i = 175; i < anzahl - 40; i++) {
    for (const seite of [-1, 1]) {
      if (zufall() < 0.14) {
        const typ = def.deko[Math.floor(zufall() * def.deko.length)];
        neu(i, typ, seite * (2.4 + zufall() * 3));
      }
    }
  }
}

function segmentBei(z) {
  const segs = strecke.segmente;
  return segs[Math.floor(rundum(z, strecke.laenge) / SEG_LAENGE) % segs.length];
}

// Wie hoch ist der Boden an dieser Stelle?
function bodenHoehe(z) {
  const seg = segmentBei(z);
  return mischen(seg.p1.welt.y, seg.p2.welt.y, rundum(z, SEG_LAENGE) / SEG_LAENGE);
}

// Springen und Fallen – gilt für dich und für die Gegner.
// Fällt der Boden schneller weg, als man herunterfällt, fliegt man!
// Gibt die Flugzeit zurück, wenn man gerade gelandet ist (sonst 0).
function hoehePhysik(o, dt) {
  const seg = segmentBei(o.z);
  const boden = bodenHoehe(o.z);
  o.vy -= SCHWERKRAFT * dt;
  o.y += o.vy * dt;
  if (o.y > boden) {
    o.luftZeit += dt;
    if (o.y - boden > 20) o.inLuft = true;
    return 0;
  }
  const flugZeit = o.luftZeit;
  o.y = boden;
  o.vy = ((seg.p2.welt.y - seg.p1.welt.y) / SEG_LAENGE) * o.tempo; // am Boden fährt man den Hang entlang
  o.inLuft = false;
  o.luftZeit = 0;
  return flugZeit;
}

// Wer im Graben landet, wird ans Ende des Grabens gesetzt
function grabenVerlassen(o) {
  let seg = segmentBei(o.z);
  let schritte = 0;
  while (seg.graben) {
    seg = strecke.segmente[(seg.index + 1) % strecke.segmente.length];
    schritte++;
  }
  o.z += schritte * SEG_LAENGE - rundum(o.z, SEG_LAENGE);
  o.y = bodenHoehe(o.z);
  o.vy = 0;
  o.inLuft = false;
  o.luftZeit = 0;
}

function inSegmentEinordnen(g) {
  const seg = segmentBei(g.z);
  if (g.seg === seg) return;
  if (g.seg) g.seg.fahrer.splice(g.seg.fahrer.indexOf(g), 1);
  seg.fahrer.push(g);
  g.seg = seg;
}

// =====================================================================
//  RENNEN STARTEN
//  modus 'rennen' = echtes Rennen, 'demo' = fährt allein im Hintergrund vom Menü
// =====================================================================
function neuesRennen(modus) {
  const def = STRECKEN[gewaehlteStrecke];
  strecke = streckeBauen(def);
  hintergrund = erzeugeHintergrund(def, BREITE, HOEHE);
  hintergrund.himmel = ctx.createLinearGradient(0, 0, 0, HOEHE / 2);
  hintergrund.himmel.addColorStop(0, def.farben.himmelOben);
  hintergrund.himmel.addColorStop(1, def.farben.himmelUnten);

  // Startaufstellung: immer zwei nebeneinander, du stehst ganz hinten
  const startPlatz = (i) => ({
    z: (ZIEL_LINIE - 3 - Math.floor(i / 2) * 4) * SEG_LAENGE,
    x: i % 2 === 0 ? -0.4 : 0.4,
  });
  const ich = startPlatz(GEGNER_LISTE.length);
  const demo = modus === 'demo';
  const tempoFaktor = def.tempoFaktor || 1;
  const klang = def.modus === 'cross' ? 'cross' : 'rennen';
  Ton.klangWaehlen(klang);

  spiel = {
    def,
    cross: def.modus === 'cross',
    zustand: demo ? 'demo' : 'countdown',
    countdown: 3.6,
    letzteZahl: 4,
    z: ich.z,
    x: ich.x,
    y: 0,             // Höhe über dem Meer (zum Springen)
    vy: 0,            // Geschwindigkeit nach oben
    inLuft: false,
    luftZeit: 0,
    kamVersatz: 0,    // beim Springen hinkt die Kamera etwas hinterher
    spruenge: 0,
    stufe: STUFEN[gewaehlteStufe],
    sprit: 1,         // 1 = voller Tank, 0 = leer
    spritWarnung: false,
    kanisterGesammelt: 0,
    partikel: [],     // Staub und Dreck
    maxTempo: MAX_TEMPO * tempoFaktor,
    motor: new Motor(MOTOR_KLANG[klang]),
    tempo: 0,
    neigung: 0,
    bremst: false,
    gas: false,
    zeit: 0,
    rundenStart: 0,
    runde: 0,
    rundenZeiten: [],
    besteRunde: null,
    platz: GEGNER_LISTE.length + 1,
    endPlatz: 0,
    zielTimer: 0,
    versatz: { himmel: 0, berge: 0, huegel: 0 },
    wackeln: 0,
    meldung: null,
    pause: false,
    farben: fahrerFarben(MOTORRAD_FARBEN[gewaehlteFarbe]),
    gegner: [],
  };

  spiel.kanister = kanisterVerteilen(def, spiel.stufe);
  const faktor = STUFEN[gewaehlteStufe].faktor * tempoFaktor * (demo ? 0.75 : 1);
  GEGNER_LISTE.forEach((g, i) => {
    const p = startPlatz(i);
    const gegner = {
      name: g.name,
      nummer: g.nummer,
      farben: fahrerFarben(g),
      z: p.z,
      x: p.x,
      y: 0,
      vy: 0,
      inLuft: false,
      luftZeit: 0,
      motor: new Motor(MOTOR_KLANG[klang]),
      spur: p.x,
      tempo: 0,
      maxTempo: g.tempo * faktor * MAX_TEMPO,
      neigung: 0,
      bremst: false,
      seg: null,
    };
    spiel.gegner.push(gegner);
    inSegmentEinordnen(gegner);
  });
}

// Benzinkanister gleichmäßig über die Runde verteilen – mal links, mal rechts,
// damit man gezielt hinlenken muss.
function kanisterVerteilen(def, stufe) {
  const segs = strecke.segmente;
  const zufall = zufallsGenerator((def.seed || 1) * 31 + stufe.kanister);
  const luecke = (segs.length - 150) / stufe.kanister;
  const liste = [];
  for (let i = 0; i < stufe.kanister; i++) {
    let nr = Math.round(150 + luecke * (i + 0.5));
    while (!guterKanisterPlatz(segs, nr) && nr < segs.length - 1) nr++;
    const kanister = {
      z: (nr + 0.5) * SEG_LAENGE,
      x: [-0.6, 0.6, -0.3, 0.3, 0][Math.floor(zufall() * 5)],
      gesammeltBei: -Infinity,  // nach dem Einsammeln ist er erst in der nächsten Runde wieder da
    };
    segs[nr].kanister = kanister;
    liste.push(kanister);
  }
  return liste;
}

// Ein Kanister muss erreichbar sein: keine enge Kurve (die Fliehkraft trägt einen
// sonst vorbei) und nicht dort, wo man nach einer Schanze oder Welle noch fliegt.
function guterKanisterPlatz(segs, nr) {
  for (let i = nr - 90; i <= nr + 5; i++) {
    const seg = segs[(i + segs.length) % segs.length];
    if (seg.rampe || seg.graben || seg.welle) return false;
  }
  for (let i = nr - 40; i <= nr + 5; i++) {   // genug gerader Anlauf, um hinzulenken
    if (Math.abs(segs[(i + segs.length) % segs.length].kurve) > 1.5) return false;
  }
  return true;
}

function kanisterDa(k) {
  return spiel.z - k.gesammeltBei > strecke.laenge / 2;
}

function meldung(text, dauer, gross = false) {
  spiel.meldung = { text, zeit: dauer, dauer, gross };
}

// =====================================================================
//  SPIEL-LOGIK (60-mal pro Sekunde)
// =====================================================================
function aktualisieren(dt) {
  const s = spiel;
  const L = strecke.laenge;
  const seg = segmentBei(s.z);
  const tempoProzent = s.tempo / MAX_TEMPO;
  const lenkung = dt * 2 * tempoProzent;

  // Countdown 3 - 2 - 1 - LOS!
  if (s.zustand === 'countdown') {
    s.countdown -= dt;
    const zahl = Math.ceil(s.countdown);
    if (zahl !== s.letzteZahl && zahl <= 3) {
      s.letzteZahl = zahl;
      if (zahl > 0) {
        meldung(String(zahl), 0.9, true);
        Ton.piep(440, 0.15);
      } else {
        s.zustand = 'rennen';
        meldung('LOS!', 1.2, true);
        Ton.piep(880, 0.45);
      }
    }
  }
  if (s.zustand === 'rennen') s.zeit += dt;

  // Steuerung: Tasten im Rennen, sonst fährt der Autopilot
  let gas = false, bremse = false, links = false, rechts = false;
  if (s.zustand === 'rennen') {
    gas = tasten.ArrowUp || tasten.KeyW;
    bremse = tasten.ArrowDown || tasten.KeyS || tasten.Space;
    links = tasten.ArrowLeft || tasten.KeyA;
    rechts = tasten.ArrowRight || tasten.KeyD;
  } else if (s.zustand === 'demo' || s.zustand === 'ziel') {
    const autopilotTempo = s.cross ? 0.75 : s.zustand === 'demo' ? 0.55 : 0.45;
    gas = s.tempo < s.maxTempo * autopilotTempo;
    const zielX = seg.kurve * 0.05;
    links = s.x > zielX + 0.05;
    rechts = s.x < zielX - 0.05;
  }
  s.gas = gas;
  s.bremst = bremse;
  const laut = s.zustand !== 'demo';

  // Ohne Sprit fährt man auf Reserve: der Motor stottert und schafft nur noch 40 % Tempo
  const leer = s.sprit <= 0 && s.zustand === 'rennen';
  const stottert = leer && gas && Math.random() < 0.4;
  const reserveTempo = s.maxTempo * 0.4;

  // Bewegen. In der Luft kann man nur wenig lenken und nicht Gas geben.
  s.z += dt * s.tempo;
  const lenkKraft = s.inLuft ? 0.5 : 1;
  if (links) s.x -= lenkung * lenkKraft;
  else if (rechts) s.x += lenkung * lenkKraft;
  if (!s.inLuft) {
    s.x -= lenkung * tempoProzent * seg.kurve * FLIEHKRAFT;
    if (gas && leer) {
      // Reserve: langsam bis 40 % beschleunigen – setzt der Motor kurz aus, hält man nur das Tempo
      if (s.tempo > reserveTempo) s.tempo = Math.max(reserveTempo, s.tempo + AUSROLLEN * dt);
      else if (!stottert) s.tempo = Math.min(reserveTempo, s.tempo + BESCHLEUNIGUNG * 0.6 * dt);
    } else if (gas) s.tempo += BESCHLEUNIGUNG * dt;
    else if (bremse) s.tempo += BREMSKRAFT * dt;
    else s.tempo += AUSROLLEN * dt;
  }

  // Springen, Landen und in den Graben fallen
  const yVorher = s.y;
  const flugZeit = hoehePhysik(s, dt);
  if (flugZeit > 0.15) {
    staubSpruehen(s, 30, true);
    if (laut) Ton.krach(0.15, 0.3);
    if (flugZeit > 0.5 && s.zustand === 'rennen') {
      s.spruenge++;
      meldung(flugZeit > 1 ? 'Mega-Sprung!' : 'Super Sprung!', 1.2);
    }
  }
  if (!s.inLuft && segmentBei(s.z).graben) {
    grabenVerlassen(s);
    s.tempo = s.maxTempo * 0.12;
    s.wackeln = 0.6;
    if (laut) Ton.krach(0.6, 0.5);
    if (s.zustand === 'rennen') meldung(s.def.grabenText || 'Platsch!', 1.6);
  }

  // Kamera: am Boden klebt sie am Motorrad, in der Luft fliegt sie etwas hinterher
  if (s.inLuft) {
    const kamera = yVorher + s.kamVersatz;
    s.kamVersatz = kamera + (s.y - kamera) * Math.min(1, dt * 4) - s.y;
  } else {
    s.kamVersatz *= Math.exp(-dt * 10);
  }
  s.kamVersatz = begrenzen(s.kamVersatz, -900, 40);

  // Dreck spritzt hinter dem Hinterrad hoch
  if (s.cross && gas && !s.inLuft && s.tempo > 500) staubSpruehen(s, 1, false);
  for (const p of s.partikel) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 600 * dt;
    p.leben -= dt;
  }
  s.partikel = s.partikel.filter((p) => p.leben > 0);

  // Sprit verbrauchen: mit Gas mehr, beim Rollen weniger
  if (s.zustand === 'rennen' && s.sprit > 0) {
    const gefahren = (dt * s.tempo) / SEG_LAENGE;
    const tankReichweite = (L / SEG_LAENGE) * s.stufe.reichweite;
    s.sprit = Math.max(0, s.sprit - (gefahren * (gas ? 1 : 0.3)) / tankReichweite);
    if (s.sprit < 0.2 && !s.spritWarnung) {
      s.spritWarnung = true;
      meldung('Sprit wird knapp!', 1.5);
      Ton.piep(330, 0.25);
    }
    if (s.sprit === 0) {
      meldung('Tank leer! Sammle einen Kanister!', 2.5);
      Ton.piep(220, 0.5);
    }
  }

  // Benzinkanister einsammeln (drüberfahren!)
  for (const k of s.kanister) {
    if (s.zustand !== 'rennen' || !kanisterDa(k)) continue;
    const d = abstand(s.z, k.z, L);
    if (Math.abs(d) < SEG_LAENGE * 0.6 && ueberlappen(s.x, MOTORRAD_BREITE, k.x, 0.22) && s.y - bodenHoehe(s.z) < 300) {
      k.gesammeltBei = s.z;
      s.sprit = Math.min(1, s.sprit + s.stufe.fuellung);
      s.kanisterGesammelt++;
      if (s.sprit >= 0.2) s.spritWarnung = false;
      meldung(`⛽ +${Math.round(s.stufe.fuellung * 100)} %`, 1);
      if (laut) {
        Ton.piep(880, 0.08);
        setTimeout(() => Ton.piep(1320, 0.15), 90);
      }
    }
  }

  // Neben der Straße: Gras bremst, gegen Bäume prallt man
  if (Math.abs(s.x) > 1 && !s.inLuft) {
    if (s.tempo > GRAS_LIMIT) s.tempo += GRAS_BREMSE * dt;
    if (s.tempo > 1000) s.wackeln = Math.max(s.wackeln, 0.1);
    for (const d of seg.deko) {
      const info = DEKO[d.typ];
      if (!info.hart) continue;
      const b = info.breite / STRASSEN_BREITE;
      if (ueberlappen(s.x, MOTORRAD_BREITE, d.offset + Math.sign(d.offset) * b / 2, b)) {
        unfall();
        break;
      }
    }
  }

  // Von hinten auf einen Gegner auffahren
  for (const g of s.gegner) {
    const d = abstand(s.z, g.z, L);
    if (d > 0 && d < SEG_LAENGE * 0.7 && s.tempo > g.tempo && Math.abs(s.y - g.y) < 300 &&
        ueberlappen(s.x, MOTORRAD_BREITE, g.x, MOTORRAD_BREITE)) {
      s.tempo = g.tempo * 0.8;
      s.z += d - SEG_LAENGE * 0.7;
      s.wackeln = 0.3;
      if (laut) Ton.krach(0.15, 0.3);
      break;
    }
  }

  s.x = begrenzen(s.x, -3, 3);
  s.tempo = begrenzen(s.tempo, 0, s.maxTempo);

  // Hintergrund verschiebt sich in Kurven (weit weg = langsamer)
  const stuecke = (dt * s.tempo) / SEG_LAENGE;
  s.versatz.himmel += 0.001 * seg.kurve * stuecke;
  s.versatz.berge += 0.002 * seg.kurve * stuecke;
  s.versatz.huegel += 0.003 * seg.kurve * stuecke;

  // Schräglage: in die Kurve legen
  const lenkRichtung = (rechts ? 1 : 0) - (links ? 1 : 0);
  const zielNeigung = begrenzen((lenkRichtung * 0.35 + seg.kurve * 0.08) * tempoProzent, -0.75, 0.75);
  s.neigung += (zielNeigung - s.neigung) * Math.min(1, dt * 5);
  s.wackeln = Math.max(0, s.wackeln - dt);

  gegnerBewegen(dt);
  rennstandPruefen(dt);

  if (s.meldung) {
    s.meldung.zeit -= dt;
    if (s.meldung.zeit <= 0) s.meldung = null;
  }

  // Motor: in der Luft und beim Countdown dreht das Hinterrad frei – da kann man den Motor aufheulen lassen
  const countdown = s.zustand === 'countdown';
  const motorGas = countdown ? !!(tasten.ArrowUp || tasten.KeyW) : gas && !stottert;
  s.motor.aktualisieren(dt, s.tempo / s.maxTempo, motorGas, s.inLuft || countdown);
  if (laut) Ton.spielen(s.motor, naechsterGegnerKlang(), s.tempo / MAX_TEMPO, s.inLuft);
  else Ton.stille();
}

// Den nächsten Gegner hört man auch: je näher, desto lauter, und von links oder rechts.
// Kommt er näher, klingt er etwas höher, fährt er weg, etwas tiefer (Doppler-Effekt).
function naechsterGegnerKlang() {
  const s = spiel;
  let naechster = null, entfernung = Infinity, dz = 0;
  for (const g of s.gegner) {
    const z = abstand(s.z, g.z, strecke.laenge);
    const d = Math.hypot(z, (g.x - s.x) * STRASSEN_BREITE);
    if (d < entfernung) {
      naechster = g;
      entfernung = d;
      dz = z;
    }
  }
  if (!naechster || entfernung > 30 * SEG_LAENGE) return null;
  const annaeherung = dz > 0 ? s.tempo - naechster.tempo : naechster.tempo - s.tempo;
  return {
    motor: naechster.motor,
    lautstaerke: 1 / (1 + (entfernung / 1500) ** 2),
    pan: begrenzen(((naechster.x - s.x) * 1.5) / (1 + Math.abs(dz) / 1500), -1, 1),
    tonhoehe: SCHALL_TEMPO / (SCHALL_TEMPO - begrenzen(annaeherung, -20000, 20000)),
  };
}

function staubSpruehen(s, anzahl, stark) {
  const farbe = s.def.farben.staub || s.def.farben.gras2;
  for (let i = 0; i < anzahl; i++) {
    s.partikel.push({
      x: BREITE / 2 + (Math.random() - 0.5) * 30,
      y: HOEHE - 18,
      vx: (Math.random() - 0.5) * (stark ? 500 : 220),
      vy: -Math.random() * (stark ? 260 : 160),
      leben: 0.4 + Math.random() * 0.3,
      r: 3 + Math.random() * 5,
      farbe,
    });
  }
}

function unfall() {
  const s = spiel;
  s.tempo = Math.min(s.tempo, MAX_TEMPO / 5);
  s.z -= rundum(s.z, SEG_LAENGE);   // zurück an den Anfang des Straßenstücks
  s.x -= Math.sign(s.x) * 0.15;     // und ein Stück Richtung Straße
  if (s.wackeln < 0.3 && s.zustand !== 'demo') {
    Ton.krach();
    if (s.zustand === 'rennen') meldung('Autsch!', 0.8);
  }
  s.wackeln = 0.6;
}

function gegnerBewegen(dt) {
  const s = spiel;
  const L = strecke.laenge;
  const alle = [{ z: s.z, x: s.x, tempo: s.tempo }, ...s.gegner];

  for (const g of s.gegner) {
    const seg = segmentBei(g.z);

    // In Kurven etwas langsamer, beim Countdown stehen bleiben
    let ziel = 0;
    if (s.zustand !== 'countdown') ziel = g.maxTempo * (1 - Math.abs(seg.kurve) * s.stufe.kurvenBremse);
    if (g.tempo < ziel) g.tempo = Math.min(ziel, g.tempo + BESCHLEUNIGUNG * 0.85 * dt);
    else g.tempo = Math.max(ziel, g.tempo + AUSROLLEN * 2 * dt);
    g.bremst = g.tempo > ziel + 50;

    // Ist vorne jemand Langsameres? Dann ausweichen!
    let ausweichen = 0;
    for (const a of alle) {
      if (a === g) continue;
      const d = abstand(g.z, a.z, L);
      if (d <= 0 || d > SEG_LAENGE * 15 || g.tempo <= a.tempo) continue;
      if (!ueberlappen(g.x, MOTORRAD_BREITE * 1.6, a.x, MOTORRAD_BREITE * 1.6)) continue;
      ausweichen = a.x > 0.4 ? -1 : a.x < -0.4 ? 1 : g.x >= a.x ? 1 : -1;
      if (d < SEG_LAENGE * 0.8) g.tempo = a.tempo * 0.97; // zu dicht dran: abbremsen
      break;
    }
    if (ausweichen) g.x += ausweichen * dt * 0.9;
    else g.x += (g.spur - g.x) * dt * 0.2;
    if (Math.random() < dt * 0.1) g.spur = Math.random() * 1.2 - 0.6; // ab und zu die Spur wechseln
    g.x = begrenzen(g.x, -0.8, 0.8);

    g.z += g.tempo * dt;
    hoehePhysik(g, dt);
    // beim Countdown lassen die Gegner ihre Motoren aufheulen
    const countdown = s.zustand === 'countdown';
    const gGas = countdown ? Math.sin(s.countdown * 7 + g.nummer) > 0.4 : !g.bremst;
    g.motor.aktualisieren(dt, g.tempo / s.maxTempo, gGas, g.inLuft || countdown);
    if (!g.inLuft && segmentBei(g.z).graben) {
      grabenVerlassen(g);
      g.tempo *= 0.6;
    }
    const zielNeigung = (seg.kurve * 0.08 + ausweichen * 0.15) * (g.tempo / MAX_TEMPO);
    g.neigung += (zielNeigung - g.neigung) * Math.min(1, dt * 4);
    inSegmentEinordnen(g);
  }
}

function rennstandPruefen(dt) {
  const s = spiel;
  if (s.zustand === 'demo') return;
  const L = strecke.laenge;
  const linie = ZIEL_LINIE * SEG_LAENGE;
  const runden = s.def.runden;
  const fortschritt = s.z - linie;

  if (s.zustand === 'ziel') {
    s.zielTimer -= dt;
    if (s.zielTimer <= 0 && !s.ergebnisGezeigt) {
      s.ergebnisGezeigt = true;
      ergebnisZeigen();
    }
    return;
  }

  // Platz: wie viele Gegner sind weiter als ich?
  let platz = 1;
  for (const g of s.gegner) if (g.z - linie > fortschritt) platz++;
  s.platz = platz;

  // Runde geschafft?
  const geschafft = Math.max(0, Math.floor(fortschritt / L));
  if (s.zustand !== 'rennen' || geschafft <= s.runde) return;
  s.runde = geschafft;
  const rundenZeit = s.zeit - s.rundenStart;
  s.rundenStart = s.zeit;
  s.rundenZeiten.push(rundenZeit);
  const neueBeste = s.besteRunde === null || rundenZeit < s.besteRunde;
  if (neueBeste) s.besteRunde = rundenZeit;

  if (s.runde >= runden) {
    s.zustand = 'ziel';
    s.endPlatz = platz;
    s.zielTimer = 2.5;
    s.rangliste = [
      { name: 'Du', nummer: 1, du: true, f: fortschritt },
      ...s.gegner.map((g) => ({ name: g.name, nummer: g.nummer, f: g.z - linie })),
    ].sort((a, b) => b.f - a.f);
    s.neuerRekord = bestzeitSpeichern(gewaehlteStrecke, s.zeit);
    meldung(platz === 1 ? 'SIEG!' : 'ZIEL!', 2.5, true);
    Ton.fanfare();
  } else if (s.runde === runden - 1) {
    meldung('Letzte Runde!', 2);
    Ton.piep(660, 0.3);
  } else {
    meldung(`Runde ${s.runde + 1}` + (neueBeste && s.runde > 1 ? ' – Bestzeit!' : ''), 2);
    Ton.piep(660, 0.3);
  }
}

// =====================================================================
//  MALEN
// =====================================================================
function projizieren(p, kameraX, kameraY, kameraZ) {
  p.kam.x = -kameraX;
  p.kam.y = p.welt.y - kameraY;
  p.kam.z = p.welt.z - kameraZ;
  p.bild.scale = KAMERA_TIEFE / p.kam.z;
  p.bild.x = Math.round(BREITE / 2 + p.bild.scale * p.kam.x * BREITE / 2);
  p.bild.y = Math.round(HOEHE / 2 - p.bild.scale * p.kam.y * HOEHE / 2);
  p.bild.w = Math.round(p.bild.scale * STRASSEN_BREITE * BREITE / 2);
}

function viereck(x1, y1, x2, y2, x3, y3, x4, y4, farbe) {
  flaeche(ctx, farbe, [x1, y1, x2, y2, x3, y3, x4, y4]);
}

function zeichnen() {
  const s = spiel;
  const L = strecke.laenge;
  const segs = strecke.segmente;
  const f = s.def.farben;

  const kameraZ = rundum(s.z - SPIELER_ABSTAND, L);
  const basis = segmentBei(kameraZ);
  const basisProzent = rundum(kameraZ, SEG_LAENGE) / SEG_LAENGE;
  const spielerSeg = segmentBei(s.z);
  const kameraY = s.y + s.kamVersatz + KAMERA_HOEHE;
  const malMotorrad = s.cross ? zeichneCrossMotorrad : zeichneMotorrad;

  hintergrundZeichnen(s, f);

  // 1. Die Straße von vorne nach hinten
  let maxy = HOEHE;
  let x = 0;
  let dx = -(basis.kurve * basisProzent);
  for (let n = 0; n < SICHTWEITE; n++) {
    const seg = segs[(basis.index + n) % segs.length];
    const kz = kameraZ - (seg.index < basis.index ? L : 0); // hinter der Ziellinie geht's von vorne los
    seg.nebel = nebelFaktor(n / SICHTWEITE, s.def.nebelDichte);
    seg.clip = maxy;
    projizieren(seg.p1, s.x * STRASSEN_BREITE - x, kameraY, kz);
    projizieren(seg.p2, s.x * STRASSEN_BREITE - x - dx, kameraY, kz);
    x += dx;
    dx += seg.kurve;
    if (seg.p1.kam.z <= KAMERA_TIEFE ||      // hinter uns
        seg.p2.bild.y >= seg.p1.bild.y ||    // Rückseite eines Hügels
        seg.p2.bild.y >= maxy) continue;     // von einem Hügel verdeckt
    segmentZeichnen(seg, f);
    maxy = seg.p1.bild.y;
  }

  // 2. Deko und Motorräder von hinten nach vorne (damit Nahes vor Fernem ist)
  for (let n = SICHTWEITE - 1; n > 0; n--) {
    const seg = segs[(basis.index + n) % segs.length];
    if (seg.p1.kam.z <= KAMERA_TIEFE) continue;
    const ppe = (seg.p1.bild.scale * BREITE) / 2; // Pixel pro Welt-Einheit

    for (const d of seg.deko) {
      const pxBreite = DEKO[d.typ].breite * ppe;
      if (pxBreite < 1.5) continue;
      const sx = seg.p1.bild.x + ppe * d.offset * STRASSEN_BREITE + (Math.sign(d.offset) * pxBreite) / 2;
      if (sx + pxBreite < 0 || sx - pxBreite > BREITE) continue;
      dekoMalen(ctx, d, sx, seg.p1.bild.y, pxBreite, seg.clip, seg.nebel);
    }

    if (seg.index === ZIEL_LINIE) zielTorMalen(seg);

    if (seg.kanister && kanisterDa(seg.kanister)) {
      const ppeK = (mischen(seg.p1.bild.scale, seg.p2.bild.scale, 0.5) * BREITE) / 2;
      const kx = mischen(seg.p1.bild.x, seg.p2.bild.x, 0.5) + ppeK * seg.kanister.x * STRASSEN_BREITE;
      const ky = mischen(seg.p1.bild.y, seg.p2.bild.y, 0.5);
      if (350 * ppeK > 2) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, BREITE, seg.clip);
        ctx.clip();
        ctx.globalAlpha = seg.nebel;
        zeichneKanister(ctx, kx, ky, 350 * ppeK, performance.now() / 1000);
        ctx.restore();
      }
    }

    for (const g of seg.fahrer) {
      const p = rundum(g.z, SEG_LAENGE) / SEG_LAENGE;
      const ppeG = (mischen(seg.p1.bild.scale, seg.p2.bild.scale, p) * BREITE) / 2;
      const b = 300 * ppeG;
      if (b < 1) continue;
      const gx = mischen(seg.p1.bild.x, seg.p2.bild.x, p) + ppeG * g.x * STRASSEN_BREITE;
      const gy = mischen(seg.p1.bild.y, seg.p2.bild.y, p);
      const boden = mischen(seg.p1.welt.y, seg.p2.welt.y, p);
      const luft = (Math.max(0, g.y - boden) * ppeG * HOEHE) / BREITE;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, BREITE, seg.clip);
      ctx.clip();
      ctx.globalAlpha = seg.nebel;
      malMotorrad(ctx, gx, gy - luft, b, g.farben, g.neigung, g.bremst, g.nummer, luft);
      ctx.restore();
    }

    if (seg === spielerSeg) {
      const zittern = s.wackeln > 0 ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 1.5 * (s.tempo / MAX_TEMPO);
      const pixelProEinheit = HOEHE / 2 / KAMERA_HOEHE;
      const luft = Math.max(0, s.y - bodenHoehe(s.z)) * pixelProEinheit;
      const y = HOEHE - 14 + s.kamVersatz * pixelProEinheit + zittern;
      malMotorrad(ctx, BREITE / 2, y, 118, s.farben, s.neigung, s.bremst, 1, luft);
    }
  }

  // Staub und Dreck
  for (const p of s.partikel) {
    ctx.globalAlpha = Math.min(1, p.leben * 2);
    kreis(ctx, p.farbe, p.x, p.y, p.r);
  }
  ctx.globalAlpha = 1;

  hudZeichnen(s);
}

function hintergrundZeichnen(s, f) {
  ctx.fillStyle = hintergrund.himmel;
  ctx.fillRect(0, 0, BREITE, HOEHE / 2 + 2);

  // Sonne mit Leuchten
  const w2 = BREITE * 2;
  const sonne = s.def.sonne;
  const sx = rundum(BREITE * sonne.x - s.versatz.himmel * w2, w2);
  for (const x of [sx, sx - w2]) {
    const leuchten = ctx.createRadialGradient(x, sonne.y, sonne.r * 0.5, x, sonne.y, sonne.r * 3);
    leuchten.addColorStop(0, f.sonne);
    leuchten.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = leuchten;
    ctx.fillRect(x - sonne.r * 3, sonne.y - sonne.r * 3, sonne.r * 6, sonne.r * 6);
    kreis(ctx, f.sonne, x, sonne.y, sonne.r);
  }

  if (s.def.wolken) {
    ctx.globalAlpha = 0.85;
    ebeneZeichnen(hintergrund.wolken, s.versatz.himmel);
    ctx.globalAlpha = 1;
  }
  ebeneZeichnen(hintergrund.berge, s.versatz.berge);
  ebeneZeichnen(hintergrund.huegel, s.versatz.huegel);
  ctx.fillStyle = f.gras2;
  ctx.fillRect(0, HOEHE / 2 + 59, BREITE, HOEHE / 2);
}

function ebeneZeichnen(bild, versatz) {
  const ox = rundum(versatz, 1) * bild.width;
  ctx.drawImage(bild, -ox, 0);
  ctx.drawImage(bild, bild.width - ox, 0);
}

function segmentZeichnen(seg, f) {
  const a = seg.p1.bild;
  const b = seg.p2.bild;

  // Gras
  ctx.fillStyle = seg.hell ? f.gras1 : f.gras2;
  ctx.fillRect(0, b.y, BREITE, a.y - b.y);

  // Kerbs (die rot-weißen Randsteine)
  const ka = a.w * 0.12;
  const kb = b.w * 0.12;
  const kerb = seg.hell ? f.kerb1 : f.kerb2;
  viereck(a.x - a.w - ka, a.y, a.x - a.w, a.y, b.x - b.w, b.y, b.x - b.w - kb, b.y, kerb);
  viereck(a.x + a.w + ka, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x + b.w + kb, b.y, kerb);

  // Asphalt oder Erde – Rampen sind heller, im Graben ist Wasser oder Lava
  let belag = seg.hell ? f.strasse1 : f.strasse2;
  if (seg.rampe) belag = seg.hell ? f.rampe1 || '#8a8a8a' : f.rampe2 || '#808080';
  if (seg.kante) belag = f.kante || '#ffd166';
  if (seg.wasser) belag = seg.index % 3 ? f.graben || '#3a7bd5' : f.grabenGlanz || '#7fb2f0';
  viereck(a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x - b.w, b.y, belag);

  // weiße Randlinien (nur auf Asphalt)
  if (f.linie) {
    const ia = a.w * 0.04, ib = b.w * 0.04, la = a.w * 0.025, lb = b.w * 0.025;
    viereck(a.x - a.w + ia, a.y, a.x - a.w + ia + la, a.y, b.x - b.w + ib + lb, b.y, b.x - b.w + ib, b.y, f.linie);
    viereck(a.x + a.w - ia, a.y, a.x + a.w - ia - la, a.y, b.x + b.w - ib - lb, b.y, b.x + b.w - ib, b.y, f.linie);
  }

  // Reifenspuren im Matsch
  if (f.spur && !seg.wasser && !seg.kante) {
    for (const seite of [-1, 1]) {
      const innen = 0.28 * seite, aussen = 0.36 * seite;
      viereck(a.x + a.w * innen, a.y, a.x + a.w * aussen, a.y, b.x + b.w * aussen, b.y, b.x + b.w * innen, b.y, f.spur);
    }
  }

  // Start-Ziel-Linie als Schachbrett
  if (seg.index === ZIEL_LINIE || seg.index === ZIEL_LINIE + 1) {
    viereck(a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x - b.w, b.y, '#f4f4f4');
    const felder = 14;
    for (let i = 0; i < felder; i++) {
      if ((i + seg.index) % 2) continue;
      const p = i / felder;
      const q = (i + 1) / felder;
      viereck(a.x - a.w + 2 * a.w * p, a.y, a.x - a.w + 2 * a.w * q, a.y,
              b.x - b.w + 2 * b.w * q, b.y, b.x - b.w + 2 * b.w * p, b.y, '#111');
    }
  }

  // Nebel: weit entfernte Stücke verschwinden im Dunst
  if (seg.nebel < 1) {
    ctx.globalAlpha = 1 - seg.nebel;
    ctx.fillStyle = f.nebel;
    ctx.fillRect(0, b.y, BREITE, a.y - b.y);
    ctx.globalAlpha = 1;
  }
}

function zielTorMalen(seg) {
  const b = seg.p1.bild;
  const ppe = (b.scale * BREITE) / 2;
  const links = b.x - b.w * 1.2;
  const rechts = b.x + b.w * 1.2;
  const hoch = 1700 * ppe;
  const pfosten = 120 * ppe;
  const band = 380 * ppe;
  const oben = b.y - hoch;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, BREITE, seg.clip);
  ctx.clip();
  ctx.globalAlpha = seg.nebel;
  kaestchen(ctx, '#dddddd', links - pfosten / 2, oben, pfosten, hoch);
  kaestchen(ctx, '#dddddd', rechts - pfosten / 2, oben, pfosten, hoch);
  kaestchen(ctx, '#1d3557', links, oben, rechts - links, band);
  const feld = band / 5;
  for (let i = 0; i * feld < rechts - links; i++) {
    kaestchen(ctx, i % 2 ? '#111' : '#fff', links + i * feld, oben, feld, feld);
    kaestchen(ctx, i % 2 ? '#fff' : '#111', links + i * feld, oben + band - feld, feld, feld);
  }
  if (band > 8) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(band * 0.42)}px ${SCHRIFT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START  ·  ZIEL', b.x, oben + band / 2);
  }
  ctx.restore();
}

// ----- Anzeigen: Runde, Zeit, Platz, Tacho -----
function hudKasten(x, y, b, h) {
  ctx.fillStyle = 'rgba(10,15,30,0.55)';
  rundesRechteck(ctx, x, y, b, h, 14);
  ctx.fill();
}

function hudZeichnen(s) {
  if (s.zustand === 'demo') return;
  const runden = s.def.runden;
  const L = strecke.laenge;
  const linie = ZIEL_LINIE * SEG_LAENGE;

  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // Runde und Zeit
  hudKasten(16, 16, 290, 96);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 16px ${SCHRIFT}`;
  ctx.fillText('RUNDE', 32, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 40px ${SCHRIFT}`;
  ctx.fillText(`${Math.min(s.runde + 1, runden)}/${runden}`, 32, 92);
  ctx.font = `bold 20px ${SCHRIFT}`;
  ctx.fillStyle = '#ffd166';
  ctx.fillText('ZEIT', 140, 50);
  ctx.fillText('BESTE', 140, 86);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(zeitText(s.zustand === 'ziel' ? s.rundenZeiten.reduce((a, b) => a + b, 0) : s.zeit), 210, 50);
  ctx.fillText(zeitText(s.besteRunde), 210, 86);

  // Tankanzeige: grün, gelb, rot – und blinkt, wenn's knapp wird
  hudKasten(16, 120, 290, 40);
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 16px ${SCHRIFT}`;
  ctx.fillText('⛽ SPRIT', 28, 146);
  kaestchen(ctx, 'rgba(255,255,255,0.15)', 112, 132, 180, 16, 8);
  const knapp = s.sprit < 0.2;
  if (!knapp || Math.floor(performance.now() / 250) % 2 === 0) {
    const farbe = s.sprit > 0.5 ? '#22c55e' : s.sprit > 0.2 ? '#facc15' : '#ef4444';
    kaestchen(ctx, farbe, 112, 132, 180 * s.sprit, 16, 8);
  }

  // Platz
  hudKasten(BREITE - 166, 16, 150, 96);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 16px ${SCHRIFT}`;
  ctx.fillText('PLATZ', BREITE - 91, 42);
  ctx.fillStyle = s.platz === 1 ? '#ffd166' : '#ffffff';
  ctx.font = `bold 46px ${SCHRIFT}`;
  ctx.fillText(`${s.zustand === 'ziel' ? s.endPlatz : s.platz}.`, BREITE - 104, 94);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `bold 18px ${SCHRIFT}`;
  ctx.fillText(`/ ${s.gegner.length + 1}`, BREITE - 52, 92);

  // Fortschritt in der Runde: ein Punkt für jeden Fahrer
  const fx = BREITE / 2 - 180;
  const fb = 360;
  const fy = 34;
  hudKasten(fx - 20, 16, fb + 40, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(fx, fy - 2, fb, 4);
  for (let i = 0; i < 4; i++) {
    kaestchen(ctx, i % 2 ? '#111' : '#fff', fx + fb - 4, fy - 10 + i * 5, 5, 5);
    kaestchen(ctx, i % 2 ? '#fff' : '#111', fx + fb + 1, fy - 10 + i * 5, 5, 5);
  }
  ctx.lineWidth = 2;
  for (const g of s.gegner) {
    const p = rundum(g.z - linie, L) / L;
    kreis(ctx, g.farben.motorrad, fx + p * fb, fy, 6);
    ctx.strokeStyle = '#111';
    ctx.stroke();
  }
  const ich = rundum(s.z - linie, L) / L;
  kreis(ctx, s.farben.motorrad, fx + ich * fb, fy, 9);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  tachoZeichnen(s);

  // Große Meldungen in der Mitte (3, 2, 1, LOS!, Runde 2 ...)
  if (s.meldung) {
    const m = s.meldung;
    const alter = m.dauer - m.zeit;
    const plopp = 1 + Math.max(0, 0.25 - alter) * 2;
    ctx.globalAlpha = Math.min(1, m.zeit * 3);
    ctx.font = `900 ${Math.round((m.gross ? 120 : 64) * plopp)}px ${SCHRIFT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1d1d1d';
    ctx.strokeText(m.text, BREITE / 2, HOEHE * 0.36);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(m.text, BREITE / 2, HOEHE * 0.36);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function tachoZeichnen(s) {
  const cx = BREITE - 100;
  const cy = touchModus ? 214 : HOEHE - 92; // auf dem Tablet unten rechts ist der Gas-Knopf
  const r = 74;
  const kmh = Math.round(s.tempo * KMH_FAKTOR);
  const start = Math.PI * 0.75;
  const bogen = Math.PI * 1.5;
  const winkel = (wert) => start + (wert / 300) * bogen;

  kreis(ctx, 'rgba(10,15,30,0.65)', cx, cy, r + 8);
  ctx.lineCap = 'butt';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, start, start + bogen);
  ctx.stroke();
  ctx.strokeStyle = '#e63946';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, winkel(250), winkel(300));
  ctx.stroke();
  ctx.strokeStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, start, winkel(Math.min(kmh, 300)));
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = `bold 11px ${SCHRIFT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let wert = 0; wert <= 300; wert += 50) {
    const w = winkel(wert);
    ctx.fillText(String(wert), cx + Math.cos(w) * (r - 24), cy + Math.sin(w) * (r - 24));
  }

  // Zeiger
  const w = winkel(Math.min(kmh, 300));
  ctx.strokeStyle = '#e63946';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(w) * (r - 10), cy + Math.sin(w) * (r - 10));
  ctx.stroke();
  kreis(ctx, '#e63946', cx, cy, 6);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 26px ${SCHRIFT}`;
  ctx.fillText(String(kmh), cx, cy + 34);
  ctx.font = `bold 11px ${SCHRIFT}`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('km/h', cx, cy + 54);

  // Gang
  hudKasten(cx - r - 66, cy + 20, 50, 56);
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 12px ${SCHRIFT}`;
  ctx.fillText('GANG', cx - r - 41, cy + 34);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 28px ${SCHRIFT}`;
  ctx.fillText(String(s.motor.gang), cx - r - 41, cy + 60);
}

// =====================================================================
//  MENÜ, PAUSE, ERGEBNIS
// =====================================================================
function bestzeitLesen(nr) {
  try {
    const wert = localStorage.getItem('motorrad-bestzeit-' + nr);
    return wert ? Number(wert) : null;
  } catch (e) {
    return null;
  }
}

function bestzeitSpeichern(nr, zeit) {
  const alt = bestzeitLesen(nr);
  if (alt !== null && alt <= zeit) return false;
  try {
    localStorage.setItem('motorrad-bestzeit-' + nr, String(zeit));
  } catch (e) { /* ohne Speicher geht's auch */ }
  return true;
}

function zeigen(id) { document.getElementById(id).classList.remove('versteckt'); }
function verstecken(id) { document.getElementById(id).classList.add('versteckt'); }
function sichtbar(id) { return !document.getElementById(id).classList.contains('versteckt'); }

function menueAufbauen() {
  const streckenBox = document.getElementById('streckenAuswahl');
  const karte = (st, i) => `
    <button class="wahl strecke ${i === gewaehlteStrecke ? 'aktiv' : ''}" data-nr="${i}">
      <span class="vorschau ${st.modus === 'cross' ? 'cross' : ''}" style="--himmel1:${st.farben.himmelOben};--himmel2:${st.farben.himmelUnten};--boden:${st.farben.gras1};--strasse:${st.farben.strasse1};--kerb:${st.farben.kerb1};--rampe:${st.farben.rampe1 || st.farben.strasse1}"></span>
      <b>${st.name}</b>
      <small>${st.beschreibung}</small>
      <small>🏁 ${st.runden} Runden · ⏱️ ${zeitText(bestzeitLesen(i))}</small>
    </button>`;
  const gruppen = [
    { modus: 'rennen', titel: '🏍️ Rennstrecken' },
    { modus: 'cross', titel: '🌲 Motocross mit Sprüngen' },
  ];
  streckenBox.innerHTML = gruppen.map((gr) => `
    <div class="gruppe">
      <h3>${gr.titel}</h3>
      <div class="auswahl">
        ${STRECKEN.map((st, i) => ((st.modus || 'rennen') === gr.modus ? karte(st, i) : '')).join('')}
      </div>
    </div>`).join('');
  streckenBox.querySelectorAll('button').forEach((knopf) => {
    knopf.onclick = () => {
      gewaehlteStrecke = Number(knopf.dataset.nr);
      menueAufbauen();
      neuesRennen('demo');
    };
  });

  const farbBox = document.getElementById('farbAuswahl');
  farbBox.innerHTML = MOTORRAD_FARBEN.map((fa, i) => `
    <button class="wahl farbe ${i === gewaehlteFarbe ? 'aktiv' : ''}" data-nr="${i}" title="${fa.name}"
      style="background: radial-gradient(circle at 50% 35%, ${fa.helm} 0 22%, ${fa.motorrad} 23%)"></button>`).join('');
  farbBox.querySelectorAll('button').forEach((knopf) => {
    knopf.onclick = () => {
      gewaehlteFarbe = Number(knopf.dataset.nr);
      if (spiel) spiel.farben = fahrerFarben(MOTORRAD_FARBEN[gewaehlteFarbe]);
      menueAufbauen();
    };
  });

  const stufenBox = document.getElementById('stufenAuswahl');
  stufenBox.innerHTML = STUFEN.map((st, i) => `
    <button class="wahl stufe ${i === gewaehlteStufe ? 'aktiv' : ''}" data-nr="${i}">${st.name}<small>⛽ ${st.info}</small></button>`).join('');
  stufenBox.querySelectorAll('button').forEach((knopf) => {
    knopf.onclick = () => {
      gewaehlteStufe = Number(knopf.dataset.nr);
      menueAufbauen();
    };
  });
}

function menueZeigen() {
  verstecken('pause');
  verstecken('ergebnis');
  menueAufbauen();
  zeigen('menue');
  neuesRennen('demo');
}

function rennenStarten() {
  Ton.starten();
  verstecken('menue');
  verstecken('pause');
  verstecken('ergebnis');
  neuesRennen('rennen');
}

function pauseUmschalten() {
  if (!spiel || (spiel.zustand !== 'rennen' && spiel.zustand !== 'countdown')) return;
  spiel.pause = !spiel.pause;
  if (spiel.pause) {
    zeigen('pause');
    Ton.stille();
  } else {
    verstecken('pause');
  }
}

function ergebnisZeigen() {
  const s = spiel;
  const titel = s.endPlatz === 1 ? '🏆 Du hast gewonnen!'
    : s.endPlatz === 2 ? '🥈 Super – Platz 2!'
    : s.endPlatz === 3 ? '🥉 Klasse – Platz 3!'
    : `🏁 Platz ${s.endPlatz} von ${s.gegner.length + 1}`;
  document.getElementById('ergebnisTitel').textContent = titel;
  const gesamt = s.rundenZeiten.reduce((a, b) => a + b, 0);
  document.getElementById('ergebnisInhalt').innerHTML = `
    <div class="werte">
      <div><small>Gesamtzeit</small><b>${zeitText(gesamt)}</b></div>
      <div><small>Beste Runde</small><b>${zeitText(s.besteRunde)}</b></div>
      <div><small>Kanister</small><b>${s.kanisterGesammelt}</b></div>
      ${s.cross ? `<div><small>Sprünge</small><b>${s.spruenge}</b></div>` : ''}
    </div>
    ${s.neuerRekord ? '<p class="rekord">⭐ Neue Bestzeit auf dieser Strecke! ⭐</p>' : ''}
    <p class="rundenzeiten">${s.rundenZeiten.map((t, i) => `Runde ${i + 1}: ${zeitText(t)}`).join(' · ')}</p>
    <h2>Zieleinlauf</h2>
    <ol class="rangliste">
      ${s.rangliste.map((r) => `<li class="${r.du ? 'du' : ''}">${r.name} <span>#${r.nummer}</span></li>`).join('')}
    </ol>`;
  zeigen('ergebnis');
}

// ----- Tastatur -----
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  tasten[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'KeyP' || e.code === 'Escape') pauseUmschalten();
  if (e.code === 'KeyM') Ton.umschalten();
  if (e.code === 'Enter' && (sichtbar('menue') || sichtbar('ergebnis'))) rennenStarten();
});
window.addEventListener('keyup', (e) => { tasten[e.code] = false; });
window.addEventListener('blur', () => {
  tastenLoslassen();
  if (spiel && !spiel.pause) pauseUmschalten();
});

function tastenLoslassen() {
  for (const t in tasten) tasten[t] = false;
  for (const knopf of touchSteuerung.querySelectorAll('.gedrueckt')) knopf.classList.remove('gedrueckt');
}

// ----- Touch-Steuerung (Tablet) -----
// Bei jeder Fingerbewegung schauen wir nach, welche Knöpfe gerade von einem Finger
// berührt werden. So kann man mehrere Knöpfe gleichzeitig drücken (Gas + Lenken)
// und mit dem Daumen von ◀ nach ▶ rutschen, ohne loszulassen.
const touchSteuerung = document.getElementById('touchSteuerung');
let touchModus = false;

function touchModusAn() {
  if (touchModus) return;
  touchModus = true;
  document.body.classList.add('touch');
}
if (window.matchMedia('(pointer: coarse)').matches) touchModusAn();
window.addEventListener('touchstart', touchModusAn, { passive: true });

function touchAuswerten(e) {
  e.preventDefault(); // nicht scrollen oder zoomen
  const gedrueckt = new Set();
  for (const finger of e.touches) {
    const element = document.elementFromPoint(finger.clientX, finger.clientY);
    const knopf = element && element.closest('[data-taste]');
    if (knopf) gedrueckt.add(knopf);
  }
  for (const knopf of touchSteuerung.querySelectorAll('[data-taste]')) {
    const an = gedrueckt.has(knopf);
    tasten[knopf.dataset.taste] = an;
    knopf.classList.toggle('gedrueckt', an);
  }
}
for (const art of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
  touchSteuerung.addEventListener(art, touchAuswerten, { passive: false });
}

document.getElementById('pauseKnopf').onclick = pauseUmschalten;
document.getElementById('startKnopf').onclick = rennenStarten;
document.getElementById('weiterKnopf').onclick = pauseUmschalten;
document.getElementById('neustartKnopf').onclick = rennenStarten;
document.getElementById('nochmalKnopf').onclick = rennenStarten;
document.getElementById('menueKnopf1').onclick = menueZeigen;
document.getElementById('menueKnopf2').onclick = menueZeigen;

// ----- Die Spiel-Schleife -----
let letzteZeit = performance.now();
let rest = 0;
function rahmen(jetzt) {
  const dt = Math.min(0.1, (jetzt - letzteZeit) / 1000);
  letzteZeit = jetzt;
  if (spiel) {
    if (!spiel.pause) {
      rest += dt;
      while (rest >= SCHRITT) {
        aktualisieren(SCHRITT);
        rest -= SCHRITT;
      }
    }
    zeichnen();
    // Touch-Knöpfe nur zeigen, während wirklich gefahren wird
    const imRennen = spiel.zustand !== 'demo' && !spiel.pause && !sichtbar('ergebnis');
    if (document.body.classList.contains('im-rennen') && !imRennen) tastenLoslassen();
    document.body.classList.toggle('im-rennen', imRennen);
  }
  requestAnimationFrame(rahmen);
}

menueZeigen();
requestAnimationFrame(rahmen);
