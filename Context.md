# ZSO-App: Projektkontext

## Zweck dieses Dokuments

Dieses Dokument ist der zentrale Einstiegspunkt fuer den Neuaufbau der ZSO-App.
Es haelt den bekannten Ist-Zustand, die Anforderungen, die bisher getroffenen
Architekturentscheide sowie offene Fragen fest. Detailkonzepte sind unter
[`docs/context/`](docs/context/) abgelegt und werden von hier verlinkt.

## Projektziel

Die bestehende ZSO-Applikation soll technisch neu aufgebaut werden. Bestehende
Funktionen und Inhalte sollen erhalten, bereinigt und gezielt erweitert werden.
Die Anwendung muss auch ohne Netzwerkverbindung einsatzfaehig bleiben.

Der Neuaufbau soll insbesondere folgende Funktionen abdecken:

- bestehende Fachbereiche und Referenzinhalte
- Handkarten
- Informationen zum WK fuer Kader und Mannschaft
- Formulare und lokale Formularentwuerfe
- ToDos
- klar sichtbarer Offline- und Synchronisationsstatus
- App-, Build- und Inhaltsversion
- Anmeldung, Rollen und Benutzerverwaltung
- oeffentlich zugaengliche Inhalte ohne Anmeldung

## Repository

- Repository-Name lokal und auf GitHub: `ZSO-App`
- Lokaler Pfad: `/Users/amir/Development/ZSO-App`
- GitHub: `https://github.com/AmirBabic/ZSO-App`
- Aktueller Hauptbranch: `main`

## Ist-Zustand

Die bestehende Anwendung liegt in `node-app/` und ist eine kleine,
servergerenderte Node.js-Anwendung:

- Express 4.16.3
- express-handlebars 3.0.0
- Showdown 1.8.6 fuer Markdown
- dateibasierte Inhalte unter `node-app/content/`
- selbst erzeugter Service Worker fuer den Offline-Cache
- Betrieb urspruenglich auf einer Synology

### Vorhandene Funktionen

- Startseite mit Fachbereichskacheln
- Listenansicht pro Fachbereich
- Darstellung von Markdown-Inhalten
- Bilder, Bildvergroesserung und PDF-Downloads
- installierbare PWA
- rudimentaerer Offline-Cache

Aktiv verlinkt sind:

- Lage
- Telematik
- Unterstuetzung
- NTP

Weitere Inhaltsordner existieren, sind aber teilweise leer, als Backup markiert
oder nicht in der Navigation erreichbar.

### Inhaltsbestand

Bei der Analyse am 15. Juni 2026 wurden festgestellt:

- 237 Inhaltsdateien
- 55 Markdown-Dateien
- 24 PDF-Dateien
- 157 Bilder
- etwa 63 MB Inhaltsdaten
- 223 aktuell vorgeladene Offline-Ressourcen
- etwa 47 MB aktuelles Precache-Volumen

### Technische Defizite

- kein `package.json` und damit kein reproduzierbarer Build
- mehr als 4'000 eingecheckte Dateien aus `node_modules`
- keine projektspezifischen automatisierten Tests
- keine CI-Pipeline
- Fachbereiche und Navigation sind im Code hart codiert
- fehlende Seiten liefern HTTP 500 statt 404
- Service-Worker-Cache besitzt keine verlaessliche Inhaltsversionierung
- Aktualisierungen alter Offline-Dateien sind nicht robust
- ein Fehler beim Precache kann die gesamte Installation verhindern
- interne Links verweisen teilweise auf den alten Synology-Server
- Inhalte enthalten viel rohes HTML und uneinheitliche Dateinamen
- mehrere Backup- und Editor-Artefakte liegen im Repository
- sechs Handlebars-Templates duplizieren komplette HTML-Dokumente und die
  Service-Worker-Registrierung

## Sicherheitsstatus

Im Repository waren 17 Zertifikats- und Schluesseldateien unter
`node-app/RuHuro/` eingecheckt, darunter vier private Schluessel. Sie wurden aus
dem aktuellen Repository-Stand entfernt. `.gitignore` blockiert den Ordner und
gaengige Zertifikats-/Schluesselformate.

