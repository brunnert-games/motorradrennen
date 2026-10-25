# 🏍️ Motorrad-Rennen

Ein Motorrad-Rennspiel für den Browser – ohne Installation, ohne Internet.

## Starten

Doppelklick auf **`index.html`**. Fertig!

| Taste      | Was passiert       |
|------------|--------------------|
| ↑ oder W   | Gas geben          |
| ↓ oder S   | Bremsen            |
| ← → / A D  | Lenken             |
| P / Esc    | Pause              |
| M          | Ton an / aus       |
| Enter      | Rennen starten     |

## Auf dem Tablet spielen

Auf Geräten mit Touchscreen erscheinen während des Rennens große Knöpfe:
links **◀ ▶** zum Lenken, rechts **Bremse** und **Gas**, und **⏸** für Pause.
Man kann mehrere Knöpfe gleichzeitig drücken und mit dem Daumen von ◀ nach ▶ rutschen.
Das Tablet muss quer gehalten werden.

So kommt das Spiel aufs Tablet: Auf dem Mac im Spiel-Ordner einen kleinen Webserver starten

    python3 -m http.server 8000

und auf dem Tablet (im selben WLAN) im Browser `http://<IP-Adresse-des-Macs>:8000` öffnen.
Die IP-Adresse steht in den Systemeinstellungen unter WLAN → Details.
Mit „Teilen → Zum Home-Bildschirm“ bekommt das Spiel ein eigenes Symbol und startet ohne Browserleiste.
Tipp: Auf iPad und iPhone hört man den Ton nur, wenn der Lautlos-Modus ausgeschaltet ist.

## Was steckt in welcher Datei?

| Datei             | Inhalt                                                        |
|-------------------|---------------------------------------------------------------|
| `index.html`      | Die Seite mit Menü, Pause- und Ergebnis-Fenster               |
| `css/stil.css`    | Aussehen von Menü und Knöpfen                                 |
| `js/strecken.js`  | **Die Rennstrecken** – Kurven, Hügel, Farben, Plakate         |
| `js/zeichnen.js`  | Malt Motorräder, Bäume, Kakteen, Tribünen und Berge           |
| `js/ton.js`       | Motorgeräusch und Piepen                                      |
| `js/spiel.js`     | Das eigentliche Spiel: Fahren, Gegner, Runden, Anzeigen       |

## So funktioniert die 3D-Straße

Die Strecke besteht aus ganz vielen kurzen Straßenstücken (Segmenten), jedes 200 Einheiten lang.
In jedem Bild werden die nächsten 300 Stücke gemalt: Stücke, die weit weg sind, werden klein
und weit oben gemalt, nahe Stücke groß und unten. In einer Kurve wird jedes weitere Stück ein
bisschen mehr zur Seite verschoben. So entsteht der Eindruck, dass man in die Ferne fährt –
obwohl alles nur flache Vierecke sind!

## Sprit und Benzinkanister

Oben links zeigt die Tankanzeige, wie viel Sprit noch da ist. Mit Vollgas wird der Tank schneller leer
als beim Rollen. Auf der Strecke liegen rote Benzinkanister – drüberfahren füllt den Tank wieder auf.
Ein eingesammelter Kanister ist erst in der nächsten Runde wieder da. Ist der Tank leer, stottert der
Motor und man kommt nur noch ganz langsam voran.

Die Schwierigkeitsstufen stehen in `js/spiel.js` bei `STUFEN`:
wie schnell die Gegner sind, wie weit ein Tank reicht, wie viele Kanister es gibt und wie viel sie nachfüllen.

## Zwei Arten von Strecken

- **Rennstrecken** (`modus: 'rennen'`): Asphalt, rot-weiße Randsteine, schnelle Rennmotorräder.
- **Motocross** (`modus: 'cross'`): Erde mit Reifenspuren, Strohballen, Cross-Motorräder – und Sprünge!
  In einer Cross-Strecke gibt es zwei besondere Abschnitte:
  - `{ sprung: 15 }` – eine Schanze mit Graben (Wasser oder Lava). Die Zahl ist die Breite des Grabens.
    Mit mindestens ca. 130 km/h kommt man drüber, wer langsamer ist, fällt hinein.
  - `{ wellen: 6 }` – viele kleine Buckel hintereinander, über die man hüpft.

## So funktioniert das Springen

Jedes Motorrad hat eine Höhe und eine Geschwindigkeit nach oben. Die Schwerkraft (`SCHWERKRAFT`
in `js/spiel.js`) zieht es immer nach unten. Fällt der Boden schneller weg, als das Motorrad
herunterfällt – zum Beispiel an der Kante einer Rampe –, dann fliegt es! Mit weniger Schwerkraft
fliegt man weiter, wie auf dem Mond.

## So entsteht der Motorsound

Ein Motor macht eigentlich ganz viele kleine Knalle: In jedem Zylinder explodiert immer wieder
etwas Benzin. Das Spiel erzeugt genau diese Knalle – je schneller der Motor dreht, desto mehr
Knalle pro Sekunde, desto höher der Ton. Der Auspuff gibt dem Ganzen dann seine Klangfarbe.

- **Renn-Motorrad:** 4 Zylinder, bis 14.000 Umdrehungen pro Minute → hohes, glattes Kreischen.
- **Cross-Motorrad:** 1 Zylinder, bis 11.000 Umdrehungen → tiefes, unruhiges „Plopp-plopp“ und „Braaap“.

Außerdem gibt es: Gangwechsel mit kurzer Zündunterbrechung, Knallen im Auspuff beim Gaswegnehmen,
einen stotternden Drehzahlbegrenzer in der Luft, Fahrtwind und den Motor des nächsten Gegners –
der kommt von links oder rechts und klingt beim Überholen höher oder tiefer (Doppler-Effekt).
Beim Countdown kann man mit ↑ den Motor aufheulen lassen!

In `js/ton.js` steht bei `MOTOR_KLANG` alles, was den Klang ausmacht. Probiert mal
`zylinder: 2` (ein Zweizylinder) oder `unruhe: 100` (ein ganz alter, stotternder Motor).

## Ideen zum Selbermachen

**Leicht** (nur Zahlen und Texte ändern):

- In `js/strecken.js` bei `plakate` eigene Texte auf die Werbeplakate schreiben, z.B. euren Namen.
- Bei `runden` die Anzahl der Runden ändern.
- Die `farben` einer Strecke ändern – wie wäre es mit lila Gras oder einem grünen Himmel?
- In `js/spiel.js` bei `GEGNER_LISTE` die Namen, Nummern und Farben der Gegner ändern.
- In `js/spiel.js` `MAX_TEMPO`, `FLIEHKRAFT` oder `SCHWERKRAFT` ändern – was passiert dann?
- In einer Cross-Strecke noch mehr `{ sprung: 20 }` einbauen oder den Graben bei `graben` lila färben.

**Mittel:**

- Eine dritte Strecke bauen: In `js/strecken.js` einen Block kopieren und neue Abschnitte ausdenken.
  Das Menü zeigt die neue Strecke automatisch an.
- Eine neue Deko erfinden (z.B. Schneemann oder Haus) in `js/zeichnen.js` bei `DEKO`
  und dann in der Strecke bei `deko` eintragen.
- Eine Nachtstrecke mit dunklem Himmel und viel Nebel.

**Schwer:**

- Ein Turbo-Knopf, der für 3 Sekunden schneller macht.
- Ein Wheelie, wenn man auf gerader Strecke Gas gibt.
- Tricks in der Luft (z.B. mit der Leertaste), die Extra-Punkte geben.
- Münzen auf der Straße, die man einsammeln kann.
