import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis disabled for development/testing. Export a dummy object.
const redisClient = {
  get: async () => null,
  set: async () => {},
};

export default redisClient;
