import React, { useState, useEffect, useMemo } from 'react';
import { MapCell, Corporation, WeeklyOrder, UnitGroup, UnitType, OrderType } from '../types';
import { getDefaultAction, sortRegionsByThreat, getThreatLevel } from '../defaultAction';
import { HOUSE_DESCRIPTIONS, REGION_FLAVOR_PREFIXES } from '../flavorText';
import { Shield, Hammer, Compass, Users, ArrowRight, Check, Eye, AlertTriangle, ChevronRight, Award } from 'lucide-react';

interface GuidedWalkthroughProps {
  allCells: MapCell[];
  corporations: Corporation[];
  playerCorp: Corporation;
  currentOrders: { [cellId: number]: WeeklyOrder[] };
  onSaveOrders: (cellId: number, orders: WeeklyOrder[]) => void;
  onAllRegionsProcessed: () => void;
  selectedCellId: number | null;
  onSelectCell: (id: number) => void;
}

/**
 * Guided per-Region walkthrough — replaces the free-form WeeklyOrdersPanel
 * as the primary weekly planning flow.
 *
 * Each owned Region is presented one at a time, in threat-level order
 * (highest threat first). Each Region arrives with a sensible,
 * state-derived default action pre-filled. The player can:
 *   - Confirm the default (fast path — one click)
 *   - Change the action (open the full action set)
 *
 * After the last Region, the week's orders are complete and the
 * "Authorize Planning" button becomes available.
 */
