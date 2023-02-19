using Microsoft.Extensions.Logging;
using OsmSharp.Streams;
using System;
using System.IO;

namespace osm
{
    static class SourceFactory
    {
        public static Source GetInstance(ILogger logger, string file)
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

            OsmStreamSource oStream;

            try {
                oStream = func.Invoke();
            }
            catch (Exception) { throw new Exception($"Cannot create OSM stream from ${fStream}."); }

            return new(logger, oStream);
        }
    }
}
