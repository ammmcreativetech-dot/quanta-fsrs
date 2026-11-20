# quanta-fsrs

Standalone, FSRS-inspired flashcard scheduling utilities for TypeScript and JavaScript. The package provides card state, review scheduling, recall estimates and due-card helpers with no runtime dependencies.

Maintained by Amos Matzke at AM Creative Tech UG (haftungsbeschränkt), the developer and operator of [Quanta Study](https://quanta-study.de/en), a web-based learning platform. This historical standalone implementation is separate from the current application's ts-fsrs-based FSRS-6 scheduling.

## License

The code is available under the [Quanta Non-Commercial License (QNCL) v1.0](LICENSE). Non-commercial use is subject to that license; commercial use requires the separate written permission described there. The LICENSE file is unchanged by this documentation and packaging update.

## Package formats

The build produces CommonJS at `dist/index.js`, ESM at `dist/index.mjs` and TypeScript declarations. The package root selects the appropriate JavaScript format through conditional exports.

Version 1.0.4 prepares a CommonJS entry-point correction and current API documentation. The earlier npm 1.0.3 manifest points its CommonJS entry at a missing `dist/index.cjs`; GitHub source and published package versions should be checked separately.

## Quick start

For a release containing this correction, install the corresponding published version, for example `npm install quanta-fsrs@1.0.4` once that version has been published. A GitHub README update alone does not publish it.

```ts
import { createNewCard, scheduleFSRS, Rating, isDue } from 'quanta-fsrs';

const now = new Date('2026-11-20T12:00:00Z');
const card = createNewCard('chapter-1');
const result = scheduleFSRS(card, Rating.Good, now);

console.log(result.card.reps);       // 1
console.log(result.intervalDays);    // 3 with the default parameters
console.log(isDue(result.card, now)); // false
```

CommonJS uses the same exported API:

```js
const { createNewCard, scheduleFSRS, Rating } = require('quanta-fsrs');
const result = scheduleFSRS(createNewCard('chapter-1'), Rating.Good);
```

Persist `result.card` and provide it to the next review. Each learner/card pair needs its own state; storage, user interface and review queues belong to the integrating application.

## API

| Export | Purpose |
| --- | --- |
| `createNewCard(id)` | Create an unreviewed `FSRSCard` with no review dates. |
| `scheduleFSRS(card, rating, now?, params?)` | Return an updated card, next-review date, interval and immediate recall estimate. Use ratings 1–4. |
| `Rating` | `Again=1`, `Hard=2`, `Good=3`, `Easy=4`. |
| `calculateRating(number)` | Map numeric input to one of those four ratings. |
| `retrievability(stabilityDays, elapsedDays)` | Estimate recall from stability and elapsed days. |
| `stability(weights, difficulty, stability, recall, grade?)` | Apply the implemented successful-review stability formula. |
| `difficulty(weights, grade)` | Calculate the implemented initial difficulty. |
| `isDue(card, now?)`, `filterDue(cards, now?)` | Check or select due cards. New cards are due. |
| `daysUntilReview(card, now?)` | Signed number of days until the scheduled review. |
| `sortByUrgency(cards, now?)` | Return a copy sorted by the package's recall estimate. |
| `formatStability(value)`, `formatRetrievability(value)` | Format model values for display. |
| `FSRS_PARAMS` | Historical 19-weight default parameter object. |
| `VERSION`, `ALGORITHM_VERSION` | Package version and historical algorithm label. |

Type exports include `FSRSCard`, `FSRSResult` and `FSRSParameters`.

## Model and integration scope

This implementation uses `R=(1+t/(9*S))^-1` for positive stability and elapsed time, and schedules the next review at rounded stability with a one-day minimum. The `targetRetention` field is retained in the parameter interface; changing it does not adjust `scheduleFSRS`. `maximumInterval` bounds stability.

The historical `ALGORITHM_VERSION` label is `FSRS-5`. Repository tests check the implemented behavior; they do not establish equivalence to an upstream FSRS release, domain-specific calibration or learning outcomes. The default weights are provided as configured values. Background reading: [upstream FSRS](https://github.com/open-spaced-repetition/fsrs4anki) and [Ye et al., KDD 2022](https://doi.org/10.1145/3534678.3539081).

## Development and release checks

```sh
npm ci --ignore-scripts
npm run lint
npm test
npm run test:package
```

The package check builds, packs to a temporary directory and verifies real CommonJS, ESM and TypeScript consumers against the packed artifact. It does not publish. npm publication requires a separate manual workflow dispatch with an exact manifest version; pushes do not bump or publish a version.

For defects, provide a minimal reproduction through the [issue tracker](https://github.com/ammmcreativetech-dot/quanta-fsrs/issues). Commercial licensing contacts and conditions are in LICENSE.
