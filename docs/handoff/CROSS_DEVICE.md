# Device setup

Use the existing clone and the branch in STATE.json. Inspect the actual OS/shell first. On Windows use PowerShell and keep project-local dependencies; on macOS locate the actual Desktop/Projects clone. Do not copy node_modules, browser profiles, private backups or credentials between machines.

1. Preserve local changes; a clean checkout can use git pull --ff-only.
2. Install supported Node.js and run npm ci.
3. Run npm run setup:device to register the local project path and fill missing public client configuration; existing environment values are preserved. Account login is performed locally.
4. Run npm run doctor.
5. Run npm run dev -- --port 5360 and open http://127.0.0.1:5360/.

Read HANDOFF.md, PRODUCT_SPEC.md and VISUAL_SPEC.md for current implementation boundaries. Browser records are origin-specific; JSON backup/import is available.
