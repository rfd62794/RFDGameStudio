import { Modal } from '../../../ui/components';
import type { ChipCard } from '../types';

interface CardSelectModalProps {
  cards: ChipCard[];
  onSelect: (cardId: string) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
};

export default function CardSelectModal({ cards, onSelect }: CardSelectModalProps) {
  return (
    <Modal title="Choose a Chip Card" showClose={false}>
      <div className="sc-card-options">
        {cards.map((card, index) => (
          <div
            key={`${card.card_id}-${index}`}
            className="sc-card"
            onClick={() => onSelect(card.card_id)}
            style={{ borderColor: RARITY_COLORS[card.rarity] }}
          >
            <div className="sc-card-rarity" style={{ color: RARITY_COLORS[card.rarity] }}>
              {card.rarity.toUpperCase()}
            </div>
            <div className="sc-card-name">{card.name}</div>
            <div className="sc-card-description">{card.description}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
