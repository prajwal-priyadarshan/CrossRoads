import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const port = env.PORT;
createApp().listen(port, () => logger.info(`API listening on http://localhost:${port}`));
