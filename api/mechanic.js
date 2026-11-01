export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { question = '', triage = {}, pids = {}, vehicleModel = 'Connected Vehicle' } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question cannot be empty.' });
    }

    const q = question.toLowerCase();
    const stft = Number(pids.stftPercent ?? 0);
    const rpm = Number(pids.rpm ?? 1500);
    const voltage = Number(pids.batteryVoltageV ?? 14.1);
    const load = Number(pids.engineLoadPercent ?? 28);

    let reply = '';

    if (q.includes('safe to drive') || q.includes('drive home') || q.includes('can i drive') || q.includes('how far')) {
      if (triage.urgency === 'critical') {
        reply = `❌ NO, you should NOT drive this vehicle right now. Your Check Engine light is in a critical state (misfire detected under ${load.toFixed(0)}% engine load). Raw unburnt gasoline is entering your exhaust stream, which can melt the catalytic converter ($1,200+ repair) within minutes. Pull over safely and call roadside assistance.`;
      } else if (triage.urgency === 'caution') {
        reply = `⚠️ You can carefully drive a short distance (e.g. up to 25–40 miles home or to a repair shop), but take immediate precautions: avoid hard acceleration, avoid highway passing, and keep RPM below 2,500. Current Short-Term Fuel Trim is ${stft > 0 ? '+' : ''}${stft.toFixed(1)}%, meaning your engine computer is actively compensating.`;
      } else {
        reply = `✅ Yes, your vehicle is completely safe to drive. All OBD-II telemetry parameters on your ${vehicleModel} are in stoichiometric balance with zero active DTC trouble codes.`;
      }
    } else if (q.includes('cost') || q.includes('price') || q.includes('how much') || q.includes('charge')) {
      const comps = triage.affectedComponents || [];
      if (comps.length === 0) {
        reply = `Zero repair costs required! Your ${vehicleModel} is operating at factory baseline with no active fault codes.`;
      } else {
        const top = comps[0];
        const totalMech = top.partCostEstimateUsd + top.laborCostEstimateUsd;
        reply = `💰 Estimated Repair Cost Breakdown for "${top.name}":\n• DIY Parts Cost: ~$${top.partCostEstimateUsd} USD\n• Professional Mechanic Total: ~$${totalMech} USD (Parts: $${top.partCostEstimateUsd} + Labor: $${top.laborCostEstimateUsd})\n• DIY Difficulty: ${top.diyDifficultyWrenches} out of 5 wrenches.`;
      }
    } else if (q.includes('how do i fix') || q.includes('diy') || q.includes('repair') || q.includes('tools')) {
      const comps = triage.affectedComponents || [];
      if (comps.length === 0) {
        reply = `No repair needed! Your telemetry shows all systems operating within nominal tolerances.`;
      } else {
        const top = comps[0];
        reply = `🔧 Step-by-Step DIY Guide for ${top.name}:\n1. ${top.replacementGuide}\n2. Estimated time: 30–60 minutes with basic hand socket tools.\n3. After replacing, click "Simulate Part Fix & Clear" to reset the ECU and initiate an OBD-II drive cycle test.`;
      }
    } else if (q.includes('warranty') || q.includes('dealer') || q.includes('emissions')) {
      reply = `📋 Emissions & Powertrain Warranty Note:\nUnder Federal EPA emissions law (Clean Air Act Sec. 207), major emissions components (ECU/ECM and Catalytic Converters) are warrantied for 8 years / 80,000 miles. High-voltage EV traction batteries carry an 8-year / 100,000-mile minimum warranty. Export your freeze-frame report before visiting the service center.`;
    } else {
      reply = `Based on live telemetry for your ${vehicleModel}:\n• Active Diagnosis: ${triage.rootCauseTitle || 'Nominal'}\n• Current Urgency: ${triage.urgencyTitle || 'Normal'}\n• Live Telemetry Snapshot: RPM ${rpm.toFixed(0)}, Fuel Trim ${stft > 0 ? '+' : ''}${stft.toFixed(1)}%, System Voltage ${voltage.toFixed(1)}V.\n• Recommendation: ${triage.driveRecommendation || 'No restrictions.'}`;
    }

    return res.status(200).json({
      status: 'ok',
      reply,
      timestamp: new Date().toLocaleTimeString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Mechanic assistant failure', details: err.message });
  }
}
