import type { JSX } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { NotesOnboarding } from '@/components/notes-onboarding';
import { OnboardingPaywall } from '@/components/onboarding-paywall';
import { getServerNotaProEntitled } from '@/server/nota-pro-entitlement';
import { getOnboardingVersion } from '@/server/onboarding.server';
import { CURRENT_ONBOARDING_VERSION } from '@/lib/onboarding-version';

export default async function OnboardingPage(): Promise<JSX.Element> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/signin');
  }

  const [entitled, onboardingVersion] = await Promise.all([
    getServerNotaProEntitled(userId),
    getOnboardingVersion(userId),
  ]);
  if (!entitled) {
    return <OnboardingPaywall />;
  }
  if (onboardingVersion === CURRENT_ONBOARDING_VERSION) {
    redirect('/notes');
  }

  return <NotesOnboarding userId={userId} />;
}
