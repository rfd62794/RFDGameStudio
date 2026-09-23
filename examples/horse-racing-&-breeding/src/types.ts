/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParentInfo {
  fatherId?: string;
  fatherName?: string;
  motherId?: string;
  motherName?: string;
}

export interface Horse {
  id: string;
  name: string;
  gender: 'Stallion' | 'Mare';
  generation: number;
  
  // Core Stats (0 to 100)
  speed: number;        // Determines maximum speed
  stamina: number;      // Higher stamina means slower fatigue rate
  acceleration: number; // Determines how quickly they reach top speed
  temperament: number;  // Higher temperament means more consistent racing, lower means higher volatility (lucky bursts or major blunders)
  
  // Aesthetic options
  colorBody: string;       // hex of horse body
  colorMane: string;       // hex of mane and tail
  colorSocks: string;      // hex of socks/accents
  colorJockeySilk: string; // hex of jockey jersey
  
  // Career details
  runs: number;
  wins: number;
  places: number;  // 2nd place
  thirds: number;  // 3rd place
  careerEarnings: number;
  
  // States
  cooldownUntil: number; // timestamp when horse can breed or race again
  isPlayerOwned: boolean;
  parents?: ParentInfo;
  price?: number;        // Stud fee or purchasing cost
}

export interface Bet {
  horseId: string;
  horseName: string;
  amount: number;
  type: 'Win' | 'Place'; // Win: must place 1st. Place: must place 1st, 2nd, or 3rd.
  payoutOdds: number;   // multiplier, e.g. 4.5
}

export interface RaceParticipant {
  horse: Horse;
  gate: number;
  odds: number;
  
  // Real-time race simulation variables (client-side only)
  progress: number;       // 0 to 100 % of race distance
  currentDistance: number;// meters covered
  currentSpeed: number;   // raw calculated meters/sec
  energy: number;         // percentage (100 down to 0) representing tiredness
  isFinished: boolean;
  finishTime?: number;    // final time in seconds
  finalRank?: number;     // final standing (1st, 2nd, etc)
}

export interface Race {
  id: string;
  name: string;
  description: string;
  distance: number; // 800m, 1200m, 1600m
  class: 'Maiden' | 'Class III' | 'Class II' | 'Class I' | 'Grand Prix';
  prizePool: number;
  participants: RaceParticipant[];
  status: 'scheduled' | 'running' | 'completed';
  startTime?: number;
}

export interface GameState {
  funds: number;
  horses: Horse[];
  bets: Bet[];
  currentRace: Race | null;
  raceHistory: {
    raceName: string;
    distance: number;
    prizePool: number;
    results: {
      rank: number;
      horseName: string;
      isPlayerOwned: boolean;
      payout: number;
    }[];
    timestamp: number;
  }[];
}
