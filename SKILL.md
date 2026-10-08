---
name: html2mp4_workflow
description: 将 HTML Canvas 动画网页转制为高质量 MP4 视频。画幅（16:9 / 9:16）和清晰度（4K / 2K / 1080p）按需询问后输出；完整保留画面字幕、章节文字、进度指示等文字元素，隐藏播放控制按钮等交互 UI；自动识别并保留原页面程序合成配乐，如无配乐则询问目标风格后生成。基于 Puppeteer 逐帧精确渲染 + OfflineAudioContext 离线音频合成，确保画面与音频帧级同步。内置画面尺寸一致性校验，防止渲染出空白/裁切画面。Use when 用户说"把这个HTML转成视频"、"HTML导出MP4"、"网页动画转视频"、"canvas动画录制成视频"，or wants to convert an interactive HTML animation page into a distributable video file.
---

# HTML → MP4 转制工作流

将交互式 HTML Canvas 动画网页转制为可分发的高质量 MP4 视频。核心原则：**画面高度还原、文字全部保留、音频精确同步、UI 交互元素隐藏**。

## 触发场景

- 用户提供一个 `.html` 文件路径或 URL，要求转成视频
- 关键词：HTML 转视频、网页录制成 MP4、Canvas 动画导出、网页动画转制
- 明确要求 16:9 / 9:1 横屏或竖屏输出
- 明确要求 4K / 2K / 1080p 等清晰度规格
- 需要保留字幕、章节、进度条等文字元素

## 输出契约

- **画幅比例**：询问用户后确定（16:9 横屏 / 9:16 竖屏）
- **分辨率**：询问用户后确定
  - 4K UHD：3840×2160（16:9）/ 2160×3840（9:16）
  - 2K QHD：2560×1440（16:9）/ 1440×2560（9:16）
  - 1080p FHD：1920×1080（16:9）/ 1080×1920（9:16）
  - 720p HD：1280×720（16:9）/ 720×1280（9:16）
- **格式**：MP4（H.264 High Profile + AAC 192kbps）
- **帧率**：30 fps（动画密集场景可提升至 60 fps）
- **画面**：完整 Canvas 动画 + 所有文字层（字幕、章节名、进度条等），隐藏交互控件
- **音频**：保留原页面程序合成配乐；无配乐则询问风格后生成
- **文件位置**：输出到与源 HTML 同目录，命名为 `{原文件名}_{画幅}.mp4`（如 `animation_16x9.mp4` 或 `animation_9x16.mp4`）

## 工作流

### 第 1 步：分析源文件

1. 读取 HTML 文件，识别以下元素：
   - `<canvas>` 元素：主画面，**务必记录 canvas 的内部像素尺寸（`canvas.width` / `canvas.height`）和 JS 中定义的 W/H 常量**
   - 字幕元素：如 `#caption`、`.caption`、`#subtitle`、`#sub` 等
   - 章节/标题元素：如 `#chapter`、`.chapter`、`#chap` 等
   - **章节导航**：如 `<nav>`、`#nav`、`.chapters`、`.toc`（带章节名称列表的侧边导航，常带有 `.ui` 类可能被误藏）
   - 进度指示：如 `#progress`、进度条、时间戳等
   - 交互控件：播放按钮、暂停、音量、全屏、进度滑块等（需隐藏）
   - 音频合成逻辑：`AudioContext` / `OfflineAudioContext` 程序合成配乐
   - 舞台容器：如 `#stage`、`#wrap`，记录其尺寸约束方式（aspect-ratio、min、固定像素等）
   - **录制模式类名**：如 `body.rec`、`.recording` 等，检查其 CSS 规则是否会隐藏章节导航等需要保留的元素

2. 从 JS 代码中提取：
   - 动画总时长（duration / D 常量）
   - 字幕数组（时间区间 + 文本）
   - 章节名称数组
   - 音频合成参数（和弦、音色、节奏等）
   - **Canvas 内部绘制分辨率（W、H 常量，或 canvas.width/height 的初始值）** — 这是后续尺寸决策的核心依据

### 第 2 步：确认输出规格

