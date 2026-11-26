import type { UserRole } from '@/types';

/** Only admins and agents are Empria team members; self-made "user" accounts get no team access. */
export const isTeamRole = (role: UserRole | string | null | undefined): boolean =>
  role === 'admin' || role === 'agent';
