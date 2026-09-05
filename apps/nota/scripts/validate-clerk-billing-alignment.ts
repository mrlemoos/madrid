#!/usr/bin/env bun
/**
 * Fetches Clerk Billing plans (user payer) and validates them against
 * `AGENTS.md` policy and guide USD amounts in `apps/nota-marketing`.
 *
 * **Nx (loads `apps/nota/.env` via `envFile`):** from monorepo root:
 *   npx nx run @getmadrid/nota:validate-billing
 *
 * **Direct:** `cd apps/nota && bun run scripts/validate-clerk-billing-alignment.ts`
 *   (the script also merges `.env` for keys unset in the environment).
 *
 * If `apps/nota/.env` is missing, it is created by copying `.env.example` (you must set `CLERK_SECRET_KEY`).
 */

import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClerkClient, type BillingPlan } from '@clerk/backend';
import {
  readMarketingGuidePrices,
  validateUserBillingPlansAgainstExpectations,
} from '../src/server/clerk-billing-marketing-expectations.ts';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(appRoot, '..', '..');

function ensureEnvFile(): void {
  const envPath = join(appRoot, '.env');
  const examplePath = join(appRoot, '.env.example');
  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath);
    console.warn(
      `Created ${envPath} from .env.example — set CLERK_SECRET_KEY before re-running.`,
    );
  }
}

/** Dotenv-style merge without extra deps: does not override existing process.env keys. */
function loadLocalEnv(): void {
  const envPath = join(appRoot, '.env');
  if (!existsSync(envPath)) {
    return;
  }
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function fetchAllUserPlans(
  clerk: ReturnType<typeof createClerkClient>,
): Promise<BillingPlan[]> {
  const all: BillingPlan[] = [];
  const pageSize = 50;
  let offset = 0;
  for (;;) {
    const res = await clerk.billing.getPlanList({
      payerType: 'user',
      limit: pageSize,
      offset,
    });
    all.push(...res.data);
    if (res.data.length < pageSize) {
      break;
    }
    offset += pageSize;
    if (offset > 10_000) {
      throw new Error('Pagination safety stop: more than 10000 billing plans');
    }
  }
  return all;
}

function printIssues(
  issues: { level: string; code: string; message: string }[],
): void {
  for (const i of issues) {
    const tag = i.level === 'error' ? 'FAIL' : 'WARN';
    console[`${i.level === 'error' ? 'error' : 'log'}`](
      `[${tag}] ${i.code}: ${i.message}`,
    );
  }
}

async function main(): Promise<void> {
  process.chdir(appRoot);
  ensureEnvFile();
  loadLocalEnv();

  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    console.error(
      'CLERK_SECRET_KEY is missing or empty in apps/nota/.env (or process env).',
    );
    process.exitCode = 1;
    return;
  }

  let guide: ReturnType<typeof readMarketingGuidePrices>;
  try {
    guide = readMarketingGuidePrices(repoRoot);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Marketing guide (USD): monthly $${guide.monthlyUsd.toFixed(2)}, annual $${guide.annualUsd.toFixed(2)} (from apps/nota-marketing).`,
  );
  console.log(
    'Policy: AGENTS.md — no unpaid vault; no marketed free trial; Clerk Billing in-app.\n',
  );

  const clerk = createClerkClient({ secretKey: secret });
  let plans: BillingPlan[];
  try {
    plans = await fetchAllUserPlans(clerk);
  } catch (e: unknown) {
    const err = e as {
      errors?: { message?: string; code?: string }[];
      status?: number;
    };
    const msg =
      err?.errors?.map((x) => x.message ?? x.code).join('; ') || String(e);
    console.error(
      `Clerk Billing API error (${err?.status ?? 'no status'}): ${msg}`,
    );
    console.error(
      'Ensure Billing is enabled for this Clerk instance and the secret key matches the application.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Fetched ${plans.length} Clerk Billing plan(s) (user payer, all visibility flags).\n`,
  );

  const issues = validateUserBillingPlansAgainstExpectations(plans, guide);
  printIssues(issues);

  const errors = issues.filter((i) => i.level === 'error');
  const warns = issues.filter((i) => i.level === 'warn');

  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s); see above.`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `\nOK — no alignment errors.${warns.length ? ` (${warns.length} warning(s))` : ''}`,
  );
}

await main();
