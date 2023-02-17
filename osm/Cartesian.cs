using GeoJSON.Text.Geometry;
using System.Collections.Generic;

namespace osm
{
    static class Cartesian
    {
        private static double SignedArea(List<Point> polygon)
        {
            var ar = 0.0;

            for (int i = 0; i < polygon.Count - 1; ++i) {
                var p0 = polygon[i].Coordinates;
                var p1 = polygon[i + 1].Coordinates;

                var (x0, y0) = (p0.Longitude, p0.Latitude);
                var (x1, y1) = (p1.Longitude, p1.Latitude);

                ar += x0 * y1 - y0 * x1;
            }

            return 0.5 * ar;
        }

        public static bool IsCounterClockwise(List<Point> polygon) => SignedArea(polygon) > 0.0;

        public static Point Centroid(List<Point> polygon)
        {
            double ar = 0.0, cx = 0.0, cy = 0.0;

            for (int i = 0; i < polygon.Count - 1; ++i) {
                var p0 = polygon[i].Coordinates;
                var p1 = polygon[i + 1].Coordinates;

                var (x0, y0) = (p0.Longitude, p0.Latitude);
                var (x1, y1) = (p1.Longitude, p1.Latitude);

                ar += x0 * y1 - y0 * x1;

                var im = x0 * y1 - y0 * x1;
                cx += (x0 + x1) * im;
                cy += (y0 + y1) * im;
            }

            return new(new Position(cy / (6.0 * ar), cx / (6.0 * ar)));
        }
    }
}
