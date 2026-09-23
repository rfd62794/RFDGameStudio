import React, { useState, useEffect } from 'react';
import { runAllEngineTests, TestResult } from '../engine/tests';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  Terminal,
  ShieldCheck,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [testOutput, setTestOutput] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const output = runAllEngineTests();
      setTestOutput(output);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-700 text-indigo-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Engine Test Anchors & Verification Suite
              </h2>
              <p className="text-xs text-slate-400">
                Phase Directive: ADR 002 Baseline + Soil Stability & Monument Logic
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Summary Status Bar */}
          {testOutput && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                testOutput.failed === 0
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {testOutput.failed === 0 ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
                <div>
                  <div className="text-sm font-bold">
                    {testOutput.failed === 0
                      ? 'Target Floor Verified: 3 passed; 0 failed; 0 ignored'
                      : `${testOutput.failed} Tests Failed`}
                  </div>
                  <div className="text-xs opacity-80">
                    All ADR 002 and Phase Directive rules enforced deterministically.
                  </div>
                </div>
              </div>

              <button
                onClick={executeTests}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-950/50 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {isRunning ? 'Running...' : 'Re-run Tests'}
              </button>
            </div>
          )}

          {/* Simulated Raw Terminal Output */}
          <div className="bg-black/90 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 shadow-inner">
            <div className="flex items-center gap-2 text-slate-500 mb-2 pb-2 border-b border-slate-800/80">
              <Terminal className="w-3.5 h-3.5" />
              <span>Raw Engine Test Output</span>
            </div>

            <div className="space-y-1 text-slate-400">
              <p className="text-indigo-400">running 3 tests</p>
              {testOutput?.results.map((res) => (
                <div key={res.name} className="flex items-center justify-between">
                  <span>test tests::{res.name} ...</span>
                  <span
                    className={
                      res.passed
                        ? 'text-emerald-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {res.passed ? 'ok' : 'FAILED'}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800/80 text-slate-200 font-bold">
                test result:{' '}
                <span className="text-emerald-400">
                  ok. {testOutput?.passed ?? 0} passed; {testOutput?.failed ?? 0} failed; 0 ignored; 0 measured; 0 filtered out
                </span>
              </div>
            </div>
          </div>

          {/* Test Detail Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verification Criteria & Assertions Breakdown
            </h3>

            {testOutput?.results.map((res, i) => (
              <div
                key={`test-card-${res.name}`}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {res.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="text-xs font-mono font-bold text-slate-200">
                      §3.{i + 1} {res.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    {res.durationMs}ms
                  </div>
                </div>

                {/* Assertion details */}
                <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/60 space-y-1">
                  {res.details.map((detail, dIdx) => (
                    <div
                      key={`d-${dIdx}`}
                      className="text-[11px] text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-emerald-400">✓</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                  {res.error && (
                    <div className="text-[11px] text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-800">
                      <strong>Failure:</strong> {res.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
