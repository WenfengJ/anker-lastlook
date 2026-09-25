# LastLook 工程开发总规格

## 1. 目标

完成一个可本地运行、可演示的 LastLook 前端 + 后台项目，用于展示“出门后确认灶台是否关闭”的最小产品闭环。

首版只服务一个场景：

用户离家后，系统触发一次灶台检查，模拟 eufy 摄像头转向灶台预设位并拍照，将当前照片与“全关”基准照片进行比对，生成“已确认 / 无法确认 / 异常”结果卡片，并展示证据照片。

## 2. MVP 边界

### 2.1 必须实现

- 灶台“全关”基准照片设置。
- 一键触发或模拟离家触发检查。
- 检查中状态展示。
- 三种检查结果展示：
  - 已确认：旋钮与基准照片一致。
  - 无法确认：遮挡、光线不足或画面不可判断。
  - 异常：旋钮明显偏离基准状态。
- 当前照片和基准照片展示。
- Demo 场景切换，保证现场可控演示。
- 基础设备状态展示：
  - 摄像头在线。
  - 灶台预设位可用。
  - 补光/夜视可用。
  - 隐私区已设置。

### 2.2 不做

- 不做完整 eufy App。
- 不做宠物、门卫、老人看护等其他赛题方向。
- 不做真实账号体系、团队管理、计费订阅。
- 不做保险合作后台。
- 不做多家庭、多房间、多摄像头管理。
- 不承诺真实 eufy SDK 已接入。
- 不依赖泛化物体识别作为核心判断。

## 3. 技术栈假设

当前项目目录为空，建议采用轻量单仓结构。

### 3.1 推荐技术栈

- 前端：React + Vite + TypeScript
- 样式：CSS Modules 或普通 CSS
- 后台：Node.js + Express + TypeScript
- 数据存储：内存数据 + 本地 JSON 文件，可选
- 图片素材：项目内静态资源
- 本地开发：前端和后台分端口运行

### 3.2 选择理由

- 开发速度快。
- 适合黑客松 Demo。
- 前端状态和后台接口容易模拟。
- 后续可替换真实设备接入，不影响页面结构。

### 3.3 建议目录

```text
apps/
  web/
    src/
      pages/
      components/
      api/
      styles/
  api/
    src/
      routes/
      services/
      data/
      types/
assets/
  demo/
    baseline/
    current/
docs/
```

## 4. 系统模块

| 模块 | 位置 | 职责 |
| --- | --- | --- |
| 前端 App | `apps/web` | 展示检查流程、结果卡片、证据照片和设置页 |
| 后台 API | `apps/api` | 提供检查、基准照片、设备状态和 Demo 场景接口 |
| 检查引擎 | `apps/api/src/services` | 根据当前 Demo 场景生成检查结果 |
| 设备模拟器 | `apps/api/src/services` | 模拟摄像头、预设位、补光、隐私区和离家触发 |
| 图片素材库 | `assets/demo` | 存放基准照片和三类当前照片 |
| 本地数据层 | `apps/api/src/data` | 保存基准照片、检查记录和 Demo 场景 |

## 5. 前端页面清单

### 5.1 首页 / 今日确认状态

用途：

- 展示当前家庭安全确认状态。
- 提供“开始检查”入口。
- 展示摄像头和隐私状态。

核心内容：

- LastLook 状态摘要。
- 最近一次检查结果。
- “开始出门检查”按钮。
- 当前 Demo 场景选择入口，可放在开发模式区域。

### 5.2 检查中页面

用途：

- 展示检查流程正在运行。

核心内容：

- 检查步骤：
  - 检测离家状态。
  - 摄像头转到灶台预设位。
  - 拍摄当前照片。
  - 对比基准照片。
  - 生成结果。
- 当前步骤高亮。
- 预计完成时间。

### 5.3 检查结果卡片页

用途：

- 展示本次检查结论和证据。

核心内容：

- 结果状态：已确认 / 无法确认 / 异常。
- 一句话结论。
- 当前照片。
- 基准照片。
- 判断依据。
- 用户操作按钮：
  - 已确认：我知道了。
  - 无法确认：查看照片、稍后复查。
  - 异常：查看照片、标记已处理。

### 5.4 灶台基准设置页

用途：

- 设置或查看“全关”基准照片。

核心内容：

- 当前基准照片。
- 灶台预设位状态。
- 旋钮关注区域说明。
- “更新基准照片”按钮。

### 5.5 检查点清单页

用途：

- 展示 MVP 中启用的检查点。

核心内容：

- 灶台检查点：启用。
- 卷发棒、门锁、燃气报警器：扩展占位，不进入首版闭环。

### 5.6 隐私与摄像头设置页

用途：

- 展示隐私保护策略和摄像头状态。

核心内容：

- 只在离家检查时转向灶台。
- 隐私区已设置。
- 本地优先处理说明。
- 不确定时直接提示无法确认。

## 6. 后台模块清单

### 6.1 Check Service

职责：

- 创建检查任务。
- 根据当前 Demo 场景生成检查步骤和结果。
- 返回检查状态、结果、证据照片和判断依据。

### 6.2 Baseline Service

职责：

- 保存和读取灶台“全关”基准照片。
- 返回基准照片元数据。

### 6.3 Device Service

职责：

- 返回摄像头、预设位、补光、隐私区等状态。
- 模拟设备在线和离家触发。

### 6.4 Demo Scenario Service

职责：

- 设置当前演示场景。
- 支持三种场景：
  - `confirmed`
  - `uncertain`
  - `abnormal`

### 6.5 Evidence Service

职责：

- 返回当前照片、基准照片和对比说明。
- 管理 Demo 图片路径。

