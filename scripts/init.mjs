import { MongoClient } from "mongodb";
import {
  MONGO_CONNECTION_STRING,
  MONGO_DATABASE,
  MONGO_GRAIN_COLLECTION,
  MONGO_INDEX_COLLECTION
} from "./const.cjs";

async function init() {
  
  const client = new MongoClient(MONGO_CONNECTION_STRING);
  
  try {
    await client.db(MONGO_DATABASE).dropDatabase();

    const grain = client.db(MONGO_DATABASE).collection(MONGO_GRAIN_COLLECTION);
    const index = client.db(MONGO_DATABASE).collection(MONGO_INDEX_COLLECTION);

    await grain.createIndex({ "linked.osm": 1 });
    await grain.createIndex({ "linked.wikidata": 1 });
    await grain.createIndex({ "location": "2dsphere" });
  }
  finally { await client.close(); }
}

init();
