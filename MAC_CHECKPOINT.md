# Mac checkpoint — paused by owner

2026-10-03 · codex · macOS. The owner requested that Mac development stop and continuation move to Windows.

This branch is an archival checkpoint, not the active Phase 2 implementation.
The Mac session incorrectly started from main `3752ff1` without inspecting the
existing remote `phase/2-auth-sync` branch. That branch is nine commits ahead
at `76b039f` and already includes account flows and cloud sync.

**Continue on `phase/2-auth-sync` and read its HANDOFF.md / CROSS_DEVICE.md.**
Do not merge this branch or apply its alternative migration to the cloud.
It uses different table names and does not match the existing client model.

Preserved work:

- Alternate Universe/Collection/Entry/history SQL schema, owner RLS and composite foreign keys.
- pgTAP isolation suite; its first 50 assertions passed on disposable local PostgreSQL.
- Supabase advisors reported no issues for that earlier schema revision.
- Last changes add insert timestamps/revisions and three more assertions; those changes were not rerun.
- Proposed database CI job; not verified on GitHub.
- Existing app lint/typecheck/20 unit tests/build passed; browser suite failed to start because of sandbox EPERM.

No production database changes, cloud uploads, app UI changes or releases were made.
The attempted local SQL refresh and full check were interrupted before execution
(the temporary SQL file was not created). Local Supabase belongs to project
`wordverse-galaxy`; stop it with backup retained before ending the Mac handoff.
Current CLI/MCP identity cannot access the target cloud project; the existing
Windows handoff explains the correct Dashboard context and applied migrations.
