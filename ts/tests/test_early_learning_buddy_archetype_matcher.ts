import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { matchRequestedCharacter } from '../src/games/early_learning_buddy/utils/archetypeMatcher';
import { ARCHETYPES } from '../src/games/early_learning_buddy/data/archetypes';
import type { ArchetypeId } from '../src/games/early_learning_buddy/types';

const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as ArchetypeId[];

function mockFetchResponse(body: unknown, ok = true) {
  vi.mocked(fetch).mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('early_learning_buddy archetypeMatcher', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('empty input', () => {
    it('returns pony for an empty string', async () => {
      expect(await matchRequestedCharacter('')).toBe('pony');
    });

    it('returns pony for whitespace-only input', async () => {
      expect(await matchRequestedCharacter('   ')).toBe('pony');
    });

    it('does not attempt the API call for empty input', async () => {
      await matchRequestedCharacter('');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('local keyword matching', () => {
    it('matches when the input contains an archetype keyword', async () => {
      expect(await matchRequestedCharacter('I want a unicorn please')).toBe('pony');
      expect(await matchRequestedCharacter('a scary monster')).toBe('dragon');
      expect(await matchRequestedCharacter('my superhero friend')).toBe('hero');
      expect(await matchRequestedCharacter('a little pixie')).toBe('fairy');
      expect(await matchRequestedCharacter('stomp stomp')).toBe('dino');
      expect(await matchRequestedCharacter('a friendly droid')).toBe('robot');
    });

    it('matches when an archetype keyword contains the input', async () => {
      // 'uni' is a prefix of the pony keyword 'unicorn'
      expect(await matchRequestedCharacter('uni')).toBe('pony');
      // 'bot' is both a robot keyword and inside 'robot'
      expect(await matchRequestedCharacter('bot')).toBe('robot');
    });

    it('is case-insensitive and trims surrounding whitespace', async () => {
      expect(await matchRequestedCharacter('  DRAGON  ')).toBe('dragon');
      expect(await matchRequestedCharacter('Fairy')).toBe('fairy');
    });

    it('resolves keyword collisions by archetype declaration order', async () => {
      // 'wings' is a keyword on both dragon and fairy; dragon is declared first
      expect(await matchRequestedCharacter('wings')).toBe('dragon');
    });
  });

  describe('regex fallback mappings', () => {
    it('maps pony-flavoured names that are not literal keywords', async () => {
      expect(await matchRequestedCharacter('pinkie pie')).toBe('pony');
      expect(await matchRequestedCharacter('applejack the horse')).toBe('pony');
    });

    it('maps hero names caught only by the regex', async () => {
      // 'knight' appears in no keyword list but hits the hero regex
      expect(await matchRequestedCharacter('a brave knight')).toBe('hero');
    });

    it('maps fairy names caught only by the regex', async () => {
      // 'bloom' hits the fairy regex without touching any keyword
      expect(await matchRequestedCharacter('bloom')).toBe('fairy');
    });

    it('maps dino names caught only by the regex', async () => {
      expect(await matchRequestedCharacter('jurassic park')).toBe('dino');
    });

    it('maps robot names caught only by the regex', async () => {
      // 'cyborg' is not a keyword and does not contain the keyword 'cyber'
      expect(await matchRequestedCharacter('cyborg')).toBe('robot');
    });
  });

  describe('server classification', () => {
    it('returns the API archetypeId when it is a known archetype', async () => {
      mockFetchResponse({ archetypeId: 'robot' });
      expect(await matchRequestedCharacter('flomper')).toBe('robot');
    });

    it('posts the original requestName to /api/classify-character', async () => {
      mockFetchResponse({ archetypeId: 'fairy' });
      await matchRequestedCharacter('Flomper the Great');
      expect(fetch).toHaveBeenCalledWith('/api/classify-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestName: 'Flomper the Great' }),
      });
    });

    it('ignores an API archetypeId that is not a known archetype', async () => {
      mockFetchResponse({ archetypeId: 'wizard' });
      const result = await matchRequestedCharacter('flomper');
      expect(ARCHETYPE_IDS).toContain(result);
    });

    it('falls through to the hash fallback when the response is not ok', async () => {
      mockFetchResponse({}, false);
      const result = await matchRequestedCharacter('flomper');
      expect(ARCHETYPE_IDS).toContain(result);
    });
  });

  describe('hash fallback', () => {
    it('returns a valid archetype when nothing matches and fetch fails', async () => {
      const result = await matchRequestedCharacter('flomper');
      expect(ARCHETYPE_IDS).toContain(result);
    });

    it('is deterministic for the same input', async () => {
      const first = await matchRequestedCharacter('flomper');
      const second = await matchRequestedCharacter('flomper');
      expect(second).toBe(first);
    });
  });
});
