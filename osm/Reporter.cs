using OsmSharp;
using System;
using System.Text.Json;

namespace osm
{
    internal static class Reporter
    {
        private static string serialize(Node node)
        {
            var opts = new JsonSerializerOptions() { WriteIndented = true };
            return JsonSerializer.Serialize<Node>(node, opts);
        }

        public static void ReportUndefined(Node node)
        {
            throw new ArgumentException($"Undefined node detected." + Environment.NewLine + $"{serialize(node)}");
        }

        public static void ReportOutbound(Node node)
        {
            throw new ArgumentException($"Outbound node detected." + Environment.NewLine + $"{serialize(node)}");
        }
    }
}
