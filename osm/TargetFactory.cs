using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System;
using System.IO;

namespace osm
{
    internal static class TargetFactory
    {
        private static readonly string _path =
            "conf" + Path.DirectorySeparatorChar + "dbsettings.json";

        private static readonly string _conn = "conn";
        private static readonly string _database = "grainpath";

        public static Target GetInstance(ILogger logger)
        {
            string conn;

            try {
                conn = new ConfigurationBuilder().AddJsonFile(_path).Build()[_conn];
            }
            catch (Exception) { throw new Exception("Failed to obtain connection string."); }

            IMongoDatabase database;

            try {
                var client = new MongoClient(new MongoUrl(conn));
                database = client.GetDatabase(_database);
            }
            catch (Exception) { throw new Exception("Failed to get database instance from the given connection string."); }

            return new(logger, database);
        }
    }
}
