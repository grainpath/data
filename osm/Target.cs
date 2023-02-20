using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System.Collections.Generic;

namespace osm
{
    internal abstract class Target
    {
        protected long step = 0;
        private readonly ILogger _logger;

        protected void increment()
        {
            ++step;

            if (step % 1000 == 0) {
                _logger.LogInformation("Still working... {0} objects already consumed.", step);
            }
        }

        protected void total() { _logger.LogInformation("Finished, consumed {0} objects total.", step); }

        public Target(ILogger logger) { _logger = logger; }

        public abstract void Consume(OsmGrain grain);

        public abstract void Complete();
    }

    internal class MockTarget : Target
    {
        public MockTarget(ILogger logger, IMongoDatabase database) : base(logger) { }

        public override void Consume(OsmGrain grain) { increment(); }

        public override void Complete() { total(); }
    }

    class MongoTarget : Target
    {
        private readonly IMongoDatabase _database;
        private readonly List<OsmGrain> _grains = new();

        private void write()
        {
            var coll = _database.GetCollection<OsmGrain>(Constants.MONGO_GRAIN_COLLECTION);
            var opts = new UpdateOptions { IsUpsert = true };

            var bulk = new List<WriteModel<OsmGrain>>();

            // upsert strategy is beneficial if bboxes overlap ~> ensure indices!

            foreach (var g in _grains) {

                var upsert = new ReplaceOneModel<OsmGrain>(
                    Builders<OsmGrain>.Filter.Where(d => d.linked.osm == g.linked.osm), g
                ) { IsUpsert = true };

                bulk.Add(upsert);
            }
            _ = coll.BulkWrite(bulk);

            _grains.Clear();
        }

        public MongoTarget(ILogger logger, IMongoDatabase database) : base(logger)
        {
            _database = database;
        }

        public override void Consume(OsmGrain grain)
        {
            _grains.Add(grain);
            if (_grains.Count >= 1000) { write(); }
            increment();
        }

        public override void Complete()
        {
            if (_grains.Count > 0) { write(); }
            total();
        }
    }
}
