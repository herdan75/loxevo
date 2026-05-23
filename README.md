# LoxEvo

> **Status: Entwicklungsversion / Work in Progress**
>
> LoxEvo ist aktuell noch **nicht produktiv freigegeben**. Das Projekt ist im Aufbau und kann lokal oder auf einem Test-LoxBerry ausprobiert werden. Installation, API, Konfiguration und Alexa/TTS-Integration koennen sich noch aendern. Nutzung bitte nur im Dry-Run oder in einer bewusst getesteten Umgebung.

Eigene LoxBerry-Zentrale fuer Alexa, Echo-TTS und Loxone.

Dieses Projekt ist bewusst **keine Code-Kopie von EchoLox**. EchoLox und Alexa2Lox dienen als fachliche Referenzen fuer das Zielbild:

- Alexa-Sprachbefehle sollen einfach bleiben
- Loxone bleibt die Automationszentrale
- Echo-TTS soll direkt aus Loxone ausloesbar sein
- Wartung soll ueber eine zentrale Konfiguration und Web-UI erfolgen

## Zielarchitektur

```text
Alexa
  -> Alexa-Geraete-/Bridge-Eingang
  -> LoxEvo
  -> Loxone

Loxone
  -> LoxEvo TTS
  -> Echo spricht
```

Der aktuelle Stand ist ein Docker-faehiger Prototyp mit HTTP-API, Web-UI, generischen Loxone-Befehlen und integriertem TTS-Modul.
Loxone-Befehle laufen standardmaessig im Dry-Run-Modus, damit lokal gefahrlos getestet werden kann.
Wenn TTS aktiviert wird, aber `alexa-remote2` oder die Cookie-Datei noch fehlt, startet LoxEvo trotzdem weiter und zeigt den TTS-Status in der Web-UI an.
Optional kann LoxEvo virtuelle Alexa-Geraete im lokalen Netzwerk bereitstellen. Alexa findet diese Geraete ueber die lokale Geraetesuche; ein Einschaltbefehl wie `Alexa, Licht Kueche Hell an` loest dann den passenden LoxEvo-Befehl aus.

## Setup

Ausfuehrliche Installationsschritte stehen in [INSTALL.md](INSTALL.md).

```bash
mkdir -p data
docker compose up -d --build
```

Falls `data/config.json` noch nicht existiert, legt LoxEvo sie beim ersten Start automatisch aus `config.example.json` an.

Web-UI:

```text
http://<loxberry>:8080
```

In `data/config.json` ist `loxone.dryRun` standardmaessig `true`. Dann erzeugt LoxEvo nur die URL und zeigt sie im Protokoll, sendet aber noch nichts an Loxone.
Der Modus kann auch direkt oben in der Web-UI umgeschaltet werden.

TTS braucht das Paket `alexa-remote2` und eine gueltige Alexa-Cookie-Datei. Das Paket wird bewusst nicht fest im Docker-Build installiert, damit LoxEvo auch dann startet, wenn npm-Versionen wechseln. Installiere oder aktualisiere es in der Web-UI unter "Wartung"; im Docker/LoxBerry-Betrieb landet es im gemounteten `/config`-Bereich.
Als Cookie-Datei kann eine reine Cookie-Zeile oder eine JSON-Datei mit `localCookie` verwendet werden. Bei JSON-Dateien nutzt LoxEvo `localCookie`, `csrf` und gespeicherte Registrierungsdaten wie `macDms` und `refreshToken`, falls diese vorhanden sind.
Wenn Amazon trotzdem eine neue Anmeldung verlangt, nutzt `alexa-remote2` einen lokalen Login-Proxy. LoxEvo setzt dafuer automatisch die LAN-IP des LoxBerry; bei Bedarf kann `tts.proxyOwnIp` und `tts.proxyPort` in der Web-UI angepasst werden.
Fuer den LoxBerry-Test siehe [docs/loxberry-deploy.md](docs/loxberry-deploy.md).

