# Offline-Verhalten

## Grundsatz

Offline ist ein reiner Lesemodus. Es werden keine veraenderlichen
Anwendungsdaten lokal gespeichert und spaeter synchronisiert.

Damit entfallen:

- IndexedDB
- lokale ToDos
- lokale Formularentwuerfe
- Sync-Queue
- Konfliktbehandlung
- Background Sync
- Offline-Benutzerverwaltung

## Offlinefaehige Kacheln

Jede Kachel besitzt genau ein Flag:

```yaml
offline: true
```

Nur solche Kacheln werden vom Service Worker vorgeladen. Der Cache umfasst:

- Startseite und Offline-Hinweisseite
- gemeinsames CSS und notwendiges JavaScript
- HTML-Seiten der Kachel
- Bilder und ausgewaehlte PDFs der Kachel
- Manifest und App-Icons

Die Liste wird beim Serverstart oder Deployment aus der Kachelstruktur erzeugt.
Jede Version erhaelt einen neuen Cache-Namen mit Build-Timestamp oder
Inhaltsversion.

## Online-only-Kacheln

Kacheln mit `offline: false` sind bei fehlender Verbindung sichtbar, aber:

- optisch ausgegraut
- mit einem Offline-Symbol gekennzeichnet
- nicht normal navigierbar
- beim Klick mit einer Meldung versehen

Vorgeschlagener Text:

> Diese Funktion ist nur mit einer Internetverbindung verfuegbar.

Online-only sind mindestens:

- Anmeldung
- Formulare
- ToDos
- Administration und Usermanagement

## Geschuetzte Inhalte

In der ersten Version werden nur oeffentliche Kacheln offline gespeichert.
Geschuetzte Kacheln benoetigen eine aktuelle serverseitige Sitzung und sind
deshalb online-only.

Der Grund ist technisch relevant: Sobald geschuetzte Dateien in einem
Browsercache liegen, koennen serverseitige Rollen- und Sperraenderungen offline
nicht mehr verlaesslich durchgesetzt werden. Eine sichere Offline-Freigabe
wuerde lokale Berechtigungs- und Schluesselverwaltung erfordern und widerspricht
dem Ziel einer flachen Architektur.

## Erkennung der Verbindung

Die Oberflaeche kann `navigator.onLine` fuer eine schnelle Anzeige verwenden.
Vor einer Online-Aktion ist trotzdem eine echte Serveranfrage massgebend, da
`navigator.onLine` nur eine vorhandene Netzwerkverbindung und nicht die
Erreichbarkeit des Servers meldet.

Bei einem fehlgeschlagenen Online-Aufruf:

1. Eingaben nicht als erfolgreich darstellen.
2. Eine klare Offline-/Verbindungsfehlermeldung anzeigen.
3. Keine lokale Kopie als ausstehenden Auftrag speichern.
4. Benutzer auf derselben Seite lassen, soweit dies ohne Datenverlust moeglich
   ist.

## Update-Verhalten

- Cache-Namen enthalten die App- oder Inhaltsversion.
- Ein neuer Service Worker laedt zuerst alle Pflichtdateien.
- Erst nach erfolgreichem Download wird die neue Version aktiviert.
- Alte Caches werden nach Aktivierung entfernt.
- Fehlerhafte Einzeldateien duerfen nicht unbemerkt zu einem halben Update
  fuehren.

## Tests

Mindestens zu testen sind:

- Erstinstallation online
- Neustart ohne Verbindung
- jede `offline: true` Kachel ohne Verbindung
- ausgegraute Online-Kacheln
- Offline-Meldung beim Klick
- direkter Aufruf einer nicht gecachten Online-Seite
- Update von App und Inhalt
- fehlgeschlagenes Update
- geloeschte oder umbenannte Offline-Ressource

