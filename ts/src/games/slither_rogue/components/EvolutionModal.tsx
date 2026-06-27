import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Magnet, Shield, Maximize2, Compass, Ghost, Sparkles, Flame
} from 'lucide-react';
import type { EvolutionCard } from '../types';

interface EvolutionModalProps {
  cards: EvolutionCard[];
  onSelect: (cardId: string) => void;
  level: number;
}

const iconMap: Record<string, React.ReactNode> = {
  speed:  <Zap className="sr-evo-icon" />,
  magnet: <Magnet className="sr-evo-icon" />,
  shield: <Shield className="sr-evo-icon" />,
  wide:   <Maximize2 className="sr-evo-icon" />,
  sense:  <Compass className="sr-evo-icon" />,
  ghost:  <Ghost className="sr-evo-icon" />,
  regen:  <Sparkles className="sr-evo-icon" />,
  venom:  <Flame className="sr-evo-icon" />,
};

function rarityClass(rarity: string) {
  if (rarity === 'epic') return 'sr-evo-card--epic';
  if (rarity === 'rare') return 'sr-evo-card--rare';
  return '';
}

function rarityLabel(rarity: string) {
  if (rarity === 'epic') return 'Epic';
  if (rarity === 'rare') return 'Rare';
  return 'Common';
}

export default function EvolutionModal({ cards, onSelect, level }: EvolutionModalProps) {
  return (
    <AnimatePresence>
      <div className="sr-evo-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="sr-evo-panel"
        >
          <div className="sr-evo-glow sr-evo-glow--tl" />
          <div className="sr-evo-glow sr-evo-glow--br" />

          <div className="sr-evo-header">
            <div className="sr-evo-badge">
              <Sparkles className="sr-icon-xs sr-pulse" /> Level {level} Triggered
            </div>
            <h2 className="sr-evo-title">Choose Your Evolution</h2>
            <p className="sr-evo-desc">
              Your body undergoes rapid mutation. Select one gene modification to proceed.
              Evolutions persist even when segments are lost!
            </p>
          </div>

          <div className="sr-evo-grid">
            {cards.map((card, idx) => (
              <motion.button
                key={card.id}
                onClick={() => onSelect(card.id)}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.1 } }}
                className={`sr-evo-card ${rarityClass(card.rarity)}`}
              >
                <div className="sr-evo-card-top">
                  <div className="sr-evo-icon-wrap">
                    {iconMap[card.iconName] ?? <Sparkles className="sr-evo-icon sr-color-muted" />}
                  </div>
                  <span className={`sr-rarity-badge sr-rarity-badge--${card.rarity}`}>
                    {rarityLabel(card.rarity)}
                  </span>
                </div>
                <h3 className="sr-evo-card-name">{card.title}</h3>
                <p className="sr-evo-card-desc">{card.description}</p>
                <div className="sr-evo-card-footer">
                  <span>Equip Mutation</span>
                  <span className="sr-evo-arrow">→</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
