# Installation

> **Stand: 1.0.29 auf develop.** Vor einem Update die Geräte-ID-Migration und den [Prüfstatus](docs/stability-validation.md) beachten. Der echte Alexa-Langzeittest ist noch erforderlich.

Diese Anleitung beschreibt den Docker-Weg. Private Daten werden erst nach der Installation lokal im Ordner `data/` angelegt oder über die Web-UI eingetragen.

## Voraussetzungen

- LoxBerry oder Linux-System mit Docker
- Docker Compose
- Loxone-Miniserver mit erreichbarer HTTP-Schnittstelle
- Für TTS: gültige Alexa-Anmeldung; `alexa-remote2@8.1.1` ist gebündelt
- Ohne Docker: Node 24 und `npm ci` mit dem mitgelieferten `package-lock.json`

## Schnellstart auf LoxBerry

```bash
cd /mnt/docker
git clone --branch develop https://github.com/herdan75/loxevo.git
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

Optional kann ein Admin-Passwort für sensible Web-UI-Aktionen direkt in der Web-UI unter `Wartung` aktiviert werden. Ohne Admin-Passwort läuft LoxEvo wie bisher. Mit aktivem Schutz fragt die Web-UI bei Konfiguration, Backup/Restore, Neustart, `alexa-remote2`-Update, TTS-Neuverbindung, Dry-Run-Umschaltung und Alexa-Gerätesuche-Start/Stopp nach dem Admin-Passwort. Loxone-Befehle, normale TTS-Aufrufe und virtuelle Alexa-Geräte bleiben weiterhin ohne Admin-Passwort erreichbar.

Das Web-UI-Passwort wird nicht im Klartext gespeichert. LoxEvo legt nur einen Hash im Datenordner ab und nimmt diesen nicht in den normalen Backup-Export auf. Optional kann der Schutz auch per Docker-Umgebung `LOXEVO_ADMIN_TOKEN` gesetzt werden; dieser technische Wert hat Vorrang und wird ausserhalb der Web-UI gepflegt.

## Ersteinrichtung in der Web-UI

1. Web-UI öffnen.
2. Auf der `Statuskontrolle` den Einrichtungsassistenten starten oder bewusst überspringen.
3. Loxone-Miniserver URL, Benutzer und Passwort eintragen.
4. Rubriken und Befehle mit Sprachname, Raum, Funktion, Aktion, Loxone-Typ, UUID und Wert oder Pfad eintragen.
5. `Dry-Run aktiv` eingeschaltet lassen.
6. Konfiguration speichern.
7. Unter `Testen` einen Befehl testen.
8. Unter `Protokoll` das bereinigte Ergebnis kontrollieren; vollständige konfigurierte Aufrufe stehen unter `Aufrufe & Geräte`.
9. Optional TTS und virtuelle Alexa-Geräte einrichten. Wenn neue Alexa-Geräte gesucht werden sollen, führt der Assistent durch das kurze Aktivieren und anschliessende Beenden der Gerätesuche.
10. Erst wenn alles passt, Dry-Run deaktivieren.

## Private Konfiguration

Alle privaten Daten gehören in den Ordner `data/`.

```text
data/config.json
data/Node.txt
data/alexa-device-ids.json
data/admin-token.json
```

Diese Dateien werden nicht ins Git-Repository übernommen.
`data/config.json` wird beim ersten Start automatisch erzeugt und danach über die Web-UI angepasst.
`data/alexa-device-ids.json` reserviert die Alexa-Zuordnungen. Nicht löschen oder manuell neu nummerieren. `data/admin-token.json` entsteht nur bei aktiviertem Web-UI-Admin-Schutz; ist diese Datei beschädigt, bleiben geschützte Aktionen gesperrt.

Wichtig: `config.example.json` bleibt absichtlich allgemein und enthält nur Platzhalter. Eigene IPs, Passwörter, UUIDs und Echo-Geräte-IDs gehören nie direkt ins Repository.

## TTS aktivieren

1. Den Container aus dem aktuellen `develop`-Stand bauen. AlexaRemote `8.1.1` ist bereits enthalten.
2. Eine vorhandene Cookie-Datei als `data/Node.txt` ablegen oder die anschließende Proxy-Anmeldung verwenden.
3. In der Web-UI unter `Konfiguration` TTS aktivieren und die Cookie-Datei auf `/config/Node.txt` setzen.
4. Speichern. Falls eine Anmeldung verlangt wird, die angezeigte Login-URL öffnen und den Amazon-Login abschließen.
5. Sobald Authentifizierung und Geräteinventar bereit sind, unter `TTS-Geräte` die Geräte laden und per Checkbox zuordnen.
6. Speichern und normale TTS sowie Alarm-TTS einmal bewusst testen. Dry-Run schützt Loxone-Aufrufe, nicht vor hörbaren TTS-Testmeldungen.

Wenn die Alexa-Anmeldung noch fehlt oder Amazon nicht erreichbar ist, startet die Web-UI trotzdem. Für stabilen Dauerbetrieb ist eine vollständige JSON-CookieData aus dem Amazon-Login-Proxy besser als eine reine Cookie-Zeile. Nach erfolgreichem Login prüft LoxEvo Authentifizierung und Inventar, speichert die Cookie-Daten und übernimmt die Verbindung. Falls dies nicht gelingt, zuerst Status und Protokoll sichern, dann gezielt `Alexa TTS neu verbinden` verwenden.

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

Vor dem ersten Wechsel von 1.0.28 oder älter auf 1.0.29:

1. Den vollständigen Ordner `data/` privat sichern, einschließlich Cookie und Admin-Datei. Für eine konsistente Dateikopie den Container während der Sicherung stoppen.
2. Den bisherigen Befehlsbestand unverändert lassen. Beim ersten Start werden die bisherigen Alexa-IDs übernommen; erst danach neue Befehle ergänzen.
3. Lokale Git-Änderungen mit `git status --short` prüfen. Bei Konflikten nicht mit `reset --hard` oder erzwungenem Checkout überschreiben.

```bash
cd /mnt/docker/loxevo
git fetch origin
git switch develop
git pull --ff-only origin develop
docker compose up -d --build --force-recreate
git log --oneline -1
docker compose ps
docker compose logs --tail=80 loxevo
```

Die Dateien in `data/` bleiben dabei erhalten. Warten, bis der Container `healthy` meldet; bei Port 8080 zusätzlich `curl -s http://127.0.0.1:8080/health` prüfen. Health bestätigt den HTTP-Dienst, nicht automatisch eine gültige Alexa-Anmeldung oder hörbare TTS-Ausgabe.

