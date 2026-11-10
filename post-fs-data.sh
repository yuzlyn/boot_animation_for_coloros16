#!/system/bin/sh
# 僅在使用者上傳了自定義開機動畫後才掛載，
# 未上傳時保持系統默認動畫（關機動畫 rbootanimation.zip 始終不受影響）。

MODDIR=${0%/*}
BOOTZIP="$MODDIR/my_product/media/bootanimation/bootanimation.zip"
LOG="$MODDIR/data/mount.log"

[ -f "$BOOTZIP" ] || exit 0

# ColorOS 17 的開機動畫仍是 /my_product/media/bootanimation/bootanimation.zip，
# 用檔案級 bind mount 覆蓋它，可保留系統自帶的關機動畫 rbootanimation.zip。
TARGET=/my_product/media/bootanimation/bootanimation.zip
if [ -f "$TARGET" ]; then
  if mount --bind "$BOOTZIP" "$TARGET" 2>/dev/null; then
    echo "[$(date '+%m-%d %H:%M:%S')] bind ok -> $TARGET" >> "$LOG" 2>/dev/null
    exit 0
  fi
  echo "[$(date '+%m-%d %H:%M:%S')] bind failed -> $TARGET" >> "$LOG" 2>/dev/null
else
  echo "[$(date '+%m-%d %H:%M:%S')] stock zip missing -> $TARGET" >> "$LOG" 2>/dev/null
fi

# 系統路徑不存在或掛載失敗時，退回 bootanimation 同樣會讀取的 /data/local。
if cp -f "$BOOTZIP" /data/local/bootanimation.zip 2>/dev/null; then
  chmod 0644 /data/local/bootanimation.zip 2>/dev/null
  echo "[$(date '+%m-%d %H:%M:%S')] fallback -> /data/local/bootanimation.zip" >> "$LOG" 2>/dev/null
fi
exit 0
