<#
  vmtype.ps1 — VMware 의 글자 콘솔 VM 에 명령을 하나씩 쳐서, 출력이 다 나오면 그 창을 찍기 (다른 컴퓨터 Claude Code 용 · 2026-11-05)
  왜: 원격제어(Computer use)가 꺼져 있으면 VM 에 입력할 방법이 없음 → 2026-11-05 학교 PC 에서 임시 스크립트로 명령 10개를 쳐서 캡처한 것을 도구로
  ⚠️ 쓰면 안 되는 곳 (2026-11-05 학교 PC 에서 확인):
     · (2026-11-13 바뀜) 그래픽 화면(GNOME) VM 은 터미널에서 조건부로 씀 — 사용자: "뭐가 뭔지 모르니까 오타 안 나고 빠르게 쳐 주는 걸로"
       터미널을 VM 안 맨 앞에 열고(포커스) 영어 입력 상태 · -KeepWindow · 첫 명령(whoami)을 그림으로 확인한 뒤 나머지 · 한글 입력이면 글자가 깨짐
       (2026-11-05: GNOME 터미널의 fdisk 에 q 를 보냈더니 나가지 않고 도움말이 뜸 · 2026-11-12: GNOME 터미널에 영어로는 잘 들어감)
     · 디스크를 바꾸는 명령 (fdisk · parted · mkfs · mdadm · dd · wipefs · pvcreate 등) · 재부팅 · 끄기 → 이 도구가 거부함
       → 원격제어(Computer use)로 화면을 보면서 하거나, 사용자가 직접 치고 Claude 는 vmcapture.ps1 로 찍기만 (키 안 보냄)
  하는 일 (명령마다):
     ① 그 VMware 창을 앞으로 — Alt 를 한 번 눌렀다 뗀 뒤 SetForegroundWindow (앞으로 가져오기 잠금이 풀림) · Ctrl+G 로 입력을 VM 에 넘김
     ② 키를 보내기 전에 매번 맨 앞 창이 그 VMware 창인지 확인 — 아니면 키를 안 보내고 멈춤 (다른 창에 글자가 들어가지 않게)
     ③ 한 글자씩 40ms 간격 (한 번에 보내면 VM 이 못 따라와 글자가 빠지고 입력 중에 찍힘) → Enter
     ④ 화면이 더 안 바뀔 때까지 기다림 (PrintWindow 로 비교 · 커서 깜빡임 정도는 무시) — 출력이 늦은 명령(ls -l /etc | head -20)도 출력 뒤에 찍힘
     ⑤ 그 창만 원래 픽셀 PNG (vmcapture.ps1 과 같은 방식 · 다른 창에 가려져도 깨끗) — 글자 콘솔이라 **글자 부분만 딱 맞게 잘라서**
        (2026-11-13 사용자: "검은 화면에 작은 글씨라 글자가 너무 작음" · 제목 줄 · 메뉴 · 검은 여백 X · vmcapture.ps1 -TextOnly 와 같은 방법 · -KeepWindow 면 예전처럼 창 통째로)
     끝나면 Ctrl+Alt 로 입력을 풀어 줌
  사용:
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmtype.ps1" -Title "Server(B)" -Commands "df -h;;ls -l /etc | head -20" -OutDir "C:\경로\캡처" -Names "B01_df;;B02_ls"
    -Commands · -Names 는 ;; 로 나눔 (powershell -File 로 배열을 넘기면 "a,b" 한 문자열로 합쳐짐) · 명령은 영어로만
    -DryRun   키는 안 보내고 무엇을 할지만 출력 (먼저 이걸로 확인 · -Commands 는 꼭 있어야 함: -Commands "hostname" -DryRun)
    -TimeoutMs 180000  한 명령을 기다리는 최대 시간 (기본 3분 — 2026-11-12: dnf 가 저장소가 느려 30초로는 짧았음)
  ⚠️ 화면의 프롬프트를 읽지 못함 → 보내기 전에 vmcapture.ps1 -TextOnly 로 찍어 열어 보고 root 프롬프트(#)인지 확인 · su 가 실패했으면 멈추기
     (2026-11-12: rocky 상태에 dnf 를 보내 오류 · su 실패 뒤에도 다음 명령을 보냄) · 오래 걸리는 명령은 찍은 그림에서 끝났는지(Complete! 등) 확인
    -KeepWindow  글자 부분만 자르지 않고 창 통째로 (제목 줄 그대로) · -PageCm 17 = 워드 본문 폭(cm) = word width 의 최대값
  출력은 영어 (Claude Code 가 읽을 때 한글이 깨지지 않게): SAVED: 경로 | 가로 x 세로 px | text only … | word width …cm | cmd: … · 문제가 있으면 ERROR: …
  word width = 글자 줄 간격(보통 16px)이 워드에서 0.42cm(본문 글자쯤)가 되는 폭 · 본문 폭보다 넓은 출력만 본문 폭 → 그림마다 글자 크기가 비슷하게
#>
param(
    [Parameter(Mandatory = $true)] [string]$Commands,
    [string]$Title = "",
    [string]$OutDir = "",
    [string]$Names = "",
    [int]$CharDelayMs = 40,
    [int]$StableMs = 1500,
    [int]$TimeoutMs = 180000,
    [switch]$KeepWindow,
    [double]$PageCm = 17.0,
    [switch]$DryRun
)
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -ReferencedAssemblies System.Drawing @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class VmType {
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr value);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);
    [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr hWnd, int attr, out RECT rect, int size);
    // 2026-11-13: 검은 글자 화면에서 글자 부분만 { x, y, 폭, 높이, 줄 간격 } · 없으면 null (vmcapture.ps1 의 TextBox 와 같은 코드)
    //   ① 25% 넘게 검정인 가로줄 · 세로줄이 가장 길게 이어진 곳 = 콘솔 (2px 안쪽) ② 콘솔 안의 밝은 픽셀 = 글자 테두리 ③ 검은 곳으로만 여백 ④ 줄 간격
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
    static int[] Longest(bool[] f) {
        int bs = 0, be = -1, s = -1;
        for (int i = 0; i <= f.Length; i++) {
            bool v = i < f.Length && f[i];
            if (v && s < 0) s = i;
            if (!v && s >= 0) { if (i - 1 - s > be - bs) { bs = s; be = i - 1; } s = -1; }
        }
        return new int[] { bs, be };
    }
    static bool AllDark(byte[] m, int W, int xs, int xe, int ys, int ye) {
        int tot = 0, d = 0;
        for (int y = ys; y <= ye; y++) for (int x = xs; x <= xe; x++) { tot++; if (m[y * W + x] < 16) d++; }
        return d * 100 >= tot * 98;
    }
}
"@

