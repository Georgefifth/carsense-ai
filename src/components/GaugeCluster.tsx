import React from 'react';
import { Gauge, Zap, Thermometer, Flame, Wind, Battery } from 'lucide-react';
import { TelemetryPIDs } from '../types/telemetry';

interface GaugeClusterProps {
  pids: TelemetryPIDs;
  powertrain: 'ICE' | 'Hybrid' | 'EV';
}

export const GaugeCluster: React.FC<GaugeClusterProps> = ({ pids, powertrain }) => {
  const isEv = powertrain === 'EV';

  // Calculate percentage fills for dials
  const rpmPercent = Math.min(100, Math.max(0, (pids.rpm / 7500) * 100));
  const coolantPercent = Math.min(100, Math.max(0, ((pids.coolantTempC - 40) / 80) * 100));
  const batteryPercent = Math.min(100, Math.max(0, ((pids.batteryVoltageV - 10) / 5) * 100));
  const fuelTrimBar = Math.min(100, Math.max(0, ((pids.stftPercent + 25) / 50) * 100));

  const isVoltageLow = pids.batteryVoltageV < 12.0;
  const isTrimSevere = Math.abs(pids.stftPercent) > 15;
  const isTempHigh = pids.coolantTempC > 105;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {/* 1. Tachometer / Motor Speed */}
      <div className="bg-carbon-800 border border-carbon-700 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group hover:border-carbon-600 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            {isEv ? 'MOTOR RPM' : 'ENGINE RPM'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">PID 0x0C</span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1">
            {pids.rpm.toFixed(0)}
            <span className="text-xs font-normal text-slate-400">rpm</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-carbon-900 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              rpmPercent > 80 ? 'bg-red-500' : rpmPercent > 60 ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
            style={{ width: `${rpmPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Vehicle Speed */}
      <div className="bg-carbon-800 border border-carbon-700 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group hover:border-carbon-600 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            VEHICLE SPEED
          </span>
          <span className="text-[10px] text-slate-500 font-mono">PID 0x0D</span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1">
            {pids.speedKmh.toFixed(0)}
            <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
        </div>
        <div className="w-full bg-carbon-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${Math.min(100, (pids.speedKmh / 180) * 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Short Term Fuel Trim (STFT) */}
      <div
        className={`border rounded-lg p-3 flex flex-col justify-between relative overflow-hidden transition ${
          isTrimSevere
            ? 'bg-amber-950/30 border-amber-600/80'
            : 'bg-carbon-800 border-carbon-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            FUEL TRIM (STFT)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">PID 0x06</span>
        </div>
        <div className="my-2">
          <div
            className={`text-2xl font-bold font-mono tracking-tight flex items-baseline gap-1 ${
              isTrimSevere ? 'text-amber-400' : 'text-white'
            }`}
          >
            {pids.stftPercent > 0 ? `+${pids.stftPercent.toFixed(1)}` : pids.stftPercent.toFixed(1)}
            <span className="text-xs font-normal text-slate-400">%</span>
          </div>
        </div>
        {/* Centered zero bar representation */}
        <div className="w-full bg-carbon-900 rounded-full h-1.5 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 ${
              isTrimSevere ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${fuelTrimBar}%` }}
          />
        </div>
      </div>

      {/* 4. Mass Air Flow (MAF) */}
      <div className="bg-carbon-800 border border-carbon-700 rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group hover:border-carbon-600 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            MASS AIR FLOW
          </span>
          <span className="text-[10px] text-slate-500 font-mono">PID 0x10</span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1">
            {pids.mafGramsSec.toFixed(1)}
            <span className="text-xs font-normal text-slate-400">g/s</span>
          </div>
        </div>
        <div className="w-full bg-carbon-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${Math.min(100, (pids.mafGramsSec / 50) * 100)}%` }}
          />
        </div>
      </div>

      {/* 5. Coolant Temperature */}
      <div
        className={`border rounded-lg p-3 flex flex-col justify-between relative overflow-hidden transition ${
          isTempHigh
            ? 'bg-red-950/30 border-red-600/80'
            : 'bg-carbon-800 border-carbon-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            COOLANT TEMP
          </span>
          <span className="text-[10px] text-slate-500 font-mono">PID 0x05</span>
        </div>
        <div className="my-2">
          <div
            className={`text-2xl font-bold font-mono tracking-tight flex items-baseline gap-1 ${
              isTempHigh ? 'text-red-400' : 'text-white'
            }`}
          >
            {pids.coolantTempC.toFixed(0)}
            <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
        </div>
        <div className="w-full bg-carbon-900 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isTempHigh ? 'bg-red-500' : 'bg-cyan-400'
            }`}
            style={{ width: `${coolantPercent}%` }}
          />
        </div>
      </div>

      {/* 6. System / Battery Voltage */}
      <div
        className={`border rounded-lg p-3 flex flex-col justify-between relative overflow-hidden transition ${
          isVoltageLow
            ? 'bg-red-950/30 border-red-600/80'
            : 'bg-carbon-800 border-carbon-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-cyan-400" />
            {isEv ? 'TRACTION VOLTAGE' : 'SYSTEM VOLTAGE'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">PID 0x42</span>
        </div>
        <div className="my-2">
          <div
            className={`text-2xl font-bold font-mono tracking-tight flex items-baseline gap-1 ${
              isVoltageLow ? 'text-red-400' : 'text-white'
            }`}
          >
            {pids.batteryVoltageV.toFixed(1)}
            <span className="text-xs font-normal text-slate-400">V</span>
          </div>
        </div>
        <div className="w-full bg-carbon-900 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isVoltageLow ? 'bg-red-500' : 'bg-cyan-400'
            }`}
            style={{ width: `${batteryPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
