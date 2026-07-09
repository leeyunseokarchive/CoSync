export function isPremium(profile: { plan?: string; subscriptionStatus?: string } | null | undefined): boolean {
  if (!profile) return false;
  return profile.plan === 'premium' && profile.subscriptionStatus === 'active';
}
