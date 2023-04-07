import { MongoClient } from "mongodb";
import { MONGO_CONNECTION_STRING } from "./const.cjs";
import {
  getPayload,
  reportError,
  reportFetchedItems,
  reportFinished,
  reportPayload,
  writeUpdateToDatabase
} from "./share.cjs";
import {
  constructFromEntity,
  fetchFromWikidata,
  getEntityList,
  OPTIONAL_DESCRIPTION,
  OPTIONAL_GEONAMES,
  OPTIONAL_IMAGE,
  OPTIONAL_KEYWORDS,
  OPTIONAL_MAPYCZ,
  OPTIONAL_NAME,
  PREAMBLE_SHORT
} from "./wikidata.mjs"

const wikidataQuery = (payload) => `${PREAMBLE_SHORT}
CONSTRUCT {
  ?wikidataId
    my:name ?name ;
    my:description ?description ;
    my:keywords ?keyword ;
    my:image ?image ;
    my:geonames ?geoNamesId ;
    my:mapycz ?mapyCzId .
}
WHERE {
VALUES ?wikidataId { ${payload} }
${OPTIONAL_NAME}
${OPTIONAL_DESCRIPTION}
${OPTIONAL_KEYWORDS}
${OPTIONAL_IMAGE}
${OPTIONAL_MAPYCZ}
${OPTIONAL_GEONAMES}
}`;

function constructFromJson(json) {
  return getEntityList(json).map((e) => constructFromEntity(e));
}

/**
 * Enrich entities already existing in the database.
 */
async function wikidataEnrich() {

  let cnt = 0;
  const resource = "Wikidata";
  const client = new MongoClient(MONGO_CONNECTION_STRING);

  try {
    let payload = await getPayload(client);
    reportPayload(payload, resource);

    while (payload.length) {

      const window = 100;

      const lst = await fetchFromWikidata(wikidataQuery(payload.slice(0, window).join(' ')))
        .then((jsn) => constructFromJson(jsn));

      cnt += lst.length;
      reportFetchedItems(lst, resource);

      const upd = (obj) => {
        return {
          $set: {
            "name": obj.name,
            "attributes.name": obj.name,
            "attributes.image": obj.image,
            "attributes.description": obj.description,
            "linked.mapycz": obj.mapycz,
            "linked.geonames": obj.geonames
          },
          $addToSet: {
            "keywords": { $each: obj.keywords }
          }
        }
      };

      await writeUpdateToDatabase(client, lst, upd);
      payload = payload.slice(window);
    }

    reportFinished(resource, cnt);
  }
  catch (ex) { reportError(ex); }
  finally { await client.close(); }
}

wikidataEnrich();
