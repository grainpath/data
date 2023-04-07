const consola = require("consola");

const {
  MONGO_DATABASE,
  MONGO_GRAIN_COLLECTION,
  MONGO_INDEX_COLLECTION,
} = require("./const.cjs");

async function getPayload(client) {
  const tar = "linked.wikidata";

  const payload = await client
    .db(MONGO_DATABASE)
    .collection(MONGO_GRAIN_COLLECTION)
    .find({ [tar]: { $exists: true } })
    .project({ [tar]: 1 })
    .toArray();

  return payload.map((item) => "wd:" + item.linked.wikidata);
}

function getMongoCollection(client, collection) {
  return client.db(MONGO_DATABASE).collection(collection);
}

function getGrainCollection(client) {
  return getMongoCollection(client, MONGO_GRAIN_COLLECTION);
}

function getIndexCollection(client) {
  return getMongoCollection(client, MONGO_INDEX_COLLECTION);
}

async function writeCreateToDatabase(client, ins) {
  await getGrainCollection(client)
    .insertOne(ins, { ignoreUndefined: true });
}

async function writeUpdateToDatabase(client, lst, upd) {

  for (const obj of lst) {
    const filter = { "linked.wikidata": { $eq: obj.wikidata } };

    await getGrainCollection(client)
      .updateMany(filter, upd(obj), { ignoreUndefined: true });
  }
}

function reportError(ex) { consola.error(ex); }

function reportPayload(payload, resource) {
  consola.info(`Constructed ${resource} payload with ${payload.length} items.`);
}

function reportCategory(category) {
  consola.info(`> Processing category ${category}...`);
}

function reportFetchedItems(lst, resource) {
  consola.info(`> Fetched ${lst.length} valid items from ${resource}.`);
}

function reportCreatedItems(cat, cnt, tot) {
  consola.info(`> Created ${cnt} objects for ${cat} category, total ${tot}.`);
}

function reportFinished(resource, tot) {
  consola.info(`Finished processing ${resource}, processed ${tot} items.`);
}

module.exports = {
  getPayload: getPayload,
  reportError: reportError,
  reportPayload: reportPayload,
  reportCategory: reportCategory,
  reportFetchedItems: reportFetchedItems,
  reportCreatedItems: reportCreatedItems,
  reportFinished: reportFinished,
  getGrainCollection: getGrainCollection,
  getIndexCollection: getIndexCollection,
  writeUpdateToDatabase: writeUpdateToDatabase,
  writeCreateToDatabase: writeCreateToDatabase
};
