// 開機動畫 for ColorOS - WebUI 邏輯
const MODULE_ID = "coloros-bootanimation";
const ACTIVE_MODDIR = `/data/adb/modules/${MODULE_ID}`;
const UPDATE_MODDIR = `/data/adb/modules_update/${MODULE_ID}`;
// 單塊上傳大小（base64 後需低於 execve 參數限制）
const CHUNK_SIZE = 80 * 1024;
const HTTP_BRIDGE_PORT = 7126;

// ---------------- 多語支援（與 font-settings 相同機制） ----------------
const TRANSLATIONS = {
  "zh-CN": {
    pageTitle: "开机动画 for ColorOS",
    back: "返回",
    refresh: "刷新",
    authorLinkLabel: "访问 yuzlyn 的 GitHub 主页",
    authorAvatarAlt: "yuzlyn 的 GitHub 头像",
    pageSubtitle: "上传视频或 GIF，自动转换为水平居中、位于上黄金分割点的 ColorOS 开机动画",
    controlsLabel: "连接状态",
    connectingKernelSU: "正在连接 KernelSU",
    convertingProgress: "转换中 {progress}%",
    installedLabel: "已安装自定义动画",
    convertFailed: "转换失败",
    uploadSectionLabel: "上传视频或 GIF",
    uploadTitle: "上传视频 / GIF",
    supportedFormats: "支持 mp4 / mov / webm / mkv / gif · 水平居中、位于上黄金分割点",
    chooseMedia: "选择视频 / GIF",
    frameRate: "帧率",
    durationCap: "时长上限",
    secondsUnit: "秒",
    outputSize: "输出尺寸",
    sizeAuto: "自动（屏幕）",
    sizeCustom: "自定义",
    customSizeLabel: "宽 × 高",
    customSizeHint: "例如 720x1584",
    animSize: "动画大小",
    loopCount: "循环次数",
    loopTimes: "{count} 次",
    loopUnit: "次",
    loopStatus: "循环 {count} 次",
    playbackSpeed: "播放速度",
    rotate: "旋转",
    trimStart: "开始时间",
    trimEnd: "结束时间",
    clipStatus: "截取 {start}-{end} 秒",
    position: "位置",
    posDefault: "默认（黄金分割点）",
    posCustom: "自定义",
    posX: "水平位置",
    posY: "垂直位置",
    previewHint: "预览：动画将以所选大小显示在上黄金分割点",
    convertingLabel: "转换进度",
    startConvert: "开始转换",
    currentSectionLabel: "当前动画",
    currentAnimation: "当前开机动画",
    loadingStatus: "正在读取状态",
    notInstalled: "未安装自定义动画，正在使用系统默认开机动画",
    framesCount: "{count} 帧",
    framesUnknown: "帧数未知",
    restoreDefault: "恢复系统默认",
    previewAlt: "开机动画预览",
    rebootToApply: "重启生效",
    systemStatusDetail: "屏幕 {width}×{height} · 新的开机动画在重启后生效",
    restartDevice: "重启设备",
    sourceLinkLabel: "打开开机动画源码仓库",
    sourceRepository: "源码仓库",
    about: "关于",
    aboutDetail: "查看 README",
    aboutLinkLabel: "打开 README 关于页面",
    donateAuthor: "赞助作者",
    donateDetail: "支付宝 / 微信支付",
    donateLinkLabel: "打开赞助页面",
    versionInfo: "版本信息",
    restartDialogHeadline: "重启设备？",
    restartDialogDescription: "未保存的应用状态将丢失。新的开机动画将在重启后生效。",
    cancel: "取消",
    restart: "重启",
    chooseMediaDialog: "选择视频 / GIF",
    pathImportLabel: "视频 / GIF 文件路径",
    pathImportHint: "如果文件选择器不可用，请在文件管理器中复制视频或 GIF 路径并粘贴到这里。",
    chooseFromPicker: "打开文件选择器",
    importFromPath: "从路径导入",
    restoreDialogHeadline: "恢复系统默认开机动画？",
    restoreDialogDescription: "已上传的自定义开机动画将被删除，重启后恢复为系统默认动画。",
    restoreConfirm: "恢复默认",
    bridgeConnected: "KernelSU 已连接",
    bridgeFailed: "连接失败，请确认模块已启用",
    errorVideoNotFound: "文件不存在，请重新上传。",
    errorConvertFailed: "转换失败：无法解码该文件（不支持的格式或文件损坏）。",
    errorConvertTimeout: "转换超时，请尝试更短的视频或降低帧率。",
    errorZipVerify: "生成的动画包校验失败，请重试。",
    errorConverterExited: "转换进程意外退出，请重试。",
    errorGeneric: "转换失败（{code}）。",
    convertStarting: "开始转换…",
    uploadingFile: "正在上传文件…",
    uploadFinished: "上传完成，开始转换…",
    convertingWait: "转换中，请稍候…",
    convertBusy: "已有转换在进行",
    operationFailed: "操作失败：{message}",
    fileEmpty: "文件为空",
    fileTooLarge: "文件过大（最大 1 GB）",
    unsupportedType: "不支持的文件类型（支持 mp4 / mov / webm / mkv / gif）",
    fileSelected: "已选择文件，点击「开始转换」",
    pathInvalid: "路径无效",
    pathNotFound: "文件不存在",
    pathImported: "已导入路径，点击「开始转换」",
    pathReadFailed: "读取失败：{message}",
    restoreDone: "已恢复系统默认开机动画，重启后生效",
    restoreFailed: "恢复失败：{message}",
    restartFailed: "重启失败：{message}",
  },
  "zh-TW": {
    pageTitle: "開機動畫 for ColorOS",
    back: "返回",
    refresh: "重新整理",
    authorLinkLabel: "前往 yuzlyn 的 GitHub 個人頁面",
    authorAvatarAlt: "yuzlyn 的 GitHub 大頭貼",
    pageSubtitle: "上傳影片或 GIF，自動轉換為水平居中、位於上黃金分割點的 ColorOS 開機動畫",
    controlsLabel: "連線狀態",
    connectingKernelSU: "正在連線至 KernelSU",
    convertingProgress: "轉換中 {progress}%",
    installedLabel: "已安裝自訂動畫",
    convertFailed: "轉換失敗",
    uploadSectionLabel: "上傳影片或 GIF",
    uploadTitle: "上傳影片 / GIF",
    supportedFormats: "支援 mp4 / mov / webm / mkv / gif · 水平居中、位於上黃金分割點",
    chooseMedia: "選擇影片 / GIF",
    frameRate: "幀率",
    durationCap: "時長上限",
    secondsUnit: "秒",
    outputSize: "輸出尺寸",
    sizeAuto: "自動（屏幕）",
    sizeCustom: "自訂",
    customSizeLabel: "寬 × 高",
    customSizeHint: "例如 720x1584",
    animSize: "動畫大小",
    loopCount: "循環次數",
    loopTimes: "{count} 次",
    loopUnit: "次",
    loopStatus: "循環 {count} 次",
    playbackSpeed: "播放速度",
    rotate: "旋轉",
    trimStart: "開始時間",
    trimEnd: "結束時間",
    clipStatus: "截取 {start}–{end} 秒",
    position: "位置",
    posDefault: "預設（黃金分割點）",
    posCustom: "自訂",
    posX: "水平位置",
    posY: "垂直位置",
    previewHint: "預覽：動畫將以所選大小顯示於上黃金分割點",
    convertingLabel: "轉換進度",
    startConvert: "開始轉換",
    currentSectionLabel: "當前動畫",
    currentAnimation: "當前開機動畫",
    loadingStatus: "正在讀取狀態",
    notInstalled: "未安裝自訂動畫，正在使用系統預設開機動畫",
    framesCount: "{count} 幀",
    framesUnknown: "幀數未知",
    restoreDefault: "恢復系統預設",
    previewAlt: "開機動畫預覽",
    rebootToApply: "重啟生效",
    systemStatusDetail: "屏幕 {width}×{height} · 新的開機動畫在重新啟動後生效",
    restartDevice: "重新啟動裝置",
    sourceLinkLabel: "開啟開機動畫原始碼儲存庫",
    sourceRepository: "原始碼儲存庫",
    about: "關於",
    aboutDetail: "查看 README",
    aboutLinkLabel: "開啟 README 關於頁面",
    donateAuthor: "贊助作者",
    donateDetail: "支付寶 / 微信支付",
    donateLinkLabel: "開啟贊助頁面",
    versionInfo: "版本資訊",
    restartDialogHeadline: "重新啟動裝置？",
    restartDialogDescription: "未儲存的應用程式狀態將會遺失。新的開機動畫將在重新啟動後生效。",
    cancel: "取消",
    restart: "重新啟動",
    chooseMediaDialog: "選擇影片 / GIF",
    pathImportLabel: "影片 / GIF 檔案路徑",
    pathImportHint: "如果檔案選擇器無法使用，請在檔案管理器中複製影片或 GIF 路徑並貼到這裡。",
    chooseFromPicker: "開啟檔案選擇器",
    importFromPath: "從路徑匯入",
    restoreDialogHeadline: "恢復系統預設開機動畫？",
    restoreDialogDescription: "已上傳的自訂開機動畫將被刪除，重新啟動後恢復為系統預設動畫。",
    restoreConfirm: "恢復預設",
    bridgeConnected: "KernelSU 已連線",
    bridgeFailed: "連線失敗，請確認模組已啟用",
    errorVideoNotFound: "檔案不存在，請重新上傳。",
    errorConvertFailed: "轉換失敗：無法解碼該檔案（不支援的格式或檔案損壞）。",
    errorConvertTimeout: "轉換逾時，請嘗試較短的影片或降低幀率。",
    errorZipVerify: "產生的動畫包驗證失敗，請重試。",
    errorConverterExited: "轉換程序意外結束，請重試。",
    errorGeneric: "轉換失敗（{code}）。",
    convertStarting: "開始轉換…",
    uploadingFile: "正在上傳檔案…",
    uploadFinished: "上傳完成，開始轉換…",
    convertingWait: "轉換中，請稍候…",
    convertBusy: "已有轉換在進行",
    operationFailed: "操作失敗：{message}",
    fileEmpty: "檔案為空",
    fileTooLarge: "檔案過大（最大 1 GB）",
    unsupportedType: "不支援的檔案類型（支援 mp4 / mov / webm / mkv / gif）",
    fileSelected: "已選擇檔案，點擊「開始轉換」",
    pathInvalid: "路徑無效",
    pathNotFound: "檔案不存在",
    pathImported: "已匯入路徑，點擊「開始轉換」",
    pathReadFailed: "讀取失敗：{message}",
    restoreDone: "已恢復系統預設開機動畫，重新啟動後生效",
    restoreFailed: "恢復失敗：{message}",
    restartFailed: "重新啟動失敗：{message}",
  },
  "en-US": {
    pageTitle: "Boot animation for ColorOS",
    back: "Back",
    refresh: "Refresh",
    authorLinkLabel: "Open yuzlyn's GitHub profile",
    authorAvatarAlt: "yuzlyn's GitHub avatar",
    pageSubtitle: "Upload a video or GIF and convert it into a horizontally centered ColorOS boot animation positioned at the upper golden-ratio point",
    controlsLabel: "Connection status",
    connectingKernelSU: "Connecting to KernelSU",
    convertingProgress: "Converting {progress}%",
    installedLabel: "Custom animation installed",
    convertFailed: "Conversion failed",
    uploadSectionLabel: "Upload video or GIF",
    uploadTitle: "Upload video / GIF",
    supportedFormats: "Supports mp4 / mov / webm / mkv / gif · centered horizontally at the upper golden-ratio point",
    chooseMedia: "Choose video / GIF",
    frameRate: "Frame rate",
    durationCap: "Duration cap",
    secondsUnit: "sec",
    outputSize: "Output size",
    sizeAuto: "Auto (screen)",
    sizeCustom: "Custom",
    customSizeLabel: "Width × height",
    customSizeHint: "e.g. 720x1584",
    animSize: "Animation size",
    loopCount: "Loop count",
    loopTimes: "{count} times",
    loopUnit: "times",
    loopStatus: "loops {count} times",
    playbackSpeed: "Playback speed",
    rotate: "Rotation",
    trimStart: "Start time",
    trimEnd: "End time",
    clipStatus: "clip {start}-{end}s",
    position: "Position",
    posDefault: "Default (golden point)",
    posCustom: "Custom",
    posX: "Horizontal position",
    posY: "Vertical position",
    previewHint: "Preview: the animation appears at the chosen size on the upper golden-ratio point",
    convertingLabel: "Conversion progress",
    startConvert: "Start conversion",
    currentSectionLabel: "Current animation",
    currentAnimation: "Current boot animation",
    loadingStatus: "Reading status",
    notInstalled: "No custom animation installed; the system default boot animation is in use",
    framesCount: "{count} frames",
    framesUnknown: "Frame count unknown",
    restoreDefault: "Restore system default",
    previewAlt: "Boot animation preview",
    rebootToApply: "Restart to apply",
    systemStatusDetail: "Screen {width}×{height} · the new boot animation takes effect after restart",
    restartDevice: "Restart device",
    sourceLinkLabel: "Open the boot animation source repository",
    sourceRepository: "Source repository",
    about: "About",
    aboutDetail: "View README",
    aboutLinkLabel: "Open the README about page",
    donateAuthor: "Support the author",
    donateDetail: "Alipay / WeChat Pay",
    donateLinkLabel: "Open the donation page",
    versionInfo: "Version information",
    restartDialogHeadline: "Restart device?",
    restartDialogDescription: "Unsaved app state will be lost. The new boot animation will take effect after restart.",
    cancel: "Cancel",
    restart: "Restart",
    chooseMediaDialog: "Choose video / GIF",
    pathImportLabel: "Video / GIF file path",
    pathImportHint: "If the file picker is unavailable, copy the video or GIF path in a file manager and paste it here.",
    chooseFromPicker: "Open file picker",
    importFromPath: "Import from path",
    restoreDialogHeadline: "Restore the system default boot animation?",
    restoreDialogDescription: "The uploaded custom boot animation will be deleted and the system default restored after restart.",
    restoreConfirm: "Restore default",
    bridgeConnected: "KernelSU connected",
    bridgeFailed: "Connection failed. Make sure the module is enabled",
    errorVideoNotFound: "File not found. Upload it again.",
    errorConvertFailed: "Conversion failed: the file could not be decoded (unsupported format or corrupted file).",
    errorConvertTimeout: "Conversion timed out. Try a shorter video or a lower frame rate.",
    errorZipVerify: "The generated animation package failed verification. Try again.",
    errorConverterExited: "The converter exited unexpectedly. Try again.",
    errorGeneric: "Conversion failed ({code}).",
    convertStarting: "Starting conversion…",
    uploadingFile: "Uploading file…",
    uploadFinished: "Upload complete, starting conversion…",
    convertingWait: "Converting, please wait…",
    convertBusy: "A conversion is already in progress",
    operationFailed: "Operation failed: {message}",
    fileEmpty: "File is empty",
    fileTooLarge: "File too large (1 GB max)",
    unsupportedType: "Unsupported file type (mp4 / mov / webm / mkv / gif supported)",
    fileSelected: "File selected. Tap \"Start conversion\"",
    pathInvalid: "Invalid path",
    pathNotFound: "File not found",
    pathImported: "Path imported. Tap \"Start conversion\"",
    pathReadFailed: "Read failed: {message}",
    restoreDone: "System default boot animation restored. Takes effect after restart",
    restoreFailed: "Restore failed: {message}",
    restartFailed: "Restart failed: {message}",
  },
};

