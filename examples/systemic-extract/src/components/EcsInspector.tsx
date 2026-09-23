/**
 * ECS Architecture & FastAPI Backend Telemetry Inspector
 * Allows inspection of:
 * - Bevy ECS Component Archetypes & Active Systems
 * - REST API Endpoints: POST /raid/extract, GET /hideout/tick, POST /hideout/craft
 * - Live request/response payload viewer and state tools
 */

import React, { useState, useEffect } from 'react';
import { hideoutBackend } from '../backend/hideout-service';
import { ApiTelemetryLog } from '../types';
import {
  X,
  Database,
  Cpu,
  Terminal,
  Activity,
  Trash2,
  RefreshCw,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface EcsInspectorProps {
  onClose: () => void;
}

export const EcsInspector: React.FC<EcsInspectorProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'ecs' | 'state'>('telemetry');
  const [telemetry, setTelemetry] = useState<ApiTelemetryLog[]>(hideoutBackend.getTelemetry());
  const [selectedLog, setSelectedLog] = useState<ApiTelemetryLog | null>(telemetry[0] || null);
  const [hideoutState, setHideoutState] = useState(hideoutBackend.getState());

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(hideoutBackend.getTelemetry());
      setHideoutState(hideoutBackend.getState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-[#334155] rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* MODAL HEADER */}
        <div className="border-b border-[#1e293b] px-6 py-4 flex items-center justify-between bg-[#141d2b]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                SYSTEM ARCHITECTURE &amp; TELEMETRY INSPECTOR
              </h2>
              <span className="text-[10px] text-[#94a3b8]">
                Bevy ECS Core Simulation &bull; FastAPI Backend Endpoints
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* TABS */}
            <div className="flex bg-[#0b0e14] p-1 rounded-lg border border-[#1e293b]">
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-3 py-1 rounded font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'telemetry'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                API TELEMETRY
              </button>
              <button
                onClick={() => setActiveTab('ecs')}
                className={`px-3 py-1 rounded font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'ecs'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                BEVY ECS SCHEMA
              </button>
              <button
                onClick={() => setActiveTab('state')}
                className={`px-3 py-1 rounded font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'state'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                STASH DATABASE
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-hidden p-6 bg-[#090d13]">
          {/* TAB 1: API TELEMETRY LOG */}
          {activeTab === 'telemetry' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Endpoint Log List */}
              <div className="border border-[#1e293b] rounded-xl bg-[#0f172a] p-3 overflow-y-auto space-y-2">
                <div className="text-[11px] font-bold text-[#94a3b8] pb-1 border-b border-[#1e293b] flex justify-between">
                  <span>DISPATCHED ENDPOINT CALLS ({telemetry.length})</span>
                  <span className="text-[#38bdf8]">LIVE STREAM</span>
                </div>
                {telemetry.length === 0 ? (
                  <div className="text-center py-12 text-[#64748b]">No API calls logged yet.</div>
                ) : (
                  telemetry.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition ${
                        selectedLog?.id === log.id
                          ? 'bg-[#1e293b] border-[#38bdf8]'
                          : 'bg-[#141d2b] border-[#1e293b] hover:border-[#334155]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.method === 'POST'
                                ? 'bg-[#10b981]/20 text-[#34d399]'
                                : 'bg-[#0284c7]/20 text-[#38bdf8]'
                            }`}
                          >
                            {log.method}
                          </span>
                          <span className="font-bold text-white">{log.endpoint}</span>
                        </div>
                        <span className="text-[10px] text-[#64748b]">{log.latencyMs}ms</span>
                      </div>
                      <div className="text-[10px] text-[#94a3b8] mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()} &bull; 200 OK
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payload Inspection View */}
              <div className="border border-[#1e293b] rounded-xl bg-[#0f172a] p-4 flex flex-col justify-between overflow-hidden">
                <div className="space-y-3 flex-1 overflow-y-auto">
                  <div className="text-[11px] font-bold text-[#94a3b8] pb-1 border-b border-[#1e293b]">
                    PAYLOAD INSPECTOR // {selectedLog?.endpoint || 'N/A'}
                  </div>

                  {selectedLog ? (
                    <div className="space-y-3">
                      {selectedLog.requestBody && (
                        <div>
                          <span className="text-[10px] text-[#38bdf8] font-bold block mb-1">
                            REQUEST BODY:
                          </span>
                          <pre className="bg-[#0b0e14] p-3 rounded-lg border border-[#1e293b] text-[#cbd5e1] overflow-x-auto text-[11px]">
                            {JSON.stringify(selectedLog.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-[#34d399] font-bold block mb-1">
                          RESPONSE BODY (STATUS 200):
                        </span>
                        <pre className="bg-[#0b0e14] p-3 rounded-lg border border-[#1e293b] text-[#cbd5e1] overflow-x-auto text-[11px]">
                          {JSON.stringify(selectedLog.responseBody, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-[#64748b]">Select a log to view JSON payload</div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-[10px] text-[#64748b]">
                  <span>ARCHITECTURE: Python FastAPI (Simulated in MVP Service Layer)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BEVY ECS ARCHITECTURE SCHEMA */}
          {activeTab === 'ecs' && (
            <div className="space-y-4 h-full overflow-y-auto pr-2">
              <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#38bdf8]" />
                  BEVY ECS COMPONENT REGISTRY
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">GridPosition</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Properties: <code>x: i32, y: i32</code>. Core spatial coordination for all 50x50 tiles, walls, and combatants.
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">Health</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Properties: <code>current: f32, max: f32</code>. Hit points for Player (100), Security Guard (60), Wooden Wall (50).
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">Flammable</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Properties: <code>ignition_threshold: f32, burn_rate: 10.0</code>. Determines burning status and fire propagation.
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">HazardState</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Enum: <code>None, Fire, PoisonGas, Water</code>. Dictates environmental hazard state of discrete tiles.
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">Faction</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Enum: <code>Player, Security, Syndicate, Civilian</code>. Drives hostile detection and AI allegiance.
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">Explosive (BreachingCharge)</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Properties: <code>fuseTime: 2.5s, blastRadius: 2, damage: 50</code>. Triggers AoE demolition.
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">ResearchTaggedLoot (ADR 002)</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Properties: <code>itemId: string, tags: Record&lt;string, number&gt;, yield: Resources</code>. Embedded anomalous data tags.
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">WeaponHardpoint (ADR 007)</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Properties: <code>element: 'kinetic' | 'plasma', damage: f32, fireRate: f32, range: f32, cooldownTimer: f32</code>. Autonomous 360° lead-shielded rig hardpoint.
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">ProjectileComponent (ADR 007)</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Properties: <code>originX/Y, dirX/Y, speed, maxRange, element, isActive</code>. Pre-allocated memory pool (max 128) bypassing GC churn.
                    </p>
                  </div>
                  <div className="p-3 bg-[#141d2b] rounded-lg border border-[#1e293b]">
                    <span className="text-[#38bdf8] font-bold">ElementalResistance (ADR 007)</span>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      Properties: <code>kinetic: f32, plasma: f32</code>. Rock-Paper-Scissors matrix (Crawlers weak to kinetic 1.6x, Echo Guards weak to plasma 1.8x).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#10b981]" />
                  ACTIVE SYSTEM PIPELINES (DECOUPLED SCHEDULE - ADR 003 / ADR 007)
                </h3>
                <ul className="space-y-1.5 text-xs text-[#cbd5e1]">
                  <li>
                    <strong className="text-white">1. VisualInterpolationSystem (60Hz):</strong> Smoothly lerps entity visuals towards discrete grid coordinates.
                  </li>
                  <li>
                    <strong className="text-[#22d3ee]">2. ProjectileSystem (60Hz - ADR 007 DIVERT):</strong> Ticks pooled projectiles at sub-pixel velocities, executes O(1) grid-snap collisions, handles wall deflections/destructions, and registers elemental damage/knockbacks.
                  </li>
                  <li>
                    <strong className="text-white">3. ParticleSystem (60Hz):</strong> Updates trajectories, life, and fades sparks, smoke, and blast particles.
                  </li>
                  <li>
                    <strong className="text-white">4. DemolitionSystem (60Hz):</strong> Ticks Spacial Disruptor fuses (2.5s) and triggers 2-tile matter-erasing detonations.
                  </li>
                  <li>
                    <strong className="text-white">5. ExtractionSystem (60Hz):</strong> Monitors 5.0s Tether Point stabilization countdown for bunker evacuation.
                  </li>
                  <li>
                    <strong className="text-[#fbbf24]">6. AutoTargetSystem (10Hz - ADR 007 DIVERT):</strong> Scans 360° FOV, performs Bresenham LOS raycasts across grid tiles, selects closest hostile entity, and dispatches pooled projectiles from rig hardpoint.
                  </li>
                  <li>
                    <strong className="text-white">7. AiPatrolSystem (10Hz):</strong> 3-step loop: 1. Flee hazards &rarr; 2. LOS hostile scan for Operative &rarr; 3. Patrol routes.
                  </li>
                  <li>
                    <strong className="text-white">8. HazardSpreadSystem (2Hz - ADR 003/004 DIVERT):</strong> Matrix update across 2,500 tiles. Features Volumetric Dilution (T_child = T_parent * 0.65) to naturally dissipate aerosol spread, and triggers instant 1-tile AoE cascading explosions when Fire touches Gas!
                  </li>
                  <li>
                    <strong className="text-[#f87171]">9. EscalationSystem (2Hz - ADR 004):</strong> Tracks sector containment clock (180s). Triggers Reality Collapse gas flood advancing 1 ring inward every 5s from x,y=0,49 to 22.
                  </li>
                  <li>
                    <strong className="text-white">10. Faraday Upkeep &amp; Attrition (ADR 004):</strong> Real-time bunker shield maintenance (20 Scrap/hr, 1 Plasma/hr). Triggers unspent tag decay upon breach.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: STASH DATABASE & DEBUG */}
          {activeTab === 'state' && (
            <div className="space-y-4 h-full overflow-y-auto">
              <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">PERSISTENT HIDEOUT STATE</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        hideoutBackend.getHideoutTick();
                        setHideoutState(hideoutBackend.getState());
                      }}
                      className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] rounded text-[11px] text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      FORCE TICK
                    </button>
                    <button
                      onClick={() => {
                        hideoutBackend.resetState();
                        setHideoutState(hideoutBackend.getState());
                      }}
                      className="px-2 py-1 bg-[#7f1d1d] hover:bg-[#991b1b] rounded text-[11px] text-white flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      RESET DATA
                    </button>
                  </div>
                </div>

                <pre className="bg-[#0b0e14] p-4 rounded-xl border border-[#1e293b] text-[#34d399] overflow-x-auto text-[11px]">
                  {JSON.stringify(hideoutState, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
