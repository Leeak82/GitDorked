# Parallel build lanes

## Lane A — Foundation / Contracts (Codex)
Create the TypeScript web app foundation, test harness, typed domain model, search/filter contracts, storage abstraction, and sample seed data. Establish src/core interfaces used by all lanes. Mobile-first app shell only; do not build every feature.

Acceptance:
- install/build/test commands work
- typed ToolEntry / QueryTemplate / Variable / Recipe contracts
- offline-capable persistence abstraction
- sample entries render through a thin shell
- tests cover validation and interpolation

## Lane B — Dork Catalog / Query Builder (Aider)
Build the catalog engine against the shared contracts: categories, tags, favorites, variable substitution, copy-ready output, search ranking, import/export, and a curated safe starter dataset. Dataset focuses on public documents, repo/code discovery, dependency/config research, and authorized exposure checks. No live secrets.

Acceptance:
- useful seed catalog
- deterministic variable interpolation
- search/filter/favorites tests
- redaction rules for secret-pattern examples

## Lane C — GitHub URL Tools / Recipes (OpenCode)
Build GitHub URL parsing and allowlisted transforms for repo intelligence tools, plus multi-step research recipes. Input should accept canonical GitHub repo URLs and derive safe launch links. Add validation and tests. Do not transmit private repo content automatically.

Acceptance:
- robust owner/repo parser
- allowlisted transform registry
- launch/copy actions exposed via typed service
- recipes are declarative and testable
- malformed/non-GitHub input handled cleanly

## Lane D — UI/UX (Claude, then visual QA)
Consume shared contracts and build the polished responsive interface: search, category rail, cards, variable drawer, repo paste panel, favorites, recipes, keyboard/touch accessibility, empty/error states. Avoid owning business logic.

Acceptance:
- 390x844 usable
- desktop responsive
- accessible buttons/forms
- clear risk/authorization labels
- no fake functionality

## Lane E — Integration / QA (ECC + Codex review)
Merge lanes, resolve contract drift, run unit/build/E2E checks, verify offline behavior and external link generation, then package Pinokio launcher and deployment config.
