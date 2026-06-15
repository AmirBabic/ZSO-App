import { createApp } from './app.js';

const port = Number.parseInt(process.env.PORT || '8081', 10);
const host = process.env.HOST || '0.0.0.0';
const app = createApp();

app.listen(port, host, () => {
  console.log(`ZSO-App läuft auf http://${host}:${port}`);
});
