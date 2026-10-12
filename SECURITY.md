# Security

Guest vocabulary and history are stored locally in the browser, with an IndexedDB primary store and a recovery copy. Clearing all site data may remove both. JSON backups contain your records and should be kept private.

Optional account synchronization uses Supabase with account-owned data policies. Guest records are not automatically merged into an account. Image cards are generated locally; only explicitly selected content is included. Authentication, owner replacement and export are separate concerns.

Never attach passwords, access tokens, personal backups or account data to a public issue. To report a security concern, use [GitHub private vulnerability reporting](https://github.com/GhostFelina/wordverse-galaxy/security/advisories/new) when available; otherwise open a minimal issue requesting a private reporting channel without exploit details or sensitive data.

Dependency checks run in CI. Public client configuration is not a service-role credential; server secrets and private environment files must remain outside the repository. External asset licenses are listed in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
