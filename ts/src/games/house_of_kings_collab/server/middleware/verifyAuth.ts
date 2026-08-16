import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from '../lib/firebaseAdmin';

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
    // Enforce Google account requirement — reject anonymous and other providers
    const provider = decoded.firebase?.sign_in_provider;
    if (provider !== 'google.com') {
      return res.status(403).json({
        error: 'A Google account is required to play. Please sign in with Google.',
      });
    }
    req.verifiedUid = decoded.uid; // The ONLY source of truth for identity
    req.verifiedEmail = decoded.email;
    req.idToken = idToken;
    next();
  } catch (err: any) {
    console.error('verifyIdToken error:', err?.message || err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function verifyAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const adminEmail = process.env.ADMIN_EMAIL || 'cheater2478@gmail.com';
  const userEmail = req.verifiedEmail?.toLowerCase();

  // Strict default-deny: reject missing email (e.g. anonymous auth) or non-matching email
  if (!userEmail || userEmail !== adminEmail.toLowerCase()) {
    return res.status(403).json({
      error: 'Access denied. Game Master privileges required.',
    });
  }
  next();
}
