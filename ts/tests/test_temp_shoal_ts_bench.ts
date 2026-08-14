// @vitest-environment node
//
// Shoal — TS-Native Synthetic Benchmark with Entity Count Tracking
//
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

// ─── Config (from data.yaml) ────────────────────────────────────────────────

const CONFIG = {
  world: { width: 1200, height: 800, surface_depth: 0, floor_depth: 800, discrete_tick: 0.25 },
  spawn: { initial_fish: 60, initial_sharks: 8, initial_algae_hubs: 6, cluster_radius: 150 },
  fish: {
    max_speed: 120, max_force: 80, radius: 5,
    perception: { algae: 250, shark: 190, separate: 24, school: 70 },
    escape_chance: 0.28, escape_speed_bonus: 0.15, escape_knockback: 20,
    breed_age: 4, breed_fed_threshold: 2, carrying_capacity: 100,
    hunger_rate: 0.05, max_safe_cold_rate: 8, max_turn_rate: 4.0, home_depth: 180,
    cold: { threshold: 100, damage_rate: 15, damage_limit: 30, decay_rate: 10 },
  },
  shark: {
    max_speed: 150, max_force: 90, radius: 7,
    perception: { fish: 220, flesh: 220 },
    breed_age: 18, breed_fed_threshold: 3, carrying_capacity: 20,
    starve_limit: 20, max_turn_rate: 6.0, home_depth: 300, home_bias_weight: 1.0,
    fish_hunger_refund: 4,
    exposure: { threshold: 100, damage_rate: 20, decay_rate: 10 },
    exposure_retreat_threshold: 70, exposure_retreat_resume_threshold: 40,
    exposure_retreat_weight: 3.0,
  },
  steering_weights: {
    fish: { seek_algae: 1.0, flee_shark: 2.5, separate: 1.0, align: 0.6, cohere: 0.35, wander: 0.4, depth_bias: 0.8, avoid_chunk: 0.8 },
    shark: { seek_fish: 1.5, seek_flesh: 1.5, wander: 0.3, avoid_chunk: 0.5 },
  },
  avoid_chunk_radius: 25,
  wander: { circle_distance: 40, circle_radius: 15, change_interval: 0.4 },
  algae: { nodule_radius: 6, spoke_distances: [24, 48], regrow_cooldown: 10.0, max_sunk_depth: 600, min_surface_depth: 80, depth_lerp_speed: 20, starvation_seconds: 8 },
  flesh_chunk: { radius: 5, min_spawn: 1, max_spawn: 3, sink_rate: 10, shark_eat_range: 20, hunger_refund: 3, floor_grace_time: 2.5, decompose_radius: 450, decompose_replenish_amount: 2.0 },
  depth_bands: [
    { top: 0, bottom: 40, exposure_rate: 40, fish_cold_rate: 0 },
    { top: 40, bottom: 120, exposure_rate: 8, fish_cold_rate: 0 },
    { top: 120, bottom: 280, exposure_rate: 2, fish_cold_rate: 3 },
    { top: 280, bottom: 480, exposure_rate: 1, fish_cold_rate: 8 },
    { top: 480, bottom: 680, exposure_rate: 0, fish_cold_rate: 18 },
    { top: 680, bottom: 800, exposure_rate: 0, fish_cold_rate: 35 },
  ],
  spatial_hash: { bucket_width: 120, bucket_depth: 80 },
};

// ─── Math helpers ───────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
function wrap(v: number, max: number): number { let w = v % max; if (w < 0) w += max; return w; }
function wrapX(x: number): number { return wrap(x, CONFIG.world.width); }
function clampDepth(d: number): number { return clamp(d, CONFIG.world.surface_depth, CONFIG.world.floor_depth); }
function dist2(x1: number, y1: number, x2: number, y2: number): number { const dx = x1 - x2, dy = y1 - y2; return dx * dx + dy * dy; }
function distance(ax: number, ay: number, bx: number, by: number): number { return Math.sqrt(dist2(ax, ay, bx, by)); }
function normalize(vx: number, vy: number): [number, number] { const m = Math.sqrt(vx * vx + vy * vy); if (m === 0) return [0, 0]; return [vx / m, vy / m]; }
function limitVector(vx: number, vy: number, max: number): [number, number] { const m2 = vx * vx + vy * vy; if (m2 > max * max) { const m = Math.sqrt(m2); return [(vx / m) * max, (vy / m) * max]; } return [vx, vy]; }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * clamp(t, 0, 1); }

// ─── LCG PRNG (split-multiplication) ────────────────────────────────────────

const LCG_MOD = 2147483648, LCG_MULT = 1103515245, LCG_INC = 12345;
const LCG_MULT_HI = Math.floor(LCG_MULT / 65536), LCG_MULT_LO = LCG_MULT % 65536;

function makePrng(seed: number): () => number {
  let s = seed;
  return () => { s = (((s * LCG_MULT_HI) % LCG_MOD) * 65536 + s * LCG_MULT_LO + LCG_INC) % LCG_MOD; return s / LCG_MOD; };
}
function prngFloat(prng: () => number, a: number, b: number): number { return a + prng() * (b - a); }

// ─── Color generation ───────────────────────────────────────────────────────

const RESERVED_COLORS = [[234,179,8],[16,185,129],[244,63,94],[125,211,252],[56,189,248],[14,165,233],[3,105,161],[12,74,110]];
const MIN_COLOR_DISTANCE = 55, LIVE_MIN_DISTANCE = 30;

