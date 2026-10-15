import ionVeil from './data/ion-veil.json';
import ember from './data/ember-reach.json';
import tidal from './data/tidal-shell.json';

// Original volumes are independent of the observational Orion catalog.
export const NEBULA_EXPERIENCES = Object.freeze(
  [
    { id: 'orion', code: 'M42', mode: 0, manifest: null, cool: [0.055, 0.16, 0.32], warm: [0.56, 0.22, 0.09], glow: 1 },
    {
      id: 'ion-veil',
      code: 'N / 02',
      mode: 1,
      manifest: ionVeil,
      cool: [0.025, 0.23, 0.29],
      warm: [0.46, 0.18, 0.075],
      glow: 1.65,
    },
    {
      id: 'ember-reach',
      code: 'N / 03',
      mode: 2,
      manifest: ember,
      cool: [0.09, 0.055, 0.14],
      warm: [0.88, 0.21, 0.055],
      glow: 1.5,
    },
    {
      id: 'tidal-shell',
      code: 'N / 04',
      mode: 3,
      manifest: tidal,
      cool: [0.025, 0.12, 0.46],
      warm: [0.21, 0.46, 0.65],
      glow: 1.9,
    },
  ].map(Object.freeze),
);
export const nebulaExperience = (id) => NEBULA_EXPERIENCES.find((item) => item.id === id);
