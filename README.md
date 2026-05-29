# LoxEvo

[![CI](https://github.com/herdan75/loxevo/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/herdan75/loxevo/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![License: Source available](https://img.shields.io/badge/License-source--available-orange.svg)](LICENSE)

> **Status: Version 1.0.6 / erste lauffähige Version**
>
> LoxEvo ist als lauffähige Docker/LoxBerry-Basis nutzbar. Die wichtigsten Funktionen für Loxone-Befehle, virtuelle Alexa-Geräte und Alexa-TTS sind umgesetzt und getestet. Trotzdem können noch kleinere Fehler auftreten, deshalb neue Installationen und neue Befehle zuerst bewusst prüfen und Loxone-Kommandos bei Bedarf im Dry-Run testen.

Eigene LoxBerry-Zentrale für Alexa, Echo-TTS und Loxone.

Die Ziele von LoxEvo:

- Alexa-Sprachbefehle sollen einfach bleiben
- Loxone bleibt die Automationszentrale
- Echo-TTS soll direkt aus Loxone auslösbar sein
- Wartung soll über eine zentrale Konfiguration und Web-UI erfolgen

## In 5 Minuten starten

1. Repository auf dem LoxBerry oder Docker-Host ablegen.
2. Container starten:

   ```bash
   docker compose up -d --build
   ```

3. Web-UI öffnen:

   ```text
   http://<loxberry>:8080
   ```

4. In der `Statuskontrolle` den Einrichtungsassistenten starten oder direkt zu `Konfiguration` wechseln.
5. Loxone-Miniserver, Zugangsdaten und erste Befehle eintragen.
6. Zuerst im Dry-Run testen, danach bewusst auf Live-Modus wechseln.
7. Optional Alexa TTS, virtuelle Alexa-Geräte, Admin-Schutz und Backup einrichten.

Die ausführliche Installation, LoxBerry-Hinweise und Gerätesuche stehen in [INSTALL.md](INSTALL.md).

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
Loxone-Befehle laufen standardmässig im Dry-Run-Modus, damit lokal gefahrlos getestet werden kann.
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

In `data/config.json` ist `loxone.dryRun` standardmässig `true`. Dann erzeugt LoxEvo nur die URL und zeigt sie im Protokoll, sendet aber noch nichts an Loxone.
Der Modus kann auch direkt oben in der Web-UI umgeschaltet werden.

TTS braucht das Paket `alexa-remote2` und eine gültige Alexa-Cookie-Datei. Das Paket wird bewusst nicht fest im Docker-Build installiert, damit LoxEvo auch dann startet, wenn npm-Versionen wechseln. Installiere oder aktualisiere es in der Web-UI unter `Wartung`; im Docker/LoxBerry-Betrieb landet es im gemounteten `/config`-Bereich.
Als Cookie-Datei kann eine reine Cookie-Zeile oder eine JSON-Datei mit `localCookie` verwendet werden. Bei JSON-Dateien nutzt LoxEvo `localCookie`, `csrf` und gespeicherte Registrierungsdaten wie `macDms` und `refreshToken`, falls diese vorhanden sind.
Wenn Amazon trotzdem eine neue Anmeldung verlangt, nutzt `alexa-remote2` einen lokalen Login-Proxy. LoxEvo setzt dafür automatisch die LAN-IP des LoxBerry; bei Bedarf kann `tts.proxyOwnIp` und `tts.proxyPort` in der Web-UI angepasst werden.
Für den LoxBerry-Test siehe [docs/loxberry-deploy.md](docs/loxberry-deploy.md).

Die Web-UI startet mit einer kompakten `Statuskontrolle`. Dort sieht man auf einen Blick, ob Loxone, Alexa TTS, virtuelle Alexa-Geräte, Gerätesuche, Backup, Admin-Schutz und Systemprüfung in einem sinnvollen Zustand sind.
Offene Punkte wie Fehler, Prüfbedarf oder optionale Empfehlungen werden zuerst angezeigt. Ein Klick auf eine Statuszeile öffnet direkt den passenden Konfigurations- oder Wartungsbereich; der Info-Button erklärt den jeweiligen Status.
Auf der Statuskontrolle steht ausserdem ein überspringbarer Einrichtungsassistent bereit. Er führt Schritt für Schritt durch Loxone-Zugang, erste Befehle, Dry-Run/Live-Modus, virtuelle Alexa-Geräte, optionale Gerätesuche, TTS und Backup. Der Assistent ändert nichts automatisch; Aktionen wie `Gerätesuche aktivieren` müssen bewusst geklickt werden.
Unter `Wartung` gibt es zusätzlich eine lokale Systemprüfung für Konfiguration, Loxone-Zugang, TTS, virtuelle Alexa-Geräte, Gerätesuche und Backup. Diese Prüfung läuft beim Öffnen des Registers oder per Button und erzeugt keine dauernde Hintergrundlast. Bereiche mit Fehlern oder Hinweisen werden aufgeklappt, reine OK-/Info-Bereiche bleiben kompakt.
Im gleichen Register zeigt LoxEvo die installierte `alexa-remote2`-Version und verfügbare npm-Versionen und kann Installation oder Update im laufenden Container anstossen. Nach einem Paketupdate ist ein Neustart von LoxEvo erforderlich.
Im gleichen Register können die Einstellungen als Backup exportiert und später wieder importiert werden. Der Export enthält standardmässig die LoxEvo-Konfiguration; die Alexa-Cookie-Datei kann bei Bedarf bewusst mit exportiert werden. LoxEvo merkt sich serverseitig den letzten Backup-Stand und empfiehlt ein neues Backup, wenn backup-relevante Einstellungen geändert wurden.
Zusätzlich kann dort ein Diagnosepaket exportiert werden. Es enthält Health-Status, Systemprüfung, Versionsinformationen, eine zusammengefasste Konfiguration und die letzten Ereignisse. Zugangsdaten, Admin-Passwort, Token und Hostnamen werden dabei nicht im Klartext ausgegeben.
Backup-Dateien können sensible Daten wie Loxone-Zugangsdaten, UUIDs und optional Amazon-Cookies enthalten und sollten deshalb privat bleiben.

Private Daten gehören in `data/`:

- `data/config.json`
- `data/Node.txt`

Dieser Ordner ist absichtlich von Git ausgenommen, damit keine Loxone-Zugangsdaten, UUIDs oder Alexa-Geräte-IDs veröffentlicht werden.
Alle privaten Werte werden nach der Installation über die Web-UI oder direkt in `data/config.json` gepflegt.
Bei einer Neuinstallation reicht es normalerweise, den Ordner `data/` zu sichern und später wieder in den Projektordner zu legen.

Wichtig für Live-Tests: Die Web-UI zeigt und speichert Loxone-Zugangsdaten. LoxEvo sollte deshalb nur im eigenen LAN oder per VPN erreichbar sein und nicht direkt ins Internet freigegeben werden.

Optional kann in der Web-UI unter `Wartung` ein Admin-Passwort für sensible Bereiche aktiviert werden.

Wenn das Admin-Passwort gesetzt ist, verlangt LoxEvo für Konfiguration, Backup/Restore, Neustart, `alexa-remote2`-Update, Dry-Run-Umschaltung und Alexa-Gerätesuche-Start/Stopp technisch den Header `X-LoxEvo-Admin-Token`. Die Web-UI fragt das Admin-Passwort bei Bedarf ab und merkt es nur für die aktuelle Browser-Sitzung. Alexa-/Hue-Bridge, Loxone-Befehle, TTS-Endpunkte, Health, Protokoll, Einrichtung und Systemprüfung bleiben offen, damit bestehende Alexa- und Loxone-Aufrufe nicht brechen.

Das über die Web-UI gesetzte Admin-Passwort wird nicht im Klartext gespeichert. LoxEvo legt nur einen Hash im Datenordner ab. Der normale Backup-Export enthält diesen Hash nicht. Alternativ kann der Schutz weiterhin per Docker-Umgebung `LOXEVO_ADMIN_TOKEN` gesetzt werden; dieser Wert hat Vorrang und wird ausserhalb der Web-UI verwaltet.

Die Web-UI ist der empfohlene Konfigurationsweg. Aktuell können dort gepflegt werden:

- Loxone-Miniserver URL, Benutzer und Passwort
- Dry-Run/Live-Modus
- virtuelle Alexa-Geräte aus aktiven Befehlen
- frei definierbare Rubriken und Befehle mit Sprachname, Raum, Funktion, Aktion, Alexa-Modus, Loxone-Typ, UUID, Wert oder Pfad
- TTS-Aktivierung, Cookie-Datei, Lautstärken und Alexa-Gerätelisten
- TTS-Status mit klarer Fehlermeldung, falls Alexa noch nicht bereit ist

Die Oberfläche ist in klare Bereiche gegliedert:

- `Statuskontrolle`: kompakter Schnellcheck, Einrichtungsassistent und Hinweise zu Backup, Alexa und Loxone
- `Konfiguration`: Loxone, frei definierbare Befehle und TTS pflegen
- `Testen`: Loxone-Befehle und Alexa-TTS direkt aus der Web-UI prüfen
- `Aufrufe & Geräte`: fertige Schnittstellen aus der Konfiguration ansehen, Loxone-Befehle testen, URLs kopieren, TTS-Aufrufe prüfen und virtuelle Alexa-Geräte kontrollieren
- `Wartung`: Systemprüfung ausführen, Diagnose exportieren, Paketversionen prüfen, `alexa-remote2` verwalten, Backup exportieren und Backup importieren
- `Protokoll`: zuletzt simulierte oder gesendete Aktionen filtern, durchsuchen und bei Bedarf leeren; direkt wiederholte gleichartige Meldungen werden kompakt zusammengefasst

Die JSON-Ansicht bleibt als Expertenmodus erhalten.

Empfohlener Ablauf für neue Installationen:

1. LoxEvo starten und die Web-UI öffnen.
2. Loxone-Zugang eintragen und `Dry-Run aktiv` eingeschaltet lassen.
3. Erste Befehle in `Konfiguration -> Befehle und Sprachnamen` anlegen.
4. Unter `Testen` prüfen, ob die erzeugten Loxone-URLs stimmen.
5. Erst danach den Live-Modus aktivieren.
6. Optional TTS und virtuelle Alexa-Geräte einrichten. Wenn neue Alexa-Geräte gesucht werden sollen und SSDP/UDP 1900 belegt ist, kann der Assistent zur temporären Gerätesuche führen: Gerätesuche aktivieren, in der Alexa-App suchen, danach die Gerätesuche wieder beenden.

## Backup und Deinstallation

Backups werden in der Web-UI unter `Wartung` erstellt. Der normale Export enthält `config.json` mit Loxone-, Alexa-Bridge-, Befehls- und TTS-Einstellungen. Die Alexa-Cookie-Datei `Node.txt` wird nur exportiert, wenn der entsprechende Haken gesetzt ist, weil diese Datei Zugriffsdaten für das Amazon-Konto enthalten kann. Der Admin-Passwort-Hash wird nicht im normalen Backup exportiert. Backup-Dateien enthalten private Installationsdaten und sollten nicht veröffentlicht werden.

Nach einem Export schreibt LoxEvo im Datenordner zusätzlich einen kleinen Backup-Status. Darin wird kein Klartext-Passwort gespeichert, sondern ein Hash der backup-relevanten Einstellungen. Als backup-relevant gelten Loxone-Zugang, Befehle, Räume, Alexa-Bridge, Gerätesuche, TTS-Einstellungen, Geräteauswahl, Lautstärken und Server-Einstellungen. Reine Betriebszustände wie Dry-Run/Live-Modus werden bewusst ignoriert. Die Statuskontrolle zeigt dadurch an, ob seit dem letzten Export ein neues Backup empfohlen ist und welche Bereiche betroffen sind.

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
Alexa merkt sich bereits gefundene Geräte und deren Typ teilweise dauerhaft. Wenn Gerätenamen, Befehle oder der Gerätetyp geändert wurden, sollten die alten LoxEvo-Geräte in der Alexa-App gelöscht und danach neu gesucht werden.

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

LoxEvo bietet zwei Alexa-Modi pro Befehl. Ohne Angabe gilt `switch`: `an` löst den Befehl aus, `aus` sucht einen passenden Aus-Befehl mit gleichem Raum und gleicher Funktion. Für einzelne Auslöser ohne dauerhaften Ein/Aus-Zustand kann in der Web-UI `action` gewählt werden. Dann löst nur `an` den Befehl aus, `aus` wird bewusst ignoriert und der interne virtuelle Zustand wird kurz danach wieder zurückgesetzt.
Wichtig: Wegen der lokalen Hue-Emulation sieht Alexa auch `action` weiterhin als On/Off-Gerät. Ein echter Alexa-Button oder Skill-Gerätetyp kann über diese Schnittstelle nicht übergeben werden.

Pro Befehl kann ausserdem gesteuert werden, ob er als eigenes Alexa-Gerät angeboten wird. Das ist vor allem für interne Aus-Befehle praktisch: Ein Befehl wie `kueche_licht_aus` kann aktiv bleiben, muss aber nicht als separates Gerät in der Alexa-App erscheinen. Sichtbare `switch`-Befehle können über `Aus-Befehl (optional)` explizit auf diesen internen Aus-Befehl verweisen; ohne Angabe sucht LoxEvo weiterhin automatisch nach einem aktiven Aus-Befehl mit gleichem Raum und gleicher Funktion. `action`-Befehle nutzen keinen Aus-Befehl, damit einzelne Auslöser nicht versehentlich beim Ausschalten erneut reagieren.

Wenn ein Aus-Befehl nicht als Alexa-Gerät angeboten wird, braucht Alexa trotzdem ein sichtbares Ziel für die Sprache. Für Sätze wie `Alexa, Licht Küche aus` empfiehlt sich entweder ein sichtbares Basis-Gerät `Licht Küche` mit passendem Aus-Befehl oder eine Alexa-Gruppe `Küche`, in der die sichtbaren Küchen-Geräte liegen.

Optional kann pro Befehl eine TTS-Rueckmeldung aktiviert werden. Dann spricht LoxEvo nach einem erfolgreichen Alexa-Befehl den hinterlegten Text, zum Beispiel `OK`, ueber die Standard-TTS-Geraete. Der eigentliche Loxone-Befehl und die Alexa-Antwort werden dadurch nicht blockiert; die Rueckmeldung laeuft im Hintergrund und kommt so schnell, wie Alexa TTS gerade reagiert. Das ist kein natives Alexa-Acknowledge der Hue-Emulation, sondern eine LoxEvo-Rueckmeldung ueber die konfigurierte TTS-Funktion.

### Licht aus bei Szenen

Für Licht-Szenen gibt es mehrere sinnvolle Varianten. Welche besser passt, hängt davon ab, ob Alexa den Aus-Befehl als eigenes Gerät sehen soll oder ob LoxEvo ihn nur intern nutzen soll.

Variante 1: Separates Alexa-Gerät für `Aus`.

Beispiel:

```text
Licht Küche Ambient
Licht Küche Hell
Licht Küche Nacht
Licht Küche Aus
```

Vorteil: Der Aus-Befehl ist in der Alexa-App sichtbar und kann direkt in Routinen verwendet werden. Nachteil: In der Alexa-App erscheint ein zusätzliches Gerät, das eigentlich nur ein interner Loxone-Befehl ist. Das kann bei vielen Räumen unübersichtlich werden.

Variante 2: Interner Aus-Befehl in LoxEvo, aber nicht als Alexa-Gerät anbieten.

Beispiel:

```text
kueche_licht_aus
Aktiv: ja
Als Alexa-Gerät anbieten: nein
```

Die sichtbaren Szenen bleiben `switch`-Befehle und verweisen über `Aus-Befehl (optional)` auf `kueche_licht_aus`:

```text
kueche_licht_ambient -> Aus-Befehl: kueche_licht_aus
kueche_licht_hell    -> Aus-Befehl: kueche_licht_aus
kueche_licht_nacht   -> Aus-Befehl: kueche_licht_aus
```

Vorteil: Alexa sieht nur die wirklich bedienbaren Szenen, der Aus-Befehl bleibt zentral und wartbar in LoxEvo. Nachteil: Der versteckte Aus-Befehl kann in Alexa nicht direkt als Routine-Ziel ausgewählt werden. Routinen müssen stattdessen ein sichtbares Szenen-Gerät ausschalten; LoxEvo führt dann intern den hinterlegten Aus-Befehl aus.

Variante 3: Alexa-Gruppe oder Routine für den kurzen Sprachbefehl.

Wenn der Sprachbefehl `Alexa, Licht Küche aus` ohne separates Gerät funktionieren soll, braucht Alexa ein sichtbares Ziel. Dafür gibt es zwei praktische Wege:

```text
Alexa-Gruppe "Küche" mit den sichtbaren Geräten:
- Licht Küche Ambient
- Licht Küche Hell
- Licht Küche Nacht
```

oder eine Alexa-Routine:

```text
Wenn gesagt wird: "Licht Küche aus"
Dann: Licht Küche Ambient ausschalten
Dann: Licht Küche Hell ausschalten
Dann: Licht Küche Nacht ausschalten
```

In beiden Fällen sendet Alexa `aus` an sichtbare Geräte. LoxEvo übersetzt dieses `aus` intern auf den zentralen Aus-Befehl. Das ist meistens die aufgeräumteste Lösung, solange man akzeptiert, dass Alexa den versteckten Aus-Befehl selbst nicht als eigenes Gerät kennt.

Wenn während der Entwicklung Geräte mehrfach gefunden wurden, alte LoxEvo-Testgeräte in der Alexa-App löschen und danach erneut suchen. Die aktuellen Geräte-IDs sind pro Befehl stabil, damit spätere Konfigurationsänderungen weniger Durcheinander erzeugen.

## TTS-API

Echo-Geräte müssen nicht manuell geraten werden: In der Web-UI unter `Konfiguration -> TTS-Geräte` kann LoxEvo die Geräteliste aus dem verbundenen Alexa-Konto laden. Dabei werden Name und Seriennummer angezeigt und per Checkbox in Standard-, Alle- oder Alarm-Geräte übernommen. Standardmässig zeigt LoxEvo nur echte Echo-Geräte an; weitere Alexa-Gerätetypen wie Gruppen, TV oder App-Geräte können bei Bedarf eingeblendet werden.

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

Verbindung nach Senden schliessen:
aktiviert
```

Beispiel:

```text
Adresse:
http://<loxberry-ip>:8080/
```

Die Web-UI von LoxEvo läuft standardmässig auf Port `8080`. Der Alexa/Hue-Port `80` ist nur für die virtuelle Alexa-Gerätesuche relevant, nicht für diese Loxone-TTS-Aufrufe.

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
- Text `0` wird standardmässig ignoriert
- `ss` und `Grad` werden für bessere Aussprache normalisiert

Hinweis: Auch dieser kompatible Einstieg nutzt die TTS-Gerätelisten aus der Web-UI. Mit `device=ALL` werden die `Alle-Geräte` genutzt, sonst die `Standard-Geräte`.

## Lizenz

LoxEvo ist source-available veröffentlicht: Der Code darf auf GitHub gelesen und geprüft werden, ist aber ohne separate schriftliche Erlaubnis nicht zur Nutzung, Weitergabe, Veröffentlichung, zum Betrieb in eigenen Installationen oder zur Erstellung abgeleiteter Versionen freigegeben. Details stehen in [LICENSE](LICENSE).
