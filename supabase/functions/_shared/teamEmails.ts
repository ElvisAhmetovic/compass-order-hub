/**
 * Internal team email addresses.
 * Only these recipients may receive internal-only content (e.g. internal notes).
 * Keep in sync with src/constants/notificationEmails.ts
 */
export const TEAM_EMAIL_LIST = [
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'invoice@team-abmedia.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com',
  'ajosesales36@gmail.com',
  'georgabmediateam@gmail.com',
  'jannes@scoolfinanceedu.com',
  'ikram@team-abmedia.com',
  'johan@team-abmedia.com',
];

const TEAM_DOMAINS = ['team-abmedia.com', 'abmedia-team.com', 'abm-team.com'];

export function isTeamEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (TEAM_EMAIL_LIST.includes(normalized)) return true;
  const domain = normalized.split('@')[1] || '';
  return TEAM_DOMAINS.includes(domain);
}
