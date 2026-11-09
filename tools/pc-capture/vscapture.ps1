<#
  vscapture.ps1 — Windows Visual Studio 의 소스 · 실행 결과를 "원래 픽셀 크기 그대로" PNG 로 캡처
  (2026-11-09 학교 PC 피드백 5번을 도구로 · 같은 날 제출 워드를 보고 소스 캡처를 고침:
   VS 창 통째 + 솔루션 탐색기 · 출력 창 · 다른 탭이 같이 찍히고 코드가 작았음)

  소스 (-Mode src) : 다른 탭 닫기(바뀐 내용은 저장) → 그 파일만 열기 → 도구 창(솔루션 탐색기 · 출력 · 오류 목록 …) 숨기기
                     → 창을 화면 크기로 → 코드가 다 보이는 데까지 확대(View.ZoomIn · 길면 ZoomOut)
                     → 창 폭 · 높이를 코드에 맞게 줄이기 (VS 가 알려 주는 '보이는 줄 · 칸 수'로 재서 — 색 짐작 X)
                     → 현재 줄 강조 테두리 잠깐 끄기 · 여러 장 찍어 깜빡이는 커서가 꺼진 장면 고르기
                     → 확대 · 도구 창 · 강조 · 창 위치 되돌리기 (글자는 줄 높이 약 64px = 글자 약 40px 까지만)
  실행 (-Mode run) : 시작 프로젝트 바꾸기 → 디버그하지 않고 시작(Ctrl+F5) → 새로 뜬 디버그 콘솔 창
                     → 창 높이를 출력에 맞게 줄이기 → 여러 장 찍어 커서가 꺼진 장면 고르기
  캡처 자체는 같은 폴더의 vmcapture.ps1 (PrintWindow · DPI 인식 · 원본 PNG · 제목 줄 살림 · 다른 창에 가려져도 깨끗)

  사용 (Visual Studio 에 솔루션이 열려 있어야 함 · 먼저 -DryRun):
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vscapture.ps1" -Mode src -File "C:\WorkC\w11\ex01\ex01.c" -Out "C:\캡처\src_ex01.png"
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vscapture.ps1" -Mode run -Project "ex01" -Out "C:\캡처\run_ex01.png"
    -Lines 1-45  50줄이 넘는 파일을 나눠 찍기 (그 줄부터 위에 · 그 줄까지만 맞춤) → src_이름_1.png · _2.png …
    -NoFit       확대 · 창 크기 맞추기를 안 함 (도구 창 숨기기 · 다른 탭 닫기는 함)
    -Height 300  실행 창 높이를 직접 (px) · -Shots 5 몇 장 찍어 고를지
  출력은 영어 한 줄: SAVED: 경로 | 가로 x 세로 px | picked shot k/n (cursor off) | fit: … / ERROR: …
  주의: UAC 가 꺼진 PC 는 VS 제목에 "(관리자)" · 콘솔 제목에 "관리자:" 가 붙음 → 이 도구로 못 지움 → 그대로 찍을지 사용자에게 먼저 묻기
        VS 를 관리자로 띄웠으면 이 스크립트도 관리자 창에서 (아니면 VS 를 못 찾음)
        입력이 필요한 프로그램(scanf)은 -Mode run 이 입력을 못 넣음 → 사용자가 입력한 뒤 vmcapture.ps1 -Window 로 찍기
        초기화 안 된 변수 같은 '오류를 보여 주는' 강의 코드는 VS 가 SDL 검사(C4700) · 런타임 검사(RTC #3)로 막음
        → 그 프로젝트만 속성에서 끄고 실행 (소스는 원문 그대로)
        맥에서는 실행해 볼 수 없어서 학교 PC 첫 실행 때 찍힌 그림을 열어 확인 (도구 창이 숨었는지 · 코드가 안 잘렸는지 · 커서가 없는지)
        fit: skipped (…) 가 나오면 확대 · 창 맞추기만 못 한 것 (그림은 찍힘) → 그 글을 그대로 알리기
#>
param(
    [ValidateSet("src", "run")] [string]$Mode = "src",
    [string]$File = "",
    [string]$Project = "",
    [string]$Out = "",
    [string]$Lines = "",
    [int]$Height = 0,
    [switch]$NoFit,
    [int]$Shots = 5,
    [int]$TimeoutSec = 30,
    [switch]$DryRun
)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$vmcap = Join-Path $here "vmcapture.ps1"
if (-not (Test-Path -LiteralPath $vmcap)) { Write-Output "ERROR: vmcapture.ps1 not found next to vscapture.ps1 ($here)"; exit 1 }
if (-not $Out) { Write-Output "ERROR: -Out is required (where to save the PNG)"; exit 1 }
if (-not [IO.Path]::IsPathRooted($Out)) { $Out = Join-Path (Get-Location).Path $Out }

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
public static class VsCap {
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
    [StructLayout(LayoutKind.Sequential)] public struct WINDOWPLACEMENT { public int length, flags, showCmd; public POINT ptMinPosition, ptMaxPosition; public RECT rcNormalPosition; }
    [StructLayout(LayoutKind.Sequential)] public struct MONITORINFO { public int cbSize; public RECT rcMonitor, rcWork; public int dwFlags; }
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int max);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int x, int y, int w, int h, bool repaint);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
    [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool GetWindowPlacement(IntPtr hWnd, ref WINDOWPLACEMENT wp);
    [DllImport("user32.dll")] public static extern bool SetWindowPlacement(IntPtr hWnd, ref WINDOWPLACEMENT wp);
    [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr hWnd, int flags);
    [DllImport("user32.dll")] public static extern bool GetMonitorInfo(IntPtr hMon, ref MONITORINFO mi);
    [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr value);
    // 창 좌표를 캡처 그림과 같은 실제 픽셀로 (vmcapture.ps1 과 같게 Per-Monitor V2)
    public static void DpiAware() {
        try { if (SetProcessDpiAwarenessContext(new IntPtr(-4))) return; } catch { }
        try { SetThreadDpiAwarenessContext(new IntPtr(-4)); } catch { }
    }
    public static string Title(IntPtr h) { var sb = new StringBuilder(512); GetWindowText(h, sb, 512); return sb.ToString(); }
    public static WINDOWPLACEMENT GetPlace(IntPtr h) { var wp = new WINDOWPLACEMENT(); wp.length = Marshal.SizeOf(typeof(WINDOWPLACEMENT)); GetWindowPlacement(h, ref wp); return wp; }
    public static void SetPlace(IntPtr h, WINDOWPLACEMENT wp) { wp.length = Marshal.SizeOf(typeof(WINDOWPLACEMENT)); SetWindowPlacement(h, ref wp); }
    // 창이 있는 모니터의 작업 영역 (작업 표시줄 뺀 곳) [왼, 위, 오른, 아래]
    public static int[] WorkArea(IntPtr h) {
        var mi = new MONITORINFO(); mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
        GetMonitorInfo(MonitorFromWindow(h, 2), ref mi);
        return new int[] { mi.rcWork.Left, mi.rcWork.Top, mi.rcWork.Right, mi.rcWork.Bottom };
    }
    // 보이는 창 목록 "핸들|제목"
    public static List<string> Windows() {
        var list = new List<string>();
        EnumWindows(delegate (IntPtr h, IntPtr l) {
            if (IsWindowVisible(h)) {
                var sb = new StringBuilder(512);
                GetWindowText(h, sb, 512);
                if (sb.Length > 0) list.Add(h.ToInt64() + "|" + sb.ToString());
            }
            return true;
        }, IntPtr.Zero);
        return list;
    }
    static byte[] Pixels(string file, out int w, out int h) {          // BGRA 순서
        using (var src = new Bitmap(file)) {
            w = src.Width; h = src.Height;
            using (var bmp = src.Clone(new Rectangle(0, 0, w, h), PixelFormat.Format32bppArgb)) {
                var d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                var buf = new byte[d.Stride * h];
                Marshal.Copy(d.Scan0, buf, 0, buf.Length);
                bmp.UnlockBits(d);
                if (d.Stride != w * 4) throw new Exception("unexpected stride");
                return buf;
            }
        }
    }
    static int Bg(byte[] p) {                                            // 배경색 = 가장 많은 색 (0xRRGGBB)
        var cnt = new Dictionary<int, int>();
        for (int k = 0; k + 3 < p.Length; k += 28) {
            int c = (p[k + 2] << 16) | (p[k + 1] << 8) | p[k];
            int v; cnt.TryGetValue(c, out v); cnt[c] = v + 1;
        }
        int bg = 0, most = -1;
        foreach (var kv in cnt) if (kv.Value > most) { most = kv.Value; bg = kv.Key; }
        return bg;
    }
    static int Dist(byte[] p, int k, int bg) {                            // 배경색과 얼마나 다른지 (채널 차이 중 가장 큰 것)
        return Math.Max(Math.Abs(p[k + 2] - ((bg >> 16) & 255)), Math.Max(Math.Abs(p[k + 1] - ((bg >> 8) & 255)), Math.Abs(p[k] - (bg & 255))));
    }
    // 여러 장 중 커서가 꺼진 장면: 장면끼리 다른 점(= 깜빡이는 커서 자리)이 배경색과 가장 비슷한 장
    // (어두운 테마 · 밝은 테마 · 콘솔 모두 — 커서는 배경과 다른 색이고 꺼지면 배경색)
    public static int PickNoCursor(string[] files) {
        int w0, h0; var first = Pixels(files[0], out w0, out h0);
        var all = new List<byte[]> { first };
        for (int i = 1; i < files.Length; i++) {
            int w, h; var p = Pixels(files[i], out w, out h);
            if (w != w0 || h != h0) return 0;
            all.Add(p);
        }
        int bg = Bg(first);
        var score = new int[files.Length];
        for (int k = 0; k < first.Length; k += 4) {
            bool differs = false;
            for (int i = 1; i < all.Count && !differs; i++)
                for (int c = 0; c < 3; c++) if (Math.Abs(all[i][k + c] - first[k + c]) > 40) { differs = true; break; }
            if (!differs) continue;
            for (int i = 0; i < all.Count; i++) if (Dist(all[i], k, bg) > 40) score[i]++;
        }
        int best = 0;
        for (int i = 1; i < score.Length; i++) if (score[i] < score[best]) best = i;
        return best;
    }
    // 실행 창: 아래에서부터 올라가며 글자가 있는 마지막 줄 (오른쪽 스크롤바 · 거의 다 칠해진 줄(스크롤바 · 테두리)은 빼고)
    public static int LastTextRow(string file) {
        int w, h; var p = Pixels(file, out w, out h);
        int bg = Bg(p), x1 = w - Math.Max(60, w / 12);
        for (int y = h - 8; y > 0; y--) {
            int n = 0;
            for (int x = 8; x < x1; x++) if (Dist(p, (y * w + x) * 4, bg) > 60) n++;
            if (n >= 2 && n < (x1 - 8) / 2) return y;
        }
        return h - 1;
    }
}
"@
[VsCap]::DpiAware()

