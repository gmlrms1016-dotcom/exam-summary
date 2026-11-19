<#
  vmcapture.ps1 — 창을 "원래 픽셀 크기 그대로" PNG 로 캡처 (다른 컴퓨터(학교 PC · PC방 등) Claude Code 용 · 2026-10-29 · 11-05 고침)
  왜: Claude Code 가 찍은 캡처가 흐려서 과제를 다시 직접 캡처함 → 원인 = 화면 배율(125 · 150%)에서
      DPI 인식 없이 찍으면 작게 찍힌 그림이 늘어나 흐려짐 · JPG · 크기 줄이기
  하는 일: ① DPI 인식 켜기 (SetProcessDpiAwarenessContext(-4) = Per-Monitor V2 · 안 되면 이 스레드만)
           ② 그 창만 — PrintWindow(PW_RENDERFULLCONTENT) 로 창이 스스로 그리게 함 → 다른 창(Claude 앱 등)에 가려져 있어도 깨끗
              (2026-11-05 학교 PC: 화면 복사 방식은 Claude 창에 가려진 채 찍혔고 오류도 안 났음)
              단 VMware 창은 앞으로 가져와 화면 복사(Screen)가 기본 (2026-11-12 학교 PC: VMware 가 뒤에 있으면 PrintWindow 가 몇 분 전 콘솔을 찍음
              → 오류 화면이 과제 캡처로 저장될 뻔함 · 텔넷 · 원격 데스크톱 창은 PrintWindow 가 잘 됨) · 찍은 뒤 꼭 그림을 열어 지금 화면인지 확인
              MySQL Workbench(-Process MySQLWorkbench · -Window "MySQL Workbench")도 Screen 이 기본 (2026-11-18 학교 PC: 화면 배율 125% 에서
              PrintWindow 로 찍으면 그림 오른쪽 · 아래가 검은 여백 — 1408×1380 중 내용 약 1124×1103 · -Method Screen 으로 찍으니 깨끗)
           ③ DWM 의 보이는 테두리로 자르기 (그림자 · 투명 테두리 X) — 제목 줄은 그대로 (VMware 과제 = 원래 제목 그대로 · 사용자 2026-11-05)
           ③-1 -TextOnly: 글자 화면은 글자 부분만 딱 맞게 — 글자 + 배경색 여백 12px (제목 줄 · 메뉴 · 탭 · 라이브러리 · 스크롤바 · 빈 여백 X)
               (2026-11-13 사용자: "검은 화면에 작은 글씨라 글자가 너무 작음" — 처음엔 검은 CUI(Server(B))만)
               2026-11-20 넓힘 — GNOME 터미널(Server · Client · 어두운 · 밝은 테마) · 윈도우 cmd · PowerShell · 텔넷 창 · VM 안의 윈도우 cmd 도
               (사용자: "client,server 같은 gui리눅스 터미널도 server(B)cui환경처럼 명령어를 딱 맞게" · "win 의 cmd,powershell도")
               방법: 창에서 가장 많은 색들 = 배경색 후보 → 그 색으로 이어진 가장 큰 네모(갇힌 글자 포함) = 글자 화면
                     → 안에 다른 창 · 바탕화면 그림 같은 큰 덩어리가 있으면 버림 → 글자 테두리 + 여백 (둥근 창 모서리 · 테두리 선 · 흐린 그림자는 배경색으로)
                     11/20 맥에서 예전 과제 캡처 17장(CUI · GNOME 어둡게/밝게 · 떠 있는 터미널 · RDP 창 · 윈도우 터미널 PowerShell · 텔넷)으로 확인
           ④ 원래 픽셀 크기 그대로 (줄이기 X)  ⑤ PNG (JPG X)
  사용:
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1" -Out "C:\경로\과제1.png"
    -Title "Server(B)"   제목에 VMware 와 이 글자가 있는 창 (지금 열린 VM 탭 이름이 제목에 나옴)
    -Process code        VMware 말고 다른 프로그램의 창 (프로세스 이름: code · cmd · WindowsTerminal · notepad …)
    -Window yunhuigeun   VMware 말고 제목에 이 글자가 있는 아무 창
    -Method Auto         기본 — VMware 창 · MySQL Workbench = Screen (앞으로 가져와 화면에서 복사 · 맨 앞이 안 되면 ERROR) · 그 밖의 -Process / -Window 창 = PrintWindow (가려져도 깨끗)
    -Method PrintWindow  VMware 도 PrintWindow 로 (뒤에 있으면 예전 화면이 찍힐 수 있음) · -Method Screen = 그 밖의 창도 화면 복사
    -Client              창 테두리 · 제목 줄을 빼고 안쪽만 (규칙상 보통 안 씀 — 제목 줄은 살림)
    -TextOnly            글자 화면(CUI · GNOME 터미널 · cmd · PowerShell · 텔넷)은 글자 부분만 잘라 저장 + 워드에 넣을 폭(word width …cm) 알려 줌
                         · 터미널이 아닌 화면(설정 창 · 파일 창 · 웹 · 원격 데스크톱 바탕화면 등)은 빼고 찍기 (글자 화면을 못 찾으면 ERROR)
                         · GNOME: 터미널을 VM 안 맨 앞에 · 다른 창에 가리지 않게 (가장 넓은 글자 화면을 고름) · cmd · PowerShell 은 -Process / -Window 와 같이
    -PageCm 17           워드 본문 폭(cm) = word width 의 최대값 (기본 17)
    -Out 을 안 주면 바탕화면에 capture_날짜_시각.png
  출력은 영어 한 줄 (Claude Code 가 읽을 때 한글이 깨지지 않게): SAVED: 경로 | 가로 x 세로 px | DPI: … | method: … | window: … (-TextOnly 면 | text only: … | bg #배경색 | line …px | word width …cm)
  예: PowerShell 창 = -Window "Windows PowerShell" -TextOnly (이 도구도 powershell 이라 -Process powershell 은 X) · cmd 창 = -Process cmd -TextOnly
      · 윈도우 11 터미널(탭 있는 창) = -Process WindowsTerminal -TextOnly · 텔넷 = -Window "Telnet" -TextOnly · GNOME 터미널 = -Title "Client" -TextOnly
  word width = 글자 줄 간격(보통 16px)이 워드에서 0.42cm(본문 글자쯤)가 되는 폭 · 본문 폭보다 넓은 출력만 본문 폭 → 그림마다 글자 크기가 비슷하게
#>
param(
    [string]$Out = "",
    [string]$Title = "",
    [string]$Process = "",
    [string]$Window = "",
    [ValidateSet("Auto", "PrintWindow", "Screen")] [string]$Method = "Auto",
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
    // -TextOnly: 그림 b 에서 글자 화면만 잘라 새 그림 (못 찾으면 null) · Last = 결과 앞 16칸 { 폭, 높이, 원래 창의 x, y, 줄 간격, 배경 R, G, B, 글자 화면 xa, ya, xb, yb … }
    public static int[] Last;
    public static Bitmap TextOnly(Bitmap b, int margin) {
        int W = b.Width, H = b.Height;
        BitmapData bd = b.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
        int st = bd.Stride; byte[] px = new byte[st * H];
        Marshal.Copy(bd.Scan0, px, 0, px.Length); b.UnlockBits(bd);
        int[] r = TextBoxPx(px, st, W, H, margin);
        Last = null;
        if (r == null) return null;
        Last = new int[16];
        Array.Copy(r, Last, 16);
        int ow = r[0], oh = r[1];
        Bitmap o = new Bitmap(ow, oh, PixelFormat.Format24bppRgb);
        BitmapData od = o.LockBits(new Rectangle(0, 0, ow, oh), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);
        int ost = od.Stride; byte[] op = new byte[ost * oh];
        for (int y = 0; y < oh; y++) for (int x = 0; x < ow; x++) {
            int v = r[16 + y * ow + x], i = y * ost + x * 3;
            op[i] = (byte)(v & 255); op[i + 1] = (byte)((v >> 8) & 255); op[i + 2] = (byte)((v >> 16) & 255);
        }
        Marshal.Copy(op, 0, od.Scan0, op.Length); o.UnlockBits(od);
        return o;
    }
    // ===== 2026-11-20 글자 화면만 딱 맞게 — CUI(Server(B)) · GNOME 터미널(Server · Client) · 윈도우 cmd · PowerShell · 텔넷 창 공통 =====
    // 사용자: "client,server 같은 gui리눅스 터미널도 server(B)cui환경처럼 명령어를 딱 맞게 캡처해줘" · "win 의 cmd,powershell도"
    // ① 창에서 가장 많은 색 6개(창의 2% 이상) = 배경색 후보
    // ② 후보마다: 그 색(차이 16 이하)으로 이어진 가장 큰 덩어리 → 그 안에 갇힌 덩어리(글자 · 꽉 찬 큰 덩어리는 빼고)까지 친 덮임이 50% 넘는
    //    가로줄 · 세로줄이 가장 길게 이어진 곳(3줄 이하 끊김은 이음) = 글자 화면 (메뉴 · 제목 줄 · 탭 · GNOME 위 막대 · 스크롤바는 빠짐)
    // ③ 그 안의 진한 덩어리 = 글자 · 단 가장자리의 둥근 창 모서리 · 테두리 선 · 막대 · 흐린 그림자는 빼고 배경색으로 칠함 (스크롤바처럼 꽉 찬 큰 덩어리도 글자 아님)
    //    그 안에 글자보다 큰 덩어리(다른 창 · 바탕화면 그림)가 6% 넘게 있으면 글자 화면이 아님
    // ④ 남은 후보 중 글자 화면이 가장 넓은 것 → 글자 테두리 + 여백(margin · 배경색) → 결과 { 폭, 높이, 원래 창의 x, y, 줄 간격, 배경 R, G, B, 글자 화면 xa, ya, xb, yb, 0, 0, 0, 0, 픽셀(RGB) … }
    //    · 글자 화면이 없으면 null
    static int[] gVis;
    static int Mx(int a, int b) { return a > b ? a : b; }
    static int Mn(int a, int b) { return a < b ? a : b; }
    static int Ab(int a) { return a < 0 ? -a : a; }
    static int Df(int p, int c) {                // 두 색의 차이 = 채널(R · G · B)마다 차이 중 가장 큰 값
        return Mx(Ab(((p >> 16) & 255) - ((c >> 16) & 255)), Mx(Ab(((p >> 8) & 255) - ((c >> 8) & 255)), Ab((p & 255) - (c & 255))));
    }
    static int[] LongestB(int[] f, int n, int gap) {   // f[0..n) 에서 1 이 가장 길게 이어진 구간 { 시작, 끝 } · gap 줄 이하 끊김은 이음 (없으면 { 0, -1 })
        int[] g = new int[n];
        for (int i = 0; i < n; i++) g[i] = f[i];
        int z = -1;
        for (int i = 0; i < n; i++) {
            if (g[i] == 0 && z < 0) z = i;
            if (g[i] == 1 && z >= 0) { if (z > 0 && i - z <= gap) { for (int j = z; j < i; j++) g[j] = 1; } z = -1; }
        }
        int bs = 0, be = -1, st = -1;
        for (int i = 0; i <= n; i++) {
            int v = (i < n) ? g[i] : 0;
            if (v == 1 && st < 0) st = i;
            if (v == 0 && st >= 0) { if (i - 1 - st > be - bs) { bs = st; be = i - 1; } st = -1; }
        }
        return new int[] { bs, be };
    }
    static int ModeColor(int[] rgb, int W, int xa, int ya, int xb, int yb) {   // 그 네모 안에서 가장 많은 색 (5비트 칸 → 칸 안의 정확한 색)
        int[] hq = new int[32768];
        for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) { int v = rgb[y * W + x]; hq[(((v >> 19) & 31) << 10) | (((v >> 11) & 31) << 5) | ((v >> 3) & 31)]++; }
        int bq = 0;
        for (int q = 1; q < 32768; q++) if (hq[q] > hq[bq]) bq = q;
        int[] hs = new int[512];
        for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) {
            int v = rgb[y * W + x];
            if (((((v >> 19) & 31) << 10) | (((v >> 11) & 31) << 5) | ((v >> 3) & 31)) == bq) hs[(((v >> 16) & 7) << 6) | (((v >> 8) & 7) << 3) | (v & 7)]++;
        }
        int bs = 0;
        for (int q = 1; q < 512; q++) if (hs[q] > hs[bs]) bs = q;
        return ((((bq >> 10) << 3) | (bs >> 6)) << 16) | (((((bq >> 5) & 31) << 3) | ((bs >> 3) & 7)) << 8) | (((bq & 31) << 3) | (bs & 7));
    }
    // 배경색 후보 col 하나로 글자 화면 찾기 → { xa, ya, xb, yb, 덩어리 픽셀 수, 글자 x0, y0, x1, y1, 줄 간격, 가장 큰 다른 덩어리 } · 없으면 null
    static int[] Region(int[] rgb, int W, int H, int col) {
        int N = W * H;
        int[] isBg = new int[N];
        int[] lev = new int[N];                      // 0 = 배경색 · 1 = 흐린 픽셀(차이 17 ~ 48 · 그림자 · 테두리 · 글자 가장자리) · 2 = 진한 픽셀(글자)
        for (int i = 0; i < N; i++) { int d = Df(rgb[i], col); isBg[i] = (d <= 16) ? 1 : 0; lev[i] = (d <= 16) ? 0 : ((d > 48) ? 2 : 1); }
        int[] lab = new int[N];
        int[] que = new int[N];
        int bestId = 0, bestSize = 0, nextId = 0, bx0 = 0, by0 = 0, bx1 = -1, by1 = -1;
        for (int s = 0; s < N; s++) {                // 배경색 덩어리마다 번호 (위 · 아래 · 왼쪽 · 오른쪽으로 이어진 것)
            if (lab[s] != 0 || isBg[s] == 0) continue;
            nextId++;
            int head = 0, tail = 0, mnx = W, mny = H, mxx = -1, mxy = -1;
            que[tail++] = s; lab[s] = nextId;
            while (head < tail) {
                int p = que[head++];
                int qx = p % W, qy = p / W;
                if (qx < mnx) mnx = qx;
                if (qx > mxx) mxx = qx;
                if (qy < mny) mny = qy;
                if (qy > mxy) mxy = qy;
                if (qx > 0 && lab[p - 1] == 0 && isBg[p - 1] == 1) { lab[p - 1] = nextId; que[tail++] = p - 1; }
                if (qx < W - 1 && lab[p + 1] == 0 && isBg[p + 1] == 1) { lab[p + 1] = nextId; que[tail++] = p + 1; }
                if (qy > 0 && lab[p - W] == 0 && isBg[p - W] == 1) { lab[p - W] = nextId; que[tail++] = p - W; }
                if (qy < H - 1 && lab[p + W] == 0 && isBg[p + W] == 1) { lab[p + W] = nextId; que[tail++] = p + W; }
            }
            if (tail > bestSize) { bestSize = tail; bestId = nextId; bx0 = mnx; by0 = mny; bx1 = mxx; by1 = mxy; }
        }
        if (bestSize == 0) return null;
        int RW = bx1 - bx0 + 1, RH = by1 - by0 + 1;
        if (RW < 80 || RH < 40) return null;
        // 덩어리 테두리 안에서 배경색이 아닌 덩어리 중 테두리에 안 닿는 것(갇힌 글자) = -3 · 닿는 것 = -1
        for (int y = by0; y <= by1; y++) for (int x = bx0; x <= bx1; x++) {
            int s1 = y * W + x;
            if (lab[s1] != 0 || isBg[s1] == 1) continue;
            int h1 = 0, t1 = 0, touch = 0, cx0 = x, cy0 = y, cx1 = x, cy1 = y;
            que[t1++] = s1; lab[s1] = -1;
            while (h1 < t1) {
                int p1 = que[h1++];
                int vx = p1 % W, vy = p1 / W;
                if (vx < cx0) cx0 = vx;
                if (vx > cx1) cx1 = vx;
                if (vy < cy0) cy0 = vy;
                if (vy > cy1) cy1 = vy;
                if (vx <= bx0 + 2 || vx >= bx1 - 2 || vy <= by0 + 2 || vy >= by1 - 2) touch = 1;
                if (vx > bx0 && lab[p1 - 1] == 0 && isBg[p1 - 1] == 0) { lab[p1 - 1] = -1; que[t1++] = p1 - 1; }
                if (vx < bx1 && lab[p1 + 1] == 0 && isBg[p1 + 1] == 0) { lab[p1 + 1] = -1; que[t1++] = p1 + 1; }
                if (vy > by0 && lab[p1 - W] == 0 && isBg[p1 - W] == 0) { lab[p1 - W] = -1; que[t1++] = p1 - W; }
                if (vy < by1 && lab[p1 + W] == 0 && isBg[p1 + W] == 0) { lab[p1 + W] = -1; que[t1++] = p1 + W; }
            }
            int cw1 = cx1 - cx0 + 1, ch1 = cy1 - cy0 + 1;
            int blk1 = (t1 * 2 >= cw1 * ch1 && ((cw1 >= 64 && ch1 >= 12) || (ch1 >= 64 && cw1 >= 3))) ? 1 : 0;   // 꽉 찬 큰 덩어리(탭 줄 · 막대) = 글자 아님
            if (touch == 0 && blk1 == 0) { for (int e1 = 0; e1 < t1; e1++) lab[que[e1]] = -3; }
        }
        int[] rowOk = new int[RH];
        for (int y = by0; y <= by1; y++) { int cnt = 0; for (int x = bx0; x <= bx1; x++) { int lv = lab[y * W + x]; if (lv == bestId || lv == -3) cnt++; } rowOk[y - by0] = (cnt * 2 >= RW) ? 1 : 0; }
        int[] rr = LongestB(rowOk, RH, 3);
        int ya = by0 + rr[0], yb = by0 + rr[1];
        if (yb - ya < 40) return null;
        int hh = yb - ya + 1;
        int[] colOk = new int[RW];
        for (int x = bx0; x <= bx1; x++) { int cnt = 0; for (int y = ya; y <= yb; y++) { int lv = lab[y * W + x]; if (lv == bestId || lv == -3) cnt++; } colOk[x - bx0] = (cnt * 2 >= hh) ? 1 : 0; }
        int[] rc = LongestB(colOk, RW, 3);
        int xa = bx0 + rc[0], xb = bx0 + rc[1];
        if (xb - xa < 80) return null;
        // 글자 화면 안의 배경색이 아닌 덩어리마다: 글자(1) 또는 창 모서리 · 테두리 선 · 막대(2 = 배경색으로 칠함)
        int[] vis = new int[N];
        int[] lit = new int[H];
        int big = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (int y = ya; y <= yb; y++) for (int x = xa; x <= xb; x++) {
            int s0 = y * W + x;
            if (vis[s0] != 0 || isBg[s0] == 1) continue;
            int h2 = 0, t2 = 0, ax0 = x, ay0 = y, ax1 = x, ay1 = y, lv0 = lev[s0];
            int strong = (lv0 == 2) ? 1 : 0;           // 진한 픽셀끼리 · 흐린 픽셀끼리만 이음 (글자가 가장자리의 흐린 그림자 · 테두리에 붙어 같이 지워지지 않게)
            que[t2++] = s0; vis[s0] = 3;
            while (h2 < t2) {
                int p2 = que[h2++];
                int ux = p2 % W, uy = p2 / W;
                if (ux < ax0) ax0 = ux;
                if (ux > ax1) ax1 = ux;
                if (uy < ay0) ay0 = uy;
                if (uy > ay1) ay1 = uy;
                if (ux > xa && vis[p2 - 1] == 0 && lev[p2 - 1] == lv0) { vis[p2 - 1] = 3; que[t2++] = p2 - 1; }
                if (ux < xb && vis[p2 + 1] == 0 && lev[p2 + 1] == lv0) { vis[p2 + 1] = 3; que[t2++] = p2 + 1; }
                if (uy > ya && vis[p2 - W] == 0 && lev[p2 - W] == lv0) { vis[p2 - W] = 3; que[t2++] = p2 - W; }
                if (uy < yb && vis[p2 + W] == 0 && lev[p2 + W] == lv0) { vis[p2 + W] = 3; que[t2++] = p2 + W; }
            }
            int bw = ax1 - ax0 + 1, bh = ay1 - ay0 + 1;
            int tl = (ax0 == xa) ? 1 : 0, tr = (ax1 == xb) ? 1 : 0, tt = (ay0 == ya) ? 1 : 0, tbt = (ay1 == yb) ? 1 : 0;
            int corner = ((tl + tt == 2) || (tt + tr == 2) || (tr + tbt == 2) || (tbt + tl == 2)) ? 1 : 0;      // 창 모서리 (둥근 모서리)
            int solid = (t2 * 2 >= bw * bh) ? 1 : 0;
            int thin = (solid == 1 && tl + tr + tt + tbt > 0 && ((bh <= 4 && bw >= 48) || (bw <= 4 && bh >= 48))) ? 1 : 0;   // 가장자리의 가는 선
            int bar = (solid == 1 && tl + tr + tt + tbt > 0 && (bw * 2 >= xb - xa + 1 || bh * 2 >= yb - ya + 1)) ? 1 : 0;  // 가장자리의 테두리 · 막대 · 스크롤바
            int blocky = (solid == 1 && ((bw >= 64 && bh >= 12) || (bh >= 64 && bw >= 3))) ? 1 : 0;   // 꽉 찬 큰 덩어리(스크롤바 · 막대) = 글자 아님 (칠하지는 않음)
            int junk = (corner == 1 || thin == 1 || bar == 1) ? 1 : 0;
            int texty = (junk == 0 && blocky == 0 && strong == 1) ? 1 : 0;
            if (corner == 0 && thin == 0 && t2 > big) big = t2;
            for (int e = 0; e < t2; e++) {
                int pe = que[e];
                vis[pe] = (junk == 1) ? 2 : 1;
                if (texty == 1) lit[pe / W] = 1;
            }
            if (texty == 1) {
                if (ax0 < x0) x0 = ax0;
                if (ax1 > x1) x1 = ax1;
                if (ay0 < y0) y0 = ay0;
                if (ay1 > y1) y1 = ay1;
            }
        }
        if (x1 < 0) return null;
        x0 = Mx(xa, x0 - 1); y0 = Mx(ya, y0 - 1); x1 = Mn(xb, x1 + 1); y1 = Mn(yb, y1 + 1);   // 글자 가장자리의 흐린 픽셀 1px 까지
        int[] gaps = new int[H];
        int ng = 0, prev = -1;
        for (int y = ya + 1; y <= yb; y++) if (lit[y] == 1 && lit[y - 1] == 0) { if (prev >= 0 && y - prev >= 8 && y - prev <= 64) gaps[ng++] = y - prev; prev = y; }
        for (int i = 1; i < ng; i++) { int v = gaps[i]; int j = i - 1; while (j >= 0 && gaps[j] > v) { gaps[j + 1] = gaps[j]; j--; } gaps[j + 1] = v; }
        int pitch = (ng > 0) ? gaps[ng / 2] : 0;
        gVis = vis;
        return new int[] { xa, ya, xb, yb, bestSize, x0, y0, x1, y1, pitch, big };
    }
    // px = 24bpp 픽셀(B, G, R 순서 · 한 줄 st 바이트) · W x H
    public static int[] TextBoxPx(byte[] px, int st, int W, int H, int margin) {
        int N = W * H;
        int[] rgb = new int[N];
        int[] hist = new int[32768];
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
            int i = y * st + x * 3;
            int cb = px[i] & 255, cg = px[i + 1] & 255, cr = px[i + 2] & 255;
            rgb[y * W + x] = (cr << 16) | (cg << 8) | cb;
            hist[((cr >> 3) << 10) | ((cg >> 3) << 5) | (cb >> 3)]++;
        }
        int[] top = new int[6];
        for (int k = 0; k < 6; k++) top[k] = -1;
        for (int q = 0; q < 32768; q++) {            // 가장 많은 색 6개 (창의 2% 이상만)
            if (hist[q] * 50 < N) continue;
            int c = q;
            for (int k = 0; k < 6 && c >= 0; k++) if (top[k] < 0 || hist[c] > hist[top[k]]) { int t = top[k]; top[k] = c; c = t; }
        }
        int[] sub = new int[512];
        int[] best = null;
        int[] bestVis = null;
        int bestArea = 0;
        for (int k = 0; k < 6; k++) {
            if (top[k] < 0) continue;
            for (int s = 0; s < 512; s++) sub[s] = 0;
            for (int p = 0; p < N; p++) {            // 그 칸 안에서 가장 많은 정확한 색
                int v = rgb[p];
                int vr = (v >> 16) & 255, vg = (v >> 8) & 255, vb = v & 255;
                if ((((vr >> 3) << 10) | ((vg >> 3) << 5) | (vb >> 3)) == top[k]) sub[((vr & 7) << 6) | ((vg & 7) << 3) | (vb & 7)]++;
            }
            int sb = 0;
            for (int s = 1; s < 512; s++) if (sub[s] > sub[sb]) sb = s;
            int qq = top[k];
            int col = ((((qq >> 10) << 3) | (sb >> 6)) << 16) | (((((qq >> 5) & 31) << 3) | ((sb >> 3) & 7)) << 8) | (((qq & 31) << 3) | (sb & 7));
            int[] r = Region(rgb, W, H, col);
            if (r == null) continue;
            int area = (r[2] - r[0] + 1) * (r[3] - r[1] + 1);
            if (r[10] * 100 > area * 6) continue;    // 안에 큰 덩어리(다른 창 · 그림)가 있으면 글자 화면 아님
            if (best == null || area > bestArea) { best = r; bestVis = gVis; bestArea = area; }
        }
        if (best == null) return null;
        int bestCol = ModeColor(rgb, W, best[0], best[1], best[2], best[3]);   // 여백 색 = 글자 화면에서 가장 많은 색
        int tx0 = best[5], ty0 = best[6], tx1 = best[7], ty1 = best[8];
        int ow = tx1 - tx0 + 1 + 2 * margin, oh = ty1 - ty0 + 1 + 2 * margin;
        int[] res = new int[16 + ow * oh];
        res[0] = ow; res[1] = oh; res[2] = tx0 - margin; res[3] = ty0 - margin; res[4] = best[9];
        res[5] = (bestCol >> 16) & 255; res[6] = (bestCol >> 8) & 255; res[7] = bestCol & 255;
        res[8] = best[0]; res[9] = best[1]; res[10] = best[2]; res[11] = best[3];
        for (int y = 0; y < oh; y++) for (int x = 0; x < ow; x++) {      // 글자 테두리 안은 원래 픽셀(창 모서리 · 테두리는 배경색) · 여백은 배경색
            int sx = tx0 - margin + x, sy = ty0 - margin + y;
            int o = bestCol;
            if (sx >= tx0 && sx <= tx1 && sy >= ty0 && sy <= ty1 && bestVis[sy * W + sx] != 2) o = rgb[sy * W + sx];
            res[16 + y * ow + x] = o;
        }
        return res;
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
# 2026-11-12: Auto = VMware 는 앞으로 가져와 화면 복사 (뒤에 있으면 PrintWindow 가 몇 분 전 콘솔을 찍음) · 그 밖의 창은 PrintWindow
# 2026-11-18: MySQL Workbench 도 Screen (학교 PC 화면 배율 125% 에서 PrintWindow 로 찍으면 오른쪽 · 아래가 검은 여백으로 남음)
$isWorkbench = ($Process -match "^MySQLWorkbench") -or ($Window -match "MySQL Workbench")
if ($Method -eq "Auto") { if (($Process -or $Window) -and -not $isWorkbench) { $Method = "PrintWindow" } else { $Method = "Screen" } }

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

