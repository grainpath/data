const {
  MONGO_DATABASE,
  MONGO_GRAIN_COLLECTION,
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

async function writeToDatabase(client, lst, upd) {

  for (const obj of lst) {

    const filter = { "linked.wikidata": { $eq: obj.wikidata } };

    await client
      .db(MONGO_DATABASE)
      .collection(MONGO_GRAIN_COLLECTION)
      .updateMany(filter, upd(obj), { ignoreUndefined: true });
  }
}

function reportPayload(payload, resource) {
  console.log(`Constructed ${resource} payload with ${payload.length} items.`);
}

function reportFetchedItems(lst, resource) {
  console.log(` > Fetched ${lst.length} items from ${resource}.`);
}

function reportFinished(resource) {
  console.log(`Finished processing ${resource} items.`);
}

module.exports = {
  getPayload: getPayload,
  writeToDatabase: writeToDatabase,
  reportPayload: reportPayload,
  reportFetchedItems: reportFetchedItems,
  reportFinished: reportFinished
};
