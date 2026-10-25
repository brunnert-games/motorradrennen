'use strict';

// =====================================================================
//  ZEICHNEN – hier wird alles gemalt: Motorräder, Bäume, Tribünen, Berge.
//  Es gibt keine Bilddateien: alles besteht aus Kreisen, Rechtecken und
//  Vielecken. Du kannst also Farben und Formen einfach ändern!
// =====================================================================

// ----- kleine Mal-Helfer -----

function aufhellen(farbe, anteil) {
  const n = parseInt(farbe.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * anteil);
  const g = Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * anteil);
  const b = Math.round((n & 255) + (255 - (n & 255)) * anteil);
  return `rgb(${r},${g},${b})`;
}

function abdunkeln(farbe, faktor) {
  const n = parseInt(farbe.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * faktor);
  const g = Math.round(((n >> 8) & 255) * faktor);
  const b = Math.round((n & 255) * faktor);
  return `rgb(${r},${g},${b})`;
}

function rundesRechteck(ctx, x, y, b, h, r) {
  r = Math.min(r, b / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + b, y, x + b, y + h, r);
  ctx.arcTo(x + b, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + b, y, r);
  ctx.closePath();
}

function kaestchen(ctx, farbe, x, y, b, h, r = 0) {
  ctx.fillStyle = farbe;
  if (r === 0) {
    ctx.fillRect(x, y, b, h);
    return;
  }
  rundesRechteck(ctx, x, y, b, h, r);
  ctx.fill();
}

function flaeche(ctx, farbe, punkte) {
  ctx.fillStyle = farbe;
  ctx.beginPath();
  ctx.moveTo(punkte[0], punkte[1]);
  for (let i = 2; i < punkte.length; i += 2) ctx.lineTo(punkte[i], punkte[i + 1]);
  ctx.closePath();
  ctx.fill();
}

