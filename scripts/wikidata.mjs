import jsonld from "jsonld";
import { isValidKeyword } from "./shared.cjs";

const WIKIDATA_ACCEPT_CONTENT = "application/n-quads";

const WIKIDATA_JSONLD_CONTEXT = {
  "my": "http://example.com/",
  "wd": "http://www.wikidata.org/entity/",
  "geo": "http://www.opengis.net/ont/geosparql#",
  "xsd": "http://www.w3.org/2001/XMLSchema#",
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
  "genre": {
    "@id": "my:genre",
    "@container": "@language"
  },
  "instance": {
    "@id": "my:instance",
    "@container": "@language"
  },
  "facility": {
    "@id": "my:facility",
    "@container": "@language"
  },
  "movement": {
    "@id": "my:movement",
    "@container": "@language"
  },
  "archStyle": {
    "@id": "my:archStyle",
    "@container": "@language"
  },
  "fieldWork": {
    "@id": "my:fieldWork",
    "@container": "@language"
  },
  "image": {
    "@id": "my:image",
    "@type": "@id"
  },
  "email": {
    "@id": "my:email",
    "@type": "@id"
  },
  "phone": {
    "@id": "my:phone"
  },
  "website": {
    "@id": "my:website",
    "@type": "@id"
  },
  "inception": {
    "@id": "my:inception",
    "@type": "xsd:dateTime"
  },
  "openingDate": {
    "@id": "my:openingDate",
    "@type": "xsd:dateTime"
  },
  "capacity": {
    "@id": "my:capacity",
    "@type": "xsd:decimal"
  },
  "elevation": {
    "@id": "my:elevation",
    "@type": "xsd:decimal"
  },
  "minimumAge": {
    "@id": "my:minimumAge",
    "@type": "xsd:decimal"
  },
  "geonames": {
    "@id": "my:geonames"
  },
  "mapycz": {
    "@id": "my:mapycz"
  },
  "country": {
    "@id": "my:country",
    "@container": "@language"
  },
  "street": {
    "@id": "my:street",
    "@container": "@language"
  },
  "house": {
    "@id": "my:house"
  },
  "postalCode": {
    "@id": "my:postalCode"
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

export const OPTIONAL_GENRE = `OPTIONAL {
  ?wikidataId wdt:P136 ?genreId.
  ?genreId rdfs:label ?genre.
  FILTER(LANG(?genre) = "en" && STRLEN(STR(?genre)) > 0)
}`;

export const OPTIONAL_INSTANCE = `OPTIONAL {
  ?wikidataId wdt:P31 ?instanceOf.
  ?instanceOf rdfs:label ?instance.
  FILTER(LANG(?instance) = "en" && STRLEN(STR(?instance)) > 0)
}`;

export const OPTIONAL_FACILITY = `OPTIONAL {
  ?wikidataId wdt:P912 ?facilityId.
  ?facilityId rdfs:label ?facility.
  FILTER(LANG(?facility) = "en" && STRLEN(STR(?facility)) > 0)
}`;

export const OPTIONAL_MOVEMENT = `OPTIONAL {
  ?wikidataId wdt:P135 ?movementId.
  ?movementId rdfs:label ?movement.
  FILTER(LANG(?movement) = "en" && STRLEN(STR(?movement)) > 0)
}`;

export const OPTIONAL_ARCH_STYLE = `OPTIONAL {
  ?wikidataId wdt:P149 ?archStyleId.
  ?archStyleId rdfs:label ?archStyle.
  FILTER(LANG(?archStyle) = "en" && STRLEN(STR(?archStyle)) > 0)
}`;

export const OPTIONAL_FIELD_WORK = `OPTIONAL {
  ?wikidataId wdt:P101 ?fieldWorkId.
  ?fieldWorkId rdfs:label ?fieldWork.
  FILTER(LANG(?fieldWork) = "en" && STRLEN(STR(?fieldWork)) > 0)
}`;

export const OPTIONAL_IMAGE = `OPTIONAL {
  ?wikidataId wdt:P18 ?image.
}`;

export const OPTIONAL_EMAIL = `OPTIONAL {
  ?wikidataId wdt:P968 ?email.
}`;

export const OPTIONAL_PHONE = `OPTIONAL {
  ?wikidataId wdt:P1329 ?phone.
}`;

export const OPTIONAL_WEBSITE = `OPTIONAL {
  ?wikidataId wdt:P856 ?website.
}`;

export const OPTIONAL_INCEPTION = `OPTIONAL {
  ?wikidataId wdt:P571 ?inception.
}`;

export const OPTIONAL_OPENING_DATE = `OPTIONAL {
  ?wikidataId wdt:P1619 ?openingDate.
}`;

export const OPTIONAL_CAPACITY = `OPTIONAL {
  ?wikidataId wdt:P1083 ?capacity.
}`;

export const OPTIONAL_ELEVATION = `OPTIONAL {
  ?wikidataId wdt:P2044 ?elevation.
}`;

export const OPTIONAL_MINIMUM_AGE = `OPTIONAL {
  ?wikidataId wdt:P2899 ?minimumAge.
}`;

export const OPTIONAL_MAPYCZ = `OPTIONAL {
  ?wikidataId wdt:P8988 ?mapyCzId.
}`;

export const OPTIONAL_GEONAMES = `OPTIONAL {
  ?wikidataId wdt:P1566 ?geoNamesId.
}`;

export const OPTIONAL_COUNTRY = `OPTIONAL {
  ?wikidataId wdt:P17 ?countryId.
  ?countryId rdfs:label ?country.
  FILTER(LANG(?country) = "en" && STRLEN(STR(?country)) > 0)
}`;

export const OPTIONAL_STREET = `OPTIONAL {
  ?wikidataId wdt:P669 ?streetId.
  ?streetId rdfs:label ?street.
  FILTER(LANG(?street) = "en" && STRLEN(STR(?street)) > 0)
}`;

export const OPTIONAL_HOUSE = `OPTIONAL {
  ?wikidataId wdt:P4856 ?house.
}`;

export const OPTIONAL_POSTAL_CODE = `OPTIONAL {
  ?wikidataId wdt:P281 ?postalCode.
}`;

function handleEnArray(list) {
  const arr = (a) => Array.isArray(a) ? a : [a];
  list = list ?? { "en": [] };

  return arr(list.en)
    .map((instance) => instance.toLowerCase())
    .map((instance) => isValidKeyword(instance) ? instance : undefined)
    .filter((instance) => instance !== undefined);
}

function handleDate(value) {
  const d = new Date(value).getFullYear();
  return isNaN(d) ? undefined : d;
}

function handleNumber(value) {
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

export const getEntityList = (json) => json["@graph"] ?? [];

export function constructFromEntity(ent) {
  const obj = { };
  const fst = (a) => Array.isArray(a) ? a[0] : a;

  const keywords = []
    .concat(handleEnArray(ent.genre))
    .concat(handleEnArray(ent.instance))
    .concat(handleEnArray(ent.facility))
    .concat(handleEnArray(ent.movement))
    .concat(handleEnArray(ent.archStyle))
    .concat(handleEnArray(ent.fieldWork));

  obj.keywords = [...new Set(keywords)];

  // en-containers
  obj.name = fst(ent.name?.en);
  obj.street = fst(ent.street?.en);
  obj.country = fst(ent.country?.en);
  obj.description = fst(ent.description?.en);

  // identifiers
  obj.house = fst(ent.house);
  obj.postalCode = fst(ent.postalCode);
  obj.image = fst(ent.image);
  obj.email = fst(ent.email)?.substring(7); // mailto:
  obj.phone = fst(ent.phone);
  obj.website = fst(ent.website);
  obj.mapycz = fst(ent.mapycz);
  obj.geonames = fst(ent.geonames);

  // date
  obj.year = handleDate(fst(ent.inception)) ?? handleDate(fst(ent.openingDate));
  
  // numbers
  obj.capacity = handleNumber(fst(ent.capacity));
  obj.elevation = handleNumber(fst(ent.elevation));
  obj.minimumAge = handleNumber(fst(ent.minimumAge));

  // existing
  obj.wikidata = ent.wikidata.substring(3); // wd:

  return obj;
}

export function extractLocation(obj, ent) {

  const re = /POINT\((?<lon>-?\d+\.\d+) (?<lat>-?\d+\.\d+)\)/i;
  const { groups: { lon, lat } } = re.exec(ent.location);
  obj.location = { lon: Number(lon), lat: Number(lat) };

  return obj;
}
