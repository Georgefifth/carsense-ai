import test from 'node:test';
import assert from 'node:assert/strict';
import diagnoseHandler from '../api/diagnose.js';
import mechanicHandler from '../api/mechanic.js';

function invokeHandler(handler, method, body) {
  let statusCode = 200;
  let responseBody = null;
  const req = { method, body };
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(data) {
          responseBody = data;
          return data;
        },
      };
    },
  };
  handler(req, res);
  return { statusCode, body: responseBody };
}

test('POST /api/diagnose returns nominal triage when 0 DTCs and healthy PIDs', () => {
  const { statusCode, body } = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [],
    pids: {
      rpm: 1850,
      speedKmh: 105,
      coolantTempC: 90,
      stftPercent: 0.4,
      ltftPercent: 1.1,
      mafGramsSec: 14.3,
      batteryVoltageV: 14.1,
      engineLoadPercent: 28,
    },
    vehicleModel: '2024 Honda Civic 1.5T',
  });

  assert.equal(statusCode, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.triage.urgency, 'nominal');
  assert.equal(body.triage.affectedComponents.length, 0);
});

test('POST /api/diagnose correlates P0171 vacuum leak when STFT is pegged high at idle', () => {
  const { statusCode, body } = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [{ code: 'P0171', title: 'System Too Lean (Bank 1)', severity: 'caution' }],
    pids: {
      rpm: 700,
      stftPercent: 24.8,
      ltftPercent: 18.5,
      mafGramsSec: 1.7,
      batteryVoltageV: 13.8,
      coolantTempC: 90,
      engineLoadPercent: 21,
    },
    vehicleModel: '2021 Toyota RAV4',
  });

  assert.equal(statusCode, 200);
  assert.equal(body.triage.urgency, 'caution');
  assert.match(body.triage.rootCauseTitle, /Vacuum Leak/i);
  assert.ok(body.triage.affectedComponents.length >= 2);
});

test('POST /api/diagnose flags CRITICAL urgency on P0303 cylinder misfire', () => {
  const { statusCode, body } = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [{ code: 'P0303', title: 'Cylinder 3 Misfire Detected', severity: 'critical' }],
    pids: {
      rpm: 1980,
      stftPercent: 18.8,
      engineLoadPercent: 64,
      coolantTempC: 98,
      batteryVoltageV: 14.0,
    },
    vehicleModel: '2020 Ford F-150',
  });

  assert.equal(statusCode, 200);
  assert.equal(body.triage.urgency, 'critical');
  assert.match(body.triage.urgencyTitle, /STOP IMMEDIATELY/i);
});

test('POST /api/diagnose detects alternator charging failure when voltage < 12.0V', () => {
  const { statusCode, body } = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [{ code: 'P0562', title: 'System Voltage Low', severity: 'caution' }],
    pids: {
      rpm: 750,
      batteryVoltageV: 11.4,
      engineLoadPercent: 35,
    },
    vehicleModel: '2022 Subaru Outback',
  });

  assert.equal(statusCode, 200);
  assert.match(body.triage.rootCauseTitle, /Alternator/i);
});

test('POST /api/diagnose rejects invalid RPM range with HTTP 400', () => {
  const { statusCode, body } = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [],
    pids: { rpm: -500 },
  });

  assert.equal(statusCode, 400);
  assert.match(body.error, /Invalid RPM/i);
});

test('POST /api/mechanic answers driving safety and cost questions accurately', () => {
  const { statusCode, body } = invokeHandler(mechanicHandler, 'POST', {
    question: 'Can I drive 40 miles home with this?',
    triage: {
      urgency: 'critical',
      rootCauseTitle: 'Cylinder 3 Misfire',
    },
    pids: { engineLoadPercent: 64, stftPercent: 18.8 },
    vehicleModel: '2020 Ford F-150',
  });

  assert.equal(statusCode, 200);
  assert.match(body.reply, /NO, you should NOT drive/i);
});

test('Stage 3.5 Regression: POST /api/diagnose detects unlatched severe engine overheating (>112C)', () => {
  const { statusCode, body } = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [],
    pids: { rpm: 2400, speedKmh: 90, coolantTempC: 119, batteryVoltageV: 14.0 },
    vehicleModel: '2018 BMW 330i',
  });

  assert.equal(statusCode, 200);
  assert.equal(body.triage.urgency, 'critical');
  assert.match(body.triage.rootCauseTitle, /Overtemperature|Cooling/i);
});

test('Stage 3.5 Regression: POST /api/diagnose enforces CRITICAL urgency on P0524 oil pressure collapse', () => {
  const { statusCode, body } = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [{ code: 'P0524', title: 'Engine Oil Pressure Too Low' }],
    pids: { rpm: 1800, speedKmh: 60, coolantTempC: 96, batteryVoltageV: 14.1 },
    vehicleModel: '2021 Chevrolet Silverado',
  });

  assert.equal(statusCode, 200);
  assert.equal(body.triage.urgency, 'critical');
  assert.match(body.triage.rootCauseTitle, /Oil Pressure/i);
});

test('Stage 3.5 Regression: POST /api/diagnose rejects impossible STFT (+500%) and negative speed (-80 km/h)', () => {
  const res1 = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [],
    pids: { rpm: 1500, stftPercent: 500 },
  });
  assert.equal(res1.statusCode, 400);

  const res2 = invokeHandler(diagnoseHandler, 'POST', {
    dtcCodes: [],
    pids: { rpm: 1500, speedKmh: -80 },
  });
  assert.equal(res2.statusCode, 400);
});
