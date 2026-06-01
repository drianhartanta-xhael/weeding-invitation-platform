import express from 'express';
import cors from 'cors';
import path from 'path';
import pinoHttp from 'pino-http';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './logger';
import { r2Configured } from './lib/r2';

const app = express();

app.use(pinoHttp({ logger }));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!r2Configured) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(errorHandler);

export default app;