在开始渲染前，向用户确认以下参数（如用户已明确指定则跳过）：

**画幅比例：**
- 16:9 横屏（适合 YouTube、B站、视频号横版、网页背景）
- 9:16 竖屏（适合抖音、小红书、视频号竖版、手机观看）

**清晰度：**
- 4K UHD（最高质量，文件较大，适合专业分发）
- 2K QHD（高质量与文件大小的平衡）
- 1080p FHD（推荐，通用性最好，文件适中）⭐ 推荐
- 720p HD（文件小，快速预览）

**帧率（可选，默认 30fps）：**
- 30 fps（标准，适合大多数动画）
- 60 fps（流畅，适合高速运动场景）

记录用户选择后，换算成像素尺寸：

| 规格 | 16:9 横屏 | 9:16 竖屏 |
|------|----------|----------|
| 4K UHD | 3840 × 2160 | 2160 × 3840 |
| 2K QHD | 2560 × 1440 | 1440 × 2560 |
| 1080p FHD | 1920 × 1080 | 1080 × 1920 |
| 720p HD | 1280 × 720 | 720 × 1280 |

### 第 3 步：环境准备

检查并安装依赖：
- **Node.js**（必需）
- **puppeteer-core**（必需，使用系统 Chrome）
- **ffmpeg**（必需，用于最终合成）
- **Google Chrome**（必需，Puppeteer 渲染引擎）

验证命令：
```bash
which node && node -v
which ffmpeg && ffmpeg -version
ls /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
```

如缺少 puppeteer-core，在工作目录执行：
```bash
npm init -y && npm install puppeteer-core@latest
```

### 第 4 步：画面尺寸决策与校验（关键！）

**这是最容易踩坑的一步。** 必须在全量渲染前完成尺寸决策和首帧验证。

#### 核心原则：Canvas 内部像素 ≠ 输出分辨率

Canvas 动画的 JS 代码（`render()` 函数等）中的所有绘制坐标都是基于 **canvas 内部像素尺寸**（通常由 `canvas.width` 和 `canvas.height` 或全局 `W`/`H` 常量决定，常见如 1600×900、1280×720 等）。

**绝对不要做的事：** 不要为了"提高分辨率"而直接修改 `canvas.width` / `canvas.height` 或全局 W/H 为输出分辨率。这会导致绘制坐标只占画面一角，出现大面积空白（右侧和底部留白）。

#### 正确方案（三选一，按优先级）

| 方案 | 适用场景 | 质量 | 实现复杂度 |
|------|---------|------|-----------|
| **A. 原生渲染 + ffmpeg lanczos 放大** | 输出分辨率 > canvas 原生分辨率 | 高（lanczos 算法无损放大） | 低 |
| **B. deviceScaleFactor 等比缩放** | 输出分辨率是 canvas 原生的整数倍或可精确 DPR | 最高（矢量级清晰度） | 中 |
| **C. 修改全部绘制坐标** | 需要精确像素级输出且无法接受插值 | 最高 | 极高（不推荐） |

**默认推荐方案 A**：viewport 设为 canvas 原生尺寸，deviceScaleFactor = 1，渲染完成后用 ffmpeg `scale=W:H:flags=lanczos` 放大到目标分辨率。质量好、实现简单、不易出错。

#### 尺寸设置检查清单

设置完 viewport 和页面样式后，**必须逐项确认**：

1. ✅ `canvas.width` / `canvas.height` 保持与源 HTML 一致（不要改）
2. ✅ viewport 尺寸 = canvas 原生尺寸（如 1600×900）
3. ✅ `deviceScaleFactor = 1`（方案 A），或精确计算为 输出分辨率 / 原生分辨率（方案 B）
4. ✅ 舞台容器（#stage / #wrap）的 CSS 尺寸 = viewport 尺寸，且没有 aspect-ratio、max-width 等约束导致缩放
5. ✅ canvas 的 CSS width/height 为 100%（填充舞台）

### 第 5 步：首帧验证（必做！）

**在开始全量 5400 帧渲染之前，必须先渲染一帧测试图并人工/自动校验画面是否正确。**

