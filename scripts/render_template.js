/**
 * HTML → MP4 转制脚本模板
 * 
 * 使用方法：
 * 1. 修改 CONFIG 中的路径和参数
 * 2. 根据源 HTML 结构调整元素隐藏/保留逻辑
 * 3. 根据源 HTML 的音频合成逻辑调整音频渲染部分
 * 4. 运行: node render_template.js
 * 
 * 依赖: puppeteer-core, ffmpeg, Google Chrome
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ========== 配置 ==========
// 画幅与分辨率对照表：
//   16:9 横屏       9:16 竖屏
//   4K:  3840x2160   2160x3840
//   2K:  2560x1440   1440x2560
//   1080p: 1920x1080  1080x1920
//   720p:  1280x720    720x1280
const CONFIG = {
  // 输出分辨率（根据用户选择设置）
  width: 1920,       // 画面宽度
  height: 1080,      // 画面高度
  aspectRatio: '16:9', // '16:9' 或 '9:16'，用于文件名命名
  fps: 30,           // 帧率（30 或 60）
  duration: 96,      // 动画总时长（秒），需从源HTML提取
  
  // 输入输出路径
  htmlPath: '/path/to/animation.html',
  outputDir: '/path/to/output/frames',
  audioPath: '/path/to/output/audio.wav',
  outputVideo: '/path/to/output/output_16x9.mp4', // 文件名包含画幅标识
  
  // Chrome 路径
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  
  // 画面质量
  frameQuality: 95,  // JPEG 质量 1-100
  videoCRF: 18,      // x264 CRF (18=视觉无损, 23=默认)
  videoPreset: 'slow', // ultrafast → veryslow
  
  // 音频
  audioBitrate: '192k',
  sampleRate: 44100,
};

const totalFrames = CONFIG.fps * CONFIG.duration;

// ========== 工具函数 ==========
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ========== 主流程 ==========
async function main() {
  console.log('=== HTML → MP4 转制工作流 ===');
  console.log(`输出: ${CONFIG.width}x${CONFIG.height} @ ${CONFIG.fps}fps, ${CONFIG.duration}秒`);
  console.log(`总帧数: ${totalFrames}`);
  console.log('');
  
  ensureDir(CONFIG.outputDir);
  
  // ---- 启动浏览器 ----
  console.log('[1/4] 启动浏览器...');
  const browser = await puppeteer.launch({
    executablePath: CONFIG.chromePath,
    headless: true,
    args: [
      `--window-size=${CONFIG.width},${CONFIG.height + 80}`,
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: CONFIG.width, height: CONFIG.height, deviceScaleFactor: 1 });
  
  // ---- 加载页面 ----
  console.log('[2/4] 加载页面...');
  const fileUrl = 'file://' + CONFIG.htmlPath;
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('canvas');
  
  // ---- 隐藏交互UI，保留文字层 ----
  console.log('  调整UI元素...');
  await page.evaluate(() => {
    // === 需要隐藏的元素（交互控件） ===
    const hideSelectors = [
      // 按钮类
      '#play', '#start', '#replay', '#again', '#mute', '#full', '#fullscreen',
      // 控制条
      '#controls', '.controls', '.control-bar',
      // 音量
      '#volume', '.volume',
      // 进度滑块（交互用的，展示用的进度条保留）
      '#seek',
      // 提示气泡
      '#tip', '#info', '#soundHint', '.hint', '.tooltip',
      // 封面/结束页
      '#cover', '#landing', '#ending', '#end',
    ];
    
    hideSelectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.style.display = 'none';
    });
    
    // === 需要保留但重置状态的元素 ===
    const showSelectors = [
      '#caption', '.caption', '#subtitle',
      '#chapter', '.chapter',
      '#progress', '.progress-bar',
      '.time', '#time',
    ];
    
    showSelectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.display = '';
        el.style.opacity = el.style.opacity || '1';
      }
    });
  });
  
  // ---- 渲染音频 ----
  console.log('\n[3/4] 渲染音频...');
  
  // 注意：以下音频合成代码需根据具体HTML页面调整
  // 这里是示例模板，实际使用时请从源HTML中提取音频逻辑
  const audioBase64 = await page.evaluate(async (duration, sampleRate) => {
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, duration * sampleRate, sampleRate);
    
    // ===== 在这里复制源HTML的音频合成逻辑 =====
    // 示例：生成一个简单的正弦波测试音
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.3, 0.1);
    gain.gain.linearRampToValueAtTime(0, duration - 0.1);
    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(0);
    osc.stop(duration);
    // =========================================
    
    const renderedBuffer = await offlineCtx.startRendering();
    
    // 编码为 WAV
    const numChannels = renderedBuffer.numberOfChannels;
    const length = renderedBuffer.length;
    const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(wavBuffer);
    
    const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + length * numChannels * 2, true);
    writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true); view.setUint16(34, 16, true);
    writeStr(36, 'data'); view.setUint32(40, length * numChannels * 2, true);
    
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, renderedBuffer.getChannelData(ch)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    // 分块返回
    const bytes = new Uint8Array(wavBuffer);
    const chunkSize = 1024 * 1024;
    const chunks = [];
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      let binary = '';
      for (let j = 0; j < chunk.length; j++) binary += String.fromCharCode(chunk[j]);
      chunks.push(btoa(binary));
    }
    return chunks;
  }, CONFIG.duration, CONFIG.sampleRate);
  
  const audioBuffer = Buffer.concat(audioBase64.map(c => Buffer.from(c, 'base64')));
  fs.writeFileSync(CONFIG.audioPath, audioBuffer);
  console.log(`  音频已保存: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  
  // ---- 逐帧渲染 ----
  console.log('\n[4/4] 逐帧渲染视频...');
  const startTime = Date.now();
  
  for (let i = 0; i < totalFrames; i++) {
    const t = i / CONFIG.fps;
    
    await page.evaluate((time) => {
      // 渲染 Canvas 画面
      const canvasEl = document.querySelector('canvas');
      if (canvasEl && typeof render === 'function') {
        const ctx = canvasEl.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
        render(time, false);
      }
      
      // ===== 字幕更新逻辑（需根据具体HTML调整） =====
      // 示例：假设有 captions 数组和 chapterNames 数组
      // 从源HTML中提取字幕数据并同步更新
      
      // const captions = [...]; // 从源HTML提取
      // const cap = captions.find(c => time >= c.a && time < c.b);
      // const captionEl = document.getElementById('caption');
      // if (captionEl && cap) {
      //   captionEl.innerHTML = cap.text;
      //   captionEl.style.opacity = ...; // 淡入淡出
      // }
      
      // 章节名更新同理
      // =========================================
    }, t);
    
    const frameNum = String(i).padStart(5, '0');
    const framePath = path.join(CONFIG.outputDir, `frame_${frameNum}.jpg`);
    
    // 截取整页（包含Canvas + 所有文字层）
    await page.screenshot({ path: framePath, type: 'jpeg', quality: CONFIG.frameQuality, fullPage: false });
    
    // 进度输出
    if (i % 60 === 0) {
      const pct = (i / totalFrames * 100).toFixed(1);
      const elapsed = (Date.now() - startTime) / 1000;
      const fps = i / Math.max(elapsed, 0.001);
      const eta = fps > 0 ? ((totalFrames - i) / fps).toFixed(0) : '?';
      console.log(`  帧 ${i}/${totalFrames} (${pct}%) - ${fps.toFixed(1)} fps - 预计剩余 ${eta}s`);
    }
  }
  
  const renderTime = (Date.now() - startTime) / 1000;
  console.log(`  全部 ${totalFrames} 帧渲染完成，用时 ${renderTime.toFixed(1)}s`);
  
  await browser.close();
  
  // ---- ffmpeg 合成 ----
  console.log('\n使用 ffmpeg 合成 MP4...');
  
  const framePattern = path.join(CONFIG.outputDir, 'frame_%05d.jpg');
  
  const ffmpegArgs = [
    '-y',
    '-framerate', String(CONFIG.fps),
    '-i', framePattern,
    '-i', CONFIG.audioPath,
    '-c:v', 'libx264',
    '-preset', CONFIG.videoPreset,
    '-crf', String(CONFIG.videoCRF),
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', CONFIG.audioBitrate,
    '-shortest',
    CONFIG.outputVideo
  ];
  
  const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  
  ffmpeg.stderr.on('data', data => {
    const line = data.toString();
    if (line.includes('frame=')) {
      process.stdout.write(`\r  ${line.trim().split('\n').pop()}`);
    }
  });
  
  await new Promise((resolve, reject) => {
    ffmpeg.on('close', code => {
      process.stdout.write('\n');
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
    ffmpeg.on('error', reject);
  });
  
  // ---- 完成 ----
  const stats = fs.statSync(CONFIG.outputVideo);
  console.log('\n✅ 转制完成！');
  console.log(`   输出: ${CONFIG.outputVideo}`);
  console.log(`   大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   分辨率: ${CONFIG.width}x${CONFIG.height} (16:9)`);
  console.log(`   帧率: ${CONFIG.fps}fps`);
  console.log(`   时长: ${CONFIG.duration}秒`);
}

main().catch(err => {
  console.error('\n❌ 失败:', err.message);
  console.error(err.stack);
  process.exit(1);
});
