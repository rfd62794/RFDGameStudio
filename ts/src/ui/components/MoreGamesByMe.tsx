import { Card } from './Card';
import { Button } from './Button';

export interface MoreGamesByMeProps {
  mode: 'arcade' | 'standalone';
  currentGameId: string;
  games: { id: string; label: string }[];
  onSelectGame?: (id: string) => void;
  arcadeBaseUrl?: string;
}

export function MoreGamesByMe({
  mode,
  currentGameId,
  games,
  onSelectGame,
  arcadeBaseUrl,
}: MoreGamesByMeProps) {
  const otherGames = games.filter((g) => g.id !== currentGameId);

  const handleArcade = (id: string) => {
    if (onSelectGame) {
      onSelectGame(id);
    }
  };

  const handleStandalone = (id: string) => {
    const base = arcadeBaseUrl ?? 'https://rfditservices.com/games/rfdgamestudio/';
    const separator = base.includes('?') ? '&' : '?';
    const url = `${base}${separator}game=${id}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="more-games-card">
      <div className="more-games-label">More Games By Me</div>
      <div className="more-games-list">
        {otherGames.map((g) => (
          <Button
            key={g.id}
            id={`more-games-${g.id}`}
            label={g.label}
            variant="secondary"
            size="sm"
            onClick={() => (mode === 'arcade' ? handleArcade(g.id) : handleStandalone(g.id))}
          />
        ))}
      </div>
    </Card>
  );
}
