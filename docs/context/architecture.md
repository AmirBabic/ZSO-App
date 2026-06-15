# Zielarchitektur

## Ziel

Die neue ZSO-App soll auf mobilen Geraeten schnell, installierbar und auch bei
laengerem Netzausfall verwendbar sein. Der produktive Betrieb soll moeglichst
wenig Infrastruktur benoetigen.

## Architekturuebersicht

```text
                   Online
Geraet/PWA <--------------------> kleine Node.js-API
   |                                  |
   |                                  +-- data/auth.yaml
   |                                  +-- data/todos.json
   |                                  +-- data/form-submissions/*.json
   |                                  +-- data/audit/*.jsonl
   |
   +-- Cache Storage: App, HTML, Bilder, PDFs
   +-- IndexedDB: ToDos, Entwuerfe, Queue, lokale Session
```

## Frontend

Empfohlene Richtung:

- Astro
- TypeScript
- statischer Build
- Markdown Content Collections
- kleine interaktive Komponenten nur dort, wo sie benoetigt werden
- Workbox fuer Precache und Runtime-Caching

Warum Astro:

- Der Hauptanteil der Anwendung besteht aus statischen Fachinhalten.
- Markdown und Metadaten koennen beim Build validiert werden.
- Inhalte koennen als normale HTML-Seiten ausgeliefert werden.
- Die JavaScript-Menge auf dem Geraet bleibt klein.
- Fuer die statischen Seiten ist keine Node.js-Laufzeit erforderlich.

Eine reine Single-Page-Anwendung ist nicht notwendig. Sie wuerde fuer diesen
Anwendungsfall mehr JavaScript und mehr Fehlerflaeche mitbringen, ohne einen
entsprechenden fachlichen Vorteil zu liefern.

## Backend

Der Serverdienst ist nur fuer Funktionen notwendig, die mehrere Geraete oder
zentrale Berechtigungen betreffen:

- Online-Anmeldung
- Ausgabe signierter Offline-Berechtigungen
- Rollen- und Benutzerverwaltung
- Synchronisation von ToDos
- Annahme von Formularen
- Bereitstellung geschuetzter Inhaltspakete
- Audit-Protokoll

Der Server muss genau eine schreibende Instanz besitzen. JSON/YAML-Dateien sind
kein geeignetes Multi-Writer-System.

## Inhaltserzeugung

Jeder Artikel erhaelt Frontmatter mit einem stabilen Identifier:

```yaml
id: telematik-antennen
title: Antennen
section: telematik
visibility: zso
order: 10
tags:
  - telematik
  - funk
updatedAt: 2026-06-15
revision: 3
offlinePack: telematik
```

Der Build muss fehlschlagen, wenn:

- eine interne Referenz fehlt
- eine Inhalts-ID doppelt vorkommt
- eine unbekannte Rolle verwendet wird
- ein Offline-Paket eine nicht vorhandene Ressource enthaelt
- Pflichtmetadaten fehlen

## Bereitstellung

Der statische Build kann ueber den vorhandenen Synology-Reverse-Proxy oder
einen statischen Webserver ausgeliefert werden. HTTPS ist zwingend, weil Service
Worker und Web Crypto ausserhalb lokaler Entwicklung einen sicheren Kontext
benoetigen.

Die API sollte unter derselben Origin erreichbar sein, zum Beispiel:

```text
https://zso.example.ch/          statische PWA
https://zso.example.ch/api/      Auth- und Sync-API
```

Damit bleiben CORS-, Cookie- und Deployment-Komplexitaet klein.

## Nicht-Ziele der ersten Version

- gleichzeitiger Betrieb mehrerer schreibender Serverinstanzen
- komplexe Echtzeit-Zusammenarbeit
- frei konfigurierbarer Formulardesigner im Browser
- vollwertiges Dokumentenmanagement
- Ersatz eines zentralen Identity Providers

