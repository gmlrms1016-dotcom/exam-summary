/* =====================================================================
   theme.js  ·  다크모드(기본) / 화이트모드 전환 — 전 페이지 공용
   - 사용: <head> 의 맨 위(meta charset 바로 다음)에 <script src="theme.js"></script>
           (weeks/ 안의 페이지는 ../theme.js)
   - 저장값이 없으면 다크모드로 시작 (localStorage "exam-summary-theme")
   - 화이트모드 = 원래 디자인 그대로 (색을 하나도 바꾸지 않음)
   - 다크모드 = 인스타그램 다크모드 느낌
       · 배경 #0c1014 · 카드 #13171b · 회색 버튼 #25292e + 흰 글씨 · 보조 글씨 #a8a8a8
       · 강조(번호·확인 버튼·배지·정답) = 파란 버튼 #0095f6 + 흰 글씨 · 녹색/주황 계열은 쓰지 않음
       ① 공용 부품(헤더·카드·목차·표·팁·퀴즈·주차 버튼·첫 화면)은 아래 DARK_CSS 로 색을 직접 지정
       ② 그 밖에 페이지마다 직접 쓴 색(인라인 style·SVG 등)은 무채색·파랑으로 자동 변환
   - 오른쪽 위 ☀️/🌙 버튼으로 전환 · 주소 뒤 ?theme=light / ?theme=dark 로도 지정 가능
   - 소스코드 색칠 codecolor.js 도 여기서 함께 불러옴 (VS Code 고대비 색)
   ===================================================================== */
