# Stabilitätsprüfung nach dem Audit vom 13.09.2026

Zielstand: **1.0.29 auf `develop`**. Ausgangsbasis: `37919e8`, Version 1.0.28. Die Änderungen werden ausschließlich auf `develop` bereitgestellt; `main` und `pre-develop` bleiben unverändert. Private Importdateien bleiben unangetastet. Dieser Versionsschritt ist noch keine abgeschlossene Produktionsfreigabe.

Die ursprünglichen Befunde stehen in der [historischen Programmprüfung](review-2026-09-13.md). Sie beziehen sich auf 1.0.28; die nachfolgende Matrix dokumentiert die Umsetzung für 1.0.29.

## Umsetzung

| Stufe | Referenzen | Umsetzung und Nachweis |
| --- | --- | --- |
| Daten und Schutz | R03/R04/R06/R07/R08/R09 | Atomare private Dateischreibvorgänge; Schema-/Portprüfung vor Aktivierung; Schutz bei beschädigter Admin-Datei; begrenzte asynchrone Passwortprüfung; Secret-/URL-Bereinigung; verlustfreier Befehls-Roundtrip. Negative Konfigurations-, Browser-, Origin- und echte HTTP-Tests. |
| TTS-Lebenszyklus | R01/R02/R11/R12 | Explizites Dispose, Generationsschutz, eine Cookie-Schreibqueue, aktueller Merge-Zustand, getrennte Auth-/Inventarbereitschaft, Inventarerholung, echte Callback-Bestätigung und Teilergebnisse. Vertragstest mit AlexaRemote 8.1.1 und simuliertem Transport sowie wiederholte Remote-Wechsel. |
| Ausführung und Discovery | R05/R13/R14/R15 | Bestehende numerische IDs werden mit unverändertem Hash-/Kollisionsverfahren einmalig übernommen und dauerhaft reserviert. Konflikte im ID-Backup werden abgelehnt. Geordnete Aktoraufrufe mit eingefrorenem Clientkontext, Transport-Timeout/LL-Antwortprüfung und idempotenter Host-Helper. |
| Diagnose und Runtime | R10/R16/R18 | Gemeinsame reservierte API-Namen; Diagnose durch echten HTTP-Router getestet; RAM-Puffer nach Anzahl und Bytes begrenzt; Korrelation und Severity. HTTP startet vor optionaler Alexa-Anmeldung. Node 24, Lockfile, begrenzter Update-Prozess, CI mit Browser-/Python-/C-Tests sowie amd64-/arm64-Build und Healthcheck. |
| Bedienung und Performance | R17 | Entwürfe bleiben erhalten; Verwerfen/JSON/Import ersetzen veraltete DOM-Werte; Tabwechsel erhält offene Karten. Dialogfokus und mobile Layouts, verzögerte Suche/Dirty-Prüfung, frühe Editoranzeige und parallele Statusabfragen. |

Die Oberfläche bleibt Vanilla JavaScript im vorhandenen Stil. Ein kompletter virtueller Editor oder Lazy-Aufbau jedes einzelnen Formulars wurde bewusst nicht zusätzlich eingeführt: Die bestätigten Datenfehler sind zuerst abgesichert; eine solche Umstellung braucht eigene Zustands- und Performance-Nachweise. Die bisherigen Kompatibilitätswege für Räume und Raw-Befehle bleiben bestehen.

## Migration und Rollback

1. Vor dem ersten Start ein privates Backup des Datenordners anlegen. Cookie-Export weiterhin nur bewusst einschließen.
2. Zuerst den bisherigen Befehlsbestand unverändert starten. `alexa-device-ids.json` übernimmt die bisherige Sortierung und ID-Vergabe. Erst danach Befehle ergänzen.
3. ID-Datei nicht löschen oder von Hand neu nummerieren. Gelöschte Schlüssel bleiben reserviert. Eine Umbenennung des Schlüssels gilt als neue Identität; Anzeigename und Sprachname können ohne ID-Wechsel geändert werden.
4. Die Web-Backup-Datei enthält jetzt `alexaDeviceIds`. Alte Backups ohne diesen Block werden weiter akzeptiert. Abweichende oder doppelt belegte IDs werden beim Import nicht automatisch ersetzt.
5. Ein Rückwechsel auf alten Programmcode kennt die neue Reservierungsdatei nicht. Daher für einen Rollback den zugehörigen alten Datenstand zusammen mit dem alten Code verwenden. Nach Hinzufügen kollidierender neuer Befehle kann ein bloßer Code-Rollback wieder die alte instabile ID-Vergabe auslösen.
6. Für bind-gemountete Einzeldateien kann atomarer Dateiersatz vom Dateisystem abgelehnt werden. Empfohlen bleibt der Verzeichnis-Mount `./data:/config`; bei Schreibfehlern bleibt der alte Dateistand erhalten.

