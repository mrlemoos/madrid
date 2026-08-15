/**
 * Expectations for Clerk Billing (user payer) vs marketing guide prices and AGENTS.md policy.
 * Marketing source of truth: `apps/nota-marketing/src/pages/pricing.astro` (and home page constants).
 * Product policy: AGENTS.md — no unpaid vault, no marketed free trial; in-app Clerk Billing.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Minor units (e.g. cents) → decimal dollars. */
export function usdMinorUnitsToDecimal(amount: number): number {
  return amount / 100;
}

export type MoneyLike = { amount: number; currency: string } | null;

export type BillingPlanLike = {
  id: string;
  name: string;
  slug: string;
  forPayerType: 'org' | 'user';
  publiclyVisible: boolean;
  isRecurring: boolean;
  hasBaseFee: boolean;
  isDefault: boolean;
  freeTrialEnabled: boolean;
  freeTrialDays: number | null;
  fee: MoneyLike;
  annualFee: MoneyLike;
  annualMonthlyFee: MoneyLike;
};

export type AlignmentIssue = {
  level: 'error' | 'warn';
  code: string;
  message: string;
};

const PRICE_RE_MONTHLY = /const\s+priceMonthlyUsd\s*=\s*'([\d.]+)'/;
const PRICE_RE_ANNUAL = /const\s+priceAnnualUsd\s*=\s*'([\d.]+)'/;

export type MarketingGuidePrices = { monthlyUsd: number; annualUsd: number };

/** Read `priceMonthlyUsd` / `priceAnnualUsd` from marketing Astro; ensure pricing and home stay aligned. */
export function readMarketingGuidePrices(
  repoRoot: string,
): MarketingGuidePrices {
  const pricingPath = join(
    repoRoot,
    'apps/nota-marketing/src/pages/pricing.astro',
  );
  const homePath = join(repoRoot, 'apps/nota-marketing/src/pages/index.astro');
  const pricingSrc = readFileSync(pricingPath, 'utf8');
  const homeSrc = readFileSync(homePath, 'utf8');

  const pm = PRICE_RE_MONTHLY.exec(pricingSrc);
  const pa = PRICE_RE_ANNUAL.exec(pricingSrc);
  const hm = PRICE_RE_MONTHLY.exec(homeSrc);
  const ha = PRICE_RE_ANNUAL.exec(homeSrc);
  if (!pm || !pa) {
    throw new Error(`Could not parse guide prices from ${pricingPath}`);
  }
  if (!hm || !ha) {
    throw new Error(`Could not parse guide prices from ${homePath}`);
  }
  const monthlyUsd = Number(pm[1]);
  const annualUsd = Number(pa[1]);
  if (hm[1] !== pm[1] || ha[1] !== pa[1]) {
    throw new Error(
      `Marketing home vs pricing guide mismatch: home ${hm[1]}/${ha[1]} vs pricing ${pm[1]}/${pa[1]}. Sync index.astro and pricing.astro.`,
    );
  }
  if (!Number.isFinite(monthlyUsd) || !Number.isFinite(annualUsd)) {
    throw new Error('Parsed guide prices are not finite numbers');
  }
  return { monthlyUsd, annualUsd };
}

function isUsd(m: MoneyLike): m is NonNullable<MoneyLike> {
  return (
    m != null && typeof m.amount === 'number' && typeof m.currency === 'string'
  );
}

/** Map Clerk Billing money to decimal USD; assumes `amount` is in minor units for USD. */
export function moneyToUsdDecimal(m: MoneyLike): number | null {
  if (!isUsd(m)) {
    return null;
  }
  const c = m.currency.trim().toLowerCase();
  if (c !== 'usd') {
    return null;
  }
  return usdMinorUnitsToDecimal(m.amount);
}

export function withinUsdTolerance(
  actual: number,
  expected: number,
  tolerance = 0.02,
): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

/**
 * Validate Clerk `BillingPlan` objects for user-facing catalogue vs marketing + AGENTS.md.
 */
