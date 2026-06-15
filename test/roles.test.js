import test from 'node:test';
import assert from 'node:assert/strict';
import { hasMinimumRole, isKnownRole } from '../src/roles.js';

test('Rollen folgen der festgelegten Hierarchie', () => {
  assert.equal(hasMinimumRole('public', 'public'), true);
  assert.equal(hasMinimumRole('zso', 'public'), true);
  assert.equal(hasMinimumRole('officer', 'nonCommissionedOfficer'), true);
  assert.equal(hasMinimumRole('zso', 'officer'), false);
  assert.equal(hasMinimumRole('admin', 'officer'), true);
});

test('Unbekannte Rollen erhalten keinen Zugriff', () => {
  assert.equal(isKnownRole('unknown'), false);
  assert.equal(hasMinimumRole('unknown', 'public'), false);
  assert.equal(hasMinimumRole('admin', 'unknown'), false);
});
