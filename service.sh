#!/system/bin/sh

MODDIR=${0%/*}

# 本地 WebUI 伺服器：即使沒有 WebUI 宿主（例如 Magisk），
# 也能在瀏覽器打開 http://127.0.0.1:7126 使用模塊界面。
# /cgi-bin/exec 端點以 root 執行 POST 過來的 shell 指令。
WEBUI_PORT=7126
busybox=""
for candidate in /data/adb/magisk/busybox /data/adb/ksu/bin/busybox /data/adb/ap/bin/busybox; do
  if [ -x "$candidate" ] && "$candidate" httpd --help >/dev/null 2>&1; then
    busybox="$candidate"
    break
  fi
done

chmod 0755 "$MODDIR/tools/bootctl.sh" "$MODDIR/webroot/cgi-bin/exec" 2>/dev/null

if [ -n "$busybox" ] && [ -x "$MODDIR/webroot/cgi-bin/exec" ]; then
  (
    while :; do
      "$busybox" httpd -f -p "127.0.0.1:$WEBUI_PORT" -h "$MODDIR/webroot" 2>/dev/null
      sleep 5
    done
  ) &
fi
