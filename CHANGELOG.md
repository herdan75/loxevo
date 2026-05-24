# Changelog

Alle nennenswerten Aenderungen an LoxEvo werden in dieser Datei gesammelt.

## Unreleased

- GitHub Actions CI fuer Node-Syntaxcheck und Docker-Build ergaenzt.
- README-Badges fuer CI, Docker und Lizenz ergaenzt.
- Backup-Export und -Import fuer LoxEvo-Einstellungen ergaenzt.
- Hinweise zur sauberen Deinstallation und zum Erhalt des Datenordners ergaenzt.
- SSDP-Helper robuster gemacht, wenn LoxBerry-`ssdpd` UDP 1900 bereits belegt.
- Globale Warnleiste fuer TTS- und Alexa-Geraetesuche-Probleme ergaenzt.
- Automatische SSDP-Neustartversuche und LAN-IP-Fallback fuer die Alexa-Geraetesuche ergaenzt.

## 0.1.0

- Lauffaehige Docker/LoxBerry-Basis mit Web-UI.
- Frei definierbare Loxone-Befehle fuer unterschiedliche Funktionen, Raeume und Rubriken.
- Virtuelle Alexa-Geraete ueber lokalen Hue-kompatiblen Bridge-Eingang.
- SSDP-Helper fuer Alexa-Geraetesuche neben dem LoxBerry-`ssdpd`.
- Alexa-TTS ueber `alexa-remote2` mit Geraetesuche, Standard-, Alle- und Alarm-Geraeten.
- Schnelle native TTS-Sequenzen fuer normale Sprachausgabe und Alarm.
- Loxone-Kurzpfade fuer TTS, Alarm und Lautstaerke.
- Wartungsbereich fuer `alexa-remote2`-Versionen und Updates.