Wenn der optionale Host-Helper bereits installiert ist, nach Beenden einer laufenden Gerätesuche auch `sudo sh tools/install-discovery-helper.sh` ausführen. Ein Docker-Neubau aktualisiert den separat auf dem LoxBerry installierten Helper nicht.

`data/alexa-device-ids.json` anschließend mitsichern. Befehlsschlüssel sind Geräteidentitäten; zum Umbenennen Anzeige- und Sprachnamen ändern. Ein Rollback auf alten Code muss mit dessen passendem alten Datenstand erfolgen. Details stehen unter [Migration und Rollback](docs/stability-validation.md#migration-und-rollback).

Unter `Wartung` gibt es zusätzlich eine lokale Systemprüfung für Konfiguration, Schreibrechte, Loxone-Zugang, TTS, virtuelle Alexa-Geräte, Gerätesuche und Backup. Die Prüfung läuft beim Öffnen oder auf Abruf, nicht dauerhaft. Die Paketwahl ist auf die getestete AlexaRemote-Version `8.1.1` begrenzt; das gebündelte Paket hat Vorrang vor Zusatzinstallationen im Datenordner. Für Support kann ein bereinigter Diagnosebericht exportiert werden. Der Protokollpuffer bleibt flüchtig und wird bei einem Neustart gelöscht.

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

In der Web-UI unter `Wartung` kann ein Backup der Einstellungen exportiert werden. Der normale Export enthält die LoxEvo-Konfiguration aus `data/config.json` und die reservierten Alexa-Geräte-IDs. Die Alexa-Cookie-Datei `data/Node.txt` wird nur exportiert, wenn der Haken dafür gesetzt ist. Der Admin-Passwort-Hash wird nicht im normalen Backup exportiert. Backup-Dateien können sensible Daten wie Loxone-Zugangsdaten, UUIDs und optional Amazon-Cookies enthalten.

Nach einem Export speichert LoxEvo im Datenordner einen kleinen Backup-Status mit dem Zeitpunkt und einem Hash der backup-relevanten Einstellungen. Dadurch kann die Statuskontrolle später anzeigen, ob seit dem letzten Export ein neues Backup empfohlen ist. Backup-relevant sind Loxone-Zugang, Befehle, Räume, Alexa-Bridge, Gerätesuche, TTS, Geräteauswahl, Lautstärken und Server-Einstellungen. Dry-Run/Live-Modus wird dabei bewusst ignoriert.

Beim Import werden Konfiguration und ID-Konflikte geprüft. LoxEvo legt eine Sicherung der aktuellen Konfiguration im Datenordner an und spielt danach die importierte Konfiguration ein. Wenn das Backup eine Cookie-Datei enthält, wird diese ebenfalls wiederhergestellt. Ältere Backups ohne Geräte-ID-Block bleiben nutzbar; kollidierende Zuordnungen werden abgelehnt statt ersetzt.

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

Danach den Projektordner `/mnt/docker/loxevo` nur dann löschen, wenn der komplette Ordner `data/` einschließlich Geräte-IDs, Cookie und Admin-Datei nicht mehr gebraucht wird oder vorher privat gesichert wurde.

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

Im Docker-Image von 1.0.29 ist `alexa-remote2@8.1.1` enthalten. Tritt die Meldung auf, zuerst Branch, Commit und Image-Neubau prüfen. Ohne Docker `npm ci` ausführen. Nicht auf eine beliebige andere AlexaRemote-Version wechseln.

`Alexa-Cookie konnte nicht gelesen werden`:

- `data/Node.txt` prüfen
- In der Web-UI Cookie-Datei auf `/config/Node.txt` setzen
- Falls Amazon eine neue Anmeldung verlangt, den angezeigten Login-Link öffnen. Danach verbindet LoxEvo automatisch neu; falls nicht, in der TTS-Konfiguration `Alexa TTS neu verbinden` klicken.

`Loxone antwortet nicht`:

- Miniserver URL prüfen
- Benutzer/Passwort prüfen
- Befehl, Loxone-Typ, UUID, Wert oder Pfad prüfen
- Vom LoxBerry aus testen, ob die Miniserver-IP erreichbar ist
- Dry-Run erst deaktivieren, wenn die konfigurierten Aufrufe unter `Aufrufe & Geräte` stimmen

`Unknown Device or Serial number` oder wiederholtes `401 Unauthorized`:

- Vor einem Neustart TTS-Status, vorhandenes Inventar und bereinigtes Protokoll sichern.
- Der [passive Beobachter](README.md#stabilitätsupdate-1029) erfasst Statusänderungen, ohne Geräte zu schalten oder die Anmeldung zu erneuern.
- Ein Neustart, nach dem TTS wieder funktioniert, belegt noch nicht die Ursache.
