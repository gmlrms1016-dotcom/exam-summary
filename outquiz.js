/* =====================================================================
   outquiz.js  ·  언어 과목 "출력 결과 맞히기" — 코드를 읽고 실행 결과를 적으면 채점
   - <div class="oq" id="oq-…"> 한 개 = 문제 한 개
       <p class="oq-q"><span class="oq-no">1</span>제목<span class="oq-tag">주차 · 주제</span></p>
       <pre><code class="language-c">…코드…</code></pre>
       <script type="text/plain" class="oq-expect">…실제로 실행한 결과…</script>
       <div class="oq-why">…풀이…</div>          (선택) 정답 보기 때만 보임
       data-exam="출처 설명"   (선택) 교수님이 "시험문제" 라고 한 코드 → 🔥 배지와 빨간 테두리
       data-space="exact"     (선택) 칸수 문제 — 줄 안의 띄어쓰기 개수까지 채점
       data-space="strict"    (선택) 완전 일치 — 줄바꿈(\n)·빈 줄·줄 안의 띄어쓰기·마지막 줄바꿈까지 실제 출력과 같아야 정답 (줄 끝의 보이지 않는 공백만 무시)
                              oq-expect 는 "\n" + 실제 출력 + "\n" 로 적는다 (출력이 println 으로 끝나면 끝에 빈 줄이 하나 더 생김)
       data-endnl="ignore"    (선택, strict 와 같이) 맨 끝 줄바꿈(Enter)은 채점 안 함 — 실제시험: 마지막 출력은 print 라 끝에 Enter 를 칠 일이 없음
       data-table             (선택) SQL 결과 표 문제 — oq-expect 는 "열1 | 열2" 머리글 줄 + 행마다 한 줄 (칸은 " | " 로 구분, 널 값은 NULL)
                              답은 글자 칸 대신 표(기본 3 × 3 · ＋/－ 행 · 열 · Enter = 아래 칸)에 입력 → 숨긴 칸에 "칸 | 칸" 줄로 적힘 (2026-10-09)
                              예전 답(띄어쓰기 · | · 탭으로 구분 · +---+ 테두리 줄)도 표로 되살림
                              첫 줄(열 이름)은 그대로, 그다음 행들은 순서를 채점하지 않음 (투플의 무순서성 — ORDER BY 는 안 배움)
   - 답칸·버튼은 이 스크립트가 만든다
   - 채점: 줄 앞뒤 공백 · 빈 줄 무시, 줄 안의 공백·탭 여러 개는 하나로 (글자·숫자·기호·대소문자는 그대로)
   - #oq-score 에 맞힌 개수 · 틀렸거나 정답을 본 문제는 review.js "틀린 문제 복사"에 들어감 (window.__examWrong)
   사용: 과목 페이지 끝에 <script src="outquiz.js"></script>
   ===================================================================== */
