import 'server-only';

import { requireServiceSupabase } from './supabase-service.server';

export async function getOnboardingVersion(
  userId: string,
): Promise<number | null> {
  const { data, error } = await requireServiceSupabase()
    .from('user_preferences')
    .select('onboarding_version')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load onboarding status: ${error.message}`);
  }

  const onboardingVersion = data?.onboarding_version;
  return typeof onboardingVersion === 'number' ? onboardingVersion : null;
}
