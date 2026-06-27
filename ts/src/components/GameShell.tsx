import React from 'react';

interface GameShellProps {
  /** Optional header region (nav, score, title) */
  header?: React.ReactNode;
  /** Main content — tabs, canvas, or free layout */
  children: React.ReactNode;
  /** Optional footer region */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Structural wrapper for a game's App component.
 * Provides header/main/footer layout with correct CSS flex structure.
 * New games return this from their App.tsx.
 *
 * Usage:
 *   return (
 *     <GameShell header={<AppHeader funds={state.funds} />}>
 *       <TabManager tabs={TABS} active={activeTab} onChange={setActiveTab}>
 *         {activeTab === 'stable' && <StablePanel />}
 *       </TabManager>
 *     </GameShell>
 *   );
 */
export function GameShell({ header, children, footer, className = '' }: GameShellProps) {
  return (
    <div className={`game-shell ${className}`}>
      {header && <div className="game-shell-header">{header}</div>}
      <div className="game-shell-main">{children}</div>
      {footer && <div className="game-shell-footer">{footer}</div>}
    </div>
  );
}
