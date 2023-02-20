using Microsoft.Extensions.Logging;
using OsmSharp.Streams;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace osm
{
    static class SourceFactory
    {
        private static OsmStreamSource toStream(string file)
        {
            var path = string.Join(Path.DirectorySeparatorChar, new[] { Constants.RESOURCES_BASE_ADDR, "maps", file });

            FileStream fStream;

            try {
                fStream = File.OpenRead(path);
            }
            catch (Exception) { throw new Exception($"Cannot create file stream at ${path}."); }

            Func<OsmStreamSource> func = null;

            if (file.EndsWith(".pbf")) {
                func = new(() => { return new PBFOsmStreamSource(fStream); });
            }

            if (file.EndsWith(".osm")) {
                func = new(() => { return new XmlOsmStreamSource(fStream); });
            }

            if (func is null) {
                throw new Exception($"Name of the file should have .pbf or .osm extension.");
            }

            try {
                return func.Invoke();
            }
            catch (Exception) { throw new Exception($"Cannot create OSM stream from ${fStream}."); }
        }

        private static (float, float, float, float) toBbox(List<string> bbox)
        {
            if (bbox is null || bbox.Count == 0) {
                return (-CrsEpsg3857.BoundLon, +CrsEpsg3857.BoundLat, +CrsEpsg3857.BoundLon, -CrsEpsg3857.BoundLat);
            }

            var errMsg = "Bbox shall be in the format left;top;right;bottom within EPSG:3857.";

            if (bbox.Count != 4) { throw new Exception(errMsg); }
            var coords = bbox.Select(t => float.Parse(t)).ToList();

            return (Math.Min(coords[0], coords[2]),
                    Math.Max(coords[1], coords[3]),
                    Math.Max(coords[0], coords[2]),
                    Math.Min(coords[1], coords[3]));
        }

        public static Source GetInstance(ILogger logger, string file, List<string> bbox)
        {
            return new(logger, toStream(file), toBbox(bbox));
        }
    }
}