操作步骤：
1. 加载页面、隐藏 UI、调整尺寸后，调用 `render(某时间点)` 渲染一帧
2. 用 `page.screenshot()` 保存为测试图（如 `_test_frame.jpg`）
3. **检查画面：**
   - 画面内容是否填满整个区域（右侧/底部是否有空白）
   - 元素位置是否正确（字幕是否在底部、章节标题是否在左上）
   - 比例是否正常（圆形是否是圆、文字是否拉伸）
   - 是否有不该出现的 UI 元素
   - **章节导航是否可见**（侧边章节列表是否显示、当前章节是否高亮）
   - **章节名称是否始终可见**（非 hover/激活状态下文字是否透明/隐藏）
4. 如有问题，排查尺寸设置后重新验证
5. **确认无误后再启动全量渲染**

**如何验证画面填满：** 可以在 page.evaluate 中临时在 canvas 边缘画一条测试线，或检查截图的四角像素是否都是背景色但内容区域有绘制。最简单可靠的方式：渲染一帧后查看测试图，确认视觉正常。

### 第 6 步：音频渲染（OfflineAudioContext）

使用 `OfflineAudioContext` 离线渲染程序合成配乐，确保音频质量不受实时性能影响。

1. 从源 HTML 中提取完整的音频合成代码（score、chords、音色参数、混响、压缩器等）
2. 在浏览器页面上下文中创建 `OfflineAudioContext` 并调度所有音符
3. 渲染为 WAV 格式（44.1kHz / 16-bit / 立体声）
4. 分块 base64 传回 Node 层保存为 `.wav` 文件

**关键参数：**
- 采样率：44100 Hz
- 声道：立体声
- 位深：16-bit PCM
- 总时长：与动画一致
- 动态范围：使用 DynamicsCompressor 保持与原页面一致的响度

### 第 7 步：逐帧渲染视频（Puppeteer）

使用 Puppeteer headless 模式，逐帧精确渲染每一帧画面。

1. 启动 headless Chrome，设置 viewport 为 canvas 原生尺寸（方案 A）
2. 加载 HTML 页面，等待字体加载完成（`document.fonts.ready`）
3. **隐藏交互 UI**：播放按钮、控制条、音量滑块、全屏按钮、提示信息等
4. **保留章节导航**：检查章节导航是否被录制模式的 `.ui` 类误藏，如被误藏则注入专用 CSS 强制显示（详见「坑点 6」）
5. **调整舞台尺寸**：移除 aspect-ratio 等约束，让舞台精确填充 viewport
6. **首帧验证**：见第 5 步
7. 循环遍历每一帧：
   - 计算当前时间 `t = frameIndex / fps`
   - 调用 `render(t)` 函数绘制 Canvas 画面
   - 使用 `page.screenshot()` 截取整页（包含所有文字层）
   - 保存为 JPEG（quality: 95）

**帧同步保证：** 每帧独立调用 `render(t)`，不依赖 requestAnimationFrame，确保画面与时间精确对应。

**性能提示：** 1600×900 @ 30fps 渲染速度约 18-25 fps（即 3 分钟动画约需 4-5 分钟渲染）。

### 第 8 步：ffmpeg 合成与放大

使用 ffmpeg 将帧序列与音频合成为最终 MP4，同时用 lanczos 算法放大到目标分辨率：

```bash
ffmpeg -y \
  -framerate 30 -i frames/frame_%05d.jpg \
  -i audio.wav \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -vf "scale=1920:1080:flags=lanczos" \
  -c:a aac -b:a 192k \
  -shortest \
  output.mp4
```

**质量参数：**
- CRF 18：视觉无损级别的高质量
- preset slow：更好的压缩率和质量
- `scale=W:H:flags=lanczos`：lanczos 高质量重采样放大
- yuv420p：保证兼容性
- AAC 192kbps：高质量立体声

**⚠️ 路径注意：** 如果输出目录路径含空格（如 `My Projects`），**不要**用字符串拼接命令后 `execSync`，会导致空格被当成分隔符解析。改用当前工作目录 `cd` 进去后用相对路径，或使用数组参数的 `spawn`。