export default function GuidedWalkthrough({
  allCells,
  corporations,
  playerCorp,
  currentOrders,
  onSaveOrders,
  onAllRegionsProcessed,
  selectedCellId,
  onSelectCell,
}: GuidedWalkthroughProps) {
  // Sort owned regions by threat level (highest first), then by ID
  const ownedRegions = useMemo(
    () => sortRegionsByThreat(allCells, allCells, corporations, playerCorp),
    [allCells, corporations, playerCorp]
  );

  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);
  const [showFullActions, setShowFullActions] = useState(false);
  const [customOrder, setCustomOrder] = useState<WeeklyOrder | null>(null);
  const [processedRegions, setProcessedRegions] = useState<Set<number>>(new Set());

  // Reset state when the set of owned regions changes (new week)
  useEffect(() => {
    setCurrentRegionIndex(0);
    setShowFullActions(false);
    setCustomOrder(null);
    setProcessedRegions(new Set());
  }, [ownedRegions.length]);

  if (ownedRegions.length === 0) {
    return (
      <div className="bg-[#1a1a2e] border-2 border-amber-600/40 p-6 text-amber-100 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h3 className="font-sans font-bold text-lg text-amber-200 uppercase tracking-tight mb-2">No Territories Held</h3>
        <p className="text-xs text-amber-100/70 max-w-xs leading-relaxed">
          Your House holds no sectors. The campaign is over.
        </p>
      </div>
    );
  }

  const currentCell = ownedRegions[currentRegionIndex];
  if (!currentCell) {
    // All regions processed
    return (
      <div className="bg-[#1a1a2e] border-2 border-emerald-600/40 p-6 text-emerald-100 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <Check className="w-12 h-12 text-emerald-500 mb-4" />
        <h3 className="font-sans font-bold text-lg text-emerald-200 uppercase tracking-tight mb-2">All Regions Reviewed</h3>
        <p className="text-xs text-emerald-100/70 max-w-xs leading-relaxed mb-4">
          {ownedRegions.length} regions processed. Ready to authorize the week's directives.
        </p>
        <button
          onClick={onAllRegionsProcessed}
          className="bg-amber-600 hover:bg-amber-500 text-[#1a1a2e] font-black py-2.5 px-6 text-xs font-mono uppercase tracking-widest transition cursor-pointer border-2 border-amber-400"
          data-testid="pog-authorize-all-planning"
        >
          Authorize Weekly Directives
        </button>
      </div>
    );
  }

  // Compute the default action for this region
  const defaultAction = getDefaultAction(currentCell, allCells, corporations, playerCorp);
  const activeOrder = customOrder ?? defaultAction;
  const threatLevel = getThreatLevel(currentCell, allCells, corporations, playerCorp);
  const isProcessed = processedRegions.has(currentCell.id);

  // Select this cell on the map
  useEffect(() => {
    if (currentCell && !isProcessed) {
      onSelectCell(currentCell.id);
    }
  }, [currentCell?.id]);

  const handleConfirm = () => {
    // Save the order (active order) for this cell
    const order = customOrder ?? defaultAction;
    onSaveOrders(currentCell.id, [order]);
    setProcessedRegions(prev => new Set(prev).add(currentCell.id));

    // Move to next region
    if (currentRegionIndex + 1 < ownedRegions.length) {
      setCurrentRegionIndex(currentRegionIndex + 1);
      setShowFullActions(false);
      setCustomOrder(null);
    } else {
      // All done — show the summary
      setCurrentRegionIndex(currentRegionIndex + 1);
    }
  };

  const handleSkip = () => {
    // Save Hold as the order (explicit skip, not a missing decision)
    onSaveOrders(currentCell.id, [{ type: 'hold' }]);
    setProcessedRegions(prev => new Set(prev).add(currentCell.id));

    if (currentRegionIndex + 1 < ownedRegions.length) {
      setCurrentRegionIndex(currentRegionIndex + 1);
      setShowFullActions(false);
      setCustomOrder(null);
    } else {
      setCurrentRegionIndex(currentRegionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentRegionIndex > 0) {
      setCurrentRegionIndex(currentRegionIndex - 1);
      setShowFullActions(false);
      setCustomOrder(null);
      // Remove from processed so it can be re-confirmed
      setProcessedRegions(prev => {
        const next = new Set(prev);
        const prevCell = ownedRegions[currentRegionIndex - 1];
        if (prevCell) next.delete(prevCell.id);
        return next;
      });
    }
  };

  const handleSelectCustomAction = (order: WeeklyOrder) => {
    setCustomOrder(order);
    setShowFullActions(false);
  };

  // Threat display
  const threatLabel = threatLevel === 3 ? 'CRITICAL' : threatLevel === 2 ? 'HIGH' : threatLevel === 1 ? 'MODERATE' : 'SAFE';
  const threatColor = threatLevel === 3 ? 'text-red-400 border-red-500' : threatLevel === 2 ? 'text-orange-400 border-orange-500' : threatLevel === 1 ? 'text-amber-400 border-amber-500' : 'text-emerald-400 border-emerald-500';

  const garrison = currentCell.units.circle + currentCell.units.square + currentCell.units.triangle;
  const opinion = currentCell.publicOpinion ?? 50;

  // Action label for the current active order
  const actionLabel = (order: WeeklyOrder): string => {
    switch (order.type) {
      case 'hold': return 'Hold Sector';
      case 'fortify': return 'Fortify Defenses';
      case 'reinforce': return `Reinforce (${order.reinforceType})`;
      case 'expand': {
        const target = allCells.find(c => c.id === order.targetCellId);
        return `Expand to ${target?.name ?? 'neighbor'}`;
      }
      case 'scan': return 'Deep Scan';
      case 'civic': return `Civic: ${order.focus}`;
      default: return 'Hold';
    }
  };

  const actionIcon = (type: string) => {
    switch (type) {
      case 'hold': return <Check className="w-4 h-4" />;
      case 'fortify': return <Shield className="w-4 h-4" />;
      case 'reinforce': return <Users className="w-4 h-4" />;
      case 'expand': return <ArrowRight className="w-4 h-4" />;
      case 'scan': return <Eye className="w-4 h-4" />;
      case 'civic': return <Hammer className="w-4 h-4" />;
      default: return <Check className="w-4 h-4" />;
    }
  };

  // Neighbor info for threat context
  const neighborCells = currentCell.neighbors
    .map(nid => allCells.find(c => c.id === nid))
    .filter(Boolean) as MapCell[];
  const rivalNeighbors = neighborCells.filter(n => n.ownerId && n.ownerId !== playerCorp.id);
  const neutralNeighbors = neighborCells.filter(n => !n.ownerId);

  return (
    <div className="bg-[#1a1a2e] border-2 border-amber-600/40 p-4 text-amber-50 flex flex-col h-full gap-3 select-none" data-testid="pog-guided-walkthrough">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-amber-100/60 uppercase tracking-widest">
          Region {currentRegionIndex + 1} of {ownedRegions.length}
        </span>
        <span className={`px-2 py-0.5 border ${threatColor} font-bold uppercase tracking-wider text-[9px]`} data-testid="pog-threat-level">
          {threatLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#1a1a2e] border border-amber-900/40">
        <div
          className="h-full bg-amber-600 transition-all duration-300"
          style={{ width: `${((currentRegionIndex + 1) / ownedRegions.length) * 100}%` }}
        />
      </div>

      {/* Region header */}
      <div className="border-b border-amber-900/40 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-serif italic text-[10px] text-amber-100/50 uppercase tracking-widest block">
              {REGION_FLAVOR_PREFIXES[currentCell.id % REGION_FLAVOR_PREFIXES.length]}
            </span>
            <h2 className="text-lg font-bold text-amber-100 uppercase tracking-tight font-sans leading-none mt-0.5" data-testid="pog-current-region-name">
              {currentCell.name}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-[9px] font-mono">
            <span className="text-amber-100/50">Garrison: <span className="text-amber-200 font-bold">{garrison}</span></span>
            <span className="text-amber-100/50">Fort: <span className="text-amber-200 font-bold">L{currentCell.fortification}/3</span></span>
            <span className="text-amber-100/50">Opinion: <span className="text-amber-200 font-bold">{opinion}</span></span>
          </div>
        </div>
      </div>

      {/* Threat context */}
      {rivalNeighbors.length > 0 && (
        <div className="bg-red-950/30 border border-red-800/40 p-2 text-[10px] text-red-200">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>
              {rivalNeighbors.length} rival neighbor{s: rivalNeighbors.length > 1 ? 's' : ''}:
              {' '}
              {rivalNeighbors.map(n => {
                const corp = corporations.find(c => c.id === n.ownerId);
                return corp?.name ?? n.name;
              }).join(', ')}
            </span>
          </div>
        </div>
      )}
      {neutralNeighbors.length > 0 && (
        <div className="bg-emerald-950/20 border border-emerald-800/30 p-2 text-[10px] text-emerald-200">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3 h-3 shrink-0" />
            <span>{neutralNeighbors.length} unclaimed neighbor{neutralNeighbors.length > 1 ? 's' : ''} available for expansion</span>
          </div>
        </div>
      )}

      {/* Default action display */}
      {!showFullActions && (
        <div className="flex-1 flex flex-col gap-3">
          <div className="bg-amber-950/30 border border-amber-700/40 p-3 flex flex-col gap-2">
            <span className="font-serif italic text-[10px] text-amber-100/50 uppercase tracking-widest">
              Recommended Directive
            </span>
            <div className="flex items-center gap-2 text-amber-100">
              {actionIcon(activeOrder.type)}
              <span className="font-bold text-sm uppercase tracking-tight" data-testid="pog-default-action">
                {actionLabel(activeOrder)}
              </span>
            </div>
            <p className="text-[10px] text-amber-100/60 font-serif italic leading-relaxed">
              {activeOrder.type === 'hold' && 'Garrison holds position. Passive production continues.'}
              {activeOrder.type === 'fortify' && 'Reinforce sector shields. Cost: $20,000.'}
              {activeOrder.type === 'reinforce' && `Speed-recruit a ${activeOrder.type === 'reinforce' ? activeOrder.reinforceType : ''} unit. Cost: $30,000.`}
              {activeOrder.type === 'expand' && 'Deploy expeditionary forces to an unclaimed neighbor.'}
              {activeOrder.type === 'civic' && `Civic ${activeOrder.focus} focus. Cost: $10,000.`}
              {activeOrder.type === 'scan' && 'Deep orbital scan of an unscouted neighbor. Cost: $5,000.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirm}
              className="w-full bg-amber-600 hover:bg-amber-500 text-[#1a1a2e] font-black py-3 text-xs font-mono uppercase tracking-widest transition cursor-pointer border-2 border-amber-400 flex items-center justify-center gap-2"
              data-testid="pog-confirm-action"
            >
              <Check className="w-4 h-4" />
              Confirm — {actionLabel(activeOrder)}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFullActions(true)}
                className="flex-1 bg-transparent border border-amber-700/40 text-amber-200 hover:bg-amber-950/30 font-bold py-2 text-[10px] font-mono uppercase tracking-wider transition cursor-pointer"
                data-testid="pog-change-action"
              >
                Change Action
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 bg-transparent border border-amber-900/40 text-amber-100/50 hover:bg-amber-950/20 font-bold py-2 text-[10px] font-mono uppercase tracking-wider transition cursor-pointer"
              >
                Skip (Hold)
              </button>
            </div>
            {currentRegionIndex > 0 && (
              <button
                onClick={handleBack}
                className="bg-transparent border border-amber-900/30 text-amber-100/40 hover:text-amber-100/70 font-bold py-1.5 text-[9px] font-mono uppercase tracking-wider transition cursor-pointer"
              >
                ← Back to Previous Region
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full action set (when "Change Action" is clicked) */}
      {showFullActions && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <span className="font-serif italic text-[10px] text-amber-100/50 uppercase tracking-widest">
            Select Directive
          </span>

          {/* Hold */}
          <button
            onClick={() => handleSelectCustomAction({ type: 'hold' })}
            className="w-full p-2.5 border border-amber-800/40 bg-amber-950/20 hover:bg-amber-900/30 text-left flex items-center gap-2.5 transition cursor-pointer"
            data-testid="pog-action-hold"
          >
            <Check className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-100 uppercase block">Hold Sector</span>
              <span className="text-[9px] text-amber-100/50">Garrison holds. Passive production continues.</span>
            </div>
          </button>

          {/* Fortify */}
          <button
            onClick={() => handleSelectCustomAction({ type: 'fortify' })}
            disabled={currentCell.fortification >= 3 || playerCorp.treasury < 20000}
            className="w-full p-2.5 border border-amber-800/40 bg-amber-950/20 hover:bg-amber-900/30 text-left flex items-center gap-2.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="pog-action-fortify"
          >
            <Shield className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-100 uppercase block">Fortify ($20k)</span>
              <span className="text-[9px] text-amber-100/50">+1 Shield level. {currentCell.fortification >= 3 ? '(Max level)' : ''}</span>
            </div>
          </button>

          {/* Reinforce */}
          <button
            onClick={() => handleSelectCustomAction({ type: 'reinforce', reinforceType: currentCell.preferredProduction })}
            disabled={playerCorp.treasury < 30000}
            className="w-full p-2.5 border border-amber-800/40 bg-amber-950/20 hover:bg-amber-900/30 text-left flex items-center gap-2.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="pog-action-reinforce"
          >
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-100 uppercase block">Reinforce ($30k)</span>
              <span className="text-[9px] text-amber-100/50">+1 {currentCell.preferredProduction} unit in 1 week</span>
            </div>
          </button>

          {/* Expand */}
          {neutralNeighbors.length > 0 && garrison >= 2 && (
            <button
              onClick={() => {
                const target = neutralNeighbors[0];
                const units: UnitGroup = { circle: 0, square: 0, triangle: 0 };
                // Send 1 of the most available type
                if (currentCell.units.circle > 0) units.circle = 1;
                else if (currentCell.units.square > 0) units.square = 1;
                else if (currentCell.units.triangle > 0) units.triangle = 1;
                handleSelectCustomAction({ type: 'expand', targetCellId: target.id, unitsSent: units });
              }}
              className="w-full p-2.5 border border-amber-800/40 bg-amber-950/20 hover:bg-amber-900/30 text-left flex items-center gap-2.5 transition cursor-pointer"
              data-testid="pog-action-expand"
            >
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-xs text-amber-100 uppercase block">Expand to {neutralNeighbors[0].name}</span>
                <span className="text-[9px] text-amber-100/50">Deploy 1 unit to claim neutral neighbor</span>
              </div>
            </button>
          )}

          {/* Civic: Production */}
          <button
            onClick={() => handleSelectCustomAction({ type: 'civic', focus: 'production' })}
            className="w-full p-2.5 border border-amber-800/40 bg-amber-950/20 hover:bg-amber-900/30 text-left flex items-center gap-2.5 transition cursor-pointer"
            data-testid="pog-action-civic-production"
          >
            <Hammer className="w-4 h-4 text-yellow-400 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-100 uppercase block">Civic: Production</span>
              <span className="text-[9px] text-amber-100/50">Accelerate passive unit production</span>
            </div>
          </button>

          {/* Civic: Defense */}
          <button
            onClick={() => handleSelectCustomAction({ type: 'civic', focus: 'defense' })}
            disabled={playerCorp.treasury < 10000}
            className="w-full p-2.5 border border-amber-800/40 bg-amber-950/20 hover:bg-amber-900/30 text-left flex items-center gap-2.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="pog-action-civic-defense"
          >
            <Shield className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-100 uppercase block">Civic: Defense ($10k)</span>
              <span className="text-[9px] text-amber-100/50">+1 Fortification via civic investment</span>
            </div>
          </button>

          {/* Civic: Unrest */}
          <button
            onClick={() => handleSelectCustomAction({ type: 'civic', focus: 'unrest' })}
            disabled={playerCorp.treasury < 10000}
            className="w-full p-2.5 border border-amber-800/40 bg-amber-950/20 hover:bg-amber-900/30 text-left flex items-center gap-2.5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="pog-action-civic-unrest"
          >
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-100 uppercase block">Civic: Unrest ($10k)</span>
              <span className="text-[9px] text-amber-100/50">+8 Population Balance investment</span>
            </div>
          </button>

          {/* Cancel — go back to default view */}
          <button
            onClick={() => setShowFullActions(false)}
            className="bg-transparent border border-amber-900/40 text-amber-100/50 hover:text-amber-100/80 font-bold py-2 text-[10px] font-mono uppercase tracking-wider transition cursor-pointer mt-1"
          >
            ← Back to Recommendation
          </button>
        </div>
      )}
    </div>
  );
}
