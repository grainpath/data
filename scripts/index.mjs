import consola from "consola";
import { MongoClient } from "mongodb";
import {
  MONGO_CONNECTION_STRING,
  MONGO_DATABASE,
  MONGO_GRAIN_COLLECTION,
  MONGO_INDEX_COLLECTION
} from "./const.cjs";

/**
 * The goal of this script is to create `index` supporting user interaction
 * with the system, in particular to cover autocomplete functionality. Two
 * variants of indices are required.
 * 
 * - collects, e.g. "cuisine":
 *    [
 *      {
 *        value: "italian",
 *        count: 521
 *      },
 *      ...
 *    ]
 * - keywords, e.g. "keywords":
 *    [
 *      {
 *        value: "tourism",
 *        count: 153,
 *        tags: [ "name", "website", "polygon", ... ]
 *      },
 *      ...
 *    ]
 */

/**
 * Extract keywords with tags.
 * @param {*} doc as stored in the database.
 * @param {*} keywords Map&lt;string, { label: string, count: number, tags: Set }&gt;
 */
function extractKeywords(doc, keywords) {

  const base = (word) => { return { label: word, count: 0, tags: new Set() }; };

  doc.keywords.forEach(word => {
    if (!keywords.has(word)) { keywords.set(word, base(word)); }
    const item = keywords.get(word);

    ++item.count;
    Object.keys(doc.tags).forEach(key => item.tags.add(key));
  });
}

/**
 * 
 * @param {*} doc 
 * @param {*} collect 
 * @param {*} func 
 */
function extractCollects(doc, collect, func) {

  const base = (word) => { return { label: word, count: 0 }; };

  func(doc)?.forEach(word => {
    if (!collect.has(word)) { collect.set(word, base(word)); }
    ++collect.get(word).count;
  });
}

async function index() {

  const logger = consola.create();

  const client = new MongoClient(MONGO_CONNECTION_STRING);
  const database = client.db(MONGO_DATABASE);

  try {
    await database.dropCollection(MONGO_INDEX_COLLECTION, {  });
  } catch (ex) { logger.error(ex.message); }

  const grain = database.collection(MONGO_GRAIN_COLLECTION);
  const index = database.collection(MONGO_INDEX_COLLECTION);

  let cnt = 0, tot = 0;

  try {
    const [ keywords, clothes, cuisine, rental ] = [ new Map(), new Map(), new Map(), new Map() ];
    let gc = grain.find();

    while (await gc.hasNext()) {

      let doc = await gc.next();

      extractKeywords(doc, keywords);
      extractCollects(doc, rental,  (doc) => doc.tags.rental );
      extractCollects(doc, clothes, (doc) => doc.tags.clothes);
      extractCollects(doc, cuisine, (doc) => doc.tags.cuisine);

      if (++cnt >= 1000) { tot += cnt; cnt = 0; logger.info(`Still working... Processed ${tot} documents.`); }
    }

    logger.info(`Processed ${tot + cnt} documents, constructing index...`);

    await gc.close();

    // insert keywords

    await index.insertOne({ _id: "keywords", values: [ ...keywords.keys() ].map(key => {
      const item = keywords.get(key);
      return { ...item, tags: [ ...item.tags ] }; // tags as an array!
    })});

    // insert clothes, cuisine, and rental

    const map2arr = (m) => [ ...m.keys() ].map(key => m.get(key));

    for (const [ w, m ] of [ [ "clothes", clothes ], [ "cuisine", cuisine ], [ "rental", rental ] ]) {
      await index.insertOne({ _id: w, values: map2arr(m) });
    }

    logger.info(`Index has been constructed. Exiting...`);
  }
  catch (ex) { logger.error(ex); }
  finally { await client.close(); }
}

index();
