# EchoLox TTS Integration

Ziel: EchoLox soll langfristig das einzige Plugin fuer Alexa/Loxone bleiben.

```text
Alexa -> EchoLox -> Loxone
Loxone -> EchoLox -> Alexa TTS
```

## Referenz: Alexa2Lox

Alexa2Lox ist fuer die Rueckrichtung interessant: Loxone triggert Alexa/Echo. Laut LoxBerry-Wiki steuert Alexa2Lox keine Loxone-Geraete per Spracheingabe, sondern bietet Steuerung und Sprachausgabe von Echo-Geraeten. Die TTS-Syntax ist:

```text
/admin/plugins/alexa2lox/tts.php?device=<Geraetename>&text=<Mein Text>&vol=<1...100>
/admin/plugins/alexa2lox/tts.php?d=<Geraetename>&t=<Mein Text>&vol=<1...100>
```

Mehrere Geraete sind kommasepariert moeglich, `ALL` spricht alle unterstuetzten Echo-Geraete an.

Quelle:
https://wiki.loxberry.de/plugins/alexa2lox/start

## Was aus Alexa2Lox uebernommen werden sollte

- HTTP-API mit kurzen Parametern `d`, `t`, `vol`
- `device=ALL`
- mehrere Geraete kommasepariert
- Text `0` ignorieren, weil Loxone-Statusbausteine manchmal nachtraeglich `0` senden
- Umlaute/Sonderzeichen fuer TTS normalisieren, falls die Aussprache leidet
- Geraeteliste cachen
- Echo-Geraete nach Name suchen, case-insensitive
- Online-Status und erlaubte Echo-Familien filtern
- optional MQTT-Status zurueckmelden: letzter TTS-Text, Zeitpunkt

## Nicht uebernehmen

Alexa2Lox ruft `alexa_remote_control.sh` per PHP `exec()` auf. Fuer EchoLox sollte das nicht der Endzustand sein, weil EchoLox ein Go-Binary ohne Script-Abhaengigkeiten bleiben soll.

Stattdessen:

```text
internal/alexa/
  client.go        Cookie/Refresh-Token, Amazon HTTP Client
  devices.go       Echo-Geraeteliste, Cache, Suche nach Name/ALL
  sequence.go      Speak, SpeakAtVolume, Volume
  handler.go       HTTP-Handler fuer TTS API
```

## EchoLox API-Vorschlag

Kompatibel zu Alexa2Lox:

```text
GET  /echolox/api/tts?device=Kueche&text=Hallo&vol=50
GET  /echolox/api/tts?d=Kueche&t=Hallo&vol=50
POST /echolox/api/tts
```

Zusaetzliche klare Endpunkte:

```text
POST /echolox/api/tts/speak
POST /echolox/api/tts/alarm
POST /echolox/api/tts/volume
GET  /echolox/api/tts/devices
POST /echolox/api/tts/test
```

## Config-Vorschlag

```yaml
tts:
  enabled: true
  amazon: "amazon.de"
  alexa: "alexa.amazon.de"
  locale: "de-DE"
  refresh_token: ""
  cookie_file: "/opt/loxberry/data/plugins/EchoLox/alexa.cookie"
  device_cache: "/opt/loxberry/data/plugins/EchoLox/alexa_devices.json"
  default_devices:
    - "Kueche"
  alarm_devices:
    - "Kueche"
    - "Wohnzimmer"
  alarm_volume: 100
  ignore_zero_text: true
```

## Web-UI

Neue Seite oder Erweiterung von `settings.html`:

- TTS aktivieren/deaktivieren
- Amazon Domain, Alexa Host, Locale
- Refresh-Token/Cookie-Status anzeigen
- Geraeteliste aktualisieren
- Standardgeraet und Alarmgeraete auswaehlen
- Testtext senden
- optional letzter TTS-Status

## Implementierungsreihenfolge

1. EchoLox lokal/forkbar machen und aktuelle Struktur beibehalten.
2. Config-Struktur um `tts` erweitern.
3. TTS-HTTP-Endpunkte und Web-UI-Platzhalter anlegen.
4. Alexa-Geraeteliste aus Amazon-API laden und cachen.
5. `speak` fuer ein Geraet implementieren.
6. mehrere Geraete und `ALL` implementieren.
7. `vol`/`speakAtVolume` implementieren.
8. LoxBerry-MQTT-Status optional nachziehen.

## Risiko

Die Amazon-Echo-TTS-Schnittstelle ist nicht offiziell stabil. Alexa2Lox und Node-RED `alexa-remote2` funktionieren ueber Reverse-Engineering der Alexa-Remote-API. EchoLox sollte darum TTS klar modular halten, damit Amazon-Aenderungen nur `internal/alexa` betreffen.
