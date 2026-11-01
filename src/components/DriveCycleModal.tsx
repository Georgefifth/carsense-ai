import React from 'react';
import { X, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';
import { ReadinessMonitor } from '../types/telemetry';

interface DriveCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitors: ReadinessMonitor[];
  onResetReadiness: () => void;
  isSimulatingCycle: boolean;
  onSimulateDriveCycle: () => void;
}

export const DriveCycleModal: React.FC<DriveCycleModalProps> = ({
  isOpen,
  onClose,
  monitors,
  onResetReadiness,
  isSimulatingCycle,
  onSimulateDriveCycle,
}) => {
  if (!isOpen) return null;

  const readyCount = monitors.filter((m) => m.status === 'Ready').length;
  const isEmissionsReady = readyCount >= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-carbon-800 border border-carbon-600 rounded-xl shadow-2xl max-w-lg w-full p-5 text-xs text-slate-200">
        <div className="flex items-center justify-between border-b border-carbon-700 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              OBD-II I/M Emissions Readiness Monitors
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-carbon-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Readiness Summary Banner */}
        <div
          className={`p-3 rounded-lg border mb-4 flex items-center justify-between ${
            isEmissionsReady
              ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200'
              : 'bg-amber-950/40 border-amber-700/80 text-amber-200'
          }`}
        >
          <div>
            <div className="font-bold text-sm">
              {isEmissionsReady ? 'Emissions Inspection: READY TO PASS' : 'Emissions Test: NOT READY'}
            </div>
            <div className="text-[11px] text-slate-300">
              {readyCount} of {monitors.length} diagnostic drive cycle monitors completed.
            </div>
          </div>
          <div className="font-mono font-bold text-lg">
            {readyCount}/{monitors.length}
          </div>
        </div>

        {/* Monitor List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {monitors.map((m, idx) => (
            <div
              key={idx}
              className="bg-carbon-900 border border-carbon-700/80 rounded p-2.5 flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-white text-xs">{m.name}</div>
                <div className="text-[11px] text-slate-400">{m.description}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold shrink-0 ml-2 ${
                  m.status === 'Ready'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 border-t border-carbon-700 pt-3 mt-4">
          <button
            onClick={onResetReadiness}
            className="px-2.5 py-1.5 rounded bg-carbon-700 hover:bg-carbon-600 text-slate-300 font-medium flex items-center gap-1.5"
            title="Reset ECU readiness flags as happens after battery disconnect or DTC clear"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Flags</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onSimulateDriveCycle}
              disabled={isSimulatingCycle}
              className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold flex items-center gap-1.5 transition"
            >
              {isSimulatingCycle ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating Drive Cycle...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Run Drive Cycle Complete</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-carbon-700 hover:bg-carbon-600 text-slate-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
