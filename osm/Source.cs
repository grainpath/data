using OsmSharp;
using OsmSharp.Streams;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace osm
{
    internal class Source : IEnumerable<OsmGrain>
    {
        private readonly OsmStreamSource _stream;

        public Source(OsmStreamSource stream) { _stream = stream; }

        public IEnumerator<OsmGrain> GetEnumerator()
        {
            var source = from item in _stream
                         where item.Type != OsmGeoType.Relation select item;

            foreach (var item in source) {

                var grain = Inspector.Inspect(item as Node) ?? Inspector.Inspect(item as Way);

                if (grain is not null) { yield return grain; }
            }
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
}
