# Installation

> **Hinweis:** LoxEvo ist noch eine Entwicklungsversion. Diese Anleitung ist fuer Tests gedacht, nicht als produktive Freigabe.

## Voraussetzungen

- LoxBerry oder Linux-System mit Docker
- Docker Compose
- Loxone-Miniserver mit erreichbarer HTTP-Schnittstelle
- Optional fuer TTS: Alexa-Cookie-Datei fuer `alexa-remote2`

## Installation auf LoxBerry

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

## Private Konfiguration

Alle privaten Daten gehoeren in den Ordner `data/`.

```text
data/config.json
data/Node.txt
```

Diese Dateien werden nicht ins Git-Repository uebernommen.
`data/config.json` wird beim ersten Start automatisch erzeugt und danach ueber die Web-UI angepasst.

## TTS aktivieren

1. Alexa-Cookie-Datei als `data/Node.txt` ablegen.
2. In der Web-UI unter `Konfiguration` TTS aktivieren.
3. Cookie-Datei auf `/config/Node.txt` setzen.
4. Echo-Geraete-IDs eintragen.
5. Speichern und TTS-Status pruefen.

## Updates

```bash
cd /mnt/docker/loxevo
git pull
docker compose up -d --build
```

Die Dateien in `data/` bleiben dabei erhalten.
