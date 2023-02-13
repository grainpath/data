using OsmSharp;
using System;
using System.Text.Json;

namespace osm
{
    static class Reporter
    {
        static string serialize<T>(T entity)
        {
            var opts = new JsonSerializerOptions() { WriteIndented = true };
            return JsonSerializer.Serialize<T>(entity, opts);
        }

        public static void ReportUndefined(Node node)
        {
            throw new ArgumentException($"Undefined node detected." + Environment.NewLine + $"{serialize(node)}");
        }

        public static void ReportOutbound(Node node)
        {
            throw new ArgumentException($"Outbound node detected." + Environment.NewLine + $"{serialize(node)}");
        }

        public static void ReportUndefined(Way way)
        {
            throw new ArgumentException($"Undefined way detected." + Environment.NewLine + $"{serialize(way)}");
        }

        public static void ReportMalformed(Way way)
        {
            throw new ArgumentException($"Malformed way sequence detected." + Environment.NewLine + $"{serialize(way)}");
        }
    }
}
