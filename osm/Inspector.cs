using GeoJSON.Text.Feature;
using GeoJSON.Text.Geometry;
using OsmSharp;
using System.Collections.Generic;
using System.Linq;

namespace osm
{
    internal static class Inspector
    {
        private sealed class Pt
        {
            public double Lon { get; set; }
            public double Lat { get; set; }
        }

        public static bool Bounds(double lon, double lat)
        {
            return lon >= -_boundLon && lon <= +_boundLon
                && lat >= -_boundLat && lat <= +_boundLat;
        }

        // EPSG:3857 bounds, see https://epsg.io/3857
        private static readonly double _boundLon = 180.0;
        private static readonly double _boundLat = 85.06;

        private static readonly Dictionary<long, Pt> _nodes = new();

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

                if (!Bounds(lon, lat)) { Reporter.ReportOutbound(node); }

                // keep node for later usage

                _nodes.Add(node.Id.Value, new() { Lon = lon, Lat = lat });

                if (node.Tags is null || node.Tags.Count == 0) { return null; }

                // extract keywords and tags

                var grain = new OsmGrain();
                KeywordExtractor.Extract(node.Tags, grain.keywords);

                if (grain.keywords.Count > 0) {

                    TagExtractor.Extract(node.Tags, grain);
                    LinkExtractor.Extract(node, grain.link);

                    grain.location = new Point(new Position(lat, lon));
                    grain.shape = new Feature(grain.location);

                    return grain;
                }
            }

            return null;
        }

        private static bool TryGetSequence(Way way, out List<Point> sequence)
        {
            sequence = new();

            foreach (var id in way.Nodes) {
                if (!_nodes.TryGetValue(id, out var node)) { return false; }
                sequence.Add(new(new Position(node.Lat, node.Lon)));
            }

            return true;
        }

        public static OsmGrain Inspect(Way way)
        {
            if (way is not null) {

                // check if the way is properly defined

                var d = way.Id is not null && way.Nodes is not null && way.Nodes.Length >= 2;

                if (!d) { Reporter.ReportUndefined(way); }

                // small or open ways are skipped, closed polygons pass

                if (way.Nodes.Length < 4 || way.Nodes[0] != way.Nodes[^1] || way.Tags is null || way.Tags.Count == 0) { return null; }

                var grain = new OsmGrain();

                if (!TryGetSequence(way, out var seq)) { Reporter.ReportMalformed(way); }

                KeywordExtractor.Extract(way.Tags, grain.keywords);

                if (grain.keywords.Count > 0) {

                    TagExtractor.Extract(way.Tags, grain);
                    LinkExtractor.Extract(way, grain.link);

                    /* Note that both IsCounterClockwise and Centroid
                     * use closedness of the shape verified above. */

                    /* GeoJSON assumes counterclockwise external rings,
                     * see https://www.rfc-editor.org/rfc/rfc7946#appendix-B.1! */

                    if (!Cartesian.IsCounterClockwise(seq)) { seq.Reverse(); }

                    grain.location = Cartesian.Centroid(seq);

                    var polygon = new Polygon(new List<LineString>()
                    {
                        new LineString(seq.Select(p => p.Coordinates))
                    });
                    grain.shape = new Feature(polygon);

                    return grain;
                }
            }

            return null;
        }
    }
}
