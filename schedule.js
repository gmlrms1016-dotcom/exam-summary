/* =====================================================================
   schedule.js  ·  전 과목 공통 시험 일정 + 자동 '시험 완료(복습)' 전환
   - 시험 시작 시각 + 3시간이 지나면(EXAM_GRACE_MS) 그 과목은 '시험 완료'로 간주
   - 과목 페이지에서 이 파일을 <head>에 넣으면, 시험 종료 시 자동으로
     ?done=1 (복습 모드)로 전환됨 → 각 페이지의 기존 done 처리(정답 공개)가 동작
   - index.html 은 EXAM_SCHEDULE / isExamFinished 를 읽어 카드 상태를 자동 계산
   ===================================================================== */
(function () {
    "use strict";

    // 과목 파일명 → 시험 '시작' 시각 (1학년 1학기 기말)
    window.EXAM_SCHEDULE = {
        "프로그래밍방법론.html": "2026-06-22T10:00:00",
        "SW개발도구활용.html":   "2026-06-22T14:00:00",
        "컴퓨터공학기초.html":   "2026-06-18T10:00:00",
        "파이썬프로그래밍.html": "2026-06-19T10:00:00",
        "웹프로그래밍기초.html": "2026-06-20T10:00:00"
    };

    // 시험 시작 + 3시간 → '완료(복습)'로 전환
    window.EXAM_GRACE_MS = 3 * 60 * 60 * 1000;

    window.examStartMs = function (file) {
        var iso = window.EXAM_SCHEDULE[file];
        return iso ? new Date(iso).getTime() : NaN;
    };
    // 시험 시작 + 3시간이 지났는가?
    window.isExamFinished = function (file) {
        var start = window.examStartMs(file);
        return !isNaN(start) && Date.now() >= start + window.EXAM_GRACE_MS;
    };

    // ---- 과목 페이지: 시험 종료(+3h)면 자동으로 복습(done) 모드로 ----
    try {
        var file = decodeURIComponent((location.pathname.split("/").pop() || ""));
        if (window.EXAM_SCHEDULE[file] && window.isExamFinished(file) && !/[?&]done=1/.test(location.search)) {
            var qs = location.search ? location.search + "&done=1" : "?done=1";
            history.replaceState(null, "", location.pathname + qs + location.hash);
        }
    } catch (e) { /* file:// 등에서 pathname 접근 실패해도 무시 */ }
})();
