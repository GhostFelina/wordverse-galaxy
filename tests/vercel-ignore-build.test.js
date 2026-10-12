import { expect, it } from 'vitest';
import { documentationOnly, ignoredBuildDecision } from '../scripts/vercel-ignore-build.mjs';
it('skips documentation publication and builds actual application changes', () => {
  expect(documentationOnly(['README.md', 'docs/images/desktop.png'])).toBe(true);
  for (const file of [
    'src/main.js',
    'index.html',
    'package.json',
    'public/assets/new.png',
    '.github/workflows/check.yml',
    'config/public-client.json',
  ])
    expect(documentationOnly(['README.md', file])).toBe(false);
  expect(documentationOnly([])).toBe(false);
});
it('permits only the ignored-build addition, never changed headers or build commands', () => {
  const before = { framework: 'vite', buildCommand: 'npm run build', headers: [{ source: '/(.*)' }] };
  const after = { ...before, ignoreCommand: 'node scripts/vercel-ignore-build.mjs' };
  expect(documentationOnly(['vercel.json', 'scripts/vercel-ignore-build.mjs'], before, after)).toBe(true);
  expect(documentationOnly(['vercel.json'], before, { ...after, buildCommand: 'other' })).toBe(false);
  expect(documentationOnly(['vercel.json'], before, { ...after, headers: [] })).toBe(false);
});
it('builds when history is missing', () => {
  expect(
    ignoredBuildDecision(() => {
      throw new Error('Shallow history');
    }),
  ).toBe(1);
});
