import { AuthenticatedRequest } from '../middleware/verifyAuth';

export function resolvePlayerContext(req: AuthenticatedRequest, source: 'body' | 'query' = 'body') {
  const params = source === 'body' ? req.body : req.query;
  const kingdomId = (params?.kingdomId as string) || 'kingdom-mvp-0';
  const houseId = (params?.houseId as string) || 'house-of-kings-default';
  const userId = req.verifiedUid;
  if (!userId) {
    throw { status: 401, error: 'Unauthenticated user' };
  }
  return { kingdomId, houseId, userId };
}
