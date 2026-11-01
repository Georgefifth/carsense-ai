// Pure OBD-II lookup logic. Browser (window.ObdModel) and Node (module.exports).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ObdModel = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // severity: HIGH = stop driving soon / can damage engine; MED = fix soon; LOW = monitor.
  var CODES = {
    P0100: { t: 'Mass Air Flow (MAF) circuit malfunction', s: 'MED', a: 'Check MAF sensor connector; clean sensor with MAF cleaner; inspect intake ducting for leaks.' },
    P0101: { t: 'MAF sensor range/performance problem', s: 'MED', a: 'Clean or replace the MAF sensor; check for intake leaks after the sensor.' },
    P0113: { t: 'Intake Air Temperature sensor high input', s: 'LOW', a: 'Check IAT sensor wiring; often a cheap sensor swap.' },
    P0128: { t: 'Coolant temp below thermostat regulating temperature', s: 'LOW', a: 'Usually a stuck-open thermostat; replace thermostat, verify coolant level.' },
    P0130: { t: 'O2 sensor circuit malfunction (Bank 1, Sensor 1)', s: 'MED', a: 'Inspect O2 sensor wiring; replace sensor if aged; check for exhaust leaks near sensor.' },
    P0131: { t: 'O2 sensor low voltage (Bank 1, Sensor 1)', s: 'MED', a: 'Check for vacuum leaks and exhaust leaks; replace O2 sensor if slow to respond.' },
    P0133: { t: 'O2 sensor slow response (Bank 1, Sensor 1)', s: 'MED', a: 'Aged O2 sensor is most common; also check MAF readings and intake leaks.' },
    P0135: { t: 'O2 sensor heater circuit (Bank 1, Sensor 1)', s: 'MED', a: 'Check sensor heater fuse and wiring; replace the O2 sensor if heater is open-circuit.' },
    P0141: { t: 'O2 sensor heater circuit (Bank 1, Sensor 2)', s: 'LOW', a: 'Downstream sensor heater fault; check fuse/wiring, then replace sensor.' },
    P0171: { t: 'System too lean (Bank 1)', s: 'MED', a: 'Hunt for vacuum/intake leaks, clean MAF, check fuel pressure and injectors.' },
    P0172: { t: 'System too rich (Bank 1)', s: 'MED', a: 'Check for leaking injectors, faulty MAF, stuck-open purge valve, fuel pressure regulator.' },
    P0174: { t: 'System too lean (Bank 2)', s: 'MED', a: 'Same causes as P0171 but bank 2 — shared causes (MAF, intake leak) are most likely if both set.' },
    P0300: { t: 'Random/multiple cylinder misfire detected', s: 'HIGH', a: 'Check spark plugs, coils, fuel delivery, vacuum leaks. Flashing check-engine = stop driving.' },
    P0301: { t: 'Cylinder 1 misfire detected', s: 'HIGH', a: 'Swap coil/plug from cylinder 1 to another; if the misfire follows, replace that part.' },
    P0302: { t: 'Cylinder 2 misfire detected', s: 'HIGH', a: 'Swap coil/plug test on cylinder 2; also check injector and compression.' },
    P0303: { t: 'Cylinder 3 misfire detected', s: 'HIGH', a: 'Swap coil/plug test on cylinder 3; also check injector and compression.' },
    P0304: { t: 'Cylinder 4 misfire detected', s: 'HIGH', a: 'Swap coil/plug test on cylinder 4; also check injector and compression.' },
    P0305: { t: 'Cylinder 5 misfire detected', s: 'HIGH', a: 'Swap coil/plug test on cylinder 5; also check injector and compression.' },
    P0306: { t: 'Cylinder 6 misfire detected', s: 'HIGH', a: 'Swap coil/plug test on cylinder 6; also check injector and compression.' },
    P0325: { t: 'Knock sensor circuit malfunction', s: 'MED', a: 'Inspect knock sensor wiring; replace sensor; use correct-octane fuel.' },
    P0335: { t: 'Crankshaft position sensor circuit', s: 'HIGH', a: 'Can cause stalling/no-start. Check sensor gap and wiring; replace CKP sensor.' },
    P0340: { t: 'Camshaft position sensor circuit', s: 'HIGH', a: 'Check CMP sensor and wiring; can cause no-start or rough running.' },
    P0401: { t: 'EGR insufficient flow', s: 'MED', a: 'Clean carbon from EGR valve and passages; test EGR vacuum control.' },
    P0402: { t: 'EGR excessive flow', s: 'MED', a: 'EGR valve stuck open or DPFE sensor faulty; clean/replace as needed.' },
    P0420: { t: 'Catalyst efficiency below threshold (Bank 1)', s: 'MED', a: 'Check for exhaust leaks and lazy O2 sensors first; failing catalytic converter is common on high miles.' },
    P0430: { t: 'Catalyst efficiency below threshold (Bank 2)', s: 'MED', a: 'Same as P0420 for bank 2; verify with downstream O2 sensor waveform.' },
    P0440: { t: 'EVAP system malfunction', s: 'LOW', a: 'Check gas cap first! Then inspect EVAP hoses and purge/vent valves.' },
    P0441: { t: 'EVAP incorrect purge flow', s: 'LOW', a: 'Test purge valve (often stuck); check vacuum lines to the valve.' },
    P0442: { t: 'EVAP small leak detected', s: 'LOW', a: 'Loose/worn gas cap is the #1 cause; smoke test to find small hose leaks.' },
    P0446: { t: 'EVAP vent control circuit', s: 'LOW', a: 'Vent valve stuck or spider nests in vent tube; test valve operation.' },
    P0455: { t: 'EVAP large leak detected', s: 'LOW', a: 'Check gas cap missing/loose, cracked filler neck, disconnected EVAP hose.' },
    P0456: { t: 'EVAP very small leak detected', s: 'LOW', a: 'Usually gas cap seal; otherwise smoke test EVAP system.' },
    P0500: { t: 'Vehicle speed sensor malfunction', s: 'MED', a: 'Check VSS wiring and tone ring; can affect shifting and ABS.' },
    P0505: { t: 'Idle control system malfunction', s: 'LOW', a: 'Clean throttle body and idle air control valve; check for vacuum leaks.' },
    P0506: { t: 'Idle speed lower than expected', s: 'LOW', a: 'Clean throttle body/IAC; check for intake restrictions.' },
    P0507: { t: 'Idle speed higher than expected', s: 'LOW', a: 'Vacuum leak is most common; check throttle body and PCV.' },
    P0562: { t: 'System voltage low', s: 'MED', a: 'Test battery and alternator output; check corroded battery terminals and grounds.' },
    P0600: { t: 'Serial communication link malfunction', s: 'MED', a: 'Module communication fault; check connectors/grounds; scan all modules.' },
    P0601: { t: 'Internal control module memory checksum error', s: 'HIGH', a: 'ECM internal fault; try battery reset; may need ECM reflash or replacement.' },
    P0700: { t: 'Transmission control system malfunction', s: 'HIGH', a: 'TCM has stored codes — scan the transmission module for the real fault code.' },
    P0705: { t: 'Transmission range sensor circuit', s: 'MED', a: 'Check/adjust the range (neutral safety) switch; inspect wiring.' },
    P0715: { t: 'Input/turbine speed sensor circuit', s: 'MED', a: 'Check transmission speed sensor and connector; low fluid can contribute.' },
    P0730: { t: 'Incorrect gear ratio', s: 'HIGH', a: 'Check fluid level/condition first; internal clutch slip likely — transmission shop time.' },
    P0741: { t: 'Torque converter clutch stuck off / performance', s: 'MED', a: 'Fluid change may help; TCC solenoid or converter wear common.' },
    P0755: { t: 'Shift solenoid B malfunction', s: 'MED', a: 'Check fluid, then test/replace shift solenoid; inspect valve-body wiring.' },
    B0001: { t: 'Driver airbag deployment control (restraints)', s: 'HIGH', a: 'Airbag system fault — have SRS scanned professionally; avoid DIY on airbags.' },
    B1000: { t: 'ECU internal fault (body control)', s: 'MED', a: 'Body module fault; check battery voltage and grounds, then dealer scan.' },
    C0035: { t: 'Left front wheel speed sensor circuit', s: 'MED', a: 'Check sensor wiring and tone ring for debris; replace sensor if open/shorted.' },
    C0040: { t: 'Right front wheel speed sensor circuit', s: 'MED', a: 'Same as C0035 for right front; ABS light stays until fixed.' },
    C0300: { t: 'Rear speed sensor malfunction', s: 'MED', a: 'Inspect rear wheel/diff speed sensor and wiring.' },
    U0100: { t: 'Lost communication with ECM/PCM', s: 'HIGH', a: 'Check CAN bus wiring, ECM fuses and grounds; can cause no-start.' },
    U0101: { t: 'Lost communication with TCM', s: 'HIGH', a: 'Check transmission module power/ground and CAN wiring.' },
    U0121: { t: 'Lost communication with ABS module', s: 'MED', a: 'Check ABS module fuses and CAN connections.' },
    U0155: { t: 'Lost communication with instrument cluster', s: 'MED', a: 'Cluster power/ground or CAN fault; gauges may drop out.' }
  };

  var SEV_LABEL = { HIGH: 'Serious — address ASAP', MED: 'Fix soon', LOW: 'Low risk — monitor' };

  function normalize(code) {
    return String(code || '').trim().toUpperCase();
  }

  function isValidFormat(code) {
    return /^[PBCU]\d{4}$/.test(normalize(code));
  }

  function lookup(code) {
    var c = normalize(code);
    if (!isValidFormat(c)) return { error: 'format', code: c };
    var hit = CODES[c];
    if (!hit) {
      return { error: 'unknown', code: c, family: familyOf(c) };
    }
    return { code: c, title: hit.t, severity: hit.s, severityLabel: SEV_LABEL[hit.s], advice: hit.a };
  }

  function familyOf(code) {
    var c = normalize(code);
    var sys = { P: 'Powertrain (engine/transmission)', B: 'Body (airbags, AC, lighting)', C: 'Chassis (ABS, steering, suspension)', U: 'Network (module communication)' }[c[0]] || 'Unknown';
    var generic = c[1] === '0' ? 'generic (same on all brands)' : 'manufacturer-specific (meaning varies by brand)';
    return sys + ', ' + generic;
  }

  function search(term) {
    var q = String(term || '').trim().toLowerCase();
    if (!q) return [];
    return Object.keys(CODES).filter(function (c) {
      return c.toLowerCase().indexOf(q) > -1 || CODES[c].t.toLowerCase().indexOf(q) > -1;
    }).map(function (c) {
      return { code: c, title: CODES[c].t, severity: CODES[c].s };
    });
  }

  function allCodes() {
    return Object.keys(CODES).map(function (c) {
      return { code: c, title: CODES[c].t, severity: CODES[c].s };
    });
  }

  return { lookup: lookup, search: search, isValidFormat: isValidFormat, normalize: normalize, familyOf: familyOf, allCodes: allCodes, SEV_LABEL: SEV_LABEL };
}));
