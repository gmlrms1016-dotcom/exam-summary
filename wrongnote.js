/* =====================================================================
   wrongnote.js  ·  📕 오답노트 — 전 과목 공용 (theme.js 가 모든 페이지에서 불러옴 · 2026-11-26)
   사용자: “전공사이트에 더 구현하면 좋은 순으로 10가지” → “1,2해줘” (2번 = 오답노트 — 전 과목 · 계속 저장)
   - 틀린 문제를 이 기기(localStorage "wrongnote:v1")에 계속 모으고, 다시 맞히면 뺌
       · 객관식(.mcq) · 빈칸(.quiz-item) · 출력 결과(.oq) · 코딩테스트(.ct)
         → 채점 스크립트(quiz.js · outquiz.js · codetest.js)가 남기는 표시(.opt.wrong · data-wrong · data-solved)를 지켜봄
       · 📗 엑셀 ✏️ 표 · 🎲 변형 문제 → 그 스크립트가 window.wrongNote.record / solve 를 직접 부름
       · ‘정답 보기’를 먼저 누른 문제도 몰랐던 문제로 담음 (review.js 와 같은 기준)
   - 오답노트.html = 과목별로 모아 보기 · 문제로 가기(주소 끝 #wn=키 → 그 문제로 스크롤 + 깜빡임) · AI 에게 비슷한 문제 받기(복사)
     · 내보내기 / 가져오기 (학교 PC 는 끄면 초기화 → 집 맥 · 아이패드로 옮길 때)
   - 실제시험 페이지(…-실제시험.html)는 건드리지 않음
   ===================================================================== */
