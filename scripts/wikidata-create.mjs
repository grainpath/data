import { Command } from "commander";
import { MongoClient } from "mongodb";
import {
  convertKeywordToName,
  getGrainCollection,
  MONGO_CONNECTION_STRING,
  reportCategory,
  reportCreatedItems,
  reportError,
  reportFetchedItems,
  reportFinished,
  writeCreateToDatabase
} from "./shared.cjs";
import {
  constructFromEntity,
  extractLocation,
  fetchFromWikidata,
  getEntityList,
  OPTIONAL_DESCRIPTION,
  OPTIONAL_GEONAMES,
  OPTIONAL_IMAGE,
  OPTIONAL_KEYWORDS,
  OPTIONAL_MAPYCZ,
  OPTIONAL_NAME,
  PREAMBLE_LONG
} from "./wikidata.mjs";

const wikidataQuery = (category, sw, ne) => `${PREAMBLE_LONG}
CONSTRUCT {
  ?wikidataId
    my:name ?name;
    my:location ?location;
    my:description ?description;
    my:keywords ?keyword;
    my:image ?image;
    my:mapycz ?mapyCzId;
    my:geonames ?geoNamesId.
}
WHERE {
SERVICE wikibase:box {
    ?wikidataId wdt:P625 ?location.
    bd:serviceParam wikibase:cornerSouthWest "Point(${sw})"^^geo:wktLiteral.
    bd:serviceParam wikibase:cornerNorthEast "Point(${ne})"^^geo:wktLiteral.
}
?wikidataId wdt:P31/wdt:P279* wd:${category}.
${OPTIONAL_NAME}
${OPTIONAL_DESCRIPTION}
${OPTIONAL_KEYWORDS}
${OPTIONAL_IMAGE}
${OPTIONAL_MAPYCZ}
${OPTIONAL_GEONAMES}
}`;

/**
 * Define Wikidata categories, south-west, and north-east points.
 */
const args = new Command()
  .option("--s <number>")
  .option("--w <number>")
  .option("--n <number>")
  .option("--e <number>")
  .option("--cats [cats...]");

function concat(a, b) { return [a, b].join(' '); }

function constructFromJson(json) {
  return getEntityList(json)
    .map((e) => extractLocation(constructFromEntity(e), e));
}

/**
 * Create entities that exist in the Wikidata, but not in the database.
 */
async function wikidataCreate() {

  const resource = "Wikidata";
  const { s, w, n, e, cats } = args.parse().opts();

  const client = new MongoClient(MONGO_CONNECTION_STRING)

  try {
    let tot = 0;

    for (const cat of cats) {
      let cnt = 0;
      reportCategory(cat);

      const query = wikidataQuery(cat, concat(s, w), concat(n, e));
      const objs = (await fetchFromWikidata(query)
        .then((jsn) => constructFromJson(jsn)))
        .filter((obj) => obj.location && obj.keywords.length > 0);

      objs.forEach((obj) => obj.name = obj.name ?? convertKeywordToName(obj.keywords[0]));

      reportFetchedItems(objs, resource);

      for (const obj of objs) {

        if (!await getGrainCollection(client).findOne({ "linked.wikidata": obj.wikidata })) {
          ++cnt;

          const loc = obj.location;
          const ins = {
            name: obj.name,
            keywords: obj.keywords,
            location: loc,
            position: {
              type: "Point",
              coordinates: [loc.lon, loc.lat]
            },
            attributes: {
              name: obj.name,
              image: obj.image,
              description: obj.description
            },
            linked: {
              mapycz: obj.mapycz,
              geonames: obj.geonames,
              wikidata: obj.wikidata
            }
          };

          await writeCreateToDatabase(client, ins);
        }
      }
      tot += cnt;
      reportCreatedItems(cat, cnt, tot);
    }

    reportFinished(resource, tot);
  }
  catch (ex) { reportError(ex); }
  finally { await client.close(); }
}

wikidataCreate();
