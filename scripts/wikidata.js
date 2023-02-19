import jsonld from "jsonld";
import { MongoClient } from "mongodb";
import {
  isValidKeyword,
  MONGO_CONNECTION_STRING,
  MONGO_DATABASE,
  MONGO_GRAIN_COLLECTION
} from "./const.js";

const WIKIDATA_ACCEPT_CONTENT = "application/n-quads";

const WIKIDATA_JSONLD_CONTEXT = {
  "dita": "http://purl.org/dita/ns#",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "schema": "http://schema.org/",
  "wd": "http://www.wikidata.org/entity/",
  "wdt": "http://www.wikidata.org/prop/direct/",
  "name": "rdfs:label",
  "description": "schema:description",
  "keywords": "dita:keyword",
  "image": "wdt:P18",
  "location": "wdt:P625",
  "geonames": "wdt:P1566",
  "wikidata": "@id"
};

const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const wikidataQuery = (payload) => `
PREFIX dita: <http://purl.org/dita/ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
CONSTRUCT {
  ?wikidataId
    dita:keyword ?keyword ;
    rdfs:label ?name ;
    schema:description ?description ;
    wdt:P18 ?image ;
    wdt:P1566 ?geoNamesId .
}
WHERE {
  VALUES ?wikidataId { ${payload} }
  OPTIONAL {
    ?wikidataId wdt:P31 ?instanceOf .
    ?instanceOf rdfs:label ?keywordLit .
    FILTER(LANGMATCHES(LANG(?keywordLit), "en"))
    BIND(STR(?keywordLit) AS ?keyword)
  }
  OPTIONAL { 
    ?wikidataId rdfs:label ?nameLit .
    FILTER(LANGMATCHES(LANG(?nameLit), "en"))
    BIND(STR(?nameLit) AS ?name)
  }
  OPTIONAL {
    ?wikidataId schema:description ?descriptionLit .
    FILTER(LANGMATCHES(LANG(?descriptionLit), "en"))
    BIND(STR(?descriptionLit) AS ?description)
  }
  OPTIONAL { ?wikidataId wdt:P18 ?image . }
  OPTIONAL {
    ?wikidataId wdt:P1566 ?geoNamesId .
  }
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

  return json["@graph"].map((entity) => {
    const obj = { };
    const get = (i) => Array.isArray(i) ? i[0] : i;

    if (entity.keywords) {

      entity.keywords = Array.isArray(entity.keywords)
        ?   entity.keywords
        : [ entity.keywords ];

      entity.keywords = entity.keywords.map((keyword) => {
        keyword = keyword.toLowerCase().replace(' ', '_');
        return (isValidKeyword(keyword)) ? keyword : undefined;
      })
      .filter((keyword) => keyword !== undefined);

      entity.keywords = [ ...new Set(entity.keywords) ];
    }

    entity.wikidata = entity.wikidata.substring(3);

    // keywords
    obj.keywords = entity.keywords;

    // tags
    obj.name = get(entity.name);
    obj.description = get(entity.description);
    obj.image = get(entity.image)?.wikidata;

    // linked
    obj.wikidata = entity.wikidata;
    obj.geonames = get(entity.geonames);

    return obj;
  });
}

/**
 * Enrich known wiki items.
 */
async function wikidata() {

  const client = new MongoClient(MONGO_CONNECTION_STRING);

  try {
    const tar = "linked.wikidata";

    let payload = await client
      .db(MONGO_DATABASE)
      .collection(MONGO_GRAIN_COLLECTION)
      .find({ [tar]: { $exists: true } })
      .project({ [tar]: 1 })
      .toArray()

    console.log(`Constructed payload with ${payload.length} items.`);
    payload = payload.map((item) => "wd:" + item.linked.wikidata).join(' ');

    const lst = await fetchFromWikidata(payload)
      .then((jsn) => constructFromJson(jsn));

    console.log(`Fetched ${lst.length} items from Wikidata.`)

    for (const obj of lst) {

      const filter = { "linked.wikidata": { $eq: obj.wikidata } };
      const update = {
        $set: {
          "tags.name": obj.name,
          "tags.description": obj.description,
          "tags.image": obj.image,
          "linked.geonames": obj.geonames
        },
        $addToSet: {
          "keywords": obj.keywords
        }
      };

      await client
        .db(MONGO_DATABASE)
        .collection(MONGO_GRAIN_COLLECTION)
        .updateMany(filter, update, { ignoreUndefined: true });
    }

    console.log(`Finished processing ${lst.length} items.`);
  }
  catch (err) { console.log(err); }
  finally { await client.close(); }
}

wikidata();
