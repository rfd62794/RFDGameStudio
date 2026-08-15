import { BodyArchetype, BodySockets } from './chimeraTypes';

/**
 * SOCKET CONTRACT STANDARD
 * 
 * All torso shapes regardless of Brand MUST locate their primary attachment sockets
 * at these exact coordinate points.
 * 
 * All limb and head assets MUST place their rotation pivot / attachment root
 * at (0, 0) in their local coordinate frame, which is transformed directly
 * onto these chest socket coordinates.
 * 
 * Standard canvas coordinate system: viewBox 0 0 400 480
 */

export const SOCKET_DEFINITIONS: Record<BodyArchetype, BodySockets> = {
  humanoid: {
    core: { x: 200, y: 210, name: 'Core Torso Center' },
    neck: { x: 200, y: 135, rotation: 0, name: 'Cervical Socket' },
    shoulderLeft: { x: 146, y: 162, rotation: 0, name: 'Port Shoulder Socket' },
    shoulderRight: { x: 254, y: 162, rotation: 0, name: 'Starboard Shoulder Socket' },
    hipLeft: { x: 172, y: 268, rotation: 0, name: 'Port Pelvic Socket' },
    hipRight: { x: 228, y: 268, rotation: 0, name: 'Starboard Pelvic Socket' },
  },
  quadruped: {
    core: { x: 200, y: 220, name: 'Quadruped Chassis Core' },
    neck: { x: 130, y: 185, rotation: -25, name: 'Anterior Neck Socket' },
    shoulderLeft: { x: 148, y: 225, rotation: 10, name: 'Fore-Left Leg Socket' },
    shoulderRight: { x: 182, y: 220, rotation: 5, name: 'Fore-Right Leg Socket' },
    hipLeft: { x: 255, y: 232, rotation: -10, name: 'Hind-Left Leg Socket' },
    hipRight: { x: 288, y: 228, rotation: -15, name: 'Hind-Right Leg Socket' },
    tail: { x: 300, y: 215, rotation: -30, name: 'Caudal Tail Socket' },
  },
  beast_brute: {
    core: { x: 200, y: 215, name: 'Brute Bulk Core' },
    neck: { x: 200, y: 148, rotation: 0, name: 'Sunken Cervical Socket' },
    shoulderLeft: { x: 130, y: 175, rotation: 0, name: 'Heavy Port Shoulder Socket' },
    shoulderRight: { x: 270, y: 175, rotation: 0, name: 'Heavy Starboard Shoulder Socket' },
    hipLeft: { x: 165, y: 280, rotation: 0, name: 'Brute Pelvic Left' },
    hipRight: { x: 235, y: 280, rotation: 0, name: 'Brute Pelvic Right' },
  },
  avian_raptor: {
    core: { x: 200, y: 205, name: 'Raptor Keel Core' },
    neck: { x: 175, y: 130, rotation: -15, name: 'Avian Flex Neck Socket' },
    shoulderLeft: { x: 150, y: 165, rotation: 0, name: 'Wing/Blade Mount Port' },
    shoulderRight: { x: 250, y: 165, rotation: 0, name: 'Wing/Blade Mount Starboard' },
    hipLeft: { x: 180, y: 260, rotation: 15, name: 'Digitigrade Hip Port' },
    hipRight: { x: 220, y: 260, rotation: 15, name: 'Digitigrade Hip Starboard' },
    tail: { x: 270, y: 250, rotation: 20, name: 'Rudder Tail Socket' },
  },
};

/**
 * Standard Joint Dimensions (in local coordinates)
 * Used to ensure perfect continuity between limb segments:
 * Upper Arm length: 54px
 * Forearm length: 50px
 * Thigh length: 65px
 * Calf length: 60px
 */
export const LIMB_STANDARDS = {
  upperArmLength: 54,
  forearmLength: 50,
  handLength: 26,
  thighLength: 68,
  calfLength: 64,
  footLength: 28,
  socketRadius: 14,
  elbowRadius: 10,
  kneeRadius: 11,
  ankleRadius: 8,
};

/**
 * Verifies that a socket set complies with the mathematical contract
 */
export function verifySocketContract(sockets: BodySockets): {
  isValid: boolean;
  diagnostics: string[];
} {
  const diagnostics: string[] = [];
  
  if (!sockets.neck || typeof sockets.neck.x !== 'number') diagnostics.push('Neck socket missing or invalid');
  if (!sockets.shoulderLeft || typeof sockets.shoulderLeft.x !== 'number') diagnostics.push('Left shoulder socket missing');
  if (!sockets.shoulderRight || typeof sockets.shoulderRight.x !== 'number') diagnostics.push('Right shoulder socket missing');
  if (!sockets.hipLeft || typeof sockets.hipLeft.x !== 'number') diagnostics.push('Left hip socket missing');
  if (!sockets.hipRight || typeof sockets.hipRight.x !== 'number') diagnostics.push('Right hip socket missing');

  return {
    isValid: diagnostics.length === 0,
    diagnostics,
  };
}
