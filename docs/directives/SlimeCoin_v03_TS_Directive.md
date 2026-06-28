# SlimeCoin — Phase v0.3-TS: TypeScript v0.3 Renderer

*June 2026 | Exposes v0.3 Lua features in the TypeScript layer.*
*Lua is complete. This phase is TypeScript only.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Must report **86 passed, 0 failed** (pytest) and **39 passed, 0 failed** (vitest).
> If counts differ, stop and report — do not proceed.

---

## §0 Context

The Lua side has v0.3 fully implemented:
- Vat layer (third physics layer, scoring + token events)
- Slime Tokens (earned at vat, dual use: exchange + shop)
- Shot Queue (5 pre-drawn slimes, Tetris-style next-up)
- Slime Pool (weighted random, expands via card picks)
- Pairwise Synergies (floor contact triggers combined effects)
- Exchange (mid-round: tokens → more shots, cost scales per use)
- Shop (end-of-round: free card pick + purchasable items)
- Floor persistence between rounds

The TypeScript side exposes none of this. This phase wires the renderer
to the v0.3 Lua state.

---

## §1 Scope

| File | Action |
|---|---|
| `ts/src/games/slime_coin/types.ts` | Add v0.3 fields to render state and game state |
| `ts/src/games/slime_coin/components/BoardCanvas.tsx` | Add vat layer, shot queue display |
| `ts/src/games/slime_coin/App.tsx` | Add tokens to HUD, exchange button, shop phase |
| `ts/src/games/slime_coin/components/ShopModal.tsx` | CREATE — end-of-round shop |
| `ts/src/games/slime_coin/components/CardSelectModal.tsx` | Remove — merged into ShopModal |

**Read-only — do not touch:**
All Lua files, all YAML files, all Python files, all other games,
`engine/`, `hooks/`, `ui/`, `styles.css`.

---

## §2 Implementation

### Step 1: Update `types.ts`

**Add to `SlimeCoinRenderState`:**
```typescript
tokens: number;
shot_queue: string[];          // array of type_ids, next-up first
vat_coins: SlimeCoin[];        // coins currently in vat (visual fill)
exchanges_used: number;        // exchanges consumed this round
active_synergies: Array<{      // synergies active from owned chips
  type_a: string;
  type_b: string;
  effect_id: string;
}>;
```

**Add to `SlimeCoinGameState`:**
```typescript
tokens: number;
shot_queue: string[];
exchanges_used: number;
```

**Add new interface:**
```typescript
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  item_type: 'pocket_coin' | 'hand_upgrade' | 'card';
}
```

**Update `ChipCard` to include pool info:**
```typescript
export interface ChipCard {
  card_id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic';
  description: string;
  slime_type_added?: string;   // new slime type added to pool
  synergy_partner?: string;    // which type it pairs with
  synergy_effect?: string;     // combined effect description
}
```

> ⚠️ RULE: Add fields additively. Do NOT remove any existing fields.

---

### Step 2: Update `BoardCanvas.tsx`

**Add vat layer** — a strip below the floor. Slimes that fall into the
vat appear here as small circles filling from left to right.

Layout constants (add at top of component):
```typescript
const SHELF_TOP = 50;
const SHELF_H   = 200;
const FLOOR_TOP = 280;
const FLOOR_H   = 150;
const VAT_TOP   = 450;
const VAT_H     = 40;
const BOARD_X   = 50;
const BOARD_W   = 400;
```

**Vat rendering** (add after floor coins draw):
```typescript
// Vat background
ctx.fillStyle = '#1a2a1a';
ctx.fillRect(BOARD_X, VAT_TOP, BOARD_W, VAT_H);

// Vat label
ctx.fillStyle = '#4ade80';
ctx.font = '11px monospace';
ctx.textAlign = 'left';
ctx.fillText('VAT', BOARD_X + 6, VAT_TOP + 14);

// Vat lip (glowing front edge of floor)
ctx.fillStyle = '#4ade80';
ctx.shadowColor = '#4ade80';
ctx.shadowBlur = 8;
ctx.fillRect(BOARD_X, FLOOR_TOP + FLOOR_H - 3, BOARD_W, 3);
ctx.shadowBlur = 0;

// Vat coins (small filled circles, left to right)
if (renderState.vat_coins) {
  let vx = BOARD_X + 12;
  for (const coin of renderState.vat_coins) {
    const color = SLIME_COLORS[coin.type_id] || '#4ade80';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(vx, VAT_TOP + VAT_H / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    vx += 16;
    if (vx > BOARD_X + BOARD_W - 12) break; // cap display
  }
}
```

**Shot queue display** — show next 3 slimes as icons between the two
shooters, centered at the top of the shelf:

