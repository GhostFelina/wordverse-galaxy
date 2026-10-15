// Match a gesture to the camera's perspective instead of a fixed pixel factor.
export function worldUnitsPerPixel(distance, fov, height) {
  return (2 * Math.max(0.01, distance) * Math.tan((fov * Math.PI) / 360)) / Math.max(1, height);
}

export function pinchRatio(previousDistance, distance) {
  return Math.max(1, previousDistance) / Math.max(1, distance);
}

// Cruise speed follows the finite journey, not distance to the remote back plane.
// Bounding each impulse prevents a coalesced wheel event skipping the cloud.
export function nebulaCruiseStep(delta, length) {
  return Math.max(-120, Math.min(120, delta)) * Math.max(0, length) * 0.00075;
}

export function cameraDamping(milliseconds) {
  return 1 - Math.exp(-Math.max(0, Math.min(50, milliseconds)) * 0.005);
}

export function isEditingTarget(target) {
  return (
    target instanceof Element &&
    !!target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')
  );
}
