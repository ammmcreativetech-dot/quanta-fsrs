# Contributing to quanta-fsrs

Thank you for your interest in improving `quanta-fsrs`! Please read this before opening a PR.

## License Requirement

**This project uses the Quanta Non-Commercial License (QNCL-1.0).**

By contributing, you agree that your contributions will be licensed under the same terms.
Commercial use of this library requires a separate license from Quanta — see [LICENSE](./LICENSE).

## Getting Started

```bash
git clone https://github.com/ammmcreativetech-dot/quanta-fsrs
cd quanta-fsrs
npm install
npm test          # run all tests
npm run build     # compile TypeScript → dist/
npm run lint      # type-check
```

## How to Contribute

### Bug Reports
- Open an issue at https://github.com/ammmcreativetech-dot/quanta-fsrs/issues
- Include: Node version, reproduction steps, expected vs actual behavior

### Feature Requests
- Open a discussion before implementing large features
- Keep the scope focused: this package is a **lean, zero-dependency FSRS scheduler** — no UI, no storage

### Pull Requests
1. Fork and create a feature branch: `git checkout -b feat/my-change`
2. Add or update tests in `src/index.test.ts`
3. Make sure `npm test` and `npm run lint` pass
4. Submit a PR against `main`

## Code Style
- TypeScript strict mode
- All public exports must have JSDoc comments
- Prefer descriptive variable names over comments
- No external runtime dependencies (dev deps only)

## Versioning
We use [Semantic Versioning](https://semver.org/). Breaking changes require a major bump.

## Contact
For commercial licensing: ammm.creativetech@gmail.com
Website: https://quanta-study.de
