# Service access

GitHub: GhostFelina/wordverse-galaxy. Use existing gh authentication; do not publish tokens or internal conversation text.

Vercel: linked Wordverse project. Development deployments target previews; production currently retains1.14.1. Validate source SHA, project identity, readiness and served assets before recording a deployment as verified. Protected preview reads use existing authenticated CLI access; never disable protection or disclose authorization headers.

Supabase: browser public client settings live in config/public-client.json and device .env.local. Service-role credentials and account/session secrets are never committed. Setup preserves existing env values.