# 5-1) -TextOnly: 글자 화면은 글자 부분만 딱 맞게 (2026-11-13 사용자: "검은 화면에 작은 글씨라 글자가 너무 작음")
#      2026-11-20 넓힘: CUI 만이 아니라 GNOME 터미널(Server · Client) · 윈도우 cmd · PowerShell · 텔넷 창도 (사용자: "server(B)cui환경처럼 명령어를 딱 맞게" · "win 의 cmd,powershell도")
$textMsg = ""
if ($TextOnly) {
    $crop = [VmCap]::TextOnly($bmp, 12)
    if ($null -eq $crop) { $bmp.Dispose(); Write-Output "ERROR: -TextOnly found no text screen in this window (text console / terminal / cmd / PowerShell) - is the terminal in front and not covered? (other GUI screens: capture without -TextOnly)"; exit 1 }
    $tb = [VmCap]::Last
    $bmp.Dispose(); $bmp = $crop
    $pitch = $tb[4]; if ($pitch -le 0) { $pitch = 16 }
    $wordCm = [Math]::Min($PageCm, $bmp.Width * 0.42 / $pitch)
    $textMsg = (" | text only: {0}x{1} from {2},{3} of window {4}x{5} | bg #{6:X2}{7:X2}{8:X2} | line {9}px | word width {10:0.0}cm" -f $bmp.Width, $bmp.Height, $tb[2], $tb[3], $cw, $ch, $tb[5], $tb[6], $tb[7], $pitch, $wordCm)
    $cw = $bmp.Width; $ch = $bmp.Height
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
