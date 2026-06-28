interface PocketPickerProps {
  pocketCoins: Record<string, number>;
  onSelect: (coinType: string) => void;
  onClose: () => void;
}

const POCKET_COIN_INFO: Record<string, { name: string; color: string; description: string }> = {
  boom: { name: 'Blast Slime', color: '#f97316', description: 'Explodes on contact' },
  pull: { name: 'Magnet Slime', color: '#3b82f6', description: 'Pulls coins together' },
  echo: { name: 'Echo Slime', color: '#a855f7', description: '+5 Hand In' },
  giga: { name: 'Giant Slime', color: '#ef4444', description: '3× size, 10× mass' },
};

export default function PocketPicker({ pocketCoins, onSelect, onClose }: PocketPickerProps) {
  return (
    <div className="sc-modal-overlay">
      <div className="sc-pocket-picker">
        <h2 className="sc-modal-title">Select Pocket Coin</h2>
        <div className="sc-pocket-options">
          {Object.entries(pocketCoins).map(([typeId, count]) => {
            if (count <= 0) return null;
            const info = POCKET_COIN_INFO[typeId];
            if (!info) return null;
            
            return (
              <div
                key={typeId}
                className="sc-pocket-coin"
                onClick={() => onSelect(typeId)}
                style={{ borderColor: info.color }}
              >
                <div className="sc-pocket-coin-icon" style={{ backgroundColor: info.color }} />
                <div className="sc-pocket-coin-name">{info.name}</div>
                <div className="sc-pocket-coin-count">×{count}</div>
                <div className="sc-pocket-coin-description">{info.description}</div>
              </div>
            );
          })}
        </div>
        <button className="sc-close-button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
