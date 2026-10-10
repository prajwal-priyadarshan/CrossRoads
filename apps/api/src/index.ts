import 'dotenv/config';
import { createApp } from './app';
import { logger } from './lib/logger';

const port = Number(process.env.PORT ?? 4000);
createApp().listen(port, () => logger.info(`API listening on http://localhost:${port}`));
