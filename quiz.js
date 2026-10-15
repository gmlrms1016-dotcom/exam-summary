/* =====================================================================
   quiz.js  ·  2학기 과목 페이지 공용 퀴즈 (1학기와 같은 UI)
   - 객관식 .mcq       : 보기를 누르면 즉시 채점 + 해설(.mcq-exp) 공개
   - 주관식 .quiz-item : 답 입력 후 확인 / Enter 로 채점 · 정답 보기
       data-answers="정답|다른 표현"  data-full="정답 보기에 표시할 답(선택)"  data-explain="해설(선택)"
       채점 정규화: 소문자 + 공백 제거 + 괄호·따옴표 제거
       data-case="strict"  (선택) 대소문자는 그대로 채점 (자바처럼 대소문자를 구분하는 답 — String ≠ string)
   - 여러 줄 명령 .quiz-item[data-lines] : 한 문제에 명령을 여러 줄 (운영체제 도전문제 · 2026-10-15)
       data-lines='[["cal 2025"],["cal","cal -y"]]'  줄마다 정답 목록 (첫 번째 = 정답 보기에 나오는 답 · "re:정규식" 도 됨)
       <textarea class="quiz-lines"> 에서 Enter = 다음 줄 (채점은 확인 버튼 · ⌘/Ctrl+Enter)
       채점: 줄마다 앞의 $ · # 프롬프트 빼고 · – → - · 띄어쓰기 여러 칸 = 한 칸 · 대소문자는 그대로 (리눅스 명령)
   - #quiz-score 가 있으면 퀴즈 섹션(#quiz)의 맞힌 개수를 표시
   - 시험 종료(?done=1, schedule.js 가 자동으로 붙임)면 모든 정답·해설 공개
   사용: 과목 페이지 맨 끝에 <script src="quiz.js"></script> 다음 <script src="review.js"></script>
   ===================================================================== */
