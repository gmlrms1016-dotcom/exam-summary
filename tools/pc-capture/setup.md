# 학교 PC Claude Code — 캡처 설정 (한 번만)

> 사용자(윤희근)가 학교 PC 의 Claude Code 에 “https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md 읽고 그대로 설치해” 라고 시키면, 아래를 **그대로** 해 주세요 (Windows · PowerShell).
> 목적: 이 PC 에서 Claude Code 가 찍는 캡처가 흐리지 않게 — **DPI 인식 → VMware 창 영역만 → 원래 픽셀 크기 → PNG** 를 말하지 않아도 매번.

## 1. 스크립트 · 규칙 받기 + 사용자 CLAUDE.md 에 규칙 붙이기
아래를 PowerShell 로 한 번에 실행 (WebFetch 로 내용을 옮겨 적지 말고 파일을 그대로 받기 — 글자가 바뀌지 않게):

```powershell
$base = "https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture"
$d = Join-Path $env:USERPROFILE ".claude\tools"
New-Item -ItemType Directory -Force -Path $d | Out-Null
Invoke-WebRequest "$base/vmcapture.ps1" -OutFile (Join-Path $d "vmcapture.ps1") -UseBasicParsing
Invoke-WebRequest "$base/CLAUDE-capture.md" -OutFile (Join-Path $d "CLAUDE-capture.md") -UseBasicParsing
$md = Join-Path $env:USERPROFILE ".claude\CLAUDE.md"
$rule = [IO.File]::ReadAllText((Join-Path $d "CLAUDE-capture.md"), [Text.Encoding]::UTF8)
$old = if (Test-Path $md) { [IO.File]::ReadAllText($md, [Text.Encoding]::UTF8) } else { "" }
if ($old -notmatch "vmcapture-rule") {
    [IO.File]::WriteAllText($md, ($old.TrimEnd() + "`r`n`r`n" + $rule), (New-Object Text.UTF8Encoding($false)))
    "CLAUDE.md 에 캡처 규칙을 붙였어요: $md"
} else { "이미 캡처 규칙이 있어요: $md" }
```

- `%USERPROFILE%\.claude\CLAUDE.md` = 이 PC 의 모든 프로젝트에서 Claude Code 가 늘 읽는 사용자 메모리 → 다음부터는 말하지 않아도 이 규칙대로 캡처해요
- 이미 규칙이 있으면 다시 붙이지 않아요 (표시 `vmcapture-rule`)

## 2. 시험 캡처
VMware Workstation 을 켠 상태에서:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1"
```

- 바탕화면에 `capture_날짜_시각.png` 가 생기고 `SAVED: … | 가로 x 세로 px | DPI: …` 가 나오면 성공
- px 크기가 VMware 창 크기와 비슷해야 함 (화면 배율 150% 면 창이 커 보이는 만큼 px 도 큼) · `DPI: FAILED` 가 나오면 사용자에게 알리기 · `ERROR:` 로 시작하면 그 내용을 알리기

## 3. 사용자에게 알리기
“캡처 설정 끝 — 이제부터 캡처는 VMware 창만 · 원래 픽셀 크기 PNG 로 찍어요 (규칙 파일: %USERPROFILE%\.claude\CLAUDE.md)” + 시험 캡처 경로 · 크기

## 참고
- 학교 PC 가 재부팅 때 초기화되면 1번이 지워질 수 있어요 → 같은 한 줄로 다시 설치
- 원본: `exam-summary/tools/pc-capture/` (vmcapture.ps1 · CLAUDE-capture.md · 이 파일)
