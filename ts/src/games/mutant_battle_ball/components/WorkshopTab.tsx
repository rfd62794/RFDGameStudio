import React, { useMemo, useState } from 'react';
import { Button, Card, Badge } from '../../../ui/components';
import type { MBBGameState } from '../types';
import type { Part, PartSlot } from '../../../engine/shared/partSlots';
import { PART_SLOTS } from '../../../engine/shared/partSlots';

interface WorkshopTabProps {
  state: MBBGameState;
  setState: (fn: (prev: MBBGameState) => MBBGameState) => void;
  session: unknown;
}

function extractPartsMap(session: unknown): Map<string, Part> {
  const data = (session as { files: { data: Record<string, unknown> } }).files.data;
  const raw = data['parts'] as Array<Record<string, unknown>> ?? [];
  const map = new Map<string, Part>();
  for (const p of raw) {
    map.set(p['id'] as string, {
      id: p['id'] as string,
      name: p['name'] as string,
      slot: p['slot'] as Part['slot'],
      accuracy: p['accuracy'] as number,
      endurance: p['endurance'] as number,
      power: p['power'] as number,
      speed: p['speed'] as number,
      price: p['price'] as number,
      description: p['description'] as string | undefined,
    });
  }
  return map;
}

export default function WorkshopTab({ state, setState, session }: WorkshopTabProps) {
  const partsMap = useMemo(() => extractPartsMap(session), [session]);
  const [selectedMutantId, setSelectedMutantId] = useState<string | null>(
    state.roster[0]?.id ?? null
  );
  const [flash, setFlash] = useState<string | null>(null);

  const selectedMutant = state.roster.find(m => m.id === selectedMutantId) ?? null;

  // Build inventory parts grouped by slot
  const inventoryBySlot: Record<string, Part[]> = {};
  for (const slot of PART_SLOTS) inventoryBySlot[slot] = [];
  for (const partId of state.partsInventory) {
    const part = partsMap.get(partId);
    if (part) inventoryBySlot[part.slot].push(part);
  }

  const handleEquip = (mutantId: string, slot: PartSlot, newPart: Part) => {
    setState(prev => {
      const targetMutant = prev.roster.find(m => m.id === mutantId);
      const oldPart = targetMutant?.parts[slot] ?? null;
      const roster = prev.roster.map(m => {
        if (m.id !== mutantId) return m;
        const parts = { ...m.parts, [slot]: newPart };
        return { ...m, parts };
      });
      // Remove the new part from inventory, add the old part back (if any)
      let partsInventory = prev.partsInventory.filter(id => id !== newPart.id);
      if (oldPart) partsInventory = [...partsInventory, oldPart.id];
      return { ...prev, roster, partsInventory };
    });
    setFlash(`Equipped ${newPart.name} to ${selectedMutant?.name ?? 'mutant'}.`);
    setTimeout(() => setFlash(null), 2000);
  };

  return (
    <div className="workshop-tab">
      <div className="workshop-header">
        <h2>Workshop</h2>
        {flash && <div className="workshop-flash">{flash}</div>}
      </div>

      <div className="workshop-layout">
        <div className="mutant-selector">
          <h3>Mutants</h3>
          {state.roster.map(mutant => (
            <Card
              key={mutant.id}
              className={`mutant-select-card ${mutant.id === selectedMutantId ? 'selected' : ''}`}
            >
              <button
                className="mutant-select-btn"
                onClick={() => setSelectedMutantId(mutant.id)}
                style={{ color: mutant.color }}
              >
                {mutant.name}
              </button>
              <span className="mutant-status-badge">{mutant.status}</span>
            </Card>
          ))}
        </div>

        {selectedMutant && (
          <div className="equip-panel">
            <h3>{selectedMutant.name}'s Parts</h3>
            {PART_SLOTS.map(slot => {
              const equipped = selectedMutant.parts[slot];
              const available = inventoryBySlot[slot] ?? [];
              return (
                <div key={slot} className="slot-row">
                  <div className="slot-label">{slot.replace('_', ' ')}</div>
                  <div className="slot-equipped">
                    {equipped ? (
                      <Badge label={equipped.name} variant="accent" />
                    ) : (
                      <span className="empty-slot">empty</span>
                    )}
                  </div>
                  <div className="slot-options">
                    {available.length === 0 && (
                      <span className="no-parts">No parts in inventory for this slot.</span>
                    )}
                    {available.map(part => (
                      <Button
                        key={part.id}
                        label={`Equip ${part.name}`}
                        onClick={() => handleEquip(selectedMutant.id, slot, part)}
                        variant="neutral"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
