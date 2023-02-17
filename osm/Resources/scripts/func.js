import fs from "fs";

export function map2file(m, file, limit) {

  // Map does not maintain lexicographic order!
  let obj = [ ...m.keys() ]
    .map(key => { return { value: key, count: m.get(key) }; })
    .sort((l, r) => r.count - l.count)
    .filter(pair => pair.count >= limit);

  // write to a file
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));

  return obj;
}