function Get-DTE {
    foreach ($id in "VisualStudio.DTE.17.0", "VisualStudio.DTE.16.0", "VisualStudio.DTE") {
        try { return [System.Runtime.InteropServices.Marshal]::GetActiveObject($id) } catch { }
    }
    return $null
}
function Com([scriptblock]$Block) {                                     # VS 가 바쁘다고 거절하면(RPC_E_CALL_REJECTED) 잠깐 기다렸다 다시
    for ($try = 0; ; $try++) {
        try { return (& $Block) }
        catch {
            $busy = $false; $ex = $_.Exception
            while ($ex) { if ($ex.HResult -eq -2147418111 -or $ex.HResult -eq -2147417846) { $busy = $true }; $ex = $ex.InnerException }
            if ($busy -and $try -lt 20) { Start-Sleep -Milliseconds 300 } else { throw }
        }
    }
}
function Invoke-VmCapture([string[]]$CapArgs) {
    $o = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $vmcap @CapArgs
    return ($o -join " ")
}
function Save-Pick([string[]]$CapArgs, [string]$what) {                 # 여러 장 찍어 커서 꺼진 장면 → $Out
    $files = @()
    for ($k = 1; $k -le [Math]::Max(1, $Shots); $k++) {
        $f = Join-Path $tmp ("shot{0}.png" -f $k)
        $o = Invoke-VmCapture ($CapArgs + @("-Out", $f))
        if (-not (Test-Path -LiteralPath $f)) { throw "capture failed: $o" }
        $files += $f
        Start-Sleep -Milliseconds (150 + (190 * $k) % 530)                 # 커서 깜빡임(약 0.5초) 사이 여러 곳
    }
    $pick = [VsCap]::PickNoCursor([string[]]$files)
    $dir = Split-Path -Parent $Out
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    Copy-Item -LiteralPath $files[$pick] -Destination $Out -Force
    $img = [System.Drawing.Image]::FromFile($Out); $w = $img.Width; $h = $img.Height; $img.Dispose()
    return ("SAVED: {0} | {1} x {2} px | picked shot {3}/{4} (cursor off) | {5}" -f $Out, $w, $h, ($pick + 1), $files.Count, $what)
}
function Get-Cols([string]$line, [int]$tab) {                           # 화면에서 차지하는 칸 수 (탭 · 한글 = 2칸)
    $c = 0
    foreach ($ch in $line.ToCharArray()) {
        $u = [int]$ch
        if ($u -eq 9) { $c += $tab - ($c % $tab) }
        elseif (($u -ge 0x1100 -and $u -le 0x115F) -or ($u -ge 0x2E80 -and $u -le 0xA4CF) -or ($u -ge 0xAC00 -and $u -le 0xD7A3) -or
                ($u -ge 0xF900 -and $u -le 0xFAFF) -or ($u -ge 0xFE30 -and $u -le 0xFE4F) -or ($u -ge 0xFF00 -and $u -le 0xFF60) -or ($u -ge 0xFFE0 -and $u -le 0xFFE6)) { $c += 2 }
        else { $c += 1 }
    }
    return $c
}
$tmp = Join-Path $env:TEMP ("vscap_" + [guid]::NewGuid().ToString("N"))

