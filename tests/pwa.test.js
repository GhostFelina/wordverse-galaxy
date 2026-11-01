import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '../src/pwa.js';
import { precacheList, serviceWorkerSource } from '../scripts/build-service-worker.mjs';

function fakeNavigator({ controller = {} } = {}) {
  const listeners = {};
  const worker = { state: 'installing', addEventListener: (name, fn) => (worker.on = fn) };
  const reg = { installing: worker, addEventListener: (name, fn) => (listeners[name] = fn) };
  return {
    serviceWorker: { controller, register: vi.fn(async () => reg) },
    fireUpdate() {
      listeners.updatefound();
      worker.state = 'installed';
      worker.on();
    },
  };
}
const secure = { location: { protocol: 'https:', hostname: 'wordverse.test' } };

describe('service worker registration', () => {
  it('registers only in secure production builds', async () => {
    const nav = fakeNavigator();
    expect(registerServiceWorker({ env: { PROD: false }, nav, win: secure })).toBeNull();
    expect(
      registerServiceWorker({
        env: { PROD: true },
        nav,
        win: { location: { protocol: 'http:', hostname: 'example.com' } },
      }),
    ).toBeNull();
    expect(registerServiceWorker({ env: { PROD: true }, nav: {}, win: secure })).toBeNull();
    await registerServiceWorker({ env: { PROD: true }, nav, win: secure });
    expect(nav.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
  });

  it('announces a waiting update only when a previous version controls the page', async () => {
    const notify = vi.fn();
    const updating = fakeNavigator();
    await registerServiceWorker({ env: { PROD: true }, nav: updating, win: secure, notify, message: 'ready' });
    updating.fireUpdate();
    expect(notify).toHaveBeenCalledWith('ready');
    const first = fakeNavigator({ controller: null });
    const quiet = vi.fn();
    await registerServiceWorker({ env: { PROD: true }, nav: first, win: secure, notify: quiet });
    first.fireUpdate();
    expect(quiet).not.toHaveBeenCalled();
  });
});

describe('service worker build', () => {
  it('precaches the small shell and leaves large scene payloads to runtime caching', async () => {
    const root = await mkdtemp(join(tmpdir(), 'wv-sw-'));
    await mkdir(join(root, 'assets/nebulae'), { recursive: true });
    await mkdir(join(root, 'en'), { recursive: true });
    await mkdir(join(root, 'icons'), { recursive: true });
    await writeFile(join(root, 'index.html'), '<!doctype html>');
    await writeFile(join(root, 'en/index.html'), '<!doctype html>');
    await writeFile(join(root, 'assets/main-abc.js'), 'x');
    await writeFile(join(root, 'assets/main-abc.css'), 'x');
    await writeFile(join(root, 'assets/huge.js'), Buffer.alloc(2_000_000));
    await writeFile(join(root, 'assets/nebulae/orion.wvz'), 'x');
    await writeFile(join(root, 'icons/icon-192.png'), 'x');
    await writeFile(join(root, 'manifest.webmanifest'), '{}');
    await writeFile(join(root, 'sw.js'), 'old');
    expect(await precacheList(root)).toEqual([
      '/assets/main-abc.css',
      '/assets/main-abc.js',
      '/en/index.html',
      '/icons/icon-192.png',
      '/index.html',
      '/manifest.webmanifest',
    ]);
  });

  it('generates a worker that never handles cross-origin or non-GET requests', () => {
    const source = serviceWorkerSource('v1', ['/index.html']);
    expect(source).toContain('const VERSION = "v1"');
    expect(source).toContain("if (request.method !== 'GET') return;");
    expect(source).toContain('if (url.origin !== self.location.origin) return;');
    expect(() => new Function(source)).not.toThrow();
  });
});
