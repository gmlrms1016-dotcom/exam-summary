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
   - 확인하면 줄마다 ✅/❌ — 쓴 줄과 정답 줄을 짝지어(LCS) 줄 하나를 빼먹거나 더 써도 나머지 줄은 ✅ 그대로 (2026-10-12)
     틀린 줄마다 💡 힌트: 📍 그 줄을 찍는 코드(outview.js sourcesOf) · 🔍 어디가 다른지(띄어쓰기만 · 대소문자만 · 숫자만 ·
     앞 몇 글자까지 맞음 · 두 줄을 붙여 씀 · 한 줄을 나눠 씀 · 빈 줄) · 실제시험의 📝 실제시험 방식에서는 힌트 없이 ✅/❌ 만
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
        + ".oq-sp{background:rgba(217,83,79,.18);border-radius:3px;}"
        + ".oq-ln{display:inline-block;min-width:1.7em;margin-right:6px;padding:0 4px;border-radius:4px;background:rgba(127,127,127,.15);font-size:11.5px;font-weight:800;text-align:center;}"
        + ".oq-mine .l-miss{font-style:italic;font-weight:600;opacity:.85;}"
        + ".oq-lh{margin:10px 0 0;padding:9px 12px;border:1px dashed #b8860b;border-radius:10px;background:rgba(184,134,11,.07);font-size:14px;line-height:1.7;}"
        + ".oq-lh+.oq-lh{margin-top:6px;}"
        + ".oq-lh-t{font-weight:800;margin:0;}"
        + ".oq-lh ul{margin:2px 0 0;padding-left:20px;}"
        + ".oq-lh code{font-family:Consolas,\"D2Coding\",Menlo,monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;}"
        + ".oq-lh-more{margin:6px 0 0;font-size:13px;opacity:.8;}"
        + "body.ex-live:not(.ex-hint) .oq-lh,body.ex-live:not(.ex-hint) .oq-lh-more{display:none!important;}";   // 실제시험의 📝 실제시험 방식: 힌트 없이 ✅/❌ 만
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
    function rows(s, exact) {           // 채점할 줄 + 원래 출력에서 몇 번째 줄인지(0부터 · 빈 줄 빼고) → [{t, n}]
        var out = [];
        String(s || "").replace(/\r/g, "").split("\n").forEach(function (l, n) {
            l = l.replace(/\t/g, " ");
            l = exact ? l.replace(/\s+$/, "") : l.replace(/\s+/g, " ").trim();
            if (l.trim() !== "") out.push({ t: l, n: n });
        });
        return out;
    }
    // 정답 줄(want)과 쓴 줄(got)을 LCS 로 짝지음 → [{w, g, same}] (w · g = 줄 번호, 한쪽에만 있으면 -1)
    //  같은 줄 사이에 남은 줄은 차례대로 짝지어 '틀린 줄', 남으면 '빠진 줄'(g = -1) · '더 쓴 줄'(w = -1)
    function align(want, got) {
        var n = want.length, m = got.length, L = [], i, j;
        for (i = 0; i <= n; i++) { L.push([]); for (j = 0; j <= m; j++) L[i].push(0); }
        for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = want[i] === got[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
        var ops = [], gw = [], gg = [];
        function gap() {
            for (var k = 0; k < Math.max(gw.length, gg.length); k++) ops.push({ w: k < gw.length ? gw[k] : -1, g: k < gg.length ? gg[k] : -1, same: false });
            gw = []; gg = [];
        }
        i = 0; j = 0;
        while (i < n && j < m) {
            if (want[i] === got[j]) { gap(); ops.push({ w: i, g: j, same: true }); i++; j++; }
            else if (L[i + 1][j] >= L[i][j + 1]) gw.push(i++);
            else gg.push(j++);
        }
        while (i < n) gw.push(i++);
        while (j < m) gg.push(j++);
        gap();
        return ops;
    }
    function chars(s) { return Array.from ? Array.from(s) : s.split(""); }
    function diffHint(w, g) {           // 정답 줄 w 와 쓴 줄 g 가 어디가 다른지 (정답 글자는 보여 주지 않음)
        var H = [], W = chars(w), G = chars(g), p = 0;
        while (p < W.length && p < G.length && W[p] === G[p]) p++;
        var upto = p ? "앞 " + p + "글자 <code>" + esc(G.slice(0, p).join("")) + "</code>까지는 맞아요 — " : "";
        var NUM = /-?\d+(?:\.\d+)?/g, wn = w.match(NUM) || [], gn = g.match(NUM) || [];
        if (w.replace(/\s/g, "") === g.replace(/\s/g, "")) {
            H.push("🔍 글자는 다 맞고 <b>띄어쓰기</b>만 달라요 — " + upto + "그다음 띄어쓰기를 보세요 (정답 줄의 띄어쓰기는 " + (w.match(/ /g) || []).length + "개)");
        } else if (w.toLowerCase() === g.toLowerCase()) {
            H.push("🔍 글자는 맞고 <b>대문자 · 소문자</b>만 달라요 — " + upto + "그다음 글자를 보세요");
        } else if (wn.length && wn.length === gn.length && w.replace(NUM, "#") === g.replace(NUM, "#")) {
            var bad = [];
            wn.forEach(function (x, k) { if (x !== gn[k]) bad.push(k); });
            var k = bad[0];
            H.push("🔍 글자는 다 맞고 <b>숫자</b>만 달라요 — " + (wn.length > 1 ? (k + 1) + "번째 숫자" : "숫자") + "(쓴 답 <code>" + esc(gn[k]) + "</code>)"
                + (bad.length > 1 ? " 외 " + (bad.length - 1) + "개" : "") + "를 다시 계산해 보세요");
            if (/\./.test(wn[k]) && !/\./.test(gn[k])) H.push("🔢 정답은 <b>소수점이 있는 수</b>예요 — 실수(double · float) 계산이나 출력 서식(%f)인지 확인");
            else if (!/\./.test(wn[k]) && /\./.test(gn[k])) H.push("🔢 정답은 <b>정수</b>예요 — (int) 형변환 · 정수끼리 나눗셈(/) · 정수 변수는 소수점이 없어요");
            return H;                            // 숫자만 다르면 글자 수 차이는 숫자 자릿수라 따로 안 알림
        } else {
            H.push("🔍 " + (p ? upto + "<b>" + (p + 1) + "번째 글자부터</b> 달라요" : "<b>첫 글자부터</b> 달라요"));
        }
        if (W.length !== G.length) H.push("📏 정답 줄은 <b>" + W.length + "글자</b> (띄어쓰기 포함) · 쓴 줄은 " + G.length + "글자");
        return H;
    }
    function lineBox(title, items) {
        return '<div class="oq-lh"><p class="oq-lh-t">' + title + "</p><ul>" + items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
    }
    // 쓴 답의 줄마다 ✅/❌ + 틀린 줄 힌트 · opt.no(i) = 정답 i번째 줄의 번호 글자 · opt.src(i) = 그 줄을 찍는 코드 힌트 · opt.nl(j) = 쓴 j번째 줄 뒤 표시 · opt.sp = 줄 끝 공백 표시
    function feedback(want, got, opt) {
        var ops = align(want, got), html = [], wrong = [], bad = [], extra = 0, good = 0;
        var show = function (t) { return t === "" ? '<span class="oq-nl">(빈 줄)</span>' : opt.sp ? showSp(t) : esc(t); };
        var tag = function (x) { return '<span class="oq-ln">' + x + "</span>"; };
        ops.forEach(function (o) {
            if (o.same) { good++; html.push('<span class="l-ok">✅ ' + tag(opt.no(o.w)) + show(got[o.g]) + opt.nl(o.g) + "</span>"); return; }
            if (o.g >= 0) html.push('<span class="l-no">❌ ' + tag(o.w >= 0 ? opt.no(o.w) : "+") + show(got[o.g]) + opt.nl(o.g) + "</span>");
            else html.push('<span class="l-no l-miss">❌ ' + tag(opt.no(o.w)) + "(이 줄이 빠졌어요)</span>");
            if (o.w >= 0) bad.push(opt.no(o.w)); else extra++;
            wrong.push(o);
        });
        var boxes = [], used = {};
        wrong.forEach(function (o, idx) {
            if (used[idx] || boxes.length >= 2) return;
            var nx = wrong[idx + 1], w = o.w >= 0 ? want[o.w] : null, g = o.g >= 0 ? got[o.g] : null, li = [];
            if (w !== null && g !== null && nx && nx.g < 0 && nx.w === o.w + 1 && (g === w + want[nx.w] || g === w + " " + want[nx.w])) {
                used[idx + 1] = true;            // 두 줄을 한 줄에 붙여 씀 (print ↔ println)
                li.push("✂️ " + opt.no(o.w) + "번째 줄과 " + opt.no(nx.w) + "번째 줄을 <b>한 줄에 붙여</b> 썼어요 — " + opt.no(o.w) + "번째 줄 끝에서 줄이 바뀌어요 (println · \\n)");
                var s1 = opt.src(o.w); if (s1) li.push(s1);
                boxes.push(lineBox("💡 " + opt.no(o.w) + "번째 줄 힌트", li));
                return;
            }
            if (w !== null && g !== null && nx && nx.w < 0 && nx.g === o.g + 1 && (w === g + got[nx.g] || w === g + " " + got[nx.g])) {
                used[idx + 1] = true;            // 한 줄을 두 줄로 나눠 씀
                li.push("🔗 한 줄을 <b>두 줄로 나눠</b> 썼어요 — 여기서는 줄이 바뀌지 않아요 (print 는 줄을 안 바꿔요)");
                var s2 = opt.src(o.w); if (s2) li.push(s2);
                boxes.push(lineBox("💡 " + opt.no(o.w) + "번째 줄 힌트", li));
                return;
            }
            if (w === null) {
                boxes.push(lineBox("💡 결과에 없는 줄", [g === "" ? "↩️ 여기에 <b>빈 줄</b>이 하나 더 있어요 — Enter 를 한 번 더 쳤는지 확인" : "➕ 이 줄은 실제 출력에 없어요 — 지우거나, 줄을 바꾼 곳(Enter)이 맞는지 확인해 보세요"]));
                return;
            }
            var s = opt.src(o.w); if (s) li.push(s);
            if (g === null) li.push(w === "" ? "↩️ 여기에 <b>빈 줄</b>이 있어요 — 글자 없이 줄만 바꾸는 출력(println() · \\n)을 찾아보세요" : "✏️ 이 줄을 안 썼어요 — 정답 줄은 <b>" + chars(w).length + "글자</b> (띄어쓰기 포함)");
            else if (w === "") li.push("↩️ 여기는 <b>빈 줄</b>이어야 해요 — 줄만 바뀌고 글자는 없어요");
            else li = li.concat(diffHint(w, g));
            boxes.push(lineBox("💡 " + opt.no(o.w) + "번째 줄 힌트", li));
        });
        var left = wrong.filter(function (o, idx) { return !used[idx]; }).length - boxes.length;
        if (left > 0) boxes.push('<p class="oq-lh-more">… 틀린 줄이 ' + left + "개 더 있어요 — 위 줄부터 고치고 다시 확인해 보세요</p>");
        return { good: good, bad: bad, extra: extra, html: html.join("\n"), hints: boxes.join("") };
    }
    function whereAt(n, list) {         // "2번째 줄" · "2 · 4번째 줄" + 결과에 없는 줄
        return (list.length ? list.slice(0, 4).join(" · ") + (list.length > 4 ? " …" : "") + "번째 줄을 다시 보세요" : "")
            + (n ? (list.length ? " · " : "") + "결과에 없는 줄 " + n + "개" : "");
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
        var lang = ((codeEl && /language-(\w+)/.exec(codeEl.className)) || [])[1] || (window.EX_DATA && window.EX_DATA.lang) || "";
        if (lang === "js") lang = "javascript";
        var expRows = table ? null : rows(raw, exact);
        var srcMap = null, lead = (/^\n*/.exec(code) || [""])[0].length;   // 코드 맨 앞 빈 줄은 줄 번호에서 뺌
        function srcHint(n) {            // 정답 출력의 n번째 줄(0부터)을 찍는 코드 → "📍 …" (outview.js 가 확실히 찾은 것만)
            if (!srcMap && window.OutView && window.OutView.sourcesOf && code && lang) {
                try { srcMap = window.OutView.sourcesOf(code, lang, raw) || []; } catch (e) { srcMap = []; }
            }
            var s = srcMap && srcMap[n];
            if (!s) return "";
            return "📍 이 줄을 찍는 코드: " + (s.line - lead + 1) + "번째 줄 <code>" + esc(s.src) + "</code>" + (s.many ? " 부터 (출력문 여러 개가 이어서 한 줄을 찍어요)" : "")
                + (s.nth ? " — 반복에서 <b>" + s.nth + "번째</b>로 실행될 때" : "");
        }

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
            if (!table) { checkLines(); return; }
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
        function checkLines() {          // 일반 · 칸수(exact) 문제: 빈 줄 무시 · 줄 짝짓기 + 틀린 줄 힌트
            var mineRows = rows(ta.value, exact);
            if (!mineRows.length) { box.innerHTML = '<p class="oq-sum no">실행 결과를 적고 확인을 누르세요.</p>'; return; }
            var want = expRows.map(function (r) { return r.t; }), got = mineRows.map(function (r) { return r.t; });
            var fb = feedback(want, got, { no: function (i) { return i + 1; }, src: function (i) { return srcHint(expRows[i].n); }, nl: function () { return ""; } });
            var all = fb.good === want.length && got.length === want.length;
            var msg;
            if (all) msg = '<p class="oq-sum ok">🎉 정답! ' + want.length + "줄 모두 맞았어요.</p>";
            else {
                msg = '<p class="oq-sum no">' + fb.good + " / " + want.length + " 줄 맞음";
                if (got.length < want.length) msg += " — 줄이 모자라요 (결과는 " + want.length + "줄)";
                else if (got.length > want.length) msg += " — 줄이 너무 많아요 (결과는 " + want.length + "줄)";
                var at = whereAt(fb.extra, fb.bad);
                if (at) msg += " · " + at;
                msg += "</p>";
            }
            box.innerHTML = msg + '<div class="oq-mine">' + fb.html + "</div>" + (all ? "" : fb.hints);
            if (all) { p.dataset.solved = "1"; p.dataset.wrong = ""; delete window.__examWrong[p.id]; }
            else { p.dataset.solved = ""; markWrong(); }   // 맞혔다가 답을 바꿔 틀리면 다시 틀린 것으로 (strict 와 같게)
            updateScore();
        }
        function checkStrict() {
            var rtrim = function (t) { return t.split("\n").map(function (l) { return l.replace(/[ \t]+$/, ""); }).join("\n"); };
            var mineRaw = rtrim(ta.value.replace(/\r/g, "")), rawT = rtrim(raw);
            if (endFree) { mineRaw = mineRaw.replace(/\n+$/, ""); rawT = rawT.replace(/\n+$/, ""); }
            if (!mineRaw.trim()) { box.innerHTML = '<p class="oq-sum no">실행 결과를 적고 확인을 누르세요.</p>'; return; }
            var all = mineRaw === rawT;
            var endWant = /\n$/.test(rawT), endGot = /\n$/.test(mineRaw);
            var want = rawT.split("\n"), got = mineRaw.split("\n");
            if (endWant) want.pop();             // 맨 끝 줄바꿈은 줄이 아니라 아래 안내(마지막 줄바꿈)로
            if (endGot) got.pop();
            var fb = feedback(want, got, {
                no: function (i) { return i + 1; }, src: function (i) { return srcHint(i); }, sp: true,
                nl: function (j) { return j < got.length - 1 || endGot ? '<span class="oq-nl">⏎</span>' : ""; }
            });
            var msg;
            if (all) msg = '<p class="oq-sum ok">🎉 정답! 줄바꿈 · 띄어쓰기까지 실제 출력과 똑같아요.</p>';
            else {
                var why = [];
                if (want.length !== got.length) why.push("줄 수가 달라요 (Enter 개수 확인)");
                if (endWant && !endGot) why.push("마지막 줄 뒤 줄바꿈이 빠졌어요 — 마지막 출력에 \\n(println)이 있거나 입력하고 Enter 를 쳤으면 Enter 까지");
                if (!endWant && endGot) why.push("마지막 줄 뒤에는 줄바꿈이 없어요 — 마지막 출력에 \\n 이 없는지(print) 확인");
                var at = whereAt(fb.extra, fb.bad);
                if (at) why.push(at);
                if (!why.length) why.push("글자나 띄어쓰기가 달라요");
                msg = '<p class="oq-sum no">❌ 오답 — ' + why.join(" · ") + "</p>";
            }
            box.innerHTML = msg + '<div class="oq-mine">' + fb.html + "</div>" + (all ? "" : fb.hints);
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