(function () {
    "use strict";

    var css = ""
        + ".mcq{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:12px 0;background:#fff;}"
        + ".mcq-q{font-weight:700;margin:0 0 10px;line-height:1.6;}"
        + ".mcq-no{display:inline-block;min-width:26px;height:24px;line-height:24px;text-align:center;background:var(--main);color:#fff;border-radius:6px;font-size:13px;margin-right:8px;}"
        + ".opt{display:block;width:100%;text-align:left;font-family:inherit;font-size:14px;line-height:1.55;background:#f7f9f7;border:1px solid var(--line);border-radius:8px;padding:9px 12px;margin:6px 0;cursor:pointer;transition:background .12s,border-color .12s;}"
        + ".opt:hover{border-color:var(--main);background:#eef5ef;}"
        + ".opt b{color:var(--main);margin-right:4px;}"
        + ".mcq.answered .opt{cursor:default;}"
        + ".opt.correct{background:#e7f6ec;border-color:var(--main);color:#176c3a;font-weight:700;}"
        + ".opt.correct::after{content:\"  ✓ 정답\";color:var(--main);font-weight:900;font-size:12px;}"
        + ".opt.wrong{background:#fdecec;border-color:#d9534f;color:#a32f2b;}"
        + ".opt.wrong::after{content:\"  ✗\";color:#d9534f;font-weight:900;}"
        + ".mcq-exp{display:none;margin-top:10px;padding:10px 12px;background:#fff8e6;border-left:4px solid var(--point);border-radius:6px;font-size:13.5px;line-height:1.6;}"
        + ".mcq-exp b{color:var(--point);}"
        + ".quiz-score{font-weight:800;color:var(--main);margin:6px 0 2px;}"
        + ".quiz-feedback.ok{color:#176c3a;}"
        + ".quiz-item textarea.quiz-lines{display:block;width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--line);border-radius:8px;font-size:15px;line-height:1.6;font-family:Consolas,Menlo,monospace;resize:vertical;}"
        + ".quiz-steps{margin:6px 0 10px;padding-left:22px;line-height:1.7;font-size:14.5px;}"
        + ".quiz-lines-hint{font-size:12.5px;color:#6b776e;margin:0 0 6px;}"
        + ".quiz-feedback pre.ans-lines{margin:6px 0 0;padding:8px 10px;border-radius:6px;background:#0f1b14;color:#dff5e6;font-size:13.5px;line-height:1.6;white-space:pre-wrap;}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    // 답 비교용으로 고르게: 띄어쓰기 · 괄호 · 따옴표 무시 (대소문자는 keepCase 일 때만 그대로)
    //  NFKC = 전각 ｉｎｔ · 맥에서 붙여넣은 풀어쓴 한글도 같은 글자로 · 맥 한글 자판의 ₩ 는 역슬래시(\) 로 (2026-10-12)
    //  keepQuote = 정답에 \" · \' 가 있는 문제(따옴표 자체가 답) → 따옴표까지 채점 (\ 만 써도 정답이 되던 것)
    //  주관식(대소문자 무시)은 끝에 붙인 마침표도 무시
    function norm(s, keepCase, keepQuote) {
        s = String(s || "");
        if (s.normalize) s = s.normalize("NFKC");
        s = s.replace(/[₩￦]/g, "\\");
        if (!keepCase) s = s.toLowerCase();
        s = s.replace(/\s+/g, "").replace(/[()]/g, "");
        s = keepQuote ? s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'") : s.replace(/["'“”‘’]/g, "");
        if (!keepCase) s = s.replace(/[.。!?]+$/, "");
        return s;
    }
    function esc(s) {
        return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    // 주관식 정답 비교 (2026-10-07 사용자: '실제 시험에서는 영어 또는 한글 또는 영어와 한글, 3가지 중 하나라도 맞으면 정답')
    //  ① 정답 목록 중 하나와 같으면 정답 (띄어쓰기 · 괄호 · 따옴표 무시, 대소문자는 data-case="strict" 일 때만)
    //  ② 정답이 "매개변수(파라미터)" 꼴이면 괄호 밖 · 안 하나만 써도 정답
    //  ③ 정답 두 개를 이어 쓰면 정답 — 매개변수(파라미터) · 매개변수 parameter · parameter / 매개변수 (대소문자 채점 문제 = 코드 빈칸은 제외)
    function sameAnswer(answers, value, keep) {
        var all = [];
        answers.forEach(function (a) {
            all.push(a);
            var m = /^\s*([^()]+?)\s*\(\s*([^()]+?)\s*\)\s*$/.exec(a || "");
            // 용어(다른 표현) 꼴만 나눔 — 코드 · 목록(점 · 쉼표 · 기호)이나 영문이름(영문) 함수 호출은 그대로
            //  (PRIMARY KEY(학번,과목번호) · 신입생(학번, …) · clearTimeout(timerId) 를 앞부분만 써도 정답이 되던 문제 — 2026-10-08)
            var ident = function (x) { return /^[A-Za-z_]\w*$/.test(x); };
            if (m && !keep && !/[.,;:=<>{}\[\]_]/.test(a) && !(ident(m[1]) && ident(m[2]))) { all.push(m[1]); all.push(m[2]); }
        });
        var q = answers.some(function (a) { return /\\["']/.test(a || ""); });   // 따옴표 자체가 답인 문제
        var keys = all.map(function (a) { return norm(a, keep, q); }).filter(function (a) { return a; });
        var v = norm(value, keep, q);
        if (!v) return false;
        if (keys.indexOf(v) >= 0) return true;
        if (keep) return false;
        var w = v.replace(/[\/,·、|]/g, "");
        for (var i = 0; i < keys.length; i++) for (var j = 0; j < keys.length; j++) {
            if (keys[i] !== keys[j] && keys[i] + keys[j] === w) return true;
        }
        return false;
    }

    // 여러 줄 명령 채점용: $ · # 프롬프트 · 긴 줄표(–) · 둥근 따옴표 · 띄어쓰기 개수 차이는 무시, 대소문자 · 옵션 글자는 그대로
    function cnorm(s) {
        s = String(s || "");
        if (s.normalize) s = s.normalize("NFKC");
        s = s.replace(/[‐‑‒–—−]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[₩￦]/g, "\\");
        s = s.replace(/^\s*(\[[^\]]*\]\s*)?[$#]\s+/, "");
        return s.replace(/\s+/g, " ").trim();
    }
    function lineOk(alts, v) {
        if (!v) return false;
        return alts.some(function (a) {
            if (/^re:/.test(a)) { try { return new RegExp(a.slice(3)).test(v); } catch (e) { return false; } }
            return cnorm(a) === v;
        });
    }
    function linesOf(item) {
        if (!item.dataset.lines) return null;
        try { var L = JSON.parse(item.dataset.lines); return Array.isArray(L) && L.length ? L : null; } catch (e) { return null; }
    }
    function linesShown(L) { return L.map(function (alts) { return String(alts[0]).replace(/^re:/, ""); }).join("\n"); }

    var scope = document.getElementById("quiz") || document;
    var mcqs = document.querySelectorAll(".mcq");
    var items = document.querySelectorAll(".quiz-item");

    function updateScore() {
        var el = document.getElementById("quiz-score");
        if (!el) return;
        var qm = scope.querySelectorAll(".mcq");
        var qi = scope.querySelectorAll(".quiz-item");
        var right = 0;
        qm.forEach(function (q) {
            if (q.classList.contains("answered") && !q.querySelector(".opt.wrong")) right++;
        });
        var solved = scope.querySelectorAll('.quiz-item[data-solved="1"]').length;
        el.textContent = "✅ 맞힌 문제 — 객관식 " + right + " / " + qm.length + " · 주관식 " + solved + " / " + qi.length;
    }

    // ---- 객관식: 보기 클릭 즉시 채점 ----
    mcqs.forEach(function (q) {
        var correct = q.dataset.correct;
        q.querySelectorAll(".opt").forEach(function (btn) {
            btn.addEventListener("click", function () {
                if (q.classList.contains("answered")) return;
                q.classList.add("answered");
                q.querySelectorAll(".opt").forEach(function (b) {
                    if (b.dataset.opt === correct) b.classList.add("correct");
                });
                if (btn.dataset.opt !== correct) btn.classList.add("wrong");
                var exp = q.querySelector(".mcq-exp");
                if (exp) exp.style.display = "block";
                updateScore();
            });
        });
    });

    // ---- 주관식: 입력 채점 · 정답 보기 ----
    items.forEach(function (item) {
        var input = item.querySelector("input, textarea");
        if (input) {                                          // 폰 자판이 첫 글자를 대문자로 · 따옴표를 “ ” 로 바꾸지 않게 (대소문자 채점 빈칸에서 int → Int 오답)
            input.setAttribute("autocapitalize", "off"); input.setAttribute("autocorrect", "off"); input.spellcheck = false;
        }
        var fb = item.querySelector(".quiz-feedback");
        var L = linesOf(item);
        var answers = (item.dataset.answers || "").split("|");
        var shown = L ? linesShown(L) : (item.dataset.full || answers[0]);
        var explain = item.dataset.explain ? '<span class="ans">' + esc(item.dataset.explain) + "</span>" : "";
        if (L && input && input.tagName === "TEXTAREA" && !input.getAttribute("rows")) input.rows = Math.max(2, L.length);
        function check() {
            var ok;
            if (L) {                                          // 여러 줄 명령: 줄마다 채점 (빈 줄은 건너뜀)
                var got = input.value.split("\n").map(cnorm).filter(function (x) { return x; });
                var bad = [];
                for (var i = 0; i < L.length; i++) if (!lineOk(L[i], got[i])) bad.push(i + 1);
                ok = !bad.length && got.length === L.length;
                fb.className = "quiz-feedback " + (ok ? "ok" : "no");
                fb.innerHTML = ok ? "⭕ 정답입니다! (명령 " + L.length + "줄 모두 맞음)" + explain
                    : "❌ " + (L.length - bad.length) + " / " + L.length + "줄 맞음" + (bad.length ? " — 다시 볼 줄: " + bad.join(" · ") + "번째" : "")
                      + (got.length !== L.length ? " · 지금 " + got.length + "줄 / 필요한 명령 " + L.length + "줄" : "");
            } else {
                var keep = item.dataset.case === "strict";
                ok = sameAnswer(answers, input.value, keep);
                fb.className = "quiz-feedback " + (ok ? "ok" : "no");
                fb.innerHTML = ok ? "⭕ 정답입니다!" + explain : "❌ 다시 생각해 보세요.";
            }
            if (ok) { item.dataset.solved = "1"; item.dataset.wrong = ""; }
            else { item.dataset.solved = ""; item.dataset.wrong = "1"; }   // 맞혔다가 바꿔서 틀리면 다시 안 푼 것으로 (outquiz.js 와 같게 · 시험 점수가 남던 것)
            updateScore();
        }
        var checkBtn = item.querySelector(".check");
        var showBtn = item.querySelector(".show");
        if (checkBtn) checkBtn.addEventListener("click", check);
        if (showBtn) showBtn.addEventListener("click", function () {
            fb.className = "quiz-feedback ok";
            fb.innerHTML = L ? '💡 정답 (줄마다 명령 하나)<pre class="ans-lines">' + esc(shown) + "</pre>" + explain
                             : '💡 정답 <span class="ans-code">' + esc(shown) + "</span>" + explain;
            if (item.dataset.solved !== "1") item.dataset.wrong = "1";
        });
        if (input) input.addEventListener("keydown", function (e) {
            if (e.key !== "Enter" || e.isComposing) return;
            if (L && !(e.metaKey || e.ctrlKey)) return;   // 여러 줄 명령: Enter = 다음 줄 (⌘/Ctrl+Enter 로 채점)
            e.preventDefault(); check();
        });
    });

    // ---- 시험 종료 후 복습 모드: 모든 정답·해설 공개 ----
    if (/[?&]done=1/.test(location.search)) {
        var wrap = document.querySelector(".wrap");
        if (wrap && !document.getElementById("done-banner")) {
            var bn = document.createElement("div");
            bn.id = "done-banner";
            bn.style.cssText = "background:#176c3a;color:#fff;border-radius:12px;padding:16px 18px;margin:0 0 18px;font-weight:800;text-align:center;line-height:1.6;";
            bn.innerHTML = '🎉 시험 종료 · <b>복습 모드</b><br><span style="font-weight:600;font-size:14px;color:#d8efe2;">모든 객관식·주관식의 정답과 해설이 공개됩니다.</span>';
            wrap.insertBefore(bn, wrap.firstChild);
        }
        mcqs.forEach(function (q) {
            if (q.classList.contains("answered")) return;
            q.classList.add("answered");
            q.querySelectorAll(".opt").forEach(function (b) {
                if (b.dataset.opt === q.dataset.correct) b.classList.add("correct");
            });
            var exp = q.querySelector(".mcq-exp");
            if (exp) exp.style.display = "block";
        });
        items.forEach(function (item) {
            if (item.dataset.solved === "1") return;
            var L2 = linesOf(item);
            var shown = L2 ? linesShown(L2) : (item.dataset.full || (item.dataset.answers || "").split("|")[0]);
            var input = item.querySelector("input, textarea");
            if (input) { input.value = shown; input.readOnly = true; }
            item.dataset.solved = "1";
            item.dataset.wrong = "";
            var fb = item.querySelector(".quiz-feedback");
            if (fb) {
                fb.className = "quiz-feedback ok";
                fb.innerHTML = (L2 ? '✅ 정답<pre class="ans-lines">' + esc(shown) + "</pre>" : "✅ 정답: <b>" + esc(shown) + "</b>") + (item.dataset.explain ? '<span class="ans">' + esc(item.dataset.explain) + "</span>" : "");
            }
        });
    }

    updateScore();
})();
