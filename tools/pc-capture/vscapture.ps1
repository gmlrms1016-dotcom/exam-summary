<#
  vscapture.ps1 — Windows Visual Studio 의 소스 · 실행 결과를 "원래 픽셀 크기 그대로" PNG 로 캡처
  (2026-11-09 학교 PC 피드백 5번: C 수업 실습 캡처를 손으로 하던 방법을 도구로)

  소스 (-Mode src) : DTE(VS 자동화)로 파일 열기 → 솔루션 탐색기로 포커스 옮겨 편집기 커서 없애기 → vmcapture.ps1 -Process devenv
  실행 (-Mode run) : DTE 로 시작 프로젝트 바꾸기 → 디버그하지 않고 시작(Ctrl+F5) → 새로 뜬 디버그 콘솔 창
                     → 창 높이를 출력에 맞게 줄이기(-Fit · 기본) → 여러 장(-Shots) 찍어 커서가 꺼진 장면 고르기
  캡처 자체는 같은 폴더의 vmcapture.ps1 (PrintWindow · DPI 인식 · 원본 PNG · 제목 줄 살림)

  사용 (Visual Studio 에 솔루션이 열려 있어야 함):
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vscapture.ps1" -Mode src -File "C:\WorkC\w11\ex01\ex01.c" -Out "C:\캡처\src_ex01.png"
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vscapture.ps1" -Mode run -Project "ex01" -Out "C:\캡처\run_ex01.png"
    -Height 300   실행 창 높이를 직접 (px) · -NoFit 높이를 안 바꿈 · -Shots 4 몇 장 찍어 고를지 · -DryRun 무엇을 할지만 출력
  출력은 영어 한 줄 (SAVED: … / ERROR: …)
  주의: UAC 가 꺼진 PC 는 VS 제목에 "(관리자)" · 콘솔 제목에 "관리자:" 가 붙음 → 이 도구로 못 지움 → 그대로 찍을지 사용자에게 먼저 묻기
        초기화 안 된 변수 같은 '오류를 보여 주는' 강의 코드는 VS 가 SDL 검사(C4700) · 런타임 검사(RTC #3)로 막음
        → 그 프로젝트만 속성에서 끄고 실행 (소스는 원문 그대로)
#>
param(
    [ValidateSet("src", "run")] [string]$Mode = "src",
    [string]$File = "",
    [string]$Project = "",
    [string]$Out = "",
    [int]$Height = 0,
    [switch]$NoFit,
    [int]$Shots = 4,
    [int]$TimeoutSec = 30,
    [switch]$DryRun
)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$vmcap = Join-Path $here "vmcapture.ps1"
if (-not (Test-Path $vmcap)) { Write-Output "ERROR: vmcapture.ps1 not found next to vscapture.ps1 ($here)"; exit 1 }
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
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int max);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int x, int y, int w, int h, bool repaint);
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
    static byte[] Pixels(string file, out int w, out int h) {
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
    // 여러 장 중 커서가 꺼진 장면: 장면끼리 다른 픽셀(= 깜빡이는 커서 자리)에서 밝은 점이 가장 적은 장
    public static int PickNoCursor(string[] files) {
        int w0, h0; var first = Pixels(files[0], out w0, out h0);
        var all = new List<byte[]> { first };
        for (int i = 1; i < files.Length; i++) {
            int w, h; var p = Pixels(files[i], out w, out h);
            if (w != w0 || h != h0) return 0;
            all.Add(p);
        }
        var counts = new int[files.Length];
        for (int k = 0; k < first.Length; k += 4) {
            bool differs = false;
            for (int i = 1; i < all.Count && !differs; i++)
                for (int c = 0; c < 3; c++) if (Math.Abs(all[i][k + c] - first[k + c]) > 40) { differs = true; break; }
            if (!differs) continue;
            for (int i = 0; i < all.Count; i++) {
                int lum = (all[i][k] + all[i][k + 1] + all[i][k + 2]) / 3;
                if (lum > 128) counts[i]++;
            }
        }
        int best = 0;
        for (int i = 1; i < counts.Length; i++) if (counts[i] < counts[best]) best = i;
        return best;
    }
    // 아래에서부터 올라가며 글자(밝은 점)가 있는 마지막 줄 — 출력에 맞춰 창 높이를 줄일 때
    public static int LastTextRow(string file) {
        int w, h; var p = Pixels(file, out w, out h);
        for (int y = h - 8; y > 0; y--) {
            int bright = 0;
            for (int x = 8; x < w - 8; x++) {
                int k = (y * w + x) * 4;
                if ((p[k] + p[k + 1] + p[k + 2]) / 3 > 140) bright++;
            }
            if (bright >= 2) return y;
        }
        return h - 1;
    }
}
"@

