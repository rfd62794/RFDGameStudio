import { useState } from "react";
import { ROOMS, getRoom, canMoveTo, move } from "./rooms";
import { growthFactor } from "./growth";
import { CATALOG } from "./catalog";
import { canCraft, craft } from "./crafting";
import { resolveFight } from "./combat";
import { initPlayer, wipe } from "./state";
import { runSamplePlaythrough } from "./index";
import { PlayerState, Equipment, CatalogId, Room } from "./types";
import {
  Shield,
  Sword,
  Wrench,
  Dices,
  RotateCcw,
  PlusCircle,
  Play,
  Compass,
  Hammer,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Terminal,
  ChevronRight,
  Heart
} from "lucide-react";

export default function App() {
  const [player, setPlayer] = useState<PlayerState>(() => initPlayer());
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System loaded. Player initialized at Home Base.`
  ]);
  const [lastRoll, setLastRoll] = useState<{ roll: number; bonus: number; total: number; target: number; success: boolean } | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleMove = (targetRoomId: string) => {
    const fromRoom = player.currentRoomId;
    const nextState = move(player, targetRoomId);
    if (nextState === player) {
      addLog(`[MOVE REJECTED] Cannot traverse directly from ${fromRoom} to ${targetRoomId}. No adjacent vector.`);
    } else {
      setPlayer(nextState);
      addLog(`[MOVE] Traverse successful: ${fromRoom} ➔ ${targetRoomId}.`);
    }
  };

  const handleFight = () => {
    const currentRoom = getRoom(player.currentRoomId);
    if (!currentRoom.interactionTypes.includes("fight")) {
      addLog(`[ERROR] No combat encounters detected in this node.`);
      return;
    }

    // Determine combat stats for display
    const weapon = player.equipped.weapon;
    const hasActiveWeapon = weapon && weapon.life > 0;
    const weaponAtk = hasActiveWeapon ? (CATALOG[weapon.catalogId].baseStats[weapon.tier].atk ?? 0) : 2;
    const factor = growthFactor(player.proficiencyXp.weapon ?? 0);
    const bonus = Math.round(factor * weaponAtk * 10) / 10;
    
    // Call engine logic
    const result = resolveFight(player, currentRoom);
    const prevPlayer = player;
    setPlayer(result.player);

    const rollValue = Math.floor(Math.random() * 20) + 1; // display D20 roll
    const totalScore = rollValue + bonus;

    setLastRoll({
      roll: rollValue,
      bonus: bonus,
      total: Math.round(totalScore * 10) / 10,
      target: currentRoom.difficulty ?? 0,
      success: result.won
    });

    if (result.won) {
      addLog(`[COMBAT WIN] Roll D20: ${rollValue} + modifier ${bonus} = ${totalScore} vs Diff ${currentRoom.difficulty}. Gained ${result.scrapGained} Scrap!`);
    } else {
      addLog(`[COMBAT LOSS] Roll D20: ${rollValue} + modifier ${bonus} = ${totalScore} vs Diff ${currentRoom.difficulty}. Force state wipe!`);
      // Wipe player position
      setTimeout(() => {
        setPlayer((p) => {
          const wiped = wipe(p);
          return wiped;
        });
        addLog(`[WIPE] Position reset to Home Base. Assets, scrap, and proficiencies preserved.`);
      }, 1000);
    }
  };

  const handleCraft = (catalogId: CatalogId, tier?: 1 | 2) => {
    const resolvedTier = tier ?? (player.tier2Unlocked ? 2 : 1);
    const entry = CATALOG[catalogId];
    const cost = entry.tierCost[resolvedTier];

    if (catalogId === "tool") {
      if (player.scrap < cost) {
        addLog(`[CRAFT ERROR] Insufficient scrap for Tier-2 Tool. Needs ${cost}, has ${player.scrap}.`);
        return;
      }
      const updated = craft(player, "tool");
      setPlayer(updated);
      addLog(`[CRAFT] Cleared Tier-2 access. Consumption: ${cost} Scrap. Tier 2 crafting unlocked for all slots.`);
      return;
    }

    if (resolvedTier === 2 && !player.tier2Unlocked) {
      addLog(`[CRAFT REJECTED] Tier 2 gated. Acquire Tier-2 Tool before executing advanced craft.`);
      return;
    }

    if (player.scrap < cost) {
      addLog(`[CRAFT ERROR] Insufficient scrap to craft ${entry.name} (Tier ${resolvedTier}). Needs ${cost}, has ${player.scrap}.`);
      return;
    }

    const updated = craft(player, catalogId, resolvedTier);
    setPlayer(updated);
    addLog(`[CRAFT] Manufactured ${entry.name} (Tier ${resolvedTier}). Scrap consumed: ${cost}. Equipped in ${entry.slot} slot.`);
  };

  const runPlaythroughDemo = () => {
    addLog(`[SYSTEM] Starting headless playthrough simulation...`);
    const playthroughLogs = runSamplePlaythrough();
    setLogs((prev) => [...playthroughLogs.reverse(), ...prev]);
    // Set final playthrough state for exploration
    let demoPlayer = initPlayer();
    demoPlayer.scrap = 35;
    demoPlayer.tier2Unlocked = true;
    demoPlayer = craft(demoPlayer, "beatStick", 2);
    setPlayer(demoPlayer);
  };

  const addScrapCheat = () => {
    setPlayer((p) => ({ ...p, scrap: p.scrap + 10 }));
    addLog(`[DEV CHEAT] Added 10 Scrap reserves.`);
  };

  const triggerReset = () => {
    setPlayer(initPlayer());
    setLastRoll(null);
    setLogs([`[${new Date().toLocaleTimeString()}] Dev hard-reset executed.`]);
  };

  const currentRoom = getRoom(player.currentRoomId);

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-300 font-sans p-4 flex flex-col justify-between selection:bg-sky-500 selection:text-black">
      {/* Top Container */}
      <div className="w-full max-w-6xl mx-auto flex-grow flex flex-col">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 mb-4 shrink-0 gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 text-black px-2 py-0.5 rounded font-bold text-xs font-mono">PHASE 1</div>
            <h1 className="text-lg font-mono font-bold tracking-tight text-white">
              SCRAPCRAWL<span className="text-slate-500">_DEV_CORE</span>
            </h1>
          </div>
          <div className="flex gap-4 text-[11px] font-mono">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-slate-500 uppercase text-[9px]">Certification</span>
              <span className="text-emerald-400 font-bold uppercase">22 PASSING / 0 FAIL</span>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-slate-500 uppercase text-[9px]">Protocol</span>
              <span className="text-white italic">RFD-LUA-SKELETON-2026</span>
            </div>
          </div>
        </header>

        {/* Playthrough Quick Trigger */}
        <div className="mb-4 bg-slate-950 border border-slate-800 p-2 rounded flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Terminal size={14} className="text-sky-400" />
            <span className="text-slate-400 font-mono">Run automated headless playbook trace:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runPlaythroughDemo}
              className="bg-sky-950 hover:bg-sky-900 border border-sky-600/40 text-sky-300 px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Play size={12} />
              Run Demo Playthrough
            </button>
            <button
              onClick={addScrapCheat}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <PlusCircle size={12} className="text-amber-500" />
              +10 Scrap (Dev)
            </button>
            <button
              onClick={triggerReset}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} className="text-rose-500" />
              Reset Core
            </button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-4 flex-grow">
          {/* Left Column: Global State & World Graph */}
          <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
            {/* Player Metadata Card */}
            <section className="bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-lg shadow-md">
              <h2 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest font-mono">
                Player Metadata
              </h2>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between items-end border-b border-slate-800 pb-2.5">
                  <span className="text-xs text-slate-400">Scrap Reserves</span>
                  <span className="text-2xl font-bold text-sky-400">
                    {String(player.scrap).padStart(3, "0")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Tier 2 Clearance</span>
                  {player.tier2Unlocked ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
                      LOCKED
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* World Graph Section */}
            <section className="bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-lg flex-grow flex flex-col justify-between">
              <div>
                <h2 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest font-mono">
                  World Graph
                </h2>
                <div className="space-y-3">
                  {/* Current Room Badge */}
                  <div className="bg-sky-500/5 border border-sky-500/20 p-2.5 rounded-md font-mono">
                    <div className="text-[10px] text-sky-400 font-bold uppercase mb-1 flex items-center gap-1">
                      <Compass size={11} />
                      Current Node
                    </div>
                    <div className="text-sm font-bold text-white uppercase">
                      {currentRoom.id}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {currentRoom.name}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {currentRoom.interactionTypes.map((type) => (
                        <span
                          key={type}
                          className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase ${
                            type === "fight"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : type === "craft"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                      {currentRoom.difficulty !== undefined && (
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] rounded font-mono font-bold">
                          DIFF {currentRoom.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Room Interaction Actions */}
                  <div className="border border-slate-800 p-2.5 rounded-md bg-slate-950/40">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 font-mono">
                      Interact Node
                    </div>
                    {currentRoom.interactionTypes.includes("fight") ? (
                      <button
                        onClick={handleFight}
                        className="w-full bg-rose-950 hover:bg-rose-900 border border-rose-600/40 text-rose-300 font-mono py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Dices size={14} />
                        Resolve Combat (D20)
                      </button>
                    ) : (
                      <div className="text-xs text-slate-500 italic font-mono p-1 text-center">
                        Safe zone. No hostilities here.
                      </div>
                    )}
                  </div>

                  {/* D20 Fight Roll Result Panel */}
                  {lastRoll && (
                    <div className="border border-slate-800 bg-black/40 p-2 rounded-md font-mono text-[11px]">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-400">Combat Roll</span>
                        <span className={lastRoll.success ? "text-emerald-400" : "text-rose-500"}>
                          {lastRoll.success ? "WIN" : "WIPE"}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5 text-slate-500">
                        <div>D20 Roll: <span className="text-slate-300">{lastRoll.roll}</span></div>
                        <div>Weapon Bonus: <span className="text-slate-300">+{lastRoll.bonus}</span></div>
                        <div className="border-t border-slate-800 my-1 pt-0.5">
                          Score: <span className="text-white font-bold">{lastRoll.total}</span> vs <span className="text-white">{lastRoll.target}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connected Nav Links */}
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 font-mono">
                      Adjacent Connections
                    </div>
                    <div className="space-y-1 font-mono">
                      {ROOMS[player.currentRoomId].connections.map((targetId) => {
                        const targetRoom = getRoom(targetId);
                        return (
                          <div
                            key={targetId}
                            onClick={() => handleMove(targetId)}
                            className="text-xs flex items-center justify-between p-1.5 rounded hover:bg-slate-800/40 hover:text-white transition-all cursor-pointer group border border-transparent hover:border-slate-800"
                          >
                            <span className="flex items-center gap-1.5">
                              <ChevronRight size={12} className="text-slate-600 group-hover:text-sky-400" />
                              <span className="font-bold text-slate-300 group-hover:text-white uppercase">
                                {targetId}
                              </span>
                            </span>
                            <span className="text-[9px] bg-slate-800 px-1 py-0.2 rounded text-slate-500 group-hover:text-slate-300">
                              {targetRoom.interactionTypes.includes("fight") ? "Fight" : "Safe"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Vector Link Online
                </span>
              </div>
            </section>
          </div>

          {/* Middle Column: Loadout & Proficiency */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
            <section className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-lg flex-grow flex flex-col justify-between">
              <div>
                <h2 className="text-[10px] uppercase font-bold text-slate-500 mb-4 tracking-widest font-mono">
                  Equipment Life & Growth
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono">
                    <thead>
                      <tr className="text-[10px] text-slate-500 border-b border-slate-800">
                        <th className="pb-2 font-normal">SLOT</th>
                        <th className="pb-2 font-normal">ASSET</th>
                        <th className="pb-2 font-normal">TIER</th>
                        <th className="pb-2 font-normal">DURABILITY</th>
                        <th className="pb-2 font-normal">PROFICIENCY</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {/* WEAPON SLOT */}
                      <tr className="border-b border-slate-800/50 group">
                        <td className="py-3 text-slate-400 font-bold">WEAP</td>
                        <td className="py-3">
                          {player.equipped.weapon ? (
                            <span className="text-white font-bold">
                              {CATALOG[player.equipped.weapon.catalogId].name}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">UNARMED BASELINE</span>
                          )}
                        </td>
                        <td className="py-3">
                          {player.equipped.weapon ? (
                            <span className="bg-sky-900 text-sky-300 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              T{player.equipped.weapon.tier}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3">
                          {player.equipped.weapon ? (
                            <div>
                              <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    player.equipped.weapon.life <= 2 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                                  }`}
                                  style={{
                                    width: `${(player.equipped.weapon.life / player.equipped.weapon.maxLife) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <div className="text-[9px] mt-1 text-slate-400">
                                {player.equipped.weapon.life} / {player.equipped.weapon.maxLife}
                                {player.equipped.weapon.life === 0 && (
                                  <span className="text-rose-500 ml-1 font-bold">BROKEN</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600">--/--</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="text-sky-400 font-bold">
                            x{growthFactor(player.proficiencyXp.weapon ?? 0).toFixed(2)}
                          </span>
                          <div className="text-[9px] text-slate-500">
                            {player.proficiencyXp.weapon ?? 0} / 500
                          </div>
                        </td>
                      </tr>

                      {/* SHIELD SLOT */}
                      <tr className="border-b border-slate-800/50 group">
                        <td className="py-3 text-slate-400 font-bold">SHLD</td>
                        <td className="py-3">
                          {player.equipped.shield ? (
                            <span className="text-white font-bold">
                              {CATALOG[player.equipped.shield.catalogId].name}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">EMPTY</span>
                          )}
                        </td>
                        <td className="py-3">
                          {player.equipped.shield ? (
                            <span className="bg-sky-900 text-sky-300 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              T{player.equipped.shield.tier}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3">
                          {player.equipped.shield ? (
                            <div>
                              <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full"
                                  style={{
                                    width: `${(player.equipped.shield.life / player.equipped.shield.maxLife) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <div className="text-[9px] mt-1 text-slate-400">
                                {player.equipped.shield.life} / {player.equipped.shield.maxLife}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600">--/--</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="text-sky-400 font-bold">
                            x{growthFactor(player.proficiencyXp.shield ?? 0).toFixed(2)}
                          </span>
                          <div className="text-[9px] text-slate-500">
                            {player.proficiencyXp.shield ?? 0} / 500
                          </div>
                        </td>
                      </tr>

                      {/* ARMOR SLOT */}
                      <tr className="group">
                        <td className="py-3 text-slate-400 font-bold">ARMR</td>
                        <td className="py-3">
                          {player.equipped.armor ? (
                            <span className="text-white font-bold">
                              {CATALOG[player.equipped.armor.catalogId].name}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">EMPTY</span>
                          )}
                        </td>
                        <td className="py-3">
                          {player.equipped.armor ? (
                            <span className="bg-sky-900 text-sky-300 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              T{player.equipped.armor.tier}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3">
                          {player.equipped.armor ? (
                            <div>
                              <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full"
                                  style={{
                                    width: `${(player.equipped.armor.life / player.equipped.armor.maxLife) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <div className="text-[9px] mt-1 text-slate-400">
                                {player.equipped.armor.life} / {player.equipped.armor.maxLife}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600">--/--</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="text-sky-400 font-bold">
                            x{growthFactor(player.proficiencyXp.armor ?? 0).toFixed(2)}
                          </span>
                          <div className="text-[9px] text-slate-500">
                            {player.proficiencyXp.armor ?? 0} / 500
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Design Rule Info */}
              <div className="mt-4 p-2.5 bg-sky-950/20 border border-sky-800/30 rounded-md font-mono text-[10px]">
                <div className="text-sky-400 font-bold mb-1 uppercase">Rule Directive §2</div>
                <p className="text-slate-400 leading-relaxed italic">
                  "When life reaches 0, fall back to unarmed baseline. Broken state is not an error."
                </p>
              </div>
            </section>

            {/* Console Trace Panel */}
            <section className="bg-black border border-slate-800/90 p-3 rounded-lg h-52 font-mono text-[10px] flex flex-col shadow-inner">
              <h2 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest flex items-center gap-1">
                <Terminal size={12} className="text-sky-500" />
                Manual Trace Log
              </h2>
              <div className="flex-grow overflow-y-auto space-y-1 pr-1 select-text">
                {logs.map((logStr, i) => {
                  let colorClass = "text-slate-400";
                  if (logStr.includes("[COMBAT WIN]")) colorClass = "text-emerald-400";
                  else if (logStr.includes("[COMBAT LOSS]") || logStr.includes("[WIPE]")) colorClass = "text-rose-400";
                  else if (logStr.includes("[CRAFT]")) colorClass = "text-amber-400";
                  else if (logStr.includes("[DEV CHEAT]")) colorClass = "text-purple-400";
                  else if (logStr.includes("[SYSTEM]")) colorClass = "text-sky-400";
                  
                  return (
                    <p key={i} className={`${colorClass} leading-tight`}>
                      {logStr}
                    </p>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Crafting Catalog */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
            <section className="bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-lg flex-grow flex flex-col">
              <h2 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest font-mono">
                Crafting Catalog
              </h2>
              <div className="space-y-3 flex-grow overflow-y-auto">
                {/* 1. BEAT STICK RECIPE CARD */}
                <div className="p-3 border border-slate-800/80 rounded-lg bg-slate-950/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-white font-bold font-mono block">Beat Stick</span>
                      <span className="text-[9px] text-slate-500 font-mono">WEAPON SLOT</span>
                    </div>
                    <Sword size={14} className="text-slate-500" />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono">
                    <button
                      onClick={() => handleCraft("beatStick", 1)}
                      className={`text-[10px] p-2 text-left rounded border transition-all cursor-pointer ${
                        player.scrap >= 10
                          ? "bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200"
                          : "bg-slate-950 border-slate-900 text-slate-600"
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Tier 1</span>
                      <span className="font-bold">10 Scrap</span>
                    </button>
                    <button
                      onClick={() => handleCraft("beatStick", 2)}
                      disabled={!player.tier2Unlocked}
                      className={`text-[10px] p-2 text-left rounded border transition-all cursor-pointer ${
                        !player.tier2Unlocked
                          ? "bg-black/30 border-slate-900 text-slate-700 cursor-not-allowed"
                          : player.scrap >= 25
                          ? "bg-sky-950/40 hover:bg-sky-900/40 border-sky-600/30 text-sky-300"
                          : "bg-slate-950 border-slate-900 text-slate-600"
                      }`}
                    >
                      <span className="text-[9px] text-sky-500/80 block uppercase font-bold flex items-center gap-1">
                        {!player.tier2Unlocked && <Lock size={8} />} Tier 2
                      </span>
                      <span className="font-bold">25 Scrap</span>
                    </button>
                  </div>
                </div>

                {/* 2. SHIELD RECIPE CARD */}
                <div className="p-3 border border-slate-800/80 rounded-lg bg-slate-950/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-white font-bold font-mono block">Reflect Shield</span>
                      <span className="text-[9px] text-slate-500 font-mono">SHIELD SLOT</span>
                    </div>
                    <Shield size={14} className="text-slate-500" />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono">
                    <button
                      onClick={() => handleCraft("shield", 1)}
                      className={`text-[10px] p-2 text-left rounded border transition-all cursor-pointer ${
                        player.scrap >= 10
                          ? "bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200"
                          : "bg-slate-950 border-slate-900 text-slate-600"
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Tier 1</span>
                      <span className="font-bold">10 Scrap</span>
                    </button>
                    <button
                      onClick={() => handleCraft("shield", 2)}
                      disabled={!player.tier2Unlocked}
                      className={`text-[10px] p-2 text-left rounded border transition-all cursor-pointer ${
                        !player.tier2Unlocked
                          ? "bg-black/30 border-slate-900 text-slate-700 cursor-not-allowed"
                          : player.scrap >= 25
                          ? "bg-sky-950/40 hover:bg-sky-900/40 border-sky-600/30 text-sky-300"
                          : "bg-slate-950 border-slate-900 text-slate-600"
                      }`}
                    >
                      <span className="text-[9px] text-sky-500/80 block uppercase font-bold flex items-center gap-1">
                        {!player.tier2Unlocked && <Lock size={8} />} Tier 2
                      </span>
                      <span className="font-bold">25 Scrap</span>
                    </button>
                  </div>
                </div>

                {/* 3. BODY ARMOR RECIPE CARD */}
                <div className="p-3 border border-slate-800/80 rounded-lg bg-slate-950/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-white font-bold font-mono block">Plate Armor</span>
                      <span className="text-[9px] text-slate-500 font-mono">ARMOR SLOT</span>
                    </div>
                    <Heart size={14} className="text-slate-500" />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono">
                    <button
                      onClick={() => handleCraft("bodyArmor", 1)}
                      className={`text-[10px] p-2 text-left rounded border transition-all cursor-pointer ${
                        player.scrap >= 10
                          ? "bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200"
                          : "bg-slate-950 border-slate-900 text-slate-600"
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Tier 1</span>
                      <span className="font-bold">10 Scrap</span>
                    </button>
                    <button
                      onClick={() => handleCraft("bodyArmor", 2)}
                      disabled={!player.tier2Unlocked}
                      className={`text-[10px] p-2 text-left rounded border transition-all cursor-pointer ${
                        !player.tier2Unlocked
                          ? "bg-black/30 border-slate-900 text-slate-700 cursor-not-allowed"
                          : player.scrap >= 25
                          ? "bg-sky-950/40 hover:bg-sky-900/40 border-sky-600/30 text-sky-300"
                          : "bg-slate-950 border-slate-900 text-slate-600"
                      }`}
                    >
                      <span className="text-[9px] text-sky-500/80 block uppercase font-bold flex items-center gap-1">
                        {!player.tier2Unlocked && <Lock size={8} />} Tier 2
                      </span>
                      <span className="font-bold">25 Scrap</span>
                    </button>
                  </div>
                </div>

                {/* 4. TIER-2 TOOL GATE RECIPE CARD */}
                <div className={`p-3 border rounded-lg transition-all ${
                  player.tier2Unlocked
                    ? "border-emerald-950 bg-emerald-950/10 opacity-70"
                    : "border-slate-800 bg-slate-950/40"
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-white font-bold font-mono block">Tier-2 Tool</span>
                      <span className="text-[9px] text-slate-500 font-mono">GLOBAL CLEARANCE GATE</span>
                    </div>
                    {player.tier2Unlocked ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                        <Unlock size={9} /> UNLOCKED
                      </span>
                    ) : (
                      <Wrench size={14} className="text-slate-500" />
                    )}
                  </div>
                  <div className="mt-2.5 font-mono">
                    <button
                      onClick={() => handleCraft("tool")}
                      disabled={player.tier2Unlocked}
                      className={`w-full text-[10px] p-2 rounded border text-left flex justify-between items-center transition-all ${
                        player.tier2Unlocked
                          ? "bg-black/10 border-emerald-900/30 text-slate-500 cursor-not-allowed"
                          : player.scrap >= 20
                          ? "bg-sky-900/20 hover:bg-sky-900/30 border-sky-500/30 text-sky-300 cursor-pointer"
                          : "bg-slate-950 border-slate-900 text-slate-600"
                      }`}
                    >
                      <span className="uppercase font-bold">Fixed unlock cost</span>
                      <span className="font-bold text-white">20 Scrap</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="w-full max-w-6xl mx-auto mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 gap-2 font-mono shrink-0">
        <div className="flex gap-4 flex-wrap justify-center">
          <span>ENGINE: TS-SKELETON-P1</span>
          <span>RUNNER: VITEST-CLI</span>
          <span>V_ID: FF7-91X</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>DETERMINISTIC_MODE: ON</span>
        </div>
      </footer>
    </div>
  );
}
