# Migration und Repository-Sicherheit

## Aktueller Sicherheitsbefund

Im ursprünglichen Repository waren 17 Dateien unter `node-app/RuHuro/`
eingecheckt:

- Zertifikate
- Zertifikatsketten
- Fullchain-Dateien
- vier private Schlüssel
- eine Erneuerungskonfiguration

Diese Dateien wurden aus dem aktuellen Arbeitsstand entfernt. `.gitignore`
enthält Regeln für:

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

Das Löschen in einem neuen Commit entfernt Secrets nicht aus alten Commits.
Erforderlich sind:

1. Betroffene Zertifikate und Schlüssel widerrufen oder ersetzen.
2. Neue Schlüssel erzeugen.
3. Alte Schlüssel nicht erneut in das Repository kopieren.
4. Git-Historie mit `git filter-repo` oder BFG bereinigen.
5. Bereinigte Branches und Tags force-pushen.
6. Lokale Klone auf die bereinigte Historie umstellen.
7. Erneut nach privaten Schlüsselmarkern suchen.

Ein History-Rewrite verändert Commit-IDs und muss koordiniert werden.

## Repository-Bereinigung

Beim Neuaufbau nicht mehr tracken:

- `node_modules/`
- Laufzeitlogs wie `nohup.out`
- Editor-Swap-Dateien
- datierte Kopien von Quelldateien
- Backup-Ordner im Anwendungscode
- ACME-Challenge-Dateien
- lokal kopierte Zertifikatsordner

## Empfohlene Schutzmassnahmen

- Secret-Scanning in CI aktivieren.
- Dependency- und Vulnerability-Scanning aktivieren.
- Produktionsdaten ausserhalb des statischen Webroots speichern.
- Dateirechte auf den Dienstbenutzer beschränken.
- Backups verschlüsseln und Wiederherstellung testen.
- Audit-Dateien append-only behandeln.

## Inhaltsmigration

Der bestehende Content wird automatisiert eingelesen und validiert:

1. Dateien inventarisieren.
2. Die aktiven Kacheln Lage, Telematik, Unterstützung und NTP abgrenzen.
3. Unicode-Dateinamen normalisieren.
4. Stabile, URL-taugliche Slugs vergeben.
5. Rohes HTML prüfen und soweit möglich vereinheitlichen.
6. Relative Links und Medienreferenzen validieren.
7. Alte absolute Synology-Links in interne Links umwandeln.
8. Backup- und Template-Inhalte von produktiven Inhalten trennen.
9. Fachliches Frontmatter mit Titel, Reihenfolge und Revision ergänzen.
10. Rolle und Offline-Status ausschliesslich an der Kachel konfigurieren.
11. Redirect-Liste für bestehende URLs erzeugen.
12. CI bei defekten Links oder fehlenden Assets fehlschlagen lassen.

## Abnahme

Vor der Ablösung der Altanwendung wird getestet:

- Startseite und Fachbereiche
- jede aktive Inhaltsseite
- Bilder und Bildvergrösserung
- PDFs und interne Links
- Offline-Erstinstallation und Offline-Neustart
- Updates und unvollständige Updates
- Kachelbasierter Rollenzugriff
- Formular-Lesestufen inklusive implizitem Admin-Zugriff
- hierarchische ToDo-Regeln
- WK-Zugriff nur für eingetragene Principals
- Zielbrowser und reale Mobilgeräte

