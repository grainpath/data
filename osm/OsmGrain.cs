using GeoJSON.Text.Feature;
using GeoJSON.Text.Geometry;
using System.Collections.Generic;

namespace osm
{
    internal class OsmGrainTags
    {
        // info

        public string Name { get; set; }

        public string Image { get; set; }

        public string Website { get; set; }

        // address

        public string Country { get; set; }

        public string Settlement { get; set; }

        public string District { get; set; }

        public string Place { get; set; }

        public string House { get; set; }

        public string PostalCode { get; set; }

        // contact

        public string Email { get; set; }

        public string Phone { get; set; }

        // specific

        public bool? Fee { get; set; }

        public string Charge { get; set; }

        public string OpeningHours { get; set; }

        public SortedSet<string> Clothes { get; set; }

        public SortedSet<string> Cuisine { get; set; }

        public SortedSet<string> Rental { get; set; }

        // measurable

        public long? Capacity { get; set; }

        public long? MinAge { get; set; }

        public long? Rank { get; set; }

        // boolean

        public bool? Delivery { get; set; }

        public bool? DrinkingWater { get; set; }

        public bool? InternetAccess { get; set; }

        public bool? Shower { get; set; }

        public bool? Takeaway { get; set; }

        public bool? Toilets { get; set; }

        public bool? Wheelchair { get; set; }
    }

    internal class OsmGrainLinked
    {
        public string Osm { get; set; }

        public string Wikidata { get; set; }
    }

    internal class OsmGrain
    {
        public Feature Shape { get; set; }

        public Point Location { get; set; }

        public OsmGrainTags Tags { get; set; } = new();

        public OsmGrainLinked Linked { get; set; } = new();

        public SortedSet<string> Keywords { get; set; } = new();
    }
}
