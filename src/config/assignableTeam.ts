// Team members shown in the dashboard "Assigned To" filter.
export const ASSIGNABLE_TEAM_NAMES = [
  'Thomas Klein', 'Suzie Mckenna', 'Stefan Wolf', 'Ahmetovic Elvis', 'Paul Katz',
  'Max Pfenning', 'Marco Lenovski', 'Johann Nowak', 'Johan Novak', 'Ikram Ayoub',
  'David Bergius', 'Amir Sumez', 'Ajos Sale',
];

const key = (name: string) =>
  name.toLowerCase().split(/\s+/).filter(Boolean).sort().join(' ');

const ALLOWED = new Set(ASSIGNABLE_TEAM_NAMES.map(key));

export const isAssignableTeamMember = (name: string) => ALLOWED.has(key(name));

export function filterAssignableTeam<T extends { name: string }>(users: T[]): T[] {
  const seen = new Set<string>();
  return users.filter((u) => {
    const k = key(u.name);
    if (!ALLOWED.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
