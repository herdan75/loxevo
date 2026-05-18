# LoxBerry Docker Deployment

Diese Anleitung ist fuer den ersten Test von LoxEvo auf dem LoxBerry gedacht.

## Ziel

LoxEvo laeuft als eigener Docker-Container auf dem LoxBerry:

```text
Loxone -> http://<loxberry>:8080/... -> LoxEvo -> Alexa TTS
Alexa/HTTP -> LoxEvo -> Loxone changeTo
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
config.json
Node.txt
src/
public/
```

`config.json` enthaelt deine Loxone- und LoxEvo-Konfiguration.
`Node.txt` ist die Alexa-Cookie-Datei, die bisher in Node-RED fuer `alexa-remote2` genutzt wurde.

## Wichtige Pfade

In `config.json` muss der TTS-Cookie-Pfad im Container stehen:

```json
"tts": {
  "enabled": true,
  "cookieFile": "/config/Node.txt"
}
```

Die Datei wird ueber `docker-compose.yml` so eingebunden:

```yaml
volumes:
  - ./config.json:/config/config.json
  - ./Node.txt:/config/Node.txt:ro
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

## Erster Test

1. In der Web-UI `Dry-Run aktiv` eingeschaltet lassen.
2. Eine Lichtszene testen.
3. Unter `Alexa / Endpunkte` die erzeugten Licht- und TTS-Aufrufe pruefen.
4. TTS-Status kontrollieren.
5. Wenn TTS bereit ist, eine kurze Testmeldung senden.
6. Erst danach `Dry-Run` deaktivieren und Loxone live schalten.

## Typische Fehlermeldungen

`alexa-remote2 ist nicht installiert`

Der Container wurde nicht gebaut oder die Installation der Node-Abhaengigkeiten ist fehlgeschlagen.

```bash
docker compose build --no-cache
docker compose up -d
```

`Alexa-Cookie konnte nicht gelesen werden`

`Node.txt` liegt nicht im Projektordner oder der Volume-Pfad stimmt nicht.

`Alexa-Verbindung konnte nicht initialisiert werden`

Der Cookie ist wahrscheinlich abgelaufen oder passt nicht mehr zum Amazon-Konto. In diesem Fall muss die Cookie-Datei erneuert werden.
