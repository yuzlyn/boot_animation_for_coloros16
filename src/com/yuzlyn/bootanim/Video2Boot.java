package com.yuzlyn.bootanim;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Movie;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.media.Image;
import android.media.ImageReader;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.media.MediaExtractor;
import android.media.MediaFormat;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Locale;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Video2Boot - convert a video into a ColorOS bootanimation.zip.
 *
 * Usage: app_process ... com.yuzlyn.bootanim.Video2Boot \
 *        <input> <outputZip> <fps> <maxSeconds> <frameW> <frameH> \
 *        [sizePct] [loopCount] [xPct] [yPct] [speedPct] [rotateDeg] \
 *        [trimStartSec] [trimEndSec]
 *
 * sizePct (10-100, default 100) scales the animation inside the frame box.
 * loopCount (1-20, default 1) plays the animation that many times: the frame
 * sequence is repeated inside the zip (spliced), so looping does not depend
 * on the device's desc.txt loop support.
 * xPct / yPct (0-100, defaults 50 / 38) place the animation center on the
 * canvas: 50 = horizontal center, 38 ≈ upper golden-ratio point (H/φ²).
 * speedPct (25-400, default 100) scales the desc.txt fps, so the animation
 * plays back at speedPct/100 × speed with the same sampled frames.
 * rotateDeg (0-360, default 0) additionally rotates every frame clockwise by
 * that many degrees, so the video can be shown tilted (or upside-down); the
 * rotated frame is still scaled to fit inside the frame box with its aspect
 * preserved. The container rotation from the file metadata (e.g. 90° for
 * landscape videos) is applied automatically on top of it.
 * trimStartSec / trimEndSec (decimal seconds, default 0 = not set) select a
 * clip of the source video/GIF: decoding seeks to trimStartSec and stops as
 * soon as trimEndSec is reached (0 = until the end of the video). Frames
 * outside the clip are discarded.
 * Probe mode: `app_process ... Video2Boot probe <file>` prints `key=value`
 * metadata lines (type/duration/width/height/rotation) for the WebUI.
 * Videos are decoded with MediaCodec (hardware surface preferred), animated
 * GIFs with android.graphics.Movie (Skia GIF codec). Every frame is scaled
 * to fit inside the frame box (aspect preserved) and composited on a black
 * canvas.
 */
public class Video2Boot {

    private static final int MAX_FRAMES = 480;
    private static final int MAX_TOTAL_FRAMES = 2000;
    private static final int JPEG_QUALITY = 80;

    public static void main(String[] args) {
        int code = 0;
        try {
            code = run(args);
        } catch (Throwable t) {
            t.printStackTrace(System.err);
            code = 2;
        }
        System.exit(code);
    }

