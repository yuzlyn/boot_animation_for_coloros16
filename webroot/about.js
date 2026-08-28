const ABOUT_TRANSLATIONS = {
  "zh-CN": {
    back: "返回",
    readme: "README",
    authorLinkLabel: "访问 yuzlyn 的 GitHub 主页",
    authorAvatarAlt: "yuzlyn 的 GitHub 头像",
    overview: "适用于 ColorOS / realme UI / OxygenOS 的开机动画模块：上传视频或 GIF，自动转换为水平居中、位于上黄金分割点的开机动画。",
    readmeLabel: "模块 README",
    compatibilityTitle: "兼容范围",
    compatibilityAndroid: "Android 8.0 及以上版本（API 26+）。",
    compatibilityRoot: "KernelSU / Magisk，或兼容 WebUI 与 systemless 模块挂载的实现。",
    compatibilityOem: "适用于 ColorOS / realme UI / OxygenOS（OPPO / OnePlus / realme）。",
    featuresTitle: "功能",
    featureUpload: "在 WebUI 上传视频或 GIF，自动转换为开机动画。",
    featureFormat: "支持 mp4 / mov / webm / mkv / gif 等格式。",
    featureDecode: "视频使用 MediaCodec 硬解码，GIF 使用系统解码器，无需 ffmpeg。",
    featurePosition: "动画水平居中，垂直位于上黄金分割点（距顶部约 0.382×画面高）。",
    featureSize: "可自定义动画大小（10–100%），选择文件后即时预览大小与位置。",
    featurePlayback: "可设置循环播放或只播放一次。",
    featureSpeed: "可调播放速度（0.25–4×）。",
    featureCustomPosition: "可自定义水平与垂直位置，或使用默认的居中上黄金分割点。",
    featureOptions: "可调帧率（10–60 fps）、时长上限与输出尺寸。",
    workingTitle: "工作方式",
    workingText: "转换器将视频/GIF 解码为逐帧 JPEG，打包为 ColorOS 格式的 bootanimation.zip，由模块挂载替换系统开机动画；仅替换开机动画，不影响关机动画，不直接修改系统分区。",
    recoveryTitle: "故障恢复",
    recoveryText: "如果开机动画无法显示或系统启动异常，请在 KernelSU / Magisk 中停用模块并重启。保留 adb root 时也可以执行：",
    linksTitle: "相关链接",
    projectLinksLabel: "项目链接",
    sourceRepository: "源码仓库",
    donateTitle: "捐赠作者",
    donateSubtitle: "支付宝",
    donateHeading: "给一点支持",
    donateDescription: "模块免费提供，由我独立开发和维护。持续优化体验需要时间，如果你愿意，可以给予一点支持。",
    paymentMethods: "支付方式",
    alipayAlt: "支付宝收款二维码",
    wechatPay: "微信支付",
    wechatAlt: "微信支付收款二维码",
    wechatReward: "微信赞赏",
    previewWechat: "放大微信支付二维码",
    previewAlipay: "放大支付宝收款二维码",
    paymentPreview: "支付二维码预览",
    closePreview: "关闭预览",
    donateThanks: "免费的模块，真的要捐赠吗",
    donateConfirmTitle: "你确定吗",
    cancelDonate: "取消",
    confirmDonate: "确定",
  },
  "zh-TW": {
    back: "返回",
    readme: "README",
    authorLinkLabel: "前往 yuzlyn 的 GitHub 個人頁面",
    authorAvatarAlt: "yuzlyn 的 GitHub 大頭貼",
    overview: "適用於 ColorOS / realme UI / OxygenOS 的開機動畫模組：上傳影片或 GIF，自動轉換為水平居中、位於上黃金分割點的開機動畫。",
    readmeLabel: "模組 README",
    compatibilityTitle: "相容範圍",
    compatibilityAndroid: "Android 8.0 及以上版本（API 26+）。",
    compatibilityRoot: "KernelSU / Magisk，或相容 WebUI 與 systemless 模組掛載的實作。",
    compatibilityOem: "適用於 ColorOS / realme UI / OxygenOS（OPPO / OnePlus / realme）。",
    featuresTitle: "功能",
    featureUpload: "在 WebUI 上傳影片或 GIF，自動轉換為開機動畫。",
    featureFormat: "支援 mp4 / mov / webm / mkv / gif 等格式。",
    featureDecode: "影片使用 MediaCodec 硬解碼，GIF 使用系統解碼器，無需 ffmpeg。",
    featurePosition: "動畫水平居中，垂直位於上黃金分割點（距頂部約 0.382×畫面高）。",
    featureSize: "可自訂動畫大小（10–100%），選擇檔案後即時預覽大小與位置。",
    featurePlayback: "可設定循環播放或只播放一次。",
    featureSpeed: "可調播放速度（0.25–4×）。",
    featureCustomPosition: "可自訂水平與垂直位置，或使用預設的居中上黃金分割點。",
    featureOptions: "可調幀率（10–60 fps）、時長上限與輸出尺寸。",
    workingTitle: "工作方式",
    workingText: "轉換器將影片/GIF 解碼為逐幀 JPEG，打包為 ColorOS 格式的 bootanimation.zip，由模組掛載替換系統開機動畫；僅替換開機動畫，不影響關機動畫，不直接修改系統分區。",
    recoveryTitle: "故障恢復",
    recoveryText: "如果開機動畫無法顯示或系統啟動異常，請在 KernelSU / Magisk 中停用模組並重新啟動。保留 adb root 時也可以執行：",
    linksTitle: "相關連結",
    projectLinksLabel: "專案連結",
    sourceRepository: "原始碼儲存庫",
    donateTitle: "贊助作者",
    donateSubtitle: "支付寶",
    donateHeading: "給一點支持",
    donateDescription: "模組免費提供，由我獨立開發和維護。持續優化體驗需要時間，如果你願意，可以給予一點支持。",
    paymentMethods: "付款方式",
    alipayAlt: "支付寶收款 QR Code",
    wechatPay: "微信支付",
    wechatAlt: "微信支付收款 QR Code",
    wechatReward: "微信贊賞",
    previewWechat: "放大微信支付 QR Code",
    previewAlipay: "放大支付寶收款 QR Code",
    paymentPreview: "付款 QR Code 預覽",
    closePreview: "關閉預覽",
    donateThanks: "免費的模組，真的要贊助嗎",
    donateConfirmTitle: "你確定嗎",
    cancelDonate: "取消",
    confirmDonate: "確定",
  },
  "en-US": {
    back: "Back",
    readme: "README",
    authorLinkLabel: "Open yuzlyn's GitHub profile",
    authorAvatarAlt: "yuzlyn's GitHub avatar",
    overview: "A ColorOS / realme UI / OxygenOS boot animation module: upload a video or GIF in the WebUI and it is converted into a horizontally centered boot animation positioned at the upper golden-ratio point.",
    readmeLabel: "Module README",
    compatibilityTitle: "Compatibility",
    compatibilityAndroid: "Android 8.0 or later (API 26+).",
    compatibilityRoot: "KernelSU / Magisk, or a compatible WebUI and systemless module implementation.",
    compatibilityOem: "ColorOS / realme UI / OxygenOS (OPPO / OnePlus / realme).",
    featuresTitle: "Features",
    featureUpload: "Upload a video or GIF in the WebUI to convert it into a boot animation.",
    featureFormat: "Supports mp4 / mov / webm / mkv / gif and more.",
    featureDecode: "MediaCodec hardware decoding for videos and the system decoder for GIFs - no ffmpeg required.",
    featurePosition: "Horizontally centered, vertical center at the upper golden-ratio point (~0.382× screen height from the top).",
    featureSize: "Custom animation size (10-100%) with a live size-and-position preview after choosing a file.",
    featurePlayback: "Loop playback or play once.",
    featureSpeed: "Adjustable playback speed (0.25-4×).",
    featureCustomPosition: "Custom horizontal and vertical position, or the default centered upper golden-ratio point.",
    featureOptions: "Adjustable frame rate (10-60 fps), duration cap, and output size.",
    workingTitle: "How it works",
    workingText: "The converter decodes the video/GIF into per-frame JPEGs and packs them into a ColorOS-format bootanimation.zip that the module mounts to replace the system boot animation. Only the boot animation is replaced - the shutdown animation is untouched and the system partition is never modified directly.",
    recoveryTitle: "Recovery",
    recoveryText: "If the boot animation fails to display or the system cannot start normally, disable the module in KernelSU / Magisk and restart. With adb root available:",
    linksTitle: "Links",
    projectLinksLabel: "Project links",
    sourceRepository: "Source repository",
    donateTitle: "Support the author",
    donateSubtitle: "Alipay",
    donateHeading: "Give a little support",
    donateDescription: "This module is free and independently maintained. Improving the experience takes time, and any support is appreciated.",
    paymentMethods: "Payment methods",
    alipayAlt: "Alipay payment QR code",
    wechatPay: "WeChat Pay",
    wechatAlt: "WeChat Pay QR code",
    wechatReward: "WeChat reward",
    previewWechat: "Enlarge WeChat Pay QR code",
    previewAlipay: "Enlarge Alipay payment QR code",
    paymentPreview: "Payment QR code preview",
    closePreview: "Close preview",
    donateThanks: "A free module, do you really want to donate?",
    donateConfirmTitle: "Are you sure?",
    cancelDonate: "Cancel",
    confirmDonate: "Confirm",
  },
};

