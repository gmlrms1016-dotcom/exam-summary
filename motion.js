/* =====================================================================
   motion.js  ·  애니메이션 · 인터랙션 — 전 페이지 공용
   - 페이지에 따로 넣지 않습니다. theme.js 가 codecolor.js 와 함께 같은 ?v= 로 불러옵니다.
   - 색: 화이트모드는 원래 초록·주황 토큰, 다크모드는 파랑·무채색만 (녹색 없음)
   - 기기에서 '동작 줄이기(prefers-reduced-motion)'를 켜면 움직임은 모두 빼고
     읽기 진행 막대 · 맨 위로 버튼 · 키보드 포커스 테두리만 남김
   하는 일
     첫 화면(index)
       ① 화면 전환 — 앞으로 가면 오른쪽에서, 뒤로 가면 왼쪽에서 들어오고 카드가 차례로 떠오름
       ② 카운트다운 숫자가 바뀔 때 위에서 굴러 내려옴 · 히어로 배경 오로라 · 진행바 반짝임
       ③ 시험 임박·시험 중 칩이 맥박처럼 퍼짐 · 학사일정 달을 넘기면 옆에서 밀려옴
       ⚠️ 카운트다운 카드(.hero-clock)는 숨은 이동(일→시간→분→초) 자리 —
          마우스·터치에 반응하는 효과(빛·물결·눌림·흔들림)를 절대 넣지 않음. 숫자 굴림은 시간에만 반응
     과목 · 주차 페이지
       ④ 스크롤하면 카드·문제가 차례로 떠오름 · 머리말에 빛이 지나감 · 제목이 단어별로 나타남
       ⑤ 맨 위 읽기 진행 막대 + 오른쪽 아래 '맨 위로' 버튼(진행 원)
       ⑥ 목차를 누르면 부드럽게 이동하고, 도착한 카드 테두리가 한 번 반짝
     퀴즈
       ⑦ 정답: 보기가 톡 튀고 색종이 · 오답: 좌우로 흔들림 · 점수판·틀린 문제 버튼 톡
     공통
       ⑧ 카드에 마우스를 따라다니는 빛(PC) · 버튼 누르면 물결 · 눌림 · 아이콘 스프링
       ⑨ 잠긴 버튼(종료된 시험·진도 전 주차)을 누르면 살짝 흔들려 '잠김'을 알림
   ===================================================================== */
