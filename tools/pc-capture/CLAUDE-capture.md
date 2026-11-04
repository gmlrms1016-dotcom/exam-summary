<!-- vmcapture-rule (2026-10-29 · 2026-11-04 고침 · https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md) -->
## 📸 화면 캡처 규칙 — 항상 지킴 (사용자가 따로 말하지 않아도)
- 캡처는 새 코드를 짜지 말고 이 스크립트로 찍는다:
  `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1" -Out "<저장할 경로>.png"`
  - VM 탭을 고를 때 `-Title "Server(B)"` · `-Client`(제목 줄 빼기)는 쓰지 않는다 — 아래 '제목 줄은 살린다'
- 스크립트가 하는 일: ① 캡처 전에 `SetProcessDpiAwarenessContext(-4)`(안 되면 스레드만)로 DPI 인식 ② 그 창 영역만 ③ 원래 픽셀 크기 그대로 ④ PNG
- 금지: 크기 줄이기(resize · thumbnail · 비율 축소) · JPG/JPEG · 전체 화면을 찍고 자르기 · 화면 배율을 무시한 좌표
- **제목 줄은 살린다** — 닫기 · 최소화 · 최대화가 있는 맨 윗줄까지 창 통째로 (2026-11-04 사용자). 제목 글자는 **내 이름 영어 `yunhuigeun` 만** — 경로 · 명령 · 자동화 흔적 글자 X
  - 콘솔(cmd)은 실행 전에 `title yunhuigeun` · VS Code 는 설정 `window.title` = `"yunhuigeun"`
  - 제목을 이름으로 못 바꾸는 창(VMware · Visual Studio 등)은 어떻게 찍을지 사용자에게 먼저 묻는다
- **VS Code 소스 캡처는 탐색기(사이드바) 닫고** 깔끔하게 · **코드는 창에 딱 맞게**(짧으면 확대 · 길면 축소 · 가로세로 안 잘리는 데까지) · **50줄이 넘으면 나눠 찍기** (2026-11-04 사용자)
- 소스코드를 캡처할 때는 **소스 안에 커서가 보이지 않게** — 편집기 밖(솔루션 탐색기 등)을 눌러 포커스를 빼서 커서가 사라진 걸 확인하고 찍는다 (커서가 있으면 깔끔하지 않음 · 2026-11-03 사용자)
- 명령의 출력이 다 나온 뒤에 찍는다 · 찍은 뒤 스크립트가 알려 준 px 크기가 창 크기와 맞는지 확인하고 사용자에게 저장 경로 · 크기를 알린다
- 워드(docx)에 넣을 때도 원본 PNG 그대로 — python-docx 는 `width` 만 지정(비율 유지 · 다시 저장 · 압축 X) · 워드는 파일 → 옵션 → 고급 → 이미지 크기 및 품질 → "파일의 이미지 압축 안 함"
- 스크립트가 없으면(PC 초기화 등) iCloud `동양미래대학교/Claude설정/`(또는 `Claude설정.zip`)을 내려받아 `프롬프트.txt` 대로 하거나 https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md 대로 다시 설치하고 찍는다