function resolveLocale() {
  const language = String(navigator.language || "").replaceAll("_", "-").toLowerCase();
  if (/^zh-(?:[^-]+-)*tw(?:-|$)/.test(language)) return "zh-TW";
  if (language === "zh" || language.startsWith("zh-")) return "zh-CN";
  return "en-US";
}

const locale = resolveLocale();

function t(key, variables = {}) {
  const message = TRANSLATIONS[locale][key] ?? TRANSLATIONS["en-US"][key] ?? key;
  return String(message).replace(/\{(\w+)\}/g, (_, name) => String(variables[name] ?? `{${name}}`));
}

function applyTranslations() {
  document.documentElement.lang = locale;
  document.title = t("pageTitle");
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  const attributes = ["aria-label", "title", "alt", "headline", "description", "label"];
  for (const attribute of attributes) {
    const datasetName = `i18n${attribute.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("")}`;
    for (const element of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
      element.setAttribute(attribute, t(element.dataset[datasetName]));
    }
  }
}

let moduleDir = ACTIVE_MODDIR;
let bootctl = `${moduleDir}/tools/bootctl.sh`;

const hasKsuBridge = Boolean(window.ksu && typeof window.ksu.exec === "function");
let callbackSequence = 0;

// ---------------- exec 橋接 ----------------
function execHttp(command, options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeout) || 30000);
  return fetch(`http://127.0.0.1:${HTTP_BRIDGE_PORT}/cgi-bin/exec`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: command,
    signal: AbortSignal.timeout(timeoutMs),
  })
    .then(async (response) => {
      const text = await response.text();
      const newline = text.indexOf("\n");
      if (newline < 0) throw new Error("http_bridge_bad_response");
      const code = Number(text.slice(0, newline).trim()) || 0;
      const output = text.slice(newline + 1);
      if (code !== 0) throw new Error(String(output || `command_failed_${code}`).trim());
      return output.trim();
    })
    .catch((error) => {
      if (error && error.name === "TimeoutError") throw new Error("KSU_BRIDGE_TIMEOUT");
      throw error;
    });
}

