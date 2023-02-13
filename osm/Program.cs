using CommandLine;
using Microsoft.Extensions.Logging;
using System;

namespace osm
{
    class Program
    {
        private sealed class Options
        {
            [Option("file", Required = true)]
            public string File { get; set; }
        }

        static void Main(string[] args)
        {
            var log = LoggerFactory
                .Create(b => b.AddConsole().SetMinimumLevel(LogLevel.Information))
                .CreateLogger<Program>();

            var opt = new Parser().ParseArguments<Options>(args).Value;

            log.LogInformation("File {0} is being processed...", opt.File);

            long step = 0;

            try {

                var source = SourceFactory.GetInstance(log, opt.File);
                var target = TargetFactory.GetInstance(log);

                foreach (var grain in source) {
                    target.Consume(grain);

                    ++step;

                    if (step % 1000 == 0) {
                        log.LogInformation("Still working... {0} objects already processed.", step);
                    }
                }
                target.Complete();
            }
            catch (Exception ex) { log.LogError(ex.Message); }

            log.LogInformation("Finished file {0}, processed {1} objects.", opt.File, step);
        }
    }
}
