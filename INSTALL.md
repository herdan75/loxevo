# Installation

> **Hinweis:** Diese Anleitung beschreibt LoxEvo ab Version 1.0.0. Neue Installationen und neue Befehle sollten trotzdem zuerst bewusst getestet werden.

Diese Anleitung beschreibt den Docker-Weg. Private Daten werden erst nach der Installation lokal im Ordner `data/` angelegt oder über die Web-UI eingetragen.

## Voraussetzungen

- LoxBerry oder Linux-System mit Docker
- Docker Compose
- Loxone-Miniserver mit erreichbarer HTTP-Schnittstelle
- Für TTS: Alexa-Cookie-Datei für `alexa-remote2`

## Schnellstart auf LoxBerry

```bash
cd /mnt/docker
git clone https://github.com/herdan75/loxevo.git
cd loxevo
mkdir -p data
docker compose up -d --build
```

Beim ersten Start legt LoxEvo automatisch `data/config.json` aus der Beispielkonfiguration an, falls sie noch nicht existiert.

Web-UI:

```text
http://<loxberry-ip>:8080
```

Die Web-UI ist für das eigene LAN gedacht. Port `8080` sollte nicht direkt ins Internet freigegeben werden, weil darüber Loxone-Zugangsdaten und Steuerbefehle konfiguriert werden.

Optional kann ein Admin-Passwort für sensible Web-UI-Aktionen direkt in der Web-UI unter `Wartung` aktiviert werden. Ohne Admin-Passwort läuft LoxEvo wie bisher. Mit aktivem Schutz fragt die Web-UI bei Konfiguration, Backup/Restore, Neustart, `alexa-remote2`-Update und Dry-Run-Umschaltung nach dem Admin-Passwort. Loxone-Befehle, TTS-Aufrufe und virtuelle Alexa-Geräte bleiben weiterhin ohne Admin-Passwort erreichbar.

Das Web-UI-Passwort wird nicht im Klartext gespeichert. LoxEvo legt nur einen Hash im Datenordner ab und nimmt diesen nicht in den normalen Backup-Export auf. Optional kann der Schutz auch per Docker-Umgebung `LOXEVO_ADMIN_TOKEN` gesetzt werden; dieser technische Wert hat Vorrang und wird ausserhalb der Web-UI gepflegt.

## Ersteinrichtung in der Web-UI

1. Web-UI öffnen.
2. Auf der `Übersicht` den Einrichtungsassistenten starten oder bewusst überspringen.
3. Loxone-Miniserver URL, Benutzer und Passwort eintragen.
4. Rubriken und Befehle mit Sprachname, Raum, Funktion, Aktion, Loxone-Typ, UUID und Wert oder Pfad eintragen.
5. `Dry-Run aktiv` eingeschaltet lassen.
6. Konfiguration speichern.
7. Unter `Testen` einen Befehl testen.
8. Unter `Protokoll` prüfen, welche Loxone-URL erzeugt wurde.
9. Optional TTS und virtuelle Alexa-Geräte einrichten. Wenn neue Alexa-Geräte gesucht werden sollen, führt der Assistent durch das kurze Aktivieren und anschliessende Beenden der Gerätesuche.
10. Erst wenn alles passt, Dry-Run deaktivieren.

## Private Konfiguration

Alle privaten Daten gehören in den Ordner `data/`.

```text
data/config.json
data/Node.txt
```

Diese Dateien werden nicht ins Git-Repository übernommen.
`data/config.json` wird beim ersten Start automatisch erzeugt und danach über die Web-UI angepasst.

Wichtig: `config.example.json` bleibt absichtlich allgemein und enthält nur Platzhalter. Eigene IPs, Passwörter, UUIDs und Echo-Geräte-IDs gehören nie direkt ins Repository.

## TTS aktivieren

1. In der Web-UI unter `Wartung` `alexa-remote2` installieren oder aktualisieren.
2. Alexa-Cookie-Datei als `data/Node.txt` ablegen.
3. In der Web-UI unter `Konfiguration` TTS aktivieren.
4. Cookie-Datei auf `/config/Node.txt` setzen.
5. Unter `TTS-Geräte` Alexa-Geräte suchen und per Checkbox zuordnen.
6. Speichern und TTS-Status prüfen.

Wenn `alexa-remote2` oder die Cookie-Datei noch fehlen, startet LoxEvo trotzdem. Die Web-UI zeigt dann im Bereich `Einrichtung` und in der TTS-Konfiguration, was noch fehlt.

## Betrieb

Status anzeigen:

```bash
docker compose ps
```

Logs ansehen:

```bash
docker compose logs -f loxevo
```

Container neu starten:

```bash
docker compose restart loxevo
```

Stoppen:

```bash
docker compose down
```

## Updates

```bash
cd /mnt/docker/loxevo
git pull
docker compose up -d --build --force-recreate
```

Die Dateien in `data/` bleiben dabei erhalten.

Unter `Wartung` gibt es zusätzlich eine lokale Systemprüfung. Sie prüft beim Öffnen des Registers oder auf Abruf Konfiguration, Schreibrechte, Loxone-Zugang, TTS, virtuelle Alexa-Geräte, Gerätesuche und Backup. Es läuft kein dauerhaftes Polling im Hintergrund. Bereiche mit Fehlern oder Hinweisen werden aufgeklappt, reine OK-/Info-Bereiche bleiben kompakt. Die installierte `alexa-remote2`-Version, der Installationspfad und verfügbare Versionen sind dort sichtbar und können per Button aktualisiert werden. Für Support oder Fehlersuche kann dort ausserdem ein Diagnosepaket exportiert werden; sensible Werte werden dabei maskiert oder nur als Status zusammengefasst.

