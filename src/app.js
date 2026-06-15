import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { engine } from 'express-handlebars';
import { loadTiles } from './config.js';
import { ContentRepository } from './content.js';
import { buildPrecacheUrls, renderServiceWorker } from './offline.js';
import { hasMinimumRole } from './roles.js';
import { createVersionInfo } from './version.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '..');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
);

function defaultRoleResolver() {
  return 'public';
}

export function createApp({
  roleResolver = defaultRoleResolver,
  tilesPath = path.join(projectRoot, 'data', 'tiles.yaml'),
  contentRoot = path.join(projectRoot, 'node-app', 'content')
} = {}) {
  const app = express();
  const tiles = loadTiles(tilesPath);
  const contentRepository = new ContentRepository(contentRoot);
  const contentTiles = tiles.filter((tile) => tile.kind === 'content');
  const version = createVersionInfo({
    appVersion: packageJson.version,
    contentVersion: contentRepository.contentVersion(contentTiles)
  });
  const precacheUrls = buildPrecacheUrls({ tiles, contentRepository });

  app.disable('x-powered-by');
  app.engine('hbs', engine({
    defaultLayout: 'main',
    extname: 'hbs'
  }));
  app.set('view engine', 'hbs');
  app.set('views', path.join(projectRoot, 'views'));

  app.use('/assets', express.static(path.join(projectRoot, 'public'), {
    fallthrough: false,
    maxAge: '1h'
  }));

  app.use((request, response, next) => {
    const role = roleResolver(request);
    request.zsoRole = role;
    response.locals.version = version;
    response.locals.currentRole = role;
    next();
  });

  function visibleTiles(request) {
    return tiles
      .filter((tile) => hasMinimumRole(request.zsoRole, tile.minimumRole))
      .map((tile) => ({
        ...tile,
        onlineOnly: !tile.offline
      }));
  }

  function findAccessibleTile(request, tileId) {
    const tile = tiles.find((candidate) => candidate.id === tileId);

    if (!tile || !hasMinimumRole(request.zsoRole, tile.minimumRole)) {
      return null;
    }

    return tile;
  }

  app.get('/', (request, response) => {
    response.render('home', {
      title: 'Übersicht',
      tiles: visibleTiles(request)
    });
  });

  app.get('/content/:tileId', (request, response, next) => {
    try {
      const tile = findAccessibleTile(request, request.params.tileId);

      if (!tile || tile.kind !== 'content') {
        return response.status(404).render('error', {
          title: 'Nicht gefunden',
          message: 'Dieser Inhaltsbereich ist nicht verfügbar.'
        });
      }

      return response.render('content-list', {
        title: tile.title,
        tile,
        entries: contentRepository.list(tile)
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/content/:tileId/:fileName', (request, response, next) => {
    try {
      const tile = findAccessibleTile(request, request.params.tileId);

      if (!tile || tile.kind !== 'content') {
        return response.status(404).render('error', {
          title: 'Nicht gefunden',
          message: 'Dieser Inhaltsbereich ist nicht verfügbar.'
        });
      }

      const content = contentRepository.read(tile, request.params.fileName);
      if (!content) {
        return response.status(404).render('error', {
          title: 'Nicht gefunden',
          message: 'Der angeforderte Inhalt wurde nicht gefunden.'
        });
      }

      if (content.kind === 'file') {
        return response.sendFile(content.filePath);
      }

      return response.render('content', {
        title: content.title,
        tile,
        contentHtml: content.html
      });
    } catch (error) {
      return next(error);
    }
  });

  for (const tile of tiles.filter((candidate) => candidate.kind === 'placeholder')) {
    app.get(tile.route, (request, response) => {
      const accessibleTile = findAccessibleTile(request, tile.id);

      if (!accessibleTile) {
        return response.status(403).render('error', {
          title: 'Kein Zugriff',
          message: 'Für diese Kachel fehlt die erforderliche Rolle.'
        });
      }

      return response.render('placeholder', {
        title: accessibleTile.title,
        tile: accessibleTile
      });
    });
  }

  app.get('/offline', (request, response) => {
    response.render('offline', {
      title: 'Offline'
    });
  });

  app.get('/manifest.webmanifest', (request, response) => {
    response.type('application/manifest+json').send({
      name: 'ZSO-App',
      short_name: 'ZSO',
      lang: 'de-CH',
      start_url: '/',
      display: 'standalone',
      background_color: '#f4f1e8',
      theme_color: '#b32317',
      icons: []
    });
  });

  app.get('/service-worker.js', (request, response) => {
    response
      .type('text/javascript')
      .set('Cache-Control', 'no-cache')
      .send(renderServiceWorker({
        cacheVersion: version.cacheVersion,
        precacheUrls
      }));
  });

  app.get('/health', (request, response) => {
    response.send({
      status: 'ok',
      version
    });
  });

  app.use((request, response) => {
    response.status(404).render('error', {
      title: 'Nicht gefunden',
      message: 'Die angeforderte Seite wurde nicht gefunden.'
    });
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }

    console.error(error);
    return response.status(500).render('error', {
      title: 'Fehler',
      message: 'Die Anfrage konnte nicht verarbeitet werden.'
    });
  });

  return app;
}
