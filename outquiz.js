/* =====================================================================
   outquiz.js  ·  언어 과목 "출력 결과 맞히기" — 코드를 읽고 실행 결과를 적으면 채점
   - <div class="oq" id="oq-…"> 한 개 = 문제 한 개
       <p class="oq-q"><span class="oq-no">1</span>제목<span class="oq-tag">주차 · 주제</span></p>
       <pre><code class="language-c">…코드…</code></pre>
       <script type="text/plain" class="oq-expect">…실제로 실행한 결과…</script>
       <div class="oq-why">…풀이…</div>          (선택) 정답 보기 때만 보임
       data-exam="출처 설명"   (선택) 교수님이 "시험문제" 라고 한 코드 → 🔥 배지와 빨간 테두리
       data-space="exact"     (선택) 칸수 문제 — 줄 안의 띄어쓰기 개수까지 채점
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
        + "#oq-score{font-weight:800;margin:6px 0 2px;}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function lines(s, exact) {
        return String(s || "").replace(/\r/g, "").split("\n").map(function (l) {
            l = l.replace(/\t/g, " ");
            return exact ? l.replace(/\s+$/, "") : l.replace(/\s+/g, " ").trim();
        }).filter(function (l) { return l.trim() !== ""; });
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
        var exact = p.dataset.space === "exact";
        var expect = lines(raw, exact);
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
        ta.rows = Math.min(Math.max(expect.length, 2), 12);
        ta.spellcheck = false;
        ta.setAttribute("autocomplete", "off");
        ta.setAttribute("autocapitalize", "off");
        ta.setAttribute("aria-label", title + " — 실행 결과 입력");
        ta.placeholder = exact ? "실행 결과를 그대로 입력 — 줄마다 Enter · 이 문제는 띄어쓰기 개수까지 채점해요"
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
            k.innerHTML = '<pre class="io"><code>' + esc(raw) + "</code></pre>";
            if (why) k.appendChild(why);
            return k;
        }

        btns.querySelector(".oq-check").addEventListener("click", function () {
            var mine = lines(ta.value, exact);
            if (!mine.length) { box.innerHTML = '<p class="oq-sum no">실행 결과를 적고 확인을 누르세요.</p>'; return; }
            var good = 0, html = [];
            mine.forEach(function (l, i) {
                var ok = l === expect[i];
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
