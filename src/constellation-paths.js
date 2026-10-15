import * as THREE from 'three';
import { constellationEdges } from './word-exploration.js';

export function createConstellationPaths(parent) {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial({
    color: 0xe5c399,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    toneMapped: false,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = 'personal-word-paths';
  lines.layers.set(2);
  lines.renderOrder = 0;
  lines.frustumCulled = false;
  lines.visible = false;
  parent.add(lines);
  let edgeCount = 0;
  return {
    setRecords(records, positionOf) {
      const edges = constellationEdges(records, { positionOf: (record) => positionOf(record).toArray() });
      const positions = edges.flatMap((edge) => [...edge.start, ...edge.end]);
      geometry.dispose();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeBoundingSphere();
      edgeCount = edges.length;
      if (!edgeCount) lines.visible = false;
    },
    update({ enabled, focused }) {
      lines.visible = Boolean(enabled && !focused && edgeCount);
      return { edges: edgeCount, visible: lines.visible };
    },
    dispose() {
      parent.remove(lines);
      geometry.dispose();
      material.dispose();
    },
  };
}
