import { DiagnosticTriage, TelemetryPIDs, DTCFaultCode } from '../types/telemetry';

export function generateDynamicTriage(
  dtcCodes: DTCFaultCode[],
  pids: TelemetryPIDs,
  vehicleModel: string
): DiagnosticTriage {
  if (dtcCodes.length === 0) {
    return {
      id: `tri-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      urgency: 'nominal',
      urgencyTitle: 'All Powertrain Systems Nominal',
      driveRecommendation: 'Vehicle is operating within normal SAE engineering envelopes. No driving restrictions.',
      rootCauseTitle: 'No Faults Detected in OBD-II Freeze-Frame Memory',
      plainEnglishExplanation: `Engine control module on ${vehicleModel} reports zero pending or confirmed diagnostic trouble codes. All sensor feedback loops are in stoichiometric equilibrium.`,
      correlatedPids: [
        { pidName: 'Short-Term Fuel Trim', reading: `${pids.stftPercent.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'Nominal' },
        { pidName: 'Battery Voltage', reading: `${pids.batteryVoltageV.toFixed(1)} V`, nominalRange: '13.8 - 14.5 V', anomalyNote: 'Nominal charging' },
        { pidName: 'Coolant Temperature', reading: `${pids.coolantTempC.toFixed(0)} °C`, nominalRange: '85 - 102 °C', anomalyNote: 'Operating temp' },
      ],
      affectedComponents: [],
      preventativeAdvice: ['Continue standard factory maintenance intervals.'],
    };
  }

  // Check critical codes first
  const hasMisfire = dtcCodes.some((c) => c.code.startsWith('P030'));
  const hasVoltageDrop = pids.batteryVoltageV < 12.0 || dtcCodes.some((c) => c.code === 'P0562');
  const hasLeanTrim = pids.stftPercent > 20 || dtcCodes.some((c) => c.code === 'P0171');
  const hasEvFault = dtcCodes.some((c) => c.code.startsWith('P0A'));

  if (hasEvFault) {
    return {
      id: `tri-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      urgency: 'caution',
      urgencyTitle: 'High-Voltage Battery Degradation Detected (Module Delta > 250mV)',
      driveRecommendation: 'Safe for moderate local driving. Avoid DC fast charging (Supercharging). Schedule battery pack diagnostic test.',
      rootCauseTitle: 'EV Traction Battery Pack Brick Voltage Imbalance',
      plainEnglishExplanation: `High-voltage battery module delta has exceeded 250mV under acceleration. Pack voltage rests at ${pids.batteryVoltageV.toFixed(1)}V with cell brick deviation restricting power.`,
      correlatedPids: [
        { pidName: 'Pack Voltage', reading: `${pids.batteryVoltageV.toFixed(1)} V`, nominalRange: '350 - 400 V', anomalyNote: 'Module resistance elevation' },
        { pidName: 'Motor RPM', reading: `${pids.rpm.toFixed(0)} RPM`, nominalRange: '0 - 12000 RPM', anomalyNote: 'Inverter output throttled' },
      ],
      affectedComponents: [
        {
          name: 'High Voltage Battery Module 4 / Sense Wire',
          probability: 80,
          partCostEstimateUsd: 1200,
          laborCostEstimateUsd: 800,
          diyDifficultyWrenches: 5,
          replacementGuide: 'Requires high-voltage PPE certification and pack drop lift. Check EV battery warranty.',
        },
      ],
      preventativeAdvice: ['Slow charge overnight on Level 2 AC to allow BMS cell equalization resistors to balance cells.'],
    };
  }

  if (hasMisfire) {
    return {
      id: `tri-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      urgency: 'critical',
      urgencyTitle: 'CRITICAL: Catalyst Damage Risk — Pull Over Immediately',
      driveRecommendation: 'Stop vehicle as soon as safely possible. Active cylinder misfire dumps unburnt fuel into catalytic converter, causing thermal melt within minutes.',
      rootCauseTitle: 'Combustion Misfire / Ignition Coil Breakdown',
      plainEnglishExplanation: `Cylinder misfire detected while engine load is at ${pids.engineLoadPercent.toFixed(0)}%. Fuel trim compensation is swinging wildly (${pids.stftPercent.toFixed(1)}%) as the O2 sensor sees raw unburnt oxygen in the exhaust stroke.`,
      correlatedPids: [
        { pidName: 'Calculated Engine Load', reading: `${pids.engineLoadPercent.toFixed(0)}%`, nominalRange: '< 40% at cruise', anomalyNote: 'Power loss on affected cylinder' },
        { pidName: 'Fuel Trim Reaction', reading: `${pids.stftPercent.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'ECU overcompensating for unburnt oxygen' },
        { pidName: 'Coolant Temperature', reading: `${pids.coolantTempC.toFixed(0)} °C`, nominalRange: '88 - 95 °C', anomalyNote: 'Thermal asymmetry across block' },
      ],
      affectedComponents: [
        {
          name: 'Ignition Coil Pack',
          probability: 70,
          partCostEstimateUsd: 65,
          laborCostEstimateUsd: 75,
          diyDifficultyWrenches: 2,
          replacementGuide: 'Inspect ignition coil boot for burn marks or white carbon arc tracking. Replace with OEM specification coil.',
        },
        {
          name: 'Iridium Spark Plug',
          probability: 22,
          partCostEstimateUsd: 14,
          laborCostEstimateUsd: 80,
          diyDifficultyWrenches: 2,
          replacementGuide: 'Inspect electrode gap. Wet or fouled plug confirms combustion failure.',
        },
      ],
      preventativeAdvice: ['Do not drive vehicle under load. Towing to service facility recommended.'],
    };
  }

  if (hasVoltageDrop) {
    return {
      id: `tri-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      urgency: 'caution',
      urgencyTitle: 'Electrical System Sagging — 15 Mins Battery Reserve',
      driveRecommendation: 'Shut off heater, headlights, radio, and phone chargers immediately. Drive directly to nearest battery/parts shop before voltage collapses.',
      rootCauseTitle: 'Alternator Charging Circuit Undervoltage (<12.0V)',
      plainEnglishExplanation: `Operating voltage has fallen to ${pids.batteryVoltageV.toFixed(1)}V (nominal is 13.8V - 14.5V). The vehicle is running entirely on depleted battery reserve. The engine computer and electric power steering will shut down once voltage falls below 10.5V.`,
      correlatedPids: [
        { pidName: 'Charging Line Voltage', reading: `${pids.batteryVoltageV.toFixed(1)} V`, nominalRange: '13.8 - 14.5 V', anomalyNote: '2.4V below minimum alternator output' },
        { pidName: 'Idle Throttle Position', reading: `${pids.throttlePosPercent.toFixed(0)}%`, nominalRange: '10 - 14%', anomalyNote: 'ECU raising idle to coax alternator charging' },
      ],
      affectedComponents: [
        {
          name: 'Alternator & Voltage Regulator',
          probability: 84,
          partCostEstimateUsd: 190,
          laborCostEstimateUsd: 130,
          diyDifficultyWrenches: 2,
          replacementGuide: 'Check serpentine belt tension first; bench-test diode output.',
        },
        {
          name: 'Serpentine Accessory Belt',
          probability: 12,
          partCostEstimateUsd: 28,
          laborCostEstimateUsd: 55,
          diyDifficultyWrenches: 2,
          replacementGuide: 'Check belt ribs for glazing, cracks, or tensioner slippage.',
        },
      ],
      preventativeAdvice: ['Have battery load tested after replacing alternator.'],
    };
  }

  if (hasLeanTrim) {
    return {
      id: `tri-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      urgency: 'caution',
      urgencyTitle: 'Service Soon — Safe to Drive Home (<50 miles)',
      driveRecommendation: 'Safe for gentle driving home or to repair shop. Avoid heavy throttle or steep hill climbs.',
      rootCauseTitle: 'Unmetered Intake Air Leak (System Too Lean)',
      plainEnglishExplanation: `Engine fuel trim is commanding +${pids.stftPercent.toFixed(1)}% extra fuel compensation at idle while MAF reads ${pids.mafGramsSec.toFixed(1)} g/s. Excess air is leaking into the intake manifold behind the airflow meter.`,
      correlatedPids: [
        { pidName: 'Short-Term Fuel Trim', reading: `+${pids.stftPercent.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'Exceeds lean compensation threshold' },
        { pidName: 'Mass Air Flow (MAF)', reading: `${pids.mafGramsSec.toFixed(1)} g/s`, nominalRange: '2.2 - 3.5 g/s', anomalyNote: 'Air bypassing metering element' },
      ],
      affectedComponents: [
        {
          name: 'PCV Valve / Vacuum Hose',
          probability: 65,
          partCostEstimateUsd: 25,
          laborCostEstimateUsd: 80,
          diyDifficultyWrenches: 1,
          replacementGuide: 'Inspect rubber vacuum lines and PCV elbow hoses for tears or oil softening.',
        },
        {
          name: 'Intake Gasket / MAF Sensor',
          probability: 30,
          partCostEstimateUsd: 35,
          laborCostEstimateUsd: 150,
          diyDifficultyWrenches: 3,
          replacementGuide: 'Clean MAF with aerosol solvent; smoke test intake for perimeter gasket leaks.',
        },
      ],
      preventativeAdvice: ['Do not replace the O2 sensor first — it is accurately reading the lean intake air.'],
    };
  }

  // Default custom code diagnosis
  const primaryCode = dtcCodes[0];
  return {
    id: `tri-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    urgency: primaryCode.severity,
    urgencyTitle: `${primaryCode.severity.toUpperCase()}: ${primaryCode.title}`,
    driveRecommendation: 'Perform targeted diagnostic verification before clearing codes.',
    rootCauseTitle: `Powertrain Subsystem Anomaly: ${primaryCode.code}`,
    plainEnglishExplanation: `Detected trouble code ${primaryCode.code} (${primaryCode.title}) in subsystem ${primaryCode.subsystem}. Vehicle sensors recorded active freeze-frame parameters.`,
    correlatedPids: [
      { pidName: 'Engine RPM', reading: `${pids.rpm.toFixed(0)} RPM`, nominalRange: '650 - 2500 RPM', anomalyNote: 'Freeze-frame engine speed' },
      { pidName: 'Coolant Temp', reading: `${pids.coolantTempC.toFixed(0)} °C`, nominalRange: '85 - 100 °C', anomalyNote: 'Engine thermal state' },
    ],
    affectedComponents: [
      {
        name: `${primaryCode.subsystem} Sensor / Actuator`,
        probability: 75,
        partCostEstimateUsd: 85,
        laborCostEstimateUsd: 120,
        diyDifficultyWrenches: 2,
        replacementGuide: `Inspect wiring connector and continuity for ${primaryCode.code}.`,
      },
    ],
    preventativeAdvice: ['Ensure sensor connector is clean and dry before part replacement.'],
  };
}

export function answerMechanicQuestion(
  question: string,
  triage: DiagnosticTriage,
  pids: TelemetryPIDs,
  vehicleModel: string
): string {
  const q = question.toLowerCase();

  if (q.includes('safe to drive') || q.includes('drive home') || q.includes('can i drive') || q.includes('how far')) {
    if (triage.urgency === 'critical') {
      return `❌ NO, you should NOT drive this vehicle right now. Your Check Engine light is in a critical condition (misfire detected under ${pids.engineLoadPercent.toFixed(0)}% engine load). Raw unburnt gasoline is entering your exhaust stream, which will rapidly melt the catalytic converter (a $1,200+ repair) and poses an engine fire risk. Pull over safely and request roadside assistance.`;
    }
    if (triage.urgency === 'caution') {
      return `⚠️ You can carefully drive a short distance (e.g. up to 25–40 miles home or to a repair shop), but take immediate precautions. Avoid hard acceleration, avoid towing or highway passing, and keep your RPM below 2,500. Current Short-Term Fuel Trim is ${pids.stftPercent > 0 ? '+' : ''}${pids.stftPercent.toFixed(1)}%, meaning your engine computer is actively compensating.`;
    }
    return `✅ Yes, your vehicle is completely safe to drive. All OBD-II telemetry parameters on your ${vehicleModel} are in stoichiometric balance with zero active DTC trouble codes.`;
  }

  if (q.includes('cost') || q.includes('price') || q.includes('how much') || q.includes('expensive')) {
    if (triage.affectedComponents.length === 0) {
      return `Zero repair costs required! Your vehicle is currently running at factory baseline with no active fault codes.`;
    }
    const top = triage.affectedComponents[0];
    const totalMech = top.partCostEstimateUsd + top.laborCostEstimateUsd;
    return `💰 Estimated Repair Cost Breakdown for "${top.name}":\n• DIY Parts Cost: ~$${top.partCostEstimateUsd} USD\n• Professional Mechanic Cost: ~$${totalMech} USD (Parts: $${top.partCostEstimateUsd} + Labor: $${top.laborCostEstimateUsd})\n• DIY Difficulty: ${top.diyDifficultyWrenches} out of 5 wrenches.\n\nTip: You can often save ~$${top.laborCostEstimateUsd} in labor if you have basic hand tools.`;
  }

  if (q.includes('how do i fix') || q.includes('diy') || q.includes('repair') || q.includes('tools')) {
    if (triage.affectedComponents.length === 0) {
      return `No repair needed! Your telemetry shows all systems operating within nominal tolerances.`;
    }
    const top = triage.affectedComponents[0];
    return `🔧 Step-by-Step DIY Guide for ${top.name}:\n1. ${top.replacementGuide}\n2. Estimated time: 30–60 minutes.\n3. After replacing, use the "Simulate Repair & Clear Codes" button below to reset the ECU and run an OBD-II drive cycle test.`;
  }

  if (q.includes('warranty') || q.includes('dealer')) {
    return `📋 Emissions & Powertrain Warranty Note:\nIn the United States under Federal EPA emissions law (Clean Air Act Sec. 207), major emissions components (ECU/ECM and Catalytic Converters) are legally warrantied for 8 years / 80,000 miles regardless of second-hand ownership. High-voltage EV traction batteries carry minimum 8-year / 100,000-mile warranties. Document your live freeze-frame telemetry before visiting the dealership.`;
  }

  return `Based on live telemetry for your ${vehicleModel}:\n• Active Diagnosis: ${triage.rootCauseTitle}\n• Current Urgency: ${triage.urgencyTitle}\n• Live Telemetry Snapshot: RPM ${pids.rpm.toFixed(0)}, Fuel Trim ${pids.stftPercent > 0 ? '+' : ''}${pids.stftPercent.toFixed(1)}%, System Voltage ${pids.batteryVoltageV.toFixed(1)}V.\n• Recommendation: ${triage.driveRecommendation}\n\nAsk me specific questions like: "Can I drive 30 miles home?", "What tools do I need?", or "How much does a mechanic charge for this?"`;
}
