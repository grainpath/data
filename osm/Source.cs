using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using OsmSharp;
using OsmSharp.Streams;

namespace osm
{
    internal class Source : IEnumerable<OsmGrain>
    {
        float l, t, r, b;
        private readonly ILogger _logger;
        private readonly OsmStreamSource _stream;

        private bool withinBbox(Node node)
        {
            var lon = node.Longitude; var lat = node.Latitude;

            return lon is not null && (float)lon.Value >= l && (float)lon.Value <= r
                && lat is not null && (float)lat.Value >= b && (float)lat.Value <= t;
        }

        public Source(ILogger logger, OsmStreamSource stream, (float, float, float, float) bbox)
        {
            _logger = logger; _stream = stream; (l, t, r, b) = bbox;
        }

        public IEnumerator<OsmGrain> GetEnumerator()
        {
            var source = from item in _stream
                         where (item.Type == OsmGeoType.Way  ||
                                item.Type == OsmGeoType.Node && withinBbox(item as Node))
                         select item;

            long step = 0;

            foreach (var item in source) {

                ++step;

                if (step % 10_000_000 == 0) {
                    GC.Collect(2);
                    _logger.LogInformation("Still working... {0} objects already processed.", step);
                }

                var grain = Inspector.Inspect(item as Node) ?? Inspector.Inspect(item as Way);

                if (grain is not null) { yield return grain; }
            }
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
}
