import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { UrgencyBanner } from './components/UrgencyBanner';
import { GaugeCluster } from './components/GaugeCluster';
import { FreezeFrameMatrix } from './components/FreezeFrameMatrix';
import { DiagnosticTriageCard } from './components/DiagnosticTriageCard';
import { MechanicAssistant } from './components/MechanicAssistant';
import { CustomFaultInjector } from './components/CustomFaultInjector';
import { DriveCycleModal } from './components/DriveCycleModal';
import { RawTelemetryDrawer } from './components/RawTelemetryDrawer';
import { VEHICLE_SCENARIOS, INITIAL_READINESS_MONITORS } from './data/scenarios';
import { VehicleScenario, TelemetryPIDs, DTCFaultCode, MechanicChatMessage, ReadinessMonitor } from './types/telemetry';
import { generateDynamicTriage, answerMechanicQuestion } from './services/diagnosticEngine';

export const App: React.FC = () => {
  const [scenarios] = useState<VehicleScenario[]>(VEHICLE_SCENARIOS);
  const [activeScenario, setActiveScenario] = useState<VehicleScenario>(() => {
    try {
      const savedId = localStorage.getItem('carsense_scenario_id');
      if (savedId) {
        const found = VEHICLE_SCENARIOS.find((s) => s.id === savedId);
        if (found) return found;
      }
    } catch {
      // ignore storage errors
    }
    return VEHICLE_SCENARIOS[1];
  });
  const [currentPids, setCurrentPids] = useState<TelemetryPIDs>(
    () => activeScenario.historyTimeline[activeScenario.historyTimeline.length - 1]
  );
  const [activeCodes, setActiveCodes] = useState<DTCFaultCode[]>(() => activeScenario.dtcCodes);
  const [activeMil, setActiveMil] = useState<boolean>(() => activeScenario.activeMil);
  const [isMilFlashing, setIsMilFlashing] = useState<boolean>(() => !!activeScenario.milFlashing);
  const [triage, setTriage] = useState(() => activeScenario.triage);
  const [isTriaging, setIsTriaging] = useState(false);

  // Modals & Panels
  const [isInjectorOpen, setIsInjectorOpen] = useState(false);
  const [isReadinessOpen, setIsReadinessOpen] = useState(false);
  const [readinessMonitors, setReadinessMonitors] = useState<ReadinessMonitor[]>(INITIAL_READINESS_MONITORS);
  const [isSimulatingCycle, setIsSimulatingCycle] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<MechanicChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: 'Just now',
      text: `👋 Hello! I am your AI Master Mechanic Copilot. I am actively monitoring live OBD-II CAN telematics for your ${VEHICLE_SCENARIOS[1].vehicleModel}.\n\nCurrent status: Trouble code P0171 detected. Short-Term Fuel Trim is elevated (+24.8% at idle). Ask me anything, or run diagnostic triage above!`,
    },
  ]);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Handle switching scenario
  const handleSelectScenario = (scenario: VehicleScenario) => {
    setActiveScenario(scenario);
    try {
      localStorage.setItem('carsense_scenario_id', scenario.id);
    } catch {
      // ignore storage errors
    }
    const latestPids = scenario.historyTimeline[scenario.historyTimeline.length - 1];
    setCurrentPids(latestPids);
    setActiveCodes(scenario.dtcCodes);
    setActiveMil(scenario.activeMil);
    setIsMilFlashing(!!scenario.milFlashing);
    setTriage(scenario.triage);

    setChatMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        text: `Switched vehicle telemetry profile to: "${scenario.name}".\n\n${
          scenario.activeMil
            ? `⚠️ Active DTCs stored: ${scenario.dtcCodes.map((c) => c.code).join(', ')}. ${scenario.description}`
            : '✅ All powertrain parameters nominal. Zero diagnostic trouble codes stored.'
        }`,
      },
    ]);
  };

  // Live telemetry subtle ticker to make dials feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPids((prev) => {
        const ranges = activeScenario.liveVariationRange;
        const jitter = (val: number, spread: number) =>
          val + (Math.random() - 0.5) * spread;

        return {
          ...prev,
          rpm: ranges.rpm ? Math.min(ranges.rpm[1], Math.max(ranges.rpm[0], jitter(prev.rpm, 12))) : prev.rpm,
          stftPercent: ranges.stftPercent
            ? Math.min(ranges.stftPercent[1], Math.max(ranges.stftPercent[0], jitter(prev.stftPercent, 0.4)))
            : prev.stftPercent,
          batteryVoltageV: ranges.batteryVoltageV
            ? Math.min(ranges.batteryVoltageV[1], Math.max(ranges.batteryVoltageV[0], jitter(prev.batteryVoltageV, 0.05)))
            : prev.batteryVoltageV,
          coolantTempC: ranges.coolantTempC
            ? Math.min(ranges.coolantTempC[1], Math.max(ranges.coolantTempC[0], jitter(prev.coolantTempC, 0.2)))
            : prev.coolantTempC,
          o2VoltageV: ranges.o2VoltageV
            ? Math.min(ranges.o2VoltageV[1], Math.max(ranges.o2VoltageV[0], jitter(prev.o2VoltageV, 0.04)))
            : prev.o2VoltageV,
        };
      });
    }, 800);

    return () => clearInterval(interval);
  }, [activeScenario]);

  // Run AI Diagnostic Triage
  const handleRunTriage = async () => {
    setIsTriaging(true);
    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dtcCodes: activeCodes,
          pids: currentPids,
          vehicleModel: activeScenario.vehicleModel,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.triage) {
          setTriage(data.triage);
          setIsTriaging(false);
          showToast('AI Diagnostic Triage Complete — Freeze-frame correlated');
          setChatMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              sender: 'assistant',
              timestamp: new Date().toLocaleTimeString(),
              text: `🔍 Triage Update: Evaluated live freeze-frame data.\n• Diagnosis: ${data.triage.rootCauseTitle}\n• Urgency: ${data.triage.urgencyTitle}\n• Recommendation: ${data.triage.driveRecommendation}`,
            },
          ]);
          return;
        }
      }
    } catch {
      // Fallback to local engine if offline
    }

    const result = generateDynamicTriage(activeCodes, currentPids, activeScenario.vehicleModel);
    setTriage(result);
    setIsTriaging(false);
    showToast('AI Diagnostic Triage Complete — Freeze-frame correlated');

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        text: `🔍 Triage Update: Evaluated live freeze-frame data.\n• Diagnosis: ${result.rootCauseTitle}\n• Urgency: ${result.urgencyTitle}\n• Recommendation: ${result.driveRecommendation}`,
      },
    ]);
  };

  // Chat message submission
  const handleSendMessage = async (text: string) => {
    const userMsg: MechanicChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      text,
    };

    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/mechanic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          triage,
          pids: currentPids,
          vehicleModel: activeScenario.vehicleModel,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          const botMsg: MechanicChatMessage = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            timestamp: data.timestamp || new Date().toLocaleTimeString(),
            text: data.reply,
          };
          setChatMessages((prev) => [...prev, botMsg]);
          return;
        }
      }
    } catch {
      // Fallback to local engine if offline
    }

    const replyText = answerMechanicQuestion(text, triage, currentPids, activeScenario.vehicleModel);
    const botMsg: MechanicChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString(),
      text: replyText,
    };
    setChatMessages((prev) => [...prev, botMsg]);
  };

  // Simulate repair & clear codes
  const handleSimulateRepair = () => {
    setActiveCodes([]);
    setActiveMil(false);
    setIsMilFlashing(false);

    // Normalize PIDs
    setCurrentPids((p) => ({
      ...p,
      stftPercent: 0.2,
      ltftPercent: 0.8,
      batteryVoltageV: 14.1,
      mafGramsSec: 14.3,
      coolantTempC: 90,
    }));

    const cleanTriage = generateDynamicTriage([], currentPids, activeScenario.vehicleModel);
    setTriage(cleanTriage);

    // After clearing codes, emissions monitors temporarily enter "Incomplete"
    setReadinessMonitors((monitors) =>
      monitors.map((m) =>
        m.name === 'Catalyst Efficiency' || m.name === 'Evaporative Emission (EVAP)'
          ? { ...m, status: 'Incomplete' as const }
          : m
      )
    );

    showToast('Codes Cleared: ECU reset & fuel trim adaptives normalized');

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        text: '🔧 Fault codes cleared successfully! Engine control unit is back in baseline fuel trim equilibrium. Note: Catalyst and EVAP readiness monitors have reset to "Incomplete" pending your next drive cycle.',
      },
    ]);
  };

  // Custom fault injection
  const handleInjectFault = (
    customPids: TelemetryPIDs,
    customCodes: DTCFaultCode[],
    isFlashing: boolean
  ) => {
    setCurrentPids(customPids);
    setActiveCodes(customCodes);
    setActiveMil(customCodes.length > 0);
    setIsMilFlashing(isFlashing);

    const injectedTriage = generateDynamicTriage(customCodes, customPids, activeScenario.vehicleModel);
    setTriage(injectedTriage);
    showToast('Injected custom telemetry profile into live CAN bus');

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        text: `⚡ Fault Injection Received: Ingested ${
          customCodes.length > 0 ? customCodes.map((c) => c.code).join(', ') : 'nominal parameters'
        }.\n• Primary Diagnosis: ${injectedTriage.rootCauseTitle}`,
      },
    ]);
  };

  // Simulate Drive Cycle Completion
  const handleSimulateDriveCycle = () => {
    setIsSimulatingCycle(true);
    setTimeout(() => {
      setReadinessMonitors((monitors) => monitors.map((m) => ({ ...m, status: 'Ready' as const })));
      setIsSimulatingCycle(false);
      showToast('Drive Cycle Complete: All 6 emissions monitors READY');
    }, 600);
  };

  const handleResetReadiness = () => {
    setReadinessMonitors((monitors) =>
      monitors.map((m, idx) => (idx > 2 ? { ...m, status: 'Incomplete' as const } : m))
    );
    showToast('Readiness monitors reset to Incomplete (simulating battery disconnect)');
  };

  // Export diagnostic report
  const handleExportReport = () => {
    const reportContent = `# CarSense AI — Connected Vehicle Diagnostic Report
Generated: ${new Date().toLocaleString()}
Vehicle: ${activeScenario.vehicleModel}
Powertrain: ${activeScenario.powertrain}

---
## Executive Summary
- Diagnostic Status: ${triage.urgencyTitle}
- Drive Verdict: ${triage.driveRecommendation}
- Active MIL: ${activeMil ? (isMilFlashing ? 'FLASHING (Critical)' : 'ON') : 'OFF'}
- Stored DTC Codes: ${activeCodes.length > 0 ? activeCodes.map((c) => `${c.code} (${c.title})`).join(', ') : 'None'}

---
## Root-Cause Analysis
${triage.plainEnglishExplanation}

---
## Correlated Telemetry Freeze-Frame
${triage.correlatedPids.map((p) => `- ${p.pidName}: ${p.reading} (Baseline: ${p.nominalRange}) — ${p.anomalyNote}`).join('\n')}

---
## Estimated Repairs
${triage.affectedComponents.map((c) => `- ${c.name} (${c.probability}% confidence)\n  DIY Parts: ~$${c.partCostEstimateUsd} | Mechanic: ~$${c.partCostEstimateUsd + c.laborCostEstimateUsd} | Difficulty: ${c.diyDifficultyWrenches}/5 wrenches\n  Guide: ${c.replacementGuide}`).join('\n\n')}
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CarSense-Diagnostic-${activeScenario.id}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Diagnostic report exported successfully!');
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-carbon-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & Status */}
      <Header
        scenarios={scenarios}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        onRunTriage={handleRunTriage}
        isTriaging={isTriaging}
        onOpenInjector={() => setIsInjectorOpen(true)}
        onOpenReadiness={() => setIsReadinessOpen(true)}
      />

      {/* Feedback Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-carbon-800 border border-cyan-500/80 text-cyan-300 px-4 py-2.5 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* 1. Unambiguous Safety Urgency Banner */}
        <UrgencyBanner
          triage={triage}
          dtcCodes={activeCodes}
          activeMil={activeMil}
          milFlashing={isMilFlashing}
        />

        {/* 2. Automotive Precision Gauge Cluster */}
        <GaugeCluster pids={currentPids} powertrain={activeScenario.powertrain} />

        {/* 3. Signature Element: Diagnostic Freeze-Frame Anomaly Matrix */}
        <FreezeFrameMatrix
          timeline={activeScenario.historyTimeline}
          dtcCodes={activeCodes}
        />

        {/* 4. Two-Column Diagnostic & Mechanic Consultation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
          {/* Left Column: Root Cause Diagnostic Card */}
          <div className="lg:col-span-7">
            <DiagnosticTriageCard
              triage={triage}
              onSimulateRepair={handleSimulateRepair}
              onFocusChat={() => chatInputRef.current?.focus()}
              onExportReport={handleExportReport}
            />
          </div>

          {/* Right Column: AI Mechanic Chat Assistant */}
          <div className="lg:col-span-5">
            <MechanicAssistant
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              inputRef={chatInputRef}
            />
          </div>
        </div>

        {/* 5. Raw Telemetry & CAN Sniffer Drawer */}
        <RawTelemetryDrawer pids={currentPids} dtcCodes={activeCodes} />
      </main>

      {/* Modals */}
      <CustomFaultInjector
        isOpen={isInjectorOpen}
        onClose={() => setIsInjectorOpen(false)}
        currentPids={currentPids}
        onInject={handleInjectFault}
      />

      <DriveCycleModal
        isOpen={isReadinessOpen}
        onClose={() => setIsReadinessOpen(false)}
        monitors={readinessMonitors}
        onResetReadiness={handleResetReadiness}
        isSimulatingCycle={isSimulatingCycle}
        onSimulateDriveCycle={handleSimulateDriveCycle}
      />

      {/* Footer */}
      <footer className="border-t border-carbon-800 bg-carbon-950 py-3 px-4 text-center text-xs text-slate-500 font-mono">
        <p>
          CarSense AI — Connected Vehicle Telematics & Predictive Maintenance Copilot • Remote Control AI Hackathon 2026
        </p>
      </footer>
    </div>
  );
};
