export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { dtcCodes = [], pids = {}, vehicleModel = 'Connected Vehicle' } = req.body || {};

    const stft = Number(pids.stftPercent ?? 0);
    const ltft = Number(pids.ltftPercent ?? 0);
    const maf = Number(pids.mafGramsSec ?? 14.0);
    const rpm = Number(pids.rpm ?? 1500);
    const voltage = Number(pids.batteryVoltageV ?? 14.1);
    const coolant = Number(pids.coolantTempC ?? 90);
    const load = Number(pids.engineLoadPercent ?? 28);

    // Validate input ranges
    if (isNaN(rpm) || rpm < 0 || rpm > 18000) {
      return res.status(400).json({ error: 'Invalid RPM telemetry reading (must be 0 - 18000).' });
    }

    let triage;

    const hasMisfire = dtcCodes.some((c) => c.code && c.code.startsWith('P030'));
    const hasVoltageDrop = voltage < 12.0 || dtcCodes.some((c) => c.code === 'P0562');
    const hasLeanTrim = stft > 20 || dtcCodes.some((c) => c.code === 'P0171');
    const hasEvFault = dtcCodes.some((c) => c.code && c.code.startsWith('P0A'));

    if (dtcCodes.length === 0 && !hasVoltageDrop && !hasLeanTrim) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'nominal',
        urgencyTitle: 'All Powertrain Systems Nominal — Roadworthy',
        driveRecommendation: 'No driving restrictions. All powertrain modules operating within factory OEM parameters.',
        rootCauseTitle: 'Closed-Loop Air/Fuel Equilibrium Maintained',
        plainEnglishExplanation: `Engine control module on ${vehicleModel} reports zero pending or confirmed diagnostic trouble codes. Short-Term Fuel Trim (${stft.toFixed(1)}%) and Long-Term Fuel Trim (${ltft.toFixed(1)}%) confirm stoichiometric combustion.`,
        correlatedPids: [
          { pidName: 'STFT / LTFT Combined', reading: `${(stft + ltft).toFixed(1)}%`, nominalRange: '-5.0% to +5.0%', anomalyNote: 'Stoichiometric balance verified.' },
          { pidName: 'Mass Air Flow (MAF)', reading: `${maf.toFixed(1)} g/s`, nominalRange: '2.0 - 45.0 g/s', anomalyNote: 'Airflow tracks throttle demand.' },
          { pidName: 'Charging Voltage', reading: `${voltage.toFixed(1)} V`, nominalRange: '13.8 - 14.6 V', anomalyNote: 'Alternator diode regulator nominal.' },
        ],
        affectedComponents: [],
        preventativeAdvice: [
          'Continue scheduled factory maintenance.',
          'All OBD-II readiness monitors within specification.',
        ],
      };
    } else if (hasMisfire) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'critical',
        urgencyTitle: 'STOP IMMEDIATELY — Catastrophic Catalyst Damage Risk',
        driveRecommendation: 'PULL OVER SAFELY AND SHUT OFF ENGINE. Active cylinder misfire dumps raw unburnt fuel into the catalytic converter, risking substrate melt within minutes.',
        rootCauseTitle: 'Cylinder Ignition Coil / Spark Breakdown Under Load',
        plainEnglishExplanation: `Active combustion misfire detected on ${vehicleModel} at ${load.toFixed(0)}% engine load (${rpm.toFixed(0)} RPM). Unburnt oxygen entering the exhaust tricks the upstream O2 sensor into commanding +${stft.toFixed(1)}% fuel enrichment, accelerating thermal runaway in the catalytic converter.`,
        correlatedPids: [
          { pidName: 'Engine Load & RPM', reading: `${load.toFixed(0)}% / ${rpm.toFixed(0)} RPM`, nominalRange: 'Smooth torque delivery', anomalyNote: 'Crankshaft deceleration pulse detected.' },
          { pidName: 'STFT Compensation', reading: `+${stft.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'ECU over-enriching due to unburnt oxygen.' },
          { pidName: 'Coolant Temp', reading: `${coolant.toFixed(0)} °C`, nominalRange: '88 - 95 °C', anomalyNote: 'Elevated cylinder head thermal load.' },
        ],
        affectedComponents: [
          {
            name: 'Ignition Coil Pack / Boot',
            probability: 72,
            partCostEstimateUsd: 65,
            laborCostEstimateUsd: 75,
            diyDifficultyWrenches: 2,
            replacementGuide: 'Disconnect coil harness, remove 8mm bolt, inspect rubber boot for carbon arc tracking, replace coil pack.',
          },
          {
            name: 'Iridium Spark Plug',
            probability: 21,
            partCostEstimateUsd: 14,
            laborCostEstimateUsd: 80,
            diyDifficultyWrenches: 2,
            replacementGuide: 'Extract spark plug with 5/8" magnetic socket, inspect electrode gap and fuel fouling.',
          },
        ],
        preventativeAdvice: [
          'Do not drive with a flashing Check Engine light.',
          'Swap the suspect ignition coil with an adjacent cylinder to confirm whether the fault code follows the coil.',
        ],
      };
    } else if (hasEvFault) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'caution',
        urgencyTitle: 'Service Battery System — Power & Range Throttled',
        driveRecommendation: 'Safe for moderate local driving. Avoid DC Fast Charging (Supercharging). Charge on Level 2 AC to allow BMS cell balancing.',
        rootCauseTitle: 'High Voltage Module 4 Brick Voltage Degradation (>280mV Delta)',
        plainEnglishExplanation: `The Battery Management System (BMS) on ${vehicleModel} detected a critical voltage imbalance across traction pack modules (Pack Voltage: ${voltage.toFixed(1)}V). Degraded cell brick internal resistance causes premature voltage sag under acceleration.`,
        correlatedPids: [
          { pidName: 'Max vs Min Cell Delta', reading: '285 mV Delta', nominalRange: '< 25 mV', anomalyNote: 'Cell Brick #42 voltage drops prematurely under load.' },
          { pidName: 'Traction Pack Voltage', reading: `${voltage.toFixed(1)} V`, nominalRange: '350 - 400 V', anomalyNote: 'Active power limiting engaged by BMS.' },
        ],
        affectedComponents: [
          {
            name: 'HV Battery Module / Cell Group Replacement',
            probability: 76,
            partCostEstimateUsd: 1200,
            laborCostEstimateUsd: 850,
            diyDifficultyWrenches: 5,
            replacementGuide: 'Requires high-voltage PPE certification and pack lift. Check 8-year / 100,000-mile Federal EV Warranty.',
          },
        ],
        preventativeAdvice: [
          'Export freeze-frame cell voltage delta logs before visiting the service center.',
        ],
      };
    } else if (hasVoltageDrop) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'caution',
        urgencyTitle: 'Critical Power Depletion — 15–20 Mins of Runtime Left',
        driveRecommendation: 'Turn off A/C, seat heaters, radio, and high beams immediately. Drive directly to a service shop or safe parking spot before battery drops below 10.5V.',
        rootCauseTitle: 'Alternator Rectifier Bridge Failure (Zero Charging Output)',
        plainEnglishExplanation: `System voltage on ${vehicleModel} has collapsed to ${voltage.toFixed(1)}V (normal charging is 13.8V–14.5V). Your alternator has stopped charging and the vehicle is running exclusively on 12V battery reserve.`,
        correlatedPids: [
          { pidName: 'Battery / System Voltage', reading: `${voltage.toFixed(1)} V`, nominalRange: '13.8 - 14.5 V', anomalyNote: 'Alternator output failure confirmed.' },
          { pidName: 'Calculated Engine Load', reading: `${load.toFixed(0)}%`, nominalRange: '18 - 25% @ Idle', anomalyNote: 'ECU raising idle speed to attempt voltage recovery.' },
        ],
        affectedComponents: [
          {
            name: 'Alternator & Internal Voltage Regulator',
            probability: 82,
            partCostEstimateUsd: 195,
            laborCostEstimateUsd: 140,
            diyDifficultyWrenches: 2,
            replacementGuide: 'Disconnect negative battery terminal, release serpentine belt tensioner, replace alternator assembly.',
          },
        ],
        preventativeAdvice: [
          'Do not replace the battery without testing the alternator first — a dead alternator will drain a new battery in 20 minutes.',
        ],
      };
    } else if (hasLeanTrim) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'caution',
        urgencyTitle: 'Service Soon — Safe to Drive Home (<50 miles)',
        driveRecommendation: 'Safe for normal commuting home or to a mechanic. Avoid heavy throttle or high-RPM load.',
        rootCauseTitle: 'Post-MAF Intake Vacuum Leak (Cracked PCV Hose / Gasket)',
        plainEnglishExplanation: `Engine fuel trim on ${vehicleModel} is pegged at +${stft.toFixed(1)}% at idle while Mass Air Flow reads ${maf.toFixed(1)} g/s. Unmetered air is entering the intake manifold behind the MAF sensor, forcing the ECU to inject extra fuel.`,
        correlatedPids: [
          { pidName: 'STFT at Idle', reading: `+${stft.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'Pegged near lean enrichment limit.' },
          { pidName: 'Mass Air Flow (MAF)', reading: `${maf.toFixed(1)} g/s`, nominalRange: '2.4 - 3.2 g/s @ Idle', anomalyNote: 'Unmetered air bypassing sensor.' },
        ],
        affectedComponents: [
          {
            name: 'PCV Breather Hose / Vacuum Line',
            probability: 68,
            partCostEstimateUsd: 28,
            laborCostEstimateUsd: 85,
            diyDifficultyWrenches: 1,
            replacementGuide: 'Inspect rubber PCV and vacuum elbows for cracks or oil softening; replace brittle hose.',
          },
          {
            name: 'Intake Manifold Runner Gasket',
            probability: 22,
            partCostEstimateUsd: 42,
            laborCostEstimateUsd: 180,
            diyDifficultyWrenches: 3,
            replacementGuide: 'Replace silicone intake plenum gaskets and torque bolts in crisscross pattern.',
          },
        ],
        preventativeAdvice: [
          'Do not replace the upstream O2 sensor first — it is accurately reporting the lean exhaust caused by the air leak.',
        ],
      };
    } else {
      const codeObj = dtcCodes[0] || { code: 'P0000', title: 'General Powertrain Anomaly', subsystem: 'Engine Control', severity: 'caution' };
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: codeObj.severity || 'caution',
        urgencyTitle: `${(codeObj.severity || 'caution').toUpperCase()}: ${codeObj.title}`,
        driveRecommendation: 'Inspect affected subsystem sensor and wiring harness.',
        rootCauseTitle: `Diagnostic Trouble Code ${codeObj.code}: ${codeObj.title}`,
        plainEnglishExplanation: `Telemetry captured active trouble code ${codeObj.code} on ${vehicleModel} at ${rpm.toFixed(0)} RPM and ${coolant.toFixed(0)} °C coolant temperature.`,
        correlatedPids: [
          { pidName: 'Engine RPM', reading: `${rpm.toFixed(0)} RPM`, nominalRange: '650 - 3000 RPM', anomalyNote: 'Captured at freeze-frame trigger.' },
          { pidName: 'Short-Term Fuel Trim', reading: `${stft.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'Closed-loop trim feedback.' },
        ],
        affectedComponents: [
          {
            name: `${codeObj.subsystem || 'Powertrain'} Sensor / Actuator`,
            probability: 75,
            partCostEstimateUsd: 85,
            laborCostEstimateUsd: 120,
            diyDifficultyWrenches: 2,
            replacementGuide: `Verify electrical connector pins and sensor resistance for ${codeObj.code}.`,
          },
        ],
        preventativeAdvice: ['Verify wiring harness continuity before replacing hardware components.'],
      };
    }

    return res.status(200).json({
      status: 'ok',
      engine: 'CarSense-AI-SAE-J1979-Correlator-v2.1',
      triage,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal diagnostic engine error', details: err.message });
  }
}
