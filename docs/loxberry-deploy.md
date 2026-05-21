# LoxBerry Docker Deployment

> **Hinweis:** Diese Deployment-Anleitung beschreibt den aktuellen Entwicklungsstand. LoxEvo ist noch nicht als stabile Produktivversion freigegeben.

Diese Anleitung ist fuer den ersten Test von LoxEvo auf dem LoxBerry gedacht.

## Ziel

LoxEvo laeuft als eigener Docker-Container auf dem LoxBerry:

```text
Loxone -> http://<loxberry>:8080/... -> LoxEvo -> Alexa TTS
Alexa-Routine/HTTP -> LoxEvo -> Loxone-Befehl
```

## Dateien auf dem LoxBerry

Empfohlener Projektordner:

```text
/mnt/docker/loxevo
```

In diesem Ordner sollten liegen:

```text
docker-compose.yml
Dockerfile
package.json
data/config.json
data/Node.txt
src/
public/
```

`data/config.json` enthaelt deine Loxone- und LoxEvo-Konfiguration.
`data/Node.txt` ist die Alexa-Cookie-Datei, die bisher in Node-RED fuer `alexa-remote2` genutzt wurde.
Node-RED muss fuer LoxEvo nicht laufen; die Cookie-Datei kann nur als bestehende Grundlage uebernommen werden.
Der komplette Ordner `data/` ist fuer private lokale Daten gedacht und wird nicht ins GitHub-Repository uebernommen.

Vor dem ersten Start:

```bash
mkdir -p data
```

Falls `data/config.json` noch nicht existiert, wird sie beim ersten Start automatisch aus `config.example.json` angelegt.

## Wichtige Pfade

In `config.json` muss der TTS-Cookie-Pfad im Container stehen:

```json
"tts": {
  "enabled": true,
  "cookieFile": "/config/Node.txt"
}
```

Der komplette lokale `data/`-Ordner wird ueber `docker-compose.yml` so eingebunden:

```yaml
volumes:
  - ./data:/config
```

## Start

Im Projektordner auf dem LoxBerry:

```bash
docker compose up -d --build
```

Status pruefen:

```bash
docker compose ps
docker compose logs -f loxevo
```

Web-UI:

```text
http://<loxberry-ip>:8080
```

Beim ersten Start ist `Dry-Run` aktiv. LoxEvo sendet dann noch keine echten Loxone-Befehle, sondern zeigt die erzeugten URLs im Protokoll.

## Erster Test

1. In der Web-UI `Dry-Run aktiv` eingeschaltet lassen.
2. Einen aktiven Befehl testen.
3. Unter `Externe Aufrufe` die erzeugten Befehls- und TTS-Aufrufe pruefen.
4. TTS-Status kontrollieren.
5. Wenn TTS bereit ist, eine kurze Testmeldung senden.
6. Erst danach `Dry-Run` deaktivieren und Loxone live schalten.

## Typische Fehlermeldungen

`alexa-remote2 ist nicht installiert`

In der Web-UI unter `Wartung` eine Version auswaehlen und installieren. Danach LoxEvo ueber den Button in der Web-UI oder mit `docker compose restart loxevo` neu starten.

`Alexa-Cookie konnte nicht gelesen werden`

`Node.txt` liegt nicht in `data/` oder der Cookie-Pfad in `data/config.json` stimmt nicht.

`Alexa-Verbindung konnte nicht initialisiert werden`

Der Cookie ist wahrscheinlich abgelaufen oder passt nicht mehr zum Amazon-Konto. In diesem Fall muss die Cookie-Datei erneuert werden.