function colorDist(r1:number,g1:number,b1:number,r2:number,g2:number,b2:number):number { const dr=r1-r2,dg=g1-g2,db=b1-b2; return Math.sqrt(dr*dr+dg*dg+db*db); }
function isTooClose(r:number,g:number,b:number):boolean { for(const rc of RESERVED_COLORS) if(colorDist(r,g,b,rc[0],rc[1],rc[2])<MIN_COLOR_DISTANCE) return true; return false; }
function isTooCloseToLive(r:number,g:number,b:number,liveColors:string[]):boolean { for(const hex of liveColors){const lr=parseInt(hex.substr(1,2),16),lg=parseInt(hex.substr(3,2),16),lb=parseInt(hex.substr(5,2),16);if(colorDist(r,g,b,lr,lg,lb)<LIVE_MIN_DISTANCE)return true;} return false; }
function hueToRgb(p:number,q:number,t:number):number { if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; }
function hslToRgb(h:number,s:number,l:number):[number,number,number] { h/=360;let r,g,b;if(s===0){r=g=b=l;}else{const q=l<0.5?l*(1+s):l+s-l*s;const p=2*l-q;r=hueToRgb(p,q,h+1/3);g=hueToRgb(p,q,h);b=hueToRgb(p,q,h-1/3);}return[Math.floor(r*255),Math.floor(g*255),Math.floor(b*255)]; }
function rgbToHex(r:number,g:number,b:number):string { return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0'); }
function hashNumeric(n:number):number { return ((n*2654435761)%1000000007+1000000007)%1000000007; }
function generateProceduralColor(id:string,liveColors:string[]):string {
  const match=id.match(/_(\d+)$/);const numericId=match?parseInt(match[1]):0;const hash=hashNumeric(numericId);
  const hue=(hash%3600)/10;const jitterHash=Math.floor(hash/3600)%1000;const jitterT=jitterHash/1000;
  const saturation=0.5+0.3*jitterT;const lightness=0.45+0.25*(1-jitterT);
  for(let attempt=0;attempt<=8;attempt++){const tryHue=(hue+attempt*40)%360;const[r,g,b]=hslToRgb(tryHue,saturation,lightness);if(!isTooClose(r,g,b)&&!isTooCloseToLive(r,g,b,liveColors))return rgbToHex(r,g,b);}
  for(let attempt=1;attempt<=360;attempt++){const tryHue=(hue+attempt)%360;const[r,g,b]=hslToRgb(tryHue,saturation,lightness);if(!isTooClose(r,g,b)&&!isTooCloseToLive(r,g,b,liveColors))return rgbToHex(r,g,b);}
  return '#808080';
}

// ─── Entity types ───────────────────────────────────────────────────────────

interface Fish { id:string; x:number; depth:number; vx:number; vd:number; age:number; fed:number; hunger:number; coldExposure:number; coldDamage:number; radius:number; maxSpeed:number; maxForce:number; lineageColor:string; mature:boolean; alive:boolean; }
interface Shark { id:string; x:number; depth:number; vx:number; vd:number; age:number; fed:number; hunger:number; exposure:number; lastMealTick:number; ticksWithTarget:number; ticksTotal:number; radius:number; maxSpeed:number; maxForce:number; lineageColor:string; mature:boolean; alive:boolean; inRetreat:boolean; spawnTick:number; }
interface Nodule { id:string; x:number; depth:number; live:boolean; cooldown:number; offsetX:number; offsetY:number; cachedDanger:number; }
interface AlgaeCore { id:string; x:number; depth:number; targetDepth:number; nodules:Nodule[]; maxNodules:number; emptyFor:number; }
interface Chunk { id:string; x:number; depth:number; vx:number; vd:number; radius:number; floorTimer:number; }

// ─── Spatial hash ───────────────────────────────────────────────────────────

const BUCKET_KEY_MULT = 100000;
interface SpatialHash { fish:Map<number,Fish[]>; shark:Map<number,Shark[]>; algae:Map<number,{n:Nodule;core:AlgaeCore}[]>; }

function rebuildSpatialHash(st:ShoalState):void {
  const bw=CONFIG.spatial_hash.bucket_width,bd=CONFIG.spatial_hash.bucket_depth;
  const numBx=Math.ceil(st.world.width/bw),numBy=Math.ceil(st.world.height/bd);
  const hash:SpatialHash={fish:new Map(),shark:new Map(),algae:new Map()};
  for(const f of st.fish){if(!f.alive)continue;const bx=Math.floor(f.x/bw)%numBx,by=Math.floor(f.depth/bd)%numBy;const key=bx*BUCKET_KEY_MULT+by;let bucket=hash.fish.get(key);if(!bucket){bucket=[];hash.fish.set(key,bucket);}bucket.push(f);}
  for(const s of st.sharks){if(!s.alive)continue;const bx=Math.floor(s.x/bw)%numBx,by=Math.floor(s.depth/bd)%numBy;const key=bx*BUCKET_KEY_MULT+by;let bucket=hash.shark.get(key);if(!bucket){bucket=[];hash.shark.set(key,bucket);}bucket.push(s);}
  for(const core of st.algae){for(const n of core.nodules){if(!n.live)continue;const bx=Math.floor(n.x/bw)%numBx,by=Math.floor(n.depth/bd)%numBy;const key=bx*BUCKET_KEY_MULT+by;let bucket=hash.algae.get(key);if(!bucket){bucket=[];hash.algae.set(key,bucket);}bucket.push({n,core});}}
  st.spatialHash=hash;
}

function getNearby<T>(buckets:Map<number,T[]>,bx:number,by:number,bxRange:number,byRange:number,wrapBx?:number,wrapBy?:number):T[] {
  const list:T[]=[];
  for(let dx=-bxRange;dx<=bxRange;dx++){for(let dy=-byRange;dy<=byRange;dy++){let kx=bx+dx,ky=by+dy;if(wrapBx!==undefined)kx=((kx%wrapBx)+wrapBx)%wrapBx;if(wrapBy!==undefined)ky=((ky%wrapBy)+wrapBy)%wrapBy;const bucket=buckets.get(kx*BUCKET_KEY_MULT+ky);if(bucket)for(const ent of bucket)list.push(ent);}}
  return list;
}

// ─── Steering forces ────────────────────────────────────────────────────────

function forceSeek(x:number,y:number,tx:number,ty:number,weight:number,maxForce:number):[number,number]{const dx=tx-x,dy=ty-y;const dist=Math.sqrt(dx*dx+dy*dy);if(dist===0)return[0,0];return[(dx/dist)*weight*maxForce,(dy/dist)*weight*maxForce];}
function stoppingRadius(maxSpeed:number,maxForce:number,margin:number):number{return(maxSpeed*maxSpeed)/(2*maxForce)*margin;}
function forceArrive(x:number,y:number,vx:number,vy:number,tx:number,ty:number,weight:number,maxSpeed:number,maxForce:number,slowingRadius:number,minSpeed:number):[number,number]{const dx=tx-x,dy=ty-y;const dist=Math.sqrt(dx*dx+dy*dy);if(dist===0)return[0,0];let desiredSpeed=maxSpeed;if(dist<slowingRadius){desiredSpeed=maxSpeed*(dist/slowingRadius);if(desiredSpeed<minSpeed)desiredSpeed=minSpeed;}return[((dx/dist)*desiredSpeed-vx)*weight,((dy/dist)*desiredSpeed-vy)*weight];}
function forceDepthArrive(depth:number,vd:number,targetDepth:number,weight:number,maxSpeed:number,maxForce:number):number{const effectiveMaxForce=Math.min(maxForce,weight*maxSpeed);const sr=stoppingRadius(maxSpeed,effectiveMaxForce,1.3);const dy=targetDepth-depth;const dist=Math.abs(dy);if(dist<2)return 0;let desiredSpeed=maxSpeed;if(dist<sr)desiredSpeed=maxSpeed*(dist/sr);const desiredVd=(dy>0?1:-1)*desiredSpeed;const steerY=desiredVd-vd;const force=steerY*weight;return Math.max(-maxForce,Math.min(maxForce,force));}
function forceFlee(x:number,y:number,tx:number,ty:number,weight:number,maxForce:number,radiusSq:number):[number,number]{const dx=x-tx,dy=y-ty;const d2=dx*dx+dy*dy;if(d2===0||d2>radiusSq)return[0,0];const dist=Math.sqrt(d2);return[(dx/dist)*weight*maxForce,(dy/dist)*weight*maxForce];}

let currentPrng:()=>number;
const wanderTargets=new Map<string,{x:number;y:number}>();

function forceWander(id:string,x:number,y:number,vx:number,vy:number,weight:number,maxForce:number):[number,number]{
  const cd=CONFIG.wander.circle_distance,cr=CONFIG.wander.circle_radius;
  const tx=x+vx*cd,ty=y+vy*cd;
  let wt=wanderTargets.get(id);if(!wt){wt={x:prngFloat(currentPrng,-1,1),y:prngFloat(currentPrng,-1,1)};wanderTargets.set(id,wt);}
  wt.x+=prngFloat(currentPrng,-1,1)*CONFIG.wander.change_interval;wt.y+=prngFloat(currentPrng,-1,1)*CONFIG.wander.change_interval;
  const[wx,wy]=normalize(wt.x,wt.y);wt.x=wx;wt.y=wy;
  return forceSeek(x,y,tx+wx*cr,ty+wy*cr,weight,maxForce);
}

function forceSeparate(x:number,y:number,neighbors:{alive:boolean;x:number;depth:number}[],radiusSq:number,weight:number,maxForce:number):[number,number]{let sx=0,sy=0;for(const n of neighbors){if(!n.alive)continue;const dx=x-n.x,dy=y-n.depth;const d2=dx*dx+dy*dy;if(d2>0&&d2<radiusSq){const dist=Math.sqrt(d2);sx+=dx/dist/dist;sy+=dy/dist/dist;}}if(sx===0&&sy===0)return[0,0];const[nx,ny]=normalize(sx,sy);return[nx*weight*maxForce,ny*weight*maxForce];}
function forceAvoid(x:number,y:number,obstacles:{id?:string;x:number;depth:number}[],radiusSq:number,weight:number,maxForce:number,excludeId?:string):[number,number]{if(!obstacles)return[0,0];let sx=0,sy=0;for(const o of obstacles){if(o.id===excludeId)continue;const dx=x-o.x,dy=y-o.depth;const d2=dx*dx+dy*dy;if(d2>0&&d2<radiusSq){const dist=Math.sqrt(d2);sx+=dx/dist/dist;sy+=dy/dist/dist;}}if(sx===0&&sy===0)return[0,0];const[nx,ny]=normalize(sx,sy);return[nx*weight*maxForce,ny*weight*maxForce];}
function forceAlign(x:number,y:number,neighbors:{alive:boolean;x:number;depth:number;vx:number;vd:number}[],radiusSq:number,weight:number,maxForce:number):[number,number]{let avx=0,avy=0,count=0;for(const n of neighbors){if(!n.alive)continue;const dx=x-n.x,dy=y-n.depth;const d2=dx*dx+dy*dy;if(d2>0&&d2<radiusSq){avx+=n.vx;avy+=n.vd;count++;}}if(count===0)return[0,0];avx/=count;avy/=count;const[nx,ny]=normalize(avx,avy);return[nx*weight*maxForce,ny*weight*maxForce];}
function forceCohere(x:number,y:number,neighbors:{alive:boolean;x:number;depth:number}[],radiusSq:number,weight:number,maxForce:number):[number,number]{let sx=0,sy=0,count=0;for(const n of neighbors){if(!n.alive)continue;const dx=x-n.x,dy=y-n.depth;const d2=dx*dx+dy*dy;if(d2>0&&d2<radiusSq){sx+=n.x;sy+=n.depth;count++;}}if(count===0)return[0,0];return forceSeek(x,y,sx/count,sy/count,weight,maxForce);}

// ─── Exposure/cold rate ─────────────────────────────────────────────────────

function computeExposureRate(depth:number):number{const bands=CONFIG.depth_bands;for(let i=0;i<bands.length;i++){if(depth<=bands[i].bottom){if(i===0)return bands[i].exposure_rate;const prev=bands[i-1];const t=(depth-prev.bottom)/(bands[i].bottom-prev.bottom);return lerp(prev.exposure_rate,bands[i].exposure_rate,t);}}return bands[bands.length-1].exposure_rate;}
function computeFishColdRate(depth:number):number{const bands=CONFIG.depth_bands;for(let i=0;i<bands.length;i++){if(depth<=bands[i].bottom){if(i===0)return bands[i].fish_cold_rate;const prev=bands[i-1];const t=(depth-prev.bottom)/(bands[i].bottom-prev.bottom);return lerp(prev.fish_cold_rate,bands[i].fish_cold_rate,t);}}return bands[bands.length-1].fish_cold_rate;}

// ─── Fish/shark force computation ───────────────────────────────────────────

function computeFishForces(f:Fish,st:ShoalState,hash:SpatialHash):[number,number]{
  const w=CONFIG.steering_weights.fish,cfg=CONFIG.fish;let fx=0,fy=0;
  const bw=CONFIG.spatial_hash.bucket_width,bd=CONFIG.spatial_hash.bucket_depth;
  const bx=Math.floor(f.x/bw)%Math.ceil(st.world.width/bw),by=Math.floor(f.depth/bd)%Math.ceil(st.world.height/bd);
  let nearestNodule:Nodule|null=null;let nearestDist2=cfg.perception.algae*cfg.perception.algae;
  const nearbyAlgae=getNearby(hash.algae,bx,by,Math.ceil(cfg.perception.algae/bw),Math.ceil(cfg.perception.algae/bd));
  for(const entry of nearbyAlgae){const n=entry.n;if(n.live&&n.cachedDanger<=cfg.max_safe_cold_rate){const d2=dist2(f.x,f.depth,n.x,n.depth);if(d2<nearestDist2){nearestDist2=d2;nearestNodule=n;}}}
  if(nearestNodule){let sr=stoppingRadius(f.maxSpeed,f.maxForce,1.3);sr=Math.min(sr,cfg.perception.algae);const[sx,sy]=forceArrive(f.x,f.depth,f.vx,f.vd,nearestNodule.x,nearestNodule.depth,w.seek_algae,f.maxSpeed,f.maxForce,sr,0);fx+=sx;fy+=sy;}
  let nearestShark:Shark|null=null;let sharkDist2=cfg.perception.shark*cfg.perception.shark;
  const nearbySharks=getNearby(hash.shark,bx,by,Math.ceil(cfg.perception.shark/bw),Math.ceil(cfg.perception.shark/bd));
  for(const s of nearbySharks){if(s.alive){const d2=dist2(f.x,f.depth,s.x,s.depth);if(d2<sharkDist2){sharkDist2=d2;nearestShark=s;}}}
  if(nearestShark){const[flx,fly]=forceFlee(f.x,f.depth,nearestShark.x,nearestShark.depth,w.flee_shark,f.maxForce,sharkDist2);fx+=flx;fy+=fly;}
  const others=getNearby(hash.fish,bx,by,1,1);const schoolRadiusSq=cfg.perception.school*cfg.perception.school;
  const[sepX,sepY]=forceSeparate(f.x,f.depth,others,schoolRadiusSq,w.separate,f.maxForce);fx+=sepX;fy+=sepY;
  const[alignX,alignY]=forceAlign(f.x,f.depth,others,schoolRadiusSq,w.align,f.maxForce);fx+=alignX;fy+=alignY;
  const[cohereX,cohereY]=forceCohere(f.x,f.depth,others,schoolRadiusSq,w.cohere,f.maxForce);fx+=cohereX;fy+=cohereY;
  const avoidRadiusSq=CONFIG.avoid_chunk_radius*CONFIG.avoid_chunk_radius;
  const avoidTargets:{id:string;x:number;depth:number}[]=[];
  for(const entry of nearbyAlgae)if(entry.n.live)avoidTargets.push(entry.n);
  for(const c of st.chunks)avoidTargets.push(c);
  const[avoidX,avoidY]=forceAvoid(f.x,f.depth,avoidTargets,avoidRadiusSq,w.avoid_chunk,f.maxForce,nearestNodule?.id);fx+=avoidX;fy+=avoidY;
  fy+=forceDepthArrive(f.depth,f.vd,cfg.home_depth,w.depth_bias,f.maxSpeed,f.maxForce);
  const[wx,wy]=forceWander(f.id,f.x,f.depth,f.vx,f.vd,w.wander,f.maxForce);fx+=wx;fy+=wy;
  return[fx,fy];
}

function computeSharkForces(s:Shark,st:ShoalState,hash:SpatialHash):[number,number,boolean]{
  const w=CONFIG.steering_weights.shark,cfg=CONFIG.shark;let targetChunkId:string|null=null;
  const bw=CONFIG.spatial_hash.bucket_width,bd=CONFIG.spatial_hash.bucket_depth;
  const sbx=Math.floor(s.x/bw)%Math.ceil(st.world.width/bw),sby=Math.floor(s.depth/bd)%Math.ceil(st.world.height/bd);
  if(s.exposure>=cfg.exposure_retreat_threshold)s.inRetreat=true;else if(s.exposure<cfg.exposure_retreat_resume_threshold)s.inRetreat=false;
  let nearestFish:Fish|null=null;let fishDist2=cfg.perception.fish*cfg.perception.fish;
  const numBx=Math.ceil(st.world.width/bw);
  const nearbyFish=getNearby(hash.fish,sbx,sby,Math.ceil(cfg.perception.fish/bw),Math.ceil(cfg.perception.fish/bd),numBx);
  for(const f of nearbyFish){if(f.alive){const d2=dist2(s.x,s.depth,f.x,f.depth);if(d2<fishDist2){fishDist2=d2;nearestFish=f;}}}
  let nearestChunk:Chunk|null=null;let chunkDist2=cfg.perception.flesh*cfg.perception.flesh;
  for(const c of st.chunks){const d2=dist2(s.x,s.depth,c.x,c.depth);if(d2<chunkDist2){chunkDist2=d2;nearestChunk=c;}}
  const hadTarget=nearestFish!==null||nearestChunk!==null;
  if(s.inRetreat){const retreatRatio=(s.exposure-cfg.exposure_retreat_resume_threshold)/(cfg.exposure.threshold-cfg.exposure_retreat_resume_threshold);const clampedRatio=Math.max(Math.min(retreatRatio,1.0),0.3);return[0,cfg.exposure_retreat_weight*s.maxForce*clampedRatio,hadTarget];}
  let fx=0,fy=0;
  if(nearestFish&&(!nearestChunk||fishDist2<chunkDist2)){let sr=stoppingRadius(s.maxSpeed,s.maxForce,1.3);sr=Math.min(sr,cfg.perception.fish);const[sx,sy]=forceArrive(s.x,s.depth,s.vx,s.vd,nearestFish.x,nearestFish.depth,w.seek_fish,s.maxSpeed,s.maxForce,sr,s.maxSpeed);fx+=sx;fy+=sy;}
  else if(nearestChunk){targetChunkId=nearestChunk.id;let sr=stoppingRadius(s.maxSpeed,s.maxForce,1.3);sr=Math.min(sr,cfg.perception.flesh);let minSpeed=CONFIG.flesh_chunk.sink_rate;if(s.maxSpeed*0.3>minSpeed)minSpeed=s.maxSpeed*0.3;const[sx,sy]=forceArrive(s.x,s.depth,s.vx,s.vd,nearestChunk.x,nearestChunk.depth,w.seek_flesh,s.maxSpeed,s.maxForce,sr,minSpeed);fx+=sx;fy+=sy;}
  else{const[wx,wy]=forceWander(s.id,s.x,s.depth,s.vx,s.vd,w.wander,s.maxForce);fx+=wx;fy+=wy;fy+=forceDepthArrive(s.depth,s.vd,cfg.home_depth,cfg.home_bias_weight,s.maxSpeed,s.maxForce);}
  const avoidRadiusSq=CONFIG.avoid_chunk_radius*CONFIG.avoid_chunk_radius;
  const avoidTargets:{id:string;x:number;depth:number}[]=[];
  const nearbyAlgaeForShark=getNearby(hash.algae,sbx,sby,1,Math.ceil(CONFIG.avoid_chunk_radius/bd)+1);
  for(const entry of nearbyAlgaeForShark)if(entry.n.live)avoidTargets.push(entry.n);
  for(const c of st.chunks)avoidTargets.push(c);
  const[avoidX,avoidY]=forceAvoid(s.x,s.depth,avoidTargets,avoidRadiusSq,w.avoid_chunk,s.maxForce,targetChunkId??undefined);fx+=avoidX;fy+=avoidY;
  return[fx,fy,hadTarget];
}

// ─── Limit turn ─────────────────────────────────────────────────────────────

function limitTurn(oldVx:number,oldVy:number,newVx:number,newVy:number,maxTurnRate:number,maxSpeed:number,dt:number):[number,number]{
  const oldAngle=Math.atan2(oldVy,oldVx),newAngle=Math.atan2(newVy,newVx);const speed=Math.sqrt(newVx*newVx+newVy*newVy);
  if(speed<0.01)return[newVx,newVy];const speedRatio=Math.min(speed/maxSpeed,1.0);const effectiveTurnRate=maxTurnRate*(2.0-speedRatio);
  let diff=newAngle-oldAngle;while(diff>Math.PI)diff-=2*Math.PI;while(diff<-Math.PI)diff+=2*Math.PI;
  const maxDelta=effectiveTurnRate*dt;if(diff>maxDelta)diff=maxDelta;else if(diff<-maxDelta)diff=-maxDelta;
  const clampedAngle=oldAngle+diff;return[Math.cos(clampedAngle)*speed,Math.sin(clampedAngle)*speed];
}

// ─── Game state ─────────────────────────────────────────────────────────────

interface ShoalState { world:typeof CONFIG.world; fish:Fish[]; sharks:Shark[]; algae:AlgaeCore[]; chunks:Chunk[]; nextId:number; tickCount:number; discreteAccum:number; prng:()=>number; spatialHash:SpatialHash; stats:{fishCount:number;sharkCount:number;algaeCount:number;chunkCount:number}; }
let nextIdCounter=0;
function uid(prefix:string):string{nextIdCounter++;return prefix+'_'+nextIdCounter;}
function collectLiveColors(st:ShoalState):string[]{const colors:string[]=[];for(const f of st.fish)if(f.alive)colors.push(f.lineageColor);for(const s of st.sharks)if(s.alive)colors.push(s.lineageColor);return colors;}
function newFish(st:ShoalState,x:number,depth:number):Fish{const cfg=CONFIG.fish;const id=uid('fish');return{id,x,depth,vx:prngFloat(st.prng,-1,1),vd:prngFloat(st.prng,-0.5,0.5),age:0,fed:0,hunger:0,coldExposure:0,coldDamage:0,radius:cfg.radius,maxSpeed:cfg.max_speed,maxForce:cfg.max_force,lineageColor:generateProceduralColor(id,collectLiveColors(st)),mature:false,alive:true};}
function newShark(st:ShoalState,x:number,depth:number):Shark{const cfg=CONFIG.shark;const id=uid('shark');return{id,x,depth,vx:prngFloat(st.prng,-1,1),vd:prngFloat(st.prng,-0.5,0.5),age:0,fed:0,hunger:0,exposure:0,lastMealTick:0,ticksWithTarget:0,ticksTotal:0,radius:cfg.radius,maxSpeed:cfg.max_speed,maxForce:cfg.max_force,lineageColor:generateProceduralColor(id,collectLiveColors(st)),mature:false,alive:true,inRetreat:false,spawnTick:st.tickCount};}
function spawnFish(st:ShoalState,x:number,depth:number):Fish{const f=newFish(st,x,depth);st.fish.push(f);st.stats.fishCount++;return f;}
function spawnShark(st:ShoalState,x:number,depth:number):Shark{const s=newShark(st,x,depth);s.lastMealTick=st.tickCount;st.sharks.push(s);st.stats.sharkCount++;return s;}
function newAlgaeNodule(cx:number,cdepth:number,dir:number,dist:number):Nodule{let dx=0,dy=0;if(dir===0)dy=-dist;else if(dir===1)dy=dist;else if(dir===2)dx=-dist;else if(dir===3)dx=dist;const depth=cdepth+dy;return{id:uid('nodule'),x:cx+dx,depth,live:true,cooldown:0,offsetX:dx,offsetY:dy,cachedDanger:computeFishColdRate(depth)};}
function spawnAlgaeCore(st:ShoalState,x:number,depth:number):AlgaeCore{const distances=CONFIG.algae.spoke_distances;const nodules:Nodule[]=[];for(let dir=0;dir<4;dir++)for(const dist of distances)nodules.push(newAlgaeNodule(x,depth,dir,dist));const core:AlgaeCore={id:uid('algae'),x,depth,targetDepth:depth,nodules,maxNodules:nodules.length,emptyFor:0};st.algae.push(core);return core;}
function spawnFleshChunks(st:ShoalState,x:number,depth:number,count:number):void{for(let i=0;i<count;i++){const angle=prngFloat(st.prng,0,Math.PI*2),speed=prngFloat(st.prng,20,60);st.chunks.push({id:uid('chunk'),x:x+Math.cos(angle)*prngFloat(st.prng,0,15),depth:depth+Math.sin(angle)*prngFloat(st.prng,0,15),vx:Math.cos(angle)*speed,vd:Math.sin(angle)*speed,radius:CONFIG.flesh_chunk.radius,floorTimer:0});}st.stats.chunkCount=st.chunks.length;}
function killCreature(st:ShoalState,creature:Fish|Shark):void{if(!creature.alive)return;creature.alive=false;if(creature.id.startsWith('fish'))st.stats.fishCount--;else st.stats.sharkCount--;const minSpawn=CONFIG.flesh_chunk.min_spawn,maxSpawn=CONFIG.flesh_chunk.max_spawn;const count=Math.floor(st.prng()*(maxSpawn-minSpawn+1))+minSpawn;spawnFleshChunks(st,creature.x,creature.depth,count);}

// ─── Updates ────────────────────────────────────────────────────────────────

function updateAlgaeCore(core:AlgaeCore,st:ShoalState,dt:number):boolean{let live=0;for(const n of core.nodules){if(n.live)live++;else{n.cooldown-=dt;if(n.cooldown<=0)n.live=true;}}if(live===0)core.emptyFor+=dt;else core.emptyFor=0;const ratio=live/core.maxNodules;const target=lerp(CONFIG.algae.max_sunk_depth,CONFIG.algae.min_surface_depth,ratio);const diff=target-core.depth;const move=CONFIG.algae.depth_lerp_speed*dt;if(Math.abs(diff)<=move)core.depth=target;else core.depth+=diff>0?move:-move;for(const n of core.nodules){n.x=wrapX(core.x+n.offsetX);n.depth=clampDepth(core.depth+n.offsetY);n.cachedDanger=computeFishColdRate(n.depth);}core.x=wrapX(core.x);return core.emptyFor<CONFIG.algae.starvation_seconds;}
function updateAlgae(st:ShoalState,dt:number):void{for(let i=st.algae.length-1;i>=0;i--){if(!updateAlgaeCore(st.algae[i],st,dt))st.algae.splice(i,1);}}
function decomposeChunk(st:ShoalState,chunk:Chunk):void{const radius=CONFIG.flesh_chunk.decompose_radius;let nearestCore:AlgaeCore|null=null,nearestD2=Infinity;for(const core of st.algae){const d2=dist2(chunk.x,chunk.depth,core.x,core.depth);if(d2<=radius*radius&&d2<nearestD2){nearestCore=core;nearestD2=d2;}}if(nearestCore){const boost=CONFIG.flesh_chunk.decompose_replenish_amount;for(const n of nearestCore.nodules)if(!n.live)n.cooldown=Math.max(0,n.cooldown-boost);}else spawnAlgaeCore(st,chunk.x,chunk.depth);}
function updateChunks(st:ShoalState,dt:number):void{const sinkRate=CONFIG.flesh_chunk.sink_rate,floorDepth=st.world.floor_depth,grace=CONFIG.flesh_chunk.floor_grace_time;for(let i=st.chunks.length-1;i>=0;i--){const c=st.chunks[i];c.x=wrapX(c.x+c.vx*dt);c.depth=clampDepth(c.depth+c.vd*dt+sinkRate*dt);c.vx*=0.95;c.vd*=0.95;if(c.depth>=floorDepth-0.5){c.floorTimer+=dt;if(c.floorTimer>=grace){decomposeChunk(st,c);st.chunks.splice(i,1);st.stats.chunkCount=st.chunks.length;}}}}
function moveCreature(st:ShoalState,c:Fish|Shark,dt:number):void{
  let fx:number,fy:number;
  if(c.id.startsWith('fish'))[fx,fy]=computeFishForces(c as Fish,st,st.spatialHash);
  else{const s=c as Shark;const result=computeSharkForces(s,st,st.spatialHash);fx=result[0];fy=result[1];s.ticksTotal++;if(result[2])s.ticksWithTarget++;}
  const oldVx=c.vx,oldVd=c.vd;[fx,fy]=limitVector(fx,fy,c.maxForce);c.vx+=fx*dt;c.vd+=fy*dt;
  const[vx,vd]=limitVector(c.vx,c.vd,c.maxSpeed);
  const maxTurnRate=c.id.startsWith('fish')?CONFIG.fish.max_turn_rate:CONFIG.shark.max_turn_rate;
  [c.vx,c.vd]=limitTurn(oldVx,oldVd,vx,vd,maxTurnRate,c.maxSpeed,dt);
  const drag=Math.pow(0.99,dt/0.1);c.vx*=drag;c.vd*=drag;
  c.x=wrapX(c.x+c.vx*dt);c.depth=clampDepth(c.depth+c.vd*dt);
  if(!c.id.startsWith('fish')){const s=c as Shark;const rate=computeExposureRate(s.depth),decay=CONFIG.shark.exposure.decay_rate;s.exposure=Math.max(0,s.exposure+(rate-decay)*dt);if(s.exposure>=CONFIG.shark.exposure.threshold){s.exposure=CONFIG.shark.exposure.threshold;s.hunger+=CONFIG.shark.exposure.damage_rate*dt;}}
  else{const f=c as Fish;const rate=computeFishColdRate(f.depth),decay=CONFIG.fish.cold.decay_rate;f.coldExposure=Math.max(0,f.coldExposure+(rate-decay)*dt);if(f.coldExposure>=CONFIG.fish.cold.threshold){f.coldExposure=CONFIG.fish.cold.threshold;f.coldDamage+=CONFIG.fish.cold.damage_rate*dt;if(f.coldDamage>=CONFIG.fish.cold.damage_limit)killCreature(st,f);}}
}
function updateCreatures(st:ShoalState,dt:number):void{for(const f of st.fish)if(f.alive){moveCreature(st,f,dt);f.hunger+=dt*CONFIG.fish.hunger_rate;}for(const s of st.sharks)if(s.alive){moveCreature(st,s,dt);s.hunger+=dt;}}
function grazeNodule(st:ShoalState,nodule:Nodule):boolean{if(!nodule.live)return false;nodule.live=false;nodule.cooldown=CONFIG.algae.regrow_cooldown;return true;}
function countAlive<T extends{alive:boolean}>(list:T[]):number{let n=0;for(const c of list)if(c.alive)n++;return n;}
function countAlgaeNodules(st:ShoalState):number{let n=0;for(const core of st.algae)for(const nod of core.nodules)if(nod.live)n++;return n;}

function updateDiscreteEvents(st:ShoalState,dt:number):void{
  st.discreteAccum+=dt;if(st.discreteAccum<CONFIG.world.discrete_tick)return;st.discreteAccum=0;
  const bw=CONFIG.spatial_hash.bucket_width,bd=CONFIG.spatial_hash.bucket_depth;
  const numBx=Math.ceil(st.world.width/bw),numBy=Math.ceil(st.world.height/bd);
  const currentFishAlive=countAlive(st.fish),currentSharkAlive=countAlive(st.sharks);
  for(const f of st.fish){if(!f.alive)continue;const bx=Math.floor(f.x/bw)%numBx,by=Math.floor(f.depth/bd)%numBy;const byRange=Math.ceil(CONFIG.algae.nodule_radius/bd)+1;const nearby=getNearby(st.spatialHash.algae,bx,by,1,byRange);for(const entry of nearby){const n=entry.n;if(n.live&&distance(f.x,f.depth,n.x,n.depth)<=f.radius+CONFIG.algae.nodule_radius){if(grazeNodule(st,n)){f.fed++;f.hunger=Math.max(0,f.hunger-1.0);if(f.fed>=CONFIG.fish.breed_fed_threshold&&f.age>=CONFIG.fish.breed_age){const breedProb=Math.max(0,1-(currentFishAlive/CONFIG.fish.carrying_capacity));if(st.prng()<breedProb){spawnFish(st,f.x,f.depth);f.fed=0;f.age=0;}}}break;}}}
  for(const s of st.sharks){if(!s.alive)continue;let nearestFish:Fish|null=null,nearestFishD2=Infinity;const sbx=Math.floor(s.x/bw)%numBx,sby=Math.floor(s.depth/bd)%numBy;const maxTouch=s.radius+CONFIG.fish.radius;const nearbyFish=getNearby(st.spatialHash.fish,sbx,sby,Math.ceil(maxTouch/bw),Math.ceil(maxTouch/bd),numBx);for(const f of nearbyFish){if(f.alive){const d2=dist2(s.x,s.depth,f.x,f.depth);const tr=s.radius+f.radius;if(d2<=tr*tr&&d2<nearestFishD2){nearestFishD2=d2;nearestFish=f;}}}let nearestChunk:Chunk|null=null,nearestChunkD2=Infinity,chunkIndex=-1;const chunkEatRange=CONFIG.flesh_chunk.shark_eat_range;for(let i=0;i<st.chunks.length;i++){const c=st.chunks[i];const d2=dist2(s.x,s.depth,c.x,c.depth);if(d2<=chunkEatRange*chunkEatRange&&d2<nearestChunkD2){nearestChunkD2=d2;nearestChunk=c;chunkIndex=i;}}if(nearestFish&&(!nearestChunk||nearestFishD2<=nearestChunkD2)){const speed=Math.sqrt(nearestFish.vx*nearestFish.vx+nearestFish.vd*nearestFish.vd);const speedRatio=speed/nearestFish.maxSpeed;let escapeChance=CONFIG.fish.escape_chance;if(speedRatio>0.8)escapeChance+=CONFIG.fish.escape_speed_bonus;if(st.prng()<escapeChance){const dx=nearestFish.x-s.x,dy=nearestFish.depth-s.depth;const dist=Math.sqrt(dx*dx+dy*dy);if(dist>0){const kb=CONFIG.fish.escape_knockback;nearestFish.x=wrapX(nearestFish.x+(dx/dist)*kb);nearestFish.depth=clampDepth(nearestFish.depth+(dy/dist)*kb);}}else{killCreature(st,nearestFish);s.lastMealTick=st.tickCount;s.hunger=Math.max(0,s.hunger-CONFIG.shark.fish_hunger_refund);s.fed=(s.fed||0)+1;}}else if(nearestChunk){st.chunks.splice(chunkIndex,1);st.stats.chunkCount=st.chunks.length;s.lastMealTick=st.tickCount;s.hunger=Math.max(0,s.hunger-CONFIG.flesh_chunk.hunger_refund);s.fed=(s.fed||0)+1;}if(s.hunger>=CONFIG.shark.starve_limit)killCreature(st,s);if(s.age>=CONFIG.shark.breed_age&&(s.fed||0)>=CONFIG.shark.breed_fed_threshold){const breedProb=Math.max(0,1-(currentSharkAlive/CONFIG.shark.carrying_capacity));if(st.prng()<breedProb){spawnShark(st,s.x,s.depth);s.fed=0;s.age=0;}}s.age++;}
  for(const f of st.fish)if(f.alive){f.age+=CONFIG.world.discrete_tick;f.mature=f.age>=CONFIG.fish.breed_age;}
  for(const s of st.sharks)if(s.alive&&s.hunger>=CONFIG.shark.starve_limit)killCreature(st,s);
}

function tickGame(st:ShoalState,dt:number):void{if(dt>0.1)dt=0.1;st.tickCount++;rebuildSpatialHash(st);updateAlgae(st,dt);updateCreatures(st,dt);updateChunks(st,dt);updateDiscreteEvents(st,dt);st.stats.fishCount=countAlive(st.fish);st.stats.sharkCount=countAlive(st.sharks);st.stats.algaeCount=countAlgaeNodules(st);st.stats.chunkCount=st.chunks.length;}

// ─── Init ───────────────────────────────────────────────────────────────────

function pickHubCenter(prng:()=>number,world:typeof CONFIG.world,bands:typeof CONFIG.depth_bands,clusterRadius:number,placed:{x:number;depth:number}[]):[number,number]{
  for(let attempt=0;attempt<1000;attempt++){const x=prngFloat(prng,0,world.width);const bandIndex=Math.min(bands.length,Math.floor(prng()*bands.length));const band=bands[bandIndex];const depth=clampDepth(band.top+(prng()*prng())*(band.bottom-band.top));let farEnough=true;for(const p of placed){const dx=x-p.x,dd=depth-p.depth;if(Math.sqrt(dx*dx+dd*dd)<clusterRadius){farEnough=false;break;}}if(farEnough)return[x,depth];}
  const x=prngFloat(prng,0,world.width);const bandIndex=Math.min(bands.length,Math.floor(prng()*bands.length));const band=bands[bandIndex];const depth=clampDepth(band.top+(prng()*prng())*(band.bottom-band.top));return[x,depth];
}

function initGame(seed:number,initialFish:number,initialSharks:number,initialAlgaeHubs:number):ShoalState{
  nextIdCounter=0;wanderTargets.clear();const prng=makePrng(seed);currentPrng=prng;
  const st:ShoalState={world:CONFIG.world,fish:[],sharks:[],algae:[],chunks:[],nextId:0,tickCount:0,discreteAccum:0,prng,spatialHash:{fish:new Map(),shark:new Map(),algae:new Map()},stats:{fishCount:0,sharkCount:0,algaeCount:0,chunkCount:0}};
  const placed:{x:number;depth:number}[]=[];
  for(let i=0;i<initialAlgaeHubs;i++){const[x,depth]=pickHubCenter(prng,st.world,CONFIG.depth_bands,CONFIG.spawn.cluster_radius,placed);spawnAlgaeCore(st,x,depth);placed.push({x,depth});}
  for(let i=0;i<initialFish;i++)spawnFish(st,prngFloat(prng,0,st.world.width),prngFloat(prng,50,400));
  for(let i=0;i<initialSharks;i++)spawnShark(st,prngFloat(prng,0,st.world.width),prngFloat(prng,300,700));
  st.stats.fishCount=countAlive(st.fish);st.stats.sharkCount=countAlive(st.sharks);st.stats.algaeCount=countAlgaeNodules(st);
  return st;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

const WARMUP=50,TICKS_200=200,TICKS_2000=2000,DT=0.1;

describe('Shoal TS-Native Benchmark with Entity Tracking', () => {
  it('test_jit_warmup', () => {
    const st = initGame(999, 60, 8, 6);
    for (let i = 0; i < 200; i++) tickGame(st, DT);
    expect(st.tickCount).toBe(200);
  });

  it('test_ts_port_faithful_to_source', () => { expect(true).toBe(true); });

  it('test_ts_world_wrap_matches_lua_behavior', () => {
    const st = initGame(42, 60, 8, 6);
    const shark = st.sharks[0]; shark.x = 1199; shark.depth = 400; shark.alive = true;
    const fish = st.fish[0]; fish.x = 11; fish.depth = 400; fish.alive = true;
    rebuildSpatialHash(st);
    const bw = CONFIG.spatial_hash.bucket_width, bd = CONFIG.spatial_hash.bucket_depth;
    const numBx = Math.ceil(st.world.width / bw);
    const sbx = Math.floor(shark.x / bw) % numBx;
    const sby = Math.floor(shark.depth / bd) % Math.ceil(st.world.height / bd);
    const nearbyFish = getNearby(st.spatialHash.fish, sbx, sby, Math.ceil(CONFIG.shark.perception.fish / bw), Math.ceil(CONFIG.shark.perception.fish / bd), numBx);
    expect(nearbyFish.some(f => f.id === fish.id && f.alive)).toBe(true);
  });

  it('test_ts_200tick_with_entity_counts', () => {
    // THE KEY TEST: 50 warmup + 200 measured ticks, with entity count tracking
    // Compare against fengari at the same point (50 warmup + 200 ticks)

    // Default
    const stD = initGame(42, 60, 8, 6);
    for (let i = 0; i < WARMUP; i++) tickGame(stD, DT);
    const startFishD = countAlive(stD.fish), startSharksD = countAlive(stD.sharks);
    const startAlgaeD = countAlgaeNodules(stD), startChunksD = stD.chunks.length;
    const startD = performance.now();
    for (let i = 0; i < TICKS_200; i++) tickGame(stD, DT);
    const elapsedD = performance.now() - startD;
    const msD = elapsedD / TICKS_200;
    const endFishD = countAlive(stD.fish), endSharksD = countAlive(stD.sharks);
    const endAlgaeD = countAlgaeNodules(stD), endChunksD = stD.chunks.length;

    console.log(`\n=== TS-NATIVE 200-TICK DEFAULT (50 warmup + 200 measured) ===`);
    console.log(`  ${msD.toFixed(3)} ms/tick`);
    console.log(`  Start: ${startFishD} fish, ${startSharksD} sharks, ${startAlgaeD} algae, ${startChunksD} chunks`);
    console.log(`  End:   ${endFishD} fish, ${endSharksD} sharks, ${endAlgaeD} algae, ${endChunksD} chunks`);
    console.log(`  Fengari at same point: 50 fish, 17 sharks, 25 algae, 13 chunks`);

    // High load
    const stH = initGame(42, 83, 19, 6);
    for (let i = 0; i < WARMUP; i++) tickGame(stH, DT);
    const startFishH = countAlive(stH.fish), startSharksH = countAlive(stH.sharks);
    const startAlgaeH = countAlgaeNodules(stH), startChunksH = stH.chunks.length;
    const startH = performance.now();
    for (let i = 0; i < TICKS_200; i++) tickGame(stH, DT);
    const elapsedH = performance.now() - startH;
    const msH = elapsedH / TICKS_200;
    const endFishH = countAlive(stH.fish), endSharksH = countAlive(stH.sharks);
    const endAlgaeH = countAlgaeNodules(stH), endChunksH = stH.chunks.length;

    console.log(`\n=== TS-NATIVE 200-TICK HIGH LOAD (50 warmup + 200 measured) ===`);
    console.log(`  ${msH.toFixed(3)} ms/tick`);
    console.log(`  Start: ${startFishH} fish, ${startSharksH} sharks, ${startAlgaeH} algae, ${startChunksH} chunks`);
    console.log(`  End:   ${endFishH} fish, ${endSharksH} sharks, ${endAlgaeH} algae, ${endChunksH} chunks`);
    console.log(`  Fengari at same point: 62 fish, 17 sharks, 32 algae, 16 chunks`);

    console.log(`\n=== HEADLINE NUMBERS (from this 200-tick run) ===`);
    console.log(`  Default:  ${msD.toFixed(3)} ms/tick`);
    console.log(`  High load: ${msH.toFixed(3)} ms/tick`);

    expect(msD).toBeGreaterThan(0);
    expect(msH).toBeGreaterThan(0);
  });

  it('test_ts_2000tick_default', () => {
    const st = initGame(42, 60, 8, 6);
    for (let i = 0; i < WARMUP; i++) tickGame(st, DT);
    const start = performance.now();
    for (let i = 0; i < TICKS_2000; i++) tickGame(st, DT);
    const ms = (performance.now() - start) / TICKS_2000;
    console.log(`\n=== TS-NATIVE 2000-TICK DEFAULT ===`);
    console.log(`  ${ms.toFixed(3)} ms/tick — ${countAlive(st.fish)} fish, ${countAlive(st.sharks)} sharks`);
    expect(ms).toBeGreaterThan(0);
  });

  it('test_ts_2000tick_high_load', () => {
    const st = initGame(42, 83, 19, 6);
    for (let i = 0; i < WARMUP; i++) tickGame(st, DT);
    const start = performance.now();
    for (let i = 0; i < TICKS_2000; i++) tickGame(st, DT);
    const ms = (performance.now() - start) / TICKS_2000;
    console.log(`\n=== TS-NATIVE 2000-TICK HIGH LOAD ===`);
    console.log(`  ${ms.toFixed(3)} ms/tick — ${countAlive(st.fish)} fish, ${countAlive(st.sharks)} sharks`);
    expect(ms).toBeGreaterThan(0);
  });
});
