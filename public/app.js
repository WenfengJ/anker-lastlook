const state = {
  scenario: "confirmed",
  lastCheckId: null
};

const scenarioButtons = [...document.querySelectorAll(".scenario")];
const startButton = document.querySelector("#startCheck");
const saveBaselineButton = document.querySelector("#saveBaseline");
const checkingPanel = document.querySelector("#checkingPanel");
const resultPanel = document.querySelector("#resultPanel");
const stepsEl = document.querySelector("#steps");
const resultTag = document.querySelector("#resultTag");
const resultTitle = document.querySelector("#resultTitle");
const resultReason = document.querySelector("#resultReason");
const currentPhoto = document.querySelector("#currentPhoto");
const reasonList = document.querySelector("#reasonList");
const resultActions = document.querySelector("#resultActions");
const todayTitle = document.querySelector("#todayTitle");
const todayCopy = document.querySelector("#todayCopy");
const deviceSummary = document.querySelector("#deviceSummary");
const deviceGrid = document.querySelector("#deviceGrid");
const baselineMeta = document.querySelector("#baselineMeta");

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { "content-type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function setScenarioButton(scenario) {
  scenarioButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.scenario === scenario);
  });
}

function renderSteps(steps, activeIndex = -1) {
  stepsEl.innerHTML = "";
  steps.forEach((step, index) => {
    const item = document.createElement("li");
    const status = index < activeIndex ? "done" : index === activeIndex ? "running" : "waiting";
    item.className = status;
    item.innerHTML = `<span class="step-dot">${status === "done" ? "✓" : index + 1}</span><span>${step.name || step}</span>`;
    stepsEl.appendChild(item);
  });
}

function setStoveType(element, type) {
  element.className = `stove ${type}`;
  element.innerHTML = `
    <span class="burner burner-a"></span>
    <span class="burner burner-b"></span>
    <span class="burner burner-c"></span>
    <span class="burner burner-d"></span>
    <span class="knob knob-a off"></span>
    <span class="knob knob-b off"></span>
    <span class="knob knob-c off"></span>
  `;
}

function getReasons(result) {
  if (result.resultStatus === "confirmed") {
    return ["灶台预设位一致", "旋钮区域与基准照片一致", "摄像头工作正常"];
  }
  if (result.resultStatus === "uncertain") {
    return ["摄像头已转到灶台预设位", "当前照片中旋钮区域不可见", "系统没有给出肯定结论"];
  }
  return ["当前照片中有旋钮偏离基准位置", "灶台预设位一致", "请确认后再离开"];
}

function getActions(result) {
  if (result.resultStatus === "confirmed") {
    return [{ label: "我知道了", type: "primary", action: resetToHome }, { label: "查看照片", type: "ghost" }];
  }
  if (result.resultStatus === "uncertain") {
    return [{ label: "查看照片", type: "primary" }, { label: "稍后复查", type: "ghost", action: startCheck }, { label: "返回首页", type: "ghost", action: resetToHome }];
  }
  return [{ label: "查看照片", type: "primary" }, { label: "标记已处理", type: "ghost", action: resetToHome }, { label: "返回首页", type: "ghost", action: resetToHome }];
}

function renderResult(result) {
  checkingPanel.classList.add("hidden");
  resultPanel.classList.remove("confirmed-theme", "uncertain-theme", "abnormal-theme");
  resultPanel.classList.add(`${result.resultStatus}-theme`);
  resultPanel.classList.remove("hidden");

  resultTag.textContent = result.resultStatus === "confirmed" ? "已确认" : result.resultStatus === "uncertain" ? "无法确认" : "异常";
  resultTitle.textContent = result.summary;
  resultReason.textContent = result.reason;
  setStoveType(currentPhoto, result.evidence.currentPhoto.imageType);

  reasonList.innerHTML = "";
  getReasons(result).forEach((reason) => {
    const item = document.createElement("div");
    item.className = "reason-item";
    item.textContent = reason;
    reasonList.appendChild(item);
  });

  resultActions.innerHTML = "";
  getActions(result).forEach((action) => {
    const button = document.createElement("button");
    button.className = action.type;
    button.textContent = action.label;
    if (action.action) {
      button.addEventListener("click", action.action);
    }
    resultActions.appendChild(button);
  });

  todayTitle.textContent = result.summary;
  todayCopy.textContent = result.reason;
}

function resetToHome() {
  checkingPanel.classList.add("hidden");
  resultPanel.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function setScenario(scenario) {
  state.scenario = scenario;
  setScenarioButton(scenario);
  await api("/demo/scenario", {
    method: "POST",
    body: JSON.stringify({ scenario })
  });
}

async function startCheck() {
  checkingPanel.classList.remove("hidden");
  resultPanel.classList.add("hidden");
  checkingPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  const started = await api("/checks/start", {
    method: "POST",
    body: JSON.stringify({ triggerType: "manual" })
  });

  state.lastCheckId = started.checkRunId;
  const stepNames = started.steps.map((step) => step.name);

  for (let index = 0; index < stepNames.length; index += 1) {
    renderSteps(stepNames, index);
    await new Promise((resolve) => setTimeout(resolve, 420));
  }
  renderSteps(stepNames, stepNames.length);

  const result = await api(`/checks/${state.lastCheckId}`);
  renderResult(result);
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadDevices() {
  const devices = await api("/devices");
  deviceSummary.textContent = `${devices.camera.status === "online" ? "摄像头在线" : "摄像头离线"} · ${devices.privacyZone.label}`;

  const items = [
    devices.camera.name,
    devices.preset.name,
    devices.fillLight.label,
    devices.privacyZone.label
  ];

  deviceGrid.innerHTML = "";
  items.forEach((label) => {
    const item = document.createElement("div");
    item.className = "status-item";
    item.textContent = label;
    deviceGrid.appendChild(item);
  });
}

async function loadBaseline() {
  const data = await api("/baseline");
  const created = new Date(data.baselinePhoto.createdAt).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  baselineMeta.textContent = `创建时间 ${created} · ${data.baselinePhoto.note}`;
}

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => setScenario(button.dataset.scenario));
});

startButton.addEventListener("click", startCheck);
saveBaselineButton.addEventListener("click", async () => {
  await api("/baseline", {
    method: "POST",
    body: JSON.stringify({ note: "所有旋钮处于关闭状态" })
  });
  await loadBaseline();
});

setStoveType(document.querySelector(".stove.baseline"), "baseline");
setStoveType(document.querySelector(".evidence-grid .stove.baseline"), "baseline");
loadDevices();
loadBaseline();
setScenario("confirmed");