## Lokale Prüfung

```bash
npm ci --ignore-scripts
npm run check
npm test
npm run test:ui
python3 -m unittest discover -s test-python -v
```

Die Browserprüfung nutzt unter Windows den lokalen Edge, in Linux-CI das per Playwright installierte Chromium. Alle sechs Hauptansichten werden bei 1366, 768 und 390 Pixeln kontrolliert. Screenshots liegen lokal unter `.tmp/stability/` und werden nicht veröffentlicht.

HTTP-Tests starten den echten Node-Server mit synthetischer Konfiguration. Nur die Multicast-Transportinitialisierung wird ersetzt, damit der Test weder Amazon noch den Miniserver oder LoxBerry-Dienste anspricht. Der Python-Test simuliert `systemctl`; der C-Test prüft Parser und SSDP-Pakete ohne Netzwerk.

Lokaler Prüfstand für 1.0.29 am 13.09.2026 unter Windows mit Node 24.16.0:

- `npm run check`: bestanden.
- `npm test`: 62 Tests bestanden, keine Fehler oder übersprungenen Tests.
- `npm run test:ui`: 9 Tests bestanden; zusätzlich Screenshots bei 390 und 768 Pixeln visuell geprüft.
- Python-Helper: 5 Tests bestanden, mit simuliertem `systemctl`.
- `npm audit --omit=dev`: keine bekannten Schwachstellen zum Prüfzeitpunkt.
- Defekte ID-Dateien sperren Discovery und Hue-Antworten mit HTTP 503, statt eine scheinbar gültige leere Geräteliste zu liefern. Bestehende Admin-Passwortdateien im Format 1 werden weiterhin akzeptiert.

Diese Nachweise betreffen den lokalen Arbeitsstand, nicht den produktiven Container. Der [CI-Lauf auf develop](https://github.com/herdan75/loxevo/actions/workflows/ci.yml?query=branch%3Adevelop) muss zum ausgelieferten Commit passen; ältere erfolgreiche Läufe sind kein Nachweis für 1.0.29. Ein API-Callback ist keine Messung der tatsächlichen Schallausgabe.

## Vor Freigabe noch erforderlich

- Erfolgreicher Linux-CI-Lauf einschließlich kompiliertem C-Helper, Docker-Healthcheck nach Start und sauberem SIGTERM-Ende, auch für `linux/arm64` unter QEMU. Die Workflow-Erweiterung allein ist kein bestandener ARM-Build. Auf diesem Windows-System sind Docker, Linux/WSL und ein C-Compiler nicht verfügbar.
- Kontrollierter 48-Stunden-Test auf LoxBerry nach manuellem Login, falls erforderlich: normale Ansage, Alarm und Lautstärke einmal bewusst prüfen; anschließend den passiven Beobachter aus der README verwenden. Keine automatischen Alarmproben.
- Bei Fehler zuerst Zustand, vorhandenes Inventar und bereinigten Protokollexport erfassen, erst danach Reconnect oder Neustart. Prüfen, ob die konfigurierte Gerätekennung im Inventar fehlt und ob davor Auth-Refresh oder Instanzwechsel stattfand.
- API-Bestätigung ist keine garantierte akustische Wiedergabe. Keine Fernprüfung realer Echo-Geräte, Multicast-Reichweite, Aktorwirkung oder Amazon-Langzeiterneuerung wurde hier durchgeführt.

Technische Referenzen: [Node-LTS-Laufzeiten](https://nodejs.org/en/about/previous-releases), [AlexaRemote-Quellcode](https://github.com/Apollon77/alexa-remote), [Docker-Multiplattform-Builds](https://docs.docker.com/build/building/multi-platform/). Der Adaptervertrag wurde gegen das installierte, im Lockfile festgelegte Paket 8.1.1 geprüft, nicht gegen den beweglichen GitHub-Master.
