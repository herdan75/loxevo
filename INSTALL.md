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
