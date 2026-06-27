interface CalendarRow {
  raceClass: Record<string, unknown>;
  playerStatus: 'eligible-ready' | 'eligible-resting' | 'ineligible' | 'no-horse';
  restingSecondsLeft: number;
}

interface CalendarTabProps {
  rows: CalendarRow[];
  funds: number;
  onEnterRace: (raceClass: Record<string, unknown>, aiOnly: boolean) => void;
}

export default function CalendarTab({ rows, funds, onEnterRace }: CalendarTabProps) {
  return (
    <div className="calendar-wrap">
      <h2 className="calendar-title">RACE CALENDAR</h2>
      <p className="calendar-subtitle">
        Select a race tier to enter. Resting horses run AI-only — you can still bet on the field.
      </p>

      <div className="calendar-table">
        <div className="calendar-header-row">
          <span>Tier</span>
          <span>Distance</span>
          <span>Prize Pool</span>
          <span>Entry</span>
          <span>Your Horse</span>
          <span></span>
        </div>

        {rows.map((row, i) => {
          const rc = row.raceClass;
          const name     = rc['name'] as string;
          const prize    = rc['prize_pool'] as number ?? 0;
          const fee      = rc['fee'] as number ?? 0;
          const canAfford = funds >= fee;
          const aiOnly   = row.playerStatus === 'eligible-resting';
          const canEnter = row.playerStatus !== 'ineligible' &&
                           row.playerStatus !== 'no-horse' && canAfford;

          return (
            <div key={i} className={`calendar-row ${row.playerStatus}`}>
              <span className="cal-tier">{name}</span>
              <span className="cal-distance">Mixed</span>
              <span className="cal-prize">${prize.toLocaleString()}</span>
              <span className="cal-fee">{fee === 0 ? 'Free' : `$${fee}`}</span>
              <span className="cal-status">
                {row.playerStatus === 'eligible-ready' && (
                  <span className="cal-badge cal-badge--ready">Ready</span>
                )}
                {row.playerStatus === 'eligible-resting' && (
                  <span className="cal-badge cal-badge--resting">
                    Resting {row.restingSecondsLeft}s
                  </span>
                )}
                {row.playerStatus === 'ineligible' && (
                  <span className="cal-badge cal-badge--locked">Locked</span>
                )}
                {row.playerStatus === 'no-horse' && (
                  <span className="cal-badge cal-badge--locked">No Horse</span>
                )}
              </span>
              <span className="cal-action">
                {canEnter && (
                  <button
                    className={`cal-enter-btn ${aiOnly ? 'ai-only' : ''}`}
                    onClick={() => onEnterRace(rc, aiOnly)}
                    disabled={!canAfford}
                  >
                    {aiOnly ? 'Watch & Bet' : 'Enter →'}
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
