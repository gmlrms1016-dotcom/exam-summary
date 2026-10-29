<#
  vmcapture.ps1 — VMware 창을 "원래 픽셀 크기 그대로" PNG 로 캡처 (학교 PC Claude Code 용 · 2026-10-29)
  왜: Claude Code 가 찍은 캡처가 흐려서 과제를 다시 직접 캡처함 → 원인 = 화면 배율(125 · 150%)에서
      DPI 인식 없이 찍으면 작게 찍힌 그림이 늘어나 흐려짐 · JPG · 크기 줄이기
  하는 일: ① DPI 인식 켜기 (SetProcessDpiAwarenessContext(-4) = Per-Monitor V2 · 안 되면 이 스레드만)
           ② VMware 창 영역만 (전체 화면 X · 그림자 · 투명 테두리 X)
           ③ 원래 픽셀 크기 그대로 (줄이기 X)  ④ PNG (JPG X)
  사용:
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1" -Out "C:\경로\과제1.png"
    -Title "Server(B)"  창 제목에 이 글자가 있는 VMware 창만 (지금 열린 탭 이름이 제목에 나옴)
    -Client             창 테두리 · 제목줄을 빼고 안쪽만
    -Out 을 안 주면 바탕화면에 capture_날짜_시각.png
#>
param(
    [string]$Out = "",
    [string]$Title = "",
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
    [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr hWnd, int attr, out RECT rect, int size);
}
"@

# 1) DPI 인식 켜기 — 프로세스가 이미 정해져 있으면 이 스레드만이라도 (-4 = PER_MONITOR_AWARE_V2)
#    (출력 글자는 영어 — Claude Code 가 읽을 때 한글이 깨지지 않게)
$dpi = "FAILED (blurry if display scale is not 100%)"
$ok = $false
try { $ok = [VmCap]::SetProcessDpiAwarenessContext([IntPtr]::new(-4)) } catch { $ok = $false }      # Windows 10 1703+
if ($ok) { $dpi = "process PerMonitorV2" }
else {
    try { if ([VmCap]::SetThreadDpiAwarenessContext([IntPtr]::new(-4)) -ne [IntPtr]::Zero) { $dpi = "thread PerMonitorV2"; $ok = $true } } catch { }
    if (-not $ok) { try { if ([VmCap]::SetProcessDPIAware()) { $dpi = "system-aware" } } catch { } }
}

# 2) VMware 창 찾기 (제목에 VMware 가 들어간 창 · -Title 로 좁히기)
$procs = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.MainWindowTitle -match "VMware" })
if ($Title) { $procs = @($procs | Where-Object { $_.MainWindowTitle -like "*$Title*" }) }
if ($procs.Count -eq 0) { Write-Output "ERROR: VMware window not found (is VMware Workstation open? does -Title match the window title?)"; exit 1 }
$p = $procs[0]
$h = $p.MainWindowHandle

# 3) 앞으로 가져오기 (최소화돼 있으면 되살림) → 그려질 때까지 잠깐 기다림
if ([VmCap]::IsIconic($h)) { [void][VmCap]::ShowWindow($h, 9) }
[void][VmCap]::SetForegroundWindow($h)
try { [void](New-Object -ComObject WScript.Shell).AppActivate($p.Id) } catch { }
Start-Sleep -Milliseconds 600

# 4) 실제 픽셀 영역 — 창 전체는 DWM 의 보이는 테두리(그림자 · 투명 테두리 제외) · -Client 는 안쪽만
if ($Client) {
    $c = New-Object VmCap+RECT
    [void][VmCap]::GetClientRect($h, [ref]$c)
    $pt = New-Object VmCap+POINT
    [void][VmCap]::ClientToScreen($h, [ref]$pt)
    $x = $pt.X; $y = $pt.Y; $w = $c.Right - $c.Left; $hh = $c.Bottom - $c.Top
} else {
    $r = New-Object VmCap+RECT
    if ([VmCap]::DwmGetWindowAttribute($h, 9, [ref]$r, 16) -ne 0) { [void][VmCap]::GetWindowRect($h, [ref]$r) }
    $x = $r.Left; $y = $r.Top; $w = $r.Right - $r.Left; $hh = $r.Bottom - $r.Top
}
if ($w -le 0 -or $hh -le 0) { Write-Output "ERROR: could not read window size (w=$w h=$hh)"; exit 1 }

# 5) 화면에서 그대로 복사 → PNG 저장 (줄이기 X · JPG X)
$bmp = New-Object System.Drawing.Bitmap($w, $hh, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($x, $y, 0, 0, (New-Object System.Drawing.Size($w, $hh)), [System.Drawing.CopyPixelOperation]::SourceCopy)
$g.Dispose()
if (-not $Out) { $Out = Join-Path ([Environment]::GetFolderPath("Desktop")) ("capture_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".png") }
if (-not [IO.Path]::IsPathRooted($Out)) { $Out = Join-Path (Get-Location).Path $Out }      # 상대 경로 → 지금 PowerShell 위치 기준
if ([IO.Path]::GetExtension($Out) -ne ".png") { $Out = [IO.Path]::ChangeExtension($Out, ".png") }
$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("SAVED: {0} | {1} x {2} px | DPI: {3} | window: {4}" -f $Out, $w, $hh, $dpi, $p.MainWindowTitle)
