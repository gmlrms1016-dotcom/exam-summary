/* ink.js — 페이지 위에 Apple Pencil 로 필기 (아이패드 미리보기 PDF 마크업처럼) · 2026-10-13
 *
 *  쓰는 곳: 주차 페이지(weeks/*.html) · 과목 「완전 정리」 페이지 — 전공 · 교양 모두
 *  - Apple Pencil 은 언제나 필기 (도구 막대를 접어도) · 손가락은 스크롤 · 탭
 *    더보기 → 「손가락으로 그리기」(막대를 펼쳤을 때) · 「마우스로 그리기」(맥, 막대를 펼쳤을 때)
 *  - 도구: 펜(필압) · 연필(질감 · 눕히면 굵게) · 마커(형광) · 지우개(부분 / 획 전체) · 올가미(골라서 옮기기 · 색 · 복제 · 삭제)
 *  - 그리다가 멈추고 꾹 누르고 있으면 곧은 선 (거의 가로 · 세로면 수평 · 수직으로)
 *  - 굵기 5단계 + 슬라이더 · 불투명도 · 색 팔레트 · 사용자 색 · 최근 색 · 되돌리기 / 다시 하기(⌘Z · ⇧⌘Z)
 *  - 고른 도구 · 색 · 굵기 · 막대 상태는 모든 페이지에서 그대로 (localStorage `ink:prefs2`)
 *  - 필기는 그 기기 브라우저(IndexedDB `study-ink`)에 페이지 주소별로 저장 — 다른 기기와는 공유되지 않음
 *  - 획마다 그 자리의 글 블록(문단 · 코드 · 표 · 접기 …)에 붙여 저장 → 스크롤 · 접기 열고 닫기에 같이 움직임
 */
