export interface MapPoint {
  lat: number;
  lon: number;
  zoom: number;
}

/**
 * OpenStreetMap's embed takes a bounding box rather than a centre and zoom,
 * so derive one. Longitude degrees per pixel halve with each zoom level; the
 * embed renders at roughly 600x320, and the latitude span is scaled by
 * cos(latitude) because meridians converge toward the poles.
 */
export function boundingBox(
  { lat, lon, zoom }: MapPoint,
  width = 600,
  height = 320,
): [west: number, south: number, east: number, north: number] {
  const degreesPerPixel = 360 / (256 * 2 ** zoom);
  const lonSpan = (degreesPerPixel * width) / 2;
  const latSpan = ((degreesPerPixel * height) / 2) * Math.cos((lat * Math.PI) / 180);
  return [lon - lonSpan, lat - latSpan, lon + lonSpan, lat + latSpan];
}

/** All the URLs the map needs. Every one of these is keyless and free to use. */
export function mapLinks(point: MapPoint) {
  const { lat, lon, zoom } = point;
  const bbox = boundingBox(point)
    .map((n) => n.toFixed(5))
    .join(',');

  return {
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`,
    viewLarger: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`,
    osmDirections: `https://www.openstreetmap.org/directions?to=${lat},${lon}`,
    googleDirections: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
  };
}
