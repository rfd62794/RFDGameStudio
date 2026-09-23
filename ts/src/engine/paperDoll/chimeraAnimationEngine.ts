import { AnimationType, BodyArchetype, Brand, CreaturePose, FacingDirection } from './chimeraTypes';

export interface PoseAngles {
  chestX?: number;
  chestY: number;
  chestRot: number;
  headRot: number;
  headY: number;
  headX?: number;
  shoulderL: number;
  elbowL: number;
  shoulderR: number;
  elbowR: number;
  hipL: number;
  kneeL: number;
  hipR: number;
  kneeR: number;
  tailRot?: number;
  breatheScale: number;
  emissiveSurge?: number;
}

/**
 * Brand-specific motion modifier parameters
 */
interface BrandMotionParams {
  speedScale: number;
  anticipationWeight: number; // multiplier for wind-up depth
  snapExponent: number; // strike acceleration curvature (higher = sharper snap)
  inertiaDamping: number; // resistance to rapid displacement
  elasticOvershoot: number; // wobble / spring settle multiplier
  phaseLag: number; // biomorphic asynchronous wave offset
  followThroughSustain: number; // lingering kinetic follow-through duration
}

function getBrandMotionParams(brand: Brand): BrandMotionParams {
  switch (brand) {
    case 'Trueflame': // Aggressive, explosive, sharp snap, minimal restraint
      return {
        speedScale: 1.15,
        anticipationWeight: 0.85,
        snapExponent: 3.5,
        inertiaDamping: 0.9,
        elasticOvershoot: 0.3,
        phaseLag: 0.02,
        followThroughSustain: 0.8,
      };
    case 'Icevault': // Slower, weighted, heavy inertia, deep grounded compliance
      return {
        speedScale: 0.85,
        anticipationWeight: 1.35,
        snapExponent: 2.0,
        inertiaDamping: 1.6,
        elasticOvershoot: 0.1,
        phaseLag: 0.04,
        followThroughSustain: 0.7,
      };
    case 'Quicksilver': // Agility, fast light spring, high overshoot / elastic settle
      return {
        speedScale: 1.25,
        anticipationWeight: 0.9,
        snapExponent: 2.8,
        inertiaDamping: 0.6,
        elasticOvershoot: 1.8,
        phaseLag: 0.01,
        followThroughSustain: 0.9,
      };
    case 'Prismworks': // Precision, accuracy, exact mathematical cubic curves, zero slop
      return {
        speedScale: 1.0,
        anticipationWeight: 1.0,
        snapExponent: 3.0,
        inertiaDamping: 1.0,
        elasticOvershoot: 0.0,
        phaseLag: 0.0,
        followThroughSustain: 1.0,
      };
    case 'Mirefaith': // Fluid, biomorphic undulating lag, asynchronous waves
      return {
        speedScale: 0.95,
        anticipationWeight: 1.1,
        snapExponent: 2.4,
        inertiaDamping: 0.85,
        elasticOvershoot: 0.8,
        phaseLag: 0.12, // heavy organic wave delay
        followThroughSustain: 1.2,
      };
    case 'Tidalcapital': // Builds smoothly, carries momentum through follow-through
      return {
        speedScale: 1.05,
        anticipationWeight: 1.2,
        snapExponent: 2.2,
        inertiaDamping: 1.1,
        elasticOvershoot: 0.5,
        phaseLag: 0.06,
        followThroughSustain: 1.5, // long lingering momentum
      };
    default:
      return {
        speedScale: 1.0,
        anticipationWeight: 1.0,
        snapExponent: 3.0,
        inertiaDamping: 1.0,
        elasticOvershoot: 0.5,
        phaseLag: 0.02,
        followThroughSustain: 1.0,
      };
  }
}

/**
 * Calculates hierarchical bone poses at normalized time t (0.0 - 1.0).
 * Implements fundamental animation principles:
 * - ARCS: Real circular, elliptical, and parabolic joint trajectories.
 * - ANTICIPATION: Real counter-movements preceding committed actions.
 * - BRAND SIGNATURES: Distinct easing, inertia, and cadence driven by the dominant Brand.
 * - ARCHETYPE SILHOUETTES: Grounded kinematics for Humanoids, Quadrupeds, Brutes, and Avian Raptors.
 */
