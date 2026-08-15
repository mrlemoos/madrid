import { describe, expect, it } from 'vitest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  moneyToUsdDecimal,
  readMarketingGuidePrices,
  usdMinorUnitsToDecimal,
  validateUserBillingPlansAgainstExpectations,
  withinUsdTolerance,
  type BillingPlanLike,
} from './clerk-billing-marketing-expectations';

describe('usdMinorUnitsToDecimal', () => {
  it('converts cents to dollars', () => {
    // Arrange
    const twoFortyNineCents = 249;
    const nineteenFortyNineCents = 1949;

    // Act
    const first = usdMinorUnitsToDecimal(twoFortyNineCents);
    const second = usdMinorUnitsToDecimal(nineteenFortyNineCents);

    // Assert
    expect(first).toBe(2.49);
    expect(second).toBe(19.49);
  });
});

describe('moneyToUsdDecimal', () => {
  it('maps USD minor units', () => {
    // Arrange
    const lower = { amount: 249, currency: 'usd' as const };
    const upper = { amount: 249, currency: 'USD' as const };

    // Act
    const lowerUsd = moneyToUsdDecimal(lower);
    const upperUsd = moneyToUsdDecimal(upper);

    // Assert
    expect(lowerUsd).toBe(2.49);
    expect(upperUsd).toBe(2.49);
  });

  it('returns null for non-USD', () => {
    // Arrange
    const eur = { amount: 249, currency: 'eur' as const };

    // Act
    const result = moneyToUsdDecimal(eur);

    // Assert
    expect(result).toBeNull();
  });
});

describe('withinUsdTolerance', () => {
  it('accepts small drift', () => {
    // Arrange
    const tolerance = 0.02;

    // Act
    const within = withinUsdTolerance(2.5, 2.49, tolerance);
    const outside = withinUsdTolerance(2.52, 2.49, tolerance);

    // Assert
    expect(within).toBe(true);
    expect(outside).toBe(false);
  });
});

describe('readMarketingGuidePrices', () => {
  it('reads marketing Astro and matches home vs pricing', () => {
    // Arrange
    const root = repoRootFromThisFile();

    // Act
    const g = readMarketingGuidePrices(root);

    // Assert
    expect(g.monthlyUsd).toBe(2.49);
    expect(g.annualUsd).toBe(19.49);
  });
});

/** This spec lives in `apps/nota/src/server/` → monorepo root is four parents up. */
function repoRootFromThisFile(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
}

describe('validateUserBillingPlansAgainstExpectations', () => {
  const guide = { monthlyUsd: 2.49, annualUsd: 19.49 };

  it('errors when no public user plans', () => {
    // Arrange
    const plans: BillingPlanLike[] = [];

    // Act
    const issues = validateUserBillingPlansAgainstExpectations(plans, guide);

    // Assert
    expect(issues.some((i) => i.code === 'no_public_user_plans')).toBe(true);
  });

  it('passes for a minimal valid catalogue', () => {
    // Arrange
    const plans: BillingPlanLike[] = [
      makePlan({
        slug: 'nota-pro',
        isRecurring: true,
        fee: { amount: 249, currency: 'usd' },
        annualFee: { amount: 1949, currency: 'usd' },
        freeTrialEnabled: false,
        freeTrialDays: null,
      }),
      makePlan({
        slug: 'nota-lifetime',
        isRecurring: false,
        publiclyVisible: true,
        fee: { amount: 9999, currency: 'usd' },
        annualFee: null,
        freeTrialEnabled: false,
        isDefault: false,
      }),
    ];

    // Act
    const issues = validateUserBillingPlansAgainstExpectations(plans, guide);
    const errors = issues.filter((i) => i.level === 'error');

    // Assert
    expect(errors).toEqual([]);
  });

  it('errors on free trial days', () => {
    // Arrange
    const plans: BillingPlanLike[] = [
      makePlan({
        slug: 'bad',
        freeTrialEnabled: true,
        freeTrialDays: 14,
        fee: { amount: 249, currency: 'usd' },
        annualFee: { amount: 1949, currency: 'usd' },
      }),
    ];

    // Act
    const issues = validateUserBillingPlansAgainstExpectations(plans, guide);

    // Assert
    expect(issues.some((i) => i.code === 'free_trial_on_plan')).toBe(true);
  });
});

function makePlan(
  overrides: Partial<BillingPlanLike> & Pick<BillingPlanLike, 'slug'>,
): BillingPlanLike {
  const { slug, ...rest } = overrides;
  return {
    id: 'plan_test',
    name: 'Test',
    forPayerType: 'user',
    publiclyVisible: true,
    isRecurring: true,
    hasBaseFee: true,
    isDefault: false,
    freeTrialEnabled: false,
    freeTrialDays: null,
    fee: { amount: 249, currency: 'usd' },
    annualFee: { amount: 1949, currency: 'usd' },
    annualMonthlyFee: null,
    ...rest,
    slug,
  };
}
