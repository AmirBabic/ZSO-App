# Authentifizierung, Passwoerter und Rollen

## Grundregeln

- Passwortdaten bleiben ausschliesslich auf dem Server.
- Die PWA erhaelt niemals `auth.yaml` oder Passwort-Hashes.
- Passwoerter werden niemals im Klartext gespeichert oder protokolliert.
- Admin-Zugaenge sind immer persoenlich.
- Gruppenzugaenge sind moeglich, koennen aber keine Person sicher identifizieren.
- Rollen werden in konkrete Berechtigungen aufgeloest.

## Rollen

Vorgesehene Hierarchie:

```text
public
  -> zso
      -> nonCommissionedOfficer
          -> officer
              -> admin
```

Eine reine Hierarchie reicht langfristig nicht fuer alle Regeln. Intern sollte
die Anwendung deshalb Berechtigungen pruefen:

```text
content.public.read
content.internal.read
content.uof.read
content.officer.read
forms.create
forms.submit
todos.read
todos.create
todos.assign
users.manage
```

Rollen sind Sammlungen solcher Berechtigungen.

## Benutzer- und Gruppendatei

Beispiel fuer `data/auth.yaml`:

```yaml
version: 1

roles:
  public:
    permissions:
      - content.public.read

  zso:
    inherits: public
    permissions:
      - content.internal.read
      - forms.create
      - forms.submit
      - todos.read

  nonCommissionedOfficer:
    inherits: zso
    permissions:
      - content.uof.read
      - todos.create

  officer:
    inherits: nonCommissionedOfficer
    permissions:
      - content.officer.read
      - todos.assign

  admin:
    inherits: officer
    permissions:
      - users.manage

principals:
  - id: group-zso-wk-2026
    type: group
    role: zso
    displayName: ZSO WK 2026
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

Die Datei darf nicht durch den statischen Webserver ausgeliefert werden. Der
Serverprozess laedt sie und gibt nur notwendige, nicht sensitive Profildaten
zurueck.

## Passwortmanagement

### Hashing

- Argon2id verwenden.
- Pro Passwort wird automatisch ein eigener Salt erzeugt.
- Parameter werden anhand der Zielhardware festgelegt und dokumentiert.
- Hashes werden bei erfolgreicher Anmeldung aktualisiert, wenn neue Parameter
  gelten.
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
- kurze Online-Sitzung
- Aenderungen an Benutzern und Rollen im Audit-Protokoll erfassen

## Online-Anmeldung

1. Geraet sendet Benutzername beziehungsweise Gruppen-ID und Passwort ueber
   HTTPS.
2. Server prueft Hash, Gueltigkeit, Sperrstatus und Rate Limit.
3. Server gibt eine kurzlebige Online-Sitzung sowie optional eine signierte
   Offline-Berechtigung aus.
4. Die App speichert keine eingegebenen Passwoerter.

## Offline-Anmeldung

Eine erste Anmeldung muss online erfolgen. Danach kann der Server eine
signierte Berechtigung ausstellen:

```json
{
  "subject": "group-zso-wk-2026",
  "principalType": "group",
  "role": "zso",
  "permissions": [
    "content.public.read",
    "content.internal.read",
    "forms.create"
  ],
  "deviceId": "73b6...",
  "issuedAt": "2026-06-15T12:00:00Z",
  "expiresAt": "2026-06-22T12:00:00Z"
}
```

Die Berechtigung wird vom Server signiert. Die PWA kann sie mit einem
eingebetteten oeffentlichen Schluessel pruefen, aber nicht selbst erweitern oder
neu ausstellen.

Optional kann ein lokaler PIN den Zugriff auf die gespeicherte Berechtigung und
lokale Arbeitsdaten erschweren. Ein PIN ersetzt keine Serveranmeldung und bietet
in einer normalen PWA keinen mit einem verwalteten Betriebssystemschluessel
vergleichbaren Schutz.

## Sperrung und Ablauf

Ein bereits offline befindliches Geraet kann eine serverseitige Sperrung nicht
sofort erfahren. Darum muss jede Offline-Berechtigung ablaufen.

Die konkrete Dauer ist fachlich festzulegen. Beispiel:

- Gruppenzugang: maximal 7 Tage offline
- persoenlicher Offizierszugang: maximal 3 Tage offline
- Admin-Funktionen: keine Offline-Benutzerverwaltung

Benutzerverwaltung kann offline vorbereitet werden, Aenderungen werden aber
erst nach Serverkontakt wirksam.

## Inhaltszugriff

Geschuetzte Inhalte muessen in getrennten Paketen ausgeliefert werden. Eine
Datei ist nicht geschuetzt, wenn sie bereits oeffentlich heruntergeladen wurde
und lediglich in der Navigation ausgeblendet wird.

Vor jedem Paketdownload prueft die API:

- gueltige Berechtigung
- erforderliche Permission
- Gueltigkeitszeitraum
- optional Organisationszugehoerigkeit

## Identitaet bei Formularen

Bei Gruppenzugaengen kann der Server nur die Gruppe und das Geraet erkennen.
Moegliche Kennzeichnung:

```json
{
  "authenticatedPrincipal": "group-zso-wk-2026",
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

- Signaturschluessel
- Passwort-Pepper, falls verwendet
- TLS-Private-Keys
- Produktionskonfiguration mit geheimen Werten

Sie werden ueber geschuetzte Umgebungsvariablen oder einen Secret Store des
Betriebssystems bereitgestellt.

