<#
  vmcapture.ps1 — 창을 "원래 픽셀 크기 그대로" PNG 로 캡처 (다른 컴퓨터(학교 PC · PC방 등) Claude Code 용 · 2026-10-29 · 11-05 고침)
  왜: Claude Code 가 찍은 캡처가 흐려서 과제를 다시 직접 캡처함 → 원인 = 화면 배율(125 · 150%)에서
      DPI 인식 없이 찍으면 작게 찍힌 그림이 늘어나 흐려짐 · JPG · 크기 줄이기
  하는 일: ① DPI 인식 켜기 (SetProcessDpiAwarenessContext(-4) = Per-Monitor V2 · 안 되면 이 스레드만)
           ② 그 창만 — PrintWindow(PW_RENDERFULLCONTENT) 로 창이 스스로 그리게 함 → 다른 창(Claude 앱 등)에 가려져 있어도 깨끗
              (2026-11-05 학교 PC: 화면 복사 방식은 Claude 창에 가려진 채 찍혔고 오류도 안 났음)
           ③ DWM 의 보이는 테두리로 자르기 (그림자 · 투명 테두리 X) — 제목 줄은 그대로 (VMware 과제 = 원래 제목 그대로 · 사용자 2026-11-05)
           ④ 원래 픽셀 크기 그대로 (줄이기 X)  ⑤ PNG (JPG X)
  사용:
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1" -Out "C:\경로\과제1.png"
    -Title "Server(B)"   제목에 VMware 와 이 글자가 있는 창 (지금 열린 VM 탭 이름이 제목에 나옴)
    -Process code        VMware 말고 다른 프로그램의 창 (프로세스 이름: code · cmd · WindowsTerminal · notepad …)
    -Window yunhuigeun   VMware 말고 제목에 이 글자가 있는 아무 창
    -Method Screen       예전 방식(화면에서 복사) — 찍기 전에 그 창이 맨 앞인지 확인하고 아니면 ERROR
    -Client              창 테두리 · 제목 줄을 빼고 안쪽만 (규칙상 보통 안 씀 — 제목 줄은 살림)
    -Out 을 안 주면 바탕화면에 capture_날짜_시각.png
  출력은 영어 한 줄 (Claude Code 가 읽을 때 한글이 깨지지 않게): SAVED: 경로 | 가로 x 세로 px | DPI: … | method: … | window: …
#>
param(
    [string]$Out = "",
    [string]$Title = "",
    [string]$Process = "",
    [string]$Window = "",
    [ValidateSet("PrintWindow", "Screen")] [string]$Method = "PrintWindow",
    [switch]$Client
)
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
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

# 6) PNG 저장 (줄이기 X · JPG X)
if (-not $Out) { $Out = Join-Path ([Environment]::GetFolderPath("Desktop")) ("capture_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".png") }
if (-not [IO.Path]::IsPathRooted($Out)) { $Out = Join-Path (Get-Location).Path $Out }      # 상대 경로 → 지금 PowerShell 위치 기준
if ([IO.Path]::GetExtension($Out) -ne ".png") { $Out = [IO.Path]::ChangeExtension($Out, ".png") }
$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("SAVED: {0} | {1} x {2} px | DPI: {3} | method: {4} | window: {5}" -f $Out, $cw, $ch, $dpi, $used, $winTitle)
