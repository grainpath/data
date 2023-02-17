using OsmSharp.Tags;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace osm
{
    static class TagExtractor
    {
        private sealed class Item
        {
            public string value { get; set; }
        }

        static readonly SortedSet<string> _clothes;
        static readonly SortedSet<string> _cuisine;
        static readonly SortedSet<string> _rental;

        static SortedSet<string> GetCollection(string file)
        {
            var json = File.ReadAllText(string.Join(Path.DirectorySeparatorChar, new[] { Constants.ASSETS_BASE_ADDR, "tags", file + ".json" }));
            return new(JsonSerializer.Deserialize<List<Item>>(json).Select(i => i.value));
        }

        static TagExtractor()
        {
            _clothes = GetCollection("clothes");
            _cuisine = GetCollection("cuisine");
            _rental = GetCollection("rental");
        }

        // supporting functions

        static string Http(string str)
            => Regex.IsMatch(str, @"^https?://") ? str : "http://" + str;

        static List<string> Divide(string s)
            => s.Split(';', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList();

        static bool IsNonTrivialString(string s) => s is not null && s != string.Empty;

        static bool IsNonTrivialStringSequence(List<string> seq)
        {
            var result = true;

            if (seq is null || seq.Count == 0) { return !result; }

            foreach (var c in seq) { result &= IsNonTrivialString(c); }

            return result;
        }

        static bool IsStandardUri(string s)
        {
            return Uri.TryCreate(s, UriKind.Absolute, out var uri) && uri.IsAbsoluteUri
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
        }

        static bool TryConstructWikipedia(string str, out string uri)
        {
            uri = null;

            if (Regex.IsMatch(str, @"^[a-z]{2}:[A-Za-z0-9].*$")) {

                var lst = str.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

                var pfx = lst[0].AsSpan(0, 2).ToString();
                var sfx = lst[0].AsSpan(3).ToString();

                lst[0] = sfx;

                uri = "https://"
                    + pfx
                    + ".wikipedia.org/wiki/"
                    + string.Join('_', lst);

                return IsStandardUri(uri);
            }

            return false;
        }

        static void Accommodate(TagsCollectionBase otags, OsmGrainTags gtags, string[] lst, Action<string> act)
        {
            foreach (var item in lst) {
                if (otags.TryGetValue(item, out var v) && IsNonTrivialString(v)) {
                    gtags.address = gtags.address ?? new();
                    act.Invoke(v);
                    return;
                }
            }
        }

        static void Pay(TagsCollectionBase otags, OsmGrainTags gtags, string[] lst, Action<bool> act)
        {
            var vs = new SortedSet<string> { "yes", "only" };

            foreach (var item in lst) {
                if (otags.TryGetValue(item, out var v)) {
                    gtags.payment= gtags.payment ?? new();
                    act.Invoke(vs.Contains(v));
                    return;
                }
            }
        }

        static bool IsPhone(string s)
        {
            var _base = "+0123456789";
            var _spec = " -()[]";
            var _comp = _base + _spec;

            bool predicate(string str)
            {
                return str is not null
                    && str.Length >= 5 && str.Length <= 30
                    && str.All(l => _comp.Contains(l));
            }

            string filter(string str)
            {
                var buf = new StringBuilder();

                foreach (var ch in str) {
                    if (!_spec.Contains(ch)) { buf.Append(ch); }
                }

                return buf.ToString();
            }

            return predicate(s)
                && Regex.IsMatch(filter(s), @"^\+?\d{4,20}$");
        }

        static bool TryParsePositiveInteger(string s, out long num)
        {
            num = 0;
            long cur = 0;

            for (int i = 0; i < s.Length; ++i) {

                if (char.IsDigit(s[i])) {
                    cur = cur * 10 + long.Parse(s[i].ToString());
                }
                
                else {
                    num = (cur > 0) ? cur : num;
                    cur = 0;
                }
            }

            num = (cur > 0) ? cur : num;

            return num > 0;
        }

        // extractors for a specific tag

        static void Name(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "name:en", "name", "alt_name", "brand", "operator" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && IsNonTrivialString(v)) {
                    gtags.name = v;
                    return;
                }
            }
        }

        static void Image(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            if (otags.TryGetValue("image", out var v) && IsStandardUri(Http(v))) {
                gtags.image = Http(v);
            }
        }

        static void Website(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            string[] ks;

            ks = new[] { "contact:website", "website", "url" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && IsStandardUri(Http(v))) {
                    gtags.website = Http(v);
                    return;
                }
            }

            {
                if (otags.TryGetValue("wikipedia", out var v) && TryConstructWikipedia(v, out var u)) {
                    gtags.website = u;
                }
            }
        }

        static void Address(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var _c = new[] { "addr:country" };
            var _s = new[] { "addr:city", "addr:province", "addr:county", "addr:hamlet" };
            var _d = new[] { "addr:district", "addr:subdistrict", "addr:suburb" };
            var _p = new[] { "addr:street", "addr:place" };
            var _h = new[] { "addr:housenumber", "addr:conscriptionnumber" };
            var _t = new[] { "addr:postcode", "addr:postbox" };

            Accommodate(otags, gtags, _c, (string c) => { gtags.address.country = c; });
            Accommodate(otags, gtags, _s, (string s) => { gtags.address.settlement = s; });
            Accommodate(otags, gtags, _d, (string d) => { gtags.address.district = d; });
            Accommodate(otags, gtags, _p, (string p) => { gtags.address.place = p; });
            Accommodate(otags, gtags, _h, (string h) => { gtags.address.house = h; });
            Accommodate(otags, gtags, _t, (string t) => { gtags.address.postal_code = t; });
        }

        static void Payment(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var _h = new[] { "payment:cash", "payment:coins" };
            var _d = new[] { "payment:credit_cards", "payment:debit_cards", "payment:cards" };
            var _a = new[] { "payment:american_express" };
            var _j = new[] { "payment:jcb" };
            var _m = new[] { "payment:mastercard", "payment:maestro" };
            var _v = new[] { "payment:visa", "payment:visa_electron" };
            var _c = new[] { "payment:cryptocurrencies", "payment:bitcoin" };

            Pay(otags, gtags, _h, (bool h) => { gtags.payment.cash = h; });
            Pay(otags, gtags, _d, (bool d) => { gtags.payment.card = d; });
            Pay(otags, gtags, _a, (bool a) => { gtags.payment.amex = a; });
            Pay(otags, gtags, _j, (bool j) => { gtags.payment.jcb = j; });
            Pay(otags, gtags, _m, (bool m) => { gtags.payment.mastercard = m; });
            Pay(otags, gtags, _v, (bool v) => { gtags.payment.visa = v; });
            Pay(otags, gtags, _c, (bool c) => { gtags.payment.crypto = c; });
        }

        static void Email(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "contact:email", "email" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && MailAddress.TryCreate(v, out _)) {
                    gtags.email = v;
                    return;
                }
            }
        }

        static void Phone(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "contact:phone", "phone", "contact:mobile" }; 

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && IsPhone(v)) {
                    gtags.phone = v;
                    return;
                }
            }
        }

        static void Delivery(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var vs = new SortedSet<string> { "yes", "only" };

            if (otags.TryGetValue("delivery", out var v)) {
                gtags.delivery = vs.Contains(v) ? true : false;
            }
        }

        static void DrinkingWater(TagsCollectionBase otags, OsmGrain grain)
        {
            var ks = new string[] { "drinking_water", "drinking_water:legal", "drinking_water:refill" };
            var vs = new SortedSet<string>() { "yes" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v)) {

                    if (vs.Contains(v)) { grain.keywords.Add("drinking_water"); }
                    grain.tags.drinking_water = vs.Contains(v) ? true : false;
                    return;
                }
            }
        }

        static void InternetAccess(TagsCollectionBase otags, OsmGrain grain)
        {
            var vs = new SortedSet<string>() { "wlan", "yes", "terminal", "wired", "wifi", };

            if (otags.TryGetValue("internet_access", out var v)) {

                if (vs.Contains(v)) { grain.keywords.Add("internet_access"); }
                grain.tags.internet_access = vs.Contains(v) ? true : false;
            }
        }

        static void Shower(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var vs = new SortedSet<string>() { "yes", "hot", "outdoor" };

            if (otags.TryGetValue("shower", out var v)) {
                gtags.shower = vs.Contains(v) ? true : false;
            }
        }

        static void Smoking(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new[] { "smoking", "smoking:outside" };
            var vs = new SortedSet<string>() { "yes", "outside", "isolated", "separated", "outdoor", "dedicated", "designated" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v)) {
                    gtags.smoking = vs.Contains(v) ? true : false;
                    return;
                }
            }
        }

        static void Takeaway(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var vs = new SortedSet<string> { "yes", "only" };

            if (otags.TryGetValue("takeaway", out var v)) {
                gtags.takeaway = vs.Contains(v) ? true : false;
            }
        }

        static void Toilets(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var vs = new SortedSet<string>() { "yes" };

            if (otags.TryGetValue("toilets", out var v)) {
                gtags.toilets = vs.Contains(v) ? true : false;
            }
        }

        static void Wheelchair(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var vs = new SortedSet<string>() { "yes" };

            if (otags.TryGetValue("wheelchair", out var v)) {
                gtags.wheelchair = vs.Contains(v) ? true : false;
            }
        }

        static void Capacity(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "capacity", "seats" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && long.TryParse(v, out var n) && n >= 0) {
                    gtags.capacity = n;
                    return;
                }
            }

            {
                if (otags.TryGetValue("capacity:persons", out var v) && TryParsePositiveInteger(v, out var p)) {
                    gtags.capacity = p;
                }
            }
        }

        static void MinAge(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            if (otags.TryGetValue("min_age", out var v) && long.TryParse(v, out var n) && n >= 0) {
                gtags.min_age = n;
            }
        }

        static void Rank(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            if (otags.TryGetValue("stars", out var v) && long.TryParse(v, out var n) && n >= 0) {
                gtags.rank = n;
            }
        }

        static void Fee(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "fee", "toll" };
            var vs = new SortedSet<string> { "no" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v)) {
                    gtags.fee = vs.Contains(v) ? false : true;
                    return;
                }
            }
        }

        static void Charge(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            if (otags.TryGetValue("charge", out var v)) {

                var vs = Divide(v);

                if (IsNonTrivialStringSequence(vs)) {
                    gtags.charge = vs;
                    return;
                }
            }
        }

        static void OpeningHours(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "opening_hours", "service_times", };

            foreach (var k in ks) {

                if (otags.TryGetValue(k, out var v)) {

                    var vs = Divide(v);

                    if (IsNonTrivialStringSequence(vs)) {
                        gtags.opening_hours = vs;
                        return;
                    }
                }
            }
        }

        static void Clothes(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            if (otags.TryGetValue("clothes", out var v)) {
                SortedSet<string> res = new(Divide(v).Where(item => _clothes.Contains(item)));
                gtags.clothes = (res.Count > 0) ? res : null;
            }
        }

        static void Cuisine(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var res = new SortedSet<string>();

            string v;
            var vs = new SortedSet<string>() { "yes", "only", "limited" };

            if (otags.TryGetValue("cuisine", out v)) {
                var items = Divide(v).Where(item => _cuisine.Contains(item));
                foreach (var item in items) { res.Add(item); }
            }

            if (otags.TryGetValue("diet:vegan", out v) && vs.Contains(v)) {
                res.Add("vegan");
            }

            if (otags.TryGetValue("diet:vegetarian", out v) && vs.Contains(v)) {
                res.Add("vegetarian");
            }

            if (res.Count > 0) { gtags.cuisine = res; }
        }

        static void Rental(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            if (otags.TryGetValue("rental", out var v)) {
                SortedSet<string> res = new(Divide(v).Where(item => _rental.Contains(item)));
                gtags.rental = (res.Count > 0) ? res : null;
            }
        }

        public static void Extract(TagsCollectionBase tags, OsmGrain grain)
        {
            Name(tags, grain.tags);
            Image(tags, grain.tags);
            Website(tags, grain.tags);
            Address(tags, grain.tags);
            Payment(tags, grain.tags);
            Email(tags, grain.tags);
            Phone(tags, grain.tags);
            Delivery(tags, grain.tags);
            DrinkingWater(tags, grain);
            InternetAccess(tags, grain);
            Shower(tags, grain.tags);
            Smoking(tags, grain.tags);
            Takeaway(tags, grain.tags);
            Toilets(tags, grain.tags);
            Wheelchair(tags, grain.tags);
            Capacity(tags, grain.tags);
            MinAge(tags, grain.tags);
            Rank(tags, grain.tags);
            Fee(tags, grain.tags);
            Charge(tags, grain.tags);
            OpeningHours(tags, grain.tags);
            Clothes(tags, grain.tags);
            Cuisine(tags, grain.tags);
            Rental(tags, grain.tags);
        }
    }
}
