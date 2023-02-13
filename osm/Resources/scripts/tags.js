const fs = require("fs");

/**
 * Extracted value should occure at least `COUNT_LIMIT` times.
 */
const COUNT_LIMIT = 25;

/**
 * Extracted value should have lehgth between `MIN` and `MAX` chars.
 */
const LENGTH_LIMIT_MIN = 3;
const LENGTH_LIMIT_MAX = 25;

const SNAKE_CASE_PATTERN = /^[a-z]+(?:[_][a-z]+)*$/;

const FORBIDDEN_VALUES = new Set([
  "abandoned",
  "and",
  "antenna",
  "apron",
  "attached",
  "barrack",
  "bay",
  "building",
  "buildings",
  "case",
  "clearway",
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
  "garage",
  "general",
  "holding_position",
  "home",
  "house",
  "incomplete",
  "maybe",
  "mixed_use",
  "mixed_used",
  "no",
  "occupied",
  "obstacle",
  "outbuilding",
  "part",
  "place",
  "platform",
  "prefabricated",
  "preserved",
  "proposed",
  "razed",
  "residential",
  "rooms",
  "semi",
  "semidetached",
  "semidetached_house",
  "service",
  "shops",
  "small",
  "stop_area",
  "stop_position",
  "taxilane",
  "taxiway",
  "transportation",
  "tree",
  "unclassified",
  "undefined",
  "unit",
  "units",
  "unknown",
  "utility_pole",
  "ventilation_shaft",
  "waste_basket",
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

    const D = new Map();
    const Q = `https://taginfo.openstreetmap.org/api/4/key/values?key=${key}&filter=all&lang=en&sortname=count&sortorder=desc&qtype=value&format=json`;

    await fetch(Q)
      .then(res => res.json())
      .then(res => {

        res.data.forEach(item => {

          // extract only valid values
          item.value
            .split(/[\s;,]+/)
            .map(value => value.toLowerCase().replace("-", "_"))
            .filter(value => {
              return value.match(SNAKE_CASE_PATTERN) && !FORBIDDEN_VALUES.has(value)
                && value.length >= LENGTH_LIMIT_MIN && value.length <= LENGTH_LIMIT_MAX;
            })
            .forEach(value => {

              if (!D.has(value)) { D.set(value, 0); }
              D.set(value, D.get(value) + item.count);
            });
        });
      })
      .then(() => {

        const file = `../tags/${key}.json`;

        // Map does not maintain lexicographic order!
        const obj = [ ...D.keys() ]
          .map(key => { return { value: key, count: D.get(key) }; })
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
