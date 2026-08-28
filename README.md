# 開機動畫 for ColorOS / Boot animation for ColorOS

[![Release](https://img.shields.io/github/v/release/yuzlyn/boot_animation_for_coloros16?label=release)](https://github.com/yuzlyn/boot_animation_for_coloros16/releases/latest)
[![License](https://img.shields.io/github/license/yuzlyn/boot_animation_for_coloros16)](LICENSE)

適用於 ColorOS / realme UI / OxygenOS 的開機動畫模組。在 KernelSU / Magisk 的 WebUI 上傳影片或 GIF，自動轉換為開機動畫。

[下載最新版本](https://github.com/yuzlyn/boot_animation_for_coloros16/releases/latest)

---

## 繁體中文 (zh-TW)

### 簡介
適用於 ColorOS / realme UI / OxygenOS 的開機動畫模組：上傳影片或 GIF，自動轉換為水平居中、位於上黃金分割點的開機動畫。

### 安裝
1. 從 [Releases](https://github.com/yuzlyn/boot_animation_for_coloros16/releases/latest) 下載最新版 zip。
2. 在 KernelSU / Magisk 中刷入模組並重新啟動。
3. 在模組頁面點擊 WebUI，上傳影片或 GIF，設定幀率、時長上限與輸出尺寸，點擊「開始轉換」。
4. 轉換完成後重新啟動手機，新的開機動畫即生效。

### 相容範圍
- Android 8.0 及以上版本（API 26+）。
- KernelSU / Magisk，或相容 WebUI 與 systemless 模組掛載的實作。
- 適用於 ColorOS / realme UI / OxygenOS（OPPO / OnePlus / realme）。

### 功能
- 在 WebUI 上傳影片或 GIF，自動轉換為開機動畫。
- 支援 mp4 / mov / webm / mkv / gif 等格式。
- 影片使用 MediaCodec 硬解碼，GIF 使用系統解碼器，無需 ffmpeg。
- 動畫水平居中，垂直位於上黃金分割點（距頂部約 0.382×畫面高）。
- 可自訂動畫大小（10–100%），選擇檔案後即時預覽大小與位置。
- 可設定循環次數（1–20 次），以拼接幀方式確保循環在所有裝置生效。
- 可調播放速度（0.25–4×）。
- 可自訂水平與垂直位置，或使用預設的居中上黃金分割點。
- 可調幀率（10–60 fps）、時長上限與輸出尺寸。
- WebUI 支援簡體中文、台灣繁體中文與英文。
- 內建關於頁面與贊助作者頁面。

### 工作方式
轉換器將影片/GIF 解碼為逐幀 JPEG，打包為 ColorOS 格式的 bootanimation.zip，由模組掛載替換系統開機動畫；僅替換開機動畫，不影響關機動畫，不直接修改系統分區。

### 原始碼
轉換器原始碼位於 [`src/com/yuzlyn/bootanim/Video2Boot.java`](src/com/yuzlyn/bootanim/Video2Boot.java)，以 `javac` + `d8` 編譯為 `tools/video2boot.jar`（Java 8 位元碼，min-api 26）。

### 故障恢復
如果開機動畫無法顯示或系統啟動異常，請在 KernelSU / Magisk 中停用模組並重新啟動。保留 adb root 時也可以執行：

```sh
adb shell su -c 'touch /data/adb/modules/coloros-bootanimation/disable'
adb reboot
```

### 版本歷史
- **v1.7.1** — 循環次數上限提高至 20 次
- **v1.7.0** — 循環改為次數設定（1–10 次），以幀拼接實現，不再依賴引擎循環
- **v1.6.0** — 新增播放速度調節（0.25–4×）；修復 WebUI 預覽（怪異播放按鈕、畫面拉伸、循環失效）
- **v1.5.0** — 新增自定義水平 / 垂直位置設定；重新排版上傳卡片（按鈕移至下一行右側）
- **v1.4.0** — 新增動畫大小設定（10–100%）與即時預覽；新增循環 / 單次播放設定
- **v1.3.0** — WebUI 全面多語支援（繁中 / 簡中 / 英文），三語 README
- **v1.2.0** — 新增關於頁面、贊助作者頁面與原始碼儲存庫入口
- **v1.1.0** — 新增 GIF 格式支援；動畫改為水平居中、垂直位於上黃金分割點
- **v1.0.0** — 首版：影片轉開機動畫（MediaCodec 硬解碼）

---

## 简体中文 (zh-CN)

### 简介
适用于 ColorOS / realme UI / OxygenOS 的开机动画模块：上传视频或 GIF，自动转换为水平居中、位于上黄金分割点的开机动画。

### 安装
1. 从 [Releases](https://github.com/yuzlyn/boot_animation_for_coloros16/releases/latest) 下载最新版 zip。
2. 在 KernelSU / Magisk 中刷入模块并重启。
3. 在模块页面点击 WebUI，上传视频或 GIF，设置帧率、时长上限与输出尺寸，点击「开始转换」。
4. 转换完成后重启手机，新的开机动画即生效。

### 兼容范围
- Android 8.0 及以上版本（API 26+）。
- KernelSU / Magisk，或兼容 WebUI 与 systemless 模块挂载的实现。
- 适用于 ColorOS / realme UI / OxygenOS（OPPO / OnePlus / realme）。

### 功能
- 在 WebUI 上传视频或 GIF，自动转换为开机动画。
- 支持 mp4 / mov / webm / mkv / gif 等格式。
- 视频使用 MediaCodec 硬解码，GIF 使用系统解码器，无需 ffmpeg。
- 动画水平居中，垂直位于上黄金分割点（距顶部约 0.382×画面高）。
- 可自定义动画大小（10–100%），选择文件后即时预览大小与位置。
- 可设置循环次数（1–20 次），以拼接帧方式确保循环在所有设备生效。
- 可调播放速度（0.25–4×）。
- 可自定义水平与垂直位置，或使用默认的居中上黄金分割点。
- 可调帧率（10–60 fps）、时长上限与输出尺寸。
- WebUI 支持简体中文、台湾繁体中文和英文。
- 内置关于页面与赞助作者页面。

### 工作方式
转换器将视频/GIF 解码为逐帧 JPEG，打包为 ColorOS 格式的 bootanimation.zip，由模块挂载替换系统开机动画；仅替换开机动画，不影响关机动画，不直接修改系统分区。

### 源码
转换器源码位于 [`src/com/yuzlyn/bootanim/Video2Boot.java`](src/com/yuzlyn/bootanim/Video2Boot.java)，使用 `javac` + `d8` 编译为 `tools/video2boot.jar`（Java 8 字节码，min-api 26）。

### 故障恢复
如果开机动画无法显示或系统启动异常，请在 KernelSU / Magisk 中停用模块并重启。保留 adb root 时也可以执行：

```sh
adb shell su -c 'touch /data/adb/modules/coloros-bootanimation/disable'
adb reboot
```

### 版本历史
- **v1.7.1** — 循环次数上限提高至 20 次
- **v1.7.0** — 循环改为次数设置（1–10 次），以帧拼接实现，不再依赖引擎循环
- **v1.6.0** — 新增播放速度调节（0.25–4×）；修复 WebUI 预览（怪异播放按钮、画面拉伸、循环失效）
- **v1.5.0** — 新增自定义水平 / 垂直位置设置；重新排版上传卡片（按钮移至下一行右侧）
- **v1.4.0** — 新增动画大小设置（10–100%）与即时预览；新增循环 / 单次播放设置
- **v1.3.0** — WebUI 全面多语言支持（繁中 / 简中 / 英文），三语 README
- **v1.2.0** — 新增关于页面、赞助作者页面与源码仓库入口
- **v1.1.0** — 新增 GIF 格式支持；动画改为水平居中、垂直位于上黄金分割点
- **v1.0.0** — 首版：视频转开机动画（MediaCodec 硬解码）

---

## English (en-US)

### Overview
A ColorOS / realme UI / OxygenOS boot animation module: upload a video or GIF in the WebUI and it is converted into a horizontally centered boot animation positioned at the upper golden-ratio point.

### Installation
1. Download the latest zip from [Releases](https://github.com/yuzlyn/boot_animation_for_coloros16/releases/latest).
2. Flash the module in KernelSU / Magisk and restart.
3. Open the WebUI from the module page, upload a video or GIF, set the frame rate, duration cap and output size, then tap "Start conversion".
4. Restart the phone after the conversion finishes and the new boot animation takes effect.

### Compatibility
- Android 8.0 or later (API 26+).
- KernelSU / Magisk, or a compatible WebUI and systemless module implementation.
- ColorOS / realme UI / OxygenOS (OPPO / OnePlus / realme).

### Features
- Upload a video or GIF in the WebUI to convert it into a boot animation.
- Supports mp4 / mov / webm / mkv / gif and more.
- MediaCodec hardware decoding for videos and the system decoder for GIFs — no ffmpeg required.
- Horizontally centered, vertical center at the upper golden-ratio point (~0.382× screen height from the top).
- Custom animation size (10–100%) with a live size-and-position preview after choosing a file.
- Set the loop count (1-20); frames are spliced so looping works on every device.
- Adjustable playback speed (0.25-4×).
- Custom horizontal and vertical position, or the default centered upper golden-ratio point.
- Adjustable frame rate (10–60 fps), duration cap, and output size.
- WebUI languages: Simplified Chinese, Traditional Chinese for Taiwan, and English.
- Built-in About and donation pages.

### How it works
The converter decodes the video/GIF into per-frame JPEGs and packs them into a ColorOS-format bootanimation.zip that the module mounts to replace the system boot animation. Only the boot animation is replaced — the shutdown animation is untouched and the system partition is never modified directly.

### Source code
The converter source lives in [`src/com/yuzlyn/bootanim/Video2Boot.java`](src/com/yuzlyn/bootanim/Video2Boot.java) and is compiled with `javac` + `d8` into `tools/video2boot.jar` (Java 8 bytecode, min-api 26).

### Recovery
If the boot animation fails to display or the system cannot start normally, disable the module in KernelSU / Magisk and restart. With adb root available:

```sh
adb shell su -c 'touch /data/adb/modules/coloros-bootanimation/disable'
adb reboot
```

### Version history
- **v1.7.1** — Loop count limit raised to 20
- **v1.7.0** — Loop count setting (1-10) via frame splicing, no longer relying on engine looping
- **v1.6.0** — Playback speed setting (0.25-4×); WebUI preview fixes (odd play button, stretched image, broken loop)
- **v1.5.0** — Custom horizontal / vertical position setting; upload card re-layout (button on its own row, right-aligned)
- **v1.4.0** — Animation size setting (10-100%) with live preview; loop / play-once playback
- **v1.3.0** — Full WebUI multilingual support (zh-TW / zh-CN / en-US) and trilingual README
- **v1.2.0** — About page, donation page, and source repository entry
- **v1.1.0** — GIF format support; animation horizontally centered at the upper golden-ratio point
- **v1.0.0** — Initial release: video to boot animation (MediaCodec hardware decoding)
