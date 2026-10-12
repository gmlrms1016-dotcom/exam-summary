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
        + ".oq-lh code.c{display:block;width:fit-content;max-width:100%;box-sizing:border-box;margin:3px 0 1px;padding:2px 8px;border-radius:6px;background:rgba(127,127,127,.13);word-break:normal;overflow-wrap:anywhere;}"   /* 코드 줄은 따로 한 줄에 */
        + ".oq-lh-more{margin:6px 0 0;font-size:13px;opacity:.8;}"
        + "body.ex-live:not(.ex-hint) .oq-lh,body.ex-live:not(.ex-hint) .oq-lh-more,body.ex-live:not(.ex-hint) .oq-hx{display:none!important;}";   // 실제시험의 📝 실제시험 방식: 힌트 없이 ✅/❌ 만 (정답 줄 수 · .oq-hx 도 숨김)
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
    //  같은 자리끼리 짝지어도 맞는 줄 수(LCS)가 그대로면 같은 자리끼리 → 2번째 줄에 3번째 줄 값(3 · true 처럼 되풀이되는 값)을 써도 ❌ 2번째 줄로
    function align(want, got) {
        var n = want.length, m = got.length, L = [], i, j;
        for (i = 0; i <= n; i++) { L.push([]); for (j = 0; j <= m; j++) L[i].push(0); }
        for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = want[i] === got[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
        var ops = [], gw = [], gg = [];
        function sim(a, b) { var k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++; return k; }   // 앞에서부터 같은 글자 수
        function gap() {                // 남은 줄 수가 같으면 같은 자리끼리, 다르면 가장 닮은 줄끼리(순서 유지)
            var A = gw.length, B = gg.length, k, a, b, S = [];
            if (A === B || !A || !B) { for (k = 0; k < Math.max(A, B); k++) ops.push({ w: k < A ? gw[k] : -1, g: k < B ? gg[k] : -1, same: false }); gw = []; gg = []; return; }
            for (a = 0; a <= A; a++) { S.push([]); for (b = 0; b <= B; b++) S[a].push(0); }
            for (a = A - 1; a >= 0; a--) for (b = B - 1; b >= 0; b--) { var t = sim(want[gw[a]], got[gg[b]]) + S[a + 1][b + 1];
                S[a][b] = A - a === B - b ? t : A - a < B - b ? Math.max(t, S[a][b + 1]) : Math.max(t, S[a + 1][b]); }
            a = 0; b = 0;
            while (a < A || b < B) {
                if (a < A && b < B && S[a][b] === sim(want[gw[a]], got[gg[b]]) + S[a + 1][b + 1]) ops.push({ w: gw[a++], g: gg[b++], same: false });
                else if (a < A && (b >= B || A - a > B - b)) ops.push({ w: gw[a++], g: -1, same: false });
                else ops.push({ w: -1, g: gg[b++], same: false });
            }
            gw = []; gg = [];
        }
        i = 0; j = 0;
        while (i < n && j < m) {
            if (want[i] === got[j]) { gap(); ops.push({ w: i, g: j, same: true }); i++; j++; }
            else if (i + 1 < n && L[i + 2][j + 1] === L[i][j] && (got[j] === want[i] + want[i + 1] || got[j] === want[i] + " " + want[i + 1])) { gap(); ops.push({ w: i, g: j, same: false }, { w: i + 1, g: -1, same: false }); i += 2; j++; }   // 두 줄을 한 줄에 붙여 씀
            else if (j + 1 < m && L[i + 1][j + 2] === L[i][j] && (want[i] === got[j] + got[j + 1] || want[i] === got[j] + " " + got[j + 1])) { gap(); ops.push({ w: i, g: j, same: false }, { w: -1, g: j + 1, same: false }); i++; j += 2; }   // 한 줄을 두 줄로 나눠 씀
            else if (L[i + 1][j + 1] === L[i][j]) { gw.push(i++); gg.push(j++); }   // 바꿔 쓴 줄은 같은 자리끼리
            else if (L[i + 1][j] >= L[i][j + 1]) gw.push(i++);
            else gg.push(j++);
        }
        while (i < n) gw.push(i++);
        while (j < m) gg.push(j++);
        gap();
        return ops;
    }
    function chars(s) { return Array.from ? Array.from(s) : s.split(""); }
    // ---- 🧑‍🏫 선생님 힌트 (2026-10-12 사용자: '옆에서 선생님이 알려 주고 힌트를 주듯이 친절하게') ----
    //  정답 글자는 그대로 보여 주지 않고 → 무엇이 다른지 · 이 줄을 찍는 코드 · 그 값이 정해지는 줄 · 그 코드의 문법 한마디
    function say(lang) {                // 언어마다 줄바꿈 · 빈 줄 · 실수/정수 · 띄어쓰기 · true/false 말투
        var S = {
            java: { nl: "<code>println</code> 은 찍고 나서 줄을 바꿔요", keep: "<code>print</code> 는 줄을 바꾸지 않아서 다음 출력이 같은 줄에 이어져요",
                blank: "괄호 안이 빈 <code>System.out.println()</code> 은 줄만 바꿔요", real: "자바는 실수(double)를 <code>3.0</code> 처럼 소수점을 붙여 찍어요",
                toReal: "계산에 실수(double)가 하나라도 섞이면 결과도 실수이고, 자바는 <code>3.0</code> 처럼 소수점을 붙여 찍어요.",
                toInt: "정수끼리 계산하거나 <code>(int)</code> 로 바꾸면 소수점이 없어요.",
                bool: "<code>true</code> · <code>false</code> 는 소문자로 찍혀요", bw: /\b(?:true|false)\b/g, sp: "따옴표 안의 띄어쓰기(<code>\" \"</code>)를 한 칸씩 세어 볼까요?",
                pad0: "<code>%05d</code> 처럼 % 뒤의 <code>0</code> 은 남는 칸을 빈칸 대신 0 으로 채워요.",
                endNl: "마지막 출력이 <code>println</code> 이라서 끝에 Enter 를 한 번 더 쳐야 해요", endNo: "마지막 출력이 <code>print</code> 라서 끝의 Enter 를 지워 주세요" },
            c: { nl: "<code>\\n</code> 이 있는 곳에서 줄이 바뀌어요", keep: "<code>\\n</code> 이 없으면 다음 출력이 같은 줄에 이어져요",
                blank: "<code>printf(\"\\n\")</code> 처럼 <code>\\n</code> 만 찍으면 줄만 바뀌어요", real: "<code>%f</code> 는 소수점 아래 6자리, <code>%.1f</code> 는 1자리까지 찍어요",
                toReal: "계산에 실수(double)가 섞여야 실수가 되고, <code>%f</code> 는 소수점 아래 6자리 · <code>%.1f</code> 는 1자리까지 찍어요.",
                toInt: "정수끼리 계산하거나 <code>%d</code> 로 찍으면 소수점이 없어요.",
                bool: "C 는 참 · 거짓을 <code>1</code> · <code>0</code> 으로 찍어요", sp: "<code>printf</code> 따옴표 안의 띄어쓰기를 한 칸씩 세어 볼까요?",
                pad0: "<code>%05d</code> 처럼 % 뒤의 <code>0</code> 은 남는 칸을 빈칸 대신 0 으로 채워요.",
                endNl: "마지막 출력이 <code>\\n</code> 으로 끝나서 끝에 Enter 를 한 번 더 쳐야 해요", endNo: "마지막 출력에 <code>\\n</code> 이 없어서 끝의 Enter 를 지워 주세요" },
            python: { nl: "<code>print()</code> 는 찍고 나서 줄을 바꿔요", keep: "<code>end=</code> (<code>end=\"\"</code> · <code>end=\" \"</code>) 가 있으면 줄을 바꾸지 않고 이어서 찍어요",
                blank: "괄호 안이 빈 <code>print()</code> 는 줄만 바꿔요", real: "파이썬은 실수를 <code>2.0</code> 처럼 소수점을 붙여 찍어요",
                toReal: "파이썬은 실수가 하나라도 섞이거나 <code>/</code> 로 나누면 결과가 실수예요 (<code>4 / 2</code> → 2.0).",
                toInt: "<code>//</code>(몫) · <code>%</code> · <code>int()</code> 는 정수끼리면 정수예요 (<code>/</code> 만 늘 실수).",
                bool: "<code>True</code> · <code>False</code> 는 첫 글자가 대문자예요", bw: /\b(?:True|False)\b/g, sp: "따옴표 안 띄어쓰기와, <code>print(a, b)</code> 처럼 쉼표 사이에 저절로 들어가는 한 칸을 세어 볼까요?",
                pad0: "<code>f\"{x:05d}\"</code> · <code>\"%05d\" % x</code> 처럼 0 을 붙이면 남는 칸을 0 으로 채워요.",
                endNl: "마지막 <code>print()</code> 도 줄을 바꿔서 끝에 Enter 를 한 번 더 쳐야 해요", endNo: "마지막 출력이 <code>end=\"\"</code> 라서 끝의 Enter 를 지워 주세요" },
            javascript: { nl: "<code>console.log</code> 는 찍고 나서 줄을 바꿔요", keep: "여기서는 줄이 바뀌지 않아요",
                blank: "괄호 안이 빈 <code>console.log()</code> 는 빈 줄을 찍어요", real: "",
                toReal: "자바스크립트는 나누어떨어지지 않으면 소수점이 나와요 (<code>5 / 2</code> → 2.5).",
                toInt: "자바스크립트는 <code>3.0</code> 을 <code>3</code> 으로 찍어요 — 소수점 아래가 0 이면 안 붙어요.",
                bool: "<code>true</code> · <code>false</code> 는 소문자로 찍혀요", bw: /\b(?:true|false)\b/g, sp: "따옴표 안의 띄어쓰기(<code>\" \"</code>)를 한 칸씩 세어 볼까요?",
                endNl: "마지막 출력도 줄을 바꿔서 끝에 Enter 를 한 번 더 쳐야 해요", endNo: "끝의 Enter 를 지워 주세요" }
        };
        return S[lang] || { nl: "여기서 줄이 바뀌어요", keep: "여기서는 줄이 바뀌지 않아요", blank: "여기는 글자 없이 줄만 바뀌어요", real: "",
            toReal: "계산 결과가 실수인지 보세요.", toInt: "계산 결과가 정수인지 보세요.",
            bool: "<code>true</code> · <code>false</code> 의 대소문자는 언어마다 달라요", sp: "띄어쓰기를 한 칸씩 세어 볼까요?",
            endNl: "끝에 Enter 를 한 번 더 쳐야 해요", endNo: "끝의 Enter 를 지워 주세요" };
    }
    function diffHint(w, g, sy) {       // 정답 줄 w 와 쓴 줄 g 가 어디가 다른지 → { kind, items } (정답 글자는 보여 주지 않음)
        var W = chars(w), G = chars(g), p = 0;
        while (p < W.length && p < G.length && W[p] === G[p]) p++;
        var upto = p ? "앞의 <code>" + esc(G.slice(0, p).join("")) + "</code> 까지는 정확해요" : "", good = upto ? upto + " 👍 " : "";
        var NUM = /-?\d+(?:\.\d+)?/g, wn = w.match(NUM) || [], gn = g.match(NUM) || [];
        if (w.replace(/\s/g, "") === g.replace(/\s/g, ""))
            return { kind: "space", items: ["🔍 글자는 전부 맞았어요 👍 <b>띄어쓰기</b>만 조금 달라요. " + (upto ? upto + ". " : "") + sy.sp + ((w.match(/ /g) || []).length ? " (이 줄에는 띄어쓰기가 " + (w.match(/ /g) || []).length + "개 있어요)" : " (이 줄에는 띄어쓰기가 하나도 없어요)")] };
        if (w.toLowerCase() === g.toLowerCase())
            return { kind: "case", items: ["🔍 글자는 맞았는데 <b>대문자 · 소문자</b>가 달라요. " + (upto ? upto + ". " : "")
                + (sy.bw && (w.match(sy.bw) || []).length > (g.match(sy.bw) || []).length ? sy.bool + "." : "따옴표 안 글자는 쓴 그대로, 변수 값은 그 값 그대로 찍혀요 — 한 글자씩 비교해 볼까요?")] };   // 그 언어가 참 · 거짓을 찍는 모양(java · js true · 파이썬 True)이 정답에 있고 쓴 답에서 바뀐 때만
        var bad = [];                         // 숫자만 다른지 (숫자 자리는 쓸 수 없는 글자 \u0000 로 바꿔 비교 · 출력의 # 과 헷갈리지 않게)
        if (wn.length && wn.length === gn.length && w.replace(NUM, "\u0000") === g.replace(NUM, "\u0000")) wn.forEach(function (x, i) { if (x !== gn[i]) bad.push(i); });
        var shape = function (x) { return Number(wn[x]) === Number(gn[x]) && (wn[x].charAt(0) === "-") === (gn[x].charAt(0) === "-"); };   // 값은 같고 모양만 다름 (부호까지 같아야 · 314 ↔ 314.0 · 7 ↔ 00007)
        if (bad.length) {
            var calc = bad.filter(function (x) { return !shape(x); }), k = calc.length ? calc[0] : bad[0], more = bad.length > 1 ? " (그리고 숫자 " + (bad.length - 1) + "개 더)" : "";
            if (!calc.length) {   // 틀린 숫자가 모두 값은 같고 찍히는 모양만 다름 (3.5 ↔ 3.500000 · 314 ↔ 314.0)
                var dot = /\./.test(wn[k]), pad = /\./.test(wn[k]) === /\./.test(gn[k]) && (wn[k].split(".")[1] || "") === (gn[k].split(".")[1] || "");   // 소수점은 같고 앞자리 0 채움만 다름 (%05d)
                if (pad && /^-?0\d/.test(wn[k])) return { kind: "fmt", items: ["🔍 <code>" + esc(gn[k]) + "</code> — <b>값</b>은 맞았어요 👍 그런데 정답은 앞을 <b>0</b>으로 채워 <b>" + wn[k].replace(/^-/, "").split(".")[0].length + "자리</b>로 찍혀요" + more + ".", ].concat(sy.pad0 ? ["💬 " + sy.pad0] : []) };
                if (pad) return { kind: "fmt", items: ["🔍 <code>" + esc(gn[k]) + "</code> — <b>값</b>은 맞았어요 👍 그런데 정답은 앞에 <b>0 없이</b> 찍혀요" + more + "."] };
                return { kind: "fmt", items: ["🔍 <code>" + esc(gn[k]) + "</code> — <b>값</b>은 맞았어요 👍 그런데 찍히는 <b>모양</b>이 달라요 — 정답은 "
                    + (dot ? "소수점 아래 <b>" + wn[k].split(".")[1].length + "자리</b>까지" : "<b>소수점 없이</b>") + " 찍혀요" + more + "."].concat(dot ? (sy.real ? ["💬 " + sy.real + "."] : []) : ["💬 " + sy.toInt]) };
            }
            var re = /-?\d+(?:\.\d+)?/g, mm = null;
            for (var c = 0; c <= k; c++) mm = re.exec(g);
            var it = ["🔍 글자는 다 잘 썼어요 👍 " + (mm && mm.index ? (k === bad[0] ? "앞의 <code>" + esc(g.slice(0, mm.index)) + "</code> 까지는 정확해요. 그다음 " : "<code>" + esc(g.slice(0, mm.index)) + "</code> 다음의 ") : "")
                + "<b>숫자</b> <code>" + esc(gn[k]) + "</code>" + more + " — 이 값을 다시 계산해 볼까요? 어떻게 나왔는지 한 단계씩 따라가 봐요."];
            if (/\./.test(wn[k]) && !/\./.test(gn[k])) it.push("🔢 정답은 <b>소수점이 있는 수</b>예요. " + sy.toReal);
            else if (!/\./.test(wn[k]) && /\./.test(gn[k])) it.push("🔢 정답은 <b>소수점이 없는 수</b>예요. " + sy.toInt);
            return { kind: "num", items: it };
        }
        if (p === G.length || p === W.length) {   // 한쪽이 다른 쪽의 앞부분 (끝 글자만 모자라거나 더 씀)
            var rest = (p === G.length ? W : G).slice(p).join(""), sym = !/[0-9A-Za-z\u3131-\uD79D]/.test(rest);   // 남은 글자가 기호뿐인지 (마침표 · 느낌표)
            return { kind: sym ? "tail" : "text", items: [p === G.length
                ? "🔍 " + good + "그런데 정답 줄은 여기서 끝나지 않고 뒤에 <b>" + (W.length - p) + "글자</b>가 더 찍혀요. " + (sym ? "줄 끝에 찍히는 기호(마침표 등)를 다시 볼까요?" : "그다음에 무엇이 더 찍히는지 코드를 따라가 볼까요?")
                : "🔍 " + good + "정답 줄은 여기서 끝나요 — 뒤에 더 쓴 <b>" + (G.length - p) + "글자</b>는 찍히지 않아요. " + (sym ? "" : "왜 거기서 끝나는지 코드를 따라가 볼까요?")] };
        }
        var it2 = [p ? "🔍 " + good + "<b>" + (p + 1) + "번째 글자부터</b> 달라져요. 그 부분을 찍는 코드를 같이 따라가 볼까요?" : "🔍 <b>첫 글자부터</b> 달라요. 이 줄을 찍는 코드부터 같이 찾아볼까요?"];
        if (W.length !== G.length) it2.push("📏 정답 줄은 띄어쓰기까지 <b>" + W.length + "글자</b>예요 (쓴 줄은 " + G.length + "글자).");
        return { kind: "text", items: it2 };
    }
    function stripStr(t) { return String(t || "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""'); }
    function cutLine(l, lang) { var t = stripStr(l); return lang === "python" ? t.replace(/#.*$/, "") : t.replace(/\/\/.*$/, ""); }
    var NOTVAR = /^(System|out|err|println|printf|print|Math|String|Integer|Double|Character|Boolean|Arrays|Scanner|true|false|null|None|True|False|new|length|this|puts|putchar|console|log|int|double|float|char|long|short|byte|boolean|var|let|const|return|end|sep|str|len|range|format|toString|equals|charAt|substring|f)$/;
    function trace(lines, at, lang) {   // 출력문(at 줄)에 쓰인 변수의 값이 마지막으로 바뀌는 위쪽 줄 → [{name, line}] (최대 2개)
        var expr = cutLine(lines[at], lang), i0 = expr.indexOf("(");
        if (i0 >= 0) expr = expr.slice(i0 + 1);
        var OV = window.OutView, bf = OV && OV.branchFlags ? OV.branchFlags(lines.join("\n"), lang, true) : [];   // if · else · switch 갈래 안인지 (삼항은 빼고)
        function head(i) {              // 갈래 안의 줄 i 를 고르는 if · switch 머리 줄 (못 찾으면 -1)
            for (var k = i, d = 0; k >= 0; k--) {
                var t = cutLine(lines[k], lang);
                d += (t.match(/\}/g) || []).length - (t.match(/\{/g) || []).length;
                if ((k === i || d < 0) && /^\s*(\}\s*)?(else\s+)?(if|switch)\b/.test(t)) return k;
            }
            return -1;
        }
        var seen = {}, out = [];
        (expr.match(/[A-Za-z_]\w*/g) || []).forEach(function (n) {
            if (seen[n] || NOTVAR.test(n) || out.length >= 2) return;
            seen[n] = 1;
            var re = new RegExp("(^|[^\\w.])(" + n + "(?:\\s*\\.\\s*\\w+|\\s*\\[[^\\]]*\\])*)\\s*(?:[-+*/%&|^]|<<|>>)?=(?!=)|(?:\\+\\+|--)\\s*" + n + "\\b|\\b" + n + "\\s*(?:\\+\\+|--)");
            var fld = {};
            for (var i = at - 1; i >= 0 && out.length < 2; i--) {
                var mm = re.exec(cutLine(lines[i], lang));
                if (!mm) continue;
                var lhs = (mm[2] || n).replace(/\s+/g, ""), hd = bf[i] && !bf[at] ? head(i) : -2;   // 출력문은 갈래 밖인데 이 줄은 갈래 안(case · else …) → 그 줄 대신 갈래를 고르는 if · switch 줄
                var v = hd === -2 ? { name: lhs, line: i } : hd >= 0 ? { name: lhs, line: hd, cond: true } : null;
                if (/^\w+\./.test(lhs)) { if (!fld[lhs] && v) out.push(v); fld[lhs] = 1; continue; }   // 필드(b.radius =)는 필드마다 가장 가까운 줄 — 더 위로
                if (v) out.push(v);
                break;                                          // 변수 자체(n = · n[i] =)를 바꾼 줄에서 멈춤
            }
        });
        return out;
    }
    function concepts(t, raw, lang) {   // 그 줄 · 그 값을 정한 줄의 코드에 보이는 문법 → 선생님 한마디 (최대 2개)
        var cj = lang === "java" || lang === "c", L = [];
        // ++ · -- 는 값으로 쓰일 때만 (for 머리의 i++ · 혼자 있는 count++; 는 앞뒤가 같아서 빼고)
        var u = t.replace(/\bfor\s*\((?:[^()]|\([^()]*\))*\)/g, "for()").replace(/(^|[;{}])\s*(?:(?:\+\+|--)\s*[A-Za-z_]\w*|[A-Za-z_]\w*\s*(?:\+\+|--))\s*;/g, "$1");
        if ((cj || lang === "javascript") && /\+\+|--/.test(u)) L.push("💬 <code>x++</code> 는 지금 값을 먼저 쓰고 나서 1 늘리고, <code>++x</code> 는 먼저 1 늘리고 나서 써요.");
        if (cj && /\(\s*int\s*\)/.test(t)) L.push("💬 <code>(int)</code> 는 소수점 아래를 그냥 버려요 (반올림이 아니에요). 괄호가 어디까지 감싸는지도 보세요.");
        if (cj && /[\w)\]]\s*\/\s*[\w(]/.test(t)) L.push("💬 정수 / 정수는 몫만 남아요 (<code>7 / 2</code> → 3). 둘 중 하나라도 실수면 <code>3.5</code> 예요.");
        if (lang === "python" && /\/\//.test(t)) L.push("💬 <code>//</code> 는 몫, <code>/</code> 는 소수점까지 나누기예요 (<code>7 // 2</code> → 3, <code>7 / 2</code> → 3.5).");
        if (/[\w)\]]\s*%\s*[\w(]/.test(t)) L.push("💬 <code>%</code> 는 나머지예요 (<code>7 % 3</code> → 1).");
        if ((lang === "java" || lang === "javascript") && /""\s*\+\s*[^+;]+\+\s*[\w(]/.test(t)) L.push("💬 문자열 뒤의 <code>+</code> 는 더하기가 아니라 <b>이어 붙이기</b>예요 (<code>\"합: \" + 1 + 2</code> → 합: 12). 먼저 더하려면 괄호로 묶어요.");
        if ((cj || lang === "javascript") && /(^|[^\w.])0[0-7]+(?![\w.])/.test(t) || lang === "python" && /\b0[oO][0-7]+/.test(t)) L.push("💬 <code>0</code>으로 시작하는 정수는 <b>8진수</b>예요 (<code>0x</code> 는 16진수, <code>0b</code> 는 2진수). 비트로 펼쳐서 자리값을 더해 볼까요?");
        else if (/\b0[xX][0-9a-fA-F]+|\b0[bB][01]+/.test(t)) L.push("💬 <code>0x</code> 로 시작하면 16진수, <code>0b</code> 로 시작하면 2진수예요. 비트로 펼쳐서 자리값을 더해 볼까요?");
        if (cj && /%[-+ 0#]*\d*\.\d+[fF]/.test(raw)) L.push("💬 <code>%.2f</code> 처럼 점 뒤 숫자만큼 소수점 아래를 <b>반올림</b>해서 찍어요.");
        if (cj && /'\\?[^'\\]'\s*[-+]\s*\w/.test(raw)) L.push("💬 문자(<code>'A'</code>)에 숫자를 더하면 문자 코드(<code>'A'</code> = 65)로 계산해요. 그 값을 바로 찍으면 숫자(66), <code>char</code> 변수에 넣거나 <code>%c</code> 로 찍으면 문자(B)예요.");
        return L.slice(0, 2);
    }
    function shortCode(t) { t = String(t || "").trim(); return t.length > 60 ? t.slice(0, 57) + "…" : t; }
    function lineBox(title, items) {
        return '<div class="oq-lh"><p class="oq-lh-t">' + title + "</p><ul>" + items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
    }
    // 쓴 답의 줄마다 ✅/❌ + 틀린 줄 선생님 힌트
    //  opt.no(i) = 정답 i번째 줄의 번호 · opt.where(i) = 그 줄을 찍는 출력문(outview sourcesOf) · opt.ctx = {lang, lines, lead, sy}
    //  opt.nl(j) = 쓴 j번째 줄 뒤 표시 · opt.sp = 줄 끝 공백 표시
    function feedback(want, got, opt) {
        var ops = align(want, got), html = [], wrong = [], bad = [], extra = 0, good = 0, cx = opt.ctx, sy = cx.sy;
        var show = function (t) { return t === "" ? '<span class="oq-nl">(빈 줄)</span>' : opt.sp ? showSp(t) : esc(t); };
        var tag = function (x) { return '<span class="oq-ln">' + x + "</span>"; };
        ops.forEach(function (o) {             // 순서만 바뀐 줄: 빠진 정답 줄과 더 쓴 줄의 글자가 같으면 짝 (o.mv)
            if (o.same || o.w < 0) return;
            for (var b = 0; b < ops.length; b++) { var x = ops[b]; if (x.w < 0 && !x.mv && o.g < 0 && got[x.g] === want[o.w]) { o.mv = x; x.mv = o; break; } }
        });
        ops.forEach(function (o) {
            if (o.same) { good++; html.push('<span class="l-ok">✅ ' + tag(opt.no(o.w)) + show(got[o.g]) + opt.nl(o.g) + "</span>"); return; }
            if (o.g >= 0) html.push('<span class="l-no">❌ ' + tag(o.w >= 0 ? opt.no(o.w) : o.mv ? "↕" : "+") + show(got[o.g]) + opt.nl(o.g) + (o.mv ? ' <span class="oq-nl">(자리가 달라요 — ' + opt.no(o.mv.w) + "번째 줄)</span>" : "") + "</span>");
            else html.push('<span class="l-no l-miss">❌ ' + tag(opt.no(o.w)) + (o.mv ? "(이 줄은 다른 자리에 썼어요)" : "(이 줄이 빠졌어요)") + "</span>");
            if (o.w >= 0) bad.push(opt.no(o.w)); else if (!o.mv) extra++;
            wrong.push(o);
        });
        function place(i, deep) {       // 📍 이 줄을 찍는 코드 (+ deep: 🔎 값이 정해지는 줄 · 💬 문법 한마디)
            var s = opt.where(i), out = [];
            if (!s) return out;
            var at = s.line, no = at - cx.lead + 1, me = (cx.lines[at] || "").trim(), dup = "";
            if (me && cx.lines.filter(function (x) { return x.trim() === me; }).length > 1) {   // 똑같은 코드 줄이 여럿이면 바로 위 줄로 어느 것인지
                var up = at - 1;
                while (up >= 0 && !cx.lines[up].trim()) up--;
                if (up >= 0) dup = " (<code>" + esc(shortCode(cx.lines[up])) + "</code> 바로 아래)";
            }
            var run = s.rep && s.nth ? " (이 출력문이 <b>" + s.nth + "~" + s.to + "번째</b>로 실행되며 이어서 찍어요)" : s.nth ? " (이 출력문이 <b>" + s.nth + "번째</b>로 실행될 때)" : "";
            out.push("📍 " + (s.many ? "이 줄은 <b>" + no + "번째 줄</b>" + dup + "부터 출력문 여러 개가 이어서 찍어요: " : "이 줄을 찍는 코드는 <b>" + no + "번째 줄</b>" + dup + "이에요" + run + ": ")
                + '<code class="c">' + esc(shortCode(cx.lines[at] || s.src)) + "</code>");
            if (!deep) return out;
            var tr = trace(cx.lines, at, cx.lang), text = cutLine(cx.lines[at], cx.lang), raw = cx.lines[at] || "";
            var byLine = [];                 // 같은 줄에서 정해지는 변수는 한 문장으로 (int a = 10, b = 4;)
            tr.forEach(function (v) { var x = byLine.filter(function (y) { return y.line === v.line && !y.cond === !v.cond; })[0]; if (x) x.names.push(v.name); else byLine.push({ line: v.line, names: [v.name], cond: v.cond }); });
            if (byLine.length) out.push("🔎 " + byLine.map(function (v) {
                return v.names.map(function (n) { return "<code>" + esc(n) + "</code>"; }).join(" · ") + (v.cond ? " 값은 <b>조건에 따라</b> 달라져요 — <b>" + (v.line - cx.lead + 1) + "번째 줄</b>에서 실제로 어느 갈래로 가는지 따라가 볼까요? " : " 값은 <b>" + (v.line - cx.lead + 1) + "번째 줄</b>에서 정해져요: ") + '<code class="c">' + esc(shortCode(cx.lines[v.line])) + "</code>";
            }).join(""));
            tr.forEach(function (v) { text += " " + cutLine(cx.lines[v.line], cx.lang); raw += " " + cx.lines[v.line]; });
            return out.concat(concepts(text, raw, cx.lang));
        }
        function whyExtra() {           // 결과에 없는 줄: 코드에 보이는 것(반복 · 조건 · 예외)으로 어디를 따라갈지
            var all = cx.lines.map(function (l) { return cutLine(l, cx.lang); }).join("\n"), r = [];
            if (/\b(for|while)\b/.test(all)) r.push("반복문이 몇 번 도는지");
            if (/\b(if|elif|switch)\b/.test(all)) r.push("조건이 참인지");
            if (/\btry\b/.test(all)) r.push("예외가 나면 <code>try</code> 안의 남은 줄은 건너뛰는지");
            return r.length ? r.join(", ") + " 다시 따라가 볼까요?" : "이 줄을 찍는 출력문이 정말 있는지 코드를 위에서부터 따라가 볼까요?";
        }
        var boxes = [], used = {}, relines = false;
        function split(o, nx) { return o && nx && o.w >= 0 && o.g >= 0 && nx.w < 0 && nx.g === o.g + 1 && (want[o.w] === got[o.g] + got[nx.g] || want[o.w] === got[o.g] + " " + got[nx.g]); }
        var flat = function (a) { return a.join("").replace(/\s/g, ""); };
        if (want.length !== got.length && flat(want) === flat(got) && wrong.length > 2) {   // 글자는 다 맞고 줄 바꾸는 곳만 다름 (print 를 println 처럼)
            relines = true;
            boxes.push(lineBox("🧑‍🏫 줄이 바뀌는 곳만 달라요", ["🔗 글자는 다 맞게 썼어요 👍 그런데 결과는 <b>" + want.length + "줄</b>이에요 (쓴 답은 " + got.length + "줄). "
                + (got.length > want.length ? sy.keep : sy.nl) + " — 어디서 줄이 바뀌는지 다시 볼까요?"]));
            wrong.forEach(function (o, idx) { used[idx] = true; });
        }
        wrong.forEach(function (o, idx) {
            if (used[idx] || boxes.length >= 2) return;
            var nx = wrong[idx + 1], w = o.w >= 0 ? want[o.w] : null, g = o.g >= 0 ? got[o.g] : null, no = o.w >= 0 ? opt.no(o.w) : "";
            var title = "🧑‍🏫 " + no + "번째 줄, 같이 볼까요?";
            if (w !== null && g !== null && nx && nx.g < 0 && nx.w === o.w + 1 && (g === w + want[nx.w] || g === w + " " + want[nx.w])) {
                used[idx + 1] = true;            // 두 줄을 한 줄에 붙여 씀 (print ↔ println) — 끊을 곳은 쓴 줄 안의 글자로 (쓴 답에 이미 있는 글자라 정답이 새로 보이지 않음)
                var tail = chars(w), cut = (tail.length > 6 ? "…" : "") + tail.slice(-6).join("").trim();
                boxes.push(lineBox(title, ["✂️ 두 줄이 한 줄로 붙었어요. " + sy.nl + " — 쓴 줄에서 <code>" + esc(cut) + "</code> 다음에 Enter 를 쳐 볼까요?"].concat(place(o.w))));
                return;
            }
            if (split(o, nx)) {
                used[idx + 1] = true;            // 한 줄을 두 줄로 나눠 씀 — 출력문 하나가 한 번에 찍는 줄이면 그 말로
                var one = opt.where(o.w);
                boxes.push(lineBox(title, ["🔗 한 줄을 두 줄로 나눴어요. " + (one && !one.many && !one.rep ? "이 줄은 출력문 <b>하나</b>가 한 번에 찍어서 중간에 줄이 바뀌지 않아요" : sy.keep)
                    + " — 두 줄을 이어서 한 줄로 써 볼까요?"].concat(place(o.w))));
                return;
            }
            if (o.mv) {                      // 순서가 바뀐 줄 — 쓴 답에 있는 글자라 정답이 새로 보이지 않음
                var m = o.w >= 0 ? o : o.mv;
                used[wrong.indexOf(o.mv)] = true;
                boxes.push(lineBox("🧑‍🏫 " + opt.no(m.w) + "번째 줄, 같이 볼까요?", [(want[m.w] === "" ? "🔀 빈 줄" : "🔀 이 줄(<code>" + esc(want[m.w]) + "</code>)") + "은 쓴 답에 있는데 <b>자리</b>가 달라요 — " + (/^[-\d.\s]+$/.test(want[m.w]) ? "두 줄의 순서가 바뀌었거나 두 값을 서로 바꿔 계산했을 수 있어요. 이 줄을 찍는 코드부터 같이 따라가 볼까요?" : "순서가 바뀌었어요. 어느 출력문이 먼저 실행되는지 위에서부터 따라가 볼까요?")].concat(place(m.w, want[m.w] !== ""))));
                return;
            }
            if (w === null) {                // 결과에 없는 줄은 한 상자에 모아서 (틀린 줄 상자가 밀려나지 않게 · 🔗 나눠 쓴 줄의 뒷부분 · 🔀 자리만 바뀐 줄은 빼고)
                var ex = wrong.filter(function (x, k) { return x.w < 0 && !x.mv && !used[k] && !split(wrong[k - 1], x) && (used[k] = true); }).map(function (x) { return got[x.g]; });
                var txt = ex.filter(function (x) { return x !== ""; }), inOut = txt.some(function (x) { return want.indexOf(x) >= 0; });
                boxes.push(lineBox("🧑‍🏫 결과에 없는 줄이 있어요", (txt.length ? ["➕ 쓴 줄 " + txt.slice(0, 3).map(function (x) { return "<code>" + esc(x) + "</code>"; }).join(" · ") + (txt.length > 3 ? " 등" : "")
                    + " — " + (inOut ? "<b>이 자리</b>에는 없는 줄이에요 (결과에 아예 없거나, 자리가 다르거나, 한 번 더 썼어요). " : "실제 출력에는 없어요. ") + whyExtra()] : [])
                    .concat(ex.length > txt.length ? ["↩️ 빈 줄이 더 들어갔어요 — Enter 를 한 번 더 쳤는지 볼까요?"] : [])));
                return;
            }
            if (g === null) {
                boxes.push(lineBox(title, (w === "" ? ["↩️ 여기에는 <b>빈 줄</b>이 하나 있어요. " + sy.blank + "."]
                    : [(o.w === 0 ? "✏️ 맨 첫 줄이 빠졌어요. 가장 먼저 실행되는 출력부터 다시 볼까요?" : "✏️ 여기 한 줄이 빠졌어요. 바로 위 줄 다음에 실행되는 출력이 하나 더 있어요")
                        + " (정답 줄은 띄어쓰기까지 <b>" + chars(w).length + "글자</b>)."]).concat(place(o.w))));
                return;
            }
            if (w === "") {
                boxes.push(lineBox(title, ["↩️ 여기는 글자 없이 줄만 바뀌는 <b>빈 줄</b>이에요. " + sy.blank + ". 쓴 글자는 아래 줄로 내려 볼까요?"].concat(place(o.w))));
                return;
            }
            var d = diffHint(w, g, sy);
            boxes.push(lineBox(title, d.items.concat(place(o.w, d.kind === "num" || d.kind === "text"))));
        });
        var left = wrong.filter(function (o, idx) { return !used[idx]; }).length - boxes.length;
        if (left > 0) boxes.push('<p class="oq-lh-more">… 다른 줄도 ' + left + "개 더 있어요. 위에서부터 하나씩 고치면 아래 줄도 훨씬 쉬워져요 🙂</p>");
        extra = wrong.filter(function (x, k) { return x.w < 0 && !x.mv && !split(wrong[k - 1], x); }).length;   // 🔗 나눠 쓴 줄의 뒷부분은 '결과에 없는 줄'로 세지 않음
        return { good: good, bad: bad, extra: extra, relines: relines, html: html.join("\n"), hints: boxes.join("") };
    }
    function goodText(good, total) {    // "👍 4줄 중 3줄은 맞았어요!" · (다 맞았는데 다른 게 틀리면) "👍 결과 4줄은 모두 맞게 썼어요. 그런데" · "아직 맞은 줄이 없어요."
        return !good ? "아직 맞은 줄이 없어요." : good === total ? "👍 결과 " + total + "줄은 모두 맞게 썼어요. 그런데" : "👍 " + total + "줄 중 " + good + "줄은 맞았어요!";
    }
    function whereAt(n, list, good, also) {   // "2번째 줄만 다시 볼까요?" (다른 문제가 없을 때만 '만') · "2 · 4번째 줄을 다시 볼까요?" + 결과에 없는 줄
        var s = !list.length ? "" : !good && list.length > 2 ? "1번째 줄부터 코드를 한 줄씩 같이 따라가 볼까요?"
            : list.slice(0, 4).join(" · ") + "번째 줄" + (list.length > 4 ? " 등" : "") + (list.length === 1 && good && !n && !also ? "만" : "을") + " 다시 볼까요?";
        return s + (!n ? "" : s ? " 결과에 없는 줄도 " + n + "개 있어요." : "결과에 없는 줄을 " + n + "개 더 썼어요 (❌ + 줄).");
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
        var srcMap = null;
        var ctx = { lang: lang, lines: code.split("\n"), lead: (/^\n*/.exec(code) || [""])[0].length, sy: say(lang) };   // lead = 코드 맨 앞 빈 줄 (줄 번호에서 뺌)
        function where(n) {              // 정답 출력의 n번째 줄(0부터)을 찍는 출력문 (outview.js 가 확실히 찾은 것만 · 없으면 null)
            if (!srcMap && window.OutView && window.OutView.sourcesOf && code && lang) {
                try { srcMap = window.OutView.sourcesOf(code, lang, raw) || []; } catch (e) { srcMap = []; }
            }
            return (srcMap && srcMap[n]) || null;
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
            if (!mine.length) { box.innerHTML = '<p class="oq-sum no">실행 결과를 적고 확인을 누르세요.</p>'; p.dataset.solved = ""; updateScore(); return; }   // 맞힌 뒤 비우고 확인 → 다시 안 푼 문제로
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
            else { p.dataset.solved = ""; markWrong(); }   // 맞혔다가 답을 바꿔 틀리면 다시 틀린 것으로
            updateScore();
        });
        function checkLines() {          // 일반 · 칸수(exact) 문제: 빈 줄 무시 · 줄 짝짓기 + 틀린 줄 힌트
            var mineRows = rows(ta.value, exact);
            if (!mineRows.length) { box.innerHTML = '<p class="oq-sum no">실행 결과를 적고 확인을 누르세요.</p>'; p.dataset.solved = ""; updateScore(); return; }   // 맞힌 뒤 비우고 확인 → 다시 안 푼 문제로
            var want = expRows.map(function (r) { return r.t; }), got = mineRows.map(function (r) { return r.t; });
            var fb = feedback(want, got, { no: function (i) { return i + 1; }, where: function (i) { return where(expRows[i].n); }, ctx: ctx, nl: function () { return ""; } });
            var all = fb.good === want.length && got.length === want.length;
            var msg;
            if (all) msg = '<p class="oq-sum ok">🎉 정답! ' + want.length + "줄 모두 맞았어요.</p>";
            else {
                msg = '<p class="oq-sum no">' + goodText(fb.good, want.length) + " " + whereAt(fb.relines ? 0 : fb.extra, fb.bad, fb.good);
                if (got.length !== want.length && fb.bad.length) msg += ' <span class="oq-hx">(결과는 ' + want.length + "줄이에요 — 쓴 답은 " + got.length + "줄)</span>";
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
            if (!mineRaw.trim()) { box.innerHTML = '<p class="oq-sum no">실행 결과를 적고 확인을 누르세요.</p>'; p.dataset.solved = ""; updateScore(); return; }   // 맞힌 뒤 비우고 확인 → 다시 안 푼 문제로
            var all = mineRaw === rawT;
            var endWant = /\n$/.test(rawT), endGot = /\n$/.test(mineRaw);
            var want = rawT.split("\n"), got = mineRaw.split("\n");
            if (endWant) want.pop();             // 맨 끝 줄바꿈은 줄이 아니라 아래 안내(마지막 줄바꿈)로
            if (endGot) got.pop();
            var fb = feedback(want, got, {
                no: function (i) { return i + 1; }, where: where, ctx: ctx, sp: true,
                nl: function (j) { return j < got.length - 1 || endGot ? '<span class="oq-nl">⏎</span>' : ""; }
            });
            var msg;
            if (all) msg = '<p class="oq-sum ok">🎉 정답! 줄바꿈 · 띄어쓰기까지 실제 출력과 똑같아요.</p>';
            else {
                var why = [], allLn = fb.good === want.length && !fb.extra, at = whereAt(fb.relines ? 0 : fb.extra, fb.bad, fb.good, endWant !== endGot);
                if (!allLn) why.push(goodText(fb.good, want.length));
                if (at) why.push(at);
                if (want.length !== got.length && fb.bad.length) why.push('<span class="oq-hx">(결과는 ' + want.length + "줄이에요 — 쓴 답은 " + got.length + "줄)</span>");
                var lead2 = allLn ? "줄은 모두 맞았어요 👍 그런데" : "그리고";
                if (endWant && !endGot) { why.push(lead2 + " <b>마지막 줄 뒤 줄바꿈</b>이 빠졌어요 — " + ctx.sy.endNl + "."); fb.html += '\n<span class="l-no l-miss">❌ <span class="oq-ln">⏎</span>(마지막 줄바꿈이 빠졌어요)</span>'; }
                if (!endWant && endGot) { why.push(lead2 + " 마지막 줄 뒤에는 <b>줄바꿈이 없어야</b> 해요 — " + ctx.sy.endNo + "."); fb.html += '\n<span class="l-no l-miss">❌ <span class="oq-ln">⏎</span>(마지막 줄 뒤 줄바꿈은 없어야 해요)</span>'; }
                if (!why.length) why.push("거의 다 왔어요! 글자나 띄어쓰기가 조금 달라요.");
                msg = '<p class="oq-sum no">' + why.join(" ") + "</p>";
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