Die Web-UI zeigt unter "Wartung" die installierte `alexa-remote2`-Version, verfuegbare npm-Versionen und kann Installation oder Update im laufenden Container anstossen. Nach einem Paketupdate ist ein Neustart von LoxEvo erforderlich.

Private Daten gehoeren in `data/`:

- `data/config.json`
- `data/Node.txt`

Dieser Ordner ist absichtlich von Git ausgenommen, damit keine Loxone-Zugangsdaten, UUIDs oder Alexa-Geraete-IDs veroeffentlicht werden.
Alle privaten Werte werden nach der Installation ueber die Web-UI oder direkt in `data/config.json` gepflegt.

Wichtig fuer Live-Tests: Die Web-UI zeigt und speichert Loxone-Zugangsdaten. LoxEvo sollte deshalb nur im eigenen LAN oder per VPN erreichbar sein und nicht direkt ins Internet freigegeben werden.

Die Web-UI ist der empfohlene Konfigurationsweg. Aktuell koennen dort gepflegt werden:

- Loxone-Miniserver URL, Benutzer und Passwort
- Dry-Run/Live-Modus
- virtuelle Alexa-Geraete aus aktiven Befehlen
- frei definierbare Rubriken und Befehle mit Sprachname, Raum, Funktion, Aktion, Loxone-Typ, UUID, Wert oder Pfad
- TTS-Aktivierung, Cookie-Datei, Lautstaerken und Alexa-Geraetelisten
- TTS-Status mit klarer Fehlermeldung, falls Alexa noch nicht bereit ist

Die Oberflaeche ist in klare Bereiche gegliedert:

- `Testen`: Loxone-Befehle und Alexa-TTS direkt aus der Web-UI pruefen
- `Externe Aufrufe`: fertige URLs fuer Alexa-Routinen, Loxone und optionale externe Tools testen und kopieren
- `Konfiguration`: Loxone, frei definierbare Befehle und TTS pflegen
- `Wartung`: Paketversionen pruefen und Alexa-TTS-Komponente verwalten
- `Protokoll`: zuletzt simulierte oder gesendete Aktionen ansehen

Die JSON-Ansicht bleibt als Expertenmodus erhalten.

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

{"command":"kueche_licht_hell"}
```

Die Befehle werden in der Web-UI frei angelegt. Beispiel: `kueche_licht_hell` kann als Sprachname `Kueche Licht Hell`, als Raum `kueche`, als Funktion `licht` und als Aktion `hell` bekommen.

Unterstuetzte Loxone-Befehlstypen:

- `changeTo`: `/jdev/sps/io/<uuid>/changeTo/<wert>` fuer Lichtstimmungen und Szenen
- `direct`: `/jdev/sps/io/<uuid>/<wert>` fuer Befehle wie `FullUp`, `FullDown`, `on`, `off` oder Nummernwerte
- `pulse`: `/jdev/sps/io/<uuid>/pulse` fuer Taster
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
POST http://<loxberry>:8080/command/kueche_licht_hell
```

Die alte Kurzform `/light/<raum>/<szene>` bleibt vorerst als Legacy-Einstieg erhalten, wenn eine alte `rooms`-Konfiguration vorhanden ist.

## Virtuelle Alexa-Geraete

Wenn `alexaBridge.enabled` aktiv ist, bietet LoxEvo jeden aktiven Befehl als virtuelles Alexa-Geraet an. In der Web-UI unter `Konfiguration -> Alexa Geraete` kann die lokale Bruecke aktiviert werden.

Technisch ist das ein lokaler Hue-kompatibler V1-Bridge-Eingang nur fuer Alexa-Discovery und Ein/Aus-Befehle. Es wird keine Hue-Bridge und keine Hue-Lampe benoetigt; LoxEvo nutzt nur das lokale Discovery/API-Verhalten, damit Alexa ohne eigene Cloud-Skill-Entwicklung virtuelle Geraete finden kann.