## 7. API 清单

### 7.1 `POST /checks/start`

用途：开始一次灶台检查。

输入：

- `triggerType`：`manual` 或 `away`

输出：

- `checkRunId`
- `status`
- `steps`
- `estimatedSeconds`

### 7.2 `GET /checks/:id`

用途：获取检查状态和结果。

输出：

- `checkRunId`
- `status`：`running` / `completed` / `failed`
- `resultStatus`：`confirmed` / `uncertain` / `abnormal`
- `summary`
- `reason`
- `evidence`
- `steps`
- `createdAt`
- `completedAt`

### 7.3 `POST /baseline`

用途：保存或更新灶台基准照片。

输入：

- `imageId`
- `presetId`
- `note`

输出：

- `baselinePhoto`

### 7.4 `GET /baseline`

用途：读取当前基准照片。

输出：

- `baselinePhoto`

### 7.5 `GET /devices`

用途：获取设备状态。

输出：

- `camera`
- `preset`
- `fillLight`
- `privacyZone`
- `awayTrigger`

### 7.6 `POST /demo/scenario`

用途：切换当前演示场景。

输入：

- `scenario`：`confirmed` / `uncertain` / `abnormal`

输出：

- `activeScenario`
- `description`

## 8. 数据模型清单

### 8.1 `Device`

用途：描述摄像头和相关设备状态。

核心字段：

- `id`
- `type`
- `name`
- `status`
- `capabilities`

### 8.2 `CheckPoint`

用途：描述需要检查的对象。

核心字段：

- `id`
- `name`
- `type`
- `enabled`
- `presetId`
- `baselinePhotoId`

### 8.3 `BaselinePhoto`

用途：保存灶台“全关”基准照片。

核心字段：

- `id`
- `imageUrl`
- `presetId`
- `createdAt`
- `note`

### 8.4 `CheckRun`

用途：描述一次检查任务。

核心字段：

- `id`
- `triggerType`
- `status`
- `scenario`
- `steps`
- `resultId`
- `createdAt`
- `completedAt`

### 8.5 `CheckResult`

用途：描述一次检查的结论。

核心字段：

- `id`
- `checkRunId`
- `status`
- `summary`
- `reason`
- `confidenceLevel`
- `evidence`

### 8.6 `DemoScenario`

用途：控制演示场景。

核心字段：

- `id`
- `name`
- `resultStatus`
- `currentImageUrl`
- `summary`
- `reason`

## 9. Demo 模拟策略

### 9.1 真实实现

首版真实实现：

- 前端页面。
- 后台接口。
- 检查任务状态流转。
- 三类结果卡片。
- 基准照片和当前照片展示。
- Demo 场景切换。

### 9.2 演示模拟

首版模拟实现：

- eufy 摄像头 PTZ 转向灶台。
- 摄像头拍照。
- 补光/夜视复查。
- 离家或锁门事件。
- 图像比对结果。

### 9.3 模拟方式

- 使用预置图片表示基准照片和当前照片。
- 使用 `POST /demo/scenario` 切换三种结果。
- 使用短暂延迟模拟检查过程。
- 使用步骤状态模拟摄像头转向、拍照和比对。

### 9.4 三种场景

| 场景 | 结果 | 当前照片 | 说明 |
| --- | --- | --- | --- |
| `confirmed` | 已确认 | 旋钮与基准一致 | 可以放心出门 |
| `uncertain` | 无法确认 | 旋钮区域被锅或阴影遮挡 | 系统不假装确定 |
| `abnormal` | 异常 | 一个旋钮明显偏离基准 | 需要用户查看或处理 |

## 10. 开发优先级

### P0：必须完成

- 后台 mock API。
- 首页。
- 检查中页面。
- 检查结果卡片页。
- 三种 Demo 场景切换。
- 基准照片和当前照片展示。
- 基础设备状态展示。

### P1：建议完成

- 灶台基准设置页。
- 隐私与摄像头设置页。
- 检查点清单页。
- 检查步骤动画或进度条。
- 历史检查记录的最近一条。

### P2：可延后

- 多检查点真实管理。
- 真实设备 SDK 接入。
- 真实图像比对算法。
- 推送通知。
- 多用户或家庭成员。
- 长期历史记录。

## 11. 工程验收标准

### 11.1 核心流程

- 能打开首页。
- 能看到摄像头和隐私状态。
- 能触发一次检查。
- 能看到检查中步骤流转。
- 能展示已确认结果。
- 能展示无法确认结果。
- 能展示异常结果。
- 每种结果都能查看当前照片和基准照片。

### 11.2 工程一致性

- 前端不写死所有结果，结果应来自后台接口或统一 mock 数据。
- 接口字段命名一致。
- 页面文案不夸大系统能力。
- Demo 模拟能力在文档中可解释。

### 11.3 现场演示

- 不依赖真实 eufy 账号。
- 不依赖不可控网络状态。
- 三种结果可手动切换。
- 检查流程能在 90 秒内完整演示。

## 12. 后续文档依赖

本规格完成后，后续文档应按以下顺序细化：

1. `docs/lastlook-api-spec.md`
2. `docs/lastlook-data-model.md`
3. `docs/lastlook-frontend-spec.md`
4. `docs/lastlook-demo-implementation-plan.md`
5. `docs/lastlook-acceptance-checklist.md`

## 13. 待确认假设

- 前端先按移动端 Web App 实现，不做原生 App。
- 后台先采用 mock API，不接真实 eufy SDK。
- 图片比对结果先由 Demo 场景控制，不做真实算法。
- 离家触发先用按钮模拟。
- 补光/夜视先作为检查步骤展示，不做真实硬件控制。
