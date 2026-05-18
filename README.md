# LoxEvo

Eigene LoxBerry-Zentrale fuer Alexa, Echo-TTS und Loxone.

Dieses Projekt ist bewusst **keine Code-Kopie von EchoLox**. EchoLox und Alexa2Lox dienen als fachliche Referenzen fuer das Zielbild:

- Alexa-Sprachbefehle sollen einfach bleiben
- Loxone bleibt die Automationszentrale
- Echo-TTS soll direkt aus Loxone ausloesbar sein
- Wartung soll ueber eine zentrale Konfiguration und Web-UI erfolgen

## Zielarchitektur

```text
Alexa
  -> Alexa-Geraete-/Bridge-Eingang
  -> LoxEvo
  -> Loxone

Loxone
  -> LoxEvo TTS
  -> Echo spricht
```

Der aktuelle Stand ist ein Docker-faehiger Prototyp mit HTTP-API, Web-UI, Loxone-`changeTo` und integriertem TTS-Modul.
Loxone-Befehle laufen standardmaessig im Dry-Run-Modus, damit lokal gefahrlos getestet werden kann.

## Setup

```bash
cp config.example.json config.json
docker compose up -d --build
```

Web-UI:

```text
http://<loxberry>:8080
```

In `config.json` ist `loxone.dryRun` standardmaessig `true`. Dann erzeugt LoxEvo nur die URL und zeigt sie unter "Letzte Befehle", sendet aber noch nichts an Loxone.
Der Modus kann auch direkt oben in der Web-UI umgeschaltet werden.

Die Web-UI ist der empfohlene Konfigurationsweg. Aktuell koennen dort gepflegt werden:

- Loxone-Miniserver URL, Benutzer und Passwort
- Dry-Run/Live-Modus
- Raeume mit Name, Schluessel, UUID und Szenenwerten
- TTS-Aktivierung, Cookie-Datei, Lautstaerken und Alexa-Geraetelisten

Die Oberflaeche ist in drei Bereiche gegliedert:

- `Bedienen`: Licht-Szenen und TTS direkt ausloesen
- `Konfiguration`: Loxone, Raeume, Szenen und TTS pflegen
- `Protokoll`: letzte Befehle und Dry-Run/Live-Aktionen ansehen

Die JSON-Ansicht bleibt als Expertenmodus erhalten.

Echte Loxone-Requests aktivieren:

```json
"loxone": {
  "dryRun": false
}
```

## Licht-API

```text
POST http://<loxberry>:8080/api/light
Content-Type: application/json

{"room":"kueche","scene":"ambient"}
```

Letzte Aktionen:

```text
GET http://<loxberry>:8080/api/events
```

Dry-Run per API umschalten:

```text
PUT http://<loxberry>:8080/api/dry-run
Content-Type: application/json

{"enabled":true}
```

Kurzform:

```text
POST http://<loxberry>:8080/light/kueche/ambient
```

## TTS-API

Normale Sprachausgabe:

```text
POST http://<loxberry>:8080/tts/speak
Body: Geschirrspueler ist fertig.
```

Alarm:

```text
POST http://<loxberry>:8080/tts/alarm
Body: Achtung, Alarm wurde ausgeloest.
```

Lautstaerke:

```text
POST http://<loxberry>:8080/tts/lautstaerke
Body: 70
```

## Alexa2Lox-kompatibler TTS-Aufruf

Damit bestehende Loxone-Aufrufe leichter migriert werden koennen, gibt es zusaetzlich einen kompatiblen Einstieg:

```text
GET http://<loxberry>:8080/admin/plugins/alexa2lox/tts.php?device=Kueche&text=Hallo&vol=50
GET http://<loxberry>:8080/admin/plugins/alexa2lox/tts.php?d=Kueche&t=Hallo&vol=50
```

Unterstuetzt:

- `device`, `devices` oder `d`
- `text` oder `t`
- `vol`
- `device=ALL`
- Text `0` wird standardmaessig ignoriert
- `ss` und `Grad` werden fuer bessere Aussprache normalisiert

Hinweis: In diesem Prototyp muessen die Geraete in `config.json` so angegeben werden, wie das TTS-Modul sie ansprechen kann. Im spaeteren EchoLox-Ausbau soll eine echte Geraeteliste mit Namen, Seriennummern und Auswahl per Web-UI folgen.

## Rechtliche Linie

EchoLox ist eine wichtige technische Referenz, aber in der geprueften Repository-Ansicht war kein klares `LICENSE`-File sichtbar. Ohne Lizenz gelten standardmaessig restriktive Urheberrechte. Darum wird LoxEvo als eigenstaendige Implementierung aufgebaut:

- kein Kopieren von EchoLox-Code
- keine Uebernahme von Assets, Logos, Texten oder Web-UI
- eigene Projektstruktur und eigener Name
- Referenzen nur als technische Orientierung

Siehe auch:

- [docs/legal-notes.md](docs/legal-notes.md)
- [docs/echolox-tts-integration.md](docs/echolox-tts-integration.md)

## GitHub

Empfohlener Repository-Name:

```text
loxevo
```

Beschreibung:

```text
Own LoxBerry gateway for Alexa, Echo TTS and Loxone automation.
```

Wenn das Projekt oeffentlich werden soll, ist eine eigene Lizenz sinnvoll. Fuer eine einfache eigene Open-Source-Version bietet sich MIT an. Fuer eine private Version kann die Lizenz auch spaeter entschieden werden.
