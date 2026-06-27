import { useRef, useEffect, useState } from 'react';
import type { GameSession } from '../../../engine/types';
import type { Snake, Segment, Fruit, Point } from '../types';

interface AcidDrop {
  x: number;
  y: number;
  timer: number;
  radius: number;
}

interface GameCanvasProps {
  session: GameSession;
  controlType: 'mouse' | 'keyboard';
  playerColor: string;
  playerHeadColor: string;
  gameDuration: number;
  isPaused: boolean;
  onFruitEaten: () => void;
  onUpdateMetrics: (metrics: { currentLength: number; peakLength: number; score: number }) => void;
  onGameOver: () => void;
  onTick: (timeLeft: number) => void;
  speedMultiplier: number;
  magnetismRadius: number;
  shieldCharges: number;
  onShieldConsumed: () => void;
  wideBodyAdd: number;
  fruitSenseRange: number;
  ghostTailCount: number;
  tailGrowthLevel: number;
  venomTrailLevel: number;
}

const MAP_WIDTH = 2600;
const MAP_HEIGHT = 2600;
const NUM_FRUITS = 45;
const NUM_NPCS = 12;

export default function GameCanvas({
  controlType,
  playerColor,
  playerHeadColor,
  gameDuration,
  isPaused,
  onFruitEaten,
  onUpdateMetrics,
  onGameOver,
  onTick,
  speedMultiplier,
  magnetismRadius,
  shieldCharges,
  onShieldConsumed,
  wideBodyAdd,
  fruitSenseRange,
  ghostTailCount,
  tailGrowthLevel,
  venomTrailLevel
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef<{
    player: Snake;
    npcs: Snake[];
    fruits: Fruit[];
    acidDrops: AcidDrop[];
    timeLeft: number;
    score: number;
    peakLength: number;
    dimensions: { width: number; height: number };
    mousePos: Point;
    keys: Record<string, boolean>;
    lastTime: number;
    lastGrowthTick: number;
    lastAcidTick: number;
  }>({
    player: {
      id: 'player', name: 'Player', color: playerColor, headColor: playerHeadColor,
      isNPC: false, segments: [], angle: 0, targetAngle: 0, speed: 150, radius: 12,
      shieldCharges: 0, magnetismRadius: 0, fruitSenseRange: 0, ghostTailCount: 0,
      tailGrowthTimer: 0, lastDecisionTime: 0, score: 0,
    },
    npcs: [], fruits: [], acidDrops: [],
    timeLeft: gameDuration, score: 0, peakLength: 5,
    dimensions: { width: 800, height: 600 },
    mousePos: { x: 400, y: 300 },
    keys: {}, lastTime: 0, lastGrowthTick: 0, lastAcidTick: 0,
  });

  const [levelUpFlash, setLevelUpFlash] = useState(false);

  const spawnFruit = (): Fruit => {
    const isGolden = Math.random() < 0.08;
    return {
      id: Math.random().toString(),
      x: Math.random() * (MAP_WIDTH - 120) + 60,
      y: Math.random() * (MAP_HEIGHT - 120) + 60,
      color: isGolden ? '#fbbf24' : ['#ef4444', '#10b981', '#3b82f6', '#ec4899', '#f43f5e'][Math.floor(Math.random() * 5)],
      points: isGolden ? 3 : 1,
      isGolden,
      pulseScale: 1 + Math.random() * 0.2,
    };
  };

  useEffect(() => {
    const state = stateRef.current;
    const startX = MAP_WIDTH / 2;
    const startY = MAP_HEIGHT / 2;
    const initialRadius = 11 + wideBodyAdd;
    const initialSegments: Segment[] = [];
    for (let i = 0; i < 5; i++) {
      initialSegments.push({ x: startX - i * (initialRadius * 1.6), y: startY, angle: 0 });
    }
    state.player = {
      id: 'player', name: 'Hero Snake', color: playerColor, headColor: playerHeadColor,
      isNPC: false, segments: initialSegments, angle: 0, targetAngle: 0, speed: 160,
      radius: initialRadius, shieldCharges, magnetismRadius, fruitSenseRange,
      ghostTailCount, tailGrowthTimer: 0, lastDecisionTime: 0, score: 0,
    };
    const initialFruits: Fruit[] = [];
    for (let i = 0; i < NUM_FRUITS; i++) initialFruits.push(spawnFruit());
    state.fruits = initialFruits;

    const npcColors = [
      { color: '#ef4444', head: '#f87171', name: 'Gorgon' },
      { color: '#f97316', head: '#fb923c', name: 'Naga' },
      { color: '#eab308', head: '#facc15', name: 'Adder' },
      { color: '#a855f7', head: '#c084fc', name: 'Sidewinder' },
      { color: '#ec4899', head: '#f472b6', name: 'Basilisk' },
      { color: '#3b82f6', head: '#60a5fa', name: 'Python' },
      { color: '#06b6d4', head: '#22d3ee', name: 'Anaconda' },
    ];
    const initialNPCs: Snake[] = [];
    for (let i = 0; i < NUM_NPCS; i++) {
      const colorSet = npcColors[i % npcColors.length];
      const npcRadius = 10 + Math.random() * 3;
      const npcX = Math.random() * (MAP_WIDTH - 200) + 100;
      const npcY = Math.random() * (MAP_HEIGHT - 200) + 100;
      const npcAngle = Math.random() * Math.PI * 2;
      const npcSegments: Segment[] = [];
      const len = 4 + Math.floor(Math.random() * 6);
      for (let s = 0; s < len; s++) {
        npcSegments.push({
          x: npcX - Math.cos(npcAngle) * s * (npcRadius * 1.6),
          y: npcY - Math.sin(npcAngle) * s * (npcRadius * 1.6),
          angle: npcAngle,
        });
      }
      initialNPCs.push({
        id: `npc-${i}`, name: `${colorSet.name} ${i + 1}`,
        color: colorSet.color, headColor: colorSet.head, isNPC: true,
        segments: npcSegments, angle: npcAngle, targetAngle: npcAngle,
        speed: 110 + Math.random() * 30, radius: npcRadius,
        shieldCharges: 0, magnetismRadius: 0, fruitSenseRange: 0,
        ghostTailCount: 0, tailGrowthTimer: 0, lastDecisionTime: 0, score: 0,
      });
    }
    state.npcs = initialNPCs;
    state.acidDrops = [];
    state.timeLeft = gameDuration;
    state.score = 0;
    state.peakLength = 5;
    onUpdateMetrics({ currentLength: 5, peakLength: 5, score: 0 });
  }, [playerColor, playerHeadColor, gameDuration]);

  useEffect(() => {
    const state = stateRef.current;
    if (state.player) {
      state.player.radius = 11 + wideBodyAdd;
      state.player.shieldCharges = shieldCharges;
      state.player.magnetismRadius = magnetismRadius;
      state.player.fruitSenseRange = fruitSenseRange;
      state.player.ghostTailCount = ghostTailCount;
    }
  }, [wideBodyAdd, shieldCharges, magnetismRadius, fruitSenseRange, ghostTailCount]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      stateRef.current.dimensions = { width: rect.width, height: rect.height };
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      stateRef.current.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleKeyDown = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let animId: number;
    let tickAccumulator = 0;

    const gameLoop = (timestamp: number) => {
      const state = stateRef.current;
      if (!state.lastTime) state.lastTime = timestamp;
      let dt = (timestamp - state.lastTime) / 1000;
      state.lastTime = timestamp;
      if (dt > 0.1) dt = 0.1;

      if (!isPaused && state.timeLeft > 0) {
        tickAccumulator += dt;
        if (tickAccumulator >= 1.0) {
          state.timeLeft = Math.max(0, state.timeLeft - 1);
          onTick(state.timeLeft);
          tickAccumulator -= 1.0;
          if (state.timeLeft <= 0) onGameOver();
        }
        updatePhysics(dt);
        checkCollisions();
      }
      drawGame();
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, speedMultiplier, tailGrowthLevel, venomTrailLevel]);

  const updatePhysics = (dt: number) => {
    const state = stateRef.current;
    if (!state.player || state.player.segments.length === 0) return;
    const player = state.player;
    const currentHead = player.segments[0];

    if (controlType === 'mouse') {
      const centerX = state.dimensions.width / 2;
      const centerY = state.dimensions.height / 2;
      const dx = state.mousePos.x - centerX;
      const dy = state.mousePos.y - centerY;
      if (Math.sqrt(dx * dx + dy * dy) > 15) player.targetAngle = Math.atan2(dy, dx);
    } else {
      let dx = 0, dy = 0;
      if (state.keys['w'] || state.keys['arrowup']) dy = -1;
      if (state.keys['s'] || state.keys['arrowdown']) dy = 1;
      if (state.keys['a'] || state.keys['arrowleft']) dx = -1;
      if (state.keys['d'] || state.keys['arrowright']) dx = 1;
      if (dx !== 0 || dy !== 0) player.targetAngle = Math.atan2(dy, dx);
    }

    let angleDiff = player.targetAngle - player.angle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    const playerTurnSpeed = 5.2;
    player.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), playerTurnSpeed * dt);
    player.angle = (player.angle + Math.PI * 2) % (Math.PI * 2);

    let activeSpeed = (player.speed + (state.score * 0.8)) * speedMultiplier;
    if (player.isSlowing) activeSpeed *= 0.5;

    currentHead.x += Math.cos(player.angle) * activeSpeed * dt;
    currentHead.y += Math.sin(player.angle) * activeSpeed * dt;
    currentHead.x = Math.max(player.radius, Math.min(MAP_WIDTH - player.radius, currentHead.x));
    currentHead.y = Math.max(player.radius, Math.min(MAP_HEIGHT - player.radius, currentHead.y));

    for (let i = 1; i < player.segments.length; i++) {
      const prev = player.segments[i - 1];
      const curr = player.segments[i];
      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const spacing = player.radius * 1.5;
      if (dist > spacing) {
        const angle = Math.atan2(dy, dx);
        curr.x = prev.x - Math.cos(angle) * spacing;
        curr.y = prev.y - Math.sin(angle) * spacing;
        curr.angle = angle;
      }
    }

    if (tailGrowthLevel > 0) {
      player.tailGrowthTimer += dt;
      const cooldown = 16 - tailGrowthLevel * 3;
      if (player.tailGrowthTimer >= cooldown) {
        player.tailGrowthTimer = 0;
        const lastSeg = player.segments[player.segments.length - 1];
        player.segments.push({
          x: lastSeg.x - Math.cos(lastSeg.angle) * player.radius,
          y: lastSeg.y - Math.sin(lastSeg.angle) * player.radius,
          angle: lastSeg.angle,
        });
        onUpdateMetrics({
          currentLength: player.segments.length,
          peakLength: Math.max(state.peakLength, player.segments.length),
          score: state.score,
        });
        state.peakLength = Math.max(state.peakLength, player.segments.length);
      }
    }

    if (venomTrailLevel > 0) {
      const now = Date.now();
      if (now - state.lastAcidTick > 450) {
        state.lastAcidTick = now;
        const tailSeg = player.segments[player.segments.length - 1];
        state.acidDrops.push({
          x: tailSeg.x, y: tailSeg.y,
          timer: 5 + venomTrailLevel * 2,
          radius: 8 + venomTrailLevel * 1.5,
        });
      }
    }

    state.acidDrops = state.acidDrops.filter(drop => { drop.timer -= dt; return drop.timer > 0; });

    state.npcs.forEach(npc => {
      const now = Date.now();
      const npcHead = npc.segments[0];
      if (npc.isSlowing && npc.slowTimer) {
        npc.slowTimer -= dt;
        if (npc.slowTimer <= 0) npc.isSlowing = false;
      }
      if (now - npc.lastDecisionTime > (400 + Math.random() * 400)) {
        npc.lastDecisionTime = now;
        let closestFruit: Fruit | null = null;
        let minDist = 450;
        state.fruits.forEach(fruit => {
          const dx = fruit.x - npcHead.x;
          const dy = fruit.y - npcHead.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) { minDist = d; closestFruit = fruit; }
        });
        const wallBuffer = 120;
        let avoidWallAngle = -1;
        if (npcHead.x < wallBuffer) avoidWallAngle = 0;
        else if (npcHead.x > MAP_WIDTH - wallBuffer) avoidWallAngle = Math.PI;
        else if (npcHead.y < wallBuffer) avoidWallAngle = Math.PI / 2;
        else if (npcHead.y > MAP_HEIGHT - wallBuffer) avoidWallAngle = -Math.PI / 2;
        if (avoidWallAngle !== -1) {
          npc.targetAngle = avoidWallAngle + (Math.random() * 0.6 - 0.3);
        } else if (closestFruit) {
          const f: Fruit = closestFruit;
          npc.targetAngle = Math.atan2(f.y - npcHead.y, f.x - npcHead.x);
        } else {
          npc.targetAngle += (Math.random() * 1.2 - 0.6);
        }
      }
      let npcAngleDiff = npc.targetAngle - npc.angle;
      while (npcAngleDiff < -Math.PI) npcAngleDiff += Math.PI * 2;
      while (npcAngleDiff > Math.PI) npcAngleDiff -= Math.PI * 2;
      const npcTurnSpeed = 4.2;
      npc.angle += Math.sign(npcAngleDiff) * Math.min(Math.abs(npcAngleDiff), npcTurnSpeed * dt);
      npc.angle = (npc.angle + Math.PI * 2) % (Math.PI * 2);
      let npcSpeed = npc.speed;
      if (npc.isSlowing) npcSpeed *= 0.4;
      npcHead.x += Math.cos(npc.angle) * npcSpeed * dt;
      npcHead.y += Math.sin(npc.angle) * npcSpeed * dt;
      npcHead.x = Math.max(npc.radius, Math.min(MAP_WIDTH - npc.radius, npcHead.x));
      npcHead.y = Math.max(npc.radius, Math.min(MAP_HEIGHT - npc.radius, npcHead.y));
      for (let s = 1; s < npc.segments.length; s++) {
        const prev = npc.segments[s - 1];
        const curr = npc.segments[s];
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const spacing = npc.radius * 1.5;
        if (dist > spacing) {
          const angle = Math.atan2(dy, dx);
          curr.x = prev.x - Math.cos(angle) * spacing;
          curr.y = prev.y - Math.sin(angle) * spacing;
          curr.angle = angle;
        }
      }
    });
  };

  const checkCollisions = () => {
    const state = stateRef.current;
    if (!state.player || state.player.segments.length === 0) return;
    const player = state.player;
    const playerHead = player.segments[0];

    if (player.magnetismRadius > 0) {
      state.fruits.forEach(fruit => {
        const dx = playerHead.x - fruit.x;
        const dy = playerHead.y - fruit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= player.magnetismRadius) {
          const pullSpeed = 160 + (magnetismRadius * 15);
          const angle = Math.atan2(dy, dx);
          fruit.x += Math.cos(angle) * pullSpeed * 0.016;
          fruit.y += Math.sin(angle) * pullSpeed * 0.016;
        }
      });
    }

    state.fruits = state.fruits.map(fruit => {
      let dx = playerHead.x - fruit.x;
      let dy = playerHead.y - fruit.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < player.radius + 10) {
        state.score += fruit.points;
        onFruitEaten();
        const lastSeg = player.segments[player.segments.length - 1];
        for (let g = 0; g < fruit.points; g++) {
          player.segments.push({
            x: lastSeg.x - Math.cos(lastSeg.angle) * player.radius,
            y: lastSeg.y - Math.sin(lastSeg.angle) * player.radius,
            angle: lastSeg.angle,
          });
        }
        const newPeak = Math.max(state.peakLength, player.segments.length);
        state.peakLength = newPeak;
        onUpdateMetrics({ currentLength: player.segments.length, peakLength: newPeak, score: state.score });
        if (fruit.isGolden) { setLevelUpFlash(true); setTimeout(() => setLevelUpFlash(false), 200); }
        return spawnFruit();
      }
      for (let n = 0; n < state.npcs.length; n++) {
        const npc = state.npcs[n];
        const npcHead = npc.segments[0];
        dx = npcHead.x - fruit.x;
        dy = npcHead.y - fruit.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < npc.radius + 10) {
          npc.score += fruit.points;
          const npcLastSeg = npc.segments[npc.segments.length - 1];
          for (let g = 0; g < fruit.points; g++) {
            npc.segments.push({
              x: npcLastSeg.x - Math.cos(npcLastSeg.angle) * npc.radius,
              y: npcLastSeg.y - Math.sin(npcLastSeg.angle) * npc.radius,
              angle: npcLastSeg.angle,
            });
          }
          return spawnFruit();
        }
      }
      return fruit;
    });

    if (state.acidDrops.length > 0) {
      state.npcs.forEach(npc => {
        const npcHead = npc.segments[0];
        state.acidDrops.forEach(drop => {
          const dx = npcHead.x - drop.x;
          const dy = npcHead.y - drop.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < npc.radius + drop.radius) { npc.isSlowing = true; npc.slowTimer = 4.0; }
        });
      });
    }

    state.npcs.forEach(npc => {
      const npcHead = npc.segments[0];
      for (let j = 1; j < player.segments.length; j++) {
        const playerJoint = player.segments[j];
        const dx = npcHead.x - playerJoint.x;
        const dy = npcHead.y - playerJoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < npc.radius + player.radius) {
          if (player.ghostTailCount > 0 && j >= player.segments.length - player.ghostTailCount) continue;
          if (player.shieldCharges > 0) {
            onShieldConsumed();
            player.shieldCharges -= 1;
            npc.angle = (npc.angle + Math.PI) % (Math.PI * 2);
            npc.targetAngle = npc.angle;
            setLevelUpFlash(true);
            setTimeout(() => setLevelUpFlash(false), 120);
            return;
          }
          const stolenSegments = player.segments.slice(j);
          player.segments = player.segments.slice(0, j);
          if (player.segments.length < 2) {
            const head = player.segments[0];
            player.segments = [
              head,
              { x: head.x - Math.cos(player.angle) * player.radius, y: head.y - Math.sin(player.angle) * player.radius, angle: player.angle },
            ];
          }
          stolenSegments.forEach(seg => {
            const lastNpcSeg = npc.segments[npc.segments.length - 1];
            npc.segments.push({ x: lastNpcSeg.x, y: lastNpcSeg.y, angle: seg.angle });
          });
          onUpdateMetrics({ currentLength: player.segments.length, peakLength: state.peakLength, score: state.score });
          npc.angle = (npc.angle + Math.PI / 2) % (Math.PI * 2);
          npc.targetAngle = npc.angle;
        }
      }
    });

    state.npcs.forEach(npc => {
      for (let j = 1; j < npc.segments.length; j++) {
        const npcJoint = npc.segments[j];
        const dx = playerHead.x - npcJoint.x;
        const dy = playerHead.y - npcJoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + npc.radius) {
          const stolenFromNpc = npc.segments.slice(j);
          npc.segments = npc.segments.slice(0, j);
          if (npc.segments.length < 2) {
            const head = npc.segments[0];
            npc.segments = [
              head,
              { x: head.x - Math.cos(npc.angle) * npc.radius, y: head.y - Math.sin(npc.angle) * npc.radius, angle: npc.angle },
            ];
          }
          stolenFromNpc.forEach(seg => {
            const lastPlayerSeg = player.segments[player.segments.length - 1];
            player.segments.push({ x: lastPlayerSeg.x, y: lastPlayerSeg.y, angle: seg.angle });
          });
          const newPeak = Math.max(state.peakLength, player.segments.length);
          state.peakLength = newPeak;
          onUpdateMetrics({ currentLength: player.segments.length, peakLength: newPeak, score: state.score });
          player.angle = (player.angle + Math.PI / 4) % (Math.PI * 2);
          player.targetAngle = player.angle;
        }
      }
    });

    for (let i = 0; i < state.npcs.length; i++) {
      const npcThief = state.npcs[i];
      const thiefHead = npcThief.segments[0];
      for (let k = 0; k < state.npcs.length; k++) {
        if (i === k) continue;
        const npcVictim = state.npcs[k];
        for (let j = 1; j < npcVictim.segments.length; j++) {
          const victimJoint = npcVictim.segments[j];
          const dx = thiefHead.x - victimJoint.x;
          const dy = thiefHead.y - victimJoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < npcThief.radius + npcVictim.radius) {
            const stolen = npcVictim.segments.slice(j);
            npcVictim.segments = npcVictim.segments.slice(0, j);
            if (npcVictim.segments.length < 2) {
              const head = npcVictim.segments[0];
              npcVictim.segments = [
                head,
                { x: head.x - Math.cos(npcVictim.angle) * npcVictim.radius, y: head.y - Math.sin(npcVictim.angle) * npcVictim.radius, angle: npcVictim.angle },
              ];
            }
            stolen.forEach(seg => {
              const lastSeg = npcThief.segments[npcThief.segments.length - 1];
              npcThief.segments.push({ x: lastSeg.x, y: lastSeg.y, angle: seg.angle });
            });
            npcThief.angle = (npcThief.angle + Math.PI / 2) % (Math.PI * 2);
            npcThief.targetAngle = npcThief.angle;
          }
        }
      }
    }
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = stateRef.current;
    if (!state.player || state.player.segments.length === 0) return;
    const player = state.player;
    const playerHead = player.segments[0];

    ctx.clearRect(0, 0, state.dimensions.width, state.dimensions.height);
    ctx.save();
    const cameraX = state.dimensions.width / 2 - playerHead.x;
    const cameraY = state.dimensions.height / 2 - playerHead.y;
    ctx.translate(cameraX, cameraY);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x <= MAP_WIDTH; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, MAP_HEIGHT); }
    for (let y = 0; y <= MAP_HEIGHT; y += 100) { ctx.moveTo(0, y); ctx.lineTo(MAP_WIDTH, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 15;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    ctx.shadowBlur = 0;

    state.acidDrops.forEach(drop => {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    state.fruits.forEach(fruit => {
      const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.12 * fruit.pulseScale;
      const fruitRad = (fruit.isGolden ? 12 : 8) * pulse;
      ctx.save();
      ctx.shadowColor = fruit.color;
      ctx.shadowBlur = fruit.isGolden ? 18 : 10;
      ctx.fillStyle = fruit.color;
      ctx.beginPath();
      ctx.arc(fruit.x, fruit.y, fruitRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (fruit.isGolden) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruitRad * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    state.npcs.forEach(npc => {
      ctx.strokeStyle = npc.color;
      ctx.lineWidth = npc.radius * 1.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      npc.segments.forEach((seg, idx) => { if (idx === 0) ctx.moveTo(seg.x, seg.y); else ctx.lineTo(seg.x, seg.y); });
      ctx.stroke();
      npc.segments.forEach((seg, idx) => {
        if (idx === 0) return;
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = npc.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, npc.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = npc.color;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, npc.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      const head = npc.segments[0];
      ctx.fillStyle = npc.headColor;
      ctx.beginPath();
      ctx.arc(head.x, head.y, npc.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
      const eyeOffsetAngle = 0.55;
      const eyeDist = npc.radius * 0.8;
      const lx = head.x + Math.cos(npc.angle - eyeOffsetAngle) * eyeDist;
      const ly = head.y + Math.sin(npc.angle - eyeOffsetAngle) * eyeDist;
      const rx = head.x + Math.cos(npc.angle + eyeOffsetAngle) * eyeDist;
      const ry = head.y + Math.sin(npc.angle + eyeOffsetAngle) * eyeDist;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(lx + Math.cos(npc.angle), ly + Math.sin(npc.angle), 1.5, 0, Math.PI * 2);
      ctx.arc(rx + Math.cos(npc.angle), ry + Math.sin(npc.angle), 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, head.x, head.y - npc.radius * 2);
    });

    ctx.strokeStyle = player.color;
    ctx.lineWidth = player.radius * 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    player.segments.forEach((seg, idx) => { if (idx === 0) ctx.moveTo(seg.x, seg.y); else ctx.lineTo(seg.x, seg.y); });
    ctx.stroke();

    player.segments.forEach((seg, idx) => {
      if (idx === 0) return;
      const isGhost = player.ghostTailCount > 0 && idx >= player.segments.length - player.ghostTailCount;
      ctx.save();
      if (isGhost) ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#0b0f19';
      ctx.strokeStyle = isGhost ? '#6366f1' : player.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, player.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isGhost ? '#818cf8' : '#ffffff';
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, player.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      if (player.shieldCharges > 0 && !isGhost && idx % 2 === 1) {
        ctx.strokeStyle = 'rgba(52,211,153,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, player.radius * 1.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    ctx.fillStyle = player.headColor;
    ctx.beginPath();
    ctx.arc(playerHead.x, playerHead.y, player.radius * 1.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(playerHead.x, playerHead.y, player.radius * 1.45, 0, Math.PI * 2);
    ctx.stroke();

    const pEyeOffset = 0.52;
    const pEyeDist = player.radius * 0.85;
    const plx = playerHead.x + Math.cos(player.angle - pEyeOffset) * pEyeDist;
    const ply = playerHead.y + Math.sin(player.angle - pEyeOffset) * pEyeDist;
    const prx = playerHead.x + Math.cos(player.angle + pEyeOffset) * pEyeDist;
    const pry = playerHead.y + Math.sin(player.angle + pEyeOffset) * pEyeDist;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(plx, ply, 4.2, 0, Math.PI * 2);
    ctx.arc(prx, pry, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(plx + Math.cos(player.angle) * 1.5, ply + Math.sin(player.angle) * 1.5, 2.0, 0, Math.PI * 2);
    ctx.arc(prx + Math.cos(player.angle) * 1.5, pry + Math.sin(player.angle) * 1.5, 2.0, 0, Math.PI * 2);
    ctx.fill();

    if (player.magnetismRadius > 0) {
      ctx.strokeStyle = 'rgba(14,165,233,0.12)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerHead.x, playerHead.y, player.magnetismRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (player.fruitSenseRange > 0) {
      state.fruits.forEach(fruit => {
        const dx = fruit.x - playerHead.x;
        const dy = fruit.y - playerHead.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 300 && dist <= player.fruitSenseRange) {
          const angle = Math.atan2(dy, dx);
          const centerX = state.dimensions.width / 2;
          const centerY = state.dimensions.height / 2;
          const pointerRadius = Math.min(centerX, centerY) - 35;
          const ptrX = centerX + Math.cos(angle) * pointerRadius;
          const ptrY = centerY + Math.sin(angle) * pointerRadius;
          ctx.save();
          ctx.translate(ptrX, ptrY);
          ctx.rotate(angle);
          ctx.fillStyle = fruit.color;
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(-6, -6);
          ctx.lineTo(-2, 0);
          ctx.lineTo(-6, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`sr-canvas-container${levelUpFlash ? ' sr-flash' : ''}`}
    >
      <canvas ref={canvasRef} className="sr-canvas" />
      {stateRef.current.player?.segments[0] && (() => {
        const head = stateRef.current.player.segments[0];
        const nearBorder = head.x < 150 || head.x > MAP_WIDTH - 150 || head.y < 150 || head.y > MAP_HEIGHT - 150;
        if (!nearBorder) return null;
        return (
          <div className="sr-border-warning">
            ⚠ Approaching Boundary ⚠
          </div>
        );
      })()}
    </div>
  );
}
