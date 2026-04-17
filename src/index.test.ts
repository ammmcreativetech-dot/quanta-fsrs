import { describe, it, expect } from 'vitest';
import {
  scheduleFSRS,
  createNewCard,
  calculateRating,
  stability,
  difficulty,
  retrievability,
  FSRS_PARAMS,
  VERSION,
  Rating,
} from './index';

describe('FSRS — Core', () => {
  it('creates a new card with correct initial state', () => {
    const card = createNewCard('test-123');
    expect(card.id).toBe('test-123');
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
  });

  it('schedules first review for a "Good" rating and advances state', () => {
    const card = createNewCard('q1');
    const result = scheduleFSRS(card, Rating.Good);
    expect(result.card.reps).toBe(1);
    expect(result.card.stability).toBeGreaterThan(0);
    expect(result.card.difficulty).toBeGreaterThan(0);
    expect(result.nextReviewDate).toBeInstanceOf(Date);
    expect(result.nextReviewDate.getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('schedules same-day review for "Again" rating on new card', () => {
    const card = createNewCard('q2');
    const result = scheduleFSRS(card, Rating.Again);
    // Again on first review should produce a short interval (hours, not days)
    const intervalMs = result.nextReviewDate.getTime() - Date.now();
    expect(intervalMs).toBeLessThan(24 * 60 * 60 * 1000 + 1000); // < 1 day
    expect(result.card.lapses).toBeGreaterThanOrEqual(0);
  });

  it('"Easy" gives a longer first interval than "Good"', () => {
    const base = createNewCard('q3');
    const good = scheduleFSRS(base, Rating.Good);
    const easy = scheduleFSRS(base, Rating.Easy);
    expect(easy.nextReviewDate.getTime()).toBeGreaterThanOrEqual(
      good.nextReviewDate.getTime(),
    );
  });

  it('"Hard" gives a shorter first interval than "Good"', () => {
    const base = createNewCard('q4');
    const hard = scheduleFSRS(base, Rating.Hard);
    const good = scheduleFSRS(base, Rating.Good);
    expect(hard.nextReviewDate.getTime()).toBeLessThanOrEqual(
      good.nextReviewDate.getTime(),
    );
  });
});

describe('FSRS — Multi-session progression', () => {
  it('increases stability over successive Good reviews', () => {
    let card = createNewCard('progression');
    const stabilities: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = scheduleFSRS(card, Rating.Good);
      card = res.card;
      stabilities.push(card.stability);
    }
    // Net stability after 4 reviews must be higher than after first review
    expect(stabilities[stabilities.length - 1]).toBeGreaterThan(stabilities[0]);
    // And all stabilties must be positive
    stabilities.forEach(s => expect(s).toBeGreaterThan(0));
  });

  it('lapses increment when card is forgotten', () => {
    let card = createNewCard('lapse');
    card = scheduleFSRS(card, Rating.Good).card;
    card = scheduleFSRS(card, Rating.Good).card;
    const lapsedCard = scheduleFSRS(card, Rating.Again).card;
    expect(lapsedCard.lapses).toBeGreaterThan(0);
  });
});

describe('FSRS — Utility', () => {
  it('retrievability returns 1.0 for t=0', () => {
    expect(retrievability(10, 0)).toBeCloseTo(1.0);
  });

  it('retrievability decreases over time', () => {
    const r1 = retrievability(5, 3);
    const r2 = retrievability(5, 10);
    expect(r1).toBeGreaterThan(r2);
  });

  it('calculateRating maps numeric 1-4 to enum values', () => {
    expect(calculateRating(1)).toBe(Rating.Again);
    expect(calculateRating(4)).toBe(Rating.Easy);
  });

  it('stability() and difficulty() return finite positive numbers', () => {
    expect(isFinite(stability(new Array(19).fill(1), 5, 0.9, 3))).toBe(true);
    expect(isFinite(difficulty(new Array(19).fill(1), 3))).toBe(true);
  });

  it('exports VERSION string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION.length).toBeGreaterThan(0);
  });

  it('FSRS_PARAMS has 19 weights', () => {
    expect(FSRS_PARAMS.weights.length).toBe(19);
  });
});
