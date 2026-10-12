# Contributing

Wordverse welcomes focused changes to learning workflows, accessibility, translations and rendering. Development lives on `phase/4-universe`; production and development previews are separate.

Use Node24, `npm ci`, and `npm run dev -- --port 5360 --strictPort`. Guest use needs no service credentials. Install the browser test runner with `npx playwright install chromium`.

Before opening a PR, run `npm run check`, `npm run format:check` and `npm run check:release`. Explain the user-visible behavior and your validation. Use deterministic synthetic screenshots for visual changes and note the GPU/browser and measurement limits.

Preserve persisted IDs, coordinates, dates and owner isolation. Rendering, scene effects and exports must not alter vocabulary data. Update all three UI locales. Keep external asset licenses and provenance. Do not commit personal backups, account details, credentials or private task transcripts.

See [product specification](docs/PRODUCT_SPEC.md), [visual specification](docs/VISUAL_SPEC.md) and [open issues](docs/handoff/KNOWN_ISSUES.md). Larger proposals should begin with an issue describing the learning or exploration need.
