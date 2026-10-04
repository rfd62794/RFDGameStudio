/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActiveCoin, BoardObject, CoinType, LevelSettings, BoardTheme } from '../types';
import { COIN_TYPES } from '../data';
import { sound } from '../sound';

interface CoinPusherGameProps {
  level: LevelSettings;
  theme: BoardTheme;
  unlockedCoins: CoinType[];
  onCoinPushed: (coinValue: number, isPocket: boolean, pocketTypeId?: string) => void;
  onGutterCoin: () => void;
  onComboTriggered: (comboCount: number) => void;
  onBoardStateChange: (activeCount: number, isSettled: boolean) => void;
  pocketCoinToDrop: string | null; // typeId of pocket coin to drop
  onPocketCoinDropped: () => void;
  // Trigger animations from parent
  triggerCoinBird: boolean;
  onCoinBirdTriggered: () => void;
  triggerCoinTower: boolean;
  onCoinTowerTriggered: () => void;
  triggerBumper: boolean;
  onBumperTriggered: () => void;
  triggerMultiplierPad: boolean;
  onMultiplierPadTriggered: () => void;
  triggerGutterShield: boolean;
  onGutterShieldTriggered: () => void;
  onGutterShieldActiveState: (active: boolean) => void;
  isMuted: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  size: number;
}

