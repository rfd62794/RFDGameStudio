export type ShiftType = 'MORNING' | 'MID' | 'GRAVEYARD';

export type AgentRole = 'CSR' | 'TSR' | 'SALES' | 'TL' | 'QA' | 'IT' | 'WFM';

export type AgentState = 
  | 'ON_CALL' 
  | 'ACW' 
  | 'IDLE' 
  | 'BREAK' 
  | 'LUNCH' 
  | 'SLEEPING' 
  | 'COACHING' 
  | 'WALKING';

export interface Agent {
  id: string;
  name: string;
  avatarSeed: number;
  gender: 'M' | 'F';
  role: AgentRole;
  shift: ShiftType;
  state: AgentState;
  deskId: string | null;
  
  // Stats (0 - 100)
  energy: number;
  stress: number;
  morale: number;
  englishSkill: number;
  empathySkill: number;
  techSkill: number;
  speed: number;
  
  // Performance
  callsHandledToday: number;
  totalCallsHandled: number;
  csat: number; // 0 - 100
  avgHandleTime: number; // in seconds
  
  // Financial
  salary: number; // in PHP monthly
  bonusEarned: number;
  
  // Current Live Call Info
  activeCallDuration: number;
  activeCallType?: string;
  
  // Speech bubble
  speechBubble?: {
    text: string;
    icon?: string;
    expiresAt: number;
  };

  // Position for walking/animation
  gridX: number;
  gridY: number;
  targetGridX?: number;
  targetGridY?: number;
}

export type TileType = 
  | 'FLOOR' 
  | 'WALL' 
  | 'DOOR' 
  | 'CUBICLE' 
  | 'SERVER_RACK' 
  | 'WATER_DISPENSER' 
  | 'COFFEE_MAKER' 
  | 'PANTRY_TABLE' 
  | 'SLEEPING_POD' 
  | 'PLANT' 
  | 'RECEPTION_DESK' 
  | 'VENDING_MACHINE';

export interface GridTile {
  x: number;
  y: number;
  type: TileType;
  id?: string;
  label?: string; // e.g. "A", "B", "C" for pods
  variant?: number;
  assignedAgentId?: string | null;
  qualityLevel?: number; // 1, 2, 3
  status?: 'OK' | 'BROKEN' | 'UPGRADING';
}

export interface ClientCampaign {
  id: string;
  name: string;
  clientCountry: string; // USA, UK, Australia, Canada
  serviceType: string;
  payoutPerCall: number; // in PHP
  targetAHT: number; // target seconds (e.g. 300)
  targetCSAT: number; // target % (e.g. 85%)
  difficulty: number; // 1 to 5
  active: boolean;
  totalCallsReceived: number;
  totalCallsHandled: number;
}

export interface CallScriptConfig {
  greeting: 'formal' | 'friendly' | 'speedy';
  empathyLevel: 'high' | 'balanced' | 'low';
  objectionStrategy: 'credit_voucher' | 'active_listening' | 'strict_policy';
  surveyPrompt: 'enthusiastic' | 'polite' | 'none';
  upsellAttempt: boolean;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'reward';
  options: {
    label: string;
    cost?: number;
    effectDescription: string;
    action: () => void;
  }[];
}

export interface GameStats {
  money: number; // PHP
  day: number;
  gameTimeMinutes: number; // 0 to 1440 (24h)
  callsQueue: number;
  totalCallsToday: number;
  totalAnsweredToday: number;
  totalAbandonedToday: number;
  slaPercent: number; // % answered within target
  avgProductivity: number;
  avgHappiness: number;
  rating: number; // 1.0 to 5.0
  reputation: number; // 0 to 100
  officeLevel: number; // 1: Eastwood, 2: Ortigas, 3: BGC, 4: Cebu IT Park
}

export interface ITInfrastructure {
  ispProvider: 'PLDT_BASIC' | 'GLOBE_CORP' | 'DUAL_FIBER_FAILOVER' | 'STARLINK_REDUNDANT';
  serverHealth: number; // 0 - 100
  serverLoad: number; // 0 - 100
  coolingActive: boolean;
  pcTier: number; // 1: Celeron, 2: Core i5, 3: Core i7 Dual Monitor
  headsetTier: number; // 1: Generic, 2: USB Noise Canceling, 3: Plantronics Studio
  bandwidthMbps: number;
}

export interface HRPolicy {
  basePayMultiplier: number; // 1.0 = standard
  nightDiffPercent: number; // 10% standard, can be up to 25%
  hmoPlan: 'NONE' | 'BASIC' | 'SILVER' | 'PLATINUM';
  freeCoffeeEnabled: boolean;
  freeMealsEnabled: boolean;
  monthly13thAccrued: number;
}

// List/Dialer/Quota systems (Phase 1)
export interface LeadList {
  id: string;
  source: string;
  purity: number; // 0-100
  freshness: number; // 0-100
  volume: number; // remaining leads
}

export interface DialerConfig {
  pace: number; // calls per tick the dialer attempts to push
  tier: number; // upgrade tier (1 = base)
}

export interface QuotaState {
  target: number;
  progress: number;
  payoutPerCall: number; // PHP earned per completed call
}

export type DayVerdict = 'met' | 'missed' | 'partial';
