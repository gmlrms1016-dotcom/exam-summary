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

    var vpDone = fixViewport();
    function ready() {
        if (!vpDone) vpDone = fixViewport();
        heads();
        [].forEach.call(document.querySelectorAll(FIELD), tame);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
    window.addEventListener("load", themeColor);                       // 배경색이 늦게 정해지는 페이지
    if (window.MutationObserver) new MutationObserver(themeColor).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
})();
