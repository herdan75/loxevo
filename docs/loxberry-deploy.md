# LoxBerry Docker Deployment

> **Hinweis:** Diese Deployment-Anleitung beschreibt LoxEvo ab Version 1.0.0. Neue Befehle und Live-Zugriffe sollten zuerst bewusst getestet werden.

Diese Anleitung ist für den ersten Test von LoxEvo auf dem LoxBerry gedacht.

## Ziel

LoxEvo läuft als eigener Docker-Container auf dem LoxBerry:

```text
Loxone -> http://<loxberry>:8080/... -> LoxEvo -> Alexa TTS
Alexa-Gerät/HTTP -> LoxEvo -> Loxone-Befehl
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

`data/config.json` enthält deine Loxone- und LoxEvo-Konfiguration.
`data/Node.txt` ist die Alexa-Cookie-Datei für `alexa-remote2`.
LoxEvo akzeptiert sowohl eine reine Cookie-Zeile als auch JSON-Dateien mit `localCookie`. Bei JSON-Dateien werden `localCookie`, `csrf` und die gespeicherten Registrierungsdaten wie `macDms` und `refreshToken` verwendet.
Wenn Amazon eine neue Anmeldung verlangt, zeigt das Log eine lokale Proxy-URL. Diese URL muss die LAN-IP des LoxBerry enthalten. Falls dort `undefined` oder eine falsche IP steht, in der Web-UI unter `Konfiguration -> Alexa TTS` die Proxy-IP eintragen.
Der komplette Ordner `data/` ist für private lokale Daten gedacht und wird nicht ins GitHub-Repository übernommen.

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

Der komplette lokale `data/`-Ordner wird über `docker-compose.yml` so eingebunden:

```yaml
volumes:
  - ./data:/config
```

## Start

Im Projektordner auf dem LoxBerry:

```bash
docker compose up -d --build
```

Status prüfen:

```bash
docker compose ps
docker compose logs -f loxevo
```

Web-UI:

```text
http://<loxberry-ip>:8080
```

Beim ersten Start ist `Dry-Run` aktiv. LoxEvo sendet dann noch keine echten Loxone-Befehle, sondern zeigt die erzeugten URLs im Protokoll.
Für virtuelle Alexa-Geräte muss LoxEvo im gleichen Netzwerk wie die Echo-Geräte laufen. Das Docker-Compose-Setup nutzt deshalb `network_mode: host`, damit die lokale Alexa-Gerätesuche über SSDP/UDP 1900 funktioniert.
Für neuere Echo-Geräte sollte die Alexa-Bridge über Port 80 erreichbar sein. Die normale Web-UI kann auf Port 8080 bleiben; LoxEvo startet dann zusätzlich einen lokalen Alexa/Hue-HTTP-Listener auf Port 80. Falls dieser Port bereits vom LoxBerry-Webserver belegt ist, muss der Portkonflikt vor dem Alexa-Test gelöst werden.
Eine echte Hue-Bridge ist dafür nicht nötig. LoxEvo stellt nur die lokale Discovery und die Hue-kompatiblen Ein/Aus-Endpunkte bereit, die Alexa zur Gerätesuche und zum Auslösen der konfigurierten Befehle nutzt.

Wenn LoxBerry-`ssdpd` oder `lbssdpd` den Port 1900 belegt, funktionieren bereits gefundene Alexa-Geräte meist weiter, neue Geräte werden aber wahrscheinlich nicht gefunden. Für die Bedienung per Button kann optional ein enger Host-Helper installiert werden. Das passiert nicht automatisch durch den Docker-Container, weil dafür Host-/Root-Rechte nötig sind:

```bash
cd /mnt/docker/loxevo
sudo sh tools/install-discovery-helper.sh
```

Der Helper läuft nur lokal auf `127.0.0.1` und darf nur Status, Start und Stopp der Dienste `ssdpd` und `lbssdpd` ausführen. Danach kann die Alexa-Gerätesuche in der Web-UI unter `Konfiguration -> Alexa-Gerätesuche` gezielt aktiviert und wieder beendet werden.

Der normale Ablauf ist:

1. In LoxEvo `Gerätesuche aktivieren` klicken.
2. In der Alexa-App nach neuen Geräten suchen.
3. In LoxEvo `Gerätesuche beenden` klicken.

So wird der LoxBerry-SSDP-Dienst nur für die eigentliche Suche pausiert.

## Backup und Deinstallation

Vor größeren Änderungen kann in der Web-UI unter `Wartung` ein Backup exportiert werden. Standardmäßig enthält es `data/config.json`; die Alexa-Cookie-Datei `data/Node.txt` wird nur mit exportiert, wenn der Haken dafür gesetzt ist. Der Admin-Token-Hash wird nicht im normalen Backup exportiert. Backup-Dateien können sensible Loxone- und Alexa-Daten enthalten und sollten privat bleiben.

Beim Import erstellt LoxEvo zuerst eine Sicherung der aktuellen Konfiguration im Datenordner und spielt danach das Backup ein.

Eine normale Deinstallation entfernt nur den Container:

```bash
docker compose down
```

`data/` bleibt dabei erhalten. Für eine vollständige Entfernung zusätzlich das lokale Image entfernen und den Projektordner `/mnt/docker/loxevo` nur löschen, wenn die Einstellungen nicht mehr gebraucht werden. Wenn der optionale Discovery-Helper installiert wurde, zusätzlich `loxevo-discovery-helper.service` deaktivieren und `/usr/local/sbin/loxevo-discovery-helper` entfernen.

## Erster Test

1. In der Web-UI `Dry-Run aktiv` eingeschaltet lassen.
2. Einen aktiven Befehl testen.
3. Unter `Externe Aufrufe` die erzeugten Befehls- und TTS-Aufrufe prüfen.
4. Optional unter `Konfiguration -> Alexa-Geräte` die virtuellen Alexa-Geräte aktivieren und speichern.
5. In der Alexa-App nach neuen Geräten suchen.
6. TTS-Status kontrollieren und unter `Konfiguration -> TTS-Geräte` die Echo-Geräte aus Alexa laden.
7. Standard- und Alarm-Geräte auswählen, Lautstärke-Schieber setzen und eine kurze Testmeldung senden.
8. Erst danach `Dry-Run` deaktivieren und Loxone live schalten.

## Typische Fehlermeldungen

`alexa-remote2 ist nicht installiert`

In der Web-UI unter `Wartung` eine Version auswählen und installieren. Danach LoxEvo über den Button in der Web-UI oder mit `docker compose restart loxevo` neu starten.

`Alexa-Cookie konnte nicht gelesen werden`

`Node.txt` liegt nicht in `data/` oder der Cookie-Pfad in `data/config.json` stimmt nicht.

`Alexa-Verbindung konnte nicht initialisiert werden`

Der Cookie ist wahrscheinlich abgelaufen oder passt nicht mehr zum Amazon-Konto. In diesem Fall muss die Cookie-Datei erneuert werden.
