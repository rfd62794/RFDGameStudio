export type Brand = 
  | 'Trueflame' 
  | 'Icevault' 
  | 'Quicksilver' 
  | 'Prismworks' 
  | 'Mirefaith' 
  | 'Tidalcapital';

export type QualityTier = 'Brand New' | 'Refurbished' | 'Malfunctioning';

export type SlotType = 'head' | 'chest' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

export type BodyArchetype = 'humanoid' | 'quadruped' | 'beast_brute' | 'avian_raptor';

export type FacingDirection = 'side_right' | 'side_left' | 'front' | 'back';

export type AnimationType = 
  | 'idle' 
  | 'walk' 
  | 'sprint' 
  | 'attack' 
  | 'stagger'
  | 'tackle_block'
  | 'celebration'
  | 'down_salvage'
  | 'wild_alert'
  | 'flee_startled';

export interface CreaturePart {
  brand: Brand;
  quality: QualityTier;
  cyberOrganic: number; // 0 = 100% Organic, 100 = 100% Cyber
  variant?: string;
  nameModifier?: string;
}

export interface CreatureConfig {
  id: string;
  name: string;
  codename?: string;
  archetype: BodyArchetype;
  slots: Record<SlotType, CreaturePart>;
  lore?: string;
  creatorTag?: string;
}

export interface SocketPoint {
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  name: string;
}

export interface BodySockets {
  neck: SocketPoint;
  shoulderLeft: SocketPoint;
  shoulderRight: SocketPoint;
  hipLeft: SocketPoint;
  hipRight: SocketPoint;
  tail?: SocketPoint;
  core: SocketPoint;
}

export interface BoneTransform {
  x: number;
  y: number;
  rotation: number; // in degrees
  scaleX?: number;
  scaleY?: number;
}

export interface CreaturePose {
  chest: BoneTransform;
  head: BoneTransform;
  leftUpperArm: BoneTransform;
  leftForearm: BoneTransform;
  rightUpperArm: BoneTransform;
  rightForearm: BoneTransform;
  leftThigh: BoneTransform;
  leftCalf: BoneTransform;
  rightThigh: BoneTransform;
  rightCalf: BoneTransform;
  tail?: BoneTransform;
  glowIntensity: number;
  breatheScale: number;
  glitchJitter: { x: number; y: number; active: boolean };
}

export interface BrandMotionSignature {
  title: string;
  mechanicalIdentity: string;
  motionSignature: string;
  accelerationProfile: string;
}

export interface BrandMetadata {
  id: Brand;
  name: string;
  mechanicalIdentity: string;
  visualDirection: string;
  motionSignature: BrandMotionSignature;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  organicColor: string;
  cyberColor: string;
  statAffinity: {
    power: number;
    mitigation: number;
    agility: number;
    precision: number;
    adaptability: number;
    momentum: number;
  };
  symbol: string;
  badgeBg: string;
  badgeBorder: string;
}
