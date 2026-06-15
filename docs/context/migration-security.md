# Migration und Repository-Sicherheit

## Aktueller Sicherheitsbefund

Im urspruenglichen Repository waren 17 Dateien unter `node-app/RuHuro/`
eingecheckt:

- Zertifikate
- Zertifikatsketten
- Fullchain-Dateien
- vier private Schluessel
- eine Erneuerungskonfiguration

Diese Dateien wurden aus dem aktuellen Arbeitsstand entfernt. `.gitignore`
enthaelt Regeln fuer:

```gitignore
/node-app/RuHuro/
*.pem
*.key
*.p12
*.pfx
*.crt
*.cer
```

## Noch erforderliche Massnahmen

Das Loeschen in einem neuen Commit entfernt Secrets nicht aus alten Commits.
Erforderlich sind:

1. Betroffene Zertifikate und Schluessel beim Aussteller beziehungsweise auf der
   Synology widerrufen oder ersetzen.
2. Neue Schluessel erzeugen.
3. Alte Schluessel nicht erneut in das Repository kopieren.
4. Git-Historie mit `git filter-repo` oder BFG bereinigen.
5. Bereinigte Branches und Tags force-pushen.
6. Lokale Klone neu erstellen oder sorgfaeltig auf die bereinigte Historie
   umstellen.
7. Nach dem Rewrite erneut nach privaten Schluesselmarkern suchen.

Ein History-Rewrite veraendert Commit-IDs und muss mit allen Beteiligten
koordiniert werden.

## Repository-Bereinigung

Neben den Secrets sollten beim Neuaufbau entfernt beziehungsweise nicht mehr
getrackt werden:

- `node_modules/`
- Laufzeitlogs wie `nohup.out`
- Editor-Swap-Dateien
- datierte Kopien von Quelldateien
- Backup-Ordner im eigentlichen Anwendungscode
- ACME-Challenge-Dateien
- lokal kopierte Zertifikatsordner

Historisch relevante Inhalte koennen vor der Entfernung als Git-Tag oder in
einem separat geschuetzten Archiv dokumentiert werden. Backups gehoeren nicht
als parallele Kopien in die aktive Quellstruktur.

## Empfohlene Schutzmassnahmen

- Secret-Scanning in CI aktivieren.
- Dependency- und Vulnerability-Scanning aktivieren.
- Pull Requests fuer Aenderungen an Authentifizierung und Berechtigungen
  verlangen.
- Produktionsdaten und `data/auth.yaml` ausserhalb des statischen Webroots
  speichern.
- Dateirechte fuer Serverdaten auf den Dienstbenutzer beschraenken.
- Backups verschluesseln und Wiederherstellung regelmaessig testen.
- Audit-Dateien append-only behandeln und gegen unbemerkte Manipulation
  absichern.

## Inhaltsmigration

Der bestehende Content soll automatisiert eingelesen und validiert werden:

1. Dateien inventarisieren.
2. Unicode-Dateinamen normalisieren.
3. Stabile, URL-taugliche Slugs und Inhalts-IDs vergeben.
4. Rohes HTML in Markdown pruefen und soweit moeglich vereinheitlichen.
5. Relative Links und Medienreferenzen validieren.
6. Alte absolute Synology-Links in interne Links umwandeln.
7. Backup- und Template-Inhalte von produktiven Inhalten trennen.
8. Frontmatter mit Rolle, Bereich, Reihenfolge und Revision ergaenzen.
9. Redirect-Liste fuer bestehende URLs erzeugen.
10. Build bei defekten Links oder fehlenden Assets fehlschlagen lassen.

## Abnahme

Vor der Ablösung der Altanwendung wird fuer jede bestehende Funktion ein
Vergleichstest benoetigt:

- Startseite und Fachbereiche
- jede Inhaltsseite
- Bilder und Bildvergroesserung
- PDFs
- interne Links
- Offline-Erstinstallation
- Offline-Neustart
- Update von Inhalten
- Verhalten bei unvollstaendigem Update
- Rollenbasierter Zugriff

