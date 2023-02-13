using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System.Collections.Generic;

namespace osm
{
    class Target
    {
        private static readonly string _coll = "pois";

        private readonly ILogger _logger;
        private readonly IMongoDatabase _database;
        private readonly List<OsmGrain> _grains = new();

        private void write()
        {
            try {

                var coll = _database.GetCollection<OsmGrain>(_coll);
                var opts = new UpdateOptions { IsUpsert = true };

                var bulk = new List<WriteModel<OsmGrain>>();

                foreach (var g in _grains) {

                    var upsert = new ReplaceOneModel<OsmGrain>(
                        Builders<OsmGrain>.Filter.Where(d => d.link.osm == g.link.osm), g
                    ) { IsUpsert = true };

                    bulk.Add(upsert);
                }

                coll.BulkWrite(bulk);

            }
            catch (MongoException ex) { _logger.LogError(ex.Message); }

            _grains.Clear();
        }

        public Target(ILogger logger, IMongoDatabase database)
        {
            _logger = logger; _database = database;
        }

        public void Consume(OsmGrain grain)
        {
            _grains.Add(grain);
            if (_grains.Count >= 1000) { write(); }
        }

        public void Complete()
        {
            if (_grains.Count > 0) { write(); }
        }
    }
}
