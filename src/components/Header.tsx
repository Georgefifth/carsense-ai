import React from 'react';
import { Activity, Cpu, Sliders, CheckCircle2, RefreshCw } from 'lucide-react';
import { VehicleScenario } from '../types/telemetry';

interface HeaderProps {
  scenarios: VehicleScenario[];
  activeScenario: VehicleScenario;
  onSelectScenario: (scenario: VehicleScenario) => void;
  onRunTriage: () => void;
  isTriaging: boolean;
  onOpenInjector: () => void;
  onOpenReadiness: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario,
  onRunTriage,
  isTriaging,
  onOpenInjector,
  onOpenReadiness,
}) => {
  return (
    <header className="border-b border-carbon-700 bg-carbon-900 relative z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Vehicle Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-carbon-800 border border-carbon-700 flex items-center justify-center text-telematic-cyan shadow-inner">
            <Cpu className="w-5 h-5 animate-pulse text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                CarSense <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 font-mono">AI COPILOT</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                CAN 20Hz Live
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="font-medium text-slate-300">{activeScenario.vehicleModel}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-400">SAE J1979 OBD-II / CAN-FD</span>
            </div>
          </div>
        </div>

        {/* Center: Scenario Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-slate-400 font-medium whitespace-nowrap hidden lg:block">
            Telematics Profile:
          </label>
          <select
            value={activeScenario.id}
            onChange={(e) => {
              const found = scenarios.find((s) => s.id === e.target.value);
              if (found) onSelectScenario(found);
            }}
            aria-label="Telematics Profile"
            className="bg-carbon-800 border border-carbon-600 text-slate-200 text-xs rounded px-2.5 py-2 font-mono focus:outline-none focus:border-cyan-500 transition max-w-xs truncate"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Quick Toolbar */}
          <button
            onClick={onOpenInjector}
            aria-label="Open Fault Injector"
            className="px-2.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 border border-carbon-600 text-xs font-medium flex items-center gap-1.5 transition"
            title="Inject custom PID values or paste custom DTC"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Fault Injector</span>
          </button>

          <button
            onClick={onOpenReadiness}
            aria-label="Open I/M Readiness Monitors"
            className="px-2.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 border border-carbon-600 text-xs font-medium flex items-center gap-1.5 transition"
            title="Inspect OBD-II I/M Readiness monitors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">I/M Readiness</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onRunTriage}
            disabled={isTriaging}
            className={`px-4 py-2 rounded font-semibold text-xs flex items-center gap-2 transition shadow-lg ${
              activeScenario.activeMil
                ? activeScenario.milFlashing
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 animate-pulse'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
                : 'bg-cyan-600 hover:bg-cyan-500 text-black font-bold shadow-cyan-950/50'
            }`}
          >
            {isTriaging ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Freeze-Frame...</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>Run AI Diagnostic Triage</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