function kreis(ctx, farbe, x, y, r) {
  ctx.fillStyle = farbe;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function oval(ctx, farbe, x, y, rx, ry) {
  ctx.fillStyle = farbe;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Schatten auf dem Boden – beim Springen weiter unten und kleiner
function schattenMalen(ctx, neigung, luft, k) {
  const groesse = 1 / (1 + luft / 120);
  oval(ctx, 'rgba(0,0,0,0.3)', neigung * 40, luft / k - 2, 46 * groesse, 8 * groesse);
}

// =====================================================================
//  DAS RENN-MOTORRAD (von hinten gesehen)
//  x, y    : Mitte unten (wo der Reifen die Straße berührt)
//  breite  : wie breit das Motorrad auf dem Bildschirm sein soll
//  neigung : Schräglage in der Kurve (negativ = links, positiv = rechts)
//  luft    : wie viele Pixel das Motorrad über dem Boden fliegt
//  Gemalt wird in einem Raster, das 100 Einheiten breit ist.
// =====================================================================
function zeichneMotorrad(ctx, x, y, breite, f, neigung, bremst, nummer, luft = 0) {
  const k = breite / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);

  schattenMalen(ctx, neigung, luft, k);

  ctx.rotate(neigung);
  const h = neigung * 30;                   // der Fahrer hängt sich weit in die Kurve
  const innen = Math.sign(neigung);         // auf dieser Seite ist die Kurve
  const knieRaus = begrenzt((Math.abs(neigung) - 0.15) * 3); // inneres Knie geht runter auf den Asphalt
  const details = breite > 40;              // kleine Details nur malen, wenn man sie sieht

  // ----- Verkleidung vorne: breit, mit getöntem Windschild und Winglets -----
  const verkleidung = ctx.createLinearGradient(-40, 0, 40, 0);
  verkleidung.addColorStop(0, f.motorradDunkel);
  verkleidung.addColorStop(0.3, f.motorrad);
  verkleidung.addColorStop(0.5, f.motorradHell);
  verkleidung.addColorStop(0.7, f.motorrad);
  verkleidung.addColorStop(1, f.motorradDunkel);
  flaeche(ctx, verkleidung, [-40, -134, -30, -150, 30, -150, 40, -134, 36, -98, -36, -98]);
  flaeche(ctx, 'rgba(30,40,55,0.85)', [-22, -150, 22, -150, 16, -166, -16, -166]);
  for (const s of [-1, 1]) {
    flaeche(ctx, f.motorradDunkel, [s * 38, -132, s * 51, -128, s * 51, -123, s * 37, -121]); // Winglets
    // untere Verkleidung neben dem Hinterrad
    flaeche(ctx, s < 0 ? f.motorradDunkel : f.motorrad, [s * 16, -84, s * 36, -99, s * 32, -50, s * 16, -44]);
    if (details) flaeche(ctx, '#ffffff', [s * 20, -74, s * 32, -82, s * 32, -76, s * 20, -69]);
  }

  // ----- Arme eng angelegt, Hände an den Stummellenkern -----
  for (const s of [-1, 1]) {
    const schulter = [s * 22 + h, -146];
    const ellbogen = [s * 35 + h * 0.5, -133];
    const hand = [s * 28, -124];
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = f.anzugDunkel;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(...schulter);
    ctx.lineTo(...ellbogen);
    ctx.lineTo(...hand);
    ctx.stroke();
    ctx.strokeStyle = f.anzug;
    ctx.lineWidth = 8;
    ctx.stroke();
    kreis(ctx, '#1b1b1b', hand[0], hand[1], 6.5);
    if (details) kreis(ctx, f.motorrad, hand[0] - s * 2, hand[1] - 2, 2.2);
  }

  // ----- Helm, tief geduckt, mit Spoiler -----
  const hx = h * 1.15;
  const hy = -160;
  const helmFarbe = ctx.createRadialGradient(hx - 6, hy - 8, 2, hx, hy, 20);
  helmFarbe.addColorStop(0, f.helmHell);
  helmFarbe.addColorStop(0.5, f.helm);
  helmFarbe.addColorStop(1, f.helmDunkel);
  kreis(ctx, helmFarbe, hx, hy, 18);
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx, hy, 18, 0, Math.PI * 2);
  ctx.clip();
  kaestchen(ctx, f.motorrad, hx - 3, hy - 20, 6, 40);
  if (details) {
    kaestchen(ctx, '#ffffff', hx - 7, hy - 20, 2, 40);
    kaestchen(ctx, '#ffffff', hx + 5, hy - 20, 2, 40);
  }
  ctx.restore();
  flaeche(ctx, '#1d1d1d', [hx - 9, hy - 14, hx + 9, hy - 14, hx + 6, hy - 21, hx - 6, hy - 21]); // Spoiler
  oval(ctx, 'rgba(255,255,255,0.4)', hx - 7, hy - 9, 5, 3);

  // ----- Rücken in der Lederkombi, mit Aero-Höcker -----
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-20 + h, -114);
  ctx.lineTo(20 + h, -114);
  ctx.quadraticCurveTo(31 + h, -128, 27 + h, -146);
  ctx.quadraticCurveTo(15 + h, -153, 9 + h, -150);
  ctx.quadraticCurveTo(h, -163, -9 + h, -150);
  ctx.quadraticCurveTo(-15 + h, -153, -27 + h, -146);
  ctx.quadraticCurveTo(-31 + h, -128, -20 + h, -114);
  ctx.closePath();
  const leder = ctx.createLinearGradient(-30 + h, 0, 30 + h, 0);
  leder.addColorStop(0, f.anzugDunkel);
  leder.addColorStop(0.3, f.anzug);
  leder.addColorStop(0.7, f.anzug);
  leder.addColorStop(1, f.anzugDunkel);
  ctx.fillStyle = leder;
  ctx.fill();
  ctx.clip();
  kaestchen(ctx, f.motorrad, -5 + h, -172, 10, 26);                  // Streifen über den Höcker
  kaestchen(ctx, f.motorrad, -32 + h, -150, 9, 40);                  // Seitenteile
  kaestchen(ctx, f.motorrad, 23 + h, -150, 9, 40);
  if (details) {
    kaestchen(ctx, '#ffffff', -24 + h, -150, 2, 40);
    kaestchen(ctx, '#ffffff', 22 + h, -150, 2, 40);
    oval(ctx, 'rgba(255,255,255,0.25)', -3 + h, -160, 3, 6);         // Glanz auf dem Höcker
  }
  ctx.restore();
  if (breite > 25) {
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = f.motorradDunkel;
    ctx.strokeText(String(nummer), h, -131);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(nummer), h, -131);
  }

  // ----- Beine mit Knieschleifern und Rennstiefeln -----
  for (const s of [-1, 1]) {
    const raus = s === innen ? knieRaus : 0;
    const huefte = [s * 14 + h * 0.8, -112];
    const knie = [s * (40 + raus * 14) + h * 0.3, -100 + raus * 16];
    const fuss = [s * 27, -72];
    flaeche(ctx, f.anzugDunkel, [huefte[0] - s * 7, huefte[1] - 6, huefte[0] + s * 7, huefte[1] - 8,
      knie[0] + s * 5, knie[1] - 4, knie[0] - s * 5, knie[1] + 6]);
    flaeche(ctx, '#1b1b1b', [knie[0] - s * 5, knie[1] + 4, knie[0] + s * 5, knie[1] - 3,
      fuss[0] + s * 6, fuss[1] - 4, fuss[0] - s * 6, fuss[1] + 3]);
    if (details) kaestchen(ctx, '#e8e8e8', fuss[0] - 6, fuss[1] - 10, 12, 3, 1); // weißer Streifen am Stiefel
    kaestchen(ctx, '#8a8f96', fuss[0] - 4, fuss[1] + 2, 8, 3);                  // Fußraste
    oval(ctx, f.motorrad, knie[0] + s * 4, knie[1] + 2, 4.5, 6);                 // Knieschleifer
    if (raus > 0.8 && details) {                                                 // Funken am Knie!
      for (let i = 0; i < 4; i++) {
        const fx = knie[0] + s * (4 + Math.random() * 10);
        const fy = knie[1] + 8 + Math.random() * 10;
        oval(ctx, Math.random() < 0.5 ? '#ffd166' : '#ff9f1c', fx, fy, 1.5, 1);
      }
    }
  }
  oval(ctx, f.anzugDunkel, h * 0.8, -112, 21, 9);                                // Po auf dem Sitz

  // ----- Heck mit Startnummer und Bremslicht -----
  const heck = ctx.createLinearGradient(0, -108, 0, -80);
  heck.addColorStop(0, f.motorradHell);
  heck.addColorStop(1, f.motorradDunkel);
  flaeche(ctx, heck, [-15, -108, 15, -108, 11, -80, -11, -80]);
  kaestchen(ctx, '#ffffff', -9, -105, 18, 13, 3);
  if (breite > 30) {
    ctx.fillStyle = '#111';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(nummer), 0, -98);
  }
  if (bremst) oval(ctx, 'rgba(255,60,60,0.45)', 0, -84, 16, 7);
  kaestchen(ctx, bremst ? '#ff3030' : '#8a1010', -7, -86, 14, 4, 2);

  // ----- Schwinge, Kette, Auspuff -----
  for (const s of [-1, 1]) {
    const alu = ctx.createLinearGradient(s * 15, 0, s * 21, 0);
    alu.addColorStop(0, '#5d6168');
    alu.addColorStop(0.5, '#b9bec6');
    alu.addColorStop(1, '#4d5157');
    kaestchen(ctx, alu, s > 0 ? 15 : -21, -46, 6, 24, 2);
  }
  kaestchen(ctx, '#333', -24, -48, 2.5, 22, 1);
  const titan = ctx.createLinearGradient(18, 0, 32, 0);
  titan.addColorStop(0, '#6f6a73');
  titan.addColorStop(0.45, '#d9d2dc');
  titan.addColorStop(1, '#5e5963');
  kaestchen(ctx, titan, 18, -78, 14, 26, 6);
  kreis(ctx, '#222', 25, -59, 5.5);
  kreis(ctx, '#000', 25, -59, 3);
  flaeche(ctx, '#1f1f1f', [-15, -56, 15, -56, 12, -64, -12, -64]); // Spritzschutz über dem Reifen

  // ----- Slick-Reifen: breit, glatt, glänzend -----
  const reifen = ctx.createLinearGradient(-16, 0, 16, 0);
  reifen.addColorStop(0, '#0a0a0a');
  reifen.addColorStop(0.5, '#343434');
  reifen.addColorStop(1, '#0a0a0a');
  kaestchen(ctx, reifen, -16, -56, 32, 58, 14);
  kaestchen(ctx, 'rgba(255,255,255,0.08)', -4, -52, 8, 50, 4);

  ctx.restore();
}

