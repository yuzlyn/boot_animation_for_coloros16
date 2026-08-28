#!/system/bin/sh

ui_print "*******************************"
ui_print " 開機動畫 for ColorOS"
ui_print " by yuzlyn"
ui_print "*******************************"

# 僅支援搭載 MediaCodec 的 Android 5.0+，實際以 ColorOS 為主
sdk="$(getprop ro.build.version.sdk)"
case "$sdk" in ''|*[!0-9]*) abort "! 無法讀取 Android API 版本" ;; esac
[ "$sdk" -ge 26 ] || abort "! 僅支援 Android 8.0 及以上版本（API 26+）"

MODID=coloros-bootanimation
OLDMOD="/data/adb/modules/$MODID"

# 模塊更新時保留已轉換的開機動畫與數據
if [ -f "$OLDMOD/my_product/media/bootanimation/bootanimation.zip" ]; then
  ui_print "- 保留已上傳的開機動畫"
  mkdir -p "$MODPATH/my_product/media/bootanimation"
  cp -af "$OLDMOD/my_product/media/bootanimation/bootanimation.zip" \
    "$MODPATH/my_product/media/bootanimation/bootanimation.zip"
fi
for file in convert.status preview.jpg; do
  if [ -f "$OLDMOD/data/$file" ]; then
    mkdir -p "$MODPATH/data"
    cp -af "$OLDMOD/data/$file" "$MODPATH/data/$file"
  fi
done

set_perm_recursive "$MODPATH" 0 0 0755 0644
set_perm "$MODPATH/customize.sh" 0 0 0755
set_perm "$MODPATH/post-fs-data.sh" 0 0 0755
set_perm "$MODPATH/service.sh" 0 0 0755
set_perm "$MODPATH/action.sh" 0 0 0755
set_perm "$MODPATH/tools/bootctl.sh" 0 0 0755
set_perm "$MODPATH/tools/video2boot.jar" 0 0 0644
chmod 0755 "$MODPATH/webroot/cgi-bin/exec" 2>/dev/null

ui_print "- 安裝完成"
ui_print "- 在 KernelSU 模塊頁面點擊 WebUI 上傳影片"
ui_print "- 轉換完成後重啟手機即可看到新的開機動畫"
ui_print "- 僅替換開機動畫（bootanimation.zip），不動關機動畫"
