/* =====================================================================
   ux.js  ·  쓰기 편하게 다듬는 작은 것들 — 전 페이지 공용 (디자인 · 색은 그대로, 2026-10-26)
   - 페이지에 따로 넣지 않습니다. theme.js 가 같은 ?v= 로 불러옵니다.
   하는 일
     ① 아이폰 · 아이패드: 퀴즈 · 코드 입력칸을 누르면 화면이 확 커지던 것 막기
        — 사파리는 입력칸 글자가 16px 보다 작으면 확대함 → 글자 크기는 그대로 두고 viewport 에 maximum-scale=1
          (iOS 10 이후는 이 값이 있어도 두 손가락 확대는 그대로 됨 · 안드로이드 · PC 에는 넣지 않음)
     ② 작은 버튼 · 링크의 누르는 영역만 보이지 않게 넓힘 — 코드 ⧉ 복사 · 학사일정 ◀ ▶ · 더보기 · 💡 정답 보기 접기 ·
        주차 페이지 맨 위 ← 링크 (모양 · 위치는 그대로)
     ③ 버튼 · 보기 · 접기를 빠르게 두 번 눌러도 화면이 확대되지 않게 (touch-action: manipulation)
     ④ 아이폰을 가로로 돌렸을 때 글자가 저절로 커지지 않게 (text-size-adjust) · 애니메이션 중 페이지가 옆으로 밀리지 않게 (overflow-x: clip)
     ⑤ 키보드(Tab)로 다닐 때만 보이는 포커스 테두리 — 링크 · 접기 (마우스 · 터치로는 안 보임)
     ⑥ 탭 아이콘(favicon.svg) · 홈 화면 아이콘(icon-180.png) · 브라우저 위쪽 색 = 페이지 배경색 (다크 · 라이트를 따라감)
     ⑦ 답 · 코드 입력칸: 폰 자판의 첫 글자 대문자 · 자동 고침 · 맞춤법 밑줄 끄기 (int → Int · printf → print 처럼 바뀌지 않게)
        · 한 줄 입력칸은 자판 Enter 키가 '완료' — 페이지가 이미 정해 둔 값은 그대로 (quiz.js · outquiz.js 와 같은 규칙)
     ⑧ 폰 설명표(table.ref) 칸 안 코드: 10자 이하 낱말(SELECT · HAVING · PRIMARY KEY)은 낱말 중간에서 안 끊김 ·
        11자 이상 긴 낱말만 끊어도 읽기 좋은 자리(. ( , / _ = 뒤 · addEvent|Listener)에서 끊김 (2026-11-04)
   ===================================================================== */
