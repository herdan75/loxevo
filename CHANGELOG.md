# Changelog

Alle nennenswerten Änderungen an LoxEvo werden in dieser Datei gesammelt.

## Unreleased

## 1.0.15 - 2026-05-31

- Loxone UUIDs werden jetzt in der Web-UI live und serverseitig beim Speichern validiert.
- Ungültige UUIDs werden direkt am Feld markiert und als `UUID ungültig` in den Befehls-Badges angezeigt.
- README um das erwartete Loxone-UUID-Format ergänzt.

## 1.0.14 - 2026-05-31

- Konfigurationsansicht weiter verdichtet: offene Befehlskarten nutzen geringere Abstände und bleiben dadurch auf kleinen Bildschirmen besser bedienbar.
- Neue Befehle erscheinen direkt unterhalb der Befehlsleiste, werden nach dem Anlegen automatisch geöffnet und nach dem Speichern wieder in die passende Rubrik einsortiert.
- Praxisbeispiele für Licht, Lüftung, Rollladen und einzelne Ausführungsbefehle mit Bildmustern in der README gebündelt.

## 1.0.10 - 2026-05-30

- Alexa-Bridge-Debug-Schalter in das Register `Protokoll` verschoben und mit einem Info-Button erklärt, damit die Diagnose direkt dort steuerbar ist, wo die Einträge erscheinen.

## 1.0.9 - 2026-05-30

- Alexa-Bridge-HTTP-Diagnose ist jetzt optional: Detailabfragen werden nur noch protokolliert, wenn im Register `Protokoll` das Debug-Protokoll aktiviert ist.

## 1.0.8 - 2026-05-30

- Web-UI um eine Aktion zum Erzeugen einer neuen Alexa-Bridge-ID erweitert, damit Alexa alte gelöschte Hue-/LoxEvo-Geräte nicht wieder aus der bisherigen Bridge-Historie hochzieht.
- Hinweise zur Alexa-Gerätesuche präzisiert: Nur aktive Befehle mit `Als Alexa-Gerät anbieten` werden als virtuelle Alexa-Geräte angeboten.

## 1.0.7 - 2026-05-30

- Alexa-Gerätenamen priorisieren jetzt den gepflegten Sprachnamen und Anzeigenamen, damit automatisch zusammengesetzte Doppelungen wie `Reinigung Bad Bad` vermieden werden.
- Infotext zu `Befehl verwenden` präzisiert: deaktivierte Befehle werden nicht ausgeführt und erscheinen auch dann nicht in der Alexa-Gerätesuche, wenn `Als Alexa-Gerät anbieten` gesetzt ist.
- README-Status auf den getesteten Stand aktualisiert und die Beschreibung für virtuelle Alexa-Geräte an `Als Alexa-Gerät anbieten` angepasst.

## 1.0.5 - 2026-05-29

- MIT-Lizenz durch eine eingeschränkte Source-Available-Lizenz ersetzt, damit der Code sichtbar bleibt, aber nicht automatisch frei genutzt oder weiterverbreitet werden darf.
- Konfigurationsbefehle um Suche, Rubrikfilter, Prüfung unvollständiger Befehle und kompakte Zusatzinfos in eingeklappten Zeilen ergänzt.
- Ungespeicherte Konfigurationsänderungen werden deutlicher mit Speichern- und Verwerfen-Aktion angezeigt.
- Register `Aufrufe & Geräte` klarer als Test-/Kopieransicht gegliedert; TTS-Vorlagen zeigen den HTTP-Body explizit als Beispiel.

## 1.0.4 - 2026-05-29

- Leere Befehlsrubriken verschwinden direkt nach dem Entfernen des letzten Befehls aus der Konfigurationsansicht.
- Register `Befehle & Geräte` in `Aufrufe & Geräte` umbenannt und TTS-Beispiele klar als Muster/Testaufrufe beschrieben.

## 1.0.3 - 2026-05-28

