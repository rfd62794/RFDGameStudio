import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  showClose?: boolean;
}

export function Modal({ title, children, onClose, showClose = true }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={showClose ? onClose : undefined}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          {showClose && onClose && (
            <button className="btn-dismiss" onClick={onClose}>✕</button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
