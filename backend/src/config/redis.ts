import { createClient, RedisClientType } from 'redis';
import { config } from './index';
import logger from '@utils/logger';

let redisClient: RedisClientType;

export const initRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));

    await redisClient.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.error('Failed to connect to Redis', err);
    throw err;
  }
};

export const getRedis = () => redisClient;
export default redisClient;