(function () {
    "use strict";
    if (window.__examMotion) return;
    window.__examMotion = true;

    var root = document.documentElement;
    function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
    var REDUCE = mq("(prefers-reduced-motion: reduce)");
    var FINE = mq("(hover: hover) and (pointer: fine)");
    var MOVE = !REDUCE && typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
    var EASE = "cubic-bezier(.22,1,.36,1)";
    var SPRING = "cubic-bezier(.34,1.56,.64,1)";

    function dark() { return root.getAttribute("data-theme") === "dark"; }
    function accentRGB() { return dark() ? "0,149,246" : "45,106,79"; }   // 다크 #0095f6 · 화이트 #2d6a4f(--main)

    // ================= CSS =================
    var H = "html.mo-on ";   // 애니메이션이 켜진 페이지에서만
    var css = [
        // ---- 움직임과 상관없이: 읽기 진행 막대 · 맨 위로 버튼 · 포커스 테두리 ----
        "#mo-progress{position:fixed;left:0;right:0;top:0;height:3px;z-index:9996;pointer-events:none;transform-origin:0 50%;transform:scaleX(0);",
        "background:linear-gradient(90deg,var(--main,#2d6a4f),var(--point,#d9772b))}",
        "html[data-theme=dark] #mo-progress{background:linear-gradient(90deg,#1877f2,#0095f6 55%,#4cb5f9)}",
        "#mo-top{position:fixed;right:18px;bottom:18px;z-index:9997;width:46px;height:46px;padding:0;border-radius:50%;cursor:pointer;",
        "display:grid;place-items:center;background:var(--card,#fff);color:var(--main,#2d6a4f);border:1px solid var(--line,#e6ebe6);",
        "box-shadow:0 8px 22px rgba(16,40,28,.16);opacity:0;visibility:hidden;transform:translateY(14px) scale(.8);",
        "transition:opacity .3s ease,visibility .3s,transform .5s " + SPRING + "}",
        "#mo-top.on{opacity:1;visibility:visible;transform:none}",
        "#mo-top:hover{transform:translateY(-3px)}",
        "#mo-top:active{transform:scale(.92)}",
        "#mo-top .ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);pointer-events:none}",
        "#mo-top .ring circle{fill:none;stroke:currentColor;stroke-width:2.6}",
        "#mo-top .ring .t{opacity:.14}",
        "#mo-top .ring .p{stroke-linecap:round}",
        "#mo-top .ar{width:20px;height:20px;position:relative}",
        "html[data-theme=dark] #mo-top{background:#25292e;color:#f5f5f5;border-color:#3a3e43;box-shadow:0 10px 26px rgba(0,0,0,.55)}",
        "#mo-top:focus-visible,.toc a:focus-visible,.opt:focus-visible,a.wk-btn:focus-visible,.wk-pager a:focus-visible,",
        ".quiz-btn:focus-visible,.cmdq-btn:focus-visible,.haksa-arrow:focus-visible,.haksa-more:focus-visible,.haksa-open:focus-visible",
        "{outline:2.5px solid var(--main,#2d6a4f);outline-offset:2px}",
        "@media print{#mo-top,#mo-progress,.mo-confetti{display:none!important}.mo-rv{opacity:1!important;animation:none!important}}",

        "@media (prefers-reduced-motion:no-preference){",
        "html.mo-smooth{scroll-behavior:smooth}",
        ".card[id]{scroll-margin-top:18px}",

        // ---- ④ 스크롤 등장 ----
        H + ".mo-rv:not(.mo-in){opacity:0}",
        H + ".mo-rv.mo-in{animation:mo-rise .8s " + EASE + " backwards;animation-delay:var(--mo-d,0ms)}",
        H + ".mo-rv.mo-lite.mo-in{animation-name:mo-rise-lite}",
        "@keyframes mo-rise{from{opacity:0;transform:translateY(26px) scale(.985);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}",
        "@keyframes mo-rise-lite{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}",
        "@keyframes mo-pop{from{opacity:0;transform:translateY(10px) scale(.88)}to{opacity:1;transform:none}}",
        "@keyframes mo-drop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}",

        // ---- ① 첫 화면 전환 ----
        H + ".screen{animation:mo-screen .55s " + EASE + " both}",
        "html.mo-on[data-mo-nav=back] .screen{animation-name:mo-screen-back}",
        "@keyframes mo-screen{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}",
        "@keyframes mo-screen-back{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}",

        // ---- ② 히어로: 오로라 · 숫자 굴림 · 진행바 반짝임 (포인터 반응 없음) ----
        ".hero::before{content:'';position:absolute;inset:-35%;pointer-events:none;",
        "background:radial-gradient(32% 42% at 28% 38%,rgba(138,217,176,.30),transparent 70%),radial-gradient(28% 36% at 72% 64%,rgba(255,255,255,.14),transparent 70%);",
        "animation:mo-aurora 16s ease-in-out infinite alternate}",
        "html[data-theme=dark] .hero::before{background:radial-gradient(32% 42% at 28% 38%,rgba(0,149,246,.18),transparent 70%),",
        "radial-gradient(28% 36% at 72% 64%,rgba(76,181,249,.08),transparent 70%)}",
        "@keyframes mo-aurora{0%{transform:translate3d(-5%,-3%,0) rotate(0deg)}50%{transform:translate3d(4%,3%,0) rotate(6deg)}100%{transform:translate3d(-2%,4%,0) rotate(-5deg)}}",
        ".hero-clock .seg{overflow:hidden}",
        ".seg-n.mo-tick{animation:mo-roll .6s " + EASE + "}",
        "@keyframes mo-roll{from{transform:translateY(-80%);opacity:0;filter:blur(4px)}to{transform:none;opacity:1;filter:none}}",
        ".hero-bar i{position:relative;overflow:hidden}",
        ".hero-bar i::after{content:'';position:absolute;top:0;bottom:0;left:0;width:60%;",
        "background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);transform:translateX(-120%);",
        "animation:mo-sweep 3s cubic-bezier(.4,0,.2,1) infinite}",
        "@keyframes mo-sweep{0%{transform:translateX(-120%)}55%,100%{transform:translateX(220%)}}",

        // ---- 첫 화면 카드 · 버튼 ----
        "html .bigbtn,html .subject{transition:transform .45s " + SPRING + ",box-shadow .3s ease,border-color .2s ease,background-color .2s ease}",
        "html .bigbtn:not(.soon):hover{transform:translateY(-4px)}",
        "html .subject:hover{transform:translateY(-3px)}",
        "html .bigbtn:not(.soon):active,html .subject:active{transform:translateY(-1px) scale(.985);transition-duration:.12s}",
        "html[data-theme=dark] body .bigbtn:not(.soon):hover,html[data-theme=dark] body .subject:hover{box-shadow:0 14px 34px rgba(0,0,0,.5),0 0 0 1px rgba(0,149,246,.3)}",
        ".bb-ic,.subj-ic{transition:transform .5s " + SPRING + ",background-color .2s ease}",
        ".bigbtn:not(.soon):hover .bb-ic{transform:scale(1.1) rotate(-7deg)}",
        ".subject:hover .subj-ic{transform:scale(1.08) rotate(-6deg)}",
        ".bigbtn:not(.soon):hover .bb-go{animation:mo-nudge 1s ease-in-out infinite}",
        "@keyframes mo-nudge{0%,100%{transform:translateX(3px)}50%{transform:translateX(8px)}}",
        "html .backbtn{transition:color .2s ease,transform .35s " + SPRING + "}",
        "html .backbtn:hover{transform:translateX(-3px)}",

        // ---- ③ 상태 칩 맥박 · 학사일정 ----
        ".pill.soon,.cd:not(.wk):not(.live),.haksa-now{animation:mo-ring-point 2.4s ease-out infinite}",
        "html[data-theme=dark] .pill.soon,html[data-theme=dark] .cd:not(.wk):not(.live),html[data-theme=dark] .haksa-now{animation-name:mo-ring-blue}",
        ".pill.live,.cd.live{animation:mo-ring-red 1.6s ease-out infinite}",
        "@keyframes mo-ring-point{0%{box-shadow:0 0 0 0 rgba(217,119,43,.4)}80%,100%{box-shadow:0 0 0 9px rgba(217,119,43,0)}}",
        "@keyframes mo-ring-blue{0%{box-shadow:0 0 0 0 rgba(0,149,246,.5)}80%,100%{box-shadow:0 0 0 9px rgba(0,149,246,0)}}",
        "@keyframes mo-ring-red{0%{box-shadow:0 0 0 0 rgba(237,73,86,.5)}80%,100%{box-shadow:0 0 0 10px rgba(237,73,86,0)}}",
        "html .haksa-arrow{transition:background-color .2s ease,transform .4s " + SPRING + "}",
        "html .haksa-arrow:hover:not(:disabled){transform:scale(1.14)}",
        "html .haksa-arrow:active:not(:disabled){transform:scale(.9)}",
        ".haksa-list li{transition:background-color .2s ease}",
        ".haksa-list li:not(.haksa-empty):hover{background:rgba(45,106,79,.05)}",
        "html[data-theme=dark] .haksa-list li:not(.haksa-empty):hover{background:rgba(255,255,255,.035)}",
        ".haksa-frame:not([hidden]){animation:mo-drop .45s " + EASE + " backwards}",
        ".cheer-t{transition:opacity .45s " + EASE + ",transform .45s " + EASE + ",filter .45s " + EASE + "}",
        ".cheer.is-fading .cheer-t{transform:translateY(7px);filter:blur(5px)}",
        ".cheer-in svg{animation:mo-beat 2.6s ease-in-out infinite;transform-origin:50% 55%}",
        "@keyframes mo-beat{0%,50%,100%{transform:scale(1)}10%{transform:scale(1.22)}20%{transform:scale(.95)}30%{transform:scale(1.12)}40%{transform:scale(1)}}",

        // ---- ⑧ 마우스를 따라다니는 빛 (PC) ----
        "@media (hover:hover) and (pointer:fine){",
        ".mo-spot{position:relative;isolation:isolate}",
        ".mo-spot::after{content:'';position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;opacity:0;transition:opacity .4s ease;",
        "background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),rgba(45,106,79,.11),transparent 70%)}",
        "html[data-theme=dark] .mo-spot::after{background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),rgba(0,149,246,.17),transparent 70%)}",
        ".mo-spot:hover::after{opacity:1}",
        ".mo-spot.soon::after,.mo-spot.locked::after{display:none}",
        "}",

        // ---- 물결 ----
        ".mo-rel{position:relative}",
        ".mo-clip{overflow:hidden}",
        ".mo-ripple{position:absolute;border-radius:50%;pointer-events:none;background:currentColor;opacity:.26;transform:scale(0);",
        "animation:mo-ripple .65s " + EASE + " forwards}",
        "@keyframes mo-ripple{to{transform:scale(1);opacity:0}}",

        // ---- ④ 과목 · 주차 페이지 ----
        ".page-head{position:relative;overflow:hidden;isolation:isolate}",
        ".page-head::after{content:'';position:absolute;top:-20%;bottom:-20%;left:-45%;width:38%;z-index:-1;pointer-events:none;",
        "background:linear-gradient(100deg,transparent,rgba(255,255,255,.2),transparent);transform:skewX(-18deg);",
        "animation:mo-sheen 7.5s " + EASE + " 1s infinite}",
        "html[data-theme=dark] .page-head::after{background:linear-gradient(100deg,transparent,rgba(255,255,255,.06),transparent)}",
        "@keyframes mo-sheen{0%{transform:translateX(0) skewX(-18deg)}30%,100%{transform:translateX(430%) skewX(-18deg)}}",
        ".mo-w{display:inline-block;animation:mo-word .75s " + EASE + " backwards;animation-delay:calc(var(--i,0) * 55ms + 150ms)}",
        "@keyframes mo-word{from{opacity:0;transform:translateY(.5em);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}",
        "html .toc a{transition:background-color .2s ease,color .2s ease,transform .4s " + SPRING + "}",
        "html .toc a:hover{transform:translateY(-2px)}",
        "html .toc a:active{transform:scale(.94)}",
        H + ".toc.mo-in a{animation:mo-pop .55s " + SPRING + " backwards}",
        "html a.wk-btn{transition:transform .45s " + SPRING + ",border-color .2s ease,box-shadow .3s ease,background-color .2s ease}",
        "html a.wk-btn:hover{transform:translateY(-4px)}",
        "html a.wk-btn:active{transform:translateY(-1px) scale(.97)}",
        H + ".wk-card.mo-in .wk-btn{animation:mo-pop .55s " + SPRING + " backwards}",
        "html .wk-pager a{transition:transform .4s " + SPRING + ",background-color .2s ease,border-color .2s ease}",
        "html .wk-pager a.prev:hover{transform:translateX(-4px)}",
        "html .wk-pager a.next:hover{transform:translateX(4px)}",
        "details[open]>:not(summary){animation:mo-drop .4s " + EASE + " backwards}",
        "html #rv-fab{transition:transform .4s " + SPRING + ",filter .2s ease}",
        "html #rv-fab:hover{transform:translateY(-3px)}",
        "html #rv-fab:active{transform:scale(.95)}",

        // ---- ⑦ 퀴즈 ----
        "html .opt{transition:background-color .15s ease,border-color .15s ease,color .15s ease,transform .35s " + SPRING + "}",
        ".mcq:not(.answered) .opt:hover{transform:translateX(4px)}",
        ".mcq:not(.answered) .opt:active{transform:scale(.985)}",
        ".mcq-exp{animation:mo-drop .5s " + EASE + " backwards}",
        ".quiz-feedback.ok,.quiz-feedback.no,.cmdq-fb.ok,.cmdq-fb.no{animation:mo-drop .4s " + EASE + " backwards}",
        "html .quiz-btn,html .cmdq-btn{transition:transform .35s " + SPRING + ",opacity .2s ease,background-color .2s ease}",
        "html .quiz-btn:active,html .cmdq-btn:active{transform:scale(.94)}",
        ".mo-confetti{position:fixed;left:0;top:0;z-index:10000;pointer-events:none;border-radius:2px;will-change:transform,opacity}",
        "html .theme-toggle{transition:transform .45s " + SPRING + ",background-color .2s ease}",
        "html .theme-toggle:hover{transform:scale(1.1) rotate(14deg)}",
        "html .theme-toggle:active{transform:scale(.9)}",
        "}"
    ];
    // 목차 알약 · 주차 버튼이 차례로 톡톡 나오도록 순서별 지연
    for (var n = 1; n <= 40; n++) css.push("@media (prefers-reduced-motion:no-preference){" + H + ".toc.mo-in a:nth-child(" + n + "){animation-delay:" + (120 + n * 22) + "ms}}");
    for (var w = 1; w <= 15; w++) css.push("@media (prefers-reduced-motion:no-preference){" + H + ".wk-card.mo-in .wk-btn:nth-child(" + w + "){animation-delay:" + (140 + w * 32) + "ms}}");

    // ================= 공용 동작 =================
    var lastInput = 0, lastX = 0, lastY = 0;
    function recent(ms) { return Date.now() - lastInput < (ms || 1200); }

    function shake(el, px) {
        if (!MOVE || !el) return;
        var d = px || 7;
        el.animate([{ transform: "translateX(0)" }, { transform: "translateX(" + -d + "px)" }, { transform: "translateX(" + d * 0.85 + "px)" },
                    { transform: "translateX(" + -d * 0.55 + "px)" }, { transform: "translateX(" + d * 0.3 + "px)" }, { transform: "translateX(0)" }],
                   { duration: 440, easing: "ease-out" });
    }
    function pop(el, s) {
        if (!MOVE || !el) return;
        el.animate([{ transform: "scale(1)" }, { transform: "scale(" + (s || 1.04) + ")" }, { transform: "scale(1)" }], { duration: 420, easing: SPRING });
    }
    function ring(el, size) {
        if (!MOVE || !el) return;
        var c = accentRGB();
        el.animate([{ boxShadow: "0 0 0 0 rgba(" + c + ",0)" }, { boxShadow: "0 0 0 4px rgba(" + c + ",.45)", offset: 0.2 },
                    { boxShadow: "0 0 0 " + (size || 14) + "px rgba(" + c + ",0)" }], { duration: 1100, easing: "ease-out" });
    }
    function confetti(x, y, count) {
        if (!MOVE || !document.body) return;
        var colors = dark() ? ["#0095f6", "#4cb5f9", "#f5f5f5", "#a8a8a8", "#1877f2"]
                            : ["#2d6a4f", "#d9772b", "#8ad9b0", "#f3d3ad", "#1b4d39"];
        for (var i = 0; i < count; i++) {
            var p = document.createElement("i");
            p.className = "mo-confetti";
            p.setAttribute("aria-hidden", "true");
            p.setAttribute("data-theme-skip", "");       // theme.js 가 다크 변환하지 않게 (색은 이미 모드별)
            var size = 5 + Math.random() * 5;
            p.style.cssText = "background:" + colors[i % colors.length] + ";width:" + size.toFixed(1) + "px;height:" +
                (size * (Math.random() < 0.5 ? 1 : 0.45)).toFixed(1) + "px;" + (Math.random() < 0.3 ? "border-radius:50%;" : "");
            document.body.appendChild(p);
            var a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5, dist = 45 + Math.random() * 80;
            var dx = Math.cos(a) * dist, dy = Math.sin(a) * dist, rot = (Math.random() - 0.5) * 760;
            var anim = p.animate([
                { transform: "translate(" + x + "px," + y + "px) rotate(0deg)", opacity: 1 },
                { transform: "translate(" + (x + dx) + "px," + (y + dy) + "px) rotate(" + rot / 2 + "deg)", opacity: 1, offset: 0.45 },
                { transform: "translate(" + (x + dx * 1.25) + "px," + (y + dy + 80) + "px) rotate(" + rot + "deg) scale(.5)", opacity: 0 }
            ], { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
            anim.onfinish = (function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); }; })(p);
        }
    }
    function centerOf(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }

    // ================= ① ② ③ 첫 화면 =================
    var HUB_ITEMS = ".head, .hero, .haksa, .biggrid > .bigbtn:not([hidden]), .subjects > .subject, .subj-name-card, .ph, .cheer, .foot";
    function depth(id) { return !id || id === "home" ? 0 : (/-(mid|final)$/.test(id) ? 2 : 1); }

    function staggerScreen() {
        if (!MOVE) return;
        var scr = document.querySelector(".screen:not([hidden])");
        if (!scr) return;
        [].slice.call(scr.querySelectorAll(HUB_ITEMS)).forEach(function (el, i) {
            el.animate([{ opacity: 0, transform: "translateY(18px) scale(.98)" }, { opacity: 1, transform: "none" }],
                       { duration: 650, delay: 60 + Math.min(i, 10) * 60, easing: EASE, fill: "backwards" });
        });
    }

    function setupHub() {
        var cur = (location.hash || "#home").slice(1);
        root.setAttribute("data-mo-nav", "fwd");
        window.addEventListener("hashchange", function () {
            var id = (location.hash || "#home").slice(1);
            root.setAttribute("data-mo-nav", depth(id) < depth(cur) ? "back" : "fwd");
            cur = id;
            requestAnimationFrame(staggerScreen);
        });
        staggerScreen();

        // 카운트다운 숫자: 바뀐 칸만 굴러 내려옴 (1초마다 다시 그려지는 카드를 보고 판단 · 포인터와는 무관)
        var clock = document.getElementById("dday-clock");
        if (clock && MOVE) {
            var prev = [];
            var read = function () { return [].map.call(clock.querySelectorAll(".seg-n"), function (x) { return x.textContent; }); };
            prev = read();
            new MutationObserver(function () {
                var nodes = clock.querySelectorAll(".seg-n");
                [].forEach.call(nodes, function (node, i) {
                    if (prev.length === nodes.length && prev[i] !== node.textContent) node.classList.add("mo-tick");
                });
                prev = read();
            }).observe(clock, { childList: true });
        }

        // 학사일정: 다음 달은 오른쪽에서, 이전 달은 왼쪽에서
        var list = document.getElementById("haksa-list"), month = document.getElementById("haksa-month");
        if (list && MOVE) {
            var dir = 0;
            document.addEventListener("click", function (e) {
                var b = e.target.closest && e.target.closest("#haksa-prev, #haksa-next");
                if (b && !b.disabled) dir = b.id === "haksa-next" ? 1 : -1;
            }, true);
            new MutationObserver(function () {
                [].forEach.call(list.children, function (li, i) {
                    li.animate([{ opacity: 0, transform: dir ? "translateX(" + dir * 26 + "px)" : "translateY(8px)" }, { opacity: 1, transform: "none" }],
                               { duration: 460, delay: Math.min(i, 8) * 35, easing: EASE, fill: "backwards" });
                });
                if (month && dir) month.animate([{ opacity: 0, transform: "translateY(" + (dir > 0 ? 8 : -8) + "px)" }, { opacity: 1, transform: "none" }],
                                                { duration: 380, easing: EASE });
                dir = 0;
            }).observe(list, { childList: true });
        }
    }

    // ================= ④ ⑤ ⑥ 과목 · 주차 페이지 =================
    var REVEAL = ".page-head, .toc, .card, .wrap > .tip, #done-banner, .wk-bar, .wk-pager, .mcq, .quiz-item, .cmdq, .wk-src";

    function setupReveal() {
        if (!MOVE || !("IntersectionObserver" in window)) return;
        var io = new IntersectionObserver(function (entries) {
            var shown = entries.filter(function (en) { return en.isIntersecting; }).map(function (en) { return en.target; });
            shown.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
            shown.forEach(function (el, k) {
                el.style.setProperty("--mo-d", Math.min(k, 6) * 70 + "ms");
                el.classList.add("mo-in");
                io.unobserve(el);
            });
        }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
        [].forEach.call(document.querySelectorAll(REVEAL), function (el) {
            if (el.classList.contains("mo-rv") || el.closest(".screen, [data-mo-skip]")) return;
            if (el.offsetHeight > 900) el.classList.add("mo-lite");   // 아주 긴 카드는 흐림 효과 없이 가볍게
            el.classList.add("mo-rv");
            io.observe(el);
        });
        // 뒤에 열린 탭처럼 관찰 알림이 늦게 오는 경우에도, 화면 안의 카드는 3초 뒤 반드시 보이게
        setTimeout(function () {
            [].forEach.call(document.querySelectorAll(".mo-rv:not(.mo-in)"), function (el) {
                var r = el.getBoundingClientRect();
                if (r.top < window.innerHeight && r.bottom > 0) { el.classList.add("mo-in"); io.unobserve(el); }
            });
        }, 3000);
    }

    function splitTitle() {
        if (!MOVE) return;
        var h = document.querySelector(".page-head h1");
        if (!h || h.children.length || h.getAttribute("data-mo-split")) return;
        var text = h.textContent, i = 0;
        h.setAttribute("data-mo-split", "1");
        h.setAttribute("aria-label", text.trim());
        h.textContent = "";
        text.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { h.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement("span");
            s.className = "mo-w";
            s.setAttribute("aria-hidden", "true");
            s.style.setProperty("--i", i++);
            s.textContent = part;
            h.appendChild(s);
        });
    }

    function setupProgress() {
        var body = document.body;
        var bar = document.createElement("div");
        bar.id = "mo-progress";
        bar.setAttribute("data-theme-skip", "");
        bar.setAttribute("aria-hidden", "true");
        var top = document.createElement("button");
        top.id = "mo-top";
        top.type = "button";
        top.title = "맨 위로";
        top.setAttribute("aria-label", "맨 위로");
        top.setAttribute("data-theme-skip", "");
        top.innerHTML = '<svg class="ring" viewBox="0 0 46 46" aria-hidden="true"><circle class="t" cx="23" cy="23" r="20.5"/><circle class="p" cx="23" cy="23" r="20.5"/></svg>'
            + '<svg class="ar" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5.5M5.8 11.5 12 5.3l6.2 6.2" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        body.appendChild(bar);
        body.appendChild(top);
        var fab = document.getElementById("rv-fab");                    // '틀린 문제 복사' 버튼이 있으면 그 위에
        if (fab && fab.offsetHeight) top.style.bottom = (18 + fab.offsetHeight + 12) + "px";

        var C = 2 * Math.PI * 20.5, arc = top.querySelector(".p"), queued = false;
        arc.style.strokeDasharray = C.toFixed(2);
        arc.style.strokeDashoffset = C.toFixed(2);
        function update() {
            queued = false;
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
            arc.style.strokeDashoffset = (C * (1 - p)).toFixed(2);
            top.classList.toggle("on", window.scrollY > 480);
        }
        function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
        window.addEventListener("scroll", queue, { passive: true });
        window.addEventListener("resize", queue);
        window.addEventListener("load", queue);
        top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: REDUCE ? "auto" : "smooth" }); });
        update();
    }

    // 목차 · 같은 페이지 링크: 도착한 카드 테두리가 한 번 반짝
    function setupAnchors() {
        document.addEventListener("click", function (e) {
            var a = e.target.closest && e.target.closest('a[href^="#"]');
            if (!a || e.defaultPrevented) return;
            var id = a.getAttribute("href").slice(1), target = null;
            try { target = id && document.getElementById(decodeURIComponent(id)); } catch (err) { target = null; }
            if (!target) return;
            var fired = false;
            function arrive() { if (fired) return; fired = true; window.removeEventListener("scrollend", arrive); ring(target, 16); }
            if ("onscrollend" in window) window.addEventListener("scrollend", arrive);
            setTimeout(arrive, 900);
        });
    }

    // ================= ⑦ 퀴즈 반응 =================
    function judgeOption(opt, q, x, y) {
        if (opt.classList.contains("wrong")) {
            shake(opt);
            pop(q.querySelector(".opt.correct"), 1.02);
        } else if (opt.classList.contains("correct")) {
            pop(opt, 1.035);
            ring(q, 14);
            confetti(x, y, 18);
        }
    }
    function feedbackOf(box) { return box.querySelector(".quiz-feedback, .cmdq-fb"); }
    function stamp(fb) { return fb ? fb.className + "|" + fb.textContent : ""; }
    function judgeBox(box, from, before, force) {
        var fb = feedbackOf(box);
        if (!fb || (!force && stamp(fb) === before)) return;
        if (/(^|\s)ok(\s|$)/.test(fb.className)) {
            pop(fb, 1.03);
            var c = centerOf(from);
            confetti(c[0], c[1], 12);
        } else if (/(^|\s)no(\s|$)/.test(fb.className)) {
            shake(box.querySelector("input, textarea") || fb);
        }
    }

    function setupQuiz() {
        document.addEventListener("click", function (e) {
            var t = e.target;
            if (!t.closest) return;
            var opt = t.closest(".opt");
            if (opt) {
                var q = opt.closest(".mcq");
                if (q && !q.classList.contains("answered")) {
                    var x = e.clientX || centerOf(opt)[0], y = e.clientY || centerOf(opt)[1];
                    setTimeout(function () { judgeOption(opt, q, x, y); }, 0);
                }
                return;
            }
            var check = t.closest(".check, .cmdq-btn.check");
            var box = check && check.closest(".quiz-item, .cmdq");
            if (box) setTimeout(function () { judgeBox(box, check, "", true); }, 0);
        }, true);
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Enter" || e.isComposing || !e.target.closest) return;
            var box = e.target.closest(".quiz-item, .cmdq");
            if (!box || !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
            var before = stamp(feedbackOf(box));
            var from = box.querySelector(".check, .cmdq-btn.check") || e.target;
            setTimeout(function () { judgeBox(box, from, before, false); }, 0);
        }, true);

        // 점수판 · '틀린 문제 복사' 버튼 숫자가 바뀌면 톡
        [].forEach.call(document.querySelectorAll("#quiz-score, .quiz-score, #rv-fab"), function (el) {
            new MutationObserver(function () { if (recent(1500)) pop(el, 1.08); })
                .observe(el, { childList: true, characterData: true, subtree: true });
        });
    }

    // ================= ⑧ ⑨ 빛 · 물결 · 잠김 =================
    var SPOT = ".bigbtn, .subject, a.wk-btn, .wk-pager a";
    var RIPPLE = ".opt, .quiz-btn, .cmdq-btn, .quiz-item .check, .quiz-item .show, .haksa-arrow, .haksa-more, .haksa-open, .toc a, "
               + "#rv-fab, .rv-btn, .quiz-filter button, .quiz-mode button, a.wk-btn, .wk-pager a, .cc-btn, #mo-top";

    function setupPointer() {
        document.addEventListener("pointerdown", function (e) {
            lastInput = Date.now(); lastX = e.clientX; lastY = e.clientY;
            if (!MOVE || e.button > 0 || !e.target.closest) return;
            var el = e.target.closest(RIPPLE);
            if (!el || el.disabled || el.closest(".hero-clock")) return;
            if (window.getComputedStyle(el).position === "static") el.classList.add("mo-rel");
            el.classList.add("mo-clip");
            var r = el.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
            var s = document.createElement("span");
            s.className = "mo-ripple";
            s.setAttribute("aria-hidden", "true");
            s.setAttribute("data-theme-skip", "");
            s.style.width = s.style.height = size + "px";
            s.style.left = (e.clientX - r.left - size / 2) + "px";
            s.style.top = (e.clientY - r.top - size / 2) + "px";
            el.appendChild(s);
            setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
        }, true);
        document.addEventListener("keydown", function () { lastInput = Date.now(); }, true);

        // 잠긴 버튼은 살짝 흔들어 '아직 안 열림'을 알림
        document.addEventListener("pointerup", function (e) {
            var el = e.target.closest && e.target.closest(".bigbtn.soon, .wk-btn.locked");
            if (el && !el.closest(".hero-clock")) shake(el, 5);
        }, true);

        if (!MOVE || !FINE) return;
        [].forEach.call(document.querySelectorAll(SPOT), function (el) { el.classList.add("mo-spot"); });
        document.addEventListener("pointerover", function (e) {
            var el = e.target.closest && e.target.closest(SPOT);
            if (el) el.classList.add("mo-spot");
        }, true);
        var spotEl = null, sx = 0, sy = 0, raf = 0;
        document.addEventListener("pointermove", function (e) {
            var el = e.target.closest && e.target.closest(".mo-spot");
            if (!el) return;
            spotEl = el; sx = e.clientX; sy = e.clientY;
            if (raf) return;
            raf = requestAnimationFrame(function () {
                raf = 0;
                var r = spotEl.getBoundingClientRect();
                spotEl.style.setProperty("--mx", (sx - r.left).toFixed(0) + "px");
                spotEl.style.setProperty("--my", (sy - r.top).toFixed(0) + "px");
            });
        }, { passive: true });
    }

    // ================= 시작 =================
    var started = false;
    function init() {
        if (started) return;
        started = true;
        var st = document.createElement("style");
        st.id = "motion-css";
        st.setAttribute("data-theme-skip", "");
        st.textContent = css.join("\n");
        document.head.appendChild(st);                                  // quiz.js · weeks.js · theme.js 스타일보다 뒤에

        var hub = !!document.querySelector(".screen");
        if (MOVE) root.classList.add("mo-on");
        setupPointer();
        if (hub) {
            setupHub();
        } else {
            if (MOVE) root.classList.add("mo-smooth");
            splitTitle();
            setupReveal();
            setupProgress();
            setupAnchors();
            setupQuiz();
            var fab = document.getElementById("rv-fab");
            if (fab && MOVE) fab.animate([{ opacity: 0, transform: "translateY(20px) scale(.9)" }, { opacity: 1, transform: "none" }],
                                         { duration: 600, delay: 450, easing: SPRING, fill: "backwards" });
        }
        root.classList.remove("mo-boot");
    }

    // 본문이 다 만들어지고(weeks.js · review.js 포함) theme.js 가 화면을 보여준 뒤 시작
    function whenShown(cb) {
        if (!root.classList.contains("theme-pending")) return cb();
        var ob = new MutationObserver(function () {
            if (!root.classList.contains("theme-pending")) { ob.disconnect(); cb(); }
        });
        ob.observe(root, { attributes: true, attributeFilter: ["class"] });
    }
    function ready() { whenShown(function () { try { init(); } catch (err) { root.classList.remove("mo-boot"); } }); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
    else ready();
})();
