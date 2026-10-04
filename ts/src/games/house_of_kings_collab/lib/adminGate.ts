export function isAdminUser(
  userEmail: string | null | undefined,
  configuredAdminEmail: string | undefined,
): boolean {
  const admin = (configuredAdminEmail ?? '').trim().toLowerCase();
  if (!admin) return false; // no admin configured: fail closed
  const user = (userEmail ?? '').trim().toLowerCase();
  return user !== '' && user === admin;
}
