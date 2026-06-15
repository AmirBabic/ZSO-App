export const ROLE_RANKS = Object.freeze({
  public: 0,
  zso: 1,
  nonCommissionedOfficer: 2,
  officer: 3,
  admin: 4
});

export function isKnownRole(role) {
  return Object.hasOwn(ROLE_RANKS, role);
}

export function hasMinimumRole(actualRole, minimumRole) {
  if (!isKnownRole(actualRole) || !isKnownRole(minimumRole)) {
    return false;
  }

  return ROLE_RANKS[actualRole] >= ROLE_RANKS[minimumRole];
}
