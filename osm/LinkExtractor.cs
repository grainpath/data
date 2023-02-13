using System.Text.RegularExpressions;
using OsmSharp;
using OsmSharp.Tags;

namespace osm
{
    class LinkExtractor
    {
        static readonly string _url = "https://www.openstreetmap.org/";

        static void Wikidata(TagsCollectionBase tags, OsmGrainLink link)
        {
            if (tags.TryGetValue("wikidata", out var v) && Regex.IsMatch(v, @"^Q[1-9][0-9]*$")) {
                link.wikidata = "https://www.wikidata.org/wiki/" + v;
            }
        }

        public static void Extract(Node node, OsmGrainLink link)
        {
            link.osm = _url + "node/" + node.Id.Value.ToString();
            Wikidata(node.Tags, link);
        }

        public static void Extract(Way way, OsmGrainLink link)
        {
            link.osm = _url + "way/" + way.Id.Value.ToString();
            Wikidata(way.Tags, link);
        }
    }
}