## Optional: Alexa-Gerätesuche per Button

Neue Alexa-Geräte werden über SSDP/UDP 1900 gesucht. Auf LoxBerry ist dieser Port oft durch den Dienst `ssdpd` oder `lbssdpd` belegt. Vorhandene Alexa-Geräte funktionieren weiter, neue Geräte werden dann aber meist nicht gefunden.

Für eine einfache Bedienung per Web-UI kann einmalig ein enger Host-Helper installiert werden. Das passiert bewusst nicht automatisch durch den Docker-Container, weil dafür Host-/Root-Rechte nötig sind. Der Schritt ist nur erforderlich, wenn UDP 1900 belegt ist und neue Alexa-Geräte gesucht werden sollen:

```bash
cd /mnt/docker/loxevo
sudo sh tools/install-discovery-helper.sh
```

Der Helper läuft nur auf `127.0.0.1` und kennt nur drei Aktionen: Status lesen, Gerätesuche starten und Gerätesuche beenden. Dabei werden nur `ssdpd` und `lbssdpd` kurz gestoppt und danach wieder gestartet.

Danach läuft die Suche für normale Nutzer ohne SSH:

1. In LoxEvo `Konfiguration -> Alexa-Gerätesuche` öffnen.
2. `Gerätesuche aktivieren` klicken.
3. In der Alexa-App nach neuen Geräten suchen.
4. Danach in LoxEvo `Gerätesuche beenden` klicken.

Wenn der Helper nicht installiert ist, bleiben die Buttons deaktiviert und LoxEvo zeigt eine entsprechende Meldung. Alle anderen Funktionen können trotzdem laufen.

## Backup und Wiederherstellung

In der Web-UI unter `Wartung` kann ein Backup der Einstellungen exportiert werden. Der normale Export enthält die LoxEvo-Konfiguration aus `data/config.json`. Die Alexa-Cookie-Datei `data/Node.txt` wird nur exportiert, wenn der Haken dafür gesetzt ist. Der Admin-Passwort-Hash wird nicht im normalen Backup exportiert. Backup-Dateien können sensible Daten wie Loxone-Zugangsdaten, UUIDs und optional Amazon-Cookies enthalten.

Nach einem Export speichert LoxEvo im Datenordner einen kleinen Backup-Status mit dem Zeitpunkt und einem Hash der backup-relevanten Einstellungen. Dadurch kann die Statuskontrolle später anzeigen, ob seit dem letzten Export ein neues Backup empfohlen ist. Backup-relevant sind Loxone-Zugang, Befehle, Räume, Alexa-Bridge, Gerätesuche, TTS, Geräteauswahl, Lautstärken und Server-Einstellungen. Dry-Run/Live-Modus wird dabei bewusst ignoriert.

Beim Import legt LoxEvo zuerst eine Sicherung der aktuellen Konfiguration im Datenordner an und spielt danach die importierte Konfiguration ein. Wenn das Backup eine Cookie-Datei enthält, wird diese ebenfalls wiederhergestellt.

## Neuinstallation oder Rücksetzen

Container stoppen:

```bash
docker compose down
```

Nur die Anwendung neu bauen:

```bash
docker compose up -d --build
```

Konfiguration komplett neu erzeugen:

```bash
mv data/config.json data/config.backup.json
docker compose up -d
```

Beim nächsten Start wird wieder eine frische `data/config.json` aus `config.example.json` angelegt.

## Deinstallation

Container stoppen und entfernen:

```bash
docker compose down
```

Damit bleiben der Projektordner und `data/` bewusst erhalten. Das ist sinnvoll, wenn LoxEvo später wieder installiert oder repariert werden soll.

Für eine vollständige Entfernung:

```bash
docker compose down --rmi local
```

Danach den Projektordner `/mnt/docker/loxevo` nur dann löschen, wenn `data/config.json` und `data/Node.txt` nicht mehr gebraucht werden oder vorher gesichert wurden.

Falls der optionale Discovery-Helper installiert wurde:

```bash
sudo systemctl disable --now loxevo-discovery-helper.service
sudo rm -f /etc/systemd/system/loxevo-discovery-helper.service
sudo rm -f /usr/local/sbin/loxevo-discovery-helper
sudo rm -f /etc/loxevo-discovery-helper.env
sudo systemctl daemon-reload
```

## Typische Probleme

`http://<loxberry-ip>:8080` ist nicht erreichbar:

```bash
docker compose ps
docker compose logs loxevo
```

`alexa-remote2 ist nicht installiert`:

In der Web-UI unter `Wartung` eine Version auswählen und `Installieren` klicken. Danach `LoxEvo neu starten`.

`Alexa-Cookie konnte nicht gelesen werden`:

- `data/Node.txt` prüfen
- In der Web-UI Cookie-Datei auf `/config/Node.txt` setzen
- Container neu starten

`Loxone antwortet nicht`:

- Miniserver URL prüfen
- Benutzer/Passwort prüfen
- Befehl, Loxone-Typ, UUID, Wert oder Pfad prüfen
- Vom LoxBerry aus testen, ob die Miniserver-IP erreichbar ist
- Dry-Run erst deaktivieren, wenn die erzeugten URLs korrekt aussehen
