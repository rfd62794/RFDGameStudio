import { Swords, Flame, Gem, Store, Zap, Crown, ArrowRight } from 'lucide-react';
import { Button } from '../../../ui/components';
import { ProgressIndicator } from '../../../ui/components';
import type { ProgressNode } from '../../../ui/components';
import type { RunNode, RunState } from '../types';

interface MapPhaseProps {
  run: RunState;
  onEnterCurrentNode: () => void;
  onSelectBranch: (targetNodeId: string) => void;
}

const NODE_ICONS: Record<RunNode['type'], typeof Swords> = {
  fight: Swords,
  restCraft: Flame,
  treasure: Gem,
  store: Store,
  anomaly: Zap,
  boss: Crown,
};

export default function MapPhase({ run, onEnterCurrentNode, onSelectBranch }: MapPhaseProps) {
  const currentNode = run.nodes.find((n) => n.id === run.currentNodeId);
  const alreadyVisited = run.visitedNodeIds.includes(run.currentNodeId);
  const branchOptions = alreadyVisited ? (currentNode?.connectsTo ?? []) : [];

  const nodes: ProgressNode[] = run.nodes.map((n) => {
    let state: 'completed' | 'active' | 'pending' = 'pending';
    if (n.id === run.currentNodeId) state = 'active';
    else if (run.visitedNodeIds.includes(n.id)) state = 'completed';
    return {
      id: n.id,
      type: n.type,
      label: n.type === 'fight' || n.type === 'boss' ? n.enemyName : n.type,
      description: n.type === 'fight' || n.type === 'boss' ? n.enemyName : n.type,
      state,
      x: n.x,
      y: n.y,
    };
  });

  const connections = run.nodes.flatMap((n) =>
    (n.connectsTo ?? []).map((targetId) => ({ from: n.id, to: targetId }))
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        maxWidth: '1024px',
        margin: 'var(--space-6) auto',
        padding: 'var(--space-6)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
      }}
      id="viewport-map-phase"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 400,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: 0,
            color: 'var(--text)',
          }}
        >
          Floor {run.currentFloor} — {run.nodes.length} Nodes
        </h2>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          HP {run.playerHp}/{run.playerMaxHp} · Essence {run.essence}
        </span>
      </div>

      {run.lastMapBalance && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-2)',
          }}
        >
          Map generation validated: {run.lastMapBalance.netDamage} HP net damage
          (band [{run.lastMapBalance.band[0]}-{run.lastMapBalance.band[1]}] HP,
          {' '}{run.lastMapBalance.attempts} attempt(s)).
        </div>
      )}

      <ProgressIndicator
        id="map-node-graph"
        layout="graph"
        nodes={nodes}
        currentNodeId={run.currentNodeId}
        connections={connections}
        getNodeIcon={(type) => {
          const Icon = NODE_ICONS[type as RunNode['type']];
          return Icon ? <Icon style={{ width: '1rem', height: '1rem' }} /> : null;
        }}
        onSelectNode={(id) => {
          const targetId = String(id);
          if (branchOptions.includes(targetId)) onSelectBranch(targetId);
        }}
      />

      {!alreadyVisited && currentNode && (
        <Button
          id="map-enter-node-btn"
          label={`Enter ${currentNode.type === 'fight' || currentNode.type === 'boss'
            ? `Fight: ${currentNode.enemyName}`
            : currentNode.type}`}
          icon={<ArrowRight style={{ width: '1rem', height: '1rem' }} />}
          onClick={onEnterCurrentNode}
          variant="primary"
          size="lg"
        />
      )}

      {alreadyVisited && branchOptions.length > 0 && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
          Select a connected node above to travel there.
        </p>
      )}
    </div>
  );
}
