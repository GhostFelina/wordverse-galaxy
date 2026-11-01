// Installable app: register the generated service worker in production builds.
// A new version waits until every Wordverse tab closes, so an open session is
// never switched mid-review; the user is told the update is ready.
export function registerServiceWorker({
  notify,
  message,
  env = import.meta.env,
  nav = globalThis.navigator,
  win = globalThis,
} = {}) {
  if (!env?.PROD || !nav?.serviceWorker) return null;
  const secure = win.location?.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(win.location?.hostname);
  if (!secure) return null;
  const registration = nav.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
    reg.addEventListener?.('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && nav.serviceWorker.controller) notify?.(message);
      });
    });
    return reg;
  });
  registration.catch(() => {});
  return registration;
}
