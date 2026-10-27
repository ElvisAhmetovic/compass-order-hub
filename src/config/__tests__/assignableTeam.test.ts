import { describe, it, expect } from 'vitest';
import { filterAssignableTeam } from '../assignableTeam';

describe('assignable team filter', () => {
  it('keeps team members once and drops clients/test accounts', () => {
    const out = filterAssignableTeam([
      { id: '1', name: 'Ajos Sale' }, { id: '2', name: 'Ajos Sale' },
      { id: '3', name: 'Finance Test' }, { id: '4', name: 'johansuperadmin' },
      { id: '5', name: 'Elvis Ahmetovic' },
    ]);
    expect(out.map((u) => u.id)).toEqual(['1', '5']);
  });
});