// =====================================================================
//  DAS CROSS-MOTORRAD (von hinten gesehen)
//  Wir malen von vorne nach hinten – was weiter weg ist, zuerst:
//  Lenker -> Arme -> Helm -> Rücken -> Beine -> Heck vom Motorrad -> Hinterrad.
//  So verdeckt immer das, was näher an der Kamera ist, das Weitere.
// =====================================================================
function zeichneCrossMotorrad(ctx, x, y, breite, f, neigung, bremst, nummer, luft = 0) {
  const k = breite / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);

  schattenMalen(ctx, neigung, luft, k);

  ctx.rotate(neigung);
  const h = neigung * 16;                   // der Oberkörper lehnt sich in die Kurve
  const innen = Math.sign(neigung);         // auf dieser Seite ist die Kurve
  const fussRaus = begrenzt((Math.abs(neigung) - 0.2) * 3); // in engen Kurven: inneres Bein raus!
  const details = breite > 40;              // kleine Details nur malen, wenn man sie sieht

  // ----- Lenker mit Handschützern -----
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-60, -158);
  ctx.quadraticCurveTo(0, -166, 60, -158);
  ctx.stroke();
  for (const s of [-1, 1]) {
    flaeche(ctx, f.motorrad, [s * 54, -168, s * 66, -167, s * 69, -158, s * 60, -153, s * 54, -155]);
  }

  // ----- Kühlerverkleidungen links und rechts vom Tank -----
  for (const s of [-1, 1]) {
    flaeche(ctx, s < 0 ? f.motorradDunkel : f.motorrad, [s * 16, -148, s * 34, -146, s * 32, -126, s * 18, -129]);
    if (details) flaeche(ctx, '#ffffff', [s * 22, -142, s * 31, -141, s * 30, -137, s * 22, -138]);
  }

  // ----- Arme: Ellbogen hoch, Hände am Lenker -----
  for (const s of [-1, 1]) {
    const schulter = [s * 24 + h, -182];
    const ellbogen = [s * 49 + h * 0.4, -177];
    const hand = [s * 58, -158];
    ctx.lineJoin = 'round';
    ctx.strokeStyle = f.anzugDunkel;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(...schulter);
    ctx.lineTo(...ellbogen);
    ctx.lineTo(...hand);
    ctx.stroke();
    ctx.strokeStyle = f.anzug;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = f.motorrad;                   // Streifen am Ärmel
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ellbogen[0] - s * 3, ellbogen[1] - 5);
    ctx.lineTo(ellbogen[0] + s * 4, ellbogen[1] + 6);
    ctx.stroke();
    kreis(ctx, '#1e1e1e', hand[0], hand[1], 7);     // Handschuh
    kreis(ctx, f.motorrad, hand[0] - s * 2, hand[1] - 2, 2.5);
  }

  // ----- Helm: Schirm, Helm, Brillenband und Nackenschutz -----
  const hx = h * 1.3;
  const hy = -209;
  flaeche(ctx, f.motorrad, [hx - 23, hy - 24, hx + 23, hy - 24, hx + 19, hy - 14, hx - 19, hy - 14]); // Schirm schaut oben raus
  const helmFarbe = ctx.createRadialGradient(hx - 7, hy - 9, 2, hx, hy, 22);
  helmFarbe.addColorStop(0, f.helmHell);
  helmFarbe.addColorStop(0.5, f.helm);
  helmFarbe.addColorStop(1, f.helmDunkel);
  kreis(ctx, helmFarbe, hx, hy, 20);
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx, hy, 20, 0, Math.PI * 2);
  ctx.clip();
  kaestchen(ctx, f.motorrad, hx - 4, hy - 22, 8, 44);
  kaestchen(ctx, '#151515', hx - 21, hy, 42, 7);          // Brillenband
  if (details) kaestchen(ctx, f.motorrad, hx - 9, hy + 2, 18, 3, 1);
  ctx.restore();
  flaeche(ctx, '#cfd3d8', [hx - 19, hy + 13, hx + 19, hy + 13, hx + 15, hy + 23, hx - 15, hy + 23]); // Nackenschutz
  flaeche(ctx, '#55595f', [hx - 15, hy + 20, hx + 15, hy + 20, hx + 14, hy + 23, hx - 14, hy + 23]);

  // ----- Rücken: weites Trikot mit Rückennummer -----
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-18 + h, -144);
  ctx.lineTo(18 + h, -144);
  ctx.quadraticCurveTo(31 + h, -160, 29 + h, -183);
  ctx.quadraticCurveTo(h, -195, -29 + h, -183);
  ctx.quadraticCurveTo(-31 + h, -160, -18 + h, -144);
  ctx.closePath();
  const trikot = ctx.createLinearGradient(-30 + h, 0, 30 + h, 0);
  trikot.addColorStop(0, f.anzugDunkel);
  trikot.addColorStop(0.3, f.anzug);
  trikot.addColorStop(0.7, f.anzug);
  trikot.addColorStop(1, f.anzugDunkel);
  ctx.fillStyle = trikot;
  ctx.fill();
  ctx.clip();
  kaestchen(ctx, f.motorrad, -32 + h, -196, 9, 54);       // farbige Seitenteile
  kaestchen(ctx, f.motorrad, 23 + h, -196, 9, 54);
  kaestchen(ctx, f.motorradDunkel, -32 + h, -152, 64, 8); // Saum
  if (details) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';                 // Falten
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14 + h, -150);
    ctx.quadraticCurveTo(-10 + h, -160, -16 + h, -170);
    ctx.moveTo(15 + h, -149);
    ctx.quadraticCurveTo(11 + h, -158, 17 + h, -168);
    ctx.stroke();
  }
  ctx.restore();
  if (breite > 25) {
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = f.motorradDunkel;
    ctx.strokeText(String(nummer), h, -166);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(nummer), h, -166);
  }

  // ----- Hose, Knieschützer und hohe Stiefel -----
  flaeche(ctx, f.anzugDunkel, [-19 + h, -150, 19 + h, -150, 21 + h * 0.5, -134, -21 + h * 0.5, -134]);
  for (const s of [-1, 1]) {
    const raus = s === innen ? fussRaus : 0;
    const knie = [s * (35 + raus * 8), -110 + raus * 8];
    const fuss = [s * (30 + raus * 20), -64 + raus * 6];
    // Oberschenkel
    flaeche(ctx, f.anzugDunkel, [s * 6 + h * 0.5, -146, s * 21 + h * 0.5, -146, knie[0] + s * 7, knie[1] - 2, knie[0] - s * 7, knie[1] + 6]);
    if (details) {
      ctx.strokeStyle = f.motorrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s * 17 + h * 0.5, -144);
      ctx.lineTo(knie[0] + s * 4, knie[1] - 2);
      ctx.stroke();
    }
    // Stiefel (geht bis zum Knie)
    const stiefel = ctx.createLinearGradient(fuss[0] - 8, 0, fuss[0] + 8, 0);
    stiefel.addColorStop(0, '#d9d9d9');
    stiefel.addColorStop(0.5, '#ffffff');
    stiefel.addColorStop(1, '#c4c4c4');
    flaeche(ctx, stiefel, [knie[0] - 8, knie[1] + 4, knie[0] + 8, knie[1] + 2, fuss[0] + 8, fuss[1], fuss[0] - 8, fuss[1] + 1]);
    if (details) {
      for (let i = 1; i <= 3; i++) {                     // Schnallen
        const p = i / 4;
        const bx = knie[0] + (fuss[0] - knie[0]) * p;
        const by = knie[1] + (fuss[1] - knie[1]) * p;
        kaestchen(ctx, '#5c5f66', bx - 8, by - 1, 16, 2.5, 1);
      }
      kaestchen(ctx, f.motorrad, fuss[0] - 8, fuss[1] - 12, 16, 3);
    }
    kaestchen(ctx, '#1a1a1a', fuss[0] - 9, fuss[1] - 3, 18, 6, 2);  // Sohle
    // Knieschützer mit Gelenk
    kaestchen(ctx, '#2f3136', knie[0] - 7, knie[1] - 9, 14, 19, 5);
    if (details) kreis(ctx, '#b8bcc4', knie[0], knie[1], 2.5);
    // Fußraste (nur wenn der Fuß drauf steht)
    if (raus < 0.5) kaestchen(ctx, '#777', s * 25 - 4, -61, 8, 3);
  }

  // ----- Heck vom Motorrad -----
  kaestchen(ctx, '#1c1c1c', -10, -134, 20, 24, 6);             // Sitzbank
  kaestchen(ctx, '#232323', -13, -112, 26, 20, 5);             // Luftfilterkasten
  for (const s of [-1, 1]) {                                   // Seitenteile mit Startnummer
    flaeche(ctx, '#f2f2f2', [s * 13, -119, s * 29, -115, s * 28, -89, s * 14, -91]);
    if (breite > 50) {
      ctx.save();
      ctx.translate(s * 21, -103);
      ctx.scale(0.6, 1);                                       // schräg von hinten: schmaler
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(nummer), 0, 0);
      ctx.restore();
    }
  }
  // Federbein mit gelber Feder
  kaestchen(ctx, '#555', -3, -88, 6, 24);
  kaestchen(ctx, '#e0b100', -5, -86, 10, 20, 2);
  if (details) for (let i = 0; i < 5; i++) kaestchen(ctx, '#a07e00', -5, -84 + i * 4, 10, 1.2);
  // Schwinge aus Aluminium, links die Kette
  for (const s of [-1, 1]) {
    const alu = ctx.createLinearGradient(s * 14, 0, s * 21, 0);
    alu.addColorStop(0, '#9aa0a8');
    alu.addColorStop(0.5, '#e4e7eb');
    alu.addColorStop(1, '#80868e');
    kaestchen(ctx, alu, s > 0 ? 14 : -21, -50, 7, 26, 2);
    kreis(ctx, '#3d3d3d', s * 17.5, -35, 3);
  }
  kaestchen(ctx, '#3a3a3a', -24, -54, 3, 24, 1);
  // Auspufftopf rechts
  const topf = ctx.createLinearGradient(22, 0, 38, 0);
  topf.addColorStop(0, '#8f959e');
  topf.addColorStop(0.45, '#eef0f3');
  topf.addColorStop(1, '#7b818a');
  kaestchen(ctx, topf, 22, -106, 16, 32, 7);
  kreis(ctx, '#2a2a2a', 30, -84, 6.5);
  kreis(ctx, '#000', 30, -84, 3);
  // Hinterer Kotflügel – lang und spitz nach hinten oben
  const fluegel = ctx.createLinearGradient(0, -118, 0, -66);
  fluegel.addColorStop(0, f.motorradHell);
  fluegel.addColorStop(0.5, f.motorrad);
  fluegel.addColorStop(1, f.motorradDunkel);
  flaeche(ctx, fluegel, [-9, -66, 9, -66, 15, -86, 17, -106, 12, -118, -12, -118, -17, -106, -15, -86]);
  if (details) {
    flaeche(ctx, 'rgba(255,255,255,0.8)', [-3, -116, 3, -116, 2, -96, -2, -96]);
    oval(ctx, 'rgba(255,255,255,0.35)', -6, -110, 3, 6);
  }

  // ----- Hinterrad mit groben Stollen -----
  const reifen = ctx.createLinearGradient(-14, 0, 14, 0);
  reifen.addColorStop(0, '#0a0a0a');
  reifen.addColorStop(0.5, '#2c2c2c');
  reifen.addColorStop(1, '#0a0a0a');
  kaestchen(ctx, reifen, -13, -66, 26, 68, 12);
  for (let i = 0; i < 8; i++) {
    const sy = -61 + i * 8;
    kaestchen(ctx, '#121212', i % 2 ? -16 : -15, sy, 4, 5, 1);   // Stollen an den Seiten
    kaestchen(ctx, '#121212', i % 2 ? 11 : 12, sy + 4, 4, 5, 1);
    if (details) kaestchen(ctx, '#3c3c3c', i % 2 ? -9 : 1, sy, 8, 3.5, 1); // Stollen in der Mitte
  }

  // ----- Ein bisschen Matsch -----
  if (details) {
    const matsch = 'rgba(95,62,30,0.6)';
    oval(ctx, matsch, -6, -12, 8, 5);
    oval(ctx, matsch, 7, -24, 5, 4);
    oval(ctx, matsch, 0, -74, 7, 3);
    oval(ctx, matsch, -31, -70, 6, 3);
    oval(ctx, matsch, 33, -68, 5, 3);
  }

  ctx.restore();
}