try {
if ($Mode -eq "src") {
    if (-not $File -or -not (Test-Path -LiteralPath $File)) { Write-Output "ERROR: -File not found: $File"; exit 1 }
    $full = (Resolve-Path -LiteralPath $File).Path
    $from = 0; $to = 0
    if ($Lines) {
        if ($Lines -match '^\s*(\d+)\s*-\s*(\d+)\s*$') { $from = [int]$Matches[1]; $to = [int]$Matches[2] }
        else { Write-Output "ERROR: -Lines must look like 1-45"; exit 1 }
        if ($from -lt 1 -or $to -lt $from) { Write-Output "ERROR: wrong -Lines range: $Lines"; exit 1 }
    }
    if ($DryRun) {
        $plan = if ($NoFit) { "no zoom/resize" } else { "zoom code to fit the screen -> shrink window to the code" + $(if ($Lines) { " (lines $Lines)" } else { "" }) }
        Write-Output ("DRYRUN: close other tabs (save changes) -> open only {0} -> hide tool windows -> {1} -> {2} shots -> pick cursor-off -> restore zoom/tool windows/window -> {3}" -f $full, $plan, $Shots, $Out)
        exit 0
    }
    $dte = Get-DTE
    if (-not $dte) { Write-Output "ERROR: Visual Studio is not running (open the solution first; if VS runs as administrator, run this from an administrator shell too)"; exit 1 }
    $vs = [IntPtr]::Zero
    try { $vs = [IntPtr]::new([long](Com { $dte.MainWindow.HWnd })) } catch { }
    if ($vs -eq [IntPtr]::Zero) {
        $pr = Get-Process devenv -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
        if ($pr) { $vs = $pr.MainWindowHandle }
    }
    if ($vs -eq [IntPtr]::Zero) { Write-Output "ERROR: Visual Studio window not found"; exit 1 }
    $place = [VsCap]::GetPlace($vs)
    New-Item -ItemType Directory -Path $tmp | Out-Null
    $hidden = @(); $notes = @(); $script:zoom = 0; $fitMsg = "fit: off (-NoFit)"; $msg = ""; $hl = $null; $hlOld = $null

    function Zoom([int]$d) {                                            # 편집기 확대(+1) · 축소(-1) 한 단계 (약 10%)
        $cmd = if ($d -gt 0) { "View.ZoomIn" } else { "View.ZoomOut" }
        [void](Com { $dte.ExecuteCommand($cmd) })
        $script:zoom += $d
        Start-Sleep -Milliseconds 350
        if ($from -gt 1) { try { [void](Com { $dte.ExecuteCommand("Edit.ScrollLineTop") }) } catch { } }
    }
    function PaneHW {                                                   # VS 가 알려 주는 편집기의 보이는 줄 수 · 칸 수
        $h = 0; $w = 0
        try { $h = [int](Com { $script:pane.Height }); $w = [int](Com { $script:pane.Width }) } catch { }
        return @($h, $w)
    }
    function Fits { $hw = PaneHW; return ($hw[0] -ge $script:needLines -and $hw[1] -ge $script:needCols) }
    function Set-Size([int]$w, [int]$h) { [void][VsCap]::MoveWindow($vs, $script:x0, $script:y0, $w, $h, $true); Start-Sleep -Milliseconds 350 }
    function Get-Size { $r = New-Object VsCap+RECT; [void][VsCap]::GetWindowRect($vs, [ref]$r); return @(($r.Right - $r.Left), ($r.Bottom - $r.Top)) }

    try {
        foreach ($d in @(Com { $dte.Documents })) {                     # 다른 탭 닫기 — 바뀐 게 없으면 그냥 · 바뀌었으면 저장하고 · 이름 없는 새 파일은 그대로 둠
            try {
                $fn = [string]$d.FullName
                if ($fn -eq $full) { continue }
                if ($d.Saved) { $d.Close(2) }
                elseif ($fn -and (Test-Path -LiteralPath $fn)) { [void]$d.Save(); $d.Close(2) }
                else { $notes += "unsaved tab left open: " + $d.Name }
            } catch { }
        }
        $win = Com { $dte.ItemOperations.OpenFile($full) }
        Start-Sleep -Milliseconds 800
        [void](Com { $win.Activate() })
        $doc = Com { $win.Document }
        $sel = Com { $doc.Selection }
        if ($from -gt 1) {                                              # 나눠 찍기: 그 줄을 맨 위로
            [void](Com { $sel.GotoLine($from, $false) })
            try { [void](Com { $dte.ExecuteCommand("Edit.ScrollLineTop") }) } catch { $notes += "Edit.ScrollLineTop failed" }
        } else { [void](Com { $sel.StartOfDocument($false) }) }
        $mainCap = [string](Com { $dte.MainWindow.Caption })
        foreach ($w in @(Com { $dte.Windows })) {                        # 솔루션 탐색기 · 출력 · 오류 목록 … 숨기기 (끝나면 되돌림)
            try { if ($w.Kind -eq "Tool" -and $w.Visible -and [string]$w.Caption -ne $mainCap) { $w.Visible = $false; $hidden += $w } } catch { }
        }
        try {                                                           # 현재 줄 강조 테두리 잠깐 끄기 (이 설정이 없는 VS 면 그냥 둠)
            $hl = Com { $dte.Properties("TextEditor", "General").Item("HighlightCurrentLine") }
            $hlOld = $hl.Value; $hl.Value = $false
        } catch { $hl = $null }
        [void](Com { $win.Activate() })
        Start-Sleep -Milliseconds 500

        if (-not $NoFit) {
            if ([VsCap]::IsZoomed($vs) -or [VsCap]::IsIconic($vs)) { [void][VsCap]::ShowWindow($vs, 9); Start-Sleep -Milliseconds 500 }
            $wa = [VsCap]::WorkArea($vs)
            $script:x0 = $wa[0] + 8; $script:y0 = $wa[1] + 8
            $W0 = $wa[2] - $wa[0] - 16; $H0 = $wa[3] - $wa[1] - 16
            Set-Size $W0 $H0                                            # 먼저 화면(작업 영역) 크기로 — 그 안에서 가장 크게
            try {
                $tab = 4
                try { $tab = [int](Com { $dte.Properties("TextEditor", "C/C++").Item("TabSize").Value }) } catch { }
                $td = Com { $doc.Object("TextDocument") }
                $text = [string](Com { $td.StartPoint.CreateEditPoint().GetText($td.EndPoint) })
                $all = @($text -split "\r?\n")
                $last = $all.Count
                while ($last -gt 1 -and $all[$last - 1].Trim() -eq "") { $last-- }
                $a = 1; $b = $last
                if ($from -ge 1) { $a = [Math]::Min($from, $last); $b = [Math]::Min($to, $last) }
                $needC = 0
                for ($i = $a - 1; $i -lt $b; $i++) { $cols = Get-Cols $all[$i] $tab; if ($cols -gt $needC) { $needC = $cols } }
                if ($last -gt 50 -and -not $Lines) { $notes += "$last lines > 50: split with -Lines 1-45 and -Lines 46-$last" }
                $script:needLines = ($b - $a + 1) + 1; $script:needCols = $needC + 2   # 빈 줄 하나 · 빈 칸 둘 여유
                $script:pane = Com { $win.Object.ActivePane }
                $hw = PaneHW
                if ($hw[0] -le 0 -or $hw[1] -le 0) { throw "text pane size not available" }
                $n = 0
                while (-not (Fits) -and $n -lt 10) {                    # 1) 안 들어가면 줄이기
                    $bf = PaneHW; Zoom -1; $n++; $af = PaneHW
                    if (($bf[0] -lt $script:needLines -and $af[0] -le $bf[0]) -or ($bf[1] -lt $script:needCols -and $af[1] -le $bf[1])) {
                        throw ("zoom out did not grow the pane (lines {0}->{1}, cols {2}->{3})" -f $bf[0], $af[0], $bf[1], $af[1])
                    }
                }
                if (-not (Fits)) { throw "code does not fit even when zoomed out" }
                $n = 0
                while ($n -lt 12) {                                     # 2) 한 단계 더 키워도 들어가면 키우기 (짧으면 크게)
                    $bf = PaneHW
                    if (($bf[0] / 1.12) -lt $script:needLines -or ($bf[1] / 1.12) -lt $script:needCols) { break }
                    Zoom 1; $n++; $af = PaneHW
                    if ($af[0] -ge $bf[0] -and $af[1] -ge $bf[1]) { $script:zoom -= 1; break }   # 더 안 커짐 (최대 확대)
                    if (-not (Fits)) { Zoom -1; break }
                    if ((((Get-Size)[1] - 230) / [Math]::Max(1, $af[0])) -gt 64) { Zoom -1; break }   # 줄 높이 64px 넘음 = 글자 약 40px
                }
                $lo = 480; $hi = (Get-Size)[0]                          # 3) 창 폭을 코드에 맞게 (이분 탐색)
                while ($hi - $lo -gt 8) {
                    $mid = [int](($lo + $hi) / 2); Set-Size $mid $H0
                    if ((PaneHW)[1] -ge $script:needCols) { $hi = $mid } else { $lo = $mid }
                }
                Set-Size $hi $H0
                $k = 0
                while (-not (Fits) -and $k -lt 3) { Zoom -1; $k++ }     # 좁아져서 도구 모음이 두 줄이 되면 한 단계 줄임
                $Wf = (Get-Size)[0]
                $lo = 320; $hi = $H0                                    # 4) 창 높이를 코드에 맞게
                while ($hi - $lo -gt 6) {
                    $mid = [int](($lo + $hi) / 2); Set-Size $Wf $mid
                    if ((PaneHW)[0] -ge $script:needLines) { $hi = $mid } else { $lo = $mid }
                }
                Set-Size $Wf $hi
                if (-not (Fits)) { Zoom -1; $notes += "zoomed out once more to fit" }
                if ($from -gt 1) { try { [void](Com { $dte.ExecuteCommand("Edit.ScrollLineTop") }) } catch { } }
                $hw = PaneHW; $sz = Get-Size
                $fitMsg = "fit: lines {0}-{1} ({2} lines, {3} cols) | pane {4} lines x {5} cols | zoom {6:+0;-0;0} | window {7}x{8}" -f $a, $b, ($b - $a + 1), $needC, $hw[0], $hw[1], $script:zoom, $sz[0], $sz[1]
            } catch {
                $fitMsg = "fit: skipped (" + $_.Exception.Message + ")"
                Set-Size $W0 $H0
            }
        } elseif ([VsCap]::IsIconic($vs)) { [void][VsCap]::ShowWindow($vs, 9); Start-Sleep -Milliseconds 500 }

        $capArgs = @("-Process", "devenv")
        $t = [VsCap]::Title($vs)
        if ($t) { $capArgs += @("-Window", [Management.Automation.WildcardPattern]::Escape($t)) }
        $msg = Save-Pick $capArgs ("source: " + [IO.Path]::GetFileName($full) + " | " + $fitMsg + $(if ($notes.Count) { " | NOTE: " + ($notes -join "; ") } else { "" }))
    }
    finally {                                                           # 확대 · 도구 창 · 창 위치 되돌리기 (실패해도)
        try {
            $back = if ($script:zoom -gt 0) { "View.ZoomOut" } else { "View.ZoomIn" }
            for ($i = 0; $i -lt [Math]::Abs($script:zoom); $i++) { [void](Com { $dte.ExecuteCommand($back) }) }
        } catch { }
        foreach ($w in $hidden) { try { $w.Visible = $true } catch { } }
        if ($hl) { try { $hl.Value = $hlOld } catch { } }
        try { [VsCap]::SetPlace($vs, $place) } catch { }
        Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Output $msg
    exit 0
}

# ---- run ----
if (-not $Project) { Write-Output "ERROR: -Project is required for -Mode run"; exit 1 }
if ($DryRun) { Write-Output "DRYRUN: set startup project '$Project' -> Debug.StartWithoutDebugging (Ctrl+F5) -> wait debug console -> fit height to the output -> $Shots shots -> pick cursor-off -> $Out"; exit 0 }
$dte = Get-DTE
if (-not $dte) { Write-Output "ERROR: Visual Studio is not running (open the solution first; if VS runs as administrator, run this from an administrator shell too)"; exit 1 }
$proj = $null
foreach ($p in @(Com { $dte.Solution.Projects })) { if ($p.Name -eq $Project) { $proj = $p } }
if (-not $proj) { Write-Output "ERROR: project '$Project' not found in the open solution"; exit 1 }
Com { $dte.Solution.SolutionBuild.StartupProjects = $proj.UniqueName }
$before = @{}
foreach ($l in [VsCap]::Windows()) { $before[$l.Split([char]'|')[0]] = 1 }
[void](Com { $dte.ExecuteCommand("Debug.StartWithoutDebugging") })
$deadline = (Get-Date).AddSeconds($TimeoutSec); $hWnd = [IntPtr]::Zero; $winTitle = ""
while ((Get-Date) -lt $deadline -and $hWnd -eq [IntPtr]::Zero) {
    Start-Sleep -Milliseconds 400
    foreach ($l in [VsCap]::Windows()) {
        $parts = $l.Split([char]'|', 2)
        if (-not $before.ContainsKey($parts[0]) -and ($parts[1] -match "디버그 콘솔|Debug Console|\.exe")) {
            $hWnd = [IntPtr]::new([long]$parts[0]); $winTitle = $parts[1]; break
        }
    }
}
if ($hWnd -eq [IntPtr]::Zero) { Write-Output "ERROR: debug console did not appear in $TimeoutSec s (build error? look at the VS Error List)"; exit 1 }
Start-Sleep -Milliseconds 1500                                                  # 출력이 다 나올 때까지
New-Item -ItemType Directory -Path $tmp | Out-Null
$wildTitle = [Management.Automation.WildcardPattern]::Escape($winTitle)
$r = New-Object VsCap+RECT
[void][VsCap]::GetWindowRect($hWnd, [ref]$r)
if ($Height -gt 0 -or -not $NoFit) {
    $newH = $Height
    if ($newH -le 0) {                                                          # 한 장 찍어서 마지막 글자 줄 + 여백에 맞춤
        $probe = Join-Path $tmp "probe.png"
        [void](Invoke-VmCapture @("-Window", $wildTitle, "-Out", $probe))
        if (Test-Path -LiteralPath $probe) {
            $img = [System.Drawing.Image]::FromFile($probe); $imgH = $img.Height; $img.Dispose()
            $last = [VsCap]::LastTextRow($probe)
            $newH = ($r.Bottom - $r.Top) - $imgH + $last + 28                   # 보이지 않는 테두리 + 마지막 글자 줄 + 여백
        }
    }
    if ($newH -gt 120) { [void][VsCap]::MoveWindow($hWnd, $r.Left, $r.Top, $r.Right - $r.Left, $newH, $true); Start-Sleep -Milliseconds 600 }
}
$msg = Save-Pick @("-Window", $wildTitle) ("window: " + $winTitle)
Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
Write-Output $msg
}
catch {
    Write-Output ("ERROR: " + $_.Exception.Message)
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}
