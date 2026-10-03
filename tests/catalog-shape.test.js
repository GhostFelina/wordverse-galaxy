import { describe, expect, it } from 'vitest';
import galaxies from '../src/data/catalog/galaxies.json';
import catalog from '../src/data/catalog/galaxies-300.json';
import { sampleGalaxy, catalogOpacity } from '../src/catalog-shape.js';

describe('source-backed catalog morphology', () => {
  it('contains 300 unique real galaxy records with valid J2000 positions and no invented distances', () => {
    expect(catalog).toHaveLength(300);
    expect(new Set(catalog.map((record) => record.id)).size).toBe(300);
    for (const record of catalog) {
      expect(record.id).toMatch(/^(NGC|IC)\d+/);
      expect(record.raDeg).toBeGreaterThanOrEqual(0);
      expect(record.raDeg).toBeLessThan(360);
      expect(Math.abs(record.decDeg)).toBeLessThanOrEqual(90);
      expect(record.epoch).toBe('J2000');
      expect(record.license).toBe('CC-BY-SA-4.0');
      expect(record.distanceMly).toBeNull();
      expect(record.hubbleType.length).toBeGreaterThan(0);
      expect([...sampleGalaxy(record, 30).positions].every(Number.isFinite)).toBe(true);
    }
  });
  it('keeps finite, reproducible geometry and source metadata for every record', () => {
    expect(new Set(galaxies.map((record) => record.id)).size).toBe(galaxies.length);
    for (const record of galaxies) {
      const sample = sampleGalaxy(record, 300);
      expect(sample).toEqual(sampleGalaxy(record, 300));
      expect([...sample.positions, ...sample.colors, ...sample.sizes].every(Number.isFinite)).toBe(true);
      expect(Math.max(...sample.positions.map(Math.abs))).toBeLessThan(100);
      expect(Math.min(...sample.colors)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...sample.colors)).toBeLessThanOrEqual(1);
      expect(record.distanceMly).toBeGreaterThan(0);
      expect(record.source).toMatch(/^https:\/\/science.nasa.gov\//);
      expect(record.license).toContain('no source media copied');
    }
    expect(sampleGalaxy(galaxies[0], 300).positions).not.toEqual(sampleGalaxy(galaxies[1], 300).positions);
  });
  it('has bounded continuous zoom fades without a sudden visibility jump', () => {
    expect(catalogOpacity(160)).toBe(0);
    expect(catalogOpacity(360)).toBe(1);
    expect(catalogOpacity(50000)).toBe(1);
    for (let z = 171; z < 360; z++) {
      expect(catalogOpacity(z)).toBeGreaterThanOrEqual(catalogOpacity(z - 1));
      expect(catalogOpacity(z) - catalogOpacity(z - 1)).toBeLessThan(0.01);
    }
  });
});
