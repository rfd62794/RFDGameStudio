export interface MaterialProfile {
  compoundId: string;
  primaryColor: string; // hex — dominant particle color
  secondaryColor: string; // hex — variation/shimmer color
  emissive: boolean; // glows slightly in dark
  state: 'gas' | 'liquid' | 'solid' | 'dust';
  particleBehavior: 'drift' | 'settle' | 'pulse' | 'float';
}

export const MATERIAL_PROFILES: Record<string, MaterialProfile> = {
  nitrogen_vapor: {
    compoundId: 'nitrogen_vapor',
    primaryColor: '#b3d9ff',
    secondaryColor: '#e8f4ff',
    emissive: false,
    state: 'gas',
    particleBehavior: 'drift',
  },
  mineral_slurry: {
    compoundId: 'mineral_slurry',
    primaryColor: '#c8a04a',
    secondaryColor: '#e8c86a',
    emissive: false,
    state: 'liquid',
    particleBehavior: 'settle',
  },
  silicate_shard: {
    compoundId: 'silicate_shard',
    primaryColor: '#8aad8a',
    secondaryColor: '#c0d4c0',
    emissive: false,
    state: 'solid',
    particleBehavior: 'pulse',
  },
  dark_ion_mist: {
    compoundId: 'dark_ion_mist',
    primaryColor: '#6a3d9a',
    secondaryColor: '#9a5dca',
    emissive: true,
    state: 'gas',
    particleBehavior: 'drift',
  },
  primordial_brine: {
    compoundId: 'primordial_brine',
    primaryColor: '#1a6b4a',
    secondaryColor: '#2a9b6a',
    emissive: false,
    state: 'liquid',
    particleBehavior: 'settle',
  },
  dense_ferrite: {
    compoundId: 'dense_ferrite',
    primaryColor: '#8b4513',
    secondaryColor: '#cd6532',
    emissive: false,
    state: 'solid',
    particleBehavior: 'pulse',
  },
  chrono_vapor: {
    compoundId: 'chrono_vapor',
    primaryColor: '#00d4ff',
    secondaryColor: '#80eaff',
    emissive: true,
    state: 'gas',
    particleBehavior: 'drift',
  },
  acidic_ether: {
    compoundId: 'acidic_ether',
    primaryColor: '#b8ff00',
    secondaryColor: '#e0ff80',
    emissive: true,
    state: 'liquid',
    particleBehavior: 'settle',
  },
  quark_ore: {
    compoundId: 'quark_ore',
    primaryColor: '#ff3366',
    secondaryColor: '#ff80a0',
    emissive: true,
    state: 'solid',
    particleBehavior: 'pulse',
  },
  dust: {
    compoundId: 'dust',
    primaryColor: '#c8c0b8',
    secondaryColor: '#e0d8d0',
    emissive: false,
    state: 'dust',
    particleBehavior: 'float',
  },
};

export const DEFAULT_DUST_PROFILE: MaterialProfile = MATERIAL_PROFILES.dust;

export function getMaterialProfile(compoundIdOrStateType?: string | null): MaterialProfile {
  if (!compoundIdOrStateType) {
    return DEFAULT_DUST_PROFILE;
  }
  if (MATERIAL_PROFILES[compoundIdOrStateType]) {
    return MATERIAL_PROFILES[compoundIdOrStateType];
  }
  // Fallback by state if provided
  switch (compoundIdOrStateType) {
    case 'gas':
      return MATERIAL_PROFILES.nitrogen_vapor;
    case 'liquid':
      return MATERIAL_PROFILES.mineral_slurry;
    case 'solid':
      return MATERIAL_PROFILES.silicate_shard;
    case 'dust':
    default:
      return DEFAULT_DUST_PROFILE;
  }
}