function exec(command, options = {}) {
  if (!hasKsuBridge) return execHttp(command, options);
  return new Promise((resolve, reject) => {
    if (!window.ksu || typeof window.ksu.exec !== "function") {
      reject(new Error("KSU_BRIDGE_UNAVAILABLE"));
      return;
    }
    const callbackName = `coloros_ba_exec_${Date.now()}_${callbackSequence++}`;
    let settled = false;
    const timeoutMs = Math.max(1000, Number(options.timeout) || 30000);
    const timeout = window.setTimeout(() => finish(new Error("KSU_BRIDGE_TIMEOUT")), timeoutMs);
    function finish(error, output = "") {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      delete window[callbackName];
      if (error) reject(error);
      else resolve(String(output ?? "").trim());
    }
    window[callbackName] = (errno, stdout, stderr) => {
      const code = Number(errno) || 0;
      if (code !== 0) finish(new Error(String(stderr || stdout || `command_failed_${code}`).trim()));
      else finish(null, stdout);
    };
    try {
      const legacyResult = window.ksu.exec(command, JSON.stringify(options), callbackName);
      if (legacyResult !== undefined && legacyResult !== null) finish(null, legacyResult);
    } catch (modernError) {
      try {
        const legacyResult = window.ksu.exec(command);
        finish(null, legacyResult);
      } catch {
        finish(modernError);
      }
    }
  });
}

