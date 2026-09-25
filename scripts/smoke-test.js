const assert = require("assert");

const baseUrl = process.env.LASTLOOK_BASE_URL || "http://127.0.0.1:4173";

const scenarios = [
  ["confirmed", "confirmed", "灶台已确认关闭"],
  ["uncertain", "uncertain", "暂时无法确认灶台状态"],
  ["abnormal", "abnormal", "疑似有旋钮未关闭"]
];

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "content-type": "application/json" },
    ...options
  });

  assert(response.ok, `${path} returned ${response.status}`);
  return response.json();
}

async function run() {
  const health = await api("/api/health");
  assert.strictEqual(health.ok, true);

  const devices = await api("/api/devices");
  assert.strictEqual(devices.camera.status, "online");
  assert.strictEqual(devices.privacyZone.status, "enabled");

  for (const [scenario, expectedStatus, expectedSummary] of scenarios) {
    const active = await api("/api/demo/scenario", {
      method: "POST",
      body: JSON.stringify({ scenario })
    });
    assert.strictEqual(active.activeScenario, scenario);

    const started = await api("/api/checks/start", {
      method: "POST",
      body: JSON.stringify({ triggerType: "manual" })
    });
    assert.ok(started.checkRunId);
    assert.strictEqual(started.status, "running");

    const result = await api(`/api/checks/${started.checkRunId}`);
    assert.strictEqual(result.resultStatus, expectedStatus);
    assert.strictEqual(result.summary, expectedSummary);
    assert.ok(result.evidence.currentPhoto.imageType);
    assert.ok(result.evidence.baselinePhoto.imageType);
  }

  console.log("LastLook smoke test passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
