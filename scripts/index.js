import { MongoClient } from "mongodb";
import {
  MONGO_CONNECTION_STRING,
  MONGO_DATABASE,
  MONGO_GRAIN_COLLECTION,
  MONGO_INDEX_COLLECTION
} from "./const.js";

/**
 * Extracts existing unique values for a given item.
 */

const client = new MongoClient(MONGO_CONNECTION_STRING);

async function construct() {

  const grain = client.db(MONGO_DATABASE).collection(MONGO_GRAIN_COLLECTION);
  const index = client.db(MONGO_DATABASE).collection(MONGO_INDEX_COLLECTION);

  const pairs = [
    [ "keywords", "keywords" ],
    [ "tags.clothes", "clothes" ],
    [ "tags.cuisine", "cuisine" ],
    [ "tags.rental", "rental" ]
  ];

  try {

    for (let [ source, target ] of pairs) {

      console.log(`Index @${target} is being constructed...`);

      const result = new Map();

      let tstamp = Date.now();
      process.stdout.write(" > ");

      let gc = grain.find({ [source]: { $exists: true } }).project({ [source]: 1 });
  
      while (await gc.hasNext()) {

        let res = await gc.next();
        let arr = source.split('.').reduce((a, b) => a[b], res);

        arr.forEach((word) => {

          if (!result.has(word)) { result.set(word, 0); }
          result.set(word, result.get(word) + 1);
          if (Date.now() - tstamp >= 1000) { tstamp = Date.now(); process.stdout.write('.'); }
        });
      }

      await gc.close();

      const obj = [ ...result.keys() ]
        .map((key) => { return { value: key, count: result.get(key) }; })

      await index.updateOne({ _id: target }, { $set: { values: obj } }, { upsert: true });

      console.log();
      console.log(`Finished index @${target}, total ${obj.length} items extracted.`);
    }
  }
  catch (err) { console.log(err); }
  finally { await client.close(); }
}

construct();
