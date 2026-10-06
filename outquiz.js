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
                              답은 칸을 띄어쓰기 · | · 탭 아무거나로 구분 · +---+ 테두리 줄은 무시
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
            try { localStorage.removeItem(key); } catch (e) { }
            updateScore();
        });
        if (/[?&]done=1/.test(location.search)) box.appendChild(keyBox());   // 시험 끝나면 정답 공개
    });
    updateScore();
})();
