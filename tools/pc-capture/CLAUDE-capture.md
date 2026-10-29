<!-- vmcapture-rule (2026-10-29 · https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md) -->
## 📸 화면 캡처 규칙 — 항상 지킴 (사용자가 따로 말하지 않아도)
- 캡처는 새 코드를 짜지 말고 이 스크립트로 찍는다:
  `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1" -Out "<저장할 경로>.png"`
  - VM 탭을 고를 때 `-Title "Server(B)"` · 창 테두리 · 제목줄을 뺄 때 `-Client`
- 스크립트가 하는 일: ① 캡처 전에 `SetProcessDpiAwarenessContext(-4)`(안 되면 스레드만)로 DPI 인식 ② VMware 창 영역만 ③ 원래 픽셀 크기 그대로 ④ PNG
- 금지: 크기 줄이기(resize · thumbnail · 비율 축소) · JPG/JPEG · 전체 화면을 찍고 자르기 · 화면 배율을 무시한 좌표
- 명령의 출력이 다 나온 뒤에 찍는다 · 찍은 뒤 스크립트가 알려 준 px 크기가 VMware 창 크기와 맞는지 확인하고 사용자에게 저장 경로 · 크기를 알린다
- 워드(docx)에 넣을 때도 원본 PNG 그대로 — python-docx 는 `width` 만 지정(비율 유지 · 다시 저장 · 압축 X) · 워드는 파일 → 옵션 → 고급 → 이미지 크기 및 품질 → "파일의 이미지 압축 안 함"
- 스크립트가 없으면(PC 초기화 등) https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md 대로 다시 설치하고 찍는다
