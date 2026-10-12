// Match a gesture to the camera's perspective instead of a fixed pixel factor.
export function worldUnitsPerPixel(distance, fov, height) {
  return (2 * Math.max(0.01, distance) * Math.tan((fov * Math.PI) / 360)) / Math.max(1, height);
}

export function pinchRatio(previousDistance, distance) {
  return Math.max(1, previousDistance) / Math.max(1, distance);
}

export function isEditingTarget(target) {
  return (
    target instanceof Element &&
    !!target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')
  );
}
