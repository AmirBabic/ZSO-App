import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

export function loadYaml(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  return parse(source);
}

export function loadTiles(filePath) {
  const config = loadYaml(filePath);

  if (!config || !Array.isArray(config.tiles)) {
    throw new Error(`Ungültige Kachelkonfiguration: ${filePath}`);
  }

  const seenIds = new Set();

  for (const tile of config.tiles) {
    if (!tile.id || !tile.title || !tile.route || !tile.minimumRole) {
      throw new Error(`Unvollständige Kachelkonfiguration in ${filePath}`);
    }

    if (seenIds.has(tile.id)) {
      throw new Error(`Doppelte Kachel-ID: ${tile.id}`);
    }

    seenIds.add(tile.id);
  }

  return config.tiles;
}

export function ensureInside(basePath, candidatePath) {
  const relative = path.relative(basePath, candidatePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