Die Dateien befinden sich weiterhin in der bisherigen Git-Historie, solange
diese nicht neu geschrieben und force-gepusht wurde. Betroffene Zertifikate und
Schluessel muessen als kompromittiert behandelt und rotiert werden.

Details: [Migration und Repository-Sicherheit](docs/context/migration-security.md)

## Zielbild

Die Anwendung soll als **statische Offline-first-PWA** neu entstehen. Fuer
statische Fachinhalte ist im Produktivbetrieb kein Node.js-Server erforderlich.
Ein kleiner Serverdienst wird nur fuer Anmeldung, zentrale Rechte,
Synchronisation, ToDos und Formularuebermittlungen benoetigt.

Die bisher favorisierte technische Richtung ist:

- Astro mit TypeScript und statischem Build
- Markdown Content Collections mit validierten Metadaten
- Workbox-Service-Worker mit revisionierten Assets
- Cache Storage fuer App-Dateien und statische Medien
- IndexedDB fuer lokale strukturierte Daten
- kleine Node.js-Sync-API
- JSON/YAML-basierte serverseitige Speicherung statt SQLite
- HTTPS ueber Reverse Proxy beziehungsweise Synology

Diese Auswahl ist eine begruendete Empfehlung, aber noch kein final
freigegebener Technologieentscheid.

Details: [Zielarchitektur](docs/context/architecture.md)

## Offline-Grundsatz

Die Anwendung muss zwischen drei Datenarten unterscheiden:

1. **Statische Inhalte:** App-Oberflaeche, Handkarten, Anleitungen, Bilder und
   PDFs. Diese werden versioniert ausgeliefert und lokal gecacht.
2. **Lokale Arbeitsdaten:** Formularentwuerfe, ToDos, Favoriten,
   Synchronisationswarteschlange und Offline-Berechtigung. Diese liegen in
   IndexedDB.
3. **Zentrale Daten:** Benutzer, Rollen, freigegebene Formulare, zentrale ToDos
   und Audit-Informationen. Diese liegen serverseitig in JSON/YAML-Dateien.

Offline erfasste Aenderungen werden lokal gespeichert und spaeter
synchronisiert. "Offline verwendbar" bedeutet nicht, dass mehrere voneinander
getrennte Geraete ohne spaetere Serververbindung automatisch denselben
Datenstand erhalten koennen.

Details: [Offline-Daten und Synchronisation](docs/context/offline-sync.md)

## Benutzer- und Rollenmodell

Vorgesehene Rollen:

| Rolle | Anmeldung | Typischer Zugriff |
| --- | --- | --- |
| Oeffentlich | nein | freigegebene oeffentliche Inhalte |
| ZSO User | Gruppenlogin oder persoenlich | interne Basisinformationen |
| Unteroffizier | Gruppenlogin oder persoenlich | Uof-Inhalte, Formulare, ToDos |
| Offizier | Gruppenlogin oder persoenlich | Fuehrungs- und Kaderinformationen |
| Admin | zwingend persoenlich | Benutzer, Rollen, Inhalte und Konfiguration |

Nicht jede Person benoetigt einen persoenlichen Account. Fuer ZSO User,
Unteroffiziere und Offiziere sind rotierende Gruppenzugaenge moeglich. Ein
Gruppenzugang kann eine konkrete Person jedoch nicht beweissicher
identifizieren. Verbindliche oder personenbezogene Formulare brauchen deshalb
entweder einen persoenlichen Account oder eine explizite, als nicht verifiziert
markierte Namensangabe.

Benutzerdateien und Passwort-Hashes bleiben ausschliesslich auf dem Server. Sie
duerfen niemals Bestandteil der ausgelieferten PWA oder eines Offline-Pakets
sein.

Details: [Authentifizierung, Passwoerter und Rollen](docs/context/authentication.md)

## Dateibasierte Serverdaten

Vorgeschlagene Struktur:

```text
data/
  auth.yaml
  todos.json
  form-submissions/
    2026/
      <uuid>.json
  audit/
    2026-06.jsonl
```

Regeln:

- `auth.yaml` enthaelt Rollen, Gruppen und Benutzer mit Passwort-Hashes.
- Formulare werden als einzelne JSON-Dateien gespeichert.
- Das Audit-Protokoll ist append-only im JSON-Lines-Format.
- Dateien werden ueber temporaere Dateien und atomare Umbenennung geschrieben.
- Schreibzugriffe werden innerhalb des Serverprozesses serialisiert.
- Es darf nur eine schreibende Serverinstanz geben.
- Secrets und Signaturschluessel liegen ausserhalb des Repositories.

Wenn spaeter mehrere Serverinstanzen gleichzeitig schreiben oder wesentlich
mehr Transaktionen entstehen, muss das Speichermodell neu bewertet werden.

## Inhalts- und Rechtekonzept

Jeder Inhalt soll strukturierte Metadaten erhalten, beispielsweise:

```yaml
title: Einsatzfuehrung
section: fuehrungsunterstuetzung
visibility: officer
order: 20
tags:
  - fuehrung
  - einsatz
offlinePack: officer
updatedAt: 2026-06-15
```

Interne Inhalte duerfen nicht nur in der Benutzeroberflaeche versteckt werden.
Oeffentliche und geschuetzte Offline-Pakete muessen technisch getrennt sein.
Geschuetzte Inhalte werden erst nach erfolgreicher Berechtigungspruefung auf das
Geraet geladen.

## Versionierung

Die Anwendung soll mindestens folgende Informationen anzeigen:

```text
App: 1.0.0
Build: 2026-06-15T14:32:18Z
Commit: a92f70c
Inhalte: 2026.06.15-2
Letzte Synchronisation: 15.06.2026 16:40
```

Zusaetzlich erhalten Handkarten, WK-Informationen und Formularvorlagen eigene
fachliche Revisionen. Ein Timestamp allein reicht nicht fuer nachvollziehbare
Releases.

## Vorgeschlagene Umsetzungsreihenfolge

1. Schluessel rotieren und Git-Historie bereinigen.
2. Aktuelle Funktionen und Inhalte als Abnahmekatalog erfassen.
3. Rollen, Berechtigungen und Datenklassifikation fachlich festlegen.
4. Neue statische PWA parallel zur Altanwendung aufbauen.
5. Inhaltsimport, Linkpruefung und Metadatenvalidierung implementieren.
6. Bestehende Navigation, Artikel, Bilder und PDFs migrieren.
7. Offline-Pakete, versionierte Updates und Wiederherstellung bauen.
8. IndexedDB und Synchronisationswarteschlange implementieren.
9. ToDos und datengetriebene Formulare ergaenzen.
10. Dateibasierte Auth-/Sync-API implementieren.
11. Offline-Anmeldung und lokale Schutzmechanismen umsetzen.
12. Mobile, Offline-, Update-, Speicher- und Konflikttests durchfuehren.
13. Pilotbetrieb und anschliessende Umschaltung.

## Offene fachliche Fragen

- Sind "Handkarten" fachliche Merk- und Checkkarten oder geografische Karten?
- Welche Inhalte sind oeffentlich, intern, Uof-, Offiziers- oder Admin-Inhalte?
- Welche Formulare sind nur Entwuerfe und welche gelten als verbindlich
  eingereicht?
- Muessen Formulare einer verifizierten Person zugeordnet werden?
- Duerfen WK-Informationen Personendaten enthalten?
- Wie lange darf eine Offline-Berechtigung ohne erneute Serverpruefung gelten?
- Wie oft werden Gruppenzugangscodes rotiert?
- Wer darf ToDos erstellen, zuweisen, abschliessen und loeschen?
- Wird die Anwendung nur von einer ZSO oder von mehreren Organisationen genutzt?
- Welche Geraete und Browser muessen verbindlich unterstuetzt werden?
- Wie gross darf ein vollstaendiges Offline-Paket maximal sein?

## Detaildokumente

- [Zielarchitektur](docs/context/architecture.md)
- [Offline-Daten und Synchronisation](docs/context/offline-sync.md)
- [Authentifizierung, Passwoerter und Rollen](docs/context/authentication.md)
- [Migration und Repository-Sicherheit](docs/context/migration-security.md)

