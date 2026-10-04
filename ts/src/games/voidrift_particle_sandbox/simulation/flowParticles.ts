import { FlowParticle, MaterialType, PipeNode } from '../types';

export const EMISSIVE_MATERIALS = new Set<MaterialType>([
  MaterialType.PLASMA,
  MaterialType.VOID_CRYSTAL,
  MaterialType.REACTIVE_VAPOR,
  MaterialType.LUMINITE,
]);

export function spawnFlowParticle(pipe: PipeNode): FlowParticle {
  const topMaterial = pipe.buffer.length > 0 ? pipe.buffer[0].material : MaterialType.DUST;

  // Random lateral offset 0.25 to 0.75 across the pipe cross-section
  const lateral = 0.25 + Math.random() * 0.5;
  let localX = 0.5;
  let localY = 0.5;

  switch (pipe.direction) {
    case 'RIGHT':
      localX = 0.0;
      localY = lateral;
      break;
    case 'LEFT':
      localX = 1.0;
      localY = lateral;
      break;
    case 'DOWN':
      localX = lateral;
      localY = 0.0;
      break;
    case 'UP':
      localX = lateral;
      localY = 1.0;
      break;
  }

  return {
    localX,
    localY,
    progress: 0.0,
    speed: 1.0,
    material: topMaterial,
    opacity: 0.85 + Math.random() * 0.15,
    size: 1.2 + Math.random() * 0.6,
  };
}

export function updatePipeFlowParticles(pipe: PipeNode, dt: number) {
  if (!pipe.flowParticles) {
    pipe.flowParticles = [];
  }

  const bufferAmount = pipe.buffer.reduce((s, i) => s + i.amount, 0);
  const bufferFillRatio = Math.min(1.0, bufferAmount / (pipe.maxBuffer || 50));
  const speed = pipe.hasWarning ? 0.1 : Math.max(0.3, 1.0 - bufferFillRatio * 0.6);
  const targetCount = Math.round(bufferFillRatio * 6); // MAX 6 particles per pipe

  // Advance existing particles
  pipe.flowParticles = pipe.flowParticles
    .map((p) => ({ ...p, progress: p.progress + dt * speed * 1.5, speed }))
    .filter((p) => p.progress < 1.0);

  // Spawn new particles to reach target count
  while (pipe.flowParticles.length < targetCount && pipe.buffer.length > 0) {
    pipe.flowParticles.push(spawnFlowParticle(pipe));
  }

  // Update localX/localY from progress based on flow direction
  for (const p of pipe.flowParticles) {
    switch (pipe.direction) {
      case 'RIGHT':
        p.localX = p.progress;
        break;
      case 'LEFT':
        p.localX = 1.0 - p.progress;
        break;
      case 'DOWN':
        p.localY = p.progress;
        break;
      case 'UP':
        p.localY = 1.0 - p.progress;
        break;
    }
  }
}
