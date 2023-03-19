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
    const gc = collection.find().project({ keywords: 1, tags: { rental: 1, clothes: 1, cuisine: 1 } });
    const func = (arr) => arr ? arr.map(item => item.replace('_', ' ')) : undefined;

    while (await gc.hasNext()) {
      const g = await gc.next();
      const t = g.tags;

      await collection.updateOne(
        {
          _id: g._id
        },
        {
          $set: {
            keywords: func(g.keywords),
            "tags.rental": func(t.rental),
            "tags.clothes": func(t.clothes),
            "tags.cuisine": func(t.cuisine)
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
