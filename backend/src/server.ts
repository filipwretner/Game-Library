import 'dotenv/config';
import { createApp } from './app.js';
import { buildContainer } from './container.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const container = buildContainer(env);
const app = createApp(container);

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
