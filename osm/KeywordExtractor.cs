using OsmSharp.Tags;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace osm
{
    static class KeywordExtractor
    {
        private sealed class Item
        {
            [JsonPropertyName("value")]
            public string Value { get; set; }
        }

        private sealed class AssocPair
        {
            [JsonPropertyName("values")]
            public SortedSet<string> Values { get; set; }

            [JsonPropertyName("enrich")]
            public SortedSet<string> Enrich { get; set; }
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
                "public_transport",
                "tourism",
            };

            _wo = new()
            {
                "amenity",
                "building",
                "business",
                "emergency",
                "leisure",
                "man_made",
                "natural",
                "office",
                "shop",
                "sport",
            };

            foreach (var key in _wi.Union(_wo)) {

                var path = string.Join(Path.DirectorySeparatorChar, new[] { "Resources", "tags", key + ".json" });
                var json = File.ReadAllText(path);
                _tags.Add(key, new(JsonSerializer.Deserialize<List<Item>>(json).Select(i => i.Value)));
            }

            {
                var path = string.Join(Path.DirectorySeparatorChar, new[] { "Resources", "enrich", "assoc.json" });
                var json = File.ReadAllText(path);
                _assoc = JsonSerializer.Deserialize<Dictionary<string, List<AssocPair>>>(json);
            }
        }

        static void extract(string tag, TagsCollectionBase otags, SortedSet<string> keywords, bool wk)
        {
            if (otags.TryGetValue(tag, out var val)) {

                var tags = _tags[tag];
                var assoc = _assoc[tag];

                var vs = val.Split(';', StringSplitOptions.RemoveEmptyEntries).Select(v => v.Trim());

                foreach (var v in vs) {

                    if (tags.Contains(v)) {

                        keywords.Add(v);

                        if (wk) { keywords.Add(tag); }
                    }

                    foreach (var a in assoc) {

                        if (a.Values.Contains(v)) {

                            keywords.Add(v);

                            if (wk) { keywords.Add(tag); }

                            foreach (var e in a.Enrich) { keywords.Add(e); }
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
