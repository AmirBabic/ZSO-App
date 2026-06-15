# Offline-Daten und Synchronisation

## Offline-Ziele

Nach mindestens einer erfolgreichen Installation beziehungsweise Anmeldung
sollen die freigegebenen Funktionen auch ohne Netz verfuegbar sein:

- Navigation und App-Oberflaeche
- erlaubte Handkarten und Fachinhalte
- erlaubte WK-Informationen
- heruntergeladene Bilder und PDFs
- lokale ToDos
- Formularvorlagen und Entwuerfe
- Anzeige der letzten bekannten Version und Synchronisation

## Speicheraufteilung

### Cache Storage

Fuer unveraenderliche oder versionierte Ressourcen:

- HTML, CSS und JavaScript
- Icons und App-Manifest
- Markdown-renderierte Fachseiten
- Bilder und PDFs
- Inhaltsindex und Suchindex

Dateien werden anhand eines Build- oder Content-Hashes versioniert. Ein neues
Release erhaelt einen neuen Cache-Namen. Erst nach erfolgreichem Download wird
auf die neue Version umgeschaltet.

### IndexedDB

Fuer strukturierte, veraenderliche lokale Daten:

- Formularentwuerfe
- ToDos
- Favoriten und zuletzt geoeffnete Inhalte
- Sync-Queue
- letzter Synchronisationsstand
- lokale Benutzer- und Rolleninformation
- signierte Offline-Berechtigung

Statische Inhalte sollen nicht gleichzeitig in Cache Storage und IndexedDB
dupliziert werden.

## Offline-Pakete

Nicht jede Benutzerrolle soll automatisch alle Medien laden. Vorgeschlagene
Pakete:

- `public-core`
- `zso-core`
- `uof`
- `officer`
- fachbezogene Pakete wie `telematik`, `lage` oder `ntp`

Die App zeigt pro Paket:

- Version
- Groesse
- Downloadstatus
- Datum der letzten Aktualisierung
- benoetigte Rolle

Interne Pakete werden erst nach einer gueltigen Berechtigungspruefung
heruntergeladen.

## Lokale Aenderungen

Jede offline erzeugte Mutation erhaelt mindestens:

```json
{
  "id": "0afbb8b5-43ce-4ae4-9c52-f76232414eba",
  "entityType": "todo",
  "entityId": "b98ac08f-bb3d-42df-8e19-6cb79272833f",
  "operation": "update",
  "baseVersion": 4,
  "createdAt": "2026-06-15T12:00:00Z",
  "deviceId": "local-device-id",
  "payload": {}
}
```

UUIDs werden bereits offline erzeugt. Die Queue wird in Erstellungsreihenfolge
uebertragen. Ein Eintrag wird erst nach bestaetigter Serverannahme entfernt.

## Konfliktregeln

### Formulare

Eingereichte Formulare sind append-only:

- Ein Entwurf darf lokal geaendert werden.
- Eine Uebermittlung erzeugt eine unveraenderliche Revision.
- Eine Korrektur erzeugt eine neue Revision mit Referenz auf die alte.

Dadurch werden Ueberschreibkonflikte vermieden.

### ToDos

ToDos verwenden eine Versionsnummer:

- Update mit passender `baseVersion`: akzeptieren und Version erhoehen.
- Abweichende Version: Konflikt an das Geraet melden.
- Die App zeigt beide Staende und verlangt eine bewusste Auswahl.

Loeschungen werden zunaechst als Tombstone mit `deletedAt` synchronisiert. Eine
sofortige physische Loeschung erschwert die Konfliktbehandlung.

### Inhalte, Rollen und Benutzer

Der Server ist massgebend. Lokale Kopien sind nur der letzte bekannte Stand.

## Synchronisationsausloeser

- nach App-Start, wenn online
- nach erfolgreicher Anmeldung
- bei erneut erkannter Verbindung
- nach lokalen Aenderungen
- ueber einen manuellen Button "Jetzt synchronisieren"

Browser-Background-Sync ist nur eine Optimierung. Die Korrektheit darf nicht von
dieser Browserfunktion abhaengen, da die Unterstuetzung insbesondere auf iOS
abweichen kann.

## Statusanzeige

Die App soll jederzeit sichtbar machen:

- online oder offline
- lokale Aenderungen ausstehend
- letzte erfolgreiche Synchronisation
- Synchronisationsfehler
- installiertes Inhaltspaket und Version
- Update verfuegbar

## Speicher und Wiederherstellung

- Persistenten Browserspeicher anfordern, aber nicht als garantiert betrachten.
- Vor grossen Downloads freien Speicher pruefen.
- Benutzer koennen Medienpakete entfernen, ohne Formulardaten zu verlieren.
- Nicht synchronisierte Arbeitsdaten duerfen beim Cache-Update nicht geloescht
  werden.
- Fuer kritische Entwuerfe sollte ein lokaler JSON-Export vorgesehen werden.