### 第 9 步：质量检查

1. 用 `ffprobe` 验证输出文件：
   - 分辨率与用户要求一致
   - 帧率正确（30fps）
   - 时长与预期一致
   - 包含视频流和音频流
   - 文件大小合理

2. 抽帧检查关键时间点：
   - 开头（0s）：第一帧字幕是否正确
   - 字幕切换点：淡入淡出是否平滑
   - 中段：画面元素是否完整，无空白
   - 结尾：最后一帧是否正常

3. 将最终文件复制到源 HTML 所在目录

### 第 10 步：交付

向用户提供：
- 输出文件路径（computer:// 格式链接）
- 视频参数摘要（分辨率、帧率、时长、大小）
- 包含的文字元素清单（字幕、章节、进度条等）
- 音频信息（原配乐保留 / 新生成配乐风格）

## 元素保留 / 隐藏规则

| 元素类型 | 处理方式 | 常见 ID / Class |
|---------|---------|----------------|
| Canvas 主画面 | ✅ 完整保留 | `#space`, `#canvas`, `canvas`, `#cv` |
| 字幕 / 标题文字 | ✅ 完整保留（含淡入淡出） | `#caption`, `#subtitle`, `.caption`, `#sub` |
| 章节名称 | ✅ 完整保留 | `#chapter`, `.chapter`, `#chap` |
| **章节导航 / 目录列表** | ✅ 完整保留（需特别检查是否被 `.ui` 类误藏） | `#nav`, `nav`, `.chapters`, `.toc`, `.chapter-list` |
| 进度条 / 时间显示 | ✅ 完整保留 | `#progress`, `#seek`, `.time`, `#time` |
| 播放 / 暂停按钮 | ❌ 隐藏 | `#play`, `#start`, `.start` |
| 控制条 / 工具栏 | ❌ 隐藏 | `#controls`, `.controls`, `#ctl` |
| 音量控制 | ❌ 隐藏 | `#volume`, `#mute`, `#snd` |
| 全屏按钮 | ❌ 隐藏 | `#full`, `#fullscreen`, `#fs` |
| 重播按钮 | ❌ 隐藏 | `#replay`, `#again` |
| 提示 / 说明气泡 | ❌ 隐藏 | `#tip`, `#info`, `#soundHint` |
| 封面 / 开始页 | ❌ 隐藏 | `#cover`, `#landing`, `#poster` |
| 结束页 / 重播页 | ❌ 隐藏 | `#ending`, `#end`, `#replay` |

**判断原则：** 静态展示的文字信息保留，交互性的按钮/控件隐藏。如有疑问，优先保留并询问用户。

## 常见坑点与修复

### 坑点 1：画面右侧/底部大面积空白

**现象：** 视频画面内容只占左上角，右侧和底部是黑的或背景色。

**原因：** 直接修改了 `canvas.width` / `canvas.height` 为更大的输出分辨率，但 `render()` 函数中的绘制坐标仍基于原始尺寸（如 1600×900），导致内容只画了左上角一块。

**修复：** 还原 canvas 内部像素为原始值，viewport 设为原始尺寸，最后用 ffmpeg lanczos 放大。详见第 4 步。

### 坑点 2：ffmpeg 报错 "Error opening input: Is a directory"

**现象：** ffmpeg 合成时报错，说输入是目录。

**原因：** 用字符串拼接 ffmpeg 命令时，输入路径含空格（如 `My Projects`），ffmpeg 把空格后的部分当成了另一个参数。

**修复：** `cd` 到帧目录所在目录后用相对路径，或使用数组形式的 spawn 调用。

### 坑点 3：字体未加载导致文字显示为默认字体

**现象：** 字幕、标题等文字是系统默认字体而非设计字体（如 Noto Serif SC）。

**原因：** 截图时 Google Fonts 还没加载完成。

**修复：** 页面加载后等待 `document.fonts.ready`，并额外 `await document.fonts.load(...)` 指定具体字体粗细，再等 500-1000ms 确保渲染。

### 坑点 4：音频与画面不同步

**现象：** 音乐节奏和画面动画对不上。

