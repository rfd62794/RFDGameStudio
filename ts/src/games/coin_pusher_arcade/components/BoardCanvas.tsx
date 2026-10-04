// components/BoardCanvas.tsx — canvas board + input for Coin Pusher Arcade.
//
// Rendering and input only: the simulation itself lives in ../logic (pure
// functions over BoardState). This component owns the BoardState ref, feeds
// it rng/Date.now per frame, and maps emitted BoardEvents to sounds,
// particles, floating texts, and the parent's React callbacks.

import React, { useEffect, useRef } from 'react';
import type { CoinType, LevelSettings, BoardTheme } from '../types';
import { sound } from '../utils/sound';
import {
  BoardEvent,
  BoardState,
  GUTTER_SHIELD_FRAMES,
  createBoardState,
  stepBoard,
} from '../logic/physics';
import {
  clampDropX,
  pickCoinType,
  setupBoard,
  settleBoard,
  spawnDropCoin,
  spawnPocketCoin,
} from '../logic/coins';
import { drawBoard } from './render';

interface BoardCanvasProps {
  level: LevelSettings;
  theme: BoardTheme;
  unlockedCoins: CoinType[];
  onCoinPushed: (coinValue: number, isPocket: boolean, pocketTypeId?: string) => void;
  onGutterCoin: () => void;
  onComboTriggered: (comboCount: number) => void;
  onBoardStateChange: (activeCount: number, isSettled: boolean) => void;
  pocketCoinToDrop: string | null;
  onPocketCoinDropped: () => void;
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
}

