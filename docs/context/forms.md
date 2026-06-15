# Formularablauf

## Ziel

Die Formularfunktion ist eine einfache serverseitige Online-Funktion. Sie
besteht aus:

- Verlauf gesendeter Formulare
- vollstaendiger Read-only-Detailansicht
- Erstellung eines neuen Formulars

Es gibt keine Offline-Entwuerfe und keine Synchronisation.

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
enthaelt mindestens:

- Formulartyp
- Erstellungs-/Sendedatum
- Ersteller oder verwendeter Gruppenzugang
- Status
- eindeutige Formular-ID

Auf der Verlaufsseite befindet sich gut sichtbar die Aktion:

```text
Formular erstellen
```

Die Liste kann zunaechst absteigend nach Sendedatum sortiert werden. Filter und
Volltextsuche sind erst spaeter hinzuzufuegen, wenn der Bestand dies wirklich
erfordert.

## Sichtbarkeit im Verlauf

Die Kachelberechtigung entscheidet, ob die Formularfunktion verwendet werden
darf. Innerhalb der Kachel wird keine allgemeine Permission-Engine eingefuehrt.

Fuer die Sichtbarkeit ist eine einfache feste Regel festzulegen. Empfohlener
Start:

- persoenlicher Account: eigene gesendete Formulare
- Gruppenzugang: Formulare dieses Gruppenzugangs
- Admin: alle Formulare

Falls Offiziere alle Formulare einer Gruppe sehen sollen, wird dies als eine
einzelne feste Rollenregel in der Formularlogik umgesetzt, nicht als frei
konfigurierbare Permission.

## Detailansicht

Route:

```text
GET /forms/:id
```

Beim Klick auf einen Verlaufseintrag werden alle gespeicherten Informationen
read-only angezeigt:

- Metadaten
- alle Formularfelder
- Ersteller- beziehungsweise Gruppeninformation
- Sendedatum
- Status
- Formularvorlagen-Version

Die Anzeige verwendet die beim Senden gespeicherten Feldbezeichnungen und
Werte. Dadurch bleibt ein altes Formular lesbar, auch wenn die aktuelle
Formularvorlage spaeter geaendert wird.

## Formular erstellen

Routen:

```text
GET  /forms/new
GET  /forms/new/:type
POST /forms
```

Ablauf:

1. Aktion `Formular erstellen` auf dem Verlauf anklicken.
2. Falls mehrere Typen vorhanden sind, Formulartyp auswaehlen.
3. Formular ausfuellen.
4. Serverseitig validieren.
5. Nach Bestaetigung als einzelne JSON-Datei speichern.
6. Auf die Detailansicht oder den Verlauf weiterleiten.

Die Erstellung ist nur online moeglich. Ist das Geraet offline, ist die Aktion
deaktiviert und zeigt die allgemeine Offline-Meldung.

## Formularvorlagen

Beispiel:

```yaml
id: material-request
title: Materialbestellung
version: 1
fields:
  - id: description
    label: Material
    type: text
    required: true
  - id: quantity
    label: Anzahl
    type: number
    required: true
```

Alle Formulartypen verwenden die Berechtigung der Formular-Kachel. Es gibt
keine zusaetzliche Rolle pro Formularvorlage.

Unterstuetzte Feldtypen der ersten Version sollten begrenzt bleiben:

- Text
- mehrzeiliger Text
- Zahl
- Datum
- Auswahl
- Checkbox

## Speicherung

Beispiel:

```json
{
  "id": "f3ebcf2d-65b0-441d-86b0-32c662872343",
  "formType": "material-request",
  "formVersion": 1,
  "submittedAt": "2026-06-15T12:00:00Z",
  "principalId": "group-zso-wk-2026",
  "principalType": "group",
  "submittedName": "Max Muster",
  "status": "submitted",
  "fields": [
    {
      "id": "description",
      "label": "Material",
      "value": "Absperrband"
    },
    {
      "id": "quantity",
      "label": "Anzahl",
      "value": 4
    }
  ]
}
```

Pfad:

```text
data/forms/submissions/2026/<id>.json
```

Jede Uebermittlung wird als neue Datei geschrieben. In der ersten Version
werden gesendete Formulare nicht im Browser bearbeitet oder geloescht.

## Fehlerverhalten

- Validierungsfehler zeigen die betroffenen Felder.
- Speicherfehler duerfen keine Erfolgsmeldung erzeugen.
- Bei Verbindungsabbruch bleibt das ausgefuellte HTML-Formular soweit moeglich
  sichtbar, wird aber nicht lokal dauerhaft gespeichert.
- Doppelte POST-Anfragen werden ueber eine Request-ID beziehungsweise
  Einmal-Token erkannt.

