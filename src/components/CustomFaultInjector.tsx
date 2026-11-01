import React, { useState } from 'react';
import { X, Sliders, AlertTriangle, Zap } from 'lucide-react';
import { TelemetryPIDs, DTCFaultCode } from '../types/telemetry';

interface CustomFaultInjectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentPids: TelemetryPIDs;
  onInject: (customPids: TelemetryPIDs, customCodes: DTCFaultCode[], isFlashing: boolean) => void;
}

export const CustomFaultInjector: React.FC<CustomFaultInjectorProps> = ({
  isOpen,
  onClose,
  currentPids,
  onInject,
}) => {
  const [pids, setPids] = useState<TelemetryPIDs>({ ...currentPids });
  const [customDtc, setCustomDtc] = useState('P0171');
  const [customDtcTitle, setCustomDtcTitle] = useState('Fuel Trim System Too Lean (Bank 1)');
  const [severity, setSeverity] = useState<'caution' | 'critical'>('caution');
  const [isFlashingMil, setIsFlashingMil] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    const codes: DTCFaultCode[] = customDtc.trim()
      ? [
          {
            code: customDtc.trim().toUpperCase(),
            title: customDtcTitle.trim() || 'Custom Diagnostic Trouble Code',
            subsystem: 'Injected Powertrain Diagnostic',
            severity,
            freezeFrameTimestamp: new Date().toLocaleTimeString(),
          },
        ]
      : [];

    onInject(pids, codes, isFlashingMil);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-carbon-800 border border-carbon-600 rounded-xl shadow-2xl max-w-lg w-full p-5 text-xs text-slate-200">
        <div className="flex items-center justify-between border-b border-carbon-700 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">
              OBD-II Telemetry & Fault Injection Console
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-carbon-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Quick Presets */}
          <div>
            <label className="font-mono font-semibold text-slate-400 block mb-1.5">
              Quick Diagnostic Presets:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomDtc('P0171');
                  setCustomDtcTitle('Fuel Trim Too Lean (Bank 1)');
                  setSeverity('caution');
                  setIsFlashingMil(false);
                  setPids((p) => ({ ...p, stftPercent: 24.8, mafGramsSec: 1.7 }));
                }}
                className="p-2 rounded bg-carbon-900 hover:bg-carbon-700 border border-carbon-700 text-left transition"
              >
                <div className="font-bold text-amber-400 font-mono">P0171 Vacuum Leak</div>
                <div className="text-[11px] text-slate-400">STFT +24.8%, low MAF</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomDtc('P0303');
                  setCustomDtcTitle('Cylinder 3 Misfire Detected');
                  setSeverity('critical');
                  setIsFlashingMil(true);
                  setPids((p) => ({ ...p, stftPercent: 18.5, engineLoadPercent: 65, coolantTempC: 98 }));
                }}
                className="p-2 rounded bg-carbon-900 hover:bg-carbon-700 border border-carbon-700 text-left transition"
              >
                <div className="font-bold text-red-400 font-mono">P0303 Flashing Misfire</div>
                <div className="text-[11px] text-slate-400">Catalyst thermal risk</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomDtc('P0562');
                  setCustomDtcTitle('System Voltage Low (<12V)');
                  setSeverity('caution');
                  setIsFlashingMil(false);
                  setPids((p) => ({ ...p, batteryVoltageV: 11.4 }));
                }}
                className="p-2 rounded bg-carbon-900 hover:bg-carbon-700 border border-carbon-700 text-left transition"
              >
                <div className="font-bold text-amber-400 font-mono">P0562 Alternator Sag</div>
                <div className="text-[11px] text-slate-400">11.4V battery collapse</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomDtc('');
                  setCustomDtcTitle('');
                  setSeverity('caution');
                  setIsFlashingMil(false);
                  setPids((p) => ({ ...p, stftPercent: 0.5, batteryVoltageV: 14.1, mafGramsSec: 14.3 }));
                }}
                className="p-2 rounded bg-carbon-900 hover:bg-carbon-700 border border-carbon-700 text-left transition"
              >
                <div className="font-bold text-emerald-400 font-mono">Nominal / Clear</div>
                <div className="text-[11px] text-slate-400">0 DTCs, clean baseline</div>
              </button>
            </div>
          </div>

          {/* DTC Code Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono text-slate-400 block mb-1">DTC Code (SAE J2012):</label>
              <input
                type="text"
                value={customDtc}
                onChange={(e) => setCustomDtc(e.target.value)}
                placeholder="e.g. P0171, P0420"
                className="w-full bg-carbon-900 border border-carbon-600 rounded px-2.5 py-1.5 font-mono text-white"
              />
            </div>
            <div>
              <label className="font-mono text-slate-400 block mb-1">Severity / Urgency:</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full bg-carbon-900 border border-carbon-600 rounded px-2.5 py-1.5 font-mono text-white"
              >
                <option value="caution">Caution (Service Soon)</option>
                <option value="critical">Critical (Pull Over)</option>
              </select>
            </div>
          </div>

          {/* PID Sliders */}
          <div className="space-y-2 border-t border-carbon-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-mono">Short-Term Fuel Trim (STFT):</span>
              <span className="font-mono text-cyan-400 font-bold">{pids.stftPercent.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={-25}
              max={25}
              step={0.5}
              value={pids.stftPercent}
              onChange={(e) => setPids({ ...pids, stftPercent: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-carbon-900 rounded cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="font-mono">Battery / System Voltage:</span>
              <span className="font-mono text-cyan-400 font-bold">{pids.batteryVoltageV.toFixed(1)} V</span>
            </div>
            <input
              type="range"
              min={10}
              max={15}
              step={0.1}
              value={pids.batteryVoltageV}
              onChange={(e) => setPids({ ...pids, batteryVoltageV: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-carbon-900 rounded cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="font-mono">Engine Coolant Temp:</span>
              <span className="font-mono text-cyan-400 font-bold">{pids.coolantTempC.toFixed(0)} °C</span>
            </div>
            <input
              type="range"
              min={50}
              max={120}
              step={1}
              value={pids.coolantTempC}
              onChange={(e) => setPids({ ...pids, coolantTempC: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-carbon-900 rounded cursor-pointer"
            />
          </div>

          {/* Flashing MIL Checkbox */}
          <label className="flex items-center gap-2 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFlashingMil}
              onChange={(e) => setIsFlashingMil(e.target.checked)}
              className="accent-red-500 rounded w-4 h-4 cursor-pointer"
            />
            <span className="text-red-300 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Simulate Flashing MIL (Active Catalyst Damage Warning)
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-carbon-700 pt-3 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-carbon-700 hover:bg-carbon-600 text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Apply Injected Telemetry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