    private static int run(String[] args) throws Exception {
        if (args.length >= 2 && "probe".equals(args[0])) {
            return probe(args[1]);
        }
        if (args.length < 6) {
            System.err.println("usage: <input> <outputZip> <fps> <maxSeconds> <frameW> <frameH> [sizePct] [loopCount] [xPct] [yPct] [speedPct] [rotateDeg] [trimStartSec] [trimEndSec]");
            return 2;
        }
        File input = new File(args[0]);
        File output = new File(args[1]);
        int fps = clamp(parseInt(args[2], 24), 10, 60);
        int maxSeconds = clamp(parseInt(args[3], 10), 1, 60);
        int frameW = even(parseInt(args[4], 720), 16);
        int frameH = even(parseInt(args[5], 1584), 16);
        int sizePct = clamp(parseInt(args.length > 6 ? args[6] : "100", 100), 10, 100);
        int loopCount = clamp(parseInt(args.length > 7 ? args[7] : "1", 1), 1, 20);
        int xPct = clamp(parseInt(args.length > 8 ? args[8] : "50", 50), 0, 100);
        int yPct = clamp(parseInt(args.length > 9 ? args[9] : "38", 38), 0, 100);
        int speedPct = clamp(parseInt(args.length > 10 ? args[10] : "100", 100), 25, 400);
        int rotateDeg = clamp(parseInt(args.length > 11 ? args[11] : "0", 0), 0, 360);
        double trimStartSec = Math.max(0.0, parseDouble(args.length > 12 ? args[12] : "0", 0));
        double trimEndSec = Math.max(0.0, parseDouble(args.length > 13 ? args[13] : "0", 0));
        long trimStartUs = (long) Math.round(trimStartSec * 1e6);
        long trimEndUs = (long) Math.round(trimEndSec * 1e6);

        System.out.println("INFO input=" + input.getAbsolutePath());
        System.out.println("INFO frame=" + frameW + "x" + frameH + " fps=" + fps + " maxSeconds=" + maxSeconds
                + " sizePct=" + sizePct + " loopCount=" + loopCount
                + " pos=" + xPct + "%," + yPct + "% speed=" + speedPct + "%"
                + " rotate=" + rotateDeg + "deg trim=" + trimStartSec + "-" + trimEndSec + "s");
        System.out.println("PROGRESS 1");

        File workDir = new File(output.getParentFile(), ".convert-" + System.currentTimeMillis());
        if (!workDir.mkdirs()) throw new IOException("cannot create work dir: " + workDir);
        File frameDir = new File(workDir, "part0");
        if (!frameDir.mkdirs()) throw new IOException("cannot create frame dir");

        int frameCount;
        if (isGifFile(input)) {
            GifDecoder gd = new GifDecoder(input, fps, maxSeconds, frameW, frameH, sizePct, xPct, yPct,
                    rotateDeg, trimStartUs, trimEndUs, frameDir);
            gd.decode();
            frameCount = gd.frameCount;
        } else {
            Decoder dec = new Decoder(input, fps, maxSeconds, frameW, frameH, sizePct, xPct, yPct,
                    rotateDeg, trimStartUs, trimEndUs, frameDir);
            dec.decode();
            frameCount = dec.frameCount;
        }

        System.out.println("PROGRESS 88");
        System.out.println("INFO frames=" + frameCount);

        int totalFrames = Math.min(frameCount * loopCount, MAX_TOTAL_FRAMES);
        System.out.println("INFO loopCount=" + loopCount + " totalFrames=" + totalFrames);

        writeZip(output, frameW, frameH, fps, frameDir, frameCount, totalFrames, speedPct);
        deleteRecursive(workDir);
        System.out.println("PROGRESS 100");
        System.out.println("OK " + frameCount + " " + output.length());
        return 0;
    }

    /** 探測模式：列印 key=value 元資料，供 WebUI 顯示影片總時長（截取滑桿上限）。 */
    private static int probe(String path) {
        File f = new File(path);
        if (!f.isFile()) {
            System.err.println("ERROR file not found: " + path);
            return 2;
        }
        try {
            if (isGifFile(f)) {
                System.out.println("type=gif");
                // GIF 總時長：掃描播放延遲（僅限合理大小，避免大檔全量解碼）
                if (f.length() > 0 && f.length() <= 8L * 1024 * 1024) {
                    try {
                        Movie m = Movie.decodeFile(f.getAbsolutePath());
                        if (m != null && m.duration() > 0) {
                            System.out.printf(Locale.ROOT, "duration=%.3f%n", m.duration() / 1000.0);
                        }
                    } catch (Throwable t) {
                        // duration 不可得時僅輸出 type=gif
                    }
                }
                return 0;
            }
        } catch (IOException e) {
            System.err.println("ERROR " + e.getMessage());
            return 2;
        }
        MediaExtractor ex = new MediaExtractor();
        try {
            ex.setDataSource(f.getAbsolutePath());
            for (int i = 0; i < ex.getTrackCount(); i++) {
                MediaFormat fmt = ex.getTrackFormat(i);
                String mime = fmt.getString(MediaFormat.KEY_MIME);
                if (mime == null || !mime.startsWith("video/")) continue;
                long durUs = 0;
                if (fmt.containsKey(MediaFormat.KEY_DURATION)) {
                    durUs = Math.max(0, fmt.getLong(MediaFormat.KEY_DURATION));
                }
                int vw = fmt.containsKey(MediaFormat.KEY_WIDTH) ? fmt.getInteger(MediaFormat.KEY_WIDTH) : 0;
                int vh = fmt.containsKey(MediaFormat.KEY_HEIGHT) ? fmt.getInteger(MediaFormat.KEY_HEIGHT) : 0;
                int rot = fmt.containsKey(MediaFormat.KEY_ROTATION) ? fmt.getInteger(MediaFormat.KEY_ROTATION) : 0;
                System.out.println("type=video");
                System.out.printf(Locale.ROOT, "duration=%.3f%n", durUs / 1e6);
                System.out.println("width=" + vw);
                System.out.println("height=" + vh);
                System.out.println("rotation=" + rot);
                ex.release();
                return 0;
            }
            ex.release();
            System.err.println("ERROR no video track");
            return 2;
        } catch (Throwable t) {
            t.printStackTrace(System.err);
            return 2;
        }
    }

