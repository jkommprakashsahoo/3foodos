import express from 'express';
import { initDatabase } from '../server/db/index.ts';
import apiRouter from '../server/routes/api.ts';

const app = express();
const databaseReady = initDatabase();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/api', apiRouter);

export default async function handler(
  req: express.Request,
  res: express.Response
) {
  await databaseReady;
  return app(req, res);
}