function resolveLocale() {
  const language = String(navigator.language || "").replaceAll("_", "-").toLowerCase();
  if (/^zh-(?:[^-]+-)*tw(?:-|$)/.test(language)) return "zh-TW";
  if (language === "zh" || language.startsWith("zh-")) return "zh-CN";
  return "en-US";
}

const locale = resolveLocale();

function t(key) {
  return ABOUT_TRANSLATIONS[locale][key] ?? ABOUT_TRANSLATIONS["en-US"][key] ?? key;
}

function applyTranslations() {
  document.documentElement.lang = locale;
  document.title = t(document.body.dataset.pageTitleKey || "readme");
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  const attributes = ["aria-label", "title", "alt"];
  for (const attribute of attributes) {
    const datasetName = `i18n${attribute.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("")}`;
    for (const element of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
      element.setAttribute(attribute, t(element.dataset[datasetName]));
    }
  }
}

function exec(command) {
  return new Promise((resolve, reject) => {
    if (!window.ksu || typeof window.ksu.exec !== "function") {
      reject(new Error("KSU_BRIDGE_UNAVAILABLE"));
      return;
    }
    const callbackName = `coloros_ba_about_${Date.now()}`;
    window[callbackName] = (errno, stdout) => {
      delete window[callbackName];
      if (Number(errno)) reject(new Error("KSU_COMMAND_FAILED"));
      else resolve(String(stdout || ""));
    };
    try {
      const result = window.ksu.exec(command, "{}", callbackName);
      if (result !== undefined && result !== null) {
        delete window[callbackName];
        resolve(String(result));
      }
    } catch (error) {
      delete window[callbackName];
      reject(error);
    }
  });
}

