'use strict';

// =====================================================================
//  TON – Motorgeräusche, Fahrtwind, Countdown-Piepen und Krach.
//  Alle Geräusche werden vom Browser selbst erzeugt (keine Sounddateien).
//
//  Wie klingt ein Motor? In jedem Zylinder explodiert immer wieder ein
//  bisschen Benzin. Jede Explosion ist ein kurzer Knall im Auspuff.
//  Viele Knalle pro Sekunde hören sich wie ein Brummen an – je schneller
//  der Motor dreht, desto höher wird der Ton.
//
//    Renn-Motorrad : 4 Zylinder, dreht bis 12.000 U/min -> kräftiges Röhren
//    Cross-Motorrad: 1 Zylinder, dreht bis 11.000 U/min -> tiefes Knattern
//
//  Probier mal, die Zahlen unten zu ändern!
// =====================================================================

const MOTOR_KLANG = {
  rennen: {
    zylinder: 4,            // Anzahl der Zylinder
    gaenge: 6,
    leerlauf: 1400,         // Umdrehungen pro Minute im Stand
    maxDrehzahl: 12000,     // so schnell kann der Motor höchstens drehen
    pulsBreite: 0.11,       // breiter Knall = weicher, runder Ton
    heulen: 0.08,           // das typische Kreischen eines Vierzylinders (mehr = schriller)
    rauschen: 0.18,         // Luft- und Mechanikgeräusch
    rauschFrequenz: 1100,
    unruhe: 10,              // wie unregelmäßig der Motor läuft
    verzerrung: 1.8,        // wie rau und kratzig es klingt
    resonanzen: [           // Klangfarbe von Auspuff und Ansaugung
      { frequenz: 160, guete: 1.5, staerke: 9 },   // kräftiger Bass aus dem Auspuff
      { frequenz: 650, guete: 2, staerke: 4 },
      { frequenz: 2500, guete: 1, staerke: -8 },   // das Schrille wird leiser gemacht
    ],
    filterMin: 600,
    filterMax: 2800,
    knallFrequenz: 450,     // Fehlzündungen im Auspuff
    lautstaerke: 0.5,
  },
  cross: {
    zylinder: 1,
    gaenge: 5,
    leerlauf: 1700,
    maxDrehzahl: 11000,
    pulsBreite: 0.03,       // schmaler Knall = hartes plopp-plopp-plopp
    heulen: 0,
    rauschen: 0.5,
    rauschFrequenz: 900,
    unruhe: 30,
    verzerrung: 5,
    resonanzen: [
      { frequenz: 110, guete: 2, staerke: 12 },
      { frequenz: 520, guete: 4, staerke: 7 },
    ],
    filterMin: 450,
    filterMax: 3000,
    knallFrequenz: 260,
    lautstaerke: 0.6,
  },
};

const SCHALL_TEMPO = 49000; // Schallgeschwindigkeit in Spiel-Einheiten pro Sekunde (für den Doppler-Effekt)

// =====================================================================
//  DER MOTOR: rechnet Gang und Drehzahl aus – ganz ohne Ton.
//  Jedes Motorrad (auch jeder Gegner) hat so einen Motor.
// =====================================================================
class Motor {
  constructor(klang) {
    this.klang = klang;
    this.gang = 1;
    this.drehzahl = klang.leerlauf;
    this.last = 0;            // 0 = kein Gas, 1 = Vollgas
    this.geschaltet = false;  // gerade hochgeschaltet?
    this.begrenzer = false;   // dreht der Motor am Anschlag?
    this.knallZeit = 0;       // so lange knallt es noch im Auspuff
    this.vorherGas = false;
  }

  // Bis zu welchem Tempo (0 bis 1) reicht jeder Gang? Die unteren Gänge sind kurz.
  gangGrenze(gang) {
    return Math.pow(gang / this.klang.gaenge, 0.75);
  }

