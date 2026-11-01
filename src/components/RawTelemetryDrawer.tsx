import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { TelemetryPIDs, DTCFaultCode } from '../types/telemetry';

interface RawTelemetryDrawerProps {
  pids: TelemetryPIDs;
  dtcCodes: DTCFaultCode[];
}

export const RawTelemetryDrawer: React.FC<RawTelemetryDrawerProps> = ({ pids, dtcCodes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate realistic simulated CAN frames from current PIDs
  const rpmHex = Math.round(pids.rpm * 4).toString(16).padStart(4, '0').toUpperCase();
  const speedHex = Math.round(pids.speedKmh).toString(16).padStart(2, '0').toUpperCase();
  const tempHex = Math.round(pids.coolantTempC + 40).toString(16).padStart(2, '0').toUpperCase();
  const stftHex = Math.round((pids.stftPercent + 100) * 1.28).toString(16).padStart(2, '0').toUpperCase();

  const rawCanLog = `[CAN-FD 500kbps / 2Mbps] Logging Active
0x7DF (Broadcast)  02 01 0C 00 00 00 00 00  -> Request PID 0x0C (Engine RPM)
0x7E8 (ECM Reply)  04 41 0C ${rpmHex.slice(0, 2)} ${rpmHex.slice(2, 4)} 00 00 00  -> RPM: ${pids.rpm.toFixed(0)}
0x7DF (Broadcast)  02 01 0D 00 00 00 00 00  -> Request PID 0x0D (Vehicle Speed)
0x7E8 (ECM Reply)  03 41 0D ${speedHex} 00 00 00 00     -> Speed: ${pids.speedKmh.toFixed(0)} km/h
0x7DF (Broadcast)  02 01 05 00 00 00 00 00  -> Request PID 0x05 (Coolant Temp)
0x7E8 (ECM Reply)  03 41 05 ${tempHex} 00 00 00 00     -> Temp: ${pids.coolantTempC.toFixed(0)} °C
0x7DF (Broadcast)  02 01 06 00 00 00 00 00  -> Request PID 0x06 (Short-Term Fuel Trim)
0x7E8 (ECM Reply)  03 41 06 ${stftHex} 00 00 00 00     -> STFT: ${pids.stftPercent.toFixed(1)}%
${dtcCodes.length > 0 ? `0x7DF (Broadcast)  01 03 00 00 00 00 00 00  -> Mode 03 Request Stored DTCs\n0x7E8 (ECM Reply)  04 43 01 ${dtcCodes[0].code.slice(1, 3)} ${dtcCodes[0].code.slice(3, 5)} 00 00  -> Stored DTC: ${dtcCodes[0].code}` : '0x7E8 (ECM Reply)  02 43 00 00 00 00 00 00  -> Zero Confirmed Trouble Codes'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCanLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-carbon-800 border border-carbon-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between text-xs font-mono text-slate-300 hover:bg-carbon-700/60 transition"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white">Advanced Diagnostic Telemetry: Raw CAN / PID Sniffer</span>
          <span className="text-[10px] text-slate-400">SAE J1979 Mode $01 & Mode $03</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="border-t border-carbon-700 p-3 bg-carbon-950 font-mono text-[11px] text-slate-300 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-carbon-800">
            <span className="text-cyan-400 font-semibold">ISO 15765-4 CAN Bus 11-bit Frame Trace</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-carbon-800 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Trace'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre leading-relaxed text-slate-300 max-h-48">
            {rawCanLog}
          </pre>
        </div>
      )}
    </div>
  );
};