- Doppelten Alexa-Gerätesuche-Hinweis unterhalb des Live-/Testmodus entfernt; der SSDP-Hinweis bleibt im Modusbereich sichtbar.
- Zielnavigation aus der Statuskontrolle klarer hervorgehoben und Zielbereiche mittiger ins Bild gescrollt.
- Statuskontrolle verlinkt die Wartungsbereiche für Admin-Schutz, Backup und Systemprüfung genauer und scrollt den Zielbereich sichtbar mit Abstand ein.
- Wartung/Systemprüfung zeigt nur noch technische Zusatzprüfungen, damit eigene Statuszeilen wie Backup, Loxone, Alexa TTS oder Gerätesuche nicht nochmals als widersprüchliche Fehler erscheinen.

## 1.0.2 - 2026-05-28

- Register `Übersicht` in `Statuskontrolle` umbenannt und Register-Reihenfolge angepasst.
- Register für angelegte Befehle, virtuelle Geräte und fertige URLs in `Befehle & Geräte` umbenannt.
- Einrichtungsdetails im Register `Testen` als aufklappbaren Detailbereich dargestellt.
- Sichtbare Admin-Schutz-Texte von Admin-Token auf Admin-Passwort umgestellt; technische Header bleiben unverändert.
- Backup-Status dauerhaft im Datenordner gespeichert und mit Hash-Vergleich backup-relevanter Konfigurationsbereiche ergänzt.
- Statuskontrolle zeigt betroffene Backup-Bereiche an und ignoriert reine Betriebszustände wie Dry-Run/Live-Modus.
- Systemprüfung ruhiger dargestellt: Bereiche mit Fehlern oder Hinweisen öffnen automatisch, reine OK-/Info-Bereiche bleiben geschlossen.
- Protokollansicht fasst direkt wiederholte gleichartige Meldungen kompakt zusammen.
- Wartungsbereich und Backup-/Admin-Karten optisch vereinheitlicht.
- Statuskontrolle hebt optionale offene Punkte wie deaktivierten Admin-Schutz, fehlendes Backup oder deaktivierte Alexa-Funktionen sichtbar hervor.
- Statuskontrolle priorisiert offene Punkte, macht Statuszeilen klickbar und führt direkt in den passenden Konfigurations- oder Wartungsbereich.
- Optionale Statuspunkte werden neutral grau dargestellt und nicht mehr wie Warnungen hervorgehoben.
- Statuskontrolle vermeidet doppelte Hinweise: Backup, Loxone, Alexa TTS und Gerätesuche werden je in ihrer eigenen Statuszeile bewertet; die Systemprüfung zeigt nur zusätzliche technische Detailprobleme.
- Alexa-Gerätesuche-Hinweis in den Live-/Testmodus-Bereich integriert, damit kein zusätzlicher Hinweisblock Platz belegt.
- Wartungsbereich zeigt bei gleicher installierter und gewählter Paketversion `Up to date`; ältere Auswahl wird als Downgrade, neuere als Update beschriftet.
- Konfiguration zeigt ungespeicherte Änderungen sichtbar an und bestätigt Speichern mit einer kurzen Zusammenfassung.
- Statuszeilen heben den angesprungenen Zielbereich kurz hervor.
- `Befehle & Geräte` trennt Loxone-Befehle, TTS-Aufrufe und virtuelle Alexa-Geräte klarer.
- Wartung hebt nach Paketinstallation den empfohlenen Neustart deutlicher hervor.
- TTS-Geräteauswahl zeigt standardmässig Echo-Geräte und blendet weitere Alexa-Gerätetypen optional ein.
- Konfigurationsspeichern zeigt vor dem Schreiben eine kurze Zusammenfassung der wichtigsten Einstellungen.
- Alexa-Gerätesuche-Start/Stopp wird bei aktivem Admin-Schutz ebenfalls geschützt.
- Web-UI-Start entlastet: Versionsprüfung für `alexa-remote2` läuft erst im Register `Wartung`; Formularänderungen werden beim Tippen gebündelt aktualisiert.
- README um einen kurzen Schnellstart ergänzt.
- README und INSTALL auf Backup-Status, Systemprüfung und Protokollverdichtung nachgezogen.

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
