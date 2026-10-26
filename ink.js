/* ink.js — 페이지 위에 Apple Pencil 로 필기 · 아이패드 「미리보기 / 파일」 PDF 마크업(PencilKit)과 같게 · 2026-10-13 → v3 2026-10-18
 *
 *  쓰는 곳: 주차 페이지(weeks/*.html) · 과목 페이지 · 실제시험 — 전공 · 교양 모두
 *  2026-10-18 사용자: '아이패드에서 PDF 미리보기의 필기 기능이랑 완전 똑같이 — UI · 기능 100%'
 *  - 도구 막대(아이패드 도구 팔레트): 되돌리기 · 다시 하기 | 펜 · 모노라인 · 만년필 · 마커 · 연필 · 크레용 · 수채화 · 지우개 · 올가미 · 자 | 색 5개 + 색상 선택기 | + | ⋯
 *    · 고른 도구를 한 번 더 누르면 굵기 5단계 · 불투명도 (지우개 = 픽셀 / 개체 지우개)
 *    · 막대 빈 곳을 끌면 아래 · 위 · 왼쪽 · 오른쪽 가장자리에 붙음 · ⌄ 로 최소화(동그라미) · ⋯ → 자동으로 최소화
 *  - 색상 선택기: 격자 · 스펙트럼 · 슬라이더(RGB · 16진수) · 불투명도 · 내 색 저장(+) · 스포이드(필기를 누르면 그 색)
 *  - + : 텍스트 · 서명(직접 그려 저장 · 여러 개) · 도형(사각형 · 원 · 말풍선 · 별 · 화살표 · 선) · 돋보기 · 붙여넣기
 *    → 넣은 것은 손가락 · 마우스로 눌러 고르고 끌어 옮김 · 손잡이로 크기 · 위 메뉴로 색 · 굵기 · 채우기 · 복제 · 삭제
 *  - 올가미: 둘러서 고르기 → 끌어 옮기기 · 잘라내기 · 복사 · 붙여넣기 · 복제 · 색 바꾸기 · 삭제
 *  - 자: 한 손가락 · 마우스로 끌어 옮기고, 두 손가락 · 휠 · 손잡이로 돌림(각도 표시 · 0 · 45 · 90° 에 착 붙음) → 자 가장자리를 따라 그으면 곧은 선
 *  - 모양 인식: 그리다가 멈추고 꾹 → 선 · 원(타원) · 사각형 · 삼각형으로 바뀜
 *  - 펜슬을 화면 가까이 대면(호버) 촉 크기 · 색 미리보기 · 손가락으로 그리기 · 마우스로 그리기 · 필기 숨기기
 *  - 필기 켜기 · 끄기 (2026-10-19 '애플펜슬로 스크롤하고 싶은 사람') → 끄면 펜슬도 손가락처럼 스크롤 · 쓴 필기는 그대로 보임
 *  - v4 (2026-10-23 사용자: 'UI · UX 구분이 안 갈 정도로 똑같이') — 맥의 아이패드 시뮬레이터(iPadOS 27 미리보기)를 띄워 실제 화면을 보고 맞춤
 *    · 오른쪽 위 ⓐ 마크업 버튼 = 필기 켜기 · 끄기 (켜면 파란 동그라미 + 아래에서 막대가 올라옴 · 끄면 막대가 사라지고 펜슬로 스크롤)
 *    · 알약 모양 유리 막대: 실행 취소 · 실행 복귀 | 펜 · 파인라이너 · 마커 · 지우개 · 연필 · 자 (옆으로 밀면 수채화 · 크레용 · 만년필 · 올가미) | 색 2 × 3 (검정 · 파랑 · 초록 / 노랑 · 빨강 · 색상환) | + · ⋯
 *    · 도구 한 번 더 → 손글씨 견본 굵기 5단계 + 체크무늬 불투명도 · 지우개 = 픽셀 지우개 | 대상 지우개 + 크기 5
 *    · + = 스티커 · 텍스트 · 서명 · 모양 · 확대경 추가 · ⋯ = 자동 최소화 · 손가락으로 그리기 · 펜슬 설정…
 *    · 위 손잡이를 끌어 위 · 아래로 · 모서리로 끌면 지금 도구가 든 유리 동그라미로 작게 (누르면 다시 펼침)
 *  - 필기는 그 기기 브라우저(IndexedDB `study-ink`)에 페이지 주소별로 저장 · 설정은 localStorage `ink:prefs2`
 *  - 획 · 넣은 것마다 그 자리의 글 블록(문단 · 코드 · 표 · 접기 …)에 붙여 저장 → 스크롤 · 접기 열고 닫기에 같이 움직임
 */
