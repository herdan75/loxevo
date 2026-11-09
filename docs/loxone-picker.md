# Loxone-Auswahlassistent

Ab 1.0.30, erweitert in 1.0.31: **Konfiguration → Befehle und Sprachnamen → Aus Loxone hinzufügen**.

1. Miniserver-Adresse und Zugangsdaten zuerst speichern. Der Assistent liest ausschließlich `/data/LoxAPP3.json` dieses Servers, auch im Dry-Run. Benutzerrechte gelten weiterhin; HTTPS bevorzugen, HTTP nur im vertrauenswürdigen lokalen Netz.
2. Nach Raum, Name oder Typ suchen und einen Baustein auswählen. Die Liste gruppiert Lichtkreise unter ihrer Lichtsteuerung und zeigt bereits zugeordnete sowie nicht unterstützte Bausteine. Auch der Name des übergeordneten Bausteins ist durchsuchbar. Unter der Liste steht die vollständige Auswahl. Bei mehr als 150 Treffern die Suche eingrenzen.
3. Aktion und Namen wählen. Bei einer Lichtstimmung die vorhandene numerische Stimmungs-ID eintragen. Die statische Struktur enthält nicht zwingend dynamische Stimmungsnamen.
4. Unter „Technische Vorschau“ Ein- und gegebenenfalls Aus-Aufruf prüfen. Eine bereits vorhandene Kombination aus UUID, Typ und Wert wird nicht nochmals übernommen; weitere Aktionen desselben Bausteins bleiben möglich.
5. „Als Entwurf hinzufügen“ erstellt einen geöffneten, inaktiven Eintrag ganz oben. Angaben prüfen, bewusst aktivieren und speichern. Das Lesen und Anlegen sendet keinen Schaltbefehl und veröffentlicht kein neues Alexa-Gerät.

| Bausteintyp | Profil | Technische Abbildung |
| --- | --- | --- |
| Switch | Ein / Aus | `direct`, `on` / `off` |
| Dimmer | Ein / Aus (letzte Helligkeit) | `direct`, `on` / `off`; keine pauschale 100-Prozent-Vorgabe |
| Pushbutton | Impuls | `pulse`, Alexa-Aktion |
| LightControllerV2 | Lichtstimmung | `changeTo/<ID>`, Aus `changeTo/0` |
| Jalousie | Öffnen / Schließen oder umgekehrt | `direct`, `FullUp` / `FullDown` |
| Jalousie | Stopp | `direct`, `stop`, Alexa-Aktion |

Direkte Unterelemente einer **LightControllerV2** vom Typ **Switch** oder **Dimmer** werden ebenfalls unterstützt. Eine eigenständige gültige `uuidAction` nutzt `direct`; eine vollständige Adresse `UUID/AI<n>` wird als `raw` mit getrenntem Ein-/Aus-Pfad übernommen, zum Beispiel `/jdev/sps/io/UUID/AI1/on` und `/jdev/sps/io/UUID/AI1/off`. Die UUID muss zur übergeordneten Lichtsteuerung passen; der Eingangszusatz wird nicht kleingeschrieben oder abgeschnitten. Die ausdrücklich in `details.masterValue` referenzierte Master-Helligkeit ist bei passender Adresse ebenfalls möglich. Es werden keine Adressen aus Namen oder Zustand-UUIDs geraten.

Ein-/Aus-Schalten eines Dimmers stellt beim Einschalten die letzte Helligkeit wieder her. Feste Helligkeitswerte und Farbbefehle sind kein zusätzliches Profil dieses Assistenten. Insbesondere ColorPickerV2 hat eine eigene Befehlssemantik und wird nicht wie ein einfacher Schalter behandelt.

Die Zuordnung eines Rollladens zu Alexa-Ein/Aus bleibt eine Schalterabbildung, kein nativer Alexa-Rollladen. Alte manuelle Werte, einschließlich vorhandener Lichtstimmungs- und Ausschaltwerte, werden nicht geändert.

Gesicherte oder eingeschränkte Controls und deren Unterelemente, unbekannte Typen, andere Unterelemente und nicht geprüfte zusammengesetzte Steuerungskennungen werden nicht automatisch freigegeben. Nicht unterstützte Einträge bleiben zur Orientierung sichtbar; das Aktionsfeld zeigt „Nicht unterstützt“, ein konkreter Grund steht darunter, und die Übernahme ist deaktiviert. Besonders Farb-/Zentralsteuerungen, Lüftung, Schlösser, Tore und Alarmfunktionen benötigen eine passende, bewusst geprüfte manuelle Konfiguration. Der Assistent hebt keine Rechte auf. Eine UUID garantiert keinen Zugriff auf beliebige interne Bausteineingänge; für eigene Abläufe einen gezielt freigegebenen virtuellen Eingang in Loxone verwenden.

