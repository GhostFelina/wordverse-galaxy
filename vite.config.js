import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    {
      name: 'localized-dev-routes',
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const url = new URL(request.url, 'http://localhost');
          const legal = url.pathname.match(/^\/(?:([a-z]{2})\/)?(privacy|terms)\/?$/);
          if (legal && (!legal[1] || ['en', 'es'].includes(legal[1]))) {
            try {
              const { renderLegalPage } = await server.ssrLoadModule('/src/legal-page.js');
              response.setHeader('Content-Type', 'text/html; charset=utf-8');
              response.end(renderLegalPage(legal[1] || 'tr', legal[2]));
            } catch (error) {
              next(error);
            }
            return;
          }
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
    // Auth identity gates the first scene; avoid a cold tree of SDK module transforms.
    include: ['@supabase/supabase-js'],
    exclude: ['three'],
  },
});