Fuer die Geraetesuche muss LoxEvo im gleichen LAN wie die Echo-Geraete erreichbar sein. Im Docker/LoxBerry-Betrieb ist `network_mode: host` deshalb der empfohlene Modus, weil SSDP/UDP 1900 sonst oft nicht sauber bis in den Container gelangt.
Das Docker-Image enthaelt dafuer einen kleinen Linux-SSDP-Helper. Er nutzt wie EchoLox die Linux-Socket-Optionen fuer gemeinsam nutzbare UDP-Ports und kann dadurch neben dem LoxBerry-`ssdpd` laufen, ohne dessen Dienst abschalten zu muessen.
Fuer neuere Echo-Geraete sollte die Alexa-Bridge ueber Port 80 erreichbar sein. Die Web-UI kann weiter auf Port 8080 laufen; LoxEvo startet bei abweichendem `alexaBridge.advertisePort` einen zusaetzlichen Alexa/Hue-HTTP-Listener.

Typischer Ablauf:

```text
Alexa-App -> Geraete -> + -> Geraet hinzufuegen -> Andere -> Geraete suchen
```

Danach kann ein Befehl wie `kueche_licht_hell` ueber den angezeigten Geraetenamen ausgelöst werden:

```text
Alexa, Licht Kueche Hell an
```

LoxEvo behandelt diese Geraete als Taster: `an` loest den hinterlegten Befehl aus. `aus` setzt nur den virtuellen Zustand zurueck.
Wenn waehrend der Entwicklung Geraete mehrfach gefunden wurden, alte LoxEvo-Testgeraete in der Alexa-App loeschen und danach erneut suchen. Die aktuellen Geraete-IDs sind pro Befehl stabil, damit spaetere Konfigurationsaenderungen weniger Durcheinander erzeugen.

## TTS-API

Echo-Geraete muessen nicht manuell geraten werden: In der Web-UI unter `Konfiguration -> TTS-Geraete` kann LoxEvo die Geraeteliste aus dem verbundenen Alexa-Konto laden. Dabei werden Name und Seriennummer angezeigt und per Checkbox in Standard-, Alle- oder Alarm-Geraete uebernommen.

Normale Sprachausgabe:

```text
POST http://<loxberry>:8080/tts/speak
Body: Geschirrspueler ist fertig.
```

Alarm:

```text
POST http://<loxberry>:8080/tts/alarm
Body: Achtung, Alarm wurde ausgeloest.
```

Lautstaerke:

```text
POST http://<loxberry>:8080/tts/lautstaerke
Body: 70
```

`/tts/speak` spricht schnell mit der aktuell am Echo eingestellten Lautstaerke. `/tts/alarm` nutzt immer die Alarm-Lautstaerke und uebersteuert damit die aktuelle Echo-Lautstaerke fuer diese Ausgabe. Der separate Lautstaerke-Aufruf setzt die Lautstaerke der Alle-Geraete, sonst der Standard-Geraete.

Loxone-Kurzpfade fuer virtuelle Ausgangsbefehle:

```text
POST http://<loxberry>:8080/geschirrspueler
Body: Geschirrspueler ist fertig.

POST http://<loxberry>:8080/alarm
Body: Achtung, Alarm wurde ausgeloest.

POST http://<loxberry>:8080/lautstaerke
Body: 70
```

Das Prinzip ist bewusst einfach: `alarm` nutzt die Alarm-Geraete, `lautstaerke` setzt die Lautstaerke, alle anderen Namen sprechen den Text aus dem Body auf den Standard-Geraeten. LoxEvo beantwortet diese Kurzpfade sofort und sendet die Alexa-Ausgabe im Hintergrund, damit Loxone nicht auf die TTS-Ausfuehrung warten muss.

## Loxone TTS einrichten

