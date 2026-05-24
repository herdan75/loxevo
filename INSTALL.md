# Installation

> **Hinweis:** LoxEvo ist eine lauffaehige Entwicklungsversion. Neue Installationen und neue Befehle sollten trotzdem zuerst bewusst getestet werden.

Diese Anleitung beschreibt den Docker-Weg. Private Daten werden erst nach der Installation lokal im Ordner `data/` angelegt oder ueber die Web-UI eingetragen.

## Voraussetzungen

- LoxBerry oder Linux-System mit Docker
- Docker Compose
- Loxone-Miniserver mit erreichbarer HTTP-Schnittstelle
- Fuer TTS: Alexa-Cookie-Datei fuer `alexa-remote2`

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

Die Web-UI ist fuer das eigene LAN gedacht. Port `8080` sollte nicht direkt ins Internet freigegeben werden, weil darueber Loxone-Zugangsdaten und Steuerbefehle konfiguriert werden.

## Ersteinrichtung in der Web-UI

1. Web-UI oeffnen.
2. Im Bereich `Einrichtung` die offenen Punkte anschauen.
3. `Zur Konfiguration` waehlen.
4. Loxone-Miniserver URL, Benutzer und Passwort eintragen.
5. Rubriken und Befehle mit Sprachname, Raum, Funktion, Aktion, Loxone-Typ, UUID und Wert oder Pfad eintragen.
6. `Dry-Run aktiv` eingeschaltet lassen.
7. Konfiguration speichern.
8. Unter `Testen` einen Befehl testen.
9. Unter `Protokoll` pruefen, welche Loxone-URL erzeugt wurde.
10. Erst wenn alles passt, Dry-Run deaktivieren.

## Private Konfiguration

Alle privaten Daten gehoeren in den Ordner `data/`.

```text
data/config.json
data/Node.txt
```

Diese Dateien werden nicht ins Git-Repository uebernommen.
`data/config.json` wird beim ersten Start automatisch erzeugt und danach ueber die Web-UI angepasst.

Wichtig: `config.example.json` bleibt absichtlich allgemein und enthaelt nur Platzhalter. Eigene IPs, Passwoerter, UUIDs und Echo-Geraete-IDs gehoeren nie direkt ins Repository.

## TTS aktivieren

1. Alexa-Cookie-Datei als `data/Node.txt` ablegen.
2. In der Web-UI unter `Konfiguration` TTS aktivieren.
3. Cookie-Datei auf `/config/Node.txt` setzen.
4. Unter `TTS-Geraete` Alexa-Geraete suchen und per Checkbox zuordnen.
5. Speichern und TTS-Status pruefen.

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
docker compose up -d --build
```

Die Dateien in `data/` bleiben dabei erhalten.

Die installierte `alexa-remote2`-Version, der Installationspfad und verfuegbare Versionen sind in der Web-UI unter "Wartung" sichtbar.

## Optional: Alexa-Geraetesuche per Button

Neue Alexa-Geraete werden ueber SSDP/UDP 1900 gesucht. Auf LoxBerry ist dieser Port oft durch den Dienst `ssdpd` oder `lbssdpd` belegt. Vorhandene Alexa-Geraete koennen trotzdem weiter funktionieren, neue Geraete werden dann aber meist nicht gefunden.

Fuer eine einfache Bedienung per Web-UI kann einmalig ein enger Host-Helper installiert werden:

```bash
cd /mnt/docker/loxevo
sudo sh tools/install-discovery-helper.sh
```

Der Helper laeuft nur auf `127.0.0.1` und kennt nur drei Aktionen: Status lesen, Geraetesuche starten und Geraetesuche beenden. Dabei werden nur `ssdpd` und `lbssdpd` kurz gestoppt und danach wieder gestartet.

Danach laeuft die Suche fuer normale Nutzer ohne SSH:

1. In LoxEvo `Konfiguration -> Alexa-Geraetesuche` oeffnen.
2. `Geraetesuche aktivieren` klicken.
3. In der Alexa-App nach neuen Geraeten suchen.
4. Danach in LoxEvo `Geraetesuche beenden` klicken.

Wenn der Helper nicht installiert ist, bleiben die Buttons deaktiviert und LoxEvo zeigt eine entsprechende Meldung. Alle anderen Funktionen koennen trotzdem laufen.

## Backup und Wiederherstellung

In der Web-UI unter `Wartung` kann ein Backup der Einstellungen exportiert werden. Der normale Export enthaelt die LoxEvo-Konfiguration aus `data/config.json`. Die Alexa-Cookie-Datei `data/Node.txt` wird nur exportiert, wenn der Haken dafuer gesetzt ist. Backup-Dateien koennen sensible Daten wie Loxone-Zugangsdaten, UUIDs und optional Amazon-Cookies enthalten.

Beim Import legt LoxEvo zuerst eine Sicherung der aktuellen Konfiguration im Datenordner an und spielt danach die importierte Konfiguration ein. Wenn das Backup eine Cookie-Datei enthaelt, wird diese ebenfalls wiederhergestellt.

## Neuinstallation oder Ruecksetzen

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

Beim naechsten Start wird wieder eine frische `data/config.json` aus `config.example.json` angelegt.

## Deinstallation

Container stoppen und entfernen:

```bash
docker compose down
```

Damit bleiben der Projektordner und `data/` bewusst erhalten. Das ist sinnvoll, wenn LoxEvo spaeter wieder installiert oder repariert werden soll.

Fuer eine vollstaendige Entfernung:

```bash
docker compose down --rmi local
```

Danach den Projektordner `/mnt/docker/loxevo` nur dann loeschen, wenn `data/config.json` und `data/Node.txt` nicht mehr gebraucht werden oder vorher gesichert wurden.

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

In der Web-UI unter "Wartung" eine Version auswaehlen und `Installieren` klicken. Danach `LoxEvo neu starten`.

`Alexa-Cookie konnte nicht gelesen werden`:

- `data/Node.txt` pruefen
- In der Web-UI Cookie-Datei auf `/config/Node.txt` setzen
- Container neu starten

`Loxone antwortet nicht`:

- Miniserver URL pruefen
- Benutzer/Passwort pruefen
- Befehl, Loxone-Typ, UUID, Wert oder Pfad pruefen
- Vom LoxBerry aus testen, ob die Miniserver-IP erreichbar ist
- Dry-Run erst deaktivieren, wenn die erzeugten URLs korrekt aussehen
