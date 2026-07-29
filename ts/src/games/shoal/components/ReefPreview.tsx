import { useRef, useEffect } from 'react';
import { call } from '../../../engine/runtime';
import { useGameLoop } from '../../../hooks';
import type { GameRendererProps } from '../../../engine/types';
import type { RenderState } from '../types';
import { drawGame } from '../App';

const PREVIEW_SPAWN = {
  initial_fish: 18,
  initial_sharks: 3,
  initial_algae_hubs: 3,
};

export interface ReefPreviewProps {
  session: GameRendererProps['session'];
}

export default function ReefPreview({ session }: ReefPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    dims: { w: 800, h: 600 },
    initialized: false,
  });
  const renderStateRef = useRef<RenderState | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      stateRef.current.dims = { w: rect.width, h: rect.height };
      const rs = renderStateRef.current;
      if (rs) drawGame(canvasRef.current, rs, stateRef.current.dims, session.files.data);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const data = { ...session.files.data, spawn: { ...session.files.data['spawn' as keyof typeof session.files.data], ...PREVIEW_SPAWN } };
    renderStateRef.current = call(session, 'init_game', data)[0] as RenderState;
    stateRef.current.initialized = true;
    if (canvasRef.current) {
      drawGame(canvasRef.current, renderStateRef.current, stateRef.current.dims, session.files.data);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [session]);

  useGameLoop((dt) => {
    const s = stateRef.current;
    if (!s.initialized || !canvasRef.current) return;
    const rs = call(session, 'tick_game', dt, {})[0] as RenderState;
    renderStateRef.current = rs;
    drawGame(canvasRef.current, rs, s.dims, session.files.data);
  }, {});

  return (
    <div ref={containerRef} className="shoal-reef-preview">
      <canvas ref={canvasRef} className="shoal-reef-preview-canvas" />
    </div>
  );
}
