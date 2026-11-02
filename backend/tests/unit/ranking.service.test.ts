import { describe, it, expect } from "vitest";
import {
  calculateBayesianRating,
  MIN_REVIEW_THRESHOLD,
} from "../../src/modules/places/ranking.service.js";

describe("ranking.service - Bayesian Weighted Rating", () => {
  const overallAverage = 4.0; // Benchmark overall average (C)

  it("ensures a place with one 5-star review does not outrank a place with 312 reviews and 4.7 average", () => {
    const singleReviewCafe = calculateBayesianRating(5.0, 1, overallAverage);
    const establishedMuseum = calculateBayesianRating(4.7, 312, overallAverage);

    // Single review (v=1): (1/6)*5 + (5/6)*4 = 0.833 + 3.333 = 4.17
    // Established (v=312): (312/317)*4.7 + (5/317)*4 = 4.625 + 0.063 = 4.69
    expect(singleReviewCafe).toBe(4.17);
    expect(establishedMuseum).toBe(4.69);
    expect(establishedMuseum).toBeGreaterThan(singleReviewCafe);
  });

  it("gives a strong weighted score to a place with many positive reviews", () => {
    // 500 reviews with a 4.9 average when overall C is 3.5
    const score = calculateBayesianRating(4.9, 500, 3.5);

    // (500/505)*4.9 + (5/505)*3.5 ≈ 4.886 -> 4.89
    expect(score).toBe(4.89);
    expect(score).toBeGreaterThan(4.8);
  });

  it("pulls a place with few reviews closer to the overall average", () => {
    // 1 review of 5.0, overall average is 3.0
    // (1/6)*5.0 + (5/6)*3.0 = 0.833 + 2.50 = 3.33
    const score = calculateBayesianRating(5.0, 1, 3.0);
    expect(score).toBe(3.33);

    // The score (3.33) is pulled significantly toward the overall average (3.0) away from 5.0
    expect(Math.abs(score - 3.0)).toBeLessThan(Math.abs(score - 5.0));
  });

  it("returns the agreed safe result (0) when a place has no reviews", () => {
    expect(calculateBayesianRating(null, 0, overallAverage)).toBe(0);
    expect(calculateBayesianRating(0, 0, overallAverage)).toBe(0);
  });

  it("safely handles an empty overall review dataset without division by zero", () => {
    // When C = 0 and dataset is empty
    expect(calculateBayesianRating(null, 0, 0)).toBe(0);

    // Place with reviews but empty global dataset (C = 0)
    // (2 / (2 + 5)) * 4.0 + (5 / (2 + 5)) * 0 = (2/7)*4 = 1.14
    const score = calculateBayesianRating(4.0, 2, 0);
    expect(score).toBe(1.14);
    expect(Number.isFinite(score)).toBe(true);
    expect(Number.isNaN(score)).toBe(false);
  });

  it("produces the exact mathematically expected result for a known example", () => {
    // v = 5, m = 5, R = 4.0, C = 3.0
    // W = (5 / (5 + 5)) * 4.0 + (5 / (5 + 5)) * 3.0
    //   = 0.5 * 4.0 + 0.5 * 3.0 = 2.0 + 1.5 = 3.5
    const knownScore = calculateBayesianRating(4.0, 5, 3.0, 5);
    expect(knownScore).toBe(3.5);
  });

  it("increases the influence of the place's own average as review count increases", () => {
    const placeAverage = 4.8;
    const globalAverage = 3.0;

    const scoreAt2 = calculateBayesianRating(placeAverage, 2, globalAverage);
    const scoreAt10 = calculateBayesianRating(placeAverage, 10, globalAverage);
    const scoreAt50 = calculateBayesianRating(placeAverage, 50, globalAverage);
    const scoreAt200 = calculateBayesianRating(placeAverage, 200, globalAverage);

    // As v increases, score should monotonically increase towards placeAverage (4.8)
    expect(scoreAt2).toBe(3.51);
    expect(scoreAt10).toBe(4.2);
    expect(scoreAt50).toBe(4.64);
    expect(scoreAt200).toBe(4.76);

    expect(scoreAt10).toBeGreaterThan(scoreAt2);
    expect(scoreAt50).toBeGreaterThan(scoreAt10);
    expect(scoreAt200).toBeGreaterThan(scoreAt50);
  });

  it("uses the default minimum review threshold of 5", () => {
    expect(MIN_REVIEW_THRESHOLD).toBe(5);
  });
});

