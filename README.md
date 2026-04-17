# quanta-fsrs

> **FSRS v4.5/5 Spaced Repetition Scheduler** — zero dependencies, TypeScript-native, edge-ready.  
> Used in production at [quanta-study.de](https://quanta-study.de) — MINT-Lernplattform für Studenten.

[![npm version](https://img.shields.io/npm/v/quanta-fsrs?color=blue)](https://www.npmjs.com/package/quanta-fsrs)
[![npm downloads](https://img.shields.io/npm/dm/quanta-fsrs)](https://www.npmjs.com/package/quanta-fsrs)
[![bundle size](https://img.shields.io/bundlephobia/minzip/quanta-fsrs?label=gzip)](https://bundlephobia.com/package/quanta-fsrs)
[![license: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

---

## What is FSRS?

The **Free Spaced Repetition Scheduler (FSRS)** is a modern, open-weights algorithm for scheduling flashcard reviews. It was developed by Jarrett Ye (et al.) at Duolingo and published at KDD 2022:

> Ye, J., Su, T., Cao, J. (2022). *A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling.* KDD '22. [doi.org/10.1145/3534678.3539081](https://doi.org/10.1145/3534678.3539081)

**Key benchmark**: FSRS achieves a log-loss of 0.35 on 20,483,712 real Anki reviews, vs. 0.45 for SM-2 — a **22% improvement** in predictive accuracy.

### How FSRS Works

FSRS tracks three parameters per card per learner:

| Symbol | Name | Definition |
|--------|------|-----------|
| **S** | Stability | Days until Retrievability drops to 90% |
| **D** | Difficulty | Intrinsic item difficulty, range [1, 10] |
| **R(t)** | Retrievability | Probability of recall at time *t*: `R = 0.9^(t/S)` |

The algorithm updates S and D after each review using grade-dependent equations, then schedules the next review at *t = S* days (the exact point where R = 90%).

---

## Installation

```bash
npm install quanta-fsrs
# or
yarn add quanta-fsrs
# or
pnpm add quanta-fsrs
```

Zero dependencies. Works in Node.js ≥ 18, browsers, Deno, Bun, Cloudflare Workers, and Vercel Edge.

---

## Quick Start

```typescript
import { createInitialState, updateFSRS, calculateRetrievability, formatStability } from 'quanta-fsrs';

// 1. Create a new card state
let state = createInitialState();

// 2. After the first review — grade 3 (Good)
state = updateFSRS(state, 3);
console.log(state.stability);    // ~3.33 days
console.log(state.nextReview);   // ISO 8601, ~3 days from now
console.log(formatStability(state.stability)); // "3.3d"

// 3. After reviewing successfully again
state = updateFSRS(state, 4); // Easy
console.log(formatStability(state.stability)); // "35.8d" — interval grew

// 4. Check current recall probability
const r = calculateRetrievability(state.stability, state.lastReview);
console.log(`Recall probability: ${(r * 100).toFixed(1)}%`); // e.g., "98.7%"
```

---

## API Reference

### `createInitialState(): FSRSState`

Creates a blank state for a new card.

```typescript
const state = createInitialState();
// { stability: 0, difficulty: 5, lastReview: null, nextReview: null }
```

---

### `updateFSRS(state, grade, now?, weights?): FSRSState`

Processes a review and returns the updated state with the next scheduled date.

```typescript
const newState = updateFSRS(state, grade, now?, weights?);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | `FSRSState` | — | Current card state |
| `grade` | `1\|2\|3\|4` | — | Review grade (Again/Hard/Good/Easy) |
| `now` | `Date` | `new Date()` | Review timestamp |
| `weights` | `number[]` | `DEFAULT_MINT_WEIGHTS` | Custom FSRS weight vector |

**Grade mapping:**

| Grade | Label | Quanta alias | Meaning |
|-------|-------|-------|---------|
| `1` | Again | `'learning'` | Complete blackout |
| `2` | Hard | `'unsure'` | Recalled with great difficulty |
| `3` | Good | `'known'` | Recalled correctly |
| `4` | Easy | — | Instant, perfect recall |

---

### `calculateRetrievability(stability, lastReview, now?, targetRetention?): number`

Returns the current probability of recall (0–1).

```typescript
const r = calculateRetrievability(14, '2024-01-01T00:00:00Z');
// R = 0.9^(daysSince / 14) → e.g., 0.874 after 2 days
```

---

### `isDue(state, now?): boolean`

Returns `true` if the card is scheduled for review.

```typescript
if (isDue(state)) { /* show card */ }
```

---

### `daysUntilReview(state, now?): number`

Returns days remaining (positive) or overdue days (negative).

---

### `sortByUrgency(states, now?): FSRSState[]`

Sorts cards by ascending Retrievability — most forgotten first.

```typescript
const queue = sortByUrgency(allCards);
// queue[0] has the lowest recall probability → review first
```

---

### `filterDue(states, now?): FSRSState[]`

Returns only cards currently due for review.

---

### Formatting Utilities

```typescript
formatStability(3.33)  // "3.3d"
formatStability(45)    // "1.5mo"
formatStability(400)   // "1.1y"

formatRetrievability(0.874) // "87.4%"
```

---

## MINT-Optimized Weights

The `DEFAULT_MINT_WEIGHTS` are calibrated for high-performance academic learning in MINT disciplines (Mathematics, Informatics, Natural Sciences, Technology). They slightly favor longer intervals compared to stock FSRS weights, reflecting the abstract, interconnected nature of MINT content.

```typescript
import { DEFAULT_MINT_WEIGHTS, updateFSRS } from 'quanta-fsrs';

// Use default MINT weights (pre-selected)
const state = updateFSRS(current, 3);

// Or supply your own optimized weights
const myWeights = [/* 17 values */];
const state2 = updateFSRS(current, 3, new Date(), myWeights);
```

---

## Full Example: Study Session Simulator

```typescript
import {
  createInitialState, updateFSRS, calculateRetrievability,
  sortByUrgency, filterDue, formatStability, formatRetrievability
} from 'quanta-fsrs';

// Simulate a deck of 5 cards over 30 days
const deck = Array.from({ length: 5 }, (_, i) => ({
  id: `card-${i}`,
  ...createInitialState()
}));

// Day 1: Review all cards
let now = new Date('2024-01-01');
const graded = deck.map(card => ({
  ...card,
  ...updateFSRS(card, [3,4,2,3,4][card.id.slice(-1) as any] || 3, now)
}));

// Day 3: Check what's due
const day3 = new Date('2024-01-04');
const due = filterDue(graded, day3);
console.log(`${due.length} cards due on day 3`);

// Show urgency queue
const queue = sortByUrgency(graded, day3);
queue.forEach(c => {
  const r = calculateRetrievability(c.stability, c.lastReview, day3);
  console.log(`S=${formatStability(c.stability)}, R=${formatRetrievability(r)}`);
});
```

---

## TypeScript Types

```typescript
interface FSRSState {
  stability: number;      // days until R = 90%
  difficulty: number;     // [1, 10]
  lastReview: string | null;  // ISO 8601
  nextReview: string | null;  // ISO 8601
}

type FSRSGrade = 1 | 2 | 3 | 4;
type QuantaGrade = FSRSGrade | 'known' | 'unsure' | 'learning';
```

---

## Scientific Background

FSRS is built on three decades of cognitive science research:

- **Ebbinghaus (1885)**: Exponential forgetting curve — memory decays predictably without rehearsal.
- **Spacing Effect** (Cepeda et al., 2006): Distributed practice dramatically outperforms massed practice.
- **Testing Effect** (Roediger & Karpicke, 2006): Active retrieval (~30% stronger than re-reading).
- **Cognitive Load Theory** (Sweller, 1988): Difficulty modulates encoding quality via schema automation.

The FSRS power law `R(t) = retention^(t/S)` is the modern replacement for Ebbinghaus's pure exponential, providing dramatically better fit on real learner data.

---

## Comparison: FSRS vs SM-2

| Feature | FSRS v4.5 | SM-2 (Classic Anki) |
|---------|-----------|---------------------|
| Log-loss (20M reviews) | **0.35** | 0.45 |
| Stability growth model | Power-law (grade-adaptive) | Linear multiplier |
| Difficulty tracking | Per-card, continuous | Per-card, integer |
| Failure recovery | Smooth decay | Hard reset |
| Open weights | ✅ | ❌ |
| TypeScript types | ✅ | ❌ |
| Zero dependencies | ✅ | ❌ |

---

## Related Packages

- **[quanta-forgetting-curve](https://www.npmjs.com/package/quanta-forgetting-curve)** — Ebbinghaus forgetting curve model and retention predictor
- **[quanta-smiles-validator](https://www.npmjs.com/package/quanta-smiles-validator)** — SMILES string validation and analysis for chemistry learners

All three are part of Quanta's open-source MINT toolkit. See [quanta-study.de](https://quanta-study.de) for the full platform.

---

## Contributing

Pull requests are welcome. Please open an issue first for major changes.

```bash
git clone https://github.com/ammmcreativetech-dot/quanta-fsrs
cd quanta-fsrs
npm install
npm test
```

---

## License

MIT — free for commercial and non-commercial use.

---

*Built with ♥ by the [Quanta Team](https://quanta-study.de) — MINT-Lernplattform für Studenten in Deutschland, Österreich und der Schweiz.*
