using GeoJSON.Text.Feature;
using GeoJSON.Text.Geometry;
using OsmSharp;
using System.Collections.Generic;

namespace osm
{
    internal static class Inspector
    {
        private sealed class Pt
        {
            public double Lon { get; set; }
            public double Lat { get; set; }
        }

        private static class Help
        {
            public static bool Bounds(double lon, double lat)
            {
                return lon >= -_boundLon && lon <= +_boundLon
                    && lat >= -_boundLat && lat <= +_boundLat;
            }
        }

        // EPSG:3857 bounds, see https://epsg.io/3857
        private static readonly double _boundLon = 180.0;
        private static readonly double _boundLat = 85.06;

        private static readonly Dictionary<long, Pt> _nodes = new();
        private static readonly string _url = "https://www.openstreetmap.org/";

        public static OsmGrain Inspect(Node node)
        {
            if (node is not null) {

                /* Nodes are used for way and relation definitions. Not defined
                 * nodes mean the file is broken, no reason to continue further. */

                var d = node.Id is not null && node.Longitude is not null && node.Latitude is not null;

                if (!d) { Reporter.ReportUndefined(node); }

                // extract and verify position

                var lon = node.Longitude.Value;
                var lat = node.Latitude.Value;

                if (!Help.Bounds(lon, lat)) { Reporter.ReportOutbound(node); }

                // keep node for later usage

                _nodes.Add(node.Id.Value, new() { Lon = lon, Lat = lat });

                if (node.Tags is null || node.Tags.Count == 0) { return null; }

                // extract keywords and tags

                var grain = new OsmGrain();
                KeywordExtractor.Extract(node.Tags, grain.Keywords);

                if (grain.Keywords.Count > 0) {

                    TagExtractor.Extract(node.Tags, grain.Tags);
                    LinkExtractor.Extract(node.Tags, grain.Link);

                    grain.Link.Osm = _url + "node/" + node.Id.Value.ToString();

                    grain.Location = new Point(new Position(lat, lon));
                    grain.Shape = new Feature(grain.Location);

                    return grain;
                }
            }

            return null;
        }

        public static OsmGrain Inspect(Way way)
        {
            return null;
        }
    }
}
