# LoxEvo

[![CI](https://github.com/herdan75/loxevo/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/herdan75/loxevo/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Status: lauffähige Entwicklungsversion**
>
> LoxEvo ist als lauffähige Docker/LoxBerry-Basis nutzbar. Die wichtigsten Funktionen für Loxone-Befehle, virtuelle Alexa-Geräte und Alexa-TTS sind umgesetzt und getestet. Trotzdem können noch kleinere Fehler auftreten, deshalb neue Installationen und neue Befehle zuerst bewusst prüfen und Loxone-Kommandos bei Bedarf im Dry-Run testen.

Eigene LoxBerry-Zentrale für Alexa, Echo-TTS und Loxone.

Die Ziele von LoxEvo:

- Alexa-Sprachbefehle sollen einfach bleiben
- Loxone bleibt die Automationszentrale
- Echo-TTS soll direkt aus Loxone auslösbar sein
- Wartung soll über eine zentrale Konfiguration und Web-UI erfolgen

## Zielarchitektur

```text
Alexa
  -> Alexa-Geräte-/Bridge-Eingang
  -> LoxEvo
  -> Loxone

Loxone
  -> LoxEvo TTS
  -> Echo spricht
```

Der aktuelle Stand ist eine Docker-fähige Basis mit HTTP-API, Web-UI, generischen Loxone-Befehlen und integriertem TTS-Modul.
Loxone-Befehle laufen standardmäßig im Dry-Run-Modus, damit lokal gefahrlos getestet werden kann.
Wenn TTS aktiviert wird, aber `alexa-remote2` oder die Cookie-Datei noch fehlt, startet LoxEvo trotzdem weiter und zeigt den TTS-Status in der Web-UI an.
Optional kann LoxEvo virtuelle Alexa-Geräte im lokalen Netzwerk bereitstellen. Alexa findet diese Geräte über die lokale Gerätesuche; ein Einschaltbefehl wie `Alexa, <Gerätename> an` löst dann den passenden LoxEvo-Befehl aus.

## Setup

Ausführliche Installationsschritte stehen in [INSTALL.md](INSTALL.md).

```bash
mkdir -p data
docker compose up -d --build
```

Falls `data/config.json` noch nicht existiert, legt LoxEvo sie beim ersten Start automatisch aus `config.example.json` an.

Web-UI:

```text
http://<loxberry>:8080
```

In `data/config.json` ist `loxone.dryRun` standardmäßig `true`. Dann erzeugt LoxEvo nur die URL und zeigt sie im Protokoll, sendet aber noch nichts an Loxone.
Der Modus kann auch direkt oben in der Web-UI umgeschaltet werden.

TTS braucht das Paket `alexa-remote2` und eine gültige Alexa-Cookie-Datei. Das Paket wird bewusst nicht fest im Docker-Build installiert, damit LoxEvo auch dann startet, wenn npm-Versionen wechseln. Installiere oder aktualisiere es in der Web-UI unter `Wartung`; im Docker/LoxBerry-Betrieb landet es im gemounteten `/config`-Bereich.
Als Cookie-Datei kann eine reine Cookie-Zeile oder eine JSON-Datei mit `localCookie` verwendet werden. Bei JSON-Dateien nutzt LoxEvo `localCookie`, `csrf` und gespeicherte Registrierungsdaten wie `macDms` und `refreshToken`, falls diese vorhanden sind.
Wenn Amazon trotzdem eine neue Anmeldung verlangt, nutzt `alexa-remote2` einen lokalen Login-Proxy. LoxEvo setzt dafür automatisch die LAN-IP des LoxBerry; bei Bedarf kann `tts.proxyOwnIp` und `tts.proxyPort` in der Web-UI angepasst werden.
Für den LoxBerry-Test siehe [docs/loxberry-deploy.md](docs/loxberry-deploy.md).

Die Web-UI zeigt unter `Wartung` eine lokale Systemprüfung für Konfiguration, Loxone-Zugang, TTS, virtuelle Alexa-Geräte, Gerätesuche und Backup. Diese Prüfung läuft beim Öffnen des Registers oder per Button und erzeugt keine dauernde Hintergrundlast.
Im gleichen Register zeigt LoxEvo die installierte `alexa-remote2`-Version und verfügbare npm-Versionen und kann Installation oder Update im laufenden Container anstoßen. Nach einem Paketupdate ist ein Neustart von LoxEvo erforderlich.
Im gleichen Register können die Einstellungen als Backup exportiert und später wieder importiert werden. Der Export enthält standardmäßig die LoxEvo-Konfiguration; die Alexa-Cookie-Datei kann bei Bedarf bewusst mit exportiert werden.
Backup-Dateien können sensible Daten wie Loxone-Zugangsdaten, UUIDs und optional Amazon-Cookies enthalten und sollten deshalb privat bleiben.

Private Daten gehören in `data/`:

- `data/config.json`
- `data/Node.txt`

Dieser Ordner ist absichtlich von Git ausgenommen, damit keine Loxone-Zugangsdaten, UUIDs oder Alexa-Geräte-IDs veröffentlicht werden.
Alle privaten Werte werden nach der Installation über die Web-UI oder direkt in `data/config.json` gepflegt.
Bei einer Neuinstallation reicht es normalerweise, den Ordner `data/` zu sichern und später wieder in den Projektordner zu legen.

Wichtig für Live-Tests: Die Web-UI zeigt und speichert Loxone-Zugangsdaten. LoxEvo sollte deshalb nur im eigenen LAN oder per VPN erreichbar sein und nicht direkt ins Internet freigegeben werden.

Die Web-UI ist der empfohlene Konfigurationsweg. Aktuell können dort gepflegt werden:

- Loxone-Miniserver URL, Benutzer und Passwort
- Dry-Run/Live-Modus
- virtuelle Alexa-Geräte aus aktiven Befehlen
- frei definierbare Rubriken und Befehle mit Sprachname, Raum, Funktion, Aktion, Loxone-Typ, UUID, Wert oder Pfad
- TTS-Aktivierung, Cookie-Datei, Lautstärken und Alexa-Gerätelisten
- TTS-Status mit klarer Fehlermeldung, falls Alexa noch nicht bereit ist

Die Oberfläche ist in klare Bereiche gegliedert:

- `Testen`: Loxone-Befehle und Alexa-TTS direkt aus der Web-UI prüfen
- `Externe Aufrufe`: fertige URLs für Alexa-Routinen, Loxone und optionale externe Tools testen und kopieren
- `Konfiguration`: Loxone, frei definierbare Befehle und TTS pflegen
- `Wartung`: Systemprüfung ausführen, Paketversionen prüfen, `alexa-remote2` verwalten, Backup exportieren und Backup importieren
- `Protokoll`: zuletzt simulierte oder gesendete Aktionen ansehen

Die JSON-Ansicht bleibt als Expertenmodus erhalten.

Empfohlener Ablauf für neue Installationen:

1. LoxEvo starten und die Web-UI öffnen.
2. Loxone-Zugang eintragen und `Dry-Run aktiv` eingeschaltet lassen.
3. Erste Befehle in `Konfiguration -> Befehle und Sprachnamen` anlegen.
4. Unter `Testen` prüfen, ob die erzeugten Loxone-URLs stimmen.
5. Erst danach den Live-Modus aktivieren.
6. Optional TTS und virtuelle Alexa-Geräte einrichten.

## Backup und Deinstallation

Backups werden in der Web-UI unter `Wartung` erstellt. Der normale Export enthält `config.json` mit Loxone-, Alexa-Bridge-, Befehls- und TTS-Einstellungen. Die Alexa-Cookie-Datei `Node.txt` wird nur exportiert, wenn der entsprechende Haken gesetzt ist, weil diese Datei Zugriffsdaten für das Amazon-Konto enthalten kann. Backup-Dateien enthalten private Installationsdaten und sollten nicht veröffentlicht werden.

Beim Import legt LoxEvo zuerst eine Sicherung der aktuellen Konfiguration im lokalen Datenordner an und schreibt danach die importierte Konfiguration. Wenn im Backup ein Cookie enthalten ist, wird es ebenfalls in den konfigurierten Cookie-Pfad geschrieben.
Installierte npm-Pakete wie `alexa-remote2` werden nicht in die Backup-Datei aufgenommen. Wenn der komplette Ordner `data/` erhalten bleibt, bleiben sie lokal vorhanden; nach einer frischen Wiederherstellung können sie im Register `Wartung` erneut installiert werden.

Eine normale Deinstallation entfernt den Container:

```bash
docker compose down
```

Damit bleiben `data/config.json`, `data/Node.txt` und lokal installierte Wartungspakete bewusst erhalten. Für eine vollständige Entfernung danach den Projektordner `/mnt/docker/loxevo` löschen und bei Bedarf das lokale Image `loxevo:local` sowie ungenutzten Docker-Build-Cache entfernen.

Wenn der optionale Discovery-Helper installiert wurde, kann er so entfernt werden:

```bash
sudo systemctl disable --now loxevo-discovery-helper.service
sudo rm -f /etc/systemd/system/loxevo-discovery-helper.service
sudo rm -f /usr/local/sbin/loxevo-discovery-helper
sudo rm -f /etc/loxevo-discovery-helper.env
sudo systemctl daemon-reload
```

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

{"command":"beispiel_befehl"}
```

Die Befehle werden in der Web-UI frei angelegt. Der Name `beispiel_befehl` steht hier nur als Platzhalter; in deiner Installation kann jeder aktive Befehl einen eigenen Schlüssel, Anzeigenamen, Sprachnamen, Raum, Funktion und Aktion bekommen.

Unterstützte Loxone-Befehlstypen:

- `changeTo`: `/jdev/sps/io/<uuid>/changeTo/<wert>` für Szenen, Werte oder Zustände
- `direct`: `/jdev/sps/io/<uuid>/<wert>` für Befehle wie `FullUp`, `FullDown`, `on`, `off` oder Nummernwerte
- `pulse`: `/jdev/sps/io/<uuid>/pulse` für Taster
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
POST http://<loxberry>:8080/command/beispiel_befehl
```

Die alte Kurzform `/light/<raum>/<szene>` bleibt vorerst als Legacy-Einstieg erhalten, wenn eine alte `rooms`-Konfiguration vorhanden ist.

## Virtuelle Alexa-Geräte

Wenn `alexaBridge.enabled` aktiv ist, bietet LoxEvo jeden aktiven Befehl als virtuelles Alexa-Gerät an. In der Web-UI unter `Konfiguration -> Alexa-Geräte` kann die lokale Brücke aktiviert werden.

Technisch ist das ein lokaler Hue-kompatibler V1-Bridge-Eingang nur für Alexa-Discovery und Ein/Aus-Befehle. Es wird keine Hue-Bridge und keine Hue-Lampe benötigt; LoxEvo nutzt nur das lokale Discovery/API-Verhalten, damit Alexa ohne eigene Cloud-Skill-Entwicklung virtuelle Geräte finden kann.

Für die Gerätesuche muss LoxEvo im gleichen LAN wie die Echo-Geräte erreichbar sein. Im Docker/LoxBerry-Betrieb ist `network_mode: host` deshalb der empfohlene Modus, weil SSDP/UDP 1900 sonst oft nicht sauber bis in den Container gelangt.
Für neuere Echo-Geräte sollte die Alexa-Bridge über Port 80 erreichbar sein. Die Web-UI kann weiter auf Port 8080 laufen; LoxEvo startet bei abweichendem `alexaBridge.advertisePort` einen zusätzlichen Alexa/Hue-HTTP-Listener.
SSDP/UDP 1900 wird nur für die Suche neuer Alexa-Geräte gebraucht. Bereits gefundene Geräte können danach normalerweise weiter über den Alexa/Hue-HTTP-Port bedient werden. Wenn LoxBerry-`ssdpd` oder ein anderer SSDP-Dienst den Port 1900 belegt, zeigt LoxEvo eine Info: vorhandene Geräte funktionieren weiter, neue Geräte werden aber wahrscheinlich nicht gefunden, bis die Gerätesuche kurz aktiviert wird.

Optional kann auf dem LoxBerry-Host ein enger Discovery-Helper installiert werden. Er pausiert für die Gerätesuche nur die Dienste `ssdpd` und `lbssdpd` und startet sie danach wieder. Der Helper führt keine freien Shell-Befehle aus und ist nur lokal auf `127.0.0.1` erreichbar.
Dieser Schritt wird nicht automatisch durch den Docker-Container ausgeführt, weil dafür bewusst Host-/Root-Rechte nötig sind. Er ist nur erforderlich, wenn UDP 1900 belegt ist und neue Alexa-Geräte gesucht werden sollen.

```bash
cd /mnt/docker/loxevo
sudo sh tools/install-discovery-helper.sh
```

Danach kann die Gerätesuche in der Web-UI per Button gesteuert werden:

1. `Konfiguration -> Alexa-Gerätesuche` öffnen.
2. `Gerätesuche aktivieren` klicken.
3. In der Alexa-App nach neuen Geräten suchen.
4. Nach der Suche `Gerätesuche beenden` klicken.

Damit wird dem LoxBerry der SSDP-Dienst nicht dauerhaft weggenommen. Die Buttons funktionieren nur, wenn der optionale Host-Helper installiert und gestartet ist.

Typischer Ablauf:

```text
Alexa-App -> Geräte -> + -> Gerät hinzufügen -> Andere -> Geräte suchen
```

Danach kann ein Befehl über den angezeigten Gerätenamen ausgelöst werden:

```text
Alexa, <Gerätename> an
```

LoxEvo behandelt diese Geräte als Taster: `an` löst den hinterlegten Befehl aus. `aus` setzt nur den virtuellen Zustand zurück.
Wenn während der Entwicklung Geräte mehrfach gefunden wurden, alte LoxEvo-Testgeräte in der Alexa-App löschen und danach erneut suchen. Die aktuellen Geräte-IDs sind pro Befehl stabil, damit spätere Konfigurationsänderungen weniger Durcheinander erzeugen.

## TTS-API

Echo-Geräte müssen nicht manuell geraten werden: In der Web-UI unter `Konfiguration -> TTS-Geräte` kann LoxEvo die Geräteliste aus dem verbundenen Alexa-Konto laden. Dabei werden Name und Seriennummer angezeigt und per Checkbox in Standard-, Alle- oder Alarm-Geräte übernommen.

Normale Sprachausgabe:

```text
POST http://<loxberry>:8080/tts/speak
Body: Dies ist eine Beispielmeldung.
```

Alarm:

```text
POST http://<loxberry>:8080/tts/alarm
Body: Achtung, Alarm wurde ausgelöst.
```

Lautstärke:

```text
POST http://<loxberry>:8080/tts/volume
Body: 70
```

`/tts/speak` spricht schnell mit der aktuell am Echo eingestellten Lautstärke. `/tts/alarm` nutzt immer die Alarm-Lautstärke und übersteuert damit die aktuelle Echo-Lautstärke für diese Ausgabe. Der separate Lautstärke-Aufruf setzt die Lautstärke der Alle-Geräte, sonst der Standard-Geräte. `/tts/lautstaerke` bleibt als Alias für bestehende Aufrufe nutzbar.

Loxone-Kurzpfade für virtuelle Ausgangsbefehle:

```text
POST http://<loxberry>:8080/meldung
Body: Dies ist eine Beispielmeldung.

POST http://<loxberry>:8080/alarm
Body: Achtung, Alarm wurde ausgelöst.

POST http://<loxberry>:8080/lautstaerke
Body: 70
```

Das Prinzip ist bewusst einfach: `alarm` nutzt die Alarm-Geräte, `lautstaerke` setzt die Lautstärke, alle anderen Namen sprechen den Text aus dem Body auf den Standard-Geräten. LoxEvo beantwortet diese Kurzpfade sofort und sendet die Alexa-Ausgabe im Hintergrund, damit Loxone nicht auf die TTS-Ausführung warten muss.

## Loxone TTS einrichten

Der empfohlene Weg in Loxone ist ein zentraler virtueller Ausgang für LoxEvo und darunter mehrere virtuelle Ausgangsbefehle.

### Zentraler virtueller Ausgang

In Loxone Config einen virtuellen Ausgang anlegen, zum Beispiel `LoxEvo TTS`.

```text
Adresse:
http://<loxberry-ip>:8080/

Verbindung nach Senden schließen:
aktiviert
```

Beispiel:

```text
Adresse:
http://<loxberry-ip>:8080/
```

Die Web-UI von LoxEvo läuft standardmäßig auf Port `8080`. Der Alexa/Hue-Port `80` ist nur für die virtuelle Alexa-Gerätesuche relevant, nicht für diese Loxone-TTS-Aufrufe.

### Normale Sprachausgabe

Für jede Meldung einen virtuellen Ausgangsbefehl unter dem LoxEvo-Ausgang anlegen.

```text
Befehl bei EIN:
/hinweis

HTTP-Header bei EIN:
leer lassen

HTTP-Methode bei EIN:
POST

HTTP-Body bei EIN:
Dies ist eine Beispielmeldung aus Loxone.

Befehl bei AUS:
leer lassen
```

Der Pfad nach dem Slash ist frei wählbar. LoxEvo nutzt ihn als Namen im Protokoll. Gesprochen wird der Text aus `HTTP-Body bei EIN`.
Alternativ kann in `Befehl bei EIN` auch die komplette URL stehen, zum Beispiel `http://<loxberry-ip>:8080/hinweis`. Übersichtlicher ist aber der zentrale virtuelle Ausgang mit kurzer Pfadangabe.

Weitere rein beispielhafte Meldungen:

```text
Befehl bei EIN: /luefter_dusche_manuell_aus
HTTP-Body bei EIN: Lüfter Dusche wurde manuell ausgeschaltet. Bitte Lüfter wieder einschalten oder Fenster öffnen.

Befehl bei EIN: /abwesenheit_aktiv
HTTP-Body bei EIN: Abwesenheitsmodus aktiviert. Alle Fenster sind geschlossen.

Befehl bei EIN: /waschmaschine
HTTP-Body bei EIN: Wäsche ist fertig. Bitte Wäsche entnehmen.
```

Normale Meldungen werden auf den in LoxEvo konfigurierten `Standard-Geräten` gesprochen.

### Alarm aus Loxone

Für Alarmmeldungen den reservierten Pfad `/alarm` verwenden.

```text
Befehl bei EIN:
/alarm

HTTP-Header bei EIN:
leer lassen

HTTP-Methode bei EIN:
POST

HTTP-Body bei EIN:
Achtung, Alarm wurde ausgelöst.

Befehl bei AUS:
leer lassen
```

Alarm nutzt die in LoxEvo konfigurierten `Alarm-Geräte` und setzt für diese Ausgabe die `Alarm-Lautstärke`. Wenn Alexa die vorherige Lautstärke liefert, stellt LoxEvo sie nach der Alarm-Ausgabe wieder her. Der Alarm wird pro Loxone-Aufruf genau einmal gesendet.

SSML kann ebenfalls als Body verwendet werden, wenn Alexa es akzeptiert:

```xml
<speak><prosody pitch="high">Please leave the house. The police has already been called.</prosody><audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_alarm_03"/></speak>
```

Solche Alarmtexte unbedingt live testen, bevor sie für einen echten Alarm verwendet werden. Amazon kann SSML- oder Soundbank-Unterstützung je nach Gerät, Region oder Alexa-API-Verhalten unterschiedlich behandeln.

### Lautstärke aus Loxone setzen

Für eine reine Lautstärke-Änderung den reservierten Pfad `/lautstaerke` verwenden. Der Body muss eine Zahl zwischen `0` und `100` enthalten.

```text
Befehl bei EIN:
/lautstaerke

HTTP-Header bei EIN:
leer lassen

HTTP-Methode bei EIN:
POST

HTTP-Body bei EIN:
70

Befehl bei AUS:
leer lassen
```

Dieser Aufruf setzt die Lautstärke der `Alle-Geräte`, falls dort Geräte konfiguriert sind. Wenn `Alle-Geräte` leer ist, nutzt LoxEvo die `Standard-Geräte`.

Wenn die Lautstärke in Loxone über Radiotasten, Status oder einen Wertbaustein ausgewählt wird, kann der Wert direkt an LoxEvo übergeben werden. Wichtig ist nur, dass im HTTP-Body am Ende eine Zahl zwischen `0` und `100` steht.

Typisches Beispiel mit einem Loxone-Wert:

```text
Befehl bei EIN:
/lautstaerke

HTTP-Header bei EIN:
leer lassen

HTTP-Methode bei EIN:
POST

HTTP-Body bei EIN:
<v>

Befehl bei AUS:
leer lassen
```

`<v>` ist der von Loxone eingesetzte aktuelle Wert des Ausgangsbefehls. Wenn der vorgeschaltete Baustein also `10`, `40`, `70` oder `100` liefert, setzt LoxEvo genau diese Alexa-Lautstärke. Die Schreibweise des Pfads ist unkritisch: `/Lautstaerke` und `/lautstaerke` werden gleich behandelt.

Für Radiotasten empfiehlt sich, direkt Prozentwerte als Ausgabewerte zu verwenden:

```text
Taste 1 -> 10
Taste 2 -> 20
Taste 3 -> 30
Taste 4 -> 40
Taste 5 -> 50
Taste 6 -> 70
Taste 7 -> 100
```

### Zielgeräte in LoxEvo

Die Echo-Zielgeräte werden nicht in Loxone gepflegt, sondern in LoxEvo:

```text
Konfiguration -> TTS-Geräte -> Alexa-Geräte suchen
```

Dort können Geräte per Checkbox zugeordnet werden:

- `Standard`: normale TTS-Meldungen
- `Alle`: Lautstärke-Aufrufe oder gemeinsame Gruppen
- `Alarm`: Alarmmeldungen mit Alarm-Lautstärke

Dadurch bleiben Loxone-Ausgänge einfach: Loxone sendet nur Pfad und Text, LoxEvo entscheidet anhand der Konfiguration, welche Echo-Geräte sprechen.

## Alexa2Lox-kompatibler TTS-Aufruf

Zusätzlich gibt es einen Alexa2Lox-ähnlichen Einstieg für Systeme, die TTS lieber mit Query-Parametern auslösen:

```text
GET http://<loxberry>:8080/admin/plugins/alexa2lox/tts.php?device=ALL&text=Hallo&vol=50
GET http://<loxberry>:8080/admin/plugins/alexa2lox/tts.php?d=ALL&t=Hallo&vol=50
```

Unterstützt:

- `device`, `devices` oder `d`
- `text` oder `t`
- `vol`
- `device=ALL`
- Text `0` wird standardmäßig ignoriert
- `ss` und `Grad` werden für bessere Aussprache normalisiert

Hinweis: Auch dieser kompatible Einstieg nutzt die TTS-Gerätelisten aus der Web-UI. Mit `device=ALL` werden die `Alle-Geräte` genutzt, sonst die `Standard-Geräte`.

## Lizenz

Die aktuelle Lizenz steht in [LICENSE](LICENSE).
