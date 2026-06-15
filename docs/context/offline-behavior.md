# Offline-Verhalten

## Grundsatz

Offline ist ein reiner Lesemodus. Veränderliche Anwendungsdaten werden nicht
lokal gespeichert und später synchronisiert.

Damit entfallen:

- IndexedDB
- lokale ToDos
- lokale Formularentwürfe
- Sync-Queue
- Konfliktbehandlung
- Background Sync
- Offline-Benutzerverwaltung

## Offlinefähige Kacheln

Alle Inhalte, die heute in der bestehenden App aktiv verfügbar sind, bleiben
offline verfügbar:

- Lage
- Telematik
- Unterstützung
- NTP

Handkarten sind fachliche Merk- und Checkkarten und werden ebenfalls als
offlinefähige Lesekachel umgesetzt.

Jede offlinefähige Kachel besitzt:

```yaml
minimumRole: public
offline: true
```

Der Service Worker cached:

- Startseite und Offline-Hinweisseite
- gemeinsames CSS und notwendiges JavaScript
- HTML-Seiten der Offline-Kacheln
- zugehörige Bilder und ausgewählte PDFs
- Manifest und App-Icons

## Online-only-Kacheln

Online-only sind:

- WK-Informationen
- Anmeldung
- Formulare
- ToDos
- Administration und Usermanagement

Bei fehlender Verbindung bleiben diese Kacheln sichtbar, sind aber:

- optisch ausgegraut
- mit einem Offline-Symbol gekennzeichnet
- nicht normal navigierbar
- beim Klick mit einer Meldung versehen

Vorgeschlagener Text:

> Diese Funktion ist nur mit einer Internetverbindung verfügbar.

## Erkennung der Verbindung

Die Oberfläche kann `navigator.onLine` für eine schnelle Anzeige verwenden.
Vor einer Online-Aktion ist trotzdem eine echte Serveranfrage massgebend.

Bei einem fehlgeschlagenen Online-Aufruf:

1. Keine Erfolgsmeldung anzeigen.
2. Eine klare Offline-/Verbindungsfehlermeldung anzeigen.
3. Keine lokale Kopie als ausstehenden Auftrag speichern.
4. Benutzer auf derselben Seite lassen, soweit dies ohne Datenverlust möglich
   ist.

## Update-Verhalten

- Cache-Namen enthalten App- oder Inhaltsversion.
- Ein neuer Service Worker lädt zuerst alle Pflichtdateien.
- Erst nach erfolgreichem Download wird die neue Version aktiviert.
- Alte Caches werden nach Aktivierung entfernt.
- Fehlerhafte Einzeldateien dürfen nicht zu einem halben Update führen.

## Tests

Mindestens zu testen sind:

- Erstinstallation online
- Neustart ohne Verbindung
- Lage, Telematik, Unterstützung, NTP und Handkarten offline
- ausgegraute WK-, Formular-, ToDo- und Admin-Kacheln
- Offline-Meldung beim Klick
- direkter Aufruf einer nicht gecachten Online-Seite
- Update von App und Inhalt
- fehlgeschlagenes Update
- gelöschte oder umbenannte Offline-Ressource

