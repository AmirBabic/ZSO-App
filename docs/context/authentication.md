# Authentifizierung, Passwoerter und Rollen

## Grundregeln

- Passwortdaten bleiben ausschliesslich auf dem Server.
- Die PWA erhaelt niemals `auth.yaml` oder Passwort-Hashes.
- Passwoerter werden niemals im Klartext gespeichert oder protokolliert.
- Admin-Zugaenge sind immer persoenlich.
- Gruppenzugaenge sind moeglich, koennen aber keine Person sicher identifizieren.
- Berechtigungen gelten pro Kachel, nicht pro Datei oder Einzelaktion.
- Anmeldung und geschuetzte Funktionen sind online-only.

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

Jede Kachel besitzt genau eine minimale Rolle:

```yaml
tiles:
  - id: handcards
    minimumRole: public
    offline: true

  - id: forms
    minimumRole: zso
    offline: false

  - id: officer-info
    minimumRole: officer
    offline: false
```

Eine Rolle darf auf die Kachel zugreifen, wenn ihr Rang mindestens dem Rang von
`minimumRole` entspricht. Damit wird keine Liste granularer Permissions
benoetigt.

## Benutzer- und Gruppendatei

Beispiel fuer `data/auth.yaml`:

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

Die Datei liegt ausserhalb des statischen Webroots. Express liest sie
serverseitig und liefert nur notwendige Profildaten aus.

## Passwortmanagement

### Hashing

- Argon2id verwenden.
- Pro Passwort wird automatisch ein eigener Salt erzeugt.
- Parameter werden anhand der Zielhardware festgelegt und dokumentiert.
- Hashes bei erfolgreicher Anmeldung aktualisieren, wenn neue Parameter gelten.
- Keine selbst entworfene Verschluesselung und kein schneller SHA-Hash.

### Gruppenzugangscodes

- separate Codes fuer ZSO User, Unteroffiziere und Offiziere
- zeitliche Gueltigkeit pro WK oder definierter Periode
- sofortige Rotation bei Weitergabe an unberechtigte Personen
- niemals denselben Code fuer Admin-Zugang verwenden
- Loginversuche serverseitig begrenzen und protokollieren

### Admin-Zugaenge

- persoenlicher Benutzername
- eigenes Passwort
- keine gemeinsam verwendeten Admin-Konten
- Aenderungen an Benutzern und Rollen protokollieren

## Anmeldung und Sitzung

1. Benutzer sendet Benutzername beziehungsweise Gruppen-ID und Passwort ueber
   HTTPS.
2. Server prueft Passwort-Hash, Gueltigkeit, Sperrstatus und Rate Limit.
3. Server erstellt eine normale serverseitige Sitzung.
4. Der Browser erhaelt nur ein sicheres Session-Cookie.
5. Jede geschuetzte Route prueft Sitzung, Rolle und Kachel.

Empfohlene Cookie-Eigenschaften:

```text
HttpOnly
Secure
SameSite=Lax
```

Die Sitzung kann in einer kleinen serverseitigen JSON-Datei oder im
Prozessspeicher liegen. Prozessspeicher ist einfacher, meldet Benutzer bei einem
Serverneustart jedoch ab. Das ist fuer die erste Version vertretbar.

## Offline-Verhalten

Es gibt keine Offline-Anmeldung und keine lokal gespeicherte
Offline-Berechtigung.

Bei fehlender Verbindung:

- Loginformular beziehungsweise Loginaktion ist deaktiviert.
- geschuetzte Kacheln sind nicht offline verfuegbar
- Online-Funktionen werden ausgegraut
- bereits gecachte oeffentliche Kacheln bleiben lesbar

Damit kann eine serverseitige Sperrung nicht durch alte lokale
Berechtigungsdaten umgangen werden.

## Kachelzugriff

Eine gemeinsame Middleware erhaelt die Kachel-ID:

```text
requireTileAccess("forms")
```

Sie prueft:

1. Existiert die Kachel?
2. Ist eine Anmeldung erforderlich?
3. Besitzt die aktuelle Rolle mindestens `minimumRole`?
4. Ist die Funktion online erreichbar?

Alle Unterrouten derselben Kachel verwenden dieselbe Middleware.

## Identitaet bei Formularen

Bei Gruppenzugaengen kann der Server nur die Gruppe identifizieren. Eine
optionale Namensangabe ist nicht verifiziert:

```json
{
  "principalId": "group-zso-wk-2026",
  "principalType": "group",
  "submittedName": "Max Muster",
  "nameVerified": false
}
```

Formulare mit rechtlicher, personeller oder disziplinarischer Bedeutung
benoetigen einen persoenlichen Account oder einen separaten
Identitaetsnachweis.

## Secrets

Folgende Werte gehoeren nicht in Git:

- Session-Schluessel
- Passwort-Pepper, falls verwendet
- TLS-Private-Keys
- Produktionskonfiguration mit geheimen Werten

Sie werden ueber geschuetzte Umgebungsvariablen oder den Secret Store des
Betriebssystems bereitgestellt.

