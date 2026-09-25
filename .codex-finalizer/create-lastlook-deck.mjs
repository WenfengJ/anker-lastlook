import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const {
  SKILL_DIR,
  TMP_DIR,
  FINAL_PPTX,
  RUNTIME_PYTHON,
  WORKSPACE_DIR
} = process.env;

if (!SKILL_DIR || !TMP_DIR || !FINAL_PPTX || !RUNTIME_PYTHON || !WORKSPACE_DIR) {
  throw new Error("Missing required environment variables");
}

const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href
);

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });

const font = resolvePresentationFont({ fontFamily: "Arial" });
const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });

const C = {
  ink: "#17201D",
  muted: "#5F6D66",
  green: "#1F7A5C",
  lightGreen: "#DFF4EA",
  mint: "#F2FAF6",
  amber: "#D9822B",
  red: "#B9413B",
  blue: "#2F6F8F",
  paper: "#FBFAF6",
  line: "#D8E2DC",
  white: "#FFFFFF",
  dark: "#10231D"
};

const img = async (name) => fs.readFile(path.join(WORKSPACE_DIR, "docs/submission-preselection/assets", name));

function box(slide, x, y, w, h, fill = C.white, line = "none", radius = "roundRect") {
  return slide.shapes.add({
    geometry: radius,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: line === "none" ? { fill: "none", width: 0 } : { fill: line, width: 1 }
  });
}

function text(slide, value, x, y, w, h, style = {}) {
  const s = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 }
  });
  s.text = value;
  s.text.style = {
    typeface: font,
    fontSize: style.size ?? 24,
    bold: style.bold ?? false,
    color: style.color ?? C.ink,
    autoFit: "shrinkText",
    alignment: style.align ?? "left",
    verticalAlignment: style.valign ?? "top",
    lineSpacing: style.lineSpacing ?? 1.12
  };
  return s;
}

function footer(slide, n) {
  text(slide, `LastLook  |  ${n}/8`, 64, 672, 220, 24, { size: 15, color: C.muted });
}

function title(slide, value, sub, n) {
  text(slide, value, 64, 48, 760, 60, { size: 36, bold: true, color: C.ink });
  if (sub) text(slide, sub, 66, 108, 820, 44, { size: 18, color: C.muted });
  footer(slide, n);
}

function metric(slide, label, value, x, y, w, color = C.green) {
  box(slide, x, y, w, 104, C.white, C.line);
  text(slide, value, x + 22, y + 18, w - 44, 36, { size: 25, bold: true, color });
  text(slide, label, x + 22, y + 58, w - 44, 34, { size: 16, color: C.muted });
}

function bullet(slide, lines, x, y, w, gap = 54) {
  lines.forEach((item, i) => {
    const yy = y + i * gap;
    box(slide, x, yy + 8, 10, 10, C.green, "none", "ellipse");
    text(slide, item, x + 26, yy, w - 26, 42, { size: 20, color: C.ink });
  });
}

function pill(slide, label, x, y, w, color = C.green) {
  const p = box(slide, x, y, w, 36, `${color}1A`, "none", "roundRect");
  p.text = label;
  p.text.style = { typeface: font, fontSize: 15, bold: true, color, alignment: "center", verticalAlignment: "middle", autoFit: "shrinkText" };
}

// 1
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  text(slide, "LastLook", 72, 82, 520, 72, { size: 56, bold: true, color: C.dark });
  text(slide, "出门之后，eufy 摄像头替你再看最后一眼", 76, 166, 570, 72, { size: 27, color: C.ink });
  text(slide, "一张带证据的确认卡片，回答灶台是否已经关闭。", 78, 250, 520, 56, { size: 20, color: C.muted });
  pill(slide, "MVP：灶台全关确认", 78, 332, 190, C.green);
  pill(slide, "线上 Demo 可运行", 286, 332, 170, C.blue);
  slide.images.add({
    blob: await img("lastlook-home.png"),
    contentType: "image/png",
    alt: "LastLook demo home screen",
    fit: "cover",
    position: { left: 690, top: 54, width: 500, height: 610 },
    crop: { left: 0.06, top: 0.01, right: 0.05, bottom: 0.28 },
    geometry: "roundRect",
    borderRadius: 18
  });
  text(slide, "https://13-57-166-217.sslip.io/lastlook/", 78, 616, 520, 28, { size: 16, color: C.muted });
  footer(slide, 1);
  slide.speakerNotes.textFrame.setText("Source: LastLook product docs and live demo screenshot captured from the deployed URL.");
}

