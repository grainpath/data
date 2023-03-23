import consola from "consola";
import { MongoClient } from "mongodb";
import {
  MONGO_CONNECTION_STRING,
  MONGO_DATABASE,
  MONGO_GRAIN_COLLECTION
} from "./const.cjs";

async function snake() {

  let cnt = 0, tot = 0;
  const logger = consola.create();

  const client = new MongoClient(MONGO_CONNECTION_STRING);
  const collection = client.db(MONGO_DATABASE).collection(MONGO_GRAIN_COLLECTION);

  logger.info("Started document processing.");

  try {
    const gc = collection.find().project({ keywords: 1, features: { rental: 1, clothes: 1, cuisine: 1 } });
    const func = (arr) => arr ? arr.map(item => item.replace('_', ' ')) : undefined;

    while (await gc.hasNext()) {
      const g = await gc.next();
      const f = g.features;

      await collection.updateOne(
        {
          _id: g._id
        },
        {
          $set: {
            "keywords": func(g.keywords),
            "features.clothes": func(f.clothes),
            "features.cuisine": func(f.cuisine),
            "features.rental": func(f.rental)
          }
        },
        {
          ignoreUndefined: true
        }
      );
      if (++cnt >= 1000) { tot += cnt; cnt = 0; logger.info(`Still working... ${tot} documents already processed.`); }
    }

    logger.info(`Finished, ${tot + cnt} documents have been processed.`);
  }
  catch (ex) { logger.error(ex); }
  finally { await client.close(); }
}

snake();
