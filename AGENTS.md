# GitDorked Agent Contract

GitDorked is a mobile-first, offline-capable OSINT and repository research toolbox.

## Guardrails
- Support public-source research and repositories the user owns or is authorized to assess.
- Never store or display live credentials, session tokens, private keys, or harvested secrets.
- Secret-oriented features are detection/remediation helpers: redact values and show file/path/type only.
- No credential validation, automated login attempts, exploitation, or bulk target scanning.

## Shared contracts
- TypeScript-first.
- Modules communicate through typed interfaces in src/core.
- Data entries are declarative JSON/TS objects, not hard-coded UI.
- Every feature gets tests.
- Mobile UX is first-class.
- External launch URLs must be derived from allowlisted tool definitions.
- Keep integrations optional; core library/search works offline.

## Agent rules
- Work only in your assigned branch/worktree.
- Do not rewrite unrelated files.
- Run tests/build before commit.
- Commit your lane with a clear message.
