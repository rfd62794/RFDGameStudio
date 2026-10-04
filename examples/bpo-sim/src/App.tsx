import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GridTile,
  Agent,
  ClientCampaign,
  CallScriptConfig,
  ITInfrastructure,
  HRPolicy,
  GameEvent,
  GameStats,
  TileType,
  LeadList,
  DialerConfig,
  QuotaState,
  DayVerdict,
} from './types';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_SCRIPT_CONFIG,
  INITIAL_IT_CONFIG,
  INITIAL_HR_CONFIG,
  generateInitialGrid,
  generateInitialAgents,
} from './utils/gameData';
import { CALL_CENTER_PHRASES } from './utils/names';
import { sounds } from './utils/audio';
import { createList, processListWork } from './systems/listSystem';
import {
  computeCallGenerationRate,
  dialerUpgradeCost,
  applyDialerUpgrade,
} from './systems/dialerSystem';
import { createQuota, updateProgress, resetDay, getDayVerdict } from './systems/quotaSystem';

import { IsometricOfficeCanvas } from './components/IsometricOfficeCanvas';
import { DashboardView } from './components/DashboardView';
import { FloorView } from './components/FloorView';
import { AfterHoursView } from './components/AfterHoursView';
import { BuildModal } from './components/BuildModal';
import { RecruitingModal } from './components/RecruitingModal';
import { ScriptModal } from './components/ScriptModal';
import { WageModal } from './components/WageModal';
import { HRModal } from './components/HRModal';
import { ITSupportModal } from './components/ITSupportModal';
import { TrainingModal } from './components/TrainingModal';
import { ReportsModal } from './components/ReportsModal';
import { StaffModal } from './components/StaffModal';
import { FacilitiesModal } from './components/FacilitiesModal';
import { AgentModal } from './components/AgentModal';
import { EventModal } from './components/EventModal';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';

type ActiveModalType = 
  | 'BUILD' 
  | 'RECRUITING' 
  | 'SCRIPT' 
  | 'WAGE' 
  | 'HR' 
  | 'IT' 
  | 'TRAINING' 
  | 'REPORTS' 
  | 'STAFF' 
  | 'FACILITIES' 
  | 'HELP' 
  | 'SETTINGS' 
  | null;

