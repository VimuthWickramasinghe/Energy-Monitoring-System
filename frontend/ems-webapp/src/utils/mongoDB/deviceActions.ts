"use server";

import { MongoClient } from 'mongodb';

// Ensure this matches your actual env variable in .env.local or uses the fallback provided.
const uri = process.env.MONGODB_URI || "mongodb://prabashan_db_user:NtkbXraBPnwyX6rq@ac-fln1vda-shard-00-00.qmaings.mongodb.net:27017,ac-fln1vda-shard-00-01.qmaings.mongodb.net:27017,ac-fln1vda-shard-00-02.qmaings.mongodb.net:27017/?ssl=true&replicaSet=atlas-e73ytj-shard-0&authSource=admin&appName=EMS-DC1";

// Cache the MongoDB client connection in development to prevent connection exhaustion
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function fetchUserDevicesData(moduleIds: string[]) {
    if (!moduleIds || moduleIds.length === 0) {
        return [];
    }

    try {
        const client = await clientPromise;
        const database = client.db(); 
        
        // As per backend, the data is stored in 'finalVolData'
        // If not found, fallback to the first collection to avoid breaking demo
        const collections = await database.listCollections().toArray();
        let collectionName = "finalVolData";
        
        if (!collections.some(c => c.name === "finalVolData") && collections.length > 0) {
            collectionName = collections[0].name;
        }

        // Querying data for devices that match the requested module IDs
        const query = {
            device_id: { $in: moduleIds }
        };

        // Sort by newest first to get the latest reading
        const data = await database.collection(collectionName)
            .find(query)
            .sort({ time: -1 })
            .limit(100)
            .toArray();
            
        return JSON.parse(JSON.stringify(data));
    } catch (e) {
        console.error("Error fetching device data from MongoDB:", e);
        return [];
    }
}

export async function fetchMongoDemoDataAction() {
    try {
        const client = await clientPromise;
        const database = client.db(); 
        
        const collections = await database.listCollections().toArray();
        let collectionName = "finalVolData";
        
        if (!collections.some(c => c.name === "finalVolData") && collections.length > 0) {
            collectionName = collections[0].name;
        }

        const data = await database.collection(collectionName)
            .find({})
            .sort({ time: -1 })
            .limit(10)
            .toArray();
            
        return JSON.parse(JSON.stringify(data));
    } catch (e) {
        console.error("Error fetching mongo demo data:", e);
        return [];
    }
}