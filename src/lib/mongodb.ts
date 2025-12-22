import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const uri = process.env.MONGODB_URI;

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri, {
      tls: true,
      serverSelectionTimeoutMS: 5000, // Fail fast if IP is not whitelisted
    });
  }

  await client.connect();

  db = client.db(); // default DB from URI
  return db;
}


