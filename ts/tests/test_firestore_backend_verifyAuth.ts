import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Response, NextFunction } from 'express';

const firebaseAdmin = vi.hoisted(() => ({
  getAdminAuth: vi.fn(),
}));

vi.mock('../src/engine/shared/firestoreBackend/firebaseAdmin', () => ({
  getAdminAuth: firebaseAdmin.getAdminAuth,
}));

import {
  verifyAuth,
  createVerifyAdmin,
  type AuthenticatedRequest,
} from '../src/engine/shared/firestoreBackend/verifyAuth';

function mockReq(authorization?: string): AuthenticatedRequest {
  const headers: Record<string, string> = {};
  if (authorization !== undefined) headers.authorization = authorization;
  return { headers } as AuthenticatedRequest;
}

function mockRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function mockVerifyIdToken(result: { uid: string; email?: string } | Error) {
  const verifyIdToken =
    result instanceof Error
      ? vi.fn().mockRejectedValue(result)
      : vi.fn().mockResolvedValue(result);
  firebaseAdmin.getAdminAuth.mockReturnValue({ verifyIdToken });
  return verifyIdToken;
}

describe('firestoreBackend/verifyAuth (generalized from HoK)', () => {
  beforeEach(() => {
    firebaseAdmin.getAdminAuth.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyAuth', () => {
    it('rejects with 401 when the authorization header is absent', async () => {
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      await verifyAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No authorization token provided',
      });
      expect(next).not.toHaveBeenCalled();
      expect(firebaseAdmin.getAdminAuth).not.toHaveBeenCalled();
    });

    it('rejects with 401 when the scheme is not Bearer', async () => {
      const req = mockReq('Basic dXNlcjpwYXNz');
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      await verifyAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No authorization token provided',
      });
      expect(next).not.toHaveBeenCalled();
      expect(firebaseAdmin.getAdminAuth).not.toHaveBeenCalled();
    });

    it('rejects with 401 when the Bearer token is empty', async () => {
      const req = mockReq('Bearer ');
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      await verifyAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No authorization token provided',
      });
      expect(next).not.toHaveBeenCalled();
      expect(firebaseAdmin.getAdminAuth).not.toHaveBeenCalled();
    });

    it('verifies the token, stamps identity on the request, and calls next', async () => {
      const verifyIdToken = mockVerifyIdToken({
        uid: 'uid-123',
        email: 'user@example.com',
      });
      const req = mockReq('Bearer token-abc');
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      await verifyAuth(req, res, next);

      expect(verifyIdToken).toHaveBeenCalledWith('token-abc');
      expect(req.verifiedUid).toBe('uid-123');
      expect(req.verifiedEmail).toBe('user@example.com');
      expect(req.idToken).toBe('token-abc');
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects with 401 when verifyIdToken throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockVerifyIdToken(new Error('token expired'));
      const req = mockReq('Bearer stale-token');
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      await verifyAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(next).not.toHaveBeenCalled();
      expect(req.verifiedUid).toBeUndefined();
    });
  });

  describe('createVerifyAdmin', () => {
    it('rejects with 403 when verifiedEmail is missing', () => {
      const verifyAdmin = createVerifyAdmin('admin@example.com');
      const req = mockReq('Bearer token-abc');
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      verifyAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Admin privileges required.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects with 403 when the verified email does not match the admin email', () => {
      const verifyAdmin = createVerifyAdmin('admin@example.com');
      const req = mockReq('Bearer token-abc');
      req.verifiedEmail = 'intruder@example.com';
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      verifyAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Admin privileges required.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next when the verified email matches the admin email', () => {
      const verifyAdmin = createVerifyAdmin('admin@example.com');
      const req = mockReq('Bearer token-abc');
      req.verifiedEmail = 'admin@example.com';
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      verifyAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('matches case-insensitively on both the request and configured emails', () => {
      const verifyAdmin = createVerifyAdmin('Admin@Example.COM');
      const req = mockReq('Bearer token-abc');
      req.verifiedEmail = 'ADMIN@example.com';
      const res = mockRes();
      const next = vi.fn() as NextFunction;

      verifyAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