**原因：** 实时播放录制时性能波动导致丢帧；或音频是实时录制的，时长与帧序列不完全匹配。

**修复：** 使用 `OfflineAudioContext` 离线渲染音频（精确时长），逐帧渲染用 `render(t)` 而非 `requestAnimationFrame`（精确帧同步），最后用 `-shortest` 参数合成。

### 坑点 5：暗角 / 颗粒质感等叠加层缺失

**现象：** 渲染出的画面缺少原页面的暗角、噪点、胶片颗粒等视觉效果。

**原因：** 这些效果可能是用 CSS 滤镜或独立 DOM 元素实现的（如 `#vig` 暗角层），如果被误藏或不在截图范围内就会缺失。

**修复：** 分析 HTML 结构，确认所有视觉叠加层（`#vig`、`.grain` 等）都在截图范围内且未被隐藏。

### 坑点 6：章节导航在录制模式下被误藏

**现象：** 原页面侧边有章节导航列表（如 9 章目录），但渲染出的视频里右侧/左侧没有章节显示。

**原因：** 章节导航元素常带有 `.ui` 类（如 `<nav id="nav" class="ui">`），而录制模式的 CSS 规则（如 `body.rec .ui { display: none !important }`）会把所有 `.ui` 元素一起隐藏，导致章节导航也被隐藏。

**检查方法：**
1. 在 HTML 中搜索 `body.rec`、`.recording` 等录制模式类名的 CSS 规则
2. 检查章节导航元素（`nav`、`#nav`、`.chapters`）是否带有 `.ui` 类
3. 首帧验证时专门确认章节导航是否可见

**修复：** 在修改 HTML 时注入录制模式专用 CSS，强制显示章节导航并让章节名称始终可见：

```css
/* 录制模式：强制显示章节导航 */
body.rec nav.ui,
body.rec .chapters.ui {
  display: flex !important;
}
/* 所有章节名称始终可见（非 hover 状态也不透明） */
body.rec nav a span,
body.rec .chapters a .name {
  opacity: 0.75 !important;
  transform: none !important;
}
/* 当前章节高亮 */
body.rec nav a.on span,
body.rec .chapters a.active .name {
  opacity: 1 !important;
  color: var(--accent-color) !important;
  font-weight: bold !important;
}
```

**额外注意：** 部分页面的章节名称默认只有 hover 或激活状态才显示（opacity: 0 + transform 动画），录制时需要让所有章节名称都可见，同时当前章节高亮区分。

## 无配乐时的处理

如果源 HTML 中没有程序合成配乐（无 `AudioContext` / `audio` 元素 / 无 score 数据）：

1. **询问用户**目标配乐风格，提供选项：
   - 史诗宏大（管弦乐 + 合唱，适合宇宙/历史主题）
   - 静谧空灵（氛围电子 + 钢琴，适合冥想/自然主题）
   - 科技感（合成器 + 鼓点，适合科技/未来主题）
   - 古风（竹笛 + 古筝 + 弦乐，适合诗词/古典主题）
   - 不要配乐（纯画面）

2. 根据选择的风格，使用 Web Audio API 程序化生成对应风格的配乐
3. 确保音乐时长与动画完全匹配，包含淡入淡出

## 已知限制

- 逐帧渲染高分辨率视频耗时较长（4K 约为实时速度的 1/5 ~ 1/10，1080p 约 1/3 ~ 1/5）
- 9:16 竖屏模式下，原 HTML 的字幕、元素位置可能需要调整以适配竖屏布局
- 复杂的 WebGL 着色器动画可能需要更高性能的机器
- 如果 HTML 依赖外部资源（字体、图片、音频文件），确保路径正确
- 不支持含有视频元素的 HTML（`<video>` 标签），仅支持 Canvas / SVG / DOM 动画
- macOS 下写入受保护目录可能需要权限，建议先在工作目录生成再复制

## 参考脚本

核心录制脚本模板见 [scripts/render_template.js](scripts/render_template.js)，可根据具体 HTML 结构调整。脚本已包含首帧验证、尺寸校验、lanczos 放大等最佳实践。
