import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    {
      name: 'localized-dev-routes',
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          const url = new URL(request.url, 'http://localhost');
          if (/^\/(en|es)\/about\.html$/.test(url.pathname)) request.url = `/about.html${url.search}`;
          else if (/^\/(en|es)\/$/.test(url.pathname)) request.url = `/index.html${url.search}`;
          next();
        });
      },
    },
  ],
  server: { port: 5350, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        about: fileURLToPath(new URL('./about.html', import.meta.url)),
      },
    },
  },
  optimizeDeps: {
    noDiscovery: true,
    exclude: ['three'],
  },
});