function begrenzt(wert) {
  return Math.max(0, Math.min(1, wert));
}

// =====================================================================
//  BENZINKANISTER – rot, glänzend, schwebt ein bisschen auf und ab
// =====================================================================
function zeichneKanister(ctx, x, y, breite, zeit) {
  const k = breite / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  oval(ctx, 'rgba(255,209,102,0.35)', 0, -2, 62, 12);   // Leuchten auf dem Boden
  oval(ctx, 'rgba(0,0,0,0.3)', 0, -2, 40, 7);           // Schatten
  ctx.translate(0, -22 + Math.sin(zeit * 4) * 7);
  const blech = ctx.createLinearGradient(-40, 0, 40, 0);
  blech.addColorStop(0, '#8f1111');
  blech.addColorStop(0.4, '#f03a3a');
  blech.addColorStop(1, '#7a0e0e');
  kaestchen(ctx, blech, -40, -110, 80, 110, 10);
  ctx.strokeStyle = '#7a0e0e';                          // Griff
  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, -110);
  ctx.lineTo(-26, -128);
  ctx.lineTo(4, -128);
  ctx.lineTo(4, -110);
  ctx.stroke();
  kaestchen(ctx, '#c9c9c9', 16, -126, 16, 18, 3);      // Ausguss
  kaestchen(ctx, '#222', 14, -132, 20, 8, 2);          // Deckel
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';                 // eingeprägtes X
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-30, -98);
  ctx.lineTo(30, -14);
  ctx.moveTo(30, -98);
  ctx.lineTo(-30, -14);
  ctx.stroke();
  kaestchen(ctx, 'rgba(255,255,255,0.35)', -30, -104, 8, 88, 4); // Glanz
  ctx.restore();
}

