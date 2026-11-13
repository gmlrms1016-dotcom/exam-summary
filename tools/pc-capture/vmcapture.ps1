<#
  vmcapture.ps1 — 창을 "원래 픽셀 크기 그대로" PNG 로 캡처 (다른 컴퓨터(학교 PC · PC방 등) Claude Code 용 · 2026-10-29 · 11-05 고침)
  왜: Claude Code 가 찍은 캡처가 흐려서 과제를 다시 직접 캡처함 → 원인 = 화면 배율(125 · 150%)에서
      DPI 인식 없이 찍으면 작게 찍힌 그림이 늘어나 흐려짐 · JPG · 크기 줄이기
  하는 일: ① DPI 인식 켜기 (SetProcessDpiAwarenessContext(-4) = Per-Monitor V2 · 안 되면 이 스레드만)
           ② 그 창만 — PrintWindow(PW_RENDERFULLCONTENT) 로 창이 스스로 그리게 함 → 다른 창(Claude 앱 등)에 가려져 있어도 깨끗
              (2026-11-05 학교 PC: 화면 복사 방식은 Claude 창에 가려진 채 찍혔고 오류도 안 났음)
           ③ DWM 의 보이는 테두리로 자르기 (그림자 · 투명 테두리 X) — 제목 줄은 그대로 (VMware 과제 = 원래 제목 그대로 · 사용자 2026-11-05)
           ③-1 -TextOnly: 검은 글자 화면(CUI · Server(B) 등)은 글자 부분만 딱 맞게 — 검은 콘솔 영역을 먼저 찾고 그 안의 글자 테두리 + 검은 여백 12px
               (2026-11-13 사용자: "검은 화면에 작은 글씨라 글자가 너무 작음" · 제목 줄 · 메뉴 · 라이브러리 · 검은 여백 X)
           ④ 원래 픽셀 크기 그대로 (줄이기 X)  ⑤ PNG (JPG X)
  사용:
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1" -Out "C:\경로\과제1.png"
    -Title "Server(B)"   제목에 VMware 와 이 글자가 있는 창 (지금 열린 VM 탭 이름이 제목에 나옴)
    -Process code        VMware 말고 다른 프로그램의 창 (프로세스 이름: code · cmd · WindowsTerminal · notepad …)
    -Window yunhuigeun   VMware 말고 제목에 이 글자가 있는 아무 창
    -Method Screen       예전 방식(화면에서 복사) — 찍기 전에 그 창이 맨 앞인지 확인하고 아니면 ERROR
    -Client              창 테두리 · 제목 줄을 빼고 안쪽만 (규칙상 보통 안 씀 — 제목 줄은 살림)
    -TextOnly            글자 화면(CUI)은 글자 부분만 잘라 저장 + 워드에 넣을 폭(word width …cm) 알려 줌 · 그래픽 화면(GNOME)에 쓰면 ERROR (그때는 빼고 찍기)
    -PageCm 17           워드 본문 폭(cm) = word width 의 최대값 (기본 17)
    -Out 을 안 주면 바탕화면에 capture_날짜_시각.png
  출력은 영어 한 줄 (Claude Code 가 읽을 때 한글이 깨지지 않게): SAVED: 경로 | 가로 x 세로 px | DPI: … | method: … | window: … (-TextOnly 면 | text only: … | word width …cm)
  word width = 글자 줄 간격(보통 16px)이 워드에서 0.42cm(본문 글자쯤)가 되는 폭 · 본문 폭보다 넓은 출력만 본문 폭 → 그림마다 글자 크기가 비슷하게