Der empfohlene Weg in Loxone ist ein zentraler virtueller Ausgang fuer LoxEvo und darunter mehrere virtuelle Ausgangsbefehle.

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
http://192.168.178.5:8080/
```

Die Web-UI von LoxEvo laeuft standardmaessig auf Port `8080`. Der Alexa/Hue-Port `80` ist nur fuer die virtuelle Alexa-Geraetesuche relevant, nicht fuer diese Loxone-TTS-Aufrufe.

### Normale Sprachausgabe

Fuer jede Meldung einen virtuellen Ausgangsbefehl unter dem LoxEvo-Ausgang anlegen.

```text
Befehl bei EIN:
/geschirrspueler

HTTP header bei EIN:
leer lassen

HTTP Methode bei EIN:
POST

HTTP body bei EIN:
Geschirrspueler ist fertig. Bitte Tuere oeffnen, damit das Geschirr trocknen kann.

Befehl bei AUS:
leer lassen
```

Der Pfad nach dem Slash ist frei waehlbar. LoxEvo nutzt ihn als Namen im Protokoll. Gesprochen wird der Text aus `HTTP body bei EIN`.
Alternativ kann in `Befehl bei EIN` auch die komplette URL stehen, zum Beispiel `http://192.168.178.5:8080/geschirrspueler`. Uebersichtlicher ist aber der zentrale virtuelle Ausgang mit kurzer Pfadangabe.

Weitere Beispiele:

```text
Befehl bei EIN: /luefter_dusche_manuell_aus
HTTP body bei EIN: Luefter Dusche wurde manuell ausgeschaltet. Bitte Luefter wieder einschalten oder Fenster oeffnen.

Befehl bei EIN: /abwesenheit_aktiv
HTTP body bei EIN: Abwesenheitsmodus aktiviert. Alle Fenster sind geschlossen.

Befehl bei EIN: /waschmaschine
HTTP body bei EIN: Waesche ist fertig. Bitte Waesche entnehmen.
```

Normale Meldungen werden auf den in LoxEvo konfigurierten `Standard-Geraeten` gesprochen.

### Alarm aus Loxone

Fuer Alarmmeldungen den reservierten Pfad `/alarm` verwenden.

```text
Befehl bei EIN:
/alarm

HTTP header bei EIN:
leer lassen

HTTP Methode bei EIN:
POST

HTTP body bei EIN:
Achtung, Alarm wurde ausgeloest.

Befehl bei AUS:
leer lassen
```

Alarm nutzt die in LoxEvo konfigurierten `Alarm-Geraete` und setzt fuer diese Ausgabe die `Alarm-Lautstaerke`. Wenn Alexa die vorherige Lautstaerke liefert, stellt LoxEvo sie nach der Alarm-Ausgabe wieder her. Der Alarm wird pro Loxone-Aufruf genau einmal gesendet.

SSML kann ebenfalls als Body verwendet werden, wenn Alexa es akzeptiert:

```xml
<speak><prosody pitch="high">Please leave the house. The police has already been called.</prosody><audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_alarm_03"/></speak>
```

Solche Alarmtexte unbedingt live testen, bevor sie fuer einen echten Alarm verwendet werden. Amazon kann SSML- oder Soundbank-Unterstuetzung je nach Geraet, Region oder Alexa-API-Verhalten unterschiedlich behandeln.

### Lautstaerke aus Loxone setzen

Fuer eine reine Lautstaerke-Aenderung den reservierten Pfad `/lautstaerke` verwenden. Der Body muss eine Zahl zwischen `0` und `100` enthalten.

```text
Befehl bei EIN:
/lautstaerke

HTTP header bei EIN:
leer lassen

HTTP Methode bei EIN:
POST

HTTP body bei EIN:
70

Befehl bei AUS:
leer lassen
```

Dieser Aufruf setzt die Lautstaerke der `Alle-Geraete`, falls dort Geraete konfiguriert sind. Wenn `Alle-Geraete` leer ist, nutzt LoxEvo die `Standard-Geraete`.

Wenn die Lautstaerke in Loxone ueber Radiotasten, Status oder einen Wertbaustein ausgewaehlt wird, kann der Wert direkt an LoxEvo uebergeben werden. Wichtig ist nur, dass im HTTP-Body am Ende eine Zahl zwischen `0` und `100` steht.

