export type Vector2D = {
  x: number;
  y: number;
};

export type BallState = 'held' | 'loose' | 'in_flight';

export type DisposalMethod = 'kick' | 'handball' | 'touch_bounce';

export type PlayerRole = 'carrier' | 'chaser' | 'enforcer' | 'receiver' | 'ruckman' | 'sweeper';

export type InjurySeverity = 'none' | 'stunned' | 'down' | 'casualty' | 'fatal';

export type TeamSide = 'teamA' | 'teamB';

export interface Ball {
  pos: Vector2D;
  velocity: Vector2D;
  height: number;          // Z-axis for flight arcs, kicks, marks
  zVelocity: number;       // Vertical velocity for physics arc
  state: BallState;
  carrierId: string | null;     // ONLY non-null when state === 'held'
  lastCarrierId: string | null;
  lastPossessionTeam: TeamSide | null;
  flightOrigin?: Vector2D;
  flightTarget?: Vector2D;
  disposalType?: DisposalMethod;
  hangTimeRemaining: number;     // Ticks left in flight
  totalHangTime: number;
  bounceCount: number;
  looseTicks: number;           // How long it has been loose
}

export interface PlayerStats {
  speed: number;           // Movement speed (m/s)
  strength: number;        // Physical contest and tackle power (0-100)
  toughness: number;       // Natural physical armor/health (0-100)
  cyberArmor: number;      // Mechanical plating / damage soak (0-100)
  organicRatio: number;    // 0 = Full Mech, 1 = Full Organic (MBB Cyber-Organic stat)
  kickSkill: number;       // Distance & accuracy (0-100)
  handballSkill: number;   // Fast release & precision (0-100)
  markingSkill: number;    // Clean reception out of air (0-100)
  jumpReach: number;       // Vertical leap / arm extension for aerial intercepts & marks (0-100)
  aggression: number;      // Propensity to choose violence over ball (0-100)
}

export interface ScoringWeights {
  goalProximity: number;      // pull toward defending own goal
  ballThreat: number;         // pull toward pressuring the ball / carrier
  openness: number;           // reward distance from nearest opponent (space)
  passingLane: number;        // reward being a realistic, open target for a teammate carrier
  attackProgress: number;     // reward advancing toward the opponent's goal
  markAssignment: number;     // reward staying goal-side of a specific dangerous opponent
}

export interface ScoringBreakdown {
  goalProximity: number;
  ballThreat: number;
  openness: number;
  passingLane: number;
  attackProgress: number;
  markAssignment: number;
  totalScore: number;
}

export interface PositionCandidate {
  pos: Vector2D;
  score: number;
  breakdown?: ScoringBreakdown;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  team: TeamSide;
  pos: Vector2D;
  velocity: Vector2D;
  targetPos: Vector2D | null;
  role: PlayerRole;
  stats: PlayerStats;
  
  // Dynamic State
  stamina: number;         // 0 - 100
  injuryState: InjurySeverity;
  stunTicksRemaining: number;
  markProtectionTicks: number; // Protected window for clean mark (no tackle allowed)
  distanceCarriedWithoutTouch: number; // For AFL 15m anti-camping rule
  tackledTicks: number;    // Duration under active tackle pressure
  tackledByPlayerId: string | null;
  
  // Universal Decision System Dynamic State
  markedOpponentId: string | null;     // Specific opponent assigned to mark goal-side
  currentWeights?: ScoringWeights;    // Active utility weights evaluated this tick
  currentBreakdown?: ScoringBreakdown; // Detailed utility breakdown of chosen position
  candidateEvaluations?: PositionCandidate[]; // Sample candidates for tactical debug overlay

  // Match tracking
  statsMatch: {
    kicks: number;
    handballs: number;
    marks: number;
    tackles: number;
    hitsInflicted: number;
    injuriesInflicted: number;
    casualtiesCaused: number;
    turnoversConceded: number;
    goals: number;
    distanceRun: number;
  };
}

export interface SeverityProbabilities {
  stunnedChance: number;   // e.g. 0.35 (temporary 3-5s recovery)
  downChance: number;      // e.g. 0.30 (knocked down, tests each phase)
  casualtyChance: number;  // e.g. 0.25 (removed for rest of match)
  fatalChance: number;     // e.g. 0.10 (permanent kill / total wreckage)
}

export interface CombatRules {
  violenceAllowed: boolean;
  canTargetNonCarriers: boolean; // "Play the man" regardless of ball possession
  armorMitigatesSeverity: boolean;
  failedAttackPenalty: {
    causesTurnover: boolean;     // Blood Bowl rule: failed violence on active turn = turnover
    attackerStunChance: number;  // Attacker can counter-stun themselves on failure
    attackerInjuryRoll: boolean; // Attacker suffers armor test on blunder
  };
  severityTable: SeverityProbabilities;
  foulDownedPlayers: boolean;    // Can attack players already on ground
}

export interface DisposalRules {
  allowedMethods: {
    kick: boolean;
    handball: boolean;
    touchBounce: boolean;
  };
  maxCarryDistanceWithoutTouch: number; // e.g. 15.0 meters (AFL rule)
  carryPenaltyType: 'turnover_loose_ball' | 'free_kick_opponent';
  minKickDistanceForMark: number;        // e.g. 10.0 meters
  markProtectionDurationTicks: number;  // Ticks of protected disposal window
  maxTackleHoldTicks: number;            // Holding the ball if not disposed (e.g. 20 ticks = 1.0s)
}

export interface CourtConfig {
  name: string;
  width: number;           // e.g. 110 meters (or 60m for arena)
  height: number;          // e.g. 70 meters (or 40m for arena)
  goalWidth: number;       // e.g. 8 meters
  goalDepth: number;       // e.g. 3 meters
  centerCircleRadius: number;
  pickupRadius: number;    // Proximity threshold for ball recovery (e.g. 1.8m)
  wallBounceFriction: number;
  groundFriction: number;
}

export interface GoalRules {
  primaryGoalPoints: number;   // e.g. 6 points for central goal / in-goal
  minorBehindPoints: number;   // e.g. 1 point for hitting post or side behind
  resetAfterScore: 'center_bounce' | 'endzone_turnover' | 'continuous';
}

export interface SportEngineConfig {
  sportName: string;
  court: CourtConfig;
  disposal: DisposalRules;
  combat: CombatRules;
  goal: GoalRules;
  ticksPerSecond: number;
  matchDurationTicks: number;
}

export type SimEventType = 
  | 'ball_pickup'
  | 'ball_loose'
  | 'ball_bounced'
  | 'disposal_kick'
  | 'disposal_handball'
  | 'mark_taken'
  | 'interception_taken'
  | 'touch_bounce'
  | 'tackle_initiated'
  | 'tackle_broken'
  | 'holding_the_ball_turnover'
  | 'anti_camping_turnover'
  | 'combat_strike'
  | 'combat_stun'
  | 'combat_knockdown'
  | 'combat_casualty'
  | 'combat_fatal'
  | 'failed_violence_turnover'
  | 'goal_scored'
  | 'minor_scored'
  | 'match_start'
  | 'match_end';

export interface SimEvent {
  id: string;
  tick: number;
  type: SimEventType;
  description: string;
  team?: TeamSide;
  primaryPlayerId?: string;
  secondaryPlayerId?: string;
  pos: Vector2D;
  severity?: InjurySeverity;
  isTurnover?: boolean;
}

export interface TeamState {
  id: TeamSide;
  name: string;
  color: string;
  accentColor: string;
  score: number;
  goals: number;
  behinds: number;
  activeCasualties: number;
  totalInjuriesInflicted: number;
}
