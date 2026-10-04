import React, { useRef, useState } from 'react';
import { BuildingInstance, PipeNode, SocketDef, TilePos } from '../types';
import { X, ExternalLink, Sliders, Trash2, Eye } from 'lucide-react';
import { BUILDING_TILE, getMaterialState, SOCKET_STATE_COLORS } from '../simulation/buildingDefs';
import { computeRoute } from '../simulation/buildings';

interface InspectPanelProps {
  target: { type: 'building'; building: BuildingInstance } | { type: 'pipe'; pipes: PipeNode[]; tile: TilePos } | null;
  pipeRouteState: {
    mode: 'idle' | 'drawing' | 'complete';
    sourceSocket: { socket: SocketDef; building: BuildingInstance } | null;
    route: TilePos[];
    valid: boolean;
  } | null;
  onStartPipeRoute: (building: BuildingInstance, socket: SocketDef) => void;
  onCompletePipeRoute: (building: BuildingInstance, socket: SocketDef) => { success: boolean; reason?: string };
  onCancelPipeRoute: () => void;
  onOpenFilter: (building: BuildingInstance) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const InspectPanel: React.FC<InspectPanelProps> = ({
  target,
  pipeRouteState,
  onStartPipeRoute,
  onCompletePipeRoute,
  onCancelPipeRoute,
  onOpenFilter,
  onDelete,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  if (!target) return null;

  const renderSockets = (building: BuildingInstance) => {
    return building.sockets.map((socket) => {
      const isConnected = Boolean(building.connected[socket.id]);
      const isSourceSocket =
        pipeRouteState?.mode === 'drawing' &&
        pipeRouteState.sourceSocket?.socket.id === socket.id &&
        pipeRouteState.sourceSocket?.building.id === building.id;

      const stateColor = SOCKET_STATE_COLORS[socket.acceptedStates[0] || 'solid'] || '#7ab8d4';
      const typeIcon = socket.acceptedStates.map((s) => s[0].toUpperCase()).join('/');

      // Show inline preview route if routing is in progress and this socket is a candidate input target
      const targetCompatible =
        pipeRouteState &&
        pipeRouteState.mode === 'drawing' &&
        socket.kind === 'input' &&
        !isSourceSocket &&
        !isConnected &&
        building.id !== pipeRouteState.sourceSocket?.building.id;

      const previewRoute =
        targetCompatible && pipeRouteState
          ? computeRoute(
              {
                tx: pipeRouteState.sourceSocket!.building.tileX + pipeRouteState.sourceSocket!.socket.dtx,
                ty: pipeRouteState.sourceSocket!.building.tileY + pipeRouteState.sourceSocket!.socket.dty,
              },
              { tx: building.tileX + socket.dtx, ty: building.tileY + socket.dty },
              false
            )
          : null;

      return (
        <div
          key={socket.id}
          className={`flex items-center justify-between p-2 rounded bg-[#131b2c] border ${
            isSourceSocket
              ? 'border-amber-500/60 bg-amber-950/20'
              : isConnected
              ? 'border-emerald-500/30'
              : 'border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0 border border-black/40"
              style={{ backgroundColor: isConnected ? stateColor : 'transparent', outline: `1px solid ${stateColor}` }}
            />
            <div>
              <div className="text-[10px] font-bold text-slate-200 flex items-center gap-1.5">
                {socket.kind.toUpperCase()} — {socket.side.toUpperCase()}
                <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded border border-slate-700">
                  {typeIcon}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                {isSourceSocket
                  ? 'Routing: drag to destination...'
                  : isConnected
                  ? 'Connected'
                  : 'Open for link'}
              </div>
              {previewRoute && previewRoute.length > 0 && (
                <div className="text-[8px] text-cyan-500/80 font-mono mt-0.5 italic">
                  Route preview: {previewRoute.length - 2} pipes
                </div>
              )}
            </div>
          </div>

          {socket.kind === 'output' ? (
            <button
              id={`btn-route-socket-${socket.id}`}
              disabled={isConnected || (pipeRouteState?.mode === 'drawing' && !isSourceSocket)}
              onClick={() => {
                setRouteError(null);
                if (isSourceSocket) {
                  onCancelPipeRoute();
                } else {
                  onStartPipeRoute(building, socket);
                }
              }}
              className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                isSourceSocket
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/50 hover:bg-amber-600/30'
                  : isConnected
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
              }`}
            >
              {isSourceSocket ? 'Cancel' : isConnected ? 'Routed' : 'Route'}
            </button>
          ) : targetCompatible ? (
            <button
              id={`btn-complete-route-socket-${socket.id}`}
              onClick={() => {
                const result = onCompletePipeRoute(building, socket);
                if (!result.success) {
                  setRouteError(result.reason || 'Route failed');
                } else {
                  setRouteError(null);
                }
              }}
              className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40 animate-pulse"
            >
              Link
            </button>
          ) : null}
        </div>
      );
    });
  };

