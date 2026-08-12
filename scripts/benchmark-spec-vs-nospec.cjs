const { performance } = require('node:perf_hooks');

function makeData(count) {
  const now = new Date('2026-08-12T09:00:00.000Z');
  const contracts = [];
  for (let i = 0; i < count; i += 1) {
    const isAnnual = i % 2 === 0;
    const cadence = isAnnual ? 'annual' : 'monthly';
    const lead = isAnnual ? 30 : 7;

    // 60% exact threshold, 20% catch-up, 20% ineligible
    const bucket = i % 10;
    let offsetDays;
    if (bucket < 6) {
      offsetDays = lead;
    } else if (bucket < 8) {
      offsetDays = lead - 2;
    } else {
      offsetDays = lead + 5;
    }

    const expiresAtUtc = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

    // 15% renewed effective, 10% renewed future, rest active
    let renewalStatus = 'active';
    let renewalEffectiveAtUtc = null;
    if (i % 20 < 3) {
      renewalStatus = 'renewed';
      renewalEffectiveAtUtc = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (i % 20 < 5) {
      renewalStatus = 'renewed';
      renewalEffectiveAtUtc = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    contracts.push({
      id: `c-${i}`,
      termId: `c-${i}-2026`,
      title: `Contract ${i}`,
      cadence,
      owner: { id: `o-${i}`, name: `Owner ${i}`, email: `o${i}@ex.com` },
      expiresAtUtc,
      renewalStatus,
      renewalEffectiveAtUtc,
      reminderHistory: []
    });
  }

  return { now, contracts };
}

function oldNoSpecRun(contracts, runAt, sentSet) {
  // Mimics pre-spec logic: reminderDays=[30,14,7,1], 24h lookahead, no cadence/renewal enforcement.
  const reminderDays = [30, 14, 7, 1];
  const reminderWindowEnd = new Date(runAt.getTime() + 24 * 60 * 60 * 1000);
  let sent = 0;
  const sends = [];

  for (const c of contracts) {
    for (const d of reminderDays) {
      const reminderAt = new Date(c.expiresAtUtc.getTime());
      reminderAt.setUTCDate(reminderAt.getUTCDate() - d);
      const inWindow = reminderAt >= runAt && reminderAt < reminderWindowEnd;
      if (!inWindow) continue;

      const eventKey = `${c.termId}:${d}`;
      const wasSent = sentSet.has(eventKey);
      if (wasSent) continue;
      sentSet.add(eventKey);
      sent += 1;
      sends.push({ contract: c, leadTimeDays: d, eventKey });
    }
  }

  return { sent, sends };
}

function newWithSpecRun(contracts, runAt, sentSet) {
  // Mimics spec-driven logic.
  let sent = 0;
  const sends = [];
  for (const c of contracts) {
    const lead = c.cadence === 'annual' ? 30 : c.cadence === 'monthly' ? 7 : null;
    if (lead == null) continue;

    if (c.renewalStatus === 'renewed' && c.renewalEffectiveAtUtc && runAt >= c.renewalEffectiveAtUtc) {
      continue;
    }

    const threshold = new Date(c.expiresAtUtc.getTime());
    threshold.setUTCDate(threshold.getUTCDate() - lead);

    if (runAt >= c.expiresAtUtc) continue;

    const thresholdHit = runAt.getTime() === threshold.getTime();
    const catchUp = runAt > threshold && runAt < c.expiresAtUtc;
    if (!thresholdHit && !catchUp) continue;

    const eventKey = `${c.termId}:${lead}`;
    if (sentSet.has(eventKey)) continue;
    sentSet.add(eventKey);

    sent += 1;
    sends.push({ contract: c, leadTimeDays: lead, eventKey });
  }

  return { sent, sends };
}

function ruleViolations(sends, runAt) {
  let wrongLead = 0;
  let renewedSent = 0;

  for (const s of sends) {
    const expectedLead = s.contract.cadence === 'annual' ? 30 : 7;
    if (s.leadTimeDays !== expectedLead) wrongLead += 1;

    const renewedEffective =
      s.contract.renewalStatus === 'renewed' &&
      s.contract.renewalEffectiveAtUtc &&
      runAt >= s.contract.renewalEffectiveAtUtc;

    if (renewedEffective) renewedSent += 1;
  }

  return { wrongLead, renewedSent };
}

function runBenchmark(count) {
  const { now, contracts } = makeData(count);

  const oldSet = new Set();
  const newSet = new Set();

  // First run
  const t0 = performance.now();
  const old1 = oldNoSpecRun(contracts, now, oldSet);
  const t1 = performance.now();
  const new1 = newWithSpecRun(contracts, now, newSet);
  const t2 = performance.now();

  // Repeat same day to test duplicate handling persistence within strategy
  const old2 = oldNoSpecRun(contracts, now, oldSet);
  const t3 = performance.now();
  const new2 = newWithSpecRun(contracts, now, newSet);
  const t4 = performance.now();

  const oldViol = ruleViolations(old1.sends, now);
  const newViol = ruleViolations(new1.sends, now);

  return {
    dataset: count,
    old: {
      run1Ms: +(t1 - t0).toFixed(2),
      run2Ms: +(t3 - t2).toFixed(2),
      sentRun1: old1.sent,
      sentRun2: old2.sent,
      wrongLead: oldViol.wrongLead,
      renewedSent: oldViol.renewedSent
    },
    withSpec: {
      run1Ms: +(t2 - t1).toFixed(2),
      run2Ms: +(t4 - t3).toFixed(2),
      sentRun1: new1.sent,
      sentRun2: new2.sent,
      wrongLead: newViol.wrongLead,
      renewedSent: newViol.renewedSent
    }
  };
}

for (const size of [1000, 10000, 100000]) {
  const r = runBenchmark(size);
  console.log('\n=== Benchmark size:', r.dataset, '===');
  console.table([
    {
      impl: 'sin-spec',
      run1_ms: r.old.run1Ms,
      run2_ms: r.old.run2Ms,
      sent_run1: r.old.sentRun1,
      sent_run2_same_day: r.old.sentRun2,
      wrong_lead_time: r.old.wrongLead,
      renewed_sent: r.old.renewedSent
    },
    {
      impl: 'con-spec',
      run1_ms: r.withSpec.run1Ms,
      run2_ms: r.withSpec.run2Ms,
      sent_run1: r.withSpec.sentRun1,
      sent_run2_same_day: r.withSpec.sentRun2,
      wrong_lead_time: r.withSpec.wrongLead,
      renewed_sent: r.withSpec.renewedSent
    }
  ]);
}
