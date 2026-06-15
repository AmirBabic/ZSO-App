# ZSO-App: Projektkontext

## Zweck dieses Dokuments

Dieses Dokument ist der zentrale Einstiegspunkt fuer den Neuaufbau der ZSO-App.
Es haelt den bekannten Ist-Zustand, die Anforderungen, die getroffenen
Architekturentscheide sowie offene Fragen fest. Detailkonzepte liegen unter
[`docs/context/`](docs/context/).

## Projektziel

Die bestehende ZSO-Applikation soll technisch neu aufgebaut werden. Bestehende
Funktionen und Inhalte sollen erhalten, bereinigt und gezielt erweitert werden.
Die Architektur soll bewusst flach bleiben und nur Komponenten enthalten, die
fuer die Anforderungen unmittelbar notwendig sind.

Der Neuaufbau soll folgende Funktionen abdecken:

- bestehende Fachbereiche und Referenzinhalte
- Handkarten
- Informationen zum WK fuer Kader und Mannschaft
- Formulare mit Verlauf und Detailansicht
- ToDos
- klar sichtbarer Online-/Offline-Status
- App-, Build- und Inhaltsversion
- Anmeldung, Rollen und Benutzerverwaltung
- oeffentlich zugaengliche Inhalte ohne Anmeldung

## Repository

- Repository-Name lokal und auf GitHub: `ZSO-App`
- Lokaler Pfad: `/Users/amir/Development/ZSO-App`
- GitHub: `https://github.com/AmirBabic/ZSO-App`
- Hauptbranch: `main`

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

## Verbindliches Zielbild

Die neue Anwendung bleibt eine einzelne Node.js-Anwendung:

- Node.js mit Express
- servergerenderte Handlebars-Seiten
- Markdown-Inhalte werden beim Start oder kontrolliert beim Deployment
  eingelesen
- Vanilla JavaScript fuer kleine Browserfunktionen
- Service Worker nur fuer offlinefaehige Lesekacheln und deren Inhalte
- JSON/YAML-Dateien fuer Benutzer, Rollen, Formulare und ToDos
- genau eine schreibende Serverinstanz
- HTTPS ueber Reverse Proxy beziehungsweise Synology

Nicht eingesetzt werden:

- Astro
- React, Vue oder ein anderes Frontend-Framework
- IndexedDB
- clientseitige Offline-Datenbank
- Offline-Synchronisationswarteschlange
- feingranulare Berechtigungen pro Datei oder Aktion

Details: [Zielarchitektur](docs/context/architecture.md)

## Kachelmodell

Die Startseite ist die zentrale fachliche und technische Struktur. Jede
Funktion beziehungsweise jeder Inhaltsbereich ist eine Kachel, zum Beispiel:

- Handkarten
- WK-Informationen
- Formulare
- ToDos
- Lage
- Telematik
- Unterstuetzung
- NTP
- Administration

Die Berechtigung gilt immer fuer die gesamte Kachel. Es gibt keine
Berechtigungen pro Markdown-Datei, PDF, Formularfeld oder Einzelaktion.
Saemtliche Inhalte und Unterseiten einer Kachel erben deren Zugriffsstufe.

Vorgesehene Rollenhierarchie:

```text
public < zso < nonCommissionedOfficer < officer < admin
```

Jede Kachel definiert nur:

- `minimumRole`
- `offline`

Beispiel:

```yaml
tiles:
  - id: handcards
    title: Handkarten
    minimumRole: public
    offline: true

  - id: forms
    title: Formulare
    minimumRole: zso
    offline: false
```

Der Server blendet nicht erlaubte Kacheln aus und prueft dieselbe Regel bei
jedem direkten Routenaufruf.

Details: [Authentifizierung, Passwoerter und Rollen](docs/context/authentication.md)

## Offline-Grundsatz

Offline verfuegbar sind ausschliesslich Kacheln, die mit `offline: true`
konfiguriert sind. Typischerweise sind dies lesende Referenzinhalte wie
Handkarten, Fachinformationen, Bilder und ausgewaehlte PDFs.

Online-Funktionen werden nicht lokal nachgebaut. Bei fehlender Verbindung:

- Formulare sind deaktiviert.
- ToDos sind deaktiviert.
- Anmeldung und Abmeldung mit Serverkontakt sind deaktiviert.
- Benutzerverwaltung ist deaktiviert.
- Nicht offlinefaehige Kacheln werden ausgegraut.
- Beim Klick erscheint die Meldung, dass die Funktion nur online verfuegbar ist.

Es gibt keine lokalen Formularentwuerfe, keine lokalen ToDos und keine
spaetere Synchronisation. Damit entfallen IndexedDB, Konfliktbehandlung und
Sync-Queues.

Geschuetzte Inhalte werden in der ersten Version nicht offline gespeichert.
Damit bleiben Rollenpruefung und Sperrung serverseitig eindeutig. Falls spaeter
geschuetzte Inhalte zwingend offline benoetigt werden, ist dafuer ein separates
Sicherheitskonzept erforderlich.

Details: [Offline-Verhalten](docs/context/offline-behavior.md)

## Formulare

Die Kachel `Formulare` ist eine Online-Funktion.

Ablauf:

1. Klick auf die Kachel oeffnet den Formularverlauf.
2. Der Verlauf zeigt die fuer den angemeldeten Benutzer beziehungsweise dessen
   Gruppenzugang sichtbaren gesendeten Formulare.
3. Klick auf einen Eintrag oeffnet eine vollstaendige Read-only-Detailansicht.
4. Auf der Verlaufsseite befindet sich die Aktion `Formular erstellen`.
5. Nach Auswahl des Formulartyps wird das Formular ausgefuellt und gesendet.
6. Nach erfolgreichem Speichern erscheint es im Verlauf.

In der ersten Version gibt es keine Offline-Entwuerfe und kein nachtraegliches
Synchronisieren. Formulare werden als einzelne JSON-Dateien gespeichert.

Details: [Formularablauf](docs/context/forms.md)

## Benutzer- und Rollenmodell

| Rolle | Anmeldung | Typischer Zugriff |
| --- | --- | --- |
| Oeffentlich | nein | oeffentliche Offline- und Online-Kacheln |
| ZSO User | Gruppenlogin oder persoenlich | interne Basisfunktionen |
| Unteroffizier | Gruppenlogin oder persoenlich | Uof-/Kaderkacheln |
| Offizier | Gruppenlogin oder persoenlich | Offizierskacheln |
| Admin | zwingend persoenlich | Administration |

Nicht jede Person benoetigt einen persoenlichen Account. Fuer ZSO User,
Unteroffiziere und Offiziere sind rotierende Gruppenzugaenge moeglich. Ein
Gruppenzugang kann eine konkrete Person jedoch nicht beweissicher
identifizieren.

Benutzerdateien und Passwort-Hashes bleiben ausschliesslich auf dem Server. Sie
duerfen niemals Bestandteil der ausgelieferten PWA oder eines Offline-Caches
sein.

## Dateibasierte Serverdaten

Vorgeschlagene Struktur:

```text
data/
  auth.yaml
  tiles.yaml
  todos.json
  forms/
    definitions/
      material-request.yaml
    submissions/
      2026/
        <uuid>.json
  audit/
    2026-06.jsonl
```

Regeln:

- `auth.yaml` enthaelt Rollen, Gruppen und Benutzer mit Passwort-Hashes.
- `tiles.yaml` enthaelt Kacheln, minimale Rolle und Offline-Status.
- Formularvorlagen sind YAML-Dateien.
- Gesendete Formulare werden einzeln als JSON gespeichert.
- Das Audit-Protokoll ist append-only im JSON-Lines-Format.
- Dateien werden ueber temporaere Dateien und atomare Umbenennung geschrieben.
- Schreibzugriffe werden innerhalb des Serverprozesses serialisiert.
- Es darf nur eine schreibende Serverinstanz geben.
- Secrets und TLS-Schluessel liegen ausserhalb des Repositories.

## Versionierung

Die Anwendung soll mindestens folgende Informationen anzeigen:

```text
App: 1.0.0
Build: 2026-06-15T14:32:18Z
Commit: a92f70c
Inhalte: 2026.06.15-2
```

Handkarten, WK-Informationen und Formularvorlagen erhalten bei Bedarf eigene
fachliche Revisionen. Ein Timestamp allein reicht nicht fuer nachvollziehbare
Releases.

## Vorgeschlagene Umsetzungsreihenfolge

1. Schluessel rotieren und Git-Historie bereinigen.
2. Bestehende Funktionen und Inhalte als Abnahmekatalog erfassen.
3. Kacheln, Rollenhierarchie und `minimumRole` festlegen.
4. Bestehende Express-Anwendung strukturiert neu aufsetzen.
5. Reproduzierbares `package.json`, Tests und CI einfuehren.
6. Inhaltsimport, Linkpruefung und Navigation implementieren.
7. Service Worker fuer explizit offlinefaehige Lesekacheln implementieren.
8. Anmeldung und serverseitige Kachelpruefung implementieren.
9. Formularverlauf, Detailansicht und Erstellung implementieren.
10. ToDos und Administration als Online-Funktionen ergaenzen.
11. Mobile, Offline-, Rollen- und Update-Tests durchfuehren.
12. Pilotbetrieb und anschliessende Umschaltung.

## Offene fachliche Fragen

- Sind "Handkarten" fachliche Merk- und Checkkarten oder geografische Karten?
- Welche Kacheln sind fuer welche minimale Rolle sichtbar?
- Welche Kacheln sollen tatsaechlich offline verfuegbar sein?
- Welche Formulartypen werden benoetigt?
- Welche Formulare darf ein Gruppenlogin im Verlauf sehen?
- Muessen Formulare einer verifizierten Person zugeordnet werden?
- Duerfen WK-Informationen Personendaten enthalten?
- Wie oft werden Gruppenzugangscodes rotiert?
- Wer darf ToDos erstellen, zuweisen, abschliessen und loeschen?
- Wird die Anwendung nur von einer ZSO oder von mehreren Organisationen genutzt?
- Welche Geraete und Browser muessen verbindlich unterstuetzt werden?

## Detaildokumente

- [Zielarchitektur](docs/context/architecture.md)
- [Offline-Verhalten](docs/context/offline-behavior.md)
- [Formularablauf](docs/context/forms.md)
- [Authentifizierung, Passwoerter und Rollen](docs/context/authentication.md)
- [Migration und Repository-Sicherheit](docs/context/migration-security.md)

