import { describe, it, expect } from 'vitest';
import { isAdminUser } from '../src/games/house_of_kings_collab/lib/adminGate';

describe('house_of_kings_collab admin gate', () => {
  it('returns false when the configured admin email is undefined, even for a signed-in user', () => {
    expect(isAdminUser('admin@example.com', undefined)).toBe(false);
  });

  it('returns false when the configured admin email is empty', () => {
    expect(isAdminUser('admin@example.com', '')).toBe(false);
  });

  it('returns false when the configured admin email is whitespace only', () => {
    expect(isAdminUser('admin@example.com', '   ')).toBe(false);
  });

  it('returns true when the user email equals the configured one, ignoring case and surrounding spaces', () => {
    expect(isAdminUser('  Admin@Example.com  ', 'admin@example.com')).toBe(true);
    expect(isAdminUser('admin@example.com', ' ADMIN@EXAMPLE.COM ')).toBe(true);
  });

  it('returns false for a different user email', () => {
    expect(isAdminUser('player@example.com', 'admin@example.com')).toBe(false);
  });

  it('returns false for a null user email', () => {
    expect(isAdminUser(null, 'admin@example.com')).toBe(false);
  });

  it('returns false for an undefined user email', () => {
    expect(isAdminUser(undefined, 'admin@example.com')).toBe(false);
  });
});
