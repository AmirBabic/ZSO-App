import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';

async function withServer(app, callback) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('Öffentliche Übersicht zeigt bestehende Inhalte, aber keine geschützten Kacheln', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, />Lage</);
    assert.match(html, />Telematik</);
    assert.match(html, />Unterstützung</);
    assert.match(html, />NTP</);
    assert.doesNotMatch(html, />Formulare</);
  });
});

test('Telematik-Liste wird aus dem bestehenden Inhalt erzeugt', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/content/telematik`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Antennen/);
    assert.match(html, /Sprechregeln/);
  });
});

test('Geschützte Kacheln werden serverseitig geprüft', async () => {
  const publicApp = createApp();
  await withServer(publicApp, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/formulare`);
    assert.equal(response.status, 403);
  });

  const officerApp = createApp({ roleResolver: () => 'officer' });
  await withServer(officerApp, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/formulare`);
    assert.equal(response.status, 200);
  });
});

test('Service Worker enthält die öffentlichen Offline-Kacheln', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/service-worker.js`);
    const script = await response.text();

    assert.equal(response.status, 200);
    assert.equal(script.includes('/content/lage'), true);
    assert.equal(script.includes('/content/telematik'), true);
    assert.equal(script.includes('/content/unterstuetzung'), true);
    assert.equal(script.includes('/content/ntp'), true);
    assert.equal(script.includes('/formulare'), false);
  });
});
