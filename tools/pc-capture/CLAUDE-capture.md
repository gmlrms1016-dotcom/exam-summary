<!-- vmcapture-rule (2026-10-29 · 2026-11-05 · 2026-11-13 고침 · https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md) -->
## 📸 화면 캡처 규칙 — 항상 지킴 (사용자가 따로 말하지 않아도)
- 캡처는 새 코드를 짜지 말고 이 스크립트로 찍는다:
  `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmcapture.ps1" -Out "<저장할 경로>.png"`
  - VM 탭을 고를 때 `-Title "Server(B)"` · VMware 말고 다른 창은 `-Process code`(프로세스 이름) · `-Window yunhuigeun`(제목 글자)
  - 기본은 PrintWindow — 창이 스스로 그리게 해서 **다른 창(Claude 앱 등)에 가려져 있어도 깨끗** (2026-11-05 학교 PC: 화면 복사 방식은 Claude 창에 가려진 채 찍혔는데 오류가 안 났음) · `-Method Screen` 은 그 창이 맨 앞이 아니면 ERROR
- 스크립트가 하는 일: ① 캡처 전에 `SetProcessDpiAwarenessContext(-4)`(안 되면 스레드만)로 DPI 인식 ② 그 창 영역만 ③ 원래 픽셀 크기 그대로 ④ PNG
- 금지: 크기 줄이기(resize · thumbnail · 비율 축소) · JPG/JPEG · 전체 화면을 찍고 자르기 · 화면 배율을 무시한 좌표
- **제목 줄은 살린다** — 닫기 · 최소화 · 최대화가 있는 맨 윗줄까지 창 통째로 (2026-11-04 사용자) · `-Client`(제목 줄 빼기)는 쓰지 않는다
  - **VMware 과제 캡처는 제목 줄을 그대로 둔다** — "Server(B) - VMware Workstation" 같은 원래 제목 (2026-11-05 사용자 결정)
  - **단 VMware 글자 화면(CUI · Server(B) 등)은 글자 부분만 딱 맞게 자른다** (2026-11-13 사용자: “검은 화면에 작은 글씨라 글자가 너무 작음”) — `vmcapture.ps1 ... -TextOnly` → 제목 줄 · 메뉴 · 라이브러리 · 검은 여백 없이 글자 + 검은 여백 12px (`vmtype.ps1` 은 기본으로 자름)
    - 워드에 넣을 때 폭 = 출력의 `word width …cm` (python-docx `width=Cm(…)`) — 그림마다 글자 크기가 비슷하게 · 본문 폭(17cm)보다 넓은 출력만 본문 폭
    - 그래픽 화면(GNOME) VM 은 예전처럼 창 통째로 (`-TextOnly` 를 쓰면 ERROR 로 알려 줌)
  - 그 밖의 창은 제목 글자를 내 이름 영어 `yunhuigeun` 만 (경로 · 명령 · 자동화 흔적 글자 X) — 콘솔(cmd)은 실행 전에 `title yunhuigeun` · VS Code 는 설정 `window.title` = `"yunhuigeun"`
  - 제목을 바꿀 수 없는 그 밖의 창(Visual Studio 등)은 어떻게 찍을지 사용자에게 먼저 묻는다
  - **UAC 가 꺼진 PC** 는 `title yunhuigeun` 을 해도 "관리자: yunhuigeun" · VS 제목에 "(관리자)" 가 붙음 → 그대로 찍을지 먼저 묻는다 (2026-11-09: VS 디버그 콘솔 그대로 · 사용자 선택)
- **VS Code 소스 캡처는 탐색기(사이드바) 닫고** 깔끔하게 · **코드는 창에 딱 맞게**(짧으면 확대 · 길면 축소 · 가로세로 안 잘리는 데까지) · **50줄이 넘으면 나눠 찍기** (2026-11-04 사용자)
  - **짧은 코드는 확대 단축키(Ctrl + `+` · Visual Studio 는 Ctrl+Shift+. = View.ZoomIn)로 가로가 잘리기 직전까지 키워서 글자를 키운다** — 글자 크기 상한 없음 · 모든 언어 과목 · 세로가 먼저 차면 거기까지 (2026-11-13 사용자: 프로그래밍언어실습 11주차 제출본 글자가 작았음)
