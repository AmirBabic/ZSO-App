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

## Durchgeführte Historienbereinigung

Am 15. Juni 2026 wurde der Pfad `node-app/RuHuro/` aus allen erreichbaren
Commits entfernt. Dazu wurde die Historie neu geschrieben und anschließend:

1. wurden ursprüngliche Sicherungsreferenzen entfernt,
2. wurden Reflogs abgelaufen gelassen,
3. wurden nicht mehr erreichbare Git-Objekte bereinigt,
4. wurde erneut nach dem entfernten Pfad und privaten Schlüsselmarkern gesucht,
5. wurde `main` mit `--force-with-lease` auf GitHub veröffentlicht.

Die Prüfungen fanden weder den entfernten Pfad noch private Schlüsselmarker in
der erreichbaren Historie. Die Commit-IDs vor der Bereinigung sind dadurch
ungültig. Weitere lokale Klone müssen auf die neu geschriebene Historie
umgestellt oder neu geklont werden.

Eine Rotation der früher eingecheckten Schlüssel wurde gemäß Projektentscheid
nicht durchgeführt. Unabhängig davon dürfen Schlüssel nicht erneut in das
Repository kopiert werden.

## Repository-Bereinigung

Beim Neuaufbau nicht mehr tracken:

- `node_modules/`
- Laufzeitlogs wie `nohup.out`
- Editor-Swap-Dateien
- datierte Kopien von Quelldateien
- Backup-Ordner im Anwendungscode
- ACME-Challenge-Dateien
- lokal kopierte Zertifikatsordner

## Empfohlene Schutzmaßnahmen

- Secret-Scanning in CI aktivieren.
- Dependency- und Vulnerability-Scanning aktivieren.
- Produktionsdaten außerhalb des statischen Webroots speichern.
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
10. Rolle und Offline-Status ausschließlich an der Kachel konfigurieren.
11. Redirect-Liste für bestehende URLs erzeugen.
12. CI bei defekten Links oder fehlenden Assets fehlschlagen lassen.

## Abnahme

Vor der Ablösung der Altanwendung wird getestet:

- Startseite und Fachbereiche
- jede aktive Inhaltsseite
- Bilder und Bildvergrößerung
- PDFs und interne Links
- Offline-Erstinstallation und Offline-Neustart
- Updates und unvollständige Updates
- kachelbasierter Rollenzugriff
- Formular-Lesestufen inklusive implizitem Admin-Zugriff
- hierarchische ToDo-Regeln
- WK-Zugriff nur für eingetragene Principals
- Zielbrowser und reale Mobilgeräte