(function () {
    "use strict";

    var KEY = "exam-summary-theme";
    var root = document.documentElement;

    // 소스코드 색칠(codecolor.js)도 모든 페이지에서 함께 불러옴 — theme.js 와 같은 폴더
    var selfSrc = document.currentScript && document.currentScript.src;
    if (selfSrc && !document.getElementById("codecolor-js")) {
        var cc = document.createElement("script");
        cc.id = "codecolor-js";
        cc.src = selfSrc.replace(/theme\.js(\?[^#]*)?(#.*)?$/, "codecolor.js$1");   // ?v= 버전도 그대로 넘김(캐시 끊기)
        (document.head || root).appendChild(cc);
    }

    function load() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

    var forced = /[?&]theme=(light|dark)\b/.exec(location.search);
    if (forced) store(forced[1]);
    var theme = (forced ? forced[1] : load()) === "light" ? "light" : "dark";
    root.setAttribute("data-theme", theme);

    // ---- 첫 화면 깜빡임 방지: 다크 변환이 끝날 때까지 본문을 숨김 ----
    var pre = document.createElement("style");
    pre.setAttribute("data-theme-skip", "");
    pre.textContent =
        'html[data-theme="dark"]{background:#0c1014;color-scheme:dark}' +
        'html.theme-pending body{visibility:hidden}' +
        'html.theme-switching *,html.theme-switching *::before,html.theme-switching *::after{transition:none!important}';
    (document.head || root).appendChild(pre);
    if (theme === "dark") root.classList.add("theme-pending");

    // ================= 인스타그램 다크 팔레트 =================
    var IG = {
        bg: [12, 16, 20],       // #0c1014 페이지
        card: [19, 23, 27],     // #13171b 카드
        elev: [28, 31, 35],     // #1c1f23 한 단계 떠 있는 면(표 머리·팁)
        gray: [37, 41, 46],     // #25292e 회색 버튼
        gray2: [51, 55, 60],    // #33373c
        code: [22, 25, 29],     // #16191d 코드·어두운 면
        line: [38, 42, 47],     // #262a2f 테두리
        line2: [58, 62, 67],    // #3a3e43 진한 테두리
        text: [245, 245, 245],  // #f5f5f5 기본 글자
        text2: [168, 168, 168], // #a8a8a8 보조 글자
        blue: [0, 149, 246],    // #0095f6 강조 버튼
        blueD: [24, 119, 242],  // #1877f2
        link: [76, 181, 249],   // #4cb5f9 강조 글자
        red: [237, 73, 86],     // #ed4956
        redSoft: [255, 154, 162]
    };

    var DARK_CSS = [
        // ---- 색 변수 (style.css · index.html 공통) ----
        "html[data-theme=dark]{--main:#0095f6;--main-d:#1877f2;--point:#0095f6;--green:#4cb5f9;--green-soft:#1c1f23;",
        "--bg:#0c1014;--card:#13171b;--line:#262a2f;--line-2:#262a2f;--ink:#f5f5f5;--ink-2:#a8a8a8;--muted:#737373;",
        "--code-bg:#16191d;--brand-bg:#25292e;--accent-bg:#25292e;--sh-1:none;--sh-2:none;--sh-3:0 10px 28px rgba(0,0,0,.5)}",
        "html[data-theme=dark] body{background:#0c1014;color:#f5f5f5}",
        "html[data-theme=dark] h1,html[data-theme=dark] h2,html[data-theme=dark] h3{color:#f5f5f5}",
        "html[data-theme=dark] ::selection{background:#0095f6;color:#fff}",
        "html[data-theme=dark] .card a:not([class]),html[data-theme=dark] .tip a:not([class]){color:#4cb5f9}",
        "html[data-theme=dark] input::placeholder,html[data-theme=dark] textarea::placeholder{color:#737373}",

        // ---- 과목 페이지 공용 (style.css) ----
        "html[data-theme=dark] .page-head{background:#1c1f23;color:#f5f5f5;border:1px solid #262a2f;box-shadow:none}",
        "html[data-theme=dark] .page-head h1{color:#f5f5f5}",
        "html[data-theme=dark] .page-head p{color:#a8a8a8}",
        "html[data-theme=dark] .back-link{display:inline-flex!important;align-items:center;background:#25292e;color:#f5f5f5!important;padding:8px 14px;border-radius:999px;font-size:14px!important}",
        "html[data-theme=dark] .back-link:hover{background:#33373c}",
        "html[data-theme=dark] .toc{background:#13171b;border-color:#262a2f}",
        "html[data-theme=dark] .toc a{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] .toc a:hover{background:#0095f6;color:#fff}",
        "html[data-theme=dark] .card{background:#13171b;border-color:#262a2f;box-shadow:none}",
        "html[data-theme=dark] .card h2{border-bottom-color:#262a2f}",
        "html[data-theme=dark] .week{background:#0095f6;color:#fff}",
        "html[data-theme=dark] .demo{background:#16191d;border-color:#3a3e43}",
        "html[data-theme=dark] .demo::before{color:#4cb5f9}",
        "html[data-theme=dark] pre{background:#16191d;color:#e6edf3;border:1px solid #262a2f}",
        "html[data-theme=dark] pre::before{color:#a8a8a8}",
        "html[data-theme=dark] th,html[data-theme=dark] td{border-color:#262a2f}",
        "html[data-theme=dark] th{background:#1c1f23;color:#a8a8a8}",
        "html[data-theme=dark] .ref td:first-child{color:#f5f5f5}",
        "html[data-theme=dark] .pos-parent,html[data-theme=dark] .flex-demo{background:#1c1f23;border-color:#262a2f}",
        "html[data-theme=dark] .tip{background:#1c1f23;border-left-color:#0095f6;color:#f5f5f5}",
        "html[data-theme=dark] .tip b{color:#4cb5f9}",

        // ---- 퀴즈 (style.css · quiz.js) ----
        "html[data-theme=dark] #quiz-score,html[data-theme=dark] .quiz-score{background:#1c1f23;color:#f5f5f5}",
        "html[data-theme=dark] .quiz-item{background:#1c1f23;border-color:#262a2f}",
        "html[data-theme=dark] .quiz-q b{color:#4cb5f9}",
        "html[data-theme=dark] .quiz-cat{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] .quiz-filter button,html[data-theme=dark] .quiz-mode button{background:#25292e;color:#f5f5f5;border-color:#25292e}",
        "html[data-theme=dark] .quiz-filter button.active,html[data-theme=dark] .quiz-mode button.active{background:#0095f6;color:#fff;border-color:#0095f6}",
        "html[data-theme=dark] .quiz-gate{background:#1c1f23;border-color:#0095f6;color:#f5f5f5}",
        "html[data-theme=dark] .quiz-gate b{color:#4cb5f9}",
        "html[data-theme=dark] .kind-html{background:#25292e}",
        "html[data-theme=dark] .kind-css{background:#0095f6}",
        "html[data-theme=dark] .single-progress{background:#1c1f23}",
        "html[data-theme=dark] .single-progress b{color:#4cb5f9}",
        "html[data-theme=dark] .quiz-btn,html[data-theme=dark] .quiz-btn.next{background:#0095f6;color:#fff}",
        "html[data-theme=dark] .quiz-btn:hover{background:#1877f2;opacity:1}",
        "html[data-theme=dark] .quiz-btn.ghost{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] .quiz-btn.ghost:hover{background:#33373c}",
        "html[data-theme=dark] .quiz-done{background:#1c1f23;border-color:#0095f6;color:#f5f5f5}",
        "html[data-theme=dark] .quiz-item input[type=text],html[data-theme=dark] .quiz-item textarea{background:#0c1014;border-color:#3a3e43;color:#f5f5f5}",
        "html[data-theme=dark] .quiz-feedback.ok{background:#0f2438;color:#9fd3ff}",
        "html[data-theme=dark] .quiz-feedback.no{background:#3a1a1e;color:#ff9aa2}",
        "html[data-theme=dark] .quiz-feedback .ans{color:#f5f5f5}",
        "html[data-theme=dark] .ans-code{background:#0c1014;border-color:#262a2f;color:#4cb5f9}",
        "html[data-theme=dark] .mcq{background:#1c1f23;border-color:#262a2f}",
        "html[data-theme=dark] .mcq-no{background:#0095f6;color:#fff}",
        "html[data-theme=dark] .opt{background:#25292e;border-color:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] .opt:hover{background:#33373c;border-color:#33373c}",
        "html[data-theme=dark] .opt b{color:#a8a8a8}",
        "html[data-theme=dark] .opt.correct{background:#0095f6;border-color:#0095f6;color:#fff}",
        "html[data-theme=dark] .opt.correct b,html[data-theme=dark] .opt.correct::after{color:#fff}",
        "html[data-theme=dark] .opt.wrong{background:#3a1a1e;border-color:#ed4956;color:#ffb3b8}",
        "html[data-theme=dark] .opt.wrong::after{color:#ed4956}",
        "html[data-theme=dark] .mcq-exp{background:#16191d;border-left-color:#0095f6;color:#f5f5f5}",
        "html[data-theme=dark] .mcq-exp b{color:#4cb5f9}",

        // ---- 틀린 문제 복사 · 코드 복사 (review.js) ----
        "html[data-theme=dark] #rv-fab{background:#0095f6;color:#fff}",
        "html[data-theme=dark] #rv-overlay{background:rgba(0,0,0,.65)}",
        "html[data-theme=dark] #rv-modal{background:#1c1f23;color:#f5f5f5}",
        "html[data-theme=dark] #rv-head{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] #rv-head p{color:#a8a8a8}",
        "html[data-theme=dark] #rv-text{background:#0c1014;border-color:#262a2f;color:#f5f5f5}",
        "html[data-theme=dark] #rv-foot{border-top-color:#262a2f}",
        "html[data-theme=dark] .rv-btn.copy{background:#0095f6;color:#fff}",
        "html[data-theme=dark] .rv-btn.close{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] #rv-empty{color:#a8a8a8}",
        "html[data-theme=dark] .codecopy>.cc-btn{background:#25292e;color:#f5f5f5;border-color:#3a3e43}",
        "html[data-theme=dark] .codecopy>.cc-btn:hover{background:#33373c}",
        "html[data-theme=dark] .codecopy>.cc-btn.done{background:#0095f6;border-color:#0095f6;color:#fff}",

        // ---- 1~15주차 버튼 (weeks.js) · 주차 페이지 (weeks/*.html) ----
        "html[data-theme=dark] .wk-lead{color:#a8a8a8}",
        "html[data-theme=dark] .wk-btn{background:#25292e;border-color:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] a.wk-btn:hover{background:#33373c;border-color:#33373c;box-shadow:none}",
        "html[data-theme=dark] .wk-btn b{color:#f5f5f5}",
        "html[data-theme=dark] .wk-btn small{color:#a8a8a8}",
        "html[data-theme=dark] .wk-btn.exam{background:#0095f6;border-color:#0095f6}",
        "html[data-theme=dark] a.wk-btn.exam:hover{background:#1877f2;border-color:#1877f2}",
        "html[data-theme=dark] .wk-btn.exam b{color:#fff}",
        "html[data-theme=dark] .wk-btn.exam small{color:#e0f1ff}",
        "html[data-theme=dark] .wk-btn.locked{background:#13171b;border-color:#262a2f}",
        "html[data-theme=dark] .wk-btn.locked b,html[data-theme=dark] .wk-btn.locked small{color:#737373}",
        "html[data-theme=dark] .wk-bar a{color:#f5f5f5}",
        "html[data-theme=dark] .wk-hint,html[data-theme=dark] .wk-src{color:#737373}",
        "html[data-theme=dark] .wk-tag.star{background:#0095f6;color:#fff}",
        "html[data-theme=dark] .wk-tag.note{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] .wk-tag.fix{background:#3a1a1e;color:#ff9aa2}",
        "html[data-theme=dark] .wk-tag.memo{background:#25292e;color:#a8a8a8}",
        "html[data-theme=dark] .card h3{color:#f5f5f5}",
        "html[data-theme=dark] .wk-details{background:#16191d;border-color:#262a2f}",
        "html[data-theme=dark] .wk-details>summary{color:#f5f5f5}",
        "html[data-theme=dark] .wk-pager a,html[data-theme=dark] .wk-pager span{background:#1c1f23;border-color:#262a2f;color:#f5f5f5}",
        "html[data-theme=dark] .wk-pager a:hover{background:#25292e}",
        "html[data-theme=dark] .wk-pager a b{color:#f5f5f5}",

        // ---- 첫 화면 (index.html) ----
        "html[data-theme=dark] .hero{background:#1c1f23;color:#f5f5f5;border:1px solid #262a2f;box-shadow:none}",
        "html[data-theme=dark] .hero::after{display:none}",
        "html[data-theme=dark] .hero-eyebrow,html[data-theme=dark] .seg-l,html[data-theme=dark] .hero-date,html[data-theme=dark] .hero-pct{color:#a8a8a8}",
        "html[data-theme=dark] .hero-pct b{color:#f5f5f5}",
        "html[data-theme=dark] .seg{background:#25292e;border-color:#25292e}",
        "html[data-theme=dark] .hero-bar{background:#25292e}",
        "html[data-theme=dark] .hero-bar i{background:#0095f6}",
        "html[data-theme=dark] .bigbtn{background:#1c1f23;border-color:#262a2f;color:#f5f5f5;box-shadow:none}",
        "html[data-theme=dark] .bigbtn:hover{background:#25292e;border-color:#25292e;box-shadow:none}",
        "html[data-theme=dark] .bb-ic,html[data-theme=dark] .bb-ic.g1,html[data-theme=dark] .bb-ic.g2,html[data-theme=dark] .bb-ic.g3,html[data-theme=dark] .bb-ic.g4{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] .bigbtn:hover .bb-ic{background:#33373c}",
        "html[data-theme=dark] .bb-t{color:#f5f5f5}",
        "html[data-theme=dark] .bb-go,html[data-theme=dark] .bigbtn:hover .bb-go{color:#a8a8a8}",
        "html[data-theme=dark] .bigbtn.soon{background:#13171b;border-color:#1c1f23}",
        "html[data-theme=dark] .bigbtn.soon:hover{background:#13171b;border-color:#1c1f23}",
        "html[data-theme=dark] .bigbtn.soon .bb-ic{background:#1c1f23;color:#737373}",
        "html[data-theme=dark] .bigbtn.soon .bb-t{color:#737373}",
        "html[data-theme=dark] .tag-done{background:#25292e;color:#a8a8a8}",
        "html[data-theme=dark] .backbtn{color:#f5f5f5}",
        "html[data-theme=dark] .backbtn:hover{color:#a8a8a8}",
        "html[data-theme=dark] .head .sub{color:#a8a8a8}",
        "html[data-theme=dark] .subject{background:#1c1f23;border-color:#262a2f;color:#f5f5f5;box-shadow:none}",
        "html[data-theme=dark] .subject:hover{background:#25292e;border-color:#25292e;box-shadow:none}",
        "html[data-theme=dark] .subj-ic{background:#25292e}",
        "html[data-theme=dark] .subj-name{color:#f5f5f5}",
        "html[data-theme=dark] .subj-desc{color:#a8a8a8}",
        "html[data-theme=dark] .subject.fin{background:#13171b}",
        "html[data-theme=dark] .subject.fin .subj-ic{background:#1c1f23}",
        "html[data-theme=dark] .subject.fin .subj-name{color:#a8a8a8}",
        "html[data-theme=dark] .subj-name-card{background:#1c1f23;border-color:#262a2f}",
        "html[data-theme=dark] .subj-name-card .subj-name{color:#f5f5f5}",
        "html[data-theme=dark] .pill.soon,html[data-theme=dark] .cd{background:#0095f6;color:#fff;border-color:#0095f6}",
        "html[data-theme=dark] .pill.wk,html[data-theme=dark] .cd.wk{background:#25292e;color:#f5f5f5;border-color:#25292e}",
        "html[data-theme=dark] .pill.live,html[data-theme=dark] .cd.live{background:#ed4956;color:#fff;border-color:#ed4956}",
        "html[data-theme=dark] .pill.fin{background:#25292e;color:#a8a8a8;border-color:#25292e}",
        "html[data-theme=dark] .ph{background:#13171b;border-color:#3a3e43;color:#a8a8a8}",
        "html[data-theme=dark] .ph .em{color:#737373}",
        "html[data-theme=dark] .ph b{color:#f5f5f5}",
        "html[data-theme=dark] .foot{color:#737373}",
        "html[data-theme=dark] .cheer-in{background:#1c1f23;border-color:#262a2f;color:#f5f5f5}",
        "html[data-theme=dark] .haksa{background:#13171b;border-color:#262a2f;box-shadow:none}",
        "html[data-theme=dark] .haksa-head{border-bottom-color:#262a2f}",
        "html[data-theme=dark] .haksa-t,html[data-theme=dark] .haksa-month,html[data-theme=dark] .haksa-n{color:#f5f5f5}",
        "html[data-theme=dark] .haksa-arrow{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] .haksa-arrow:hover:not(:disabled){background:#33373c}",
        "html[data-theme=dark] .haksa-list li+li{border-top-color:#262a2f}",
        "html[data-theme=dark] .haksa-d,html[data-theme=dark] .haksa-more{color:#a8a8a8}",
        "html[data-theme=dark] .haksa-more:hover{color:#f5f5f5}",
        "html[data-theme=dark] .haksa-now{background:#0095f6;color:#fff}",
        "html[data-theme=dark] .haksa-list li.haksa-empty{color:#737373}",
        "html[data-theme=dark] .haksa-foot{background:#16191d;border-top-color:#262a2f}",
        "html[data-theme=dark] .haksa-open{background:#25292e;color:#f5f5f5}",
        "html[data-theme=dark] .haksa-open:hover{background:#33373c}",
        "html[data-theme=dark] .haksa-frame{background:#0c1014;border-top-color:#262a2f}",

        // ---- 전환 버튼 ----
        ".theme-toggle{position:fixed;top:14px;right:14px;z-index:9999;width:44px;height:44px;border-radius:50%;",
        "border:1px solid rgba(127,127,127,.35);font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;",
        "justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.18);transition:transform .15s;padding:0}",
        ".theme-toggle:hover{transform:scale(1.08)}",
        "html[data-theme=dark] .theme-toggle{background:#25292e;color:#f5f5f5;border-color:#3a3e43}",
        "html[data-theme=light] .theme-toggle{background:#ffffff;color:#1d241e}",
        "@media print{.theme-toggle{display:none}}"
    ].join("\n");

    // ================= 색 계산 (DARK_CSS 가 못 덮는 나머지 색) =================
    var TOKEN = /url\((?:[^()"']|"[^"]*"|'[^']*')*\)|#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|rgba?\([^()]*\)|\b(?:white|black)\b/gi;
    var HAS_COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|rgba?\(|\b(?:white|black)\b/i;

    function parse(tok) {
        tok = tok.trim().toLowerCase();
        if (tok === "white") return [255, 255, 255, 1];
        if (tok === "black") return [0, 0, 0, 1];
        if (tok.charAt(0) === "#") {
            var h = tok.slice(1);
            if (h.length <= 4) h = h.split("").map(function (c) { return c + c; }).join("");
            return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16),
                    h.length === 8 ? parseInt(h.substr(6, 2), 16) / 255 : 1];
        }
        var m = /rgba?\(([^)]*)\)/.exec(tok);
        if (!m) return null;
        var p = m[1].split(/[\s,\/]+/).filter(Boolean);
        if (p.length < 3) return null;
        function ch(v) { return v.indexOf("%") > -1 ? parseFloat(v) * 2.55 : parseFloat(v); }
        var a = p.length > 3 ? (p[3].indexOf("%") > -1 ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
        var out = [ch(p[0]), ch(p[1]), ch(p[2]), a];
        return out.some(isNaN) ? null : out;
    }

    function toHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
        if (d) {
            s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
            h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h /= 6;
        }
        return [h, s, l];
    }

    // role: bg(배경) · text(글자) · border(테두리·선) · fill(SVG 채우기: 어두우면 글자, 밝으면 면)
    function pick(c, role) {
        var hsl = toHsl(c[0], c[1], c[2]), h = hsl[0], s = hsl[1], l = hsl[2];
        var colorful = s >= 0.28 && l >= 0.18 && l <= 0.8;        // 초록·주황·보라·파랑 같은 '색이 있는' 색
        var red = colorful && (h < 0.035 || h > 0.955);
        if (role === "fill") role = l < 0.5 ? "text" : "bg";
        if (role === "bg") {
            if (colorful && l <= 0.7) return red ? IG.red : (l < 0.3 ? IG.blueD : IG.blue);   // 진한 색 배경 = 강조 버튼
            if (l >= 0.97) return IG.card;
            if (l >= 0.88) return IG.elev;
            if (l >= 0.5) return IG.gray;
            return l < 0.2 ? IG.code : IG.gray2;
        }
        if (role === "text") {
            if (colorful) return red ? IG.redSoft : IG.link;
            if (l < 0.45) return IG.text;
            if (l < 0.7) return IG.text2;
            return IG.text;
        }
        if (role === "border") {
            if (colorful) return red ? IG.red : IG.blue;
            return l >= 0.5 ? IG.line : IG.line2;
        }
        // 이름으로 역할을 모르는 CSS 변수
        if (colorful) return red ? IG.red : IG.blue;
        return l >= 0.5 ? pick(c, "bg") : IG.text;
    }

    function mapColor(c, role) {
        var rgb = pick(c, role);
        return c[3] < 1 ? "rgba(" + rgb.join(", ") + ", " + (+c[3].toFixed(3)) + ")" : "rgb(" + rgb.join(", ") + ")";
    }

    function mapValue(val, role) {
        return val.replace(TOKEN, function (tok) {
            if (/^url\(/i.test(tok)) return tok;
            var c = parse(tok);
            return c ? mapColor(c, role) : tok;
        });
    }

    function propRole(prop, selector) {
        if (prop === "color" || prop === "caret-color" || prop === "-webkit-text-fill-color" ||
            prop === "text-decoration-color" || prop === "column-rule-color") return "text";
        if (prop === "fill") return /\btext\b|tspan/i.test(selector || "") ? "text" : "fill";
        if (prop === "background-color" || prop === "background-image" || prop === "stop-color") return "bg";
        if (prop === "stroke" || prop === "outline-color" || (prop.indexOf("border") === 0 && /color$/.test(prop))) return "border";
        return null;                                             // box-shadow · text-shadow 등은 그대로
    }

    function varRole(name) {
        var n = name.toLowerCase();
        if (/sh-|shadow|ease|font|^--r(-|$)/.test(n)) return null;
        if (/bg|card|back|surface|paper|soft/.test(n)) return "bg";
        if (/line|border|stroke|rule/.test(n)) return "border";
        if (/ink|text|muted|fg/.test(n)) return "text";
        return "var";
    }

    // var() 가 섞인 한 줄 속성(background: 그라데이션, var(--bg) 등)은 세부 속성 값이 비어 있어서 묶음 이름으로 읽어야 함
    var SHORTHANDS = { "background": "bg", "border": "border", "border-top": "border", "border-right": "border",
                       "border-bottom": "border", "border-left": "border", "border-color": "border", "outline": "border",
                       "text-decoration": "text", "column-rule": "text" };

    // ================= 적용 / 복원 =================
    var saved = [];                   // [대상, 속성, 원래값, 우선순위]
    var doneSheets = new WeakSet();
    var lastSet = new WeakMap();      // 대상 → {속성: 내가 넣은 값}  (내가 바꾼 변경을 다시 변환하지 않도록)

    function remember(target, prop, mappedNow) {
        var m = lastSet.get(target);
        if (!m) { m = {}; lastSet.set(target, m); }
        m[prop] = mappedNow;
    }
    function isMine(target, prop, val) {
        var m = lastSet.get(target);
        return !!(m && m[prop] === val);
    }

    function processDecl(decl, selector) {
        var names = [];
        for (var i = 0; i < decl.length; i++) names.push(decl[i]);
        Object.keys(SHORTHANDS).forEach(function (sh) {
            var val = decl.getPropertyValue(sh);
            if (val && val.indexOf("var(") > -1 && names.indexOf(sh) === -1) names.push(sh);
        });
        names.forEach(function (prop) {
            var role = prop.indexOf("--") === 0 ? varRole(prop) : (SHORTHANDS[prop] || propRole(prop, selector));
            if (!role) return;
            var val = decl.getPropertyValue(prop);
            if (!val || !HAS_COLOR.test(val) || isMine(decl, prop, val)) return;
            var mapped = mapValue(val, role);
            if (mapped === val) return;
            var prio = decl.getPropertyPriority(prop);
            saved.push([decl, prop, val, prio]);
            decl.setProperty(prop, mapped, prio);
            remember(decl, prop, decl.getPropertyValue(prop));
        });
    }

    function processRules(rules) {
        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            if (r.style) processDecl(r.style, r.selectorText);
            if (r.cssRules) processRules(r.cssRules);
        }
    }

    function processSheet(sheet) {
        if (!sheet || doneSheets.has(sheet)) return;
        var owner = sheet.ownerNode;
        if (owner && owner.hasAttribute && owner.hasAttribute("data-theme-skip")) return;
        var rules;
        try { rules = sheet.cssRules; } catch (e) { return; }  // 다른 도메인 CSS(웹폰트)는 건너뜀
        if (!rules) return;
        doneSheets.add(sheet);
        processRules(rules);
    }

    function processEl(el) {
        if (!el || el.nodeType !== 1 || (el.closest && el.closest("[data-theme-skip]"))) return;
        if (el.hasAttribute("style")) processDecl(el.style, "");
        if (typeof SVGElement !== "undefined" && el instanceof SVGElement) {
            ["fill", "stroke", "stop-color"].forEach(function (a) {
                var v = el.getAttribute(a);
                if (!v || !HAS_COLOR.test(v) || isMine(el, "@" + a, v)) return;
                var role = a === "stroke" ? "border" : a === "stop-color" ? "bg" :
                           /^(text|tspan|textPath)$/i.test(el.tagName) ? "text" : "fill";
                var m = mapValue(v, role);
                if (m === v) return;
                saved.push([el, "@" + a, v, ""]);
                el.setAttribute(a, m);
                remember(el, "@" + a, m);
            });
        }
    }

    function scan(node) {
        processEl(node);
        if (node.querySelectorAll) {
            node.querySelectorAll("style, [style], svg, svg *").forEach(function (c) {
                if (c.tagName === "STYLE") processSheet(c.sheet); else processEl(c);
            });
        }
    }

    var observer = new MutationObserver(function (list) {
        list.forEach(function (m) {
            if (m.type === "attributes") { processEl(m.target); return; }
            if (m.target && m.target.tagName === "STYLE") processSheet(m.target.sheet);
            m.addedNodes.forEach(function (n) {
                if (n.nodeType !== 1) return;
                if (n.tagName === "STYLE") processSheet(n.sheet);
                else if (n.tagName === "LINK" && /stylesheet/i.test(n.rel)) {
                    if (n.sheet) processSheet(n.sheet);
                    n.addEventListener("load", function () { processSheet(n.sheet); });
                }
                scan(n);
            });
        });
    });

    function applyDark(done) {
        var pending = 0;
        function finish() { if (--pending <= 0 && done) { done(); done = null; } }
        pending++;
        document.querySelectorAll('link[rel~="stylesheet"]').forEach(function (l) {
            if (l.sheet) return;
            pending++;
            l.addEventListener("load", function () { processSheet(l.sheet); finish(); });
            l.addEventListener("error", finish);
        });
        for (var i = 0; i < document.styleSheets.length; i++) processSheet(document.styleSheets[i]);
        scan(document.documentElement);
        observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "fill", "stroke"] });
        finish();
    }

    function restoreLight() {
        observer.disconnect();
        for (var i = saved.length - 1; i >= 0; i--) {
            var s = saved[i];
            if (s[1].charAt(0) === "@") s[0].setAttribute(s[1].slice(1), s[2]);
            else s[0].setProperty(s[1], s[2], s[3]);
        }
        saved = [];
        doneSheets = new WeakSet();
        lastSet = new WeakMap();
    }

    function reveal() { root.classList.remove("theme-pending"); }

    // ================= 전환 버튼 =================
    var btn = null;
    function updateBtn() {
        if (!btn) return;
        var label = theme === "dark" ? "화이트모드로 바꾸기" : "다크모드로 바꾸기";
        btn.textContent = theme === "dark" ? "☀️" : "🌙";
        btn.title = label;
        btn.setAttribute("aria-label", label);
    }

    function setTheme(t) {
        if (t === theme) return;
        theme = t;
        store(t);
        root.classList.add("theme-switching");                // 전환하는 순간엔 애니메이션 없이 바로 바뀌게
        root.setAttribute("data-theme", t);
        if (t === "dark") applyDark(); else restoreLight();
        updateBtn();
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { root.classList.remove("theme-switching"); });
        });
    }

    function start() {
        var st = document.createElement("style");
        st.id = "theme-dark-css";
        st.setAttribute("data-theme-skip", "");
        st.textContent = DARK_CSS;
        document.head.appendChild(st);

        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "theme-toggle";
        btn.setAttribute("data-theme-skip", "");
        btn.addEventListener("click", function () { setTheme(theme === "dark" ? "light" : "dark"); });
        document.body.appendChild(btn);
        updateBtn();

        if (theme === "dark") applyDark(reveal); else reveal();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
    setTimeout(reveal, 2500);                                   // 혹시 변환이 멈춰도 본문은 반드시 보이게
})();
