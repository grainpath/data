using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace osm
{
    internal sealed class Point
    {
        public double lon { get; set; }

        public double lat { get; set; }
    }

    internal sealed class GeoJsonPoint
    {
        public GeoJsonPoint(double lon, double lat) { coordinates = new() { lon, lat }; }

        public string type { get; set; } = "Point";

        public List<double> coordinates { get; set; }
    }

    internal sealed class OsmGrainTags
    {
        // types

        internal sealed class Address
        {
            [BsonIgnoreIfNull]
            public string country { get; set; }

            [BsonIgnoreIfNull]
            public string settlement { get; set; }

            [BsonIgnoreIfNull]
            public string district { get; set; }

            [BsonIgnoreIfNull]
            public string place { get; set; }

            [BsonIgnoreIfNull]
            public string house { get; set; }

            [BsonIgnoreIfNull]
            public string postal_code { get; set; }
        }

        internal sealed class Payment
        {
            [BsonIgnoreIfNull]
            public bool? cash { get; set; }

            [BsonIgnoreIfNull]
            public bool? card { get; set; }

            [BsonIgnoreIfNull]
            public bool? amex { get; set; }

            [BsonIgnoreIfNull]
            public bool? jcb { get; set; }

            [BsonIgnoreIfNull]
            public bool? mastercard { get; set; }

            [BsonIgnoreIfNull]
            public bool? visa { get; set; }

            [BsonIgnoreIfNull]
            public bool? crypto { get; set; }
        }

        // geometry

        [BsonIgnoreIfNull]
        public List<Point> polygon { get; set; }

        // info

        [BsonIgnoreIfNull]
        public string image { get; set; }

        [BsonIgnoreIfNull]
        public string website { get; set; }

        [BsonIgnoreIfNull]
        public Address address { get; set; }

        [BsonIgnoreIfNull]
        public Payment payment { get; set; }

        // contact

        [BsonIgnoreIfNull]
        public string email { get; set; }

        [BsonIgnoreIfNull]
        public string phone { get; set; }

        // boolean

        [BsonIgnoreIfNull]
        public bool? delivery { get; set; }

        [BsonIgnoreIfNull]
        public bool? drinking_water { get; set; }

        [BsonIgnoreIfNull]
        public bool? internet_access { get; set; }

        [BsonIgnoreIfNull]
        public bool? shower { get; set; }

        [BsonIgnoreIfNull]
        public bool? smoking { get; set; }

        [BsonIgnoreIfNull]
        public bool? takeaway { get; set; }

        [BsonIgnoreIfNull]
        public bool? toilets { get; set; }

        [BsonIgnoreIfNull]
        public bool? wheelchair { get; set; }

        // measurable

        [BsonIgnoreIfNull]
        public long? capacity { get; set; }

        [BsonIgnoreIfNull]
        public long? min_age { get; set; }

        [BsonIgnoreIfNull]
        public long? rank { get; set; }

        // specific

        [BsonIgnoreIfNull]
        public bool? fee { get; set; }

        [BsonIgnoreIfNull]
        public List<string> charge { get; set; }

        [BsonIgnoreIfNull]
        public List<string> opening_hours { get; set; }

        [BsonIgnoreIfNull]
        public SortedSet<string> clothes { get; set; }

        [BsonIgnoreIfNull]
        public SortedSet<string> cuisine { get; set; }

        [BsonIgnoreIfNull]
        public SortedSet<string> rental { get; set; }
    }

    internal sealed class OsmGrainLinked
    {
        [BsonIgnoreIfNull]
        public string osm { get; set; }

        [BsonIgnoreIfNull]
        public string wikidata { get; set; }
    }

    internal sealed class OsmGrain
    {
        public string name { get; set; }

        public Point location { get; set; }

        public GeoJsonPoint position { get; set; }

        public OsmGrainTags tags { get; set; } = new();

        public OsmGrainLinked linked { get; set; } = new();

        public SortedSet<string> keywords { get; set; } = new();
    }
}
