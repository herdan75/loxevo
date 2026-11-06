# Prüfbericht 1.0.30

Ausgangsbasis: `1086a35`, Version 1.0.29. Ziel: **1.0.30 ausschließlich auf develop**, 06.11.2026. Bestehende private Importdateien, produktive Zugangsdaten und andere Branches werden nicht verändert.

## Neun Korrekturen

| Befund | Korrektur und Regression |
| --- | --- |
| A01: Dry-Run nach Verwerfen falsch angezeigt | Sofort gespeicherter Modus aktualisiert auch den gespeicherten UI-Snapshot. UI-Test wechselt Live, bearbeitet und verwirft. |
| A02: Fehlerhafter TTS-Kandidat übernimmt Cookie-Zuständigkeit | Cookie-Ereignisse eines Kandidaten werden bei bestehender bereiter Remote vorgemerkt. Erst erfolgreiche Übernahme persistiert sie; fehlgeschlagene Kandidaten blockieren spätere Updates der alten Verbindung nicht. Negative und positive Übergangstests. |
| A03: Lautstärke nicht wiederhergestellt | Tatsächliches `getMedia(..., callback)` von AlexaRemote 8.1.1 wird verwendet; Null-Lautstärke bleibt gültig, Auth-Fehler gehen in Recovery. Vertragstest mit installiertem Paket. |
| A04: Alte Inventarabfrage beschädigt neue Verbindung | Status, Fehler und Single-Flight-Abschluss sind an die jeweilige Remote gebunden. Test mit zwei überlappenden Inventarabfragen. |
| A05: Endgültiger Auth-Fehler bleibt READY | Nach begrenzten Recovery-Versuchen setzt ein weiterer 401/403 die aktuelle Verbindung auf nicht bereit. Andere Fehler und inzwischen ersetzte Remotes setzen keinen fremden Auth-Status zurück. |
| A06: Bearbeitungen während Speichern gehen im Snapshot auf | Editor während Schreibzugriff gesperrt, Snapshot direkt nach erfolgreicher Übernahme und vor Hintergrundabfragen. Spätere Änderungen bleiben dirty; gilt auch für JSON und Import. UI-Tests für Schreibsperre und verzögerte Statusantwort. |
| A07: Mehrere inaktive Entwürfe blockieren Speichern | Doppelte Sprachnamen nur für aktive, Alexa-sichtbare Befehle beanstanden; Schlüssel bleiben eindeutig. Negative/positive UI-Tests. |
| A08: Akzeptierte ältere Schlüssel nicht ausführbar | Exakte Schlüssel und eindeutige normalisierte Aliase werden aufgelöst, ohne Schlüssel/IDs zu migrieren. Formulare behalten unveränderte Altschlüssel. Tests für Ein/Aus und UI-Roundtrip. |
| A09: Langzeittest hasht falsche Inventarfelder | Passiver Observer liest `serial`/`type`; CLI-Test mit zwei Geräten bestätigt unterschiedliche, mit der Konfiguration vergleichbare Hashes. |

## Assistent und Bedienung

Der [Loxone-Auswahlassistent](loxone-picker.md) ist ausschließlich lesend. Geprüfte Profile, Rechte-/Typgrenzen, Antwortgrößenlimit, Timeout, Redirect-Verbot und Secret-freie Metadatenauswahl sind getestet. Echte HTTP-Routingtests laufen mit eingeschalteter Hue-Emulation und prüfen auch Admin-Schutz sowie TTS-Vorschau.

UI-Tests prüfen Duplikate, inaktive Entwürfe, bestehende Schlüssel, Vorschläge, einfache/erweiterte Bedienung, Abbruch der Importvorschau, Ziel-Fallback, explizite Testziele und bleibende Teilergebnisse. Sechs Ansichten werden bei 1366, 768, 390 und 320 Pixeln auf horizontalen Überlauf geprüft; der Auswahldialog zusätzlich bei 1366, 390 und 320 Pixeln. Screenshots liegen im ignorierten Prüfverzeichnis `.tmp/stability`.

## Nachweise und Grenzen

- `npm run check`: bestanden, Node 24.16.0 unter Windows.
- `npm test`: 74 Backend-, Adapter- und echte HTTP-Tests mit synthetischen Daten bestanden.
- `npm run test:ui`: 17 Tests bestanden; Playwright mit Edge unter Windows, Screenshots und Browserfehlerprüfung.
- `python -m unittest discover -s test-python -v`: fünf Tests bestanden.
- [CI für develop](https://github.com/herdan75/loxevo/actions/workflows/ci.yml?query=branch%3Adevelop): prüft Linux-Regressions-/Browser-/Python-/C-Tests, amd64-/ARM64-Build, Healthcheck und geordnetes Herunterfahren. Der Lauf muss zum neuen Release-Commit passen; alte grüne Läufe zählen nicht. Docker, WSL-Linux und C-Compiler sind auf diesem Windows-Prüfplatz nicht verfügbar.
- Keine Anmeldung bei Amazon, keine Live-Aktorbefehle und kein mehrtägiger Hardwaretest durchgeführt. TTS-Abhängigkeit bleibt auf der getesteten Version 8.1.1. Keine echten Cookies oder Zugangsdaten in Testdaten oder Logs.
- `npm audit --omit=dev`: weiterhin fünf transitive Paketmeldungen (proxy-addr kritisch, body-parser/follow-redirects hoch, express/qs mittel). Dies sind vorbestehende Befunde außerhalb der neun funktionalen Korrekturen. Keine Ausnutzbarkeit der konkreten Installation nachgewiesen und kein blindes Dependency-Upgrade vorgenommen. Login-Proxy und LoxEvo nicht ins öffentliche Internet freigeben; gezielte Paketkorrekturen separat mit Proxy-Vertragstests prüfen.

## Prüfung auf dem LoxBerry

1. Privates Backup inklusive `alexa-device-ids.json` sichern. Auf `develop` aktualisieren, Image neu bauen, Version/Commit und Container-Health prüfen. Befehlsbestand zunächst unverändert lassen.
2. Miniserver-Struktur lesen und einen geeigneten Testbaustein als inaktiven Entwurf übernehmen. Erzeugten Ein-/Aus-Befehl prüfen, zunächst Dry-Run verwenden. Bestehende Alexa-IDs nicht löschen.
3. Normale TTS, explizites Einzelziel und bewusst bestätigten Alarmtest prüfen. Lautstärke vorher/nachher vergleichen. Dry-Run betrifft Loxone, nicht TTS.
4. Passiven 48-Stunden-Test aus README ausführen. Bei Fehlern vor Neustart Status, unverändertes Inventar und Diagnosebericht sichern. Das RAM-Protokoll bleibt flüchtig.
5. Erst nach erfolgreicher Praxisprüfung eine spätere Übernahme nach main erwägen. WebSocket-Zustandsfeedback, Matter und eine zusätzliche Ablauf-Engine sind nicht Bestandteil dieses Releases.
