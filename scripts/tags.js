import fs from "fs";
import {
  ASSETS_BASE_ADDR,
  isValidKeyword,
} from "./const.js";

/**
 * Extracted value should occur at least `COUNT_LIMIT` times.
 */
const COUNT_LIMIT = 50;

const query = ({ key }) => {
  return `https://taginfo.openstreetmap.org/api/4/key/values?key=${key}&filter=all&lang=en&sortname=count&sortorder=desc&qtype=value&format=json`;
};

const FORBIDDEN_VALUES = new Set([
  "abandoned",
  "and",
  "antenna",
  "apron",
  "attached",
  "bare_rock",
  "barrack",
  "bay",
  "building",
  "buildings",
  "cape",
  "case",
  "clearway",
  "cliff",
  "coastline",
  "colapsed",
  "collapsed",
  "construction",
  "damaged",
  "demolished",
  "destroyed",
  "detached",
  "detached_house",
  "disused",
  "exit",
  "fixme",
  "fuel",
  "garage",
  "general",
  "glacier",
  "grassland",
  "hangar",
  "heath",
  "helipad",
  "holding_position",
  "home",
  "house",
  "incomplete",
  "jet_bridge",
  "mast",
  "maybe",
  "mean_low_water_springs",
  "mixed_use",
  "mixed_used",
  "motorcycle_parking",
  "mud",
  "no",
  "occupied",
  "obstacle",
  "outbuilding",
  "parking",
  "parking_entrance",
  "parking_exit",
  "parking_position",
  "parking_space",
  "part",
  "place",
  "platform",
  "prefabricated",
  "preserved",
  "proposed",
  "razed",
  "recycling",
  "residential",
  "ridge",
  "rock",
  "rooms",
  "runway",
  "saddle",
  "sand",
  "scree",
  "scrub",
  "semi",
  "semidetached",
  "semidetached_house",
  "service",
  "shingle",
  "shops",
  "shrub",
  "silo",
  "sinkhole",
  "small",
  "stop_area",
  "stop_position",
  "survey_point",
  "taxilane",
  "taxiway",
  "transportation",
  "tree",
  "tree_row",
  "unclassified",
  "undefined",
  "unit",
  "units",
  "unknown",
  "utility_pole",
  "ventilation_shaft",
  "waste_basket",
  "water",
  "wetland",
  "windsock",
  "wood",
  "yes",
  "yesq",
]);

/**
 * Extracts possible values of the most popular tags with their frequencies.
 * 
 * See https://taginfo.openstreetmap.org/taginfo/apidoc#api_4_key_values.
 */
async function extract(args) {

  console.log(`Started processing OSM tags ${args.join(", ")}.`);

  for (const key of args) {

    console.log(` > Processing key ${key}.`);

    const dict = new Map();

    await fetch(query({ key: key }))
      .then(res => res.json())
      .then(res => {

        res.data.forEach(item => {

          // extract only valid values
          item.value
            .split(/[\s;,]+/)
            .map(value => value.toLowerCase().replace("-", "_"))
            .filter(value => isValidKeyword(value) && !FORBIDDEN_VALUES.has(value))
            .forEach(value => {
              if (!dict.has(value)) { dict.set(value, 0); }
              dict.set(value, dict.get(value) + item.count);
            });
        });
      })
      .then(() => {

        const file = `${ASSETS_BASE_ADDR}/tags/${key}.json`;

        // Map does not maintain lexicographic order!
        let obj = [ ...dict.keys() ]
          .map(key => { return { value: key, count: dict.get(key) }; })
          .sort((l, r) => r.count - l.count)
          .filter(pair => pair.count >= COUNT_LIMIT);

        // write to a file
        fs.writeFileSync(file, JSON.stringify(obj, null, 2));

        console.log(` > Finished processing file ${file}, extracted ${obj.length} objects.`);
      })
      .catch(err => console.log(err));
  }

  console.log("Finished processing OSM tags.");
}

extract(process.argv.slice(2));
