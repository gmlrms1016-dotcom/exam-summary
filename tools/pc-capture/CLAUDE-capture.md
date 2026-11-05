<!-- vmcapture-rule (2026-10-29 · 2026-11-05 고침 · https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md) -->
## 📸 화면 캡처 규칙 — 항상 지킴 (사용자가 따로 말하지 않아도)
- 캡처는 새 코드를 짜지 말고 이 스크립트로 찍는다:
  `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1" -Out "<저장할 경로>.png"`
  - VM 탭을 고를 때 `-Title "Server(B)"` · VMware 말고 다른 창은 `-Process code`(프로세스 이름) · `-Window yunhuigeun`(제목 글자)
  - 기본은 PrintWindow — 창이 스스로 그리게 해서 **다른 창(Claude 앱 등)에 가려져 있어도 깨끗** (2026-11-05 학교 PC: 화면 복사 방식은 Claude 창에 가려진 채 찍혔는데 오류가 안 났음) · `-Method Screen` 은 그 창이 맨 앞이 아니면 ERROR
- 스크립트가 하는 일: ① 캡처 전에 `SetProcessDpiAwarenessContext(-4)`(안 되면 스레드만)로 DPI 인식 ② 그 창 영역만 ③ 원래 픽셀 크기 그대로 ④ PNG
- 금지: 크기 줄이기(resize · thumbnail · 비율 축소) · JPG/JPEG · 전체 화면을 찍고 자르기 · 화면 배율을 무시한 좌표
- **제목 줄은 살린다** — 닫기 · 최소화 · 최대화가 있는 맨 윗줄까지 창 통째로 (2026-11-04 사용자) · `-Client`(제목 줄 빼기)는 쓰지 않는다
  - **VMware 과제 캡처는 제목 줄을 그대로 둔다** — "Server(B) - VMware Workstation" 같은 원래 제목 (2026-11-05 사용자 결정)
  - 그 밖의 창은 제목 글자를 내 이름 영어 `yunhuigeun` 만 (경로 · 명령 · 자동화 흔적 글자 X) — 콘솔(cmd)은 실행 전에 `title yunhuigeun` · VS Code 는 설정 `window.title` = `"yunhuigeun"`
  - 제목을 바꿀 수 없는 그 밖의 창(Visual Studio 등)은 어떻게 찍을지 사용자에게 먼저 묻는다
- **VS Code 소스 캡처는 탐색기(사이드바) 닫고** 깔끔하게 · **코드는 창에 딱 맞게**(짧으면 확대 · 길면 축소 · 가로세로 안 잘리는 데까지) · **50줄이 넘으면 나눠 찍기** (2026-11-04 사용자)
- 소스코드를 캡처할 때는 **소스 안에 커서가 보이지 않게** — 편집기 밖(솔루션 탐색기 등)을 눌러 포커스를 빼서 커서가 사라진 걸 확인하고 찍는다 (커서가 있으면 깔끔하지 않음 · 2026-11-03 사용자)
- 명령의 출력이 다 나온 뒤에 찍는다 · 찍은 뒤 스크립트가 알려 준 px 크기가 창 크기와 맞는지 확인하고, **찍은 그림을 열어 보고**(가려짐 · 덜 나온 출력) 사용자에게 저장 경로 · 크기를 알린다
- **VM 안에 명령을 쳐서 하나씩 찍기** = `vmtype.ps1` (원격제어 Computer use 가 꺼져 있을 때 · 2026-11-05)
  `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmtype.ps1" -Title "Server(B)" -Commands "df -h;;ls -l /etc | head -20" -Names "B01_df;;B02_ls" -OutDir "<폴더>"` (먼저 `-DryRun`)
  - 글자만 나오는 콘솔 VM(Server(B) 같은)에서만 — **그래픽 화면(GNOME) VM 에는 쓰지 않는다** (무슨 키가 들어갔는지 확인할 수 없음 · fdisk 에 q 가 안 먹고 도움말이 떴음)
  - **디스크를 바꾸는 명령(fdisk · parted · mkfs · mdadm · dd · wipefs 등) · 재부팅 · 끄기는 쓰지 않는다**(스크립트도 거부함) → 원격제어로 화면을 보면서 하거나, 사용자가 직접 치고 Claude 는 vmcapture.ps1 로 찍기만
  - 키를 보내기 전에 매번 맨 앞 창이 그 VMware 창인지 확인하고 아니면 멈춤 · 한 글자씩 40ms · 출력이 다 나와 화면이 멈춘 뒤 찍음 · 끝나면 Ctrl+Alt 로 입력을 풀어 줌
- **원격제어(Computer use)** 는 Claude 앱 설정 → This computer → Computer use 에서 사용자가 직접 켠다 (기본 꺼짐 · 보안 설정이라 Claude 가 켜지 않음) · **켠 뒤에는 새 세션에서** 시작 (이미 열려 있던 세션에는 도구가 안 들어옴 · 2026-11-05)
- 워드(docx)에 넣을 때도 원본 PNG 그대로 — python-docx 는 `width` 만 지정(비율 유지 · 다시 저장 · 압축 X) · 워드는 파일 → 옵션 → 고급 → 이미지 크기 및 품질 → "파일의 이미지 압축 안 함"
- 스크립트가 없으면(PC 초기화 등) iCloud `동양미래대학교/Claude설정/`(또는 `Claude설정.zip`)을 내려받아 `프롬프트.txt` 대로 하거나 https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md 대로 다시 설치하고 찍는다