- **Visual Studio(C 수업 실습) 소스 · 실행 = `vscapture.ps1`** (2026-11-09 — 학교 PC 가 손으로 하던 방법을 도구로 · 같은 날 제출 워드를 보고 소스 캡처를 고침 · 먼저 `-DryRun` · VS 에 솔루션이 열려 있어야 함)
  `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vscapture.ps1" -Mode src -File "<c 파일>" -Out "<src_이름>.png"`
  `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vscapture.ps1" -Mode run -Project "<프로젝트>" -Out "<run_이름>.png"`
  - src = **VS 창 통째로 찍되 깔끔하게** (11주차 제출: 솔루션 탐색기 · 출력 창 · 다른 탭이 같이 찍히고 코드가 작았음) — 다른 탭 닫기(바뀐 내용은 저장) → 그 파일만 열기 → 도구 창(솔루션 탐색기 · 출력 · 오류 목록 …) 숨기기 → 현재 줄 강조 잠깐 끄기 → 창을 화면 크기로 → **가로(또는 세로)가 잘리기 직전까지 확대**(VS 가 알려 주는 보이는 줄 · 칸 수로 재서 · 글자 크기 상한 없음 — 2026-11-13 사용자) → **창 폭 · 높이를 코드에 맞춤** → 여러 장 중 **커서가 꺼진 장면** → 확대 · 도구 창 · 강조 · 창 위치 되돌림
  - **50줄이 넘으면 나눠 찍기** = `-Lines 1-45` · `-Lines 46-90` (그 줄을 맨 위로) → `src_이름_1.png` · `_2.png` · 출력의 `fit: skipped (…)` 는 확대 · 창 맞추기만 못 한 것(그림은 찍힘) → 그 글을 그대로 사용자에게 알리기
  - run = 시작 프로젝트 바꾸기 → 디버그하지 않고 시작(Ctrl+F5) → 새 디버그 콘솔 창 높이를 출력에 맞춤(`-Height` 로 직접 · `-NoFit` 안 바꿈) → 여러 장(`-Shots 5`) 중 **커서가 꺼진 장면** · 입력이 필요한 프로그램(scanf)은 사용자가 입력한 뒤 vmcapture `-Window` 로
  - **실행 캡처는 Ctrl+F5 로 뜨는 창 그대로** (2026-11-09 사용자: “출력결과는 그냥 ctrl+F5 해서 나오는 거처럼”) — 경로가 길어 `…종료되었습니다.` 줄이 두 줄이 돼도 그대로 · 내용을 고치거나 자르지 않음
  - 워드는 문제마다 1열 3행 표 (문제 · 소스 · 실행) · 원본 PNG 그대로
  - 수업 실습 코드는 **맨 위에 파일 이름 주석 한 줄만** (`// w11-ex01_05-pointer-01.c` — 메모 글자 X) · 한 슬라이드에 코드 2개면 두 번째에 `-static` · `-null` 처럼 붙임 · 주차 솔루션 하나(`w11.sln`) · 프로젝트 이름에 `.c` 를 붙이지 않기
  - **제출 전 점검 = `hwcheck.py`** (`%USERPROFILE%\.claude\동양미래\도구\c-hw\hwcheck.py` · 파이썬 표준만): `python hwcheck.py <솔루션 폴더> --doc <제출.docx> --pdf <강의자료.pdf>` → ❌ 는 고치고 ⚠️ 는 사용자에게 알리기만
    - **기준은 공지 txt** (워드 옆 `(wNN)[수업중제출] …txt` 를 알아서 찾음 · `--notice` 로 직접) — 공지에 있는 것만 하면 됨: 수업 시간에 한 실습 · Quiz 개수 · 파일 이름 형식 (2026-11-09 사용자: “여기 있는 거만 하면 될텐데”) · 슬라이드 [실습] 중 워드에 없는 것은 참고로만
    - 그 밖에: 남은(겹친) 프로젝트 · `.c` 로 끝나는 프로젝트 폴더 · 맨 위 주석 · 표 1열 3행 · 그림 PNG · 캡처 원본과 같은지(압축 X)
  - 오류를 보여 주는 강의 코드(초기화 안 된 변수 등)는 VS 가 SDL 검사(C4700) · 런타임 검사(RTC #3)로 막음 → **그 프로젝트만** 속성에서 끄고 실행 (소스는 원문 그대로)
- 소스코드를 캡처할 때는 **소스 안에 커서가 보이지 않게** (커서가 있으면 깔끔하지 않음 · 2026-11-03 사용자) — VS 는 vscapture.ps1 이 여러 장 중 커서 꺼진 장면을 고름 · 손으로 찍을 때는 편집기 밖을 눌러 포커스를 빼서 커서가 사라진 걸 확인하고 찍는다
- 명령의 출력이 다 나온 뒤에 찍는다 · 찍은 뒤 스크립트가 알려 준 px 크기가 창 크기와 맞는지 확인하고, **찍은 그림을 열어 보고**(가려짐 · 덜 나온 출력) 사용자에게 저장 경로 · 크기를 알린다
- **VM 안에 명령을 쳐서 하나씩 찍기** = `vmtype.ps1` (원격제어 Computer use 가 꺼져 있을 때 · 2026-11-05)
  `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\tools\vmtype.ps1" -Title "Server(B)" -Commands "df -h;;ls -l /etc | head -20" -Names "B01_df;;B02_ls" -OutDir "<폴더>"` (먼저 `-DryRun`)
  - 글자만 나오는 콘솔 VM(Server(B) 같은)에서만 — **그래픽 화면(GNOME) VM 에는 쓰지 않는다** (무슨 키가 들어갔는지 확인할 수 없음 · fdisk 에 q 가 안 먹고 도움말이 떴음)
  - **디스크를 바꾸는 명령(fdisk · parted · mkfs · mdadm · dd · wipefs 등) · 재부팅 · 끄기는 쓰지 않는다**(스크립트도 거부함) → 원격제어로 화면을 보면서 하거나, 사용자가 직접 치고 Claude 는 vmcapture.ps1 로 찍기만
  - 키를 보내기 전에 매번 맨 앞 창이 그 VMware 창인지 확인하고 아니면 멈춤 · 한 글자씩 40ms · 출력이 다 나와 화면이 멈춘 뒤 찍음 · 끝나면 Ctrl+Alt 로 입력을 풀어 줌
  - 찍은 그림은 **글자 부분만 딱 맞게** 잘려서 저장됨 (2026-11-13 · 창 통째로는 `-KeepWindow`) · 워드 폭 = 출력의 `word width`
- **원격제어(Computer use)** 는 Claude 앱 설정 → This computer → Computer use 에서 사용자가 직접 켠다 (기본 꺼짐 · 보안 설정이라 Claude 가 켜지 않음) · **켠 뒤에는 새 세션에서** 시작 (이미 열려 있던 세션에는 도구가 안 들어옴 · 2026-11-05)
  - 새 세션에서 ToolSearch 로 computer-use 도구를 불러오고 `request_access("VMware Workstation Pro")` → full 허용
  - **VM 안에 입력**: `type` 은 VM 에 글자가 안 들어감(Enter 만) → `key` 로 한 글자씩 — 대문자 `shift+l` · `*` = `shift+8` · `>` = `shift+period` · `"` = `shift+'` · `#` = `shift+3` · `|` = `shift+backslash` · `=` 는 `"="` 그대로(`equal` 은 틀린 키 이름)
  - 포커스가 자주 빠짐("Claude's own window still has keyboard focus") → **입력 전마다 VM 콘솔 클릭** · 글자 화면(응급 셸)은 글자가 늦게 찍히니 **명령마다 2~5초** 기다리기
  - `open_application(VMware)` 이 빈 Home 창을 하나 더 열면 닫기 · 작업 표시줄 클릭은 File Explorer 허용이 따로 필요 · 백신(알약) 팝업이 앞을 가릴 수 있음
  - **비밀번호(로그인 · 응급 모드)는 Claude 가 넣지 않음** → 그 단계에서 사용자에게 입력해 달라고
- **원격제어 중 캡처**: 화면 가장자리에 주황 빛이 켜지므로 **창을 가장자리에서 띄우고**(예: 50, 40) 찍기 · 마우스를 탭 위에서 치워 툴팁 X · VMware 라이브러리 패널을 닫으면 콘솔이 넓게 찍힘 · `VMware window not found` 가 나오면 최신 vmcapture.ps1(창 제목이 비어도 EnumWindows 로 찾음)로 다시 받기
- 도구용 ps1 은 **UTF-8 BOM 필수** (BOM 없으면 Windows PowerShell 5.1 이 한글 경로를 깨뜨려 엉뚱한 폴더에 저장)
- 워드(docx)에 넣을 때도 원본 PNG 그대로 — python-docx 는 `width` 만 지정(비율 유지 · 다시 저장 · 압축 X) · 워드는 파일 → 옵션 → 고급 → 이미지 크기 및 품질 → "파일의 이미지 압축 안 함"
- 스크립트가 없으면(PC 초기화 등) iCloud `동양미래대학교/Claude과제머신.zip` 을 내려받아 풀고 `프롬프트.txt` 대로 하거나 https://gmlrms1016-dotcom.github.io/exam-summary/tools/pc-capture/setup.md 대로 다시 설치하고 찍는다
