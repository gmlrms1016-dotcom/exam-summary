/* figink.js — 🎨 그림 정리 페이지(weeks/anim/*-그림정리.html)의 그림 위 Apple Pencil 필기 · 2026-10-21
 *
 *  - 획은 그 그림(svg)의 좌표(viewBox 600 폭)로 저장 → 주차 페이지 · 중간고사 · 완전정리에 끼운 크기 · 폰 · 아이패드가 달라도 같은 자리
 *  - 펜 종류 · 색 · 굵기는 페이지 필기 막대(ink.js)에서 고른 것을 그대로 씀 (localStorage ink:prefs2 공유)
 *    → 막대에서 지우개를 고르면 지우개 · 필기 끄기면 펜슬로 스크롤 · 필기 숨기기면 그림 필기도 숨김
 *  - 펜슬 = 언제나 필기 · 손가락 · 마우스 = 그림 아래 ✏️ 버튼을 켰을 때 (figink:prefs)
 *  - 저장: 이 기기 브라우저 localStorage figink:<그림 파일 경로>:<그림 id> — 다른 기기와 공유되지 않음
 *  - 같은 그림을 여러 곳에 끼워도(?week= · ?weeks= · #탭) 파일 경로가 같아서 필기가 같이 보임
 */
(function () {
    "use strict";
    if (window.__figinkLoaded) return;
    window.__figinkLoaded = true;
    var NS = "http://www.w3.org/2000/svg";
    var KEY = "figink:" + decodeURIComponent(location.pathname) + ":";
    var DRAW = /^(pen|monoline|fountain|reed|marker|pencil|crayon|watercolor)$/;
    var FP = { touch: false, erase: false };
    try { var fp = JSON.parse(localStorage.getItem("figink:prefs") || "null"); if (fp) { FP.touch = !!fp.touch; FP.erase = !!fp.erase; } } catch (e) {}
    function saveFP() { try { localStorage.setItem("figink:prefs", JSON.stringify(FP)); } catch (e) {} }
    function inkPrefs() {
        var ip = {};
        try { ip = JSON.parse(localStorage.getItem("ink:prefs2") || "null") || {}; } catch (e) {}
        if (!ip.v6) {                                          // ink.js v6 기본값 (페이지 필기 막대를 아직 안 연 기기): 펜 굵기 1.8 → 3.5 · 마커 불투명도 35 → 80
            if (ip.pen && ip.pen.w === 1.8) ip.pen.w = 3.5;
            if (ip.marker && ip.marker.o === 0.35) ip.marker.o = 0.8;
        }
        return ip;
    }
    function load(id) { try { return JSON.parse(localStorage.getItem(KEY + id) || "[]") || []; } catch (e) { return []; } }
    function save(id, arr) { try { if (arr.length) localStorage.setItem(KEY + id, JSON.stringify(arr)); else localStorage.removeItem(KEY + id); } catch (e) {} }
    function r1(v) { return Math.round(v * 10) / 10; }

    /* ---------- 그리기 ---------- */
    function layer(svg) {                                      // 그림 맨 위에 필기 층 (단계 · 다시 그리기와 상관없이 늘 보임)
        var g = null;
        for (var i = 0; i < svg.children.length; i++) if (svg.children[i].getAttribute("class") === "fig-ink") g = svg.children[i];
        if (!g) { g = document.createElementNS(NS, "g"); g.setAttribute("class", "fig-ink"); }
        if (svg.lastElementChild !== g) svg.appendChild(g);
        return g;
    }
    function pathD(p) {                                        // 점들을 이어 부드러운 곡선 (가운데 점을 지나는 2차 곡선)
        if (p.length < 4) return "M" + p[0] + "," + p[1] + " l0.01,0";
        var d = "M" + p[0] + "," + p[1];
        for (var i = 2; i < p.length - 2; i += 2) d += " Q" + p[i] + "," + p[i + 1] + " " + r1((p[i] + p[i + 2]) / 2) + "," + r1((p[i + 1] + p[i + 3]) / 2);
        return d + " L" + p[p.length - 2] + "," + p[p.length - 1];
    }
    function strokeEl(st) {
        var e = document.createElementNS(NS, "path");
        e.setAttribute("d", pathD(st.p));
        e.setAttribute("fill", "none");
        e.setAttribute("stroke-linecap", "round");
        e.setAttribute("stroke-linejoin", "round");
        e.style.stroke = !st.c || st.c === "auto" ? "var(--ink)" : st.c;
        e.style.strokeWidth = st.w;
        e.style.opacity = st.o;
        if (st.t === "marker" || st.t === "watercolor") e.setAttribute("class", "fi-mk");   // 형광펜 · 수채화는 그림과 곱하기로 섞어 아래 글자가 비침
        return e;
    }
    function render(svg) {
        var g = layer(svg), id = svg.getAttribute("data-fig");
        while (g.firstChild) g.removeChild(g.firstChild);
        g.style.display = inkPrefs().hidden ? "none" : "";
        load(id).forEach(function (st) { g.appendChild(strokeEl(st)); });
    }
    function renderAll() { Array.prototype.forEach.call(document.querySelectorAll("svg[data-fig]"), render); }
    function visibleSvg() { return document.querySelector("svg[data-fig]:not([hidden])"); }

    /* ---------- 입력 ---------- */
    function toSvg(svg, e) {                                   // 화면 좌표 → 그림 좌표
        var m = svg.getScreenCTM();
        if (!m) return null;
        var q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY;
        q = q.matrixTransform(m.inverse());
        return [r1(q.x), r1(q.y)];
    }
    function perPx(svg) {                                      // 화면 1px = 그림 몇 단위 (필기 막대 굵기를 그림 좌표로)
        var w = svg.getBoundingClientRect().width;
        return w ? svg.viewBox.baseVal.width / w : 1;
    }
    function allowed(e) {
        var ip = inkPrefs();
        if (ip.off || ip.hidden) return false;                 // 필기 끔 → 펜슬로 스크롤
        if (e.pointerType === "pen") return true;              // 펜슬은 언제나
        if (!FP.touch) return false;
        return e.pointerType !== "mouse" || e.button === 0;
    }
    function eraseAt(c, x, y) {
        var arr = load(c.id), n = arr.length, r2 = c.r * c.r;
        arr = arr.filter(function (st) {
            for (var i = 0; i < st.p.length; i += 2) { var dx = st.p[i] - x, dy = st.p[i + 1] - y; if (dx * dx + dy * dy <= r2 + st.w * st.w / 4) return false; }
            return true;
        });
        if (arr.length !== n) { save(c.id, arr); render(c.svg); }
    }
    var cur = null;
    function onDown(e) {
        var svg = e.target && e.target.closest ? e.target.closest("svg[data-fig]") : null;
        if (!svg || !allowed(e)) return;
        var p = toSvg(svg, e);
        if (!p) return;
        e.preventDefault();
        try { svg.setPointerCapture(e.pointerId); } catch (x) {}
        var ip = inkPrefs(), s = perPx(svg), id = svg.getAttribute("data-fig");
        if (FP.erase || ip.tool === "eraser") {
            cur = { svg: svg, id: id, erase: true, r: ((ip.eraser && ip.eraser.w) || 22) * s / 2 };
            eraseAt(cur, p[0], p[1]);
            return;
        }
        var kind = DRAW.test(ip.tool || "") ? ip.tool : (DRAW.test(ip.lastDraw || "") ? ip.lastDraw : "pen");
        var set = ip[kind] || {}, def = kind === "marker" ? { c: "#fed030", w: 18, o: 0.8 } : { c: "#ff3b30", w: 3.5, o: 1 };
        var st = { t: kind, c: set.c || def.c, w: r1(Math.max(0.6, (set.w || def.w) * s)), o: set.o == null ? def.o : set.o, p: p };
        var el = strokeEl(st);
        layer(svg).appendChild(el);
        cur = { svg: svg, id: id, st: st, el: el };
    }
    function onMove(e) {
        if (!cur) return;
        e.preventDefault();
        var p = toSvg(cur.svg, e);
        if (!p) return;
        if (cur.erase) { eraseAt(cur, p[0], p[1]); return; }
        var a = cur.st.p;
        if (Math.abs(p[0] - a[a.length - 2]) + Math.abs(p[1] - a[a.length - 1]) < 0.8) return;
        a.push(p[0], p[1]);
        cur.el.setAttribute("d", pathD(a));
    }
    function onUp() {
        if (!cur) return;
        if (!cur.erase) { var arr = load(cur.id); arr.push(cur.st); save(cur.id, arr); }
        cur = null;
    }
    function blockTouch(e) {                                   // 그림 위 펜슬 터치는 스크롤 · 확대 막기
        var t = e.touches && e.touches[0];
        if (!t) return;
        var svg = e.target && e.target.closest ? e.target.closest("svg[data-fig]") : null;
        if (!svg) return;
        var ip = inkPrefs();
        if (ip.off || ip.hidden) return;
        if (t.touchType === "stylus" || FP.touch || cur) e.preventDefault();
    }

    /* ---------- 그림 아래 버튼 ---------- */
    function ui() {
        var ctl = document.querySelector(".ctl");
        if (!ctl) return;
        var st = document.createElement("style");
        st.textContent = ".fi-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0 0}"
            + ".fi-bar button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:6px 10px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}"
            + ".fi-bar button[aria-pressed=true]{border-color:var(--main);color:var(--main);box-shadow:inset 0 0 0 1px var(--main)}"
            + ".fi-tip{font-size:12.5px;color:var(--ink2);margin-right:auto}"
            + "html.fi-touch svg[data-fig]{touch-action:none;cursor:crosshair}";
        document.head.appendChild(st);
        var bar = document.createElement("div");
        bar.className = "fi-bar";
        bar.innerHTML = '<span class="fi-tip">✍️ 애플펜슬로 그림 위에 바로 필기 · 펜 · 색은 페이지 필기 막대에서</span>'
            + '<button type="button" data-k="touch"></button><button type="button" data-k="erase"></button>'
            + '<button type="button" data-k="undo">↶ 되돌리기</button><button type="button" data-k="clear">🗑 이 그림 필기 지우기</button>';
        ctl.parentNode.insertBefore(bar, ctl.nextSibling);
        function sync() {
            var t = bar.querySelector("[data-k=touch]"), er = bar.querySelector("[data-k=erase]");
            t.textContent = FP.touch ? "✏️ 손가락 · 마우스 필기 켜짐" : "✏️ 손가락 · 마우스로도 쓰기";
            t.setAttribute("aria-pressed", FP.touch ? "true" : "false");
            er.textContent = FP.erase ? "🧽 지우개 켜짐" : "🧽 지우개";
            er.setAttribute("aria-pressed", FP.erase ? "true" : "false");
            document.documentElement.classList.toggle("fi-touch", FP.touch);
        }
        bar.addEventListener("click", function (e) {
            var b = e.target.closest ? e.target.closest("button") : null;
            if (!b) return;
            var k = b.getAttribute("data-k"), svg = visibleSvg();
            if (k === "touch") { FP.touch = !FP.touch; saveFP(); }
            else if (k === "erase") { FP.erase = !FP.erase; saveFP(); }
            else if (svg) {
                var id = svg.getAttribute("data-fig"), arr = load(id);
                if (k === "undo" && arr.length) { arr.pop(); save(id, arr); render(svg); }
                if (k === "clear" && arr.length && window.confirm("이 그림의 필기를 모두 지울까요?")) { save(id, []); render(svg); }
            }
            sync();
        });
        sync();
    }

    function init() {
        var mk = document.createElement("style");
        mk.textContent = "html[data-theme=light] svg[data-fig] .fi-mk{mix-blend-mode:multiply} html[data-theme=dark] svg[data-fig] .fi-mk{mix-blend-mode:screen}";
        document.head.appendChild(mk);
        renderAll();
        ui();
        document.addEventListener("pointerdown", onDown, { capture: true, passive: false });
        window.addEventListener("pointermove", onMove, { capture: true, passive: false });
        window.addEventListener("pointerup", onUp, true);
        window.addEventListener("pointercancel", onUp, true);
        document.addEventListener("touchstart", blockTouch, { capture: true, passive: false });
        document.addEventListener("touchmove", blockTouch, { capture: true, passive: false });
        window.addEventListener("storage", function (e) {     // 같은 그림을 끼운 다른 창 · 필기 막대 설정이 바뀌면 다시 그림
            if (e.key && (e.key.indexOf(KEY) === 0 || e.key === "ink:prefs2")) renderAll();
        });
        window.figink = { renderAll: renderAll };
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