  return (
    <div
      ref={panelRef}
      className="w-64 bg-[#0c101c] border-l border-[#212b42] flex flex-col shrink-0 font-mono text-xs text-slate-300 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#141b2d] border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider">
            {target.type === 'building' ? 'Node Inspector' : 'Pipe Node'}
          </span>
        </div>
        <button
          id="btn-close-inspect"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
        {routeError && (
          <div className="p-2 rounded bg-rose-950/50 border border-rose-500/60 text-rose-300 text-[10px]">
            Route Error: {routeError}
          </div>
        )}

        {target.type === 'building' ? (
          <>
            {/* Name & Position */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Node ID</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {target.building.buildingId.replace(/(collector_|container_|processor_)/, '').replace(/_/g, ' ').toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                Grid: [{target.building.tileX}, {target.building.tileY}] • Size: {target.building.tileW}x
                {target.building.tileH}
              </div>
            </div>

            {/* Sockets */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
                I/O Ports ({target.building.sockets.length})
              </div>
              <div className="space-y-1.5">{renderSockets(target.building)}</div>
            </div>

            {/* Contents */}
            {target.building.contents.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
                  Internal Buffer
                </div>
                <div className="space-y-1 bg-[#101625] p-2 rounded border border-slate-800">
                  {target.building.contents.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-300">{item.material}</span>
                      <span className="text-slate-500">
                        {getMaterialState(item.material).toUpperCase()}
                      </span>
                    </div>
                  ))}
                  <div className="text-[9px] text-slate-600 pt-1 border-t border-slate-800/80 flex justify-between">
                    <span>Total</span>
                    <span>
                      {target.building.contents.length} / {target.building.capacity}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <button
                id="btn-open-filter-from-inspect"
                onClick={() => onOpenFilter(target.building)}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-[#182236] hover:bg-[#1e2c45] border border-cyan-800/50 text-cyan-300 rounded font-bold text-[11px] transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                Routing Filters
              </button>
              <button
                id="btn-demolish-inspect"
                onClick={onDelete}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 rounded font-bold text-[11px] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Deconstruct Node
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Pipe Inspect */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pipe Tile</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                [{target.tile.tx}, {target.tile.ty}]
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                Direction: {target.pipes.map((p) => p.direction).join(', ')}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
                Pipe Segment Contents
              </div>
              <div className="space-y-1.5">
                {target.pipes.map((p, idx) => (
                  <div key={idx} className="p-2 rounded bg-[#101625] border border-slate-800 text-[10px] space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Dir</span>
                      <span className="text-slate-200">{p.direction}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Buffer</span>
                      <span className="text-slate-200">
                        {p.buffer.length} / {p.capacity}
                      </span>
                    </div>
                    {p.buffer.length > 0 && (
                      <div className="pt-1 border-t border-slate-800/80 space-y-0.5">
                        {p.buffer.map((item, i) => (
                          <div key={i} className="text-[9px] text-slate-500">
                            • {item.material}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                id="btn-demolish-pipe-inspect"
                onClick={onDelete}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 rounded font-bold text-[11px] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Deconstruct Pipe
              </button>
            </div>
          </>
        )}
      </div>

      {/* Context Footer */}
      <div className="p-2 bg-[#141b2d] border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Click canvas to inspect node
        </span>
        <span>
          {pipeRouteState?.mode === 'drawing' ? 'ROUTING ACTIVE' : 'IDLE'}
        </span>
      </div>
    </div>
  );
};
