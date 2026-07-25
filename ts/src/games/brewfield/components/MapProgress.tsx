import { Swords, Compass, Flame, Skull } from 'lucide-react';
import { ProgressIndicator } from '../../../ui/components';
import type { ProgressNode } from '../../../ui/components';
import type { RunNode } from '../types';

interface MapProgressProps {
  nodes: RunNode[];
  currentNodeId: number;
}

const NODE_ICONS: Record<string, React.ReactNode> = {
  fight: <Swords style={{ width: '1rem', height: '1rem' }} />,
  forage: <Compass style={{ width: '1rem', height: '1rem' }} />,
  rest: <Flame style={{ width: '1rem', height: '1rem' }} />,
  boss: <Skull style={{ width: '1rem', height: '1rem', color: 'var(--red)' }} />,
};

export default function MapProgress({ nodes, currentNodeId }: MapProgressProps) {
  const current = nodes.find((n) => n.id === currentNodeId);

  const progressNodes: ProgressNode[] = nodes.map((node) => ({
    id: node.id,
    type: node.id === 9 ? 'boss' : node.type,
    label: node.id === 9 ? 'BOSS' : node.type.toUpperCase(),
    description: `${node.name}: ${node.description}`,
    state: node.id === currentNodeId ? 'active' : node.id < currentNodeId ? 'completed' : 'pending',
  }));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--amber)',
            fontWeight: 700,
          }}
        >
          Current Level
        </span>
        <h2
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Depth {currentNodeId}/9: {current?.name || 'Descending...'}
        </h2>
      </div>

      <ProgressIndicator
        layout="linear"
        nodes={progressNodes}
        currentNodeId={currentNodeId}
        getNodeIcon={(type) => NODE_ICONS[type] ?? null}
      />
    </div>
  );
}