// 2
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "出门后的不确定", "用户需要外部证据，而不是更多提醒", 2);
  text(slide, "“灶台到底关了没有？”", 88, 188, 540, 72, { size: 38, bold: true, color: C.dark });
  bullet(slide, [
    "问题不一定来自忘记，而是离家后无法确认",
    "普通摄像头要求用户自己翻画面、自己判断",
    "灶台场景明确，风险感强，也容易现场演示"
  ], 94, 300, 520, 72);
  metric(slide, "首版只处理一个判断", "全关状态", 720, 182, 330, C.green);
  metric(slide, "用户最终看到的结果", "证据卡片", 720, 322, 330, C.blue);
  metric(slide, "出现遮挡或过暗", "无法确认", 720, 462, 330, C.amber);
  slide.speakerNotes.textFrame.setText("Pain point and MVP scope are based on docs/lastlook-product-final.md.");
}

// 3
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "出门检查闭环", "eufy 摄像头参与完整流程，而不是只提供录像", 3);
  const steps = [
    ["基准照片", "保存灶台全关状态"],
    ["离家触发", "手动或事件触发检查"],
    ["PTZ 预设位", "回到灶台视角"],
    ["当前照片", "拍摄最新状态"],
    ["照片比对", "固定区域判断"],
    ["结果卡片", "已确认、无法确认、异常"]
  ];
  steps.forEach(([head, body], i) => {
    const x = 80 + (i % 3) * 370;
    const y = 184 + Math.floor(i / 3) * 160;
    box(slide, x, y, 300, 108, C.white, C.line);
    text(slide, `${i + 1}`, x + 22, y + 18, 42, 38, { size: 28, bold: true, color: C.green });
    text(slide, head, x + 78, y + 20, 190, 30, { size: 23, bold: true });
    text(slide, body, x + 78, y + 58, 188, 28, { size: 16, color: C.muted });
  });
  text(slide, "使用能力：PTZ 预设位、拍照、补光/夜视、隐私区、设备状态", 104, 566, 980, 38, { size: 22, bold: true, color: C.dark, align: "center" });
  slide.speakerNotes.textFrame.setText("Flow and device capability mapping are based on docs/lastlook-product-final.md and the implemented demo APIs.");
}

// 4
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "只给三种结果", "不确定时直接说明原因", 4);
  const cards = [
    ["lastlook-confirmed.png", "已确认", "旋钮与基准照片一致", C.green],
    ["lastlook-uncertain.png", "无法确认", "遮挡、过暗或画面不清", C.amber],
    ["lastlook-abnormal.png", "异常", "当前状态偏离基准照片", C.red]
  ];
  for (let i = 0; i < cards.length; i++) {
    const [file, head, body, color] = cards[i];
    const x = 64 + i * 405;
    slide.images.add({
      blob: await img(file),
      contentType: "image/png",
      alt: `${head} result screenshot`,
      fit: "cover",
      position: { left: x, top: 174, width: 350, height: 360 },
      crop: { left: 0.2, top: 0.22, right: 0.2, bottom: 0.06 },
      geometry: "roundRect",
      borderRadius: 14
    });
    text(slide, head, x + 8, 552, 160, 34, { size: 24, bold: true, color });
    text(slide, body, x + 8, 590, 300, 34, { size: 17, color: C.muted });
  }
  slide.speakerNotes.textFrame.setText("Screenshots captured from the deployed LastLook demo.");
}

// 5
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "可运行 Demo", "前端、后台和三种检查场景已经完成", 5);
  slide.images.add({
    blob: await img("lastlook-home.png"),
    contentType: "image/png",
    alt: "LastLook live demo screenshot",
    fit: "cover",
    position: { left: 70, top: 160, width: 570, height: 430 },
    crop: { left: 0, top: 0.02, right: 0.44, bottom: 0.28 },
    geometry: "roundRect",
    borderRadius: 16
  });
  const modules = [
    ["前端体验", "手机 App 样式、检查流程、结果卡片"],
    ["后台 API", "设备状态、场景切换、检查启动、结果查询"],
    ["设备模拟器", "摄像头在线、预设位、补光、隐私区"],
    ["检查引擎", "按场景返回证据照片和判断结果"]
  ];
  modules.forEach(([h, b], i) => {
    const y = 166 + i * 100;
    box(slide, 720, y, 420, 74, C.white, C.line);
    text(slide, h, 744, y + 12, 140, 26, { size: 20, bold: true, color: C.green });
    text(slide, b, 744, y + 42, 350, 24, { size: 15, color: C.muted });
  });
  text(slide, "Demo 链接：13-57-166-217.sslip.io/lastlook/", 720, 596, 440, 30, { size: 17, color: C.muted });
  slide.speakerNotes.textFrame.setText("Implementation source: README.md, server.js, public/app.js and deployed demo.");
}

