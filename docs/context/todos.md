# ToDo-Regeln

## Ziel

ToDos bilden einfache hierarchische Aufträge zwischen den Rollen ab. Die
Funktion ist online-only und verwendet keine Offline-Speicherung.

## Rollenregeln

```text
zso < nonCommissionedOfficer < officer < admin
```

Erstellung und Zuweisung:

| Ersteller | Erlaubte Zielrollen |
| --- | --- |
| ZSO User | keine |
| Unteroffizier | ZSO User |
| Offizier | Unteroffizier, ZSO User |
| Admin | Offizier, Unteroffizier, ZSO User |

Regeln:

- Zuweisung ist nur von einer höheren an eine tiefere Rolle möglich.
- Admin wird nie als Zielrolle angeboten.
- Eine tiefere Rolle kann keiner höheren Rolle ein ToDo geben.
- Eine Rolle kann sich in der ersten Version nicht selbst ToDos zuweisen.

## Sichtbarkeit

Ein ToDo ist sichtbar für:

- die zugewiesene Zielrolle
- alle höheren Rollen
- Admin immer

Eine tiefere Rolle sieht keine ToDos, die einer höheren Rolle zugewiesen sind.

## Bearbeiten und Abschliessen

Die Zielrolle darf:

- den Inhalt des ihr zugewiesenen ToDos lesen
- den Bearbeitungsstatus setzen
- das ToDo abschliessen

Höhere Rollen dürfen den Fortschritt einsehen. Fachliche Änderungen an einem
bereits erteilten ToDo sollten als neue Revision oder Kommentar erfolgen, damit
der Auftrag nachvollziehbar bleibt.

## Löschen

Löschen dürfen nur Rollen, die strikt höher als die Zielrolle sind:

- ToDo für ZSO User: Unteroffizier, Offizier oder Admin
- ToDo für Unteroffizier: Offizier oder Admin
- ToDo für Offizier: nur Admin

Die Zielrolle selbst darf das ToDo nicht löschen. Admin hat immer
Löschberechtigung.

Für Nachvollziehbarkeit wird ein ToDo vorzugsweise mit `deletedAt` und
`deletedBy` markiert, statt die Datei oder den Eintrag sofort physisch zu
entfernen.

## Datenmodell

```json
{
  "id": "d9f36552-6000-4650-b584-3b7a79fa17ba",
  "title": "Material kontrollieren",
  "description": "Bestand im Depot prüfen.",
  "createdAt": "2026-06-15T14:00:00+02:00",
  "createdByPrincipal": "group-officer-wk-2026",
  "createdByRole": "officer",
  "targetRole": "nonCommissionedOfficer",
  "status": "open",
  "completedAt": null,
  "completedByPrincipal": null,
  "deletedAt": null,
  "deletedByPrincipal": null
}
```

Mögliche Statuswerte der ersten Version:

```text
open
in_progress
completed
```

## Serverprüfung

Der Server prüft bei jeder Aktion:

- aktuelle Rolle aus der Sitzung
- Rollenrang der Zielgruppe
- erlaubte Statusänderung
- Löschregel

Browserseitig ausgeblendete Buttons sind keine Berechtigungsprüfung.