(function () {
    "use strict";
    if (window.wrongNote) return;
    var KEY = "wrongnote:v1";
    var me = (document.currentScript && document.currentScript.src) || "";
    var ROOT = me.replace(/wrongnote\.js(\?.*)?$/, "");
    var EXAM = /-실제시험\.html$/.test(decodeURIComponent(location.pathname));
    var DONE = /[?&]done=1/.test(location.search);   // 시험이 끝난 과목의 복습 모드 = 정답이 모두 공개됨 → 감지 안 함 (자동으로 채운 답이 오답노트를 지우지 않게)
    var SUBJ = ["프로그래밍언어실습", "운영체제실습", "웹프로그래밍 기초", "웹프로그래밍기초", "웹프로그래밍", "데이터베이스관리",
                "자바프로그래밍", "컴퓨터공학기초", "파이썬프로그래밍", "프로그래밍방법론", "SW개발도구활용",
                "공동체와배려의실천", "기업가정신과창업", "인공지능과뇌인지과학"];   // 교양 사이트도 같은 theme.js 를 씀

    function subject() {
        var t = document.title || "";
        for (var i = 0; i < SUBJ.length; i++) if (t.indexOf(SUBJ[i]) >= 0) return SUBJ[i].replace(" ", "");
        return "기타";
    }
    function pagePath() {
        var h = location.href.split("#")[0].split("?")[0];
        try { if (ROOT && h.indexOf(ROOT) === 0) return decodeURIComponent(h.slice(ROOT.length)); } catch (e) { }
        return decodeURIComponent(location.pathname.replace(/^\//, ""));
    }
    function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || "{}"); return d && typeof d === "object" ? d : {}; } catch (e) { return {}; } }
    function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } }
    function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
    function clip(s, n) { s = String(s == null ? "" : s).replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim(); return s.length > n ? s.slice(0, n) + " …" : s; }
    function txt(el) { return el ? String(el.innerText || el.textContent || "").trim() : ""; }

    var P = pagePath(), S = subject();
    function full(k) { return P + "::" + k; }

    // ---- 알림 (여러 개가 한꺼번에 바뀌어도 한 번만) ----
    var pend = { add: 0, del: 0 }, pendT = null;
    function toast() {
        clearTimeout(pendT);
        pendT = setTimeout(function () {
            var m = [];
            if (pend.add) m.push("📕 오답노트에 " + pend.add + "문제 담았어요");
            if (pend.del) m.push("다시 맞힌 " + pend.del + "문제는 뺐어요");
            pend.add = pend.del = 0;
            if (m.length && window.moToast) window.moToast(m.join(" · "));
        }, 350);
    }
    function countAll(d) { return Object.keys(d || load()).length; }
    function badge() {
        var n = countAll();
        [].forEach.call(document.querySelectorAll("[data-wn-count]"), function (el) { el.textContent = n ? n + "문제" : "비어 있음"; });
    }

    function record(o) {
        if (EXAM || !o || !o.key) return;
        var d = load(), id = full(o.key), it = d[id] || { n: 0, first: Date.now() };
        var isNew = !d[id];
        it.s = o.subject || S; it.p = P; it.k = o.key; it.kind = o.kind || ""; it.title = clip(document.title, 90);
        it.q = clip(o.q, 2400); it.ans = clip(o.ans, 2000); it.my = clip(o.my, 1200); it.ex = clip(o.ex || "", 600);
        it.n = (it.n || 0) + 1; it.t = Date.now();
        d[id] = it; save(d);
        if (isNew) { pend.add++; toast(); }
        badge();
    }
    function solve(k) {
        if (EXAM || !k) return;
        var d = load(), id = full(k);
        if (d[id]) { delete d[id]; save(d); pend.del++; toast(); badge(); }
    }

    // ---- 문제마다 키 (id 가 있으면 id · 없으면 문제 글의 해시 + 같은 글이 또 있으면 순서) ----
    var KINDS = { mcq: ".mcq", quiz: ".quiz-item", oq: ".oq", ct: ".ct" };
    var QSEL = { mcq: ".mcq-q", quiz: ".quiz-q", oq: ".oq-q", ct: ".ct-q, .ct-title, h3, h4, p" };
    var keyMap = typeof WeakMap !== "undefined" ? new WeakMap() : null;
    function buildKeys(kind) {
        var seen = {};
        [].forEach.call(document.querySelectorAll(KINDS[kind]), function (el) {
            var base = el.id ? kind + ":" + el.id : kind + ":" + hash(clip(txt(el.querySelector(QSEL[kind]) || el), 400));
            var n = seen[base] = (seen[base] || 0) + 1;
            keyMap && keyMap.set(el, n > 1 ? base + "~" + n : base);
        });
    }
    function keyFor(el, kind) {
        if (!keyMap) return kind + ":" + hash(txt(el).slice(0, 400));
        if (!keyMap.has(el)) buildKeys(kind);
        return keyMap.get(el) || kind + ":" + hash(txt(el).slice(0, 400));
    }

    // ---- 문제 내용 뽑기 ----
    function stem(qel) {                               // 문제 글 (번호 · 분류 꼬리표는 앞에 따로)
        if (!qel) return "";
        var c = qel.cloneNode(true), tag = "";
        [].forEach.call(c.querySelectorAll(".mcq-no, .quiz-cat, .oq-no, .oq-tag"), function (x) { tag += (tag ? " · " : "") + txt(x); x.remove(); });
        return (tag ? "[" + tag + "] " : "") + txt(c);
    }
    function codeOf(el) { var c = el.querySelector("pre code, pre"); return c ? (c.textContent || "").replace(/\s+$/, "") : ""; }
    function recMcq(q, picked) {
        var correct = q.dataset.correct, right = "";
        var opts = [].map.call(q.querySelectorAll(".opt"), function (o) {
            var t = txt(o).replace(/\s*[✓✗]\s*(정답)?\s*$/, "");
            if (o.dataset.opt === correct) right = t;
            return t;
        });
        var code = codeOf(q);
        record({
            key: keyFor(q, "mcq"), kind: "객관식",
            q: stem(q.querySelector(".mcq-q")) + (code ? "\n" + code : "") + "\n" + opts.join("\n"),
            ans: "정답: " + right + (txt(q.querySelector(".mcq-exp")) ? "\n" + txt(q.querySelector(".mcq-exp")) : ""),
            my: picked ? txt(picked).replace(/\s*[✓✗]\s*(정답)?\s*$/, "") : ""
        });
    }
    function recQuiz(it) {
        var inp = it.querySelector("input, textarea");
        record({
            key: keyFor(it, "quiz"), kind: "빈칸",
            q: stem(it.querySelector(".quiz-q")) + (codeOf(it) ? "\n" + codeOf(it) : ""),
            ans: "정답: " + (it.dataset.full || (it.dataset.answers || "").split("|")[0]),
            ex: it.dataset.explain || "",
            my: inp ? inp.value : ""
        });
    }
    function recOq(p) {
        var ex = p.querySelector(".oq-expect"), ta = p.querySelector("textarea");
        record({
            key: keyFor(p, "oq"), kind: "출력 결과",
            q: stem(p.querySelector(".oq-q")) + "\n" + codeOf(p),
            ans: "실행 결과:\n" + (ex ? ex.textContent.replace(/^\n+|\s+$/g, "") : ""),
            ex: txt(p.querySelector(".oq-why")),
            my: ta ? ta.value : ""
        });
    }
    function recCt(p) {
        var ans = p.querySelector(".ct-answer"), ta = p.querySelector("textarea");
        var q = txt(p.querySelector(QSEL.ct)) || txt(p).slice(0, 300);
        record({
            key: keyFor(p, "ct"), kind: "코딩테스트",
            q: q, ans: ans ? "정답 코드:\n" + ans.textContent.replace(/^\n+|\s+$/g, "") : "",
            my: ta ? ta.value : ""
        });
    }

    function watch() {
        if (EXAM || DONE || !document.body) return;
        // 객관식: 보기를 누른 뒤 (quiz.js 가 표시한 다음) 확인
        document.addEventListener("click", function (e) {
            var o = e.target.closest && e.target.closest(".mcq .opt");
            if (!o) return;
            var q = o.closest(".mcq");
            setTimeout(function () {
                if (!q.classList.contains("answered") || q.__wnDone) return;
                q.__wnDone = 1;
                var bad = q.querySelector(".opt.wrong");
                if (bad) recMcq(q, bad); else solve(keyFor(q, "mcq"));
            }, 0);
        });
        if (typeof MutationObserver === "undefined") return;
        new MutationObserver(function (list) {
            list.forEach(function (m) {
                var el = m.target, a = m.attributeName, v = el.getAttribute(a);
                if (!el.classList) return;
                if (el.classList.contains("quiz-item")) {
                    if (a === "data-solved" && v === "1") solve(keyFor(el, "quiz"));
                    else if (a === "data-wrong" && v === "1") recQuiz(el);
                } else if (el.classList.contains("oq")) {
                    if (a === "data-solved" && v === "1") solve(keyFor(el, "oq"));
                    else if (a === "data-wrong" && v === "1") recOq(el);
                } else if (el.classList.contains("ct") && a === "data-wrong") {
                    if (v === "1") recCt(el); else if (m.oldValue === "1") solve(keyFor(el, "ct"));
                }
            });
        }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-wrong", "data-solved"], attributeOldValue: true });
    }

    // ---- 오답노트에서 “문제로 가기” → #wn=키 ----
    function jump() {
        var m = /^#wn=(.+)$/.exec(location.hash || "");
        if (!m) return;
        var k = decodeURIComponent(m[1]), el = null;
        try { el = document.querySelector('[data-wn="' + k.replace(/["\\]/g, "\\$&") + '"]'); } catch (e) { }
        if (!el) Object.keys(KINDS).some(function (kind) {
            return [].some.call(document.querySelectorAll(KINDS[kind]), function (x) { if (keyFor(x, kind) === k) { el = x; return true; } return false; });
        });
        if (!el) { if (window.moToast) window.moToast("📕 이 문제를 찾지 못했어요 — 내용이 바뀌었을 수 있어요"); return; }
        try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { el.scrollIntoView(); }
        el.classList.add("wn-flash");
        setTimeout(function () { el.classList.remove("wn-flash"); }, 2600);
    }

    var css = document.createElement("style");
    css.setAttribute("data-theme-skip", "");
    css.textContent = "@keyframes wnflash{0%,100%{box-shadow:0 0 0 0 rgba(217,119,43,0)}30%,70%{box-shadow:0 0 0 4px rgba(217,119,43,.85)}}"
        + ".wn-flash{animation:wnflash 1.2s ease-in-out 2;border-radius:6px;}";
    (document.head || document.documentElement).appendChild(css);

    function start() {
        watch(); badge();
        if (/^#wn=/.test(location.hash || "")) window.addEventListener("load", function () { setTimeout(jump, 700); });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

    window.wrongNote = {
        record: record, solve: solve, hash: hash,
        all: load,
        replaceAll: function (d) { save(d || {}); badge(); },
        remove: function (id) { var d = load(); delete d[id]; save(d); badge(); },
        root: ROOT, page: P, subject: S
    };
})();
