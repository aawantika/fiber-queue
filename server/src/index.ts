import './env.js';

import express from 'express';
import { imagesDir } from './db/client.js';
import { migrate } from './db/migrate.js';
import { projectsRouter } from './routes/projects.js';
import { yarnsRouter } from './routes/yarns.js';

migrate();

const app = express();
app.use(express.json());
app.use('/images', express.static(imagesDir));

app.use('/api/projects', projectsRouter);
app.use('/api/yarns', yarnsRouter);

const PORT = 4201;
const HOST = '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`fiber-queue server listening on http://${HOST}:${PORT}`);
});
