#!/system/bin/sh
# bootctl.sh - 開機動畫 for ColorOS 控制腳本
# 用法:
#   bootctl status                    輸出 key=value 狀態（供 WebUI 讀取）
#   bootctl convert <video|gif> <fps> <maxsec> [WxH|auto] [sizePct] [loop|once] [xPct] [yPct] [default|custom] [speedPct]
#                                     異步轉換影片/GIF 為開機動畫
#   bootctl restore                   恢復系統默認開機動畫

MODDIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$MODDIR/data"
BA_DIR="$MODDIR/my_product/media/bootanimation"
BOOTZIP="$BA_DIR/bootanimation.zip"
STATUS="$DATA/convert.status"
LOG="$DATA/convert.log"
PREVIEW="$DATA/preview.jpg"
JAR="$MODDIR/tools/video2boot.jar"

mkdir -p "$DATA" "$BA_DIR" 2>/dev/null
touch "$STATUS" "$LOG" 2>/dev/null

log() {
  echo "[$(date '+%m-%d %H:%M:%S')] $*" >> "$LOG" 2>/dev/null
}

set_status() {
  # set_status key value
  grep -v "^$1=" "$STATUS" > "$STATUS.tmp" 2>/dev/null
  echo "$1=$2" >> "$STATUS.tmp" 2>/dev/null
  mv -f "$STATUS.tmp" "$STATUS" 2>/dev/null
}

get_status() {
  grep "^$1=" "$STATUS" 2>/dev/null | tail -1 | cut -d= -f2-
}

detect_screen() {
  local size W H
  size="$(wm size 2>/dev/null | sed -n 's/Physical size: //p' | tr -d '[:space:]')"
  case "$size" in
    *x*)
      W="${size%x*}"; H="${size#*x}"
      case "$W$H" in *[!0-9]*) W=1440; H=3168 ;; esac
      ;;
    *) W=1440; H=3168 ;;
  esac
  echo "$W $H"
}

# 計算幀尺寸：與屏幕同比例，長邊不超過 1600（常規手機=半分辨率，整數倍放大滿屏）
compute_frame_box() {
  # compute_frame_box <screenW> <screenH> → "W H"
  local sw="$1" sh="$2" W H max
  [ "$sw" -ge 16 ] 2>/dev/null || sw=1440
  [ "$sh" -ge 16 ] 2>/dev/null || sh=3168
  max=$sw; [ "$sh" -gt "$max" ] && max=$sh
  if [ "$max" -le 3200 ]; then
    W=$(( sw / 2 )); H=$(( sh / 2 ))
  else
    W=$(( sw * 1600 / max )); H=$(( sh * 1600 / max ))
  fi
  [ "$W" -lt 16 ] && W=16; [ "$H" -lt 16 ] && H=16
  echo "$W $H"
}

run_converter() {
  # run_converter <video> <outzip> <fps> <maxsec> <W> <H> <sizePct> <playCount> <xPct> <yPct> <speedPct>
  local video="$1" out="$2" fps="$3" maxsec="$4" W="$5" H="$6" size="$7" playcount="$8" x="$9" y="${10}" speed="${11}"
  app_process -Djava.class.path="$JAR" /system/bin \
    com.yuzlyn.bootanim.Video2Boot \
    "$video" "$out" "$fps" "$maxsec" "$W" "$H" "$size" "$playcount" "$x" "$y" "$speed" 2>&1
}

