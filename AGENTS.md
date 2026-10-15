# Repository development

Read [engineering status](docs/handoff/HANDOFF.md), [product specification](docs/PRODUCT_SPEC.md), [visual specification](docs/VISUAL_SPEC.md) and [contributing](CONTRIBUTING.md).

- Preserve existing records, coordinates, dates and owner isolation. No destructive migrations or Git history rewrites.
- Verify the actual OS/shell. Use portable UTF-8 paths and project-local dependencies.
- Active development branch is recorded in docs/handoff/STATE.json. Preserve local changes; clean updates use git pull --ff-only.
- Current implementation targets desktop browsers. Keep existing mobile behavior compatible.
- The primary scene defaults to Orion and personal word stars. Three original gas volumes and ten observation-guided popular nebula experiences are available through the shared searchable preview/flight atlas. Alternate GPU/CPU volume caches are bounded to three. Artistic sky experiences are ephemeral: a session-only director shuffles 22 phenomena with restrained intervals, manual selection has priority and quiet mode stops automatic events. Deferred observational catalog layers remain disabled.
- Validate behavior with unit/integration/browser tests and synthetic visual evidence. Never add personal records, private screenshots, conversation transcripts, credentials or internal task briefs to Git.
- Application deployments from development target previews. Documentation publication must preserve the existing production build.
- Local development preview: http://127.0.0.1:5360/. Tooling health: npm run doctor.
