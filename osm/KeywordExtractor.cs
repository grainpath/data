using OsmSharp.Tags;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace osm
{
    static class KeywordExtractor
    {
        private sealed class Item
        {
            public string value { get; set; }
        }

        private sealed class AssocPair
        {
            public SortedSet<string> values { get; set; }

            public SortedSet<string> enrich { get; set; }
        }

        static readonly SortedSet<string> _wi;
        static readonly SortedSet<string> _wo;
        static readonly Dictionary<string, List<AssocPair>> _assoc;
        static readonly Dictionary<string, SortedSet<string>> _tags = new();

        static KeywordExtractor()
        {
            _wi = new()
            {
                "aerialway",
                "aeroway",
                "club",
                "craft",
                "hazard",
                "healthcare",
                "historic",
                "tourism"
            };

            _wo = new()
            {
                "amenity",
                "artwork_type",
                "attraction",
                "building",
                "business",
                "emergency",
                "leisure",
//              "man_made",
                "natural",
                "office",
                "public_transport",
                "shop",
                "sport"
            };

            var union = _wi.Union(_wo);

            foreach (var key in union) {

                var path = string.Join(Path.DirectorySeparatorChar, new[] { "Resources", "tags", key + ".json" });
                var json = File.ReadAllText(path);
                _tags.Add(key, new(JsonSerializer.Deserialize<List<Item>>(json).Select(i => i.value)));
            }

            {
                var path = string.Join(Path.DirectorySeparatorChar, new[] { "Resources", "enrich", "assoc.json" });
                var json = File.ReadAllText(path);
                _assoc = JsonSerializer.Deserialize<Dictionary<string, List<AssocPair>>>(json);

                foreach (var item in union) {
                    if (!_assoc.ContainsKey(item)) { _assoc[item] = new(); }
                }
            }
        }

        static void extract(string tag, TagsCollectionBase otags, SortedSet<string> keywords, bool wk)
        {
            if (otags.TryGetValue(tag, out var val)) {

                var allow = _tags[tag];
                var assoc = _assoc[tag];

                var vs = val.Split(';', StringSplitOptions.RemoveEmptyEntries).Select(v => v.Trim());

                foreach (var v in vs) {

                    if (allow.Contains(v)) {

                        keywords.Add(v);
                        if (wk) { keywords.Add(tag); }
                    }

                    foreach (var a in assoc) {

                        if (a.values.Contains(v) && allow.Contains(v)) {

                            keywords.Add(v);
                            if (wk) { keywords.Add(tag); }
                            foreach (var e in a.enrich) { keywords.Add(e); }
                        }
                    }
                }
            }
        }

        public static void Extract(TagsCollectionBase otags, SortedSet<string> keywords)
        {
            foreach (var w in _wi) {
                extract(w, otags, keywords, true);
            }

            foreach (var w in _wo) {
                extract(w, otags, keywords, false);
            }
        }
    }
}