„Bereits zugeordnet“ bezieht sich auf dieselbe Steuerungsadresse, nicht auf andere Lichtkreise derselben Lichtsteuerung. Weitere Aktionen bleiben möglich; ein identischer Ein-Aufruf wird auch dann erkannt, wenn ein bestehender Befehl ihn als Raw-Pfad statt als UUID und Wert speichert. Ungespeicherte Entwürfe werden bei dieser Dublettenprüfung berücksichtigt. Ein Filterwechsel setzt die Auswahl samt Eingabewerten zurück; es kann kein unsichtbar gewordenes Ziel übernommen werden.

Der Abruf ist auf zehn Sekunden, 5 MB, 3000 Controls und begrenzte Verschachtelung beschränkt. Redirects werden nicht verfolgt. An die UI gehen nur ausgewählte Namen, Typen, Räume, Kategorien, Steuerungskennungen und Profile, nicht die vollständige Struktur mit möglichen vertraulichen Details. Bei aktiviertem LoxEvo-Admin-Schutz ist der Abruf geschützt.

## Manuelle Bedienung und Identität

„Neuen Befehl hinzufügen“ und alle bisherigen Typen bleiben verfügbar. „Erweiterte Felder“ blendet Schlüssel, interne Zuordnung, Aus-Befehlsreferenz und Spezialpfad bei Bedarf ein. Bei `raw` öffnet sich die erweiterte Ansicht automatisch. Der Darstellungsmodus wird nicht in die Konfiguration geschrieben.

Duplizieren erstellt eine neue, inaktive Identität und behält Zusatzfelder der Vorlage. Ziel-UUID und Aus-Zuordnung bewusst prüfen. Vorhandene Anzeige-/Sprachnamen lassen sich ohne Schlüsselwechsel bearbeiten. Bei entfernten/geänderten Schlüsseln warnt das Speichern vor geänderten Alexa-Zuordnungen. Es erfolgt keine automatische Migration bereits in Alexa gespeicherter Routinen.

Backup-Import ist weiterhin ein vollständiger Ersatz, keine Zusammenführung. Die Vorschau nennt neue, überschreibbare und entfernte Befehle; Cookie-Werte werden nicht angezeigt. Serverseitige Validierung und ID-Konfliktprüfung bleiben maßgebend.

## TTS-Tests

Das Testziel verändert keine gespeicherten Listen. Ohne explizites Ziel gilt Standard → Alle/Fallback → Alarm; bei Alarm gilt Alarm → Alle/Fallback → Standard. Die Vorschau verwendet die aktuellen Formularlisten und das vorhandene Echo-Inventar. Bei nativer Ausgabe zeigt sie deduplizierte Gruppenmitglieder; fehlt ein Inventareintrag, wird die Auflösung als unbestätigt markiert. Ein Alarmtest zeigt vor dem Senden Ziel und Lautstärke. Ergebnisse bleiben bis zum nächsten Test/Seitenneuladen sichtbar. „Bestätigt“ bedeutet API-Rückmeldung, nicht nachgewiesene hörbare Ausgabe.

## Grundlage und Grenzen

Profile geprüft gegen [Loxone Structure File V17, 31.03.2026](https://www.loxone.com/enen/wp-content/uploads/sites/3/2026/04/1700_Structure-File.pdf), insbesondere Controls/Restrictions, Dimmer, Jalousie, LightControllerV2/Subcontrols, Pushbutton und Switch. ColorPickerV2 ist dort gesondert beschrieben; daraus wird kein generisches Ein/Aus-Profil abgeleitet. Weitere Grundlagen: [Loxone API](https://www.loxone.com/enen/kb/api/) und [Webservices](https://www.loxone.com/enen/kb/web-services/).

Keine neue WebSocket-Zustandsverbindung, keine Matter-Migration und keine zusätzliche Mehrlampen-Ablaufsteuerung. Ein angenommener HTTP-Aufruf ist kein physischer Zustandsnachweis. Diese Erweiterungen brauchen getrennte Anforderungen und Hardwaretests.
