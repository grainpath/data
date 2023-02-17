import * as func from "./func.js";
import { MongoClient } from "mongodb";

/**
 * Extracts existing keywords from the current database.
 */

const conn = process.env.GRAINPATH_DBM_CONN;
const client = new MongoClient(conn);

async function extract() {

  const coll = client.db("grainpath").collection("pois");

  console.log(`Started keyword extraction.`);

  const result = new Map();
  const cursor = coll.find().project({ keywords: 1 });

  let tstamp = Date.now();
  process.stdout.write(" > ");

  while (await cursor.hasNext()) {

    const { keywords } = await cursor.next();

    keywords.forEach((keyword) => {

      if (!result.has(keyword)) { result.set(keyword, 0); }
      result.set(keyword, result.get(keyword) + 1);
      if (Date.now() - tstamp >= 1000) { tstamp = Date.now(); process.stdout.write('.'); }
    });
  }

  await client.close();

  console.log();

  const file = '../keywords/keywords.json'
  const obj = func.map2file(result, file, 0);

  console.log(`Finished keyword extraction, total ${obj.length} keywords extracted.`);
}

extract();
