/**
 * Unified Game Viewport (ADR 011: Contiguous Megamap Architecture)
 * Completely eliminates the artificial Hideout vs Raid screen split.
 * Renders the persistent 200x200 matrix simulation with the central Faraday Sanctuary,
 * holographic click-to-place structure construction, dynamic hazard escalation,
 * specialist escort mechanics, and real-time telemetry.
 */

import React, { useState } from 'react';
import { RaidView } from './RaidView';
import { EcsInspector } from './EcsInspector';
import { SectorId, WeaponId } from '../types';

export const GameViewport: React.FC = () => {
  const [showInspector, setShowInspector] = useState(false);
  const [runId, setRunId] = useState(0);

  // Operative initial deployment parameters
  const [activeConfig] = useState<{
    charges: number;
    medkits: number;
    flares: number;
    lures: number;
    sectorId: SectorId;
    hasHazmat: boolean;
    equippedWeapon: WeaponId;
    unlockedWeapons: WeaponId[];
  }>({
    charges: 3,
    medkits: 2,
    flares: 4,
    lures: 1,
    sectorId: 'sector_01',
    hasHazmat: true,
    equippedWeapon: 'kinetic_scattergun',
    unlockedWeapons: ['kinetic_scattergun', 'plasma_pulse_array'],
  });

  // In the contiguous megamap, extraction brings the operative safely back to the Sanctuary Core.
  const startNewRun = () => setRunId(n => n + 1);

  return (
    <div id="unified-game-viewport" className="relative w-full h-screen overflow-hidden bg-[#090d13]">
      <RaidView
        key={runId}
        initialCharges={activeConfig.charges}
        initialMedkits={activeConfig.medkits}
        initialFlares={activeConfig.flares}
        initialLures={activeConfig.lures}
        sectorId={activeConfig.sectorId}
        hasHazmatSuit={activeConfig.hasHazmat}
        equippedWeapon={activeConfig.equippedWeapon}
        unlockedWeapons={activeConfig.unlockedWeapons}
        onEndRaid={startNewRun}
        onNewRun={startNewRun}
        onOpenInspector={() => setShowInspector(true)}
      />

      {/* Architecture & Telemetry Inspector Modal */}
      {showInspector && (
        <EcsInspector onClose={() => setShowInspector(false)} />
      )}
    </div>
  );
};
