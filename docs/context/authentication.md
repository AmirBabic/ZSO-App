# Authentifizierung, Passwörter und Rollen

## Grundregeln

- Passwortdaten bleiben ausschliesslich auf dem Server.
- Die PWA erhält niemals `auth.yaml` oder Passwort-Hashes.
- Passwörter werden niemals im Klartext gespeichert oder protokolliert.
- Admin-Zugänge sind immer persönlich.
- Gruppenzugänge sind möglich, können aber keine Person sicher identifizieren.
- Berechtigungen gelten pro Kachel, nicht pro Datei oder Einzelaktion.
- Anmeldung und geschützte Funktionen sind online-only.

## Rollenhierarchie

```text
public < zso < nonCommissionedOfficer < officer < admin
```

Technisch wird jeder Rolle ein fester Rang zugeordnet:

```yaml
roles:
  public: 0
  zso: 1
  nonCommissionedOfficer: 2
  officer: 3
  admin: 4
```

Jede Kachel besitzt eine minimale Rolle. Zugriff besteht, wenn der Rollenrang
mindestens `minimumRole` entspricht.

## Admin-Sonderregel

Admin:

- hat immer Zugriff auf alle Kacheln, Formulare, ToDos und WK-Daten
- besitzt alle administrativen Funktionen
- wird in fachlichen Zielauswahlen nie als Option angezeigt
- wird insbesondere nicht in der Formular-Lesestufe oder ToDo-Zielrolle
  angeboten

Admin-Zugriff ist implizit und muss nicht in jedem Datensatz gespeichert werden.

## Kachelbeispiele

```yaml
tiles:
  - id: lage
    minimumRole: public
    offline: true

  - id: forms
    minimumRole: zso
    offline: false

  - id: officer-info
    minimumRole: officer
    offline: false

  - id: admin
    minimumRole: admin
    offline: false
```

Die bestehenden Kacheln Lage, Telematik, Unterstützung und NTP sind
`public` und `offline: true`.

## Benutzer- und Gruppendatei

Beispiel für `data/auth.yaml`:

```yaml
version: 1

roles:
  public: 0
  zso: 1
  nonCommissionedOfficer: 2
  officer: 3
  admin: 4

principals:
  - id: group-zso-wk-2026
    type: group
    role: zso
    displayName: ZSO WK 2026
    passwordHash: "$argon2id$..."
    enabled: true
    validUntil: "2026-12-31T23:59:59Z"

  - id: group-officer-wk-2026
    type: group
    role: officer
    displayName: Offiziere WK 2026
    passwordHash: "$argon2id$..."
    enabled: true
    validUntil: "2026-12-31T23:59:59Z"

  - id: admin-amir
    type: user
    role: admin
    username: amir
    displayName: Amir
    passwordHash: "$argon2id$..."
    enabled: true
```

Die Datei liegt ausserhalb des statischen Webroots.

## Passwortmanagement

### Hashing

- Argon2id verwenden.
- Pro Passwort wird automatisch ein eigener Salt erzeugt.
- Parameter werden anhand der Zielhardware festgelegt und dokumentiert.
- Hashes bei erfolgreicher Anmeldung aktualisieren, wenn neue Parameter gelten.
- Keine selbst entworfene Verschlüsselung und kein schneller SHA-Hash.

### Gruppenzugangscodes

- separate Codes für ZSO User, Unteroffiziere und Offiziere
- zeitliche Gültigkeit pro WK oder definierter Periode
- sofortige Rotation bei Weitergabe an unberechtigte Personen
- niemals denselben Code für Admin-Zugang verwenden
- Loginversuche serverseitig begrenzen und protokollieren

Der konkrete Rotationszeitraum wird noch festgelegt.

### Admin-Zugänge

- persönlicher Benutzername
- eigenes Passwort
- keine gemeinsam verwendeten Admin-Konten
- Änderungen an Benutzern und Rollen protokollieren

## Anmeldung und Sitzung

1. Benutzer sendet Benutzername beziehungsweise Gruppen-ID und Passwort über
   HTTPS.
2. Server prüft Passwort-Hash, Gültigkeit, Sperrstatus und Rate Limit.
3. Server erstellt eine serverseitige Sitzung.
4. Der Browser erhält nur ein sicheres Session-Cookie.
5. Jede geschützte Route prüft Sitzung, Rolle und Kachel.

Empfohlene Cookie-Eigenschaften:

```text
HttpOnly
Secure
SameSite=Lax
```

Die Sitzung kann im Prozessspeicher liegen. Ein Serverneustart meldet Benutzer
dann ab; das ist für die erste Version vertretbar.

## Offline-Verhalten

Es gibt keine Offline-Anmeldung und keine lokal gespeicherte Berechtigung.

Bei fehlender Verbindung:

- Login ist deaktiviert.
- geschützte Kacheln sind nicht offline verfügbar
- Online-Funktionen werden ausgegraut
- gecachte öffentliche Kacheln bleiben lesbar

## Kachelzugriff

Eine gemeinsame Middleware erhält die Kachel-ID:

```text
requireTileAccess("forms")
```

Sie prüft Sitzung und `minimumRole`. Alle Unterrouten derselben Kachel
verwenden dieselbe Middleware.

## WK-Eintragung

Die WK-Kachel ist online-only. Neben der Rollenprüfung muss der Principal für
den aktuellen WK eingetragen sein. Diese Bedingung gilt für die gesamte
Kachel.

Admin hat unabhängig von der Eintragung Zugriff. Der konkrete administrative
Prozess für Eintragung und Entfernung wird noch definiert.

## Identität bei Formularen

Formulare speichern immer:

- Principal-ID
- Principal-Typ
- aktuelle Rolle aus der Sitzung
- optional eingegebenen Sendernamen

Bei Gruppenzugängen ist der Sendername nicht verifiziert. Die gespeicherte
Rolle ist nach dem Senden unveränderlich.

## Secrets

Folgende Werte gehören nicht in Git:

- Session-Schlüssel
- Passwort-Pepper, falls verwendet
- TLS-Private-Keys
- Produktionskonfiguration mit geheimen Werten

Sie werden über geschützte Umgebungsvariablen oder den Secret Store des
Betriebssystems bereitgestellt.

