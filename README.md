# How to set up database?

`init.sh` ~> `tags.sh` ~> `osm` ~> `wikidata-enrich.sh` ~> `wikidata-create.sh` ~> `dbpedia.sh` ~> `index.sh`.

# Extract points in Prague

```console
dotnet run --file czech-republic-latest.osm.pbf --bbox 14.18 50.20 14.80 49.90
```
