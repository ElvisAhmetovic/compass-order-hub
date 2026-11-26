import { describe, it, expect } from 'vitest';
import { isTeamRole } from './teamAccess';

describe('isTeamRole', () => {
  it('admins and agents are team', () => {
    expect(isTeamRole('admin')).toBe(true);
    expect(isTeamRole('agent')).toBe(true);
  });
  it('self-registered user accounts are not team', () => {
    expect(isTeamRole('user')).toBe(false);
  });
  it('clients and unknown roles are not team', () => {
    expect(isTeamRole('client')).toBe(false);
    expect(isTeamRole(undefined)).toBe(false);
  });
});
