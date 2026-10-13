/* ink.js — 주차 페이지 위에 Apple Pencil(펜) · 마우스로 필기하기 (PDF 위에 쓰듯) · 2026-10-13
 *
 *  ✏️ 버튼(왼쪽 아래) → 필기 모드
 *   - 펜(Apple Pencil) · 마우스 = 쓰기 / 손가락 = 그대로 스크롤 · 탭 (☝️ 를 켜면 손가락으로도 쓰기)
 *   - 펜 3색 · 형광펜 · 지우개(획 단위) · 되돌리기 · 다시 하기 · 이 쪽 필기 전부 지우기 · 필기 숨기기
 *  필기는 이 기기 브라우저(IndexedDB)에 쪽 주소별로 저장 — 다른 기기 · 다른 브라우저와는 공유되지 않음
 *  획마다 그 자리의 글 블록(문단 · 코드 · 표 · 접기 …)에 붙여 저장 → 접기를 열고 닫거나 위쪽 내용 높이가
 *  바뀌어도 그 블록을 따라감 (화면 폭이 크게 바뀌면 줄바꿈 때문에 조금 어긋날 수 있음)
 */
(function () {
    "use strict";
    if (window.__inkLoaded) return;
    window.__inkLoaded = true;

    var root = document.documentElement;
    var PAGE_KEY = "ink:" + decodeURIComponent(location.pathname);
    var SVGNS = "http://www.w3.org/2000/svg";
    var PENS = { r: "#ff3b30", b: "#0a84ff", k: null, y: "#ffd60a" };   // k = 본문 글자색(테마 따라)
    var SIZE = { pen: 2.4, hl: 16 };

    var strokes = [];          // { a: 블록 키, fx, fy: 그릴 때 블록 위치(못 찾을 때 대비), c: 색, h: 형광 0/1, s: 굵기, p: [x, y, …] 블록 기준 }
    var undo = [], redo = [];
    var on = false, tool = "r", eraser = false, finger = false, hidden = false;
    var cur = null;            // 지금 그리는 획 { st, path, ax, ay }
    var svg, bar, fab;

    /* ---------- 저장 (IndexedDB · 안 되면 localStorage) ---------- */
    var idb = null;
    function openDB() {
        return new Promise(function (res) {
            try {
                var rq = indexedDB.open("study-ink", 1);
                rq.onupgradeneeded = function () { rq.result.createObjectStore("pages"); };
                rq.onsuccess = function () { idb = rq.result; res(idb); };
                rq.onerror = function () { res(null); };
            } catch (e) { res(null); }
        });
    }
    function load() {
        return openDB().then(function (db) {
            return new Promise(function (res) {
                if (!db) {
                    try { res(JSON.parse(localStorage.getItem(PAGE_KEY) || "null")); } catch (e) { res(null); }
                    return;
                }
                try {
                    var rq = db.transaction("pages").objectStore("pages").get(PAGE_KEY);
                    rq.onsuccess = function () { res(rq.result || null); };
                    rq.onerror = function () { res(null); };
                } catch (e) { res(null); }
            });
        });
    }
    var saveTimer = 0;
    function save() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            var data = { v: 1, strokes: strokes };
            try {
                if (idb) idb.transaction("pages", "readwrite").objectStore("pages").put(data, PAGE_KEY);
                else localStorage.setItem(PAGE_KEY, JSON.stringify(data));
            } catch (e) { toast("필기를 저장하지 못했어요 (브라우저 저장 공간을 확인해 주세요)"); }
        }, 300);
    }
    function loadPrefs() {
        try {
            var p = JSON.parse(localStorage.getItem("ink:prefs") || "{}");
            if (p.tool) tool = p.tool;
            finger = !!p.finger;
            hidden = !!p.hidden;
        } catch (e) {}
    }
    function savePrefs() {
        try { localStorage.setItem("ink:prefs", JSON.stringify({ tool: tool, finger: finger, hidden: hidden })); } catch (e) {}
    }

    /* ---------- 글 블록(앵커) ---------- */
    var ANCHOR_SEL = ".wrap > :not(script):not(style), section.card > :not(details), details > :not(summary), details > summary";
    var anchorCache = null;
    function hash(s) {
        var h = 5381;
        for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
        return (h >>> 0).toString(36);
    }
    function anchors() {
        if (anchorCache) return anchorCache;
        var list = [], seen = {}, map = {};
        var els = document.querySelectorAll(ANCHOR_SEL);
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.closest(".ink-ui") || el === svg) continue;
            var base = el.tagName.toLowerCase() + ":" + hash((el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120));
            var n = seen[base] = (seen[base] || 0) + 1;
            var key = base + ":" + n;
            list.push({ el: el, key: key });
            map[key] = el;
        }
        anchorCache = { list: list, map: map };
        return anchorCache;
    }
    function boxOf(el) {
        var r = el.getBoundingClientRect();
        if (!r.width && !r.height) return null;                       // 닫힌 접기 안 → 안 보임
        return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    }
    function anchorAt(px, py) {                                       // 문서 좌표 → 가장 알맞은 블록
        var A = anchors().list, best = null, bestScore = Infinity;
        for (var i = 0; i < A.length; i++) {
            var b = boxOf(A[i].el);
            if (!b) continue;
            var dy = py < b.y ? b.y - py : (py > b.y + b.h ? py - (b.y + b.h) : 0);
            var dx = px < b.x ? b.x - px : (px > b.x + b.w ? px - (b.x + b.w) : 0);
            var score = dy * 4 + dx + (dy === 0 && dx === 0 ? -1e6 + b.w * b.h / 1e4 : 0);   // 안에 들면 가장 작은 블록
            if (score < bestScore) { bestScore = score; best = { key: A[i].key, b: b }; }
        }
        return best;
    }

    /* ---------- 그리기 ---------- */
    function colorOf(st) {
        if (st.c === "k") return root.getAttribute("data-theme") === "light" ? "#1c1c1e" : "#f2f2f7";
        return PENS[st.c] || PENS.r;
    }
    function dOf(pts, ox, oy) {
        var n = pts.length / 2;
        if (!n) return "";
        var x0 = pts[0] + ox, y0 = pts[1] + oy;
        if (n === 1) return "M" + x0 + " " + y0 + "l0.01 0";
        var d = "M" + x0.toFixed(1) + " " + y0.toFixed(1);
        for (var i = 1; i < n - 1; i++) {                             // 중간점을 잇는 부드러운 곡선
            var x1 = pts[2 * i] + ox, y1 = pts[2 * i + 1] + oy;
            var x2 = pts[2 * i + 2] + ox, y2 = pts[2 * i + 3] + oy;
            d += "Q" + x1.toFixed(1) + " " + y1.toFixed(1) + " " + ((x1 + x2) / 2).toFixed(1) + " " + ((y1 + y2) / 2).toFixed(1);
        }
        d += "L" + (pts[2 * n - 2] + ox).toFixed(1) + " " + (pts[2 * n - 1] + oy).toFixed(1);
        return d;
    }
    function makePath(st) {
        var p = document.createElementNS(SVGNS, "path");
        p.setAttribute("fill", "none");
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("stroke-linejoin", "round");
        p.setAttribute("stroke-width", st.s);
        p.setAttribute("stroke", colorOf(st));
        if (st.h) p.setAttribute("stroke-opacity", "0.38");
        return p;
    }
    function originOf(st) {
        var el = anchors().map[st.a];
        if (el) { var b = boxOf(el); return b ? { x: b.x, y: b.y } : null; }
        return { x: st.fx, y: st.fy };                                // 블록을 못 찾으면 그릴 때 자리
    }
    var paths = [];
    function renderAll() {
        if (!svg) return;
        anchorCache = null;
        svg.style.width = "0px";                                      // 먼저 줄여야 접기를 닫았을 때 문서 높이가 줄어듦
        svg.style.height = "0px";
        var W = Math.max(root.scrollWidth, document.body.scrollWidth), H = Math.max(root.scrollHeight, document.body.scrollHeight);
        svg.setAttribute("width", W);
        svg.setAttribute("height", H);
        svg.style.width = W + "px";
        svg.style.height = H + "px";
        svg.style.display = hidden ? "none" : "";
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        paths = [];
        for (var i = 0; i < strokes.length; i++) {
            var st = strokes[i], o = originOf(st), p = makePath(st);
            if (o) p.setAttribute("d", dOf(st.p, o.x, o.y));
            else p.style.display = "none";
            svg.appendChild(p);
            paths.push(p);
        }
        if (cur) svg.appendChild(cur.path);
    }
    var raf = 0;
    function relayout() {
        if (raf) return;
        raf = setTimeout(function () { raf = 0; renderAll(); }, 30);   // rAF 는 탭이 가려지면 멈춰서 setTimeout
    }

    /* ---------- 입력 ---------- */
    function inUI(t) { return t && t.closest && t.closest(".ink-ui"); }
    function wantsPointer(e) {
        if (!on || inUI(e.target)) return false;
        if (e.pointerType === "pen") return true;
        if (e.pointerType === "mouse") return e.button === 0;
        return e.pointerType === "touch" && finger;
    }
    function startStroke(e) {
        var px = docX(e), py = docY(e);
        var a = anchorAt(px, py);
        var ax = a ? a.b.x : 0, ay = a ? a.b.y : 0;
        var st = { a: a ? a.key : "", fx: ax, fy: ay, c: tool, h: tool === "y" ? 1 : 0, s: tool === "y" ? SIZE.hl : SIZE.pen, p: [r1(px - ax), r1(py - ay)] };
        var path = makePath(st);
        path.setAttribute("d", dOf(st.p, ax, ay));
        svg.appendChild(path);
        cur = { st: st, path: path, ax: ax, ay: ay, lx: px, ly: py };
    }
    function docX(e) { return e.clientX + window.scrollX; }        // 문서 좌표 = 화면 좌표 + 스크롤 (스크롤하면 필기가 글과 같이 움직임)
    function docY(e) { return e.clientY + window.scrollY; }
    function r1(v) { return Math.round(v * 10) / 10; }
    function moveStroke(e) {
        var list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        if (!list.length) list = [e];
        for (var i = 0; i < list.length; i++) {
            var px = docX(list[i]), py = docY(list[i]);
            if (Math.abs(px - cur.lx) + Math.abs(py - cur.ly) < 1.2) continue;   // 너무 가까운 점은 버림
            cur.lx = px; cur.ly = py;
            cur.st.p.push(r1(px - cur.ax), r1(py - cur.ay));
        }
        cur.path.setAttribute("d", dOf(cur.st.p, cur.ax, cur.ay));
    }
    function endStroke() {
        if (!cur) return;
        var st = cur.st;
        cur = null;
        strokes.push(st);
        undo.push({ t: "add", s: st });
        redo = [];
        save();
        renderAll();
        syncBar();
    }
    function eraseAt(px, py) {
        var hit = [];
        for (var i = strokes.length - 1; i >= 0; i--) {
            var st = strokes[i], o = originOf(st);
            if (!o) continue;
            var r = Math.max(12, st.s);
            for (var k = 0; k < st.p.length; k += 2) {
                var dx = st.p[k] + o.x - px, dy = st.p[k + 1] + o.y - py;
                if (dx * dx + dy * dy <= r * r) { hit.push(i); break; }
            }
        }
        if (!hit.length) return;
        var removed = hit.map(function (i) { return { i: i, s: strokes[i] }; });
        hit.forEach(function (i) { strokes.splice(i, 1); });            // 뒤에서부터 지움
        undo.push({ t: "erase", list: removed });
        redo = [];
        save();
        renderAll();
        syncBar();
    }
    var drawing = false, lastWasDraw = 0;
    function onDown(e) {
        if (!wantsPointer(e)) return;
        e.preventDefault();
        drawing = true;
        lastWasDraw = Date.now();
        if (eraser) eraseAt(docX(e), docY(e));
        else startStroke(e);
    }
    function onMove(e) {
        if (!drawing) return;
        e.preventDefault();
        if (eraser) eraseAt(docX(e), docY(e));
        else if (cur) moveStroke(e);
    }
    function onUp() {
        if (!drawing) return;
        drawing = false;
        lastWasDraw = Date.now();
        if (!eraser) endStroke();
    }
    function blockTouch(e) {                                          // 펜(stylus) 터치는 스크롤 · 확대 막기
        if (!on || inUI(e.target)) return;
        var t = e.touches && e.touches[0];
        if (!t) return;
        if (t.touchType === "stylus" || finger) e.preventDefault();
    }

    /* ---------- 되돌리기 · 지우기 ---------- */
    function doUndo() {
        var op = undo.pop();
        if (!op) return;
        if (op.t === "add") strokes.splice(strokes.lastIndexOf(op.s), 1);
        else if (op.t === "erase") op.list.slice().reverse().forEach(function (r) { strokes.splice(r.i, 0, r.s); });
        else if (op.t === "clear") strokes = op.prev.slice();
        redo.push(op);
        save(); renderAll(); syncBar();
    }
    function doRedo() {
        var op = redo.pop();
        if (!op) return;
        if (op.t === "add") strokes.push(op.s);
        else if (op.t === "erase") op.list.forEach(function (r) { var j = strokes.indexOf(r.s); if (j >= 0) strokes.splice(j, 1); });
        else if (op.t === "clear") strokes = [];
        undo.push(op);
        save(); renderAll(); syncBar();
    }
    function doClear() {
        if (!strokes.length) return;
        if (!confirm("이 쪽의 필기를 모두 지울까요? (되돌리기로 다시 살릴 수 있어요)")) return;
        undo.push({ t: "clear", prev: strokes.slice() });
        redo = [];
        strokes = [];
        save(); renderAll(); syncBar();
    }

    /* ---------- 화면 (버튼 · 도구 막대) ---------- */
    var CSS = [
        ".ink-svg{position:absolute;left:0;top:0;pointer-events:none;z-index:9980;overflow:visible}",
        "html.ink-on body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}",
        "html.ink-on.ink-finger{touch-action:none}",
        ".ink-fab{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:10002;width:48px;height:48px;border-radius:50%;",
        "border:1px solid var(--line,#d7ddd7);background:var(--card,#fff);color:inherit;font-size:22px;line-height:46px;text-align:center;cursor:pointer;",
        "box-shadow:0 4px 14px rgba(0,0,0,.25);padding:0;-webkit-tap-highlight-color:transparent}",
        ".ink-fab .ink-n{position:absolute;right:-4px;top:-4px;min-width:18px;height:18px;border-radius:9px;background:#ff3b30;color:#fff;font-size:11px;line-height:18px;font-weight:800;padding:0 4px;display:none}",
        ".ink-bar{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:10003;display:none;align-items:center;gap:4px;",
        "max-width:calc(100vw - 96px);overflow-x:auto;-webkit-overflow-scrolling:touch;padding:6px;border-radius:16px;",
        "border:1px solid var(--line,#d7ddd7);background:var(--card,#fff);box-shadow:0 6px 22px rgba(0,0,0,.3)}",
        "html.ink-on .ink-bar{display:flex} html.ink-on .ink-fab{display:none}",
        ".ink-bar button{flex:0 0 auto;min-width:40px;height:40px;border-radius:11px;border:1px solid transparent;background:transparent;color:inherit;",
        "font-size:18px;line-height:1;cursor:pointer;padding:0 6px;-webkit-tap-highlight-color:transparent;font-weight:800}",
        ".ink-bar button.on{border-color:var(--main,#2d6a4f);background:rgba(127,127,127,.16)}",
        ".ink-bar button:disabled{opacity:.35}",
        ".ink-bar .ink-dot{display:inline-block;width:18px;height:18px;border-radius:50%;vertical-align:middle}",
        ".ink-bar .ink-sep{flex:0 0 1px;align-self:stretch;background:var(--line,#d7ddd7);margin:4px 2px}",
        ".ink-bar .ink-done{font-size:14px;padding:0 12px;background:var(--main,#2d6a4f);color:#fff}",
        ".ink-toast{position:fixed;left:50%;bottom:calc(124px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:10004;",
        "background:rgba(0,0,0,.82);color:#fff;font-size:13px;padding:9px 14px;border-radius:12px;max-width:86vw;text-align:center;pointer-events:none;",
        "opacity:0;transition:opacity .2s}",
        ".ink-toast.show{opacity:1}",
        "@media (max-width:600px){.ink-bar{flex-wrap:wrap;max-width:calc(100vw - 24px);overflow:visible}}",   // 폰: 두 줄로
        "@media print{.ink-fab,.ink-bar,.ink-toast{display:none!important}}"
    ].join("");
    var toastEl, toastTimer;
    function toast(msg) {
        if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "ink-toast ink-ui"; document.body.appendChild(toastEl); }
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
    }
    function btn(html, title, fn, cls) {
        var b = document.createElement("button");
        b.type = "button";
        b.innerHTML = html;
        b.title = title;
        b.setAttribute("aria-label", title);
        if (cls) b.className = cls;
        b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); fn(); });
        return b;
    }
    var B = {};
    function dot(c) { return '<span class="ink-dot" style="background:' + c + '"></span>'; }
    function buildUI() {
        var st = document.createElement("style");
        st.textContent = CSS;
        document.head.appendChild(st);

        svg = document.createElementNS(SVGNS, "svg");
        svg.setAttribute("class", "ink-svg");
        svg.setAttribute("aria-hidden", "true");
        document.body.appendChild(svg);

        fab = btn('✏️<span class="ink-n"></span>', "펜슬로 필기하기", function () { setOn(true); }, "ink-fab ink-ui");
        document.body.appendChild(fab);

        bar = document.createElement("div");
        bar.className = "ink-bar ink-ui";
        bar.setAttribute("role", "toolbar");
        bar.setAttribute("aria-label", "필기 도구");
        B.r = btn(dot(PENS.r), "빨간 펜", function () { pick("r"); });
        B.b = btn(dot(PENS.b), "파란 펜", function () { pick("b"); });
        B.k = btn('<span class="ink-dot" style="background:currentColor"></span>', "글자색 펜", function () { pick("k"); });
        B.y = btn("🖍️", "형광펜", function () { pick("y"); });
        B.e = btn("🧽", "지우개 (획을 문지르면 지워짐)", function () { eraser = !eraser; syncBar(); toast(eraser ? "지우개 — 지울 획을 펜으로 문지르세요" : "펜으로 돌아왔어요"); });
        B.f = btn("☝️", "손가락으로도 쓰기 (켜면 손가락 스크롤이 막혀요)", function () {
            finger = !finger; savePrefs(); syncBar();
            toast(finger ? "손가락으로도 써요 — 스크롤은 막혀요" : "손가락은 스크롤 · 펜슬만 써요");
        });
        B.u = btn("↶", "되돌리기", doUndo);
        B.d = btn("↷", "다시 하기", doRedo);
        B.h = btn("👁️", "필기 숨기기 / 보이기", function () { hidden = !hidden; savePrefs(); renderAll(); syncBar(); });
        B.c = btn("🗑️", "이 쪽 필기 모두 지우기", doClear);
        B.x = btn("완료", "필기 모드 끝내기", function () { setOn(false); }, "ink-done");
        [B.r, B.b, B.k, B.y, sep(), B.e, B.f, sep(), B.u, B.d, B.h, B.c, sep(), B.x].forEach(function (el) { bar.appendChild(el); });
        document.body.appendChild(bar);
    }
    function sep() { var s = document.createElement("span"); s.className = "ink-sep"; return s; }
    function pick(c) { tool = c; eraser = false; savePrefs(); syncBar(); }
    function syncBar() {
        if (!bar) return;
        ["r", "b", "k", "y"].forEach(function (c) { B[c].classList.toggle("on", !eraser && tool === c); });
        B.e.classList.toggle("on", eraser);
        B.f.classList.toggle("on", finger);
        B.h.classList.toggle("on", hidden);
        B.u.disabled = !undo.length;
        B.d.disabled = !redo.length;
        B.c.disabled = !strokes.length;
        root.classList.toggle("ink-finger", on && finger);
        var n = fab.querySelector(".ink-n");
        n.textContent = strokes.length > 99 ? "99+" : String(strokes.length);
        n.style.display = strokes.length ? "block" : "none";
    }
    function setOn(v) {
        on = v;
        root.classList.toggle("ink-on", on);
        if (on && hidden) { hidden = false; savePrefs(); renderAll(); }
        syncBar();
        if (on) toast(finger ? "필기 모드 — 펜슬 · 손가락으로 써요" : "필기 모드 — 펜슬로 쓰고, 손가락으로 스크롤해요");
    }

    /* ---------- 시작 ---------- */
    function init() {
        if (!document.querySelector(".wrap")) return;
        loadPrefs();
        buildUI();
        syncBar();
        load().then(function (data) {
            strokes = (data && data.strokes) || [];
            renderAll();
            syncBar();
        });
        document.addEventListener("pointerdown", onDown, { capture: true, passive: false });
        window.addEventListener("pointermove", onMove, { capture: true, passive: false });
        window.addEventListener("pointerup", onUp, true);
        window.addEventListener("pointercancel", onUp, true);
        document.addEventListener("touchstart", blockTouch, { capture: true, passive: false });
        document.addEventListener("touchmove", blockTouch, { capture: true, passive: false });
        document.addEventListener("click", function (e) {             // 펜 · 마우스로 쓰다가 링크 · 버튼이 눌리지 않게
            if (on && !inUI(e.target) && Date.now() - lastWasDraw < 400) { e.preventDefault(); e.stopPropagation(); }
        }, true);
        document.addEventListener("toggle", relayout, true);           // 접기 열고 닫기
        window.addEventListener("resize", relayout);
        window.addEventListener("load", relayout);
        if (window.ResizeObserver) new ResizeObserver(relayout).observe(document.body);
        new MutationObserver(function () { renderAll(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
        document.addEventListener("keydown", function (e) {
            if (!on) return;
            var k = e.key.toLowerCase();
            if ((e.metaKey || e.ctrlKey) && k === "z") { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); }
            else if (k === "escape") setOn(false);
        });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