export default function CoinPusherGame({
  level,
  theme,
  unlockedCoins,
  onCoinPushed,
  onGutterCoin,
  onComboTriggered,
  onBoardStateChange,
  pocketCoinToDrop,
  onPocketCoinDropped,
  triggerCoinBird,
  onCoinBirdTriggered,
  triggerCoinTower,
  onCoinTowerTriggered,
  triggerBumper,
  onBumperTriggered,
  triggerMultiplierPad,
  onMultiplierPadTriggered,
  triggerGutterShield,
  onGutterShieldTriggered,
  onGutterShieldActiveState,
  isMuted,
}: CoinPusherGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep a ref to all physics state to run smoothly inside requestAnimationFrame
  const stateRef = useRef<{
    coins: ActiveCoin[];
    objects: BoardObject[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    pusherY: number;
    pusherDirection: number; // 1 = down, -1 = up
    time: number;
    screenshake: number;
    gutterShieldTimer: number; // in frames or ms
    // Coin bird flight state
    birdActive: boolean;
    birdX: number;
    birdY: number;
    birdDirection: number;
    birdDropsLeft: number;
    birdLastDropTime: number;
    // Drag/hover placement state
    hoverX: number | null;
    // Timestamp trackers for combo window
    recentFalls: number[];
  }>({
    coins: [],
    objects: [],
    particles: [],
    floatingTexts: [],
    pusherY: 30,
    pusherDirection: 1,
    time: 0,
    screenshake: 0,
    gutterShieldTimer: 0,
    birdActive: false,
    birdX: 0,
    birdY: 50,
    birdDirection: 1,
    birdDropsLeft: 0,
    birdLastDropTime: 0,
    hoverX: null,
    recentFalls: [],
  });

  const [mouseHoverX, setMouseHoverX] = useState<number | null>(null);

  // Initialize starting coins on the board
  useEffect(() => {
    const state = stateRef.current;
    state.coins = [];
    state.objects = [];
    state.particles = [];
    state.floatingTexts = [];
    state.recentFalls = [];
    state.gutterShieldTimer = 0;
    state.birdActive = false;

    // Place some default objects
    // Regular metallic pegs
    const numPegs = 5 + level.level * 2;
    for (let i = 0; i < numPegs; i++) {
      state.objects.push({
        id: `peg-${i}`,
        type: 'peg',
        x: level.boardWidth * 0.15 + Math.random() * (level.boardWidth * 0.7),
        y: 160 + Math.random() * 100,
        radius: 6,
        color: '#94a3b8',
      });
    }

    // Place initial coins scattered on the lower half (pre-filled board)
    const activeUnlocked = unlockedCoins.length > 0 ? unlockedCoins : COIN_TYPES.slice(0, 3);
    for (let i = 0; i < level.startingCoinsCount; i++) {
      const type = activeUnlocked[Math.floor(Math.random() * activeUnlocked.length)];
      // Random position on the lower shelf
      const margin = level.gutterWidth + 25;
      const rx = margin + Math.random() * (level.boardWidth - margin * 2);
      const ry = 190 + Math.random() * 210;

      state.coins.push({
        id: `start-coin-${i}-${Math.random()}`,
        typeId: type.id,
        x: rx,
        y: ry,
        vx: 0,
        vy: 0,
        radius: type.radius,
        color: type.color,
        borderColor: type.borderColor,
        textColor: type.textColor,
        mass: type.mass,
        value: type.value,
        glow: type.glow,
        scale: 1,
        alpha: 1,
      });
    }

    // Run a quick simulation of 30 steps to settle the initial board
    const iterations = 5;
    for (let step = 0; step < 50; step++) {
      // Apply slide gravity and damping
      for (const c of state.coins) {
        c.vy += 0.12;
        c.vx *= 0.82;
        c.vy *= 0.82;
      }
      
      // Resolve collisions
      for (let iter = 0; iter < iterations; iter++) {
        // Coin to Coin
        for (let i = 0; i < state.coins.length; i++) {
          for (let j = i + 1; j < state.coins.length; j++) {
            const c1 = state.coins[i];
            const c2 = state.coins[j];
            const dx = c2.x - c1.x;
            const dy = c2.y - c1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = c1.radius + c2.radius;
            if (dist < minDist) {
              const actualDist = dist === 0 ? 0.1 : dist;
              const overlap = minDist - actualDist;
              const nx = dx / actualDist;
              const ny = dy / actualDist;
              const totalMass = c1.mass + c2.mass;
              c1.x -= nx * overlap * (c2.mass / totalMass);
              c1.y -= ny * overlap * (c2.mass / totalMass);
              c2.x += nx * overlap * (c1.mass / totalMass);
              c2.y += ny * overlap * (c1.mass / totalMass);
            }
          }
        }
        
        // Wall boundaries for initial setup
        for (const c of state.coins) {
          const leftWall = level.gutterWidth + 5;
          const rightWall = level.boardWidth - level.gutterWidth - 5;
          if (c.x - c.radius < leftWall) c.x = leftWall + c.radius;
          if (c.x + c.radius > rightWall) c.x = rightWall - c.radius;
          if (c.y < 190) c.y = 190;
          if (c.y > 450) c.y = 450;
        }
      }
    }

    // Reset velocities to rest
    for (const c of state.coins) {
      c.vx = 0;
      c.vy = 0;
    }
  }, [level, unlockedCoins]);

  // Handle drops of special pocket coins
  useEffect(() => {
    if (pocketCoinToDrop) {
      const state = stateRef.current;
      const spawnX = state.hoverX !== null ? state.hoverX : level.boardWidth / 2;
      
      // Spawn corresponding pocket coin
      if (pocketCoinToDrop === 'tnt') {
        state.coins.push({
          id: `tnt-${Date.now()}`,
          typeId: 'tnt',
          x: spawnX,
          y: 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 3,
          radius: 18,
          color: '#dc2626', // Bright TNT Red
          borderColor: '#7f1d1d',
          textColor: '#ffffff',
          mass: 2.5,
          value: 0,
          isPocket: true,
          pocketTypeId: 'tnt',
          scale: 1,
          alpha: 1,
          glow: true,
        });
        sound.playDrop();
      } else if (pocketCoinToDrop === 'magnet') {
        state.coins.push({
          id: `magnet-${Date.now()}`,
          typeId: 'magnet',
          x: spawnX,
          y: 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 3,
          radius: 16,
          color: '#4f46e5', // Electro-blue
          borderColor: '#1e1b4b',
          textColor: '#ffffff',
          mass: 1.5,
          value: 0,
          isPocket: true,
          pocketTypeId: 'magnet',
          scale: 1,
          alpha: 1,
          glow: true,
        });
        sound.playDrop();
      } else if (pocketCoinToDrop === 'double_drop') {
        state.coins.push({
          id: `double-${Date.now()}`,
          typeId: 'double_drop',
          x: spawnX,
          y: 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 3,
          radius: 16,
          color: '#14b8a6', // Teal 500
          borderColor: '#115e59',
          textColor: '#ffffff',
          mass: 2.0,
          value: 2,
          isPocket: true,
          pocketTypeId: 'double_drop',
          scale: 1,
          alpha: 1,
          glow: true,
        });
        sound.playDrop();
      } else if (pocketCoinToDrop === 'giga_gold') {
        state.coins.push({
          id: `giga-${Date.now()}`,
          typeId: 'giga_gold',
          x: spawnX,
          y: 20,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 2,
          radius: 35, // Giant!
          color: '#fbbf24',
          borderColor: '#78350f',
          textColor: '#78350f',
          mass: 10.0, // Steamroller weight
          value: 50,
          isPocket: true,
          pocketTypeId: 'giga_gold',
          scale: 1,
          alpha: 1,
          glow: true,
        });
        sound.playDrop();
      }

      onPocketCoinDropped();
    }
  }, [pocketCoinToDrop, level, onPocketCoinDropped]);

  // Spawn Trigger: Coin Bird Reward
  useEffect(() => {
    if (triggerCoinBird) {
      const state = stateRef.current;
      state.birdActive = true;
      state.birdX = -40;
      state.birdY = 60 + Math.random() * 20;
      state.birdDirection = 1;
      state.birdDropsLeft = 6 + Math.floor(Math.random() * 3); // drops 6-8 coins
      state.birdLastDropTime = 0;
      
      // Floating banner text
      spawnFloatingText(level.boardWidth / 2, 100, 'COIN BIRD FLYING!', '#0ea5e9', 20);
      sound.playRefill();
      
      onCoinBirdTriggered();
    }
  }, [triggerCoinBird, level, onCoinBirdTriggered]);

  // Spawn Trigger: Coin Tower Reward
  useEffect(() => {
    if (triggerCoinTower) {
      const state = stateRef.current;
      
      // Place coin tower on the central board (Y around 260)
      const towerX = level.gutterWidth + 40 + Math.random() * (level.boardWidth - level.gutterWidth * 2 - 80);
      const towerY = 240 + Math.random() * 60;

      // Check if there is already a tower, if so remove it
      state.objects = state.objects.filter(obj => obj.type !== 'tower');

      state.objects.push({
        id: `tower-${Date.now()}`,
        type: 'tower',
        x: towerX,
        y: towerY,
        radius: 32, // Large target
        color: '#f97316',
        health: 3, // collapses on 3 hits
        maxHealth: 3,
      });

      spawnFloatingText(towerX, towerY - 40, 'COIN TOWER PLACED!', '#f97316', 16);
      sound.playRefill();

      onCoinTowerTriggered();
    }
  }, [triggerCoinTower, level, onCoinTowerTriggered]);

  // Spawn Trigger: Bumper Obstacle
  useEffect(() => {
    if (triggerBumper) {
      const state = stateRef.current;
      const bX = level.gutterWidth + 50 + Math.random() * (level.boardWidth - level.gutterWidth * 2 - 100);
      const bY = 220 + Math.random() * 100;

      state.objects.push({
        id: `bumper-${Date.now()}`,
        type: 'bumper',
        x: bX,
        y: bY,
        radius: 20,
        color: '#ec4899', // Pink
      });

      spawnFloatingText(bX, bY - 30, 'BOUNCY BUMPER!', '#ec4899', 15);
      sound.playRefill();

      onBumperTriggered();
    }
  }, [triggerBumper, level, onBumperTriggered]);

  // Spawn Trigger: Multiplier Pad
  useEffect(() => {
    if (triggerMultiplierPad) {
      const state = stateRef.current;
      const padX = level.gutterWidth + 60 + Math.random() * (level.boardWidth - level.gutterWidth * 2 - 120);
      const padY = 260 + Math.random() * 80;

      state.objects.push({
        id: `multiplier-${Date.now()}`,
        type: 'multiplier',
        x: padX,
        y: padY,
        radius: 18,
        color: '#eab308', // Gold
        multiplier: 2,
      });

      spawnFloatingText(padX, padY - 35, '+2x VALUE PAD!', '#eab308', 15);
      sound.playRefill();

      onMultiplierPadTriggered();
    }
  }, [triggerMultiplierPad, level, onMultiplierPadTriggered]);

  // Spawn Trigger: Gutter Shield
  useEffect(() => {
    if (triggerGutterShield) {
      const state = stateRef.current;
      state.gutterShieldTimer = 60 * 15; // 15 seconds at 60 FPS
      onGutterShieldActiveState(true);
      
      spawnFloatingText(level.boardWidth / 2, 200, 'GUTTER SHIELDS ONLINE!', '#22c55e', 18);
      sound.playRefill();

      onGutterShieldTriggered();
    }
  }, [triggerGutterShield, level, onGutterShieldTriggered, onGutterShieldActiveState]);

  // Spawn a floating text effect helper
  const spawnFloatingText = (x: number, y: number, text: string, color: string, size = 14) => {
    stateRef.current.floatingTexts.push({
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      vy: -1.2,
      text,
      color,
      alpha: 1.0,
      size,
    });
  };

  // Spawn sparkle particles helper
  const spawnParticles = (x: number, y: number, color: string, count = 8, force = 2.5) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * force;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5, // slight upward drift
        color,
        size: 3 + Math.random() * 4,
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
      });
    }
  };

  // Trigger explosion (TNT)
  const triggerExplosion = (x: number, y: number) => {
    stateRef.current.screenshake = 18;
    sound.playExplosion();

    // Spawn massive burst of red/orange particles
    spawnParticles(x, y, '#dc2626', 15, 4.5);
    spawnParticles(x, y, '#f97316', 15, 3.5);
    spawnParticles(x, y, '#eab308', 10, 2.5);

    // Floating text
    spawnFloatingText(x, y - 10, 'TNT BLAST!', '#ef4444', 22);

    // Force feedback on all coins within radius
    const explosionRadius = 160;
    const coins = stateRef.current.coins;
    
    for (const c of coins) {
      const dx = c.x - x;
      const dy = c.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < explosionRadius && dist > 1) {
        const forceFactor = (1 - dist / explosionRadius);
        const angle = Math.atan2(dy, dx);
        
        // Massive kick
        const kickPower = forceFactor * 14;
        c.vx += Math.cos(angle) * kickPower;
        c.vy += Math.sin(angle) * kickPower + 2; // push mostly downwards/outwards
      }
    }
  };

  // Trigger Electromagnetic Pulse (Magnet)
  const triggerMagnetPulse = (x: number, y: number) => {
    sound.playMagnet();
    stateRef.current.screenshake = 6;

    spawnParticles(x, y, '#4f46e5', 25, 3);
    spawnFloatingText(x, y - 10, 'MAGNETIC WAVE!', '#818cf8', 20);

    // Pull all coins toward the bottom center
    const coins = stateRef.current.coins;
    for (const c of coins) {
      // Pull force towards lower central shelf (e.g., target: X = boardWidth / 2, Y = 440)
      const targetX = level.boardWidth / 2;
      const targetY = 440;
      
      const dx = targetX - c.x;
      const dy = targetY - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 10) {
        c.vx += (dx / dist) * 4.5;
        c.vy += (dy / dist) * 7.5; // pull strongly downwards
      }
    }
  };

  // Drop Coin at a given X coordinate
  const dropCoinAt = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert screen coordinates to canvas coordinates
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    let clickX = (clientX - rect.left) * scaleX;

    // Bounds check within dropping funnel (funnel is usually constrained inside gutters at the top)
    const padding = level.gutterWidth + 15;
    if (clickX < padding) clickX = padding;
    if (clickX > level.boardWidth - padding) clickX = level.boardWidth - padding;

    // Let's choose a random coin type from unlocked pool to drop
    const activeUnlocked = unlockedCoins.length > 0 ? unlockedCoins : COIN_TYPES.slice(0, 3);
    const selectedType = activeUnlocked[Math.floor(Math.random() * activeUnlocked.length)];

    const state = stateRef.current;
    state.coins.push({
      id: `coin-${Date.now()}-${Math.random()}`,
      typeId: selectedType.id,
      x: clickX,
      y: 15,
      vx: (Math.random() - 0.5) * 1.0,
      vy: 2.5,
      radius: selectedType.radius,
      color: selectedType.color,
      borderColor: selectedType.borderColor,
      textColor: selectedType.textColor,
      mass: selectedType.mass,
      value: selectedType.value,
      glow: selectedType.glow,
      scale: 1,
      alpha: 1,
    });

    sound.playDrop();
    spawnParticles(clickX, 15, selectedType.color, 4, 1.2);
  };

  // Mouse Interaction handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    let rx = (e.clientX - rect.left) * scaleX;
    
    // clamp hover to drop boundary funnel
    const padding = level.gutterWidth + 15;
    if (rx < padding) rx = padding;
    if (rx > level.boardWidth - padding) rx = level.boardWidth - padding;

    setMouseHoverX(rx);
    stateRef.current.hoverX = rx;
  };

  const handleMouseLeave = () => {
    setMouseHoverX(null);
    stateRef.current.hoverX = null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If we have pocket coin to drop or are drops queue empty, we let parent handle clicks,
    // or we just drop a standard coin here.
    // Parent actually intercepts standard drops through clicks, but we trigger dropCoinAt here if valid.
  };

  // Expose standard dropping method for React App to invoke
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDropRequest = (e: CustomEvent<{ x: number }>) => {
      dropCoinAt(e.detail.x);
    };

    window.addEventListener('request-coin-drop' as any, onDropRequest as any);
    return () => {
      window.removeEventListener('request-coin-drop' as any, onDropRequest as any);
    };
  }, [level, unlockedCoins]);

  // Main Animation and Physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      const state = stateRef.current;
      state.time += 0.03;

      // 1. Pusher movement logic
      // Sinusoidal sweep. Stroke range = 55px. Base starts at 20px, moves between 20 and 75
      const stroke = 55;
      const minPusherY = 20;
      const targetPusherY = minPusherY + (Math.sin(state.time * level.pusherSpeed) + 1) * 0.5 * stroke;
      
      const prevPusherY = state.pusherY;
      state.pusherY = targetPusherY;
      const pusherMovingDown = state.pusherY > prevPusherY;

      // 2. Gutter shield timer decay
      if (state.gutterShieldTimer > 0) {
        state.gutterShieldTimer--;
        if (state.gutterShieldTimer === 0) {
          onGutterShieldActiveState(false);
          spawnFloatingText(level.boardWidth / 2, 200, 'GUTTER SHIELDS OFFLINE!', '#ef4444', 15);
        }
      }

      // 3. Coin Bird loop
      if (state.birdActive) {
        state.birdX += 3.5; // moves across the top
        
        // Spawn drops periodically
        if (state.birdDropsLeft > 0 && state.birdX > level.gutterWidth + 20 && state.birdX < level.boardWidth - level.gutterWidth - 20) {
          const now = Date.now();
          if (now - state.birdLastDropTime > 450) { // drop every 450ms
            state.birdLastDropTime = now;
            state.birdDropsLeft--;

            // Drop standard gold coin from bird position!
            state.coins.push({
              id: `bird-coin-${now}-${Math.random()}`,
              typeId: 'gold',
              x: state.birdX,
              y: state.birdY + 10,
              vx: (Math.random() - 0.5) * 1.5,
              vy: 2.5,
              radius: 14,
              color: '#fbbf24',
              borderColor: '#b45309',
              textColor: '#78350f',
              mass: 1.0,
              value: 1,
              scale: 1,
              alpha: 1,
            });
            sound.playDrop();
            spawnParticles(state.birdX, state.birdY + 10, '#fbbf24', 4, 1.0);
          }
        }

        if (state.birdX > level.boardWidth + 50) {
          state.birdActive = false;
        }
      }

      // 4. Update and apply physics to coins
      const coins = state.coins;
      let activeCoinsCount = 0;

      // Filter out coins that have completely fallen off
      state.coins = coins.filter(c => {
        // Apply gravity on a slant
        // Gravity is slightly weaker on the upper pusher plate, and stronger on the slide
        const gravity = c.y < 160 ? 0.08 : 0.14;
        c.vy += gravity;

        // Sluggish slide friction
        c.vx *= 0.82;
        c.vy *= 0.82;

        // Apply velocities
        c.x += c.vx;
        c.y += c.vy;

        // Count as "moving/active" if speed exceeds a threshold
        const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
        if (speed > 0.08 || c.y < 160) {
          activeCoinsCount++;
        }

        // PHYSICAL PUSHER IMPACT
        // If a coin center is above the current pusher edge, push it forward
        if (c.y - c.radius < state.pusherY) {
          c.y = state.pusherY + c.radius;
          // give it downward velocity if pusher is sweeping down
          if (pusherMovingDown) {
            c.vy = Math.max(c.vy, level.pusherSpeed * 2.2);
          }
          activeCoinsCount++;
        }

        // FALL OFF DETECTION
        // Main board is 500px tall. Falling off is past Y = 460
        if (c.y > 458) {
          // It's falling off!
          // Shrink and fade coin during the fall transition
          if (c.scale === undefined) c.scale = 1.0;
          if (c.alpha === undefined) c.alpha = 1.0;

          c.scale -= 0.05;
          c.alpha -= 0.05;
          c.vy += 0.4; // falls faster

          if (c.alpha <= 0 || c.scale <= 0) {
            // Coin has landed completely!
            // Check central winning edge vs. gutters
            const gutterShieldActive = state.gutterShieldTimer > 0;
            const leftGutterBoundary = level.gutterWidth;
            const rightGutterBoundary = level.boardWidth - level.gutterWidth;

            const isGutter = !gutterShieldActive && (c.x < leftGutterBoundary || c.x > rightGutterBoundary);

            if (isGutter) {
              // Loss / Gutter!
              onGutterCoin();
              sound.playClink();
              // Spawn a few gray gutter dust particles
              spawnParticles(c.x, 480, '#64748b', 4, 1.5);
            } else {
              // SCORE! Pushed off successfully
              onCoinPushed(c.value, !!c.isPocket, c.pocketTypeId);
              
              // Handle special pocket coin rewards upon falling
              if (c.isPocket) {
                if (c.pocketTypeId === 'tnt') {
                  triggerExplosion(c.x, 320); // Boom!
                } else if (c.pocketTypeId === 'magnet') {
                  triggerMagnetPulse(c.x, 320); // Magnet wave
                } else if (c.pocketTypeId === 'double_drop') {
                  // Handled in parent via onCoinPushed, just spawn lovely teal flares
                  spawnParticles(c.x, 460, '#14b8a6', 20, 3.5);
                  spawnFloatingText(c.x, 430, '+5 FREE DROPS!', '#14b8a6', 18);
                } else if (c.pocketTypeId === 'giga_gold') {
                  spawnParticles(c.x, 460, '#fbbf24', 35, 4.0);
                  spawnFloatingText(c.x, 420, 'GIGA SMASH (+50!)', '#fbbf24', 22);
                }
              } else {
                // Regular coin pushed off
                spawnParticles(c.x, 480, c.color, 10, 2.5);
              }

              // Register fall timestamp for Combo computation
              const now = Date.now();
              state.recentFalls.push(now);
              
              // Filter out timestamps older than combo window
              state.recentFalls = state.recentFalls.filter(t => now - t <= level.comboWindowMs);

              if (state.recentFalls.length >= 3) {
                // Combo triggered!
                const comboCount = state.recentFalls.length;
                onComboTriggered(comboCount);
                // Highlight combo text
                spawnFloatingText(c.x, 430, `${comboCount}x COMBO!`, '#f43f5e', 14 + comboCount * 1.5);
              } else {
                // Standard point float
                if (!c.isPocket) {
                  spawnFloatingText(c.x, 440, `+${c.value}`, c.color, 14);
                }
              }
            }
            return false; // remove coin from state
          }
        }

        return true;
      }
      );

      // 5. Update Board Objects state (collision with coins, health check)
      // Check for tower collapse
      state.objects = state.objects.filter(obj => {
        if (obj.pulseTimer && obj.pulseTimer > 0) {
          obj.pulseTimer--;
        }

        if (obj.type === 'tower' && obj.health !== undefined && obj.health <= 0) {
          // Collapse Tower! Spawns 12-15 active coins in a beautiful circular explosion
          const numSpawn = 12 + Math.floor(Math.random() * 4);
          for (let i = 0; i < numSpawn; i++) {
            const angle = (i / numSpawn) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
            const dist = 10 + Math.random() * 20;
            const spawnX = obj.x + Math.cos(angle) * dist;
            const spawnY = obj.y + Math.sin(angle) * dist;

            // Spawns gold coins flying outwards
            state.coins.push({
              id: `tower-gold-${Date.now()}-${i}`,
              typeId: 'gold',
              x: spawnX,
              y: spawnY,
              vx: Math.cos(angle) * (1.5 + Math.random() * 2.5),
              vy: Math.sin(angle) * (1.5 + Math.random() * 2.5) + 1.0,
              radius: 14,
              color: '#fbbf24',
              borderColor: '#b45309',
              textColor: '#78350f',
              mass: 1.0,
              value: 1,
              scale: 1,
              alpha: 1,
            });
          }

          state.screenshake = 10;
          sound.playExplosion();
          spawnParticles(obj.x, obj.y, '#f97316', 20, 3.0);
          spawnFloatingText(obj.x, obj.y - 20, 'TOWER COLLAPSED!', '#f97316', 18);
          return false; // remove tower
        }

        return true;
      });

      // 6. Run physics collision loops
      // Coins colliding with coins, walls, and board objects
      resolvePhysicsCollisions(state.coins, state.objects, state.gutterShieldTimer > 0, level.boardWidth, level.gutterWidth);

      // 7. Update Particles
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // slight gravity pull on debris
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;
        return p.alpha > 0;
      });

      // 8. Update Floating Texts
      state.floatingTexts = state.floatingTexts.filter(t => {
        t.y += t.vy;
        t.alpha -= 0.015;
        return t.alpha > 0;
      });

      // Trigger parent callback about board activity
      // settled = no active coins moving and drop bird finished
      const isSettled = activeCoinsCount === 0 && !state.birdActive;
      onBoardStateChange(state.coins.length, isSettled);

      // Decelerate screenshake
      if (state.screenshake > 0) {
        state.screenshake *= 0.88;
        if (state.screenshake < 0.2) state.screenshake = 0;
      }

      // 9. RENDER ALL CANVAS ELEMENTS
      ctx.save();
      // Apply screenshake
      if (state.screenshake > 0) {
        const dx = (Math.random() - 0.5) * state.screenshake;
        const dy = (Math.random() - 0.5) * state.screenshake;
        ctx.translate(dx, dy);
      }

      // Clear with background color
      ctx.fillStyle = theme.bgColor;
      ctx.fillRect(0, 0, level.boardWidth, 500);

      // Draw background board details (Grid lines for Depth feeling)
      ctx.strokeStyle = `${theme.accentColor}18`; // transparent accent
      ctx.lineWidth = 1;
      // Vertical grid lines converging slightly for a classic slant perspective
      const cols = 10;
      for (let i = 0; i <= cols; i++) {
        const ratio = i / cols;
        const topX = level.gutterWidth + ratio * (level.boardWidth - level.gutterWidth * 2);
        const bottomX = ratio * level.boardWidth;
        ctx.beginPath();
        ctx.moveTo(topX, 10);
        ctx.lineTo(bottomX, 460);
        ctx.stroke();
      }
      
      // Horizontal depth guides
      const rows = 8;
      for (let i = 0; i <= rows; i++) {
        const y = 10 + (450 / rows) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(level.boardWidth, y);
        ctx.stroke();
      }

      // DRAW GUTTER SHADOWS & ZONES (diagonal gutter lanes)
      const leftGutterX = level.gutterWidth;
      const rightGutterX = level.boardWidth - level.gutterWidth;

      // Draw Gutter Warning stripes
      ctx.save();
      ctx.fillStyle = '#1e1b4b'; // deep indigo/gray
      // Left gutter
      ctx.fillRect(0, 0, leftGutterX, 460);
      // Right gutter
      ctx.fillRect(rightGutterX, 0, level.boardWidth - rightGutterX, 460);

      // Caution stripes in gutters
      ctx.strokeStyle = '#e11d4822'; // translucent ruby warning
      ctx.lineWidth = 12;
      ctx.setLineDash([10, 15]);
      // Left stripes
      ctx.beginPath();
      ctx.moveTo(leftGutterX / 2, 0);
      ctx.lineTo(leftGutterX / 2, 460);
      ctx.stroke();
      // Right stripes
      ctx.beginPath();
      ctx.moveTo(rightGutterX + (level.boardWidth - rightGutterX) / 2, 0);
      ctx.lineTo(rightGutterX + (level.boardWidth - rightGutterX) / 2, 460);
      ctx.stroke();
      ctx.restore();

      // DRAW ACTIVE GUTTER SHIELDS
      if (state.gutterShieldTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#22c55e'; // neon green glow
        ctx.lineWidth = 8;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 15;
        
        // Left shield barrier
        ctx.beginPath();
        ctx.moveTo(leftGutterX, 10);
        ctx.lineTo(leftGutterX, 458);
        ctx.stroke();

        // Right shield barrier
        ctx.beginPath();
        ctx.moveTo(rightGutterX, 10);
        ctx.lineTo(rightGutterX, 458);
        ctx.stroke();
        ctx.restore();
      }

      // DRAW THE PUSHER BLOCK & RETRACTING SHADOW (Upper Shelf)
      // Shadow cast below the pusher plate on the lower shelf
      const shadowHeight = Math.max(5, (state.pusherY - 20) * 0.35);
      const gradientShadow = ctx.createLinearGradient(0, state.pusherY, 0, state.pusherY + shadowHeight);
      gradientShadow.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      gradientShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = gradientShadow;
      ctx.fillRect(level.gutterWidth, state.pusherY, level.boardWidth - level.gutterWidth * 2, shadowHeight);

      // Pusher main plate body
      const gradPusher = ctx.createLinearGradient(0, 0, 0, state.pusherY);
      gradPusher.addColorStop(0, '#1f2937');
      gradPusher.addColorStop(0.7, theme.pusherColor);
      gradPusher.addColorStop(1, '#374151');
      ctx.fillStyle = gradPusher;
      ctx.fillRect(level.gutterWidth, 0, level.boardWidth - level.gutterWidth * 2, state.pusherY);

      // Lip of the pusher plate
      ctx.fillStyle = theme.accentColor;
      ctx.shadowColor = theme.accentColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(level.gutterWidth, state.pusherY - 3, level.boardWidth - level.gutterWidth * 2, 3);
      ctx.shadowBlur = 0; // reset shadow

      // DRAW BOARD OBJECTS (Bumpers, Pegs, Multipliers)
      for (const obj of state.objects) {
        ctx.save();
        const pulse = obj.pulseTimer ? 1.0 + (obj.pulseTimer / 10) * 0.3 : 1.0;
        const currentRadius = obj.radius * pulse;

        if (obj.type === 'bumper') {
          // Glow pink ring bumper
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();

          // Inner metallic cap
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fdf2f8';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, currentRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.type === 'multiplier') {
          // Yellow multiplier pad
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, currentRadius * 0.75, 0, Math.PI * 2);
          ctx.fill();

          // Symbol text
          ctx.fillStyle = '#eab308';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('2x', obj.x, obj.y);
        } else if (obj.type === 'tower') {
          // Giant stacked cylinder of coins
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw stacked coins representation
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#fff7ed';
          ctx.lineWidth = 2;
          const h = obj.health || 1;
          for (let l = 0; l < h; l++) {
            ctx.beginPath();
            ctx.arc(obj.x, obj.y - l * 5, currentRadius - 2, 0, Math.PI * 2);
            ctx.fillStyle = l === h - 1 ? '#ffedd5' : '#fed7aa';
            ctx.fill();
            ctx.stroke();
          }

          // Health indicators (dots)
          ctx.fillStyle = '#f97316';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`♥${h}`, obj.x, obj.y - h * 5);
        } else {
          // Regular peg
          ctx.fillStyle = '#cbd5e1';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Center shine
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(obj.x - 1.5, obj.y - 1.5, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // DRAW ACTIVE COINS
      for (const c of state.coins) {
        ctx.save();
        const r = c.radius * (c.scale ?? 1.0);
        const opacity = c.alpha ?? 1.0;

        ctx.globalAlpha = opacity;

        // Apply glow shadow
        if (c.glow) {
          ctx.shadowColor = c.color;
          ctx.shadowBlur = 12;
        }

        // Draw outer thick metallic bezel ring
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = c.borderColor;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        ctx.shadowBlur = 0; // reset for inner details

        // Draw inner colored core
        ctx.beginPath();
        ctx.arc(c.x, c.y, r * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();

        // Shiny reflection highlights for 3D illusion
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r * 0.55, Math.PI * 1.1, Math.PI * 1.6);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(c.x, c.y, r * 0.55, Math.PI * 0.1, Math.PI * 0.6);
        ctx.stroke();

        // Draw distinct symbols / icons inside center
        ctx.fillStyle = c.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (c.typeId === 'tnt') {
          // TNT spark fuse symbol
          ctx.font = 'bold 10px monospace';
          ctx.fillText('💣', c.x, c.y + 0.5);
        } else if (c.typeId === 'magnet') {
          // Magnet symbol
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('🧲', c.x, c.y + 0.5);
        } else if (c.typeId === 'double_drop') {
          // Free drops multiplier
          ctx.font = 'bold 9px monospace';
          ctx.fillText('+D', c.x, c.y + 0.5);
        } else if (c.typeId === 'giga_gold') {
          // Giant weight symbol
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('🌟', c.x, c.y + 1);
        } else if (c.typeId === 'steel') {
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('S', c.x, c.y + 0.5);
        } else if (c.typeId === 'emerald') {
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('🍀', c.x, c.y + 0.5);
        } else if (c.typeId === 'ruby') {
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('♦', c.x, c.y + 0.5);
        } else if (c.typeId === 'cosmic') {
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('🌌', c.x, c.y + 0.5);
        } else {
          // Gold / base
          ctx.font = '9px monospace';
          ctx.fillText('★', c.x, c.y + 0.5);
        }

        ctx.restore();
      }

      // DRAW PARTICLES
      for (const p of state.particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Draw a diamond particle
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // DRAW COIN BIRD
      if (state.birdActive) {
        ctx.save();
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#0ea5e9';
        
        // Draw arcade pixel-style bird
        ctx.beginPath();
        ctx.arc(state.birdX, state.birdY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Wings flap animation
        const flap = Math.sin(state.time * 8) * 12;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(state.birdX - 5, state.birdY, 8, Math.abs(flap), 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye & beak
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(state.birdX + 5, state.birdY - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(state.birdX + 13, state.birdY);
        ctx.lineTo(state.birdX + 18, state.birdY + 3);
        ctx.lineTo(state.birdX + 13, state.birdY + 6);
        ctx.fill();

        ctx.restore();
      }

      // DRAW FLOATING IMPACT TEXTS
      for (const t of state.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = t.alpha;
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      // DRAW DROP PLACEMENT FUNNEL HOVER AID
      // Renders a visual "ghost" coin template and dropping vertical laser beam guide
      if (mouseHoverX !== null) {
        ctx.save();
        const dropPadding = level.gutterWidth + 15;
        const validRange = mouseHoverX >= dropPadding && mouseHoverX <= level.boardWidth - dropPadding;
        
        if (validRange) {
          // Draw dashed guide laser beam
          ctx.strokeStyle = `${theme.accentColor}33`; // 20% alpha
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 8]);
          ctx.beginPath();
          ctx.moveTo(mouseHoverX, 10);
          ctx.lineTo(mouseHoverX, 450);
          ctx.stroke();

          // Draw translucent ghost coin placement layout
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          ctx.arc(mouseHoverX, 15, 14, 0, Math.PI * 2);
          ctx.fillStyle = theme.accentColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // DRAW LOWER SHELF RIM/BUMPER Lip (front ledge where winning coins drop)
      // Adds a nice glowing, neon aesthetic along the edge before falling
      ctx.save();
      const edgeY = 458;
      ctx.fillStyle = theme.accentColor;
      ctx.shadowColor = theme.accentColor;
      ctx.shadowBlur = 12;
      ctx.fillRect(level.gutterWidth, edgeY, level.boardWidth - level.gutterWidth * 2, 4);
      ctx.restore();

      ctx.restore(); // restore screenshake translate

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [level, theme]);

  // Physical collision resolution engine
  // Includes complex math for momentum transfer, boundary limits, and peg deflection
  const resolvePhysicsCollisions = (
    coins: ActiveCoin[],
    objects: BoardObject[],
    gutterShieldActive: boolean,
    boardWidth: number,
    gutterWidth: number
  ) => {
    const iterations = 6;
    const topLimit = 10;
    
    for (let iter = 0; iter < iterations; iter++) {
      // 1. Coin-to-Coin collision loops
      for (let i = 0; i < coins.length; i++) {
        for (let j = i + 1; j < coins.length; j++) {
          const c1 = coins[i];
          const c2 = coins[j];
          
          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = c1.radius + c2.radius;
          
          if (dist < minDist) {
            const actualDist = dist === 0 ? 0.1 : dist;
            const overlap = minDist - actualDist;
            
            const nx = dx / actualDist;
            const ny = dy / actualDist;
            
            const totalMass = c1.mass + c2.mass;
            const ratio1 = c2.mass / totalMass;
            const ratio2 = c1.mass / totalMass;
            
            // Push apart
            c1.x -= nx * overlap * ratio1;
            c1.y -= ny * overlap * ratio1;
            c2.x += nx * overlap * ratio2;
            c2.y += ny * overlap * ratio2;
            
            // Resolve kinetic impulse momentum
            const kx = c1.vx - c2.vx;
            const ky = c1.vy - c2.vy;
            const impulse = (2 * (nx * kx + ny * ky)) / totalMass;
            
            c1.vx -= impulse * c2.mass * nx * 0.35;
            c1.vy -= impulse * c2.mass * ny * 0.35;
            c2.vx += impulse * c1.mass * nx * 0.35;
            c2.vy += impulse * c1.mass * ny * 0.35;
          }
        }
      }

      // 2. Coin limits and pegs collision
      for (let i = 0; i < coins.length; i++) {
        const c = coins[i];

        // Boundaries constraints:
        // Upper funnel blocks (pusher shelf area: Y < 165)
        let leftBound = 0;
        let rightBound = boardWidth;

        if (c.y < 165) {
          leftBound = gutterWidth;
          rightBound = boardWidth - gutterWidth;
        } else {
          // Lower shelf allows spillover if gutter shield is off
          leftBound = gutterShieldActive ? 0 : gutterWidth - 10;
          rightBound = gutterShieldActive ? boardWidth : boardWidth - gutterWidth + 10;
        }

        if (c.x - c.radius < leftBound) {
          c.x = leftBound + c.radius;
          c.vx = -c.vx * 0.15;
        }
        if (c.x + c.radius > rightBound) {
          c.x = rightBound - c.radius;
          c.vx = -c.vx * 0.15;
        }
        if (c.y - c.radius < topLimit) {
          c.y = topLimit + c.radius;
          c.vy = -c.vy * 0.15;
        }

        // Collide with board obstacle items
        for (const obj of objects) {
          const dx = c.x - obj.x;
          const dy = c.y - obj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = c.radius + obj.radius;

          if (dist < minDist) {
            const actualDist = dist === 0 ? 0.1 : dist;
            const overlap = minDist - actualDist;
            const nx = dx / actualDist;
            const ny = dy / actualDist;

            // Push coin away
            c.x += nx * overlap;
            c.y += ny * overlap;

            // Compute bouncy reflections
            let bounce = 0.45;
            if (obj.type === 'bumper') {
              bounce = 1.8; // super high rubber recoil
              obj.pulseTimer = 10;
              spawnParticles(obj.x, obj.y, '#ec4899', 5, 2.0);
              sound.playClink();
            } else if (obj.type === 'multiplier') {
              bounce = 0.6;
              obj.pulseTimer = 8;
              
              const baseCoinType = COIN_TYPES.find(ct => ct.id === c.typeId);
              if (baseCoinType && c.value === baseCoinType.value) {
                // Permanently double the coin scoring worth!
                c.value *= 2;
                c.glow = true;
                c.scale = (c.scale || 1.0) * 1.15;
                spawnParticles(c.x, c.y, '#eab308', 6, 1.8);
                spawnFloatingText(c.x, c.y - 15, '2x VALUE!', '#eab308', 13);
                sound.playScore();
              }
            } else if (obj.type === 'tower') {
              bounce = 0.1; // absorb/heavy landing
              if (obj.health && obj.health > 0) {
                obj.health -= 1;
                obj.pulseTimer = 6;
                spawnParticles(obj.x, obj.y, '#f97316', 4, 1.2);
                sound.playClink();
              }
            } else {
              // Standard silver deflection peg
              bounce = 0.75;
              sound.playClink();
            }

            const dotProduct = c.vx * nx + c.vy * ny;
            c.vx = (c.vx - 2 * dotProduct * nx) * bounce;
            c.vy = (c.vy - 2 * dotProduct * ny) * bounce;
          }
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="relative select-none flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={level.boardWidth}
        height={500}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        className="rounded border border-slate-800 shadow-2xl cursor-crosshair bg-slate-950 transition-all duration-300 max-w-full"
        id="coin-pusher-canvas"
      />
    </div>
  );
}