// ---------------- 工具 ----------------
function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function parseProperties(text) {
  const result = {};
  for (const line of String(text).split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator > 0) result[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return result;
}

function formatBytes(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSpeed(pct) {
  const n = Number(pct) / 100;
  const text = Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
  return `${text}×`;
}

// ---------------- 旋轉 / 截取 ----------------
function formatSeconds(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 10) / 10;
  return String(Number.isInteger(rounded) ? Math.round(rounded) : rounded);
}

function clampTrim(value, lo, hi) {
  if (!(value >= lo)) return lo;
  if (value > hi) return hi;
  return value;
}

/** 數值輸入框 → 滑桿：clamp 至 min/max 並吸附至 step；回傳是否成功。 */
function numberToSlider(number, slider) {
  const value = parseFloat(number.value);
  if (!Number.isFinite(value)) {
    number.value = String(slider.value); // 無效輸入：還原為目前滑桿值
    return false;
  }
  const min = Number(slider.min) || 0;
  const max = Number(slider.max) || 100;
  const step = Number(slider.step) || 1;
  let snapped = clampTrim(value, min, max);
  snapped = min + Math.round((snapped - min) / step) * step;
  snapped = clampTrim(snapped, min, max);
  slider.value = String(snapped);
  return true;
}

/** 播放速度：滑桿 25-400（百分比）⇄ 輸入框 0.25-4（倍率）。 */
function speedToNumber() {
  const pct = Number(speedSlider.value) || 100;
  return String(Math.round((pct / 100) * 100) / 100);
}

function speedToSlider() {
  const rate = parseFloat(speedNumber.value);
  if (!Number.isFinite(rate)) {
    speedNumber.value = speedToNumber(); // 無效輸入：還原為目前值
    return;
  }
  let pct = clampTrim(rate * 100, 25, 400);
  pct = 25 + Math.round((pct - 25) / 25) * 25;
  pct = clampTrim(pct, 25, 400);
  speedSlider.value = String(pct);
}

function updateTrimBounds() {
  if (!trimReady) return;
  const dur = trimDuration;
  const step = Number(trimEndSlider.step) || 0.5;
  const start = clampTrim(Number(trimStartSlider.value) || 0, 0, Math.max(0, dur - step));
  const end = clampTrim(Number(trimEndSlider.value) || dur, Math.min(dur, start + step), dur);
  trimStartSlider.value = String(start);
  trimEndSlider.value = String(end);
  trimStartSlider.min = "0";
  trimStartSlider.max = String(Math.max(0, end - step));
  trimEndSlider.min = String(Math.min(dur, start + step));
  trimEndSlider.max = String(dur);
  // 同步數值輸入框（範圍/步進/顯示值）
  for (const [number, slider] of [[trimStartNumber, trimStartSlider], [trimEndNumber, trimEndSlider]]) {
    number.min = slider.min;
    number.max = slider.max;
    number.step = slider.step;
    number.value = formatSeconds(slider.value);
  }
}

/** 截取範圍保守上限（總時長未知時使用；轉換時以實際結尾自動截斷）。 */
const TRIM_FALLBACK_SEC = 120;

function enableTrimControls(duration) {
  const dur = Number(duration);
  trimDuration = dur > 0 ? dur : TRIM_FALLBACK_SEC; // 未知時用保守上限，仍可拖動截取
  const upper = trimDuration;
  const step = upper > 1800 ? 10 : upper > 600 ? 5 : upper > 120 ? 1 : 0.5;
  trimStartSlider.step = String(step);
  trimEndSlider.step = String(step);
  trimStartSlider.value = "0";
  trimEndSlider.value = String(upper); // 預設至上限（視為不截取）
  trimReady = true;
  trimStartRow.classList.remove("hidden");
  trimEndRow.classList.remove("hidden");
  updateTrimBounds();
}

function disableTrimControls() {
  trimReady = false;
  trimDuration = 0;
  trimStartRow.classList.add("hidden");
  trimEndRow.classList.add("hidden");
  trimStartSlider.value = "0";
  trimEndSlider.value = "0";
  trimStartNumber.value = "0";
  trimEndNumber.value = "0";
}

let trimDuration = 0;   // 截取範圍上限（秒）；未知時為 TRIM_FALLBACK_SEC
let trimReady = false;  // 截取滑桿是否已可用
let trimSelectionSeq = 0;
let videoMetadataDuration = 0;
let durationWaiters = [];

function notifyVideoMetadata() {
  const raw = uploadPreviewVideo.duration;
  videoMetadataDuration = Number.isFinite(raw) && raw > 0 ? raw : 0;
  for (const resolve of durationWaiters) resolve(videoMetadataDuration);
  durationWaiters = [];
}

function waitVideoMetadata(timeoutMs) {
  if (uploadPreviewVideo.readyState >= 1) {
    const raw = uploadPreviewVideo.duration;
    return Promise.resolve(Number.isFinite(raw) && raw > 0 ? raw : 0);
  }
  return new Promise((resolve) => {
    durationWaiters.push(resolve);
    window.setTimeout(() => resolve(videoMetadataDuration), timeoutMs);
  });
}

async function probeDuration(path) {
  try {
    const output = await exec(`sh ${shellQuote(bootctl)} probe ${shellQuote(path)}`, { timeout: 30000 });
    const props = parseProperties(output);
    if ((props.type === "video" || props.type === "gif") && Number(props.duration) > 0) return Number(props.duration);
  } catch (error) {
    console.error(error.message);
  }
  return 0;
}

/** 選擇檔案後準備截取範圍：影片用總時長，GIF 與時長未知時用保守上限。 */
async function prepareTrim(fileLike) {
  const seq = ++trimSelectionSeq;
  disableTrimControls();
  if (!fileLike) return;
  const name = String(fileLike.name || "");
  const isGif = name.toLowerCase().endsWith(".gif");
  let duration = 0;
  if (fileLike.isPath) {
    duration = await probeDuration(fileLike.path); // 影片與 GIF 皆可 probe 總時長
  } else if (isGif) {
    duration = 0; // 瀏覽器無法讀取 GIF 總時長 → 使用保守上限
  } else {
    duration = await waitVideoMetadata(3000);
  }
  if (seq !== trimSelectionSeq) return; // 使用者已更換檔案
  enableTrimControls(duration);
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

function showMessage(message) {
  snackbar.textContent = message;
  snackbar.open = true;
}

// ---------------- 狀態 ----------------
const snackbar = document.querySelector("#snackbar");
const bridgeChip = document.querySelector("#bridge-chip");
const bridgeLabel = document.querySelector("#bridge-label");
const convertingChip = document.querySelector("#converting-chip");
const convertingLabel = document.querySelector("#converting-label");
const installedChip = document.querySelector("#installed-chip");
const errorCard = document.querySelector("#error-card");
const errorText = document.querySelector("#error-text");
const videoFile = document.querySelector("#video-file");
const videoName = document.querySelector("#video-name");
const videoUpload = document.querySelector("#video-upload");
const convertButton = document.querySelector("#convert-button");
const convertProgress = document.querySelector("#convert-progress");
const fpsSlider = document.querySelector("#fps-slider");
const fpsNumber = document.querySelector("#fps-number");
const durationSlider = document.querySelector("#duration-slider");
const durationNumber = document.querySelector("#duration-number");
const sizeMode = document.querySelector("#size-mode");
const customSizeRow = document.querySelector("#custom-size-row");
const customSize = document.querySelector("#custom-size");
const sizeSlider = document.querySelector("#size-slider");
const sizeNumber = document.querySelector("#size-number");
const loopSlider = document.querySelector("#loop-slider");
const loopNumber = document.querySelector("#loop-number");
const speedSlider = document.querySelector("#speed-slider");
const speedNumber = document.querySelector("#speed-number");
const rotateSlider = document.querySelector("#rotate-slider");
const rotateNumber = document.querySelector("#rotate-number");
const trimStartRow = document.querySelector("#trim-start-row");
const trimEndRow = document.querySelector("#trim-end-row");
const trimStartSlider = document.querySelector("#trim-start-slider");
const trimEndSlider = document.querySelector("#trim-end-slider");
const trimStartNumber = document.querySelector("#trim-start-number");
const trimEndNumber = document.querySelector("#trim-end-number");
const positionMode = document.querySelector("#position-mode");
const xSlider = document.querySelector("#x-slider");
const xNumber = document.querySelector("#x-number");
const ySlider = document.querySelector("#y-slider");
const yNumber = document.querySelector("#y-number");
const positionCustomRows = document.querySelectorAll(".position-custom-row");
const uploadPreviewWrap = document.querySelector("#upload-preview-wrap");
const uploadPreviewScreen = document.querySelector("#upload-preview-screen");
const uploadPreviewSlot = document.querySelector("#upload-preview-slot");
const uploadPreviewImg = document.querySelector("#upload-preview-img");
const uploadPreviewVideo = document.querySelector("#upload-preview-video");
const currentStatus = document.querySelector("#current-status");
const restoreButton = document.querySelector("#restore-button");
const previewWrap = document.querySelector("#preview-wrap");
const previewImg = document.querySelector("#preview-img");
const systemStatus = document.querySelector("#system-status");
const rebootButton = document.querySelector("#reboot-button");
const rebootDialog = document.querySelector("#reboot-dialog");
const restoreDialog = document.querySelector("#restore-dialog");
const videoSourceDialog = document.querySelector("#video-source-dialog");
const videoPathInput = document.querySelector("#video-path-input");
const topAppBar = document.querySelector("mdui-top-app-bar");
const compactTitle = document.querySelector("#compact-title");
const largeTitle = document.querySelector(".large-title");

let selectedVideo = null;
let uploadInProgress = false;
let pollTimer = 0;
let titleAnimationFrame = 0;
let wasConverting = false;
let previewObjectUrl = null;
let previewScreenPx = { w: 0, h: 0 };
let mediaAspect = 0;

async function refreshStatus() {
  let status = {};
  try {
    const result = await exec(`[ -d '${UPDATE_MODDIR}' ] && echo '${UPDATE_MODDIR}' || echo '${ACTIVE_MODDIR}'`, { timeout: 10000 });
    moduleDir = result === UPDATE_MODDIR ? UPDATE_MODDIR : ACTIVE_MODDIR;
    bootctl = `${moduleDir}/tools/bootctl.sh`;
    status = parseProperties(await exec(`sh ${shellQuote(bootctl)} status`, { timeout: 20000 }));
  } catch (error) {
    markBridgeError(error);
    return;
  }
  markBridgeOk();
  applyStatus(status);
  return status;
}

function applyStatus(s) {
  // 連接狀態
  // 轉換中
  if (String(s.converting) === "1") {
    convertingChip.classList.remove("hidden");
    convertingLabel.textContent = t("convertingProgress", { progress: s.progress || 0 });
    convertProgress.classList.remove("hidden");
    convertProgress.value = Number(s.progress) || 0;
    convertButton.disabled = true;
    videoUpload.disabled = true;
    startPolling();
  } else {
    convertingChip.classList.add("hidden");
    convertProgress.classList.add("hidden");
    videoUpload.disabled = uploadInProgress;
    convertButton.disabled = uploadInProgress || !selectedVideo;
    stopPolling();
    // 錯誤顯示
    if (s.error) {
      errorCard.classList.remove("hidden");
      errorText.textContent = errorMessage(String(s.error));
    } else {
      errorCard.classList.add("hidden");
    }
  }

  // 已安裝狀態
  if (String(s.installed) === "1") {
    installedChip.classList.remove("hidden");
    restoreButton.classList.remove("hidden");
    const frames = s.frames && s.frames !== "-" ? t("framesCount", { count: s.frames }) : t("framesUnknown");
    const fps = s.fps && s.fps !== "-" ? ` · ${s.fps} fps` : "";
    const box = s.frame_w && s.frame_w !== "-" ? ` · ${s.frame_w}×${s.frame_h}` : "";
    const sizePct = s.size_pct && s.size_pct !== "-" ? ` · ${s.size_pct}%` : "";
    const loop = s.loop_count && s.loop_count !== "-" && Number(s.loop_count) > 1 ? ` · ${t("loopStatus", { count: s.loop_count })}` : "";
    const spd = s.speed_pct && s.speed_pct !== "-" && String(s.speed_pct) !== "100" ? ` · ${formatSpeed(s.speed_pct)}` : "";
    const rot = s.rotate_deg && Number(s.rotate_deg) > 0 ? ` · ${Number(s.rotate_deg)}°` : "";
    const clip = s.trim_start !== undefined && Number(s.trim_end) > 0
      ? ` · ${t("clipStatus", { start: formatSeconds(s.trim_start), end: formatSeconds(s.trim_end) })}` : "";
    const pos = s.pos_mode === "custom" ? ` · ${s.x_pct}%·${s.y_pct}%` : "";
    const fileSize = s.size && s.size !== "-" ? ` · ${formatBytes(s.size)}` : "";
    currentStatus.textContent = `${frames}${fps}${box}${sizePct}${loop}${spd}${rot}${clip}${pos}${fileSize}`;
    if (wasConverting && String(s.converting) !== "1") loadPreview();
  } else {
    installedChip.classList.add("hidden");
    restoreButton.classList.add("hidden");
    currentStatus.textContent = t("notInstalled");
    previewWrap.classList.add("hidden");
  }
  wasConverting = String(s.converting) === "1";

  const sw = s.screen_w || "-";
  const sh = s.screen_h || "-";
  systemStatus.textContent = t("systemStatusDetail", { width: sw, height: sh });
  updatePreviewScreenSize(sw, sh);
}

function errorMessage(code) {
  switch (code) {
    case "video_not_found": return t("errorVideoNotFound");
    case "convert_failed": return t("errorConvertFailed");
    case "convert_timeout": return t("errorConvertTimeout");
    case "zip_verify_failed": return t("errorZipVerify");
    case "converter_exited_unexpectedly": return t("errorConverterExited");
    default: return t("errorGeneric", { code });
  }
}

function markBridgeOk() {
  bridgeChip.classList.add("connected");
  bridgeChip.classList.remove("connection-error");
  bridgeLabel.textContent = t("bridgeConnected");
}

function markBridgeError(error) {
  bridgeChip.classList.remove("connected");
  bridgeChip.classList.add("connection-error");
  bridgeLabel.textContent = t("bridgeFailed");
  if (error && error.message) console.error(error.message);
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = window.setInterval(() => {
    refreshStatus().catch(() => {});
  }, 1200);
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = 0;
  }
}

// ---------------- 上傳 ----------------
function updateTopBarTitle() {
  if (titleAnimationFrame) return;
  titleAnimationFrame = window.requestAnimationFrame(() => {
    titleAnimationFrame = 0;
    const barBottom = topAppBar.getBoundingClientRect().bottom;
    const titleSubmerged = largeTitle.getBoundingClientRect().bottom <= barBottom + 1;
    compactTitle.classList.toggle("title-visible", titleSubmerged);
    compactTitle.setAttribute("aria-hidden", String(!titleSubmerged));
  });
}

async function uploadVideo(file) {
  const temporaryPath = `${moduleDir}/data/upload.video`;
  await exec(`rm -f '${temporaryPath}'`);
  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const bytes = new Uint8Array(await file.slice(offset, end).arrayBuffer());
    const encoded = bytesToBase64(bytes);
    const command = `printf '%s' '${encoded}' | base64 -d >> '${temporaryPath}' && echo ok`;
    const result = await exec(command, { timeout: 60000 });
    if (String(result).split(/\r?\n/).at(-1) !== "ok") throw new Error("write_failed");
    convertProgress.classList.remove("hidden");
    convertProgress.value = Math.round((end / file.size) * 100);
  }
}

