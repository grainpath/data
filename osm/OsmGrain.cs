using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace osm
{
    internal class OsmGrainAddress
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

    internal class OsmGrainPayment
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

    internal class OsmGrainTags
    {
        // info

        [BsonIgnoreIfNull]
        public string name { get; set; }

        [BsonIgnoreIfNull]
        public string image { get; set; }

        [BsonIgnoreIfNull]
        public string website { get; set; }

        [BsonIgnoreIfNull]
        public OsmGrainAddress address { get; set; }

        [BsonIgnoreIfNull]
        public OsmGrainPayment payment { get; set; }

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

    internal class OsmGrainLinked
    {
        [BsonIgnoreIfNull]
        public string osm { get; set; }

        [BsonIgnoreIfNull]
        public string wikidata { get; set; }
    }

    internal class OsmGrain
    {
        [BsonIgnoreIfNull]
        public BsonDocument shape { get; set; }

        [BsonIgnoreIfNull]
        public BsonDocument location { get; set; }

        public OsmGrainTags tags { get; set; } = new();

        public OsmGrainLinked linked { get; set; } = new();

        public SortedSet<string> keywords { get; set; } = new();
    }
}
