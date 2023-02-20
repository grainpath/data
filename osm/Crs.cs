/// <summary>
/// EPSG:3857 bounds, see https://epsg.io/3857.
/// </summary>
internal static class CrsEpsg3857
{
    public static float BoundLon => 180.0f;

    public static float BoundLat => 85.06f;

    public static bool IsWithin(float lon, float lat)
    {
        return lon >= -BoundLon && lon <= +BoundLon
            && lat >= -BoundLat && lat <= +BoundLat;
    }
}