export function validateUserBillingPlansAgainstExpectations(
  plans: BillingPlanLike[],
  guide: MarketingGuidePrices,
): AlignmentIssue[] {
  const issues: AlignmentIssue[] = [];

  const visibleUser = plans.filter(
    (p) => p.forPayerType === 'user' && p.publiclyVisible,
  );

  if (visibleUser.length === 0) {
    issues.push({
      level: 'error',
      code: 'no_public_user_plans',
      message:
        'No publicly visible Clerk Billing plans for payer type `user`. AGENTS.md expects in-app Clerk Billing (PricingTable) for Nota Pro.',
    });
    return issues;
  }

  for (const p of visibleUser) {
    if (p.freeTrialEnabled && (p.freeTrialDays ?? 0) > 0) {
      issues.push({
        level: 'error',
        code: 'free_trial_on_plan',
        message: `Plan "${p.name}" (${p.slug}) has freeTrialEnabled with ${p.freeTrialDays ?? 0} trial day(s). Marketing and AGENTS.md state there is no free trial for the full vault.`,
      });
    }
    if (
      p.freeTrialEnabled &&
      (p.freeTrialDays == null || p.freeTrialDays === 0)
    ) {
      issues.push({
        level: 'warn',
        code: 'free_trial_flag_without_days',
        message: `Plan "${p.name}" (${p.slug}) has freeTrialEnabled but zero/null freeTrialDays — confirm Dashboard intent.`,
      });
    }
  }

  const recurringVisible = visibleUser.filter((p) => p.isRecurring);

  const monthlyUsdFound = recurringVisible.some((p) => {
    const usd = moneyToUsdDecimal(p.fee);
    return usd != null && withinUsdTolerance(usd, guide.monthlyUsd);
  });

  if (!monthlyUsdFound) {
    issues.push({
      level: 'error',
      code: 'monthly_price_mismatch',
      message: `No publicly visible recurring user plan with monthly fee ≈ $${guide.monthlyUsd.toFixed(2)} USD (±$0.02) on file. Marketing guide: apps/nota-marketing pricing + home. Got recurring plans: ${recurringVisible.map(describePlanFees).join(' | ') || '(none)'}`,
    });
  }

  const annualUsdFound = recurringVisible.some((p) => {
    const annual = moneyToUsdDecimal(p.annualFee);
    return annual != null && withinUsdTolerance(annual, guide.annualUsd);
  });

  if (!annualUsdFound) {
    issues.push({
      level: 'error',
      code: 'annual_price_mismatch',
      message: `No publicly visible recurring user plan with annual fee ≈ $${guide.annualUsd.toFixed(2)} USD (±$0.02). Marketing guide: apps/nota-marketing. Got: ${recurringVisible.map(describePlanFees).join(' | ') || '(none)'}`,
    });
  }

  for (const p of visibleUser) {
    if (!p.isRecurring) {
      continue;
    }
    const monthly = moneyToUsdDecimal(p.fee);
    if (
      monthly === 0 ||
      (p.annualFee && moneyToUsdDecimal(p.annualFee) === 0)
    ) {
      issues.push({
        level: 'error',
        code: 'zero_recurring_price',
        message: `Plan "${p.name}" (${p.slug}) is recurring with a $0 USD fee. AGENTS.md: no unpaid tier with full vault access.`,
      });
    }
  }

  const defaultPlan = visibleUser.find((p) => p.isDefault);
  if (defaultPlan) {
    const m = moneyToUsdDecimal(defaultPlan.fee);
    const a = moneyToUsdDecimal(defaultPlan.annualFee);
    if (defaultPlan.isRecurring && m === 0 && (a == null || a === 0)) {
      issues.push({
        level: 'error',
        code: 'default_plan_free',
        message: `Default plan "${defaultPlan.name}" appears free ($0). That conflicts with "no unpaid tier" unless it is intentionally non-vault (unlikely for Nota).`,
      });
    }
  }

  const lifetimeLike = visibleUser.some((p) => !p.isRecurring);
  if (!lifetimeLike) {
    issues.push({
      level: 'warn',
      code: 'no_lifetime_plan',
      message:
        'No publicly visible non-recurring (one-time / lifetime) user plan. Marketing mentions lifetime when offered in checkout — optional.',
    });
  }

  issues.push({
    level: 'warn',
    code: 'trialing_status_note',
    message:
      'apps/nota/src/server/nota-pro-entitlement.ts grants vault for subscription status `trialing`. If Stripe/Clerk ever enables a trial on a price, users would get the vault during trial while marketing says no free trial — keep trials disabled on prices or adjust code/copy.',
  });

  return issues;
}

function describePlanFees(p: BillingPlanLike): string {
  const m = moneyToUsdDecimal(p.fee);
  const y = moneyToUsdDecimal(p.annualFee);
  const parts = [`${p.slug} recurring=${p.isRecurring}`];
  if (m != null) {
    parts.push(`monthly≈$${m.toFixed(2)}`);
  } else if (p.fee) {
    parts.push(`monthly=${p.fee.amount} ${p.fee.currency}`);
  } else {
    parts.push('monthly=(none)');
  }
  if (y != null) {
    parts.push(`annual≈$${y.toFixed(2)}`);
  } else if (p.annualFee) {
    parts.push(`annual=${p.annualFee.amount} ${p.annualFee.currency}`);
  } else {
    parts.push('annual=(none)');
  }
  return parts.join(' ');
}