```typescript
// Shot queue — centered between shooters
if (renderState.shot_queue && renderState.shot_queue.length > 0) {
  const queueX = 160;
  const queueY = 70;
  const visible = renderState.shot_queue.slice(0, 5);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(queueX - 8, queueY - 20, visible.length * 36 + 16, 40);

  visible.forEach((typeId, i) => {
    const color = SLIME_COLORS[typeId] || '#4ade80';
    const cx = queueX + i * 36;
    const r = i === 0 ? 14 : 10; // next-up is larger
    ctx.fillStyle = color;
    ctx.globalAlpha = i === 0 ? 1.0 : 0.6;
    ctx.beginPath();
    ctx.arc(cx, queueY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Arrow under next-up
    if (i === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NEXT', cx, queueY + 22);
    }
  });
}
```

**Resize canvas height** to accommodate vat:
```typescript
// canvas height: 500 → 510 (VAT_TOP 450 + VAT_H 40 + 20 margin)
width={600}
height={510}
```

> ⚠️ RULE: All draw calls must use the layout constants above.
> Do not hard-code pixel values that duplicate the constants.

---

### Step 3: Create `ShopModal.tsx`

This replaces `CardSelectModal.tsx`. It handles both the free card pick
and purchasable items in one modal.

```typescript
import { Modal } from '../../../ui/components';
import type { ChipCard, ShopItem } from '../types';

interface ShopModalProps {
  offeredCards: ChipCard[];
  tokens: number;
  onSelectCard: (cardId: string) => void;
  onPurchase: (itemId: string) => void;
}

export default function ShopModal({
  offeredCards, tokens, onSelectCard, onPurchase
}: ShopModalProps) {
  // Shop items are fixed for MVP — agent defines reasonable costs
  const shopItems: ShopItem[] = [
    { id: 'pocket_boom',    name: 'Blast Slime',   description: '+1 pocket coin',   cost: 15, item_type: 'pocket_coin' },
    { id: 'pocket_pull',    name: 'Magnet Slime',  description: '+1 pocket coin',   cost: 15, item_type: 'pocket_coin' },
    { id: 'pocket_echo',    name: 'Echo Slime',    description: '+1 pocket coin',   cost: 10, item_type: 'pocket_coin' },
    { id: 'hand_upgrade',   name: 'Hand +2',       description: '+2 max hand size', cost: 25, item_type: 'hand_upgrade' },
  ];

  return (
    <Modal title={`Shop — ${tokens} tokens`} showClose={false}>
      <div className="shop-section">
        <h3>Choose a Card (free)</h3>
        <div className="shop-cards">
          {offeredCards.map(card => (
            <button
              key={card.card_id}
              className={`shop-card rarity-${card.rarity}`}
              onClick={() => onSelectCard(card.card_id)}
            >
              <div className="card-name">{card.name}</div>
              <div className="card-rarity">{card.rarity}</div>
              <div className="card-desc">{card.description}</div>
              {card.slime_type_added && (
                <div className="card-pool">Adds: {card.slime_type_added}</div>
              )}
              {card.synergy_partner && (
                <div className="card-synergy">
                  Synergy: {card.slime_type_added} + {card.synergy_partner}
                  {card.synergy_effect && ` → ${card.synergy_effect}`}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="shop-section">
        <h3>Purchase Items</h3>
        <div className="shop-items">
          {shopItems.map(item => (
            <button
              key={item.id}
              className="shop-item"
              disabled={tokens < item.cost}
              onClick={() => onPurchase(item.id)}
            >
              <span className="item-name">{item.name}</span>
              <span className="item-desc">{item.description}</span>
              <span className="item-cost">{item.cost}t</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
```

> ⚠️ RULE: `showClose={false}` — player must pick a card before
> dismissing. Purchase items are optional; card pick is mandatory.

---

### Step 4: Update `App.tsx`

**Update imports** — replace `CardSelectModal` with `ShopModal`:
```typescript
import ShopModal from './components/ShopModal';
// Remove: import CardSelectModal from './components/CardSelectModal';
```

**Add tokens to initial state:**
```typescript
// In buildInitialState, add:
tokens: 0,
shot_queue: [],
exchanges_used: 0,
```

**Update HUD** — add tokens and next-slime indicator:
```tsx
<div className="sc-header">
  <span className="sc-round">Round {state.round}/{state.total_rounds}</span>
  <span className="sc-score">{state.score} / {state.target_score}</span>
  <span className="sc-rate">×{state.score_rate.toFixed(1)}</span>
  <span className="sc-hand">Hand: {state.hand_in}</span>
  <span className="sc-tokens">🟢 {state.tokens}</span>
</div>
```

**Update tick handler** — sync v0.3 state fields:
```typescript
if (result) {
  setRenderState(result);

  // Sync v0.3 fields into game state
  setState(prev => prev ? {
    ...prev,
    score: result.score,
    score_rate: result.score_rate,
    hand_in: result.hand_in,
    tokens: result.tokens ?? prev.tokens,
    shot_queue: result.shot_queue ?? prev.shot_queue,
    exchanges_used: result.exchanges_used ?? prev.exchanges_used,
  } : prev);

  if (result.phase === 'card_select') {
    setState(prev => prev ? {
      ...prev,
      phase: 'card_select',
      offered_cards: result.offered_cards ?? []
    } : prev);
  } else if (result.phase === 'run_end') {
    setState(prev => prev ? { ...prev, phase: 'run_end' } : prev);
  }
}
```

