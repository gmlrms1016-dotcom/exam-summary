# 전공 학습 정리 (exam-summary)

동양미래대학교 전공 과목 **시험 정리 웹앱**. 한 페이지짜리 정적 사이트(빌드 도구·서버 없음)로, 학기 → 시험 → 과목 순으로 들어가 정리와 인앱 퀴즈/채점을 보고, 시험이 끝나면 자동으로 **복습 모드**로 바뀝니다.

➡️ **바로 보기:** https://gmlrms1016-dotcom.github.io/exam-summary/

> 이 문서는 **다음 학기(2학기 등)를 1학기와 똑같은 방식으로, AI의 도움을 받아 쉽게 추가**할 수 있도록 쓴 개발 가이드를 포함합니다. → [🧑‍💻 다음 학기 추가하기](#-다음-학기-추가하기) · [📅 주차 정리 기본 작업](#-이번-주차-정리해줘-요청-시-기본-작업--퀴즈-포함) · [🤖 AI 프롬프트](#-ai로-개발하기-복붙-프롬프트)

> 🤖 **AI 작업 규칙 — 커밋·푸시는 안 물어봐도 알아서 한다.** 이 저장소를 고친 작업이 끝나고 확인(채점·375px 화면·화이트/다크)까지 마쳤으면, 사용자에게 "올릴까요?"라고 묻지 않고 바로 커밋하고 `main` 에 푸시한 뒤 결과만 알립니다. (다른 Claude 세션이 같은 저장소를 동시에 고치고 있으면, 커밋 전에 그 세션과 누가 올릴지만 맞춥니다.)

---

## 과목 (1학년 1학기 · 기말)

| 과목 | 내용 | 특징 |
|------|------|------|
| 프로그래밍방법론 | 순서도(Flowgorithm)→파이썬 · 선택/반복/함수·재귀/클래스 | 벡터 SVG 순서도 · 7문제 **인앱 실행·채점** |
| SW개발도구활용 | Git — 기본 흐름·주차별 명령어·실습 1~4·merge/rebase/squash/PR | 명령어 클릭 시 **예시 팝업** · log 보기1→보기2 퀴즈 72문항 |
| 컴퓨터공학기초 | AI·딥러닝 / 컴퓨팅 사고력 / DB / 네트워크 | 객관식 79 + 빈칸/주관식 |
| 파이썬프로그래밍 | PB 실기 4문제(match-case / map·zip / turtle / try-except) | **인앱 실행·채점** |
| 웹프로그래밍 기초 | HTML/CSS 정리 + 태그 퀴즈 | 복습 시 정답·해설 공개 |

---

## 빠른 시작

정적 파일이라 빌드가 없습니다. 폴더에서 정적 서버만 띄우면 됩니다.

```bash
python3 -m http.server 8000      # → http://localhost:8000
```

GitHub Pages면 `main`에 push하면 자동 배포됩니다.

## 파일 구성

```
index.html          첫 화면(허브) — 학기/시험 선택 + 개강·시험 카운트다운 (자체 스타일 내장)
schedule.js         ★ 시험 일정 단일 소스 + "시험 +3h 자동 복습 전환"
style.css           과목 페이지 공용 테마(초록) — 화이트모드 기준
theme.js            ★ 전 페이지 공용 — 다크모드(기본) / 화이트모드 전환 (오른쪽 위 ☀️/🌙 버튼)
codecolor.js        전 페이지 공용 — 소스코드 색칠(VS Code 고대비 색) · theme.js 가 자동으로 불러옴
review.js           과목 페이지 공용 — 틀린 문제 모아 복사 + 코드블록 복사 버튼
quiz.js             2학기 과목 페이지 공용 퀴즈 — 객관식(.mcq)·주관식(.quiz-item) 채점 + 복습 모드
weeks.js            2학기 과목 페이지의 1~15주차 버튼 — 진도 나간 주차만 열림, 8주차 중간고사 · 15주차 기말고사, 새 탭으로 열기
weeks/             주차 페이지(<과목>-N주차.html · <과목>-8주차-중간고사.html) — scripts/build_weeks.py 가 생성
weeks/src/         주차 페이지 원고(노션 주차 페이지 내용을 옮긴 .md) — 이것만 고치고 빌드
scripts/build_weeks.py  weeks/src/*.md → weeks/*.html + weeks.js 버튼 데이터 갱신 (python3 scripts/build_weeks.py)
pyrun.js            Pyodide 인앱 파이썬 실행기   grader.py / grader_pm.py  채점 로직
<과목>.html         과목별 정리 페이지 5개
pm-img/ · sw-img/   과목 이미지
```

---

## 작동 방식 (아키텍처)

### 1) 허브 화면 라우팅 — `index.html`
`location.hash` 로 화면을 전환하는 초경량 SPA입니다. 화면은 `<section class="screen" id="...">` 하나당 하나.

```
#home → #sem1 → #sem1-final(5과목 허브)
      → #sem2 → #sem2-mid / #sem2-final
```

- 이동: 버튼에 `data-go="화면id"` / 뒤로: `data-back="화면id"`
- 화면 목록은 JS의 `SCREENS` 배열에 등록 → `show()` 가 나머지를 `hidden` 처리

### 2) 시험 일정 단일 소스 — `schedule.js`
모든 시험 날짜는 **여기 한 곳**에서만 관리합니다.

```js
window.EXAM_SCHEDULE = { "프로그래밍방법론.html": "2026-06-22T10:00:00", ... }; // 파일명 → 시작 ISO
window.EXAM_GRACE_MS = 3 * 60 * 60 * 1000;          // 시작 +3시간이 지나면 '완료'
window.isExamFinished("X.html")                      // → true/false
```

과목 페이지 `<head>` 에 `schedule.js` 를 넣어두면, **시험 시작 +3시간**이 지난 뒤 접속 시 자동으로 URL에 `?done=1` 을 붙여(`history.replaceState`) **복습 모드**를 켭니다. 허브(`index.html`)도 같은 함수로 카드 상태를 계산합니다.

### 3) 복습 모드 — `?done=1`
각 과목 페이지 끝의 작은 스크립트가 `?done=1` 이면 **배너 + 정답·해설 공개**를 합니다. 진입 방법은 두 가지(둘 다 동작):
- 허브에서 완료 과목 클릭(허브가 `?done=1` 링크로 바꿔줌)
- 시험 +3h 경과 후 직접 접속(`schedule.js` 가 자동으로 붙임)

---

## 🎨 디자인 시스템

`index.html`은 자체 토큰을, 과목 페이지는 `style.css`를 씁니다. **둘 다 같은 초록 테마**(= 화이트모드)입니다. 새 화면을 만들 땐 아래 토큰만 쓰세요(임의 색상 X).

### 🌙 다크모드(기본) / ☀️ 화이트모드 — `theme.js`
- 처음 접속하면 **다크모드**. 오른쪽 위 버튼으로 바꾸면 `localStorage`(`exam-summary-theme`)에 저장됩니다. 주소 뒤 `?theme=light` / `?theme=dark` 로 강제 지정도 됩니다.
- **화이트모드 = 원래 초록 디자인 그대로**입니다. theme.js 는 화이트모드일 때 색을 하나도 바꾸지 않습니다.
- **다크모드 = 인스타그램 다크모드 느낌**, 녹색·주황 계열은 쓰지 않습니다.

| 역할 | 색 |
|------|------|
| 페이지 배경 / 카드 | `#0c1014` / `#13171b` |
| 한 단계 뜬 면(헤더·팁·표 머리) | `#1c1f23` |
| **회색 버튼 + 흰 글씨** (목차·주차 버튼·보기·정답 보기) | `#25292e` + `#f5f5f5` |
| **강조 = 파란 버튼 + 흰 글씨** (번호·확인·배지·정답·시험 버튼) | `#0095f6` + `#fff` |
| 보조 글씨 / 흐린 글씨 | `#a8a8a8` / `#737373` |
| 테두리 | `#262a2f` |
| 오답·경고·빨간 글씨 | `#ed4956` (글씨는 `#ff9aa2`) |

- 동작: ① 공용 부품(헤더·카드·목차·표·팁·퀴즈·주차 버튼·첫 화면)은 `theme.js` 의 `DARK_CSS` 에서 색을 직접 지정 ② 그 밖에 페이지에 직접 쓴 색(인라인 `style`·SVG)은 무채색·파랑으로 **자동 변환**(빨강만 유지).
- **새 페이지**: `<head>` 의 `<meta charset>` 바로 다음 줄에 `<script src="theme.js"></script>` (weeks/ 안은 `../theme.js`). 다크 전용 CSS 는 페이지에 따로 쓰지 말고 화이트 기준으로만 작성하세요. 새 공용 부품의 다크 색을 정확히 맞추고 싶으면 `DARK_CSS` 에 `html[data-theme=dark] .클래스{…}` 한 줄을 추가합니다.
- 오른쪽 위(`top:14px; right:14px`, 44px)는 전환 버튼 자리라 고정 UI 를 두지 않습니다. 변환에서 빼고 싶은 요소는 `data-theme-skip` 속성.

### 🎨 소스코드 색 — `codecolor.js` (VS Code Dark High Contrast)
- 모든 `<pre><code>` 를 highlight.js(cdnjs)로 분석해 VS Code 고대비 색으로 칠합니다. 화이트·다크 모드 모두 같은 색(검은 바탕)입니다. theme.js 가 자동으로 불러오니 페이지에 따로 넣지 않습니다.
- 색: 키워드·자료형 `#569cd6` · 흐름 제어(if·for·return) `#c586c0` · 클래스 `#4ec9b0` · 함수 `#dcdcaa` · 변수 `#9cdcfe` · 문자열 `#ce9178` · 숫자 `#b5cea8` · 주석 `#7ca668` · `%d` `#9cdcfe` · `\n` `#d7ba7d`
- 언어: `<code class="language-sql">` 처럼 적으면 그 언어, 없으면 과목 기본 언어(프로그래밍언어실습 c · 자바 java · 웹 html/js/css · 데이터베이스 sql · 운영체제·Git bash · 파이썬·방법론 python)
- 칠하지 않는 블록: 실행 결과 `pre.io` · `pre.py-output` · `language-text`, Git 로그 `pre.lqlog` · `pre.finlog`, `<code>` 없는 `pre`, 그리고 `pre.no-hl`. 블록 안 기존 `<span>`(빈칸 등)은 그대로 둡니다.

### 색 (CSS 변수)
| 변수 | 값 | 용도 |
|------|------|------|
| `--main` | `#2d6a4f` | 메인 초록(제목·강조) |
| `--main-d` | `#1b4d39` | 진한 초록(그라데이션) |
| `--point` | `#d9772b` | 포인트 주황(시험 임박) |
| `--bg` | `#f4f7f4` | 배경 |
| `--card` | `#ffffff` | 카드 |
| `--line` / `--line-2` | `#e6ebe6` / `#dfe5df` | 테두리 |
| `--ink` / `--ink-2` / `--muted` | `#1b241e` / `#5e6b62` / `#9aa69c` | 본문/보조/흐림 글자 |

### 모양·타이포
- 폰트: **Pretendard**(jsDelivr CDN 로드) → `-apple-system, "Apple SD Gothic Neo", "맑은 고딕", system-ui` 폴백
- 모서리: 카드 `--r:18px`, 작은요소 `--r-2:12px`, 알약 `999px`
- 그림자: `--sh-1`(평상) · `--sh-2`(은은) · `--sh-3`(강조/hover)
- 숫자(카운트다운)는 항상 `font-variant-numeric: tabular-nums` (자리 안 흔들림)

### 상태 칩 색 규칙 (위치: 카드/버튼 **오른쪽**)
| 클래스 | 색 | 의미 |
|------|------|------|
| `.pill.soon` / `.cd`(기본) | 주황 | 시험 **임박**(2일 미만) |
| `.pill.wk` / `.cd.wk` | 파랑 | 여유 있음 |
| `.pill.live` / `.cd.live` | 빨강 | 시험 **진행 중** |
| `.pill.fin` | 초록 | 시험 **완료·복습** |

### 카운트다운 표기 (함수는 `index.html` 안에 있음)
- **히어로(개강)**: `[일][시간][분][초]` 4칸 박스 (`seg()`)
- **칩(과목·시험 버튼)**: `D-64 · 07:59:30` 형식 (`chip()`), 1일 미만이면 `07:59:30`

---

## 🧩 컴포넌트 레퍼런스 (복붙용)

### 과목 카드 (허브) — `.subjects` 안에 넣기만 하면 카운트다운·정렬·완료 자동
```html
<a class="subject"
   data-file="새과목.html"               <!-- schedule.js 의 키와 동일 -->
   data-exam="2026-10-19T10:00:00"        <!-- 시험 시작 시각(ISO) -->
   href="새과목.html">
  <span class="subj-ic">🌐</span>          <!-- 아이콘(이모지) -->
  <span class="subj-body">
    <span class="subj-name">과목명</span>
    <span class="subj-desc">한 줄 설명(길면 … 처리)</span>
  </span>
  <span class="subj-state"></span>          <!-- 비워두면 JS가 칩/배지 채움 -->
</a>
```

### 시험 버튼(1학기와 같은 .bigbtn, 오른쪽에 D- 표시)
> 앞 시험이 끝나기 전에는 잠급니다: `data-unlock-after="과목1.html,과목2.html,…"` 를 붙이면 그 과목들의 시험(schedule.js 시작 +3시간)이 **모두** 끝날 때까지 회색(`.soon`)·클릭 불가·`중간고사 후` 표시, 끝나면 자동으로 열립니다. (예: 2학기 기말고사 버튼)
```html
<button class="bigbtn" type="button" data-go="이동할화면id"
        data-exam-target="2026-10-19T09:00:00">
  <span class="bb-ic">📝</span>
  <span class="bb-body"><span class="bb-t">중간고사</span></span>   <!-- 제목만, 세로 가운데 정렬 -->
  <span class="cd">…</span>                  <!-- JS가 D-카운트다운 채움 -->
</button>
```

### 객관식 — `.mcq` (정답 클릭 채점, 복습 시 자동 공개)
```html
<div class="mcq" data-correct="B">
  <p class="mcq-q"><span class="mcq-no">1</span>질문…</p>
  <button class="opt" data-opt="A"><b>A.</b> 보기</button>
  <button class="opt" data-opt="B"><b>B.</b> 보기</button>   <!-- 정답 -->
  <div class="mcq-exp"><b>정답 B</b> — 해설…</div>            <!-- 평소 숨김 -->
</div>
```

### 명령어/단답 주관식 — `.cmdq`
```html
<div class="cmdq" data-answer="git init|git init .">          <!-- | 로 복수 정답 -->
  <div class="cmdq-q"><span class="cmdq-no">1</span>질문…</div>
  <textarea rows="1" placeholder="명령어 입력" spellcheck="false"></textarea>
  <div class="cmdq-btns"><button class="cmdq-btn check">확인</button><button class="cmdq-btn show">정답 보기</button></div>
  <div class="cmdq-fb"></div>
</div>
```
채점 정규화 `cnorm`: **앞뒤 공백 제거 + 연속 공백 1칸 + `'`→`"`**. 띄어쓰기·대소문자·점(.)은 **엄격**(`-d`≠`-D`). 두 줄 답은 공백으로 이어 적으면 됨.

### 빈칸채우기 — `.quiz-item`
```html
<div class="quiz-item" data-answers="정답|동의어" data-full="전체 모범답안">
  <p class="quiz-q">질문…</p>
  <input type="text"> <button class="check">확인</button> <button class="show">정답 보기</button>
  <div class="quiz-feedback"></div>
</div>
```
정규화 `norm`: 소문자 + 공백 제거 + 괄호 제거.

### 복습(`?done=1`) 핸들러 — 과목 페이지 맨 끝, `review.js` **앞에**
```html
<script>
(function(){
  if(!/[?&]done=1/.test(location.search)) return;
  var wrap=document.querySelector('.wrap');
  if(wrap && !document.getElementById('done-banner')){
    var b=document.createElement('div'); b.id='done-banner';
    b.style.cssText='background:#176c3a;color:#fff;border-radius:12px;padding:16px 18px;margin:10px 0 18px;font-weight:800;text-align:center;';
    b.innerHTML='🎉 시험 종료 · <b>복습 모드</b>';
    wrap.insertBefore(b, wrap.firstChild);
  }
  // 객관식 정답 공개
  document.querySelectorAll('.mcq:not(.answered)').forEach(function(q){
    q.classList.add('answered');
    q.querySelectorAll('.opt').forEach(function(o){ if(o.dataset.opt===q.dataset.correct) o.classList.add('correct'); });
    var e=q.querySelector('.mcq-exp'); if(e) e.style.display='block';
  });
  // 주관식(.cmdq) 정답 공개 — 필요한 컴포넌트만 골라서
})();
</script>
```

---

## 🧑‍💻 다음 학기 추가하기

2학기를 1학기와 똑같은 구조로 붙이는 순서입니다. **3곳만** 건드리면 됩니다.

### Step 1 — 과목 페이지 만들기 `2학기-운영체제.html` 등
새 HTML 1개. 머리/꼬리에 공용 자산만 연결하면 테마·기능이 자동으로 붙습니다.
```html
<head>
  <meta charset="UTF-8">
  <script src="theme.js"></script>        <!-- 다크(기본)/화이트 전환 — 반드시 맨 위 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>운영체제 기말 완전정리</title>
  <link rel="stylesheet" href="style.css">
  <script src="schedule.js"></script>      <!-- 시험 +3h 자동 복습 -->
</head>
<body>
<div class="wrap">
  <a class="back-link" href="index.html#sem2-final">← 과목 선택으로 돌아가기</a>
  <!-- 본문: 정리 + 위 컴포넌트(.mcq/.cmdq/.quiz-item)로 퀴즈 -->
  <!-- (맨 끝) 복습 핸들러 → review.js -->
  <script>/* ?done=1 핸들러 (위 스니펫) */</script>
  <script src="review.js"></script>
</div>
</body>
```

### Step 2 — `schedule.js` 에 시험일 1줄 추가
```js
window.EXAM_SCHEDULE = {
  ...,
  "2학기-운영체제.html": "2026-10-19T10:00:00",   // 파일명 → 시험 시작 ISO
};
```
이것만으로 +3h 자동 복습 + 허브 카드 상태 계산이 동작합니다.

### Step 3 — `index.html` 2학기 화면 채우기
`#sem2-mid` / `#sem2-final` 에는 **이미 빈 `.subjects` 컨테이너**(`#sem2-mid-list` / `#sem2-final-list`)가 들어 있습니다. 여기에 '과목 카드'를 넣고, 바로 아래 “준비 중” `.ph` 블록만 지우면 끝입니다. `tickHub()` 는 페이지의 **모든 `.subjects`** 를 자동 처리하므로 추가 JS가 필요 없습니다.
```html
<section class="screen" id="sem2-mid" hidden>
  <div class="head">
    <button class="backbtn" data-back="sem2">‹ 1학년 2학기</button>
    <h1>2학기 중간고사</h1><div class="sub" id="sem2-mid-cd">—</div>
  </div>
  <div class="subjects" id="sem2-mid-list">
    <!-- ↑ '과목 카드' 컴포넌트들을 여기 나열 (data-file / data-exam 필수) -->
  </div>
  <!-- 카드를 넣었으면 아래 .ph(준비 중) 블록은 삭제 -->
</section>
```
> 시험 **날짜·시간**을 바꾸려면 `index.html` 상단 JS의 `DDAY = { open, mid, final }` 와 `schedule.js` 두 곳을 맞춰주세요. 새 화면을 추가했다면 `SCREENS` 배열에도 id를 넣습니다.

### Step 4 — 검증 체크리스트
- [ ] 허브 카드에 D-카운트다운/“✅ 복습”이 뜨고 1초마다 갱신
- [ ] 시험일 지난 과목 직접 접속 → 자동 `?done=1` + 정답 공개
- [ ] 퀴즈 정답/오답 채점 정확(`cnorm`·`norm` 규칙)
- [ ] 모바일(≤640px)에서 카드가 1열로 정렬

---

## 📅 "이번 주차 정리해줘" 요청 시 기본 작업 (★ 퀴즈 포함)

학기 중에는 "<과목> N주차 정리해줘" 라고만 말합니다. 아래는 **따로 말하지 않아도 매번 같이 해야 하는 것**입니다. 특히 **6번 주차 페이지와 7번 퀴즈 추가를 빠뜨리지 마세요.**

1. **원본 대조 — 내가 쓴 필기 찾기**
   주차 폴더의 `[강의요약(원본)] N주차.txt` 와 `[강의요약] N주차.txt`(또는 필기 파일)를 비교해 **원본에 없고 내가 수업 중에 추가한 부분**을 찾아내고, 정리에서 ✍️ 로 표시합니다.
2. **강의자료 직접 읽기 — 시험범위 풀어쓰기**
   필기에 "몇 페이지" 형태로 적힌 시험범위는 해당 PDF를 **직접 열어 그 페이지 내용**으로 풀어 쓰고 ★ 로 강조합니다. (그림만 있는 슬라이드는 이미지로 확인)
3. **필기 오류 정정**
   필기가 강의자료와 다르면 ⚠️ 로 **무엇이 어떻게 틀렸는지** 함께 적습니다. 원본 필기는 지우지 말고 토글·원문에 그대로 보존합니다.
4. **노션** — 그 과목의 **기존 주차 페이지를 덮어쓰기**(새로 만들지 않음). 맨 아래 토글에 필기 원본을 그대로 넣습니다.
5. **사이트 과목 페이지** — `<section class="card" id="sN">` 섹션을 이어서 추가하고, `.toc` 링크와 `page-head` 의 "1주차 ~ N주차" 문구도 같이 갱신합니다.
6. **주차 페이지 ★ 굳이 말하지 않아도 반드시** — 과목 페이지의 1~15주차 버튼이 이 페이지를 새 탭으로 엽니다.
   - 노션 N주차 페이지 내용을 `weeks/src/<과목>-N주차.md` 로 옮깁니다 (첫 줄 `# 주차 제목`, 형식은 `scripts/build_weeks.py` 맨 위 설명). 원본 터미널 로그처럼 긴 출력은 노션에만 둡니다.
   - 그 주차의 시험 포인트(교수님이 시험에 낸다고 한 것 · ★ · 빨간 글씨)를 `weeks/src/<과목>-8주차-중간고사.md` 에 주차 섹션으로 추가하고 제목의 "1~N주차 반영" 도 고칩니다. (9주차부터는 `-15주차-기말고사.md`)
   - `python3 scripts/build_weeks.py` 실행 → `weeks/*.html` 이 만들어지고, 원고가 있는 주차 버튼이 자동으로 열립니다. `weeks.js` 의 DATA 부분은 손으로 고치지 않습니다.
7. **퀴즈 추가 ★ 굳이 말하지 않아도 반드시**
   그 주차 내용으로 **객관식 5 · 주관식 5** 를 `#quiz` 섹션에 이어서 추가합니다.
   - 번호는 기존 다음 번호로 이어서 (`.mcq-no` 와 `주관식 N`)
   - `<h2>` 의 "객관식 N · 주관식 N" 숫자와 `.week` 라벨(예: `1~4주차`)도 함께 수정
   - **배운 범위 안에서만 출제 ★** — 문항의 근거는 ① 그 주차까지의 **강의자료(PDF·실습 파일·교수님 메모)** ② **노션 주차 페이지(수업 중 원본 필기 토글 포함)** ③ **사이트 정리 본문** 중 하나에 반드시 있어야 합니다. 강의자료에 없어도 수업 필기에 있으면 배운 내용입니다(예: C 3주차 char 범위 · `%x` 는 필기에만 있음). 출제 전에 해당 용어를 자료에서 검색해 확인하고, **근거가 없으면 내지 않습니다**(일반 지식으로 지어내지 않기). 배우지 않은 내용은 시험 공부에 도움이 되지 않습니다.
   - **기존 문항과 중복 금지** · 교수님이 시험에 나온다고 한 내용 우선
   - 강의자료의 빈칸·퀴즈 슬라이드는 별도 섹션에 `.quiz-item` 으로 만들어도 좋습니다 (점수는 `#quiz` 안의 문항만 집계됨)
8. **확인 후 커밋·푸시 (묻지 않고 알아서)**
   `python3 -m http.server` 로 띄워 ① 모든 문항이 정답·오답 채점되는지 ② 폰 폭 375px 에서 표가 눌리지 않는지 확인한 뒤, **사용자에게 묻지 않고** 커밋해서 `main` 에 push 하고 결과만 알립니다.

```
[주차 정리 프롬프트]
<과목> N주차 정리해줘.
- 주차 폴더의 강의요약(원본)과 강의요약을 대조해서 내가 필기한 것 찾기
- 필기에 적힌 시험범위 페이지는 강의자료 PDF를 읽고 내용으로 풀어서 ★강조
- 노션은 기존 N주차 페이지에 덮어쓰기
- 사이트에 섹션 추가 + weeks/src 주차 원고·8주차 시험 포인트 추가 후 build_weeks.py + #quiz 에 그 주차 객관식 5 · 주관식 5 추가(README "주차 정리 요청 시 기본 작업" 규칙대로)
```

---

## 🤖 AI로 개발하기 (복붙 프롬프트)

새 과목/학기를 만들 때 아래를 그대로 AI에게 주면 형식이 맞춰집니다.

```
이 저장소는 정적 시험정리 웹앱이야. README의 "디자인 시스템 / 컴포넌트 레퍼런스 / 다음 학기 추가하기"를 규칙으로 삼아줘.

[할 일] "<과목명>" 기말 정리 페이지(<파일명>.html)를 만들어줘.
- <head> 맨 위(meta charset 다음)에 theme.js, 이어서 style.css + schedule.js 연결, .wrap 안에 back-link(href="index.html#sem2-final")
- 본문은 핵심 개념 정리 + 퀴즈: 객관식 .mcq, 단답 .cmdq, 빈칸 .quiz-item 컴포넌트만 사용
- 맨 끝에 ?done=1 복습 핸들러 + review.js
- 색/모서리/그림자는 README 디자인 토큰만 사용(임의 색 금지), 카운트다운 칩 색 규칙 준수
그리고 schedule.js의 EXAM_SCHEDULE에 "<파일명>.html": "<시험 시작 ISO>" 추가,
index.html의 #sem2-* 화면에 이 과목의 '과목 카드'(.subjects 안)를 넣어줘.

[시험 일정] 개강·중간·기말 날짜: <여기에 기입>
```

---

## 라이선스 / 크레딧
학습용 개인 프로젝트 · © 2026 윤희근
