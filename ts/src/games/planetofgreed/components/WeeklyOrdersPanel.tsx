import { useState, useEffect } from 'react';
import { MapCell, Corporation, WeeklyOrder, UnitGroup, UnitType } from '../types';
import { Shield, Hammer, Compass, Users, ArrowRight, Check, Eye } from 'lucide-react';

interface WeeklyOrdersPanelProps {
  selectedCell: MapCell | null;
  allCells: MapCell[];
  corporations: Corporation[];
  currentOrders: WeeklyOrder[];
  onSaveOrders: (cellId: number, orders: WeeklyOrder[]) => void;
  playerCorp: Corporation;
}

export default function WeeklyOrdersPanel({
  selectedCell,
  allCells,
  corporations,
  currentOrders,
  onSaveOrders,
  playerCorp
}: WeeklyOrdersPanelProps) {
  const [orderType, setOrderType] = useState<'hold' | 'expand' | 'reinforce' | 'fortify' | 'scan'>('hold');
  const [targetCellId, setTargetCellId] = useState<number>(-1);
  const [unitsToSend, setUnitsToSend] = useState<UnitGroup>({ circle: 0, square: 0, triangle: 0 });
  const [reinforceType, setReinforceType] = useState<UnitType>('circle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Helper to sum allocated units across expand orders
  const getAllocatedUnits = (cellOrders: WeeklyOrder[]): UnitGroup => {
    const allocated: UnitGroup = { circle: 0, square: 0, triangle: 0 };
    for (const order of cellOrders) {
      if (order.type === 'expand') {
        allocated.circle += order.unitsSent.circle;
        allocated.square += order.unitsSent.square;
        allocated.triangle += order.unitsSent.triangle;
      }
    }
    return allocated;
  };

  // Sync state with incoming currentOrders when selected cell changes
  useEffect(() => {
    if (selectedCell) {
      const unitOrders = currentOrders.filter(o => o.type !== 'civic');
      const firstOrder = unitOrders[0];
      if (firstOrder) {
        setOrderType(firstOrder.type as any);
        if (firstOrder.type === 'expand') {
          setUnitsToSend({ circle: 0, square: 0, triangle: 0 });
        } else if (firstOrder.type === 'reinforce') {
          setReinforceType(firstOrder.reinforceType);
        } else if (firstOrder.type === 'scan') {
          setTargetCellId(firstOrder.targetCellId);
        }
      } else {
        setOrderType('hold');
        setTargetCellId(-1);
        setUnitsToSend({ circle: 0, square: 0, triangle: 0 });
        setReinforceType('circle');
      }
      setErrorMsg('');
    }
  }, [selectedCell, currentOrders]);

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

  // Get neighboring cells
  const neighborCells = selectedCell.neighbors.map(nid => allCells.find(c => c.id === nid)).filter(Boolean) as MapCell[];

  const handleOrderChange = (type: 'hold' | 'expand' | 'reinforce' | 'fortify' | 'scan') => {
    setOrderType(type);
    setErrorMsg('');
    if (type !== 'expand' && type !== 'scan') {
      setTargetCellId(-1);
      setUnitsToSend({ circle: 0, square: 0, triangle: 0 });
    } else {
      if (neighborCells.length > 0 && targetCellId === -1) {
        setTargetCellId(neighborCells[0].id);
      }
    }
  };

  const updateOrdersInParent = (updatedUnitOrders: WeeklyOrder[], updatedCivicOrder?: WeeklyOrder) => {
    const civic = updatedCivicOrder !== undefined ? updatedCivicOrder : currentOrders.find(o => o.type === 'civic');
    const finalOrders = [...updatedUnitOrders];
    if (civic) {
      finalOrders.push(civic);
    }
    onSaveOrders(selectedCell.id, finalOrders);
  };

  // Calculate allocated and unallocated counts live
  const allocated = getAllocatedUnits(currentOrders);
  const unallocated = {
    circle: Math.max(0, selectedCell.units.circle - allocated.circle),
    square: Math.max(0, selectedCell.units.square - allocated.square),
    triangle: Math.max(0, selectedCell.units.triangle - allocated.triangle)
  };
  const totalUnallocated = unallocated.circle + unallocated.square + unallocated.triangle;

  const incrementUnitToSend = (type: UnitType) => {
    if (unitsToSend[type] < unallocated[type]) {
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

  const handleAddExpandOrder = () => {
    setErrorMsg('');
    if (targetCellId === -1) {
      setErrorMsg('Select a target neighboring sector for deployment.');
      return;
    }

    const totalSent = unitsToSend.circle + unitsToSend.square + unitsToSend.triangle;
    if (totalSent === 0) {
      setErrorMsg('Deployment forces must include at least 1 unit.');
      return;
    }

    // Cumulative validation check on EVERY save:
    const proposed = {
      circle: allocated.circle + unitsToSend.circle,
      square: allocated.square + unitsToSend.square,
      triangle: allocated.triangle + unitsToSend.triangle,
    };

    if (
      proposed.circle > selectedCell.units.circle ||
      proposed.square > selectedCell.units.square ||
      proposed.triangle > selectedCell.units.triangle
    ) {
      setErrorMsg('Cannot authorize deployment: combined troop allocation exceeds garrison units.');
      return;
    }

    const newExpandOrder: WeeklyOrder = {
      type: 'expand',
      targetCellId,
      unitsSent: { ...unitsToSend }
    };

    const existingUnitOrders = currentOrders.filter(o => o.type !== 'civic');
    const nextUnitOrders = existingUnitOrders.filter(o => o.type === 'expand');
    nextUnitOrders.push(newExpandOrder);

    updateOrdersInParent(nextUnitOrders);
    setUnitsToSend({ circle: 0, square: 0, triangle: 0 });
  };

  const handleRemoveOrderAt = (index: number) => {
    const existingUnitOrders = currentOrders.filter(o => o.type !== 'civic');
    const nextUnitOrders = existingUnitOrders.filter((_, idx) => idx !== index);
    
    if (nextUnitOrders.length === 0) {
      nextUnitOrders.push({ type: 'hold' });
    }

    updateOrdersInParent(nextUnitOrders);
  };

  const handleAuthorizeSingleOrder = () => {
    setErrorMsg('');

    if (orderType === 'reinforce') {
      if (playerCorp.treasury < 30000) {
        setErrorMsg('Insufficient corporate treasury. Reinforcement contract requires $30,000.');
        return;
      }
      const order: WeeklyOrder = {
        type: 'reinforce',
        reinforceType
      };
      updateOrdersInParent([order]);
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
      const order: WeeklyOrder = {
        type: 'fortify'
      };
      updateOrdersInParent([order]);
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
      const order: WeeklyOrder = {
        type: 'scan',
        targetCellId
      };
      updateOrdersInParent([order]);
    }

    if (orderType === 'hold') {
      const order: WeeklyOrder = {
        type: 'hold'
      };
      updateOrdersInParent([order]);
    }
  };

  const handleSelectCivicFocus = (focus: 'production' | 'defense' | 'unrest' | null) => {
    setErrorMsg('');
    
    if (focus === 'defense') {
      if (playerCorp.treasury < 10000) {
        setErrorMsg('Insufficient corporate treasury. Civic Defense Focus requires $10,000.');
        return;
      }
    }

    if (focus === 'unrest') {
      if (playerCorp.treasury < 10000) {
        setErrorMsg('Insufficient corporate treasury. Civic Unrest Focus requires $10,000.');
        return;
      }
    }

    const unitOrders = currentOrders.filter(o => o.type !== 'civic');
    const newCivicOrder: WeeklyOrder | undefined = focus ? { type: 'civic', focus } : undefined;
    
    updateOrdersInParent(unitOrders, newCivicOrder);
  };

  const activeCivicFocus = currentOrders.find(o => o.type === 'civic')?.focus || null;

  return (
    <div className="bg-[#D4D3D0] border-4 border-[#141414] p-4 text-[#141414] flex flex-col h-full gap-3 select-none shadow-[4px_4px_0px_0px_#141414]" id="orders-panel">
      {/* Sector Header */}
      <div>
        <div className="flex justify-between items-start">
          <div>
            <span className="font-serif italic text-[11px] text-[#141414]/60 uppercase tracking-widest block font-bold leading-none">Inspecting Sector</span>
            <h2 className="text-lg font-black text-[#141414] uppercase tracking-tight font-sans leading-none mt-1">{selectedCell.name}</h2>
          </div>
          <span className={`text-[10px] px-2 py-0.5 font-mono border-2 border-[#141414] font-black uppercase shadow-[2px_2px_0px_0px_#141414] ${
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
        <div className="grid grid-cols-3 gap-1.5 mt-2.5 p-1.5 bg-white/80 border-2 border-[#141414] text-center shadow-[1.5px_1.5px_0px_0px_#141414]">
          <div>
            <span className="text-[9px] font-serif italic text-[#141414]/70 uppercase font-bold block leading-none mb-0.5">● Circles</span>
            <span className="text-xs font-mono font-black text-[#141414]">{selectedCell.units.circle}</span>
          </div>
          <div>
            <span className="text-[9px] font-serif italic text-[#141414]/70 uppercase font-bold block leading-none mb-0.5">■ Squares</span>
            <span className="text-xs font-mono font-black text-[#141414]">{selectedCell.units.square}</span>
          </div>
          <div>
            <span className="text-[9px] font-serif italic text-[#141414]/70 uppercase font-bold block leading-none mb-0.5">▲ Triangles</span>
            <span className="text-xs font-mono font-black text-[#141414]">{selectedCell.units.triangle}</span>
          </div>
        </div>
      </div>

      <div className="h-[2px] bg-[#141414]/20 w-full" />

      {/* Conditional: Player Owned vs Enemy/Neutral */}
      {isPlayerOwned ? (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          
          {/* CIVIC DIRECTIVE SLOT (ALWAYS VISIBLE & INDEPENDENT) */}
          <div className="bg-white/80 border-2 border-[#141414] p-2.5 shadow-[2px_2px_0px_0px_#141414] flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-serif italic text-[10px] text-[#141414]/70 uppercase tracking-widest block font-bold leading-none">CIVIC DIRECTIVE</span>
                <span className="text-[9px] text-[#141414]/80 font-sans">Territorial economic focus slot (exactly 1 focus per Week).</span>
              </div>
            </div>

            {/* Civic options */}
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <button
                onClick={() => handleSelectCivicFocus(activeCivicFocus === 'production' ? null : 'production')}
                className={`p-1 border-2 border-[#141414] text-center flex flex-col items-center justify-center transition cursor-pointer min-h-[48px] ${
                  activeCivicFocus === 'production'
                    ? 'bg-yellow-300 text-[#141414] shadow-[1px_1px_0px_0px_#141414] font-black'
                    : 'bg-white hover:bg-[#E4E3E0] text-[#141414]'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span className="text-[8px] font-black uppercase tracking-tight mt-0.5 leading-none">Production</span>
              </button>

              <button
                onClick={() => handleSelectCivicFocus(activeCivicFocus === 'defense' ? null : 'defense')}
                className={`p-1 border-2 border-[#141414] text-center flex flex-col items-center justify-center transition cursor-pointer min-h-[48px] ${
                  activeCivicFocus === 'defense'
                    ? 'bg-sky-300 text-[#141414] shadow-[1px_1px_0px_0px_#141414] font-black'
                    : 'bg-white hover:bg-[#E4E3E0] text-[#141414]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[8px] font-black uppercase tracking-tight mt-0.5 leading-none">Defense ($10k)</span>
              </button>

              {/* Population Unrest Focus -- Phase 2: real, no longer a placeholder */}
              <button
                onClick={() => handleSelectCivicFocus(activeCivicFocus === 'unrest' ? null : 'unrest')}
                className={`p-1 border-2 border-[#141414] text-center flex flex-col items-center justify-center transition cursor-pointer min-h-[48px] ${
                  activeCivicFocus === 'unrest'
                    ? 'bg-emerald-300 text-[#141414] shadow-[1px_1px_0px_0px_#141414] font-black'
                    : 'bg-white hover:bg-[#E4E3E0] text-[#141414]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="text-[8px] font-black uppercase tracking-tight mt-0.5 leading-none">Unrest ($10k)</span>
              </button>
            </div>

            <div className="text-[8px] text-[#141414]/70 leading-normal font-serif italic">
              {activeCivicFocus === 'production' && "⚡ Focus active: Next passive unit production tick accelerated (+1 progress)."}
              {activeCivicFocus === 'defense' && "🛡️ Focus active: +1 Fortification level immediate installation ($10k deducted)."}
              {activeCivicFocus === 'unrest' && "👥 Focus active: Population Balance investment ($10k deducted)."}
              {!activeCivicFocus && "⚖️ Standard Regulations. Click Production, Defense, or Unrest above to assign a focus."}
            </div>
          </div>

          <div className="h-[2px] bg-[#141414]/20 w-full" />

          {/* MILITARY / UNIT OPERATIONS */}
          <div>
            <span className="font-serif italic text-[10px] text-[#141414]/70 uppercase tracking-widest block font-bold leading-none">UNIT DIRECTIVE</span>
            <span className="text-[9px] text-[#141414]/80 font-sans mt-0.5 block">Configure unit actions or deployments.</span>
          </div>

          {/* Unit Directive Selectors */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleOrderChange('hold')}
              className={`p-1.5 border-2 border-[#141414] text-left flex flex-col transition cursor-pointer shadow-[1.5px_1.5px_0px_0px_#141414] ${
                orderType === 'hold'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-[10px] font-black flex items-center gap-1 uppercase tracking-tight">
                <Check className={`w-3 h-3 ${orderType === 'hold' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Hold Sector
              </span>
            </button>

            <button
              onClick={() => handleOrderChange('expand')}
              className={`p-1.5 border-2 border-[#141414] text-left flex flex-col transition cursor-pointer shadow-[1.5px_1.5px_0px_0px_#141414] ${
                orderType === 'expand'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-[10px] font-black flex items-center gap-1 uppercase tracking-tight">
                <ArrowRight className={`w-3 h-3 ${orderType === 'expand' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Deploy Multi
              </span>
            </button>

            <button
              onClick={() => handleOrderChange('reinforce')}
              className={`p-1.5 border-2 border-[#141414] text-left flex flex-col transition cursor-pointer shadow-[1.5px_1.5px_0px_0px_#141414] ${
                orderType === 'reinforce'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-[10px] font-black flex items-center gap-0.5 uppercase tracking-tight">
                <Users className={`w-3 h-3 ${orderType === 'reinforce' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Reinforce ($30k)
              </span>
            </button>

            <button
              onClick={() => handleOrderChange('fortify')}
              className={`p-1.5 border-2 border-[#141414] text-left flex flex-col transition cursor-pointer shadow-[1.5px_1.5px_0px_0px_#141414] ${
                orderType === 'fortify'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-[10px] font-black flex items-center gap-1 uppercase tracking-tight">
                <Shield className={`w-3 h-3 ${orderType === 'fortify' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Fortify ($20k)
              </span>
            </button>

            <button
              onClick={() => handleOrderChange('scan')}
              className={`p-1.5 border-2 border-[#141414] text-left flex flex-col transition col-span-2 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#141414] ${
                orderType === 'scan'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'bg-white/60 text-[#141414] hover:bg-white'
              }`}
            >
              <span className="text-[10px] font-black flex items-center gap-1 uppercase tracking-tight">
                <Eye className={`w-3 h-3 ${orderType === 'scan' ? 'text-cyan-300' : 'text-[#141414]'}`} /> Scout Scanner ($5k)
              </span>
            </button>
          </div>

          {/* List of currently-queued unit orders (§2.3) */}
          <div className="bg-white border-2 border-[#141414] p-2 text-xs font-mono text-[#141414] shadow-[1.5px_1.5px_0px_0px_#141414]">
            <span className="text-[#141414] font-black uppercase tracking-wider text-[9px] block mb-1">CURRENTLY QUEUED UNIT ORDERS:</span>
            {currentOrders.filter(o => o.type !== 'civic').length === 0 ? (
              <span className="text-[8px] text-gray-500 italic block">No active directives authorized (Holding Perimeter).</span>
            ) : (
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                {currentOrders.filter(o => o.type !== 'civic').map((order, index) => {
                  let text = '';
                  if (order.type === 'hold') text = '🛡️ Hold Sector';
                  if (order.type === 'reinforce') text = `👥 Reinforce: +1 ${order.reinforceType?.toUpperCase()}`;
                  if (order.type === 'fortify') text = '🧱 Fortify: Shield Installation';
                  if (order.type === 'scan') text = `🛰️ Scout: Scan Sector ${allCells.find(c => c.id === order.targetCellId)?.name || order.targetCellId}`;
                  if (order.type === 'expand') {
                    const targetName = allCells.find(c => c.id === order.targetCellId)?.name || order.targetCellId;
                    text = `🚀 Deploy to ${targetName} (●:${order.unitsSent.circle} ■:${order.unitsSent.square} ▲:${order.unitsSent.triangle})`;
                  }

                  return (
                    <div key={index} className="flex justify-between items-center bg-[#E4E3E0] border border-[#141414] px-1.5 py-0.5 text-[8.5px]">
                      <span className="font-bold truncate max-w-[190px]">{text}</span>
                      <button
                        onClick={() => handleRemoveOrderAt(index)}
                        className="text-red-700 hover:text-red-900 font-bold ml-1.5 cursor-pointer"
                        id={`cancel-order-${index}`}
                      >
                        [Cancel]
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Context depending on selected tab */}
          <div className="bg-white border-2 border-[#141414] p-2 text-xs font-mono text-[#141414] min-h-[110px] shadow-[1.5px_1.5px_0px_0px_#141414]">
            {orderType === 'hold' && (
              <div className="flex flex-col gap-1">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[9px] block">Hold Directive Configuration</span>
                <p className="text-[8.5px] text-[#141414]/80 leading-relaxed">
                  No active force deployment. Garrison remains to defend. 1 unit of chosen preferred type ({selectedCell.preferredProduction.toUpperCase()}) will spawn here every 2 weeks.
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[#141414]/60 font-serif italic text-[9px] font-bold">Assembly Factory Pref:</span>
                  <select
                    value={selectedCell.preferredProduction}
                    onChange={(e) => {
                      selectedCell.preferredProduction = e.target.value as UnitType;
                      handleAuthorizeSingleOrder();
                    }}
                    className="bg-white border-2 border-[#141414] text-[#141414] px-1 py-0.5 rounded-none text-[8.5px] font-mono outline-none font-bold"
                  >
                    <option value="circle">● Circle</option>
                    <option value="square">■ Square</option>
                    <option value="triangle">▲ Triangle</option>
                  </select>
                </div>
                <div className="text-[8px] text-[#141414]/60 font-serif italic mt-1">
                  Progress to next Passive unit: Week {selectedCell.productionProgress + 1}/2
                </div>
              </div>
            )}

            {orderType === 'expand' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[9px] block">Deploy Expeditionary Forces</span>
                
                {/* Live display of unallocated count */}
                <div className="flex justify-between items-center text-[8.5px] bg-[#141414]/5 px-1.5 py-0.5 border border-[#141414]/10">
                  <span className="font-serif italic font-bold">Unallocated Garrison:</span>
                  <span className="font-bold text-sky-800">●:{unallocated.circle} ■:{unallocated.square} ▲:{unallocated.triangle}</span>
                </div>

                {/* Target Selection */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8.5px] text-[#141414]/60 font-serif italic font-bold">Target Neighbor:</span>
                  <select
                    value={targetCellId}
                    onChange={(e) => setTargetCellId(Number(e.target.value))}
                    className="bg-white border-2 border-[#141414] text-[#141414] p-1 w-full outline-none text-[9.5px] font-mono font-bold"
                  >
                    <option value={-1} disabled>-- Choose Neighbor --</option>
                    {neighborCells.map(neigh => (
                      <option key={neigh.id} value={neigh.id}>
                        {neigh.name} ({neigh.ownerId ? corporations.find(c => c.id === neigh.ownerId)?.name : 'Neutral'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Counter selectors */}
                {totalUnallocated === 0 ? (
                  <span className="text-amber-700 text-[8.5px] font-bold italic block text-center mt-1">No unallocated units remaining in sector garrison.</span>
                ) : (
                  <div className="flex flex-col gap-1 mt-0.5">
                    {/* Circle */}
                    <div className="flex justify-between items-center bg-[#E4E3E0] border border-[#141414] px-1.5 py-0.5 text-[8.5px]">
                      <span>● Circle (Avail {unallocated.circle}):</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => decrementUnitToSend('circle')} className="px-1 bg-white border border-[#141414] font-bold text-[8.5px] cursor-pointer">-</button>
                        <span className="w-3 text-center font-black">{unitsToSend.circle}</span>
                        <button onClick={() => incrementUnitToSend('circle')} className="px-1 bg-white border border-[#141414] font-bold text-[8.5px] cursor-pointer">+</button>
                      </div>
                    </div>

                    {/* Square */}
                    <div className="flex justify-between items-center bg-[#E4E3E0] border border-[#141414] px-1.5 py-0.5 text-[8.5px]">
                      <span>■ Square (Avail {unallocated.square}):</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => decrementUnitToSend('square')} className="px-1 bg-white border border-[#141414] font-bold text-[8.5px] cursor-pointer">-</button>
                        <span className="w-3 text-center font-black">{unitsToSend.square}</span>
                        <button onClick={() => incrementUnitToSend('square')} className="px-1 bg-white border border-[#141414] font-bold text-[8.5px] cursor-pointer">+</button>
                      </div>
                    </div>

                    {/* Triangle */}
                    <div className="flex justify-between items-center bg-[#E4E3E0] border border-[#141414] px-1.5 py-0.5 text-[8.5px]">
                      <span>▲ Triangle (Avail {unallocated.triangle}):</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => decrementUnitToSend('triangle')} className="px-1 bg-white border border-[#141414] font-bold text-[8.5px] cursor-pointer">-</button>
                        <span className="w-3 text-center font-black">{unitsToSend.triangle}</span>
                        <button onClick={() => incrementUnitToSend('triangle')} className="px-1 bg-white border border-[#141414] font-bold text-[8.5px] cursor-pointer">+</button>
                      </div>
                    </div>

                    <button
                      onClick={handleAddExpandOrder}
                      className="mt-1 w-full bg-[#141414] text-white py-1 text-[8.5px] font-black uppercase border border-[#141414] cursor-pointer hover:bg-[#141414]/90"
                    >
                      Queue Deployment
                    </button>
                  </div>
                )}
              </div>
            )}

            {orderType === 'reinforce' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[9px] block">Speed-Recruit Reinforcement</span>
                <p className="text-[8.5px] text-[#141414]/80 leading-relaxed">
                  Speed-assemble a unit arriving in 1 week. Cost: <span className="text-emerald-700 font-bold">$30,000</span>.
                </p>
                <div className="flex gap-1.5 mt-1">
                  {['circle', 'square', 'triangle'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setReinforceType(type as UnitType)}
                      className={`flex-1 py-1 rounded-none border-2 border-[#141414] text-center transition text-[8.5px] font-bold cursor-pointer ${
                        reinforceType === type
                          ? 'bg-[#141414] text-cyan-300'
                          : 'bg-white hover:bg-[#E4E3E0] text-[#141414]'
                      }`}
                    >
                      {type === 'circle' && '● Circle'}
                      {type === 'square' && '■ Square'}
                      {type === 'triangle' && '▲ Triangle'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAuthorizeSingleOrder}
                  className="mt-1.5 w-full bg-[#141414] text-white py-1 text-[8.5px] font-black uppercase border border-[#141414] cursor-pointer hover:bg-[#141414]/90"
                >
                  Authorize Reinforcement
                </button>
              </div>
            )}

            {orderType === 'fortify' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[9px] block">Fortify Grid Shields</span>
                <p className="text-[8.5px] text-[#141414]/80 leading-relaxed">
                  Upgrade sector defensive shields. Cost: <span className="text-emerald-700 font-bold">$20,000</span>.
                </p>
                <div className="p-1 bg-[#E4E3E0] border border-[#141414] text-[8.5px] font-bold flex justify-between">
                  <span>Power Level:</span>
                  <span className="text-sky-800">Level {selectedCell.fortification} / 3</span>
                </div>
                <button
                  onClick={handleAuthorizeSingleOrder}
                  className="mt-1.5 w-full bg-[#141414] text-white py-1 text-[8.5px] font-black uppercase border border-[#141414] cursor-pointer hover:bg-[#141414]/90"
                >
                  Authorize Fortification
                </button>
              </div>
            )}

            {orderType === 'scan' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[#141414] font-black uppercase tracking-wider text-[9px] block">Deep Orbital Scan</span>
                <p className="text-[8.5px] text-[#141414]/80 leading-relaxed">
                  Lift Fog of War instantly on adjacent sector. Cost: <span className="text-emerald-700 font-bold">$5,000</span>.
                </p>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8.5px] text-[#141414]/60 font-serif italic font-bold">Unscouted Neighbor:</span>
                  <select
                    value={targetCellId}
                    onChange={(e) => setTargetCellId(Number(e.target.value))}
                    className="bg-white border-2 border-[#141414] text-[#141414] p-1 w-full outline-none text-[9.5px] font-mono font-bold"
                  >
                    <option value={-1} disabled>-- Choose Neighbor --</option>
                    {neighborCells.filter(neigh => !playerCorp.scoutedCells[neigh.id]).map(neigh => (
                      <option key={neigh.id} value={neigh.id}>
                        {neigh.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAuthorizeSingleOrder}
                  className="mt-1.5 w-full bg-[#141414] text-white py-1 text-[8.5px] font-black uppercase border border-[#141414] cursor-pointer hover:bg-[#141414]/90"
                >
                  Authorize Scan
                </button>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {errorMsg && (
            <div className="p-1.5 bg-red-100 border-2 border-[#141414] text-[8.5px] font-mono text-red-700 font-bold shadow-[1px_1px_0px_0px_#141414]">
              ⚠️ {errorMsg}
            </div>
          )}

        </div>
      ) : (
        /* Inspection Mode for Non-Owned Sectors */
        <div className="flex flex-col gap-3 flex-1 text-xs text-[#141414]">
          <div className="p-2.5 bg-white border-2 border-[#141414] shadow-[1.5px_1.5px_0px_0px_#141414]">
            <span className="font-serif italic text-[10px] text-[#141414]/60 uppercase block mb-0.5 font-bold">Intelligence Dossier</span>
            <p className="leading-normal text-[9px] text-[#141414]/80">
              This sector is outside your corporate perimeter. Direct command structures are offline. To acquire ownership:
            </p>
            <ul className="list-disc pl-3.5 mt-1.5 text-[8.5px] text-[#141414]/70 space-y-0.5 font-serif italic">
              <li>Deploy troops from an adjacent controlled sector.</li>
              <li>Sustain garrison presence until Month-End resolution.</li>
              <li>Eliminate any rival claimants using RPS tactical advantages.</li>
            </ul>
          </div>

          <div className="flex-1 border-2 border-dashed border-[#141414]/40 bg-[#E4E3E0]/40 flex flex-col items-center justify-center p-3 text-center">
            <Shield className="w-7 h-7 text-[#141414]/60 mb-1.5" />
            <span className="font-black text-[#141414] text-[9px] uppercase tracking-wider">Garrison Perimeter Shield Active</span>
            <span className="text-[8.5px] text-[#141414]/60 mt-0.5 font-serif italic">Scans show active shielding holding. No manual intervention possible.</span>
          </div>
        </div>
      )}
    </div>
  );
}