(function () {
    "use strict";

    var items = [].slice.call(document.querySelectorAll(".oq"));
    if (!items.length) return;

    var css = ""
        + ".oq{border:1px solid var(--line);border-radius:12px;padding:16px;margin:16px 0;background:var(--card);}"
        + ".oq-q{font-weight:700;margin:0 0 8px;line-height:1.65;}"
        + ".oq-no{display:inline-block;min-width:26px;height:24px;line-height:24px;text-align:center;background:var(--main);color:#fff;border-radius:6px;font-size:13px;margin-right:8px;}"
        + ".oq-tag{display:inline-block;font-size:12px;font-weight:800;padding:1px 8px;border-radius:999px;background:#eaf2ec;color:var(--main);margin-left:6px;vertical-align:1px;}"
        + ".oq.oq-exam{border:2px solid #d9534f;box-shadow:0 0 0 3px rgba(217,83,79,.12);}"
        + ".oq-examtag{display:inline-block;font-size:12px;font-weight:900;padding:2px 9px;border-radius:999px;background:#d9534f;color:#fff;margin-right:8px;vertical-align:1px;}"
        + ".oq-examsrc{display:block;font-size:12.5px;font-weight:700;color:#b34727;margin:2px 0 0;}"
        + ".oq-group{margin:22px 0 4px;}"
        + ".oq-ans{display:block;width:100%;min-height:74px;resize:vertical;box-sizing:border-box;font-family:Consolas,\"D2Coding\",Menlo,monospace;"
        + "font-size:14px;line-height:1.6;background:#fbfdfb;color:var(--ink,#222);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-top:10px;}"
        + ".oq-btns{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0;}"
        + ".oq-btns button{font:inherit;font-size:14px;font-weight:800;border:none;border-radius:8px;padding:9px 16px;cursor:pointer;}"
        + ".oq-check{background:var(--main);color:#fff;}"
        + ".oq-show,.oq-clear{background:#eaf2ec;color:var(--main);}"
        + ".oq-result{margin-top:10px;}"
        + ".oq-sum{font-weight:800;margin:6px 0;}"
        + ".oq-sum.ok{color:#1e7b45;}"
        + ".oq-sum.no{color:#c0392b;}"
        + ".oq-mine{margin:6px 0 0;font-family:Consolas,\"D2Coding\",Menlo,monospace;font-size:13.5px;line-height:1.7;white-space:pre-wrap;word-break:break-all;}"
        + ".oq-mine .l-ok{color:#1e7b45;}"
        + ".oq-mine .l-no{color:#c0392b;font-weight:700;}"
        + ".oq-key{margin-top:10px;}"
        + ".oq-key pre.io::before{content:\"✅ 실제 실행 결과\";}"
        + ".oq-why{margin:8px 0 0;line-height:1.7;}"
        + ".oq-tblwrap{overflow-x:auto;max-width:100%;margin-top:4px;}"
        + ".oq-key .oq-tblwrap::before{content:\"✅ 실제 실행 결과\";display:block;font-size:12.5px;font-weight:800;margin-bottom:4px;}"
        + ".oq-tbl{border-collapse:collapse;width:auto;margin:0;font-size:13.5px;background:var(--card);}"
        + ".oq-tbl th,.oq-tbl td{border:1px solid var(--line);padding:5px 10px;text-align:left;white-space:nowrap;}"
        + ".oq-tbl th{background:#eaf2ec;}"
        + ".oq-tbl .oq-null{color:#9aa69c;font-style:italic;font-size:12px;}"
        + "#oq-score{font-weight:800;margin:6px 0 2px;}";
    css += ".oq-nl{color:#9aa69c;font-size:12px;margin-left:2px;}"
        + ".oq-sp{background:rgba(217,83,79,.18);border-radius:3px;}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function lines(s, exact, table) {
        return String(s || "").replace(/\r/g, "").split("\n").map(function (l) {
            if (table) return /^[\s+\-=|:]*$/.test(l) ? "" : l.replace(/[|\t]/g, " ").replace(/\s+/g, " ").trim();   // +---+ 테두리 줄은 빼고, 칸 구분은 띄어쓰기로
            l = l.replace(/\t/g, " ");
            return exact ? l.replace(/\s+$/, "") : l.replace(/\s+/g, " ").trim();
        }).filter(function (l) { return l.trim() !== ""; });
    }
    function showSp(l) {                 // 줄 끝 공백을 눈에 보이게
        var m = /( +)$/.exec(l);
        return m ? esc(l.slice(0, -m[1].length)) + '<span class="oq-sp">' + m[1].replace(/ /g, "&nbsp;") + "</span>" : esc(l);
    }
    function showNl(raw) {               // 정답 보기: 줄마다 ⏎ (마지막 줄바꿈 유무까지)
        return raw.split("\n").map(function (l, i, a) { return i === a.length - 1 ? showSp(l) : showSp(l) + '<span class="oq-nl">⏎</span>'; }).join("\n");
    }
    function tableHtml(raw) {          // "열1 | 열2" 줄들 → 표
        var rows = raw.split("\n").filter(function (l) { return l.trim(); }).map(function (l) { return l.split("|").map(function (c) { return c.trim(); }); });
        return '<div class="oq-tblwrap"><table class="oq-tbl">' + rows.map(function (r, i) {
            return "<tr>" + r.map(function (c) {
                var v = i && c === "NULL" ? '<span class="oq-null">NULL</span>' : esc(c);
                return i ? "<td>" + v + "</td>" : "<th>" + v + "</th>";
            }).join("") + "</tr>";
        }).join("") + "</table></div>";
    }

    // ---- SQL 결과 표 입력 — 2026-10-09 사용자: '입력창 말고 표에 입력 · 3×3 기본 · 행 · 열을 늘리고 줄이기 · 확인' ----
    //  진짜 답은 숨긴 textarea(.oq-ans) — 표를 고칠 때마다 "열1 | 열2" 줄로 적어 둠 → 채점 · 이 기기 저장 · 실제시험 저장 · 복원은 예전 그대로
    //  누가 ta.value 를 바꾸면(저장된 답 되살리기 · 지우기) 표도 그 값으로 다시 그림 · 남는 빈 행 · 열은 답에 넣지 않음
    css += ".oq{position:relative;}"
        + ".oq-ans.oq-ans-src{position:absolute!important;left:0;top:0;width:1px!important;height:1px!important;min-height:0!important;padding:0!important;margin:0!important;border:0!important;opacity:0;pointer-events:none;overflow:hidden;resize:none;}"
        + ".oq-grid{margin-top:10px;}"
        + ".oq-gwrap{overflow-x:auto;max-width:100%;padding-bottom:2px;}"
        + ".oq-gtbl{border-collapse:collapse;margin:0;width:auto;}"
        + ".oq-gtbl td{border:1px solid var(--line);padding:0;background:var(--card);}"
        + ".oq-gtbl td.h{background:rgba(127,127,127,.14);}"
        + ".oq-cell{display:block;width:7.5em;box-sizing:border-box;border:0;margin:0;background:transparent;color:var(--ink,#222);font-family:Consolas,\"D2Coding\",Menlo,monospace;font-size:16px;padding:8px 10px;outline:none;}"   /* 16px 밑이면 아이폰이 누를 때 확대 */
        + "@media (max-width:480px){.oq-cell{width:5.4em;padding:8px 8px;}}"   /* 폰: 기본 3열이 스크롤 없이 들어가게 */
        + ".oq-gtbl td.h .oq-cell{font-weight:800;}"
        + ".oq-cell:focus{box-shadow:inset 0 0 0 2px var(--main);}"
        + ".oq-gbtns{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;}"
        + ".oq-gbtns button{font:inherit;font-size:14px;font-weight:800;padding:5px 11px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--main);cursor:pointer;}"
        + ".oq-gbtns button:disabled{opacity:.4;cursor:default;}"
        + ".oq-gsize{font-size:12.5px;opacity:.7;margin-left:4px;}"
        + ".oq-ghelp{font-size:12.5px;opacity:.75;margin:6px 0 0;line-height:1.6;}";
    st.textContent = css;
    var NATIVE = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
    var MAXR = 30, MAXC = 12;
    function parseTable(v) {           // "열1 | 열2" 줄들(또는 예전에 띄어쓰기 · 탭으로 쓴 답 · MySQL 의 | a | b | 모양) → [[칸…]…]
        return String(v || "").replace(/\r/g, "").split("\n")
            .filter(function (l) { return !/^[\s+\-=|:]*$/.test(l); })    // 빈 줄 · +---+ 테두리 줄은 빼고
            .map(function (l) {
                if (/^\|.*\|$/.test(l)) l = l.slice(1, -1);                // | a | b | → a | b
                return /[|\t]/.test(l) ? l.split(/[|\t]/).map(function (c) { return c.trim(); }) : l.trim().split(/\s+/);
            });
    }
    function serialize(M) {            // 표 → 답 (글자가 있는 마지막 행 · 열까지만 · 칸은 " | ")
        var lastR = -1, lastC = -1;
        M.forEach(function (row, r) { row.forEach(function (x, c) { if (x.trim()) { lastR = Math.max(lastR, r); lastC = Math.max(lastC, c); } }); });
        if (lastR < 0) return "";
        return M.slice(0, lastR + 1).map(function (row) { return row.slice(0, lastC + 1).map(function (x) { return x.trim(); }).join(" | "); }).join("\n");
    }
    function tableGrid(ta, title) {
        var M = [], busy = false;
        var wrap = document.createElement("div");
        wrap.className = "oq-grid";
        wrap.innerHTML = '<div class="oq-gwrap"><table class="oq-gtbl"></table></div>'
            + '<div class="oq-gbtns"><button type="button" data-g="r+">＋ 행</button><button type="button" data-g="r-">－ 행</button>'
            + '<button type="button" data-g="c+">＋ 열</button><button type="button" data-g="c-">－ 열</button><span class="oq-gsize"></span></div>'
            + '<p class="oq-ghelp">첫 줄 = <b>열 이름</b> · 그다음 한 줄 = 한 행 · 널 값은 <b>NULL</b> · 행 순서는 채점 안 함 · 남는 빈 칸은 상관없음 · Enter = 아래 칸</p>';
        ta.parentNode.insertBefore(wrap, ta);
        ta.classList.add("oq-ans-src");
        ta.setAttribute("aria-hidden", "true");
        ta.tabIndex = -1;
        var tbl = wrap.querySelector(".oq-gtbl"), size = wrap.querySelector(".oq-gsize"), btn = {};
        [].forEach.call(wrap.querySelectorAll("[data-g]"), function (b) { btn[b.dataset.g] = b; });
        var at = function (s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); };
        function emptyRow(C) { var a = []; for (var c = 0; c < C; c++) a.push(""); return a; }
        function cell(r, c) { return tbl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]'); }
        function draw(focus) {
            tbl.innerHTML = M.map(function (row, r) {
                return "<tr>" + row.map(function (v, c) {
                    return "<td" + (r ? "" : ' class="h"') + '><input class="oq-cell" data-r="' + r + '" data-c="' + c + '" value="' + at(v) + '"'
                        + (r ? "" : ' placeholder="열 이름"') + ' spellcheck="false" autocomplete="off" autocapitalize="off"'
                        + ' aria-label="' + at(title) + " — " + (r ? r + "행 " : "열 이름 ") + (c + 1) + '열"></td>';
                }).join("") + "</tr>";
            }).join("");
            var R = M.length, C = M[0].length;
            size.textContent = "열 " + C + " × 행 " + (R - 1) + " (+ 열 이름 줄)";
            btn["r+"].disabled = R >= MAXR; btn["r-"].disabled = R <= 1; btn["c+"].disabled = C >= MAXC; btn["c-"].disabled = C <= 1;
            if (focus) { var f = cell(focus[0], focus[1]); if (f) f.focus(); }
        }
        function write() {             // 표 → 숨긴 칸 → input 이벤트 (이 기기 저장 · 실제시험 서버 저장이 이 이벤트를 들음)
            busy = true; NATIVE.set.call(ta, serialize(M)); busy = false;
            ta.dispatchEvent(new Event("input", { bubbles: true }));
        }
        function load(v) {             // 숨긴 칸 → 표 (작으면 3 × 3)
            var rows = parseTable(v), C = 3;
            rows.forEach(function (r) { C = Math.max(C, r.length); });
            M = [];
            for (var r = 0; r < Math.max(3, rows.length); r++) M.push(emptyRow(Math.min(C, MAXC)));
            rows.forEach(function (row, r) { row.forEach(function (x, c) { if (c < MAXC) M[r][c] = x; }); });
            draw();
        }
        Object.defineProperty(ta, "value", {
            configurable: true,
            get: function () { return NATIVE.get.call(ta); },
            set: function (v) { NATIVE.set.call(ta, v); if (!busy) load(v); }
        });
        ta.addEventListener("focus", function () { var f = cell(0, 0); if (f) f.focus(); });   // 번호판에서 문제로 가면 첫 칸에
        tbl.addEventListener("input", function (e) {
            var t = e.target;
            if (!t.classList.contains("oq-cell")) return;
            e.stopPropagation();       // 칸의 input 대신 숨긴 칸의 input 하나만 위로 (저장이 두 번 되지 않게)
            M[+t.dataset.r][+t.dataset.c] = t.value;
            write();
        });
        tbl.addEventListener("keydown", function (e) {
            var t = e.target;
            if (!t.classList.contains("oq-cell") || e.key !== "Enter" || e.isComposing || e.keyCode === 229) return;   // 한글 조합 중 Enter 는 그대로
            e.preventDefault();
            var r = +t.dataset.r, c = +t.dataset.c;
            if (e.shiftKey) { if (r > 0) cell(r - 1, c).focus(); return; }
            if (r < M.length - 1) { cell(r + 1, c).focus(); return; }
            if (M.length >= MAXR) return;
            M.push(emptyRow(M[0].length)); draw([r + 1, c]); write();   // 마지막 줄에서 Enter = 행 하나 더
        });
        wrap.querySelector(".oq-gbtns").addEventListener("click", function (e) {
            var b = e.target.closest("[data-g]");
            if (!b || b.disabled) return;
            var g = b.dataset.g, R = M.length, C = M[0].length;
            var lost = g === "r-" ? M[R - 1].some(function (x) { return x.trim(); })
                     : g === "c-" ? M.some(function (row) { return row[C - 1].trim(); }) : false;
            if (lost && !window.confirm(g === "r-" ? "마지막 행에 쓴 글자도 지워져요. 행을 줄일까요?" : "마지막 열에 쓴 글자도 지워져요. 열을 줄일까요?")) return;
            if (g === "r+") M.push(emptyRow(C));
            else if (g === "r-") M.pop();
            else if (g === "c+") M.forEach(function (row) { row.push(""); });
            else if (g === "c-") M.forEach(function (row) { row.pop(); });
            draw(); write();
        });
        load("");
    }

    var scoreEl = document.getElementById("oq-score");
    function updateScore() {
        if (!scoreEl) return;
        var ok = items.filter(function (p) { return p.dataset.solved === "1"; }).length;
        var ex = items.filter(function (p) { return p.dataset.exam; });
        var exOk = ex.filter(function (p) { return p.dataset.solved === "1"; }).length;
        scoreEl.textContent = "🖥️ 맞힌 문제 — " + ok + " / " + items.length + (ex.length ? " · 🔥 시험문제 " + exOk + " / " + ex.length : "");
    }
    window.__examWrong = window.__examWrong || {};

    items.forEach(function (p) {
        var expEl = p.querySelector(".oq-expect");
        if (!expEl) return;
        var raw = expEl.textContent.replace(/^\n/, "").replace(/\n$/, "");
        var strict = p.dataset.space === "strict";
        var endFree = strict && p.dataset.endnl === "ignore";
        var exact = p.dataset.space === "exact";
        var table = p.hasAttribute("data-table");
        var expect = lines(raw, exact, table);
        var why = p.querySelector(".oq-why");
        if (why) why.remove();
        var q = p.querySelector(".oq-q");
        var title = q ? q.textContent.replace(/^\s*\d+/, "").trim() : "";
        var codeEl = p.querySelector("pre code");
        var code = codeEl ? codeEl.textContent : "";

        if (p.dataset.exam) {
            p.classList.add("oq-exam");
            q.insertAdjacentHTML("afterbegin", '<span class="oq-examtag">🔥 시험문제</span>');
            q.insertAdjacentHTML("beforeend", '<span class="oq-examsrc">📌 ' + esc(p.dataset.exam) + "</span>");
        }

        var ta = document.createElement("textarea");
        ta.className = "oq-ans";
        ta.rows = Math.min(Math.max(strict ? raw.split("\n").length : expect.length, 2), 12);
        ta.spellcheck = false;
        ta.setAttribute("autocomplete", "off");
        ta.setAttribute("autocapitalize", "off");
        ta.setAttribute("aria-label", title + " — 실행 결과 입력");
        ta.placeholder = endFree ? "실행 결과를 그대로 입력 — 줄바꿈(\\n · println)마다 Enter · 줄 안의 띄어쓰기 개수까지 정확히 채점해요 (맨 끝 Enter 는 상관없음 · 정답은 하나)"
                       : strict ? "실행 결과를 그대로 입력 — 줄바꿈(\\n · println)마다 Enter, 마지막 줄바꿈까지 · 줄 안의 띄어쓰기 개수까지 정확히 채점해요 (정답은 하나)"
                       : table ? "결과 표를 입력 — 첫 줄은 열 이름, 그다음 한 줄에 한 행 · 칸은 띄어쓰기나 | 로 구분 · 널 값은 NULL (행 순서는 채점 안 함)"
                       : exact ? "실행 결과를 그대로 입력 — 줄마다 Enter · 이 문제는 띄어쓰기 개수까지 채점해요"
                               : "실행 결과를 그대로 입력 — 줄마다 Enter (띄어쓰기 개수·빈 줄은 채점에서 무시)";
        var btns = document.createElement("div");
        btns.className = "oq-btns";
        btns.innerHTML = '<button class="oq-check" type="button">확인</button><button class="oq-show" type="button">💡 정답 보기</button><button class="oq-clear" type="button">지우기</button>';
        var box = document.createElement("div");
        box.className = "oq-result";
        expEl.parentNode.insertBefore(ta, expEl);
        expEl.parentNode.insertBefore(btns, expEl);
        expEl.parentNode.insertBefore(box, expEl);

        var key = "oq:" + location.pathname + ":" + (p.id || "");
        if (table) tableGrid(ta, title);       // SQL 결과 표: 글자 칸 대신 표에 입력 (답은 숨긴 칸에 "열1 | 열2" 줄로 — 채점 · 저장은 그대로)
        try { var saved = localStorage.getItem(key); if (saved) ta.value = saved; } catch (e) { }
        ta.addEventListener("input", function () { try { localStorage.setItem(key, ta.value); } catch (e) { } });

        function markWrong() {
            if (p.dataset.solved === "1") return;
            p.dataset.wrong = "1";
            window.__examWrong[p.id] = { no: "", q: "[출력 결과 맞히기] " + title + "\n" + code.trim(), opts: [], ans: "실행 결과:\n" + raw };
        }
        function keyBox() {
            var k = document.createElement("div");
            k.className = "oq-key";
            k.innerHTML = table ? tableHtml(raw) : strict ? '<pre class="io"><code>' + showNl(raw) + "</code></pre>" : '<pre class="io"><code>' + esc(raw) + "</code></pre>";
            if (why) k.appendChild(why);
            return k;
        }

        btns.querySelector(".oq-check").addEventListener("click", function () {
            if (strict) { checkStrict(); return; }
            var mine = lines(ta.value, exact, table);
            if (!mine.length) { box.innerHTML = '<p class="oq-sum no">실행 결과를 적고 확인을 누르세요.</p>'; return; }
            var good = 0, html = [], pool = expect.slice(1);
            mine.forEach(function (l, i) {
                var at = table && i ? pool.indexOf(l) : -1;          // 표: 머리글 다음 행은 순서 상관없이 남은 행과 비교
                if (at >= 0) pool.splice(at, 1);
                var ok = table && i ? at >= 0 : l === expect[i];
                if (ok) good++;
                html.push('<span class="' + (ok ? "l-ok" : "l-no") + '">' + (ok ? "✅ " : "❌ ") + esc(l) + "</span>");
            });
            var all = good === expect.length && mine.length === expect.length;
            var msg;
            if (all) msg = '<p class="oq-sum ok">🎉 정답! ' + expect.length + "줄 모두 맞았어요.</p>";
            else {
                msg = '<p class="oq-sum no">' + good + " / " + expect.length + " 줄 맞음";
                if (mine.length < expect.length) msg += " — 줄이 모자라요 (결과는 " + expect.length + "줄)";
                else if (mine.length > expect.length) msg += " — 줄이 너무 많아요 (결과는 " + expect.length + "줄)";
                msg += "</p>";
            }
            box.innerHTML = msg + '<div class="oq-mine">' + html.join("\n") + "</div>";
            if (all) { p.dataset.solved = "1"; p.dataset.wrong = ""; delete window.__examWrong[p.id]; }
            else markWrong();
            updateScore();
        });
        function checkStrict() {
            var rtrim = function (t) { return t.split("\n").map(function (l) { return l.replace(/[ \t]+$/, ""); }).join("\n"); };
            var mineRaw = rtrim(ta.value.replace(/\r/g, "")), rawT = rtrim(raw);
            if (endFree) { mineRaw = mineRaw.replace(/\n+$/, ""); rawT = rawT.replace(/\n+$/, ""); }
            if (!mineRaw.trim()) { box.innerHTML = '<p class="oq-sum no">실행 결과를 적고 확인을 누르세요.</p>'; return; }
            var all = mineRaw === rawT;
            var want = rawT.split("\n"), got = mineRaw.split("\n"), html = [], good = 0;
            var n = Math.max(want.length, got.length);
            for (var i = 0; i < n; i++) {
                if (i >= got.length) break;
                var ok = got[i] === want[i];
                if (ok && i < want.length) good++;
                var last = i === got.length - 1;
                if (last && got[i] === "" && !ok) continue;
                html.push('<span class="' + (ok ? "l-ok" : "l-no") + '">' + (ok ? "✅ " : "❌ ") + showSp(got[i]) + (last ? "" : '<span class="oq-nl">⏎</span>') + "</span>");
            }
            var msg;
            if (all) msg = '<p class="oq-sum ok">🎉 정답! 줄바꿈 · 띄어쓰기까지 실제 출력과 똑같아요.</p>';
            else {
                var endWant = /\n$/.test(rawT), endGot = /\n$/.test(mineRaw);
                var why = [];
                if (want.length !== got.length) why.push("줄 수가 달라요 (Enter 개수 확인)");
                if (endWant && !endGot) why.push("마지막 줄 뒤 줄바꿈이 빠졌어요 — 마지막 출력에 \\n(println)이 있거나 입력하고 Enter 를 쳤으면 Enter 까지");
                if (!endWant && endGot) why.push("마지막 줄 뒤에는 줄바꿈이 없어요 — 마지막 출력에 \\n 이 없는지(print) 확인");
                if (!why.length) why.push("글자나 띄어쓰기가 달라요");
                msg = '<p class="oq-sum no">❌ 오답 — ' + why.join(" · ") + "</p>";
            }
            box.innerHTML = msg + '<div class="oq-mine">' + html.join("\n") + "</div>";
            if (all) { p.dataset.solved = "1"; p.dataset.wrong = ""; delete window.__examWrong[p.id]; }
            else { p.dataset.solved = ""; markWrong(); }
            updateScore();
        }
        btns.querySelector(".oq-show").addEventListener("click", function () {
            var open = box.querySelector(".oq-key");
            if (open) { open.remove(); return; }
            box.appendChild(keyBox());
            markWrong();
        });
        btns.querySelector(".oq-clear").addEventListener("click", function () {
            ta.value = ""; box.innerHTML = ""; p.dataset.solved = "";
            ta.dispatchEvent(new Event("input", { bubbles: true }));   // 실제시험 서버 저장에도 지운 것으로
            try { localStorage.removeItem(key); } catch (e) { }
            updateScore();
        });
        if (/[?&]done=1/.test(location.search)) box.appendChild(keyBox());   // 시험 끝나면 정답 공개
    });
    updateScore();
})();
