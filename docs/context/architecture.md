# Zielarchitektur

## Ziel

Die neue ZSO-App wird als flache, servergerenderte Node.js-Anwendung umgesetzt.
Ein zusätzliches Frontend-Framework oder ein separater statischer Build ist
nicht vorgesehen.

## Architekturübersicht

```text
Browser / installierte PWA
          |
          | HTTPS
          v
Node.js + Express + Handlebars
          |
          +-- Inhaltsdateien (Markdown, Bilder, PDFs)
          +-- data/auth.yaml
          +-- data/tiles.yaml
          +-- data/wk.yaml
          +-- data/todos.json
          +-- data/form-topics.yaml
          +-- data/forms/submissions/**/*.json
          +-- data/audit/*.jsonl
```

Im Browser werden nur eingesetzt:

- normales HTML und CSS
- wenig Vanilla JavaScript
- Service Worker für definierte Offline-Lesekacheln
- Cache Storage als Bestandteil des Service Workers

Nicht eingesetzt werden:

- Astro
- React, Vue oder vergleichbare Frameworks
- IndexedDB
- lokale Offline-Datenbank
- Background Sync
- clientseitige Synchronisationslogik

## Anwendungsschichten

```text
src/
  server.js
  routes/
  services/
  storage/
  views/
  public/
content/
data/
```

- `routes/` verarbeitet HTTP-Anfragen.
- `services/` enthält Authentifizierung, Kachelzugriff und Fachlogik.
- `storage/` kapselt sichere JSON/YAML-Dateizugriffe.
- `views/` enthält gemeinsame Handlebars-Layouts und Seiten.
- `content/` enthält fachliche Lesedokumente.
- `data/` enthält Laufzeitdaten ausserhalb des statischen Webroots.

Diese Trennung dient der Testbarkeit, nicht einer Plugin- oder
Mikroservice-Architektur.

## Kachelkonfiguration

Die Kachel ist die kleinste Berechtigungseinheit:

```yaml
tiles:
  - id: lage
    title: Lage
    route: /content/lage
    minimumRole: public
    offline: true

  - id: telematics
    title: Telematik
    route: /content/telematics
    minimumRole: public
    offline: true

  - id: support
    title: Unterstützung
    route: /content/support
    minimumRole: public
    offline: true

  - id: ntp
    title: NTP
    route: /content/ntp
    minimumRole: public
    offline: true

  - id: handcards
    title: Handkarten
    route: /handcards
    minimumRole: public
    offline: true

  - id: wk-info
    title: Infos zum WK
    route: /wk
    minimumRole: zso
    offline: false

  - id: forms
    title: Formulare
    route: /forms
    minimumRole: zso
    offline: false

  - id: todos
    title: ToDos
    route: /todos
    minimumRole: zso
    offline: false

  - id: admin
    title: Administration
    route: /admin
    minimumRole: admin
    offline: false
```

Alle Unterseiten und Dateien einer Kachel erben dieselbe Zugriffsstufe.

## Rollenhierarchie

```text
public = 0
zso = 1
nonCommissionedOfficer = 2
officer = 3
admin = 4
```

Zugriff besteht, wenn der Rollenrang mindestens `minimumRole` entspricht.
Admin hat immer Zugriff und wird in fachlichen Zielauswahlen nicht angezeigt.

## Routenprüfung

Das Ausblenden einer Kachel ist nur Darstellung. Der Server prüft den Zugriff
auch bei direkter URL.

Ein gemeinsames Middleware-Verfahren pro Kachel reicht aus. Fachliche Regeln
innerhalb von Formularen, ToDos und WK-Informationen bleiben klein und fest im
jeweiligen Service codiert.

## Inhaltserzeugung

Markdown-Inhalte werden beim Serverstart oder in einem expliziten
Deployment-Schritt eingelesen. Pro Datei sind nur fachliche Metadaten
erforderlich:

```yaml
title: Antennen
order: 10
updatedAt: 2026-06-15
revision: 3
```

Rolle und Offline-Verfügbarkeit stehen an der übergeordneten Kachel.

Die Anwendung soll beim Start oder in CI fehlschlagen, wenn:

- eine interne Referenz fehlt
- eine Kachel-ID doppelt vorkommt
- eine unbekannte Rolle verwendet wird
- eine als offline markierte Kachel fehlende Ressourcen enthält
- Pflichtmetadaten fehlen

## Dateibasierte Speicherung

JSON/YAML ist für eine einzelne ZSO und genau einen schreibenden Serverprozess
ausreichend.

Pflichtregeln:

- Schreiboperationen innerhalb des Prozesses serialisieren.
- Neue Datei zuerst temporär schreiben.
- Datei synchronisieren und atomar umbenennen.
- JSON/YAML vor und nach dem Schreiben validieren.
- Regelmässige Backups erstellen.
- Laufzeitdaten nicht über Express Static ausliefern.

## Browserunterstützung

Desktop und Laptop:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari auf macOS

Mobil:

- Safari auf iPhone
- Samsung Internet
- Google Chrome

Automatisierte Browsertests verwenden Chromium, Firefox und WebKit. Reale
Gerätetests erfolgen mindestens auf iPhone und einem Samsung-Gerät.

## Bereitstellung

Die Node.js-Anwendung wird hinter dem Synology-Reverse-Proxy betrieben:

```text
https://zso.example.ch/
```

HTTPS ist zwingend für Service Worker, sichere Cookies und Login-Daten.

## Nicht-Ziele

- Mandantenfähigkeit oder mehrere ZSO
- separater Frontend-Build
- Single-Page-Anwendung
- Mikroservices oder Plugin-System
- Berechtigungen pro Inhaltsdatei oder Formularfeld
- Offline-Bearbeitung und Synchronisation
- mehrere gleichzeitig schreibende Serverinstanzen

