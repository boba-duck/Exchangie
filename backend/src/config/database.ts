import pg from 'pg';
import { config } from './index';
import logger from '@utils/logger';

const { Pool } = pg;

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  ssl: config.db.ssl,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
export const getClient = () => pool.connect();

export default pool;