async function applyTheme() {
  try {
    const output = await exec("settings get secure theme_customization_overlay_packages");
    const start = output.indexOf("{");
    const settings = JSON.parse(start >= 0 ? output.slice(start) : output);
    const seed = window.FontSettingsTheme?.normalizeSeed(
      settings["android.theme.customization.system_palette"] ||
        settings["android.theme.customization.accent_color"],
    );
    if (seed) window.FontSettingsTheme.updateSystemSeed(seed);
  } catch {
    // Keep the cached seed when the page is opened outside KernelSU.
  }
}

function initialize() {
  applyTranslations();
  if (!window.FontSettingsTheme) mdui.setColorScheme("#3c5a8c");
  applyTheme();
  document.querySelector("#about-back").addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  });
  initializePaymentPreview();
}

function initializePaymentPreview() {
  const preview = document.querySelector("#payment-preview");
  if (!preview) return;

  const confirmation = document.querySelector("#donate-confirm");
  let pendingTrigger = null;

  const image = preview.querySelector("img");
  const close = () => {
    preview.hidden = true;
    image.src = "";
  };
  const open = (trigger) => {
    image.src = trigger.dataset.paymentPreview;
    image.alt = t(trigger.dataset.paymentAltKey);
    preview.hidden = false;
    preview.querySelector(".payment-preview-close").focus();
  };
  const closeConfirmation = () => {
    confirmation.hidden = true;
    pendingTrigger = null;
  };
  const requestConfirmation = (trigger) => {
    pendingTrigger = trigger;
    confirmation.hidden = false;
    confirmation.querySelector(".donate-confirm-accept").focus();
  };

  document.querySelectorAll("[data-payment-preview]").forEach((button) => {
    button.addEventListener("click", () => requestConfirmation(button));
  });
  preview.querySelectorAll(".payment-preview-backdrop, .payment-preview-close").forEach((button) => {
    button.addEventListener("click", close);
  });
  confirmation.querySelectorAll(".donate-confirm-backdrop, .donate-confirm-cancel").forEach((button) => {
    button.addEventListener("click", closeConfirmation);
  });
  confirmation.querySelector(".donate-confirm-accept").addEventListener("click", () => {
    const trigger = pendingTrigger;
    closeConfirmation();
    if (trigger) open(trigger);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !preview.hidden) close();
    else if (event.key === "Escape" && !confirmation.hidden) closeConfirmation();
  });
}

window.addEventListener("DOMContentLoaded", initialize);