export default function BoardCanvas({
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
}: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<BoardState>(createBoardState());

  // The example's rAF loop held stale prop closures (mount-time dropQueue,
  // stats, hasWonRound): game-over could never fire and meta-stats froze.
  // Routing callbacks through a ref keeps every frame on fresh props while
  // the loop itself keeps the original [level, theme] re-subscribe cadence.
  const callbacksRef = useRef({
    onCoinPushed,
    onGutterCoin,
    onComboTriggered,
    onBoardStateChange,
    onGutterShieldActiveState,
  });
  useEffect(() => {
    callbacksRef.current = {
      onCoinPushed,
      onGutterCoin,
      onComboTriggered,
      onBoardStateChange,
      onGutterShieldActiveState,
    };
  });

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

  const spawnParticles = (x: number, y: number, color: string, count = 8, force = 2.5) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * force;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
      });
    }
  };

  // Initialize the board (pegs + pre-filled shelf + pre-settle).
  useEffect(() => {
    const state = stateRef.current;
    const fresh = createBoardState();
    state.coins = fresh.coins;
    state.objects = fresh.objects;
    state.particles = fresh.particles;
    state.floatingTexts = fresh.floatingTexts;
    state.recentFalls = fresh.recentFalls;
    state.gutterShieldTimer = fresh.gutterShieldTimer;
    state.birdActive = fresh.birdActive;

    const { coins, objects } = setupBoard(level, unlockedCoins, Math.random);
    state.coins = coins;
    state.objects = objects;
    settleBoard(state.coins, level);
  }, [level, unlockedCoins]);

  // Pocket coin drop spawns
  useEffect(() => {
    if (pocketCoinToDrop) {
      const state = stateRef.current;
      const spawnX = state.hoverX !== null ? state.hoverX : level.boardWidth / 2;
      const coin = spawnPocketCoin(pocketCoinToDrop, spawnX, Math.random);
      if (coin) {
        state.coins.push(coin);
        sound.playDrop();
      }
      onPocketCoinDropped();
    }
  }, [pocketCoinToDrop, level, onPocketCoinDropped]);

  // Wheel reward triggers
  useEffect(() => {
    if (triggerCoinBird) {
      const state = stateRef.current;
      state.birdActive = true;
      state.birdX = -40;
      state.birdY = 60 + Math.random() * 20;
      state.birdDirection = 1;
      state.birdDropsLeft = 6 + Math.floor(Math.random() * 3);
      state.birdLastDropTime = 0;

      spawnFloatingText(level.boardWidth / 2, 100, 'COIN BIRD FLYING!', '#0ea5e9', 20);
      sound.playRefill();

      onCoinBirdTriggered();
    }
  }, [triggerCoinBird, level, onCoinBirdTriggered]);

  useEffect(() => {
    if (triggerCoinTower) {
      const state = stateRef.current;
      const towerX = level.gutterWidth + 40 + Math.random() * (level.boardWidth - level.gutterWidth * 2 - 80);
      const towerY = 240 + Math.random() * 60;

      state.objects = state.objects.filter(obj => obj.type !== 'tower');
      state.objects.push({
        id: `tower-${Date.now()}`,
        type: 'tower',
        x: towerX,
        y: towerY,
        radius: 32,
        color: '#f97316',
        health: 3,
        maxHealth: 3,
      });

      spawnFloatingText(towerX, towerY - 40, 'COIN TOWER PLACED!', '#f97316', 16);
      sound.playRefill();

      onCoinTowerTriggered();
    }
  }, [triggerCoinTower, level, onCoinTowerTriggered]);

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
        color: '#ec4899',
      });

      spawnFloatingText(bX, bY - 30, 'BOUNCY BUMPER!', '#ec4899', 15);
      sound.playRefill();

      onBumperTriggered();
    }
  }, [triggerBumper, level, onBumperTriggered]);

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
        color: '#eab308',
        multiplier: 2,
      });

      spawnFloatingText(padX, padY - 35, '+2x VALUE PAD!', '#eab308', 15);
      sound.playRefill();

      onMultiplierPadTriggered();
    }
  }, [triggerMultiplierPad, level, onMultiplierPadTriggered]);

  useEffect(() => {
    if (triggerGutterShield) {
      const state = stateRef.current;
      state.gutterShieldTimer = GUTTER_SHIELD_FRAMES;
      onGutterShieldActiveState(true);

      spawnFloatingText(level.boardWidth / 2, 200, 'GUTTER SHIELDS ONLINE!', '#22c55e', 18);
      sound.playRefill();

      onGutterShieldTriggered();
    }
  }, [triggerGutterShield, level, onGutterShieldTriggered, onGutterShieldActiveState]);

  // Drop a standard coin at a client-X coordinate
  const dropCoinAt = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const clickX = clampDropX((clientX - rect.left) * scaleX, level);

    const selectedType = pickCoinType(unlockedCoins, Math.random);
    const coin = spawnDropCoin(selectedType, clickX, Math.random);

    const state = stateRef.current;
    state.coins.push(coin);

    sound.playDrop();
    spawnParticles(clickX, 15, selectedType.color, 4, 1.2);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const rx = clampDropX((e.clientX - rect.left) * scaleX, level);

    stateRef.current.hoverX = rx;
  };

  const handleMouseLeave = () => {
    stateRef.current.hoverX = null;
  };

  // App-level drop requests arrive as a window event (same mechanism the
  // example used so a queued drop lands at the hover/center position).
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

  // Main loop: step the pure sim, render chrome for its events, draw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleEvent = (e: BoardEvent) => {
      const cb = callbacksRef.current;
      switch (e.type) {
        case 'coin_guttered':
          cb.onGutterCoin();
          sound.playClink();
          spawnParticles(e.coin.x, 480, '#64748b', 4, 1.5);
          break;
        case 'coin_scored':
          cb.onCoinPushed(e.coin.value, !!e.coin.isPocket, e.coin.pocketTypeId);
          if (!e.coin.isPocket) {
            spawnParticles(e.coin.x, 480, e.coin.color, 10, 2.5);
          }
          break;
        case 'pocket_effect':
          if (e.kind === 'tnt') {
            spawnParticles(e.x, 320, '#dc2626', 15, 4.5);
            spawnParticles(e.x, 320, '#f97316', 15, 3.5);
            spawnParticles(e.x, 320, '#eab308', 10, 2.5);
            spawnFloatingText(e.x, 310, 'TNT BLAST!', '#ef4444', 22);
            sound.playExplosion();
          } else if (e.kind === 'magnet') {
            spawnParticles(e.x, 320, '#4f46e5', 25, 3);
            spawnFloatingText(e.x, 310, 'MAGNETIC WAVE!', '#818cf8', 20);
            sound.playMagnet();
          } else if (e.kind === 'double_drop') {
            spawnParticles(e.x, 460, '#14b8a6', 20, 3.5);
            spawnFloatingText(e.x, 430, '+5 FREE DROPS!', '#14b8a6', 18);
          } else if (e.kind === 'giga_gold') {
            spawnParticles(e.x, 460, '#fbbf24', 35, 4.0);
            spawnFloatingText(e.x, 420, 'GIGA SMASH (+50!)', '#fbbf24', 22);
          }
          break;
        case 'combo':
          cb.onComboTriggered(e.count);
          spawnFloatingText(e.x, e.y, `${e.count}x COMBO!`, '#f43f5e', 14 + e.count * 1.5);
          break;
        case 'score_pop':
          spawnFloatingText(e.x, e.y, e.text, e.color, e.size);
          break;
        case 'bird_drop':
          sound.playDrop();
          spawnParticles(e.x, e.y, '#fbbf24', 4, 1.0);
          break;
        case 'tower_collapsed':
          sound.playExplosion();
          spawnParticles(e.x, e.y, '#f97316', 20, 3.0);
          spawnFloatingText(e.x, e.y - 20, 'TOWER COLLAPSED!', '#f97316', 18);
          break;
        case 'shield_off':
          cb.onGutterShieldActiveState(false);
          spawnFloatingText(level.boardWidth / 2, 200, 'GUTTER SHIELDS OFFLINE!', '#ef4444', 15);
          break;
        case 'bumper_hit':
          spawnParticles(e.x, e.y, '#ec4899', 5, 2.0);
          sound.playClink();
          break;
        case 'peg_hit':
          sound.playClink();
          break;
        case 'multiplier_hit':
          spawnParticles(e.x, e.y, '#eab308', 6, 1.8);
          spawnFloatingText(e.x, e.y - 15, '2x VALUE!', '#eab308', 13);
          sound.playScore();
          break;
        case 'tower_hit':
          spawnParticles(e.x, e.y, '#f97316', 4, 1.2);
          sound.playClink();
          break;
      }
    };

    const gameLoop = () => {
      const state = stateRef.current;
      const { events, isSettled } = stepBoard(state, level, Date.now(), Math.random);

      for (const e of events) {
        handleEvent(e);
      }

      callbacksRef.current.onBoardStateChange(state.coins.length, isSettled);
      drawBoard(ctx, state, level, theme, state.hoverX);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [level, theme]);

  return (
    <div className="relative select-none flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={level.boardWidth}
        height={500}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded border border-slate-800 shadow-2xl cursor-crosshair bg-slate-950 transition-all duration-300 max-w-full"
        id="coin-pusher-canvas"
      />
    </div>
  );
}
