import { translate, formatNumber } from './i18n.js';
import { getSupabaseClient } from './supabase-client.js';
import { loadAccountCache, saveAccountCache } from './account-cache.ts';
import { readCloudSnapshot, decodeCloudSnapshot } from './cloud-universe.ts';
import { AccountSyncEngine } from './sync-engine.ts';
import { planSyncChanges } from './sync-queue.ts';
import { mergeGuestAndCloud } from './sync-merge.js';

export function mountAccountSync({ locale, getUniverse, replaceUniverse, beforeSwitch, notify }) {
  const t = (key, params) => translate(locale, `sync.${key}`, params);
  let generation = 0;
  let ownerId = null;
  let engine = null;
  let guest = structuredClone(getUniverse());
  let preparing = false;
  let firstRemote = null;
  const indicator = document.createElement('button');
  indicator.type = 'button';
  indicator.className = 'sync-indicator';
  indicator.id = 'sync-status';
  indicator.textContent = t('guest');
  indicator.setAttribute('aria-live', 'polite');
  document.querySelector('.top-actions').append(indicator);
  const dialog = document.createElement('dialog');
  dialog.id = 'sync-dialog';
  dialog.className = 'auth-dialog';
  dialog.setAttribute('aria-labelledby', 'sync-title');
  document.body.append(dialog);
  const setStatus = (key) => {
    indicator.textContent = t(key);
    indicator.dataset.status = key;
  };
  const isCurrent = (token) => token === generation && ownerId;
  function display(universe) {
    const visible = structuredClone(universe);
    replaceUniverse(visible);
    return visible;
  }
  function activate(cache, client, token) {
    if (!isCurrent(token)) return;
    beforeSwitch();
    firstRemote = null;
    const visible = display(cache.universe);
    const ready = planSyncChanges(cache, visible);
    engine = new AccountSyncEngine({
      client,
      cache: ready,
      onState: (state) => {
        if (isCurrent(token)) setStatus(state.status);
      },
      onUniverse: (universe) => {
        if (isCurrent(token)) display(universe);
      },
      onMerged: (conflicts) => {
        if (isCurrent(token)) notify(t('conflictsPreserved', { count: conflicts.length }));
      },
    });
    setStatus(ready.pending.length ? 'pending' : 'synced');
  }
  async function refreshAndFlush(token = generation) {
    const current = engine;
    if (!current || !isCurrent(token)) return;
    await current.refresh();
    if (current === engine && isCurrent(token)) await current.flush();
  }
  async function choose(includeGuest) {
    if (preparing || !ownerId) return;
    preparing = true;
    dialog.querySelectorAll('button').forEach((button) => {
      button.disabled = true;
    });
    const token = generation;
    setStatus('loading');
    try {
      const client = await getSupabaseClient();
      const remote = await readCloudSnapshot(client, ownerId);
      if (!isCurrent(token)) return;
      const cloud = decodeCloudSnapshot(remote, ownerId);
      const merged = includeGuest
        ? mergeGuestAndCloud(structuredClone(getUniverse()), cloud)
        : { universe: cloud, summary: { conflicts: [] } };
      const universe = { ...cloud, ...merged.universe };
      const cache = planSyncChanges(
        { version: 1, ownerId, universe, remote, pending: [], lastSyncedAt: null },
        universe,
      );
      // The first account copy is durable before any upload or renderer switch.
      await saveAccountCache(cache);
      if (!isCurrent(token)) return;
      dialog.close();
      activate(cache, client, token);
      notify(t('merged', { count: universe.words.length }));
      if (merged.summary.conflicts.length) notify(t('conflictsPreserved', { count: merged.summary.conflicts.length }));
      await refreshAndFlush(token);
    } catch {
      if (isCurrent(token)) setStatus('error');
    } finally {
      preparing = false;
      dialog.querySelectorAll('button').forEach((button) => {
        button.disabled = false;
      });
    }
  }
  function showMerge() {
    if (!firstRemote || dialog.open) return;
    beforeSwitch();
    dialog.replaceChildren();
    const heading = document.createElement('h2');
    heading.id = 'sync-title';
    heading.textContent = t('mergeTitle');
    const copy = document.createElement('p');
    copy.textContent = t('mergeDescription', {
      local: formatNumber(locale, getUniverse().words.length),
      cloud: formatNumber(locale, decodeCloudSnapshot(firstRemote, ownerId).words.length),
    });
    const actions = document.createElement('div');
    actions.className = 'auth-content';
    for (const [key, action] of [
      ['combine', () => choose(true)],
      ['cloudOnly', () => choose(false)],
      ['stayGuest', () => dialog.close()],
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = key === 'combine' ? 'auth-submit' : 'auth-link';
      button.textContent = t(key);
      button.addEventListener('click', action);
      actions.append(button);
    }
    dialog.append(heading, copy, actions);
    dialog.showModal();
  }
  async function prepare(token) {
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error('Missing config');
      const cache = await loadAccountCache(ownerId);
      if (!isCurrent(token)) return;
      if (cache) {
        activate(cache, client, token);
        await refreshAndFlush(token);
      } else {
        const remote = await readCloudSnapshot(client, ownerId);
        if (isCurrent(token)) {
          firstRemote = remote;
          setStatus('mergeReady');
          notify(t('mergeAvailable'));
        }
      }
    } catch {
      if (isCurrent(token)) setStatus(navigator.onLine === false ? 'offline' : 'error');
    }
  }
  async function onSession(session) {
    const next = session?.user?.id || null;
    if (next === ownerId) return;
    const previousAccount = Boolean(engine);
    if (!previousAccount) guest = structuredClone(getUniverse());
    generation++;
    engine?.stop();
    engine = null;
    firstRemote = null;
    ownerId = next;
    dialog.close();
    if (previousAccount) {
      beforeSwitch();
      replaceUniverse(structuredClone(guest));
    }
    if (!next) {
      setStatus('guest');
      return;
    }
    setStatus('loading');
    await prepare(generation);
  }
  function open() {
    if (!ownerId) {
      notify(t('guestNote'));
      return;
    }
    if (firstRemote) showMerge();
    else if (engine) refreshAndFlush();
    else {
      setStatus('loading');
      prepare(generation);
    }
  }
  indicator.addEventListener('click', open);
  window.addEventListener('online', () => {
    if (engine) refreshAndFlush();
    else if (ownerId) prepare(generation);
  });
  window.addEventListener('offline', () => {
    if (ownerId) setStatus('offline');
  });
  return {
    onSession,
    open,
    persist(universe) {
      if (!engine) {
        guest = structuredClone(universe);
        return false;
      }
      const current = engine;
      current
        .update(universe)
        .then(() => {
          if (current === engine) current.flush();
        })
        .catch(() => {
          if (current === engine) setStatus('error');
        });
      return true;
    },
  };
}
