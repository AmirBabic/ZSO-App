# Zielarchitektur

## Ziel

Die neue ZSO-App soll bewusst als flache, servergerenderte Node.js-Anwendung
umgesetzt werden. Ein zusaetzliches Frontend-Framework oder ein separater
statischer Build wuerde fuer die Anforderungen keinen ausreichenden Nutzen
bringen.

## Architekturuebersicht

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
          +-- data/todos.json
          +-- data/forms/definitions/*.yaml
          +-- data/forms/submissions/**/*.json
          +-- data/audit/*.jsonl
```

Im Browser werden nur eingesetzt:

- normales HTML und CSS
- wenig Vanilla JavaScript
- Service Worker fuer definierte Offline-Lesekacheln
- Cache Storage als browserinterner Bestandteil des Service Workers

Nicht eingesetzt werden:

- Astro
- React, Vue oder vergleichbare Frameworks
- IndexedDB
- lokale Offline-Datenbank
- Background Sync
- clientseitige Synchronisationslogik

## Anwendungsschichten

Die Anwendung bleibt intern in wenige klar getrennte Bereiche gegliedert:

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
- `services/` enthaelt Authentifizierung, Kachelzugriff und Formularlogik.
- `storage/` kapselt sichere JSON/YAML-Dateizugriffe.
- `views/` enthaelt gemeinsame Handlebars-Layouts und Seiten.
- `content/` enthaelt fachliche Lesedokumente.
- `data/` enthaelt Laufzeitdaten und liegt ausserhalb des statischen Webroots.

Diese Trennung soll Testbarkeit schaffen, aber keine Plugin- oder
Mikroservice-Architektur bilden.

## Kachelkonfiguration

Die Kachel ist die kleinste Berechtigungseinheit:

```yaml
tiles:
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

  - id: admin
    title: Administration
    route: /admin
    minimumRole: admin
    offline: false
```

Alle Unterseiten und Dateien einer Kachel erben dieselbe Zugriffsstufe. Es gibt
keine Berechtigung pro Datei und keine Sammlung granularer Permission-Strings.

Die Rollen besitzen eine feste Rangfolge:

```text
public = 0
zso = 1
nonCommissionedOfficer = 2
officer = 3
admin = 4
```

Zugriff besteht, wenn der Rollenrang mindestens `minimumRole` entspricht.

## Routenpruefung

Das Ausblenden einer Kachel ist nur Darstellung. Der Server muss den Zugriff
auch bei direkter URL pruefen.

Beispiel:

```text
GET /forms
  -> Verbindung vorhanden?
  -> Sitzung vorhanden?
  -> Rolle >= minimumRole der Kachel?
  -> Verlauf rendern oder 401/403 liefern
```

Ein gemeinsames Middleware-Verfahren pro Kachel reicht aus. Unterrouten wie
`/forms/:id` verwenden dieselbe Kachelregel.

## Inhaltserzeugung

Markdown-Inhalte werden beim Serverstart oder in einem expliziten
Deployment-Schritt eingelesen. Die Navigation wird aus der Kachel- und
Ordnerstruktur erzeugt.

Pro Datei sind nur fachliche Metadaten erforderlich, zum Beispiel:

```yaml
title: Antennen
order: 10
updatedAt: 2026-06-15
revision: 3
```

Die Rolle und Offline-Verfuegbarkeit stehen ausschliesslich an der
uebergeordneten Kachel.

Die Anwendung soll beim Start oder in CI fehlschlagen, wenn:

- eine interne Referenz fehlt
- eine Kachel-ID doppelt vorkommt
- eine unbekannte Rolle verwendet wird
- eine als offline markierte Kachel fehlende Ressourcen enthaelt
- Pflichtmetadaten fehlen

## Dateibasierte Speicherung

JSON/YAML ist fuer den erwarteten Umfang ausreichend, solange genau ein
Serverprozess schreibt.

Pflichtregeln:

- Schreiboperationen innerhalb des Prozesses serialisieren.
- Neue Datei zuerst temporaer schreiben.
- Datei synchronisieren und atomar umbenennen.
- JSON/YAML vor und nach dem Schreiben validieren.
- Regelmaessige Backups erstellen.
- Laufzeitdaten nicht ueber Express Static ausliefern.

## Bereitstellung

Die Node.js-Anwendung wird hinter dem vorhandenen Synology-Reverse-Proxy
betrieben. Eine Origin reicht aus:

```text
https://zso.example.ch/
```

HTTPS ist zwingend fuer Service Worker, sichere Cookies und Login-Daten.

## Nicht-Ziele

- separater Frontend-Build mit Astro
- Single-Page-Anwendung
- Mikroservices
- Plugin-System
- Berechtigungen pro Datei, Feld oder Einzelaktion
- Offline-Bearbeitung und spaetere Synchronisation
- mehrere gleichzeitig schreibende Serverinstanzen
- frei konfigurierbarer Formulardesigner im Browser

