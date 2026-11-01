export type FaultSeverity = 'nominal' | 'caution' | 'critical';

export interface TelemetryPIDs {
  rpm: number;                  // Engine RPM (0 - 8000)
  speedKmh: number;             // Vehicle Speed (0 - 240)
  coolantTempC: number;         // Engine Coolant Temp (°C, nominal: 85 - 105)
  intakeAirTempC: number;       // Intake Air Temp (°C)
  stftPercent: number;          // Short Term Fuel Trim % (-25% to +25%, nominal: ±5%)
  ltftPercent: number;          // Long Term Fuel Trim % (-25% to +25%, nominal: ±5%)
  mafGramsSec: number;          // Mass Air Flow (g/s, nominal idle: 2.0 - 4.5)
  throttlePosPercent: number;   // Throttle Position % (0 - 100)
  o2VoltageV: number;           // O2 Sensor Bank 1 Sensor 1 (0.1V - 0.9V)
  batteryVoltageV: number;      // 12V Battery / Alternator Voltage (nominal: 13.8 - 14.5)
  engineLoadPercent: number;    // Calculated Engine Load % (nominal idle: 15 - 30%)
  fuelPressureKpa: number;      // Fuel Rail Pressure (kPa)
}

export interface DTCFaultCode {
  code: string;                 // e.g. "P0171", "P0303", "P0562"
  title: string;                // e.g. "System Too Lean (Bank 1)"
  subsystem: string;            // e.g. "Fuel & Air Metering", "Ignition System"
  severity: FaultSeverity;
  freezeFrameTimestamp: string;
}

export interface DiagnosticTriage {
  id: string;
  timestamp: string;
  urgency: FaultSeverity;
  urgencyTitle: string;
  driveRecommendation: string;
  rootCauseTitle: string;
  plainEnglishExplanation: string;
  correlatedPids: Array<{
    pidName: string;
    reading: string;
    nominalRange: string;
    anomalyNote: string;
  }>;
  affectedComponents: Array<{
    name: string;
    probability: number;
    partCostEstimateUsd: number;
    laborCostEstimateUsd: number;
    diyDifficultyWrenches: number; // 1 to 5
    replacementGuide: string;
  }>;
  preventativeAdvice: string[];
}

export interface TelemetryHistoryPoint extends TelemetryPIDs {
  timeOffsetSeconds: number;
  isFreezeFrameTrigger?: boolean;
}

export interface VehicleScenario {
  id: string;
  name: string;
  vehicleModel: string;
  powertrain: 'ICE' | 'Hybrid' | 'EV';
  description: string;
  activeMil: boolean;
  milFlashing?: boolean;
  dtcCodes: DTCFaultCode[];
  triage: DiagnosticTriage;
  historyTimeline: TelemetryHistoryPoint[];
  liveVariationRange: Partial<Record<keyof TelemetryPIDs, [number, number]>>;
}

export interface MechanicChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  suggestedAction?: string;
  telemetryEvidenceCitations?: string[];
}

export interface ReadinessMonitor {
  name: string;
  status: 'Ready' | 'Incomplete' | 'Disabled';
  description: string;
}
