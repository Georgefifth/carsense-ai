import React from 'react';
import { Wrench, CheckCircle2, FileText, Sparkles, MessageSquare } from 'lucide-react';
import { DiagnosticTriage } from '../types/telemetry';

interface DiagnosticTriageCardProps {
  triage: DiagnosticTriage;
  onSimulateRepair: () => void;
  onFocusChat: () => void;
  onExportReport: () => void;
}

export const DiagnosticTriageCard: React.FC<DiagnosticTriageCardProps> = ({
  triage,
  onSimulateRepair,
  onFocusChat,
  onExportReport,
}) => {
  return (
    <div className="bg-carbon-800 border border-carbon-700 rounded-lg p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-carbon-700 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
              AI Diagnostic Root-Cause Synthesis
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            {triage.rootCauseTitle}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onFocusChat}
            className="px-3 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Consult AI Mechanic</span>
          </button>

          <button
            onClick={onSimulateRepair}
            className="px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Simulate Part Fix & Clear</span>
          </button>

          <button
            onClick={onExportReport}
            className="px-2.5 py-1.5 rounded bg-carbon-700 hover:bg-carbon-600 border border-carbon-600 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
            title="Download diagnostic summary report"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Plain English Root Cause Explanation */}
      <div className="bg-carbon-900/90 border border-carbon-700/80 rounded p-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
        <p>{triage.plainEnglishExplanation}</p>
      </div>

      {/* Correlated Multi-PID Evidence */}
      <div>
        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
          Correlated Sensor Evidence (Multi-PID Analysis)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {triage.correlatedPids.map((item, idx) => (
            <div
              key={idx}
              className="bg-carbon-900 border border-carbon-700/60 rounded p-2.5 text-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-slate-400 font-mono mb-1">
                <span>{item.pidName}</span>
                <span className="text-cyan-400 font-bold">{item.reading}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Baseline: {item.nominalRange}
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 border-t border-carbon-800 pt-1">
                {item.anomalyNote}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Affected Components & Cost Estimator */}
      {triage.affectedComponents.length > 0 && (
        <div>
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
            Most Probable Failing Components & Repair Estimates
          </h4>
          <div className="space-y-2">
            {triage.affectedComponents.map((comp, idx) => (
              <div
                key={idx}
                className="bg-carbon-900 border border-carbon-700/80 rounded p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Left: Component Name & Probability */}
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{comp.name}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {comp.probability}% Confidence
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{comp.replacementGuide}</p>
                </div>

                {/* Right: Cost & Difficulty Breakdown */}
                <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">DIY Parts</div>
                    <div className="text-emerald-400 font-bold text-sm">
                      ${comp.partCostEstimateUsd}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Mechanic Total</div>
                    <div className="text-slate-200 font-bold text-sm">
                      ${comp.partCostEstimateUsd + comp.laborCostEstimateUsd}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">DIY Difficulty</div>
                    <div className="text-amber-400 font-bold flex items-center gap-0.5">
                      {Array.from({ length: comp.diyDifficultyWrenches }).map((_, i) => (
                        <Wrench key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preventative Advice Footnote */}
      {triage.preventativeAdvice.length > 0 && (
        <div className="bg-carbon-900/60 border border-carbon-700/40 rounded p-2.5 text-xs text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Master Technician Recommendations:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
            {triage.preventativeAdvice.map((adv, idx) => (
              <li key={idx}>{adv}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
