# LastLook Demo

LastLook 是一个 eufy 摄像头出门安全确认 Demo。当前版本聚焦一个 MVP 场景：用户出门后确认灶台是否已经关闭。

## 启动

```bash
npm start
```

默认地址：

```text
http://127.0.0.1:4173
```

线上演示地址：

```text
https://13-57-166-217.sslip.io/lastlook/
```

线上 API：

```text
https://13-57-166-217.sslip.io/lastlook-api/health
```

## 当前实现

- 前端静态页面：`public/index.html`
- 前端交互：`public/app.js`
- 样式：`public/styles.css`
- 后台 API：`server.js`

## Demo 场景

页面中可以切换三种演示场景：

- 已确认：灶台旋钮与基准照片一致。
- 无法确认：旋钮区域被遮挡，系统不假装确定。
- 异常：疑似有旋钮未关闭。

## API

- `GET /api/health`
- `GET /api/devices`
- `GET /api/baseline`
- `POST /api/baseline`
- `POST /api/demo/scenario`
- `POST /api/checks/start`
- `GET /api/checks/:id`

## 说明

当前版本使用模拟设备和预置场景，不依赖真实 eufy SDK。目标是稳定展示产品闭环：开始检查、摄像头检查步骤、结果卡片、证据照片。
