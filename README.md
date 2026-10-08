# Html2Mp4 Workflow Skill 🎬

**HTML → MP4 视频转制智能体技能**

将交互式 HTML Canvas 动画网页转制为可分发的高质量 MP4 视频。核心原则：**画面高度还原、文字全部保留、音频精确同步、UI 交互元素隐藏**。

基于 Puppeteer 逐帧精确渲染 + OfflineAudioContext 离线音频合成，确保画面与音频帧级同步；内置画面尺寸一致性校验，防止渲染出空白/裁切画面。

---

## ✨ 功能特性

- **画幅 / 清晰度可选**：16:9 横屏 / 9:16 竖屏；4K / 2K / 1080p / 720p 按需输出。
- **文字层完整保留**：字幕（含淡入淡出）、章节名称、章节导航目录、进度条、时间显示全部保留。
- **交互 UI 隐藏**：播放/暂停/音量/全屏按钮、控制条、提示气泡、封面/结束页自动隐藏。
- **帧级音画同步**：`OfflineAudioContext` 离线渲染程序合成配乐，逐帧调用 `render(t)` 精确同步。
- **尺寸决策校验**：内置「Canvas 内部像素 ≠ 输出分辨率」判定方案，首帧验证防空白/裁切画面。
- **高质量合成**：H.264 High Profile + AAC 192kbps，lanczos 高质量放大，CRF 18 视觉无损。

## 📦 安装

### 方式一：一键安装脚本（macOS / Linux）

```bash
curl -fsSL https://github.com/felixlee0608/html2mp4_workflow/raw/main/install.sh | bash
```

或下载后本地执行：

```bash
bash install.sh
```

脚本会自动检测并安装到以下任一可用目录：

| 智能体 / 环境 | 安装目录 |
|---|---|
| Doubao Work | `~/Library/Application Support/DoubaoWork/.../workspace/.user_skills/` |
| Claude Code | `~/.claude/skills/` |
| OpenAI Codex | `~/.codex/skills/` |
| 通用 Agents（如 QwenWork） | `~/.agents/skills/` 或 `~/.qwenworkcn/skills/` |

### 方式二：手动安装

1. 将整个 `html2mp4_workflow/` 文件夹放入你的智能体技能目录（见上表）。
2. 重启 / 刷新智能体，技能即被识别。

### 环境要求

- **Node.js**（必需）
- **puppeteer-core**（必需，使用系统 Chrome，`npm install puppeteer-core@latest`）
- **ffmpeg**（必需，用于最终合成）
- **Google Chrome**（必需，Puppeteer 渲染引擎，macOS 默认路径 `/Applications/Google Chrome.app`）

## 🚀 使用

1. 向智能体提供你的 HTML 动画网页（文件路径或 URL，含 `<canvas>` 动画）。
2. 说：**"把这个 HTML 转成视频"**（或"HTML 导出 MP4 / 网页动画转视频 / canvas 动画录制成视频"）。
3. 回答画幅（16:9 / 9:16）与清晰度（4K / 2K / 1080p / 720p）偏好。
4. 智能体自动完成：元素识别 → 尺寸决策 → 首帧验证 → 音频离线渲染 → 逐帧渲染 → ffmpeg 合成 → 质量检查 → 交付 MP4。

可选偏好（直接告诉智能体即可）："保留原配乐" / "配乐用史诗风格" / "60 帧"等。

## 📄 输出规范

- **画幅**：16:9 横屏（YouTube / B站 / 视频号横版）或 9:16 竖屏（抖音 / 小红书 / 手机观看）。
- **分辨率**：4K UHD（3840×2160 / 2160×3840）、2K QHD（2560×1440 / 1440×2560）、1080p FHD（1920×1080 / 1080×1920，推荐）、720p HD（1280×720 / 720×1280）。
- **格式**：MP4（H.264 High Profile + AAC 192kbps），30 fps（动画密集可 60 fps）。
- **文件位置**：输出到与源 HTML 同目录，命名为 `{原文件名}_{画幅}.mp4`（如 `animation_16x9.mp4`）。

## 🧭 工作流图示

整体录制链路（输入 → 加载 → 核心录制 → 转码输出）见 [docs/html_to_mp4_workflow.pdf](docs/html_to_mp4_workflow.pdf)。

## 🎬 案例

[examples/](examples/) 目录包含完整可运行案例：

- **《我从哪里来》——一部 AI 的自画像**（16:9，180 秒）
  - 源文件：[我从哪里来.html](examples/我从哪里来.html)（Canvas 动画 + Web Audio 程序合成配乐）
  - 转制结果：[我从哪里来_16x9.mp4](examples/我从哪里来_16x9.mp4)（1920×1080 · 30fps · H.264+AAC）
  - ▶ **在线播放动画**：[点击运行《我从哪里来》](https://felixlee0608.github.io/html2mp4_workflow/examples/%E6%88%91%E4%BB%8E%E5%93%AA%E9%87%8C%E6%9D%A5.html)（GitHub Pages 部署，浏览器中直接播放）

<p align="center">
  <video src="./examples/我从哪里来_16x9.mp4" controls="controls" style="max-width: 730px;" title="《我从哪里来》转制成品预览"></video>
  <br><em>↑ 在 GitHub 桌面浏览器中可直接播放；移动端 App / 部分编辑器预览不显示视频，请点上方链接下载观看</em>
</p>

用浏览器打开 HTML 即可体验原动画，将它与 MP4 对照可直观验证「画面高度还原、文字全部保留、音频精确同步、UI 隐藏」的输出效果。

## 📚 引用与版权

本技能由作者原创开发，封装结构、文档与脚本基于通用开源实践（MIT License）。

## ⚖️ License

本仓库采用 [MIT License](LICENSE)。

## 🤝 贡献

欢迎提 Issue / PR 优化渲染模板、元素识别规则或安装脚本。
