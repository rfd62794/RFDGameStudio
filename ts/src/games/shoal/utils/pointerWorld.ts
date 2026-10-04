// new: ts/src/games/shoal/utils/pointerWorld.ts

export function clientToCanvas(
  client: { x: number; y: number },
  rect: { left: number; top: number }
): { x: number; y: number } {
  return { x: client.x - rect.left, y: client.y - rect.top };
}

export function clientToWorld(
  client: { x: number; y: number },
  rect: { left: number; top: number },
  dims: { w: number; h: number },
  world: { width: number; height: number }
): { x: number; y: number } {
  return {
    x: (client.x - rect.left) * (world.width / dims.w),
    y: (client.y - rect.top) * (world.height / dims.h),
  };
}
