#!/system/bin/sh
# 僅在使用者上傳了自定義開機動畫後才掛載，
# 未上傳時保持系統默認動畫（關機動畫 rbootanimation.zip 始終不受影響）。

MODDIR=${0%/*}
BOOTZIP="$MODDIR/my_product/media/bootanimation/bootanimation.zip"

[ -f "$BOOTZIP" ] || exit 0

# 以檔案級 bind mount 覆蓋開機動畫，保留系統自帶的關機動畫
mount --bind "$BOOTZIP" /my_product/media/bootanimation/bootanimation.zip 2>/dev/null
