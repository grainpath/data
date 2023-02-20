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

        public Source(ILogger logger, OsmStreamSource stream, (float, float, float, float) bbox)
        {
            _logger = logger; _stream = stream; (l, t, r, b) = bbox;
        }

        public IEnumerator<OsmGrain> GetEnumerator()
        {
            var source = from item in _stream.FilterBox(l, t, r, b) where (item.Type != OsmGeoType.Relation) select item;

            long step = 0;

            foreach (var item in source) {

                ++step;

                if (step % 10_000_000 == 0) {
                    _logger.LogInformation("Still working... {0} objects already processed.", step);
                }

                var grain = Inspector.Inspect(item as Node) ?? Inspector.Inspect(item as Way);

                if (grain is not null) { yield return grain; }
            }
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
}
