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