(function () {
    "use strict";
    if (window.__inkLoaded) return;
    window.__inkLoaded = true;

    var root = document.documentElement;
    var PAGE_KEY = "ink:" + decodeURIComponent(location.pathname);
    var NS = "http://www.w3.org/2000/svg";
    var TOOLS = ["pen", "pencil", "marker", "eraser", "lasso"];
    var NAMES = { pen: "펜", pencil: "연필", marker: "마커", eraser: "지우개", lasso: "올가미" };
    var WIDTHS = {
        pen: [1, 1.8, 2.8, 4.2, 6.5],
        pencil: [1.2, 2, 3, 4.6, 7],
        marker: [8, 12, 18, 26, 36],
        eraser: [8, 14, 22, 34, 50]
    };
    var RANGE = { pen: [0.5, 12], pencil: [0.6, 12], marker: [4, 48], eraser: [4, 80] };
    var PALETTE = ["auto", "#000000", "#48484a", "#8e8e93", "#ffffff",
        "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be",
        "#0a84ff", "#5856d6", "#af52de", "#ff2d55", "#a2845e"];

    /* ===================== 설정 (모든 페이지 공통) ===================== */
    var DEF = {
        tool: "pen", lastDraw: "pen", open: true, finger: false, mouse: false, hidden: false, align: "center",
        pen: { c: "#ff3b30", w: 1.8, o: 1 },
        pencil: { c: "auto", w: 2, o: 0.85 },
        marker: { c: "#ffcc00", w: 18, o: 0.35 },
        eraser: { mode: "pixel", w: 22 },
        recent: []
    };
    var P = loadPrefs();
    function loadPrefs() {
        var out = JSON.parse(JSON.stringify(DEF));
        try {
            var v = JSON.parse(localStorage.getItem("ink:prefs2") || "null");
            if (v && typeof v === "object") {
                Object.keys(out).forEach(function (k) {
                    if (v[k] === undefined) return;
                    if (out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) Object.assign(out[k], v[k]);
                    else out[k] = v[k];
                });
            }
        } catch (e) {}
        if (TOOLS.indexOf(out.tool) < 0) out.tool = "pen";
        if (!/^(pen|pencil|marker)$/.test(out.lastDraw)) out.lastDraw = "pen";
        return out;
    }
    function savePrefs() { try { localStorage.setItem("ink:prefs2", JSON.stringify(P)); } catch (e) {} }

    /* ===================== 저장 (페이지별) ===================== */
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
    function loadPage() {
        return openDB().then(function (db) {
            return new Promise(function (res) {
                if (!db) { try { res(JSON.parse(localStorage.getItem(PAGE_KEY) || "null")); } catch (e) { res(null); } return; }
                try {
                    var rq = db.transaction("pages").objectStore("pages").get(PAGE_KEY);
                    rq.onsuccess = function () { res(rq.result || null); };
                    rq.onerror = function () { res(null); };
                } catch (e) { res(null); }
            });
        });
    }
    var saveT = 0;
    function savePage() {
        clearTimeout(saveT);
        saveT = setTimeout(function () {
            var data = { v: 2, strokes: strokes };
            try {
                if (idb) idb.transaction("pages", "readwrite").objectStore("pages").put(data, PAGE_KEY);
                else localStorage.setItem(PAGE_KEY, JSON.stringify(data));
            } catch (e) { toast("필기를 저장하지 못했어요 — 브라우저 저장 공간을 확인해 주세요"); }
        }, 250);
    }
    function upgrade(list) {                                   // 예전(v1) 획 → v2
        var map = { r: "#ff3b30", b: "#0a84ff", k: "auto", y: "#ffcc00" };
        return (list || []).map(function (s) {
            if (s.t) return s;
            var pts = [];
            for (var i = 0; i + 1 < (s.p || []).length; i += 2) pts.push(s.p[i], s.p[i + 1], 0.5);
            return { a: s.a, fx: s.fx, fy: s.fy, t: s.h ? "marker" : "pen", c: map[s.c] || "#ff3b30", w: s.s || 2, o: s.h ? 0.35 : 1, pts: pts };
        });
    }

    /* ===================== 글 블록(앵커) ===================== */
    var ANCHOR_SEL = ".wrap > :not(script):not(style), section.card > *, details > *";
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
            var e = els[i];
            if (e.closest(".ink-ui")) continue;
            var base = e.tagName.toLowerCase() + ":" + hash((e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120));
            var n = seen[base] = (seen[base] || 0) + 1;
            var key = base + ":" + n;
            list.push({ el: e, key: key });
            map[key] = e;
        }
        anchorCache = { list: list, map: map };
        return anchorCache;
    }
    function boxOf(e) {
        var r = e.getBoundingClientRect();
        if (!r.width && !r.height) return null;                // 닫힌 접기 안 → 숨김
        return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    }
    function anchorAt(px, py) {
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
    function originOf(st) {
        var e = anchors().map[st.a];
        if (e) { var b = boxOf(e); return b ? { x: b.x, y: b.y } : null; }
        return { x: st.fx, y: st.fy };                         // 블록을 못 찾으면 그릴 때 자리
    }

    /* ===================== 모양 계산 ===================== */
    function colorOf(c) {
        if (c === "auto") return root.getAttribute("data-theme") === "light" ? "#1c1c1e" : "#f2f2f7";
        return c;
    }
    function f1(v) { return Math.round(v * 10) / 10; }
    function lineD(pts, ox, oy) {                             // 같은 굵기 선 (마커)
        var n = pts.length / 3;
        if (!n) return "";
        var d = "M" + f1(pts[0] + ox) + " " + f1(pts[1] + oy);
        if (n === 1) return d + "l0.01 0";
        for (var i = 1; i < n - 1; i++) {
            var x1 = pts[3 * i] + ox, y1 = pts[3 * i + 1] + oy, x2 = pts[3 * i + 3] + ox, y2 = pts[3 * i + 4] + oy;
            d += "Q" + f1(x1) + " " + f1(y1) + " " + f1((x1 + x2) / 2) + " " + f1((y1 + y2) / 2);
        }
        return d + "L" + f1(pts[3 * n - 3] + ox) + " " + f1(pts[3 * n - 2] + oy);
    }
    function outlineD(pts, ox, oy, w, thin) {                // 필압으로 굵기가 바뀌는 선 — 양쪽 테두리를 이어 채움
        var n = pts.length / 3;
        if (!n) return "";
        var X = [], Y = [], R = [], i, sp = pts[2];
        for (i = 0; i < n; i++) {
            X.push(pts[3 * i] + ox);
            Y.push(pts[3 * i + 1] + oy);
            sp = sp * 0.6 + pts[3 * i + 2] * 0.4;             // 필압 흔들림 줄이기
            var r = w / 2 * (1 - thin + thin * Math.min(1.25, sp * 1.6));
            if (n > 6 && i < 3) r *= 0.55 + 0.15 * i;          // 시작 · 끝을 살짝 가늘게
            if (n > 6 && i > n - 4) r *= 0.55 + 0.15 * (n - 1 - i);
            R.push(Math.max(0.35, r));
        }
        if (n === 1) {
            var rr = f1(R[0]);
            return "M" + f1(X[0] - rr) + " " + f1(Y[0]) + "a" + rr + " " + rr + " 0 1 0 " + f1(2 * rr) + " 0a" + rr + " " + rr + " 0 1 0 " + f1(-2 * rr) + " 0Z";
        }
        var L = [], Rt = [];
        for (i = 0; i < n; i++) {
            var a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
            var dx = X[b] - X[a], dy = Y[b] - Y[a], len = Math.hypot(dx, dy) || 1;
            var nx = -dy / len, ny = dx / len;
            L.push([X[i] + nx * R[i], Y[i] + ny * R[i]]);
            Rt.push([X[i] - nx * R[i], Y[i] - ny * R[i]]);
        }
        function through(arr) {
            var s = "";
            for (var k = 1; k < arr.length - 1; k++) {
                s += "Q" + f1(arr[k][0]) + " " + f1(arr[k][1]) + " " + f1((arr[k][0] + arr[k + 1][0]) / 2) + " " + f1((arr[k][1] + arr[k + 1][1]) / 2);
            }
            return s + "L" + f1(arr[arr.length - 1][0]) + " " + f1(arr[arr.length - 1][1]);
        }
        var back = Rt.slice().reverse(), re = f1(R[n - 1]), rs = f1(R[0]);
        return "M" + f1(L[0][0]) + " " + f1(L[0][1]) + through(L) +
            "A" + re + " " + re + " 0 0 1 " + f1(back[0][0]) + " " + f1(back[0][1]) + through(back) +
            "A" + rs + " " + rs + " 0 0 1 " + f1(L[0][0]) + " " + f1(L[0][1]) + "Z";
    }
    function shapeOf(st, ox, oy) {
        if (st.t === "marker") return lineD(st.pts, ox, oy);
        return outlineD(st.pts, ox, oy, st.w, st.t === "pencil" ? 0.45 : 0.62);
    }
    function makeEl(st) {
        var p = document.createElementNS(NS, "path"), col = colorOf(st.c);
        if (st.t === "marker") {
            p.setAttribute("fill", "none");
            p.setAttribute("stroke", col);
            p.setAttribute("stroke-width", st.w);
            p.setAttribute("stroke-linecap", "butt");
            p.setAttribute("stroke-linejoin", "round");
            p.setAttribute("stroke-opacity", st.o);
        } else {
            p.setAttribute("fill", col);
            p.setAttribute("fill-opacity", st.o);
        }
        return p;
    }

    /* ===================== 상태 · 그리기 ===================== */
    var strokes = [];              // { a, fx, fy, t, c, w, o, pts:[x,y,p…] } — 바꿀 때는 새 객체로 (되돌리기 스냅샷용)
    var undoS = [], redoS = [];
    var rendered = [];             // strokes 와 같은 순서 { el, bb, ox, oy }
    var svg, gMarker, gPencil, gPen, gSel, layerCur, lassoPath;
    var sel = [];                  // 올가미로 고른 획

    function snapshot() { undoS.push(strokes.slice()); if (undoS.length > 120) undoS.shift(); redoS = []; }
    function commit() { savePage(); renderAll(); syncUI(); }
    function bboxOf(st, ox, oy) {
        var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, pad = st.w / 2 + 2;
        for (var k = 0; k < st.pts.length; k += 3) {
            var x = st.pts[k] + ox, y = st.pts[k + 1] + oy;
            if (x < x1) x1 = x; if (y < y1) y1 = y; if (x > x2) x2 = x; if (y > y2) y2 = y;
        }
        return { x1: x1 - pad, y1: y1 - pad, x2: x2 + pad, y2: y2 + pad };
    }
    function renderAll() {
        if (!svg) return;
        anchorCache = null;
        svg.style.width = "0px";                               // 먼저 줄여야 접기를 닫았을 때 문서 높이가 줄어듦
        svg.style.height = "0px";
        var W = Math.max(root.scrollWidth, document.body.scrollWidth), H = Math.max(root.scrollHeight, document.body.scrollHeight);
        svg.setAttribute("width", W); svg.setAttribute("height", H);
        svg.style.width = W + "px"; svg.style.height = H + "px";
        [gMarker, gPencil, gPen].forEach(function (g) { while (g.firstChild) g.removeChild(g.firstChild); });
        rendered = [];
        for (var i = 0; i < strokes.length; i++) {
            var st = strokes[i], o = originOf(st), e = makeEl(st), bb = null;
            if (o) { e.setAttribute("d", shapeOf(st, o.x, o.y)); bb = bboxOf(st, o.x, o.y); }
            else e.style.display = "none";
            (st.t === "marker" ? gMarker : st.t === "pencil" ? gPencil : gPen).appendChild(e);
            rendered.push({ el: e, bb: bb, ox: o ? o.x : 0, oy: o ? o.y : 0 });
        }
        drawSelection();
    }
    var relT = 0;
    function relayout() {
        if (relT) return;
        relT = setTimeout(function () { relT = 0; if (!cur && !drag) renderAll(); }, 40);   // rAF 는 탭이 가려지면 멈춰서 setTimeout
    }

    /* ===================== 입력 ===================== */
    var EXEMPT = "input, textarea, select, button, label, [contenteditable], .ct-code, .oq-ans";
    function inUI(t) { return t && t.closest && t.closest(".ink-ui"); }
    function exempt(t) { return inUI(t) || (t && t.closest && t.closest(EXEMPT)); }
    function drawsWith(e) {
        if (P.hidden || exempt(e.target)) return false;
        if (e.pointerType === "pen") return true;              // 펜슬은 언제나
        if (e.pointerType === "mouse") return P.open && P.mouse && e.button === 0;
        if (e.pointerType === "touch") return P.open && P.finger;
        return false;
    }
    function docX(e) { return e.clientX + window.scrollX; }   // 문서 좌표 = 화면 좌표 + 스크롤
    function docY(e) { return e.clientY + window.scrollY; }
    function pressureOf(e) {
        if (e.pointerType !== "pen") return 0.5;
        var p = e.pressure || 0.5;
        if (P.tool === "pencil") {                              // 연필: 눕히면 굵게
            var tilt = Math.min(1, Math.hypot(e.tiltX || 0, e.tiltY || 0) / 70);
            p = p * (1 + tilt * 1.4);
        }
        return Math.round(p * 100) / 100;
    }

    var cur = null;               // 그리는 중인 획
    var drag = null;              // 지우개 · 올가미 · 옮기기
    var lastDraw = 0, holdT = 0;

    function onDown(e) {
        if (!drawsWith(e)) {
            if (sel.length && !inUI(e.target) && e.pointerType !== "touch") { sel = []; drawSelection(); }
            return;
        }
        e.preventDefault();
        closePop();
        root.classList.add("ink-drawing");
        var x = docX(e), y = docY(e);
        if (P.tool === "eraser") { drag = { kind: "erase", snap: strokes.slice(), changed: false }; eraseAt(x, y); return; }
        if (P.tool === "lasso") {
            var bb = selBox();
            if (bb && x >= bb.x1 - 12 && x <= bb.x2 + 12 && y >= bb.y1 - 12 && y <= bb.y2 + 12) drag = { kind: "move", sx: x, sy: y, dx: 0, dy: 0 };
            else {
                sel = []; drawSelection();
                drag = { kind: "lasso", pts: [x, y] };
                lassoPath.setAttribute("d", "M" + x + " " + y);
                lassoPath.style.display = "";
            }
            return;
        }
        startStroke(x, y, pressureOf(e));
    }
    function onMove(e) {
        if (!cur && !drag) return;
        e.preventDefault();
        var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
        if (!list.length) list = [e];
        if (cur) {
            for (var i = 0; i < list.length; i++) addPoint(docX(list[i]), docY(list[i]), pressureOf(list[i]));
            redrawCur();
            return;
        }
        var x = docX(e), y = docY(e);
        if (drag.kind === "erase") eraseAt(x, y);
        else if (drag.kind === "lasso") { drag.pts.push(f1(x), f1(y)); lassoPath.setAttribute("d", polyD(drag.pts) + "Z"); }
        else if (drag.kind === "move") {
            drag.dx = x - drag.sx; drag.dy = y - drag.sy;
            var tf = "translate(" + f1(drag.dx) + " " + f1(drag.dy) + ")";
            sel.forEach(function (s) { var r = rendered[strokes.indexOf(s)]; if (r) r.el.setAttribute("transform", tf); });
            gSel.setAttribute("transform", tf);
        }
    }
    function onUp() {
        if (!cur && !drag) return;
        lastDraw = Date.now();
        root.classList.remove("ink-drawing");
        if (cur) { endStroke(); return; }
        var d = drag; drag = null;
        if (d.kind === "erase") {
            if (d.changed) { undoS.push(d.snap); if (undoS.length > 120) undoS.shift(); redoS = []; commit(); }
        } else if (d.kind === "lasso") {
            lassoPath.style.display = "none";
            selectIn(d.pts);
        } else if (d.kind === "move") {
            gSel.removeAttribute("transform");
            if (Math.abs(d.dx) + Math.abs(d.dy) > 0.5) {
                snapshot();
                var moved = sel.map(function (s) { return shifted(s, d.dx, d.dy); });
                sel.forEach(function (s, k) { strokes[strokes.indexOf(s)] = moved[k]; });
                sel = moved;
                commit();
            } else renderAll();
        }
    }
    function shifted(s, dx, dy) {
        var n = Object.assign({}, s);
        n.pts = s.pts.slice();
        for (var k = 0; k < n.pts.length; k += 3) { n.pts[k] = f1(n.pts[k] + dx); n.pts[k + 1] = f1(n.pts[k + 1] + dy); }
        return n;
    }
    function blockTouch(e) {                                  // 펜슬 터치는 스크롤 · 확대 · 길게 누르기 막기
        if (P.hidden || exempt(e.target)) return;
        var t = e.touches && e.touches[0];
        if (!t) return;
        if (t.touchType === "stylus" || (P.open && P.finger)) e.preventDefault();
    }

    /* ---------- 펜 · 연필 · 마커 ---------- */
    function startStroke(x, y, p) {
        var tool = P.tool, cfg = P[tool];
        var a = anchorAt(x, y);
        var ax = a ? a.b.x : 0, ay = a ? a.b.y : 0;
        var st = { a: a ? a.key : "", fx: f1(ax), fy: f1(ay), t: tool, c: cfg.c, w: cfg.w, o: cfg.o, pts: [f1(x - ax), f1(y - ay), p] };
        var e = makeEl(st);
        if (tool === "pencil") e.setAttribute("filter", "url(#ink-grain)");
        layerCur.appendChild(e);
        cur = { st: st, el: e, ax: ax, ay: ay, lx: x, ly: y, straight: false, plen: 0 };
        redrawCur();
        armHold();
    }
    function addPoint(x, y, p) {
        var c = cur;
        if (c.straight) {                                      // 곧은 선: 끝점만 따라감
            c.st.pts = [c.st.pts[0], c.st.pts[1], c.st.pts[2], f1(x - c.ax), f1(y - c.ay), c.st.pts[2]];
            return;
        }
        var d = Math.hypot(x - c.lx, y - c.ly);
        if (d < 0.9) return;
        c.plen += d;
        if (d > 2.5) armHold();
        c.lx = x; c.ly = y;
        c.st.pts.push(f1(x - c.ax), f1(y - c.ay), p);
    }
    function redrawCur() { if (cur) cur.el.setAttribute("d", shapeOf(cur.st, cur.ax, cur.ay)); }
    function armHold() {                                       // 멈추고 꾹 → 곧은 선
        clearTimeout(holdT);
        if (!cur || cur.straight) return;
        holdT = setTimeout(function () {
            if (!cur || cur.straight || cur.plen < 24) return;
            var pts = cur.st.pts, n = pts.length / 3, avgP = 0;
            for (var k = 0; k < n; k++) avgP += pts[3 * k + 2];
            avgP = Math.round(avgP / n * 100) / 100;
            var ex = pts[3 * n - 3], ey = pts[3 * n - 2], dx = ex - pts[0], dy = ey - pts[1];
            if (Math.abs(dy) < Math.abs(dx) * 0.08) ey = pts[1];          // 거의 가로 → 수평
            else if (Math.abs(dx) < Math.abs(dy) * 0.08) ex = pts[0];     // 거의 세로 → 수직
            cur.st.pts = [pts[0], pts[1], avgP, ex, ey, avgP];
            cur.straight = true;
            redrawCur();
            toast("곧은 선");
        }, 520);
    }
    function endStroke() {
        clearTimeout(holdT);
        var st = cur.st;
        layerCur.removeChild(cur.el);
        cur = null;
        snapshot();
        strokes.push(st);
        commit();
    }

    /* ---------- 지우개 ---------- */
    function segDist2(px, py, x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy, t = L ? ((px - x1) * dx + (py - y1) * dy) / L : 0;
        t = Math.max(0, Math.min(1, t));
        var qx = x1 + t * dx - px, qy = y1 + t * dy - py;
        return qx * qx + qy * qy;
    }
    function eraseAt(x, y) {
        var r = P.eraser.w / 2, changed = false, next = [];
        for (var i = 0; i < strokes.length; i++) {
            var st = strokes[i], R = rendered[i];
            if (!R || !R.bb || x < R.bb.x1 - r || x > R.bb.x2 + r || y < R.bb.y1 - r || y > R.bb.y2 + r) { next.push(st); continue; }
            var ox = R.ox, oy = R.oy, pts = st.pts, n = pts.length / 3, hit = false, rr = r + st.w / 2;
            for (var k = 0; k < n; k++) {
                var x1 = pts[3 * k] + ox, y1 = pts[3 * k + 1] + oy;
                var x2 = k + 1 < n ? pts[3 * k + 3] + ox : x1, y2 = k + 1 < n ? pts[3 * k + 4] + oy : y1;
                if (segDist2(x, y, x1, y1, x2, y2) <= rr * rr) { hit = true; break; }
            }
            if (!hit) { next.push(st); continue; }
            changed = true;
            if (P.eraser.mode === "stroke") continue;          // 획 지우개: 통째로
            splitStroke(st, x - ox, y - oy, r + st.w * 0.35).forEach(function (piece) { next.push(piece); });
        }
        if (changed) { strokes = next; drag.changed = true; sel = []; renderAll(); }
    }
    function splitStroke(st, cx, cy, r) {                      // 부분 지우개: 원 안의 부분만 잘라냄
        var src = st.pts, n = src.length / 3, dense = [], step = Math.max(0.8, r / 3);
        for (var k = 0; k < n; k++) {
            var x1 = src[3 * k], y1 = src[3 * k + 1], p1 = src[3 * k + 2];
            dense.push(x1, y1, p1);
            if (k + 1 < n) {                                   // 점 사이를 촘촘히 채워 둠
                var x2 = src[3 * k + 3], y2 = src[3 * k + 4], p2 = src[3 * k + 5];
                var m = Math.floor(Math.hypot(x2 - x1, y2 - y1) / step);
                for (var j = 1; j < m; j++) { var t = j / m; dense.push(f1(x1 + (x2 - x1) * t), f1(y1 + (y2 - y1) * t), p1 + (p2 - p1) * t); }
            }
        }
        var out = [], piece = [];
        for (var q = 0; q < dense.length; q += 3) {
            var inside = (dense[q] - cx) * (dense[q] - cx) + (dense[q + 1] - cy) * (dense[q + 1] - cy) <= r * r;
            if (inside) { if (piece.length >= 6) out.push(piece); piece = []; }
            else piece.push(dense[q], dense[q + 1], Math.round(dense[q + 2] * 100) / 100);
        }
        if (piece.length >= 6) out.push(piece);
        return out.map(function (pts) { var s = Object.assign({}, st); s.pts = pts; return s; });
    }

    /* ---------- 올가미 ---------- */
    function polyD(a) {
        var d = "M" + a[0] + " " + a[1];
        for (var k = 2; k < a.length; k += 2) d += "L" + a[k] + " " + a[k + 1];
        return d;
    }
    function inPoly(x, y, a) {
        var inside = false;
        for (var i = 0, j = a.length - 2; i < a.length; j = i, i += 2) {
            var xi = a[i], yi = a[i + 1], xj = a[j], yj = a[j + 1];
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi) inside = !inside;
        }
        return inside;
    }
    function selectIn(poly) {
        sel = [];
        if (poly.length >= 6) {
            strokes.forEach(function (st, i) {
                var R = rendered[i];
                if (!R || !R.bb) return;
                var n = st.pts.length / 3, ins = 0;
                for (var k = 0; k < n; k++) if (inPoly(st.pts[3 * k] + R.ox, st.pts[3 * k + 1] + R.oy, poly)) ins++;
                if (ins / n >= 0.6) sel.push(st);
            });
        }
        drawSelection();
        if (sel.length) toast("안쪽을 끌면 옮겨져요");
    }
    function selBox() {
        if (!sel.length) return null;
        var b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
        sel.forEach(function (s) {
            var R = rendered[strokes.indexOf(s)];
            if (!R || !R.bb) return;
            b.x1 = Math.min(b.x1, R.bb.x1); b.y1 = Math.min(b.y1, R.bb.y1); b.x2 = Math.max(b.x2, R.bb.x2); b.y2 = Math.max(b.y2, R.bb.y2);
        });
        return b.x1 === Infinity ? null : b;
    }
    function drawSelection() {
        if (!gSel) return;
        while (gSel.firstChild) gSel.removeChild(gSel.firstChild);
        sel = sel.filter(function (s) { return strokes.indexOf(s) >= 0; });
        var b = selBox();
        if (selBar) selBar.style.display = b ? "flex" : "none";
        if (!b) return;
        var r = document.createElementNS(NS, "rect");
        r.setAttribute("x", f1(b.x1 - 6)); r.setAttribute("y", f1(b.y1 - 6));
        r.setAttribute("width", f1(b.x2 - b.x1 + 12)); r.setAttribute("height", f1(b.y2 - b.y1 + 12));
        r.setAttribute("rx", 8);
        r.setAttribute("class", "ink-selrect");
        gSel.appendChild(r);
        selBar.querySelector(".ink-seln").textContent = "선택 " + sel.length + "개";
    }
    function selDelete() { if (!sel.length) return; snapshot(); strokes = strokes.filter(function (s) { return sel.indexOf(s) < 0; }); sel = []; commit(); }
    function selDuplicate() {
        if (!sel.length) return;
        snapshot();
        var copies = sel.map(function (s) { return shifted(s, 18, 18); });
        strokes = strokes.concat(copies);
        sel = copies;
        commit();
    }
    function selRecolor() {
        if (!sel.length) return;
        var c = P[P.lastDraw].c;
        snapshot();
        var re = sel.map(function (s) { var n = Object.assign({}, s); n.c = c; return n; });
        sel.forEach(function (s, k) { strokes[strokes.indexOf(s)] = re[k]; });
        sel = re;
        commit();
    }

    /* ---------- 되돌리기 ---------- */
    function doUndo() { if (!undoS.length) return; redoS.push(strokes); strokes = undoS.pop(); sel = []; commit(); }
    function doRedo() { if (!redoS.length) return; undoS.push(strokes); strokes = redoS.pop(); sel = []; commit(); }
    function doClear() {
        if (!strokes.length) return;
        if (!confirm("이 페이지의 필기를 모두 지울까요? (되돌리기로 다시 살릴 수 있어요)")) return;
        snapshot(); strokes = []; sel = []; commit();
    }

    /* ===================== 아이콘 (직접 그림) ===================== */
    var BODY = 'fill="var(--ink-body)" stroke="var(--ink-edge)" stroke-width=".9" stroke-linejoin="round"';
    function toolIcon(t, tip) {                                // 도구는 막대에 세워 둔 모양 · 촉 색 = 지금 색
        var o = '<svg viewBox="0 0 24 40" class="ink-tool-svg" aria-hidden="true">';
        if (t === "pen") return o +
            '<path d="M7.6 15.5 12 3.2l4.4 12.3Z" fill="' + tip + '" stroke="var(--ink-edge)" stroke-width=".7" stroke-linejoin="round"/>' +
            '<path d="M12 7.2v5.2" stroke="var(--ink-body)" stroke-width=".9" stroke-linecap="round"/><circle cx="12" cy="12.6" r=".9" fill="var(--ink-body)"/>' +
            '<path d="M7.2 15.5h9.6v3.6H7.2Z" fill="var(--ink-metal)" stroke="var(--ink-edge)" stroke-width=".7"/>' +
            '<path d="M6.8 19.1h10.4V40H6.8Z" ' + BODY + "/></svg>";
        if (t === "pencil") return o +
            '<path d="M7.4 15.2 12 3.4l4.6 11.8Z" fill="#e2c296" stroke="var(--ink-edge)" stroke-width=".7" stroke-linejoin="round"/>' +
            '<path d="M10.6 7 12 3.4 13.4 7Z" fill="' + tip + '"/>' +
            '<path d="M7.4 15.2h9.2V40H7.4Z" ' + BODY + "/>" +
            '<path d="M10.5 15.2V40M13.5 15.2V40" stroke="var(--ink-edge)" stroke-width=".45" opacity=".6"/>' +
            '<path d="M7.4 15.2h9.2v2.6H7.4Z" fill="' + tip + '" opacity=".9"/></svg>';
        if (t === "marker") return o +
            '<path d="M8.6 6.4 15.4 3v10H8.6Z" fill="' + tip + '" stroke="var(--ink-edge)" stroke-width=".7" stroke-linejoin="round"/>' +
            '<path d="M7.8 13h8.4l1.1 4.4H6.7Z" fill="var(--ink-metal)" stroke="var(--ink-edge)" stroke-width=".7" stroke-linejoin="round"/>' +
            '<path d="M6.2 17.4h11.6V40H6.2Z" ' + BODY + "/>" +
            '<path d="M6.2 23h11.6v3.2H6.2Z" fill="' + tip + '" opacity=".9"/></svg>';
        if (t === "eraser") return o +
            '<path d="M7 7.4A3.6 3.6 0 0 1 10.6 3.8h2.8A3.6 3.6 0 0 1 17 7.4v6.4H7Z" fill="#f0a3ad" stroke="var(--ink-edge)" stroke-width=".7"/>' +
            '<path d="M7 13.8h10v3.3H7Z" fill="var(--ink-metal)" stroke="var(--ink-edge)" stroke-width=".7"/>' +
            '<path d="M7 17.1h10V40H7Z" ' + BODY + "/></svg>";
        return o +                                             // 올가미
            '<ellipse cx="12" cy="9.6" rx="8" ry="5" fill="none" stroke="var(--ink-lasso)" stroke-width="1.3" stroke-dasharray="2.4 2"/>' +
            '<path d="M8.4 14.2c-1.5 1.6-1.1 3.4.5 4.1" fill="none" stroke="var(--ink-lasso)" stroke-width="1.3" stroke-linecap="round"/>' +
            '<path d="M8.6 20.4h6.8V40H8.6Z" ' + BODY + "/></svg>";
    }
    function icon(name) {
        var s = '<svg viewBox="0 0 24 24" class="ink-ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';
        var d = {
            undo: '<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H12"/>',
            redo: '<path d="M15 7l4.5 4.5L15 16"/><path d="M19 11.5H9.5a5 5 0 0 0 0 10H12"/>',
            more: '<circle cx="5.5" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.35" fill="currentColor" stroke="none"/>',
            down: '<path d="M6 9.5 12 15.5 18 9.5"/>',
            finger: '<path d="M9.5 12.5V5.8a1.6 1.6 0 0 1 3.2 0V11"/><path d="M12.7 10.6V9.3a1.6 1.6 0 0 1 3.2 0v2"/><path d="M15.9 11.1a1.6 1.6 0 0 1 3.2.2v3.2a6.7 6.7 0 0 1-6.7 6.7h-.6a6.4 6.4 0 0 1-5.3-2.8l-2.3-3.5a1.6 1.6 0 0 1 2.6-1.8l2 2.4"/>',
            mouse: '<rect x="6.5" y="3.5" width="11" height="17" rx="5.5"/><path d="M12 7.2v3.3"/>',
            eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
            trash: '<path d="M4.5 7h15"/><path d="M9.5 7V4.8h5V7"/><path d="M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6L17.5 7"/><path d="M10.3 10.8v6M13.7 10.8v6"/>',
            copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M15.5 8.5V6.2a1.7 1.7 0 0 0-1.7-1.7H6.2a1.7 1.7 0 0 0-1.7 1.7v7.6a1.7 1.7 0 0 0 1.7 1.7h2.3"/>',
            paint: '<path d="M12 3.5c-3.5 4.4-6 7.6-6 10.6a6 6 0 0 0 12 0c0-3-2.5-6.2-6-10.6Z"/>',
            close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
            align: '<path d="M4 7h16M7 12h10M4 17h16"/>',
            nib: '<path d="M4.5 19.5l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.7 17.9Z"/><path d="M13.8 6.8l3 3"/>'
        }[name] || "";
        return s + d + "</svg>";
    }

    /* ===================== 화면 ===================== */
    var CSS = [
        ":root{--ink-body:#f7f7f9;--ink-edge:rgba(0,0,0,.34);--ink-metal:#c9ccd2;--ink-lasso:#3a3a3c;--ink-panel:rgba(250,250,252,.93);--ink-text:#1c1c1e;--ink-sub:#6e6e73;--ink-hair:rgba(0,0,0,.12);--ink-accent:#0a84ff}",
        "html[data-theme=dark]{--ink-body:#3c3c40;--ink-edge:rgba(255,255,255,.3);--ink-metal:#8e9096;--ink-lasso:#e5e5ea;--ink-panel:rgba(38,38,42,.93);--ink-text:#f2f2f7;--ink-sub:#a1a1a6;--ink-hair:rgba(255,255,255,.14)}",
        ".ink-svg{position:absolute;left:0;top:0;pointer-events:none;z-index:9980;overflow:visible}",
        ".ink-svg .ink-selrect{fill:rgba(10,132,255,.06);stroke:#0a84ff;stroke-width:1.5;stroke-dasharray:6 5}",
        ".ink-svg .ink-lasso{fill:rgba(10,132,255,.05);stroke:#0a84ff;stroke-width:1.4;stroke-dasharray:5 4}",
        "html.ink-drawing body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}",
        "html.ink-finger{touch-action:none}",
        ".ink-ui{font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard',sans-serif;color:var(--ink-text);-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}",
        ".ink-dock{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:10003;display:flex;align-items:flex-end;gap:2px;padding:6px 8px 0;",
        "border-radius:18px;background:var(--ink-panel);border:1px solid var(--ink-hair);box-shadow:0 10px 30px rgba(0,0,0,.26),0 1px 3px rgba(0,0,0,.16);",
        "-webkit-backdrop-filter:saturate(1.6) blur(18px);backdrop-filter:saturate(1.6) blur(18px);max-width:calc(100vw - 20px);overflow-x:auto;overflow-y:hidden;scrollbar-width:none}",
        ".ink-dock::-webkit-scrollbar{display:none}",
        ".ink-dock.al-center{left:50%;transform:translateX(-50%)} .ink-dock.al-left{left:12px} .ink-dock.al-right{right:12px}",
        ".ink-dock button{flex:0 0 auto;border:0;background:transparent;color:inherit;cursor:pointer;padding:0;margin:0;font:inherit}",
        ".ink-ib{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;align-self:center;margin-bottom:6px!important}",
        ".ink-ib:active{background:var(--ink-hair)} .ink-ib:disabled{opacity:.3}",
        ".ink-ic{width:22px;height:22px}",
        ".ink-tool{width:38px;height:54px;position:relative}",
        ".ink-tool .ink-tool-svg{width:27px;height:45px;position:absolute;left:5.5px;top:17px;transition:top .18s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(0 1px 1.2px rgba(0,0,0,.22))}",
        ".ink-tool.on .ink-tool-svg{top:3px}",
        ".ink-colors .ink-custom.on::after{content:'';position:absolute;inset:-5px;border-radius:50%;border:2.5px solid var(--ink-accent)}",
        ".ink-sep{flex:0 0 1px;width:1px;height:26px;background:var(--ink-hair);margin:0 5px 12px;align-self:center}",
        ".ink-swatch{width:30px;height:30px;border-radius:50%;margin:0 5px 10px!important;align-self:center;box-shadow:0 0 0 2px var(--ink-panel),0 0 0 3.5px var(--ink-hair)}",
        ".ink-fab{position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:10003;width:50px;height:50px;border-radius:50%;border:1px solid var(--ink-hair);",
        "background:var(--ink-panel);box-shadow:0 8px 24px rgba(0,0,0,.26);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);display:none;align-items:center;justify-content:center;cursor:pointer;padding:0;color:var(--ink-text)}",
        ".ink-fab .ink-ic{width:24px;height:24px} .ink-fab i{position:absolute;right:9px;bottom:9px;width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 2px var(--ink-panel)}",
        "html.ink-min .ink-dock{display:none} html.ink-min .ink-fab{display:flex}",
        ".ink-pop{position:fixed;z-index:10004;width:min(316px,calc(100vw - 20px));max-height:calc(100vh - 150px);overflow:auto;padding:14px 14px 12px;border-radius:18px;",
        "background:var(--ink-panel);border:1px solid var(--ink-hair);box-shadow:0 16px 40px rgba(0,0,0,.3);-webkit-backdrop-filter:saturate(1.6) blur(20px);backdrop-filter:saturate(1.6) blur(20px);display:none}",
        ".ink-pop.show{display:block} .ink-pop h4{margin:2px 0 10px;font-size:12.5px;font-weight:700;color:var(--ink-sub);letter-spacing:.02em}",
        ".ink-pop .ink-row{display:flex;align-items:center;gap:8px;margin:10px 0}",
        ".ink-pop .ink-lab{font-size:12.5px;color:var(--ink-sub);min-width:52px;line-height:1.5}",
        ".ink-widths{display:flex;justify-content:space-between;align-items:center;gap:6px;margin:4px 0 8px}",
        ".ink-widths button{flex:1;height:40px;border-radius:12px;border:1px solid var(--ink-hair);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-text)}",
        ".ink-widths button.on{border-color:var(--ink-accent);background:rgba(10,132,255,.12)}",
        ".ink-widths span{display:block;border-radius:50%;background:currentColor}",
        ".ink-pop input[type=range]{flex:1;accent-color:var(--ink-accent)}",
        ".ink-pop .ink-val{font-size:12px;color:var(--ink-sub);min-width:40px;text-align:right;font-variant-numeric:tabular-nums}",
        ".ink-prev{width:100%;height:56px;border-radius:12px;background:var(--ink-hair);display:block;margin-top:6px}",
        ".ink-colors{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;justify-items:center;margin:4px 0 6px}",
        ".ink-colors button{width:36px;height:36px;border-radius:50%;border:0;cursor:pointer;position:relative;padding:0;box-shadow:inset 0 0 0 1px rgba(127,127,127,.4)}",
        ".ink-colors button.on::after{content:'';position:absolute;inset:-5px;border-radius:50%;border:2.5px solid var(--ink-accent)}",
        ".ink-colors .ink-auto{background:conic-gradient(#1c1c1e 0 50%,#f2f2f7 0 100%)}",
        ".ink-colors .ink-custom{background:conic-gradient(#ff3b30,#ffcc00,#34c759,#00c7be,#0a84ff,#af52de,#ff3b30)}",
        ".ink-custom input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:0;padding:0}",
        ".ink-recent{display:flex;gap:8px;flex-wrap:wrap}",
        ".ink-recent button{width:26px;height:26px;border-radius:50%;border:0;cursor:pointer;padding:0;box-shadow:inset 0 0 0 1px rgba(127,127,127,.4)}",
        ".ink-seg{display:flex;background:var(--ink-hair);border-radius:10px;padding:2px;gap:2px;flex:1}",
        ".ink-seg button{flex:1;height:32px;border:0;border-radius:8px;background:transparent;color:var(--ink-text);font-size:13px;font-weight:600;cursor:pointer;padding:0 8px}",
        ".ink-seg button.on{background:var(--ink-panel);box-shadow:0 1px 3px rgba(0,0,0,.2)}",
        ".ink-menu button{display:flex;align-items:center;gap:12px;width:100%;padding:10px 6px;border:0;background:transparent;color:var(--ink-text);font-size:14.5px;cursor:pointer;border-radius:10px;text-align:left}",
        ".ink-menu button:active{background:var(--ink-hair)} .ink-menu .ink-ic{width:21px;height:21px;color:var(--ink-sub);flex:0 0 auto}",
        ".ink-menu .ink-sw{margin-left:auto;width:42px;height:25px;border-radius:13px;background:var(--ink-hair);position:relative;flex:0 0 auto;transition:background .15s}",
        ".ink-menu .ink-sw::after{content:'';position:absolute;top:2.5px;left:2.5px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .15s}",
        ".ink-menu .on .ink-sw{background:#34c759} .ink-menu .on .ink-sw::after{left:19.5px}",
        ".ink-menu .ink-danger,.ink-menu .ink-danger .ink-ic{color:#ff3b30}",
        ".ink-menu hr{border:0;border-top:1px solid var(--ink-hair);margin:4px 0}",
        ".ink-note{font-size:12px;color:var(--ink-sub);line-height:1.55;margin:8px 4px 2px}",
        ".ink-selbar{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:10004;display:none;align-items:center;gap:2px;padding:5px 6px 5px 14px;",
        "border-radius:14px;background:var(--ink-panel);border:1px solid var(--ink-hair);box-shadow:0 8px 24px rgba(0,0,0,.26);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);max-width:calc(100vw - 20px)}",
        ".ink-selbar .ink-seln{font-size:13px;font-weight:700;margin-right:6px;white-space:nowrap}",
        ".ink-selbar button{display:flex;align-items:center;gap:5px;height:34px;padding:0 9px;border:0;border-radius:10px;background:transparent;color:var(--ink-text);font-size:13px;cursor:pointer;white-space:nowrap}",
        ".ink-selbar button:active{background:var(--ink-hair)} .ink-selbar .ink-ic{width:18px;height:18px}",
        ".ink-toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:10005;background:rgba(28,28,30,.86);color:#fff;",
        "font-size:13px;padding:8px 14px;border-radius:12px;max-width:86vw;text-align:center;pointer-events:none;opacity:0;transition:opacity .18s}",
        ".ink-toast.show{opacity:1}",
        "@media print{.ink-dock,.ink-fab,.ink-pop,.ink-selbar,.ink-toast{display:none!important}}"
    ].join("\n");

    var dock, fab, pop, selBar, toastEl, B = {};
    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (cls && /ink-(dock|fab|pop|selbar|toast)/.test(cls)) e.setAttribute("data-theme-skip", "");   // 도구 막대 색도 그대로
        if (html != null) e.innerHTML = html;
        return e;
    }
    function button(cls, html, title, fn) {
        var b = el("button", cls, html);
        b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
        b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); fn(b, e); });
        return b;
    }
    var toastT;
    function toast(msg) {
        if (!toastEl) { toastEl = el("div", "ink-toast ink-ui"); document.body.appendChild(toastEl); }
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toastT);
        toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
    }

    function buildUI() {
        var st = el("style"); st.setAttribute("data-theme-skip", ""); st.textContent = CSS; document.head.appendChild(st);   // theme.js 가 색을 바꾸지 않게

        svg = document.createElementNS(NS, "svg");
        svg.setAttribute("class", "ink-svg");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("data-theme-skip", "");
        var defs = document.createElementNS(NS, "defs");                // 연필 질감 (종이 결)
        defs.innerHTML = '<filter id="ink-grain" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="1" seed="7" result="n"/>' +
            '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.3" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>';
        svg.appendChild(defs);
        gMarker = document.createElementNS(NS, "g");                    // 마커는 맨 아래 → 글씨가 위로
        gPencil = document.createElementNS(NS, "g"); gPencil.setAttribute("filter", "url(#ink-grain)");
        gPen = document.createElementNS(NS, "g");
        layerCur = document.createElementNS(NS, "g");
        gSel = document.createElementNS(NS, "g");
        lassoPath = document.createElementNS(NS, "path"); lassoPath.setAttribute("class", "ink-lasso"); lassoPath.style.display = "none";
        [gMarker, gPencil, gPen, layerCur, gSel, lassoPath].forEach(function (g) { svg.appendChild(g); });
        document.body.appendChild(svg);

        dock = el("div", "ink-dock ink-ui");
        dock.setAttribute("role", "toolbar"); dock.setAttribute("aria-label", "필기 도구");
        B.undo = button("ink-ib", icon("undo"), "되돌리기 (⌘Z)", doUndo);
        B.redo = button("ink-ib", icon("redo"), "다시 하기 (⇧⌘Z)", doRedo);
        dock.appendChild(B.undo); dock.appendChild(B.redo); dock.appendChild(el("span", "ink-sep"));
        TOOLS.forEach(function (t) {
            B[t] = button("ink-tool", "", NAMES[t] + " — 한 번 더 누르면 설정", function () {
                if (P.tool === t) togglePop("tool");
                else { P.tool = t; if (/^(pen|pencil|marker)$/.test(t)) P.lastDraw = t; savePrefs(); closePop(); syncUI(); }
                if (t !== "lasso" && sel.length) { sel = []; drawSelection(); }
            });
            dock.appendChild(B[t]);
        });
        dock.appendChild(el("span", "ink-sep"));
        B.swatch = button("ink-swatch", "", "색 · 불투명도", function () { togglePop("color"); });
        dock.appendChild(B.swatch);
        B.more = button("ink-ib", icon("more"), "더보기", function () { togglePop("more"); });
        B.min = button("ink-ib", icon("down"), "도구 막대 접기 (펜슬 필기는 계속 돼요)", function () { setOpen(false); });
        dock.appendChild(B.more); dock.appendChild(B.min);
        document.body.appendChild(dock);

        fab = button("ink-fab ink-ui", icon("nib") + "<i></i>", "필기 도구 펼치기", function () { setOpen(true); });
        document.body.appendChild(fab);

        pop = el("div", "ink-pop ink-ui");
        document.body.appendChild(pop);

        selBar = el("div", "ink-selbar ink-ui");
        selBar.appendChild(el("span", "ink-seln", "선택"));
        selBar.appendChild(button("", icon("paint") + "색 바꾸기", "고른 색으로 바꾸기", selRecolor));
        selBar.appendChild(button("", icon("copy") + "복제", "복제", selDuplicate));
        selBar.appendChild(button("", icon("trash") + "삭제", "삭제", selDelete));
        selBar.appendChild(button("", icon("close"), "선택 해제", function () { sel = []; drawSelection(); }));
        document.body.appendChild(selBar);
    }

    /* ---------- 팝업 (도구 설정 · 색 · 더보기) ---------- */
    var popKind = "", prevEl = null;
    function closePop() { if (pop) pop.classList.remove("show"); popKind = ""; }
    function togglePop(kind) {
        if (popKind === kind) { closePop(); return; }
        popKind = kind;
        pop.innerHTML = "";
        prevEl = null;
        if (kind === "tool") buildToolPop();
        else if (kind === "color") buildColorPop();
        else buildMorePop();
        pop.classList.add("show");
        placePop(kind === "tool" ? B[P.tool] : kind === "color" ? B.swatch : B.more);
    }
    function placePop(anchor) {
        var r = anchor.getBoundingClientRect(), d = dock.getBoundingClientRect();
        var w = pop.offsetWidth, h = pop.offsetHeight;
        pop.style.left = Math.min(Math.max(10, r.left + r.width / 2 - w / 2), window.innerWidth - w - 10) + "px";
        pop.style.top = Math.max(10, d.top - h - 10) + "px";
    }
    function refreshPop() { var k = popKind; popKind = ""; togglePop(k); syncUI(); }
    function buildToolPop() {
        var t = P.tool;
        if (t === "lasso") {
            pop.appendChild(el("h4", "", "올가미"));
            pop.appendChild(el("p", "ink-note", "필기를 빙 둘러 그리면 골라져요. 고른 안쪽을 끌면 옮겨지고, 위쪽 막대에서 색 바꾸기 · 복제 · 삭제를 할 수 있어요. (Delete 키로도 삭제)"));
            return;
        }
        var cfg = P[t];
        pop.appendChild(el("h4", "", t === "eraser" ? "지우개" : NAMES[t] + " — 굵기 · 불투명도"));
        if (t === "eraser") {
            var seg = el("div", "ink-seg");
            [["pixel", "부분 지우개"], ["stroke", "획 지우개"]].forEach(function (m) {
                seg.appendChild(button(cfg.mode === m[0] ? "on" : "", m[1], m[1], function () { cfg.mode = m[0]; savePrefs(); refreshPop(); }));
            });
            var row0 = el("div", "ink-row"); row0.appendChild(seg); pop.appendChild(row0);
        }
        var ws = el("div", "ink-widths");
        WIDTHS[t].forEach(function (w) {
            var dsz = Math.max(3, Math.min(22, t === "marker" ? w * 0.55 : t === "eraser" ? w * 0.42 : w * 2.4));
            ws.appendChild(button(Math.abs(cfg.w - w) < 0.01 ? "on" : "", '<span style="width:' + f1(dsz) + "px;height:" + f1(dsz) + 'px"></span>', "굵기 " + w, function () { cfg.w = w; savePrefs(); refreshPop(); }));
        });
        pop.appendChild(ws);
        var ints = t === "marker" || t === "eraser";
        pop.appendChild(slider("굵기", RANGE[t][0], RANGE[t][1], ints ? 1 : 0.1, cfg.w, function (v) { cfg.w = v; }, function (v) { return ints ? String(Math.round(v)) : v.toFixed(1); }));
        if (t !== "eraser") {
            pop.appendChild(slider("불투명도", 10, 100, 1, Math.round(cfg.o * 100), function (v) { cfg.o = v / 100; }, function (v) { return Math.round(v) + "%"; }));
            pop.appendChild(previewSvg(t));
        } else pop.appendChild(el("p", "ink-note", t === "eraser" && cfg.mode === "stroke" ? "닿은 획을 통째로 지워요." : "문지른 부분만 지워요."));
    }
    function slider(label, min, max, step, val, set, fmt) {
        var row = el("div", "ink-row");
        row.appendChild(el("span", "ink-lab", label));
        var r = el("input"); r.type = "range"; r.min = min; r.max = max; r.step = step; r.value = val;
        var out = el("span", "ink-val", fmt(+val));
        r.addEventListener("input", function () { set(+r.value); out.textContent = fmt(+r.value); savePrefs(); updatePreview(); syncUI(); syncWidthBtns(); });
        row.appendChild(r); row.appendChild(out);
        return row;
    }
    function syncWidthBtns() {
        var t = P.tool;
        if (!WIDTHS[t]) return;
        pop.querySelectorAll(".ink-widths button").forEach(function (b, i) { b.classList.toggle("on", Math.abs(P[t].w - WIDTHS[t][i]) < 0.01); });
    }
    function previewSvg(t) {
        var s = document.createElementNS(NS, "svg");
        s.setAttribute("class", "ink-prev"); s.setAttribute("viewBox", "0 0 290 56");
        prevEl = { svg: s, t: t };
        updatePreview();
        return s;
    }
    function updatePreview() {
        if (!prevEl) return;
        var t = prevEl.t, cfg = P[t], pts = [];
        for (var i = 0; i <= 40; i++) pts.push(18 + i * 6.3, 28 + Math.sin(i / 40 * Math.PI * 2) * 12, t === "marker" ? 0.5 : 0.25 + 0.6 * Math.sin(i / 40 * Math.PI));
        var st = { t: t, c: cfg.c, w: cfg.w, o: cfg.o, pts: pts };
        prevEl.svg.innerHTML = t === "pencil" ? '<filter id="ink-grain-p"><feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="1" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.3" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>' : "";
        var p = makeEl(st);
        p.setAttribute("d", shapeOf(st, 0, 0));
        if (t === "pencil") p.setAttribute("filter", "url(#ink-grain-p)");
        prevEl.svg.appendChild(p);
    }
    function buildColorPop() {
        var t = P.lastDraw, cfg = P[t];
        pop.appendChild(el("h4", "", NAMES[t] + " 색"));
        var grid = el("div", "ink-colors");
        PALETTE.forEach(function (c) {
            var b = button(c === "auto" ? "ink-auto" : "", "", c === "auto" ? "글자색 (테마 따라 검정 · 흰색)" : c, function () { pickColor(c, false); });
            if (c !== "auto") b.style.background = c;
            if (cfg.c === c) b.classList.add("on");
            grid.appendChild(b);
        });
        var cust = el("span", "ink-custom");                              // 사용자 색 (아이패드 색상 선택기)
        cust.style.cssText = "width:36px;height:36px;border-radius:50%;position:relative;display:block;box-shadow:inset 0 0 0 1px rgba(127,127,127,.4)";
        if (PALETTE.indexOf(cfg.c) < 0) cust.classList.add("on");
        cust.title = "사용자 색";
        var inp = el("input"); inp.type = "color"; inp.value = /^#[0-9a-f]{6}$/i.test(cfg.c) ? cfg.c : "#ff3b30";
        inp.setAttribute("aria-label", "사용자 색");
        inp.addEventListener("input", function () { pickColor(inp.value, true); });
        cust.appendChild(inp);
        grid.appendChild(cust);
        pop.appendChild(grid);
        if (P.recent.length) {
            pop.appendChild(el("h4", "", "최근 사용자 색"));
            var rec = el("div", "ink-recent");
            P.recent.forEach(function (c) { var b = button("", "", c, function () { pickColor(c, false); }); b.style.background = c; rec.appendChild(b); });
            pop.appendChild(rec);
        }
        pop.appendChild(slider("불투명도", 10, 100, 1, Math.round(cfg.o * 100), function (v) { cfg.o = v / 100; }, function (v) { return Math.round(v) + "%"; }));
        pop.appendChild(previewSvg(t));
    }
    function pickColor(c, custom) {
        var t = P.lastDraw;
        P[t].c = c;
        if (/^(eraser|lasso)$/.test(P.tool)) { P.tool = t; }          // 색을 고르면 그 펜으로 돌아감
        if (custom && PALETTE.indexOf(c) < 0) P.recent = [c].concat(P.recent.filter(function (x) { return x !== c; })).slice(0, 8);
        savePrefs();
        if (custom) { updatePreview(); syncUI(); } else refreshPop();
    }
    function buildMorePop() {
        var m = el("div", "ink-menu");
        function sw(ic, label, key, after) {
            var b = button(P[key] ? "on" : "", icon(ic) + "<span>" + label + '</span><span class="ink-sw"></span>', label, function () {
                P[key] = !P[key]; savePrefs(); b.classList.toggle("on", P[key]); if (after) after(); syncUI();
            });
            m.appendChild(b);
        }
        sw("finger", "손가락으로 그리기", "finger", function () { toast(P.finger ? "손가락으로도 써요 — 스크롤하려면 막대를 접으세요" : "손가락은 스크롤 · 펜슬만 써요"); });
        sw("mouse", "마우스로 그리기 (맥)", "mouse");
        sw("eye", "필기 숨기기", "hidden", function () { renderAll(); });
        var al = el("div", "", "");
        al.style.cssText = "display:flex;align-items:center;gap:12px;padding:8px 6px";
        al.innerHTML = icon("align") + '<span style="font-size:14.5px">막대 위치</span>';
        al.querySelector(".ink-ic").style.color = "var(--ink-sub)";
        var seg = el("div", "ink-seg"); seg.style.cssText = "margin-left:auto;flex:0 0 auto";
        [["left", "왼쪽"], ["center", "가운데"], ["right", "오른쪽"]].forEach(function (a) {
            seg.appendChild(button(P.align === a[0] ? "on" : "", a[1], a[1], function () { P.align = a[0]; savePrefs(); refreshPop(); }));
        });
        al.appendChild(seg);
        m.appendChild(al);
        m.appendChild(el("hr"));
        m.appendChild(button("ink-danger", icon("trash") + "<span>이 페이지 필기 모두 지우기</span>", "모두 지우기", function () { closePop(); doClear(); }));
        pop.appendChild(m);
        pop.appendChild(el("p", "ink-note", "펜슬은 막대를 접어도 계속 써져요 · 그리다 멈추고 꾹 누르면 곧은 선 · 도구를 한 번 더 누르면 굵기 설정 · 필기는 이 기기 브라우저에 저장돼요"));
    }

    /* ---------- 상태 반영 ---------- */
    function syncUI() {
        if (!dock) return;
        TOOLS.forEach(function (t) {
            var cfg = P[t];
            B[t].innerHTML = toolIcon(t, cfg && cfg.c ? colorOf(cfg.c) : "#8e8e93");
            B[t].classList.toggle("on", P.tool === t);
        });
        var dc = P[P.lastDraw];
        B.swatch.style.background = colorOf(dc.c);
        B.swatch.style.opacity = Math.max(0.4, dc.o);
        B.undo.disabled = !undoS.length;
        B.redo.disabled = !redoS.length;
        dock.classList.remove("al-left", "al-center", "al-right");
        dock.classList.add("al-" + (P.align || "center"));
        root.classList.toggle("ink-min", !P.open);
        root.classList.toggle("ink-finger", P.open && P.finger && !P.hidden);
        fab.querySelector("i").style.background = /^(eraser|lasso)$/.test(P.tool) ? "#8e8e93" : colorOf(P[P.tool].c);
        svg.style.display = P.hidden ? "none" : "";
    }
    function setOpen(v) {
        P.open = v; savePrefs(); closePop();
        if (!v) toast("막대를 접었어요 — 펜슬 필기는 계속 돼요");
        syncUI();
    }

    /* ===================== 시작 ===================== */
    function init() {
        if (!document.querySelector(".wrap")) return;
        buildUI();
        syncUI();
        loadPage().then(function (data) {
            strokes = upgrade(data && data.strokes);
            renderAll();
            syncUI();
        });
        document.addEventListener("pointerdown", onDown, { capture: true, passive: false });
        window.addEventListener("pointermove", onMove, { capture: true, passive: false });
        window.addEventListener("pointerup", onUp, true);
        window.addEventListener("pointercancel", onUp, true);
        document.addEventListener("touchstart", blockTouch, { capture: true, passive: false });
        document.addEventListener("touchmove", blockTouch, { capture: true, passive: false });
        document.addEventListener("click", function (e) {             // 쓰다가 링크 · 접기가 눌리지 않게
            if (!exempt(e.target) && Date.now() - lastDraw < 450) { e.preventDefault(); e.stopPropagation(); return; }
            if (popKind && !inUI(e.target)) closePop();
        }, true);
        document.addEventListener("toggle", relayout, true);           // 접기 열고 닫기
        window.addEventListener("resize", function () { relayout(); closePop(); });
        window.addEventListener("load", relayout);
        if (window.ResizeObserver) new ResizeObserver(relayout).observe(document.body);
        new MutationObserver(function () { renderAll(); syncUI(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
        document.addEventListener("keydown", function (e) {
            var k = (e.key || "").toLowerCase();
            if (e.target && e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
            if ((e.metaKey || e.ctrlKey) && k === "z" && (undoS.length || redoS.length)) { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); }
            else if (k === "escape") { if (popKind) closePop(); else if (sel.length) { sel = []; drawSelection(); } }
            else if ((k === "backspace" || k === "delete") && sel.length) { e.preventDefault(); selDelete(); }
        });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
