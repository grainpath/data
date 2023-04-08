using System;
using System.Linq;
using OsmSharp.Tags;

namespace osm;

internal class NameExtractor
{
    public static void Extract(TagsCollectionBase tags, Place grain)
    {
        string name = null;
        var ks = new string[] { "name:en", "name", "alt_name", "brand", "operator" };

        foreach (var k in ks)
        {
            if (name is null && tags.TryGetValue(k, out var v) && Verifier.IsNonTrivialString(v))
            {
                name = v;
            }
        }

        if (name is null)
        {
            var keyword = grain.keywords.ToList()[new Random().Next(0, grain.keywords.Count)];
            name = string.Concat(char.ToUpper(keyword[0]).ToString(), keyword.AsSpan(1));
        }

        grain.name = name;
        grain.attributes.name = name;
    }
}
