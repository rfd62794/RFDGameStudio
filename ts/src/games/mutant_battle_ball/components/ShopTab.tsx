import React, { useMemo, useState } from 'react';
import { Button, Card, Badge } from '../../../ui/components';
import type { MBBGameState } from '../types';
import type { Part, BrandId, QualityTier } from '../../../engine/shared/partSlots';
import { BRAND_SIGNATURES, QUALITY_LABELS, getEffectivePartStats } from '../brandModifiers';

interface ShopTabProps {
  state: MBBGameState;
  setState: (fn: (prev: MBBGameState) => MBBGameState) => void;
  session: unknown;
}

function extractPartsCatalogue(session: unknown): Part[] {
  const data = (session as { files: { data: Record<string, unknown> } }).files.data;
  const raw = data['parts'] as Array<Record<string, unknown>> ?? [];
  return raw.map(p => ({
    id: p['id'] as string,
    name: p['name'] as string,
    slot: p['slot'] as Part['slot'],
    accuracy: p['accuracy'] as number,
    endurance: p['endurance'] as number,
    power: p['power'] as number,
    speed: p['speed'] as number,
    price: p['price'] as number,
    description: p['description'] as string | undefined,
    brand: p['brand'] as BrandId | undefined,
    qualityTier: p['qualityTier'] as QualityTier | undefined,
    cyberOrganicLean: p['cyberOrganicLean'] as number | undefined,
  }));
}

export default function ShopTab({ state, setState, session }: ShopTabProps) {
  const catalogue = useMemo(() => extractPartsCatalogue(session), [session]);
  const [flash, setFlash] = useState<string | null>(null);

  const ownedIds = new Set(state.partsInventory);

  const handleBuy = (part: Part) => {
    if (state.iron < part.price) {
      setFlash(`Not enough Iron for ${part.name}.`);
      return;
    }
    setState(prev => ({
      ...prev,
      iron: prev.iron - part.price,
      partsInventory: [...prev.partsInventory, part.id],
    }));
    setFlash(`Bought ${part.name} for ${part.price} Iron.`);
    setTimeout(() => setFlash(null), 2000);
  };

  return (
    <div className="shop-tab">
      <div className="shop-header">
        <h2>Shop</h2>
        <Badge label={`⚙ ${state.iron} IRON`} variant="accent" />
      </div>
      {flash && <div className="shop-flash">{flash}</div>}
      <p className="shop-hint">Buy parts with Iron. Equipped in the Workshop.</p>
      <div className="parts-grid">
        {catalogue.map(part => {
          const owned = ownedIds.has(part.id);
          const affordable = state.iron >= part.price;
          return (
            <Card key={part.id} className="part-card">
              <div className="part-name">{part.name}</div>
              <div className="part-slot">Slot: {part.slot}</div>
              {part.brand && (
                <div className="part-brand">
                  <Badge label={BRAND_SIGNATURES[part.brand].label} variant="accent" />
                  <span className="part-brand-sig">
                    {BRAND_SIGNATURES[part.brand].signature}
                  </span>
                </div>
              )}
              {part.qualityTier && part.qualityTier !== 'brand_new' && (
                <div className="part-quality">
                  <Badge
                    label={QUALITY_LABELS[part.qualityTier]}
                    variant={part.qualityTier === 'malfunctioning' ? 'default' : 'muted'}
                  />
                </div>
              )}
              {part.cyberOrganicLean !== undefined && (
                <div className="part-cyber-organic">
                  <span className="lean-label">
                    {part.cyberOrganicLean < 40 ? 'Organic' :
                     part.cyberOrganicLean > 60 ? 'Cyber' : 'Balanced'}
                  </span>
                  <span className="lean-value">({part.cyberOrganicLean})</span>
                </div>
              )}
              <div className="part-stats">
                {(() => {
                  const eff = getEffectivePartStats(part);
                  const showEffective = part.brand !== undefined || part.qualityTier !== undefined || part.cyberOrganicLean !== undefined;
                  if (showEffective) {
                    return (
                      <>
                        <span>ACC {eff.accuracy.toFixed(0)}</span>
                        <span>END {eff.endurance.toFixed(0)}</span>
                        <span>PWR {eff.power.toFixed(0)}</span>
                        <span>SPD {eff.speed.toFixed(0)}</span>
                      </>
                    );
                  }
                  return (
                    <>
                      <span>ACC {part.accuracy}</span>
                      <span>END {part.endurance}</span>
                      <span>PWR {part.power}</span>
                      <span>SPD {part.speed}</span>
                    </>
                  );
                })()}
              </div>
              {part.description && <div className="part-desc">{part.description}</div>}
              <div className="part-price">{part.price} Iron</div>
              {owned ? (
                <Badge label="OWNED" variant="muted" />
              ) : (
                <Button
                  label={`Buy (${part.price})`}
                  onClick={() => handleBuy(part)}
                  disabled={!affordable}
                  variant={affordable ? 'primary' : 'neutral'}
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
