<#
  vmtype.ps1 — VMware 의 글자 콘솔 VM 에 명령을 하나씩 쳐서, 출력이 다 나오면 그 창을 찍기 (다른 컴퓨터 Claude Code 용 · 2026-11-05)
  왜: 원격제어(Computer use)가 꺼져 있으면 VM 에 입력할 방법이 없음 → 2026-11-05 학교 PC 에서 임시 스크립트로 명령 10개를 쳐서 캡처한 것을 도구로
  ⚠️ 쓰면 안 되는 곳 (2026-11-05 학교 PC 에서 확인):
     · (2026-11-13 바뀜) 그래픽 화면(GNOME) VM 은 터미널에서 조건부로 씀 — 사용자: "뭐가 뭔지 모르니까 오타 안 나고 빠르게 쳐 주는 걸로"
       터미널을 VM 안 맨 앞에 열고(포커스) 영어 입력 상태 · 첫 명령(whoami)을 그림으로 확인한 뒤 나머지 · 한글 입력이면 글자가 깨짐
       (2026-11-20 바뀜) GNOME 터미널도 CUI 처럼 글자 부분만 딱 맞게 잘림 (-KeepWindow 안 씀 · 창 통째로가 꼭 필요할 때만)
       (2026-11-05: GNOME 터미널의 fdisk 에 q 를 보냈더니 나가지 않고 도움말이 뜸 · 2026-11-12: GNOME 터미널에 영어로는 잘 들어감)
     · 디스크를 바꾸는 명령 (fdisk · parted · mkfs · mdadm · dd · wipefs · pvcreate 등) · 재부팅 · 끄기 → 이 도구가 거부함
       → 원격제어(Computer use)로 화면을 보면서 하거나, 사용자가 직접 치고 Claude 는 vmcapture.ps1 로 찍기만 (키 안 보냄)
  하는 일 (명령마다):
     ① 그 VMware 창을 앞으로 — Alt 를 한 번 눌렀다 뗀 뒤 SetForegroundWindow (앞으로 가져오기 잠금이 풀림) · Ctrl+G 로 입력을 VM 에 넘김
     ② 키를 보내기 전에 매번 맨 앞 창이 그 VMware 창인지 확인 — 아니면 키를 안 보내고 멈춤 (다른 창에 글자가 들어가지 않게)
     ③ 한 글자씩 40ms 간격 (한 번에 보내면 VM 이 못 따라와 글자가 빠지고 입력 중에 찍힘) → Enter
     ④ 화면이 더 안 바뀔 때까지 기다림 (PrintWindow 로 비교 · 커서 깜빡임 정도는 무시) — 출력이 늦은 명령(ls -l /etc | head -20)도 출력 뒤에 찍힘
     ⑤ 그 창만 원래 픽셀 PNG (vmcapture.ps1 과 같은 방식 · 다른 창에 가려져도 깨끗) — **글자 부분만 딱 맞게 잘라서** (글자 + 배경색 여백 12px)
        (2026-11-13 사용자: "검은 화면에 작은 글씨라 글자가 너무 작음" · 제목 줄 · 메뉴 · 검은 여백 X · vmcapture.ps1 -TextOnly 와 같은 코드 · -KeepWindow 면 예전처럼 창 통째로)
        (2026-11-20 넓힘: GNOME 터미널(Server · Client)도 — 사용자: "gui리눅스 터미널도 server(B)cui환경처럼 명령어를 딱 맞게")
     끝나면 Ctrl+Alt 로 입력을 풀어 줌
  사용:
    powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmtype.ps1" -Title "Server(B)" -Commands "df -h;;ls -l /etc | head -20" -OutDir "C:\경로\캡처" -Names "B01_df;;B02_ls"
    -Commands · -Names 는 ;; 로 나눔 (powershell -File 로 배열을 넘기면 "a,b" 한 문자열로 합쳐짐) · 명령은 영어로만
    -DryRun   키는 안 보내고 무엇을 할지만 출력 (먼저 이걸로 확인 · -Commands 는 꼭 있어야 함: -Commands "hostname" -DryRun)
    -TimeoutMs 180000  한 명령을 기다리는 최대 시간 (기본 3분 — 2026-11-12: dnf 가 저장소가 느려 30초로는 짧았음)
  ⚠️ 화면의 프롬프트를 읽지 못함 → 보내기 전에 vmcapture.ps1 -TextOnly 로 찍어 열어 보고 root 프롬프트(#)인지 확인 · su 가 실패했으면 멈추기
     (2026-11-12: rocky 상태에 dnf 를 보내 오류 · su 실패 뒤에도 다음 명령을 보냄) · 오래 걸리는 명령은 찍은 그림에서 끝났는지(Complete! 등) 확인
    -KeepWindow  글자 부분만 자르지 않고 창 통째로 (제목 줄 그대로 · 보통 안 씀) · -PageCm 17 = 워드 본문 폭(cm) = word width 의 최대값
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
    if (-not $KeepWindow) {                       # 글자 부분만 딱 맞게 — CUI · GNOME 터미널 모두 (2026-11-20) · 글자 화면을 못 찾으면 창 통째로 + 경고
        $crop = [VmType]::TextOnly($outBmp, 12)
        if ($null -eq $crop) { $info += " | no text screen found (is the terminal in front and not covered?) - saved the whole window" }
        else {
            $tb = [VmType]::Last
            $outBmp.Dispose(); $outBmp = $crop
            $pitch = $tb[4]; if ($pitch -le 0) { $pitch = 16 }
            $info = ("{0} x {1} px | text only (window {2} x {3}) | bg #{4:X2}{5:X2}{6:X2} | line {7}px | word width {8:0.0}cm" -f $outBmp.Width, $outBmp.Height, $vw, $vh, $tb[5], $tb[6], $tb[7], $pitch, [Math]::Min($PageCm, $outBmp.Width * 0.42 / $pitch))
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