async function startConvert() {
  if (!selectedVideo || uploadInProgress) return;
  uploadInProgress = true;
  setBusy(true);
  convertButton.disabled = true;
  try {
    let videoPath;
    if (selectedVideo.isPath) {
      videoPath = selectedVideo.path;
      showMessage(t("convertStarting"));
    } else {
      showMessage(t("uploadingFile"));
      await uploadVideo(selectedVideo);
      videoPath = `${moduleDir}/data/upload.video`;
      showMessage(t("uploadFinished"));
    }
    const fps = Number(fpsSlider.value) || 24;
    const maxsec = Number(durationSlider.value) || 10;
    const box = sizeMode.value === "custom" ? customSize.value.trim() : "auto";
    const sizePct = Number(sizeSlider.value) || 100;
    const loopCount = Number(loopSlider.value) || 1;
    const customPos = positionMode.value === "custom";
    const xPct = customPos ? (Number(xSlider.value) || 50) : 50;
    const yPct = customPos ? (Number(ySlider.value) || 38) : 38;
    const posMode = customPos ? "custom" : "default";
    const speedPct = Number(speedSlider.value) || 100;
    const rotateDeg = Math.min(360, Math.max(0, Math.round(Number(rotateSlider.value) || 0)));
    let trimStart = 0;
    let trimEnd = 0;
    if (trimReady && trimDuration > 0) {
      const start = Number(trimStartSlider.value) || 0;
      const end = Number(trimEndSlider.value) || 0;
      // 開始時間 > 0 或結束時間未到影片結尾才算真正截取
      if (start > 0 || end < trimDuration - 0.001) {
        trimStart = start;
        trimEnd = end;
      }
    }
    const result = await exec(
      `sh ${shellQuote(bootctl)} convert ${shellQuote(videoPath)} ${fps} ${maxsec} ${shellQuote(box)} ${sizePct} ${loopCount} ${xPct} ${yPct} ${shellQuote(posMode)} ${speedPct} ${rotateDeg} ${trimStart} ${trimEnd}`,
      { timeout: 30000 },
    );
    if (!result.includes("OK started")) throw new Error(result.includes("ERROR busy") ? "busy" : "start_failed");
    showMessage(t("convertingWait"));
    await refreshStatus();
  } catch (error) {
    showMessage(error.message === "busy" ? t("convertBusy") : t("operationFailed", { message: error.message }));
    await refreshStatus();
  } finally {
    uploadInProgress = false;
    setBusy(false);
    await refreshStatus();
  }
}