#>
param(
    [string]$Out = "",
    [string]$Title = "",
    [string]$Process = "",
    [string]$Window = "",
    [ValidateSet("PrintWindow", "Screen")] [string]$Method = "PrintWindow",
    [switch]$Client,
    [switch]$TextOnly,
    [double]$PageCm = 17.0
)
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class VmCap {
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
    [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr value);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref POINT pt);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);
    [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr hWnd, int attr, out RECT rect, int size);
    // 2026-11-08: Get-Process 의 MainWindowTitle 이 비어 "VMware window not found" 가 나던 것 → 보이는 창을 모두 훑기
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder sb, int max);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    public static System.Collections.Generic.List<string> Windows() {
        var list = new System.Collections.Generic.List<string>();
        EnumWindows(delegate (IntPtr h, IntPtr l) {
            if (IsWindowVisible(h)) {
                var sb = new System.Text.StringBuilder(512);
                GetWindowText(h, sb, 512);
                if (sb.Length > 0) { uint pid; GetWindowThreadProcessId(h, out pid); list.Add(h.ToInt64() + "|" + pid + "|" + sb.ToString()); }
            }
            return true;
        }, IntPtr.Zero);
        return list;
    }
    // 2026-11-13 -TextOnly: 검은 글자 화면(CUI)에서 글자 부분만 { x, y, 폭, 높이, 줄 간격 } · 검은 글자 화면이 없으면 null
    //   ① 25% 넘게 검정(가장 밝은 채널 < 16)인 가로줄이 가장 길게 이어진 곳 = 콘솔 위아래 → 그 안에서 같은 방법으로 왼쪽 · 오른쪽
    //      (메뉴 · 라이브러리 · 상태 줄은 밝아서 빠짐 · 콘솔 가장자리의 얇은 밝은 선은 2px 안쪽으로 줄여서 뺌)
    //   ② 콘솔 안의 밝은 픽셀(> 90) = 글자 → 그 테두리  ③ 98% 넘게 검정인 곳으로만 여백 넓히기  ④ 글자 줄이 시작되는 간격의 가운데 값 = 줄 간격
    public static int[] TextBox(Bitmap b, int margin) {
        int W = b.Width, H = b.Height;
        BitmapData bd = b.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
        int st = bd.Stride; byte[] px = new byte[st * H];
        Marshal.Copy(bd.Scan0, px, 0, px.Length); b.UnlockBits(bd);
        byte[] m = new byte[W * H];
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) { int i = y * st + x * 3; m[y * W + x] = Math.Max(px[i], Math.Max(px[i + 1], px[i + 2])); }
        bool[] rows = new bool[H];
        for (int y = 0; y < H; y++) { int n = 0; for (int x = 0; x < W; x++) if (m[y * W + x] < 16) n++; rows[y] = n * 4 >= W; }
        int[] ry = Longest(rows); int ya = ry[0], yb = ry[1];
        if (yb - ya < 40) return null;
        int hh = yb - ya + 1; bool[] cols = new bool[W];
        for (int x = 0; x < W; x++) { int n = 0; for (int y = ya; y <= yb; y++) if (m[y * W + x] < 16) n++; cols[x] = n * 4 >= hh; }
        int[] rx = Longest(cols); int xa = rx[0], xb = rx[1];
        if (xb - xa < 80) return null;
        xa += 2; xb -= 2; ya += 2; yb -= 2;
        int x0 = W, y0 = H, x1 = -1, y1 = -1; bool[] lit = new bool[H];
        for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) if (m[y * W + x] > 90) {
            lit[y] = true; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        if (x1 < 0) return null;
        for (int k = 0; k < margin; k++) {
            if (x0 > xa && AllDark(m, W, x0 - 1, x0 - 1, y0, y1)) x0--;
            if (x1 < xb && AllDark(m, W, x1 + 1, x1 + 1, y0, y1)) x1++;
            if (y0 > ya && AllDark(m, W, x0, x1, y0 - 1, y0 - 1)) y0--;
            if (y1 < yb && AllDark(m, W, x0, x1, y1 + 1, y1 + 1)) y1++;
        }
        var gaps = new System.Collections.Generic.List<int>(); int prev = -1;
        for (int y = ya + 1; y <= yb; y++) if (lit[y] && !lit[y - 1]) { if (prev >= 0 && y - prev >= 8 && y - prev <= 64) gaps.Add(y - prev); prev = y; }
        gaps.Sort();
        int pitch = gaps.Count > 0 ? gaps[gaps.Count / 2] : 0;
        return new int[] { x0, y0, x1 - x0 + 1, y1 - y0 + 1, pitch };
    }
    static int[] Longest(bool[] f) {                 // 가장 길게 이어진 true 구간 { 시작, 끝 } (없으면 { 0, -1 })
        int bs = 0, be = -1, s = -1;
        for (int i = 0; i <= f.Length; i++) {
            bool v = i < f.Length && f[i];
            if (v && s < 0) s = i;
            if (!v && s >= 0) { if (i - 1 - s > be - bs) { bs = s; be = i - 1; } s = -1; }
        }
        return new int[] { bs, be };
    }
    static bool AllDark(byte[] m, int W, int xs, int xe, int ys, int ye) {   // 그 줄이 98% 넘게 검정인지
        int tot = 0, d = 0;
        for (int y = ys; y <= ye; y++) for (int x = xs; x <= xe; x++) { tot++; if (m[y * W + x] < 16) d++; }
        return d * 100 >= tot * 98;
    }
}
"@

