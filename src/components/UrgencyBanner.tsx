import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';
import { DiagnosticTriage, DTCFaultCode } from '../types/telemetry';

interface UrgencyBannerProps {
  triage: DiagnosticTriage;
  dtcCodes: DTCFaultCode[];
  activeMil: boolean;
  milFlashing?: boolean;
}

export const UrgencyBanner: React.FC<UrgencyBannerProps> = ({
  triage,
  dtcCodes,
  activeMil,
  milFlashing,
}) => {
  const isCritical = triage.urgency === 'critical' || milFlashing;
  const isCaution = triage.urgency === 'caution';

  return (
    <div
      className={`border rounded-lg p-3.5 transition-all shadow-md ${
        isCritical
          ? 'bg-red-950/40 border-red-700/80 text-red-200'
          : isCaution
          ? 'bg-amber-950/40 border-amber-700/80 text-amber-200'
          : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Status Icon & Primary Verdict */}
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              isCritical
                ? 'bg-red-900/60 border border-red-600 text-red-300 animate-bounce'
                : isCaution
                ? 'bg-amber-900/60 border border-amber-600 text-amber-300'
                : 'bg-emerald-900/60 border border-emerald-600 text-emerald-300'
            }`}
          >
            {isCritical ? (
              <AlertOctagon className="w-5 h-5 text-red-400" />
            ) : isCaution ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm tracking-tight text-white">
                {triage.urgencyTitle}
              </span>

              {/* MIL Badge */}
              {activeMil ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    milFlashing
                      ? 'bg-red-900 text-white border border-red-500 animate-pulse'
                      : 'bg-amber-900/80 text-amber-200 border border-amber-500'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {milFlashing ? 'CHECK ENGINE (FLASHING)' : 'CHECK ENGINE (MIL ON)'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <CheckCircle className="w-3 h-3" />
                  MIL OFF (0 CODES)
                </span>
              )}

              {/* Active DTC Codes pill */}
              {dtcCodes.length > 0 && (
                <div className="flex items-center gap-1">
                  {dtcCodes.map((dtc) => (
                    <span
                      key={dtc.code}
                      className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-carbon-800 border border-carbon-600 text-slate-200"
                    >
                      {dtc.code}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <span className="font-semibold text-slate-200">Drive Verdict: </span>
              {triage.driveRecommendation}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action or Status Summary */}
        <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 uppercase font-mono">Last Evaluated</div>
            <div className="text-xs font-mono font-semibold text-slate-200">
              {triage.timestamp}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
