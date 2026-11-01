import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import diagnoseHandler from '../api/diagnose.js';

const require = createRequire(import.meta.url);
const competitorObdModel = require('../evidence/stage-3.5-validation/competitor-obd-model.cjs');

const datasetPath = path.resolve('evidence/stage-3.5-validation/benchmark-dataset.json');
const outFile = process.env.OUT_FILE || 'evidence/stage-3.5-validation/initial-results.json';

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

function callCarSense(input) {
  let statusCode = 200;
  let responseBody = null;
  const start = performance.now();
  const req = { method: 'POST', body: input };
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
  diagnoseHandler(req, res);
  const latencyMs = Number((performance.now() - start).toFixed(3));
  return { statusCode, body: responseBody, latencyMs };
}

function callCompetitor(input) {
  const start = performance.now();
  const codes = input.dtcCodes || [];
  if (codes.length === 0) {
    // Competitor is pure static DTC lookup and ignores PIDs completely
    return {
      supported: false,
      urgencyMapped: 'nominal',
      title: 'No code provided',
      action: 'None (ignores freeze-frame PIDs)',
      latencyMs: Number((performance.now() - start).toFixed(3)),
    };
  }
  const primary = codes[0].code;
  const res = competitorObdModel.lookup(primary);
  const latencyMs = Number((performance.now() - start).toFixed(3));
  if (!res || !res.known) {
    return {
      supported: false,
      urgencyMapped: 'unknown',
      title: res ? res.title : 'Unknown',
      action: res ? res.action : 'None',
      latencyMs,
    };
  }
  const urgencyMapped = res.severity === 'HIGH' ? 'critical' : 'caution';
  return {
    supported: true,
    urgencyMapped,
    title: res.title,
    action: res.action,
    latencyMs,
  };
}

const results = [];

for (const tc of dataset.cases) {
  const cs = callCarSense(tc.input);
  const comp = callCompetitor(tc.input);

  let carSensePassed = true;
  const failureReasons = [];

  if (cs.statusCode !== tc.expected.httpStatus) {
    carSensePassed = false;
    failureReasons.push(`Expected HTTP ${tc.expected.httpStatus}, got ${cs.statusCode}`);
  } else if (tc.expected.httpStatus === 200) {
    const triage = cs.body?.triage;
    if (!triage) {
      carSensePassed = false;
      failureReasons.push('Missing triage object in 200 response');
    } else {
      if (triage.urgency !== tc.expected.urgency) {
        carSensePassed = false;
        failureReasons.push(`Expected urgency "${tc.expected.urgency}", got "${triage.urgency}"`);
      }
      const regex = new RegExp(tc.expected.rootCausePattern, 'i');
      const combinedText = `${triage.rootCauseTitle} ${triage.plainEnglishExplanation} ${(triage.affectedComponents || []).map(c => c.name).join(' ')}`;
      if (!regex.test(combinedText)) {
        carSensePassed = false;
        failureReasons.push(`Root cause output "${triage.rootCauseTitle}" did not match pattern /${tc.expected.rootCausePattern}/i`);
      }
    }
  }

  // Evaluate competitor on same criteria
  let competitorPassed = false;
  if (tc.expected.httpStatus === 400) {
    // Competitor has no PID validation
    competitorPassed = false;
  } else if (tc.expected.urgency === 'nominal') {
    competitorPassed = comp.urgencyMapped === 'nominal';
  } else {
    const regex = new RegExp(tc.expected.rootCausePattern, 'i');
    const compText = `${comp.title} ${comp.action}`;
    competitorPassed = comp.urgencyMapped === tc.expected.urgency && regex.test(compText);
  }

  results.push({
    id: tc.id,
    category: tc.category,
    description: tc.description,
    source: tc.source,
    carSense: {
      passed: carSensePassed,
      httpStatus: cs.statusCode,
      urgency: cs.body?.triage?.urgency ?? null,
      rootCauseTitle: cs.body?.triage?.rootCauseTitle ?? cs.body?.error ?? null,
      latencyMs: cs.latencyMs,
      failureReasons,
    },
    competitorObdCodeLookup: {
      passed: competitorPassed,
      urgency: comp.urgencyMapped,
      title: comp.title,
      action: comp.action,
      latencyMs: comp.latencyMs,
    },
  });
}

const total = results.length;
const csPassed = results.filter((r) => r.carSense.passed).length;
const compPassed = results.filter((r) => r.competitorObdCodeLookup.passed).length;

const byCategory = {};
for (const r of results) {
  if (!byCategory[r.category]) {
    byCategory[r.category] = { total: 0, carSensePass: 0, competitorPass: 0 };
  }
  byCategory[r.category].total += 1;
  if (r.carSense.passed) byCategory[r.category].carSensePass += 1;
  if (r.competitorObdCodeLookup.passed) byCategory[r.category].competitorPass += 1;
}

const summaryReport = {
  executedAt: new Date().toISOString(),
  totalCases: total,
  carSensePassCount: csPassed,
  carSenseFailCount: total - csPassed,
  carSensePassRatePercent: Number(((csPassed / total) * 100).toFixed(1)),
  competitorPassCount: compPassed,
  competitorPassRatePercent: Number(((compPassed / total) * 100).toFixed(1)),
  byCategory,
  results,
};

fs.writeFileSync(outFile, JSON.stringify(summaryReport, null, 2));
console.log(`Saved validation results to ${outFile}`);
console.log(`CarSense AI: ${csPassed}/${total} (${summaryReport.carSensePassRatePercent}%)`);
console.log(`Competitor (obd-code-lookup): ${compPassed}/${total} (${summaryReport.competitorPassRatePercent}%)`);
for (const r of results) {
  if (!r.carSense.passed) {
    console.log(`  ✗ [FAIL] ${r.id} (${r.category}): ${r.carSense.failureReasons.join(' | ')}`);
  }
}
