# Rechtliche Notizen

Das ist keine Rechtsberatung, sondern eine praktische technische Einordnung fuer dieses Projekt.

## EchoLox

EchoLox ist als Referenz interessant, weil es bereits Alexa/Hue-Emulation, LoxBerry-Plugin-Struktur, Web-UI und Loxone-Transport verbindet.

In der geprueften Repository-Ansicht war jedoch kein klares `LICENSE`-File sichtbar. GitHub erklaert zur Lizenzierung, dass ohne Lizenz die normalen Urheberrechtsregeln gelten. Das bedeutet: Der Autor behaelt alle Rechte, und andere duerfen den Code nicht ohne Weiteres reproduzieren, verbreiten oder abgeleitete Werke erstellen.

Quelle:
https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository

GitHubs Terms erlauben bei oeffentlichen Repositories zwar das Anzeigen und Forken innerhalb von GitHub-Funktionalitaet. Das ist aber nicht dasselbe wie eine freie Open-Source-Lizenz fuer eigene Distribution, Umbenennung oder abgeleitete Releases.

Quelle:
https://docs.github.com/site-policy/github-terms/github-terms-of-service

## Konsequenz fuer LoxEvo

Der sichere Weg:

- eigener Name
- eigene Dateien
- eigene Web-UI
- keine kopierten Codepassagen
- keine kopierten Assets
- EchoLox nur als fachliche Referenz verwenden
- Alexa2Lox nur als API-/Verhaltensreferenz verwenden

Wenn spaeter doch EchoLox-Code uebernommen werden soll, sollte vorher beim Autor eine Lizenz/Freigabe eingeholt werden.

## Alexa2Lox

Alexa2Lox ist als Referenz fuer TTS sehr nuetzlich, weil es LoxBerry-Praxis, Geraeteauswahl, `device=ALL`, kurze Parameter und `0`-Ignore-Verhalten zeigt.

Auch hier gilt: Verhalten nachbauen ist unkritischer als Code kopieren. LoxEvo uebernimmt deshalb die kompatible API-Idee, aber nicht die PHP-/Shell-Implementierung.
