import React, { useRef, useEffect, useState } from 'react';
import { Snake, Segment, Fruit, Point } from '../types';

interface GameCanvasProps {
  controlType: 'mouse' | 'keyboard';
  playerColor: string;
  playerHeadColor: string;
  gameDuration: number;
  isPaused: boolean;
  onFruitEaten: () => void;
  onUpdateMetrics: (metrics: { currentLength: number; peakLength: number; score: number }) => void;
  onGameOver: () => void;
  onTick: (timeLeft: number) => void;
  // Evolution modifiers
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

// Map Dimensions
const MAP_WIDTH = 2600;
const MAP_HEIGHT = 2600;
const NUM_FRUITS = 45;
const NUM_NPCS = 12;

interface AcidDrop {
  x: number;
  y: number;
  timer: number; // decreases over time
  radius: number;
}

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
  
  // Game states in refs to keep the simulation loop independent of React render re-triggers
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
      id: 'player',
      name: 'Player',
      color: playerColor,
      headColor: playerHeadColor,
      isNPC: false,
      segments: [],
      angle: 0,
      targetAngle: 0,
      speed: 150,
      radius: 12,
      shieldCharges: 0,
      magnetismRadius: 0,
      fruitSenseRange: 0,
      ghostTailCount: 0,
      tailGrowthTimer: 0,
      lastDecisionTime: 0,
      score: 0
    },
    npcs: [],
    fruits: [],
    acidDrops: [],
    timeLeft: gameDuration,
    score: 0,
    peakLength: 5,
    dimensions: { width: 800, height: 600 },
    mousePos: { x: 400, y: 300 },
    keys: {},
    lastTime: 0,
    lastGrowthTick: 0,
    lastAcidTick: 0
  });

  const [levelUpFlash, setLevelUpFlash] = useState(false);

  // Initialize the entire game environment once on start
  useEffect(() => {
    const state = stateRef.current;
    
    // Set up player initially
    const startX = MAP_WIDTH / 2;
    const startY = MAP_HEIGHT / 2;
    const initialRadius = 11 + wideBodyAdd;
    
    const initialSegments: Segment[] = [];
    for (let i = 0; i < 5; i++) {
      initialSegments.push({
        x: startX - i * (initialRadius * 1.6),
        y: startY,
        angle: 0
      });
    }

    state.player = {
      id: 'player',
      name: 'Hero Snake',
      color: playerColor,
      headColor: playerHeadColor,
      isNPC: false,
      segments: initialSegments,
      angle: 0,
      targetAngle: 0,
      speed: 160,
      radius: initialRadius,
      shieldCharges: shieldCharges,
      magnetismRadius: magnetismRadius,
      fruitSenseRange: fruitSenseRange,
      ghostTailCount: ghostTailCount,
      tailGrowthTimer: 0,
      lastDecisionTime: 0,
      score: 0
    };

    // Set up fruits
    const initialFruits: Fruit[] = [];
    for (let i = 0; i < NUM_FRUITS; i++) {
      initialFruits.push(spawnFruit());
    }
    state.fruits = initialFruits;

    // Set up NPC snakes
    const npcColors = [
      { color: '#ef4444', head: '#f87171', name: 'Gorgon' },
      { color: '#f97316', head: '#fb923c', name: 'Naga' },
      { color: '#eab308', head: '#facc15', name: 'Adder' },
      { color: '#a855f7', head: '#c084fc', name: 'Sidewinder' },
      { color: '#ec4899', head: '#f472b6', name: 'Basilisk' },
      { color: '#3b82f6', head: '#60a5fa', name: 'Python' },
      { color: '#06b6d4', head: '#22d3ee', name: 'Anaconda' }
    ];

    const initialNPCs: Snake[] = [];
    for (let i = 0; i < NUM_NPCS; i++) {
      const colorSet = npcColors[i % npcColors.length];
      const npcRadius = 10 + Math.random() * 3;
      const npcX = Math.random() * (MAP_WIDTH - 200) + 100;
      const npcY = Math.random() * (MAP_HEIGHT - 200) + 100;
      const npcAngle = Math.random() * Math.PI * 2;
      
      const npcSegments: Segment[] = [];
      const len = 4 + Math.floor(Math.random() * 6); // initial length 4-9
      for (let s = 0; s < len; s++) {
        npcSegments.push({
          x: npcX - Math.cos(npcAngle) * s * (npcRadius * 1.6),
          y: npcY - Math.sin(npcAngle) * s * (npcRadius * 1.6),
          angle: npcAngle
        });
      }

      initialNPCs.push({
        id: `npc-${i}`,
        name: `${colorSet.name} ${i + 1}`,
        color: colorSet.color,
        headColor: colorSet.head,
        isNPC: true,
        segments: npcSegments,
        angle: npcAngle,
        targetAngle: npcAngle,
        speed: 110 + Math.random() * 30,
        radius: npcRadius,
        shieldCharges: 0,
        magnetismRadius: 0,
        fruitSenseRange: 0,
        ghostTailCount: 0,
        tailGrowthTimer: 0,
        lastDecisionTime: 0,
        score: 0
      });
    }
    state.npcs = initialNPCs;
    state.acidDrops = [];
    state.timeLeft = gameDuration;
    state.score = 0;
    state.peakLength = 5;

    // Propagate starting metrics
    onUpdateMetrics({ currentLength: 5, peakLength: 5, score: 0 });

  }, [playerColor, playerHeadColor, gameDuration]);

  // Sync evolution props to ref state dynamically (without resetting the game)
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

  // Handle high-dpi canvas scaling and window resize observing
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      stateRef.current.dimensions = {
        width: rect.width,
        height: rect.height
      };
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // call initially

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controls Event Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      stateRef.current.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Spawns a fruit at a random location away from border
  const spawnFruit = (): Fruit => {
    const r = Math.random();
    const isGolden = r < 0.08; // 8% chance to spawn golden fruit
    return {
      id: Math.random().toString(),
      x: Math.random() * (MAP_WIDTH - 120) + 60,
      y: Math.random() * (MAP_HEIGHT - 120) + 60,
      color: isGolden ? '#fbbf24' : ['#ef4444', '#10b981', '#3b82f6', '#ec4899', '#f43f5e'][Math.floor(Math.random() * 5)],
      points: isGolden ? 3 : 1,
      isGolden,
      pulseScale: 1 + Math.random() * 0.2
    };
  };

  // Main Loop logic using requestAnimationFrame
  useEffect(() => {
    let animId: number;
    let tickAccumulator = 0;

    const gameLoop = (timestamp: number) => {
      const state = stateRef.current;
      
      if (!state.lastTime) {
        state.lastTime = timestamp;
      }
      
      let dt = (timestamp - state.lastTime) / 1000;
      state.lastTime = timestamp;
      
      // Cap dt to prevent massive jump after freeze
      if (dt > 0.1) dt = 0.1;

      if (!isPaused && state.timeLeft > 0) {
        // Run countdown timer tick
        tickAccumulator += dt;
        if (tickAccumulator >= 1.0) {
          state.timeLeft = Math.max(0, state.timeLeft - 1);
          onTick(state.timeLeft);
          tickAccumulator -= 1.0;
          
          if (state.timeLeft <= 0) {
            onGameOver();
          }
        }

        // Update Game Simulation
        updatePhysics(dt);
        checkCollisions();
      }

      // Render Scene
      drawGame();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, speedMultiplier, tailGrowthLevel, venomTrailLevel]);

  // Core physics simulation
  const updatePhysics = (dt: number) => {
    const state = stateRef.current;
    if (!state.player || state.player.segments.length === 0) return;

    // --- PLAYER MOVEMENT ---
    const player = state.player;
    const currentHead = player.segments[0];

    if (controlType === 'mouse') {
      // Mouse angle calculation relative to screen viewport center
      const centerX = state.dimensions.width / 2;
      const centerY = state.dimensions.height / 2;
      const dx = state.mousePos.x - centerX;
      const dy = state.mousePos.y - centerY;
      
      // Only change target angle if mouse is not directly on top of head
      if (Math.sqrt(dx * dx + dy * dy) > 15) {
        player.targetAngle = Math.atan2(dy, dx);
      }
    } else {
      // Keyboard Angle Calculations (Arrow Keys / WASD)
      let dx = 0;
      let dy = 0;
      if (state.keys['w'] || state.keys['arrowup']) dy = -1;
      if (state.keys['s'] || state.keys['arrowdown']) dy = 1;
      if (state.keys['a'] || state.keys['arrowleft']) dx = -1;
      if (state.keys['d'] || state.keys['arrowright']) dx = 1;

      if (dx !== 0 || dy !== 0) {
        player.targetAngle = Math.atan2(dy, dx);
      }
    }

    // Smooth turn angle towards target angle
    let angleDiff = player.targetAngle - player.angle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    const playerTurnSpeed = 5.2; // Radians/sec
    player.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), playerTurnSpeed * dt);
    player.angle = (player.angle + Math.PI * 2) % (Math.PI * 2);

    // Calculate current dynamic speed with evolutions
    let activeSpeed = (player.speed + (state.score * 0.8)) * speedMultiplier;
    if (player.isSlowing) {
      activeSpeed *= 0.5;
    }

    // Move Player Head
    currentHead.x += Math.cos(player.angle) * activeSpeed * dt;
    currentHead.y += Math.sin(player.angle) * activeSpeed * dt;

    // Hard Boundary Containment
    currentHead.x = Math.max(player.radius, Math.min(MAP_WIDTH - player.radius, currentHead.x));
    currentHead.y = Math.max(player.radius, Math.min(MAP_HEIGHT - player.radius, currentHead.y));

    // Follow Body Segments
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

    // --- REGEN TAIL EVOLUTION ---
    if (tailGrowthLevel > 0) {
      player.tailGrowthTimer += dt;
      const cooldown = 16 - tailGrowthLevel * 3; // Lvl 1: 13s, Lvl 2: 10s, Lvl 3: 7s
      if (player.tailGrowthTimer >= cooldown) {
        player.tailGrowthTimer = 0;
        // Auto grow one tail segment
        const lastSeg = player.segments[player.segments.length - 1];
        player.segments.push({
          x: lastSeg.x - Math.cos(lastSeg.angle) * player.radius,
          y: lastSeg.y - Math.sin(lastSeg.angle) * player.radius,
          angle: lastSeg.angle
        });
        
        // Trigger React UI metrics update
        onUpdateMetrics({
          currentLength: player.segments.length,
          peakLength: Math.max(state.peakLength, player.segments.length),
          score: state.score
        });
        state.peakLength = Math.max(state.peakLength, player.segments.length);
      }
    }

    // --- ACID TRAIL SPAWNER ---
    if (venomTrailLevel > 0) {
      const now = Date.now();
      if (now - state.lastAcidTick > 450) { // spawn every 450ms
        state.lastAcidTick = now;
        const tailSeg = player.segments[player.segments.length - 1];
        state.acidDrops.push({
          x: tailSeg.x,
          y: tailSeg.y,
          timer: 5 + venomTrailLevel * 2, // drops stay on map for 5-11 seconds
          radius: 8 + venomTrailLevel * 1.5
        });
      }
    }

    // Update acid drops timers
    state.acidDrops = state.acidDrops.filter(drop => {
      drop.timer -= dt;
      return drop.timer > 0;
    });

    // --- NPC snakes movement and AI ---
    state.npcs.forEach(npc => {
      const now = Date.now();
      const npcHead = npc.segments[0];

      // Slow timers
      if (npc.isSlowing && npc.slowTimer) {
        npc.slowTimer -= dt;
        if (npc.slowTimer <= 0) {
          npc.isSlowing = false;
        }
      }

      // 1. AI Decision interval (0.4s to 0.8s)
      if (now - npc.lastDecisionTime > (400 + Math.random() * 400)) {
        npc.lastDecisionTime = now;

        // Hunt fruits or avoid walls
        let closestFruit: Fruit | null = null;
        let minDist = 450; // Sight range

        state.fruits.forEach(fruit => {
          const dx = fruit.x - npcHead.x;
          const dy = fruit.y - npcHead.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) {
            minDist = d;
            closestFruit = fruit;
          }
        });

        // Steer away from walls
        const wallBuffer = 120;
        let avoidWallAngle = -1;
        if (npcHead.x < wallBuffer) avoidWallAngle = 0; // steer right
        else if (npcHead.x > MAP_WIDTH - wallBuffer) avoidWallAngle = Math.PI; // steer left
        else if (npcHead.y < wallBuffer) avoidWallAngle = Math.PI / 2; // steer down
        else if (npcHead.y > MAP_HEIGHT - wallBuffer) avoidWallAngle = -Math.PI / 2; // steer up

        if (avoidWallAngle !== -1) {
          npc.targetAngle = avoidWallAngle + (Math.random() * 0.6 - 0.3);
        } else if (closestFruit) {
          const f: Fruit = closestFruit;
          npc.targetAngle = Math.atan2(f.y - npcHead.y, f.x - npcHead.x);
        } else {
          // Wander with gentle turn
          npc.targetAngle += (Math.random() * 1.2 - 0.6);
        }
      }

      // Smooth rotate NPC
      let npcAngleDiff = npc.targetAngle - npc.angle;
      while (npcAngleDiff < -Math.PI) npcAngleDiff += Math.PI * 2;
      while (npcAngleDiff > Math.PI) npcAngleDiff -= Math.PI * 2;

      const npcTurnSpeed = 4.2;
      npc.angle += Math.sign(npcAngleDiff) * Math.min(Math.abs(npcAngleDiff), npcTurnSpeed * dt);
      npc.angle = (npc.angle + Math.PI * 2) % (Math.PI * 2);

      let npcSpeed = npc.speed;
      if (npc.isSlowing) {
        npcSpeed *= 0.4; // heavy slow by poison
      }

      // Move NPC head
      npcHead.x += Math.cos(npc.angle) * npcSpeed * dt;
      npcHead.y += Math.sin(npc.angle) * npcSpeed * dt;

      // Keep inside map
      npcHead.x = Math.max(npc.radius, Math.min(MAP_WIDTH - npc.radius, npcHead.x));
      npcHead.y = Math.max(npc.radius, Math.min(MAP_HEIGHT - npc.radius, npcHead.y));

      // Follow NPC segments
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

  // Check Collisions
  const checkCollisions = () => {
    const state = stateRef.current;
    if (!state.player || state.player.segments.length === 0) return;

    const player = state.player;
    const playerHead = player.segments[0];

    // --- FRUIT MAGNETISM ATTRACTOR ---
    if (player.magnetismRadius > 0) {
      state.fruits.forEach(fruit => {
        const dx = playerHead.x - fruit.x;
        const dy = playerHead.y - fruit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= player.magnetismRadius) {
          // Pull fruit towards head smoothly
          const pullSpeed = 160 + (magnetismRadius * 15); // pulled faster for higher levels
          const angle = Math.atan2(dy, dx);
          fruit.x += Math.cos(angle) * pullSpeed * 0.016; // rough 60fps tick approximation
          fruit.y += Math.sin(angle) * pullSpeed * 0.016;
        }
      });
    }

    // --- COLLISION: SNAKES VS FRUITS ---
    state.fruits = state.fruits.map(fruit => {
      // 1. Check Player head eats fruit
      let dx = playerHead.x - fruit.x;
      let dy = playerHead.y - fruit.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < player.radius + 10) {
        // Player eats
        state.score += fruit.points;
        onFruitEaten(); // tells App.tsx to level progress or trigger cards modal
        
        // Grow segments
        const lastSeg = player.segments[player.segments.length - 1];
        for (let g = 0; g < fruit.points; g++) {
          player.segments.push({
            x: lastSeg.x - Math.cos(lastSeg.angle) * player.radius,
            y: lastSeg.y - Math.sin(lastSeg.angle) * player.radius,
            angle: lastSeg.angle
          });
        }

        const newPeak = Math.max(state.peakLength, player.segments.length);
        state.peakLength = newPeak;
        onUpdateMetrics({ currentLength: player.segments.length, peakLength: newPeak, score: state.score });

        // Flash screen slightly for golden fruit
        if (fruit.isGolden) {
          setLevelUpFlash(true);
          setTimeout(() => setLevelUpFlash(false), 200);
        }

        return spawnFruit(); // respawn
      }

      // 2. Check NPC heads eat fruit
      for (let n = 0; n < state.npcs.length; n++) {
        const npc = state.npcs[n];
        const npcHead = npc.segments[0];
        dx = npcHead.x - fruit.x;
        dy = npcHead.y - fruit.y;
        dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < npc.radius + 10) {
          // NPC eats
          npc.score += fruit.points;
          const npcLastSeg = npc.segments[npc.segments.length - 1];
          for (let g = 0; g < fruit.points; g++) {
            npc.segments.push({
              x: npcLastSeg.x - Math.cos(npcLastSeg.angle) * npc.radius,
              y: npcLastSeg.y - Math.sin(npcLastSeg.angle) * npc.radius,
              angle: npcLastSeg.angle
            });
          }
          return spawnFruit(); // respawn
        }
      }

      return fruit;
    });

    // --- COLLISION: NPC HEADS VS PLAYER VENOM TRAILS ---
    if (state.acidDrops.length > 0) {
      state.npcs.forEach(npc => {
        const npcHead = npc.segments[0];
        state.acidDrops.forEach(drop => {
          const dx = npcHead.x - drop.x;
          const dy = npcHead.y - drop.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < npc.radius + drop.radius) {
            npc.isSlowing = true;
            npc.slowTimer = 4.0; // slowed for 4 seconds!
          }
        });
      });
    }

    // --- SEGMENT STEAL COLLISIONS (THE MASTER ROGUELIKE MECHANIC) ---
    
    // NPC heads vs Player joint circles (NPC steals player's tail)
    state.npcs.forEach(npc => {
      const npcHead = npc.segments[0];
      
      // We skip the player head (index 0) because head-to-head collisions can be handles separately or bounce
      for (let j = 1; j < player.segments.length; j++) {
        const playerJoint = player.segments[j];
        const dx = npcHead.x - playerJoint.x;
        const dy = npcHead.y - playerJoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < npc.radius + player.radius) {
          // NPC contacting player joint!
          
          // A. Is this segment protected by Ghost Tail?
          if (player.ghostTailCount > 0 && j >= player.segments.length - player.ghostTailCount) {
            continue; // Immune! Ghost segment!
          }

          // B. Does the player have Node Armor shield charges?
          if (player.shieldCharges > 0) {
            onShieldConsumed(); // triggers prop change down from parent
            player.shieldCharges -= 1; // local state backup protection
            
            // Visual bounce NPC away to prevent immediate double hit
            npc.angle = (npc.angle + Math.PI) % (Math.PI * 2);
            npc.targetAngle = npc.angle;
            
            // Play quick flash
            setLevelUpFlash(true);
            setTimeout(() => setLevelUpFlash(false), 120);
            return; // blocked!
          }

          // C. STEAL OCCURS! NPC steals segment j and everything behind it
          const stolenSegments = player.segments.slice(j);
          player.segments = player.segments.slice(0, j);

          // Force player to maintain head + 1 tail segment
          if (player.segments.length < 2) {
            const head = player.segments[0];
            player.segments = [
              head,
              { x: head.x - Math.cos(player.angle) * player.radius, y: head.y - Math.sin(player.angle) * player.radius, angle: player.angle }
            ];
          }

          // Append segments to the thief NPC
          stolenSegments.forEach(seg => {
            const lastNpcSeg = npc.segments[npc.segments.length - 1];
            npc.segments.push({
              x: lastNpcSeg.x,
              y: lastNpcSeg.y,
              angle: seg.angle
            });
          });

          onUpdateMetrics({
            currentLength: player.segments.length,
            peakLength: state.peakLength,
            score: state.score
          });

          // Steer npc away victoriously
          npc.angle = (npc.angle + Math.PI / 2) % (Math.PI * 2);
          npc.targetAngle = npc.angle;
        }
      }
    });

    // Player head vs NPC joint circles (Player steals NPC's tail!)
    state.npcs.forEach(npc => {
      // Loop over NPC joints (index 1 to end)
      for (let j = 1; j < npc.segments.length; j++) {
        const npcJoint = npc.segments[j];
        const dx = playerHead.x - npcJoint.x;
        const dy = playerHead.y - npcJoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius + npc.radius) {
          // PLAYER STEALS FROM NPC! Beautiful counterplay.
          const stolenFromNpc = npc.segments.slice(j);
          npc.segments = npc.segments.slice(0, j);

          // Keep minimum NPC structure (head + 1 tail segment)
          if (npc.segments.length < 2) {
            const head = npc.segments[0];
            npc.segments = [
              head,
              { x: head.x - Math.cos(npc.angle) * npc.radius, y: head.y - Math.sin(npc.angle) * npc.radius, angle: npc.angle }
            ];
          }

          // Append to player
          stolenFromNpc.forEach(seg => {
            const lastPlayerSeg = player.segments[player.segments.length - 1];
            player.segments.push({
              x: lastPlayerSeg.x,
              y: lastPlayerSeg.y,
              angle: seg.angle
            });
          });

          // Update game stats
          const newPeak = Math.max(state.peakLength, player.segments.length);
          state.peakLength = newPeak;
          onUpdateMetrics({
            currentLength: player.segments.length,
            peakLength: newPeak,
            score: state.score
          });

          // Push player forward dynamically
          player.angle = (player.angle + Math.PI / 4) % (Math.PI * 2);
          player.targetAngle = player.angle;
        }
      }
    });

    // NPC heads vs NPC joint circles (NPCs battle each other!)
    for (let i = 0; i < state.npcs.length; i++) {
      const npcThief = state.npcs[i];
      const thiefHead = npcThief.segments[0];

      for (let k = 0; k < state.npcs.length; k++) {
        if (i === k) continue; // skip self
        const npcVictim = state.npcs[k];

        for (let j = 1; j < npcVictim.segments.length; j++) {
          const victimJoint = npcVictim.segments[j];
          const dx = thiefHead.x - victimJoint.x;
          const dy = thiefHead.y - victimJoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < npcThief.radius + npcVictim.radius) {
            // Cut victim
            const stolen = npcVictim.segments.slice(j);
            npcVictim.segments = npcVictim.segments.slice(0, j);

            if (npcVictim.segments.length < 2) {
              const head = npcVictim.segments[0];
              npcVictim.segments = [
                head,
                { x: head.x - Math.cos(npcVictim.angle) * npcVictim.radius, y: head.y - Math.sin(npcVictim.angle) * npcVictim.radius, angle: npcVictim.angle }
              ];
            }

            // Give to thief
            stolen.forEach(seg => {
              const lastSeg = npcThief.segments[npcThief.segments.length - 1];
              npcThief.segments.push({
                x: lastSeg.x,
                y: lastSeg.y,
                angle: seg.angle
              });
            });

            // steer thief away
            npcThief.angle = (npcThief.angle + Math.PI / 2) % (Math.PI * 2);
            npcThief.targetAngle = npcThief.angle;
          }
        }
      }
    }
  };

  // --- HTML CANVAS RENDERING ENGINE ---
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;
    if (!state.player || state.player.segments.length === 0) return;

    const player = state.player;
    const playerHead = player.segments[0];

    // Clear Screen
    ctx.clearRect(0, 0, state.dimensions.width, state.dimensions.height);

    // Save Context for camera transformations
    ctx.save();

    // Camera follow calculation: Center viewport smoothly on player head
    const cameraX = state.dimensions.width / 2 - playerHead.x;
    const cameraY = state.dimensions.height / 2 - playerHead.y;
    ctx.translate(cameraX, cameraY);

    // --- 1. DRAW ARENA BOUNDARIES AND GRID ---
    ctx.fillStyle = '#090d16'; // Deep background slate
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Grid lines
    ctx.strokeStyle = '#1e293b'; // Slate grid lines
    ctx.lineWidth = 1.2;
    const gridSize = 100;

    ctx.beginPath();
    for (let x = 0; x <= MAP_WIDTH; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAP_HEIGHT);
    }
    for (let y = 0; y <= MAP_HEIGHT; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(MAP_WIDTH, y);
    }
    ctx.stroke();

    // Map Glowing Borders
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // Emerald border glow
    ctx.lineWidth = 6;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 15;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    // Clear shadow state for next elements (crucial for performance)
    ctx.shadowBlur = 0;

    // --- 2. DRAW ACID TRAILS ---
    state.acidDrops.forEach(drop => {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.22)'; // Orange toxic gas
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(249, 115, 22, 0.7)'; // Acid drop core
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- 3. DRAW FRUITS ---
    state.fruits.forEach(fruit => {
      // Pulse animation
      const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.12 * fruit.pulseScale;
      const fruitRad = (fruit.isGolden ? 12 : 8) * pulse;

      // Outer glow
      ctx.save();
      ctx.shadowColor = fruit.color;
      ctx.shadowBlur = fruit.isGolden ? 18 : 10;
      ctx.fillStyle = fruit.color;
      ctx.beginPath();
      ctx.arc(fruit.x, fruit.y, fruitRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Golden Halo Star burst
      if (fruit.isGolden) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruitRad * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // --- 4. DRAW NPC SNAKES ---
    state.npcs.forEach(npc => {
      // Draw tail connection tube line first (under joint circles)
      ctx.strokeStyle = npc.color;
      ctx.lineWidth = npc.radius * 1.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      npc.segments.forEach((seg, idx) => {
        if (idx === 0) ctx.moveTo(seg.x, seg.y);
        else ctx.lineTo(seg.x, seg.y);
      });
      ctx.stroke();

      // Draw Joint Circles on all segments except head
      npc.segments.forEach((seg, idx) => {
        if (idx === 0) return; // skip head

        // Joint circle
        ctx.fillStyle = '#111827'; // Dark center
        ctx.strokeStyle = npc.color; // Colored joint ring
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, npc.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Connected center dot
        ctx.fillStyle = npc.color;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, npc.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Head
      const head = npc.segments[0];
      ctx.fillStyle = npc.headColor;
      ctx.beginPath();
      ctx.arc(head.x, head.y, npc.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // NPC Eyes (Expressive angry slit eyes)
      const eyeOffsetAngle = 0.55; // Angle off-center of heading
      const eyeDist = npc.radius * 0.8;
      
      const leftEyeX = head.x + Math.cos(npc.angle - eyeOffsetAngle) * eyeDist;
      const leftEyeY = head.y + Math.sin(npc.angle - eyeOffsetAngle) * eyeDist;
      const rightEyeX = head.x + Math.cos(npc.angle + eyeOffsetAngle) * eyeDist;
      const rightEyeY = head.y + Math.sin(npc.angle + eyeOffsetAngle) * eyeDist;

      // Draw white eye balls
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 3.5, 0, Math.PI * 2);
      ctx.arc(rightEyeX, rightEyeY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw red iris angry pupils
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(leftEyeX + Math.cos(npc.angle) * 1, leftEyeY + Math.sin(npc.angle) * 1, 1.5, 0, Math.PI * 2);
      ctx.arc(rightEyeX + Math.cos(npc.angle) * 1, rightEyeY + Math.sin(npc.angle) * 1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Slither crowns for NPCs (visual name identifier)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, head.x, head.y - npc.radius * 2);
    });

    // --- 5. DRAW PLAYER SNAKE ---
    // Draw tail connection line tube
    ctx.strokeStyle = player.color;
    ctx.lineWidth = player.radius * 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    player.segments.forEach((seg, idx) => {
      if (idx === 0) ctx.moveTo(seg.x, seg.y);
      else ctx.lineTo(seg.x, seg.y);
    });
    ctx.stroke();

    // Draw Joint Circles on Player segments except head
    player.segments.forEach((seg, idx) => {
      if (idx === 0) return; // skip head

      // Check if this segment falls inside the Ghost Tail segment protection
      const isGhostSegment = player.ghostTailCount > 0 && idx >= player.segments.length - player.ghostTailCount;

      ctx.save();
      if (isGhostSegment) {
        ctx.globalAlpha = 0.35; // transparent look
      }

      // Joint circle
      ctx.fillStyle = '#0b0f19'; // dark slate core
      ctx.strokeStyle = isGhostSegment ? '#6366f1' : player.color; // Ghost uses glowing purple
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, player.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner connecting joint node dot
      ctx.fillStyle = isGhostSegment ? '#818cf8' : '#ffffff';
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, player.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // If armored (Node Armor / Shield active), draw a small glowing barrier halo on active joints!
      if (player.shieldCharges > 0 && !isGhostSegment && idx % 2 === 1) {
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)'; // glowing emerald aura
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, player.radius * 1.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Draw Player Head
    ctx.fillStyle = player.headColor;
    ctx.beginPath();
    ctx.arc(playerHead.x, playerHead.y, player.radius * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // Draw Player Outer outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(playerHead.x, playerHead.y, player.radius * 1.45, 0, Math.PI * 2);
    ctx.stroke();

    // Player eyes (Friendly/Cool slitherer eyes)
    const pEyeOffset = 0.52;
    const pEyeDist = player.radius * 0.85;
    
    const pLeftX = playerHead.x + Math.cos(player.angle - pEyeOffset) * pEyeDist;
    const pLeftY = playerHead.y + Math.sin(player.angle - pEyeOffset) * pEyeDist;
    const pRightX = playerHead.x + Math.cos(player.angle + pEyeOffset) * pEyeDist;
    const pRightY = playerHead.y + Math.sin(player.angle + pEyeOffset) * pEyeDist;

    // Eyeballs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pLeftX, pLeftY, 4.2, 0, Math.PI * 2);
    ctx.arc(pRightX, pRightY, 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Shiny black pupils pointing where player is turning
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pLeftX + Math.cos(player.angle) * 1.5, pLeftY + Math.sin(player.angle) * 1.5, 2.0, 0, Math.PI * 2);
    ctx.arc(pRightX + Math.cos(player.angle) * 1.5, pRightY + Math.sin(player.angle) * 1.5, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Magnetism aura ring if active
    if (player.magnetismRadius > 0) {
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerHead.x, playerHead.y, player.magnetismRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Restore viewport translation
    ctx.restore();

    // --- 6. DRAW OFF-SCREEN FRUIT SENSE POINTERS ---
    if (player.fruitSenseRange > 0) {
      state.fruits.forEach(fruit => {
        // Calculate distance from player head to fruit
        const dx = fruit.x - playerHead.x;
        const dy = fruit.y - playerHead.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If nearby but outside screen bounds
        if (dist > 300 && dist <= player.fruitSenseRange) {
          // Check screen border cross point
          const angle = Math.atan2(dy, dx);
          
          // Position pointer on a circle of radius 140 relative to viewport center
          const centerX = state.dimensions.width / 2;
          const centerY = state.dimensions.height / 2;
          const pointerRadius = Math.min(centerX, centerY) - 35;
          
          const ptrX = centerX + Math.cos(angle) * pointerRadius;
          const ptrY = centerY + Math.sin(angle) * pointerRadius;

          // Draw small navigation chevron arrow
          ctx.save();
          ctx.translate(ptrX, ptrY);
          ctx.rotate(angle);

          // Pointer body
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
      className={`w-full h-full relative overflow-hidden select-none cursor-crosshair bg-[#030712] ${
        levelUpFlash ? 'brightness-125 saturate-150 transition-all duration-75' : ''
      }`}
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full"
      />

      {/* Screen Boundary Warning Indicator */}
      {stateRef.current.player && stateRef.current.player.segments[0] && (
        (() => {
          const head = stateRef.current.player.segments[0];
          const nearBorder = head.x < 150 || head.x > MAP_WIDTH - 150 || head.y < 150 || head.y > MAP_HEIGHT - 150;
          if (nearBorder) {
            return (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] uppercase font-black tracking-widest pointer-events-none rounded-full animate-pulse select-none">
                ⚠️ Warning: Approaching Magnetic Shield Boundary ⚠️
              </div>
            );
          }
          return null;
        })()
      )}
    </div>
  );
}
