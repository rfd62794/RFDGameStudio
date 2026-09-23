// Shared Auth Verification Middleware — generalized from House of Kings Collab
//
// Source: House of Kings Collab (src/middleware/verifyAuth.ts)
// Generalized: the admin email is now a required parameter rather than
// falling back to a hardcoded default. The verifyAuth middleware itself
// was already generic — identity is established exactly once per request
// via a cryptographically verified Firebase Auth ID Token, and
// client-supplied UIDs are never trusted for authorization.

import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from './firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  verifiedUid?: string;
  verifiedEmail?: string;
  idToken?: string;
}

export async function verifyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!idToken) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    req.verifiedUid = decoded.uid; // The ONLY source of truth for identity
    req.verifiedEmail = decoded.email;
    req.idToken = idToken;
    next();
  } catch (err: any) {
    console.error('verifyIdToken error:', err?.message || err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Admin verification middleware factory.
 * The admin email MUST be supplied by the caller — no hardcoded defaults.
 * This is itself a security rule: see docs/playbooks/firestore-security.md,
 * Incident 1 (hardcoded admin password).
 */
export function createVerifyAdmin(adminEmail: string) {
  return function verifyAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const userEmail = req.verifiedEmail?.toLowerCase();

    // Strict default-deny: reject missing email (e.g. anonymous auth) or non-matching email
    if (!userEmail || userEmail !== adminEmail.toLowerCase()) {
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.',
      });
    }
    next();
  };
}
