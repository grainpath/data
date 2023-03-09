using System;
using System.Linq;
using OsmSharp.Tags;

namespace osm
{
    class NameExtractor
    {
        public static void Extract(TagsCollectionBase tags, OsmGrain grain)
        {
            var ks = new string[] { "name:en", "name", "alt_name", "brand", "operator" };

            foreach (var k in ks) {
                if (tags.TryGetValue(k, out var v) && TagExtractor.IsNonTrivialString(v)) {
                    grain.name = v;
                    return;
                }
            }

            var keyword = grain.keywords.ToList()[new Random().Next(0, grain.keywords.Count)].Replace('_', ' ');
            grain.name = string.Concat(char.ToUpper(keyword[0]).ToString(), keyword.AsSpan(1));
        }
    }
}
