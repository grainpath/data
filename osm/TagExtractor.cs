using OsmSharp.Tags;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;

namespace osm
{
    static class TagExtractor
    {
        static Regex SnakeCaseRegex = new(@"^[a-z]+(?:[_][a-z]+)*$", RegexOptions.Compiled);

        static string Http(string str)
            => Regex.IsMatch(str, @"^https?://") ? str : "http://" + str;

        static List<string> Divide(string s)
            => s.Split(';', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList();

        static bool IsNonTrivialString(string s)
        => s is not null && s != string.Empty;

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

        static void Accommodate(TagsCollectionBase tags, string[] lst, Action<string> act)
        {
            foreach (var item in lst) {
                if (tags.TryGetValue(item, out var v) && IsNonTrivialString(v)) {
                    act.Invoke(v); return;
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

        //

        static void Name(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "name:en", "name", "alt_name", "brand", "operator" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && IsNonTrivialString(v)) {
                    gtags.Name = v; return;
                }
            }
        }

        static void Image(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "image", };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && IsStandardUri(Http(v))) {
                    gtags.Image = Http(v); return;
                }
            }
        }

        static void Website(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            string[] ks;

            ks = new[] { "contact:website", "website", "url" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && IsStandardUri(Http(v))) {
                    gtags.Website = Http(v); return;
                }
            }

            ks = new[] { "wikipedia" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && TryConstructWikipedia(v, out var u)) {
                    gtags.Website = u; return;
                }
            }
        }

        static void Address(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var _c = new string[] { "addr:country", };
            var _s = new string[] { "addr:city", "addr:province", "addr:county", "addr:hamlet", };
            var _d = new string[] { "addr:district", "addr:subdistrict", "addr:suburb", };
            var _p = new string[] { "addr:street", "addr:place", };
            var _h = new string[] { "addr:housenumber", "addr:conscriptionnumber", };
            var _t = new string[] { "addr:postcode", "addr:postbox", };

            Accommodate(otags, _c, (string c) => { gtags.Country = c; });
            Accommodate(otags, _s, (string s) => { gtags.Settlement = s; });
            Accommodate(otags, _d, (string d) => { gtags.District = d; });
            Accommodate(otags, _p, (string p) => { gtags.Place = p; });
            Accommodate(otags, _h, (string h) => { gtags.House = h; });
            Accommodate(otags, _t, (string t) => { gtags.PostalCode = t; });
        }

        static void Email(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "contact:email", "email", };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && MailAddress.TryCreate(v, out _)) {
                    gtags.Email = v; return;
                }
            }
        }

        static void Phone(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "contact:phone", "phone", "contact:mobile", }; 

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v) && IsPhone(v)) {
                    gtags.Phone = v; return;
                }
            }
        }

        static void Fee(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "fee", "toll" };
            var vs = new SortedSet<string> { "no" };

            foreach (var k in ks) {
                if (otags.TryGetValue(k, out var v)) {
                    gtags.Fee = vs.Contains(v) ? false : true; return;
                }
            }
        }

        static void Charge(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            var ks = new string[] { "charge", };

            foreach (var k in ks) {

                if (otags.TryGetValue(k, out var v)) {

                    var vs = Divide(v);

                    if (IsNonTrivialStringSequence(vs)) {
                        gtags.Charge = vs; return;
                    }
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
                        gtags.OpeningHours = vs; return;
                    }
                }
            }
        }

        public static void Extract(TagsCollectionBase otags, OsmGrainTags gtags)
        {
            Name(otags, gtags);
            Image(otags, gtags);
            Website(otags, gtags);
            Address(otags, gtags);
            Email(otags, gtags);
            Phone(otags, gtags);
            Fee(otags, gtags);
            Charge(otags, gtags);
            OpeningHours(otags, gtags);
        }
    }
}