cmd_status() {
  local installed=0 size="-" mtime="-" conv prog err frames fps fw fh screen sw sh
  screen="$(detect_screen)"
  sw="${screen% *}"; sh="${screen#* }"

  if [ -f "$BOOTZIP" ]; then
    installed=1
    size="$(stat -c %s "$BOOTZIP" 2>/dev/null)"
    mtime="$(stat -c %Y "$BOOTZIP" 2>/dev/null)"
    [ -z "$size" ] && size="-"
    [ -z "$mtime" ] && mtime="-"
  fi
  conv="$(get_status converting)"; [ -z "$conv" ] && conv=0
  prog="$(get_status progress)"; [ -z "$prog" ] && prog=0
  err="$(get_status error)"
  frames="$(get_status frames)"; [ -z "$frames" ] && frames="-"
  fps="$(get_status fps)"; [ -z "$fps" ] && fps="-"
  fw="$(get_status frame_w)"; [ -z "$fw" ] && fw="-"
  fh="$(get_status frame_h)"; [ -z "$fh" ] && fh="-"
  sp="$(get_status size_pct)"; [ -z "$sp" ] && sp=100
  pc="$(get_status play_count)"; [ -z "$pc" ] && pc=0
  xp="$(get_status x_pct)"; [ -z "$xp" ] && xp=50
  yp="$(get_status y_pct)"; [ -z "$yp" ] && yp=38
  pm="$(get_status pos_mode)"; [ -z "$pm" ] && pm=default
  spd="$(get_status speed_pct)"; [ -z "$spd" ] && spd=100

  # 若轉換進程已死但標記還在，重置標記
  if [ "$conv" = "1" ]; then
    local pid
    pid="$(get_status pid)"
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
      conv=0
      [ "$prog" = "100" ] || err="converter_exited_unexpectedly"
    fi
  fi

  cat << EOF
installed=$installed
size=$size
mtime=$mtime
converting=$conv
progress=$prog
error=$err
frames=$frames
fps=$fps
frame_w=$fw
frame_h=$fh
size_pct=$sp
play_count=$pc
x_pct=$xp
y_pct=$yp
pos_mode=$pm
speed_pct=$spd
screen_w=$sw
screen_h=$sh
preview=$([ -f "$PREVIEW" ] && echo 1 || echo 0)
converter=media_codec
EOF
}

cmd_convert() {
  local video="$1" fps="$2" maxsec="$3" box="$4" size="$5" play="$6" x="$7" y="$8" posmode="$9" speed="${10}"
  local screen sw sh bw bh bgpid frame playcount

  [ -f "$video" ] || { echo "ERROR video_not_found"; exit 1; }
  case "$fps" in ''|*[!0-9]*) fps=24 ;; esac
  case "$maxsec" in ''|*[!0-9]*) maxsec=10 ;; esac
  [ "$fps" -lt 10 ] && fps=10; [ "$fps" -gt 60 ] && fps=60
  [ "$maxsec" -lt 1 ] && maxsec=1; [ "$maxsec" -gt 60 ] && maxsec=60
  case "$size" in ''|*[!0-9]*) size=100 ;; esac
  [ "$size" -lt 10 ] && size=10
  [ "$size" -gt 100 ] && size=100
  playcount=0
  case "$play" in once|1|single) playcount=1 ;; esac
  case "$x" in ''|*[!0-9]*) x=50 ;; esac
  [ "$x" -lt 0 ] && x=0; [ "$x" -gt 100 ] && x=100
  case "$y" in ''|*[!0-9]*) y=38 ;; esac
  [ "$y" -lt 0 ] && y=0; [ "$y" -gt 100 ] && y=100
  case "$posmode" in custom) ;; *) posmode=default ;; esac
  case "$speed" in ''|*[!0-9]*) speed=100 ;; esac
  [ "$speed" -lt 25 ] && speed=25
  [ "$speed" -gt 400 ] && speed=400

  # 已有轉換在跑
  if [ "$(get_status converting)" = "1" ]; then
    bgpid="$(get_status pid)"
    if [ -n "$bgpid" ] && kill -0 "$bgpid" 2>/dev/null; then
      echo "ERROR busy"
      exit 1
    fi
  fi

  screen="$(detect_screen)"
  sw="${screen% *}"; sh="${screen#* }"

  # 幀尺寸：自定義 WxH 或按屏幕自動計算
  frame=""
  case "$box" in
    *x*)
      bw="${box%x*}"; bh="${box#*x}"
      case "$bw$bh" in
        *[!0-9]*) : ;;
        *)
          if [ "$bw" -ge 16 ] 2>/dev/null && [ "$bh" -ge 16 ] 2>/dev/null; then
            frame="$bw $bh"
          fi
          ;;
      esac
      ;;
  esac
  [ -z "$frame" ] && frame="$(compute_frame_box "$sw" "$sh")"

  : > "$STATUS" 2>/dev/null
  set_status converting 1
  set_status progress 0
  set_status error ""
  set_status pid ""

  log "convert start: video=$video fps=$fps maxsec=$maxsec frame=$frame size=$size playcount=$playcount pos=$x,$y mode=$posmode speed=$speed screen=${sw}x${sh}"

  local outdir="$DATA/.work"
  rm -rf "$outdir" 2>/dev/null
  mkdir -p "$outdir" 2>/dev/null
  local tmpzip="$outdir/result.zip"

  # 後台執行，輸出重定向避免阻塞 CGI 回包
  nohup sh "$0" _do_convert "$video" "$tmpzip" "$fps" "$maxsec" $frame "$size" "$playcount" "$x" "$y" "$posmode" "$speed" \
    >> "$outdir/run.log" 2>&1 &
  bgpid=$!
  set_status pid "$bgpid"
  echo "OK started"
}