**Add exchange button** — visible when `hand_in === 0` and round not
yet ended, and exchanges remain:
```tsx
{state.phase === 'playing' && state.hand_in === 0 && state.exchanges_used < 3 && (
  <div className="sc-exchange">
    <button
      className="btn-exchange"
      onClick={() => {
        const result = call('exchange') as { tokens: number; hand_in: number } | null;
        if (result) {
          setState(prev => prev ? {
            ...prev,
            tokens: result.tokens,
            hand_in: result.hand_in,
            exchanges_used: (prev.exchanges_used ?? 0) + 1,
          } : prev);
        }
      }}
    >
      Exchange ({state.exchanges_used ?? 0}/3) — Cost: {
        [5, 8, 12][state.exchanges_used ?? 0] ?? 12
      } tokens
    </button>
  </div>
)}
```

**Replace card select modal with shop modal:**
```tsx
{state.phase === 'card_select' && state.offered_cards.length > 0 && (
  <ShopModal
    offeredCards={state.offered_cards}
    tokens={state.tokens ?? 0}
    onSelectCard={handleSelectCard}
    onPurchase={(itemId) => {
      const result = call('shop_purchase', itemId) as { tokens: number } | null;
      if (result) {
        setState(prev => prev ? { ...prev, tokens: result.tokens } : prev);
      }
    }}
  />
)}
```

> ⚠️ RULE: `exchange()` and `shop_purchase(item_id)` are Lua functions
> already implemented in v0.3 logic.lua. Call them via `call()` exactly
> as shown. Do not add new Lua functions.

---

### Step 5: Delete `CardSelectModal.tsx`

This component is replaced by `ShopModal.tsx`. Delete it after `ShopModal`
is confirmed working.

> ⚠️ RULE: Verify no other file imports `CardSelectModal` before deleting.
> If any import exists outside slime_coin/, do not delete — report instead.

---

## §3 CSS additions (append to `styles.css`)

```css
/* v0.3 shop */
.shop-section { margin-bottom: 1.5rem; }
.shop-section h3 { color: var(--text-muted); font-size: 0.8rem;
  text-transform: uppercase; margin-bottom: 0.5rem; }
.shop-cards { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.shop-card { background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 0.75rem; cursor: pointer; text-align: left;
  min-width: 140px; transition: border-color 0.15s; }
.shop-card:hover { border-color: var(--accent); }
.shop-card.rarity-epic { border-color: #a855f7; }
.shop-card.rarity-rare { border-color: #3b82f6; }
.card-name { font-weight: bold; font-size: 0.9rem; }
.card-rarity { font-size: 0.7rem; color: var(--text-muted);
  text-transform: uppercase; }
.card-desc { font-size: 0.8rem; margin-top: 0.25rem; }
.card-pool { font-size: 0.75rem; color: #4ade80; margin-top: 0.25rem; }
.card-synergy { font-size: 0.75rem; color: #a855f7; margin-top: 0.25rem; }

/* Shop items row */
.shop-items { display: flex; flex-direction: column; gap: 0.4rem; }
.shop-item { display: flex; align-items: center; gap: 0.5rem;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 4px; padding: 0.5rem 0.75rem; cursor: pointer; }
.shop-item:disabled { opacity: 0.4; cursor: not-allowed; }
.shop-item:not(:disabled):hover { border-color: var(--accent); }
.item-name { font-weight: bold; font-size: 0.85rem; flex: 1; }
.item-desc { font-size: 0.75rem; color: var(--text-muted); flex: 2; }
.item-cost { font-size: 0.85rem; color: #4ade80; font-weight: bold; }

/* Exchange */
.sc-exchange { display: flex; justify-content: center; margin-top: 0.5rem; }
.btn-exchange { background: var(--accent); color: white; border: none;
  border-radius: 6px; padding: 0.5rem 1.25rem; cursor: pointer;
  font-size: 0.9rem; font-weight: bold; }
.btn-exchange:hover { opacity: 0.85; }

/* Token display */
.sc-tokens { color: #4ade80; font-weight: bold; }
```

---

## §4 Completion Criteria

- [ ] `pytest -v` → 86/0/0 (unchanged)
- [ ] `npx vitest run` → 39/0/0 (unchanged, or higher)
- [ ] `types.ts` has `tokens`, `shot_queue`, `vat_coins`, `exchanges_used`,
  `active_synergies` on `SlimeCoinRenderState`
- [ ] Vat layer renders as green-lit strip below floor in browser
- [ ] Vat fills with small slime icons as coins are collected
- [ ] Shot queue shows next 3-5 slimes between shooters, next-up larger
- [ ] Token count visible in HUD (green 🟢 count)
- [ ] Exchange button appears when `hand_in = 0` with cost shown
- [ ] Exchange button disabled when `exchanges_used >= 3`
- [ ] `ShopModal` shows 3 free cards + purchasable items
- [ ] Card pick required before modal dismisses
- [ ] Shop purchase deducts tokens (confirmed via HUD update)
- [ ] `CardSelectModal.tsx` deleted
- [ ] No other game files modified
