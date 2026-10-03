import { SCHEMA_VERSION } from './universe-data.js';
import { mergeRecords } from './record-merge.js';

function assertUniverse(value) {
  if (
    value?.version !== SCHEMA_VERSION ||
    !Array.isArray(value.galaxies) ||
    !Array.isArray(value.words) ||
    !Array.isArray(value.events)
  ) {
    throw new Error('Invalid universe for sync');
  }
}

export function mergeGuestAndCloud(guest, cloud, makeId = () => crypto.randomUUID()) {
  assertUniverse(guest);
  assertUniverse(cloud);
  return mergeRecords(guest, cloud, makeId);
}