export default function App() {
  // Persistence initialization
  const [grid, setGrid] = useState<GridTile[]>(() => {
    const saved = localStorage.getItem('bpo_grid');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return generateInitialGrid();
  });

  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('bpo_agents');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return generateInitialAgents(generateInitialGrid());
  });

  // Game economy & time state — Day 1 start (no screenshot-matching hardcoding)
  const [money, setMoney] = useState<number>(50000); // Phase 2 balance placeholder
  const [day, setDay] = useState<number>(1);
  const [gameTimeMinutes, setGameTimeMinutes] = useState<number>(480); // 08:00 AM
  const [callsQueue, setCallsQueue] = useState<number>(0);
  const [totalAnsweredToday, setTotalAnsweredToday] = useState<number>(0);
  const [productivity, setProductivity] = useState<number>(81);
  const [happiness, setHappiness] = useState<number>(74);

  // Subsystems config
  const [campaigns, setCampaigns] = useState<ClientCampaign[]>(INITIAL_CAMPAIGNS);
  const [scriptConfig, setScriptConfig] = useState<CallScriptConfig>(INITIAL_SCRIPT_CONFIG);
  const [itConfig, setItConfig] = useState<ITInfrastructure>(INITIAL_IT_CONFIG);
  const [hrPolicy, setHrPolicy] = useState<HRPolicy>(INITIAL_HR_CONFIG);
  const [officeLevel, setOfficeLevel] = useState<number>(1);

  // Phase 1 core systems: List, Dialer, Quota
  const [activeList, setActiveList] = useState<LeadList>(() =>
    createList('starter-001', 'ACBS', 85, 90, 1000)
  );
  const [dialerConfig, setDialerConfig] = useState<DialerConfig>({
    pace: 6,
    tier: 1,
  });
  const [quota, setQuota] = useState<QuotaState>(() => createQuota(100, 120));

  // Phase 2 UI state
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'floor' | 'afterhours'>('dashboard');
  const [lastVerdict, setLastVerdict] = useState<DayVerdict | null>(null);

  // Interaction & Modals
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedTile, setSelectedTile] = useState<GridTile | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);

  // Build mode placement
  const [buildPlacementItem, setBuildPlacementItem] = useState<{
    type: TileType;
    name: string;
    cost: number;
  } | null>(null);

  // Settings
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Save game periodically
  useEffect(() => {
    try {
      localStorage.setItem('bpo_grid', JSON.stringify(grid));
      localStorage.setItem('bpo_agents', JSON.stringify(agents));
    } catch (e) {
      // Ignore quota limits
    }
  }, [grid, agents]);

  // Format Time to 12-Hour format (e.g. "11:30 AM")
  const formatTime = (totalMinutes: number): string => {
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Get current shift
  const getCurrentShift = (totalMinutes: number): string => {
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    if (hours24 >= 6 && hours24 < 14) return 'Morning Shift';
    if (hours24 >= 14 && hours24 < 22) return 'Mid Shift';
    return 'Graveyard Shift (Night Diff)';
  };

  // Capacity calculation — real counts, no cosmetic multiplier
  const totalDesks = grid.filter(t => t.type === 'CUBICLE').length;
  const displayEmployees = agents.length;
  const displayCapacity = totalDesks;

  // Main Simulation Loop
  useEffect(() => {
    if (gameSpeed === 0) return;

    const intervalTime = 1000 / gameSpeed;
    const timer = setInterval(() => {
      // 1. Advance Clock (10 minutes per real tick)
      setGameTimeMinutes(prev => {
        const next = prev + 5;
        if (next >= 1440) {
          // Day end: capture verdict, reset quota, open after-hours
          const verdict = getDayVerdict(quota);
          setLastVerdict(verdict);
          setDay(d => d + 1);
          setTotalAnsweredToday(0);
          setQuota(q => resetDay(q));
          setActiveScreen('afterhours');
          return 0;
        }
        return next;
      });

      // 2. Incoming Call Generation (List + Dialer driven)
      const availableAgents = agents.filter(
        a => a.state === 'IDLE' && a.energy > 20
      ).length;
      const generatedCalls = computeCallGenerationRate(
        dialerConfig,
        activeList,
        availableAgents
      );
      if (generatedCalls > 0) {
        setCallsQueue(q => Math.min(q + generatedCalls, 99));
        setActiveList(prev => processListWork(prev, generatedCalls));
        if (Math.random() < 0.2) {
          sounds.playPhoneRing();
        }
      }

      // 3. Agent Lifecycle & Call Handling
      setAgents(prevAgents => {
        let moneyEarned = 0;
        let callsHandled = 0;

        const updated = prevAgents.map(agent => {
          let updatedAgent = { ...agent };

          // A. If Idle and Calls waiting -> Pick up call!
          if (updatedAgent.state === 'IDLE' && callsQueue > 0 && updatedAgent.energy > 20) {
            setCallsQueue(q => Math.max(0, q - 1));
            updatedAgent.state = 'ON_CALL';
            updatedAgent.activeCallDuration = 0;

            // Random dialogue line
            if (Math.random() < 0.35) {
              const phrase = CALL_CENTER_PHRASES[Math.floor(Math.random() * CALL_CENTER_PHRASES.length)];
              updatedAgent.speechBubble = {
                text: phrase.text,
                icon: phrase.icon,
                expiresAt: Date.now() + 4000,
              };
            }
          }
          // B. If On Call -> Advance call progress
          else if (updatedAgent.state === 'ON_CALL') {
            updatedAgent.activeCallDuration += 8;

            // Occasional typing sound
            if (Math.random() < 0.15) {
              sounds.playTyping();
            }

            // Target handle time based on tech skill, script, pcTier
            const baseAHT = 240;
            const targetAHT = Math.max(
              120,
              baseAHT - (updatedAgent.techSkill * 0.4) - (itConfig.pcTier * 15)
            );

            if (updatedAgent.activeCallDuration >= targetAHT) {
              // Call completed!
              updatedAgent.state = 'ACW';
              updatedAgent.callsHandledToday += 1;
              updatedAgent.totalCallsHandled += 1;
              updatedAgent.energy = Math.max(0, updatedAgent.energy - 2);
              updatedAgent.stress = Math.min(100, updatedAgent.stress + 1);

              const activeCamp = campaigns.find(c => c.active) || campaigns[0];
              moneyEarned += activeCamp.payoutPerCall;
              callsHandled += 1;

              // CSAT rating calculation
              const surveyScore = Math.min(
                100,
                Math.floor(75 + (updatedAgent.empathySkill * 0.15) + (itConfig.headsetTier * 4))
              );
              updatedAgent.csat = Math.round((updatedAgent.csat * 0.9) + (surveyScore * 0.1));
            }
          }
          // C. If in ACW -> Transition to Idle or Break
          else if (updatedAgent.state === 'ACW') {
            if (Math.random() < 0.5) {
              if (updatedAgent.energy < 30) {
                updatedAgent.state = 'BREAK';
                updatedAgent.speechBubble = {
                  text: 'Kape muna sa pantry! ☕',
                  icon: '☕',
                  expiresAt: Date.now() + 5000,
                };
              } else {
                updatedAgent.state = 'IDLE';
              }
            }
          }
          // D. If on Break -> Replenish energy
          else if (updatedAgent.state === 'BREAK') {
            updatedAgent.energy = Math.min(100, updatedAgent.energy + 12);
            updatedAgent.stress = Math.max(0, updatedAgent.stress - 6);
            if (updatedAgent.energy >= 85) {
              updatedAgent.state = 'IDLE';
            }
          }

          return updatedAgent;
        });

        if (moneyEarned > 0) {
          setMoney(m => m + moneyEarned);
          setTotalAnsweredToday(cnt => cnt + callsHandled);
          setQuota(prev => updateProgress(prev, callsHandled));
          if (Math.random() < 0.4) {
            sounds.playCash();
          }
        }

        return updated;
      });

      // 4. Random BPO Floor Incidents (1 in 80 ticks)
      if (Math.random() < 0.015 && !activeEvent) {
        triggerRandomBPOEvent();
      }

      // 5. Update Productivity & Happiness metric
      setProductivity(prev => {
        const busyCount = agents.filter(a => a.state === 'ON_CALL' || a.state === 'ACW').length;
        const targetProd = Math.round((busyCount / Math.max(agents.length, 1)) * 100);
        return Math.min(99, Math.max(65, Math.round(prev * 0.95 + targetProd * 0.05)));
      });

      setHappiness(prev => {
        const avgEnergy = agents.reduce((acc, a) => acc + a.energy, 0) / Math.max(agents.length, 1);
        const avgStress = agents.reduce((acc, a) => acc + a.stress, 0) / Math.max(agents.length, 1);
        const calculated = Math.round((avgEnergy + (100 - avgStress) + (hrPolicy.basePayMultiplier * 20)) / 2.2);
        return Math.min(98, Math.max(50, Math.round(prev * 0.95 + calculated * 0.05)));
      });

    }, intervalTime);

    return () => clearInterval(timer);
  }, [gameSpeed, callsQueue, campaigns, itConfig, hrPolicy, activeEvent, agents, dialerConfig, activeList, quota]);

  // Phase 2: screen / planning handlers
  const handlePaceChange = (newPace: number) => {
    setDialerConfig(prev => ({
      ...prev,
      pace: Math.max(1, Math.min(20, newPace)),
    }));
  };

  const handleUpgradeDialer = () => {
    const cost = dialerUpgradeCost(dialerConfig.tier);
    if (money >= cost) {
      setMoney(prev => prev - cost);
      setDialerConfig(prev => applyDialerUpgrade(prev));
    }
  };

  const handleRequestNewList = () => {
    setActiveList(createList('acbs-daily', 'ACBS', 85, 90, 1000));
  };

  const handleStartNextDay = () => {
    setActiveScreen('dashboard');
  };

  // Trigger exciting BPO events
  const triggerRandomBPOEvent = () => {
    sounds.playAlert();
    const eventPool: GameEvent[] = [
      {
        id: 'typhoon',
        title: '🌀 TYPHOON WARNING SIGNAL #3 ADVISORY',
        description: 'Heavy rains and EDSA flooding across Metro Manila! Transportation is halted. Graveyard shift agents need shelter and support.',
        severity: 'warning',
        options: [
          {
            label: 'Provide Free Shuttle, Food & Sleeping Cots',
            cost: 25000,
            effectDescription: '+20% Morale, Zero Absenteeism, Floor stays at 100% capacity!',
            action: () => {
              setMoney(m => m - 25000);
              setHappiness(h => Math.min(99, h + 15));
            }
          },
          {
            label: 'Offer Double Hazard Pay for Agents who Report',
            cost: 45000,
            effectDescription: '+30% Morale, High Productivity boost!',
            action: () => {
              setMoney(m => m - 45000);
              setHappiness(h => Math.min(99, h + 20));
            }
          },
          {
            label: 'Run Minimum Skeletal Workforce',
            cost: 0,
            effectDescription: 'Saves money, but Call Queue spikes by +15 calls.',
            action: () => {
              setCallsQueue(q => q + 15);
            }
          }
        ]
      },
      {
        id: 'fiber_cut',
        title: '🌐 PLDT SUBMARINE CABLE CUT ADVISORY',
        description: 'Undersea fiber cable hit by anchor off Luzon! Floor VoIP ping spiking to 450ms. Calls are dropping!',
        severity: 'critical',
        options: [
          {
            label: 'Engage IT Emergency Dual-Fiber Failover',
            cost: 18000,
            effectDescription: 'Bandwidth rerouted through Globe & Starlink within 60 seconds!',
            action: () => {
              setMoney(m => m - 18000);
              setItConfig(it => ({ ...it, serverHealth: 100 }));
            }
          },
          {
            label: 'Throttle High-Definition Audio to Low Bandwidth',
            cost: 0,
            effectDescription: 'Prevents dropped calls, but -5% CSAT.',
            action: () => {
              setHappiness(h => Math.max(50, h - 5));
            }
          }
        ]
      },
      {
        id: 'client_bonus',
        title: '🎉 US CLIENT LEADERSHIP FLOOR AUDIT',
        description: 'The Client Vice President from California visited the floor! They were blown away by our 90%+ CSAT and polite agents.',
        severity: 'reward',
        options: [
          {
            label: 'Accept Client Quality SLA Bonus Award',
            cost: 0,
            effectDescription: '+₱ 85,000 Cash Bonus credited to company account!',
            action: () => {
              sounds.playCash();
              setMoney(m => m + 85000);
              setHappiness(h => Math.min(99, h + 10));
            }
          }
        ]
      },
      {
        id: 'pizza_friday',
        title: '🍕 JOLLIBEE & PIZZA SURPRISE SPONSORED',
        description: 'A satisfied US VIP caller sent 20 buckets of Chickenjoy and 15 Yellow Cab pizzas directly to the pantry!',
        severity: 'reward',
        options: [
          {
            label: 'Distribute Feast to Floor Pods A through F',
            cost: 0,
            effectDescription: 'Agents fully energized! Energy +30%, Stress wiped out!',
            action: () => {
              sounds.playLevelUp();
              setAgents(prev => prev.map(a => ({ ...a, energy: 100, stress: 5, morale: 95 })));
              setHappiness(h => Math.min(99, h + 12));
            }
          }
        ]
      }
    ];

    const chosen = eventPool[Math.floor(Math.random() * eventPool.length)];
    setActiveEvent(chosen);
  };

  // Build item placement handler
  const handlePlaceBuildItem = (x: number, y: number) => {
    if (!buildPlacementItem) return;

    if (x < 0 || y < 0) {
      // Cancelled
      setBuildPlacementItem(null);
      return;
    }

    // Check if target tile is empty floor
    const tile = grid.find(t => t.x === x && t.y === y);
    if (!tile || tile.type !== 'FLOOR') {
      sounds.playAlert();
      return;
    }

    if (money < buildPlacementItem.cost) {
      sounds.playAlert();
      setBuildPlacementItem(null);
      return;
    }

    sounds.playCash();
    setMoney(m => m - buildPlacementItem.cost);

    setGrid(prev => prev.map(t => {
      if (t.x === x && t.y === y) {
        return {
          ...t,
          type: buildPlacementItem.type,
          label: buildPlacementItem.type === 'CUBICLE' ? String.fromCharCode(65 + (x % 6)) : undefined,
          qualityLevel: 1,
        };
      }
      return t;
    }));

    setBuildPlacementItem(null);
  };

  // Handle Hiring an Agent
  const handleHireAgent = (cand: Omit<Agent, 'id' | 'deskId' | 'gridX' | 'gridY'>) => {
    const emptyCubicle = grid.find(t => t.type === 'CUBICLE' && !t.assignedAgentId);
    const newId = `agent_${Date.now()}`;

    const newAgent: Agent = {
      ...cand,
      id: newId,
      deskId: emptyCubicle ? emptyCubicle.id || null : null,
      gridX: emptyCubicle ? emptyCubicle.x : 4,
      gridY: emptyCubicle ? emptyCubicle.y : 3,
    };

    if (emptyCubicle) {
      setGrid(prev => prev.map(t => t.id === emptyCubicle.id ? { ...t, assignedAgentId: newId } : t));
    }

    setAgents(prev => [...prev, newAgent]);
    const signingBonus = Math.floor(cand.salary * 0.2);
    setMoney(m => Math.max(0, m - signingBonus));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans select-none text-slate-100">
      
      {/* 1. TOP-LEFT LOGO & LEFT ACTION TOOLBAR */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 pointer-events-auto">
        
        {/* FILIPINO BPO SIMULATOR Header matching the screenshot */}
        <div className="bg-slate-900/95 border-2 border-slate-700 rounded-xl p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3">
          {/* Agent Avatar Badge */}
          <div className="w-10 h-10 rounded-lg bg-sky-950 border-2 border-sky-400 flex items-center justify-center text-xl shadow-inner shrink-0 font-pixel">
            👨‍💼
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-pixel text-[11px] text-white tracking-wider font-extrabold drop-shadow">
                FILIPINO
              </h1>
              {/* BPO Philippine Flag Colors Badge */}
              <div className="flex items-center bg-gradient-to-r from-blue-700 via-amber-400 to-red-600 px-1.5 py-0.5 rounded text-[9px] font-black text-white font-pixel shadow tracking-widest border border-white/20">
                BPO
              </div>
            </div>
            <h2 className="font-pixel text-[10px] text-sky-400 tracking-wide mt-0.5">
              SIMULATOR
            </h2>
          </div>
        </div>

        {/* Action Buttons matching screenshot exactly */}
        <div className="flex flex-col gap-1.5 w-48">
          
          {/* BUILD - Green Accent Button as shown in screenshot */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('BUILD');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 pixel-btn flex items-center gap-2.5 shadow-lg active:scale-95 transition-all text-left"
          >
            <span className="text-base">🏢</span>
            <span>BUILD</span>
          </button>

          {/* RECRUITING */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('RECRUITING');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">👨‍💼</span>
            <span>RECRUITING</span>
          </button>

          {/* CREATE NEW SCRIPT */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('SCRIPT');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[9px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">📜</span>
            <span>CREATE NEW SCRIPT</span>
          </button>

          {/* WAGE MGMT */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('WAGE');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">₱</span>
            <span>WAGE MGMT</span>
          </button>

          {/* HR */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('HR');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">💼</span>
            <span>HR</span>
          </button>

          {/* IT SUPPORT */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('IT');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">🔧</span>
            <span>IT SUPPORT</span>
          </button>

          {/* TRAINING */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('TRAINING');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">🏅</span>
            <span>TRAINING</span>
          </button>

          {/* REPORTS */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('REPORTS');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">📊</span>
            <span>REPORTS</span>
          </button>

          {/* STAFF */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('STAFF');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">📋</span>
            <span>STAFF</span>
          </button>

          {/* FACILITIES */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveModal('FACILITIES');
            }}
            className="w-full py-2 px-3 rounded-lg font-pixel text-[10px] tracking-wide text-white bg-sky-700 hover:bg-sky-600 border-2 border-sky-500 pixel-btn flex items-center gap-2.5 shadow-md active:scale-95 transition-all text-left"
          >
            <span className="text-base">🏢</span>
            <span>FACILITIES</span>
          </button>
        </div>
      </div>

      {/* 2. TOP-RIGHT TOOLBAR (?, ⚙️) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
        {/* Help button */}
        <button
          onClick={() => {
            sounds.playClick();
            setActiveModal('HELP');
          }}
          className="w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 border-2 border-sky-400 text-white font-pixel text-sm flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="How to Play"
        >
          ?
        </button>

        {/* Settings button */}
        <button
          onClick={() => {
            sounds.playClick();
            setActiveModal('SETTINGS');
          }}
          className="w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 border-2 border-sky-400 text-white text-lg flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {/* 3. CENTER VIEW: Dashboard / Floor / After-Hours */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {activeScreen === 'dashboard' && (
          <DashboardView
            quota={quota}
            activeList={activeList}
            dialerConfig={dialerConfig}
            callsQueue={callsQueue}
            totalAnsweredToday={totalAnsweredToday}
            productivity={productivity}
            happiness={happiness}
            money={money}
            day={day}
            gameTime={formatTime(gameTimeMinutes)}
            onPaceChange={handlePaceChange}
            onGoToFloor={() => setActiveScreen('floor')}
          />
        )}
        {activeScreen === 'floor' && (
          <FloorView
            grid={grid}
            agents={agents}
            selectedAgent={selectedAgent}
            selectedTile={selectedTile}
            gameTimeMinutes={gameTimeMinutes}
            buildPlacementItem={buildPlacementItem}
            onSelectAgent={setSelectedAgent}
            onSelectTile={setSelectedTile}
            onPlaceBuildItem={handlePlaceBuildItem}
            onGoToDashboard={() => setActiveScreen('dashboard')}
          />
        )}
        {activeScreen === 'afterhours' && (
          <AfterHoursView
            money={money}
            day={day}
            quota={quota}
            dialerConfig={dialerConfig}
            activeList={activeList}
            upgradeCost={dialerUpgradeCost(dialerConfig.tier)}
            lastVerdict={lastVerdict}
            onUpgradeDialer={handleUpgradeDialer}
            onRequestNewList={handleRequestNewList}
            onStartNextDay={handleStartNextDay}
          />
        )}
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <div className="h-12 bg-slate-900/95 border-t-2 border-slate-700 shadow-2xl backdrop-blur-md px-4 flex items-center justify-between z-30 font-pixel text-[10px] text-slate-100 overflow-x-auto gap-4">
        
        {/* Left segment: Money & Day */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Money with coin icon */}
          <div className="flex items-center gap-1.5 text-amber-300">
            <span className="text-sm">🪙</span>
            <span className="font-bold">₱ {money.toLocaleString()}</span>
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {/* Day */}
          <div className="text-slate-300">
            Day {day}
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {/* Clock & Shift */}
          <div className="text-sky-300 flex items-center gap-1.5" title={getCurrentShift(gameTimeMinutes)}>
            <span>{formatTime(gameTimeMinutes)}</span>
          </div>
        </div>

        {/* Center segment: Employees, Happiness, Productivity */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Employees count */}
          <div className="text-slate-300">
            Employees: <span className="text-sky-400 font-bold">{displayEmployees}/{displayCapacity}</span>
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {/* Employee Happiness */}
          <div className="text-slate-300 flex items-center gap-1">
            <span>Employee Happiness:</span>
            <span className={`font-bold ${happiness >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {happiness}%
            </span>
            <span>{happiness >= 80 ? '😄' : happiness >= 65 ? '😊' : '😐'}</span>
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {/* Productivity */}
          <div className="text-slate-300">
            Productivity: <span className="text-emerald-400 font-bold">{productivity}%</span>
          </div>
        </div>

        {/* Right segment: Calls Queue with alert animation if high */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
            callsQueue > 25
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : callsQueue > 15
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : 'bg-slate-800 border-slate-700 text-sky-300'
          }`}>
            <span>📞</span>
            <span>Calls Queue:</span>
            <span className="font-bold font-mono text-xs">{callsQueue}</span>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE MODALS */}
      <BuildModal
        isOpen={activeModal === 'BUILD'}
        onClose={() => setActiveModal(null)}
        money={money}
        onSelectBuildItem={(type, name, cost) => {
          setBuildPlacementItem({ type, name, cost });
        }}
      />

      <RecruitingModal
        isOpen={activeModal === 'RECRUITING'}
        onClose={() => setActiveModal(null)}
        money={money}
        availableDesksCount={Math.max(0, totalDesks - agents.filter(a => a.deskId).length)}
        onHireAgent={handleHireAgent}
      />

      <ScriptModal
        isOpen={activeModal === 'SCRIPT'}
        onClose={() => setActiveModal(null)}
        currentScript={scriptConfig}
        onSaveScript={(newScript) => setScriptConfig(newScript)}
      />

      <WageModal
        isOpen={activeModal === 'WAGE'}
        onClose={() => setActiveModal(null)}
        money={money}
        totalAgents={agents.length}
        currentPolicy={hrPolicy}
        onUpdatePolicy={(newPolicy) => setHrPolicy(newPolicy)}
      />

      <HRModal
        isOpen={activeModal === 'HR'}
        onClose={() => setActiveModal(null)}
        money={money}
        happiness={happiness}
        onTriggerPerk={(title, cost, moraleBoost, happinessBoost) => {
          setMoney(m => Math.max(0, m - cost));
          setHappiness(h => Math.min(99, h + happinessBoost));
          setAgents(prev => prev.map(a => ({
            ...a,
            morale: Math.min(100, a.morale + moraleBoost),
            stress: Math.max(0, a.stress - 20),
            energy: Math.min(100, a.energy + 15),
          })));
        }}
      />

      <ITSupportModal
        isOpen={activeModal === 'IT'}
        onClose={() => setActiveModal(null)}
        money={money}
        itConfig={itConfig}
        onUpgradeIT={(newConfig, cost) => {
          setMoney(m => m - cost);
          setItConfig(newConfig);
        }}
      />

      <TrainingModal
        isOpen={activeModal === 'TRAINING'}
        onClose={() => setActiveModal(null)}
        money={money}
        onRunTraining={(title, cost, skillType, amount) => {
          setMoney(m => Math.max(0, m - cost));
          setAgents(prev => prev.map(a => {
            const updated = { ...a };
            if (skillType === 'english') updated.englishSkill = Math.min(100, a.englishSkill + amount);
            if (skillType === 'empathy') updated.empathySkill = Math.min(100, a.empathySkill + amount);
            if (skillType === 'tech') updated.techSkill = Math.min(100, a.techSkill + amount);
            if (skillType === 'speed') updated.speed = Math.min(100, a.speed + amount);
            return updated;
          }));
        }}
      />

      <ReportsModal
        isOpen={activeModal === 'REPORTS'}
        onClose={() => setActiveModal(null)}
        stats={{
          money,
          day,
          gameTimeMinutes,
          callsQueue,
          totalCallsToday: totalAnsweredToday + callsQueue,
          totalAnsweredToday,
          totalAbandonedToday: Math.floor(callsQueue * 0.1),
          slaPercent: 86,
          avgProductivity: productivity,
          avgHappiness: happiness,
          rating: 4.8,
          reputation: 85,
          officeLevel,
        }}
        campaigns={campaigns}
        totalStaff={agents.length}
      />

      <StaffModal
        isOpen={activeModal === 'STAFF'}
        onClose={() => setActiveModal(null)}
        agents={agents}
        onSelectAgent={(agent) => setSelectedAgent(agent)}
        onSendBreak={(agentId) => {
          setAgents(prev => prev.map(a => a.id === agentId ? { ...a, state: 'BREAK' } : a));
        }}
        onGiveBonus={(agentId, amount) => {
          if (money >= amount) {
            setMoney(m => m - amount);
            setAgents(prev => prev.map(a => a.id === agentId ? {
              ...a,
              morale: Math.min(100, a.morale + 15),
              stress: Math.max(0, a.stress - 15),
              bonusEarned: a.bonusEarned + amount,
            } : a));
          }
        }}
      />

      <FacilitiesModal
        isOpen={activeModal === 'FACILITIES'}
        onClose={() => setActiveModal(null)}
        money={money}
        currentOfficeLevel={officeLevel}
        onUpgradeSite={(newLevel, cost, name) => {
          setMoney(m => m - cost);
          setOfficeLevel(newLevel);
          sounds.playLevelUp();
        }}
      />

      <AgentModal
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onSendBreak={(agentId) => {
          setAgents(prev => prev.map(a => a.id === agentId ? { ...a, state: 'BREAK' } : a));
          setSelectedAgent(prev => prev?.id === agentId ? { ...prev, state: 'BREAK' } : prev);
        }}
        onGiveDrink={(agentId) => {
          if (money >= 150) {
            setMoney(m => m - 150);
            setAgents(prev => prev.map(a => a.id === agentId ? { ...a, energy: Math.min(100, a.energy + 35) } : a));
            setSelectedAgent(prev => prev?.id === agentId ? { ...prev, energy: Math.min(100, prev.energy + 35) } : prev);
          }
        }}
        onGiveBonus={(agentId, amount) => {
          if (money >= amount) {
            setMoney(m => m - amount);
            setAgents(prev => prev.map(a => a.id === agentId ? {
              ...a,
              morale: Math.min(100, a.morale + 20),
              stress: Math.max(0, a.stress - 20),
              bonusEarned: a.bonusEarned + amount,
            } : a));
            setSelectedAgent(prev => prev?.id === agentId ? {
              ...prev,
              morale: Math.min(100, prev.morale + 20),
              stress: Math.max(0, prev.stress - 20),
              bonusEarned: prev.bonusEarned + amount,
            } : prev);
          }
        }}
        onPromote={(agentId) => {
          setAgents(prev => prev.map(a => a.id === agentId ? {
            ...a,
            role: 'TL',
            salary: 38000,
            morale: 100,
          } : a));
          setSelectedAgent(prev => prev?.id === agentId ? {
            ...prev,
            role: 'TL',
            salary: 38000,
            morale: 100,
          } : prev);
        }}
        onFire={(agentId) => {
          setAgents(prev => prev.filter(a => a.id !== agentId));
          setGrid(prev => prev.map(t => t.assignedAgentId === agentId ? { ...t, assignedAgentId: null } : t));
          setSelectedAgent(null);
        }}
      />

      <EventModal
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
      />

      <HelpModal
        isOpen={activeModal === 'HELP'}
        onClose={() => setActiveModal(null)}
      />

      <SettingsModal
        isOpen={activeModal === 'SETTINGS'}
        onClose={() => setActiveModal(null)}
        gameSpeed={gameSpeed}
        onSetGameSpeed={(speed) => setGameSpeed(speed)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(s => !s)}
        onResetGame={() => {
          localStorage.removeItem('bpo_grid');
          localStorage.removeItem('bpo_agents');
          setGrid(generateInitialGrid());
          setAgents(generateInitialAgents(generateInitialGrid()));
          setMoney(50000);
          setDay(1);
          setGameTimeMinutes(480);
          setCallsQueue(0);
          setTotalAnsweredToday(0);
          setActiveList(createList('starter-001', 'ACBS', 85, 90, 1000));
          setDialerConfig({ pace: 6, tier: 1 });
          setQuota(createQuota(100, 120));
          setActiveScreen('dashboard');
          setLastVerdict(null);
        }}
      />
    </div>
  );
}