// =====================================================================
//  DEKO NEBEN DER STRECKE
//  breite/hoehe : Größe in der Spielwelt (die Straße ist 4000 breit)
//  hart         : true = man prallt ab, wenn man dagegen fährt
//  malen        : malt die Deko in einem Raster, das 100 Einheiten breit ist
// =====================================================================

const FAN_FARBEN = ['#e63946', '#ffd166', '#118ab2', '#06d6a0', '#ffffff', '#ff7a00'];

const DEKO = {
  baum: {
    breite: 1000, hoehe: 1500, hart: true,
    malen(ctx) {
      kaestchen(ctx, '#6b4226', -7, -45, 14, 45);
      kreis(ctx, '#2f7d32', 0, -105, 38);
      kreis(ctx, '#2f7d32', -28, -78, 28);
      kreis(ctx, '#2f7d32', 28, -78, 28);
      kreis(ctx, '#2f7d32', 0, -70, 30);
      kreis(ctx, '#4caf50', -12, -115, 16);
    },
  },
  tanne: {
    breite: 700, hoehe: 1500, hart: true,
    malen(ctx) {
      kaestchen(ctx, '#5b3a1e', -6, -30, 12, 30);
      flaeche(ctx, '#1f5f3a', [-50, -30, 50, -30, 0, -110]);
      flaeche(ctx, '#236b41', [-40, -80, 40, -80, 0, -160]);
      flaeche(ctx, '#287a4a', [-28, -130, 28, -130, 0, -210]);
    },
  },
  busch: {
    breite: 800, hoehe: 450, hart: false,
    malen(ctx) {
      oval(ctx, '#3c8d40', -25, -22, 28, 22);
      oval(ctx, '#3c8d40', 22, -24, 30, 24);
      oval(ctx, '#4fa653', 0, -34, 28, 22);
    },
  },
  kaktus: {
    breite: 500, hoehe: 1100, hart: true,
    malen(ctx) {
      kaestchen(ctx, '#2e8b57', -15, -220, 30, 220, 15);
      kaestchen(ctx, '#2e8b57', -50, -150, 16, 60, 8);
      kaestchen(ctx, '#2e8b57', -50, -104, 40, 16, 8);
      kaestchen(ctx, '#2e8b57', 34, -180, 16, 70, 8);
      kaestchen(ctx, '#2e8b57', 10, -124, 40, 16, 8);
      kaestchen(ctx, '#3fa86b', -6, -212, 4, 200, 2);
    },
  },
  fels: {
    breite: 1200, hoehe: 700, hart: true,
    malen(ctx) {
      flaeche(ctx, '#a0522d', [-50, 0, -40, -35, -15, -58, 20, -50, 45, -25, 50, 0]);
      flaeche(ctx, '#7a3e22', [5, -52, 20, -50, 45, -25, 50, 0, 10, 0]);
    },
  },
  tribuene: {
    breite: 3600, hoehe: 1500, hart: true,
    malen(ctx) {
      kaestchen(ctx, '#d9d9d9', -50, -42, 100, 42);
      flaeche(ctx, '#1d3557', [-53, -46, 53, -46, 49, -38, -49, -38]);
      for (let reihe = 0; reihe < 4; reihe++) {
        const y = -34 + reihe * 7;
        kaestchen(ctx, reihe % 2 ? '#8d99ae' : '#a8b2c4', -47, y, 94, 6);
        for (let s = 0; s < 24; s++) {
          kreis(ctx, FAN_FARBEN[(s * 7 + reihe * 3) % FAN_FARBEN.length], -45 + s * 3.9, y + 1.5, 1.7);
        }
      }
      kaestchen(ctx, '#457b9d', -50, -6, 100, 6);
    },
  },
  reifen: {
    breite: 700, hoehe: 420, hart: true,
    malen(ctx) {
      for (let spalte = 0; spalte < 4; spalte++) {
        for (let lage = 0; lage < 3; lage++) {
          kaestchen(ctx, '#1a1a1a', -48 + spalte * 24, -20 * (lage + 1), 23, 19, 6);
        }
        kaestchen(ctx, spalte % 2 ? '#e63946' : '#f4f4f4', -46 + spalte * 24, -56, 19, 5, 2);
      }
    },
  },
  schild: {
    breite: 700, hoehe: 800, hart: false,
    malen(ctx, d) {
      kaestchen(ctx, '#888', -4, -60, 8, 60);
      kaestchen(ctx, '#ffffff', -50, -114, 100, 56, 6);
      ctx.save();
      ctx.scale(d.richtung, 1); // Pfeil zeigt in Kurvenrichtung
      for (const versatz of [-18, 14]) {
        flaeche(ctx, '#d62828', [
          versatz - 14, -108, versatz + 2, -108, versatz + 20, -86,
          versatz + 2, -64, versatz - 14, -64, versatz + 4, -86,
        ]);
      }
      ctx.restore();
    },
  },
  plakat: {
    breite: 2600, hoehe: 1400, hart: true,
    malen(ctx, d) {
      kaestchen(ctx, '#777', -40, -20, 4, 20);
      kaestchen(ctx, '#777', 36, -20, 4, 20);
      kaestchen(ctx, '#ffd166', -51, -55, 102, 38, 3);
      kaestchen(ctx, '#ffffff', -48, -52, 96, 32, 2);
      ctx.fillStyle = '#d62828';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const b = ctx.measureText(d.text).width;
      const s = Math.min(1, 88 / b);
      ctx.save();
      ctx.translate(0, -36);
      ctx.scale(s, s);
      ctx.fillText(d.text, 0, 0);
      ctx.restore();
    },
  },
  fahne: {
    breite: 300, hoehe: 1300, hart: false,
    malen(ctx, d) {
      kaestchen(ctx, '#dddddd', -4, -433, 8, 433);
      flaeche(ctx, d.farbe, [4, -430, 70, -420, 95, -395, 4, -360]);
    },
  },
  strohballen: {
    breite: 900, hoehe: 500, hart: true,
    malen(ctx) {
      kaestchen(ctx, '#e9c46a', -50, -55, 100, 55, 8);
      for (const y of [-44, -30, -16]) kaestchen(ctx, '#d4ac3a', -45, y, 90, 3);
      kaestchen(ctx, '#f4d58d', -44, -53, 88, 5, 2);
    },
  },
  zuschauer: {
    breite: 1600, hoehe: 900, hart: false,
    malen(ctx) {
      for (let i = 0; i < 5; i++) {
        const x = -40 + i * 20;
        const haut = i % 3 === 1 ? '#8d5524' : '#f1c27d';
        if (i % 2 === 0) { // jubelt mit erhobenen Armen
          ctx.strokeStyle = haut;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x - 5, -32);
          ctx.lineTo(x - 10, -50);
          ctx.moveTo(x + 5, -32);
          ctx.lineTo(x + 10, -50);
          ctx.stroke();
        }
        kaestchen(ctx, '#2b2d42', x - 5, -14, 10, 14);
        kaestchen(ctx, FAN_FARBEN[(i * 2 + 1) % FAN_FARBEN.length], x - 7, -36, 14, 24, 4);
        kreis(ctx, haut, x, -42, 6);
      }
    },
  },
  sprungschild: {
    breite: 700, hoehe: 900, hart: false,
    malen(ctx) {
      kaestchen(ctx, '#888', -4, -70, 8, 70);
      kaestchen(ctx, '#ffd400', -50, -128, 100, 60, 8);
      flaeche(ctx, '#111', [-38, -76, 6, -76, 6, -98]);   // die Rampe
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();                                     // die Flugbahn
      ctx.moveTo(8, -102);
      ctx.quadraticCurveTo(26, -130, 38, -92);
      ctx.stroke();
      flaeche(ctx, '#111', [30, -98, 46, -98, 38, -84]);
    },
  },
  totbaum: {
    breite: 800, hoehe: 1400, hart: true,
    malen(ctx) {
      flaeche(ctx, '#2a2420', [-7, 0, 7, 0, 3, -150, -3, -150]);
      ctx.strokeStyle = '#2a2420';
      ctx.lineCap = 'round';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -70);
      ctx.lineTo(-34, -112);
      ctx.moveTo(0, -95);
      ctx.lineTo(30, -138);
      ctx.moveTo(-18, -92);
      ctx.lineTo(-40, -96);
      ctx.moveTo(14, -118);
      ctx.lineTo(36, -114);
      ctx.stroke();
    },
  },
};