  // frei = das Hinterrad dreht frei (in der Luft oder beim Countdown)
  aktualisieren(dt, tempoProzent, gas, frei) {
    const k = this.klang;
    const p = Math.max(0, tempoProzent);

    const alterGang = this.gang;
    while (this.gang < k.gaenge && p > this.gangGrenze(this.gang)) this.gang++;
    while (this.gang > 1 && p < this.gangGrenze(this.gang - 1) * 0.85) this.gang--;
    this.geschaltet = this.gang > alterGang;

    let ziel;
    if (frei) {
      ziel = gas ? k.maxDrehzahl : k.leerlauf;
    } else {
      ziel = Math.max(k.leerlauf, (p / this.gangGrenze(this.gang)) * k.maxDrehzahl);
      if (this.gang === 1 && gas) ziel = Math.max(ziel, k.maxDrehzahl * 0.5); // Kupplung schleift beim Anfahren
    }
    const schnelligkeit = frei ? (ziel > this.drehzahl ? 6 : 3) : 12;
    this.drehzahl += (ziel - this.drehzahl) * Math.min(1, dt * schnelligkeit);
    this.last += ((gas ? 1 : 0) - this.last) * Math.min(1, dt * 10);
    this.begrenzer = frei && gas && this.drehzahl > k.maxDrehzahl * 0.97; // Hinterrad dreht frei: Motor stottert am Anschlag

    // Gas weg bei hoher Drehzahl: dann knallt es ein bisschen im Auspuff
    if (!gas && this.vorherGas && this.drehzahl > k.maxDrehzahl * 0.45) this.knallZeit = 0.8;
    this.knallZeit = Math.max(0, this.knallZeit - dt);
    this.vorherGas = gas;
  }
}

// ----- Bausteine für den Klang -----

// Ein einzelner Zündknall als Welle: viele Obertöne, die nach oben leiser werden
function pulsWelle(ctx, breite) {
  const anzahl = 64;
  const real = new Float32Array(anzahl);
  const imag = new Float32Array(anzahl);
  for (let n = 1; n < anzahl; n++) real[n] = Math.exp(-2 * Math.PI * Math.PI * n * n * breite * breite);
  return ctx.createPeriodicWave(real, imag);
}

function rauschenErzeugen(ctx, sekunden) {
  const puffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sekunden), ctx.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < daten.length; i++) daten[i] = Math.random() * 2 - 1;
  return puffer;
}

// Langsames, weiches Zufallswackeln (10-mal pro Sekunde ein neuer Wert zwischen -1 und 1)
function unruheErzeugen(ctx, sekunden) {
  const puffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sekunden), ctx.sampleRate);
  const daten = puffer.getChannelData(0);
  const abstand = Math.floor(ctx.sampleRate / 10);
  const punkte = Array.from({ length: Math.ceil(daten.length / abstand) + 1 }, () => Math.random() * 2 - 1);
  punkte[punkte.length - 1] = punkte[0]; // nahtlos wiederholbar
  for (let i = 0; i < daten.length; i++) {
    const p = i / abstand;
    const n = Math.floor(p);
    const t = (1 - Math.cos((p - n) * Math.PI)) / 2;
    daten[i] = punkte[n] + (punkte[n + 1] - punkte[n]) * t;
  }
  return puffer;
}

function verzerrungsKurve(staerke) {
  const kurve = new Float32Array(1024);
  for (let i = 0; i < kurve.length; i++) {
    const x = (i / (kurve.length - 1)) * 2 - 1;
    kurve[i] = Math.tanh(x * staerke) / Math.tanh(staerke);
  }
  return kurve;
}

