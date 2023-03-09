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
    let gc = collection.find().project({ keywords: 1 });

    while (await gc.hasNext()) {
      let grain = await gc.next();
      await collection.updateOne(
        { _id: grain._id },
        { $set: { keywords: grain.keywords.map((keyword) => keyword.replace("_", " ")) }}
      );
      if (++cnt >= 1000) { tot += cnt; cnt = 0; logger.info(`Still working... ${tot} documents already processed.`); }
    }

    logger.info(`Finished, ${tot + cnt} documents have been processed.`);
  }
  catch (ex) { logger.error(ex); }
  finally { await client.close(); }
}

snake();