// Malt eine Deko. cx/y = Mitte unten auf dem Bildschirm, pxBreite = Breite in Pixeln.
// clipY schneidet ab, was hinter einem Hügel verschwinden soll.
function dekoMalen(ctx, d, cx, y, pxBreite, clipY, nebel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, ctx.canvas.width, clipY);
  ctx.clip();
  ctx.globalAlpha = nebel;
  ctx.translate(cx, y);
  ctx.scale(pxBreite / 100, pxBreite / 100);
  DEKO[d.typ].malen(ctx, d);
  ctx.restore();
}

// =====================================================================
//  HINTERGRUND: Wolken, Berge und Hügel werden einmal vorgemalt.
//  Jede Ebene ist doppelt so breit wie der Bildschirm und passt am Rand
//  nahtlos aneinander, damit man sie endlos verschieben kann.
// =====================================================================
function erzeugeHintergrund(def, breite, hoehe) {
  const f = def.farben;
  const w = breite * 2;
  const horizont = hoehe / 2;
  const h = horizont + 60;

  function neueEbene() {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Wolken
  const wolken = neueEbene();
  if (def.wolken) {
    const c = wolken.getContext('2d');
    for (let i = 0; i < 9; i++) {
      const x = Math.random() * w;
      const y = 30 + Math.random() * (horizont - 160);
      const s = 25 + Math.random() * 30;
      for (const dx of [-w, 0, w]) {
        for (let j = 0; j < 5; j++) {
          oval(c, '#ffffff', x + dx + (j - 2) * s * 0.7, y - Math.sin(j / 4 * Math.PI) * s * 0.4, s * 0.7, s * 0.45);
        }
      }
    }
  }

  // Berge (weit weg, mit Dunst nach unten hin)
  const berge = neueEbene();
  {
    const c = berge.getContext('2d');
    const verlauf = c.createLinearGradient(0, horizont - 200, 0, horizont);
    verlauf.addColorStop(0, f.berge);
    verlauf.addColorStop(1, f.nebel);
    c.fillStyle = verlauf;
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      const p = (x / w) * Math.PI * 2;
      const hh = 110 + 45 * Math.sin(p * 2 + 1) + 30 * Math.sin(p * 5 + 2) + 14 * Math.sin(p * 13 + 0.5);
      c.lineTo(x, horizont - hh);
    }
    c.lineTo(w, h);
    c.closePath();
    c.fill();

    // Ein Vulkan mit Lava, die an den Seiten herunterläuft
    if (def.vulkan) {
      for (const x of [w * 0.35 - w, w * 0.35, w * 0.35 + w]) {
        const spitze = horizont - 235;
        const leuchten = c.createRadialGradient(x, spitze, 5, x, spitze, 120);
        leuchten.addColorStop(0, 'rgba(255,120,40,0.9)');
        leuchten.addColorStop(1, 'rgba(255,60,20,0)');
        c.fillStyle = leuchten;
        c.fillRect(x - 120, spitze - 120, 240, 240);
        flaeche(c, abdunkeln(f.berge, 0.8), [x - 280, horizont, x - 45, spitze, x + 45, spitze, x + 280, horizont]);
        flaeche(c, '#ff5a1f', [x - 40, spitze, x - 22, spitze, x - 60, spitze + 110, x - 75, spitze + 100]);
        flaeche(c, '#ff5a1f', [x + 10, spitze, x + 30, spitze, x + 70, spitze + 140, x + 52, spitze + 145]);
        flaeche(c, '#ffb703', [x - 30, spitze - 4, x + 30, spitze - 4, x + 20, spitze + 6, x - 20, spitze + 6]);
      }
    }
  }

  // Hügel (näher dran)
  const huegel = neueEbene();
  {
    const c = huegel.getContext('2d');
    const profil = (x) => {
      const p = (x / w) * Math.PI * 2;
      let hh = 45 + 22 * Math.sin(p * 3 + 0.5) + 14 * Math.sin(p * 7 + 1.3) + 6 * Math.sin(p * 17);
      if (def.tafelberge) hh = Math.min(hh * 1.7, 72); // flache Tafelberge wie im Wilden Westen
      return horizont - hh;
    };
    c.fillStyle = f.huegel;
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) c.lineTo(x, profil(x));
    c.lineTo(w, h);
    c.closePath();
    c.fill();
    if (def.baumSilhouetten) {
      const farbe = abdunkeln(f.huegel, 0.75);
      for (let i = 0; i < 160; i++) {
        const x = Math.random() * w;
        const y = profil(x) + 4;
        const s = 5 + Math.random() * 7;
        for (const dx of [-w, 0, w]) flaeche(c, farbe, [x + dx - s, y, x + dx + s, y, x + dx, y - s * 3]);
      }
    }
  }

  return { wolken, berge, huegel };
}
