import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTiles } from '../src/config.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '..');

test('Kachelkonfiguration enthält die vier bestehenden Offline-Bereiche', () => {
  const tiles = loadTiles(path.join(projectRoot, 'data', 'tiles.yaml'));
  const offlinePublicIds = tiles
    .filter((tile) => tile.offline && tile.minimumRole === 'public')
    .map((tile) => tile.id);

  for (const id of ['lage', 'telematik', 'unterstuetzung', 'ntp']) {
    assert.ok(offlinePublicIds.includes(id), `${id} muss öffentlich und offline sein`);
  }
});

test('Online-Funktionen sind nicht als offline markiert', () => {
  const tiles = loadTiles(path.join(projectRoot, 'data', 'tiles.yaml'));

  for (const id of ['wk', 'formulare', 'todos', 'administration']) {
    const tile = tiles.find((candidate) => candidate.id === id);
    assert.ok(tile, `${id} fehlt`);
    assert.equal(tile.offline, false);
  }
});
