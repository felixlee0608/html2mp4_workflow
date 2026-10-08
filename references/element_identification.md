# 元素识别与处理指南

本指南帮助你快速识别 HTML 动画页面中的各类元素，并决定保留还是隐藏。

## 快速识别步骤

1. **读取 HTML 文件**，扫描所有 `id` 和 `class`
2. **查看 CSS**，定位定位方式为 `position: absolute` / `fixed` 的元素（浮层）
3. **查看 JS**，找到动画主循环函数（通常是 `render(t)` 或 `requestAnimationFrame`）
4. **找到字幕数组**：通常名为 `captions`、`subtitles`、`lines` 等
5. **找到音频合成代码**：搜索 `AudioContext`、`score`、`chords` 等关键词

## 常见元素对照表

### 必保留元素

| 功能 | 常见 ID / Class | 特征 |
|-----|----------------|------|
| 主画布 | `#space`, `#canvas`, `#scene`, `canvas` | 唯一的 `<canvas>` 元素 |
| 字幕 | `#caption`, `#subtitle`, `#text`, `.caption` | 居中 / 底部，字号较大，含 HTML 内容（`<br>`） |
| 章节名 | `#chapter`, `#section`, `.chapter` | 角落位置，字号较小，字母/罗马数字 |
| 进度条（展示用） | `#progress`, `.progress` | 一条细线或条，随时间增长 |
| 时间显示 | `#time`, `.time`, `#duration` | 形如 "00:00 / 01:30" |
| 标题 / 副标题 | `#title`, `#subtitle` | 开场或结尾的文字 |

### 必隐藏元素

| 功能 | 常见 ID / Class | 特征 |
|-----|----------------|------|
| 播放按钮 | `#play`, `#start`, `.play`, `.start` | 三角形图标或"播放"文字 |
| 暂停按钮 | `#pause`, `.pause` | 两竖线图标 |
| 重播按钮 | `#replay`, `#again`, `#restart` | 循环箭头图标 |
| 音量按钮 | `#mute`, `#volume-btn` | 喇叭图标 |
| 音量滑块 | `#volume`, `.volume` | `<input type="range">` |
| 进度滑块 | `#seek`, `#progress-bar` | 可拖拽的 `<input type="range">` |
| 全屏按钮 | `#full`, `#fullscreen`, `.fullscreen` | 方框图标 |
| 控制条容器 | `#controls`, `.controls`, `.control-bar` | 包含以上所有控件的容器 |
| 信息按钮 | `#info`, `.info` | 圆圈中的 "i" 图标 |
| 提示气泡 | `#tip`, `#hint`, `.tooltip`, `#soundHint` | 浮层文字，hover/click 显示 |
| 封面页 | `#cover`, `#landing`, `#intro` | 含开始按钮的初始页面 |
| 结束页 | `#ending`, `#end`, `#final` | 含"再来一次"按钮的结束页面 |

### 需判断的元素

| 元素 | 判断依据 |
|-----|---------|
| 进度条 | 如果是展示用的（只读）保留；如果是可拖拽的滑块隐藏 |
| 时间显示 | 通常保留，属于信息展示 |
| 品牌 Logo | 通常保留（如果原画面就有） |
| 导航指示器 | 通常保留（如章节指示点） |

## 字幕同步算法

标准的字幕淡入淡出使用 smoothstep 函数：

```javascript
const clamp = (x, a=0, b=1) => Math.max(a, Math.min(b, x));
const smooth = x => { x = clamp(x); return x*x*(3-2*x); };

// 字幕显示的不透明度
const fadeInDuration = 2.7;   // 淡入时长
const fadeOutDuration = 2.5;  // 淡出时长（从结束前开始）

const fadeIn = smooth((time - caption.start) / fadeInDuration);
const fadeOut = 1 - smooth((time - (caption.end - fadeOutDuration)) / fadeOutDuration);
const opacity = fadeIn * fadeOut;
```

## 音频合成识别要点

程序合成配乐的典型特征：

1. **`AudioContext` 或 `webkitAudioContext`**：Web Audio API 入口
2. **`score` 数组**：包含所有音符事件（时间、音高、时长、力度、音色）
3. **`chords` 数组**：和弦进行
4. **`hz(n)` 函数**：MIDI 音高转频率
5. **振荡器类型**：`sawtooth`（弦乐/铜管）、`sine`（钟/合唱）、`square`、`triangle`
6. **效果器**：`ConvolverNode`（混响）、`DynamicsCompressorNode`（压缩器）、`BiquadFilterNode`（滤波器）
7. **`OfflineAudioContext`**：如果已有则可直接复用

渲染音频时，**必须完整复制**所有这些参数，包括：
- 和弦进行和音符调度
- 各音色的振荡器数量和失谐量
- 包络参数（attack / release 形状）
- 滤波器类型和截止频率
- 混响脉冲响应
- 压缩器参数
- 主音量和干湿比

## 质量检查清单

- [ ] 分辨率正确（3840×2160 或 1920×1080）
- [ ] 16:9 比例
- [ ] 30fps（或 60fps）
- [ ] 所有字幕正确显示且与时间同步
- [ ] 章节文字正确
- [ ] 进度条（如保留）随时间推进
- [ ] 无播放按钮、控制条等交互元素
- [ ] 音频与画面同步
- [ ] 开头无黑帧
- [ ] 结尾完整不截断
- [ ] 音频有淡入淡出（无爆音）
- [ ] 文件可正常播放
