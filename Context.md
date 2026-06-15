# ZSO-App: Projektkontext

## Zweck dieses Dokuments

Dieses Dokument ist der zentrale Einstiegspunkt für den Neuaufbau der ZSO-App.
Es hält den bekannten Ist-Zustand, die Anforderungen und die getroffenen
Architekturentscheide fest. Detailkonzepte liegen unter
[`docs/context/`](docs/context/).

## Projektziel

Die bestehende ZSO-Applikation soll technisch neu aufgebaut werden. Bestehende
Funktionen und Inhalte sollen erhalten, bereinigt und gezielt erweitert werden.
Die Architektur soll bewusst flach bleiben und nur Komponenten enthalten, die
für die Anforderungen unmittelbar notwendig sind.

Der Neuaufbau soll folgende Funktionen abdecken:

- bestehende Fachbereiche und Referenzinhalte
- Handkarten als fachliche Merk- und Checkkarten
- Informationen zum WK für Kader und Mannschaft
- Formulare mit Verlauf und Detailansicht
- ToDos
- klar sichtbarer Online-/Offline-Status
- App-, Build- und Inhaltsversion
- Anmeldung, Rollen und Benutzerverwaltung
- öffentlich zugängliche Inhalte ohne Anmeldung

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
- Showdown 1.8.6 für Markdown
- dateibasierte Inhalte unter `node-app/content/`
- selbst erzeugter Service Worker für den Offline-Cache
- Betrieb ursprünglich auf einer Synology

### Vorhandene Funktionen

- Startseite mit Fachbereichskacheln
- Listenansicht pro Fachbereich
- Darstellung von Markdown-Inhalten
- Bilder, Bildvergrösserung und PDF-Downloads
- installierbare PWA
- rudimentärer Offline-Cache

Aktiv verlinkt sind:

- Lage
- Telematik
- Unterstützung
- NTP

Diese vier bestehenden Kacheln bleiben im Neuaufbau öffentlich und offline
verfügbar.

Weitere Inhaltsordner existieren, sind aber teilweise leer, als Backup markiert
oder nicht in der Navigation erreichbar. Sie werden nicht automatisch als
produktive Inhalte übernommen.

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
- Service-Worker-Cache besitzt keine verlässliche Inhaltsversionierung
- Aktualisierungen alter Offline-Dateien sind nicht robust
- ein Fehler beim Precache kann die gesamte Installation verhindern
- interne Links verweisen teilweise auf den alten Synology-Server
- Inhalte enthalten viel rohes HTML und uneinheitliche Dateinamen
- mehrere Backup- und Editor-Artefakte liegen im Repository
- sechs Handlebars-Templates duplizieren komplette HTML-Dokumente und die
  Service-Worker-Registrierung

## Sicherheitsstatus

Im Repository waren 17 Zertifikats- und Schlüsseldateien unter
`node-app/RuHuro/` eingecheckt, darunter vier private Schlüssel. Sie wurden aus
dem aktuellen Repository-Stand entfernt. `.gitignore` blockiert den Ordner und
gängige Zertifikats-/Schlüsselformate.

Die Dateien befinden sich weiterhin in der bisherigen Git-Historie, solange
diese nicht neu geschrieben und force-gepusht wurde. Betroffene Zertifikate und
Schlüssel müssen als kompromittiert behandelt und rotiert werden.

Details: [Migration und Repository-Sicherheit](docs/context/migration-security.md)

## Verbindliches Zielbild

Die neue Anwendung bleibt eine einzelne Node.js-Anwendung:

- Node.js mit Express
- servergerenderte Handlebars-Seiten
- Markdown-Inhalte werden beim Start oder kontrolliert beim Deployment
  eingelesen
- Vanilla JavaScript für kleine Browserfunktionen
- Service Worker nur für offlinefähige Lesekacheln und deren Inhalte
- JSON/YAML-Dateien für Benutzer, Rollen, Formulare, WK-Daten und ToDos
- genau eine schreibende Serverinstanz
- HTTPS über Reverse Proxy beziehungsweise Synology

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
Funktion beziehungsweise jeder Inhaltsbereich ist eine Kachel:

- Lage
- Telematik
- Unterstützung
- NTP
- Handkarten
- WK-Informationen
- Formulare
- ToDos
- Administration

Die Berechtigung gilt für die gesamte Kachel. Sämtliche Inhalte und
Unterrouten einer Kachel erben deren Zugriffsstufe.

