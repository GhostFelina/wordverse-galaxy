// Scene policy only: no storage/client access and no fabricated domain records.
export function createExperienceMode({ guestCount = 0, onChange = () => {} } = {}) {
  let ownerId = null;
  let initialized = false;
  let ready = false;
  let guestChosen = guestCount > 0;
  let count = guestCount;
  let preview = false;
  let guestFallback = false;
  let generation = 0;
  const snapshot = () => {
    const mode = !initialized
      ? null
      : ownerId
        ? guestFallback && !ready
          ? 'guest-personal'
          : 'personal'
        : preview
          ? 'showcase-demo'
          : guestChosen || count > 0
            ? 'guest-personal'
            : 'showcase-demo';
    return Object.freeze({ mode, ownerId, ready: initialized && (!ownerId || ready || guestFallback), generation });
  };
  const emit = () => onChange(snapshot());
  return {
    snapshot,
    session(nextOwner) {
      const next = nextOwner || null;
      if (initialized && next === ownerId) return;
      generation++;
      ownerId = next;
      preview = false;
      guestFallback = false;
      initialized = true;
      ready = false;
      emit();
    },
    contentReady(contentOwner) {
      if (!initialized || !ownerId || contentOwner !== ownerId) return false;
      ready = true;
      guestFallback = false;
      emit();
      return true;
    },
    guestEntries(value) {
      count = value;
      emit();
    },
    enterGuest() {
      if ((ownerId && ready) || !initialized) return false;
      guestFallback = Boolean(ownerId);
      guestChosen = true;
      preview = false;
      generation++;
      emit();
      return true;
    },
    enterDemo() {
      if (ownerId || !initialized) return false;
      guestChosen = false;
      // Existing records remain in the guest store, even during explicit preview.
      preview = true;
      generation++;
      emit();
      return true;
    },
  };
}

// Own one asynchronous scene mount. A replaced/stopped mount never becomes visible.
export function createSceneSlot() {
  let generation = 0;
  let current = null;
  return {
    async replace(mount) {
      const token = ++generation;
      current?.dispose();
      current = null;
      const candidate = await mount();
      if (token !== generation) {
        candidate.dispose();
        return null;
      }
      current = candidate;
      return candidate;
    },
    clear() {
      generation++;
      current?.dispose();
      current = null;
    },
  };
}
