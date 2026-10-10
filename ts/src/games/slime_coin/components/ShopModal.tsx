import { Modal } from '../../../ui/components';
import type { ChipCard } from '../types';
import { SHOP_ITEMS } from '../shopItems';

interface ShopModalProps {
  offeredCards: ChipCard[];
  tokens: number;
  onSelectCard: (cardId: string) => void;
  onPurchase: (itemId: string) => void;
}

export default function ShopModal({
  offeredCards, tokens, onSelectCard, onPurchase
}: ShopModalProps) {
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
          {SHOP_ITEMS.map(item => (
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