function setBusy(busy) {
  videoUpload.disabled = busy;
  convertButton.disabled = busy || !selectedVideo;
  document.querySelector("#refresh-button").disabled = busy;
}

async function loadPreview() {
  try {
    const encoded = await exec(`base64 '${moduleDir}/data/preview.jpg'`, { timeout: 60000 });
    const clean = String(encoded).replace(/\s+/g, "");
    if (!clean) return;
    previewImg.src = `data:image/jpeg;base64,${clean}`;
    previewWrap.classList.remove("hidden");
  } catch {
    previewWrap.classList.add("hidden");
  }
}

// ---------------- 恢復 / 重啟 ----------------
async function restoreDefault() {
  try {
    const result = await exec(`sh ${shellQuote(bootctl)} restore`, { timeout: 20000 });
    if (!result.includes("OK restored")) throw new Error(result);
    showMessage(t("restoreDone"));
    await refreshStatus();
  } catch (error) {
    showMessage(t("restoreFailed", { message: error.message }));
  }
}

function requestFilePicker() {
  if (!hasKsuBridge) {
    videoFile.click();
    return;
  }
  let opened = false;
  const mark = () => {
    opened = true;
    cleanup();
  };
  const cleanup = () => {
    videoFile.removeEventListener("change", mark);
    videoFile.removeEventListener("cancel", mark);
    document.removeEventListener("visibilitychange", mark);
    window.clearTimeout(timer);
  };
  const timer = window.setTimeout(() => {
    cleanup();
    if (!opened) openVideoSourceDialog();
  }, 1000);
  videoFile.addEventListener("change", mark);
  videoFile.addEventListener("cancel", mark);
  document.addEventListener("visibilitychange", mark);
  videoFile.click();
}

