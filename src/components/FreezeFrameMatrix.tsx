import React, { useState } from 'react';
import { Clock, Crosshair, Pin, Info } from 'lucide-react';
import { TelemetryHistoryPoint, DTCFaultCode } from '../types/telemetry';

interface FreezeFrameMatrixProps {
  timeline: TelemetryHistoryPoint[];
  dtcCodes: DTCFaultCode[];
}

export const FreezeFrameMatrix: React.FC<FreezeFrameMatrixProps> = ({ timeline, dtcCodes }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(
    Math.max(0, timeline.findIndex((p) => p.isFreezeFrameTrigger) !== -1
      ? timeline.findIndex((p) => p.isFreezeFrameTrigger)
      : timeline.length - 1)
  );

  const selectedPoint = timeline[selectedIndex] || timeline[timeline.length - 1];

  // Helper to build SVG polyline points
  const buildSvgPath = (
    accessor: (p: TelemetryHistoryPoint) => number,
    minVal: number,
    maxVal: number,
    width = 300,
    height = 50
  ) => {
    if (timeline.length < 2) return '';
    const range = maxVal - minVal || 1;
    return timeline
      .map((p, idx) => {
        const x = (idx / (timeline.length - 1)) * width;
        const normalized = (accessor(p) - minVal) / range;
        const y = height - normalized * (height - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="bg-carbon-800 border border-carbon-700 rounded-lg p-4 flex flex-col gap-3">
      {/* Title & Freeze-Frame Trigger Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-carbon-700 pb-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-white tracking-tight">
            Diagnostic Freeze-Frame Anomaly Matrix
          </h3>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-carbon-700 text-slate-300 font-mono">
            SAE Freeze-Frame Sync
          </span>
        </div>

        {/* Time Pin Badge */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Scrubber:</span>
          <span className="text-cyan-400 font-bold">
            {selectedPoint.timeOffsetSeconds === 0
              ? 'T-0.0s (Current)'
              : `T${selectedPoint.timeOffsetSeconds > 0 ? '+' : ''}${selectedPoint.timeOffsetSeconds}.0s`}
          </span>
          {selectedPoint.isFreezeFrameTrigger && (
            <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1 text-[10px]">
              <Pin className="w-2.5 h-2.5 text-amber-400" /> MIL TRIGGER POINT
            </span>
          )}
        </div>
      </div>

      {/* Scrub Slider Bar */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-slate-400 shrink-0">T-10s</span>
        <input
          type="range"
          min={0}
          max={timeline.length - 1}
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(parseInt(e.target.value, 10))}
          className="w-full accent-cyan-400 h-1.5 bg-carbon-900 rounded-lg cursor-pointer"
        />
        <span className="text-[11px] font-mono text-slate-400 shrink-0">T-0s</span>
      </div>

      {/* Synchronized Sparkline Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Channel 1: Short Term Fuel Trim % */}
        <div className="bg-carbon-900/80 border border-carbon-700/60 rounded p-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">Fuel Trim (STFT %)</span>
            <span className={`font-bold ${Math.abs(selectedPoint.stftPercent) > 15 ? 'text-amber-400' : 'text-slate-200'}`}>
              {selectedPoint.stftPercent > 0 ? `+${selectedPoint.stftPercent.toFixed(1)}` : selectedPoint.stftPercent.toFixed(1)}%
            </span>
          </div>
          <svg viewBox="0 0 300 50" className="w-full h-12 overflow-visible">
            {/* Zero midline */}
            <line x1="0" y1="25" x2="300" y2="25" stroke="#1e293b" strokeDasharray="3 3" />
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              points={buildSvgPath((p) => p.stftPercent, -25, 25)}
            />
            {/* Current Scrub Marker */}
            <circle
              cx={(selectedIndex / (timeline.length - 1)) * 300}
              cy={50 - ((selectedPoint.stftPercent + 25) / 50) * 42 - 4}
              r="4"
              fill="#06b6d4"
            />
          </svg>
        </div>

        {/* Channel 2: Engine RPM */}
        <div className="bg-carbon-900/80 border border-carbon-700/60 rounded p-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">Engine Speed (RPM)</span>
            <span className="font-bold text-slate-200">{selectedPoint.rpm.toFixed(0)} rpm</span>
          </div>
          <svg viewBox="0 0 300 50" className="w-full h-12 overflow-visible">
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              points={buildSvgPath((p) => p.rpm, 500, 3000)}
            />
            <circle
              cx={(selectedIndex / (timeline.length - 1)) * 300}
              cy={50 - ((selectedPoint.rpm - 500) / 2500) * 42 - 4}
              r="4"
              fill="#06b6d4"
            />
          </svg>
        </div>

        {/* Channel 3: Battery Line Voltage */}
        <div className="bg-carbon-900/80 border border-carbon-700/60 rounded p-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">Line Voltage (V)</span>
            <span className={`font-bold ${selectedPoint.batteryVoltageV < 12.0 ? 'text-red-400' : 'text-slate-200'}`}>
              {selectedPoint.batteryVoltageV.toFixed(1)} V
            </span>
          </div>
          <svg viewBox="0 0 300 50" className="w-full h-12 overflow-visible">
            <line x1="0" y1="20" x2="300" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
            <polyline
              fill="none"
              stroke={selectedPoint.batteryVoltageV < 12.0 ? '#ef4444' : '#10b981'}
              strokeWidth="2"
              points={buildSvgPath((p) => p.batteryVoltageV, 10, 15)}
            />
            <circle
              cx={(selectedIndex / (timeline.length - 1)) * 300}
              cy={50 - ((selectedPoint.batteryVoltageV - 10) / 5) * 42 - 4}
              r="4"
              fill="#06b6d4"
            />
          </svg>
        </div>

        {/* Channel 4: Engine Load % */}
        <div className="bg-carbon-900/80 border border-carbon-700/60 rounded p-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">Calculated Load %</span>
            <span className="font-bold text-slate-200">{selectedPoint.engineLoadPercent.toFixed(0)}%</span>
          </div>
          <svg viewBox="0 0 300 50" className="w-full h-12 overflow-visible">
            <polyline
              fill="none"
              stroke="#818cf8"
              strokeWidth="2"
              points={buildSvgPath((p) => p.engineLoadPercent, 10, 80)}
            />
            <circle
              cx={(selectedIndex / (timeline.length - 1)) * 300}
              cy={50 - ((selectedPoint.engineLoadPercent - 10) / 70) * 42 - 4}
              r="4"
              fill="#06b6d4"
            />
          </svg>
        </div>
      </div>

      {/* Freeze Frame Context Box */}
      <div className="bg-carbon-900 border border-carbon-700/80 rounded p-2.5 text-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-300">
            {dtcCodes.length > 0
              ? `Freeze-Frame DTC stored: ${dtcCodes.map((c) => c.code).join(', ')} logged at T-4.0s.`
              : 'Zero freeze-frame DTC records stored. Telemetry signals oscillating within nominal baseline.'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          CAN Frame ID: <span className="text-cyan-300">0x7E8 (ECM Reply)</span>
        </div>
      </div>
    </div>
  );
};