cmd_do_convert() {
  local video="$1" tmpzip="$2" fps="$3" maxsec="$4" W="$5" H="$6" size="$7" playcount="$8" x="$9" y="${10}" posmode="${11}" speed="${12}"
  local outfile outcode frames cpid limit

  outfile="$DATA/.work/out.txt"
  : > "$outfile" 2>/dev/null

  # 前台啟動轉換器，輸出寫檔；後台循環同步進度到 status
  run_converter "$video" "$tmpzip" "$fps" "$maxsec" "$W" "$H" "$size" "$playcount" "$x" "$y" "$speed" \
    > "$outfile" 2>&1 &
  cpid=$!
  limit=$(( maxsec * 2 + 180 ))
  while kill -0 "$cpid" 2>/dev/null; do
    p="$(grep '^PROGRESS' "$outfile" 2>/dev/null | tail -1 | cut -d' ' -f2)"
    [ -n "$p" ] && set_status progress "$p"
    limit=$(( limit - 1 ))
    if [ "$limit" -le 0 ]; then
      kill -9 "$cpid" 2>/dev/null
      log "converter timeout, killed"
      set_status error "convert_timeout"
      set_status converting 0
      rm -rf "$DATA/.work" 2>/dev/null
      echo "ERROR convert_timeout"
      exit 1
    fi
    sleep 1
  done
  wait "$cpid" 2>/dev/null
  outcode=$?
  log "converter exit=$outcode"

  if [ $outcode -ne 0 ] || [ ! -s "$tmpzip" ]; then
    log "convert failed: $(tail -n 5 "$outfile" 2>/dev/null)"
    set_status error "convert_failed"
    set_status converting 0
    rm -rf "$DATA/.work" 2>/dev/null
    echo "ERROR convert_failed"
    exit 1
  fi

  if ! unzip -t "$tmpzip" >/dev/null 2>&1; then
    log "zip verify failed"
    set_status error "zip_verify_failed"
    set_status converting 0
    rm -rf "$DATA/.work" 2>/dev/null
    echo "ERROR zip_verify_failed"
    exit 1
  fi

  # 提取第一幀作為預覽
  local pdir="$DATA/.work/preview"
  rm -rf "$pdir" 2>/dev/null
  mkdir -p "$pdir" 2>/dev/null
  if unzip -o -q "$tmpzip" "part0/0001.jpg" -d "$pdir" 2>/dev/null; then
    [ -f "$pdir/part0/0001.jpg" ] && cp -f "$pdir/part0/0001.jpg" "$PREVIEW"
  elif unzip -o -q "$tmpzip" "part0/0001.png" -d "$pdir" 2>/dev/null; then
    [ -f "$pdir/part0/0001.png" ] && cp -f "$pdir/part0/0001.png" "$PREVIEW"
  fi

  frames="$(grep '^OK ' "$outfile" 2>/dev/null | tail -1 | awk '{print $2}')"
  [ -z "$frames" ] && frames="-"

  chmod 0644 "$tmpzip" 2>/dev/null
  if ! mv -f "$tmpzip" "$BOOTZIP" 2>/dev/null; then
    cp -f "$tmpzip" "$BOOTZIP" && rm -f "$tmpzip"
  fi
  chmod 0644 "$BOOTZIP" 2>/dev/null

  set_status frames "$frames"
  set_status fps "$fps"
  set_status frame_w "$W"
  set_status frame_h "$H"
  set_status size_pct "$size"
  set_status play_count "$playcount"
  set_status x_pct "$x"
  set_status y_pct "$y"
  set_status pos_mode "$posmode"
  set_status speed_pct "$speed"
  set_status progress 100
  set_status error ""
  set_status converting 0
  log "installed frames=$frames size=$(stat -c %s "$BOOTZIP" 2>/dev/null)"
  rm -rf "$DATA/.work" 2>/dev/null
  echo "OK installed"
}

cmd_restore() {
  rm -f "$BOOTZIP" "$PREVIEW" "$STATUS" 2>/dev/null
  log "restored to stock"
  echo "OK restored"
}

case "$1" in
  status) cmd_status ;;
  convert) shift; cmd_convert "$@" ;;
  _do_convert) shift; cmd_do_convert "$@" ;;
  restore) cmd_restore ;;
  *)
    echo "usage: bootctl status|convert|restore"
    exit 2
    ;;
esac
exit 0