# 1) DPI 인식 (원래 픽셀) — 안 되면 이 스레드만
$dpiMode = "FAILED"
try { if ([VmType]::SetProcessDpiAwarenessContext([IntPtr]::new(-4))) { $dpiMode = "process PerMonitorV2" } } catch { }
if ($dpiMode -eq "FAILED") { try { if ([VmType]::SetThreadDpiAwarenessContext([IntPtr]::new(-4)) -ne [IntPtr]::Zero) { $dpiMode = "thread PerMonitorV2" } } catch { } }

# 2) 명령 나누기 · 디스크를 바꾸는 명령 · 재부팅은 거부 (사용자가 직접)
$cmdList = @($Commands -split ";;" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$nameList = @()
if ($Names) { $nameList = @($Names -split ";;" | ForEach-Object { $_.Trim() }) }
$danger = '(^|[\s;|&(])(sudo\s+)?(fdisk|sfdisk|gdisk|cfdisk|parted|mkfs(\.\w+)?|mkswap|mdadm|dd|wipefs|pvcreate|vgcreate|lvcreate|pvremove|vgremove|lvremove|reboot|shutdown|poweroff|halt|init\s+[06])(\s|$)'
$refused = @($cmdList | Where-Object { $_ -match $danger })
if ($refused.Count -gt 0) { Write-Output ("ERROR: refused - disk-changing / reboot commands must be typed by the user (then capture with vmcapture.ps1): " + ($refused -join " | ")); exit 1 }
$nonAscii = @($cmdList | Where-Object { $_ -match '[^\x20-\x7E]' })
if ($nonAscii.Count -gt 0) { Write-Output ("ERROR: commands must be plain English/ASCII: " + ($nonAscii -join " | ")); exit 1 }

# 3) VMware 창 (-Title 로 VM 탭 고르기)
$procs = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.MainWindowTitle -match "VMware" })
if ($Title) { $procs = @($procs | Where-Object { $_.MainWindowTitle -like "*$Title*" }) }
if ($procs.Count -eq 0) { Write-Output "ERROR: VMware window not found (is VMware Workstation open? does -Title match the window title?)"; exit 1 }
$vm = $procs[0]
$hWnd = $vm.MainWindowHandle
if (-not $OutDir) { $OutDir = Join-Path ([Environment]::GetFolderPath("Desktop")) ("vmtype_" + (Get-Date -Format "yyyyMMdd_HHmmss")) }
if (-not [IO.Path]::IsPathRooted($OutDir)) { $OutDir = Join-Path (Get-Location).Path $OutDir }

