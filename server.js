const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const PORT = process.env.PORT || 4173;
const HOST = process.env.HOST || "127.0.0.1";
const publicDir = path.join(__dirname, "public");

const steps = [
  "检测离家状态",
  "转到灶台预设位",
  "拍摄当前照片",
  "对比基准照片",
  "生成结果"
];

const scenarios = {
  confirmed: {
    id: "confirmed",
    label: "已确认",
    resultStatus: "confirmed",
    summary: "灶台已确认关闭",
    reason: "旋钮位置与全关基准照片一致。可以放心出门。",
    currentImage: "confirmed",
    confidenceLevel: "high"
  },
  uncertain: {
    id: "uncertain",
    label: "无法确认",
    resultStatus: "uncertain",
    summary: "暂时无法确认灶台状态",
    reason: "旋钮区域被遮挡或画面不清。请查看照片后决定是否复查。",
    currentImage: "uncertain",
    confidenceLevel: "low"
  },
  abnormal: {
    id: "abnormal",
    label: "异常",
    resultStatus: "abnormal",
    summary: "疑似有旋钮未关闭",
    reason: "当前照片与全关基准照片不一致。请查看证据照片并处理。",
    currentImage: "abnormal",
    confidenceLevel: "medium"
  }
};

let activeScenario = "confirmed";
let lastCheck = null;

const baselinePhoto = {
  id: "baseline-stove-off",
  presetId: "stove-preset-01",
  imageType: "baseline",
  createdAt: "2026-09-25T08:10:00.000Z",
  note: "所有旋钮处于关闭状态"
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function createCheck(triggerType = "manual") {
  const scenario = scenarios[activeScenario];
  const now = new Date();
  const completedAt = new Date(now.getTime() + 3000);

  lastCheck = {
    checkRunId: randomUUID(),
    triggerType,
    status: "completed",
    resultStatus: scenario.resultStatus,
    summary: scenario.summary,
    reason: scenario.reason,
    confidenceLevel: scenario.confidenceLevel,
    createdAt: now.toISOString(),
    completedAt: completedAt.toISOString(),
    steps: steps.map((name) => ({ name, status: "completed" })),
    evidence: {
      currentPhoto: {
        id: `current-${scenario.id}`,
        title: "当前照片",
        imageType: scenario.currentImage
      },
      baselinePhoto: {
        id: baselinePhoto.id,
        title: "全关基准照片",
        imageType: baselinePhoto.imageType
      }
    }
  };

  return lastCheck;
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "LastLook API" });
    return;
  }

  if (req.method === "GET" && pathname === "/api/devices") {
    sendJson(res, 200, {
      camera: { id: "eufy-indoor-01", name: "eufy 室内云台摄像头", status: "online" },
      preset: { id: "stove-preset-01", name: "灶台预设位", status: "ready" },
      fillLight: { status: "ready", label: "补光/夜视可用" },
      privacyZone: { status: "enabled", label: "隐私区已设置" },
      awayTrigger: { status: "simulated", label: "离家触发由 Demo 模拟" }
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/baseline") {
    sendJson(res, 200, { baselinePhoto });
    return;
  }

  if (req.method === "POST" && pathname === "/api/baseline") {
    const body = await readJson(req);
    sendJson(res, 200, {
      baselinePhoto: {
        ...baselinePhoto,
        note: body.note || baselinePhoto.note,
        updatedAt: new Date().toISOString()
      }
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/demo/scenario") {
    sendJson(res, 200, { activeScenario, scenario: scenarios[activeScenario] });
    return;
  }

  if (req.method === "POST" && pathname === "/api/demo/scenario") {
    const body = await readJson(req);
    if (!scenarios[body.scenario]) {
      sendJson(res, 400, { error: "UNKNOWN_SCENARIO" });
      return;
    }
    activeScenario = body.scenario;
    sendJson(res, 200, { activeScenario, scenario: scenarios[activeScenario] });
    return;
  }

  if (req.method === "POST" && pathname === "/api/checks/start") {
    const body = await readJson(req);
    const check = createCheck(body.triggerType || "manual");
    sendJson(res, 200, {
      checkRunId: check.checkRunId,
      status: "running",
      steps: steps.map((name, index) => ({
        name,
        status: index === 0 ? "running" : "waiting"
      })),
      estimatedSeconds: 3
    });
    return;
  }

  const checkMatch = pathname.match(/^\/api\/checks\/([^/]+)$/);
  if (req.method === "GET" && checkMatch) {
    if (!lastCheck || lastCheck.checkRunId !== checkMatch[1]) {
      sendJson(res, 404, { error: "CHECK_NOT_FOUND" });
      return;
    }
    sendJson(res, 200, lastCheck);
    return;
  }

  sendJson(res, 404, { error: "NOT_FOUND" });
}

function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(publicDir, requested));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".svg": "image/svg+xml"
    };
    res.writeHead(200, { "content-type": contentTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url.pathname);
    return;
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`LastLook demo running at http://${HOST}:${PORT}`);
});
