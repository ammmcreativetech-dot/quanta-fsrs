# Changelog — quanta-fsrs

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2025-04-17

### Added
- Full FSRS v4.5 and v5 algorithm implementation in TypeScript
- `createNewCard()` — initializes a fresh `FSRSCard` with zero state
- `scheduleFSRS(card, rating)` — advances card state and returns next review date
- `retrievability(stability, t)` — computes R(t) from the FSRS memory model
- `stability()` / `difficulty()` — raw formula helpers exposed for research use
- `calculateRating(n)` — maps numeric 1–4 to `Rating` enum
- Full TypeScript type exports: `FSRSCard`, `FSRSResult`, `Rating`, `FSRSParams`
- 19-weight default parameter set calibrated from Anki/SuperMemo open datasets
- `VERSION` string export
- Zero runtime dependencies
- ESM + CJS dual output via `tsup`
- GitHub Actions CI: test → build → npm publish (with provenance) on `v*` tags
- README with GEO-optimized algorithm documentation (Wikipedia-style)

### Notes
- FSRS v5 weight count (19 weights) matches the official open-source reference implementation
- Stability values are in days; all arithmetic follows the published FSRS paper
