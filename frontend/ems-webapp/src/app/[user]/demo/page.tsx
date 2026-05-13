import { MongoClient } from 'mongodb';

async function getMongoData() {
  const uri = "mongodb://prabashan_db_user:NtkbXraBPnwyX6rq@ac-fln1vda-shard-00-00.qmaings.mongodb.net:27017,ac-fln1vda-shard-00-01.qmaings.mongodb.net:27017,ac-fln1vda-shard-00-02.qmaings.mongodb.net:27017/?ssl=true&replicaSet=atlas-e73ytj-shard-0&authSource=admin&appName=EMS-DC1";
  if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    // Replace 'test' and 'documents' with your actual database and collection names
    const database = client.db();
    const collections = await database.listCollections().toArray();

    // Fetching data from the first available collection as a demo
    if (collections.length > 0) {
      const collectionName = collections[0].name;
      const data = await database.collection(collectionName).find({}).limit(20).toArray();
      return JSON.parse(JSON.stringify(data));
    }

    return [];
  } catch (e) {
    console.error(e);
    return [];
  } finally {
    await client.close();
  }
}

export default async function MongoDemoPage() {
  const data = await getMongoData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">MongoDB Data Demo</h1>
      <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[600px]">
        {data.length > 0 ? (
          <pre className="text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p className="text-red-500">No data found or connection failed. Check your .env file and collection names.</p>
        )}
      </div>
    </div>
  );
}