    private static void writeZip(File output, int w, int h, int fps, File frameDir, int frameCount, int totalFrames, int speedPct) throws IOException {
        File tmp = new File(output.getParentFile(), output.getName() + ".tmp");
        ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(tmp));
        zos.setLevel(0);

        int descFps = clamp((int) Math.round(fps * (speedPct / 100.0)), 1, 120);
        byte[] desc = String.format("g %d %d 0 0 %d\np 1 0 part0\n", w, h, descFps).getBytes("UTF-8");
        putStored(zos, "desc.txt", desc);

        // directory entries mirror the layout of stock ColorOS zips
        ZipEntry dir = new ZipEntry("part0/");
        dir.setMethod(ZipEntry.STORED);
        dir.setSize(0);
        dir.setCrc(0);
        zos.putNextEntry(dir);
        zos.closeEntry();

        // 幀序列重複拼接：第 i 幀取自 ((i-1) % frameCount) + 1，不依賴引擎循環
        for (int i = 1; i <= totalFrames; i++) {
            int src = ((i - 1) % frameCount) + 1;
            File f = new File(frameDir, String.format("%04d.jpg", src));
            byte[] data = readAll(f);
            putStored(zos, "part0/" + String.format("%04d.jpg", i), data);
            if (i % 20 == 0) System.out.println("PROGRESS " + (88 + 10 * i / Math.max(1, totalFrames)));
        }
        zos.close();
        if (output.exists()) output.delete();
        if (!tmp.renameTo(output)) {
            // cross-device fallback
            copyFile(tmp, output);
            tmp.delete();
        }
    }

    private static void putStored(ZipOutputStream zos, String name, byte[] data) throws IOException {
        CRC32 crc = new CRC32();
        crc.update(data);
        ZipEntry e = new ZipEntry(name);
        e.setMethod(ZipEntry.STORED);
        e.setSize(data.length);
        e.setCrc(crc.getValue());
        zos.putNextEntry(e);
        zos.write(data);
        zos.closeEntry();
    }

    private static byte[] readAll(File f) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        FileInputStream fis = new FileInputStream(f);
        byte[] buf = new byte[65536];
        int n;
        while ((n = fis.read(buf)) > 0) bos.write(buf, 0, n);
        fis.close();
        return bos.toByteArray();
    }

    private static void copyFile(File from, File to) throws IOException {
        FileInputStream fis = new FileInputStream(from);
        FileOutputStream fos = new FileOutputStream(to);
        byte[] buf = new byte[65536];
        int n;
        while ((n = fis.read(buf)) > 0) fos.write(buf, 0, n);
        fis.close();
        fos.close();
    }

    private static void deleteRecursive(File f) {
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) for (File k : kids) deleteRecursive(k);
        }
        f.delete();
    }

    private static int parseInt(String s, int def) {
        try { return Integer.parseInt(s.trim()); } catch (Throwable t) { return def; }
    }

    private static double parseDouble(String s, double def) {
        try {
            double v = Double.parseDouble(s.trim());
            return Double.isNaN(v) ? def : v;
        } catch (Throwable t) { return def; }
    }

    private static int clamp(int v, int lo, int hi) { return Math.max(lo, Math.min(hi, v)); }

    private static int even(int v, int lo) {
        if (v < lo) v = lo;
        if (v > 4096) v = 4096;
        return v & ~1;
    }

    /** GIF 檢測：副檔名 .gif 或檔案頭 GIF87a/GIF89a。 */
    private static boolean isGifFile(File f) throws IOException {
        String name = f.getName().toLowerCase(Locale.ROOT);
        if (name.endsWith(".gif")) return true;
        byte[] head = new byte[6];
        FileInputStream fis = new FileInputStream(f);
        int n = fis.read(head);
        fis.close();
        return n == 6
                && head[0] == 'G' && head[1] == 'I' && head[2] == 'F' && head[3] == '8'
                && (head[4] == '7' || head[4] == '9') && head[5] == 'a';
    }

    /**
     * 合成到黑底畫布：動畫中心位於 (xPct%, yPct%) 畫布位置，
     * 貼邊時自動收斂以免超出畫布。sizePct 控制動畫大小（10-100，100=鋪滿）。
     * rotateDeg 為 0 時走原快速路徑；非 0 時先繞中心旋轉再等比縮放至畫布內，
     * 單次取樣完成（旋轉後內容可能因斜放而縮小，四周留黑）。
     */
    static Bitmap placeFrame(Bitmap b, int frameW, int frameH, int sizePct, int xPct, int yPct, float rotateDeg) {
        Bitmap out = Bitmap.createBitmap(frameW, frameH, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(out);
        c.drawColor(Color.BLACK);
        int w = b.getWidth();
        int h = b.getHeight();
        float rot = rotateDeg % 360f;
        Paint p = new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG);
        if (rot == 0f) {
            float scale = Math.min((float) frameW / w, (float) frameH / h) * (sizePct / 100f);
            int dw = Math.max(1, (int) (w * scale));
            int dh = Math.max(1, (int) (h * scale));
            int left = (int) Math.round(frameW * (xPct / 100.0)) - dw / 2;
            int top = (int) Math.round(frameH * (yPct / 100.0)) - dh / 2;
            if (left < 0) left = 0;
            if (left > frameW - dw) left = frameW - dw;
            if (top < 0) top = 0;
            if (top > frameH - dh) top = frameH - dh;
            c.drawBitmap(b, null, new Rect(left, top, left + dw, top + dh), p);
            return out;
        }
        double rad = Math.toRadians(rot);
        double cosA = Math.abs(Math.cos(rad));
        double sinA = Math.abs(Math.sin(rad));
        // 繞中心旋轉後內容的包圍盒尺寸
        double bw = w * cosA + h * sinA;
        double bh = w * sinA + h * cosA;
        float scale = (float) Math.min((frameW * (sizePct / 100.0)) / bw, (frameH * (sizePct / 100.0)) / bh);
        int dw = Math.max(1, (int) Math.round(bw * scale));
        int dh = Math.max(1, (int) Math.round(bh * scale));
        int left = (int) Math.round(frameW * (xPct / 100.0)) - dw / 2;
        int top = (int) Math.round(frameH * (yPct / 100.0)) - dh / 2;
        if (left < 0) left = 0;
        if (left > frameW - dw) left = frameW - dw;
        if (top < 0) top = 0;
        if (top > frameH - dh) top = frameH - dh;
        float cx = w / 2f;
        float cy = h / 2f;
        Matrix m = new Matrix();
        m.postRotate(rot, cx, cy);
        m.postScale(scale, scale, cx, cy);
        m.postTranslate(left + dw / 2f - cx, top + dh / 2f - cy);
        c.drawBitmap(b, m, p);
        return out;
    }

    static void writeJpeg(Bitmap b, File out) throws IOException {
        FileOutputStream fos = new FileOutputStream(out);
        b.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, fos);
        fos.flush();
        fos.close();
    }

    /** MediaCodec-based decode: frames -> placed JPEGs. */
    static class Decoder {
        final File input;
        final int fps;
        final int maxSeconds;
        final int frameW, frameH;
        final int sizePct;
        final int xPct, yPct;
        final int rotateDeg;
        final long trimStartUs;
        final long trimEndUs;
        final File frameDir;
        int frameCount = 0;
        int maxFrames = 0;
        int rotation = 0;

        Decoder(File input, int fps, int maxSeconds, int frameW, int frameH, int sizePct, int xPct, int yPct,
                int rotateDeg, long trimStartUs, long trimEndUs, File frameDir) {
            this.input = input;
            this.fps = fps;
            this.maxSeconds = maxSeconds;
            this.frameW = frameW;
            this.frameH = frameH;
            this.sizePct = sizePct;
            this.xPct = xPct;
            this.yPct = yPct;
            this.rotateDeg = rotateDeg;
            this.trimStartUs = trimStartUs;
            this.trimEndUs = trimEndUs;
            this.frameDir = frameDir;
        }

        void decode() throws Exception {
            MediaExtractor ex = new MediaExtractor();
            try {
                ex.setDataSource(input.getAbsolutePath());
            } catch (IOException e) {
                throw new IOException("cannot open video file (unsupported container?)", e);
            }
            int track = -1;
            String mime = null;
            for (int i = 0; i < ex.getTrackCount(); i++) {
                MediaFormat f = ex.getTrackFormat(i);
                String m = f.getString(MediaFormat.KEY_MIME);
                if (m != null && m.startsWith("video/")) { track = i; mime = m; break; }
            }
            if (track < 0) throw new IOException("no video track found");
            MediaFormat fmt = ex.getTrackFormat(track);
            if (fmt.containsKey(MediaFormat.KEY_ROTATION)) rotation = fmt.getInteger(MediaFormat.KEY_ROTATION);
            int vw = fmt.containsKey(MediaFormat.KEY_WIDTH) ? fmt.getInteger(MediaFormat.KEY_WIDTH) : 0;
            int vh = fmt.containsKey(MediaFormat.KEY_HEIGHT) ? fmt.getInteger(MediaFormat.KEY_HEIGHT) : 0;
            System.out.println("INFO video=" + vw + "x" + vh + " mime=" + mime + " rotation=" + rotation
                    + " rotate=" + rotateDeg + "deg trim=" + (trimStartUs / 1e6) + "-" + (trimEndUs / 1e6) + "s");
            ex.release();

            // 幀數預算：不超過幀上限與 maxSeconds，若截取視窗更短則以視窗長度為準
            int budget = fps * maxSeconds;
            if (trimEndUs > trimStartUs && trimEndUs > 0) {
                budget = Math.min(budget, Math.max(1, (int) Math.ceil((trimEndUs - trimStartUs) * fps / 1e6)));
            }
            maxFrames = Math.min(MAX_FRAMES, budget);

            // 優先走硬解碼 Surface 快路徑，失敗再退回 bytebuffer + Image
            try {
                decodeSurface(fmt, mime);
            } catch (Throwable t) {
                System.err.println("WARN surface decode failed (" + t + "), fallback to bytebuffer");
                frameCount = 0;
                decodeByteBuffer(fmt, mime);
            }
            if (frameCount == 0) throw new IOException("no frames decoded - unsupported video codec?");
        }

        /** 總旋轉角度：檔案內建的顯示旋轉 + 使用者額外旋轉（順時針）。 */
        int totalRotateDeg() {
            return (rotation + rotateDeg) % 360;
        }

        /** 截取開始時間 > 0 時，跳到該時間點之前的關鍵幀再開始解碼，避免從頭解到尾。 */
        void maybeSeek(MediaExtractor ex) {
            if (trimStartUs > 0) ex.seekTo(trimStartUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC);
        }

        /** 快路徑：GPU 渲染到 Surface（YUV->RGBA 由 GPU 完成），ImageReader 取回縮放。 */
        void decodeSurface(MediaFormat fmt, String mime) throws Exception {
            int vw = fmt.containsKey(MediaFormat.KEY_WIDTH) ? fmt.getInteger(MediaFormat.KEY_WIDTH) : 0;
            int vh = fmt.containsKey(MediaFormat.KEY_HEIGHT) ? fmt.getInteger(MediaFormat.KEY_HEIGHT) : 0;
            if (vw <= 0 || vh <= 0) throw new IOException("bad video size");

            MediaExtractor ex = openExtractor();
            maybeSeek(ex);
            ImageReader reader = ImageReader.newInstance(vw, vh, PixelFormat.RGBA_8888, 4);
            MediaCodec codec = openCodec(mime);
            boolean eos = false;
            long nextPts = -1;
            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            long loopStart = System.currentTimeMillis();

            try {
                codec.configure(fmt, reader.getSurface(), null, 0);
                codec.start();
                while (!eos) {
                    int inIdx = codec.dequeueInputBuffer(20000);
                    if (inIdx >= 0) {
                        ByteBuffer in = codec.getInputBuffer(inIdx);
                        if (in == null) continue;
                        int sz = ex.readSampleData(in, 0);
                        if (sz < 0) {
                            codec.queueInputBuffer(inIdx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            eos = true;
                        } else {
                            codec.queueInputBuffer(inIdx, 0, sz, ex.getSampleTime(), 0);
                            ex.advance();
                        }
                    }
                    int outIdx = codec.dequeueOutputBuffer(info, 20000);
                    if (outIdx >= 0) {
                        if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) break;
                        codec.releaseOutputBuffer(outIdx, true);
                        if (info.size > 0) {
                            Image img = null;
                            for (int t = 0; t < 100 && img == null; t++) {
                                img = reader.acquireLatestImage();
                                if (img == null) {
                                    try { Thread.sleep(2); } catch (InterruptedException ie) { }
                                }
                            }
                            if (img != null) {
                                try {
                                    long pts = img.getTimestamp() / 1000L; // ns -> us
                                    // 截取視窗：視窗之前的幀直接丟棄，到達結束時間即完成解碼
                                    if (pts < trimStartUs || (trimEndUs > 0 && pts >= trimEndUs)) continue;
                                    if (pts >= nextPts) {
                                        if (nextPts < 0) nextPts = pts;
                                        Bitmap b = rgbaToBitmap(img);
                                        Bitmap framed = placeFrame(b, frameW, frameH, sizePct, xPct, yPct, totalRotateDeg());
                                        b.recycle();
                                        File out = new File(frameDir, String.format("%04d.jpg", frameCount + 1));
                                        writeJpeg(framed, out);
                                        framed.recycle();
                                        frameCount++;
                                        nextPts += 1000000L / fps;
                                        if (frameCount >= maxFrames) break;
                                        if (frameCount % 10 == 0) {
                                            System.out.println("PROGRESS " + (1 + 86 * frameCount / maxFrames));
                                        }
                                    }
                                } finally {
                                    img.close();
                                }
                            }
                        }
                    } else if (outIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                        // nothing
                    } else if (outIdx == MediaCodec.INFO_TRY_AGAIN_LATER) {
                        // nothing
                    }
                    if (System.currentTimeMillis() - loopStart > (maxSeconds + 60) * 1000L) {
                        System.err.println("WARN decode timeout");
                        break;
                    }
                }
            } finally {
                try { codec.stop(); } catch (Throwable t) { }
                try { codec.release(); } catch (Throwable t) { }
                reader.close();
                ex.release();
            }
        }

        /** 慢路徑：bytebuffer + getOutputImage（軟解碼回退）。 */
        void decodeByteBuffer(MediaFormat fmt, String mime) throws Exception {
            MediaExtractor ex = openExtractor();
            maybeSeek(ex);
            MediaCodec codec = openCodec(mime);
            boolean eos = false;
            long nextPts = -1;
            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            long loopStart = System.currentTimeMillis();

            try {
                codec.configure(fmt, null, null, 0);
                codec.start();
                while (!eos) {
                    int inIdx = codec.dequeueInputBuffer(20000);
                    if (inIdx >= 0) {
                        ByteBuffer in = codec.getInputBuffer(inIdx);
                        if (in == null) continue;
                        int sz = ex.readSampleData(in, 0);
                        if (sz < 0) {
                            codec.queueInputBuffer(inIdx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            eos = true;
                        } else {
                            codec.queueInputBuffer(inIdx, 0, sz, ex.getSampleTime(), 0);
                            ex.advance();
                        }
                    }
                    int outIdx = codec.dequeueOutputBuffer(info, 20000);
                    if (outIdx >= 0) {
                        if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) break;
                        if (info.size > 0) {
                            long pts = info.presentationTimeUs;
                            // 截取視窗：視窗之前的幀直接丟棄，到達結束時間即完成解碼
                            if (pts < trimStartUs) {
                                codec.releaseOutputBuffer(outIdx, false);
                                continue;
                            }
                            if (trimEndUs > 0 && pts >= trimEndUs) {
                                codec.releaseOutputBuffer(outIdx, false);
                                break;
                            }
                            if (pts >= nextPts) {
                                Image img = codec.getOutputImage(outIdx);
                                if (img != null) {
                                    try {
                                        if (nextPts < 0) nextPts = pts;
                                        Bitmap b;
                                        if (img.getFormat() == ImageFormat.YUV_420_888) {
                                            b = imageToBitmapScaled(img, frameW, frameH);
                                        } else {
                                            b = imageToBitmapGeneric(img);
                                        }
                                        Bitmap framed = placeFrame(b, frameW, frameH, sizePct, xPct, yPct, totalRotateDeg());
                                        b.recycle();
                                        File out = new File(frameDir, String.format("%04d.jpg", frameCount + 1));
                                        writeJpeg(framed, out);
                                        framed.recycle();
                                        frameCount++;
                                        nextPts += 1000000L / fps;
                                        if (frameCount >= maxFrames) break;
                                        if (frameCount % 10 == 0) {
                                            System.out.println("PROGRESS " + (1 + 86 * frameCount / maxFrames));
                                        }
                                    } finally {
                                        img.close();
                                    }
                                }
                            }
                        }
                        codec.releaseOutputBuffer(outIdx, false);
                    } else if (outIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                        // nothing
                    } else if (outIdx == MediaCodec.INFO_TRY_AGAIN_LATER) {
                        // nothing
                    }
                    if (System.currentTimeMillis() - loopStart > (maxSeconds + 60) * 1000L) {
                        System.err.println("WARN decode timeout");
                        break;
                    }
                }
            } finally {
                try { codec.stop(); } catch (Throwable t) { }
                try { codec.release(); } catch (Throwable t) { }
                ex.release();
            }
        }

        MediaCodec openCodec(String mime) throws IOException {
            try {
                return MediaCodec.createDecoderByType(mime);
            } catch (Throwable t) {
                System.err.println("WARN hardware decoder unavailable: " + t);
            }
            MediaCodecList list = new MediaCodecList(MediaCodecList.REGULAR_CODECS);
            for (MediaCodecInfo ci : list.getCodecInfos()) {
                if (ci.isEncoder()) continue;
                for (String type : ci.getSupportedTypes()) {
                    if (type.equalsIgnoreCase(mime)) {
                        String name = ci.getName().toLowerCase();
                        if (name.contains("c2.android") || name.contains("omx.google")
                                || name.contains("sw")) {
                            System.out.println("INFO using software decoder " + ci.getName());
                            return MediaCodec.createByCodecName(ci.getName());
                        }
                    }
                }
            }
            throw new IOException("no decoder for " + mime);
        }

        MediaExtractor openExtractor() throws IOException {
            MediaExtractor ex = new MediaExtractor();
            try {
                ex.setDataSource(input.getAbsolutePath());
            } catch (IOException e) {
                ex.release();
                throw new IOException("cannot open video file", e);
            }
            for (int i = 0; i < ex.getTrackCount(); i++) {
                MediaFormat f = ex.getTrackFormat(i);
                String m = f.getString(MediaFormat.KEY_MIME);
                if (m != null && m.startsWith("video/")) {
                    ex.selectTrack(i);
                    return ex;
                }
            }
            ex.release();
            throw new IOException("no video track found");
        }

        /** ImageReader RGBA_8888 -> Bitmap（快速拷貝）。 */
        static Bitmap rgbaToBitmap(Image image) {
            int w = image.getWidth();
            int h = image.getHeight();
            Image.Plane plane = image.getPlanes()[0];
            ByteBuffer buf = plane.getBuffer();
            int rowStride = plane.getRowStride();
            int pixStride = plane.getPixelStride();
            Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            if (pixStride == 4 && rowStride == w * 4) {
                buf.rewind();
                b.copyPixelsFromBuffer(buf);
            } else {
                int[] argb = new int[w * h];
                for (int y = 0; y < h; y++) {
                    int base = y * rowStride;
                    int outBase = y * w;
                    for (int x = 0; x < w; x++) {
                        int o = base + x * pixStride;
                        int r = buf.get(o) & 0xFF;
                        int g = buf.get(o + 1) & 0xFF;
                        int bl = buf.get(o + 2) & 0xFF;
                        argb[outBase + x] = 0xFF000000 | (r << 16) | (g << 8) | bl;
                    }
                }
                b.setPixels(argb, 0, w, 0, 0, w, h);
            }
            return b;
        }

        /** YUV_420_888 -> ARGB_8888，超過目標尺寸時整數降採樣（保持寬高比）。 */
        static Bitmap imageToBitmapScaled(Image image, int maxW, int maxH) {
            Image.Plane[] planes = image.getPlanes();
            int w = image.getWidth();
            int h = image.getHeight();
            double scale = Math.min(1.0, Math.min((double) maxW / w, (double) maxH / h));
            int outW = Math.max(1, (int) (w * scale));
            int outH = Math.max(1, (int) (h * scale));

            ByteBuffer yb = planes[0].getBuffer();
            ByteBuffer ub = planes[1].getBuffer();
            ByteBuffer vb = planes[2].getBuffer();
            int yRow = planes[0].getRowStride();
            int yPix = planes[0].getPixelStride();
            int uRow = planes[1].getRowStride();
            int uPix = planes[1].getPixelStride();
            int vRow = planes[2].getRowStride();
            int vPix = planes[2].getPixelStride();

            int[] argb = new int[outW * outH];
            for (int oy = 0; oy < outH; oy++) {
                int y = oy * h / outH;
                int yo = y * yRow;
                int uo = (y / 2) * uRow;
                int vo = (y / 2) * vRow;
                int outBase = oy * outW;
                for (int ox = 0; ox < outW; ox++) {
                    int x = ox * w / outW;
                    int Y = yb.get(yo + x * yPix) & 0xFF;
                    int U = (ub.get(uo + (x / 2) * uPix) & 0xFF) - 128;
                    int V = (vb.get(vo + (x / 2) * vPix) & 0xFF) - 128;
                    int r = Y + ((359 * V) >> 8);
                    int g = Y - ((88 * U + 183 * V) >> 8);
                    int bl = Y + ((454 * U) >> 8);
                    if (r < 0) r = 0; else if (r > 255) r = 255;
                    if (g < 0) g = 0; else if (g > 255) g = 255;
                    if (bl < 0) bl = 0; else if (bl > 255) bl = 255;
                    argb[outBase + ox] = 0xFF000000 | (r << 16) | (g << 8) | bl;
                }
            }
            Bitmap b = Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888);
            b.setPixels(argb, 0, outW, 0, 0, outW, outH);
            return b;
        }

        /** 通用轉換：支援 RGBA_8888 / NV21 / YV12 等常見輸出（原尺寸）。 */
        Bitmap imageToBitmapGeneric(Image image) {
            int w = image.getWidth();
            int h = image.getHeight();
            Image.Plane[] planes = image.getPlanes();
            int[] argb = new int[w * h];
            int fmt = image.getFormat();
            if (fmt == ImageFormat.FLEX_RGBA_8888) {
                ByteBuffer buf = planes[0].getBuffer();
                int rowStride = planes[0].getRowStride();
                int pixStride = planes[0].getPixelStride();
                for (int y = 0; y < h; y++) {
                    int base = y * rowStride;
                    int outBase = y * w;
                    for (int x = 0; x < w; x++) {
                        int o = base + x * pixStride;
                        int r = buf.get(o) & 0xFF;
                        int g = buf.get(o + 1) & 0xFF;
                        int b = buf.get(o + 2) & 0xFF;
                        argb[outBase + x] = 0xFF000000 | (r << 16) | (g << 8) | b;
                    }
                }
            } else {
                // NV21 / YV12 等 YUV 類格式：整數降採樣到目標尺寸
                Bitmap b = imageToBitmapScaled(image, frameW, frameH);
                return b;
            }
            Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            b.setPixels(argb, 0, w, 0, 0, w, h);
            return b;
        }
    }

    /** Animated GIF decode path: android.graphics.Movie (Skia GIF codec) frames -> placed JPEGs. */
    static class GifDecoder {
        final File input;
        final int fps;
        final int maxSeconds;
        final int frameW, frameH;
        final int sizePct;
        final int xPct, yPct;
        final int rotateDeg;
        final long trimStartUs;
        final long trimEndUs;
        final File frameDir;
        int frameCount = 0;

        GifDecoder(File input, int fps, int maxSeconds, int frameW, int frameH, int sizePct, int xPct, int yPct,
                int rotateDeg, long trimStartUs, long trimEndUs, File frameDir) {
            this.input = input;
            this.fps = fps;
            this.maxSeconds = maxSeconds;
            this.frameW = frameW;
            this.frameH = frameH;
            this.sizePct = sizePct;
            this.xPct = xPct;
            this.yPct = yPct;
            this.rotateDeg = rotateDeg;
            this.trimStartUs = trimStartUs;
            this.trimEndUs = trimEndUs;
            this.frameDir = frameDir;
        }

        void decode() throws Exception {
            Movie movie = Movie.decodeFile(input.getAbsolutePath());
            if (movie == null) throw new IOException("cannot decode GIF file");
            int gw = movie.width();
            int gh = movie.height();
            if (gw <= 0 || gh <= 0) throw new IOException("bad GIF size");
            int duration = movie.duration();
            if (duration <= 0) duration = maxSeconds * 1000;
            System.out.println("INFO gif=" + gw + "x" + gh + " durationMs=" + duration
                    + " rotate=" + rotateDeg + "deg trim=" + (trimStartUs / 1e6) + "-" + (trimEndUs / 1e6) + "s");

            int maxFrames = Math.min(MAX_FRAMES, fps * maxSeconds);
            if (trimEndUs > trimStartUs && trimEndUs > 0) {
                maxFrames = Math.min(maxFrames, Math.max(1, (int) Math.ceil((trimEndUs - trimStartUs) * fps / 1e6)));
            }
            int startMs = (int) (trimStartUs / 1000);
            int endMs = (int) ((trimEndUs + 999) / 1000);
            int stepMs = Math.max(1, 1000 / fps);
            for (int t = 0; t < duration && frameCount < maxFrames; t += stepMs) {
                // 截取視窗：視窗之前的幀直接丟棄，到達結束時間即完成
                if (t < startMs) continue;
                if (trimEndUs > 0 && t >= endMs) break;
                Bitmap b = Bitmap.createBitmap(gw, gh, Bitmap.Config.ARGB_8888);
                Canvas c = new Canvas(b);
                c.drawColor(Color.BLACK);
                movie.setTime(t);
                movie.draw(c, 0f, 0f);
                Bitmap framed = placeFrame(b, frameW, frameH, sizePct, xPct, yPct, rotateDeg);
                b.recycle();
                writeJpeg(framed, new File(frameDir, String.format("%04d.jpg", frameCount + 1)));
                framed.recycle();
                frameCount++;
                if (frameCount % 10 == 0) {
                    System.out.println("PROGRESS " + (1 + 86 * frameCount / maxFrames));
                }
            }
            if (frameCount == 0) throw new IOException("no frames decoded from GIF");
        }
    }
}
