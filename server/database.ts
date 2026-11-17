import { MongoClient, type Collection } from 'mongodb';
import { createClient, type RedisClientType } from 'redis';
import type { StoreDatabase } from './store';

interface PersistedStoreDocument extends StoreDatabase {
  _id: string;
  updatedAt?: Date;
}

let mongoClient: MongoClient | null = null;
let storeCollection: Collection<PersistedStoreDocument> | null = null;
let redisClient: RedisClientType | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured in .env`);
  return value;
}

export async function connectInfrastructure(): Promise<void> {
  mongoClient = new MongoClient(required('MONGODB_URI'), {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
  });
  await mongoClient.connect();
  const db = mongoClient.db(required('MONGODB_DB_NAME'));
  storeCollection = db.collection<PersistedStoreDocument>(required('MONGODB_STORE_COLLECTION'));

  redisClient = createClient({
    url: required('REDIS_URL'),
    socket: {
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 10000),
      reconnectStrategy: (retries) => Math.min(retries * 250, 3000),
    },
  });
  redisClient.on('error', (error) => console.error('Redis error:', error.message));
  await redisClient.connect();
}

export async function readPersistedStore(): Promise<StoreDatabase | null> {
  if (!storeCollection) throw new Error('MongoDB is not connected');
  const doc = await storeCollection.findOne({ _id: 'primary' });
  if (!doc) return null;
  const { _id: _ignored, updatedAt: _updatedAt, ...store } = doc;
  return store;
}

export function persistStoreSnapshot(store: StoreDatabase): Promise<void> {
  if (!storeCollection) return Promise.reject(new Error('MongoDB is not connected'));
  const snapshot = structuredClone(store) as StoreDatabase;
  writeQueue = writeQueue.then(async () => {
    await storeCollection!.updateOne(
      { _id: 'primary' },
      { $set: { ...snapshot, updatedAt: new Date() } },
      { upsert: true },
    );
  });
  return writeQueue;
}

export function getRedis(): RedisClientType {
  if (!redisClient?.isReady) throw new Error('Redis is not connected');
  return redisClient;
}

export async function infrastructureHealth(): Promise<{ mongodb: boolean; redis: boolean }> {
  const mongodb = Boolean(mongoClient);
  let redis = false;
  try { redis = Boolean(redisClient?.isReady && (await redisClient.ping()) === 'PONG'); } catch { redis = false; }
  if (mongodb) await mongoClient!.db(required('MONGODB_DB_NAME')).command({ ping: 1 });
  return { mongodb, redis };
}

export async function closeInfrastructure(): Promise<void> {
  await writeQueue;
  await redisClient?.quit();
  await mongoClient?.close();
}
