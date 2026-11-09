# Prüfung 1.0.31

Datum: 2026-11-09. Gezielte Korrektur des Loxone-Auswahlassistenten auf `develop`, aufbauend auf [1.0.30](validation-1.0.30.md). Kein Umbau von TTS, Alexa-Bridge oder Loxone-Transport.

## Geprüft

- `npm run check`: erfolgreich.
- `npm test`: 76 Tests erfolgreich, einschließlich realer lokaler HTTP-Routingtests und der bestehenden TTS-/Konfigurationsregressionen.
- `npm run test:ui`: 19 Tests erfolgreich, einschließlich Darstellung auf Desktop, Tablet und Mobilgeräten.
- Synthetische Loxone-Struktur: eigenständiger Dimmer, LightControllerV2 mit Switch-/Dimmer-Lichtkreisen, eigene UUID, `UUID/AI1`, ausdrücklich referenzierte Master-Helligkeit und nicht unterstützte Farbsteuerung.
- Groß-/Kleinschreibung im Eingangszusatz bleibt erhalten. Konfigurationsaufbereitung und Dry-Run-Ein-/Aus-Ausführung behalten den vollständigen Raw-Pfad. Eine Zuordnung zu einem Lichtkreis wird nicht der gesamten Lichtsteuerung zugerechnet.
- Negative Tests: geschützte und eingeschränkte Eltern/Kinder, fremde UUID-Präfixe, unbekannte Eltern, tiefer verschachtelte Controls, fehlende Adressen, zusätzliche Pfadsegmente, Query-/Fragment-/Traversal-Versuche und nicht geprüfte Eingangsbezeichnungen.
- Browserabläufe: mehrere inaktive Entwürfe, Speicherung der Raw-Aus-Pfade, unveränderte bestehende Befehle, gruppierte Auswahl, begründete Sperren, leere Suchergebnisse, Filterwechsel, Stimmungs-ID-Validierung und Dubletten über unterschiedliche Befehlstypen hinweg.

## Bewusste Grenzen

- Kein echter Miniserver und keine Lampen wurden angesteuert. Die Tests belegen Pfadbildung, Datenintegrität und Bedienabläufe, nicht den physischen Zustand einer Lampe.
- Automatische Unterelement-Unterstützung gilt für direkte Switch-/Dimmer-Kinder einer gültigen, ungeschützten LightControllerV2. Andere Kombinationen bleiben manuell. Farbsteuerung, feste Helligkeitswerte und Zentralfunktionen werden nicht ohne passende geprüfte Profile freigegeben.
- Dynamische Zustände wie Verriegelungen oder Lichtstimmungsnamen werden weiterhin nicht per WebSocket eingelesen. Der Miniserver prüft Berechtigungen auch bei der späteren Ausführung.
- Keine neuen Alexa-/TTS-Langzeitnachweise und keine Dependency-Änderungen. Die offenen Punkte aus dem Prüfbericht 1.0.30 bleiben bestehen.
- Die GitHub-CI führt nach dem Push zusätzlich Linux-Regressionen, Host-/SSDP-Helper-Tests und Container-Builds mit Healthcheck für amd64 und arm64 aus. Den Status des jeweiligen Release-Commits prüfen; lokale Tests allein belegen diese Läufe nicht.

## Update und Praxisprüfung

Der vorhandene Datenordner bleibt eingebunden; keine gespeicherten Befehle, Geräte-IDs oder Cookies werden durch den Assistenten geändert. Wie vor jedem Update privat sichern. Nach dem Neubau die Browserseite vollständig neu laden.

Zunächst nur die Struktur abrufen und einen Lichtkreis auswählen. Die Vorschau muss dessen vollständige Adresse samt Ein-/Aus-Pfad zeigen. Als inaktiven Entwurf übernehmen und prüfen; erst anschließend bewusst aktivieren, speichern und einen einzelnen unkritischen Lichtkreis testen. Bereits vorhandene Alexa-Zuordnungen nicht löschen oder neu nummerieren.