// =====================================================================
//  EINE MOTOR-STIMME: macht aus Gang und Drehzahl einen echten Klang.
//
//  Zündknalle ──┐
//  Kreischen ───┼─> Verzerrung -> Auspuff-Klangfarbe -> Filter -> Lautstärke -> links/rechts
//  Rauschen ────┘   (das Rauschen pulsiert im Takt der Zündung)
// =====================================================================
class MotorStimme {
  constructor(ton, klang) {
    const ctx = ton.ctx;
    this.ctx = ctx;
    this.klang = klang;
    this.pauseBis = 0;

    this.puls = ctx.createOscillator();
    this.puls.setPeriodicWave(pulsWelle(ctx, klang.pulsBreite));
    this.heulen = ctx.createOscillator();
    this.heulen.type = 'triangle';
    const heulenLaut = ctx.createGain();
    heulenLaut.gain.value = klang.heulen;

    // Rauschen, das im Takt der Zündung lauter und leiser wird
    this.rauschen = ctx.createBufferSource();
    this.rauschen.buffer = ton.rauschPuffer;
    this.rauschen.loop = true;
    const rauschFilter = ctx.createBiquadFilter();
    rauschFilter.type = 'bandpass';
    rauschFilter.frequency.value = klang.rauschFrequenz;
    rauschFilter.Q.value = 0.8;
    const rauschLaut = ctx.createGain();
    rauschLaut.gain.value = 0;
    const takt = ctx.createGain();
    takt.gain.value = klang.rauschen;
    this.puls.connect(takt);
    takt.connect(rauschLaut.gain);

    // Unruhe: der Motor läuft nie ganz gleichmäßig
    this.unruhe = ctx.createBufferSource();
    this.unruhe.buffer = ton.unruhePuffer;
    this.unruhe.loop = true;
    this.unruhe.playbackRate.value = 0.8 + Math.random() * 0.4;
    const unruheTon = ctx.createGain();
    unruheTon.gain.value = klang.unruhe;
    this.unruhe.connect(unruheTon);
    unruheTon.connect(this.puls.detune);
    unruheTon.connect(this.heulen.detune);

    this.vorstufe = ctx.createGain();
    const unruheLaut = ctx.createGain();
    unruheLaut.gain.value = klang.unruhe / 200;
    this.unruhe.connect(unruheLaut);
    unruheLaut.connect(this.vorstufe.gain);

    const verzerrung = ctx.createWaveShaper();
    verzerrung.curve = verzerrungsKurve(klang.verzerrung);
    verzerrung.oversample = '2x';
    this.tiefpass = ctx.createBiquadFilter();
    this.tiefpass.type = 'lowpass';
    this.tiefpass.Q.value = 0.7;
    this.unterbrecher = ctx.createGain();
    this.laut = ctx.createGain();
    this.laut.gain.value = 0;
    this.panorama = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    // Alles zusammenstecken
    this.puls.connect(this.vorstufe);
    this.heulen.connect(heulenLaut);
    heulenLaut.connect(this.vorstufe);
    this.rauschen.connect(rauschFilter);
    rauschFilter.connect(rauschLaut);
    rauschLaut.connect(this.vorstufe);
    this.vorstufe.connect(verzerrung);
    let letzter = verzerrung;
    for (const r of klang.resonanzen) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = r.frequenz;
      filter.Q.value = r.guete;
      filter.gain.value = r.staerke;
      letzter.connect(filter);
      letzter = filter;
    }
    letzter.connect(this.tiefpass);
    this.tiefpass.connect(this.unterbrecher);
    this.unterbrecher.connect(this.laut);
    if (this.panorama) {
      this.laut.connect(this.panorama);
      this.panorama.connect(ton.haupt);
    } else {
      this.laut.connect(ton.haupt);
    }

    for (const quelle of [this.puls, this.heulen, this.rauschen, this.unruhe]) quelle.start();
  }

  // tonhoehe > 1 = höher (Doppler-Effekt, wenn ein Gegner näher kommt)
  stellen(motor, lautstaerke, pan = 0, tonhoehe = 1) {
    const t = this.ctx.currentTime;
    const k = this.klang;
    const n = motor.drehzahl / k.maxDrehzahl;
    const zuendungen = ((motor.drehzahl * tonhoehe) / 60) * (k.zylinder / 2); // Viertakter: Zündung bei jeder 2. Umdrehung

    this.puls.frequency.setTargetAtTime(zuendungen, t, 0.02);
    this.heulen.frequency.setTargetAtTime(zuendungen, t, 0.02);
    this.tiefpass.frequency.setTargetAtTime(k.filterMin + (k.filterMax - k.filterMin) * n * (0.4 + 0.6 * motor.last), t, 0.03);
    this.vorstufe.gain.setTargetAtTime(0.5 + 0.9 * motor.last, t, 0.03);
    this.laut.gain.setTargetAtTime(lautstaerke * k.lautstaerke * (0.45 + 0.55 * motor.last) * (0.7 + 0.3 * n), t, 0.04);
    if (this.panorama) this.panorama.pan.setTargetAtTime(pan, t, 0.05);

    // Beim Hochschalten setzt die Zündung kurz aus, am Begrenzer stottert der Motor
    const u = this.unterbrecher.gain;
    if (motor.geschaltet) {
      u.cancelScheduledValues(t);
      u.setValueAtTime(0.1, t);
      u.linearRampToValueAtTime(1, t + 0.08);
      this.pauseBis = t + 0.08;
    } else if (t > this.pauseBis) {
      u.setTargetAtTime(motor.begrenzer && Math.floor(t * 18) % 2 ? 0.25 : 1, t, 0.004);
    }
  }

  stille() {
    this.laut.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  stopp() {
    this.stille();
    const ende = this.ctx.currentTime + 0.3;
    for (const quelle of [this.puls, this.heulen, this.rauschen, this.unruhe]) quelle.stop(ende);
  }
}

