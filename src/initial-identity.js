// A slow initial auth refresh must not keep guest learning behind a loader.
// Late identity resolution still wins and clears the previous visible owner.
export function createInitialIdentityGate(fallback, delay = 2500) {
  let resolved = false;
  const timer = setTimeout(() => {
    if (!resolved) fallback();
  }, delay);
  return {
    resolve() {
      resolved = true;
      clearTimeout(timer);
    },
  };
}
