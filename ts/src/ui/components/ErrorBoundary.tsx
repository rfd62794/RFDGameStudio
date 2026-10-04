// NEW: shared error boundary + player-facing diagnostics copy, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { Component } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { isEmbed, navigateHome } from '../../arcade/routing';
import { formatDiagnostics, recordDiagnostic } from '../../engine/diagnostics/diagnostics';

interface ErrorBoundaryProps {
  gameId: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  report: string | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, report: null, copied: false };

  private fallbackEl: HTMLDivElement | null = null;
  private setFallbackRef = (el: HTMLDivElement | null) => {
    this.fallbackEl = el;
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error): void {
    recordDiagnostic({ kind: 'boundary', message: error.message, stack: error.stack });
  }

  componentDidUpdate(_prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState): void {
    if (this.state.error && !prevState.error) {
      this.fallbackEl?.querySelector('button')?.focus();
    }
  }

  private handleTryAgain = () => {
    this.setState({ error: null, report: null, copied: false });
  };

  private handleCopyDiagnostics = async () => {
    const report = formatDiagnostics(this.props.gameId);
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (clipboard?.writeText) {
      try {
        await clipboard.writeText(report);
        this.setState({ copied: true, report: null });
        return;
      } catch {
        // Clipboard write rejected (permissions) — fall through to the textarea fallback.
      }
    }
    this.setState({ report });
  };

  render() {
    if (!this.state.error) return this.props.children;
    const { report, copied } = this.state;
    return (
      <div className="error-boundary" role="alert" ref={this.setFallbackRef}>
        <div className="error-box">
          <h2>Something went wrong</h2>
          <p>This game hit a snag. You can try again, or head back to the arcade.</p>
          <p>
            If it keeps happening, tap &quot;Copy diagnostics&quot; to copy a report you can share when reporting the problem. Nothing is sent automatically.
          </p>
        </div>
        <div className="error-boundary-actions">
          <Button label="Try again" onClick={this.handleTryAgain} />
          <Button
            label={copied ? 'Copied' : 'Copy diagnostics'}
            variant="secondary"
            onClick={this.handleCopyDiagnostics}
          />
          {!isEmbed() && (
            <Button label="← Back to Arcade" variant="neutral" onClick={() => navigateHome()} />
          )}
        </div>
        {report && (
          <textarea
            readOnly
            aria-label="Diagnostics report — select and copy it manually"
            value={report}
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
      </div>
    );
  }
}