# 1) DPI 인식 켜기 — 프로세스가 이미 정해져 있으면 이 스레드만이라도 (-4 = PER_MONITOR_AWARE_V2)
$dpi = "FAILED (blurry if display scale is not 100%)"
$ok = $false
try { $ok = [VmCap]::SetProcessDpiAwarenessContext([IntPtr]::new(-4)) } catch { $ok = $false }      # Windows 10 1703+
if ($ok) { $dpi = "process PerMonitorV2" }
else {
    try { if ([VmCap]::SetThreadDpiAwarenessContext([IntPtr]::new(-4)) -ne [IntPtr]::Zero) { $dpi = "thread PerMonitorV2"; $ok = $true } } catch { }
    if (-not $ok) { try { if ([VmCap]::SetProcessDPIAware()) { $dpi = "system-aware" } } catch { } }
}

# 2) 창 찾기 — 기본 = 제목에 VMware 가 들어간 창 (-Title 로 좁히기) · -Process / -Window 면 아무 프로그램의 창
$procs = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero })
if ($Process -or $Window) {
    if ($Process) { $procs = @($procs | Where-Object { $_.ProcessName -like $Process }) }
    if ($Window)  { $procs = @($procs | Where-Object { $_.MainWindowTitle -like "*$Window*" }) }
    $what = "window (Process='$Process' Window='$Window')"
} else {
    $procs = @($procs | Where-Object { $_.MainWindowTitle -match "VMware" })
    if ($Title) { $procs = @($procs | Where-Object { $_.MainWindowTitle -like "*$Title*" }) }
    $what = "VMware window (is VMware Workstation open? does -Title match the window title?)"
}
$hWnd = [IntPtr]::Zero; $winTitle = ""
if ($procs.Count -gt 0) { $hWnd = $procs[0].MainWindowHandle; $winTitle = $procs[0].MainWindowTitle }
else {
    # 못 찾으면 EnumWindows 로 보이는 창을 모두 훑음 (2026-11-05 학교 PC: MainWindowTitle 이 비어 VMware 창을 못 찾았음)
    foreach ($line in [VmCap]::Windows()) {
        $parts = $line.Split([char]'|', 3)
        $wh = [IntPtr]::new([long]$parts[0]); $wpid = [int]$parts[1]; $wt = $parts[2]
        $pname = ""; try { $pname = (Get-Process -Id $wpid -ErrorAction Stop).ProcessName } catch { }
        if ($Process -or $Window) {
            $hit = $true
            if ($Process -and -not ($pname -like $Process)) { $hit = $false }
            if ($Window -and -not ($wt -like "*$Window*")) { $hit = $false }
        } else {
            $hit = ($wt -match "VMware") -and ((-not $Title) -or ($wt -like "*$Title*"))
        }
        if ($hit) { $hWnd = $wh; $winTitle = $wt; break }
    }
}
if ($hWnd -eq [IntPtr]::Zero) { Write-Output "ERROR: $what not found"; exit 1 }

# 3) 최소화돼 있으면 되살림 (PrintWindow 는 최소화된 창을 못 그림) · 화면 복사 방식만 앞으로 가져옴
if ([VmCap]::IsIconic($hWnd)) { [void][VmCap]::ShowWindow($hWnd, 9); Start-Sleep -Milliseconds 600 }
if ($Method -eq "Screen") {
    [VmCap]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [VmCap]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)   # Alt 를 한 번 눌렀다 떼면 앞으로 가져오기 잠금이 풀림
    [void][VmCap]::SetForegroundWindow($hWnd)
    Start-Sleep -Milliseconds 600
    if ([VmCap]::GetForegroundWindow() -ne $hWnd) { Write-Output "ERROR: the window is not in front (another window would be captured) - use -Method PrintWindow"; exit 1 }
}

# 4) 영역 — 창 전체(GetWindowRect · 보이지 않는 테두리 포함) 안에서 DWM 의 보이는 테두리만 · -Client 는 안쪽만
$wr = New-Object VmCap+RECT
[void][VmCap]::GetWindowRect($hWnd, [ref]$wr)
$vr = New-Object VmCap+RECT
if ([VmCap]::DwmGetWindowAttribute($hWnd, 9, [ref]$vr, 16) -ne 0) { $vr = $wr }
if ($Client) {
    $cr = New-Object VmCap+RECT
    [void][VmCap]::GetClientRect($hWnd, [ref]$cr)
    $pt = New-Object VmCap+POINT
    [void][VmCap]::ClientToScreen($hWnd, [ref]$pt)
    $cx = $pt.X; $cy = $pt.Y; $cw = $cr.Right - $cr.Left; $ch = $cr.Bottom - $cr.Top
} else {
    $cx = $vr.Left; $cy = $vr.Top; $cw = $vr.Right - $vr.Left; $ch = $vr.Bottom - $vr.Top
}
$fw = $wr.Right - $wr.Left; $fh = $wr.Bottom - $wr.Top
if ($cw -le 0 -or $ch -le 0 -or $fw -le 0 -or $fh -le 0) { Write-Output "ERROR: could not read window size (w=$cw h=$ch)"; exit 1 }

