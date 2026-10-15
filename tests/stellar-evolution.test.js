import { expect, it } from 'vitest';
import { stellarEvolution, stellarSpectrum } from '../src/stellar-evolution.js';
const born = '2026-10-12T09:00:00Z',
  start = Date.parse(born);
const at = (minutes) => start + minutes * 60000;

it('derives visual stages from the original date with minute-scale evolution and real elapsed days', () => {
  expect([0, 3, 18, 60, 150, 500].map((minutes) => stellarEvolution(born, at(minutes)).stageId)).toEqual([
    'newborn',
    'young',
    'mature',
    'aging',
    'redGiant',
    'whiteDwarf',
  ]);
  expect(stellarEvolution(born, at(2880)).ageDays).toBe(2);
  expect(stellarEvolution(born, at(3)).color).not.toBe(stellarEvolution(born, at(4)).color);
});
it('is continuous at stage and minute boundaries, handles missing/future dates and preserves records', () => {
  for (const boundary of [1, 7, 30, 90, 365]) {
    expect(stellarEvolution(born, at(boundary) - 1).color).toBe(stellarEvolution(born, at(boundary) + 1).color);
  }
  expect(stellarEvolution('invalid', start).ageMinutes).toBe(0);
  expect(stellarEvolution(born, start - 1000).ageMinutes).toBe(0);
  const record = Object.freeze({ id: 'steady', createdAt: born, x: 31, y: 0, z: 18 });
  expect(stellarSpectrum(record, at(2))).toEqual(stellarSpectrum({ ...record }, at(2)));
  expect(record).toEqual({ id: 'steady', createdAt: born, x: 31, y: 0, z: 18 });
});
it('older stars retain subtle minute-based tones without stage reversal; reduced motion removes tone modulation', () => {
  const record = { id: 'old-star', createdAt: born };
  const a = stellarSpectrum(record, at(12000)),
    b = stellarSpectrum(record, at(12001));
  expect(a.stageId).toBe('whiteDwarf');
  expect(b.stageId).toBe(a.stageId);
  expect(a.color).not.toBe(b.color);
  expect(stellarSpectrum(record, at(12000), false).color).toBe(stellarEvolution(born, at(12000)).color);
});