Typisches Beispiel mit einem Loxone-Wert:

```text
Befehl bei EIN:
/lautstaerke

HTTP header bei EIN:
leer lassen

HTTP Methode bei EIN:
POST

HTTP body bei EIN:
<v>

Befehl bei AUS:
leer lassen
```

`<v>` ist der von Loxone eingesetzte aktuelle Wert des Ausgangsbefehls. Wenn der vorgeschaltete Baustein also `10`, `40`, `70` oder `100` liefert, setzt LoxEvo genau diese Alexa-Lautstaerke. Die Schreibweise des Pfads ist unkritisch: `/Lautstaerke` und `/lautstaerke` werden gleich behandelt.

Fuer Radiotasten empfiehlt sich, direkt Prozentwerte als Ausgabewerte zu verwenden:

```text
Taste 1 -> 10
Taste 2 -> 20
Taste 3 -> 30
Taste 4 -> 40
Taste 5 -> 50
Taste 6 -> 70
Taste 7 -> 100
```

### Zielgeraete in LoxEvo

Die Echo-Zielgeraete werden nicht in Loxone gepflegt, sondern in LoxEvo:

```text
Konfiguration -> TTS-Geraete -> Alexa-Geraete suchen
```

Dort koennen Geraete per Checkbox zugeordnet werden:

- `Standard`: normale TTS-Meldungen
- `Alle`: Lautstaerke-Aufrufe oder gemeinsame Gruppen
- `Alarm`: Alarmmeldungen mit Alarm-Lautstaerke

Dadurch bleiben Loxone-Ausgaenge einfach: Loxone sendet nur Pfad und Text, LoxEvo entscheidet anhand der Konfiguration, welche Echo-Geraete sprechen.

## Alexa2Lox-kompatibler TTS-Aufruf

Zusaetzlich gibt es einen Alexa2Lox-aehnlichen Einstieg fuer Systeme, die TTS lieber mit Query-Parametern ausloesen:

```text
GET http://<loxberry>:8080/admin/plugins/alexa2lox/tts.php?device=Kueche&text=Hallo&vol=50
GET http://<loxberry>:8080/admin/plugins/alexa2lox/tts.php?d=Kueche&t=Hallo&vol=50
```

Unterstuetzt:

- `device`, `devices` oder `d`
- `text` oder `t`
- `vol`
- `device=ALL`
- Text `0` wird standardmaessig ignoriert
- `ss` und `Grad` werden fuer bessere Aussprache normalisiert

Hinweis: Auch dieser kompatible Einstieg nutzt die TTS-Geraetelisten aus der Web-UI. Mit `device=ALL` werden die `Alle-Geraete` genutzt, sonst die `Standard-Geraete`.

## Rechtliche Linie

EchoLox ist eine wichtige technische Referenz, aber in der geprueften Repository-Ansicht war kein klares `LICENSE`-File sichtbar. Ohne Lizenz gelten standardmaessig restriktive Urheberrechte. Darum wird LoxEvo als eigenstaendige Implementierung aufgebaut:

- kein Kopieren von EchoLox-Code
- keine Uebernahme von Assets, Logos, Texten oder Web-UI
- eigene Projektstruktur und eigener Name
- Referenzen nur als technische Orientierung

Siehe auch:

- [docs/legal-notes.md](docs/legal-notes.md)
- [docs/echolox-tts-integration.md](docs/echolox-tts-integration.md)

## GitHub

Empfohlener Repository-Name:

```text
loxevo
```

Beschreibung:

```text
Own LoxBerry gateway for Alexa, Echo TTS and Loxone automation.
```

Wenn das Projekt oeffentlich werden soll, ist eine eigene Lizenz sinnvoll. Fuer eine einfache eigene Open-Source-Version bietet sich MIT an. Fuer eine private Version kann die Lizenz auch spaeter entschieden werden.
