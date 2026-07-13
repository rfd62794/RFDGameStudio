import React, { useState, useEffect } from 'react';
import { MapCell, Point, Corporation, WeeklyOrder, UnitGroup, UnitType, OrderType } from '../types';
import { Shield, Hammer, Compass, Users, ArrowRight, Check, Eye, HelpCircle, RefreshCw } from 'lucide-react';

interface WeeklyOrdersPanelProps {
  selectedCell: MapCell | null;
  allCells: MapCell[];
  corporations: Corporation[];
  currentOrder: WeeklyOrder | undefined;
  onSaveOrder: (cellId: number, order: WeeklyOrder) => void;
  playerCorp: Corporation;
}

export default function WeeklyOrdersPanel({
  selectedCell,
  allCells,
  corporations,
  currentOrder,
  onSaveOrder,
  playerCorp
}: WeeklyOrdersPanelProps) {
  const [orderType, setOrderType] = useState<OrderType>('idle');
  const [targetCellId, setTargetCellId] = useState<number>(-1);
  const [unitsToSend, setUnitsToSend] = useState<UnitGroup>({ circle: 0, square: 0, triangle: 0 });
  const [reinforceType, setReinforceType] = useState<UnitType>('circle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Sync state with incoming currentOrder when selected cell changes
  useEffect(() => {
    if (selectedCell) {
      if (currentOrder) {
        setOrderType(currentOrder.type);
        setTargetCellId(currentOrder.targetCellId ?? -1);
        setUnitsToSend(currentOrder.unitsSent ?? { circle: 0, square: 0, triangle: 0 });
        setReinforceType(currentOrder.reinforceType ?? 'circle');
      } else {
        setOrderType('idle');
        setTargetCellId(-1);
        setUnitsToSend({ circle: 0, square: 0, triangle: 0 });
        setReinforceType('circle');
      }
      setErrorMsg('');
    }
  }, [selectedCell, currentOrder]);

  if (!selectedCell) {
    return (
      <div className="bg-[#D4D3D0] border-4 border-[#141414] p-6 text-[#141414] flex flex-col items-center justify-center text-center h-full min-h-[400px] shadow-[4px_4px_0px_0px_#141414]">
        <Compass className="w-12 h-12 text-[#141414] mb-4 animate-pulse" />
        <h3 className="font-sans font-black text-lg text-[#141414] uppercase tracking-tight mb-2">Boardroom Briefing Panel</h3>
        <p className="text-xs font-serif italic text-[#141414]/80 max-w-xs leading-relaxed">
          Select a sector on the planetary grid map to inspect territorial garrison levels and authorize weekly deployment directives.
        </p>
      </div>
    );
  }

  const isPlayerOwned = selectedCell.ownerId === playerCorp.id;
  const totalGarrison = selectedCell.units.circle + selectedCell.units.square + selectedCell.units.triangle;

  // Get neighboring cells
  const neighborCells = selectedCell.neighbors.map(nid => allCells.find(c => c.id === nid)).filter(Boolean) as MapCell[];

  const handleOrderChange = (type: OrderType) => {
    setOrderType(type);
    setErrorMsg('');
    if (type !== 'expand') {
      setTargetCellId(-1);
      setUnitsToSend({ circle: 0, square: 0, triangle: 0 });
    } else {
      // Auto select first neighbor if available
      if (neighborCells.length > 0 && targetCellId === -1) {
        setTargetCellId(neighborCells[0].id);
      }
    }
  };

  const incrementUnitToSend = (type: UnitType) => {
    if (unitsToSend[type] < selectedCell.units[type]) {
      setUnitsToSend(prev => ({
        ...prev,
        [type]: prev[type] + 1
      }));
    }
  };

  const decrementUnitToSend = (type: UnitType) => {
    if (unitsToSend[type] > 0) {
      setUnitsToSend(prev => ({
        ...prev,
        [type]: prev[type] - 1
      }));
    }
  };

  const handleSave = () => {
    setErrorMsg('');
    
    // Validate order inputs
    if (orderType === 'expand') {
      if (targetCellId === -1) {
        setErrorMsg('Select a target sector for deployment.');
        return;
      }
      const totalSent = unitsToSend.circle + unitsToSend.square + unitsToSend.triangle;
      if (totalSent === 0) {
        setErrorMsg('Deployment forces must include at least 1 unit.');
        return;
      }
    }

    if (orderType === 'reinforce') {
      if (playerCorp.treasury < 30000) {
        setErrorMsg('Insufficient corporate treasury. Reinforcement contract requires $30,000.');
        return;
      }
    }

    if (orderType === 'fortify') {
      if (selectedCell.fortification >= 3) {
        setErrorMsg('Fortification level is already at maximum (Level 3).');
        return;
      }
      if (playerCorp.treasury < 20000) {
        setErrorMsg('Insufficient corporate treasury. Fortification installation requires $20,000.');
        return;
      }
    }

    if (orderType === 'scan') {
      if (targetCellId === -1) {
        setErrorMsg('Select a neighboring unknown sector to scan.');
        return;
      }
      if (playerCorp.treasury < 5000) {
        setErrorMsg('Insufficient corporate treasury. Orbital deep scan requires $5,000.');
        return;
      }
    }

    // Assemble Weekly Order
    const order: WeeklyOrder = {
      cellId: selectedCell.id,
      type: orderType,
      targetCellId: targetCellId !== -1 ? targetCellId : undefined,
      unitsSent: orderType === 'expand' ? unitsToSend : undefined,
      reinforceType: orderType === 'reinforce' ? reinforceType : undefined
    };

    onSaveOrder(selectedCell.id, order);
  };

  return (
    <div className="bg-[#D4D3D0] border-4 border-[#141414] p-5 text-[#141414] flex flex-col h-full gap-4 select-none shadow-[4px_4px_0px_0px_#141414]" id="orders-panel">
      {/* Sector Header */}
      <div>
        <div className="flex justify-between items-start">
          <div>
            <span className="font-serif italic text-[11px] text-[#141414]/60 uppercase tracking-widest block font-semibold">Inspecting Sector</span>
            <h2 className="text-xl font-black text-[#141414] uppercase tracking-tight font-sans leading-none mt-1">{selectedCell.name}</h2>
          </div>
          <span className={`text-xs px-2.5 py-0.5 font-mono border-2 border-[#141414] font-black uppercase shadow-[2px_2px_0px_0px_#141414] ${
            isPlayerOwned 
              ? 'bg-cyan-300 text-[#141414]' 
              : selectedCell.ownerId 
                ? 'bg-red-300 text-[#141414]' 
                : 'bg-white text-[#141414]'
          }`}>
            {isPlayerOwned ? 'Controlled' : selectedCell.ownerId ? 'Rival' : 'Neutral'}
          </span>
        </div>
        
        {/* Garrison stats summary */}
        <div className="grid grid-cols-3 gap-2 mt-4 p-2 bg-white/80 border-2 border-[#141414] text-center shadow-[2px_2px_0px_0px_#141414]">
          <div>
            <span className="text-[10px] font-serif italic text-[#141414]/70 uppercase font-bold block leading-none mb-1">● Circles</span>
            <span className="text-sm font-mono font-black text-[#141414]">{selectedCell.units.circle}</span>
          </div>
          <div>
            <span className="text-[10px] font-serif italic text-[#141414]/70 uppercase font-bold block leading-none mb-1">■ Squares</span>
            <span className="text-sm font-mono font-black text-[#141414]">{selectedCell.units.square}</span>
          </div>
          <div>
            <span className="text-[10px] font-serif italic text-[#141414]/70 uppercase font-bold block leading-none mb-1">▲ Triangles</span>
            <span className="text-sm font-mono font-black text-[#141414]">{selectedCell.units.triangle}</span>
          </div>
        </div>
      </div>

      <div className="h-[2px] bg-[#141414]/20 w-full" />

      {/* Conditional: Player Owned vs Enemy/Neutral */}
      {isPlayerOwned ? (
        <div className="flex flex-col gap-4 flex-1">
          {/* Directives Title */}
          <div>
            <span className="font-serif italic text-[11px] text-[#141414]/70 uppercase tracking-widest block font-bold leading-none">WEEKLY DIRECTIVE</span>
            <h3 className="text-xs text-[#141414]/80 mt-1 font-sans font-medium">Authorize active operations for this territory.</h3>
          </div>

          {/* Directive Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOrderChange('idle')}
              className={`p-2 rounded border-2 border-[#141414] text-left flex flex-col transition cursor-pointer shadow-[2px_2px_0px_0px_#141414] ${
                orderType === 'idle'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-xs font-black flex items-center gap-1 uppercase tracking-tight">
                <Check className={`w-3.5 h-3.5 ${orderType === 'idle' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Hold Sector
              </span>
              <span className={`text-[10px] mt-1 leading-snug ${orderType === 'idle' ? 'text-[#E4E3E0]/70' : 'text-[#141414]/60 font-medium'}`}>Defend present garrison. Passive unit production.</span>
            </button>

            <button
              onClick={() => handleOrderChange('expand')}
              className={`p-2 rounded border-2 border-[#141414] text-left flex flex-col transition cursor-pointer shadow-[2px_2px_0px_0px_#141414] ${
                orderType === 'expand'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-xs font-black flex items-center gap-1 uppercase tracking-tight">
                <ArrowRight className={`w-3.5 h-3.5 ${orderType === 'expand' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Deploy Forces
              </span>
              <span className={`text-[10px] mt-1 leading-snug ${orderType === 'expand' ? 'text-[#E4E3E0]/70' : 'text-[#141414]/60 font-medium'}`}>Move units to expand territory boundaries.</span>
            </button>

            <button
              onClick={() => handleOrderChange('reinforce')}
              className={`p-2 rounded border-2 border-[#141414] text-left flex flex-col transition cursor-pointer shadow-[2px_2px_0px_0px_#141414] ${
                orderType === 'reinforce'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-xs font-black flex items-center gap-1 uppercase tracking-tight">
                <Users className={`w-3.5 h-3.5 ${orderType === 'reinforce' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Reinforce ($30k)
              </span>
              <span className={`text-[10px] mt-1 leading-snug ${orderType === 'reinforce' ? 'text-[#E4E3E0]/70' : 'text-[#141414]/60 font-medium'}`}>Speed-recruit an extra unit arriving in 1 week.</span>
            </button>

            <button
              onClick={() => handleOrderChange('fortify')}
              className={`p-2 rounded border-2 border-[#141414] text-left flex flex-col transition cursor-pointer shadow-[2px_2px_0px_0px_#141414] ${
                orderType === 'fortify'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-xs font-black flex items-center gap-1 uppercase tracking-tight">
                <Shield className={`w-3.5 h-3.5 ${orderType === 'fortify' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Fortify ($20k)
              </span>
              <span className={`text-[10px] mt-1 leading-snug ${orderType === 'fortify' ? 'text-[#E4E3E0]/70' : 'text-[#141414]/60 font-medium'}`}>Install shields (max Lvl 3) to absorb Monthly hits.</span>
            </button>

            <button
              onClick={() => handleOrderChange('scan')}
              className={`p-2 rounded border-2 border-[#141414] text-left flex flex-col transition col-span-2 cursor-pointer shadow-[2px_2px_0px_0px_#141414] ${
                orderType === 'scan'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-xs font-black flex items-center gap-1 uppercase tracking-tight">
                <Eye className={`w-3.5 h-3.5 ${orderType === 'scan' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Scout Neighbor ($5k)
              </span>
              <span className={`text-[10px] mt-1 leading-snug ${orderType === 'scan' ? 'text-[#E4E3E0]/70' : 'text-[#141414]/60 font-medium'}`}>Deploy orbital scan to lift fog of war on a neighboring sector immediately.</span>
            </button>
          </div>

          <div className="h-[2px] bg-[#141414]/20 w-full my-1" />

          {/* Form Contexts depending on selected order */}
          <div className="flex-1 bg-white border-2 border-[#141414] p-3 text-xs font-mono text-[#141414] flex flex-col gap-2.5 min-h-[140px] overflow-y-auto shadow-[2px_2px_0px_0px_#141414]">
            {orderType === 'idle' && (
              <div className="flex flex-col gap-1">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[10px] block">Hold Directive Active</span>
                <p className="text-[10px] text-[#141414]/80 mt-1 leading-relaxed">
                  The sector garrison will dig in. No treasury cost. 
                  Passive factory is online: 1 unit of chosen preferred type ({selectedCell.preferredProduction.toUpperCase()}) will spawn here every 2 weeks.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[#141414]/60 font-serif italic text-xs font-bold">Preferred Assembly:</span>
                  <select
                    value={selectedCell.preferredProduction}
                    onChange={(e) => {
                      // Save immediately or save along with order
                      selectedCell.preferredProduction = e.target.value as UnitType;
                      handleSave();
                    }}
                    className="bg-white border-2 border-[#141414] text-[#141414] px-1.5 py-0.5 rounded-none text-[10px] font-mono outline-none font-bold shadow-[1px_1px_0px_0px_#141414]"
                  >
                    <option value="circle">● Circle</option>
                    <option value="square">■ Square</option>
                    <option value="triangle">▲ Triangle</option>
                  </select>
                </div>
                <div className="mt-2 text-[10px] text-[#141414]/60 font-serif italic">
                  Progress to next Passive unit: Week {selectedCell.productionProgress + 1}/2
                </div>
              </div>
            )}

            {orderType === 'expand' && (
              <div className="flex flex-col gap-2">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[10px] block">Expand Directive Active</span>
                
                {/* Neighbor Selection */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#141414]/60 font-serif italic font-bold">Target Neighboring Sector:</span>
                  <select
                    value={targetCellId}
                    onChange={(e) => setTargetCellId(Number(e.target.value))}
                    className="bg-white border-2 border-[#141414] text-[#141414] p-1.5 w-full outline-none text-[11px] font-mono font-bold shadow-[1px_1px_0px_0px_#141414]"
                  >
                    <option value={-1} disabled>-- Select Sector --</option>
                    {neighborCells.map(neigh => (
                      <option key={neigh.id} value={neigh.id}>
                        {neigh.name} ({neigh.ownerId ? corporations.find(c => c.id === neigh.ownerId)?.name : 'Neutral'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Troop Composition Selector */}
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] text-[#141414]/60 font-serif italic font-bold">Troops to deploy (Garrison limit: {totalGarrison}):</span>
                  {totalGarrison === 0 ? (
                    <span className="text-amber-600 text-[10px] font-bold">Warning: Garrison is empty! Recruit units first.</span>
                  ) : (
                    <div className="flex flex-col gap-1.5 mt-1">
                      {/* Circle Selector */}
                      <div className="flex justify-between items-center bg-[#E4E3E0] border border-[#141414] px-2.5 py-1">
                        <span className="font-bold">● Circle (Max {selectedCell.units.circle}):</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => decrementUnitToSend('circle')} className="px-1.5 bg-white border border-[#141414] hover:bg-white/80 rounded-none font-bold text-[#141414] cursor-pointer">-</button>
                          <span className="w-4 text-center font-black text-sm">{unitsToSend.circle}</span>
                          <button onClick={() => incrementUnitToSend('circle')} className="px-1.5 bg-white border border-[#141414] hover:bg-white/80 rounded-none font-bold text-[#141414] cursor-pointer">+</button>
                        </div>
                      </div>

                      {/* Square Selector */}
                      <div className="flex justify-between items-center bg-[#E4E3E0] border border-[#141414] px-2.5 py-1">
                        <span className="font-bold">■ Square (Max {selectedCell.units.square}):</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => decrementUnitToSend('square')} className="px-1.5 bg-white border border-[#141414] hover:bg-white/80 rounded-none font-bold text-[#141414] cursor-pointer">-</button>
                          <span className="w-4 text-center font-black text-sm">{unitsToSend.square}</span>
                          <button onClick={() => incrementUnitToSend('square')} className="px-1.5 bg-white border border-[#141414] hover:bg-white/80 rounded-none font-bold text-[#141414] cursor-pointer">+</button>
                        </div>
                      </div>

                      {/* Triangle Selector */}
                      <div className="flex justify-between items-center bg-[#E4E3E0] border border-[#141414] px-2.5 py-1">
                        <span className="font-bold">▲ Triangle (Max {selectedCell.units.triangle}):</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => decrementUnitToSend('triangle')} className="px-1.5 bg-white border border-[#141414] hover:bg-white/80 rounded-none font-bold text-[#141414] cursor-pointer">-</button>
                          <span className="w-4 text-center font-black text-sm">{unitsToSend.triangle}</span>
                          <button onClick={() => incrementUnitToSend('triangle')} className="px-1.5 bg-white border border-[#141414] hover:bg-white/80 rounded-none font-bold text-[#141414] cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[9px] text-[#141414]/60 leading-snug mt-1 font-serif italic">
                  Deployed forces take 4 days to transit the membrane border. Arriving in a neutral or enemy sector registers the cell as "Contested" for Monthly combat.
                </p>
              </div>
            )}

            {orderType === 'reinforce' && (
              <div className="flex flex-col gap-2">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[10px] block">Reinforce Directive Active</span>
                <p className="text-[10px] text-[#141414]/80 mt-1 leading-relaxed">
                  Submit a priority recruitment order. Cost: <span className="text-emerald-700 font-bold">$30,000</span>.
                  The unit is assembled and deployed immediately to this sector's garrison at the end of the week.
                </p>

                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] text-[#141414]/60 font-serif italic font-bold">Unit Archetype:</span>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setReinforceType('circle')}
                      className={`flex-1 p-1.5 rounded-none border-2 border-[#141414] text-center transition text-[10px] font-bold cursor-pointer ${
                        reinforceType === 'circle'
                          ? 'bg-[#141414] text-cyan-300'
                          : 'bg-white hover:bg-[#E4E3E0] text-[#141414]'
                      }`}
                    >
                      ● Circle
                    </button>
                    <button
                      onClick={() => setReinforceType('square')}
                      className={`flex-1 p-1.5 rounded-none border-2 border-[#141414] text-center transition text-[10px] font-bold cursor-pointer ${
                        reinforceType === 'square'
                          ? 'bg-[#141414] text-cyan-300'
                          : 'bg-white hover:bg-[#E4E3E0] text-[#141414]'
                      }`}
                    >
                      ■ Square
                    </button>
                    <button
                      onClick={() => setReinforceType('triangle')}
                      className={`flex-1 p-1.5 rounded-none border-2 border-[#141414] text-center transition text-[10px] font-bold cursor-pointer ${
                        reinforceType === 'triangle'
                          ? 'bg-[#141414] text-cyan-300'
                          : 'bg-white hover:bg-[#E4E3E0] text-[#141414]'
                      }`}
                    >
                      ▲ Triangle
                    </button>
                  </div>
                </div>

                <div className="text-[9px] text-amber-700 font-bold mt-1 leading-tight font-serif italic">
                  RPS Balance Warning: Remember that Circle counters Square, Square counters Triangle, and Triangle counters Circle.
                </div>
              </div>
            )}

            {orderType === 'fortify' && (
              <div className="flex flex-col gap-1">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[10px] block">Fortify Directive Active</span>
                <p className="text-[10px] text-[#141414]/80 mt-1 leading-relaxed">
                  Upgrade sector defensive shield modules. Cost: <span className="text-emerald-700 font-bold">$20,000</span>.
                </p>
                <div className="mt-3 p-2 bg-[#E4E3E0] border border-[#141414] rounded-none">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>Current Shields:</span>
                    <span className="text-sky-700">Level {selectedCell.fortification} / 3</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] mt-1 font-bold">
                    <span>Target Upgrade:</span>
                    <span className="text-emerald-700">
                      {selectedCell.fortification >= 3 ? 'MAX LEVEL' : `Level ${selectedCell.fortification + 1}`}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-[#141414]/60 mt-2 leading-relaxed font-serif italic">
                  Defensive shields absorb direct enemy hits in Monthly conflict, saving your garrison units from attrition.
                </p>
              </div>
            )}

            {orderType === 'scan' && (
              <div className="flex flex-col gap-2">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[10px] block">Deep Scout Directive Active</span>
                <p className="text-[10px] text-[#141414]/80 mt-1 leading-relaxed">
                  Initiate deep radar scanning. Cost: <span className="text-emerald-700 font-bold">$5,000</span>.
                  Instantly lifts the Fog of War from the targeted neighboring sector.
                </p>

                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] text-[#141414]/60 font-serif italic font-bold">Select Target Neighbor to Scan:</span>
                  <select
                    value={targetCellId}
                    onChange={(e) => setTargetCellId(Number(e.target.value))}
                    className="bg-white border-2 border-[#141414] text-[#141414] p-1.5 w-full outline-none text-[11px] font-mono font-bold shadow-[1px_1px_0px_0px_#141414]"
                  >
                    <option value={-1} disabled>-- Select Sector --</option>
                    {neighborCells.map(neigh => (
                      <option key={neigh.id} value={neigh.id}>
                        {neigh.name} {neigh.ownerId ? `(${corporations.find(c => c.id === neigh.ownerId)?.name})` : '(Neutral)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {errorMsg && (
            <div className="p-2 bg-red-100 border-2 border-[#141414] text-[10px] font-mono text-red-700 font-bold shadow-[2px_2px_0px_0px_#141414]">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Save Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-[#141414] hover:bg-[#141414]/90 text-[#E4E3E0] border-2 border-[#141414] font-black py-2.5 px-4 text-xs transition duration-200 uppercase tracking-widest cursor-pointer shadow-[2px_2px_0px_0px_#141414]"
              id="btn-save-order"
            >
              Authorize Order
            </button>
          </div>
        </div>
      ) : (
        /* Inspection Mode for Non-Owned Sectors */
        <div className="flex flex-col gap-4 flex-1 text-xs text-[#141414]">
          <div className="p-3 bg-white border-2 border-[#141414] shadow-[2px_2px_0px_0px_#141414]">
            <span className="font-serif italic text-[11px] text-[#141414]/60 uppercase block mb-1 font-bold">Intelligence Dossier</span>
            <p className="mt-1 leading-normal text-[10px] text-[#141414]/80">
              This sector is outside your corporate perimeter. Direct command structures are offline. To acquire ownership:
            </p>
            <ul className="list-disc pl-4 mt-2 text-[10px] text-[#141414]/70 space-y-1 font-serif italic">
              <li>Deploy troops from an adjacent controlled sector.</li>
              <li>Sustain garrison presence until Month-End resolution.</li>
              <li>Eliminate any rival claimants using RPS tactical advantages.</li>
            </ul>
          </div>

          <div className="flex-1 border-2 border-dashed border-[#141414]/40 bg-[#E4E3E0]/40 flex flex-col items-center justify-center p-4 text-center">
            <Shield className="w-8 h-8 text-[#141414]/60 mb-2" />
            <span className="font-black text-[#141414] text-[10px] uppercase tracking-wider">Garrison Perimeter Shield Active</span>
            <span className="text-[10px] text-[#141414]/60 mt-1 font-serif italic">Scans show active shielding holding. No manual intervention possible.</span>
          </div>
        </div>
      )}
    </div>
  );
}
