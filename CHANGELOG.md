# Changelog

Alle nennenswerten Änderungen an LoxEvo werden in dieser Datei gesammelt.

## Unreleased

- Register `Übersicht` in `Statuskontrolle` umbenannt und Register-Reihenfolge angepasst.
- Register `Externe Aufrufe` in `Aufrufübersicht` umbenannt.
- Einrichtungsdetails im Register `Testen` als aufklappbaren Detailbereich dargestellt.
- Sichtbare Admin-Schutz-Texte von Admin-Token auf Admin-Passwort umgestellt; technische Header bleiben unverändert.

## 1.0.1 - 2026-05-28

- Startregister `Übersicht` mit kompakter Statuskontrolle für Loxone, Alexa TTS, virtuelle Alexa-Geräte, Gerätesuche, Backup, Admin-Schutz und Systemprüfung ergänzt.
- Statuskontrolle optisch verdichtet und mit Info-Buttons pro Statuszeile ergänzt.
- Protokoll um Filter, Suche und Leeren-Funktion ergänzt.
- Diagnoseexport im Register `Wartung` ergänzt; sensible Werte werden dabei zusammengefasst oder maskiert.
- Konfigurationsspeichern prüft wichtige Eingaben wie Loxone-URL, Zugangsdaten, Alexa/Hue-Port und TTS-Cookie-Pfad vor dem Schreiben.
- Backup-Hinweis nach Konfigurationsänderungen ergänzt.
- Überspringbaren Einrichtungsassistenten ergänzt, inklusive optionaler Alexa-Gerätesuche mit SSDP/UDP-1900-Hinweis.
- Protokoll-Leeren unter Admin-Schutz gestellt und Dry-Run-Speichern ohne Loxone-Zugangsdaten erlaubt.
- Deutsche Texte auf Schweizer Schreibweise ohne scharfes s vereinheitlicht.
- Einrichtungsassistent dauerhaft über die Statuskontrolle erreichbar gemacht.
- Admin-Token-Abfrage durch ein verdecktes Web-UI-Passwortfenster ersetzt; bei falschem Token bleibt die Eingabe offen.

## 1.0.0 - 2026-05-27

- Erste versionierte, lauffähige LoxEvo-Version.
- GitHub Actions CI für Node-Syntaxcheck und Docker-Build ergänzt.
- README-Badges für CI, Docker und Lizenz ergänzt.
- Backup-Export und -Import für LoxEvo-Einstellungen ergänzt.
- Hinweise zur sauberen Deinstallation und zum Erhalt des Datenordners ergänzt.
- Optionalen Host-Helper für die Alexa-Gerätesuche per Web-UI-Button ergänzt.
- Lokale Systemprüfung im Register `Wartung` ergänzt.
- Globale Hinweisleiste für TTS- und Alexa-Gerätesuche-Probleme ergänzt.
- LAN-IP-Fallback und Port-80-Hinweise für die Alexa-Gerätesuche ergänzt.
- Doku und UI-Hinweise für den aktuellen Discovery-/TTS-Stand nachgezogen.

## 0.1.0

- Lauffähige Docker/LoxBerry-Basis mit Web-UI.
- Frei definierbare Loxone-Befehle für unterschiedliche Funktionen, Räume und Rubriken.
- Virtuelle Alexa-Geräte über lokalen Hue-kompatiblen Bridge-Eingang.
- Lokaler SSDP-Helper für die Alexa-Gerätesuche.
- Alexa-TTS über `alexa-remote2` mit Gerätesuche, Standard-, Alle- und Alarm-Geräten.
- Schnelle native TTS-Sequenzen für normale Sprachausgabe und Alarm.
- Loxone-Kurzpfade für TTS, Alarm und Lautstärke.
- Wartungsbereich für `alexa-remote2`-Versionen und Updates.
