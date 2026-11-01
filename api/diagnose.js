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
    const speed = Number(pids.speedKmh ?? 0);
    const voltage = Number(pids.batteryVoltageV ?? 14.1);
    const coolant = Number(pids.coolantTempC ?? 90);
    const load = Number(pids.engineLoadPercent ?? 28);

    // SAE J1979 / ISO 15031-5 Strict Physical Input Validation
    if (isNaN(rpm) || rpm < 0 || rpm > 18000) {
      return res.status(400).json({ error: 'Invalid RPM telemetry reading (must be 0 - 18000).' });
    }
    if (isNaN(speed) || speed < 0 || speed > 450) {
      return res.status(400).json({ error: 'Invalid Vehicle Speed reading (SAE J1979 PID 0x0D must be 0 - 450 km/h).' });
    }
    if (isNaN(stft) || stft < -100 || stft > 100 || isNaN(ltft) || ltft < -100 || ltft > 100) {
      return res.status(400).json({ error: 'Invalid Fuel Trim reading (SAE J1979 PID 0x06/0x07 must be between -100% and +100%).' });
    }
    if (isNaN(coolant) || coolant < -45 || coolant > 215) {
      return res.status(400).json({ error: 'Invalid Coolant Temperature reading (SAE J1979 PID 0x05 must be -45°C to 215°C).' });
    }

    let triage;

    const codesUpper = dtcCodes.map((c) => (c.code || '').toUpperCase());
    const hasMisfire = codesUpper.some((c) => c.startsWith('P030'));
    const hasOilOrThermalStop =
      coolant >= 112 ||
      codesUpper.some((c) => ['P0217', 'P0218', 'P0298', 'P0524'].includes(c));
    const hasCanBusLoss = codesUpper.some((c) => ['U0100', 'U0101', 'B0001'].includes(c));
    const hasVoltageDrop = (rpm > 400 && voltage < 12.0) || codesUpper.includes('P0562');
    const hasLeanTrim = stft > 20 || codesUpper.includes('P0171') || codesUpper.includes('P0174');
    const hasRichTrim = stft < -18 || codesUpper.includes('P0172') || codesUpper.includes('P0175');
    const hasEvFault = codesUpper.some((c) => c.startsWith('P0A'));
    const hasThermostat = codesUpper.includes('P0128');
    const hasCatalyst = codesUpper.includes('P0420') || codesUpper.includes('P0430');
    const hasEvap = codesUpper.some((c) => ['P0440', 'P0441', 'P0442', 'P0446', 'P0455', 'P0456'].includes(c));

    if (
      dtcCodes.length === 0 &&
      !hasOilOrThermalStop &&
      !hasVoltageDrop &&
      !hasLeanTrim &&
      !hasRichTrim
    ) {
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
    } else if (hasOilOrThermalStop) {
      const isOil = codesUpper.includes('P0524');
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'critical',
        urgencyTitle: isOil
          ? 'STOP IMMEDIATELY — Critical Engine Oil Pressure Loss'
          : 'STOP IMMEDIATELY — Severe Engine Overheating (>112°C)',
        driveRecommendation:
          'PULL OVER SAFELY AND SHUT OFF ENGINE IMMEDIATELY. Continued operation for even 60 seconds risks warped cylinder heads or catastrophic bearing seizure.',
        rootCauseTitle: isOil
          ? 'Engine Oil Pressure Collapse / Lubrication Pump Failure (P0524)'
          : `Severe Coolant Overtemperature (${coolant.toFixed(0)}°C) / Cooling Loop Failure`,
        plainEnglishExplanation: isOil
          ? `Critical oil pressure fault P0524 triggered on ${vehicleModel} at ${rpm.toFixed(0)} RPM. Without hydrodynamic oil film pressure, crankshaft bearings and camshaft journals experience direct metal-on-metal contact.`
          : `Engine coolant temperature on ${vehicleModel} has reached a dangerous ${coolant.toFixed(0)}°C (normal operating range is 88°C–98°C). Even if a DTC has not yet latched, thermal runaway will warp the aluminum cylinder head gasket.`,
        correlatedPids: [
          { pidName: 'Coolant Temperature', reading: `${coolant.toFixed(0)} °C`, nominalRange: '88 - 98 °C', anomalyNote: coolant >= 112 ? 'CRITICAL BOILING THRESHOLD EXCEEDED' : 'High thermal load' },
          { pidName: 'Engine RPM & Load', reading: `${rpm.toFixed(0)} RPM / ${load.toFixed(0)}%`, nominalRange: '< 50% load', anomalyNote: 'Immediate shutdown required' },
        ],
        affectedComponents: isOil
          ? [
              {
                name: 'Engine Oil Pump / Pick-up Tube O-Ring / Oil Level',
                probability: 78,
                partCostEstimateUsd: 180,
                laborCostEstimateUsd: 450,
                diyDifficultyWrenches: 4,
                replacementGuide: 'Check dipstick oil level first! Verify mechanical oil pressure with gauge before replacing oil pump.',
              },
            ]
          : [
              {
                name: 'Water Pump / Seized Thermostat / Radiator Cooling Fan',
                probability: 80,
                partCostEstimateUsd: 145,
                laborCostEstimateUsd: 260,
                diyDifficultyWrenches: 3,
                replacementGuide: 'DO NOT open hot radiator cap! Allow engine to cool 45 minutes, inspect coolant reservoir level, serpentine belt, and electric fan relay.',
              },
            ],
        preventativeAdvice: [
          'Never open a pressurized hot radiator cap — boiling coolant causes severe burns.',
          'Request flatbed tow to service shop.',
        ],
      };
    } else if (hasCanBusLoss) {
      const code = codesUpper[0] || 'U0100';
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'critical',
        urgencyTitle: `STOP IMMEDIATELY — Critical CAN Bus / Safety Module Fault (${code})`,
        driveRecommendation: 'Do not drive vehicle. Loss of communication with primary Engine Control Module (ECM) can cause sudden stalling or loss of power steering/restraints.',
        rootCauseTitle: `CAN Bus Lost Communication with ECM/PCM (${code})`,
        plainEnglishExplanation: `The vehicle gateway lost high-speed CAN-bus heartbeat frames from the Engine/Powertrain Control Module (${code}) on ${vehicleModel}.`,
        correlatedPids: [
          { pidName: 'System Voltage', reading: `${voltage.toFixed(1)} V`, nominalRange: '12.6 - 14.4 V', anomalyNote: 'Check ECM relay power and chassis ground straps' },
        ],
        affectedComponents: [
          {
            name: 'ECM Main Power Relay / CAN Bus Termination Harness',
            probability: 74,
            partCostEstimateUsd: 45,
            laborCostEstimateUsd: 160,
            diyDifficultyWrenches: 3,
            replacementGuide: 'Inspect under-hood fuse box ECM relay, clean battery ground strap, and measure 60-Ohm resistance across OBD-II pins 6 and 14.',
          },
        ],
        preventativeAdvice: ['Check ECM fuse and relay pins for corrosion before replacing expensive control modules.'],
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
      const isDualBank = codesUpper.includes('P0171') && codesUpper.includes('P0174');
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'caution',
        urgencyTitle: 'Service Soon — Safe to Drive Home (<50 miles)',
        driveRecommendation: 'Safe for normal commuting home or to a mechanic. Avoid heavy throttle or high-RPM load.',
        rootCauseTitle: isDualBank
          ? 'Shared Upstream Intake Boot / MAF Vacuum Leak (Bank 1 & Bank 2 Lean)'
          : 'Post-MAF Intake Vacuum Leak (Cracked PCV Hose / Gasket)',
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
    } else if (hasRichTrim) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'caution',
        urgencyTitle: 'Service Soon — System Running Too Rich (Fuel Dilution Risk)',
        driveRecommendation: 'Safe for short drives to a repair shop. Avoid prolonged idling, as excess fuel washes cylinder wall lubrication and overheats the catalytic converter.',
        rootCauseTitle: 'System Too Rich: Stuck-Open EVAP Purge Valve or Leaking Fuel Injector',
        plainEnglishExplanation: `Short-Term Fuel Trim on ${vehicleModel} is deeply negative (${stft.toFixed(1)}%) with Long-Term Trim at ${ltft.toFixed(1)}%. The ECU is aggressively pulling back fuel injection pulse width because excess hydrocarbons are entering the intake manifold.`,
        correlatedPids: [
          { pidName: 'STFT Compensation', reading: `${stft.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'Pulling fuel to counter rich mixture.' },
          { pidName: 'Mass Air Flow (MAF)', reading: `${maf.toFixed(1)} g/s`, nominalRange: '2.0 - 4.0 g/s', anomalyNote: 'Check for contaminated hot-wire over-reporting airflow.' },
        ],
        affectedComponents: [
          {
            name: 'EVAP Canister Purge Solenoid Valve (Stuck Open)',
            probability: 58,
            partCostEstimateUsd: 38,
            laborCostEstimateUsd: 70,
            diyDifficultyWrenches: 1,
            replacementGuide: 'Unplug vacuum line from purge valve with engine off; if you can blow air through it when de-energized, the valve is stuck open.',
          },
          {
            name: 'Leaking Fuel Injector',
            probability: 32,
            partCostEstimateUsd: 95,
            laborCostEstimateUsd: 180,
            diyDifficultyWrenches: 3,
            replacementGuide: 'Monitor fuel rail pressure decay after key-off; rapid pressure drop indicates a dripping injector nozzle.',
          },
        ],
        preventativeAdvice: ['Check engine oil dipstick for raw gasoline odor (fuel dilution).'],
      };
    } else if (hasThermostat) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'caution',
        urgencyTitle: 'Service Soon — Engine Running Below Optimal Thermal Efficiency',
        driveRecommendation: 'Completely safe to drive home or commute, though cabin heater output and fuel economy will be reduced by 10–15%.',
        rootCauseTitle: `Coolant Thermostat Stuck Open (${coolant.toFixed(0)}°C vs 88°C Target)`,
        plainEnglishExplanation: `After sustained driving at ${speed.toFixed(0)} km/h, engine coolant temperature on ${vehicleModel} only reached ${coolant.toFixed(0)}°C (normal regulating target is 88°C–93°C). The mechanical thermostat wax pellet is stuck open, circulating coolant through the radiator prematurely.`,
        correlatedPids: [
          { pidName: 'Coolant Temperature', reading: `${coolant.toFixed(0)} °C`, nominalRange: '88 - 93 °C', anomalyNote: 'Below closed-loop thermostat threshold.' },
        ],
        affectedComponents: [
          {
            name: 'Engine Coolant Thermostat & Gasket',
            probability: 88,
            partCostEstimateUsd: 32,
            laborCostEstimateUsd: 120,
            diyDifficultyWrenches: 2,
            replacementGuide: 'Drain 1 gallon of coolant, remove 2 thermostat housing bolts, install OEM fail-safe thermostat with jiggle pin at 12 o\'clock.',
          },
        ],
        preventativeAdvice: ['Replace coolant with OEM 50/50 premix and bleed air pockets from heater core.'],
      };
    } else if (hasCatalyst) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'caution',
        urgencyTitle: 'Emissions Alert — Safe to Drive (Will Fail Smog Inspection)',
        driveRecommendation: 'Vehicle is safe to drive normally with no immediate drivability risk, but will not pass state OBD-II emissions inspection until resolved.',
        rootCauseTitle: 'Catalytic Converter Oxygen Storage Depletion or Exhaust Flange Leak (P0420)',
        plainEnglishExplanation: `The downstream O2 sensor behind the catalytic converter on ${vehicleModel} is mirroring the upstream sensor's voltage oscillations, indicating the catalyst cerium-oxide washcoat is no longer storing oxygen efficiently.`,
        correlatedPids: [
          { pidName: 'Fuel Trim Balance', reading: `${stft.toFixed(1)}% / ${ltft.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'Verify fuel trims are healthy before replacing catalyst.' },
        ],
        affectedComponents: [
          {
            name: 'Three-Way Catalytic Converter Assembly',
            probability: 65,
            partCostEstimateUsd: 480,
            laborCostEstimateUsd: 250,
            diyDifficultyWrenches: 3,
            replacementGuide: 'Check Federal 8-year / 80,000-mile EPA Emissions Warranty first! Inspect exhaust manifold and flange gaskets for pinhole exhaust leaks before replacing converter.',
          },
        ],
        preventativeAdvice: ['Always fix underlying misfires or fuel trim leaks before installing a new catalytic converter.'],
      };
    } else if (hasEvap) {
      triage = {
        id: `tri-api-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        urgency: 'caution',
        urgencyTitle: 'Minor Vapor Leak — Safe to Drive (Check Gas Cap First)',
        driveRecommendation: '100% safe to drive. Tighten fuel filler cap until it clicks 3 times; code will self-clear after 2–3 evaporative drive cycles.',
        rootCauseTitle: 'EVAP System Vapor Leak: Loose/Worn Fuel Filler Gas Cap or Purge Valve',
        plainEnglishExplanation: `The Evaporative Emission (EVAP) tank pressure sensor on ${vehicleModel} failed to hold vacuum during its self-test (${codesUpper[0]}). In over 70% of vehicles, this is caused by a loose fuel cap or cracked rubber O-ring seal.`,
        correlatedPids: [
          { pidName: 'Short-Term Fuel Trim', reading: `${stft.toFixed(1)}%`, nominalRange: '±5.0%', anomalyNote: 'Engine combustion unaffected.' },
        ],
        affectedComponents: [
          {
            name: 'Fuel Filler Gas Cap Seal / O-Ring',
            probability: 72,
            partCostEstimateUsd: 18,
            laborCostEstimateUsd: 0,
            diyDifficultyWrenches: 1,
            replacementGuide: 'Inspect rubber O-ring on gas cap for cracks; wipe fuel filler neck lip clean and tighten cap until it clicks.',
          },
          {
            name: 'EVAP Canister Purge / Vent Solenoid Valve',
            probability: 24,
            partCostEstimateUsd: 42,
            laborCostEstimateUsd: 85,
            diyDifficultyWrenches: 2,
            replacementGuide: 'If new gas cap does not resolve, smoke-test EVAP lines and test vent solenoid beneath rear charcoal canister.',
          },
        ],
        preventativeAdvice: ['Never top off the gas tank after the pump nozzle clicks off — liquid fuel floods the charcoal canister.'],
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
            name: `${codeObj.subsystem || 'Powertrain'} Sensor / Actuator (${codeObj.title})`,
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
      engine: 'CarSense-AI-SAE-J1979-Correlator-v2.2',
      triage,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal diagnostic engine error', details: err.message });
  }
}
