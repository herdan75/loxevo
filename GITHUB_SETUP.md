# GitHub Setup

Empfohlener Repository-Name:

```text
loxevo
```

Beschreibung:

```text
Own LoxBerry gateway for Alexa, Echo TTS and Loxone automation.
```

## Repository anlegen

Im GitHub-Webinterface:

1. Neues Repository erstellen
2. Name: `loxevo`
3. Sichtbarkeit: am Anfang am besten `Private`
4. Kein README, keine Lizenz und kein `.gitignore` automatisch erzeugen, weil diese Dateien lokal bereits existieren

## Lokal initialisieren

Wenn `git` auf dem Rechner installiert ist:

```bash
git init
git add .
git commit -m "Initial LoxEvo prototype"
git branch -M main
git remote add origin https://github.com/<user>/loxevo.git
git push -u origin main
```

## Rechtliche Empfehlung

Dieses Projekt nicht als GitHub-Fork von EchoLox anlegen, solange EchoLox keine klare Open-Source-Lizenz besitzt. Stattdessen ein neues, eigenstaendiges Repository verwenden.

EchoLox und Alexa2Lox koennen in der README als technische Inspiration/Referenz genannt werden, aber Code, Assets und Texte sollten nicht kopiert werden.