if ($DryRun) {
    Write-Output ("DRYRUN: window: {0} | DPI: {1} | out: {2}" -f $vm.MainWindowTitle, $dpiMode, $OutDir)
    for ($i = 0; $i -lt $cmdList.Count; $i++) {
        $nm = "{0:D2}" -f ($i + 1)
        if ($i -lt $nameList.Count -and $nameList[$i]) { $nm = $nameList[$i] }
        Write-Output ("DRYRUN: {0}.png <- {1}" -f $nm, $cmdList[$i])
    }
    exit 0
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Get-Frame {                              # 창 전체를 창이 스스로 그리게 (가려져도 OK)
    $wr = New-Object VmType+RECT
    [void][VmType]::GetWindowRect($hWnd, [ref]$wr)
    $full = New-Object System.Drawing.Bitmap(($wr.Right - $wr.Left), ($wr.Bottom - $wr.Top), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gr = [System.Drawing.Graphics]::FromImage($full)
    $hdc = $gr.GetHdc()
    [void][VmType]::PrintWindow($hWnd, $hdc, 2)
    $gr.ReleaseHdc($hdc); $gr.Dispose()
    return @{ Bmp = $full; Rect = $wr }
}
function Get-Sig($frame) {                        # 가로세로 48칸 표본 → 화면이 바뀌었는지 비교용
    $b = $frame.Bmp; $sig = New-Object int[] 2304; $k = 0
    for ($i = 0; $i -lt 48; $i++) { for ($j = 0; $j -lt 48; $j++) {
        $sig[$k] = $b.GetPixel([int](($b.Width - 1) * ($i + 0.5) / 48), [int](($b.Height - 1) * ($j + 0.5) / 48)).ToArgb(); $k++ } }
    return ,$sig
}
function Save-Frame($frame, $path) {              # DWM 의 보이는 테두리로 자르기 · 모서리 밖은 흰색 · 글자 부분만 (2026-11-13 · -KeepWindow 면 창 통째로) · PNG
    $wr = $frame.Rect
    $vr = New-Object VmType+RECT
    if ([VmType]::DwmGetWindowAttribute($hWnd, 9, [ref]$vr, 16) -ne 0) { $vr = $wr }
    $vw = $vr.Right - $vr.Left; $vh = $vr.Bottom - $vr.Top
    $outBmp = New-Object System.Drawing.Bitmap($vw, $vh, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $gr = [System.Drawing.Graphics]::FromImage($outBmp)
    $gr.Clear([System.Drawing.Color]::White)
    $gr.DrawImage($frame.Bmp, (New-Object System.Drawing.Rectangle(0, 0, $vw, $vh)), (New-Object System.Drawing.Rectangle(($vr.Left - $wr.Left), ($vr.Top - $wr.Top), $vw, $vh)), [System.Drawing.GraphicsUnit]::Pixel)
    $gr.Dispose()
    $info = ("{0} x {1} px" -f $vw, $vh)
    if (-not $KeepWindow) {                       # 글자 부분만 딱 맞게 (검은 글자 화면을 못 찾으면 창 통째로 + 경고)
        $tb = [VmType]::TextBox($outBmp, 12)
        if ($null -eq $tb) { $info += " | no black text screen (graphic GUI?) - saved the whole window (GNOME: use -KeepWindow)" }
        else {
            $crop = $outBmp.Clone((New-Object System.Drawing.Rectangle($tb[0], $tb[1], $tb[2], $tb[3])), [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
            $outBmp.Dispose(); $outBmp = $crop
            $pitch = $tb[4]; if ($pitch -le 0) { $pitch = 16 }
            $info = ("{0} x {1} px | text only (window {2} x {3}) | line {4}px | word width {5:0.0}cm" -f $tb[2], $tb[3], $vw, $vh, $pitch, [Math]::Min($PageCm, $tb[2] * 0.42 / $pitch))
        }
    }
    $outBmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
    return $info
}
function Release-Input {                          # Ctrl+Alt = VM 이 잡은 입력을 풀어 줌
    [VmType]::keybd_event(0x11, 0, 0, [UIntPtr]::Zero); [VmType]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero)
    [VmType]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero); [VmType]::keybd_event(0x11, 0, 2, [UIntPtr]::Zero)
    # 2026-11-12: 끝난 뒤 Ctrl 이 눌린 채 남아 텔넷에 teluser 를 치니 ^T^E^L 이 찍힘 → Shift · Ctrl · Alt (왼 · 오른쪽까지) 모두 떼기
    foreach ($vk in 0x10, 0x11, 0x12, 0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5) { [VmType]::keybd_event([byte]$vk, 0, 2, [UIntPtr]::Zero) }
}
function Stop-IfNotFront($what) {                 # 맨 앞이 그 VMware 창이 아니면 키를 안 보내고 멈춤
    if ([VmType]::GetForegroundWindow() -ne $hWnd) { Release-Input; Write-Output ("ERROR: VMware is no longer in front - stopped before " + $what + " (nothing was typed into another window)"); exit 1 }
}

# 4) 앞으로 가져오기 → Ctrl+G 로 입력을 VM 에
if ([VmType]::IsIconic($hWnd)) { [void][VmType]::ShowWindow($hWnd, 9); Start-Sleep -Milliseconds 600 }
[VmType]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [VmType]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
[void][VmType]::SetForegroundWindow($hWnd)
Start-Sleep -Milliseconds 500
Stop-IfNotFront "grabbing input"
[System.Windows.Forms.SendKeys]::SendWait("^g")
Start-Sleep -Milliseconds 300

for ($i = 0; $i -lt $cmdList.Count; $i++) {
    $cmd = $cmdList[$i]
    foreach ($c in $cmd.ToCharArray()) {          # 한 글자씩 (SendKeys 특수문자는 { } 로 감쌈)
        Stop-IfNotFront ("typing command " + ($i + 1))
        $key = [string]$c
        if ('+^%~(){}[]'.Contains($key)) { $key = "{" + $key + "}" }
        [System.Windows.Forms.SendKeys]::SendWait($key)
        Start-Sleep -Milliseconds $CharDelayMs
    }
    Stop-IfNotFront ("pressing Enter for command " + ($i + 1))
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

    $t0 = [Environment]::TickCount; $since = $t0; $last = $null; $timedOut = $false
    while ($true) {                               # 화면이 StableMs 동안 (거의) 안 바뀌면 = 출력이 다 나옴 (커서 깜빡임 = 표본 몇 칸은 무시)
        Start-Sleep -Milliseconds 300
        $fr = Get-Frame; $sig = Get-Sig $fr; $fr.Bmp.Dispose()
        $now = [Environment]::TickCount
        $changed = 9999
        if ($null -ne $last) { $changed = 0; for ($k = 0; $k -lt $sig.Length; $k++) { if ($sig[$k] -ne $last[$k]) { $changed++ } } }
        if ($changed -gt 3) { $last = $sig; $since = $now }
        elseif (($now - $since) -ge $StableMs) { break }
        if (($now - $t0) -ge $TimeoutMs) { $timedOut = $true; break }
    }
    $nm = "{0:D2}" -f ($i + 1)
    if ($i -lt $nameList.Count -and $nameList[$i]) { $nm = $nameList[$i] }
    $path = Join-Path $OutDir ($nm + ".png")
    $fr = Get-Frame; $size = Save-Frame $fr $path; $fr.Bmp.Dispose()
    $warn = ""
    if ($timedOut) { $warn = " | WARNING: screen kept changing until timeout - check the picture" }
    Write-Output ("SAVED: {0} | {1} | DPI: {2} | cmd: {3}{4}" -f $path, $size, $dpiMode, $cmd, $warn)
}
Release-Input
Write-Output ("DONE: {0} commands | out: {1}" -f $cmdList.Count, $OutDir)