# 5) 찍기 — PrintWindow: 창 전체를 그려 받은 뒤 그 영역만 잘라냄 / Screen: 화면에서 그대로 복사
function Test-Blank($b) {                        # 다 같은 색 = 그려지지 않음 (가로세로 16칸씩 표본)
    $first = $b.GetPixel(0, 0).ToArgb()
    for ($i = 1; $i -le 16; $i++) { for ($j = 1; $j -le 16; $j++) {
        if ($b.GetPixel([int](($b.Width - 1) * $i / 17), [int](($b.Height - 1) * $j / 17)).ToArgb() -ne $first) { return $false } } }
    return $true
}
$used = $Method
$bmp = New-Object System.Drawing.Bitmap($cw, $ch, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
if ($Method -eq "PrintWindow") {
    $full = New-Object System.Drawing.Bitmap($fw, $fh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gf = [System.Drawing.Graphics]::FromImage($full)
    $hdc = $gf.GetHdc()
    $drawn = [VmCap]::PrintWindow($hWnd, $hdc, 2)                   # 2 = PW_RENDERFULLCONTENT (Windows 8.1+ · DirectX 창도 그림)
    $gf.ReleaseHdc($hdc); $gf.Dispose()
    if (-not $drawn -or (Test-Blank $full)) { $full.Dispose(); Write-Output "ERROR: PrintWindow could not draw this window - try again, or -Method Screen with the window in front"; exit 1 }
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($full, (New-Object System.Drawing.Rectangle(0, 0, $cw, $ch)), (New-Object System.Drawing.Rectangle(($cx - $wr.Left), ($cy - $wr.Top), $cw, $ch)), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose(); $full.Dispose()
} else {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($cx, $cy, 0, 0, (New-Object System.Drawing.Size($cw, $ch)), [System.Drawing.CopyPixelOperation]::SourceCopy)
    $g.Dispose()
}

# 5-1) -TextOnly: 검은 글자 화면(CUI)은 글자 부분만 딱 맞게 (2026-11-13 사용자: "검은 화면에 작은 글씨라 글자가 너무 작음")
$textMsg = ""
if ($TextOnly) {
    $tb = [VmCap]::TextBox($bmp, 12)
    if ($null -eq $tb) { $bmp.Dispose(); Write-Output "ERROR: -TextOnly found no black text screen (CUI) in this window - is the VM showing a text console? (graphic GNOME VM: capture without -TextOnly)"; exit 1 }
    $crop = $bmp.Clone((New-Object System.Drawing.Rectangle($tb[0], $tb[1], $tb[2], $tb[3])), [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $bmp.Dispose(); $bmp = $crop
    $pitch = $tb[4]; if ($pitch -le 0) { $pitch = 16 }
    $wordCm = [Math]::Min($PageCm, $tb[2] * 0.42 / $pitch)
    $textMsg = (" | text only: {0}x{1} at {2},{3} of window {4}x{5} | line {6}px | word width {7:0.0}cm" -f $tb[2], $tb[3], $tb[0], $tb[1], $cw, $ch, $pitch, $wordCm)
    $cw = $tb[2]; $ch = $tb[3]
}

# 6) PNG 저장 (줄이기 X · JPG X)
if (-not $Out) { $Out = Join-Path ([Environment]::GetFolderPath("Desktop")) ("capture_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".png") }
if (-not [IO.Path]::IsPathRooted($Out)) { $Out = Join-Path (Get-Location).Path $Out }      # 상대 경로 → 지금 PowerShell 위치 기준
if ([IO.Path]::GetExtension($Out) -ne ".png") { $Out = [IO.Path]::ChangeExtension($Out, ".png") }
$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("SAVED: {0} | {1} x {2} px | DPI: {3} | method: {4} | window: {5}{6}" -f $Out, $cw, $ch, $dpi, $used, $winTitle, $textMsg)
