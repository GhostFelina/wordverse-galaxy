// Changing the zoom reference plane must preserve the absolute camera target.
export function rebaseTravelZoom(zoom, depth, value) {
  if (value > 1600 && value + depth > 950 && depth !== 0) {
    return { zoom: zoom + depth, depth: 0, value: value + depth };
  }
  return { zoom, depth, value };
}
