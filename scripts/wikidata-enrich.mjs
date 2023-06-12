import { MongoClient } from "mongodb";
import {
  getPayload,
  MONGO_CONNECTION_STRING,
  reportError,
  reportFetchedItems,
  reportFinished,
  reportPayload,
  writeUpdateToDatabase
} from "./shared.cjs";
import {
  constructFromEntity,
  fetchFromWikidata,
  getEntityList,
  OPTIONAL_NAME,
  OPTIONAL_DESCRIPTION,
  OPTIONAL_GENRE,
  OPTIONAL_INSTANCE,
  OPTIONAL_FACILITY,
  OPTIONAL_MOVEMENT,
  OPTIONAL_ARCH_STYLE,
  OPTIONAL_FIELD_WORK,
  OPTIONAL_IMAGE,
  OPTIONAL_EMAIL,
  OPTIONAL_PHONE,
  OPTIONAL_WEBSITE,
  OPTIONAL_INCEPTION,
  OPTIONAL_OPENING_DATE,
  OPTIONAL_CAPACITY,
  OPTIONAL_ELEVATION,
  OPTIONAL_MINIMUM_AGE,
  OPTIONAL_GEONAMES,
  OPTIONAL_MAPYCZ,
  OPTIONAL_COUNTRY,
  OPTIONAL_STREET,
  OPTIONAL_HOUSE,
  OPTIONAL_POSTAL_CODE,
  PREAMBLE_SHORT,
} from "./wikidata.mjs"

const wikidataQuery = (payload) => `${PREAMBLE_SHORT}
CONSTRUCT {
  ?wikidataId
    my:name ?name;
    my:description ?description;
    my:genre ?genre;
    my:instance ?instance;
    my:facility ?facility;
    my:movement ?movement;
    my:archStyle ?archStyle;
    my:fieldWork ?fieldWork;
    my:image ?image;
    my:email ?email;
    my:phone ?phone;
    my:website ?website;
    my:inception ?inception;
    my:openingDate ?openingDate;
    my:capacity ?capacity;
    my:elevation ?elevation;
    my:minimumAge ?minimumAge;
    my:geonames ?geoNamesId;
    my:mapycz ?mapyCzId;
    my:country ?country;
    my:street ?street;
    my:house ?house;
    my:postalCode ?postalCode.
}
WHERE {
VALUES ?wikidataId { ${payload} }
${OPTIONAL_NAME}
${OPTIONAL_DESCRIPTION}
${OPTIONAL_GENRE}
${OPTIONAL_INSTANCE}
${OPTIONAL_FACILITY}
${OPTIONAL_MOVEMENT}
${OPTIONAL_ARCH_STYLE}
${OPTIONAL_FIELD_WORK}
${OPTIONAL_IMAGE}
${OPTIONAL_EMAIL}
${OPTIONAL_PHONE}
${OPTIONAL_WEBSITE}
${OPTIONAL_INCEPTION}
${OPTIONAL_OPENING_DATE}
${OPTIONAL_CAPACITY}
${OPTIONAL_ELEVATION}
${OPTIONAL_MINIMUM_AGE}
${OPTIONAL_MAPYCZ}
${OPTIONAL_GEONAMES}
${OPTIONAL_COUNTRY}
${OPTIONAL_STREET}
${OPTIONAL_HOUSE}
${OPTIONAL_POSTAL_CODE}
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
            "attributes.email": obj.email,
            "attributes.phone": obj.phone,
            "attributes.website": obj.website,
            "attributes.year": obj.year,
            "attributes.capacity": obj.capacity,
            "attributes.elevation": obj.elevation,
            "attributes.minimumAge": obj.minimumAge,
            "attributes.description": obj.description,
            "attributes.address.country": obj.country,
            "attributes.address.place": obj.street,
            "attributes.address.house": obj.house,
            "attributes.address.postalCode": obj.postalCode,
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
