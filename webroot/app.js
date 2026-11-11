// 開機動畫 for ColorOS - WebUI
// 視覺與互動沿用 Font Settings 那一版模板（卡片 + 列表 + chips + slider + sheet）。
const MODULE_ID = "coloros-bootanimation";
const MODDIR = `/data/adb/modules/${MODULE_ID}`;
const BOOTCTL = `${MODDIR}/tools/bootctl.sh`;
const UPLOAD = `${MODDIR}/data/upload.video`;
const CHUNK = 48 * 1024;

const els = {
  main: document.querySelector("[data-main]"),
  sub: document.querySelector("[data-sub]"),
  toast: document.querySelector("[data-toast]"),
};

const params = {
  fps: 24,
  maxsec: 10,
  size: 100,
  loop: 1,
  speed: 100,
  rotate: 0,
  box: "auto",
  posMode: "default",
  x: 50,
  y: 38,
  trimStart: 0,
  trimEnd: 0,
};

const state = {
  status: {},
  file: null,
  duration: 0,
  converting: false,
  progress: 0,
  preview: "",
  loaded: false,
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.dataset.show = "true";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { els.toast.dataset.show = "false"; }, 2600);
}

// KernelSU accepts exec(cmd), exec(cmd, fn) and exec(cmd, callbackName); older
// builds silently ignore the name form and never call back, which left the page
// waiting forever. Try a function callback first and always time out.
// KernelSU's signature is exec(command, optionsJson, callbackName): the callback
// is a global function *name*, and a function passed as the second argument is
// silently ignored - which is exactly how this page used to hang on "读取中".
function ksuExec(command, timeout) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (code, out) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: Number.isFinite(Number(code)) ? Number(code) : -1, out: String(out ?? "") });
    };
    const timer = setTimeout(() => finish(-1, "timeout"), timeout);
    const name = `__ba_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    window[name] = (code, stdout, stderr) => {
      delete window[name];
      const errno = Number(code) || 0;
      finish(errno === 0 ? 0 : errno, errno === 0 ? stdout : (stderr || stdout));
    };

    try {
      const sync = window.ksu.exec(command, "{}", name);
      if (sync != null && typeof sync !== "function") {
        delete window[name];
        finish(0, sync);
      }
    } catch (first) {
      delete window[name];
      try {
        finish(0, window.ksu.exec(command) ?? "");
      } catch (second) {
        finish(-1, String(second));
      }
    }
  });
}

async function exec(command, timeout = 30000) {
  if (window.ksu && typeof window.ksu.exec === "function") {
    return ksuExec(command, timeout);
  }
  // busybox httpd does not reliably forward POST bodies to the CGI, so the
  // command travels in the query string as base64. The relative URL covers a
  // WebView that serves the files itself; the absolute one is the fallback when
  // the page origin is not the local server.
  const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(command))));
  const absolute = "http://127.0.0.1:7126/cgi-bin/exec";
  // KernelSU serves the WebUI from an https virtual origin where a relative
  // path returns the raw CGI source, so https origins must use the absolute URL.
  const bases = location.protocol === "https:" ? [absolute, "cgi-bin/exec"] : ["cgi-bin/exec", absolute];
  for (const base of bases) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(`${base}?b64=${encoded}`, { signal: controller.signal });
      clearTimeout(timer);
      const text = await response.text();
      const cut = text.indexOf("\n");
      return { code: Number(text.slice(0, cut)), out: text.slice(cut + 1) };
    } catch (error) {
      /* try the next base */
    }
  }
  return { code: -1, out: "bridge_unavailable" };
}

function kv(text) {
  const result = {};
  for (const line of String(text || "").split("\n")) {
    const at = line.indexOf("=");
    if (at > 0) result[line.slice(0, at)] = line.slice(at + 1).trim();
  }
  return result;
}

function bytes(size) {
  const n = Number(size) || 0;
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

const ERROR_TEXT = {
  convert_failed: "轉換失敗：無法解碼該檔案（格式不支援或檔案損壞）",
  convert_timeout: "轉換逾時，請縮短影片或降低影格率",
  zip_verify_failed: "動畫包校驗失敗，請重試",
  converter_exited_unexpectedly: "轉換程序意外結束，請重試",
  trim_out_of_range: "截取區間超出素材長度",
  busy: "已有轉換在進行中",
  video_not_found: "找不到上傳的檔案",
};

function errorText(code) {
  if (!code) return "";
  return ERROR_TEXT[code] || `轉換失敗（${code}）`;
}

async function refreshStatus() {
  const { out } = await exec(`sh ${BOOTCTL} status`, 8000);
  state.status = kv(out);
  state.converting = state.status.converting === "1";
  state.progress = Number(state.status.progress) || 0;
  if (state.status.preview === "1" && !state.preview) await loadPreview();
}

// The preview is served as a static file next to the WebUI: base64 round trips
// through the CGI were the least reliable part of the old page.
async function loadPreview() {
  if (state.status.preview !== "1") {
    state.preview = "";
    return;
  }
  await exec(`[ -f '${MODDIR}/webroot/preview.jpg' ] || cp -f '${MODDIR}/data/preview.jpg' '${MODDIR}/webroot/preview.jpg'; echo ok`, 10000);
  state.preview = `preview.jpg?t=${Date.now()}`;
}

function row(name, opts) {
  const wrap = el("div", "ba-row");
  const head = el("div", "ba-row-head");
  head.append(el("span", "name", name));
  const value = el("span", "val", opts.format(params[opts.key]));
  head.append(value);

  const input = el("input", "slider");
  input.type = "range";
  input.min = opts.min;
  input.max = opts.max;
  input.step = opts.step || 1;
  input.value = params[opts.key];
  const paint = () => {
    const pct = ((input.value - opts.min) / (opts.max - opts.min)) * 100;
    input.style.setProperty("--fill", `${pct}%`);
    value.textContent = opts.format(input.value);
  };
  input.addEventListener("input", () => {
    params[opts.key] = Number(input.value);
    paint();
  });
  paint();
  wrap.append(head, input);
  return wrap;
}

function statusCard() {
  const card = el("section", "card");
  const head = el("div", "card-head");
  const copy = el("div", "card-copy");
  copy.append(el("div", "card-title typescale-title-medium-emphasized", "目前開機動畫"));
  const installed = state.status.installed === "1";
  copy.append(el("div", "list-supporting",
    installed ? `已套用自訂動畫 · ${bytes(state.status.size)} · ${state.status.frames || "?"} 幀`
      : "尚未上傳，使用系統預設動畫"));
  head.append(copy);
  card.append(head);

  if (installed) {
    const preview = el("div", "ba-preview");
    const info = el("div", "ba-kv");
    const lines = [
      ["影格尺寸", `${state.status.frame_w || "?"}×${state.status.frame_h || "?"}`],
      ["影格率", `${state.status.fps || "?"} fps`],
      ["縮放 / 循環", `${state.status.size_pct || 100}% · ${state.status.loop_count || 1} 次`],
    ];
    for (const [k, v] of lines) {
      info.append(el("div", "v", v));
      info.append(el("div", "k", k));
    }
    if (state.preview) {
      const img = el("img");
      img.alt = "動畫預覽";
      img.src = state.preview;
      preview.append(img);
    }
    preview.append(info);
    card.append(preview);
  }

  if (state.converting) {
    const bar = el("div", "ba-progress");
    const fill = el("span");
    fill.style.width = `${state.progress}%`;
    bar.append(fill);
    card.append(el("div", "ba-note", `轉換中 ${state.progress}%`), bar);
  } else if (state.status.error) {
    // An older failure is kept in the status file until the next run; when an
    // animation is already installed that message must not read as "it broke".
    const prefix = installed ? "上次轉換：" : "";
    const note = el("div", "ba-note", prefix + errorText(state.status.error));
    note.style.color = installed ? "var(--md-sys-color-on-surface-variant)" : "var(--md-sys-color-error)";
    card.append(note);
  }
  return card;
}

function uploadCard() {
  const card = el("section", "card");
  const copy = el("div", "card-copy");
  copy.append(el("div", "card-title typescale-title-medium-emphasized", "上傳素材"));
  copy.append(el("div", "list-supporting", "支援 MP4 / GIF，轉換後會自動置中於上黃金分割點"));
  card.append(copy);

  const wrap = el("div", "ba-file");
  const input = el("input");
  input.type = "file";
  input.accept = "video/*,image/gif";
  const label = el("label", "ba-pick");
  label.append(el("span", null, state.file ? "重新選擇檔案" : "選擇影片或 GIF"));
  label.append(input);

  if (state.file) {
    wrap.append(el("div", "ba-note",
      `${state.file.name}${state.duration ? ` · ${state.duration.toFixed(2)}s` : ""}`));
  }
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    await upload(file);
  });
  wrap.append(label);
  card.append(wrap);
  return card;
}

function paramsCard() {
  const card = el("section", "card");
  const copy = el("div", "card-copy");
  copy.append(el("div", "card-title typescale-title-medium-emphasized", "轉換參數"));
  card.append(copy);

  card.append(row("影格率", { key: "fps", min: 10, max: 60, format: (v) => `${v} fps` }));
  card.append(row("最長時長", { key: "maxsec", min: 1, max: 20, format: (v) => `${v} 秒` }));
  card.append(row("畫面大小", { key: "size", min: 10, max: 100, format: (v) => `${v}%` }));
  card.append(row("循環次數", { key: "loop", min: 1, max: 20, format: (v) => `${v} 次` }));
  card.append(row("播放速度", { key: "speed", min: 25, max: 400, step: 5, format: (v) => `${v}%` }));
  card.append(row("旋轉角度", { key: "rotate", min: 0, max: 360, step: 5, format: (v) => `${v}°` }));

  const boxChips = el("div", "chip-row");
  for (const [value, label] of [["auto", "自動"], ["720x1584", "720p"], ["1080x2376", "1080p"]]) {
    const chip = el("button", "chip", label);
    chip.type = "button";
    chip.dataset.selected = params.box === value ? "true" : "false";
    chip.addEventListener("click", () => {
      params.box = value;
      [...boxChips.children].forEach((c) => { c.dataset.selected = c === chip ? "true" : "false"; });
    });
    boxChips.append(chip);
  }
  card.append(el("div", "ba-note", "影格尺寸"), boxChips);

  const posChips = el("div", "chip-row");
  for (const [value, label] of [["default", "預設位置"], ["custom", "自訂位置"]]) {
    const chip = el("button", "chip", label);
    chip.type = "button";
    chip.dataset.selected = params.posMode === value ? "true" : "false";
    chip.addEventListener("click", () => {
      params.posMode = value;
      [...posChips.children].forEach((c) => { c.dataset.selected = c === chip ? "true" : "false"; });
      render();
    });
    posChips.append(chip);
  }
  card.append(el("div", "ba-note", "畫面位置"), posChips);

  if (params.posMode === "custom") {
    card.append(row("水平位置", { key: "x", min: 0, max: 100, format: (v) => `${v}%` }));
    card.append(row("垂直位置", { key: "y", min: 0, max: 100, format: (v) => `${v}%` }));
  }
  return card;
}

function trimCard() {
  const card = el("section", "card");
  const copy = el("div", "card-copy");
  copy.append(el("div", "card-title typescale-title-medium-emphasized", "截取區間"));
  copy.append(el("div", "list-supporting",
    state.duration ? `素材長度 ${state.duration.toFixed(2)} 秒，0 表示不啟用` : "0 表示不啟用"));
  card.append(copy);

  const wrap = el("div", "ba-actions");
  for (const [key, placeholder] of [["trimStart", "開始（秒）"], ["trimEnd", "結束（秒）"]]) {
    const field = el("div", "ba-file");
    field.style.flex = "1";
    const input = el("input", "ba-input");
    input.type = "number";
    input.min = "0";
    input.step = "0.1";
    input.placeholder = placeholder;
    input.value = params[key] || "";
    input.addEventListener("change", () => { params[key] = Number(input.value) || 0; });
    field.append(input);
    wrap.append(field);
  }
  card.append(wrap);
  return card;
}

function actionsCard() {
  const card = el("div", "ba-actions");
  const convert = el("button", "ba-btn", state.converting ? `轉換中 ${state.progress}%` : "開始轉換");
  convert.disabled = state.converting || !state.file;
  convert.addEventListener("click", startConvert);

  const restore = el("button", "ba-btn", "恢復預設");
  restore.dataset.kind = "tonal";
  restore.addEventListener("click", restoreDefault);

  card.append(convert, restore);
  return card;
}

function render() {
  els.main.replaceChildren(
    statusCard(),
    uploadCard(),
    paramsCard(),
    trimCard(),
    actionsCard(),
  );
  const installed = state.status.installed === "1";
  els.sub.textContent = state.converting
    ? `轉換中 ${state.progress}%`
    : installed ? "已套用自訂動畫" : "使用系統預設動畫";
}

async function upload(file) {
  const buffer = new Uint8Array(await file.arrayBuffer());
  toast("正在上傳…");
  await exec(`rm -f '${UPLOAD}'`, 10000);

  for (let offset = 0; offset < buffer.length; offset += CHUNK) {
    const slice = buffer.subarray(offset, offset + CHUNK);
    let binary = "";
    for (let i = 0; i < slice.length; i++) binary += String.fromCharCode(slice[i]);
    const encoded = btoa(binary);
    const result = await exec(`printf '%s' '${encoded}' | base64 -d >> '${UPLOAD}' && echo ok`, 30000);
    if (!/ok/.test(result.out)) {
      toast("上傳失敗，請重試");
      return;
    }
  }

  state.file = file;
  const probe = kv((await exec(`sh ${BOOTCTL} probe '${UPLOAD}'`, 30000)).out);
  state.duration = Number(probe.duration) || 0;
  params.trimStart = 0;
  params.trimEnd = 0;
  toast("上傳完成");
  render();
}

async function startConvert() {
  if (!state.file) return;
  state.converting = true;
  state.progress = 0;
  render();
  const command = [
    `sh ${BOOTCTL} convert '${UPLOAD}'`,
    params.fps, params.maxsec, `'${params.box}'`, params.size, params.loop,
    params.x, params.y, params.posMode, params.speed, params.rotate,
    params.trimStart, params.trimEnd,
  ].join(" ");
  const result = await exec(command, 60000);
  if (/ERROR/.test(result.out)) {
    const code = result.out.split("ERROR")[1].trim();
    toast(errorText(code));
    state.converting = false;
    render();
    return;
  }
  poll();
}

function poll() {
  clearTimeout(poll.timer);
  poll.timer = setTimeout(async () => {
    await refreshStatus();
    if (state.converting) {
      render();
      poll();
      return;
    }
    if (state.status.error) toast(errorText(state.status.error));
    else toast("轉換完成，重新啟動後生效");
    await loadPreview();
    render();
  }, 1200);
}

async function restoreDefault() {
  if (!confirm("恢復系統預設開機動畫？")) return;
  await exec(`sh ${BOOTCTL} restore`, 20000);
  state.preview = "";
  await refreshStatus();
  render();
  toast("已恢復預設，重新啟動後生效");
}

(async function boot() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.dataset.theme = "dark";
  }
  try {
    await refreshStatus();
  } catch (error) {
    els.sub.textContent = "读取模块状态失败";
  }
  state.converting = state.status.converting === "1";
  state.loaded = true;
  render();
  if (state.converting) poll();
})();
