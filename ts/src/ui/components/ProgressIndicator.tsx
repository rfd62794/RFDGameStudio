import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

export type ProgressNodeState = 'completed' | 'active' | 'pending';

export interface ProgressNode {
  id: string | number;
  type: string;
  label?: string;
  description?: string;
  state: ProgressNodeState;
  x?: number;
  y?: number;
}

export interface ProgressConnection {
  from: string | number;
  to: string | number;
}

export interface ProgressIndicatorProps {
  nodes: ProgressNode[];
  currentNodeId?: string | number;
  connections?: ProgressConnection[];
  layout?: 'linear' | 'graph';
  getNodeIcon?: (type: string) => ReactNode;
  onSelectNode?: (id: string | number) => void;
  className?: string;
  id?: string;
}

function normalizeConnections(
  raw: ProgressConnection[] | Array<[string | number, string | number]> | undefined
): ProgressConnection[] {
  if (!raw) return [];
  if (raw.length > 0 && Array.isArray(raw[0])) {
    return (raw as Array<[string | number, string | number]>).map(([from, to]) => ({ from, to }));
  }
  return raw as ProgressConnection[];
}

export function ProgressIndicator({
  nodes,
  currentNodeId,
  connections,
  layout = 'linear',
  getNodeIcon,
  onSelectNode,
  className,
  id,
}: ProgressIndicatorProps) {
  const normalizedConnections = normalizeConnections(connections);

  const nodeState = (node: ProgressNode): ProgressNodeState => {
    if (node.state) return node.state;
    if (currentNodeId !== undefined && node.id === currentNodeId) return 'active';
    return 'pending';
  };

  const nodeStyle = (state: ProgressNodeState): React.CSSProperties => {
    switch (state) {
      case 'active':
        return {
          background: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'var(--amber)',
          color: 'var(--amber)',
          boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
        };
      case 'completed':
        return {
          background: 'rgba(52, 211, 153, 0.12)',
          borderColor: 'var(--green)',
          color: 'var(--green)',
        };
      default:
        return {
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-muted)',
        };
    }
  };

  const nodeButton = (node: ProgressNode, index: number) => {
    const state = nodeState(node);
    const isClickable = state === 'active' || (onSelectNode && state === 'pending');
    const icon = state === 'completed'
      ? <Check style={{ width: '1rem', height: '1rem', strokeWidth: 3 }} />
      : getNodeIcon?.(node.type) ?? null;

    const button = (
      <button
        key={node.id}
        type="button"
        title={node.description || node.label || String(node.id)}
        disabled={!isClickable}
        onClick={() => onSelectNode?.(node.id)}
        className={`progress-node progress-node--${state}`}
        data-node-id={node.id}
        data-node-type={node.type}
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: 'var(--radius-full)',
          border: '2px solid',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'all 0.2s ease-out',
          position: layout === 'graph' ? 'absolute' : 'relative',
          left: layout === 'graph' && node.x !== undefined ? `${node.x}%` : undefined,
          top: layout === 'graph' && node.y !== undefined ? `${node.y}%` : undefined,
          transform: layout === 'graph' ? 'translate(-50%, -50%)' : undefined,
          ...nodeStyle(state),
        }}
      >
        {icon}
      </button>
    );

    const label = node.label || node.type;
    return (
      <div
        key={`wrap-${node.id}`}
        className="progress-node-wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
          position: layout === 'graph' ? 'absolute' : 'static',
          left: layout === 'graph' && node.x !== undefined ? `${node.x}%` : undefined,
          top: layout === 'graph' && node.y !== undefined ? `${node.y}%` : undefined,
          transform: layout === 'graph' ? 'translate(-50%, -50%)' : undefined,
        }}
      >
        {button}
        <span
          className="progress-node-label"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-xs)',
            color: state === 'active' ? 'var(--amber)' : state === 'completed' ? 'var(--green)' : 'var(--text-muted)',
            fontWeight: state === 'active' ? 700 : 400,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
        {index < nodes.length - 1 && layout === 'linear' && (
          <div
            className="progress-connector"
            style={{
              position: 'absolute',
              left: '50%',
              top: '2.25rem',
              width: '2px',
              height: 'calc(100% - 2.25rem)',
              background: state === 'completed' ? 'var(--green)' : 'var(--border)',
              transform: 'translateX(-50%)',
              zIndex: -1,
            }}
          />
        )}
      </div>
    );
  };

  if (layout === 'graph') {
    return (
      <div
        className={['progress-indicator progress-indicator--graph', className].filter(Boolean).join(' ')}
        id={id}
        style={{
          position: 'relative',
          width: '100%',
          height: '16rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {normalizedConnections.map(({ from, to }) => {
            const a = nodes.find((n) => n.id === from);
            const b = nodes.find((n) => n.id === to);
            if (!a || !b || a.x === undefined || b.x === undefined) return null;
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y ?? 50}
                x2={b.x}
                y2={b.y ?? 50}
                stroke="var(--border)"
                strokeWidth={0.4}
              />
            );
          })}
        </svg>
        {nodes.map((node, i) => nodeButton(node, i))}
      </div>
    );
  }

  return (
    <div
      className={['progress-indicator progress-indicator--linear', className].filter(Boolean).join(' ')}
      id={id}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
        width: '100%',
        padding: 'var(--space-4)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {nodes.map((node, i) => (
        <div
          key={node.id}
          className="progress-step"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
            position: 'relative',
          }}
        >
          {i > 0 && (
            <div
              className="progress-step-connector"
              style={{
                position: 'absolute',
                top: '1.125rem',
                left: '-50%',
                width: '100%',
                height: '2px',
                background:
                  nodeState(node) === 'completed' ||
                  (currentNodeId !== undefined && nodes.findIndex((n) => n.id === currentNodeId) >= i)
                    ? 'var(--green)'
                    : 'var(--border)',
                zIndex: 0,
              }}
            />
          )}
          {nodeButton(node, i)}
        </div>
      ))}
    </div>
  );
}