function openVideoSourceDialog() {
  videoPathInput.value = "";
  videoSourceDialog.open = true;
}

async function importFromPath(rawPath) {
  const path = String(rawPath || "").trim();
  if (!path.startsWith("/") || /[\r\n]/.test(path)) {
    showMessage(t("pathInvalid"));
    return;
  }
  const quoted = shellQuote(path);
  try {
    const statResult = await exec(`if [ -f ${quoted} ]; then stat -c %s ${quoted}; else echo missing; fi`, { timeout: 15000 });
    if (statResult === "missing" || !/^\d+$/.test(statResult)) {
      showMessage(t("pathNotFound"));
      return;
    }
    const name = path.split("/").pop() || "video";
    selectVideo({
      name,
      size: Number(statResult),
      isPath: true,
      path,
    });
    videoSourceDialog.open = false;
    showMessage(t("pathImported"));
  } catch (error) {
    showMessage(t("pathReadFailed", { message: error.message }));
  }
}

function clearUploadPreview() {
  try { uploadPreviewVideo.pause(); } catch { /* ignore */ }
  uploadPreviewImg.removeAttribute("src");
  uploadPreviewVideo.removeAttribute("src");
  mediaAspect = 0;
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

function setUploadPreviewVisible(visible) {
  uploadPreviewWrap.classList.toggle("hidden", !visible);
}

function updatePreviewScreenSize(swRaw, shRaw) {
  const sw = Number(swRaw) || 1440;
  const sh = Number(shRaw) || 3168;
  const maxH = 300;
  const maxW = 200;
  let w = maxW;
  if ((w * sh) / sw > maxH) w = Math.max(48, Math.floor((maxH * sw) / sh));
  const h = Math.round((w * sh) / sw);
  previewScreenPx.w = w;
  previewScreenPx.h = h;
  uploadPreviewScreen.style.width = `${w}px`;
  uploadPreviewScreen.style.height = `${h}px`;
  applyPreviewGeometry();
}

function applyPreviewGeometry() {
  const pct = Number(sizeSlider.value) || 100;
  sizeNumber.value = String(pct);
  const rot = Number(rotateSlider.value) || 0;
  rotateNumber.value = String(rot);
  const custom = positionMode.value === "custom";
  const x = custom ? (Number(xSlider.value) || 50) : 50;
  const y = custom ? (Number(ySlider.value) || 38) : 38;
  xNumber.value = String(x);
  yNumber.value = String(y);
  const { w: sw, h: sh } = previewScreenPx;
  if (sw <= 0 || sh <= 0) return;
  const mw = Math.max(1, Math.round((sw * pct) / 100));
  const mh = Math.max(1, Math.round(mediaAspect > 0 ? mw / mediaAspect : (mw * 3) / 4));
  uploadPreviewSlot.style.width = `${mw}px`;
  uploadPreviewSlot.style.height = `${mh}px`;
  uploadPreviewSlot.style.left = `${Math.round((sw * x) / 100 - mw / 2)}px`;
  uploadPreviewSlot.style.top = `${Math.round((sh * y) / 100 - mh / 2)}px`;
  // 旋轉即時預覽：旋轉後等比縮放至槽位內（模擬轉換結果的黑邊留白）
  let transform = "";
  if (rot !== 0) {
    const rad = (rot * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const bw = mw * cos + mh * sin;
    const bh = mw * sin + mh * cos;
    const fit = Math.min(mw / bw, mh / bh);
    transform = `rotate(${rot}deg) scale(${fit})`;
  }
  uploadPreviewImg.style.transform = transform;
  uploadPreviewVideo.style.transform = transform;
}

function onPreviewMediaLoaded(w, h) {
  if (w > 0 && h > 0) {
    mediaAspect = w / h;
    applyPreviewGeometry();
  }
}

function showUploadPreview(fileLike) {
  clearUploadPreview();
  if (!fileLike || fileLike.isPath) {
    setUploadPreviewVisible(false);
    return;
  }
  const lower = (fileLike.name || "").toLowerCase();
  const isGif = lower.endsWith(".gif");
  previewObjectUrl = URL.createObjectURL(fileLike);
  uploadPreviewImg.classList.toggle("hidden", !isGif);
  uploadPreviewVideo.classList.toggle("hidden", isGif);
  uploadPreviewVideo.loop = Number(loopSlider.value) > 1;
  if (isGif) {
    uploadPreviewImg.src = previewObjectUrl;
  } else {
    uploadPreviewVideo.src = previewObjectUrl;
    uploadPreviewVideo.play().catch(() => {});
  }
  setUploadPreviewVisible(true);
  applyPreviewGeometry();
}

function selectVideo(fileLike) {
  disableTrimControls(); // 先隱藏上一檔的截取範圍，待確認時長後再啟用
  if (!fileLike || fileLike.size <= 0) {
    showUploadPreview(null);
    showMessage(t("fileEmpty"));
    return;
  }
  if (fileLike.size > 1024 * 1024 * 1024) {
    showUploadPreview(null);
    showMessage(t("fileTooLarge"));
    return;
  }
  const lower = (fileLike.name || "").toLowerCase();
  const ok = [".mp4", ".mov", ".webm", ".mkv", ".m4v", ".3gp", ".ts", ".gif"].some((ext) => lower.endsWith(ext));
  if (!ok) {
    showUploadPreview(null);
    showMessage(t("unsupportedType"));
    return;
  }
  selectedVideo = fileLike;
  const source = fileLike.isPath ? fileLike.path : fileLike.name;
  videoName.textContent = `${source} · ${formatBytes(fileLike.size)}`;
  convertButton.disabled = uploadInProgress;
  showUploadPreview(fileLike);
  prepareTrim(fileLike);
  showMessage(t("fileSelected"));
}

// ---------------- 初始化 ----------------
function init() {
  applyTranslations();
  window.addEventListener("scroll", updateTopBarTitle, { passive: true });

  document.querySelector("#back-button").addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.close();
  });

  document.querySelector("#refresh-button").addEventListener("click", async () => {
    document.querySelector("#refresh-button").disabled = true;
    await refreshStatus();
    document.querySelector("#refresh-button").disabled = uploadInProgress;
  });

  videoUpload.addEventListener("click", requestFilePicker);
  videoFile.addEventListener("change", () => {
    if (videoFile.files && videoFile.files[0]) selectVideo(videoFile.files[0]);
    videoFile.value = "";
  });

  fpsSlider.addEventListener("input", () => {
    fpsNumber.value = fpsSlider.value;
  });
  fpsNumber.addEventListener("change", () => {
    if (numberToSlider(fpsNumber, fpsSlider)) fpsNumber.value = fpsSlider.value;
  });
  durationSlider.addEventListener("input", () => {
    durationNumber.value = durationSlider.value;
  });
  durationNumber.addEventListener("change", () => {
    if (numberToSlider(durationNumber, durationSlider)) durationNumber.value = durationSlider.value;
  });
  sizeMode.addEventListener("change", () => {
    customSizeRow.classList.toggle("hidden", sizeMode.value !== "custom");
  });

  sizeSlider.addEventListener("input", applyPreviewGeometry);
  sizeNumber.addEventListener("change", () => {
    if (numberToSlider(sizeNumber, sizeSlider)) applyPreviewGeometry();
  });
  loopSlider.addEventListener("input", () => {
    loopNumber.value = loopSlider.value;
    uploadPreviewVideo.loop = Number(loopSlider.value) > 1;
  });
  loopNumber.addEventListener("change", () => {
    if (numberToSlider(loopNumber, loopSlider)) {
      loopNumber.value = loopSlider.value;
      uploadPreviewVideo.loop = Number(loopSlider.value) > 1;
    }
  });
  speedSlider.addEventListener("input", () => {
    speedNumber.value = speedToNumber();
  });
  speedNumber.addEventListener("change", () => {
    speedToSlider();
    speedNumber.value = speedToNumber();
  });
  rotateSlider.addEventListener("input", applyPreviewGeometry);
  rotateNumber.addEventListener("change", () => {
    if (numberToSlider(rotateNumber, rotateSlider)) applyPreviewGeometry();
  });
  trimStartSlider.addEventListener("input", updateTrimBounds);
  trimEndSlider.addEventListener("input", updateTrimBounds);
  trimStartNumber.addEventListener("change", () => {
    if (numberToSlider(trimStartNumber, trimStartSlider)) updateTrimBounds();
  });
  trimEndNumber.addEventListener("change", () => {
    if (numberToSlider(trimEndNumber, trimEndSlider)) updateTrimBounds();
  });
  positionMode.addEventListener("change", () => {
    positionCustomRows.forEach((row) => row.classList.toggle("hidden", positionMode.value !== "custom"));
    applyPreviewGeometry();
  });
  xSlider.addEventListener("input", applyPreviewGeometry);
  xNumber.addEventListener("change", () => {
    if (numberToSlider(xNumber, xSlider)) applyPreviewGeometry();
  });
  ySlider.addEventListener("input", applyPreviewGeometry);
  yNumber.addEventListener("change", () => {
    if (numberToSlider(yNumber, ySlider)) applyPreviewGeometry();
  });
  uploadPreviewImg.addEventListener("load", () => {
    onPreviewMediaLoaded(uploadPreviewImg.naturalWidth, uploadPreviewImg.naturalHeight);
  });
  uploadPreviewVideo.addEventListener("loadedmetadata", () => {
    notifyVideoMetadata();
    onPreviewMediaLoaded(uploadPreviewVideo.videoWidth, uploadPreviewVideo.videoHeight);
  });

  convertButton.addEventListener("click", startConvert);
  restoreButton.addEventListener("click", () => {
    restoreDialog.open = true;
  });
  document.querySelector("#confirm-restore").addEventListener("click", async () => {
    restoreDialog.open = false;
    await restoreDefault();
  });
  document.querySelector("#cancel-restore").addEventListener("click", () => {
    restoreDialog.open = false;
  });

  document.querySelector("#video-picker-fallback").addEventListener("click", () => {
    videoSourceDialog.open = false;
    setTimeout(() => videoFile.click(), 100);
  });
  document.querySelector("#confirm-video-path").addEventListener("click", () => {
    importFromPath(videoPathInput.value);
  });
  document.querySelector("#cancel-video-source").addEventListener("click", () => {
    videoSourceDialog.open = false;
  });

  rebootButton.addEventListener("click", () => {
    rebootDialog.open = true;
  });
  document.querySelector("#cancel-reboot").addEventListener("click", () => {
    rebootDialog.open = false;
  });
  document.querySelector("#confirm-reboot").addEventListener("click", async () => {
    rebootDialog.open = false;
    try {
      await exec("svc power reboot", { timeout: 10000 });
    } catch (error) {
      showMessage(t("restartFailed", { message: error.message }));
    }
  });

  (async () => {
    const status = await refreshStatus();
    if (status && String(status.installed) === "1" && String(status.converting) !== "1") {
      await loadPreview();
    }
  })();
}

init();
