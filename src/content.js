import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { ensureInside } from './config.js';

const MARKDOWN_EXTENSION = '.md';
const CACHED_MEDIA_EXTENSIONS = new Set([
  '.gif',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.svg',
  '.txt',
  '.webp'
]);

function normalize(value) {
  return value.normalize('NFC').toLocaleLowerCase('de-CH');
}

function displayName(fileName) {
  return path.basename(fileName, path.extname(fileName)).replaceAll('_', ' ');
}

export class ContentRepository {
  constructor(contentRoot) {
    this.contentRoot = path.resolve(contentRoot);
  }

  resolveTileDirectory(configuredName) {
    const entries = fs.readdirSync(this.contentRoot, { withFileTypes: true });
    const match = entries.find((entry) => (
      entry.isDirectory() && normalize(entry.name) === normalize(configuredName)
    ));

    if (!match) {
      throw new Error(`Inhaltsordner nicht gefunden: ${configuredName}`);
    }

    return path.join(this.contentRoot, match.name);
  }

  list(tile) {
    const directory = this.resolveTileDirectory(tile.directory);

    return fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === MARKDOWN_EXTENSION)
      .map((entry) => ({
        fileName: entry.name,
        title: displayName(entry.name),
        url: `${tile.route}/${encodeURIComponent(entry.name)}`
      }))
      .sort((left, right) => left.title.localeCompare(right.title, 'de-CH'));
  }

  read(tile, requestedFileName) {
    const directory = this.resolveTileDirectory(tile.directory);
    const fileName = path.basename(requestedFileName);
    const filePath = path.resolve(directory, fileName);

    if (!ensureInside(directory, filePath) || !fs.existsSync(filePath)) {
      return null;
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return null;
    }

    const extension = path.extname(fileName).toLowerCase();

    if (extension === MARKDOWN_EXTENSION) {
      const source = fs.readFileSync(filePath, 'utf8');
      return {
        kind: 'markdown',
        title: displayName(fileName),
        html: marked.parse(source),
        filePath
      };
    }

    return {
      kind: 'file',
      title: fileName,
      filePath
    };
  }

  offlineUrls(tile) {
    const directory = this.resolveTileDirectory(tile.directory);
    const urls = [tile.route];

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (extension === MARKDOWN_EXTENSION || CACHED_MEDIA_EXTENSIONS.has(extension)) {
        urls.push(`${tile.route}/${encodeURIComponent(entry.name)}`);
      }
    }

    return urls;
  }

  contentVersion(tiles) {
    let latestModifiedTime = 0;

    for (const tile of tiles.filter((candidate) => candidate.kind === 'content')) {
      const directory = this.resolveTileDirectory(tile.directory);

      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (!entry.isFile()) {
          continue;
        }

        const stat = fs.statSync(path.join(directory, entry.name));
        latestModifiedTime = Math.max(latestModifiedTime, stat.mtimeMs);
      }
    }

    return latestModifiedTime > 0
      ? new Date(latestModifiedTime).toISOString()
      : 'no-content';
  }
}
