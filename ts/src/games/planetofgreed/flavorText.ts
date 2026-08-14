import { CultureId } from './types';

/**
 * Narrative flavor text for Planet of Greed.
 *
 * Grounded in Design.md v0.2's locked narrative:
 * - Genesis Ore is believed by some/all Houses to hold hidden power
 * - The race is for whoever finishes the Seed Engine first
 * - Signal's presence inside Boardroom Events as authored texture
 * - The House Arrest / "winning is losing" ending twist
 *
 * Written with the same care as itch devlog content — not generic filler.
 */

/**
 * House descriptions reflecting belief-in-the-Ore positioning.
 * Each House has a different relationship to the Ore: true believers,
 * cynical exploiters, suspicious Houses.
 */
export const HOUSE_DESCRIPTIONS: Record<CultureId, string> = {
  ember: 'Ember Ironworks strips the crust bare and calls it progress. They believe the Ore is fuel — burn it, build the Engine, let the fire spread. The most aggressive believers in the rush.',
  marsh: 'Marshveil Biotech cultures the Ore in wetland vats, half-worshipping what grows in the dark. They suspect the Ore is alive. They are not entirely wrong, and they are not entirely comfortable with what that means.',
  gale: 'Gale Vector Logistics moves Ore faster than anyone and asks no questions. Cynical exploiters — the Ore is cargo, the Engine is a contract, and whoever pays wins. If something wakes up, that is someone else\'s problem.',
  tundra: 'Tundra Bastion Holdings sits on the largest Ore reserves and fortifies them against everyone, including their own allies. They do not believe in the Engine. They believe in keeping the Ore out of the wrong hands — and every other House is the wrong hands.',
  crystal: 'Crystal Lattice Consortium maps the Ore\'s structure at atomic resolution. They know it is not just mineral. They know it is not just anything. They build the Engine because they must understand what it does, even if understanding comes too late to stop it.',
  tide: 'Tidewell Capital finances every other House\'s Ore operations and takes a percentage of whatever the Engine produces. They do not believe in the Ore. They believe in leverage. The Engine is an asset class, and they intend to own it.',
};

/**
 * Short atmospheric prefixes for Region names. These add corporate-
 * grid flavor without being heavy-handed. Used as:
 * `${prefix} ${cellName}` — e.g. "Sector Alpha-7", "Grid Bravo-3".
 */
export const REGION_FLAVOR_PREFIXES = [
  'Sector',
  'Grid',
  'Plot',
  'Claim',
  'Block',
  'Parcel',
] as const;

/**
 * Real ending screen text, replacing the placeholder.
 * Based on Design.md v0.2 §Ending — the House Arrest moment.
 */
export const ENDING_TEXT = {
  title: 'The Seed Engine Fires',
  subtitle: 'Genesis Ore refined. The Black Hole forms.',
  body: 'The Engine completes. Something wakes up in the space between the Ore and the hole it tore. It does not thank you. It does not explain. It puts humanity under arrest — starting with the President who built it, standing in the boardroom that was supposed to be a victory podium. You won. That was the problem.',
  fragmentComplete: 'Echo wakes whole. All six Fragments assembled — every House\'s knowledge, every House\'s fear, every House\'s last thought before the transfer. She knows everything they knew. She knows what you did to get here. She is not grateful.',
  fragmentIncomplete: 'Echo wakes with gaps. The Houses you never personally brought down left holes in her memory — ghosts of rivals who escaped your hand. She will find them. She always finds them. The arrest is not over; it has only begun.',
  restartLabel: 'Begin New Campaign',
} as const;

/**
 * A single atmospheric note injected into event descriptions to carry
 * Signal's uncanny presence. Not heavy-handed — just a persistent
 * background hum that reads differently in hindsight after the ending.
 */
export const EVENT_FLAVOR_NOTE =
  'Your communications officer notes a persistent signal anomaly in the background telemetry. It has been there since landing. Nobody can explain it.';