// =====================================================================
//  TON – steuert alle Geräusche
// =====================================================================
const Ton = {
  ctx: null,
  an: true,
  modus: 'rennen',
  spieler: null,  // dein Motor
  gegner: null,   // der Motor des nächsten Gegners

  // Der Browser erlaubt Ton erst nach einem Klick – deshalb starten wir ihn beim „Los“-Knopf.
  starten() {
    if (this.ctx) {
      this.ctx.resume();
      return;
    }
    const AudioKontext = window.AudioContext || window.webkitAudioContext;
    if (!AudioKontext) return;
    this.ctx = new AudioKontext();

    // Der Kompressor sorgt dafür, dass es nie zu laut wird oder übersteuert
    const kompressor = this.ctx.createDynamicsCompressor();
    kompressor.connect(this.ctx.destination);
    this.haupt = this.ctx.createGain();
    this.haupt.gain.value = this.an ? 0.7 : 0;
    this.haupt.connect(kompressor);

    this.rauschPuffer = rauschenErzeugen(this.ctx, 2);
    this.unruhePuffer = unruheErzeugen(this.ctx, 4);

    // Fahrtwind
    const wind = this.ctx.createBufferSource();
    wind.buffer = this.rauschPuffer;
    wind.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 800;
    windFilter.Q.value = 0.5;
    this.windLaut = this.ctx.createGain();
    this.windLaut.gain.value = 0;
    wind.connect(windFilter);
    windFilter.connect(this.windLaut);
    this.windLaut.connect(this.haupt);
    wind.start();

    this.stimmenBauen();
  },

  // Renn- oder Cross-Klang auswählen
  klangWaehlen(modus) {
    if (this.modus === modus) return;
    this.modus = modus;
    if (this.ctx) this.stimmenBauen();
  },

  stimmenBauen() {
    if (this.spieler) this.spieler.stopp();
    if (this.gegner) this.gegner.stopp();
    const klang = MOTOR_KLANG[this.modus];
    this.spieler = new MotorStimme(this, klang);
    this.gegner = new MotorStimme(this, klang);
  },

  umschalten() {
    this.an = !this.an;
    if (this.haupt) this.haupt.gain.value = this.an ? 0.7 : 0;
  },

  // motor: dein Motor, gegner: { motor, lautstaerke, pan, tonhoehe } oder null
  spielen(motor, gegner, tempoProzent, inLuft) {
    if (!this.ctx) return;
    this.spieler.stellen(motor, 1);
    if (gegner) this.gegner.stellen(gegner.motor, gegner.lautstaerke * 0.8, gegner.pan, gegner.tonhoehe);
    else this.gegner.stille();
    const wind = 0.16 * tempoProzent * tempoProzent * (inLuft ? 1.4 : 1);
    this.windLaut.gain.setTargetAtTime(wind, this.ctx.currentTime, 0.1);
    if (motor.knallZeit > 0 && Math.random() < 0.1) this.knall();
  },

  stille() {
    if (!this.ctx) return;
    this.spieler.stille();
    this.gegner.stille();
    this.windLaut.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  },

  // Fehlzündung: ein kurzer Knall im Auspuff
  knall() {
    const t = this.ctx.currentTime;
    const quelle = this.ctx.createBufferSource();
    quelle.buffer = this.rauschPuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = MOTOR_KLANG[this.modus].knallFrequenz * (0.8 + Math.random() * 0.4);
    filter.Q.value = 1.5;
    const laut = this.ctx.createGain();
    laut.gain.setValueAtTime(0.9, t);
    laut.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    quelle.connect(filter);
    filter.connect(laut);
    laut.connect(this.haupt);
    quelle.start(t, Math.random() * 1.5, 0.08);
  },

  piep(frequenz, dauer, lautstaerke = 0.3) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const laut = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = frequenz;
    laut.gain.setValueAtTime(lautstaerke, t);
    laut.gain.exponentialRampToValueAtTime(0.001, t + dauer);
    osc.connect(laut);
    laut.connect(this.haupt);
    osc.start(t);
    osc.stop(t + dauer);
  },

  krach(dauer = 0.35, lautstaerke = 0.6) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const rauschen = this.ctx.createBufferSource();
    rauschen.buffer = this.rauschPuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const laut = this.ctx.createGain();
    laut.gain.setValueAtTime(lautstaerke, t);
    laut.gain.exponentialRampToValueAtTime(0.001, t + dauer);
    rauschen.connect(filter);
    filter.connect(laut);
    laut.connect(this.haupt);
    rauschen.start(t, Math.random(), dauer);
  },

  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.piep(f, i === 3 ? 0.6 : 0.2), i * 170));
  },
};
