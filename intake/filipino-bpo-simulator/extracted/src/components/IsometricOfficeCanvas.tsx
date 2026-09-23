import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GridTile, Agent } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  grid: GridTile[];
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onSelectTile: (tile: GridTile) => void;
  selectedAgentId?: string | null;
  selectedTileId?: string | null;
  gameTimeMinutes: number;
  buildModeItem?: string | null;
  onPlaceBuildItem?: (x: number, y: number) => void;
}

export const IsometricOfficeCanvas: React.FC<Props> = ({
  grid,
  agents,
  onSelectAgent,
  onSelectTile,
  selectedAgentId,
  selectedTileId,
  gameTimeMinutes,
  buildModeItem,
  onPlaceBuildItem,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Isometric tile dimensions
  const TILE_W = 64;
  const TILE_H = 32;

  // Convert grid (x, y) to screen coordinates (center-relative)
  const gridToScreen = useCallback((gx: number, gy: number) => {
    return {
      x: (gx - gy) * (TILE_W / 2),
      y: (gx + gy) * (TILE_H / 2),
    };
  }, []);

  // Convert screen coordinates to grid (gx, gy)
  const screenToGrid = useCallback((sx: number, sy: number) => {
    const gx = (sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2;
    const gy = (sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2;
    return {
      x: Math.floor(gx),
      y: Math.floor(gy),
    };
  }, []);

  // Center the view on initial mount
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          canvasRef.current.width = rect.width * window.devicePixelRatio;
          canvasRef.current.height = rect.height * window.devicePixelRatio;
          if (pan.x === 0 && pan.y === 0) {
            setPan({ x: rect.width / 2, y: rect.height / 5 });
          }
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main rendering loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      tick++;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;

      // Background color - office carpet/slate backdrop
      const isNight = gameTimeMinutes >= 1320 || gameTimeMinutes < 360; // 10 PM - 6 AM Graveyard shift
      ctx.fillStyle = isNight ? '#0b1120' : '#1e293b';
      ctx.fillRect(0, 0, width, height);

      // Apply zoom & pan translation
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Sort tiles from back to front for proper isometric depth (x + y)
      const sortedTiles = [...grid].sort((a, b) => {
        if (a.x + a.y === b.x + b.y) {
          return a.x - b.x;
        }
        return (a.x + a.y) - (b.x + b.y);
      });

      // Render floor tiles & structures
      sortedTiles.forEach((tile) => {
        const { x: sx, y: sy } = gridToScreen(tile.x, tile.y);
        const isHovered = hoveredTile?.x === tile.x && hoveredTile?.y === tile.y;
        const isSelected = selectedTileId === tile.id;

        // 1. Draw diamond floor tile
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + TILE_W / 2, sy + TILE_H / 2);
        ctx.lineTo(sx, sy + TILE_H);
        ctx.lineTo(sx - TILE_W / 2, sy + TILE_H / 2);
        ctx.closePath();

        // Authentic BPO carpet patterns: geometric blue/slate/teal
        const isOddRow = (tile.x + tile.y) % 2 === 0;
        const isAisle = tile.x % 4 === 0 || tile.y % 5 === 0;
        
        let floorFill = isOddRow ? '#334155' : '#2b394d';
        if (isAisle) {
          floorFill = isOddRow ? '#1e2d42' : '#24354c';
        }

        // Zone specific floors
        if (tile.type === 'SERVER_RACK') {
          floorFill = '#111827';
        } else if (tile.type === 'PANTRY_TABLE' || (tile.x >= 15 && tile.y <= 5)) {
          floorFill = '#3b4252'; // Vinyl pantry tile
        }

        ctx.fillStyle = floorFill;
        ctx.fill();

        // Subtle tile borders
        ctx.strokeStyle = '#1a2234';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hover or Select highlight
        if (isHovered || isSelected) {
          ctx.strokeStyle = isSelected ? '#38bdf8' : (buildModeItem ? '#4ade80' : '#fbbf24');
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 2. Render 3D Walls, Cubicles, Furniture & Agents on top of this tile
        renderTileObject(ctx, tile, sx, sy, tick, isNight);

        // Render any agent currently stationed or walking at this tile
        const agentAtTile = agents.find(a => 
          Math.round(a.gridX) === tile.x && Math.round(a.gridY) === tile.y
        );

        if (agentAtTile) {
          renderAgent(ctx, agentAtTile, sx, sy, tick, selectedAgentId === agentAtTile.id);
        }
      });

      ctx.restore();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [grid, agents, zoom, pan, hoveredTile, selectedAgentId, selectedTileId, gameTimeMinutes, buildModeItem, gridToScreen]);

  // Helper: Draw isometric cube
  const drawIsoCube = (
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    w: number,
    h: number,
    depth: number,
    topColor: string,
    leftColor: string,
    rightColor: string
  ) => {
    // Top face
    ctx.beginPath();
    ctx.moveTo(sx, sy - depth);
    ctx.lineTo(sx + w / 2, sy + h / 2 - depth);
    ctx.lineTo(sx, sy + h - depth);
    ctx.lineTo(sx - w / 2, sy + h / 2 - depth);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();

    // Left face
    ctx.beginPath();
    ctx.moveTo(sx - w / 2, sy + h / 2 - depth);
    ctx.lineTo(sx, sy + h - depth);
    ctx.lineTo(sx, sy + h);
    ctx.lineTo(sx - w / 2, sy + h / 2);
    ctx.closePath();
    ctx.fillStyle = leftColor;
    ctx.fill();

    // Right face
    ctx.beginPath();
    ctx.moveTo(sx, sy + h - depth);
    ctx.lineTo(sx + w / 2, sy + h / 2 - depth);
    ctx.lineTo(sx + w / 2, sy + h / 2);
    ctx.lineTo(sx, sy + h);
    ctx.closePath();
    ctx.fillStyle = rightColor;
    ctx.fill();
  };

  // Helper: Render Furniture & Objects
  const renderTileObject = (
    ctx: CanvasRenderingContext2D,
    tile: GridTile,
    sx: number,
    sy: number,
    tick: number,
    isNight: boolean
  ) => {
    switch (tile.type) {
      case 'WALL': {
        // High perimeter wall with glass windows
        drawIsoCube(ctx, sx, sy, TILE_W, TILE_H, 48, '#64748b', '#475569', '#334155');
        // Accent stripe
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(sx - 12, sy - 36, 24, 3);
        break;
      }

      case 'CUBICLE': {
        // Acoustic cubicle partition dividers
        drawIsoCube(ctx, sx, sy + 4, TILE_W * 0.9, TILE_H * 0.9, 18, '#94a3b8', '#64748b', '#475569');
        // Desk surface
        drawIsoCube(ctx, sx, sy + 1, TILE_W * 0.75, TILE_H * 0.75, 14, '#cbd5e1', '#94a3b8', '#cbd5e1');

        // Computer Monitor (CRT or LCD)
        const screenFlicker = (tick % 60 < 30) ? '#38bdf8' : '#60a5fa';
        // Monitor stand & screen
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx - 8, sy - 18, 16, 12);
        // Screen display glow
        ctx.fillStyle = screenFlicker;
        ctx.fillRect(sx - 7, sy - 17, 14, 9);

        // Keyboard & Mouse
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sx - 6, sy - 2, 12, 3);

        // Pod label badge if assigned (A, B, C, D, E, F)
        if (tile.label) {
          const colors: Record<string, string> = {
            A: '#f59e0b',
            B: '#ef4444',
            C: '#10b981',
            D: '#8b5cf6',
            E: '#3b82f6',
            F: '#ec4899',
          };
          const badgeColor = colors[tile.label] || '#0ea5e9';
          ctx.fillStyle = badgeColor;
          ctx.beginPath();
          ctx.arc(sx - 14, sy - 24, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(tile.label, sx - 14, sy - 21);
        }
        break;
      }

      case 'SERVER_RACK': {
        // Tall dark enterprise server chassis
        drawIsoCube(ctx, sx, sy, TILE_W * 0.85, TILE_H * 0.85, 42, '#1e293b', '#0f172a', '#1e293b');

        // Blinking activity LEDs
        const ledColors = ['#10b981', '#38bdf8', '#fbbf24', '#ef4444'];
        for (let i = 0; i < 4; i++) {
          const ledIndex = (tick + i * 15) % 60 < 30 ? i : (i + 1) % 4;
          ctx.fillStyle = ledColors[ledIndex];
          ctx.fillRect(sx - 10 + (i % 2) * 12, sy - 34 + Math.floor(i / 2) * 12, 4, 3);
        }
        // Cooling fan grill
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - 12, sy - 14, 24, 6);
        break;
      }

      case 'WATER_DISPENSER': {
        // Classic office water cooler with inverted blue water bottle
        drawIsoCube(ctx, sx, sy + 2, 24, 14, 22, '#e2e8f0', '#cbd5e1', '#94a3b8');
        // Blue inverted bottle on top
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.ellipse(sx, sy - 24, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Spigots (hot red, cold blue)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(sx - 3, sy - 10, 2, 3);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(sx + 1, sy - 10, 2, 3);
        break;
      }

      case 'COFFEE_MAKER': {
        // Coffee station / brewer with steam
        drawIsoCube(ctx, sx, sy + 2, 26, 16, 18, '#78350f', '#451a03', '#92400e');
        // Coffee pot
        ctx.fillStyle = '#172554';
        ctx.fillRect(sx - 5, sy - 10, 10, 8);
        // Steam effect
        if (tick % 40 < 20) {
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.arc(sx, sy - 14 - (tick % 20) * 0.4, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'PANTRY_TABLE': {
        // Dining lunch table with chairs
        drawIsoCube(ctx, sx, sy + 2, TILE_W * 0.8, TILE_H * 0.8, 14, '#e2e8f0', '#cbd5e1', '#94a3b8');
        // Snack / lunch box (baon)
        ctx.fillStyle = '#f97316';
        ctx.fillRect(sx - 6, sy - 12, 6, 4);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(sx + 2, sy - 11, 4, 4);
        break;
      }

      case 'SLEEPING_POD': {
        // Recliner / Bunk Bed for graveyard shift
        drawIsoCube(ctx, sx, sy + 2, TILE_W * 0.85, TILE_H * 0.85, 12, '#3b82f6', '#1d4ed8', '#1e40af');
        // Pillow
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 10, sy - 8, 8, 5);
        break;
      }

      case 'PLANT': {
        // Indoor office plant (snake plant / monstera)
        // Terracotta pot
        drawIsoCube(ctx, sx, sy + 2, 16, 10, 10, '#c2410c', '#9a3412', '#7c2d12');
        // Green leaves
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(sx, sy - 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(sx - 4, sy - 14, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'RECEPTION_DESK': {
        // Elegant wood curved front desk
        drawIsoCube(ctx, sx, sy + 2, TILE_W, TILE_H, 20, '#b45309', '#92400e', '#78350f');
        // "FILIPINO BPO" logo plaque
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BPO RECEPTION', sx, sy - 6);
        break;
      }

      case 'VENDING_MACHINE': {
        // Snack / drinks vending machine
        drawIsoCube(ctx, sx, sy, 28, 16, 36, '#dc2626', '#b91c1c', '#991b1b');
        // Glass display
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(sx - 8, sy - 30, 16, 16);
        // Soda slots
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(sx - 6, sy - 26, 4, 4);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(sx + 2, sy - 26, 4, 4);
        break;
      }

      case 'DOOR': {
        // Office entrance glass doors
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(sx - 14, sy - 32, 28, 30);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 14, sy - 32, 28, 30);
        break;
      }
    }
  };

  // Helper: Render Agent Sprite with headset and speech bubble
  const renderAgent = (
    ctx: CanvasRenderingContext2D,
    agent: Agent,
    sx: number,
    sy: number,
    tick: number,
    isSelected: boolean
  ) => {
    // Subtle breathing or typing bob
    const isTyping = agent.state === 'ON_CALL' || agent.state === 'ACW';
    const bob = isTyping ? Math.sin((tick + agent.avatarSeed) * 0.3) * 1.5 : 0;
    const posY = sy - 14 + bob;

    // Selection ring if selected
    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, 16, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Role-based shirt colors
    const shirtColors: Record<Agent['role'], string> = {
      CSR: '#3b82f6', // Corporate blue
      TSR: '#0ea5e9', // Sky blue
      SALES: '#10b981', // Emerald green
      TL: '#f59e0b', // Gold / Amber
      QA: '#8b5cf6', // Violet
      IT: '#ef4444', // Red
      WFM: '#ec4899', // Pink
    };

    // Body / Torso
    ctx.fillStyle = shirtColors[agent.role] || '#3b82f6';
    ctx.fillRect(sx - 6, posY - 6, 12, 10);

    // Company Lanyard / ID Badge
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sx - 1, posY - 4, 2, 6);

    // Head / Face
    ctx.fillStyle = '#fed7aa'; // Pinoy skin tone
    ctx.beginPath();
    ctx.arc(sx, posY - 12, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = agent.gender === 'F' ? '#1c1917' : '#292524';
    ctx.beginPath();
    ctx.arc(sx, posY - 14, 6.5, Math.PI, Math.PI * 2);
    ctx.fill();
    if (agent.gender === 'F') {
      // Ponytail or longer hair
      ctx.fillRect(sx - 7, posY - 14, 3, 8);
      ctx.fillRect(sx + 4, posY - 14, 3, 8);
    }

    // Call Center Headset with microphone boom!
    if (agent.role === 'CSR' || agent.role === 'TSR' || agent.role === 'SALES' || agent.role === 'TL') {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      // Headband
      ctx.beginPath();
      ctx.arc(sx, posY - 13, 7.5, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();
      // Ear cushion
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx + 5, posY - 14, 3, 5);
      // Mic boom extending towards mouth
      ctx.beginPath();
      ctx.moveTo(sx + 6, posY - 11);
      ctx.lineTo(sx + 2, posY - 9);
      ctx.stroke();
      // Red or Green status light on headset
      ctx.fillStyle = agent.state === 'ON_CALL' ? '#ef4444' : '#22c55e';
      ctx.fillRect(sx + 1, posY - 10, 2, 2);
    }

    // Hands typing on keyboard if on call
    if (isTyping) {
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(sx - 5 + Math.sin(tick * 0.4) * 2, posY + 2, 3, 3);
      ctx.fillRect(sx + 2 + Math.cos(tick * 0.4) * 2, posY + 2, 3, 3);
    }

    // State or Speech Bubble
    let bubbleText = '';
    let bubbleIcon = '';

    if (agent.speechBubble && agent.speechBubble.expiresAt > Date.now()) {
      bubbleText = agent.speechBubble.text;
      bubbleIcon = agent.speechBubble.icon || '💬';
    } else if (agent.state === 'ON_CALL') {
      bubbleIcon = '📞';
    } else if (agent.state === 'ACW') {
      bubbleIcon = '💻';
    } else if (agent.state === 'BREAK') {
      bubbleIcon = '☕';
    } else if (agent.state === 'LUNCH') {
      bubbleIcon = '🍗';
    } else if (agent.state === 'SLEEPING') {
      bubbleIcon = '💤';
    }

    // Draw little speech/status bubble
    if (bubbleIcon || bubbleText) {
      const bubbleY = posY - 26;
      ctx.font = '10px sans-serif';
      const textWidth = bubbleText ? Math.min(ctx.measureText(bubbleText).width + 24, 140) : 22;
      const bH = 18;

      // Bubble shadow & background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(sx - textWidth / 2, bubbleY - bH / 2, textWidth, bH, 6);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Little tail pointing down to agent
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.moveTo(sx - 3, bubbleY + bH / 2);
      ctx.lineTo(sx, bubbleY + bH / 2 + 4);
      ctx.lineTo(sx + 3, bubbleY + bH / 2);
      ctx.fill();

      // Icon & text inside bubble
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      if (bubbleText) {
        ctx.fillText(`${bubbleIcon} ${bubbleText.slice(0, 16)}...`, sx, bubbleY + 4);
      } else {
        ctx.fillText(bubbleIcon, sx, bubbleY + 4);
      }
    }
  };

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    // Calculate grid tile under cursor
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Transform mouse relative to zoom & pan
    const sx = (mouseX - pan.x) / zoom;
    const sy = (mouseY - pan.y) / zoom;

    const { x: gx, y: gy } = screenToGrid(sx, sy);
    if (gx >= 0 && gx < 20 && gy >= 0 && gy < 20) {
      setHoveredTile({ x: gx, y: gy });
    } else {
      setHoveredTile(null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(false);

    // Only handle click if it wasn't a long drag
    const dist = Math.hypot(e.clientX - (dragStartRef.current.x + pan.x), e.clientY - (dragStartRef.current.y + pan.y));
    if (dist < 5 && hoveredTile) {
      sounds.playClick();

      if (buildModeItem && onPlaceBuildItem) {
        onPlaceBuildItem(hoveredTile.x, hoveredTile.y);
        return;
      }

      // Check if an agent is clicked
      const agent = agents.find(a => Math.round(a.gridX) === hoveredTile.x && Math.round(a.gridY) === hoveredTile.y);
      if (agent) {
        onSelectAgent(agent);
      } else {
        const tile = grid.find(t => t.x === hoveredTile.x && t.y === hoveredTile.y);
        if (tile) {
          onSelectTile(tile);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.6), 2.2));
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Reset, Floor Centering) */}
      <div className="absolute right-4 bottom-16 flex flex-col gap-2 z-10">
        <button
          onClick={() => {
            sounds.playClick();
            setZoom(z => Math.min(z + 0.2, 2.2));
          }}
          className="w-10 h-10 bg-slate-900/90 border-2 border-slate-700 hover:border-sky-400 text-sky-400 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg active:scale-95 transition-all"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setZoom(z => Math.max(z - 0.2, 0.6));
          }}
          className="w-10 h-10 bg-slate-900/90 border-2 border-slate-700 hover:border-sky-400 text-sky-400 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg active:scale-95 transition-all"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            if (canvasRef.current) {
              const rect = canvasRef.current.parentElement?.getBoundingClientRect();
              if (rect) {
                setPan({ x: rect.width / 2, y: rect.height / 5 });
                setZoom(1.2);
              }
            }
          }}
          className="w-10 h-10 bg-slate-900/90 border-2 border-slate-700 hover:border-amber-400 text-amber-400 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg active:scale-95 transition-all"
          title="Reset Camera"
        >
          ⌖
        </button>
      </div>

      {/* Build Mode Notification banner if active */}
      {buildModeItem && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-3 backdrop-blur-md animate-pulse">
          <span>🛠️ Click any empty floor tile to place <strong>{buildModeItem}</strong></span>
          <button
            onClick={() => onPlaceBuildItem && onPlaceBuildItem(-1, -1)}
            className="px-2 py-0.5 bg-emerald-800 hover:bg-emerald-700 rounded text-white text-[11px]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