(function () {
    "use strict";
    if (window.__examUX) return;
    window.__examUX = true;

    var root = document.documentElement;
    var selfSrc = (document.currentScript && document.currentScript.src) || "";
    var base = selfSrc.replace(/ux\.js(\?[^#]*)?(#.*)?$/, "");          // 사이트 맨 위 폴더 (weeks/ · 교양 페이지에서도 맞게)
    function head() { return document.head || root; }

    // ① 아이폰 · 아이패드 입력칸 확대 막기
    var iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    function fixViewport() {
        if (!iOS) return true;
        var vp = document.querySelector('meta[name="viewport"]');
        if (!vp) return false;
        if (!/maximum-scale/.test(vp.content)) vp.content = vp.content + ", maximum-scale=1";
        return true;
    }

    // ②~⑤
    var css = [
        "html{-webkit-text-size-adjust:100%;text-size-adjust:100%}",
        "body{overflow-x:clip}",                                      // 화면 전환 · 카드 등장 애니메이션 중에 폰에서 페이지가 옆으로 밀리지 않게 (표 · 코드는 자기 안에서 가로 스크롤)
        "a,button,summary,label,select,.opt,[role=button],input[type=checkbox],input[type=radio]{touch-action:manipulation}",
        ".codecopy>.cc-btn::after{content:'';position:absolute;inset:-10px -8px}",
        ".haksa-arrow,.haksa-more{position:relative}",
        ".haksa-arrow::after{content:'';position:absolute;inset:-8px}",
        ".haksa-more::after{content:'';position:absolute;inset:-8px -6px}",
        ".wk-details>summary{position:relative}",
        ".wk-details>summary::after{content:'';position:absolute;inset:-10px -14px -4px}",
        ".wk-bar>a{padding:10px 0}",                                  // 글줄 안의 링크라 위아래 여백은 자리를 차지하지 않고 누르는 영역만 넓힘
        "a:focus-visible,summary:focus-visible{outline:2.5px solid #2d6a4f;outline-offset:2px;border-radius:4px}",
        "html[data-theme=dark] a:focus-visible,html[data-theme=dark] summary:focus-visible{outline-color:#0095f6}"
    ].join("");
    var st = document.createElement("style");
    st.id = "ux-css";
    st.setAttribute("data-theme-skip", "");                          // 다크 변환이 색을 다시 건드리지 않게 (다크 색은 위에서 직접)
    st.textContent = css;
    head().appendChild(st);

    // ⑥ 아이콘 · 위쪽 색
    function link(rel, href, extra) {
        if (document.querySelector('link[rel="' + rel + '"]')) return;
        var l = document.createElement("link");
        l.rel = rel; l.href = base + href;
        if (extra) Object.keys(extra).forEach(function (k) { l.setAttribute(k, extra[k]); });
        head().appendChild(l);
    }
    var tc = null, tcLight = null;
    function themeColor() {
        if (!tc) {
            tc = document.querySelector('meta[name="theme-color"]');
            if (tc) tcLight = tc.getAttribute("content");              // 페이지가 정해 둔 색(첫 화면 초록)은 라이트에서 그대로
            else { tc = document.createElement("meta"); tc.name = "theme-color"; head().appendChild(tc); }
        }
        var dark = root.getAttribute("data-theme") === "dark", c = "#0c1014";
        if (!dark) {
            c = tcLight;
            if (!c && document.body) {
                c = getComputedStyle(document.body).backgroundColor;
                if (!c || c === "transparent" || /rgba\(0, 0, 0, 0\)/.test(c)) c = getComputedStyle(root).backgroundColor;
            }
        }
        if (c && tc.getAttribute("content") !== c) tc.setAttribute("content", c);
    }
    function heads() {
        link("icon", "favicon.svg", { type: "image/svg+xml" });
        if (!document.querySelector('link[rel="icon"][sizes]')) { var p = document.createElement("link"); p.rel = "icon"; p.href = base + "favicon-32.png"; p.setAttribute("sizes", "32x32"); head().appendChild(p); }
        link("apple-touch-icon", "icon-180.png");
        if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
            var m = document.createElement("meta"); m.name = "apple-mobile-web-app-title"; m.content = "학습 정리"; head().appendChild(m);
        }
        themeColor();
    }

    // ⑦ 답 · 코드 입력칸 (실제시험처럼 문제가 나중에 들어오는 페이지는 누르는 순간에 맞춤)
    var FIELD = "input[type=text],input:not([type]),input[type=search],textarea";
    function tame(el) {
        if (!el || !el.matches || !el.matches(FIELD) || (el.closest && el.closest(".ink-ui"))) return;
        if (!el.hasAttribute("autocapitalize")) el.setAttribute("autocapitalize", "off");
        if (!el.hasAttribute("autocorrect")) el.setAttribute("autocorrect", "off");
        if (!el.hasAttribute("spellcheck")) el.setAttribute("spellcheck", "false");
        if (el.tagName === "INPUT" && !el.hasAttribute("enterkeyhint")) el.setAttribute("enterkeyhint", "done");
    }
    document.addEventListener("focusin", function (e) { tame(e.target); }, true);

    // ⑧ 폰 표 칸 안 코드 — 전에는 style.css 600px 의 table.ref td code { overflow-wrap: anywhere } 가 모든 코드의 최소 폭을
    //    한 글자로 만들어서 표가 짧은 낱말 칸을 찌그러뜨림 (SELEC/T · HAVIN/G) → 이제 낱말(띄어쓰기 단위)마다 표시를 붙임
    //    10자 이하: 영문 · 숫자 · 한글만이면 원래 안 끊김 · 기호가 들면(--global · '%동%' · 부서코드='DD') .cnw = 한 덩어리
    //    11자 이상: 끊어도 읽기 좋은 자리에 빈 .ccut · 나뉜 조각도 위 규칙 · 그래도 10자가 넘는 조각은 .clong(아무 데서나)
    //    실제로 끊는 모양은 style.css 600px 규칙 (PC 는 그대로) · span 만 넣고 글자(textContent)는 그대로 → 복사 · 필기 앵커 · 채점에 영향 없음
    //    나중에 들어오는 표(실제시험 등)도 다시 표시
    var CODE_SHORT = 10;                                               // 이 글자 수 이하 낱말 · 조각은 절대 안 끊김
    var PLAIN = /^[A-Za-z0-9가-힣]+$/;                                // 영문 · 숫자 · 한글만 = 원래 안 끊기는 낱말 (기호 - / ( ' % 옆은 브라우저가 끊기도 함)
    var CUT_AFTER = /[.,()\];:=\/\\_|&+>-]/;                          // 이 글자 뒤는 끊어도 읽기 좋음
    var REAL = /[A-Za-z0-9]|[^\x00-\x7f]/;                           // 글자 · 숫자 · 한글 (구두점만 있는 조각은 만들지 않음)
    function codePieces(tok) {                                        // "document.getElementById(" → document. | get | Element | By | Id(
        var out = [], cur = "";
        for (var i = 0; i < tok.length; i++) {
            var c = tok.charAt(i), rest = tok.slice(i + 1), n = rest.charAt(0);
            cur += c;
            var punct = CUT_AFTER.test(c) && n && !CUT_AFTER.test(n) && ")]}".indexOf(n) < 0   // 구두점 묶음 뒤 (닫는 괄호 앞은 X: Date() · function(){})
                        && !(/[.:-]/.test(c) && /\d/.test(n));                                // 4.3 · 010-1234 · 10:30 처럼 숫자 앞도 X
            var camel = /[a-z\d]{2}$/.test(cur) && /^[A-Z][a-z]/.test(rest);                  // camelCase 대문자 앞 (addEvent|Listener)
            if ((punct || camel) && REAL.test(cur) && REAL.test(rest)) { out.push(cur); cur = ""; }
        }
        if (cur) out.push(cur);
        return out;
    }
    function markCode(code) {
        var tw = document.createTreeWalker(code, NodeFilter.SHOW_TEXT), list = [], t;
        while ((t = tw.nextNode())) if (/[^\sA-Za-z0-9가-힣]|\S{11}/.test(t.nodeValue) && !t.parentNode.closest(".cnw, .clong")) list.push(t);   // 11 = CODE_SHORT + 1
        list.forEach(function (t) {
            var frag = document.createDocumentFragment();
            function text(s) { frag.appendChild(document.createTextNode(s)); }
            function span(cls, s) { var e = document.createElement("span"); e.className = cls; e.textContent = s; frag.appendChild(e); }
            function short(s) { if (PLAIN.test(s)) text(s); else span("cnw", s); }                   // 기호가 든 짧은 낱말 · 조각 = 한 덩어리
            t.nodeValue.split(/(\s+)/).forEach(function (w) {
                if (!w) return;
                if (/^\s/.test(w)) text(w);
                else if (w.length <= CODE_SHORT) short(w);
                else codePieces(w).forEach(function (p, i) {                                          // 긴 낱말 → 조각 사이에 끊는 자리
                    if (i) span("ccut", "");
                    if (p.length <= CODE_SHORT) short(p); else span("clong", p);
                });
            });
            t.parentNode.replaceChild(frag, t);
        });
    }
    var codeObs = null, codeRaf = 0;
    function markCodes() {
        codeRaf = 0;
        [].forEach.call(document.querySelectorAll("table.ref td code"), markCode);
        if (codeObs) codeObs.takeRecords();                            // 방금 내가 넣은 span 은 다시 보지 않음
    }
    function watchCodes() {                                            // 나중에 들어오는 표 (실제시험 문제 · 펼치는 내용 등)
        if (!window.MutationObserver) return;
        codeObs = new MutationObserver(function (list) {
            var hit = list.some(function (r) {
                return (r.target.closest && r.target.closest("table.ref")) || [].some.call(r.addedNodes, function (n) {
                    return n.nodeType === 1 && (n.matches("table.ref") || n.querySelector("table.ref"));
                });
            });
            if (hit && !codeRaf) codeRaf = requestAnimationFrame(markCodes);
        });
        codeObs.observe(document.body, { childList: true, subtree: true });
    }

    var vpDone = fixViewport();
    function ready() {
        if (!vpDone) vpDone = fixViewport();
        heads();
        [].forEach.call(document.querySelectorAll(FIELD), tame);
        markCodes();
        watchCodes();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
    window.addEventListener("load", themeColor);                       // 배경색이 늦게 정해지는 페이지
    if (window.MutationObserver) new MutationObserver(themeColor).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
})();