Vorgesehene Rollenhierarchie:

```text
public < zso < nonCommissionedOfficer < officer < admin
```

Jede Kachel definiert nur:

- `minimumRole`
- `offline`

Die bestehenden Kacheln Lage, Telematik, Unterstützung und NTP erhalten:

```yaml
minimumRole: public
offline: true
```

Admin ist eine Sonderrolle:

- Admin hat immer Zugriff auf alle Kacheln und Daten.
- Admin muss nicht explizit als Zielrolle gespeichert werden.
- Admin wird in fachlichen Rollenauswahlen, beispielsweise beim
  Formularzugriff, nie als Option angezeigt.

Details: [Authentifizierung, Passwörter und Rollen](docs/context/authentication.md)

## Offline-Grundsatz

Offline ist ein reiner Lesemodus. Die vier heute vorhandenen Inhaltskacheln
Lage, Telematik, Unterstützung und NTP bleiben vollständig offline
verfügbar. Handkarten werden ebenfalls als offlinefähige Merk- und
Checkkarten aufgebaut.

Online-Funktionen werden nicht lokal nachgebaut. Bei fehlender Verbindung:

- WK-Informationen sind deaktiviert.
- Formulare sind deaktiviert.
- ToDos sind deaktiviert.
- Anmeldung und Benutzerverwaltung sind deaktiviert.
- Online-Kacheln werden ausgegraut.
- Beim Klick erscheint eine Offline-Meldung.

Es gibt keine lokalen Formularentwürfe, keine lokalen ToDos und keine
spätere Synchronisation.

Details: [Offline-Verhalten](docs/context/offline-behavior.md)

## Formulare

Die Kachel `Formulare` ist eine Online-Funktion.

Der Formularverlauf zeigt alle Formulare, deren ausgewählte Lesestufe kleiner
oder gleich der Rolle des angemeldeten Benutzers ist. Eine tiefere Rolle sieht
niemals Formulare einer höheren Lesestufe. Admin sieht immer alle Formulare,
obwohl Admin in der Lesestufen-Auswahl nicht angeboten wird.

Ein Formular enthält:

- Titel
- Themenbereich aus einem Dropdown
- Datum und Zeit
- optionaler Name des Senders
- aktuelle angemeldete Rolle, read-only
- niedrigste Rolle, die das Formular lesen darf
- eigentliche Nachricht

Gesendete Formulare sind read-only. Die beim Senden gespeicherte Rolle kann
nicht nachträglich bearbeitet werden.

Ablauf:

1. Klick auf die Kachel öffnet den Formularverlauf.
2. Klick auf einen Eintrag öffnet die vollständige Detailansicht.
3. Auf der Verlaufsseite befindet sich `Formular erstellen`.
4. Nach erfolgreichem Speichern erscheint das Formular im Verlauf.

Details: [Formularablauf](docs/context/forms.md)

## WK-Informationen

WK-Informationen dürfen Personendaten enthalten. Die Kachel ist online-only
und erst sichtbar beziehungsweise nutzbar, wenn der angemeldete Principal für
den aktuellen WK eingetragen ist.

Die Eintragung gilt für die gesamte WK-Kachel und ist keine Berechtigung pro
Datei oder Feld. Wie die WK-Eintragung administrativ gepflegt wird, wird noch
genauer definiert.

## ToDos

Die ToDo-Kachel ist online-only.

Feste Hierarchie:

- ZSO User können keine ToDos erstellen.
- Unteroffiziere können ToDos für ZSO User erstellen.
- Offiziere können ToDos für Unteroffiziere oder ZSO User erstellen.
- Admin kann ToDos für alle nicht-administrativen Rollen erstellen.
- Eine tiefere Rolle kann nie einer höheren Rolle ein ToDo zuweisen.
- Die Zielgruppe kann das ToDo bearbeiten und abschliessen.
- Höhere Rollen können ToDos tieferer Rollen einsehen und löschen.
- Admin hat immer vollen Zugriff, wird aber nicht als Zielgruppe angeboten.

Details: [ToDo-Regeln](docs/context/todos.md)

## Benutzer- und Rollenmodell

| Rolle | Anmeldung | Typischer Zugriff |
| --- | --- | --- |
| Öffentlich | nein | bestehende öffentliche Inhaltskacheln |
| ZSO User | Gruppenlogin oder persönlich | interne Basisfunktionen |
| Unteroffizier | Gruppenlogin oder persönlich | Uof-/Kaderfunktionen |
| Offizier | Gruppenlogin oder persönlich | Offiziersfunktionen |
| Admin | zwingend persönlich | alle Inhalte und Administration |

