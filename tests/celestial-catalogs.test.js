import { asteroidPosition } from '../src/asteroid-orbit.js';
import { describe, expect, test } from 'vitest';
import nebulae from '../src/data/catalog/nebulae-200.json';
import asteroids from '../src/data/catalog/asteroids-1000.json';
import fireballs from '../src/data/catalog/fireballs-1000.json';
import galaxies from '../src/data/catalog/galaxies-300.json';

describe('source catalog identity and scientific fields', () => {
  test('counts refer to distinct source identities, including actual nebulae', () => {
    for (const [records, minimum] of [
      [nebulae, 200],
      [galaxies, 150],
      [asteroids, 1000],
      [fireballs, 1000],
    ]) {
      expect(new Set(records.map((r) => r.id)).size).toBe(records.length);
      expect(records.length).toBeGreaterThanOrEqual(minimum);
    }
    const types = new Set(['PN', 'Neb', 'HII', 'RfN', 'SNR', 'EmN']);
    expect(nebulae.every((r) => types.has(r.catalogType) || (r.id === 'NGC1976' && r.catalogType === 'Cl+N'))).toBe(
      true,
    );
    for (const r of [...nebulae, ...galaxies]) {
      expect(r.raDeg).toBeGreaterThanOrEqual(0);
      expect(r.raDeg).toBeLessThan(360);
      expect(Math.abs(r.decDeg)).toBeLessThanOrEqual(90);
    }
    expect(nebulae.find((r) => r.messier === 'M57')?.catalogType).toBe('PN');
    expect(nebulae.find((r) => r.messier === 'M1')?.catalogType).toBe('SNR');
  });
  test('asteroids are bound main-belt objects; Ceres is not counted as an asteroid', () => {
    expect(asteroids.some((r) => r.designation === '1')).toBe(false);
    for (const r of asteroids) {
      expect(r.orbitClass).toBe('MBA');
      expect(r.diameterKm).toBeGreaterThan(0);
      expect(r.semimajorAxisAu).toBeGreaterThan(0);
      expect(r.eccentricity).toBeGreaterThanOrEqual(0);
      expect(r.eccentricity).toBeLessThan(1);
      expect(
        [r.inclinationDeg, r.ascendingNodeDeg, r.argumentPerihelionDeg, r.meanAnomalyDeg, r.epochJdTdb].every(
          Number.isFinite,
        ),
      ).toBe(true);
    }
    expect(asteroids.find((r) => r.name === 'Vesta')?.diameterKm).toBe(522.77);
  });
  test('meteor observations retain UTC, energy units and unknown measurements', () => {
    expect(fireballs.some((r) => r.latitudeDeg === null)).toBe(true);
    for (const r of fireballs) {
      expect(r.dateUtc.endsWith('Z')).toBe(true);
      expect(Number.isFinite(Date.parse(r.dateUtc))).toBe(true);
      expect(r.radiatedEnergyJoules).toBeGreaterThan(0);
      expect(r.impactEnergyKt).toBeGreaterThan(0);
      if (r.latitudeDeg !== null) expect(Math.abs(r.latitudeDeg)).toBeLessThanOrEqual(90);
      if (r.longitudeDeg !== null) expect(Math.abs(r.longitudeDeg)).toBeLessThanOrEqual(180);
      if (r.entryVelocityComponentsKmS.includes(null)) expect(r.entryVelocityKmS).toBeNull();
      else expect(r.entryVelocityKmS).toBeCloseTo(Math.hypot(...r.entryVelocityComponentsKmS), 6);
    }
    expect(fireballs[0].radiatedEnergyJoules).toBe(2.2e10);
  });
});

test('Kepler display position preserves orbital radius and inclination at the recorded epoch', () => {
  const circular = {
    semimajorAxisAu: 2,
    eccentricity: 0,
    meanAnomalyDeg: 0,
    inclinationDeg: 0,
    ascendingNodeDeg: 0,
    argumentPerihelionDeg: 0,
  };
  expect(asteroidPosition(circular, 1)).toEqual([33, 0, -330]);
  const polar = asteroidPosition({ ...circular, meanAnomalyDeg: 90, inclinationDeg: 90 }, 1);
  expect(polar[0]).toBeCloseTo(31);
  expect(polar[1]).toBeCloseTo(2);
  expect(polar[2]).toBeCloseTo(-330);
  const ellipse = { ...circular, eccentricity: 0.4 };
  expect(asteroidPosition(ellipse, 1)[0] - 31).toBeCloseTo(1.2);
  expect(asteroidPosition({ ...ellipse, meanAnomalyDeg: 180 }, 1)[0] - 31).toBeCloseTo(-2.8);
});