export function calculatePose(
  type: AnimationType,
  t: number, // 0 to 1
  archetype: BodyArchetype,
  hasMalfunction: boolean,
  brand: Brand = 'Trueflame',
  facing: FacingDirection = 'side_right'
): CreaturePose {
  const brandParams = getBrandMotionParams(brand);

  // Time warp based on brand speed and phase characteristics
  const effectiveT = t % 1.0;
  const rad = effectiveT * Math.PI * 2;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const sin2 = Math.sin(rad * 2);

  // Biomorphic asynchronous phase lag for natural drag
  const lagRad = (effectiveT - brandParams.phaseLag) * Math.PI * 2;
  const sinLag = Math.sin(lagRad);

  let angles: PoseAngles = {
    chestX: 0,
    chestY: 0,
    chestRot: 0,
    headRot: 0,
    headY: 0,
    headX: 0,
    shoulderL: 0,
    elbowL: 0,
    shoulderR: 0,
    elbowR: 0,
    hipL: 0,
    kneeL: 0,
    hipR: 0,
    kneeR: 0,
    tailRot: 0,
    breatheScale: 1.0,
    emissiveSurge: 0,
  };

  switch (type) {
    /* ========================================================================
       1. IDLE (BREATHE & GROUNDED COMPLIANCE)
       - Thoracic ribcage expansion with organic vertical-lateral arcs
       - Asynchronous head stabilization lag
       - Grounded joint compliance absorbing heave so feet never lift
       ======================================================================== */
    case 'idle': {
      const heaveDepth = (archetype === 'beast_brute' ? 3.4 : 2.2) * (brand === 'Icevault' ? 1.4 : 1.0);
      const breatheHeave = sin2 * heaveDepth;
      const breatheLateral = sin * (archetype === 'quadruped' ? 0.4 : 0.8);

      if (archetype === 'quadruped') {
        angles = {
          chestX: breatheLateral,
          chestY: breatheHeave,
          chestRot: sin * 0.8,
          headRot: -sinLag * 2.5 - 6,
          headY: breatheHeave * 0.75,
          shoulderL: 8 - breatheHeave * 0.6,
          elbowL: -14 + breatheHeave * 0.8,
          shoulderR: 6 - breatheHeave * 0.6,
          elbowR: -12 + breatheHeave * 0.8,
          hipL: -12 + breatheHeave * 0.5,
          kneeL: 22 - breatheHeave * 0.7,
          hipR: -14 + breatheHeave * 0.5,
          kneeR: 24 - breatheHeave * 0.7,
          tailRot: Math.sin(rad * 1.5) * 14 + 5,
          breatheScale: 1.0 + sin2 * 0.02,
        };
      } else if (archetype === 'avian_raptor') {
        const saccade = (effectiveT > 0.4 && effectiveT < 0.48) ? 8 : (effectiveT > 0.82 && effectiveT < 0.9) ? -6 : 0;
        angles = {
          chestX: breatheLateral,
          chestY: breatheHeave + 4,
          chestRot: 14 + sin * 1.5,
          headRot: -18 + sinLag * 2 + saccade,
          headY: breatheHeave * 0.65,
          shoulderL: -34 + sin * 2,
          elbowL: 68 + cos * 3,
          shoulderR: -28 - sin * 2,
          elbowR: 62 - cos * 3,
          hipL: 22 - breatheHeave * 0.4,
          kneeL: -36 + breatheHeave * 0.6,
          hipR: 16 - breatheHeave * 0.4,
          kneeR: -30 + breatheHeave * 0.6,
          tailRot: sin * 8 + 12,
          breatheScale: 1.0 + sin2 * 0.025,
        };
      } else if (archetype === 'beast_brute') {
        angles = {
          chestX: breatheLateral,
          chestY: breatheHeave,
          chestRot: sin * 1.4,
          headRot: -sinLag * 2.8 - 2,
          headY: breatheHeave * 0.6,
          shoulderL: -16 + sin * 3,
          elbowL: 32 + cos * 4,
          shoulderR: 16 - sin * 3,
          elbowR: -32 - cos * 4,
          hipL: 6 + sin * 1.5,
          kneeL: 12 - breatheHeave * 0.5,
          hipR: -6 - sin * 1.5,
          kneeR: 12 - breatheHeave * 0.5,
          breatheScale: 1.0 + sin2 * 0.038,
        };
      } else {
        // Humanoid athletic ready breathe
        angles = {
          chestX: breatheLateral,
          chestY: breatheHeave,
          chestRot: sin * 1.2,
          headRot: -sinLag * 2.0,
          headY: breatheHeave * 0.5,
          shoulderL: -14 + sin * 3,
          elbowL: 22 + cos * 3.5,
          shoulderR: 14 - sin * 3,
          elbowR: -22 - cos * 3.5,
          hipL: 4 + sin * 1.2,
          kneeL: 6 - breatheHeave * 0.4,
          hipR: -4 - sin * 1.2,
          kneeR: 6 - breatheHeave * 0.4,
          breatheScale: 1.0 + sin2 * 0.026,
        };
      }
      break;
    }

    /* ========================================================================
       2. WALK CYCLE (CURVED KINETIC STRIDES & ELLIPTICAL HIP ARCS)
       - Weight shifts laterally over supporting leg (`chestX`)
       - Heel-strike compression & toe-off lift form sinusoidal height arcs
       - Forearms and calves exhibit natural pendulum lag and flexion arcs
       ======================================================================== */
    case 'walk': {
      const hipArcL = sin;
      const hipArcR = -sin;
      // Inverted pendulum vertical bounce (dips on plant, rises during swing apex)
      const walkBounce = -Math.abs(sin) * 5 + 2.5;
      const lateralWeightShift = sin * 3.5;

      if (archetype === 'quadruped') {
        const bounce = Math.abs(sin) * 4 - 2;
        angles = {
          chestX: lateralWeightShift * 0.5,
          chestY: bounce,
          chestRot: sin * 2.5,
          headRot: -sinLag * 3.2,
          headY: bounce * 0.6,
          shoulderL: sin * 24 + 6,
          elbowL: sin < 0 ? -10 + Math.abs(sin) * 26 : -18,
          shoulderR: -sin * 24 + 6,
          elbowR: -sin < 0 ? -10 + Math.abs(-sin) * 26 : -18,
          hipL: -sin * 22 - 10,
          kneeL: -sin > 0 ? 12 + Math.abs(sin) * 28 : 20,
          hipR: sin * 22 - 10,
          kneeR: sin > 0 ? 12 + Math.abs(sin) * 28 : 20,
          tailRot: -sin * 18,
          breatheScale: 1.0,
        };
      } else if (archetype === 'avian_raptor') {
        angles = {
          chestX: lateralWeightShift * 0.6,
          chestY: walkBounce + 4,
          chestRot: 16 + sin * 3,
          headRot: -18 - sinLag * 3.5, // steadycam gaze compensation
          headY: walkBounce * 0.3,
          shoulderL: -30 - sin * 14,
          elbowL: 64 + Math.abs(sin) * 16,
          shoulderR: -30 + sin * 14,
          elbowR: 64 + Math.abs(sin) * 16,
          hipL: sin * 28 + 14,
          kneeL: sin < 0 ? -18 - Math.abs(sin) * 36 : -34,
          hipR: -sin * 28 + 14,
          kneeR: sin > 0 ? -18 - Math.abs(sin) * 36 : -34,
          tailRot: -sin * 16 + 10,
          breatheScale: 1.0,
        };
      } else {
        // Humanoid & Beast Brute biomechanical walk
        // Arm swing with forearm lag (arcs in space)
        const armL = -sin * 28 - 4;
        const forearmLagL = Math.max(0, -sinLag * 26) + 14;
        const armR = sin * 28 + 4;
        const forearmLagR = Math.max(0, sinLag * 26) + 14;

        // Knee bends sharply during forward swing for ground clearance arc
        const kneeFlexL = sin < 0 ? Math.abs(sin) * 46 : 6;
        const kneeFlexR = sin > 0 ? Math.abs(sin) * 46 : 6;

        angles = {
          chestX: lateralWeightShift,
          chestY: walkBounce,
          chestRot: sin * 3.2,
          headRot: -sinLag * 2.5,
          headY: walkBounce * 0.4,
          shoulderL: armL,
          elbowL: forearmLagL,
          shoulderR: armR,
          elbowR: forearmLagR,
          hipL: hipArcL * 26 + 2,
          kneeL: kneeFlexL,
          hipR: hipArcR * 26 + 2,
          kneeR: kneeFlexR,
          tailRot: -sin * 14,
          breatheScale: 1.0,
        };
      }
      break;
    }

    /* ========================================================================
       3. SPRINT (BALL DRIVE) — ATHLETIC POWER LOCOMOTION
       - 20° forward kinetic trunk cant
       - Double-bounce flight phase & deep plant spring compression
       - 90° locked piston arm drive with shoulder counter-roll
       ======================================================================== */
    case 'sprint': {
      const sprintBounce = Math.abs(sin) * 9 - 4.5;
      const forwardLean = 22 + sin * 4;

      if (archetype === 'quadruped') {
        const gallopPitch = sin * 10;
        angles = {
          chestX: sin * 2,
          chestY: sprintBounce,
          chestRot: 10 + gallopPitch,
          headRot: -14 - gallopPitch * 0.8,
          headY: sprintBounce * 0.5,
          shoulderL: sin * 42 + 10,
          elbowL: sin < 0 ? -8 + Math.abs(sin) * 44 : -26,
          shoulderR: Math.sin(rad + 0.5) * 42 + 10,
          elbowR: Math.sin(rad + 0.5) < 0 ? -8 + Math.abs(Math.sin(rad + 0.5)) * 44 : -26,
          hipL: -sin * 44 - 16,
          kneeL: -sin > 0 ? 10 + Math.abs(sin) * 58 : 24,
          hipR: -Math.sin(rad + 0.4) * 44 - 16,
          kneeR: -Math.sin(rad + 0.4) > 0 ? 10 + Math.abs(Math.sin(rad + 0.4)) * 58 : 24,
          tailRot: -sin * 30,
          breatheScale: 1.03,
        };
      } else if (archetype === 'avian_raptor') {
        angles = {
          chestX: sin * 2,
          chestY: sprintBounce + 8,
          chestRot: 28 + sin * 5,
          headRot: -30 - sinLag * 4,
          headY: sprintBounce * 0.3,
          shoulderL: -18 - sin * 24,
          elbowL: 44 + Math.abs(sin) * 22,
          shoulderR: -18 + sin * 24,
          elbowR: 44 + Math.abs(sin) * 22,
          hipL: sin * 50 + 18,
          kneeL: sin < 0 ? -12 - Math.abs(sin) * 72 : -42,
          hipR: -sin * 50 + 18,
          kneeR: sin > 0 ? -12 - Math.abs(sin) * 72 : -42,
          tailRot: -sin * 34 + 14,
          breatheScale: 1.04,
        };
      } else {
        const leftLegDriving = sin > 0;
        const rightLegDriving = sin < 0;

        angles = {
          chestX: sin * 2.5,
          chestY: sprintBounce,
          chestRot: forwardLean,
          headRot: -20 - sinLag * 3,
          headY: sprintBounce * 0.4,
          shoulderL: -sin * 58 - 12,
          elbowL: 84 + Math.abs(sin) * 26,
          shoulderR: sin * 58 - 12,
          elbowR: 84 + Math.abs(sin) * 26,
          hipL: sin * 48 + 8,
          kneeL: leftLegDriving ? 8 : Math.abs(sin) * 82 + 14,
          hipR: -sin * 48 + 8,
          kneeR: rightLegDriving ? 8 : Math.abs(sin) * 82 + 14,
          tailRot: -sin * 26,
          breatheScale: 1.04,
        };
      }
      break;
    }

    /* ========================================================================
       4. POWER STRIKE — 4-PHASE KINETIC CHAIN WITH ANTICIPATION
       - Phase 1 (0.0 - 0.36): Wind-up & Anticipation (drop CG, twist back, high cocked blade)
       - Phase 2 (0.36 - 0.48): Explosive snap along curved strike trajectory
       - Phase 3 (0.48 - 0.70): Overshoot follow-through & momentum carry
       - Phase 4 (0.70 - 1.0): Settling weight recovery
       ======================================================================== */
    case 'attack': {
      const snapExp = brandParams.snapExponent;
      if (effectiveT < 0.36) {
        // Anticipation Wind-Up
        const p = effectiveT / 0.36;
        const ease = Math.pow(p, 1.8) * brandParams.anticipationWeight;
        angles = {
          chestX: -ease * 9,
          chestY: ease * 9, // lower center of gravity
          chestRot: -ease * 24, // coil backward
          headRot: ease * 16,
          headY: ease * 4,
          shoulderL: 20 + ease * 70,
          elbowL: 30 + ease * 80,
          shoulderR: -30 - ease * 42,
          elbowR: 40 + ease * 38,
          hipL: -ease * 24,
          kneeL: ease * 34,
          hipR: ease * 20,
          kneeR: ease * 24,
          tailRot: -ease * 32,
          breatheScale: 1.0,
          emissiveSurge: ease * 0.45,
        };
      } else if (effectiveT < 0.50) {
        // Explosive Snap Release along curved trajectory
        const p = (effectiveT - 0.36) / 0.14;
        const snap = Math.pow(p, snapExp);
        angles = {
          chestX: -9 + snap * 20,
          chestY: 9 - snap * 16,
          chestRot: -24 + snap * 58, // violent snap forward
          headRot: 16 - snap * 30,
          headY: 4 - snap * 9,
          shoulderL: 90 - snap * 175,
          elbowL: 110 - snap * 100,
          shoulderR: -72 + snap * 96,
          elbowR: 78 - snap * 54,
          hipL: -24 + snap * 52,
          kneeL: 34 - snap * 26,
          hipR: 20 - snap * 46,
          kneeR: 24 + snap * 20,
          tailRot: -32 + snap * 70,
          breatheScale: 1.08,
          emissiveSurge: 1.0,
        };
      } else if (effectiveT < 0.72) {
        // Momentum Follow-Through & Brand-Dependent Elastic Overshoot
        const p = (effectiveT - 0.50) / 0.22;
        const decay = 1 - p;
        const overshootWobble = Math.sin(p * Math.PI * 3) * brandParams.elasticOvershoot * decay * 4;
        angles = {
          chestX: 11 * decay + 2,
          chestY: -7 * decay,
          chestRot: 34 * decay + 6 + overshootWobble,
          headRot: -14 * decay - 2,
          headY: -5 * decay,
          shoulderL: -85 * decay - 24 + overshootWobble * 2,
          elbowL: 10 * decay + 16,
          shoulderR: 24 * decay + 6,
          elbowR: 24 * decay + 10,
          hipL: 28 * decay + 4,
          kneeL: 8 * decay + 4,
          hipR: -26 * decay - 4,
          kneeR: 44 * decay + 6,
          tailRot: 38 * decay + 5,
          breatheScale: 1.02,
          emissiveSurge: decay * 0.75,
        };
      } else {
        // Recovery Hold to Ready Stance
        const p = (effectiveT - 0.72) / 0.28;
        const recover = 1 - p;
        angles = {
          chestX: 2 * recover,
          chestY: 0,
          chestRot: 6 * recover,
          headRot: -2 * recover,
          headY: 0,
          shoulderL: -24 * recover - 14 * (1 - recover),
          elbowL: 16 * recover + 22 * (1 - recover),
          shoulderR: 6 * recover + 14 * (1 - recover),
          elbowR: 10 * recover - 22 * (1 - recover),
          hipL: 4 * recover + 4 * (1 - recover),
          kneeL: 4 * recover + 6 * (1 - recover),
          hipR: -4 * recover - 4 * (1 - recover),
          kneeR: 6 * recover + 6 * (1 - recover),
          tailRot: 5 * recover,
          breatheScale: 1.0,
          emissiveSurge: 0,
        };
      }
      break;
    }

    /* ========================================================================
       5. IMPACT STAGGER — FORCE REACTION & TRIPOD BRACE CATCH
       ======================================================================== */
    case 'stagger': {
      const damping = brandParams.inertiaDamping;
      if (effectiveT < 0.16) {
        const p = effectiveT / 0.16;
        const shock = Math.sin(p * Math.PI * 0.5);
        angles = {
          chestX: (-shock * 18) / damping,
          chestY: -shock * 14,
          chestRot: (-shock * 26) / damping,
          headRot: shock * 34,
          headY: -shock * 10,
          shoulderL: shock * 50 - 10,
          elbowL: shock * 68 + 20,
          shoulderR: -shock * 50 + 10,
          elbowR: -shock * 68 - 20,
          hipL: -shock * 24,
          kneeL: shock * 32,
          hipR: shock * 20,
          kneeR: shock * 28,
          tailRot: shock * 42,
          breatheScale: 0.95,
          emissiveSurge: shock * 0.9,
        };
      } else if (effectiveT < 0.45) {
        const p = (effectiveT - 0.16) / 0.29;
        const stumble = Math.sin(p * Math.PI);
        angles = {
          chestX: -18 / damping + p * 8,
          chestY: -14 + p * 24,
          chestRot: -26 / damping + p * 14,
          headRot: 34 - p * 26,
          headY: -10 + p * 16,
          shoulderL: 40 + stumble * 26,
          elbowL: 88 - p * 32,
          shoulderR: -40 - stumble * 26,
          elbowR: -88 + p * 32,
          hipL: -24 - stumble * 16,
          kneeL: 32 + p * 24,
          hipR: 20 + stumble * 16,
          kneeR: 28 + p * 22,
          tailRot: 42 - p * 26,
          breatheScale: 0.96,
          emissiveSurge: (1 - p) * 0.6,
        };
      } else if (effectiveT < 0.72) {
        const p = (effectiveT - 0.45) / 0.27;
        const decay = 1 - p;
        const tremor = Math.sin(p * Math.PI * 8) * decay * 4.5;
        angles = {
          chestX: (-10 * decay) / damping + tremor * 0.8,
          chestY: 8 * decay,
          chestRot: -12 * decay + tremor,
          headRot: 8 * decay - tremor * 1.5,
          headY: 6 * decay,
          shoulderL: 20 * decay + tremor * 2 - 14,
          elbowL: 45 * decay + 22,
          shoulderR: -20 * decay - tremor * 2 + 14,
          elbowR: -45 * decay - 22,
          hipL: -10 * decay + 4,
          kneeL: 35 * decay + 6,
          hipR: 8 * decay - 4,
          kneeR: 32 * decay + 6,
          tailRot: 15 * decay,
          breatheScale: 1.0 + Math.sin(p * Math.PI * 4) * 0.02,
          emissiveSurge: 0,
        };
      } else {
        const p = (effectiveT - 0.72) / 0.28;
        const recover = 1 - p;
        angles = {
          chestX: 0,
          chestY: 0,
          chestRot: 0,
          headRot: 0,
          headY: 0,
          shoulderL: -14,
          elbowL: 22,
          shoulderR: 14,
          elbowR: -22,
          hipL: 4,
          kneeL: 6 + recover * 10,
          hipR: -4,
          kneeR: 6 + recover * 10,
          tailRot: 0,
          breatheScale: 1.0 + sin2 * 0.02,
          emissiveSurge: 0,
        };
      }
      break;
    }

    /* ========================================================================
       6. TACKLE / BLOCK (MUTANT BATTLE BALL DEFENSIVE IMPACT)
       - Low wide center of gravity, forward step plant
       - Shoulders clamped inward, forearms braced in rigid shield wall
       - Collision shock compression and dominant line hold
       ======================================================================== */
    case 'tackle_block': {
      if (effectiveT < 0.25) {
        // Phase 1: Rapid Drop into Braced Defense (Anticipation / Shield Clamp)
        const p = effectiveT / 0.25;
        const drop = Math.pow(p, 1.6);
        angles = {
          chestX: drop * 4,
          chestY: drop * 12, // deep crouch
          chestRot: drop * 16, // forward cant
          headRot: -drop * 18, // head ducked behind shoulders
          headY: drop * 8,
          // Clamped shield wall: elbows inward, forearms vertical
          shoulderL: drop * 45,
          elbowL: 60 + drop * 50,
          shoulderR: -drop * 35,
          elbowR: 60 + drop * 50,
          // Wide grounded stance
          hipL: drop * 22,
          kneeL: drop * 40,
          hipR: -drop * 18,
          kneeR: drop * 35,
          tailRot: -drop * 20,
          breatheScale: 0.98,
          emissiveSurge: drop * 0.5,
        };
      } else if (effectiveT < 0.55) {
        // Phase 2: High-Energy Collision Impact Absorption
        const p = (effectiveT - 0.25) / 0.30;
        const impactPulse = Math.sin(p * Math.PI);
        angles = {
          chestX: 4 - impactPulse * 6, // pushed back slightly by collision
          chestY: 12 + impactPulse * 4, // compress down further
          chestRot: 16 - impactPulse * 6,
          headRot: -18 + impactPulse * 8,
          headY: 8,
          shoulderL: 45 + impactPulse * 10,
          elbowL: 110 - impactPulse * 15,
          shoulderR: -35 - impactPulse * 10,
          elbowR: 110 - impactPulse * 15,
          hipL: 22 - impactPulse * 8,
          kneeL: 40 + impactPulse * 8,
          hipR: -18 + impactPulse * 6,
          kneeR: 35 + impactPulse * 6,
          tailRot: -20 + impactPulse * 15,
          breatheScale: 1.02,
          emissiveSurge: 0.5 + impactPulse * 0.5,
        };
      } else {
        // Phase 3: Hold the Line & Rebound Forward
        const p = (effectiveT - 0.55) / 0.45;
        const settle = 1 - p;
        angles = {
          chestX: settle * 4,
          chestY: settle * 12,
          chestRot: settle * 16,
          headRot: -settle * 18,
          headY: settle * 8,
          shoulderL: settle * 45 - (1 - settle) * 14,
          elbowL: settle * 110 + (1 - settle) * 22,
          shoulderR: -settle * 35 + (1 - settle) * 14,
          elbowR: settle * 110 - (1 - settle) * 22,
          hipL: settle * 22 + (1 - settle) * 4,
          kneeL: settle * 40 + (1 - settle) * 6,
          hipR: -settle * 18 - (1 - settle) * 4,
          kneeR: settle * 35 + (1 - settle) * 6,
          tailRot: -settle * 20,
          breatheScale: 1.0,
          emissiveSurge: settle * 0.3,
        };
      }
      break;
    }

    /* ========================================================================
       7. CELEBRATION (MUTANT BATTLE BALL SCORE BEAT)
       - Coil drop -> explosive skyward chest thrust & fist pump / wing flare
       - Pulsating 100% emissive surge & proud champion ready stance
       ======================================================================== */
    case 'celebration': {
      if (effectiveT < 0.20) {
        // Coil down
        const p = effectiveT / 0.20;
        const ease = p * p;
        angles = {
          chestX: 0,
          chestY: ease * 8,
          chestRot: ease * 12,
          headRot: -ease * 10,
          headY: ease * 4,
          shoulderL: ease * 25,
          elbowL: 22 + ease * 40,
          shoulderR: -ease * 25,
          elbowR: -22 - ease * 40,
          hipL: ease * 10,
          kneeL: ease * 20,
          hipR: -ease * 10,
          kneeR: ease * 20,
          tailRot: -ease * 15,
          breatheScale: 0.98,
          emissiveSurge: ease * 0.3,
        };
      } else if (effectiveT < 0.65) {
        // Explosive Skyward Roar & Fist Pump
        const p = (effectiveT - 0.20) / 0.45;
        const roar = Math.sin(p * Math.PI);
        const pump = Math.sin(p * Math.PI * 3) * 12;
        angles = {
          chestX: 0,
          chestY: -roar * 10, // arched up into the air
          chestRot: -roar * 18, // spine arched backward triumphantly
          headRot: -roar * 28, // head screaming at stadium lights
          headY: -roar * 8,
          // Left fist pumps skyward; right arm flares wide
          shoulderL: -80 - roar * 45 + pump,
          elbowL: 30 + roar * 30,
          shoulderR: 45 + roar * 30,
          elbowR: -45 - roar * 30,
          hipL: -roar * 12,
          kneeL: 6,
          hipR: roar * 12,
          kneeR: 6,
          tailRot: roar * 35,
          breatheScale: 1.06,
          emissiveSurge: 0.6 + Math.abs(Math.sin(p * Math.PI * 4)) * 0.4,
        };
      } else {
        // Swagger settle
        const p = (effectiveT - 0.65) / 0.35;
        const settle = 1 - p;
        angles = {
          chestX: 0,
          chestY: -settle * 4,
          chestRot: -settle * 8,
          headRot: -settle * 12,
          headY: -settle * 4,
          shoulderL: -settle * 40 - 14,
          elbowL: settle * 40 + 22,
          shoulderR: settle * 30 + 14,
          elbowR: -settle * 30 - 22,
          hipL: 4,
          kneeL: 6,
          hipR: -4,
          kneeR: 6,
          tailRot: settle * 10,
          breatheScale: 1.0 + sin2 * 0.02,
          emissiveSurge: settle * 0.4,
        };
      }
      break;
    }

    /* ========================================================================
       8. DOWN / SALVAGE (MUTANT BATTLE BALL FATAL WOUND TRIGGERS SALVAGE)
       - Creature collapsed on turf, knee buckled, spine slumped forward
       - Limbs limp, chassis sparking / venting, salvage-ready extraction state
       ======================================================================== */
    case 'down_salvage': {
      const ventPulse = Math.sin(rad * 3);
      const sparkTwitch = Math.random() > 0.8 ? (Math.random() - 0.5) * 6 : 0;
      angles = {
        chestX: -14,
        chestY: 26, // collapsed onto turf
        chestRot: 32 + ventPulse * 1.5, // slumped heavily forward
        headRot: 44 + sparkTwitch, // head hanging limp
        headY: 18,
        headX: -4,
        // Limbs collapsed limp on ground
        shoulderL: 38 + sparkTwitch * 2,
        elbowL: 82,
        shoulderR: -24,
        elbowR: 65,
        // Rear knee buckled onto turf, front leg splayed
        hipL: -36,
        kneeL: 75, // deeply folded knee on ground
        hipR: 42,
        kneeR: 35,
        tailRot: 45,
        breatheScale: 0.94 + ventPulse * 0.015,
        emissiveSurge: 0.15 + (ventPulse > 0.5 ? 0.35 : 0),
      };
      break;
    }

    /* ========================================================================
       9. WILD ALERT (CHIMERA WILDS SKITTISH / REACTIVE IDLE)
       - Low coiled predatory posture, hyper-vigilant perimeter scan
       - Rapid twitchy micro-saccades, shallow rapid breathing
       ======================================================================== */
    case 'wild_alert': {
      const shallowBreathe = Math.sin(rad * 4) * 1.8;
      // Hyper-vigilant scanning saccades (left, center, right, snap)
      let headScan = 0;
      if (effectiveT < 0.25) headScan = -14;
      else if (effectiveT < 0.50) headScan = 16;
      else if (effectiveT < 0.75) headScan = -6;
      else headScan = 8;

      const twitch = (effectiveT > 0.22 && effectiveT < 0.28) || (effectiveT > 0.72 && effectiveT < 0.78) ? 4 : 0;

      angles = {
        chestX: sin * 0.8,
        chestY: shallowBreathe + 6, // coiled low
        chestRot: 14 + sin * 1.2,
        headRot: headScan + twitch,
        headY: shallowBreathe * 0.6,
        // Limbs spring-loaded for instant flight or fight
        shoulderL: -22 + twitch * 2,
        elbowL: 48,
        shoulderR: 18 - twitch * 2,
        elbowR: -48,
        hipL: 14,
        kneeL: 24 - shallowBreathe * 0.6,
        hipR: -14,
        kneeR: 24 - shallowBreathe * 0.6,
        tailRot: Math.sin(rad * 3) * 16 + 10,
        breatheScale: 1.0 + Math.sin(rad * 4) * 0.03,
        emissiveSurge: 0.4 + (twitch > 0 ? 0.4 : 0),
      };
      break;
    }

    /* ========================================================================
       10. FLEE / STARTLED (CHIMERA WILDS STARTLE REACTION & SCRAMBLE)
       - Phase 1 (0.0 - 0.25): Instant vertical startle pop (eyes flare, spine arches)
       - Phase 2 (0.25 - 1.0): Desperate high-cadence scramble sprint away
       ======================================================================== */
    case 'flee_startled': {
      if (effectiveT < 0.25) {
        // Startle jump-scare pop
        const p = effectiveT / 0.25;
        const pop = Math.sin(p * Math.PI);
        angles = {
          chestX: -pop * 12,
          chestY: -pop * 18, // jumped high into air
          chestRot: -pop * 22,
          headRot: pop * 28,
          headY: -pop * 12,
          shoulderL: pop * 60,
          elbowL: pop * 80,
          shoulderR: -pop * 60,
          elbowR: -pop * 80,
          hipL: -pop * 30,
          kneeL: pop * 45,
          hipR: pop * 30,
          kneeR: pop * 45,
          tailRot: pop * 45,
          breatheScale: 0.92,
          emissiveSurge: 1.0,
        };
      } else {
        // Frantic scramble sprint (high-cadence panic gait)
        const scrambleT = ((effectiveT - 0.25) / 0.75) * 2; // 2x sprint cycle
        const sRad = scrambleT * Math.PI * 2;
        const sSin = Math.sin(sRad);
        const scrambleBounce = Math.abs(sSin) * 9 - 4.5;
        angles = {
          chestX: -10 + sSin * 2, // thrown backward/away
          chestY: scrambleBounce + 6,
          chestRot: 28 + sSin * 6, // frantic forward cant
          headRot: -24 - sSin * 4,
          headY: scrambleBounce * 0.4,
          shoulderL: -sSin * 65 - 14,
          elbowL: 88 + Math.abs(sSin) * 26,
          shoulderR: sSin * 65 - 14,
          elbowR: 88 + Math.abs(sSin) * 26,
          hipL: sSin * 52 + 10,
          kneeL: sSin > 0 ? 8 : Math.abs(sSin) * 85 + 16,
          hipR: -sSin * 52 + 10,
          kneeR: sSin < 0 ? 8 : Math.abs(sSin) * 85 + 16,
          tailRot: -sSin * 35,
          breatheScale: 1.05,
          emissiveSurge: 0.7,
        };
      }
      break;
    }
  }

  // Handle Malfunctioning tier electrical jitter/spasms
  let jitterX = 0;
  let jitterY = 0;
  let jitterActive = false;

  if (hasMalfunction) {
    const noise = Math.sin(effectiveT * 73.13) * Math.cos(effectiveT * 117.7);
    if (Math.abs(noise) > 0.65) {
      jitterActive = true;
      jitterX = (Math.random() - 0.5) * 6;
      jitterY = (Math.random() - 0.5) * 6;
      angles.headRot += (Math.random() - 0.5) * 12;
      angles.shoulderL += (Math.random() - 0.5) * 14;
      angles.shoulderR += (Math.random() - 0.5) * 14;
    }
  }

  // Adjust lateral angles for Front or Back facing projections
  if (facing === 'front') {
    // In frontal view, symmetry is emphasized and lateral stance is widened
    angles.shoulderL = Math.max(-45, Math.min(45, angles.shoulderL * 0.5));
    angles.shoulderR = -angles.shoulderL;
    angles.elbowL = Math.min(70, angles.elbowL * 0.6);
    angles.elbowR = angles.elbowL;
    angles.chestRot = angles.chestRot * 0.2; // flatten z-rotation in 2D frontal plane
  } else if (facing === 'back') {
    angles.shoulderL = -Math.max(-45, Math.min(45, angles.shoulderL * 0.5));
    angles.shoulderR = -angles.shoulderL;
    angles.elbowL = Math.min(70, angles.elbowL * 0.6);
    angles.elbowR = angles.elbowL;
    angles.chestRot = -angles.chestRot * 0.2;
  }

  return {
    chest: {
      x: (angles.chestX || 0) + jitterX,
      y: angles.chestY + jitterY,
      rotation: angles.chestRot,
      scaleY: angles.breatheScale,
    },
    head: {
      x: angles.headX || 0,
      y: angles.headY,
      rotation: angles.headRot,
    },
    leftUpperArm: {
      x: 0,
      y: 0,
      rotation: angles.shoulderL,
    },
    leftForearm: {
      x: 0,
      y: 0,
      rotation: angles.elbowL,
    },
    rightUpperArm: {
      x: 0,
      y: 0,
      rotation: angles.shoulderR,
    },
    rightForearm: {
      x: 0,
      y: 0,
      rotation: angles.elbowR,
    },
    leftThigh: {
      x: 0,
      y: 0,
      rotation: angles.hipL,
    },
    leftCalf: {
      x: 0,
      y: 0,
      rotation: angles.kneeL,
    },
    rightThigh: {
      x: 0,
      y: 0,
      rotation: angles.hipR,
    },
    rightCalf: {
      x: 0,
      y: 0,
      rotation: angles.kneeR,
    },
    tail: {
      x: 0,
      y: 0,
      rotation: angles.tailRot || 0,
    },
    glowIntensity: 0.7 + sin2 * 0.3 + (angles.emissiveSurge || 0) * 0.8,
    breatheScale: angles.breatheScale,
    glitchJitter: { x: jitterX, y: jitterY, active: jitterActive },
  };
}