// 6
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "先服务会反复确认的人", "首版目标用户要窄，场景要真实", 6);
  const personas = [
    ["赶时间出门的家庭用户", "早上做饭后离家，容易反复想灶台是否关闭"],
    ["为父母配置设备的成年子女", "希望降低厨房风险，又不想持续查看生活画面"],
    ["城市公寓和排屋家庭", "已有或愿意购买室内云台摄像头，接受手机确认卡片"]
  ];
  personas.forEach(([h, b], i) => {
    const y = 178 + i * 132;
    box(slide, 120, y, 940, 92, i === 1 ? C.mint : C.white, C.line);
    text(slide, `0${i + 1}`, 150, y + 22, 60, 40, { size: 26, bold: true, color: C.green });
    text(slide, h, 235, y + 18, 310, 32, { size: 24, bold: true });
    text(slide, b, 235, y + 54, 670, 26, { size: 17, color: C.muted });
  });
  slide.speakerNotes.textFrame.setText("Target users are based on docs/lastlook-product-final.md.");
}

// 7
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "作为 eufy 摄像头的安全功能", "更轻的路径是复用已有摄像头能力", 7);
  const rows = [
    ["普通摄像头", "远程查看", "用户仍需自己判断画面"],
    ["灶台硬件改造", "直接控制", "安装成本和改造门槛更高"],
    ["LastLook", "证据确认", "用室内云台摄像头完成出门检查"]
  ];
  rows.forEach((r, i) => {
    const y = 194 + i * 98;
    box(slide, 120, y, 940, 72, i === 2 ? C.lightGreen : C.white, C.line);
    text(slide, r[0], 150, y + 22, 210, 28, { size: 21, bold: true, color: i === 2 ? C.green : C.ink });
    text(slide, r[1], 430, y + 22, 190, 28, { size: 19, bold: true, color: C.blue });
    text(slide, r[2], 665, y + 22, 350, 28, { size: 17, color: C.muted });
  });
  text(slide, "商业路径：先提升室内云台摄像头购买理由，再扩展到智能插座、门锁和燃气报警器。", 122, 540, 940, 50, { size: 23, bold: true, color: C.dark, align: "center" });
  slide.speakerNotes.textFrame.setText("Commercial positioning based on docs/lastlook-pitch-deck-outline.md and current product scope.");
}

// 8
{
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  title(slide, "验证用户是否还会看这张卡片", "下一步用真实设备和小样本测试收口", 8);
  const roadmap = [
    ["当前", "本地和线上 Demo", "三种结果可稳定演示"],
    ["下一步", "真实 SDK 接入", "替换摄像头控制、拍照和设备状态接口"],
    ["验证", "小样本使用测试", "检查耗时、无法确认率、持续查看意愿"]
  ];
  roadmap.forEach(([phase, h, b], i) => {
    const x = 92 + i * 370;
    box(slide, x, 210, 300, 210, C.white, C.line);
    pill(slide, phase, x + 28, 238, 110, i === 0 ? C.green : i === 1 ? C.blue : C.amber);
    text(slide, h, x + 28, 292, 230, 34, { size: 24, bold: true });
    text(slide, b, x + 28, 346, 230, 58, { size: 17, color: C.muted });
  });
  text(slide, "目标：把“我到底关了没有”的不确定，变成一张可以放心离开的证据。", 148, 514, 980, 60, { size: 28, bold: true, color: C.dark, align: "center" });
  slide.speakerNotes.textFrame.setText("Next-step plan based on docs/lastlook-3min-video-script.md and demo validation.");
}

const stagingDir = path.join(WORKSPACE_DIR, ".codex-finalizer");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "lastlook-candidate.pptx");
await (await PresentationFile.exportPptx(deck)).save(candidatePath);

const result = await finalizePresentation({
  explicitTotalSlideCount: 8,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir: WORKSPACE_DIR,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "12192000,6858000",
    "--validate-heading-fit"
  ],
  fontPolicy: {
    basis: "design",
    families: [font]
  },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "lastlook-pitch-deck.validation.json")
});

const montage = await deck.export({ format: "webp", montage: true, scale: 0.45 });
await fs.writeFile(path.join(stagingDir, "lastlook-pitch-deck-montage.webp"), new Uint8Array(await montage.arrayBuffer()));

console.log(JSON.stringify({ finalPath: FINAL_PPTX, candidatePath, result }, null, 2));
