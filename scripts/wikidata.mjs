import jsonld from "jsonld";
import { MongoClient } from "mongodb";

import {
  isValidKeyword,
  MONGO_CONNECTION_STRING,
} from "./const.cjs";

import {
  getPayload,
  reportFetchedItems,
  reportFinished,
  reportPayload,
  writeToDatabase
} from "./share.cjs";

const WIKIDATA_ACCEPT_CONTENT = "application/n-quads";

const WIKIDATA_JSONLD_CONTEXT = {
  "my": "http://example.com/",
  "wd": "http://www.wikidata.org/entity/",
  "name": {
    "@id": "my:name",
    "@container": "@language"
  },
  "description": {
    "@id": "my:description",
    "@container": "@language"
  },
  "keywords": {
    "@id": "my:keywords",
    "@container": "@language"
  },
  "image": {
    "@id": "my:image",
    "@type": "@id"
  },
  "geonames": {
    "@id": "my:geonames"
  },
  "wikidata": "@id"
};

const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const wikidataQuery = (payload) => `
PREFIX my: <http://example.com/>
PREFIX dita: <http://purl.org/dita/ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
CONSTRUCT {
  ?wikidataId
    my:name ?name ;
    my:description ?description ;
    my:keywords ?keyword ;
    my:image ?image ;
    my:geonames ?geoNamesId .
}
WHERE {
  VALUES ?wikidataId { ${payload} }
  OPTIONAL { 
    ?wikidataId rdfs:label ?name .
    FILTER(LANG(?name) = "en" && STRLEN(STR(?name)) > 0)
  }
  OPTIONAL {
    ?wikidataId schema:description ?description .
    FILTER(LANG(?description) = "en" && STRLEN(STR(?description)) > 0)
  }
  OPTIONAL {
    ?wikidataId wdt:P31 ?instanceOf .
    ?instanceOf rdfs:label ?keyword .
    FILTER(LANG(?keyword) = "en" && STRLEN(STR(?keyword)) > 0)
  }
  OPTIONAL {
    ?wikidataId wdt:P18 ?image .
    FILTER(ISURI(?image))
  }
  OPTIONAL { ?wikidataId wdt:P1566 ?geoNamesId . }
}`;

function fetchFromWikidata(payload) {

  return fetch(WIKIDATA_SPARQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Accept": WIKIDATA_ACCEPT_CONTENT + "; charset=utf-8",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "GrainPath (https://github.com/grainpath)" },
    body: "query=" + encodeURIComponent(wikidataQuery(payload))
  })
  .then((res) => res.text())
  .then((txt) => jsonld.fromRDF(txt, { format: WIKIDATA_ACCEPT_CONTENT }))
  .then((doc) => jsonld.compact(doc, WIKIDATA_JSONLD_CONTEXT));
}

function constructFromJson(json) {

  const g = json["@graph"];

  if (g === undefined) { return []; }

  return g.map((entity) => {
    const obj = { };
    const get = (a) => Array.isArray(a) ? a[0] : a;

    if (!entity.keywords) { entity.keywords = { "en": [] }; }

    let keywords = Array.isArray(entity.keywords.en)
      ?   entity.keywords.en
      : [ entity.keywords.en ];

    keywords = keywords.map((keyword) => {
      keyword = keyword.toLowerCase().replace(' ', '_');
      return (isValidKeyword(keyword)) ? keyword : undefined;
    })
    .filter((keyword) => keyword !== undefined);

    obj.keywords = [ ...new Set(keywords) ];

    // en-containers
    obj.name = get(entity.name?.en);
    obj.description = get(entity.description?.en);

    // lists
    obj.image = get(entity.image);
    obj.geonames = get(entity.geonames);

    // existing
    obj.wikidata = entity.wikidata.substring(3);

    return obj;
  });
}

async function wikidata() {

  const resource = "Wikidata";
  const client = new MongoClient(MONGO_CONNECTION_STRING);

  try {
    let payload = await getPayload(client);
    reportPayload(payload, resource);

    while (payload.length) {

      const window = 100;

      const lst = await fetchFromWikidata(payload.slice(0, window).join(' '))
        .then((jsn) => constructFromJson(jsn));

      reportFetchedItems(lst, resource);

      const upd = (obj) => {



        return {
          $set: {
            "tags.name": obj.name,
            "tags.description": obj.description,
            "tags.image": obj.image,
            "linked.geonames": obj.geonames
          },
          $addToSet: {
            "keywords": { $each: obj.keywords }
          }
        }
      };

      await writeToDatabase(client, lst, upd);
      payload = payload.slice(window);
    }

    reportFinished(resource);
  }
  catch (err) { console.log(err); }
  finally { await client.close(); }
}

wikidata();