Nicht jede Person benötigt einen persönlichen Account. Für ZSO User,
Unteroffiziere und Offiziere sind rotierende Gruppenzugänge möglich. Ein
Gruppenzugang kann eine konkrete Person jedoch nicht beweissicher
identifizieren.

Benutzerdateien und Passwort-Hashes bleiben ausschliesslich auf dem Server.

## Dateibasierte Serverdaten

Vorgeschlagene Struktur:

```text
data/
  auth.yaml
  tiles.yaml
  wk.yaml
  todos.json
  form-topics.yaml
  forms/
    submissions/
      2026/
        <uuid>.json
  audit/
    2026-06.jsonl
```

Regeln:

- `auth.yaml` enthält Rollen, Gruppen und Benutzer mit Passwort-Hashes.
- `tiles.yaml` enthält Kacheln, minimale Rolle und Offline-Status.
- `wk.yaml` enthält den aktuellen WK und die eingetragenen Principals.
- `form-topics.yaml` enthält die später definierten Themenbereiche.
- Gesendete Formulare werden einzeln als JSON gespeichert.
- ToDos liegen in einer kleinen zentralen JSON-Datei.
- Das Audit-Protokoll ist append-only im JSON-Lines-Format.
- Dateien werden über temporäre Dateien und atomare Umbenennung geschrieben.
- Schreibzugriffe werden innerhalb des Serverprozesses serialisiert.
- Es darf nur eine schreibende Serverinstanz geben.
- Secrets und TLS-Schlüssel liegen ausserhalb des Repositories.

## Versionierung

Die Anwendung zeigt mindestens:

```text
App: 1.0.0
Build: 2026-06-15T14:32:18Z
Commit: a92f70c
Inhalte: 2026.06.15-2
```

Handkarten und WK-Informationen erhalten bei Bedarf eigene fachliche Revisionen.

## Zielplattformen

Desktop und Laptop:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari auf macOS

Mobil:

- Safari auf iPhone
- Samsung Internet
- Google Chrome

Die genauen minimalen Browser-Versionen werden vor der Umsetzung festgelegt.
Automatisierte Tests sollen Chromium, Firefox und WebKit abdecken. Zusätzlich
werden reale Tests auf iPhone und Samsung-Geräten benötigt.

## Betriebsumfang

Die Anwendung ist für genau eine ZSO vorgesehen. Mandantenfähigkeit und
organisationsübergreifende Datenhaltung sind keine Anforderungen.

## Vorgeschlagene Umsetzungsreihenfolge

1. Schlüssel rotieren und Git-Historie bereinigen.
2. Bestehende Funktionen und Inhalte als Abnahmekatalog erfassen.
3. Kacheln und Rollenhierarchie konfigurieren.
4. Bestehende Express-Anwendung strukturiert neu aufsetzen.
5. Reproduzierbares `package.json`, Tests und CI einführen.
6. Bestehende Inhalte und Handkarten migrieren.
7. Service Worker für öffentliche Offline-Lesekacheln implementieren.
8. Anmeldung, Admin-Sonderrolle und Kachelprüfung implementieren.
9. WK-Eintragung und WK-Informationen implementieren.
10. Formularverlauf, Detailansicht und Erstellung implementieren.
11. Hierarchische ToDos implementieren.
12. Administration und Usermanagement ergänzen.
13. Browser-, Mobile-, Offline-, Rollen- und Update-Tests durchführen.
14. Pilotbetrieb und anschliessende Umschaltung.

## Noch offene fachliche Fragen

- Welche Themenbereiche stehen im Formular-Dropdown zur Auswahl?
- Wie wird ein Principal für einen konkreten WK eingetragen und entfernt?
- Wie oft werden Gruppenzugangscodes rotiert?
- Welche minimalen Versionen der Zielbrowser werden unterstützt?

## Detaildokumente

- [Zielarchitektur](docs/context/architecture.md)
- [Offline-Verhalten](docs/context/offline-behavior.md)
- [Formularablauf](docs/context/forms.md)
- [ToDo-Regeln](docs/context/todos.md)
- [Authentifizierung, Passwörter und Rollen](docs/context/authentication.md)
- [Migration und Repository-Sicherheit](docs/context/migration-security.md)

