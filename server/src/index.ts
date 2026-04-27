import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/database';
import app from './app';
import { logger } from './logger';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
  });
};

start();
