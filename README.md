# DATA C€NT€R · Video-Tool

Tool für die Ausstellung **DATA C€NT€R** von Marco Schmitt.
Ein Video wählen, eine von fünf Varianten wählen: Das Logo eröffnet und beendet den Clip,
dazwischen läuft ein Laufband mit den Ausstellungsdaten. Ergebnis ist ein MP4 mit Originalton.

**Benutzen:** https://epistaxis67.github.io/datacenter-tool/
(am Handy oder Rechner im Browser öffnen, am besten Safari oder Chrome)

Das Video wird nur auf dem eigenen Gerät bearbeitet und nirgends hochgeladen.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` / `tool.html` | das Tool (eine Datei, läuft auch offline) |
| `varianten.html` | alle fünf Varianten nebeneinander zum Vergleichen |
| `engine.js` | gemeinsamer Animations-Code beider Seiten |
| `*.template.html` | Vorlagen der beiden Seiten |
| `vorlage/data-center-logo.svg` | Logo, aus dem Foto nachgezeichnet |
| `svg/` | Logo, Schriftzug und Symbole als SVG |
| `build.py` | erzeugt `svg/`, `varianten.html`, `tool.html` und `index.html` |

## Ändern

Nach Änderungen an `engine.js`, den Vorlagen oder den Symbolen:

```bash
python3 build.py
```

Der Laufband-Text lässt sich direkt im Tool bearbeiten. Den Standardtext legt `DEFAULT_TEXT` in `engine.js` fest.