(function () {
    "use strict";
    if (window.__inkLoaded) return;
    window.__inkLoaded = true;

    var root = document.documentElement;
    // 페이지 설정 (없으면 주차 · 과목 페이지와 같음) — 실제시험: { idAnchor: ".ex-q", strict: true } (2026-10-16)
    //  idAnchor = 이 요소들은 글 내용 대신 id 에 필기를 붙임 · strict = 붙어 있던 블록이 지금 화면에 없으면 숨김
    var OPT = window.INK_OPTS || {};
    var PAGE_KEY = "ink:" + decodeURIComponent(location.pathname);
    var NS = "http://www.w3.org/2000/svg";
    var INK = ["pen", "monoline", "fountain", "reed", "marker", "pencil", "crayon", "watercolor"];
    var TOOLS = INK.concat(["eraser", "lasso"]);
    var NAMES = { pen: "펜", monoline: "모노라인", fountain: "만년필", reed: "갈대펜", marker: "마커", pencil: "연필", crayon: "크레용", watercolor: "수채화", eraser: "지우개", lasso: "올가미", ruler: "자" };
    var WIDTHS = {
        pen: [1.6, 3.5, 5.6, 8.4, 12], monoline: [1, 2, 3, 5, 8], fountain: [2, 3.5, 5, 7, 10], reed: [5, 13, 21, 29, 40],
        marker: [8, 12, 18, 26, 36], pencil: [1.2, 2, 3, 4.6, 7], crayon: [3, 5, 8, 12, 18],
        watercolor: [8, 14, 22, 32, 46], eraser: [8, 14, 22, 34, 50]
    };
    var RANGE = { pen: [0.5, 16], monoline: [0.5, 14], fountain: [1, 18], reed: [5, 40], marker: [4, 48], pencil: [0.6, 12], crayon: [2, 28], watercolor: [4, 64], eraser: [4, 80] };
    var QUICK = ["auto", "#157efb", "#53d769", "#fed030", "#fc3142"];   // 미리보기 막대 색을 화면에서 그대로 뽑음          // 막대의 색 5개 (아이패드 기본: 검정 · 파랑 · 초록 · 노랑 · 빨강)
    var GRID_HUES = [190, 210, 228, 262, 288, 318, 0, 18, 36, 52, 72, 110];   // 격자 12열 (하늘 · 파랑 · 남색 · 보라 · 자주 · 분홍 · 빨강 · 주황 · 귤 · 노랑 · 연두 · 초록)

    /* ===================== 설정 (모든 페이지 공통) ===================== */
    var DEF = {
        tool: "pen", lastDraw: "pen", open: true, finger: false, mouse: false, hidden: false, autoMin: false, off: false,
        dock: "bottom", corner: "bl", ruler: false, rul: { cx: 0, cy: 0, ang: 0 },
        pen: { c: "auto", w: 3.5, o: 1 }, monoline: { c: "auto", w: 2, o: 1 }, fountain: { c: "auto", w: 3.5, o: 1 }, reed: { c: "auto", w: 29, o: 1 },
        marker: { c: "#fed030", w: 18, o: 0.8 }, pencil: { c: "#157efb", w: 2, o: 0.5 }, crayon: { c: "#fc3142", w: 8, o: 0.9 },
        watercolor: { c: "auto", w: 22, o: 0.5 },          // 처음 색 · 불투명도 = iOS 27 도구 막대 기본값 (연필 파랑 50 · 크레용 빨강 · 마커 노랑)
        eraser: { mode: "pixel", w: 22 },
        recent: [], saved: [], cpTab: "grid"
    };
    var migrated = false, P = loadPrefs();
    if (migrated) savePrefs();                                  // 새 기본값을 한 번 저장 → 그림 필기(figink.js)도 같은 값
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
        if (v && !v.v6) {                                      // v6(2026-10-26) 기본값을 iOS 27 도구 막대처럼: 펜 굵기 1.8 → 3.5 · 마커 불투명도 35 → 80 (예전 기본값 그대로 쓰던 경우만)
            if (out.pen.w === 1.8) out.pen.w = 3.5;
            if (out.marker.o === 0.35) out.marker.o = 0.8;
            migrated = true;
        }
        out.v6 = 1;
        if (TOOLS.indexOf(out.tool) < 0) out.tool = "pen";
        if (INK.indexOf(out.lastDraw) < 0) out.lastDraw = "pen";
        if (out.eraser.mode === "stroke") out.eraser.mode = "object";
        if (!/^(bottom|top)$/.test(out.dock)) out.dock = "bottom";          // v4: 위 · 아래에만 붙음 (예전 왼쪽 · 오른쪽은 아래로)
        if (!/^(tl|tr|bl|br)$/.test(out.corner)) out.corner = "bl";
        if (!out.saved.length) out.saved = out.recent.length ? out.recent.slice(0, 10) : ["#157efb", "#53d769", "#fed030", "#fc3142"];   // 내 색 기본 = Apple 처럼 파랑 · 초록 · 노랑 · 빨강
        return out;
    }
    function savePrefs() { try { localStorage.setItem("ink:prefs2", JSON.stringify(P)); } catch (e) {} }
    var SIGS = [];
    try { SIGS = JSON.parse(localStorage.getItem("ink:sigs") || "[]") || []; } catch (e) { SIGS = []; }
    function saveSigs() { try { localStorage.setItem("ink:sigs", JSON.stringify(SIGS)); } catch (e) {} }

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
            var data = { v: 3, strokes: strokes };
            try {
                if (idb) idb.transaction("pages", "readwrite").objectStore("pages").put(data, PAGE_KEY);
                else localStorage.setItem(PAGE_KEY, JSON.stringify(data));
            } catch (e) { toast("필기를 저장하지 못했어요 — 브라우저 저장 공간을 확인해 주세요"); }
        }, 250);
    }
    function upgrade(list) {                                   // 예전(v1) 획 → v2 · v3 (넣은 것 k 가 있음)
        var map = { r: "#ff3b30", b: "#0a84ff", k: "auto", y: "#ffcc00" };
        return (list || []).filter(function (s) { return s && typeof s === "object"; }).map(function (s) {
            if (s.k || s.t) return s;
            var pts = [];
            for (var i = 0; i + 1 < (s.p || []).length; i += 2) pts.push(s.p[i], s.p[i + 1], 0.5);
            return { a: s.a, fx: s.fx, fy: s.fy, t: s.h ? "marker" : "pen", c: map[s.c] || "#ff3b30", w: s.s || 2, o: s.h ? 0.35 : 1, pts: pts };
        }).filter(function (s) { return s.k || (s.pts && s.pts.length >= 3); });
    }
    function isObj(s) { return !!s.k; }                        // 넣은 것 (텍스트 · 도형 · 서명 · 돋보기)

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
            if (e.closest(".ink-ui, .ink-objs")) continue;
            if (OPT.idAnchor && e.id && e.matches(OPT.idAnchor)) { var ik = "id:" + e.id; if (!map[ik]) { list.push({ el: e, key: ik }); map[ik] = e; } continue; }
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
        if (OPT.strict) return null;                           // 실제시험: 그 블록이 지금 없으면 숨김
        return { x: st.fx, y: st.fy };                         // 블록을 못 찾으면 그릴 때 자리
    }
    function anchored(x, y) {                                   // 새로 넣는 것: 그 자리 글 블록 기준 좌표
        var a = anchorAt(x, y), ax = a ? a.b.x : 0, ay = a ? a.b.y : 0;
        return { a: a ? a.key : "", fx: f1(ax), fy: f1(ay), ax: ax, ay: ay };
    }

    /* ===================== 모양 계산 ===================== */
    function colorOf(c) {
        if (c === "auto") return root.getAttribute("data-theme") === "light" ? "#1c1c1e" : "#f2f2f7";
        return c;
    }
    function f1(v) { return Math.round(v * 10) / 10; }
    function f2(v) { return Math.round(v * 100) / 100; }

    /* 획 모양 — 아이패드 마크업처럼 · perfect-freehand(Steve Ruiz, MIT) 방식
     *  ① 입력점을 살짝 늦게 따라가며 손떨림을 거른 매끈한 중심선 (stream)
     *  ② 필압(펜슬) · 속도(마우스 · 손가락)로 반지름 → 양쪽 테두리 + 둥근 시작 · 끝
     *  ③ 테두리 점들을 2차 곡선으로 이어 채움 */
    var PI1 = Math.PI + 0.0001, RATE = 0.275;
    var FEEL = {
        pen: { thin: 0.48, smooth: 0.62, stream: 0.5 }, pencil: { thin: 0.3, smooth: 0.62, stream: 0.5 },
        crayon: { thin: 0.16, smooth: 0.5, stream: 0.45 }, fountain: { stream: 0.55 }, reed: { stream: 0.55 },
        marker: { stream: 0.6 }, monoline: { stream: 0.55 }, watercolor: { stream: 0.6 }
    };
    function vsub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
    function vper(a) { return [a[1], -a[0]]; }
    function vdot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
    function vrot(a, c, r) { var s = Math.sin(r), k = Math.cos(r), px = a[0] - c[0], py = a[1] - c[1]; return [px * k - py * s + c[0], px * s + py * k + c[1]]; }
    function vd2(a, b) { var x = a[0] - b[0], y = a[1] - b[1]; return x * x + y * y; }
    function strokePts(pts, ox, oy, stream, size, done) {   // 입력점 → 매끈한 중심선 점 { p, pr(필압), v(방향), d, rl(누적 길이) }
        var n = pts.length / 3, t = 0.15 + (1 - stream) * 0.85, out = [], raw = [], i, pp = pts[2];
        if (!n) return out;
        for (i = 0; i < n; i++) { pp = i ? pp * 0.4 + pts[3 * i + 2] * 0.6 : pts[2]; raw.push([pts[3 * i] + ox, pts[3 * i + 1] + oy, pp]); }
        if (raw.length === 1) raw.push([raw[0][0] + 1, raw[0][1] + 1, raw[0][2]]);
        var prev = { p: [raw[0][0], raw[0][1]], pr: raw[0][2], v: [1, 1], d: 0, rl: 0 }, rl = 0, reached = false;
        out.push(prev);
        for (i = 1; i < raw.length; i++) {
            var last = i === raw.length - 1;
            var q = done && last ? [raw[i][0], raw[i][1]] : [prev.p[0] + (raw[i][0] - prev.p[0]) * t, prev.p[1] + (raw[i][1] - prev.p[1]) * t];
            if (q[0] === prev.p[0] && q[1] === prev.p[1]) continue;
            var dv = vsub(prev.p, q), d = Math.hypot(dv[0], dv[1]);
            rl += d;
            if (!last && !reached) { if (rl < size) continue; reached = true; }
            prev = { p: q, pr: raw[i][2], v: [dv[0] / d, dv[1] / d], d: d, rl: rl };
            out.push(prev);
        }
        out[0].v = out[1] ? out[1].v : [0, 0];
        return out;
    }
    function outlinePts(sp, size, thin, smooth, sim) {      // 중심선 → 테두리 점 (왼쪽 · 끝 둥글게 · 오른쪽(거꾸로) · 시작 둥글게)
        var n = sp.length;
        if (!n) return [];
        var total = sp[n - 1].rl, minD = Math.pow(size * smooth, 2), L = [], R = [], i, k;
        var rad = function (p) { return size * (0.5 - thin * (0.5 - p)); };
        var prevP = sp[0].pr;
        if (sim) prevP = sp.slice(0, 10).reduce(function (acc, c) { var s = Math.min(1, c.d / size), r = Math.min(1, 1 - s); return (acc + Math.min(1, acc + (r - acc) * (s * RATE))) / 2; }, sp[0].pr);
        var radius = rad(sp[n - 1].pr), first, prevV = sp[0].v, pl = sp[0].p, pr = pl, tl = pl, tr = pr, prevSharp = false;
        for (i = 0; i < n; i++) {
            var c = sp[i], press = c.pr, pt = c.p, v = c.v;
            if (i < n - 1 && total - c.rl < 3) continue;
            if (thin) {
                if (sim) { var s = Math.min(1, c.d / size), r = Math.min(1, 1 - s); press = Math.min(1, prevP + (r - prevP) * (s * RATE)); }
                radius = rad(press);
            } else radius = size / 2;
            radius = Math.max(0.2, radius);
            if (first === undefined) first = radius;
            var nv = (i < n - 1 ? sp[i + 1] : c).v, nd = i < n - 1 ? vdot(v, nv) : 1, pd = vdot(v, prevV);
            var sharp = pd < 0 && !prevSharp, nextSharp = nd < 0;
            if (sharp || nextSharp) {
                var off = [vper(prevV)[0] * radius, vper(prevV)[1] * radius];
                for (k = 0; k <= 1; k += 1 / 13) {
                    tl = vrot(vsub(pt, off), pt, PI1 * k); L.push(tl);
                    tr = vrot([pt[0] + off[0], pt[1] + off[1]], pt, -PI1 * k); R.push(tr);
                }
                pl = tl; pr = tr;
                if (nextSharp) prevSharp = true;
                continue;
            }
            prevSharp = false;
            if (i === n - 1) { var oe = vper(v); L.push([pt[0] - oe[0] * radius, pt[1] - oe[1] * radius]); R.push([pt[0] + oe[0] * radius, pt[1] + oe[1] * radius]); continue; }
            var lv = vper([nv[0] + (v[0] - nv[0]) * nd, nv[1] + (v[1] - nv[1]) * nd]);
            tl = [pt[0] - lv[0] * radius, pt[1] - lv[1] * radius];
            if (i <= 1 || vd2(pl, tl) > minD) { L.push(tl); pl = tl; }
            tr = [pt[0] + lv[0] * radius, pt[1] + lv[1] * radius];
            if (i <= 1 || vd2(pr, tr) > minD) { R.push(tr); pr = tr; }
            prevP = press; prevV = v;
        }
        var fp = sp[0].p, lp = n > 1 ? sp[n - 1].p : [fp[0] + 1, fp[1] + 1], sc = [], ec = [];
        if (n === 1 || !L.length) {
            var fr = first || radius, st0 = [fp[0] + fr, fp[1]], dots = [];
            for (k = 1 / 13; k <= 1.0001; k += 1 / 13) dots.push(vrot(st0, fp, PI1 * 2 * k));
            return dots;
        }
        for (k = 1 / 13; k <= 1; k += 1 / 13) sc.push(vrot(R[0], fp, PI1 * k));
        var dir = vper([-sp[n - 1].v[0], -sp[n - 1].v[1]]), s2 = [lp[0] + dir[0] * radius, lp[1] + dir[1] * radius];
        for (k = 1 / 29; k < 1; k += 1 / 29) ec.push(vrot(s2, lp, PI1 * 3 * k));
        return L.concat(ec, R.reverse(), sc);
    }
    function nibPts(sp, size) {                                // 만년필: 펜촉이 45° 로 기울어 있어 긋는 방향에 따라 굵기가 바뀜
        var n = sp.length, L = [], R = [], NIB = -Math.PI / 4;
        if (!n) return [];
        for (var i = 0; i < n; i++) {
            var c = sp[i], v = c.v, ang = Math.atan2(v[1], v[0]);
            var r = size * 0.5 * (0.16 + 0.84 * Math.abs(Math.sin(ang - NIB))) * (0.55 + 0.9 * c.pr);
            var nx = Math.cos(NIB + Math.PI / 2), ny = Math.sin(NIB + Math.PI / 2);   // 펜촉 방향으로 벌어짐 (진짜 펜촉처럼 납작)
            L.push([c.p[0] - nx * r, c.p[1] - ny * r]); R.push([c.p[0] + nx * r, c.p[1] + ny * r]);
        }
        if (n === 1) { var p = sp[0].p, r0 = size * 0.4; return [[p[0] - r0, p[1] + r0], [p[0] + r0, p[1] - r0], [p[0] + r0 + 1, p[1] - r0 + 1], [p[0] - r0 + 1, p[1] + r0 + 1]]; }
        return L.concat(R.reverse());
    }
    function reedPts(sp, size) {                               // 갈대펜 (iOS 27 PencilKit 실측): 납작한 촉 날이 가로로 고정 · 날 길이 ≈ 굵기 × 2 → 세로획 가장 굵게 · 가로획은 굵기의 1/6 정도로 가늘게
        var n = sp.length, L = [], R = [];
        if (!n) return [];
        for (var i = 0; i < n; i++) {
            var c = sp[i], vl = Math.hypot(c.v[0], c.v[1]) || 1, my = c.v[0] / vl;
            var h = size * (0.75 + 0.5 * c.pr), m = size * 0.085;                     // 날 반쪽 길이 (필압) · 날과 나란히(가로로) 그어도 남는 굵기 반쪽
            L.push([c.p[0] - h, c.p[1] - (my < 0 ? -m : m)]); R.push([c.p[0] + h, c.p[1] + (my < 0 ? -m : m)]);
        }
        if (n === 1) { var p = sp[0].p, r0 = size; return [[p[0] - r0, p[1] - size * 0.12], [p[0] + r0, p[1] - size * 0.12], [p[0] + r0, p[1] + size * 0.12], [p[0] - r0, p[1] + size * 0.12]]; }
        return L.concat(R.reverse());
    }
    function polyPath(pts) {                                  // 테두리 점 → 2차 곡선으로 이은 닫힌 모양
        var n = pts.length;
        if (!n) return "";
        if (n < 4) { var d0 = "M" + f2(pts[0][0]) + " " + f2(pts[0][1]); for (var j = 1; j < n; j++) d0 += "L" + f2(pts[j][0]) + " " + f2(pts[j][1]); return d0 + "Z"; }
        var a = pts[0], b = pts[1], c = pts[2];
        var d = "M" + f2(a[0]) + " " + f2(a[1]) + "Q" + f2(b[0]) + " " + f2(b[1]) + " " + f2((b[0] + c[0]) / 2) + " " + f2((b[1] + c[1]) / 2) + "T";
        for (var i = 2; i < n - 1; i++) d += f2((pts[i][0] + pts[i + 1][0]) / 2) + " " + f2((pts[i][1] + pts[i + 1][1]) / 2) + " ";
        return d + "Z";
    }
    function centerD(sp) {                                    // 마커 · 모노라인 · 수채화: 매끈한 중심선 (같은 굵기)
        var n = sp.length;
        if (!n) return "";
        var d = "M" + f2(sp[0].p[0]) + " " + f2(sp[0].p[1]);
        if (n === 1) return d + "l0.01 0";
        for (var i = 1; i < n - 1; i++) d += "Q" + f2(sp[i].p[0]) + " " + f2(sp[i].p[1]) + " " + f2((sp[i].p[0] + sp[i + 1].p[0]) / 2) + " " + f2((sp[i].p[1] + sp[i + 1].p[1]) / 2);
        return d + "L" + f2(sp[n - 1].p[0]) + " " + f2(sp[n - 1].p[1]);
    }
    function flatP(pts) { for (var k = 5; k < pts.length; k += 3) if (pts[k] !== pts[2]) return false; return true; }   // 필압이 한결같음 = 마우스 · 손가락
    var LINE_T = { marker: 1, monoline: 1, watercolor: 1 };     // 중심선 + stroke 로 그리는 도구
    function geoD(st, ox, oy) {                                // 인식된 모양: 꼭짓점을 그대로 잇는 선 (닫히면 Z)
        var p = st.pts, n = p.length / 3, d = "";
        for (var i = 0; i < n; i++) d += (i ? "L" : "M") + f2(p[3 * i] + ox) + " " + f2(p[3 * i + 1] + oy);
        if (n > 2 && Math.abs(p[0] - p[3 * n - 3]) < 0.6 && Math.abs(p[1] - p[3 * n - 2]) < 0.6) d += "Z";
        return d;
    }
    function shapeOf(st, ox, oy, live) {
        if (st.geo) return geoD(st, ox, oy);
        var o = FEEL[st.t] || FEEL.pen, size = st.w;
        var sp = strokePts(st.pts, ox, oy, st.sm != null ? st.sm : o.stream, LINE_T[st.t] ? Math.min(size, 8) : size, !live);
        if (LINE_T[st.t]) return centerD(sp);
        if (st.t === "fountain") return polyPath(nibPts(sp, size));
        if (st.t === "reed") return polyPath(reedPts(sp, size));
        var sim = st.sim != null ? !!st.sim : flatP(st.pts);
        return polyPath(outlinePts(sp, size, o.thin, o.smooth, sim));
    }
    // 연필 · 크레용 종이결: 색마다 작은 무늬를 한 번 만들어 채움 (페이지 전체 필터는 아이패드에서 버벅임)
    var grainIds = {}, grainN = 0, defsEl = null;
    function grainFor(col, kind) {
        var key = kind + col;
        if (grainIds[key]) return grainIds[key];
        var id = "ink-pg" + (grainN++), S = kind === "crayon" ? 128 : 96;
        try {
            var cv = document.createElement("canvas"); cv.width = cv.height = S;
            var cx = cv.getContext("2d");
            cx.fillStyle = col; var rgb = cx.fillStyle;
            var R0 = parseInt(rgb.slice(1, 3), 16) || 0, G0 = parseInt(rgb.slice(3, 5), 16) || 0, B0 = parseInt(rgb.slice(5, 7), 16) || 0;
            var im = cx.createImageData(S, S), i;
            if (kind === "crayon") {                           // 크레용: 굵은 밀랍 결 — 비어 있는 틈이 군데군데
                var holes = new Float32Array(S * S);
                for (var h = 0; h < 90; h++) {
                    var hx = Math.random() * S, hy = Math.random() * S, hr = 1 + Math.random() * 3.2;
                    for (var yy = Math.floor(hy - hr); yy <= hy + hr; yy++) for (var xx = Math.floor(hx - hr * 2); xx <= hx + hr * 2; xx++) {
                        var dx = (xx - hx) / 2, dy = yy - hy;
                        if (dx * dx + dy * dy <= hr * hr) holes[((yy + S) % S) * S + ((xx + S) % S)] = 1;
                    }
                }
                for (i = 0; i < S * S; i++) {
                    var a = holes[i] ? 0.08 + Math.random() * 0.18 : 0.72 + Math.random() * 0.28;
                    im.data[4 * i] = R0; im.data[4 * i + 1] = G0; im.data[4 * i + 2] = B0; im.data[4 * i + 3] = Math.round(a * 255);
                }
            } else if (kind === "reed") {
                for (i = 0; i < S * S; i++) {
                    var rr = Math.random(), a3 = rr < 0.07 ? 0.35 + Math.random() * 0.3 : 0.86 + Math.random() * 0.14;
                    im.data[4 * i] = R0; im.data[4 * i + 1] = G0; im.data[4 * i + 2] = B0; im.data[4 * i + 3] = Math.round(a3 * 255);
                }
            } else {
                for (i = 0; i < S * S; i++) {
                    var r = Math.random(), a2 = r < 0.16 ? 0.12 + Math.random() * 0.25 : 0.62 + Math.random() * 0.38;
                    im.data[4 * i] = R0; im.data[4 * i + 1] = G0; im.data[4 * i + 2] = B0; im.data[4 * i + 3] = Math.round(a2 * 255);
                }
            }
            cx.putImageData(im, 0, 0);
            var pat = document.createElementNS(NS, "pattern");
            pat.setAttribute("id", id); pat.setAttribute("patternUnits", "userSpaceOnUse");
            pat.setAttribute("width", S / 2); pat.setAttribute("height", S / 2);
            var img = document.createElementNS(NS, "image");
            img.setAttribute("href", cv.toDataURL()); img.setAttribute("width", S / 2); img.setAttribute("height", S / 2);
            img.setAttribute("preserveAspectRatio", "none");
            pat.appendChild(img);
            (defsEl || svg).appendChild(pat);
        } catch (e) { return null; }
        grainIds[key] = id;
        return id;
    }
    function makeEl(st) {                                      // 획 하나의 SVG 요소 (수채화는 번짐 + 물감 두 겹)
        var col = colorOf(st.c), p;
        if (st.t === "watercolor") {
            p = document.createElementNS(NS, "g");
            p.setAttribute("class", "ink-wc");
            [[1.45, 0.22], [1, 0.62]].forEach(function (z) {
                var q = document.createElementNS(NS, "path");
                q.setAttribute("fill", "none"); q.setAttribute("stroke", col);
                q.setAttribute("stroke-width", f1(st.w * z[0])); q.setAttribute("stroke-linecap", "round"); q.setAttribute("stroke-linejoin", "round");
                q.setAttribute("stroke-opacity", f2(st.o * z[1]));
                p.appendChild(q);
            });
            return p;
        }
        p = document.createElementNS(NS, "path");
        if (st.geo && !LINE_T[st.t]) {                         // 인식된 모양: 같은 굵기 선 (연필 · 크레용은 종이결 그대로)
            var gg = st.t === "pencil" || st.t === "crayon" || st.t === "reed" ? grainFor(col, st.t) : null;
            p.setAttribute("fill", "none");
            p.setAttribute("stroke", gg ? "url(#" + gg + ")" : col);
            p.setAttribute("stroke-width", f2(st.t === "fountain" || st.t === "reed" ? st.w * 0.8 : st.w));
            p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
            p.setAttribute("stroke-opacity", st.o);
            return p;
        }
        if (LINE_T[st.t]) {
            p.setAttribute("fill", "none");
            p.setAttribute("stroke", col);
            p.setAttribute("stroke-width", st.w);
            p.setAttribute("stroke-linecap", st.t === "marker" ? "square" : "round");
            p.setAttribute("stroke-linejoin", "round");
            p.setAttribute("stroke-opacity", st.o);
        } else {
            var g = st.t === "pencil" || st.t === "crayon" || st.t === "reed" ? grainFor(col, st.t) : null;
            p.setAttribute("fill", g ? "url(#" + g + ")" : col);
            p.setAttribute("fill-opacity", st.o);
        }
        return p;
    }
    function setD(e, d) {
        if (e.tagName === "g") { for (var i = 0; i < e.childNodes.length; i++) e.childNodes[i].setAttribute("d", d); }
        else e.setAttribute("d", d);
    }
    function layerOf(st) {
        if (st.k === "shape" || st.k === "sig") return gObj;
        return st.t === "marker" || st.t === "watercolor" ? gMarker : st.t === "pencil" || st.t === "crayon" ? gPencil : gPen;
    }

    /* ---------- 넣은 것: 도형 · 서명 · 텍스트 · 돋보기 ---------- */
    function shapeD(o, ox, oy) {                               // 도형 모양 (x1 y1 x2 y2 = 글 블록 기준)
        var x1 = Math.min(o.x1, o.x2) + ox, y1 = Math.min(o.y1, o.y2) + oy, x2 = Math.max(o.x1, o.x2) + ox, y2 = Math.max(o.y1, o.y2) + oy;
        var w = x2 - x1, h = y2 - y1, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, k;
        if (o.sh === "rect") return "M" + f1(x1) + " " + f1(y1) + "H" + f1(x2) + "V" + f1(y2) + "H" + f1(x1) + "Z";
        if (o.sh === "oval") return "M" + f1(cx - w / 2) + " " + f1(cy) + "A" + f1(w / 2) + " " + f1(h / 2) + " 0 1 0 " + f1(cx + w / 2) + " " + f1(cy) + "A" + f1(w / 2) + " " + f1(h / 2) + " 0 1 0 " + f1(cx - w / 2) + " " + f1(cy) + "Z";
        if (o.sh === "bubble") {                               // 말풍선: 둥근 네모 + 왼쪽 아래 꼬리
            var r = Math.min(18, w / 4, h / 4), by = y1 + h * 0.78;
            return "M" + f1(x1 + r) + " " + f1(y1) + "H" + f1(x2 - r) + "Q" + f1(x2) + " " + f1(y1) + " " + f1(x2) + " " + f1(y1 + r) +
                "V" + f1(by - r) + "Q" + f1(x2) + " " + f1(by) + " " + f1(x2 - r) + " " + f1(by) +
                "H" + f1(x1 + w * 0.38) + "L" + f1(x1 + w * 0.16) + " " + f1(y2) + "L" + f1(x1 + w * 0.22) + " " + f1(by) +
                "H" + f1(x1 + r) + "Q" + f1(x1) + " " + f1(by) + " " + f1(x1) + " " + f1(by - r) + "V" + f1(y1 + r) + "Q" + f1(x1) + " " + f1(y1) + " " + f1(x1 + r) + " " + f1(y1) + "Z";
        }
        if (o.sh === "star") {
            var d = "";
            for (k = 0; k < 10; k++) {
                var rr = k % 2 ? 0.42 : 1, an = -Math.PI / 2 + k * Math.PI / 5;
                d += (k ? "L" : "M") + f1(cx + Math.cos(an) * w / 2 * rr) + " " + f1(cy + Math.sin(an) * h / 2 * rr);
            }
            return d + "Z";
        }
        var ax = o.x1 + ox, ay = o.y1 + oy, bx = o.x2 + ox, by2 = o.y2 + oy;   // 선 · 화살표는 시작 → 끝 방향 그대로
        var line = "M" + f1(ax) + " " + f1(ay) + "L" + f1(bx) + " " + f1(by2);
        if (o.sh === "line") return line;
        var an2 = Math.atan2(by2 - ay, bx - ax), hl = Math.max(12, o.w * 4.2);
        return line + "M" + f1(bx - hl * Math.cos(an2 - 0.45)) + " " + f1(by2 - hl * Math.sin(an2 - 0.45)) + "L" + f1(bx) + " " + f1(by2) +
            "L" + f1(bx - hl * Math.cos(an2 + 0.45)) + " " + f1(by2 - hl * Math.sin(an2 + 0.45));
    }
    function makeObjEl(o, ox, oy) {
        if (o.k === "shape") {
            var p = document.createElementNS(NS, "path"), col = colorOf(o.c);
            p.setAttribute("d", shapeD(o, ox, oy));
            p.setAttribute("stroke", col); p.setAttribute("stroke-width", o.w);
            p.setAttribute("stroke-linejoin", "round"); p.setAttribute("stroke-linecap", "round");
            p.setAttribute("fill", o.fill && !/^(line|arrow)$/.test(o.sh) ? col : "none");
            if (o.fill) p.setAttribute("fill-opacity", "1");
            return p;
        }
        if (o.k === "sig") {                                   // 서명: 0~1 상자 안 획들을 x · y · w · h 로 늘림
            var g = document.createElementNS(NS, "g"), c2 = colorOf(o.c);
            (o.sg || []).forEach(function (pts) {
                var abs = [];
                for (var k = 0; k < pts.length; k += 3) abs.push(pts[k] * o.w, pts[k + 1] * o.h, pts[k + 2]);
                var st = { t: "pen", w: Math.max(1.2, o.lw || 2.2), pts: abs, sim: 0 }, q = document.createElementNS(NS, "path");
                q.setAttribute("d", shapeOf(st, ox + o.x, oy + o.y));
                q.setAttribute("fill", c2);
                g.appendChild(q);
            });
            return g;
        }
        return null;
    }
    function objBox(o, ox, oy) {                               // 넣은 것의 문서 좌표 상자
        if (o.k === "shape") return { x1: Math.min(o.x1, o.x2) + ox, y1: Math.min(o.y1, o.y2) + oy, x2: Math.max(o.x1, o.x2) + ox, y2: Math.max(o.y1, o.y2) + oy };
        if (o.k === "sig") return { x1: o.x + ox, y1: o.y + oy, x2: o.x + o.w + ox, y2: o.y + o.h + oy };
        if (o.k === "mag") return { x1: o.x - o.r + ox, y1: o.y - o.r + oy, x2: o.x + o.r + ox, y2: o.y + o.r + oy };
        if (o.k === "text") return null;                       // 텍스트는 그린 뒤 실제 크기로
        return null;
    }

    /* ===================== 상태 · 그리기 ===================== */
    var strokes = [];              // 획 { a, fx, fy, t, c, w, o, pts:[x,y,p…] } · 넣은 것 { k: text|shape|sig|mag, … } — 바꿀 때는 새 객체로
    var undoS = [], redoS = [];
    var rendered = [];             // strokes 와 같은 순서 { el, bb, ox, oy }
    var svg, svgMk, gHalo, gMarker, gPencil, gPen, gObj, gSel, layerCur, lassoPath, objLayer;
    var sel = [];                  // 올가미로 고른 획
    var selPoly = null, selMenu = null;   // 고른 획 둘레(문서 좌표 x,y,x,y…) · 톡 누른 곳(메뉴 위치)
    var osel = null;               // 고른 넣은 것 하나
    var clip = [];                 // 잘라내기 · 복사한 것

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
        svgMk.setAttribute("width", W); svgMk.setAttribute("height", H);
        svgMk.style.width = W + "px"; svgMk.style.height = H + "px";
        [gMarker, gPencil, gPen, gObj].forEach(function (g) { while (g.firstChild) g.removeChild(g.firstChild); });
        objLayer.innerHTML = "";
        rendered = [];
        var mags = [];
        for (var i = 0; i < strokes.length; i++) {
            var st = strokes[i], o = originOf(st), e = null, bb = null;
            if (st.k === "text") {
                if (o) { e = makeTextEl(st, o.x, o.y); objLayer.appendChild(e); }
            } else if (st.k === "mag") {
                if (o) { mags.push({ st: st, o: o }); bb = objBox(st, o.x, o.y); }
            } else if (isObj(st)) {
                if (o) { e = makeObjEl(st, o.x, o.y); if (e) gObj.appendChild(e); bb = objBox(st, o.x, o.y); }
            } else {
                e = makeEl(st);
                if (o) { setD(e, shapeOf(st, o.x, o.y)); bb = bboxOf(st, o.x, o.y); }
                else e.style.display = "none";
                layerOf(st).appendChild(e);
            }
            rendered.push({ el: e, bb: bb, ox: o ? o.x : 0, oy: o ? o.y : 0 });
        }
        for (var t = 0; t < strokes.length; t++) {             // 텍스트 상자는 붙인 뒤 실제 크기를 잼
            if (strokes[t].k === "text" && rendered[t].el) {
                var tb = rendered[t].el.getBoundingClientRect();
                rendered[t].bb = { x1: tb.left + scrollX, y1: tb.top + scrollY, x2: tb.right + scrollX, y2: tb.bottom + scrollY };
            }
        }
        mags.forEach(function (m) { var me = makeMagEl(m.st, m.o.x, m.o.y); objLayer.appendChild(me); rendered[strokes.indexOf(m.st)].el = me; });
        if (osel && strokes.indexOf(osel) < 0) osel = null;
        drawSelection();
    }
    var relT = 0;
    function relayout() {
        if (relT) return;
        relT = setTimeout(function () { relT = 0; if (!cur && !drag && !editing) renderAll(); }, 40);
    }

    /* ---------- 텍스트 상자 ---------- */
    var editing = null;            // 고쳐 쓰는 중인 텍스트 { st, el }
    function makeTextEl(st, ox, oy) {
        var d = document.createElement("div");
        d.className = "ink-text";
        d.style.left = f1(st.x + ox) + "px"; d.style.top = f1(st.y + oy) + "px";
        d.style.width = f1(st.w) + "px"; d.style.fontSize = st.fs + "px"; d.style.color = colorOf(st.c);
        d.style.textAlign = st.al || "left";
        d.textContent = st.txt || "";
        if (st === osel) d.classList.add("on");
        return d;
    }
    function startEdit(st) {
        var i = strokes.indexOf(st), R = rendered[i];
        if (!R || !R.el) return;
        editing = { st: st, el: R.el };
        var e = R.el;
        e.classList.add("edit");
        e.contentEditable = "true";
        e.spellcheck = false;
        e.focus();
        try { var rg = document.createRange(); rg.selectNodeContents(e); var s = getSelection(); s.removeAllRanges(); s.addRange(rg); } catch (er) {}
        e.addEventListener("blur", endEdit, { once: true });
        e.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.preventDefault(); endEdit(); } ev.stopPropagation(); });
    }
    function endEdit() {
        if (!editing) return;
        var ed = editing; editing = null;
        ed.el.contentEditable = "false";
        try { if (document.activeElement === ed.el) ed.el.blur(); } catch (er) {}
        var txt = (ed.el.innerText || "").replace(/ /g, " ").replace(/\n+$/, "");
        var i = strokes.indexOf(ed.st);
        if (i < 0) { renderAll(); return; }
        if (txt === (ed.st.txt || "")) { renderAll(); return; }
        snapshot();
        if (!txt.trim()) { strokes.splice(i, 1); osel = null; }
        else { var n = Object.assign({}, ed.st, { txt: txt }); strokes[i] = n; osel = n; }
        commit();
    }

    /* ---------- 돋보기 ---------- */
    function makeMagEl(st, ox, oy) {                           // 페이지를 복제해 확대해서 동그라미 안에 (아이패드 마크업 돋보기)
        var cx = st.x + ox, cy = st.y + oy, r = st.r, z = st.z;
        var box = document.createElement("div");
        box.className = "ink-mag" + (st === osel ? " on" : "");
        box.style.left = f1(cx - r) + "px"; box.style.top = f1(cy - r) + "px";
        box.style.width = box.style.height = f1(r * 2) + "px";
        var inner = document.createElement("div");
        inner.className = "ink-mag-in";
        inner.style.transform = "translate(" + f1(r - cx * z) + "px," + f1(r - cy * z) + "px) scale(" + z + ")";
        var wrap = document.querySelector(".wrap");
        if (wrap) {
            var b = boxOf(wrap) || { x: 0, y: 0, w: wrap.offsetWidth };
            var cl = wrap.cloneNode(true);
            cl.querySelectorAll("script, iframe, video, audio").forEach(function (n) { n.remove(); });
            cl.removeAttribute("id");
            cl.style.cssText += ";position:absolute;margin:0;left:" + f1(b.x) + "px;top:" + f1(b.y) + "px;width:" + f1(b.w) + "px;max-width:none";
            inner.appendChild(cl);
        }
        var ic = svg.cloneNode(true);                          // 필기도 같이 확대
        ic.removeAttribute("class");
        ic.style.cssText = "position:absolute;left:0;top:0;pointer-events:none";
        for (var q = ic.children.length - 1; q >= 5; q--) ic.children[q].remove();   // 그리는 중 · 선택 표시 · 올가미 줄은 빼고
        inner.appendChild(ic);
        box.appendChild(inner);
        return box;
    }

    /* ===================== 입력 ===================== */
    var EXEMPT = "input, textarea, select, button, label, [contenteditable], .ct-code, .oq-ans, .ex-srcref, .ex-srcview, .ex-lv, .ex-modal";
    function inUI(t) { return t && t.closest && t.closest(".ink-ui"); }
    function onRuler(t) { return t && t.closest && t.closest(".ink-ruler"); }
    function exempt(t) { return inUI(t) || (t && t.closest && t.closest(EXEMPT)); }
    function drawsWith(e) {
        if (P.hidden || P.off || exempt(e.target)) return false;   // 필기 끔 → 펜슬 · 손가락 · 마우스 모두 스크롤 · 클릭
        if (e.pointerType === "pen") return true;              // 펜슬은 언제나
        if (onRuler(e.target)) return false;                   // 자 위의 손가락 · 마우스 = 자 옮기기
        if (e.pointerType === "mouse") return P.open && P.mouse && e.button === 0;
        if (e.pointerType === "touch") return P.open && P.finger;
        return false;
    }
    function docX(e) { return e.clientX + window.scrollX; }
    function docY(e) { return e.clientY + window.scrollY; }
    function pressureOf(e) {
        if (e.pointerType !== "pen") return 0.5;
        var p = e.pressure || 0.5;
        if (P.tool === "pencil" || P.tool === "crayon") {      // 연필 · 크레용: 눕히면 굵게
            var tilt = Math.min(1, Math.hypot(e.tiltX || 0, e.tiltY || 0) / 70);
            p = p * (1 + tilt * 1.4);
        }
        return Math.round(p * 100) / 100;
    }

    var cur = null;               // 그리는 중인 획
    var drag = null;              // 지우개 · 올가미 · 옮기기 · 넣은 것 옮기기 · 크기
    var lastDraw = 0, holdT = 0, picking = false, lastTap = { t: 0, st: null };

    function objAt(x, y) {                                     // 그 자리의 넣은 것 (맨 위부터)
        for (var i = strokes.length - 1; i >= 0; i--) {
            var st = strokes[i], R = rendered[i];
            if (!isObj(st) || !R || !R.bb) continue;
            var pad = st.k === "shape" && /^(line|arrow)$/.test(st.sh) ? 12 : 6, b = R.bb;
            if (x < b.x1 - pad || x > b.x2 + pad || y < b.y1 - pad || y > b.y2 + pad) continue;
            if (st.k === "shape" && /^(line|arrow)$/.test(st.sh)) {
                if (segDist2(x, y, st.x1 + R.ox, st.y1 + R.oy, st.x2 + R.ox, st.y2 + R.oy) > 14 * 14) continue;
            }
            if (st.k === "mag" && Math.hypot(x - (st.x + R.ox), y - (st.y + R.oy)) > st.r + 6) continue;
            return st;
        }
        return null;
    }
    function handleAt(x, y) {                                  // 고른 넣은 것의 손잡이
        if (!osel) return null;
        var hs = handles(osel);
        for (var i = 0; i < hs.length; i++) if (Math.hypot(x - hs[i].x, y - hs[i].y) <= 16) return hs[i];
        return null;
    }
    function onDown(e) {
        if (editing && e.target && e.target.closest && e.target.closest(".ink-text.edit")) return;
        if (editing && !inUI(e.target)) endEdit();                 // 다른 곳을 누르면 텍스트 고치기 끝 (blur 가 안 와도)
        if (picking && !inUI(e.target)) { e.preventDefault(); pickAt(docX(e), docY(e)); return; }
        var x = docX(e), y = docY(e);
        var drawIn = drawsWith(e);
        if (!inUI(e.target) && !onRuler(e.target) && !P.hidden && !P.off && (!exempt(e.target) || (e.target.closest && e.target.closest(".ink-text")))) {
            var h = handleAt(x, y);                              // 고른 것의 손잡이 · 몸통 → 옮기기 · 크기 (어떤 입력이든)
            if (h) { e.preventDefault(); startObjDrag("handle", x, y, h); return; }
            var hit = objAt(x, y);
            if (hit && (!drawIn || P.tool === "lasso" || e.pointerType !== "pen" || hit === osel)) {
                e.preventDefault();
                var now = Date.now(), dbl = hit.k === "text" && hit === osel && lastTap.st === hit && now - lastTap.t < 500;
                lastTap = dbl ? { t: 0, st: null } : { t: now, st: hit };
                if (osel !== hit) { osel = hit; sel = []; drawSelection(); renderAll(); }
                startObjDrag("move", x, y, null);
                drag.dbl = dbl;                                  // 두 번 톡(움직이지 않음) → 텍스트 고치기 · 끌면 옮기기
                return;
            }
        }
        if (!drawIn) {
            if ((sel.length || osel) && !inUI(e.target) && !onRuler(e.target) && e.pointerType !== "touch") { sel = []; osel = null; renderAll(); }
            return;
        }
        e.preventDefault();
        closePop();
        if (osel) { osel = null; renderAll(); }
        root.classList.add("ink-drawing");
        if (P.tool === "eraser") { drag = { kind: "erase", snap: strokes.slice(), changed: false }; eraseAt(x, y); return; }
        if (P.tool === "lasso") {
            selMenu = null;
            if (sel.length && selPoly && selPoly.some(function (pl) { return inPoly(x, y, pl); })) { drag = { kind: "move", sx: x, sy: y, dx: 0, dy: 0 }; showSelBar(); }   // 둘레 안: 끌면 옮기기 · 톡 = 메뉴
            else {
                sel = []; drawSelection();
                drag = { kind: "lasso", pts: [x, y] };
                lassoPath.setAttribute("d", "M" + x + " " + y);
                lassoPath.style.display = "";
            }
            return;
        }
        if (e.pointerType === "pen" && P.open && P.autoMin) { P.open = false; savePrefs(); syncUI(); }   // 자동으로 최소화
        startStroke(x, y, pressureOf(e), e.pointerType);
    }
    function onMove(e) {
        if (e.pointerType === "pen" && !e.buttons && !cur && !drag) { hover(e); return; }
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
        else if (drag.kind === "lasso") { drag.pts.push(f1(x), f1(y)); lassoPath.setAttribute("d", polyD(drag.pts)); }   // 그리는 동안은 열린 점선 (아이패드와 같음)
        else if (drag.kind === "move") {
            drag.dx = x - drag.sx; drag.dy = y - drag.sy;
            var tf = "translate(" + f1(drag.dx) + " " + f1(drag.dy) + ")";
            sel.forEach(function (s) { var r = rendered[strokes.indexOf(s)]; if (r && r.el) r.el.setAttribute("transform", tf); });
            gSel.setAttribute("transform", tf); gHalo.setAttribute("transform", tf);
            if (Math.abs(drag.dx) + Math.abs(drag.dy) > 3 && selBar.style.display !== "none") selBar.style.display = "none";
        } else if (drag.kind === "omove" || drag.kind === "handle") objDragMove(x, y);
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
            gSel.removeAttribute("transform"); gHalo.removeAttribute("transform");
            if (Math.abs(d.dx) + Math.abs(d.dy) <= 3) { selMenu = { x: d.sx, y: d.sy }; renderAll(); return; }   // 톡 → 오려두기 · 복사하기 … 메뉴
            if (Math.abs(d.dx) + Math.abs(d.dy) > 0.5) {
                snapshot();
                var moved = sel.map(function (s) { return shifted(s, d.dx, d.dy); });
                sel.forEach(function (s, k) { strokes[strokes.indexOf(s)] = moved[k]; });
                sel = moved;
                commit();
            } else renderAll();
        } else if (d.kind === "omove" || d.kind === "handle") objDragEnd(d);
    }
    function shifted(s, dx, dy) {
        var n = Object.assign({}, s);
        if (s.k === "shape") { n.x1 = f1(s.x1 + dx); n.x2 = f1(s.x2 + dx); n.y1 = f1(s.y1 + dy); n.y2 = f1(s.y2 + dy); return n; }
        if (s.k) { n.x = f1(s.x + dx); n.y = f1(s.y + dy); return n; }
        n.pts = s.pts.slice();
        for (var k = 0; k < n.pts.length; k += 3) { n.pts[k] = f1(n.pts[k] + dx); n.pts[k + 1] = f1(n.pts[k + 1] + dy); }
        return n;
    }
    function blockTouch(e) {                                  // 펜슬 터치는 스크롤 · 확대 · 길게 누르기 막기
        if (P.hidden || P.off || exempt(e.target)) return;      // 필기 끔 → 펜슬로 스크롤
        var t = e.touches && e.touches[0];
        if (!t) return;
        if (drag && (drag.kind === "omove" || drag.kind === "handle")) { e.preventDefault(); return; }
        if (t.touchType === "stylus" || (P.open && P.finger)) e.preventDefault();
    }

    /* ---------- 펜슬 호버 미리보기 (아이패드: 펜슬을 화면 가까이 대면 촉 미리보기) ---------- */
    var hoverEl = null, hoverT = 0;
    function hover(e) {
        if (P.hidden || P.off || exempt(e.target) || P.tool === "lasso") return;
        if (!hoverEl) { hoverEl = document.createElement("div"); hoverEl.className = "ink-hover"; hoverEl.setAttribute("data-theme-skip", ""); document.body.appendChild(hoverEl); }
        var t = P.tool, w = t === "eraser" ? P.eraser.w : P[t].w;
        var sz = Math.max(4, t === "eraser" ? w : LINE_T[t] ? w : w * 1.1);
        hoverEl.style.width = hoverEl.style.height = sz + "px";
        hoverEl.style.left = (e.clientX - sz / 2) + "px"; hoverEl.style.top = (e.clientY - sz / 2) + "px";
        hoverEl.style.background = t === "eraser" ? "rgba(255,255,255,.25)" : colorOf(P[t].c);
        hoverEl.style.opacity = t === "eraser" ? 1 : Math.max(0.35, P[t].o * 0.8);
        hoverEl.classList.toggle("er", t === "eraser");
        hoverEl.style.display = "block";
        clearTimeout(hoverT);
        hoverT = setTimeout(function () { hoverEl.style.display = "none"; }, 260);
    }

    /* ---------- 펜 · 모노라인 · 만년필 · 마커 · 연필 · 크레용 · 수채화 ---------- */
    function startStroke(x, y, p, kind) {
        var tool = P.tool, cfg = P[tool];
        var a = anchorAt(x, y);
        var ax = a ? a.b.x : 0, ay = a ? a.b.y : 0;
        var edge = rulerEdgeAt(x, y, cfg.w);
        if (edge) { var q = projEdge(edge, x, y); x = q[0]; y = q[1]; }
        var st = { a: a ? a.key : "", fx: f1(ax), fy: f1(ay), t: tool, c: cfg.c, w: cfg.w, o: cfg.o, sim: kind === "pen" ? 0 : 1, pts: [f2(x - ax), f2(y - ay), p] };
        if (edge) { st.sim = 0; st.sm = 0; }
        var e = makeEl(st);
        (tool === "marker" || tool === "watercolor" ? gMarker : layerCur).appendChild(e);
        cur = { st: st, el: e, ax: ax, ay: ay, lx: x, ly: y, straight: false, plen: 0, edge: edge, raw: [x, y] };
        redrawCur();
        armHold();
    }
    function addPoint(x, y, p) {
        var c = cur;
        if (c.edge) { var q = projEdge(c.edge, x, y); x = q[0]; y = q[1]; }
        if (c.straight) { geoAdjust(x, y); return; }           // 모양으로 바뀐 뒤 움직이면 크기 · 방향 · 끝점만 바뀜
        var d = Math.hypot(x - c.lx, y - c.ly);
        if (d < 0.6) return;
        c.plen += d;
        if (d > 2.5) armHold();
        c.lx = x; c.ly = y;
        c.st.pts.push(f2(x - c.ax), f2(y - c.ay), p);
    }
    var rafId = 0;
    function redrawCur() {
        if (!cur || rafId) return;
        var go = function () { rafId = 0; if (cur) setD(cur.el, shapeOf(cur.st, cur.ax, cur.ay, true)); };
        rafId = window.requestAnimationFrame ? window.requestAnimationFrame(go) : setTimeout(go, 16);
    }
    /* ---------- 모양 인식 — iPadOS 미리보기처럼 (2026-10-23 · 10-26 v6: 시뮬레이터에서 같은 획을 그려 결과를 겹쳐 맞춤) ----------
       그리다가 멈추고 꾹(0.5초) → 반듯한 모양으로 바뀜 · 손을 떼지 않고 움직이면 크기 · 방향(열린 모양은 끝점)을 바꿀 수 있음
       · 원 · 타원 · 정사각형(가로 ÷ 세로 1.35 미만) · 직사각형 · 정삼각형 · 별 · 정오각형 · 정육각형(반지름 = (가로 + 세로) ÷ 4)
       · 하트 · 구름 = 미리보기가 바꿔 준 모양을 따라 그린 틀 · 말풍선 = 타원 + 곧은 꼬리(꼬리 방향 ± 13°) · 블록 화살표(머리 폭 = 몸통 × 2 · 45°)
       · 곧은 선 · 화살표 · 양쪽 화살표 · 휜 화살표(양 끝 고정 2차 곡선) · 원호 — 화살촉 날개 = 굵기 × 4.9 · 25.5°
       결과는 획 굵기가 한결같은 선(geo) — 테두리 대신 stroke 로 그려 모서리 · 곡선이 깨끗함 */
    function armHold() {
        clearTimeout(holdT);
        if (!cur || cur.straight || cur.edge) return;
        holdT = setTimeout(function () {
            if (!cur || cur.straight || cur.plen < 24) return;
            var res = recognize(cur.st.pts, cur.st.w);
            if (!res) return;
            var st = cur.st;
            st.geo = 1; st.sim = 0; st.sm = 0;
            st.pts = res.pts;
            cur.straight = true;
            cur.geo = res;                                     // 꾹 누른 뒤 움직이면 크기 · 방향 바꾸기
            cur.ref = [cur.lx - cur.ax, cur.ly - cur.ay];
            var ne = makeEl(st);                               // 테두리 채우기 → 같은 굵기 선으로 바꿔 그림
            if (cur.el.parentNode) cur.el.parentNode.replaceChild(ne, cur.el);
            cur.el = ne;
            redrawCur();
        }, 500);
    }
    function geoAdjust(x, y) {                                 // 모양으로 바뀐 뒤 펜을 움직이면: 열린 모양 = 끝점이 따라옴 · 닫힌 모양 = 크기 · 회전
        var c = cur, g = c.geo, px = x - c.ax, py = y - c.ay;
        if (!g) return;
        if (g.path) {                                          // 시작점은 그대로 · 끝점 = 처음 끝점 + 펜이 움직인 만큼 (곡선은 같이 돌고 늘어남 · 화살촉 크기는 그대로)
            var A = g.path[0], B = g.path[g.path.length - 1], ex = B[0] + px - c.ref[0], ey = B[1] + py - c.ref[1], dx = ex - A[0], dy = ey - A[1];
            if (g.path.length === 2) { if (Math.abs(dy) < Math.abs(dx) * 0.07) ey = A[1]; else if (Math.abs(dx) < Math.abs(dy) * 0.07) ex = A[0]; }
            var L0 = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, k0 = Math.hypot(ex - A[0], ey - A[1]) / L0;
            if (k0 < 0.05) return;
            var r0 = Math.atan2(ey - A[1], ex - A[0]) - Math.atan2(B[1] - A[1], B[0] - A[0]), kc = Math.cos(r0) * k0, ks = Math.sin(r0) * k0;
            var np = g.path.map(function (q) { var ux = q[0] - A[0], uy = q[1] - A[1]; return [A[0] + ux * kc - uy * ks, A[1] + ux * ks + uy * kc]; });
            np[np.length - 1] = [ex, ey];
            c.st.pts = openPts(np, g.ha, g.hb, g.p, g.w);
        } else if (g.verts) {
            var cx = g.c[0], cy = g.c[1], r0 = Math.hypot(c.ref[0] - cx, c.ref[1] - cy), r1 = Math.hypot(px - cx, py - cy);
            if (r0 < 8) return;
            var k = Math.max(0.15, r1 / r0), rot = Math.atan2(py - cy, px - cx) - Math.atan2(c.ref[1] - cy, c.ref[0] - cx);
            var cs = Math.cos(rot), sn = Math.sin(rot);
            var v = g.verts.map(function (p) { var ux = (p[0] - cx) * k, uy = (p[1] - cy) * k; return [cx + ux * cs - uy * sn, cy + ux * sn + uy * cs]; });
            c.st.pts = densify(v.concat([v[0]]), g.p, !g.smooth);
        } else return;
        redrawCur();
    }
    function densify(list, p, sharp) {                         // 꼭짓점 사이를 4px 마다 채움 (지우개 · 올가미가 선 위 어디든 닿게)
        var r = [];
        list.forEach(function (pt, i) {
            if (i && sharp !== false) {
                var q = list[i - 1], m = Math.max(1, Math.floor(Math.hypot(pt[0] - q[0], pt[1] - q[1]) / 4));
                for (var j = 1; j < m; j++) r.push(f2(q[0] + (pt[0] - q[0]) * j / m), f2(q[1] + (pt[1] - q[1]) * j / m), p);
            }
            r.push(f2(pt[0]), f2(pt[1]), p);
        });
        return r;
    }
    /* 화살촉: 미리보기에서 잰 값 — 날개 길이 = 선 굵기 × 4.9 (굵기 3.5 → 17pt) · 벌어진 각 25.5° · 둥근 끝 */
    function headPts(tip, dir, w) {                            // dir = 화살이 가는 방향(라디안) → [날개1, 끝, 날개2]
        var hl = Math.max(11, w * 4.9), sp = 25.5 * Math.PI / 180;
        return [[tip[0] - hl * Math.cos(dir - sp), tip[1] - hl * Math.sin(dir - sp)], tip, [tip[0] - hl * Math.cos(dir + sp), tip[1] - hl * Math.sin(dir + sp)]];
    }
    function openPts(path, ha, hb, p, w) {                     // 열린 모양 한 획: [날개 → 시작 → 날개 → 시작 →] 선 [→ 끝 → 날개 → 끝 → 날개]
        var n = path.length, a = path[0], b = path[n - 1], list = [];
        if (ha) { var h = headPts(a, Math.atan2(a[1] - path[1][1], a[0] - path[1][0]), w); list.push(h[0], a, h[2]); }
        list = list.concat(path);
        if (hb) { var g = headPts(b, Math.atan2(b[1] - path[n - 2][1], b[0] - path[n - 2][0]), w); list.push(g[0], b, g[2]); }
        return densify(list, p);
    }
    function quadPts(a, c, b, m) {                             // 2차 곡선 (휜 화살표 · 휜 선)
        var v = [];
        for (var i = 0; i <= m; i++) { var t = i / m, u = 1 - t; v.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
        return v;
    }
    function quadFit(S, a, b) {                                // 양 끝을 고정한 2차 곡선의 조절점 (최소제곱)
        var L = [0], i, nx = 0, ny = 0, den = 0;
        for (i = 1; i < S.length; i++) L.push(L[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
        var T = L[L.length - 1] || 1;
        S.forEach(function (p, j) { var t = L[j] / T, u = 1 - t, B = 2 * u * t; den += B * B; nx += B * (p[0] - u * u * a[0] - t * t * b[0]); ny += B * (p[1] - u * u * a[1] - t * t * b[1]); });
        return den ? [nx / den, ny / den] : null;
    }
    /* 하트 · 구름: 미리보기가 바꿔 준 모양을 화면에서 따라 그린 중심선 (가로 -0.5~0.5) */
    var HEART_T = [0,0.143,0.026,0.107,0.058,0.069,0.094,0.039,0.132,0.018,0.173,0.005,0.214,0,0.254,0.002,0.293,0.01,0.331,0.024,0.366,0.044,0.397,0.068,0.424,0.098,0.448,0.13,0.467,0.165,0.481,0.202,0.491,0.24,0.497,0.279,0.5,0.317,0.499,0.355,0.495,0.392,0.489,0.428,0.48,0.463,0.469,0.496,0.456,0.527,0.442,0.557,0.427,0.586,0.411,0.613,0.395,0.639,0.378,0.663,0.36,0.687,0.342,0.71,0.323,0.732,0.304,0.754,0.285,0.774,0.265,0.795,0.244,0.815,0.223,0.835,0.2,0.856,0.177,0.876,0.152,0.897,0.126,0.918,0.098,0.939,0.068,0.962,0.035,0.985,0,1,-0.035,0.985,-0.068,0.962,-0.098,0.939,-0.126,0.918,-0.152,0.897,-0.177,0.876,-0.2,0.856,-0.223,0.835,-0.244,0.815,-0.265,0.795,-0.285,0.774,-0.304,0.754,-0.323,0.732,-0.342,0.71,-0.36,0.687,-0.378,0.663,-0.395,0.639,-0.411,0.613,-0.427,0.586,-0.442,0.557,-0.456,0.527,-0.469,0.496,-0.48,0.463,-0.489,0.428,-0.495,0.392,-0.499,0.355,-0.5,0.317,-0.497,0.279,-0.491,0.24,-0.481,0.202,-0.467,0.165,-0.448,0.13,-0.424,0.098,-0.397,0.068,-0.366,0.044,-0.331,0.024,-0.293,0.01,-0.254,0.002,-0.214,0,-0.173,0.005,-0.132,0.018,-0.094,0.039,-0.058,0.069,-0.026,0.107];
    var CLOUD_T = [0,-0.447,0.01,-0.457,0.019,-0.469,0.03,-0.479,0.04,-0.487,0.051,-0.492,0.062,-0.497,0.073,-0.499,0.084,-0.5,0.095,-0.499,0.105,-0.497,0.116,-0.492,0.126,-0.486,0.136,-0.479,0.146,-0.47,0.156,-0.462,0.172,-0.472,0.189,-0.481,0.205,-0.485,0.221,-0.485,0.236,-0.482,0.25,-0.476,0.263,-0.467,0.275,-0.455,0.286,-0.442,0.296,-0.426,0.305,-0.409,0.312,-0.39,0.319,-0.369,0.324,-0.347,0.327,-0.324,0.329,-0.3,0.329,-0.275,0.327,-0.25,0.346,-0.24,0.388,-0.242,0.413,-0.231,0.434,-0.213,0.451,-0.193,0.465,-0.17,0.477,-0.144,0.486,-0.117,0.493,-0.089,0.497,-0.06,0.5,-0.03,0.5,0,0.498,0.03,0.493,0.059,0.486,0.088,0.477,0.115,0.465,0.141,0.451,0.165,0.434,0.186,0.436,0.215,0.439,0.245,0.439,0.274,0.435,0.302,0.429,0.328,0.419,0.351,0.407,0.372,0.392,0.388,0.373,0.4,0.347,0.402,0.315,0.392,0.304,0.408,0.296,0.427,0.287,0.444,0.276,0.458,0.265,0.47,0.251,0.479,0.237,0.484,0.221,0.485,0.204,0.481,0.184,0.468,0.165,0.454,0.155,0.46,0.146,0.47,0.136,0.479,0.126,0.486,0.116,0.492,0.105,0.496,0.095,0.499,0.084,0.5,0.073,0.499,0.062,0.497,0.051,0.492,0.04,0.486,0.03,0.479,0.019,0.469,0.01,0.457,0,0.451,-0.009,0.455,-0.019,0.467,-0.029,0.477,-0.039,0.485,-0.05,0.492,-0.061,0.496,-0.072,0.499,-0.083,0.5,-0.094,0.499,-0.105,0.497,-0.116,0.493,-0.126,0.487,-0.136,0.48,-0.146,0.471,-0.155,0.461,-0.164,0.452,-0.183,0.466,-0.203,0.48,-0.22,0.485,-0.236,0.484,-0.251,0.479,-0.264,0.471,-0.277,0.459,-0.287,0.445,-0.297,0.428,-0.304,0.409,-0.314,0.392,-0.346,0.401,-0.372,0.4,-0.392,0.389,-0.408,0.373,-0.42,0.352,-0.43,0.329,-0.436,0.303,-0.44,0.275,-0.44,0.246,-0.437,0.215,-0.433,0.186,-0.451,0.165,-0.465,0.141,-0.477,0.115,-0.486,0.088,-0.493,0.059,-0.498,0.03,-0.5,0,-0.5,-0.03,-0.497,-0.06,-0.493,-0.089,-0.486,-0.117,-0.477,-0.144,-0.465,-0.17,-0.451,-0.193,-0.434,-0.214,-0.413,-0.231,-0.388,-0.242,-0.347,-0.241,-0.328,-0.251,-0.33,-0.276,-0.33,-0.301,-0.328,-0.325,-0.324,-0.348,-0.319,-0.37,-0.313,-0.391,-0.305,-0.41,-0.296,-0.427,-0.286,-0.443,-0.275,-0.456,-0.263,-0.468,-0.249,-0.476,-0.235,-0.482,-0.221,-0.485,-0.205,-0.485,-0.188,-0.48,-0.171,-0.471,-0.155,-0.462,-0.146,-0.471,-0.136,-0.48,-0.126,-0.487,-0.116,-0.493,-0.105,-0.497,-0.094,-0.499,-0.083,-0.5,-0.072,-0.499,-0.061,-0.496,-0.05,-0.492,-0.039,-0.485,-0.029,-0.477,-0.019,-0.467,-0.009,-0.455];
    function tplPts(T, cx, cy, w, h, y0) {                     // 틀 → 크기 (y0 = 틀 세로 가운데 값)
        var v = []; for (var i = 0; i < T.length; i += 2) v.push([cx + T[i] * w, cy + (T[i + 1] - y0) * h]); return v;
    }
    function resample(P2, n) {                                 // 길이를 따라 같은 간격 n 점
        var len = 0, i, seg = [0];
        for (i = 1; i < P2.length; i++) { len += Math.hypot(P2[i][0] - P2[i - 1][0], P2[i][1] - P2[i - 1][1]); seg.push(len); }
        if (!len) return [P2[0]];
        var out = [], j = 1;
        for (i = 0; i < n; i++) {
            var t = len * i / (n - 1);
            while (j < seg.length - 1 && seg[j] < t) j++;
            var a = P2[j - 1], b = P2[j], u = (t - seg[j - 1]) / ((seg[j] - seg[j - 1]) || 1);
            out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
        }
        return out;
    }
    function pathLen(S) { var L = 0; for (var i = 1; i < S.length; i++) L += Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]); return L; }
    function polyDist(p, poly, closed) {                       // 점 → 다각형 테두리까지 가장 가까운 거리
        var best = Infinity, n = poly.length, m = closed ? n : n - 1;
        for (var i = 0; i < m; i++) { var a = poly[i], b = poly[(i + 1) % n]; best = Math.min(best, segDist2(p[0], p[1], a[0], a[1], b[0], b[1])); }
        return Math.sqrt(best);
    }
    function fitErr(R, poly, closed, size) {                   // 그린 점 ↔ 모양 테두리 양쪽 평균 거리 ÷ 크기
        var e1 = 0, e2 = 0, S = resample(closed ? poly.concat([poly[0]]) : poly, 48);
        R.forEach(function (p) { e1 += polyDist(p, poly, closed); });
        S.forEach(function (p) { e2 += polyDist(p, R, true); });
        return (e1 / R.length + e2 / S.length) / 2 / size;
    }
    function segX(a, b, c, d) {                                // 두 선분이 교차?
        function o(p, q, r) { return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); }
        return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
    }
    function angAt(a, b, c) { var u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]]; return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / ((Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1])) || 1)))) * 180 / Math.PI; }
    function snapAng(a, tol) { var q = Math.PI / 2, s = Math.round(a / q) * q; return Math.abs(a - s) < tol * Math.PI / 180 ? s : a; }
    function regular(cx, cy, n, R, rot, inner) {              // 정다각형 · 별 꼭짓점 (rot = 첫 꼭짓점 방향)
        var v = [], m = inner ? n * 2 : n;
        for (var i = 0; i < m; i++) { var an = rot + i * 2 * Math.PI / m, rr = inner && i % 2 ? R * inner : R; v.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]); }
        return v;
    }
    function frame(o, th) {                                    // (u, v) 좌표 → 화면 (o = 원점 · th = u 축 방향)
        var c = Math.cos(th), s = Math.sin(th);
        return function (u, v) { return [o[0] + u * c - v * s, o[1] + u * s + v * c]; };
    }
    function rdpIdx(R, i0, i1, eps, out) {                     // 더글러스-포이커 (꼭짓점 번호만)
        var a = R[i0], b = R[i1], idx = -1, dm = eps;
        for (var i = i0 + 1; i < i1; i++) { var d = Math.sqrt(segDist2(R[i][0], R[i][1], a[0], a[1], b[0], b[1])); if (d > dm) { dm = d; idx = i; } }
        if (idx < 0) return;
        rdpIdx(R, i0, idx, eps, out); out.push(idx); rdpIdx(R, idx, i1, eps, out);
    }

    /* 열린 획: 곧은 선 · 휜 선 · 화살표(한쪽 · 양쪽 · 휜 화살표)
       날카롭게(70° 넘게) 꺾인 곳에서 획을 자름 → 가장 긴 토막 = 화살 몸통 · 앞 · 뒤 토막 = 화살촉 (몸통 양쪽으로 다 벌어져야)
       몸통: 곧으면 직선 · 아니면 양 끝 고정 2차 곡선 (미리보기 휜 화살표와 평균 0.8pt 차이) · 반원처럼 많이 휘면 원호 */
    function openShape(P2, avgP, w, diag) {
        var R = resample(P2, 120), n = R.length, k, ids = [0];
        rdpIdx(R, 0, n - 1, Math.max(3, diag * 0.025), ids); ids.push(n - 1);
        var cuts = [0];
        for (k = 1; k < ids.length - 1; k++) if (180 - angAt(R[ids[k - 1]], R[ids[k]], R[ids[k + 1]]) > 70) cuts.push(ids[k]);
        cuts.push(n - 1);
        var bi = 0, bl = -1;
        for (k = 0; k < cuts.length - 1; k++) { var l = pathLen(R.slice(cuts[k], cuts[k + 1] + 1)); if (l > bl) { bl = l; bi = k; } }
        var i0 = cuts[bi], i1 = cuts[bi + 1], shaft = R.slice(i0, i1 + 1), A = R[i0], B = R[i1];
        var chord = Math.hypot(B[0] - A[0], B[1] - A[1]);
        if (chord < 12) return null;
        var path = null, curved = false, dev = 0;
        shaft.forEach(function (p) { dev = Math.max(dev, Math.sqrt(segDist2(p[0], p[1], A[0], A[1], B[0], B[1]))); });
        if (dev < Math.max(6, chord * 0.07)) {                 // 곧은 선 (수평 · 수직 근처면 반듯하게)
            var ex = B[0], ey = B[1], dx = ex - A[0], dy = ey - A[1];
            if (Math.abs(dy) < Math.abs(dx) * 0.07) ey = A[1]; else if (Math.abs(dx) < Math.abs(dy) * 0.07) ex = A[0];
            path = [A, [ex, ey]];
        } else {
            var c = quadFit(shaft, A, B), arc = null, ae = 0;
            if (c) {
                var Q = quadPts(A, c, B, 48), e1 = 0, eM = 0;
                shaft.forEach(function (p) { var d = polyDist(p, Q, false); e1 += d; eM = Math.max(eM, d); });
                if (e1 / shaft.length < Math.max(2.5, chord * 0.03) && eM < Math.max(8, chord * 0.09)) path = Q;
            }
            var cf = path ? null : circleFit(shaft);           // 원호 (반원처럼 많이 휘어 2차 곡선이 안 맞을 때)
            if (cf && cf.r < diag * 3) {
                var a0 = Math.atan2(A[1] - cf.y, A[0] - cf.x), sweep = 0, prev = a0;
                shaft.forEach(function (p) { var a = Math.atan2(p[1] - cf.y, p[0] - cf.x), d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; sweep += d; prev = a; });
                if (Math.abs(sweep) > 0.6) {
                    arc = []; for (k = 0; k <= 64; k++) { var an = a0 + sweep * k / 64; arc.push([cf.x + Math.cos(an) * cf.r, cf.y + Math.sin(an) * cf.r]); }
                    ae = 0; shaft.forEach(function (p) { ae += polyDist(p, arc, false); }); ae /= shaft.length;
                    if (ae > cf.r * 0.06) arc = null;
                }
            }
            if (!path) path = arc;                             // 미리보기는 2차 곡선이 먼저 (그린 선에 원이 더 잘 맞아도 곡선으로 바꿈)
            if (!path) return null;
            curved = true;
        }
        function head(part, tip, from) {                       // 1 = 화살촉 · 0 = 짧은 꼬리(무시) · -1 = 화살촉 아닌 긴 획 → 인식 안 함
            if (part.length < 2) return 0;
            var dl = Math.hypot(tip[0] - from[0], tip[1] - from[1]) || 1, ux = (tip[0] - from[0]) / dl, uy = (tip[1] - from[1]) / dl;
            var L = 0, Rt = 0, bad = 0, far = 0, thr;
            part.forEach(function (p) { far = Math.max(far, Math.hypot(p[0] - tip[0], p[1] - tip[1])); });
            thr = Math.max(2, far * 0.12);                     // 날개가 몸통에서 벌어진 정도 (화살촉 크기에 비례)
            part.forEach(function (p) {
                var bx = p[0] - tip[0], by = p[1] - tip[1], back = -(bx * ux + by * uy), sd = -bx * uy + by * ux;
                if (back < -Math.max(5, far * 0.35)) bad = 1;
                if (sd > thr) L = 1; if (sd < -thr) Rt = 1;
            });
            if (L && Rt && !bad && far > 6 && far < chord * 0.7) return 1;
            return pathLen(part) < Math.max(10, chord * 0.12) ? 0 : -1;
        }
        var m = path.length, hb = head(R.slice(i1), B, path[m - 2]), ha = head(R.slice(0, i0 + 1).reverse(), A, path[1]);
        if (ha < 0 || hb < 0) return null;
        var kind = ha || hb ? (curved ? "carrow" : ha && hb ? "arrow2" : "arrow") : (curved ? "curve" : "line");
        return { kind: kind, path: path, ha: ha > 0, hb: hb > 0, w: w, p: avgP, pts: openPts(path, ha > 0, hb > 0, avgP, w) };
    }

    function recognize(pts, w) {
        var n = pts.length / 3, P2 = [], avgP = 0, k;
        for (k = 0; k < n; k++) { P2.push([pts[3 * k], pts[3 * k + 1]]); avgP += pts[3 * k + 2]; }
        avgP = f2(avgP / n);
        var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, len = 0;
        P2.forEach(function (p, i) { x1 = Math.min(x1, p[0]); y1 = Math.min(y1, p[1]); x2 = Math.max(x2, p[0]); y2 = Math.max(y2, p[1]); if (i) len += Math.hypot(p[0] - P2[i - 1][0], p[1] - P2[i - 1][1]); });
        var diag = Math.hypot(x2 - x1, y2 - y1) || 1, s = P2[0], e = P2[n - 1];
        if (diag < 14) return null;
        var closed = Math.hypot(e[0] - s[0], e[1] - s[1]) < Math.max(22, diag * 0.24) && len > diag * 1.7;
        if (!closed) return openShape(P2, avgP, w || 1.8, diag);

        // ---- 닫힌 모양 ----
        var R = resample(P2, 128), bw = x2 - x1, bh = y2 - y1, bx = (x1 + x2) / 2, by = (y1 + y2) / 2, cut = R.length - 1, bd = Infinity;
        for (k = Math.floor(R.length * 0.85); k < R.length; k++) { var d0 = Math.hypot(R[k][0] - R[0][0], R[k][1] - R[0][1]); if (d0 < bd) { bd = d0; cut = k; } }
        R = resample(R.slice(0, cut + 1).concat([R[0]]), 128);  // 끝이 시작점을 지나쳐 겹쳤으면 시작점까지만
        var cx = 0, cy = 0; R.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= R.length; cy /= R.length;
        var sxx = 0, syy = 0, sxy = 0; R.forEach(function (p) { var a = p[0] - cx, b = p[1] - cy; sxx += a * a; syy += b * b; sxy += a * b; });
        var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), cs = Math.cos(th), sn = Math.sin(th);
        var umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
        R.forEach(function (p) { var a = p[0] - cx, b = p[1] - cy, u = a * cs + b * sn, v = -a * sn + b * cs; umin = Math.min(umin, u); umax = Math.max(umax, u); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); });
        var ea = (umax - umin) / 2, eb = (vmax - vmin) / 2, ecx = cx + ((umin + umax) / 2) * cs - ((vmin + vmax) / 2) * sn, ecy = cy + ((umin + umax) / 2) * sn + ((vmin + vmax) / 2) * cs;
        var size = Math.max(ea, eb) * 2 || 1;
        function ellipsePts(x, y, a, b, t, from, to, m) { var v = []; m = m || 96; from = from || 0; to = to == null ? 2 * Math.PI * (m - 1) / m : to; for (var i = 0; i < m; i++) { var an = from + (to - from) * i / (m - 1), ca = Math.cos(an) * a, sa = Math.sin(an) * b; v.push([x + ca * Math.cos(t) - sa * Math.sin(t), y + ca * Math.sin(t) + sa * Math.cos(t)]); } return v; }
        var cand = [];
        // 원 · 타원
        var thS = snapAng(th, 9), ell = ellipsePts(ecx, ecy, ea, eb, thS), eErr = fitErr(R, ell, true, size);
        if (eb / ea > 0.8) { var rr = 0; R.forEach(function (p) { rr += Math.hypot(p[0] - cx, p[1] - cy); }); rr /= R.length; cand.push({ kind: "circle", err: eErr, verts: ellipsePts(cx, cy, rr, rr, 0), c: [cx, cy], smooth: 1 }); }
        else cand.push({ kind: "ellipse", err: eErr, verts: ell, c: [ecx, ecy], smooth: 1 });
        // 꼭짓점 (가장 먼 점에서 시작해 더글러스-포이커)
        var st0 = 0, md = 0; R.forEach(function (p, i) { var d = Math.hypot(p[0] - cx, p[1] - cy); if (d > md) { md = d; st0 = i; } });
        var loop = R.slice(st0, R.length - 1).concat(R.slice(0, st0 + 1));
        function corners(eps, flatMax) {
            var c = rdp(loop, eps);
            if (c.length > 1 && Math.hypot(c[0][0] - c[c.length - 1][0], c[0][1] - c[c.length - 1][1]) < size * 0.1) c.pop();
            for (var it = 0; it < 8 && c.length > 3; it++) {   // 거의 일직선인 꼭짓점 빼기 — 시작 · 끝 이음매에 생기는 가짜 꼭짓점
                var flat = -1; for (var q = 0; q < c.length; q++) if (angAt(c[(q + c.length - 1) % c.length], c[q], c[(q + 1) % c.length]) > flatMax) { flat = q; break; }
                if (flat < 0) break; c.splice(flat, 1);
            }
            return c;
        }
        function concave(c) {                                  // 안으로 꺾인 꼭짓점 (하트 위 · 말풍선 꼬리 · 블록 화살표 목 · 별 · 구름)
            var o = 0, m = c.length, q;
            for (q = 0; q < m; q++) o += c[q][0] * c[(q + 1) % m][1] - c[(q + 1) % m][0] * c[q][1];
            return c.map(function (p, i) { var a = c[(i + m - 1) % m], b = c[(i + 1) % m]; return ((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0])) * o < 0 && angAt(a, p, b) < 160; });
        }
        var cor = corners(Math.max(5, size * 0.075), 160), nc = cor.length, conc = concave(cor), ncc = conc.filter(Boolean).length;
        if (nc === 3) {
            var angs = [angAt(cor[2], cor[0], cor[1]), angAt(cor[0], cor[1], cor[2]), angAt(cor[1], cor[2], cor[0])];
            var tri = cor, tErr = fitErr(R, cor, true, size);
            if (angs.every(function (a) { return Math.abs(a - 60) < 13; })) {            // 정삼각형
                var side = 0; for (k = 0; k < 3; k++) side += Math.hypot(cor[k][0] - cor[(k + 1) % 3][0], cor[k][1] - cor[(k + 1) % 3][1]); side /= 3;
                var gx = (cor[0][0] + cor[1][0] + cor[2][0]) / 3, gy = (cor[0][1] + cor[1][1] + cor[2][1]) / 3, best = 0, bh0 = Infinity;
                for (k = 0; k < 3; k++) { var a1 = cor[(k + 1) % 3], a2 = cor[(k + 2) % 3], sl = Math.abs(Math.sin(Math.atan2(a2[1] - a1[1], a2[0] - a1[0]))); if (sl < bh0) { bh0 = sl; best = k; } }
                var apx = Math.atan2(cor[best][1] - gy, cor[best][0] - gx);
                apx = Math.abs(Math.sin(apx + Math.PI / 2)) < 0.14 ? (Math.cos(apx + Math.PI / 2) > 0 ? -Math.PI / 2 : Math.PI / 2) : apx;
                tri = regular(gx, gy, 3, side / Math.sqrt(3), apx);
            }
            cand.push({ kind: "triangle", err: tErr, verts: tri, c: [cx, cy] });
        }
        if (nc === 4) {
            var qa = [0, 1, 2, 3].map(function (i) { return angAt(cor[(i + 3) % 4], cor[i], cor[(i + 1) % 4]); }), qErr = fitErr(R, cor, true, size), quad = cor;
            if (qa.every(function (a) { return Math.abs(a - 90) < 16; })) {               // 직사각형 · 정사각형
                var w0 = (Math.hypot(cor[1][0] - cor[0][0], cor[1][1] - cor[0][1]) + Math.hypot(cor[3][0] - cor[2][0], cor[3][1] - cor[2][1])) / 2;
                var h0 = (Math.hypot(cor[2][0] - cor[1][0], cor[2][1] - cor[1][1]) + Math.hypot(cor[0][0] - cor[3][0], cor[0][1] - cor[3][1])) / 2;
                var ang = snapAng(Math.atan2(cor[1][1] - cor[0][1], cor[1][0] - cor[0][0]), 9);
                var qx = (cor[0][0] + cor[1][0] + cor[2][0] + cor[3][0]) / 4, qy = (cor[0][1] + cor[1][1] + cor[2][1] + cor[3][1]) / 4;
                if (Math.max(w0, h0) / Math.min(w0, h0) < 1.35) w0 = h0 = Math.sqrt(w0 * h0);
                var Fq = frame([qx, qy], ang);
                quad = [Fq(-w0 / 2, -h0 / 2), Fq(w0 / 2, -h0 / 2), Fq(w0 / 2, h0 / 2), Fq(-w0 / 2, h0 / 2)];
            }
            cand.push({ kind: "rect", err: qErr, verts: quad, c: [cx, cy] });
        }
        // 별: 한 획 별(꼭짓점 5개가 서로 교차) · 또는 안팎 번갈아 10개
        var isStar = false;
        if (nc === 5) { for (k = 0; k < 5 && !isStar; k++) for (var j = k + 2; j < 5; j++) { if ((j + 1) % 5 === k) continue; if (segX(cor[k], cor[(k + 1) % 5], cor[j], cor[(j + 1) % 5])) { isStar = true; break; } } }
        if (nc === 10) { var dd = cor.map(function (p) { return Math.hypot(p[0] - cx, p[1] - cy); }), ev = 0, od = 0; for (k = 0; k < 10; k++) (k % 2 ? od += dd[k] : ev += dd[k]); isStar = Math.min(ev, od) / Math.max(ev, od) < 0.62; }
        if (isStar) {
            var outer = cor.slice(); if (nc === 10) { var dd2 = cor.map(function (p) { return Math.hypot(p[0] - cx, p[1] - cy); }); outer = cor.filter(function (p, i) { return dd2[i] >= dd2[i % 2 ? i - 1 : i + 1]; }); }
            var Ro = 0; outer.forEach(function (p) { Ro += Math.hypot(p[0] - cx, p[1] - cy); }); Ro = Ro / outer.length * 0.96;
            var top = outer.reduce(function (a, b) { return b[1] < a[1] ? b : a; }), rot = Math.atan2(top[1] - cy, top[0] - cx);
            if (Math.abs(rot + Math.PI / 2) < 0.2) rot = -Math.PI / 2;
            var sv = regular(cx, cy + Ro * 0.05, 5, Ro, rot, 0.382);
            cand.push({ kind: "star", err: Math.min(0.03, fitErr(R, sv, true, size)), verts: sv, c: [cx, cy] });
        }
        // 오각형 · 육각형: 꼭짓점이 또렷하고 안으로 꺾인 곳이 없을 때 — 각이 고르면 정다각형
        //   미리보기: 반지름 = (가로 + 세로) ÷ 4 · 가운데 = 그린 범위 가운데 · 꼭짓점이 위쪽이면 반듯하게 세움
        if (nc >= 5 && nc <= 6 && !isStar && !ncc) {
            var sharpN = 0, regOK = true, want = nc === 5 ? 108 : 120;
            for (k = 0; k < nc; k++) { var ak = angAt(cor[(k + nc - 1) % nc], cor[k], cor[(k + 1) % nc]); if (ak < 150) sharpN++; if (Math.abs(ak - want) > 24) regOK = false; }
            if (sharpN === nc) {
                var pv = cor, pErr = fitErr(R, cor, true, size) * 1.6;
                if (regOK) {
                    var Rp = (bw + bh) / 4, up = -Math.PI / 2, pr;
                    var near = cor.map(function (p) { var a = Math.atan2(p[1] - by, p[0] - bx) - up; a = ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a; });
                    var off = near.reduce(function (a, b) { return Math.abs(b) < Math.abs(a) ? b : a; });
                    var shift = 0;
                    if (Math.abs(off) < 14 * Math.PI / 180) { pr = up; shift = nc === 5 ? -0.058 * Rp : 0; }                     // 꼭짓점 위
                    else if (nc === 5 && Math.abs(Math.abs(off) - Math.PI / 5) < 14 * Math.PI / 180) { pr = -up; shift = 0.058 * Rp; } // 위가 평평 (꼭짓점 아래)
                    else if (nc === 6 && Math.abs(Math.abs(off) - Math.PI / 6) < 14 * Math.PI / 180) pr = 0;                        // 육각형 위가 평평
                    else pr = up + off;
                    pv = regular(bx, by + shift, nc, Rp, pr);
                    pErr = Math.min(pErr, fitErr(R, pv, true, size) * 1.3);
                }
                cand.push({ kind: "poly", err: pErr, verts: pv, c: [bx, by] });
            }
        }
        // 블록 화살표 (꼭짓점 7 · 오목 2): 미리보기 틀 — 머리 폭 = 몸통 폭 × 2 · 머리 옆선 45° · 길이 × 0.95
        if (nc === 7 && ncc === 2) {
            var ci = []; conc.forEach(function (f, i) { if (f) ci.push(i); });
            var c1 = ci[0], c2 = ci[1];
            if ((c2 - c1 + 7) % 7 === 3) { var tmp = c1; c1 = c2; c2 = tmp; }
            if ((c2 - c1 + 7) % 7 === 4) {
                var V = function (i) { return cor[(i + 7) % 7]; };
                var tip = V(c1 + 2), t1 = V(c2 + 1), t2 = V(c2 + 2), tm = [(t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2];
                var La = Math.hypot(tip[0] - tm[0], tip[1] - tm[1]), tha = snapAng(Math.atan2(tip[1] - tm[1], tip[0] - tm[0]), 9);
                var vOf = function (p) { return Math.abs(-(p[0] - tm[0]) * Math.sin(tha) + (p[1] - tm[1]) * Math.cos(tha)); };
                var sh = (vOf(t1) + vOf(t2) + vOf(V(c1)) + vOf(V(c2))) / 4, wing = (vOf(V(c1 + 1)) + vOf(V(c1 + 3))) / 2;
                if (La > 20 && wing > sh * 1.3) {
                    var L2 = La * 0.95, H = Math.min(sh * 2, L2 * 0.6), u0 = (La - L2) / 2, u1 = u0 + L2, ub = u1 - H, Fa = frame(tm, tha);
                    var bv = [Fa(u0, -sh), Fa(ub, -sh), Fa(ub, -H), Fa(u1, 0), Fa(ub, H), Fa(ub, sh), Fa(u0, sh)];
                    cand.push({ kind: "block", err: Math.min(0.03, fitErr(R, bv, true, size)), verts: bv, c: Fa(La / 2, 0) });
                }
            }
        }
        // 말풍선: 뾰족한 꼬리(양옆이 다 안으로 꺾임) + 나머지 = 타원
        //   미리보기: 타원 = 꼬리를 뺀 범위 (세로 × 1.045) · 꼬리 끝 = 그린 끝 · 꼬리 뿌리 = 꼬리 방향 ± 13° (타원 각)
        if (ncc >= 1 && ncc <= 3 && nc >= 5) {
            for (k = 0; k < nc; k++) {
                var kp = (k + nc - 1) % nc, kn = (k + 1) % nc;
                if (conc[k] || !(conc[kp] || conc[kn]) || angAt(cor[kp], cor[k], cor[kn]) > 80) continue;
                var ia = loop.indexOf(cor[kp]), ib = loop.indexOf(cor[kn]);
                if (ia < 0 || ib < 0) continue;
                var body = loop.filter(function (p, i) { return ia <= ib ? i < ia || i > ib : i < ia && i > ib; });
                if (body.length < loop.length * 0.6) continue;
                var bx1 = Infinity, by1 = Infinity, bx2 = -Infinity, by2 = -Infinity;
                body.forEach(function (p) { bx1 = Math.min(bx1, p[0]); by1 = Math.min(by1, p[1]); bx2 = Math.max(bx2, p[0]); by2 = Math.max(by2, p[1]); });
                var ba = (bx2 - bx1) / 2 * 1.01, bb = (by2 - by1) / 2 * 1.045, bcx = (bx1 + bx2) / 2, bcy = (by1 + by2) / 2, T = cor[k];
                var tu = (T[0] - bcx) / ba, tv = (T[1] - bcy) / bb;
                if (Math.hypot(tu, tv) < 1.3) continue;
                var phi = Math.atan2(tv, tu), sp13 = 13 * Math.PI / 180;
                var bub = ellipsePts(bcx, bcy, ba, bb, 0, phi + sp13, phi - sp13 + 2 * Math.PI, 90).concat([T]);
                var fe = fitErr(R, bub, true, size);
                if (fe < 0.12) cand.push({ kind: "bubble", err: Math.min(0.03, fe), verts: bub, c: [bcx, bcy] });
                break;
            }
        }
        // 구름: 획을 따라 안으로 꺾이는 곳(볼록한 혹 사이)이 4곳 넘게 · 얕게 (별 · 꽃은 깊음) — 미리보기 틀 · 가로 × 0.98 · 세로 × 0.9
        var polyOK = cand.some(function (c) { return /^(triangle|rect|poly)$/.test(c.kind) && c.err < 0.02; });
        if (!isStar && !polyOK) {                              // 반듯한 삼각형 · 사각형 · 다각형이면 손떨림을 혹으로 세지 않게
            var L0 = R.length - 1, ori = 0, runs = 0, inRun = false, peak = 0, rIn = 0, rAll = 0, first = -1;
            for (k = 0; k < L0; k++) ori += R[k][0] * R[(k + 1) % L0][1] - R[(k + 1) % L0][0] * R[k][1];
            R.slice(0, L0).forEach(function (p) { rAll += Math.hypot(p[0] - cx, p[1] - cy); }); rAll /= L0;
            var turnAt = function (i) {
                var a = R[(i - 3 + L0) % L0], b = R[i % L0], c = R[(i + 3) % L0], t = Math.atan2((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]), (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]));
                return ori > 0 ? t : -t;                       // + = 바깥으로 도는 쪽 · - = 안으로 꺾임
            };
            for (k = 0; k < L0; k++) if (turnAt(k) > -0.2) { first = k; break; }
            if (first >= 0) for (var i2 = 0; i2 <= L0; i2++) {
                var ii = (first + i2) % L0, tt = turnAt(ii);
                if (tt < -0.35) { if (!inRun) { inRun = true; peak = ii; } else if (tt < turnAt(peak)) peak = ii; }
                else if (tt > -0.2 && inRun) { inRun = false; if (turnAt(peak) < -0.45) { runs++; rIn += Math.hypot(R[peak][0] - cx, R[peak][1] - cy); } }
            }
            if (runs >= 4 && rIn / runs > rAll * 0.75) {
                var cl = tplPts(CLOUD_T, bx, by, bw * 0.98, bh * 0.9, 0);
                cand.push({ kind: "cloud", err: runs >= 5 ? 0.008 : Math.min(0.02, fitErr(R, cl, true, size)), verts: cl, c: [bx, by], smooth: 1 });
            }
        }
        // 하트: 미리보기 틀 · 가로 = 세로 = 그린 가로 · 세로 평균 (위 가운데 오목이 없으면 감점)
        var hw = (bw + bh) / 2, hv = tplPts(HEART_T, bx, by, hw, hw, 0.5), hErr = fitErr(R, tplPts(HEART_T, bx, by, bw, bh, 0.5), true, size);
        cand.push({ kind: "heart", err: hErr * (ncc ? 0.95 : 1.5), verts: hv, c: [bx, by], smooth: 1 });

        cand.sort(function (a, b) { return a.err - b.err; });
        if (window.__inkDebug) window.__inkDebug.push(cand.map(function (c) { return c.kind + ":" + c.err.toFixed(3); }).join(" ") + " nc=" + nc + " ncc=" + ncc);
        var b0 = cand[0];
        if (!b0 || b0.err > 0.06) return null;
        var vv = b0.verts.concat([b0.verts[0]]);
        return { kind: b0.kind, verts: b0.verts, c: b0.c, smooth: b0.smooth, p: avgP, pts: densify(vv, avgP, !b0.smooth) };
    }
    function circleFit(R) {                                    // 최소제곱 원 (Kåsa)
        var n = R.length, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
        R.forEach(function (p) { var x = p[0], y = p[1], z = x * x + y * y; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sxz += x * z; syz += y * z; sz += z; });
        var A = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]], B = [sxz, syz, sz];
        function det(m) { return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); }
        var D = det(A); if (Math.abs(D) < 1e-9) return null;
        function rep(col) { return A.map(function (row, i) { return row.map(function (v, j) { return j === col ? B[i] : v; }); }); }
        var a = det(rep(0)) / D, b = det(rep(1)) / D, c = det(rep(2)) / D, x = a / 2, y = b / 2, r2 = c + x * x + y * y;
        return r2 > 0 ? { x: x, y: y, r: Math.sqrt(r2) } : null;
    }
    function rdp(pts, eps) {
        if (pts.length < 3) return pts.slice();
        var a = pts[0], b = pts[pts.length - 1], idx = 0, dmax = 0;
        for (var i = 1; i < pts.length - 1; i++) { var d = Math.sqrt(segDist2(pts[i][0], pts[i][1], a[0], a[1], b[0], b[1])); if (d > dmax) { dmax = d; idx = i; } }
        if (dmax <= eps) return [a, b];
        var l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps);
        return l.slice(0, -1).concat(r);
    }
    function endStroke() {
        clearTimeout(holdT);
        if (rafId) { (window.cancelAnimationFrame || clearTimeout)(rafId); rafId = 0; }
        var c = cur, st = c.st;
        cur = null;
        snapshot();
        strokes.push(st);
        setD(c.el, shapeOf(st, c.ax, c.ay));
        layerOf(st).appendChild(c.el);
        rendered.push({ el: c.el, bb: bboxOf(st, c.ax, c.ay), ox: c.ax, oy: c.ay });
        savePage(); syncUI();
    }

    /* ---------- 지우개 (넣은 것 · 텍스트는 지우지 않음 — 아이패드와 같음) ---------- */
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
            if (isObj(st) || !R || !R.bb || x < R.bb.x1 - r || x > R.bb.x2 + r || y < R.bb.y1 - r || y > R.bb.y2 + r) { next.push(st); continue; }
            var ox = R.ox, oy = R.oy, pts = st.pts, n = pts.length / 3, hit = false, rr = r + st.w / 2;
            for (var k = 0; k < n; k++) {
                var x1 = pts[3 * k] + ox, y1 = pts[3 * k + 1] + oy;
                var x2 = k + 1 < n ? pts[3 * k + 3] + ox : x1, y2 = k + 1 < n ? pts[3 * k + 4] + oy : y1;
                if (segDist2(x, y, x1, y1, x2, y2) <= rr * rr) { hit = true; break; }
            }
            if (!hit) { next.push(st); continue; }
            changed = true;
            if (P.eraser.mode === "object") continue;          // 개체 지우개: 통째로
            splitStroke(st, x - ox, y - oy, r + st.w * 0.35).forEach(function (piece) { next.push(piece); });
        }
        if (changed) { strokes = next; drag.changed = true; sel = []; renderAll(); }
    }
    function splitStroke(st, cx, cy, r) {                      // 픽셀 지우개: 원 안의 부분만 잘라냄
        var src = st.pts, n = src.length / 3, dense = [], step = Math.max(0.8, r / 3);
        for (var k = 0; k < n; k++) {
            var x1 = src[3 * k], y1 = src[3 * k + 1], p1 = src[3 * k + 2];
            dense.push(x1, y1, p1);
            if (k + 1 < n) {
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
        sel = []; selMenu = null;
        if (poly.length >= 6) {
            strokes.forEach(function (st, i) {
                var R = rendered[i];
                if (isObj(st) || !R || !R.bb) return;
                var n = st.pts.length / 3, ins = 0;
                for (var k = 0; k < n; k++) if (inPoly(st.pts[3 * k] + R.ox, st.pts[3 * k + 1] + R.oy, poly)) ins++;
                if (ins / n >= 0.6) sel.push(st);
            });
        }
        drawSelection();
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
    function handles(o) {                                      // 넣은 것의 손잡이 (문서 좌표)
        var R = rendered[strokes.indexOf(o)];
        if (!R || !R.bb) return [];
        var b = R.bb, ox = R.ox, oy = R.oy;
        if (o.k === "shape" && /^(line|arrow)$/.test(o.sh)) return [{ id: "p1", x: o.x1 + ox, y: o.y1 + oy }, { id: "p2", x: o.x2 + ox, y: o.y2 + oy }];
        if (o.k === "shape") return [{ id: "nw", x: b.x1, y: b.y1 }, { id: "ne", x: b.x2, y: b.y1 }, { id: "sw", x: b.x1, y: b.y2 }, { id: "se", x: b.x2, y: b.y2 }];
        if (o.k === "sig") return [{ id: "se", x: b.x2, y: b.y2 }];
        if (o.k === "text") return [{ id: "w", x: b.x2, y: (b.y1 + b.y2) / 2 }];
        if (o.k === "mag") {
            var cx = o.x + ox, cy = o.y + oy;
            return [{ id: "r", x: cx + o.r, y: cy, cls: "blue" }, { id: "z", x: cx + o.r * 0.7071, y: cy - o.r * 0.7071, cls: "green" }];
        }
        return [];
    }
    /* 올가미로 고른 획 둘레 — iOS 27 PencilKit 을 시뮬레이터에서 재서 맞춤 (2026-10-25)
       · 획 중심에서 15pt 떨어져 감쌈 (획 자체는 그대로 — 흰 테두리 · 그림자 없음)
       · 32pt 로 넓혔다가 17pt 줄임(닫기) → 가까운 획 사이 틈은 메워지고 끝 사이엔 얕은 홈 (아이패드에서 잰 6.5pt 와 같음)
       · 멀리 떨어진 획: 획 끝점에서 다른 획의 가장 가까운 곳까지(260pt 안) 이어 한 덩어리 · 둘러싸인 곳은 다 채움
       · 거의 닫힌 획(U · ∩ 모양)은 안을 채움 · 획 아래 오목한 곳은 평평하게 (안 고른 획이 가까우면 그대로 따라감)
       → 회색 점선이 시계 방향으로 흐름 (CSS .ink-lasso) */
    function selOutline(list) {
        var S = [], x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, i, j, k;
        list.forEach(function (st) {
            var R = rendered[strokes.indexOf(st)], p = st.pts, v = [];
            if (!R || !p) return;
            for (var q = 0; q < p.length; q += 3) { var x = p[q] + R.ox, y = p[q + 1] + R.oy; v.push([x, y]); x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }
            if (v.length) S.push(v);
        });
        if (!S.length) return null;
        var OFF = 15, CL = 17, pad = OFF + CL + 8, cell = Math.max(2, Math.ceil(Math.max(x2 - x1, y2 - y1) / 600));
        var ox = x1 - pad, oy = y1 - pad, W = Math.ceil((x2 - x1 + 2 * pad) / cell) + 2, H = Math.ceil((y2 - y1 + 2 * pad) / cell) + 2;
        var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        var c = cv.getContext("2d");
        if (!c) return null;
        c.setTransform(1 / cell, 0, 0, 1 / cell, -ox / cell, -oy / cell);
        c.strokeStyle = c.fillStyle = "#fff"; c.lineCap = c.lineJoin = "round";
        function path(v, close) { c.beginPath(); v.forEach(function (q, n) { if (n) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); if (v.length === 1) c.lineTo(v[0][0] + 0.01, v[0][1]); if (close) c.closePath(); }
        c.lineWidth = (OFF + CL) * 2;
        S.forEach(function (v) {                               // 획 + 15pt (+ 닫기 17pt) · 거의 닫힌 획은 안까지
            path(v); c.stroke();
            var L = 0; for (var n = 1; n < v.length; n++) L += Math.hypot(v[n][0] - v[n - 1][0], v[n][1] - v[n - 1][1]);
            if (v.length > 4 && Math.hypot(v[0][0] - v[v.length - 1][0], v[0][1] - v[v.length - 1][1]) < L * 0.6) { path(v, true); c.fill(); c.stroke(); }
        });
        // 획 아래 오목한 곳: 아래쪽 볼록 껍질까지 채움 (4px 칸마다 획의 맨 아래 → 껍질)
        var others = [];
        strokes.forEach(function (st, n) {
            if (list.indexOf(st) >= 0 || isObj(st)) return;
            var R = rendered[n]; if (!R || !R.bb || R.bb.x2 < x1 - 40 || R.bb.x1 > x2 + 40 || R.bb.y2 < y1 - 40 || R.bb.y1 > y2 + 60) return;
            for (var q = 0; q < st.pts.length; q += 3) others.push([st.pts[q] + R.ox, st.pts[q + 1] + R.oy]);
        });
        S.forEach(function (v) {
            if (v.length < 3) return;
            var srt = v.slice().sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; }), hull = [];
            srt.forEach(function (p) {
                while (hull.length > 1) { var o = hull[hull.length - 2], a = hull[hull.length - 1]; if ((a[0] - o[0]) * (p[1] - o[1]) - (a[1] - o[1]) * (p[0] - o[0]) >= 0) hull.pop(); else break; }
                hull.push(p);
            });
            var hx1 = srt[0][0], hx2 = srt[srt.length - 1][0], nb = Math.max(2, Math.ceil((hx2 - hx1) / 4) + 1), env = [], hy = [], ok = [], h = 0;
            for (k = 0; k < nb; k++) env.push(-Infinity);
            v.forEach(function (p) { var b = Math.min(nb - 1, Math.round((p[0] - hx1) / 4)); env[b] = Math.max(env[b], p[1]); });
            for (k = 0; k < nb; k++) {
                var X = Math.min(hx2, hx1 + k * 4);
                while (h < hull.length - 2 && hull[h + 1][0] < X) h++;
                var A = hull[h], Bq = hull[Math.min(h + 1, hull.length - 1)], t = Bq[0] - A[0] ? (X - A[0]) / (Bq[0] - A[0]) : 0;
                hy.push(A[1] + (Bq[1] - A[1]) * Math.max(0, Math.min(1, t)));
                if (env[k] === -Infinity) env[k] = k ? env[k - 1] : hy[k];
                ok.push(true);
            }
            others.forEach(function (p) {                      // 안 고른 획이 펼 자리 아래 67pt 안에 있으면 그 근처(±28pt)는 펴지 않고 획을 따라감 (아이패드 실험 3가지와 같게)
                var b = Math.round((p[0] - hx1) / 4);
                for (var e = Math.max(0, b - 7); e <= Math.min(nb - 1, b + 7); e++) if (p[1] > env[e] - 2 && p[1] < hy[e] + OFF + 52) ok[e] = false;
            });
            for (k = 0; k < nb;) {
                if (!ok[k] || hy[k] - env[k] < 2) { k++; continue; }
                var s0 = k; while (k < nb && ok[k]) k++;
                if (k - s0 < 2) continue;
                var top = [], bot = [];
                for (var e = s0; e < k; e++) { var X2 = Math.min(hx2, hx1 + e * 4); bot.push([X2, hy[e]]); top.push([X2, env[e]]); }
                path(bot.concat(top.reverse()), true); c.fill(); c.stroke();
            }
        });
        // 떨어진 획: 끝점(처음 · 끝) → 다른 획의 가장 가까운 점 (260pt 안) 을 획처럼 굵게 이음
        S.forEach(function (v, n) {
            [v[0], v[v.length - 1]].forEach(function (e) {
                var bd = Infinity, pb = null;
                S.forEach(function (u, m) { if (m !== n) u.forEach(function (q) { var dd = (e[0] - q[0]) * (e[0] - q[0]) + (e[1] - q[1]) * (e[1] - q[1]); if (dd < bd) { bd = dd; pb = q; } }); });
                bd = Math.sqrt(bd);
                if (pb && bd > (OFF + CL) * 2 && bd < 260) { c.beginPath(); c.moveTo(e[0], e[1]); c.lineTo(pb[0], pb[1]); c.stroke(); }
            });
        });
        var img = c.getImageData(0, 0, W, H).data, M = new Uint8Array(W * H), Q = [], n2;
        for (i = 0; i < W * H; i++) M[i] = img[i * 4 + 3] > 127 ? 1 : 0;
        var D = new Float32Array(W * H), r2 = Math.SQRT2, x, y, a;   // 17pt 줄이기: 바깥까지 거리(1 · √2 두 번 훑기)
        for (i = 0; i < W * H; i++) D[i] = M[i] ? 1e9 : 0;
        for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; if (!D[i]) continue; a = D[i];
            a = Math.min(a, x ? D[i - 1] + 1 : 1, y ? D[i - W] + 1 : 1, x && y ? D[i - W - 1] + r2 : r2, y && x < W - 1 ? D[i - W + 1] + r2 : r2); D[i] = a; }
        for (y = H - 1; y >= 0; y--) for (x = W - 1; x >= 0; x--) { i = y * W + x; if (!D[i]) continue; a = D[i];
            a = Math.min(a, x < W - 1 ? D[i + 1] + 1 : 1, y < H - 1 ? D[i + W] + 1 : 1, x < W - 1 && y < H - 1 ? D[i + W + 1] + r2 : r2, y < H - 1 && x ? D[i + W - 1] + r2 : r2); D[i] = a; }
        for (i = 0; i < W * H; i++) M[i] = D[i] * cell > CL ? 1 : 0;
        for (i = 0; i < W; i++) { Q.push(i, (H - 1) * W + i); }                 // 바깥에서 물 채우기 → 닿지 않은 빈 곳 = 둘러싸인 곳
        for (i = 0; i < H; i++) { Q.push(i * W, i * W + W - 1); }
        var seen = new Uint8Array(W * H);
        while (Q.length) {
            n2 = Q.pop();
            if (seen[n2] || M[n2]) continue;
            seen[n2] = 1;
            var cx = n2 % W, cy = (n2 - cx) / W;
            if (cx > 0) Q.push(n2 - 1); if (cx < W - 1) Q.push(n2 + 1); if (cy > 0) Q.push(n2 - W); if (cy < H - 1) Q.push(n2 + W);
        }
        for (i = 0; i < W * H; i++) if (!seen[i]) M[i] = 1;
        // 덩어리마다 바깥 둘레 따라가기 — 위 · 왼쪽 첫 칸에서 시계 방향 (점선이 시계 방향으로 흐름)
        var DX = [-1, -1, 0, 1, 1, 1, 0, -1], DY = [0, -1, -1, -1, 0, 1, 1, 1], rings = [];
        var lab = new Int32Array(W * H), comp = 0;
        for (i = 0; i < W * H; i++) {
            if (!M[i] || lab[i]) continue;
            comp++; var st2 = [i]; lab[i] = comp;
            while (st2.length) {
                var m = st2.pop(), mx = m % W;
                if (mx > 0 && M[m - 1] && !lab[m - 1]) { lab[m - 1] = comp; st2.push(m - 1); }
                if (mx < W - 1 && M[m + 1] && !lab[m + 1]) { lab[m + 1] = comp; st2.push(m + 1); }
                if (m >= W && M[m - W] && !lab[m - W]) { lab[m - W] = comp; st2.push(m - W); }
                if (m + W < W * H && M[m + W] && !lab[m + W]) { lab[m + W] = comp; st2.push(m + W); }
            }
            var ring = [], sx = i % W, sy = (i - sx) / W, d = 0, guard = 0;
            x = sx; y = sy;
            do {
                ring.push([x, y]);
                for (k = 0; k < 8; k++) { var nd = (d + k) % 8, nx = x + DX[nd], ny = y + DY[nd]; if (nx >= 0 && ny >= 0 && nx < W && ny < H && lab[ny * W + nx] === comp) { x = nx; y = ny; d = (nd + 6) % 8; break; } }
                if (k === 8) break;
            } while ((x !== sx || y !== sy) && ++guard < W * H);
            if (ring.length < 4) continue;
            var R2 = rdp(ring.concat([ring[0]]), 0.75); R2.pop();
            for (k = 0; k < 2; k++) {                          // 계단 지우기 (Chaikin)
                var sm = [];
                R2.forEach(function (p, n) { var q = R2[(n + 1) % R2.length]; sm.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); });
                R2 = sm;
            }
            rings.push(R2.map(function (p) { return [ox + (p[0] + 0.5) * cell, oy + (p[1] + 0.5) * cell]; }));
        }
        return rings.length ? rings : null;
    }
    function drawSelection() {
        if (!gSel) return;
        while (gSel.firstChild) gSel.removeChild(gSel.firstChild);
        sel = sel.filter(function (s) { return strokes.indexOf(s) >= 0; });
        if (osel && strokes.indexOf(osel) < 0) osel = null;
        while (gHalo.firstChild) gHalo.removeChild(gHalo.firstChild);
        selPoly = null;
        if (sel.length) {                                      // 고른 획은 그대로 두고 둘레에 회색 점선 (iOS 27 PencilKit)
            var rings = selOutline(sel);
            if (rings) {
                var d = "";
                selPoly = rings.map(function (ring) {
                    var flat = [];
                    ring.forEach(function (q, i) { d += (i ? "L" : "M") + f1(q[0]) + " " + f1(q[1]); flat.push(q[0], q[1]); });
                    d += "Z";
                    return flat;
                });
                var pe = document.createElementNS(NS, "path");
                pe.setAttribute("d", d); pe.setAttribute("class", "ink-lasso ink-selline");
                gSel.appendChild(pe);
            }
        }
        if (osel) {
            var R = rendered[strokes.indexOf(osel)];
            if (R && R.bb && osel.k !== "text" && osel.k !== "mag" && !(osel.k === "shape" && /^(line|arrow)$/.test(osel.sh))) {
                var fr = document.createElementNS(NS, "rect");
                fr.setAttribute("x", f1(R.bb.x1)); fr.setAttribute("y", f1(R.bb.y1));
                fr.setAttribute("width", f1(R.bb.x2 - R.bb.x1)); fr.setAttribute("height", f1(R.bb.y2 - R.bb.y1));
                fr.setAttribute("class", "ink-objframe");
                gSel.appendChild(fr);
            }
            handles(osel).forEach(function (h) {
                var c = document.createElementNS(NS, "circle");
                c.setAttribute("cx", f1(h.x)); c.setAttribute("cy", f1(h.y)); c.setAttribute("r", 7);
                c.setAttribute("class", "ink-handle" + (h.cls ? " " + h.cls : ""));
                gSel.appendChild(c);
            });
        }
        showSelBar();
    }

    /* ---------- 넣은 것 옮기기 · 크기 ---------- */
    function startObjDrag(kind, x, y, h) {
        closePop();
        drag = { kind: kind === "move" ? "omove" : "handle", sx: x, sy: y, h: h, orig: osel, snap: strokes.slice(), moved: false };
        root.classList.add("ink-drawing");
    }
    function objDragMove(x, y) {
        var d = drag, o = d.orig, i = strokes.indexOf(osel);
        if (i < 0) return;
        var dx = x - d.sx, dy = y - d.sy;
        if (Math.abs(dx) + Math.abs(dy) > 1) d.moved = true;
        if (!d.moved) return;
        var n;
        if (d.kind === "omove") n = shifted(o, dx, dy);
        else n = resized(o, d.h, dx, dy);
        strokes[i] = n; osel = n;
        renderAll();
    }
    function resized(o, h, dx, dy) {
        var n = Object.assign({}, o);
        if (o.k === "shape") {
            if (h.id === "p1") { n.x1 = f1(o.x1 + dx); n.y1 = f1(o.y1 + dy); return n; }
            if (h.id === "p2") { n.x2 = f1(o.x2 + dx); n.y2 = f1(o.y2 + dy); return n; }
            var L = Math.min(o.x1, o.x2), T = Math.min(o.y1, o.y2), Rr = Math.max(o.x1, o.x2), Bt = Math.max(o.y1, o.y2);
            if (/w/.test(h.id)) L += dx; else Rr += dx;
            if (/n/.test(h.id)) T += dy; else Bt += dy;
            if (Rr - L < 12) { if (/w/.test(h.id)) L = Rr - 12; else Rr = L + 12; }
            if (Bt - T < 12) { if (/n/.test(h.id)) T = Bt - 12; else Bt = T + 12; }
            n.x1 = f1(L); n.y1 = f1(T); n.x2 = f1(Rr); n.y2 = f1(Bt);
            return n;
        }
        if (o.k === "sig") { var s = Math.max(0.2, (o.w + dx) / o.w); n.w = f1(o.w * s); n.h = f1(o.h * s); return n; }
        if (o.k === "text") { n.w = f1(Math.max(60, o.w + dx)); return n; }
        if (o.k === "mag") {
            if (h.id === "r") n.r = f1(Math.max(36, Math.min(220, o.r + dx)));
            else n.z = f2(Math.max(1.2, Math.min(5, o.z + (dx - dy) / 120)));
            return n;
        }
        return n;
    }
    function objDragEnd(d) {
        root.classList.remove("ink-drawing");
        if (d.moved) { undoS.push(d.snap); if (undoS.length > 120) undoS.shift(); redoS = []; commit(); }
        else if (d.dbl && osel && osel.k === "text") startEdit(osel);
        else drawSelection();
    }

    /* ---------- 선택 메뉴 (아이패드: 고른 것 위에 뜨는 말풍선 메뉴) ---------- */
    function showSelBar() {
        if (!selBar) return;
        selBar.innerHTML = "";
        var items = [];
        if (sel.length) {
            if (!selMenu) { selBar.style.display = "none"; return; }   // 아이패드처럼 고른 곳을 톡 눌러야 뜸
            items = [["오려두기", selCut], ["복사하기", selCopy], ["삭제", selDelete], ["복제", selDuplicate], ["색 바꾸기", selRecolor]];   // iOS 27 PencilKit 편집 메뉴 문구 · 순서 (+ 사이트: 색 바꾸기)
        } else if (osel) {
            var k = osel.k;
            if (k === "text") items = [["편집", function () { startEdit(osel); }], ["가 −", function () { objSet({ fs: Math.max(10, osel.fs - 2) }); }], ["가 +", function () { objSet({ fs: Math.min(72, osel.fs + 2) }); }],
                ["정렬", function () { objSet({ al: { left: "center", center: "right", right: "left" }[osel.al || "left"] }); }]];
            else if (k === "shape") items = [["굵게", function () { objSet({ w: Math.min(16, osel.w + 1.5) }); }], ["가늘게", function () { objSet({ w: Math.max(1, osel.w - 1.5) }); }]].concat(
                /^(line|arrow)$/.test(osel.sh) ? [] : [[osel.fill ? "채우기 끄기" : "채우기", function () { objSet({ fill: !osel.fill }); }]]);
            else if (k === "mag") items = [["확대 −", function () { objSet({ z: Math.max(1.2, f2(osel.z - 0.4)) }); }], ["확대 +", function () { objSet({ z: Math.min(5, f2(osel.z + 0.4)) }); }]];
            if (k !== "mag") items.push(["색 바꾸기", function () { objSet({ c: P[P.lastDraw].c }); }]);
            items.push(["복사", objCopy], ["복제", objDuplicate], ["삭제", objDelete]);
        }
        if (!items.length) { selBar.style.display = "none"; return; }
        items.forEach(function (it, i) {
            if (i) selBar.appendChild(el("span", "ink-sbsep"));
            selBar.appendChild(button("", it[0], it[0], function () { selMenu = null; it[1](); showSelBar(); }));
        });
        selBar.style.display = "flex";
        placeSelBar();
    }
    function placeSelBar() {
        if (!selBar || selBar.style.display === "none") return;
        var b = sel.length ? selBox() : osel ? (rendered[strokes.indexOf(osel)] || {}).bb : null;
        if (!b) { selBar.style.display = "none"; return; }
        var dx = drag && drag.kind === "move" ? drag.dx : 0, dy = drag && drag.kind === "move" ? drag.dy : 0;
        var w = selBar.offsetWidth, h = selBar.offsetHeight;
        var left = (b.x1 + b.x2) / 2 + dx - scrollX - w / 2, top = b.y1 + dy - scrollY - h - 18;
        if (sel.length && selMenu) top = selMenu.y - scrollY - h - 10;   // 톡 누른 곳 바로 위 · 가로는 고른 것 가운데
        if (top < 8) top = (sel.length && selMenu ? selMenu.y + 24 : b.y2 + 18) + dy - scrollY;
        selBar.style.left = Math.max(8, Math.min(innerWidth - w - 8, left)) + "px";
        selBar.style.top = Math.max(8, Math.min(innerHeight - h - 8, top)) + "px";
    }
    function objSet(chg) {
        var i = strokes.indexOf(osel);
        if (i < 0) return;
        snapshot();
        var n = Object.assign({}, osel, chg);
        strokes[i] = n; osel = n;
        commit();
    }
    function objDelete() { var i = strokes.indexOf(osel); if (i < 0) return; snapshot(); strokes.splice(i, 1); osel = null; commit(); }
    function objDuplicate() { if (!osel) return; snapshot(); var n = shifted(osel, 22, 22); strokes.push(n); osel = n; commit(); }
    function objCopy() { if (!osel) return; clip = [osel]; toast("복사했어요 — + 에서 붙여넣기"); }
    function selDelete() { if (!sel.length) return; snapshot(); strokes = strokes.filter(function (s) { return sel.indexOf(s) < 0; }); sel = []; commit(); }
    function selCopy() { clip = sel.slice(); toast("복사했어요 — + 에서 붙여넣기"); }
    function selCut() { clip = sel.slice(); selDelete(); toast("잘라냈어요 — + 에서 붙여넣기"); }
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
    function doPaste() {                                       // 화면 가운데 근처에 붙여넣기 (원래 자리에서 옮겨서)
        if (!clip.length) return;
        var bx = Infinity, by = Infinity;
        clip.forEach(function (s) {
            var o = originOf(s) || { x: s.fx, y: s.fy }, b = isObj(s) ? objBox(s, o.x, o.y) : bboxOf(s, o.x, o.y);
            if (b) { bx = Math.min(bx, b.x1); by = Math.min(by, b.y1); }
        });
        var tx = scrollX + innerWidth / 2 - 80, ty = scrollY + innerHeight / 3;
        var dx = isFinite(bx) ? tx - bx : 20, dy = isFinite(by) ? ty - by : 20;
        snapshot();
        var copies = clip.map(function (s) { return shifted(s, dx, dy); });
        strokes = strokes.concat(copies);
        sel = copies.filter(function (s) { return !isObj(s); });
        osel = sel.length ? null : copies[copies.length - 1];
        if (sel.length) P.tool = "lasso";
        commit();
    }

    /* ---------- + 메뉴: 텍스트 · 서명 · 도형 · 돋보기 ---------- */
    function viewCenter() { return { x: scrollX + innerWidth / 2, y: scrollY + innerHeight * 0.42 }; }
    function addObj(o) { snapshot(); strokes.push(o); osel = o; sel = []; closePop(); commit(); }
    function addText() {
        var c = viewCenter(), an = anchored(c.x, c.y), col = P[P.lastDraw].c;
        var o = { k: "text", a: an.a, fx: an.fx, fy: an.fy, x: f1(c.x - 110 - an.ax), y: f1(c.y - 14 - an.ay), w: 220, fs: 18, c: col, al: "left", txt: "텍스트" };
        addObj(o);
        setTimeout(function () { startEdit(o); }, 30);
    }
    function addShape(sh) {
        var c = viewCenter(), an = anchored(c.x, c.y), col = P[P.lastDraw].c, ln = /^(line|arrow)$/.test(sh);
        var w = ln ? 160 : sh === "star" ? 120 : 160, h = ln ? 0 : sh === "star" ? 116 : 110;
        addObj({ k: "shape", sh: sh, a: an.a, fx: an.fx, fy: an.fy, x1: f1(c.x - w / 2 - an.ax), y1: f1(c.y - h / 2 - an.ay), x2: f1(c.x + w / 2 - an.ax), y2: f1(c.y + h / 2 - an.ay), c: col, w: 3, fill: false });
    }
    function addMag() {
        var c = viewCenter(), an = anchored(c.x, c.y);
        addObj({ k: "mag", a: an.a, fx: an.fx, fy: an.fy, x: f1(c.x - an.ax), y: f1(c.y - an.ay), r: 80, z: 2 });
    }
    function addSig(sig) {
        var c = viewCenter(), an = anchored(c.x, c.y), w = 220, h = f1(220 * sig.ar);
        addObj({ k: "sig", a: an.a, fx: an.fx, fy: an.fy, x: f1(c.x - w / 2 - an.ax), y: f1(c.y - h / 2 - an.ay), w: w, h: h, c: /^#f(fcc00|ed030)$/.test(P[P.lastDraw].c) ? "auto" : P[P.lastDraw].c, lw: 2.2, sg: sig.sg });
    }

    /* ---------- 서명 그리기 창 ---------- */
    function openSigPad() {
        closePop();
        var bg = el("div", "ink-modal-bg ink-ui"), box = el("div", "ink-sigbox");
        box.innerHTML = '<div class="ink-sighead"><button type="button" class="ink-sigbtn" data-a="cancel">취소</button><b>서명</b><button type="button" class="ink-sigbtn strong" data-a="done">완료</button></div>';
        var pad = document.createElementNS(NS, "svg");
        pad.setAttribute("class", "ink-sigpad");
        var line = el("div", "ink-sigline", "여기에 서명하세요");
        var wrap = el("div", "ink-sigwrap");
        wrap.appendChild(pad); wrap.appendChild(line);
        box.appendChild(wrap);
        var foot = el("div", "ink-sigfoot");
        foot.appendChild(button("ink-sigbtn", "지우기", "지우기", function () { lines = []; draw(); }));
        box.appendChild(foot);
        bg.appendChild(box);
        document.body.appendChild(bg);
        var lines = [], curL = null;
        function local(e) { var r = pad.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
        function draw() {
            pad.innerHTML = "";
            lines.concat(curL ? [curL] : []).forEach(function (pts) {
                var q = document.createElementNS(NS, "path");
                q.setAttribute("d", shapeOf({ t: "pen", w: 3, pts: pts, sim: 0 }, 0, 0));
                q.setAttribute("fill", colorOf("auto"));
                pad.appendChild(q);
            });
            line.style.opacity = lines.length || curL ? 0 : 1;
        }
        pad.addEventListener("pointerdown", function (e) { e.preventDefault(); cap(pad, e); var p = local(e); curL = [p[0], p[1], e.pointerType === "pen" ? e.pressure || 0.5 : 0.5]; draw(); });
        pad.addEventListener("pointermove", function (e) { if (!curL) return; e.preventDefault(); var p = local(e); curL.push(p[0], p[1], e.pointerType === "pen" ? e.pressure || 0.5 : 0.5); draw(); });
        pad.addEventListener("pointerup", function () { if (curL && curL.length >= 6) lines.push(curL); curL = null; draw(); });
        pad.style.touchAction = "none";
        box.addEventListener("click", function (e) {
            var a = e.target.getAttribute && e.target.getAttribute("data-a");
            if (a === "cancel") bg.remove();
            if (a === "done") {
                if (lines.length) {
                    var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
                    lines.forEach(function (p) { for (var k = 0; k < p.length; k += 3) { x1 = Math.min(x1, p[k]); y1 = Math.min(y1, p[k + 1]); x2 = Math.max(x2, p[k]); y2 = Math.max(y2, p[k + 1]); } });
                    var w = Math.max(1, x2 - x1), h = Math.max(1, y2 - y1);
                    var sg = lines.map(function (p) { var o = []; for (var k = 0; k < p.length; k += 3) o.push(Math.round((p[k] - x1) / w * 1000) / 1000, Math.round((p[k + 1] - y1) / h * 1000) / 1000, f2(p[k + 2])); return o; });
                    var sig = { sg: sg, ar: f2(h / w) };
                    SIGS = [sig].concat(SIGS).slice(0, 4); saveSigs();
                    addSig(sig);
                }
                bg.remove();
            }
        });
    }

    /* ---------- 자 (아이패드 마크업 자) ---------- */
    var rulerEl = null, rulerLab = null;
    function rulerGeom() {                                     // 화면 좌표: 가운데 · 방향 · 두께
        var r = P.rul, a = r.ang * Math.PI / 180;
        return { cx: r.cx, cy: r.cy, ux: Math.cos(a), uy: Math.sin(a), nx: -Math.sin(a), ny: Math.cos(a), half: 34 };
    }
    function rulerEdgeAt(x, y, w) {                            // 자 가장자리 가까이에서 시작하면 그 가장자리를 따라감
        if (!P.ruler || !rulerEl) return null;
        var g = rulerGeom(), vx = x - scrollX - g.cx, vy = y - scrollY - g.cy;
        var along = vx * g.ux + vy * g.uy, off = vx * g.nx + vy * g.ny;
        if (Math.abs(along) > 470) return null;
        var side = off >= 0 ? 1 : -1, gap = Math.abs(off) - g.half;
        if (gap < -6 || gap > 26) return null;
        var d = g.half + (w || 2) / 2 + 1;
        return { px: g.cx + scrollX + g.nx * d * side, py: g.cy + scrollY + g.ny * d * side, ux: g.ux, uy: g.uy };
    }
    function projEdge(ed, x, y) { var t = (x - ed.px) * ed.ux + (y - ed.py) * ed.uy; return [ed.px + ed.ux * t, ed.py + ed.uy * t]; }
    function buildRuler() {
        rulerEl = document.createElement("div");
        rulerEl.className = "ink-ruler";
        rulerEl.setAttribute("data-theme-skip", "");
        var ticks = "";
        for (var i = -460; i <= 460; i += 10) {
            var big = i % 50 === 0, h = big ? 16 : 9;
            ticks += '<path d="M' + (470 + i) + " 0v" + h + "M" + (470 + i) + " 68v-" + h + '"/>';
        }
        rulerEl.innerHTML = '<svg viewBox="0 0 940 68" class="ink-ruler-svg" aria-hidden="true"><g stroke="currentColor" stroke-width="1">' + ticks + "</g></svg>" +
            '<span class="ink-ruler-lab">0°</span><span class="ink-ruler-rot" title="끌어서 돌리기">⟳</span>';
        rulerLab = rulerEl.querySelector(".ink-ruler-lab");
        document.body.appendChild(rulerEl);
        var pts = {}, mode = null, start = null;
        function setRul(cx, cy, ang) {
            var a = ((ang % 180) + 180) % 180;
            [0, 45, 90, 135, 180].forEach(function (s) { if (Math.abs(a - s) < 2.2) a = s % 180; });
            P.rul = { cx: f1(cx), cy: f1(cy), ang: f1(a) };
            placeRuler();
        }
        rulerEl.addEventListener("pointerdown", function (e) {
            if (e.pointerType === "pen") return;               // 펜슬은 그대로 그림
            e.preventDefault(); e.stopPropagation();
            cap(rulerEl, e);
            pts[e.pointerId] = [e.clientX, e.clientY];
            var ids = Object.keys(pts);
            var rot = e.target.classList.contains("ink-ruler-rot");
            if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; mode = "rot2"; start = { ang: P.rul.ang, a0: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, cx: P.rul.cx, cy: P.rul.cy, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; }
            else { mode = rot ? "rot1" : "move"; start = { x: e.clientX, y: e.clientY, cx: P.rul.cx, cy: P.rul.cy, ang: P.rul.ang }; }
        });
        rulerEl.addEventListener("pointermove", function (e) {
            if (!pts[e.pointerId]) return;
            pts[e.pointerId] = [e.clientX, e.clientY];
            var ids = Object.keys(pts);
            if (mode === "rot2" && ids.length >= 2) {
                var a = pts[ids[0]], b = pts[ids[1]], an = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
                setRul(start.cx + m[0] - start.m[0], start.cy + m[1] - start.m[1], start.ang + an - start.a0);
            } else if (mode === "rot1") {
                setRul(start.cx, start.cy, Math.atan2(e.clientY - start.cy, e.clientX - start.cx) * 180 / Math.PI - 0);
            } else if (mode === "move") setRul(start.cx + e.clientX - start.x, start.cy + e.clientY - start.y, start.ang);
        });
        function up(e) { delete pts[e.pointerId]; if (!Object.keys(pts).length) { mode = null; savePrefs(); } }
        rulerEl.addEventListener("pointerup", up);
        rulerEl.addEventListener("pointercancel", up);
        rulerEl.addEventListener("wheel", function (e) { e.preventDefault(); setRul(P.rul.cx, P.rul.cy, P.rul.ang + (e.deltaY > 0 ? 1 : -1) * (e.shiftKey ? 15 : 1)); savePrefs(); }, { passive: false });
        rulerEl.addEventListener("dblclick", function () { setRul(P.rul.cx, P.rul.cy, Math.round(P.rul.ang / 45) * 45); savePrefs(); });
    }
    function placeRuler() {
        if (!rulerEl) return;
        rulerEl.style.display = P.ruler && !P.hidden && !P.off ? "block" : "none";
        if (!P.ruler) return;
        if (!P.rul.cx || P.rul.cx > innerWidth || P.rul.cy > innerHeight) { P.rul.cx = innerWidth / 2; P.rul.cy = innerHeight * 0.45; }
        rulerEl.style.transform = "translate(" + f1(P.rul.cx - 470) + "px," + f1(P.rul.cy - 34) + "px) rotate(" + P.rul.ang + "deg)";
        var a = Math.round(P.rul.ang);
        rulerLab.textContent = (a > 90 ? 180 - a : a) + "°";
        rulerLab.style.transform = "translate(-50%,-50%) rotate(" + (-P.rul.ang) + "deg)";
    }

    /* ---------- 스포이드 ---------- */
    function pickAt(x, y) {
        picking = false;
        root.classList.remove("ink-picking");
        for (var i = strokes.length - 1; i >= 0; i--) {
            var st = strokes[i], R = rendered[i];
            if (!R || !R.bb || !st.c || x < R.bb.x1 || x > R.bb.x2 || y < R.bb.y1 || y > R.bb.y2) continue;
            if (!isObj(st)) {
                var hit = false, n = st.pts.length / 3, rr = st.w / 2 + 6;
                for (var k = 0; k < n && !hit; k++) {
                    var x1 = st.pts[3 * k] + R.ox, y1 = st.pts[3 * k + 1] + R.oy, x2 = k + 1 < n ? st.pts[3 * k + 3] + R.ox : x1, y2 = k + 1 < n ? st.pts[3 * k + 4] + R.oy : y1;
                    hit = segDist2(x, y, x1, y1, x2, y2) <= rr * rr;
                }
                if (!hit) continue;
            }
            pickColor(st.c, true);
            toast("이 색을 골랐어요");
            return;
        }
        if (window.EyeDropper) { new window.EyeDropper().open().then(function (r) { pickColor(r.sRGBHex, true); }).catch(function () {}); return; }
        toast("필기 위를 누르면 그 색을 가져와요");
    }

    /* ---------- 되돌리기 ---------- */
    function doUndo() { endEdit(); if (!undoS.length) return; redoS.push(strokes); strokes = undoS.pop(); sel = []; osel = null; commit(); }
    function doRedo() { if (!redoS.length) return; undoS.push(strokes); strokes = redoS.pop(); sel = []; osel = null; commit(); }
    function doClear() {
        if (!strokes.length) return;
        if (!confirm("이 페이지의 필기를 모두 지울까요? (되돌리기로 다시 살릴 수 있어요)")) return;
        snapshot(); strokes = []; sel = []; osel = null; commit();
    }

    /* ===================== 도구 그림 — iPadOS 27 미리보기 도구 막대를 시뮬레이터 화면에서 재서 그대로 (2026-10-24) =====================
       단위 = pt · 도구 칸 40 × 90 (위 70pt 가 막대 안에 보이고 아래 20pt 는 막대 밖으로 잘림) · 몸통 폭 19pt · 고르면 17.5pt 위로
       몸통 = 원통처럼 왼쪽 · 오른쪽이 살짝 어두운 그라데이션 (라이트 흰색 · 다크 검정) · 촉 · 띠 = 지금 색 */
    function isDark() { return root.getAttribute("data-theme") === "dark"; }
    var ART_DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" data-theme-skip><defs>' +
        '<linearGradient id="ink-bL" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#dcdce1"/><stop offset=".14" stop-color="#f4f4f6"/><stop offset=".34" stop-color="#ffffff"/><stop offset=".66" stop-color="#fafafb"/><stop offset=".9" stop-color="#e9e9ed"/><stop offset="1" stop-color="#d2d2d7"/></linearGradient>' +
        '<linearGradient id="ink-bD" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#08080a"/><stop offset=".18" stop-color="#262629"/><stop offset=".38" stop-color="#3a3a3e"/><stop offset=".7" stop-color="#202023"/><stop offset="1" stop-color="#0b0b0d"/></linearGradient>' +
        '<linearGradient id="ink-pk" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#de8589"/><stop offset=".3" stop-color="#f7a9ab"/><stop offset=".7" stop-color="#f3a0a3"/><stop offset="1" stop-color="#d97f83"/></linearGradient>' +
        '<linearGradient id="ink-mt" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7d7d82"/><stop offset=".38" stop-color="#e3e3e8"/><stop offset=".62" stop-color="#b9b9be"/><stop offset="1" stop-color="#6f6f74"/></linearGradient>' +
        '<linearGradient id="ink-fdg" x1="0" x2="0" y1="0" y2="40" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="#fff"/><stop offset=".6" stop-color="#000"/></linearGradient>' +
        '<mask id="ink-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="90"><rect width="40" height="90" fill="url(#ink-fdg)"/></mask>' +
        '<clipPath id="ink-pcone" clipPathUnits="userSpaceOnUse"><path d="M20 .4 29.5 35H10.5Z"/></clipPath>' +
        '<filter id="ink-lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.2" stdDeviation="2.2" flood-color="#000" flood-opacity=".26"/></filter>' +
        "</defs></svg>";
    function toolArt(t, tip, op) {
        var D = isDark(), B = D ? "url(#ink-bD)" : "url(#ink-bL)", ed = D ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.09)";
        var body = function (y, x, w) { x = x == null ? 10.5 : x; w = w || 19; return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (91 - y) + '" fill="' + B + '"/>'; };
        var band = function (y, h, x, w) { return '<rect x="' + (x == null ? 10.5 : x) + '" y="' + y + '" width="' + (w || 19) + '" height="' + h + '" fill="' + tip + '"/>'; };
        var o = '<svg viewBox="0 0 40 90" class="ink-art" aria-hidden="true">';
        var pct = op != null ? '<text x="20" y="66.6" text-anchor="middle" font-size="7.8" font-weight="500" letter-spacing=".5" fill="' + (D ? "#98989f" : "#8e8e93") + '" font-family="-apple-system,\'SF Pro Text\',sans-serif">' + Math.round(op * 100) + "</text>" : "";
        if (t === "pen") return o +
            '<path d="M20 .6Q20.8 .6 22.4 7.6Q29.5 27 29.5 35.5V91H10.5V35.5Q10.5 27 17.6 7.6Q19.2 .6 20 .6Z" fill="' + B + '"/>' +
            '<path d="M20 .6C20.9 .6 22.1 4.6 22.6 7.6H17.4C17.9 4.6 19.1 .6 20 .6Z" fill="' + tip + '"/>' + band(40.6, 3.4) + "</svg>";
        if (t === "monoline") return o +
            '<rect x="19.1" y="0" width="1.8" height="6.6" rx=".9" fill="' + tip + '"/><rect x="19.1" y="6" width="1.8" height="6.6" fill="' + (D ? "#6e6e73" : "#d1d1d6") + '"/>' +
            '<rect x="14" y="12.3" width="12" height="6.6" rx=".8" fill="' + B + '"/>' +
            '<rect x="12" y="18.6" width="16" height="17.2" fill="' + B + '"/>' +
            '<rect x="12" y="18.6" width="16" height=".6" fill="' + (D ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)") + '"/>' + body(35.5, 10.25, 19.5) +
            '<rect x="10.25" y="35.5" width="19.5" height=".6" fill="' + (D ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.06)") + '"/>' + band(49.3, 2.6, 10.25, 19.5) + "</svg>";
        if (t === "marker") return o +
            '<path d="M15.2 10.4V5.6L23.6 .6Q24.9-.1 24.9 1.4V10.4Z" fill="' + tip + '"/>' +
            '<path d="M14 10H26V19.6C26 25 29.75 26.4 29.75 31.4V91H10.25V31.4C10.25 26.4 14 25 14 19.6Z" fill="' + B + '"/>' +
            band(41, 7.8, 10.25, 19.5) + pct + "</svg>";
        if (t === "eraser") return o +
            '<path d="M10.5 17.4V4.4Q10.5 .5 14.4 .5H25.6Q29.5 .5 29.5 4.4V17.4Z" fill="url(#ink-pk)"/>' + body(17.2) +
            '<rect x="10.5" y="33.3" width="19" height=".7" fill="' + (D ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)") + '"/></svg>';
        if (t === "pencil") return o +                         // 연필: 흰 원뿔 + 색 심 · 가는 색 띠 · 불투명도 숫자 (iOS 27 도구 막대)
            '<path d="M15.9 14.5 10.5 39H29.5L24.1 14.5Z" fill="' + B + '" stroke="' + ed + '" stroke-width=".5"/>' +
            '<path d="M20 2.2C20.6 2.2 24.1 14.5 24.1 14.5H15.9S19.4 2.2 20 2.2Z" fill="' + tip + '"/>' +
            body(38.8) + band(44.2, 1.7) + pct + "</svg>";
        if (t === "ruler") {
            var tk = "", y = 3.2, i = 0;
            for (; y < 90; y += 4.6, i++) tk += '<path d="M5.6 ' + y.toFixed(1) + "h" + (i % 5 ? 3.3 : 8.6) + '" stroke="' + (D ? "#aeaeb2" : "#6e6e73") + '" stroke-width="' + (i % 5 ? .9 : 1.2) + '"/>';
            return o + '<rect x="4.25" y=".4" width="31.5" height="91" rx=".8" fill="' + (D ? "#2a2a2d" : "#fbfbfc") + '" stroke="' + ed + '" stroke-width=".5"/>' +
                '<rect x="4.25" y=".4" width="11.5" height="91" fill="' + (D ? "#222225" : "#f0f0f3") + '"/>' + tk + "</svg>";
        }
        if (t === "crayon") return o +
            '<path d="M18 .8Q20-.2 22 .8L28.6 22.6H11.4Z" fill="' + tip + '"/>' + band(22.4, 5) + body(27.2) + band(45, 5.5) + "</svg>";
        if (t === "fountain") return o +
            '<path d="M20 .6C22.4 5.5 27.4 15 27.4 26V38.6H12.6V26C12.6 15 17.6 5.5 20 .6Z" fill="url(#ink-mt)"/>' +
            '<path d="M20 3.5V22.4" stroke="#3a3a3c" stroke-width=".7"/><circle cx="20" cy="23.8" r="1.5" fill="#f2f2f7" stroke="#6e6e73" stroke-width=".4"/>' +
            '<rect x="11.4" y="38.4" width="17.2" height="2.8" rx=".6" fill="' + (D ? "#48484a" : "#e5e5ea") + '"/>' + body(41) + band(52.5, 3) + "</svg>";
        if (t === "reed") return o +                           // 갈대펜: 납작하게 깎은 크림색 갈대 촉 · 끝에 먹(색)이 배어 옅어짐 · 굵은 색 띠 (iOS 27 도구 막대)
            '<path d="M17 2.7H25.3L29.5 31.6V36H10.5V31.6Z" fill="' + (D ? "#d8d1c2" : "#f3eee3") + '"/>' +
            '<path d="M17 2.7H25.3L29.5 31.6V36H10.5V31.6Z" fill="' + tip + '" mask="url(#ink-fade)"/>' +
            body(35.8) + band(43.7, 13.3) + "</svg>";
        if (t === "watercolor") return o +                     // 수채화: 색 붓끝 + 회색 쇠테 · 색 띠 (iOS 27 도구 막대)
            '<path d="M15.5 28.4 11 38.4V44.6H29V38.4L24.5 28.4Z" fill="url(#ink-mt)"/>' +
            '<path d="M20.3 2.8C22.4 6 25.3 15 25.3 21.6 25.3 25.4 24.6 28.4 24.6 28.4H15.4S14.9 25.4 14.9 21.6C14.9 15 18.2 6 20.3 2.8Z" fill="' + tip + '"/>' +
            body(44.4) + band(52.3, 5.5) + "</svg>";
        // 올가미: 줄무늬 원뿔 (iOS 27 도구 막대의 다섯째 — 색 없음)
        var sp = ""; for (var k = -16; k < 40; k += 5.6) sp += "M" + k + " 36L" + (k + 15) + " -1";
        return o + '<path d="M20 .4 29.5 35H10.5Z" fill="' + B + '"/>' +
            '<path d="' + sp + '" stroke="' + (D ? "#5c5c61" : "#cfcfd4") + '" stroke-width="2.3" clip-path="url(#ink-pcone)"/>' + body(34.8) + "</svg>";
    }
    function icon(name) {
        var s = '<svg viewBox="0 0 24 24" class="ink-ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
        var d = {
            undo: '<path d="M9.5 6.5 5 11l4.5 4.5"/><path d="M5.5 11H14a5 5 0 0 1 0 10h-2.5"/>',
            redo: '<path d="M14.5 6.5 19 11l-4.5 4.5"/><path d="M18.5 11H10a5 5 0 0 0 0 10h2.5"/>',
            more: '<circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
            plus: '<path d="M12 5v14M5 12h14" stroke-width="2"/>',
            markup: '<circle cx="12" cy="12" r="9.2"/><path d="M8.6 16.4l.9-3.4 5.6-5.6a1.4 1.4 0 0 1 2 2l-5.6 5.6Z"/><path d="M14 8.5l1.9 1.9"/>',
            sticker: '<path d="M20.5 12A8.5 8.5 0 1 1 12 3.5"/><path d="M20.5 12c-4.6 0-8.5-3.9-8.5-8.5"/><path d="M12 3.5c0 4.7 3.8 8.5 8.5 8.5"/>',
            text: '<rect x="3" y="5.5" width="18" height="13" rx="2" stroke-dasharray="2.4 2.1"/><text x="12" y="15.6" text-anchor="middle" font-size="8.6" font-weight="600" stroke="none" fill="currentColor" font-family="-apple-system,sans-serif">가</text>',
            sig: '<path d="M4 18h16"/><path d="M4.5 14.5l2 2m0-2-2 2"/><path d="M9 15.5c1.5-.6 2.8-8.6 4.5-8.6 1.4 0-.3 7 1.4 7 1.2 0 1.8-2.8 3-2.8.9 0 .8 1.7 1.7 1.7"/>',
            shape: '<circle cx="9.5" cy="9.5" r="5.5"/><rect x="10" y="10" width="10" height="10" rx="1.6" fill="var(--ink-bg-solid)"/>',
            mag: '<path d="M9.5 4.5h-3a3 3 0 0 0-3 3v1"/><circle cx="13" cy="13" r="6.5"/><path d="M13 9.5v7M9.5 13h7"/><path d="M3.5 13.5 2 15"/>',
            drop: '<path d="M14.6 4.6a2.4 2.4 0 0 1 3.4 3.4l-1.7 1.7-3.4-3.4Z"/><path d="M12.9 6.3l3.4 3.4-8.5 8.5-3.7.9.9-3.7Z"/>',
            trash: '<path d="M4.5 7h15"/><path d="M9.5 7V4.8h5V7"/><path d="M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6L17.5 7"/>',
            paste: '<rect x="6" y="5" width="12" height="15" rx="2"/><path d="M9 5V3.8h6V5M9 10h6M9 13.5h6"/>',
            chev: '<path d="M9 6l6 6-6 6"/>', close: '<path d="M7 7l10 10M17 7 7 17"/>',
            rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>', oval: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
            bubble: '<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v7.5A1.5 1.5 0 0 1 19 16H10l-4 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5Z"/>',
            star: '<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z"/>',
            arrow: '<path d="M4.5 19.5 19 5M11 5h8v8"/>', line: '<path d="M4.5 19.5 19.5 4.5"/>'
        }[name] || "";
        return s + d + "</svg>";
    }
    /* 굵기 고르기 견본 — Apple 굵기 창의 손글씨 모양 */
    var SQUIG = "M6.5 26.5c.4-6.6 1.2-13.4 3-19.4M8.4 19.6c1.7-4.6 4.3-7.6 6.8-7.6 2.2 0 2.1 3.4 1 7.6-.7 2.8.6 4.4 3.6 3.4";

    /* ===================== 화면 ===================== */
    var CSS = [
        ":root{--ink-glass:rgba(250,250,252,.66);--ink-glass-2:rgba(255,255,255,.78);--ink-edge2:rgba(255,255,255,.75);--ink-text:#1c1c1e;--ink-sub:#6e6e73;--ink-hair:rgba(60,60,67,.18);--ink-btn:rgba(120,120,128,.16);--ink-accent:#0a84ff;--ink-bg-solid:#f6f6f8;--ink-sel:#000;--ink-sel-fg:#fff;--ink-grab:rgba(60,60,67,.3)}",
        "html[data-theme=dark]{--ink-glass:rgba(40,40,44,.66);--ink-glass-2:rgba(52,52,56,.82);--ink-edge2:rgba(255,255,255,.14);--ink-text:#f2f2f7;--ink-sub:#98989f;--ink-hair:rgba(235,235,245,.16);--ink-btn:rgba(235,235,245,.14);--ink-bg-solid:#2c2c30;--ink-sel:#fff;--ink-sel-fg:#000;--ink-grab:rgba(235,235,245,.34)}",
        ".ink-svg{position:absolute;left:0;top:0;pointer-events:none;z-index:9980;overflow:visible}",
        ".ink-svg .ink-selrect{fill:rgba(10,132,255,.06);stroke:#0a84ff;stroke-width:1.5;stroke-dasharray:6 5}",
        ".ink-svg .ink-objframe{fill:none;stroke:#0a84ff;stroke-width:1.2;stroke-dasharray:4 4}",
        ".ink-svg .ink-handle{fill:#fff;stroke:#0a84ff;stroke-width:2} .ink-svg .ink-handle.blue{fill:#0a84ff;stroke:#fff} .ink-svg .ink-handle.green{fill:#34c759;stroke:#fff}",
        ".ink-svg .ink-lasso{fill:none;stroke:#7f7f7f;stroke-width:2;stroke-dasharray:3.5 10.5;stroke-linecap:round;stroke-linejoin:round;animation:ink-ants 1s linear infinite} @keyframes ink-ants{to{stroke-dashoffset:-14}}",   // iOS 27: 회색 2pt · 보이는 점 5.5 / 빈칸 8.5 · 1초에 한 칸
        "html[data-theme=dark] .ink-svg .ink-lasso{stroke:#aeaeb2}",
        ".ink-svg.ink-mk{z-index:9979}",
        "html[data-theme=light] .ink-svg.ink-mk{mix-blend-mode:multiply} html[data-theme=dark] .ink-svg.ink-mk{mix-blend-mode:screen}",
        ".ink-objs{position:absolute;left:0;top:0;width:0;height:0;z-index:9981;pointer-events:none}",
        ".ink-text{position:absolute;min-height:1.4em;line-height:1.35;white-space:pre-wrap;word-break:break-word;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;padding:2px 4px;border-radius:4px;outline:none;pointer-events:none}",
        ".ink-text.on{box-shadow:0 0 0 1.5px #0a84ff} .ink-text.edit{pointer-events:auto;box-shadow:0 0 0 2px #0a84ff;background:rgba(10,132,255,.06);-webkit-user-select:text;user-select:text;cursor:text}",
        ".ink-mag{position:absolute;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px #8e8e93,0 6px 18px rgba(0,0,0,.35);background:var(--bg,#fff);pointer-events:none}",
        ".ink-mag.on{box-shadow:0 0 0 3px #0a84ff,0 6px 18px rgba(0,0,0,.35)} .ink-mag-in{position:absolute;left:0;top:0;transform-origin:0 0}",
        ".ink-hover{position:fixed;z-index:10006;border-radius:50%;pointer-events:none;display:none;box-shadow:0 0 0 1px rgba(255,255,255,.75),0 0 0 2px rgba(0,0,0,.25)} .ink-hover.er{box-shadow:0 0 0 1.5px rgba(127,127,127,.9)}",
        "html.ink-drawing body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}",
        "html.ink-finger{touch-action:none} html.ink-picking,html.ink-picking *{cursor:crosshair!important}",
        ".ink-ui{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Apple SD Gothic Neo','Pretendard',sans-serif;color:var(--ink-text);-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-font-smoothing:antialiased}",
        ".ink-ui button{border:0;background:transparent;color:inherit;cursor:pointer;padding:0;margin:0;font:inherit}",
        // Liquid Glass — 반투명 · 흐림 · 가장자리 빛 · 부드러운 그림자
        ".ink-glass{background:var(--ink-glass);-webkit-backdrop-filter:blur(26px) saturate(1.9);backdrop-filter:blur(26px) saturate(1.9);border:1px solid var(--ink-edge2);",
        "box-shadow:0 12px 34px rgba(0,0,0,.16),0 2px 6px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 0 rgba(0,0,0,.04)}",
        "html[data-theme=dark] .ink-glass{box-shadow:0 12px 34px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.1)}",
        // 필기 켜기 버튼 (미리보기 위 막대의 마크업 버튼)
        ".ink-mk{position:fixed;top:14px;right:66px;z-index:10002;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s,transform .15s}",
        ".ink-mk .ink-ic{width:26px;height:26px} .ink-mk:active{transform:scale(.92)}",
        ".ink-mk.on{background:#0a84ff;color:#fff;border-color:#0a84ff;box-shadow:0 6px 18px rgba(10,132,255,.38)}",
        // 도구 막대 (알약 모양)
        ".ink-dock{position:fixed;z-index:10003;left:50%;transform:translateX(-50%);width:min(700px,calc(100vw - 24px));height:106px;border-radius:53px;display:flex;align-items:center;gap:0;padding:0 23px 0 22px;overflow:hidden;box-sizing:border-box;transition:transform .32s cubic-bezier(.2,.9,.25,1.1),opacity .2s}",
        ".ink-dock.d-bottom{bottom:calc(21px + env(safe-area-inset-bottom,0px))} .ink-dock.d-top{top:calc(70px + env(safe-area-inset-top,0px))}",
        ".ink-dock.enter{transform:translateX(-50%) translateY(140%);opacity:0} .ink-dock.d-top.enter{transform:translateX(-50%) translateY(-160%)}",
        ".ink-dock.dragging{transition:none;cursor:grabbing}",
        ".ink-grab{position:absolute;left:50%;top:0;width:90px;height:20px;transform:translateX(-50%);cursor:grab;touch-action:none;z-index:2} .ink-grab::after{content:'';position:absolute;left:28px;right:28px;top:7px;height:5px;border-radius:3px;background:var(--ink-grab)}",
        ".ink-cb{flex:0 0 auto;width:32px;height:32px;border-radius:50%!important;background:var(--ink-btn)!important;display:flex;align-items:center;justify-content:center;transition:opacity .15s,transform .12s}",
        ".ink-cb:active{transform:scale(.9)} .ink-cb:disabled{opacity:.32} .ink-cb .ink-ic{width:20px;height:20px} .ink-cb.r{margin-right:8px}",
        ".ink-tools{flex:0 1 302px;min-width:0;height:100%;margin-left:23px;display:flex;align-items:flex-end;gap:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:0 1px;scroll-snap-type:x proximity;",
        "-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 10px,#000 calc(100% - 10px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 10px,#000 calc(100% - 10px),transparent 100%)}",
        ".ink-tools::-webkit-scrollbar{display:none}",
        ".ink-tool{flex:0 0 49.5px;width:49.5px;height:100%;position:relative;scroll-snap-align:start}",
        ".ink-tool .ink-art{position:absolute;left:4.75px;width:40px;height:90px;bottom:-20px;transition:transform .24s cubic-bezier(.25,1.35,.4,1);filter:drop-shadow(0 .8px 1.2px rgba(0,0,0,.16))}",
        ".ink-tool.on .ink-art{transform:translateY(-17.5px)}",
        ".ink-dock.d-top .ink-tool .ink-art{bottom:auto;top:-20px;transform:rotate(180deg)} .ink-dock.d-top .ink-tool.on .ink-art{transform:rotate(180deg) translateY(-17.5px)}",
        ".ink-cols{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,31px);grid-auto-rows:31px;gap:10px 12px;margin:0 13px 0 auto}",
        ".ink-qc{width:31px;height:31px;border-radius:50%!important;position:relative;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.12)}",
        ".ink-qc.on{box-shadow:inset 0 0 0 2.6px var(--ring,#000),inset 0 0 0 5.4px #fff}",   // Apple: 크기는 그대로 · 바깥 테 + 흰 틈 + 가운데 색
        ".ink-qc.wheel{background:conic-gradient(from 90deg,#ff3b30,#ff9500,#ffcc00,#34c759,#00c7be,#0a84ff,#5856d6,#af52de,#ff2d55,#ff3b30)!important}",
        ".ink-qc.wheel::after{content:'';position:absolute;inset:7px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,0) 72%)}",
        ".ink-cw{display:none}",
        ".ink-pm{flex:0 0 auto;display:flex;gap:10px} .ink-pm .ink-cb{background:rgba(120,120,128,.3)!important} .ink-ur{flex:0 0 auto;display:flex;gap:10px}",
        "@media (max-width:640px){.ink-dock{height:88px;border-radius:44px;padding:0 10px;gap:4px;width:calc(100vw - 16px)} .ink-tools{flex:1 1 auto;margin-left:6px} .ink-ur{gap:4px} .ink-cb{width:32px;height:32px} .ink-cb .ink-ic{width:18px;height:18px} .ink-cb.r{margin-right:2px}",
        ".ink-cols{display:none} .ink-cw{display:block;flex:0 0 auto;width:32px;height:32px;margin:0 4px} .ink-tool{flex-basis:42px;width:42px} .ink-tool .ink-art{left:1px;width:40px;height:90px;bottom:-30px} .ink-tool.on .ink-art{transform:translateY(-14px)} .ink-pm{gap:4px}}",
        // 최소화 = 지금 도구가 든 유리 동그라미 (모서리에 붙음)
        ".ink-fab{position:fixed;z-index:10003;width:75px;height:75px;border-radius:50%;display:none;overflow:hidden;cursor:pointer;touch-action:none}",
        ".ink-fab .ink-art{position:absolute;left:17.5px;width:40px;height:90px;top:15px;filter:drop-shadow(0 .8px 1.2px rgba(0,0,0,.18))}",
        ".ink-fab.c-bl{left:calc(20px + env(safe-area-inset-left,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px))} .ink-fab.c-br{right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px))}",
        ".ink-fab.c-tl{left:calc(20px + env(safe-area-inset-left,0px));top:calc(70px + env(safe-area-inset-top,0px))} .ink-fab.c-tr{right:calc(20px + env(safe-area-inset-right,0px));top:calc(70px + env(safe-area-inset-top,0px))}",
        ".ink-fab.pop{animation:ink-fabin .32s cubic-bezier(.2,1.4,.4,1)} @keyframes ink-fabin{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}",
        "html.ink-min .ink-dock{display:none} html.ink-min .ink-fab{display:block} html.ink-mkoff .ink-dock,html.ink-mkoff .ink-fab{display:none!important}",
        // 팝업 (굵기 · 색 · + · ⋯)
        ".ink-pop{position:fixed;z-index:10004;border-radius:24px;padding:12px;display:none;max-height:calc(100vh - 40px);overflow:auto;transform-origin:50% 100%}",
        ".ink-pop.show{display:block;animation:ink-popin .2s cubic-bezier(.2,1.2,.4,1)} @keyframes ink-popin{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}",
        ".ink-wrow{display:flex;gap:8px;padding:2px 2px 10px}",
        ".ink-wb{width:52px;height:52px;border-radius:14px!important;display:flex;align-items:center;justify-content:center;color:var(--ink-text)}",
        ".ink-wb svg{width:34px;height:34px} .ink-wb.on{background:var(--ink-sel)!important;color:var(--ink-sel-fg)}",
        ".ink-op{-webkit-appearance:none;appearance:none;display:block;width:100%;height:32px;border-radius:16px;margin:0;cursor:pointer;",
        "background:linear-gradient(90deg,rgba(0,0,0,0),var(--opc,#000)),repeating-conic-gradient(#c7c7cc 0 25%,#f2f2f7 0 50%) 0 0/12px 12px;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.12)}",
        ".ink-op::-webkit-slider-thumb{-webkit-appearance:none;width:32px;height:32px;border-radius:50%;background:var(--opc,#000);border:3.5px solid #fff;box-shadow:0 0 0 .5px rgba(0,0,0,.2),0 2px 6px rgba(0,0,0,.3)}",
        ".ink-op::-moz-range-thumb{width:25px;height:25px;border-radius:50%;background:var(--opc,#000);border:3.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)}",
        ".ink-seg{display:flex;background:var(--ink-btn);border-radius:999px;padding:3px;gap:2px;margin-bottom:12px}",
        ".ink-seg button{flex:1;height:34px;border-radius:999px!important;font-size:14px;font-weight:500;padding:0 12px;white-space:nowrap}",
        ".ink-seg button.on{background:var(--ink-bg-solid)!important;box-shadow:0 1px 4px rgba(0,0,0,.14);font-weight:600}",
        ".ink-erow{display:flex;gap:8px;align-items:center}",
        ".ink-eb{width:52px;height:52px;border-radius:14px!important;display:flex;align-items:center;justify-content:center}",
        ".ink-eb i{display:block;border-radius:50%;border:1.5px solid var(--ink-text);opacity:.85} .ink-eb.on{background:var(--ink-sel)!important} .ink-eb.on i{border-color:var(--ink-sel-fg);opacity:1}",
        // 색상 선택기
        ".ink-cp{width:300px}",
        ".ink-cphead{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;margin:0 0 12px} .ink-cphead b{text-align:center;font-size:17px;font-weight:600}",
        ".ink-cpx{width:44px;height:44px;border-radius:50%!important;background:var(--ink-btn)!important;display:flex;align-items:center;justify-content:center} .ink-cpx.on{background:var(--ink-accent)!important;color:#fff}",
        ".ink-grid{display:grid;grid-template-columns:repeat(12,1fr);border-radius:12px;overflow:hidden}",
        ".ink-grid button{aspect-ratio:1;border-radius:0!important;position:relative} .ink-grid button.on{box-shadow:inset 0 0 0 2.5px #fff,0 0 0 1px rgba(0,0,0,.6);z-index:1;border-radius:4px!important}",
        ".ink-spec{width:100%;height:220px;border-radius:12px;display:block;touch-action:none;cursor:crosshair}",
        ".ink-rgb{display:grid;grid-template-columns:1fr 64px;gap:8px 10px;align-items:center;margin:2px 0 10px} .ink-rgb label{grid-column:1/3;font-size:12.5px;color:var(--ink-sub);margin-bottom:-4px;text-transform:uppercase}",
        ".ink-rgb input[type=range]{width:100%;accent-color:var(--ink-accent)} .ink-num{height:34px;border-radius:999px;border:0;background:var(--ink-bg-solid);color:var(--ink-text);font:15px -apple-system,sans-serif;text-align:center;width:100%;box-sizing:border-box}",
        ".ink-oplab{font-size:12.5px;color:var(--ink-sub);margin:14px 0 6px}",
        ".ink-oprow{display:grid;grid-template-columns:1fr 76px;gap:10px;align-items:center}",
        ".ink-pct{height:40px;border-radius:999px;background:var(--ink-bg-solid);display:flex;align-items:center;justify-content:center;font-size:17px;font-variant-numeric:tabular-nums}",
        ".ink-cphr{height:1px;background:var(--ink-hair);margin:14px 0}",
        ".ink-saved{display:grid;grid-template-columns:76px 1fr;gap:14px;align-items:start}",
        ".ink-big{width:76px;height:76px;border-radius:18px;background:repeating-conic-gradient(#c7c7cc 0 25%,#f2f2f7 0 50%) 0 0/12px 12px;overflow:hidden} .ink-big i{display:block;width:100%;height:100%}",
        ".ink-sw{display:flex;flex-wrap:wrap;gap:10px} .ink-sw button{width:30px;height:30px;border-radius:50%!important;position:relative;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.15)}",
        ".ink-sw button.on{box-shadow:0 0 0 2.5px var(--ink-glass-2),0 0 0 4.5px var(--ring,#000)} .ink-sw .ink-add{background:var(--ink-btn)!important;display:flex;align-items:center;justify-content:center} .ink-sw .ink-add .ink-ic{width:18px;height:18px}",
        // 메뉴 (+ · ⋯ · 펜슬 설정)
        ".ink-pop.menu{padding:6px;min-width:250px;border-radius:22px}",
        ".ink-mi{display:flex;align-items:center;gap:14px;width:100%;min-height:44px;padding:0 14px!important;border-radius:14px!important;font-size:17px!important;text-align:left;color:var(--ink-text)}",
        ".ink-mi:active,.ink-mi:hover{background:var(--ink-btn)!important} .ink-mi .ink-ic{width:24px;height:24px;flex:0 0 auto} .ink-mi .sp{flex:1}",
        ".ink-mi.danger{color:#ff3b30} .ink-mhr{height:1px;background:var(--ink-hair);margin:5px 14px}",
        ".ink-mh{font-size:13px;color:var(--ink-sub);padding:8px 14px 2px}",
        ".ink-tog{width:51px;height:31px;border-radius:16px;background:rgba(120,120,128,.32);position:relative;flex:0 0 auto;transition:background .2s}",
        ".ink-tog::after{content:'';position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.25);transition:left .2s cubic-bezier(.3,1.4,.5,1)}",
        ".ink-mi.on .ink-tog{background:#34c759} .ink-mi.on .ink-tog::after{left:22px}",
        ".ink-shapes{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px} .ink-shapes button{height:52px;border-radius:14px!important;display:flex;align-items:center;justify-content:center} .ink-shapes button:hover{background:var(--ink-btn)!important} .ink-shapes .ink-ic{width:28px;height:28px}",
        ".ink-stk{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:4px} .ink-stk button{font-size:30px;height:50px;border-radius:12px!important} .ink-stk button:hover{background:var(--ink-btn)!important}",
        ".ink-sigs{display:flex;gap:8px;flex-wrap:wrap;padding:4px 8px 8px} .ink-sigs button{width:100px;height:46px;border-radius:12px!important;background:var(--ink-bg-solid)!important;padding:4px!important} .ink-sigs svg{width:100%;height:100%}",
        ".ink-note{font-size:12.5px;color:var(--ink-sub);line-height:1.5;margin:6px 14px 8px}",
        // 고른 것 위 메뉴 (아이패드 말풍선 메뉴처럼 검은 막대)
        ".ink-selbar{position:fixed;z-index:10004;display:none;align-items:center;padding:0 3px;height:44px;border-radius:22px;background:var(--ink-glass-2);-webkit-backdrop-filter:blur(24px) saturate(1.8);backdrop-filter:blur(24px) saturate(1.8);border:1px solid var(--ink-edge2);box-shadow:0 10px 30px rgba(0,0,0,.18),0 1px 4px rgba(0,0,0,.08);max-width:calc(100vw - 16px);overflow-x:auto;scrollbar-width:none}",
        ".ink-selbar::-webkit-scrollbar{display:none}",
        ".ink-selbar button{height:38px;padding:0 17px;border:0;border-radius:19px;background:transparent;color:var(--ink-text);font-size:17px;letter-spacing:-.2px;cursor:pointer;white-space:nowrap;font-family:-apple-system,'SF Pro Text',system-ui,sans-serif}",   // 미리보기 편집 메뉴: 글자만 · 17pt · 얇은 세로선
        ".ink-selbar button:active,.ink-selbar button:hover{background:var(--ink-btn)} .ink-sbsep{width:1px;height:18px;background:var(--ink-hair);flex:0 0 1px}",
        // 자
        ".ink-ruler{position:fixed;left:0;top:0;width:940px;height:68px;z-index:9990;transform-origin:470px 34px;display:none;touch-action:none;cursor:move;",
        "background:linear-gradient(rgba(240,240,244,.62),rgba(220,220,226,.62));border-top:1px solid rgba(0,0,0,.18);border-bottom:1px solid rgba(0,0,0,.18);box-shadow:0 4px 16px rgba(0,0,0,.18);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:rgba(0,0,0,.55)}",
        "html[data-theme=dark] .ink-ruler{background:linear-gradient(rgba(70,70,76,.62),rgba(50,50,56,.62));color:rgba(255,255,255,.6);border-color:rgba(255,255,255,.2)}",
        ".ink-ruler-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
        ".ink-ruler-lab{position:absolute;left:50%;top:50%;font:600 15px -apple-system,sans-serif;color:inherit;pointer-events:none;white-space:nowrap}",
        ".ink-ruler-rot{position:absolute;right:16px;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;background:rgba(10,132,255,.85);color:#fff;font-size:17px;line-height:30px;text-align:center;cursor:grab}",
        // 서명 창
        ".ink-modal-bg{position:fixed;inset:0;z-index:10010;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center}",
        ".ink-sigbox{width:min(560px,calc(100vw - 24px));border-radius:22px;background:var(--ink-glass-2);-webkit-backdrop-filter:blur(26px);backdrop-filter:blur(26px);box-shadow:0 20px 50px rgba(0,0,0,.4);overflow:hidden}",
        ".ink-sighead{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--ink-hair)} .ink-sighead b{font-size:17px}",
        ".ink-sigbtn{border:0;background:transparent;color:var(--ink-accent);font-size:17px;cursor:pointer;padding:6px 8px;font-family:inherit} .ink-sigbtn.strong{font-weight:600}",
        ".ink-sigwrap{position:relative;height:220px} .ink-sigpad{position:absolute;inset:0;width:100%;height:100%}",
        ".ink-sigline{position:absolute;left:24px;right:24px;bottom:46px;border-bottom:1.5px solid var(--ink-hair);color:var(--ink-sub);font-size:13px;padding-bottom:6px;pointer-events:none}",
        ".ink-sigfoot{display:flex;justify-content:flex-start;padding:6px 10px;border-top:1px solid var(--ink-hair)}",
        ".ink-toast{position:fixed;left:50%;bottom:calc(124px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:10005;background:rgba(28,28,30,.86);color:#fff;",
        "font-size:13px;padding:8px 14px;border-radius:14px;max-width:86vw;text-align:center;pointer-events:none;opacity:0;transition:opacity .18s}",
        ".ink-toast.show{opacity:1}",
        "@media print{.ink-dock,.ink-fab,.ink-pop,.ink-selbar,.ink-toast,.ink-ruler,.ink-hover,.ink-mk{display:none!important}}"
    ].join("\n");

    var dock, fab, pop, selBar, toastEl, mkBtn, B = {};
    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (cls && /ink-(dock|fab|pop|selbar|toast|modal-bg|mk)/.test(cls)) e.setAttribute("data-theme-skip", "");
        if (html != null) e.innerHTML = html;
        return e;
    }
    function button(cls, html, title, fn) {
        var b = el("button", cls, html);
        b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
        b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); fn(b, e); });
        return b;
    }
    function cap(elm, e) { try { elm.setPointerCapture(e.pointerId); } catch (er) {} }   // 끌기 중 손가락이 밖으로 나가도 계속
    var toastT;
    function toast(msg) {
        if (!toastEl) { toastEl = el("div", "ink-toast ink-ui"); document.body.appendChild(toastEl); }
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toastT);
        toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
    }

    /* 도구 막대 순서 = iOS 27 PencilKit 기본 도구 막대 (펜 · 모노라인 · 마커 · 지우개 · 올가미 · 자 → 옆으로 밀면 연필 · 크레용 · 만년필 · 갈대펜 · 수채화)
       2026-10-25: 테스트 앱에 PKToolPicker 를 띄워 toolItems 를 출력해 확인 — 줄무늬 원뿔은 연필이 아니라 올가미 */
    var BAR = ["pen", "monoline", "marker", "eraser", "lasso", "ruler", "pencil", "crayon", "fountain", "reed", "watercolor"];
    function buildUI() {
        var st = el("style"); st.setAttribute("data-theme-skip", ""); st.textContent = CSS; document.head.appendChild(st);

        svg = document.createElementNS(NS, "svg");
        svg.setAttribute("class", "ink-svg");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("data-theme-skip", "");
        var defs = document.createElementNS(NS, "defs");
        svg.appendChild(defs); defsEl = defs;
        gMarker = document.createElementNS(NS, "g");                    // 마커 · 수채화는 맨 아래 → 글씨가 위로
        gPencil = document.createElementNS(NS, "g");
        gPen = document.createElementNS(NS, "g");
        gObj = document.createElementNS(NS, "g");
        layerCur = document.createElementNS(NS, "g");
        gSel = document.createElementNS(NS, "g");
        lassoPath = document.createElementNS(NS, "path"); lassoPath.setAttribute("class", "ink-lasso"); lassoPath.style.display = "none";
        gHalo = document.createElementNS(NS, "g"); gHalo.setAttribute("filter", "url(#ink-lift)");   // 올가미로 고른 획의 흰 테두리 (획 아래)
        [gHalo, gPencil, gPen, gObj, layerCur, gSel, lassoPath].forEach(function (g) { svg.appendChild(g); });
        svgMk = document.createElementNS(NS, "svg");                    // 마커 · 수채화 전용 층 — 페이지 글자와 곱하기로 섞여 글자가 비침
        svgMk.setAttribute("class", "ink-svg ink-mk");
        svgMk.setAttribute("aria-hidden", "true");
        svgMk.setAttribute("data-theme-skip", "");
        svgMk.appendChild(gMarker);
        document.body.appendChild(svgMk);
        var defsHost = document.createElement("div"); defsHost.innerHTML = ART_DEFS; document.body.appendChild(defsHost.firstChild);
        document.body.appendChild(svg);
        objLayer = document.createElement("div");
        objLayer.className = "ink-objs";
        objLayer.setAttribute("data-theme-skip", "");
        document.body.appendChild(objLayer);

        // 위: 필기(마크업) 켜기 · 끄기 — 미리보기 위 막대의 ⓐ 버튼 (켜면 파란 동그라미)
        mkBtn = button("ink-mk ink-ui ink-glass", icon("markup"), "필기 (마크업) 켜기 · 끄기", function () { setOff(!P.off); });
        document.body.appendChild(mkBtn);

        dock = el("div", "ink-dock ink-ui ink-glass");
        dock.setAttribute("role", "toolbar"); dock.setAttribute("aria-label", "필기 도구");
        var grab = el("div", "ink-grab"); grab.title = "끌어서 옮기기 · 모서리로 끌면 작게";
        dock.appendChild(grab);
        B.undo = button("ink-cb", icon("undo"), "실행 취소 (⌘Z)", doUndo);
        B.redo = button("ink-cb", icon("redo"), "실행 복귀 (⇧⌘Z)", doRedo);
        var ur = el("div", "ink-ur"); ur.appendChild(B.undo); ur.appendChild(B.redo); dock.appendChild(ur);
        var tools = el("div", "ink-tools");
        BAR.forEach(function (t) {
            B[t] = button("ink-tool", "", t === "ruler" ? "자" : NAMES[t] + (t === "lasso" ? "" : " — 한 번 더 누르면 설정"), function () {
                if (t === "ruler") { P.ruler = !P.ruler; savePrefs(); placeRuler(); syncUI(); return; }
                if (P.tool === t && t !== "lasso") togglePop("tool");
                else { P.tool = t; if (INK.indexOf(t) >= 0) P.lastDraw = t; savePrefs(); closePop(); syncUI(); }
                if (t !== "lasso" && sel.length) { sel = []; drawSelection(); }
            });
            tools.appendChild(B[t]);
        });
        dock.appendChild(tools);
        B.cols = el("div", "ink-cols");
        QUICK.forEach(function (c) {
            var b = button("ink-qc", "", c === "auto" ? "검정" : c, function () { pickColor(c, false, true); });
            b.setAttribute("data-c", c);
            B.cols.appendChild(b);
        });
        B.wheel = button("ink-qc wheel", "", "색상", function () { togglePop("color"); });
        B.cols.appendChild(B.wheel);
        dock.appendChild(B.cols);
        B.cw = button("ink-qc wheel ink-cw", "", "색상", function () { togglePop("color"); });   // 좁은 화면: 색 격자 대신 색상환 하나
        dock.appendChild(B.cw);
        var pm = el("div", "ink-pm");
        B.plus = button("ink-cb", icon("plus"), "추가", function () { togglePop("plus"); });
        B.more = button("ink-cb", icon("more"), "더 보기", function () { togglePop("more"); });
        pm.appendChild(B.plus); pm.appendChild(B.more);
        dock.appendChild(pm);
        document.body.appendChild(dock);
        dockDrag(grab);

        fab = el("div", "ink-fab ink-ui ink-glass");
        fab.setAttribute("role", "button"); fab.title = "필기 도구 펼치기"; fab.setAttribute("aria-label", "필기 도구 펼치기");
        document.body.appendChild(fab);
        fabDrag();

        pop = el("div", "ink-pop ink-ui ink-glass");
        document.body.appendChild(pop);

        selBar = el("div", "ink-selbar ink-ui");
        document.body.appendChild(selBar);
        buildRuler();
    }
    function nearCorner(x, y) {                                // 화면 모서리 가까이면 그 모서리 (최소화)
        var W = innerWidth, H = innerHeight, m = 150;
        var l = x < m, r = x > W - m, t = y < m + 40, b = y > H - m;
        return (t && l) ? "tl" : (t && r) ? "tr" : (b && l) ? "bl" : (b && r) ? "br" : null;
    }
    function dockDrag(grab) {                                  // 손잡이(또는 빈 곳)를 끌어 위 · 아래에 붙이기 · 모서리로 끌면 동그라미로 작게
        var st = null;
        function down(e) {
            if (e.target !== grab && (e.target !== dock)) return;
            e.preventDefault(); cap(dock, e);
            var r = dock.getBoundingClientRect();
            st = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, moved: false };
        }
        dock.addEventListener("pointerdown", down);
        dock.addEventListener("pointermove", function (e) {
            if (!st) return;
            var dx = e.clientX - st.x, dy = e.clientY - st.y;
            if (!st.moved && Math.hypot(dx, dy) < 6) return;
            if (!st.moved) closePop();
            st.moved = true;
            dock.classList.add("dragging");
            dock.style.cssText = "left:" + (st.l + dx) + "px;top:" + (st.t + dy) + "px;bottom:auto;transform:none";
        });
        function end(e) {
            if (!st) return;
            var moved = st.moved; st = null;
            dock.classList.remove("dragging");
            dock.style.cssText = "";
            if (!moved) return;
            var c = nearCorner(e.clientX, e.clientY);
            if (c) { P.corner = c; setOpen(false); return; }
            P.dock = e.clientY < innerHeight / 2 ? "top" : "bottom";
            savePrefs(); syncUI();
        }
        dock.addEventListener("pointerup", end);
        dock.addEventListener("pointercancel", end);
    }
    function fabDrag() {                                       // 동그라미: 누르면 펼치기 · 끌면 가까운 모서리로
        var st = null;
        fab.addEventListener("pointerdown", function (e) { e.preventDefault(); cap(fab, e); var r = fab.getBoundingClientRect(); st = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, moved: false }; });
        fab.addEventListener("pointermove", function (e) {
            if (!st) return;
            var dx = e.clientX - st.x, dy = e.clientY - st.y;
            if (!st.moved && Math.hypot(dx, dy) < 6) return;
            st.moved = true;
            fab.style.cssText = "left:" + (st.l + dx) + "px;top:" + (st.t + dy) + "px;right:auto;bottom:auto;transition:none";
        });
        function end(e) {
            if (!st) return;
            var moved = st.moved; st = null;
            fab.style.cssText = "";
            if (!moved) { setOpen(true); return; }
            var W = innerWidth, H = innerHeight;
            P.corner = (e.clientY < H / 2 ? "t" : "b") + (e.clientX < W / 2 ? "l" : "r");
            savePrefs(); syncUI();
        }
        fab.addEventListener("pointerup", end);
        fab.addEventListener("pointercancel", end);
        fab.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } });
    }

    /* ---------- 팝업 (굵기 · 색 · + · ⋯ · 펜슬 설정) ---------- */
    var popKind = "", prevEl = null, popAnchor = null;
    function closePop() { if (pop) { pop.classList.remove("show"); pop.classList.remove("menu"); } popKind = ""; }
    function togglePop(kind, anchor) {
        if (popKind === kind) { closePop(); return; }
        popKind = kind;
        pop.innerHTML = "";
        pop.className = "ink-pop ink-ui ink-glass";
        prevEl = null;
        if (kind === "tool") buildToolPop();
        else if (kind === "color") buildColorPop();
        else if (kind === "plus") buildPlusPop();
        else if (kind === "shapes") buildShapesPop();
        else if (kind === "stickers") buildStickerPop();
        else if (kind === "sigs") buildSigPop();
        else if (kind === "pencil") buildPencilPop();
        else buildMorePop();
        void pop.offsetWidth;
        pop.classList.add("show");
        popAnchor = anchor || (kind === "tool" ? B[P.tool] : kind === "color" ? (getComputedStyle(B.cols).display === "none" ? B.cw : B.wheel) : /^(plus|shapes|stickers|sigs)$/.test(kind) ? B.plus : B.more);
        placePop(popAnchor);
    }
    function placePop(anchor) {
        if (!anchor) return;
        var r = anchor.getBoundingClientRect(), d = dock.getBoundingClientRect();
        var w = pop.offsetWidth, h = pop.offsetHeight, W = innerWidth, H = innerHeight, x, y;
        x = r.left + r.width / 2 - w / 2;
        if (P.dock === "top") { y = d.bottom + 10; pop.style.transformOrigin = "50% 0"; }
        else { y = d.top - h - 10; pop.style.transformOrigin = "50% 100%"; }
        pop.style.left = Math.min(Math.max(10, x), W - w - 10) + "px";
        pop.style.top = Math.min(Math.max(10, y), H - h - 10) + "px";
    }
    function refreshPop() { var k = popKind, a = popAnchor; popKind = ""; togglePop(k, a); syncUI(); }
    function squig(w) { return '<svg viewBox="0 0 28 32" aria-hidden="true"><path d="' + SQUIG + '" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
    function opSlider(cfg, onSet) {                            // 불투명도: 체크무늬 위 색 그라데이션 + 동그란 손잡이
        var r = el("input", "ink-op"); r.type = "range"; r.min = 5; r.max = 100; r.step = 1; r.value = Math.round(cfg.o * 100);
        r.setAttribute("aria-label", "불투명도");
        r.style.setProperty("--opc", colorOf(cfg.c));
        r.addEventListener("input", function () { cfg.o = r.value / 100; savePrefs(); syncUI(); if (onSet) onSet(r.value); });
        return r;
    }
    function buildToolPop() {
        var t = P.tool, cfg = P[t];
        if (t === "eraser") {
            var seg = el("div", "ink-seg");
            [["pixel", "픽셀 지우개"], ["object", "대상 지우개"]].forEach(function (m) {
                seg.appendChild(button(cfg.mode === m[0] ? "on" : "", m[1], m[1], function () { cfg.mode = m[0]; savePrefs(); refreshPop(); }));
            });
            pop.appendChild(seg);
            if (cfg.mode === "pixel") {
                var er = el("div", "ink-erow");
                WIDTHS.eraser.forEach(function (w, i) {
                    var s = [10, 13, 17, 21, 26][i];
                    er.appendChild(button("ink-eb" + (Math.abs(cfg.w - w) < 0.01 ? " on" : ""), '<i style="width:' + s + "px;height:" + s + 'px"></i>', "크기 " + (i + 1), function () { cfg.w = w; savePrefs(); refreshPop(); }));
                });
                pop.appendChild(er);
            }
            return;
        }
        var wr = el("div", "ink-wrow");
        WIDTHS[t].forEach(function (w, i) {
            var sw = [1.4, 2.4, 3.6, 5, 6.6][i];
            wr.appendChild(button("ink-wb" + (Math.abs(cfg.w - w) < 0.01 ? " on" : ""), squig(sw), "굵기 " + (i + 1), function () { cfg.w = w; savePrefs(); refreshPop(); }));
        });
        pop.appendChild(wr);
        pop.appendChild(opSlider(cfg));
    }
    function updatePreview() {}

    /* ---------- 색상 선택기 (Apple UIColorPicker 처럼) ---------- */
    function hexOf(r, g, b) { return "#" + [r, g, b].map(function (v) { return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(""); }
    function rgbOf(hex) {
        var c = colorOf(hex), m = /^#?([0-9a-f]{6})$/i.exec(c);
        if (!m) return [255, 59, 48];
        var n = parseInt(m[1], 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function hsl(h, s, l) {
        s /= 100; l /= 100;
        var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
        var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
        return hexOf(255 * f(0), 255 * f(8), 255 * f(4));
    }
    function gridColors() {
        var out = [], i, j;
        for (i = 0; i < 12; i++) out.push(hexOf(255 - i * 23.2, 255 - i * 23.2, 255 - i * 23.2));   // 맨 윗줄: 흰색 → 검정
        var L = [16, 24, 32, 41, 50, 59, 68, 77, 86];
        for (j = 0; j < 9; j++) for (i = 0; i < 12; i++) out.push(hsl(GRID_HUES[i], j < 2 ? 85 : 95, L[j]));
        return out;
    }
    function buildColorPop() {
        var t = P.lastDraw, cfg = P[t];
        pop.classList.add("ink-cp");
        var head = el("div", "ink-cphead");
        head.appendChild(button("ink-cpx" + (picking ? " on" : ""), icon("drop"), "스포이드", function () {
            picking = true; root.classList.add("ink-picking"); closePop(); toast("가져올 색의 필기를 누르세요");
        }));
        head.appendChild(el("b", "", "색상"));
        head.appendChild(el("span"));
        pop.appendChild(head);
        var seg = el("div", "ink-seg");
        [["grid", "격자"], ["spec", "스펙트럼"], ["slider", "슬라이더"]].forEach(function (m) {
            seg.appendChild(button(P.cpTab === m[0] ? "on" : "", m[1], m[1], function () { P.cpTab = m[0]; savePrefs(); refreshPop(); }));
        });
        pop.appendChild(seg);
        var curHex = colorOf(cfg.c).toLowerCase();
        if (P.cpTab === "grid") {
            var g = el("div", "ink-grid");
            gridColors().forEach(function (c) {
                var b = button(c.toLowerCase() === curHex ? "on" : "", "", c, function () { pickColor(c, true); });
                b.style.background = c;
                g.appendChild(b);
            });
            pop.appendChild(g);
        } else if (P.cpTab === "spec") {
            var cv = el("canvas", "ink-spec"); cv.width = 300; cv.height = 220;
            pop.appendChild(cv);
            var cx = cv.getContext("2d");
            for (var x = 0; x < 300; x++) {
                var gr = cx.createLinearGradient(0, 0, 0, 220), h = x / 300 * 360;
                gr.addColorStop(0, hsl(h, 100, 94)); gr.addColorStop(0.5, hsl(h, 100, 50)); gr.addColorStop(1, hsl(h, 100, 8));
                cx.fillStyle = gr; cx.fillRect(x, 0, 1, 220);
            }
            var pick = function (e) {
                var r = cv.getBoundingClientRect(), px = Math.max(0, Math.min(299, (e.clientX - r.left) / r.width * 300)), py = Math.max(0, Math.min(219, (e.clientY - r.top) / r.height * 220));
                var d = cx.getImageData(px | 0, py | 0, 1, 1).data;
                pickColor(hexOf(d[0], d[1], d[2]), true, false, true);
            };
            var down = false;
            cv.addEventListener("pointerdown", function (e) { down = true; cap(cv, e); pick(e); });
            cv.addEventListener("pointermove", function (e) { if (down) pick(e); });
            cv.addEventListener("pointerup", function () { down = false; refreshPop(); });
        } else {
            var rgb = rgbOf(cfg.c), box = el("div", "ink-rgb");
            ["빨간색", "초록색", "파란색"].forEach(function (n, i) {
                box.appendChild(el("label", "", n));
                var r = el("input"); r.type = "range"; r.min = 0; r.max = 255; r.value = rgb[i];
                var num = el("input", "ink-num"); num.type = "number"; num.min = 0; num.max = 255; num.value = rgb[i];
                var on = function (v) { rgb[i] = +v; r.value = num.value = v; hx.value = hexOf(rgb[0], rgb[1], rgb[2]).slice(1).toUpperCase(); pickColor(hexOf(rgb[0], rgb[1], rgb[2]), true, false, true); };
                r.addEventListener("input", function () { on(r.value); });
                num.addEventListener("change", function () { on(Math.max(0, Math.min(255, +num.value || 0))); });
                box.appendChild(r); box.appendChild(num);
            });
            box.appendChild(el("label", "", "디스플레이 P3 16진수 색상 #"));
            var hx = el("input", "ink-num"); hx.value = hexOf(rgb[0], rgb[1], rgb[2]).slice(1).toUpperCase(); hx.maxLength = 6; hx.style.gridColumn = "2";
            hx.addEventListener("change", function () { if (/^[0-9a-f]{6}$/i.test(hx.value)) pickColor("#" + hx.value.toLowerCase(), true); });
            box.appendChild(el("span")); box.appendChild(hx);
            pop.appendChild(box);
        }
        pop.appendChild(el("div", "ink-oplab", "불투명도"));
        var row = el("div", "ink-oprow"), pct = el("div", "ink-pct", Math.round(cfg.o * 100) + "%");
        row.appendChild(opSlider(cfg, function (v) { pct.textContent = v + "%"; big.querySelector("i").style.opacity = v / 100; }));
        row.appendChild(pct);
        pop.appendChild(row);
        pop.appendChild(el("div", "ink-cphr"));
        var sv = el("div", "ink-saved"), big = el("div", "ink-big", "<i></i>"), sw = el("div", "ink-sw");
        big.querySelector("i").style.cssText = "background:" + colorOf(cfg.c) + ";opacity:" + cfg.o;
        sv.appendChild(big);
        ["auto"].concat(P.saved).forEach(function (c) {
            var b = button(cfg.c === c ? "on" : "", "", c === "auto" ? "검정" : c, function () { pickColor(c, false); });
            b.style.background = colorOf(c); b.style.setProperty("--ring", colorOf(c));
            sw.appendChild(b);
        });
        sw.appendChild(button("ink-add", icon("plus"), "지금 색을 저장", function () {
            if (cfg.c !== "auto" && P.saved.indexOf(cfg.c) < 0) { P.saved = P.saved.concat([cfg.c]).slice(-15); savePrefs(); }
            refreshPop();
        }));
        sv.appendChild(sw);
        pop.appendChild(sv);
    }
    function pickColor(c, custom, quick, live) {
        var t = P.lastDraw;
        P[t].c = c;
        if (/^(eraser|lasso)$/.test(P.tool)) P.tool = t;          // 색을 고르면 그 펜으로 돌아감
        if (custom && c !== "auto") P.recent = [c].concat(P.recent.filter(function (x) { return x !== c; })).slice(0, 8);
        if (osel && osel.k !== "mag") { objSet({ c: c }); }
        else if (sel.length) selRecolor();
        savePrefs();
        if (quick || live) { syncUI(); if (popKind === "color" && !live) refreshPop(); return; }
        if (popKind === "color") refreshPop(); else syncUI();
    }

    /* ---------- + 메뉴 (스티커 · 텍스트 · 서명 · 모양 · 확대경) ---------- */
    function mi(ic, label, fn, cls) { return button("ink-mi" + (cls ? " " + cls : ""), icon(ic) + '<span class="sp">' + label + "</span>", label, fn); }
    function buildPlusPop() {
        pop.classList.add("menu");
        pop.appendChild(mi("sticker", "스티커 추가", function () { togglePop("stickers", B.plus); }));
        pop.appendChild(mi("text", "텍스트 추가", function () { closePop(); addText(); }));
        pop.appendChild(mi("sig", "서명 추가", function () { if (SIGS.length) togglePop("sigs", B.plus); else openSigPad(); }));
        pop.appendChild(mi("shape", "모양 추가", function () { togglePop("shapes", B.plus); }));
        pop.appendChild(mi("mag", "확대경 추가", function () { closePop(); addMag(); }));
        if (clip.length) { pop.appendChild(el("div", "ink-mhr")); pop.appendChild(mi("paste", "붙여넣기", function () { closePop(); doPaste(); })); }
    }
    function buildShapesPop() {
        pop.classList.add("menu");
        var g = el("div", "ink-shapes");
        [["rect", "사각형"], ["oval", "원"], ["bubble", "말풍선"], ["star", "별"], ["arrow", "화살표"], ["line", "선"]].forEach(function (s) {
            g.appendChild(button("", icon(s[0]), s[1], function () { closePop(); addShape(s[0]); }));
        });
        pop.appendChild(g);
    }
    var STICKERS = ["⭐️", "❤️", "👍", "✅", "❌", "❓", "❗️", "💡", "🔥", "📌", "✏️", "⚠️", "🎯", "📝", "⏰", "😀", "😭", "💯"];
    function buildStickerPop() {
        pop.classList.add("menu");
        var g = el("div", "ink-stk");
        STICKERS.forEach(function (s) { g.appendChild(button("", s, "스티커", function () { closePop(); addSticker(s); })); });
        pop.appendChild(g);
    }
    function addSticker(s) {                                   // 스티커 = 크게 넣은 이모지 (텍스트처럼 옮기기 · 크기)
        var c = viewCenter(), an = anchored(c.x, c.y);
        addObj({ k: "text", a: an.a, fx: an.fx, fy: an.fy, x: f1(c.x - 40 - an.ax), y: f1(c.y - 40 - an.ay), w: 84, fs: 60, c: "auto", al: "center", txt: s });
    }
    function buildSigPop() {
        pop.classList.add("menu");
        var sg = el("div", "ink-sigs");
        SIGS.forEach(function (s, i) {
            var b = button("", "", "서명 " + (i + 1) + " 넣기", function () { closePop(); addSig(s); });
            var mini = document.createElementNS(NS, "svg");
            mini.setAttribute("viewBox", "-6 -6 112 " + f1(100 * s.ar + 12));
            s.sg.forEach(function (pts) {
                var abs = []; for (var k = 0; k < pts.length; k += 3) abs.push(pts[k] * 100, pts[k + 1] * 100 * s.ar, pts[k + 2]);
                var q = document.createElementNS(NS, "path");
                q.setAttribute("d", shapeOf({ t: "pen", w: 3, pts: abs, sim: 0 }, 0, 0)); q.setAttribute("fill", colorOf("auto"));
                mini.appendChild(q);
            });
            b.appendChild(mini);
            sg.appendChild(b);
        });
        pop.appendChild(sg);
        pop.appendChild(mi("plus", "서명 추가", function () { openSigPad(); }));
        pop.appendChild(mi("trash", "서명 지우기", function () { if (confirm("저장한 서명을 모두 지울까요?")) { SIGS = []; saveSigs(); closePop(); } }, "danger"));
    }

    /* ---------- ⋯ 메뉴 (자동 최소화 · 손가락으로 그리기 · 펜슬 설정…) ---------- */
    function tog(label, key, after) {
        var b = button("ink-mi" + (P[key] ? " on" : ""), '<span class="sp">' + label + '</span><span class="ink-tog"></span>', label, function () {
            P[key] = !P[key]; savePrefs(); b.classList.toggle("on", P[key]); if (after) after(); syncUI();
        });
        b.setAttribute("role", "switch"); b.setAttribute("aria-checked", P[key] ? "true" : "false");
        return b;
    }
    function buildMorePop() {
        pop.classList.add("menu");
        pop.appendChild(tog("자동 최소화", "autoMin"));
        pop.appendChild(tog("손가락으로 그리기", "finger"));
        pop.appendChild(el("div", "ink-mhr"));
        pop.appendChild(button("ink-mi", '<span class="sp">펜슬 설정…</span>', "펜슬 설정", function () { togglePop("pencil", B.more); }));
    }
    function buildPencilPop() {                                // 사이트에만 있는 설정 (아이패드 '펜슬 설정' 자리)
        pop.classList.add("menu");
        pop.appendChild(el("div", "ink-mh", "펜슬 설정"));
        pop.appendChild(tog("마우스로 그리기 (맥)", "mouse"));
        pop.appendChild(tog("필기 숨기기", "hidden", function () { renderAll(); placeRuler(); }));
        pop.appendChild(el("div", "ink-mhr"));
        pop.appendChild(mi("trash", "이 페이지 필기 모두 지우기", function () { closePop(); doClear(); }, "danger"));
        pop.appendChild(el("p", "ink-note", "위 ⓐ 버튼으로 필기를 끄면 펜슬로 스크롤돼요 · 그리다 멈추고 꾹 → 선 · 원 · 사각형 · 손잡이를 모서리로 끌면 작게 · 필기는 이 기기 브라우저에 저장돼요"));
    }

    /* ---------- 상태 반영 ---------- */
    function syncUI() {
        if (!dock) return;
        BAR.forEach(function (t) {
            var cfg = P[t], tip = cfg && cfg.c ? colorOf(cfg.c) : "#8e8e93";
            var key = t + "|" + tip + "|" + (cfg && cfg.o) + "|" + isDark();
            if (B[t].getAttribute("data-k") !== key) { B[t].innerHTML = toolArt(t, tip, /^(marker|pencil)$/.test(t) ? cfg.o : null); B[t].setAttribute("data-k", key); }
            B[t].classList.toggle("on", t === "ruler" ? !!P.ruler : P.tool === t);
        });
        var dc = P[P.lastDraw], showSel = P.tool !== "eraser" && P.tool !== "lasso";
        B.cols.querySelectorAll(".ink-qc[data-c]").forEach(function (b) {
            var c = b.getAttribute("data-c"), cc = colorOf(c);
            b.style.background = cc; b.style.setProperty("--ring", cc);
            b.classList.toggle("on", showSel && c === dc.c);
        });
        var custom = QUICK.indexOf(dc.c) < 0;
        B.wheel.classList.toggle("on", showSel && custom); B.wheel.style.setProperty("--ring", colorOf(dc.c));
        B.cw.style.boxShadow = "inset 0 0 0 2.6px " + colorOf(dc.c) + ",inset 0 0 0 5.4px #fff";
        B.undo.disabled = !undoS.length;
        B.redo.disabled = !redoS.length;
        dock.className = "ink-dock ink-ui ink-glass d-" + (P.dock === "top" ? "top" : "bottom");
        fab.className = "ink-fab ink-ui ink-glass c-" + (/^(tl|tr|bl|br)$/.test(P.corner) ? P.corner : "bl");
        var ft = P.tool;
        var fk = ft + "|" + (P[ft] && P[ft].c) + "|" + isDark();
        if (fab.getAttribute("data-k") !== fk) { fab.innerHTML = toolArt(ft, P[ft] && P[ft].c ? colorOf(P[ft].c) : "#8e8e93", null); fab.setAttribute("data-k", fk); }
        root.classList.toggle("ink-min", !P.open);
        root.classList.toggle("ink-mkoff", !!P.off);
        root.classList.toggle("ink-finger", P.open && P.finger && !P.hidden && !P.off);
        mkBtn.classList.toggle("on", !P.off);
        mkBtn.setAttribute("aria-pressed", P.off ? "false" : "true");
        svg.style.display = P.hidden ? "none" : "";
        svgMk.style.display = P.hidden ? "none" : "";
        objLayer.style.display = P.hidden ? "none" : "";
    }
    function setOpen(v) {
        var was = P.open;
        P.open = v; savePrefs(); closePop();
        syncUI();
        if (v && !was) { dock.classList.add("enter"); void dock.offsetWidth; requestAnimationFrame(function () { dock.classList.remove("enter"); }); }
        if (!v && was) { fab.classList.remove("pop"); void fab.offsetWidth; fab.classList.add("pop"); }
    }
    function setOff(v) {                                       // 필기(마크업) 켜기 · 끄기 — 끄면 막대가 사라지고 펜슬 · 손가락 · 마우스는 스크롤 · 클릭만
        P.off = v; savePrefs(); closePop();
        if (v) {
            if (editing) endEdit();
            if (cur && cur.el && cur.el.parentNode === gMarker) gMarker.removeChild(cur.el);
            cur = null; drag = null; layerCur.innerHTML = ""; lassoPath.style.display = "none";
            root.classList.remove("ink-drawing");
            if (hoverEl) hoverEl.style.display = "none";
            if (sel.length || osel) { sel = []; osel = null; }
            if (picking) { picking = false; root.classList.remove("ink-picking"); }
        }
        renderAll(); placeRuler(); syncUI();
        if (!v) {
            var el2 = P.open ? dock : fab;
            el2.classList.add(P.open ? "enter" : "pop"); void el2.offsetWidth;
            requestAnimationFrame(function () { dock.classList.remove("enter"); });
        }
    }

    /* ===================== 시작 ===================== */
    function init() {
        if (!document.querySelector(".wrap")) return;
        buildUI();
        syncUI();
        placeRuler();
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
        document.addEventListener("toggle", relayout, true);
        window.addEventListener("resize", function () { relayout(); closePop(); placeRuler(); placeSelBar(); });
        window.addEventListener("scroll", function () { placeSelBar(); }, { passive: true });
        window.addEventListener("load", relayout);
        if (window.ResizeObserver) new ResizeObserver(relayout).observe(document.body);
        if (OPT.idAnchor && window.MutationObserver) new MutationObserver(function (ms) {   // 실제시험: 문제가 나중에 들어오거나 빠지면 다시 그림
            for (var i = 0; i < ms.length; i++) {
                var ns = Array.prototype.slice.call(ms[i].addedNodes).concat(Array.prototype.slice.call(ms[i].removedNodes));
                for (var j = 0; j < ns.length; j++) {
                    var n = ns[j];
                    if (n.nodeType === 1 && (n.matches(OPT.idAnchor) || n.querySelector(OPT.idAnchor))) { relayout(); return; }
                }
            }
        }).observe(document.body, { childList: true, subtree: true });
        new MutationObserver(function () { renderAll(); syncUI(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
        document.addEventListener("keydown", function (e) {
            var k = (e.key || "").toLowerCase();
            if (e.target && e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
            if ((e.metaKey || e.ctrlKey) && k === "z" && (undoS.length || redoS.length)) { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); }
            else if ((e.metaKey || e.ctrlKey) && k === "c" && (sel.length || osel)) { e.preventDefault(); if (sel.length) selCopy(); else objCopy(); }
            else if ((e.metaKey || e.ctrlKey) && k === "x" && sel.length) { e.preventDefault(); selCut(); }
            else if ((e.metaKey || e.ctrlKey) && k === "v" && clip.length) { e.preventDefault(); doPaste(); }
            else if (k === "escape") { if (picking) { picking = false; root.classList.remove("ink-picking"); } else if (popKind) closePop(); else if (sel.length || osel) { sel = []; osel = null; renderAll(); } }
            else if ((k === "backspace" || k === "delete") && (sel.length || osel)) { e.preventDefault(); if (sel.length) selDelete(); else objDelete(); }
        });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
