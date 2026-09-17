/* =====================================================================
   weeks.js  ·  2학기 과목 페이지의 1~15주차 버튼
   - <div id="week-nav" data-subject="과목명"></div> 자리에 버튼 15개를 그림
   - 진도가 나간 주차(= weeks/ 에 주차 페이지가 있는 주차)만 열리고, 나머지는 잠김
   - 8주차 = 중간고사 시험문제 정리 · 15주차 = 기말고사
   - 누르면 주차 페이지가 새 탭(_blank)으로 열림
   - 아래 DATA 부분은 scripts/build_weeks.py 가 weeks/src/*.md 를 보고 자동으로 채움 (직접 고치지 마세요)
   사용: 과목 페이지 맨 끝에 <script src="weeks.js"></script>
   ===================================================================== */
(function () {
    "use strict";

    /* DATA:BEGIN */
    var WEEK_DATA = {
        "프로그래밍언어실습": { 1: "강의소개 / C 개요", 2: "C 기본 실습 (ch02)", 3: "변수·상수·자료형 (ch03)", 8: "중간고사 시험문제 정리 (1~3주차 반영)" },
        "운영체제실습": { 1: "리눅스 환경 / 기본 명령어", 2: "리눅스 명령어 실습", 3: "마운트 · 링크 · 권한 · 사용자관리", 4: "사용자·그룹 관리 · rpm·dnf 패키지 설치", 8: "중간고사 시험문제 정리 (1~4주차 반영)" },
        "웹프로그래밍": { 1: "강좌 OT / 웹 개요", 2: "<9월 1일> 실행단계·이벤트·함수·객체", 3: "<9월 8일> 변수·자료형·형변환·객체", 4: "<9월 15일> 연산자·truthy/falsy·단락 평가", 8: "중간고사 시험문제 정리 (1~4주차 반영)" },
        "데이터베이스관리": { 1: "강의소개 / DB 개념", 2: "DB 정의·특징 / MySQL 실습", 3: "DBMS·데이터언어·기본키", 4: "관계형 데이터 모델·기본키/외래키·스키마", 8: "중간고사 시험문제 정리 (1~4주차 반영)" },
        "자바프로그래밍": { 1: "강의소개 / 첫 프로그램", 2: "1장 자바 개요", 3: "2장 자료형·연산자·조건문", 4: "2장 실습 + 3장 반복문·배열·예외처리", 8: "중간고사 시험문제 정리 (1~4주차 반영)" }
    };
    /* DATA:END */

    var EXAMS = { 8: "중간고사", 15: "기말고사" };

    var css = ""
        + "#week-nav{margin:0 0 18px;}"
        + ".wk-card h2{display:flex;align-items:center;flex-wrap:wrap;gap:8px;}"
        + ".wk-lead{margin:0 0 12px;font-size:13.5px;color:#5e6b62;}"
        + ".wk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px;}"
        + ".wk-btn{display:flex;flex-direction:column;gap:3px;min-height:74px;padding:10px 12px;border:1px solid var(--line);"
        + "border-radius:12px;background:var(--card);color:var(--ink);text-decoration:none;text-align:left;font:inherit;"
        + "transition:transform .12s,border-color .12s,box-shadow .12s;}"
        + "a.wk-btn:hover{transform:translateY(-2px);border-color:var(--main);box-shadow:0 6px 14px rgba(0,0,0,.08);}"
        + ".wk-btn b{font-size:15px;color:var(--main);}"
        + ".wk-btn small{font-size:12px;line-height:1.45;color:#5e6b62;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}"
        + ".wk-btn.exam{border-color:var(--point);background:#fff8e6;}"
        + ".wk-btn.exam b{color:var(--point);}"
        + ".wk-btn.locked{cursor:not-allowed;background:#f1f3f1;border-style:dashed;opacity:.72;}"
        + ".wk-btn.locked b{color:#8a948c;}"
        + ".wk-btn.locked small{color:#8a948c;}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    function esc(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function fileName(subject, week) {
        return "weeks/" + subject + "-" + week + "주차" + (EXAMS[week] ? "-" + EXAMS[week] : "") + ".html";
    }

    function render(box) {
        var subject = box.getAttribute("data-subject");
        var weeks = WEEK_DATA[subject] || {};
        var done = Object.keys(weeks).map(Number).filter(function (w) { return !EXAMS[w]; });
        var last = done.length ? Math.max.apply(null, done) : 0;
        var html = '<section class="card wk-card">'
            + '<h2>📅 주차별로 보기<span class="week">' + (last ? last + "주차까지 진도" : "진도 전") + "</span></h2>"
            + '<p class="wk-lead">진도가 나간 주차만 열려요. 누르면 그 주차에 배운 내용(노션 정리)이 <b>새 탭</b>으로 열립니다.</p>'
            + '<div class="wk-grid">';
        for (var w = 1; w <= 15; w++) {
            var title = weeks[w];
            var exam = EXAMS[w];
            var label = w + "주차";
            if (title) {
                html += '<a class="wk-btn' + (exam ? " exam" : "") + '" href="' + esc(encodeURI(fileName(subject, w)))
                    + '" target="_blank" rel="noopener">'
                    + "<b>" + label + (exam ? " · " + exam : "") + "</b>"
                    + "<small>" + esc(exam ? "📝 " + exam + " 시험문제 정리" : title) + "</small></a>";
            } else {
                html += '<button class="wk-btn locked' + (exam ? " exam" : "") + '" type="button" disabled aria-disabled="true" title="아직 진도가 나가지 않았어요">'
                    + "<b>🔒 " + label + (exam ? " · " + exam : "") + "</b>"
                    + "<small>" + (exam ? "시험 준비 전" : "아직 진도 전") + "</small></button>";
            }
        }
        html += "</div></section>";
        box.innerHTML = html;
        box.addEventListener("click", function (e) {
            var locked = e.target.closest && e.target.closest(".wk-btn.locked");
            if (locked) { e.preventDefault(); e.stopPropagation(); }
        });
    }

    function init() {
        var box = document.getElementById("week-nav");
        if (box) render(box);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
