# LoxEvo

> **Status: Entwicklungsversion / Work in Progress**
>
> LoxEvo ist aktuell noch **nicht produktiv freigegeben**. Das Projekt ist im Aufbau und kann lokal oder auf einem Test-LoxBerry ausprobiert werden. Installation, API, Konfiguration und Alexa/TTS-Integration koennen sich noch aendern. Nutzung bitte nur im Dry-Run oder in einer bewusst getesteten Umgebung.

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

Der aktuelle Stand ist ein Docker-faehiger Prototyp mit HTTP-API, Web-UI, generischen Loxone-Befehlen und integriertem TTS-Modul.
Loxone-Befehle laufen standardmaessig im Dry-Run-Modus, damit lokal gefahrlos getestet werden kann.
Wenn TTS aktiviert wird, aber `alexa-remote2` oder die Cookie-Datei noch fehlt, startet LoxEvo trotzdem weiter und zeigt den TTS-Status in der Web-UI an.

## Setup

Ausfuehrliche Installationsschritte stehen in [INSTALL.md](INSTALL.md).

```bash
mkdir -p data
docker compose up -d --build
```

Falls `data/config.json` noch nicht existiert, legt LoxEvo sie beim ersten Start automatisch aus `config.example.json` an.

Web-UI:

```text
http://<loxberry>:8080
```

In `data/config.json` ist `loxone.dryRun` standardmaessig `true`. Dann erzeugt LoxEvo nur die URL und zeigt sie unter "Letzte Befehle", sendet aber noch nichts an Loxone.
Der Modus kann auch direkt oben in der Web-UI umgeschaltet werden.

TTS braucht das Paket `alexa-remote2` und eine gueltige Alexa-Cookie-Datei. Im Docker/LoxBerry-Betrieb wird das Paket ueber die Projektabhaengigkeiten installiert. Lokal ohne installierte Node-Abhaengigkeiten bleibt TTS sichtbar, aber als "nicht bereit" markiert.
Fuer den LoxBerry-Test siehe [docs/loxberry-deploy.md](docs/loxberry-deploy.md).

Die Web-UI zeigt unter "Wartung" die installierte `alexa-remote2`-Version, die aktuelle npm-Version und kann ein Update im laufenden Container anstossen. Nach einem Paketupdate ist ein Neustart von LoxEvo erforderlich.

Private Daten gehoeren in `data/`:

- `data/config.json`
- `data/Node.txt`

Dieser Ordner ist absichtlich von Git ausgenommen, damit keine Loxone-Zugangsdaten, UUIDs oder Alexa-Geraete-IDs veroeffentlicht werden.
Alle privaten Werte werden nach der Installation ueber die Web-UI oder direkt in `data/config.json` gepflegt.

Wichtig fuer Live-Tests: Die Web-UI zeigt und speichert Loxone-Zugangsdaten. LoxEvo sollte deshalb nur im eigenen LAN oder per VPN erreichbar sein und nicht direkt ins Internet freigegeben werden.

Die Web-UI ist der empfohlene Konfigurationsweg. Aktuell koennen dort gepflegt werden:

- Loxone-Miniserver URL, Benutzer und Passwort
- Dry-Run/Live-Modus
- frei definierbare Rubriken und Befehle mit Sprachname, Raum, Funktion, Aktion, Loxone-Typ, UUID, Wert oder Pfad
- TTS-Aktivierung, Cookie-Datei, Lautstaerken und Alexa-Geraetelisten
- TTS-Status mit klarer Fehlermeldung, falls Alexa noch nicht bereit ist

Die Oberflaeche ist in drei Bereiche gegliedert:

- `Bedienen`: frei definierte Befehle und TTS direkt ausloesen
- `Alexa / Endpunkte`: fertige HTTP-Aufrufe fuer Befehle, TTS und Alexa2Lox-kompatible URLs testen und kopieren
- `Konfiguration`: Loxone, frei definierbare Befehle und TTS pflegen
- `Protokoll`: letzte Befehle und Dry-Run/Live-Aktionen ansehen

Die JSON-Ansicht bleibt als Expertenmodus erhalten.

Echte Loxone-Requests aktivieren:

```json
"loxone": {
  "dryRun": false
}
```

## Befehls-API

```text
POST http://<loxberry>:8080/api/command
Content-Type: application/json

{"command":"kueche_licht_hell"}
```

Die Befehle werden in der Web-UI frei angelegt. Beispiel: `kueche_licht_hell` kann als Sprachname `Kueche Licht Hell`, als Raum `kueche`, als Funktion `licht` und als Aktion `hell` bekommen.

Unterstuetzte Loxone-Befehlstypen:

- `changeTo`: `/jdev/sps/io/<uuid>/changeTo/<wert>` fuer Lichtstimmungen und Szenen
- `direct`: `/jdev/sps/io/<uuid>/<wert>` fuer Befehle wie `FullUp`, `FullDown`, `on`, `off` oder Nummernwerte
- `pulse`: `/jdev/sps/io/<uuid>/pulse` fuer Taster
- `raw`: frei definierter Pfad, optional mit `{uuid}`, `{value}` oder `{command}`

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
POST http://<loxberry>:8080/command/kueche_licht_hell
```

Die alte Kurzform `/light/<raum>/<szene>` bleibt vorerst als Legacy-Einstieg erhalten, wenn eine alte `rooms`-Konfiguration vorhanden ist.

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
