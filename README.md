# 手语即时通

全离线中文手语识别助手，让沟通无障碍。

## 项目简介

“手语即时通”是一款面向听障人群的实时中文手语识别应用。借助计算机视觉与人工智能技术，
将手语动作转化为可理解的信息，降低听障人士与健听人群之间的沟通门槛。

## 主要功能

- 基于 Google MediaPipe（Hands / Pose / Holistic）模型，实时检测手部关键点与姿态。
- 通过摄像头采集手势，进行中文手语识别。
- 全离线推理：模型在本地设备运行，无需联网，保护隐私、低延迟。
- 提供 Web 端（PWA，可安装）与 Android 端（APK）两种使用方式。

## 目录说明

| 文件 / 目录 | 说明 |
| --- | --- |
| `index.html` | Web 应用入口 |
| `assets/` | 前端构建资源（JS / CSS） |
| `mediapipe/` | 手语识别模型文件（`.tflite`） |
| `shouyu-app-v1.0.apk` | Android 安装包 |
| `manifest.webmanifest` | PWA 配置文件 |

> 说明：MediaPipe 的 wasm 运行环境通过 jsDelivr CDN 加载，其余模型与前端资源均在本仓库内。

## 使用方式

- **Web 端**：使用支持摄像头的浏览器，通过 `http/https` 地址打开 `index.html`
  （注意：不能直接双击用 `file://` 方式打开，否则浏览器安全策略会阻止模型加载）。
- **Android 端**：安装 `shouyu-app-v1.0.apk` 后使用。

## 部署

本仓库为静态网站，可托管到任意静态服务器，或启用 GitHub Pages / Netlify 直接发布。
