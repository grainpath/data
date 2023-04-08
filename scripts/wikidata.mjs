import jsonld from "jsonld";
import { isValidKeyword } from "./shared.cjs";

const WIKIDATA_ACCEPT_CONTENT = "application/n-quads";

const WIKIDATA_JSONLD_CONTEXT = {
  "my": "http://example.com/",
  "wd": "http://www.wikidata.org/entity/",
  "geo": "http://www.opengis.net/ont/geosparql#",
  "name": {
    "@id": "my:name",
    "@container": "@language"
  },
  "location": {
    "@id": "my:location",
    "@type": "geo:wktLiteral"
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
  "mapycz": {
    "@id": "my:mapycz"
  },
  "wikidata": "@id"
};

const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

export function fetchFromWikidata(query) {

  return fetch(WIKIDATA_SPARQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Accept": WIKIDATA_ACCEPT_CONTENT + "; charset=utf-8",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "GrainPath (https://github.com/grainpath)" },
    body: "query=" + encodeURIComponent(query)
  })
  .then((res) => res.text())
  .then((txt) => jsonld.fromRDF(txt, { format: WIKIDATA_ACCEPT_CONTENT }))
  .then((doc) => jsonld.compact(doc, WIKIDATA_JSONLD_CONTEXT));
}

export const PREAMBLE_SHORT = `PREFIX dct: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX my: <http://example.com/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>`;

export const PREAMBLE_LONG = `${PREAMBLE_SHORT}
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX wikibase: <http://wikiba.se/ontology#>`;

export const OPTIONAL_NAME = `OPTIONAL { 
  ?wikidataId rdfs:label | dct:title | foaf:name | skos:prefLabel | skos:altLabel ?name.
  FILTER(LANG(?name) = "en" && STRLEN(STR(?name)) > 0)
}`;

export const OPTIONAL_DESCRIPTION = `OPTIONAL {
  ?wikidataId schema:description | rdfs:comment ?description.
  FILTER(LANG(?description) = "en" && STRLEN(STR(?description)) > 0)
}`;

export const OPTIONAL_KEYWORDS = `OPTIONAL {
  ?wikidataId wdt:P31 ?instanceOf.
  ?instanceOf rdfs:label ?keyword.
  FILTER(LANG(?keyword) = "en" && STRLEN(STR(?keyword)) > 0)
}`;

export const OPTIONAL_IMAGE = `OPTIONAL {
  ?wikidataId wdt:P18 ?image.
  FILTER(ISURI(?image))
}`;

export const OPTIONAL_MAPYCZ = `OPTIONAL {
  ?wikidataId wdt:P8988 ?mapyCzId.
}`;

export const OPTIONAL_GEONAMES = `OPTIONAL {
  ?wikidataId wdt:P1566 ?geoNamesId.
}`;

export const getEntityList = (json) => json["@graph"] ?? [];

export function constructFromEntity(ent) {
  const obj = { };
  const arr = (a) => Array.isArray(a) ? a : [a];
  const fst = (a) => Array.isArray(a) ? a[0] : a;

  ent.keywords = ent.keywords ?? { "en": [] };

  const keywords = arr(ent.keywords.en)
    .map((keyword) => isValidKeyword(keyword) ? keyword : undefined)
    .filter((keyword) => keyword !== undefined);

  obj.keywords = [...new Set(keywords)];

  // en-containers
  obj.name = fst(ent.name?.en);
  obj.description = fst(ent.description?.en);

  // lists
  obj.image = fst(ent.image);
  obj.mapycz = fst(ent.mapycz);
  obj.geonames = fst(ent.geonames);

  // existing
  obj.wikidata = ent.wikidata.substring(3);

  return obj;
}

export function extractLocation(obj, ent) {

  const re = /POINT\((?<lon>-?\d+\.\d+) (?<lat>-?\d+\.\d+)\)/i;
  const { groups: { lon, lat } } = re.exec(ent.location);
  obj.location = { lon: Number(lon), lat: Number(lat) };

  return obj;
}
