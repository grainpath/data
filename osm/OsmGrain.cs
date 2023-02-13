using GeoJSON.Text.Feature;
using GeoJSON.Text.Geometry;
using System.Collections.Generic;

namespace osm
{
    internal class OsmGrainAddress
    {
        public string country { get; set; }

        public string settlement { get; set; }

        public string district { get; set; }

        public string place { get; set; }

        public string house { get; set; }

        public string postal_code { get; set; }
    }

    internal class OsmGrainPayment
    {
        public bool? cash { get; set; }

        public bool? card { get; set; }

        public bool? amex { get; set; }

        public bool? jcb { get; set; }

        public bool? mastercard { get; set; }

        public bool? visa { get; set; }

        public bool? crypto { get; set; }
    }

    internal class OsmGrainTags
    {
        // info

        public string name { get; set; }

        public string image { get; set; }

        public string website { get; set; }

        public OsmGrainAddress address { get; set; } = new();

        public OsmGrainPayment payment { get; set; } = new();

        // contact

        public string email { get; set; }

        public string phone { get; set; }

        // boolean

        public bool? delivery { get; set; }

        public bool? drinking_water { get; set; }

        public bool? internet_access { get; set; }

        public bool? shower { get; set; }

        public bool? smoking { get; set; }

        public bool? takeaway { get; set; }

        public bool? toilets { get; set; }

        public bool? wheelchair { get; set; }

        // measurable

        public long? capacity { get; set; }

        public long? min_age { get; set; }

        public long? rank { get; set; }

        // specific

        public bool? fee { get; set; }

        public List<string> charge { get; set; }

        public List<string> opening_hours { get; set; }

        public SortedSet<string> clothes { get; set; }

        public SortedSet<string> cuisine { get; set; }

        public SortedSet<string> rental { get; set; }
    }

    internal class OsmGrainLink
    {
        public string osm { get; set; }

        public string wikidata { get; set; }
    }

    internal class OsmGrain
    {
        public Feature shape { get; set; }

        public Point location { get; set; }

        public OsmGrainTags tags { get; set; } = new();

        public OsmGrainLink link { get; set; } = new();

        public SortedSet<string> keywords { get; set; } = new();
    }
}
