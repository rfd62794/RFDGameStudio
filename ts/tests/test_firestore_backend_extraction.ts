import { describe, it, expect } from 'vitest';
import { docPath, collectionPath, documentPath, kingdomPath, housePath, playerPath } from '../src/engine/shared/firestoreBackend/paths';

describe('Firestore Backend Extraction — paths (generalized from HoK)', () => {
  describe('docPath (generic builder)', () => {
    it('builds a simple document path', () => {
      expect(docPath('kingdoms', 'kingdom-0')).toBe('kingdoms/kingdom-0');
    });

    it('builds a nested document path', () => {
      expect(docPath('kingdoms', 'kingdom-0', 'houses', 'house-0')).toBe('kingdoms/kingdom-0/houses/house-0');
    });

    it('filters falsy segments', () => {
      expect(docPath('kingdoms', '', 'houses', 'house-0')).toBe('kingdoms/houses/house-0');
    });
  });

  describe('collectionPath', () => {
    it('appends collection to parent doc path', () => {
      expect(collectionPath('kingdoms/kingdom-0', 'houses')).toBe('kingdoms/kingdom-0/houses');
    });
  });

  describe('documentPath', () => {
    it('appends doc ID to collection path', () => {
      expect(documentPath('kingdoms/kingdom-0/houses', 'house-0')).toBe('kingdoms/kingdom-0/houses/house-0');
    });
  });

  describe('HoK-specific path helpers (preserved as concrete example)', () => {
    it('kingdomPath builds correct path', () => {
      expect(kingdomPath('kingdom-mvp-0')).toBe('kingdoms/kingdom-mvp-0');
    });

    it('housePath builds nested path', () => {
      expect(housePath('kingdom-mvp-0', 'house-of-kings-default')).toBe(
        'kingdoms/kingdom-mvp-0/houses/house-of-kings-default'
      );
    });

    it('playerPath builds full player path', () => {
      expect(playerPath('kingdom-mvp-0', 'house-of-kings-default', 'user123')).toBe(
        'kingdoms/kingdom-mvp-0/houses/house-of-kings-default/players/user123'
      );
    });
  });
});
