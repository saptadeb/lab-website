import { describe, expect, it } from 'vitest';
import { boundingBox, mapLinks } from '../map';

const ANN_ARBOR = { lat: 42.2808, lon: -83.743, zoom: 16 };

describe('boundingBox', () => {
  it('returns west, south, east, north in that order', () => {
    const [west, south, east, north] = boundingBox(ANN_ARBOR);
    expect(west).toBeLessThan(east);
    expect(south).toBeLessThan(north);
  });

  it('centres the box on the point', () => {
    const [west, south, east, north] = boundingBox(ANN_ARBOR);
    expect((west + east) / 2).toBeCloseTo(ANN_ARBOR.lon, 10);
    expect((south + north) / 2).toBeCloseTo(ANN_ARBOR.lat, 10);
  });

  // This is the relationship the first implementation got backwards.
  it('covers less ground as the zoom level rises', () => {
    const span = (zoom: number) => {
      const [west, , east] = boundingBox({ ...ANN_ARBOR, zoom });
      return east - west;
    };
    expect(span(17)).toBeLessThan(span(16));
    expect(span(16)).toBeLessThan(span(12));
  });

  it('halves the span for each zoom level', () => {
    const span = (zoom: number) => {
      const [west, , east] = boundingBox({ ...ANN_ARBOR, zoom });
      return east - west;
    };
    expect(span(16) / span(17)).toBeCloseTo(2, 6);
  });

  it('produces a window of a sane size for a street-level zoom', () => {
    const [west, , east] = boundingBox(ANN_ARBOR);
    const metresPerDegreeLon = 111_320 * Math.cos((ANN_ARBOR.lat * Math.PI) / 180);
    const widthInMetres = (east - west) * metresPerDegreeLon;
    expect(widthInMetres).toBeGreaterThan(200);
    expect(widthInMetres).toBeLessThan(2000);
  });

  // Degrees of longitude shrink toward the poles, so a fixed pixel height
  // covers fewer degrees of latitude the further north you are.
  it('narrows the latitude span at higher latitudes', () => {
    const latSpan = (lat: number) => {
      const [, south, , north] = boundingBox({ ...ANN_ARBOR, lat });
      return north - south;
    };
    expect(latSpan(70)).toBeLessThan(latSpan(0));
  });

  it('respects a custom viewport size', () => {
    const [west, , east] = boundingBox(ANN_ARBOR, 1200);
    const [wideWest, , wideEast] = boundingBox(ANN_ARBOR, 600);
    expect(east - west).toBeCloseTo((wideEast - wideWest) * 2, 10);
  });
});

describe('mapLinks', () => {
  const links = mapLinks(ANN_ARBOR);

  it('builds an embed url with an encoded bounding box and a marker', () => {
    expect(links.embed).toContain('bbox=');
    expect(links.embed).toContain('%2C');
    expect(links.embed).toContain(`marker=${ANN_ARBOR.lat},${ANN_ARBOR.lon}`);
  });

  it('points every link at the configured coordinates', () => {
    for (const link of Object.values(links)) {
      expect(link).toContain(String(ANN_ARBOR.lat));
      expect(link).toContain(String(ANN_ARBOR.lon));
    }
  });

  // An API key here would mean a billing account, which the project avoids.
  it('requires no api key', () => {
    for (const link of Object.values(links)) {
      expect(link).not.toMatch(/[?&]key=/);
    }
  });

  it('sends google maps a directions request rather than an embed', () => {
    expect(links.googleDirections).toContain('api=1');
    expect(links.googleDirections).toContain('destination=');
  });
});