function Get-DTE {
    foreach ($id in "VisualStudio.DTE.17.0", "VisualStudio.DTE.16.0", "VisualStudio.DTE") {
        try { return [System.Runtime.InteropServices.Marshal]::GetActiveObject($id) } catch { }
    }
    return $null
}
function Invoke-VmCapture([string[]]$CapArgs) {
    $o = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $vmcap @CapArgs
    return ($o -join " ")
}

if ($Mode -eq "src") {
    if (-not $File -or -not (Test-Path $File)) { Write-Output "ERROR: -File not found: $File"; exit 1 }
    $full = (Resolve-Path $File).Path
    if ($DryRun) { Write-Output "DRYRUN: open $full in Visual Studio (DTE) -> focus Solution Explorer (no caret) -> vmcapture -Process devenv -Out $Out"; exit 0 }
    $dte = Get-DTE
    if (-not $dte) { Write-Output "ERROR: Visual Studio is not running (open the solution first)"; exit 1 }
    [void]$dte.ItemOperations.OpenFile($full)
    Start-Sleep -Milliseconds 900
    $dte.Windows.Item("{3AE79031-E1BC-11D0-8F78-00A0C9110057}").Activate()     # 솔루션 탐색기 → 편집기 커서가 사라짐
    Start-Sleep -Milliseconds 700
    Write-Output (Invoke-VmCapture @("-Process", "devenv", "-Out", $Out))
    exit 0
}

# ---- run ----
if (-not $Project) { Write-Output "ERROR: -Project is required for -Mode run"; exit 1 }
if ($DryRun) { Write-Output "DRYRUN: set startup project '$Project' -> Debug.StartWithoutDebugging (Ctrl+F5) -> wait debug console -> fit height -> $Shots shots -> pick cursor-off -> $Out"; exit 0 }
$dte = Get-DTE
if (-not $dte) { Write-Output "ERROR: Visual Studio is not running (open the solution first)"; exit 1 }
$proj = $null
foreach ($p in $dte.Solution.Projects) { if ($p.Name -eq $Project) { $proj = $p } }
if (-not $proj) { Write-Output "ERROR: project '$Project' not found in the open solution"; exit 1 }
$dte.Solution.SolutionBuild.StartupProjects = $proj.UniqueName
$before = @{}
foreach ($l in [VsCap]::Windows()) { $before[$l.Split([char]'|')[0]] = 1 }
$dte.ExecuteCommand("Debug.StartWithoutDebugging")
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
$tmp = Join-Path $env:TEMP ("vscap_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp | Out-Null
$r = New-Object VsCap+RECT
[void][VsCap]::GetWindowRect($hWnd, [ref]$r)
if ($Height -gt 0 -or -not $NoFit) {
    $newH = $Height
    if ($newH -le 0) {                                                          # 한 장 찍어서 마지막 글자 줄 + 여백에 맞춤
        $probe = Join-Path $tmp "probe.png"
        [void](Invoke-VmCapture @("-Window", $winTitle, "-Out", $probe))
        if (Test-Path $probe) {
            $img = [System.Drawing.Image]::FromFile($probe); $imgH = $img.Height; $img.Dispose()
            $last = [VsCap]::LastTextRow($probe)
            $newH = ($r.Bottom - $r.Top) - $imgH + $last + 28                   # 보이지 않는 테두리 + 마지막 글자 줄 + 여백
        }
    }
    if ($newH -gt 120) { [void][VsCap]::MoveWindow($hWnd, $r.Left, $r.Top, $r.Right - $r.Left, $newH, $true); Start-Sleep -Milliseconds 600 }
}
$files = @()
for ($k = 1; $k -le [Math]::Max(1, $Shots); $k++) {
    $f = Join-Path $tmp ("shot{0}.png" -f $k)
    $o = Invoke-VmCapture @("-Window", $winTitle, "-Out", $f)
    if (-not (Test-Path $f)) { Write-Output "ERROR: capture failed: $o"; exit 1 }
    $files += $f
    Start-Sleep -Milliseconds 350                                               # 커서 깜빡임 사이
}
$pick = [VsCap]::PickNoCursor([string[]]$files)
$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
Copy-Item $files[$pick] $Out -Force
$img = [System.Drawing.Image]::FromFile($Out); $w = $img.Width; $h = $img.Height; $img.Dispose()
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Write-Output ("SAVED: {0} | {1} x {2} px | picked shot {3}/{4} (cursor off) | window: {5}" -f $Out, $w, $h, ($pick + 1), $files.Count, $winTitle)
