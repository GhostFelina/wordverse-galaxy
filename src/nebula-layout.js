// Display coordinates are an artistic reconstruction, never physical distances.
export const ORION_HOME_Z = 160;
export const ORION_WIDTH_FRACTION = 0.85;
export const ORION_DEPTH_SCALE = 2.6;
// Extend behind the original entrance, keeping the overview outside the cloud.
export const ORION_ENTRANCE_SCALE = 1.15;
export const ORION_PRINCIPAL_Z = 1 - ORION_ENTRANCE_SCALE / ORION_DEPTH_SCALE;
export function layoutNebulae(records, seed = 8042026, aspect = 16 / 9) {
  const tangent = Math.tan((25 * Math.PI) / 180);
  const depth = ORION_HOME_Z + 600;
  return records
    .filter((record) => record.id === 'orion')
    .map((record) => {
      const imageAspect = record.dimensions[0] / record.dimensions[1];
      const radius = (depth * tangent * aspect * ORION_WIDTH_FRACTION) / imageAspect;
      return {
        ...record,
        position: [0.3 * depth * tangent * aspect, 0, -600 - radius * (ORION_DEPTH_SCALE - ORION_ENTRANCE_SCALE)],
        principalZ: -600,
        frontZ: -600 + radius * ORION_ENTRANCE_SCALE,
        travelLength: radius * ORION_DEPTH_SCALE * 2,
        radius,
        angle: 0,
        seed: seed % 100,
        overview: {
          x: 0.3,
          y: 0,
          extentX: ORION_WIDTH_FRACTION,
          extentY: (ORION_WIDTH_FRACTION * aspect) / imageAspect,
        },
      };
    });
}
export function nebulaBackPlane(record) {
  return record.position[2] - record.radius * (ORION_DEPTH_SCALE + 0.75);
}
