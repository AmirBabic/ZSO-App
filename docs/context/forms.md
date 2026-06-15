# Formularablauf

## Ziel

Die Formularfunktion ist eine einfache serverseitige Online-Funktion:

- Verlauf der lesbaren gesendeten Formulare
- vollständige Read-only-Detailansicht
- Erstellung eines neuen Formulars

Es gibt keine Offline-Entwürfe, nachträgliche Bearbeitung oder
Synchronisation.

## Navigation

```text
Kachel Formulare
  -> Formularverlauf
      -> Formular anzeigen
      -> Formular erstellen
```

## Formularverlauf

Route:

```text
GET /forms
```

Beim Klick auf die Kachel wird direkt der Verlauf angezeigt. Ein Eintrag
enthält mindestens:

- Titel
- Themenbereich
- Datum und Zeit
- Rolle des Senders
- Lesestufe
- optionaler Sendername
- eindeutige Formular-ID

Die Liste wird absteigend nach Datum und Zeit sortiert. Auf der Verlaufsseite
befindet sich gut sichtbar:

```text
Formular erstellen
```

## Sichtbarkeit

Jedes Formular speichert die niedrigste Rolle, die es lesen darf:

```text
zso < nonCommissionedOfficer < officer
```

Beispiele:

- Auswahl `zso`: ZSO User, Unteroffiziere, Offiziere und Admin können lesen.
- Auswahl `nonCommissionedOfficer`: Unteroffiziere, Offiziere und Admin können
  lesen.
- Auswahl `officer`: Offiziere und Admin können lesen.

Eine tiefere Rolle erhält niemals Zugriff auf ein höher eingestuftes
Formular.

Admin ist implizit immer leseberechtigt und wird deshalb nie als Option im
Dropdown angezeigt.

## Detailansicht

Route:

```text
GET /forms/:id
```

Beim Klick auf einen Verlaufseintrag werden alle gespeicherten Informationen
read-only angezeigt:

- Titel
- Themenbereich
- Datum und Zeit
- optionaler Sendername
- beim Senden angemeldete Rolle
- ausgewählte Lesestufe
- Nachricht
- technische Formular-ID
- Server-Zeitpunkt der Speicherung

Gesendete Formulare werden nicht bearbeitet. Insbesondere Senderrolle und
Lesestufe sind nach dem Senden unveränderlich.

## Formular erstellen

Routen:

```text
GET  /forms/new
POST /forms
```

Das Formular besitzt genau folgende Felder:

| Feld | Typ | Pflicht | Verhalten |
| --- | --- | --- | --- |
| Titel | Text | ja | kurze Bezeichnung |
| Themenbereich | Dropdown | ja | Werte aus `form-topics.yaml` |
| Datum/Zeit | Datum und Zeit | ja | fachlicher Zeitpunkt |
| Name Sender | Text | nein | freiwillige Namensangabe |
| Angemeldete Rolle | Anzeige | ja | serverseitig gesetzt, nicht veränderbar |
| Lesbar ab Rolle | Dropdown | ja | `zso`, `nonCommissionedOfficer`, `officer` |
| Nachricht | Mehrzeiliger Text | ja | eigentlicher Inhalt |

Admin wird in `Lesbar ab Rolle` nie angeboten. Admin hat trotzdem immer Zugriff.

Ablauf:

1. `Formular erstellen` anklicken.
2. Felder ausfüllen.
3. Serverseitig validieren.
4. Rolle aus der Sitzung übernehmen, nicht aus dem Request.
5. Formular als einzelne JSON-Datei speichern.
6. Auf die Read-only-Detailansicht weiterleiten.

Die Erstellung ist nur online möglich.

## Themenbereiche

Die Themenbereiche werden später fachlich festgelegt. Sie liegen in einer
einfachen Datei:

```yaml
topics:
  - id: general
    label: Allgemein
    enabled: true
```

Alte Themenwerte bleiben in bereits gesendeten Formularen als Text erhalten,
auch wenn ein Thema später deaktiviert oder umbenannt wird.

## Speicherung

Beispiel:

```json
{
  "id": "f3ebcf2d-65b0-441d-86b0-32c662872343",
  "title": "Material fehlt",
  "topic": {
    "id": "general",
    "label": "Allgemein"
  },
  "eventAt": "2026-06-15T14:30:00+02:00",
  "submittedAt": "2026-06-15T14:31:12+02:00",
  "principalId": "group-zso-wk-2026",
  "principalType": "group",
  "senderRole": "zso",
  "senderName": "Max Muster",
  "minimumReadRole": "zso",
  "message": "Beim Materialdepot fehlt Absperrband."
}
```

Pfad:

```text
data/forms/submissions/2026/<id>.json
```

`senderRole` wird aus der serverseitigen Sitzung gesetzt. Ein im Browser
manipulierter Rollenwert wird ignoriert.

## Validierung

- Titel und Nachricht dürfen nicht leer sein.
- Themenbereich muss aktiv und bekannt sein.
- Datum/Zeit muss gültig sein.
- Lesestufe muss `zso`, `nonCommissionedOfficer` oder `officer` sein.
- Lesestufe darf nie `admin` oder `public` sein.
- Senderrolle muss aus der Sitzung stammen.
- Die Detailroute prüft die Lesestufe erneut serverseitig.

## Fehlerverhalten

- Validierungsfehler zeigen die betroffenen Felder.
- Speicherfehler dürfen keine Erfolgsmeldung erzeugen.
- Bei Verbindungsabbruch bleibt das ausgefüllte HTML-Formular soweit möglich
  sichtbar, wird aber nicht dauerhaft lokal gespeichert.
- Doppelte POST-Anfragen werden über eine Request-ID oder ein Einmal-Token
  erkannt.

