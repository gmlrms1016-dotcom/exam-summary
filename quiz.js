/* =====================================================================
   quiz.js  ·  2학기 과목 페이지 공용 퀴즈 (1학기와 같은 UI)
   - 객관식 .mcq       : 보기를 누르면 즉시 채점 + 해설(.mcq-exp) 공개
   - 주관식 .quiz-item : 답 입력 후 확인 / Enter 로 채점 · 정답 보기
       data-answers="정답|다른 표현"  data-full="정답 보기에 표시할 답(선택)"  data-explain="해설(선택)"
       채점 정규화: 소문자 + 공백 제거 + 괄호·따옴표 제거
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
        + ".quiz-feedback.ok{color:#176c3a;}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    function norm(s) {
        return (s || "").toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/["'“”‘’]/g, "");
    }
    function esc(s) {
        return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

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
        var fb = item.querySelector(".quiz-feedback");
        var answers = (item.dataset.answers || "").split("|");
        var shown = item.dataset.full || answers[0];
        var explain = item.dataset.explain ? '<span class="ans">' + esc(item.dataset.explain) + "</span>" : "";
        function check() {
            var ok = answers.some(function (a) { return norm(a) === norm(input.value); });
            fb.className = "quiz-feedback " + (ok ? "ok" : "no");
            fb.innerHTML = ok ? "⭕ 정답입니다!" + explain : "❌ 다시 생각해 보세요.";
            if (ok) { item.dataset.solved = "1"; item.dataset.wrong = ""; }
            else { item.dataset.wrong = "1"; }
            updateScore();
        }
        var checkBtn = item.querySelector(".check");
        var showBtn = item.querySelector(".show");
        if (checkBtn) checkBtn.addEventListener("click", check);
        if (showBtn) showBtn.addEventListener("click", function () {
            fb.className = "quiz-feedback ok";
            fb.innerHTML = '💡 정답 <span class="ans-code">' + esc(shown) + "</span>" + explain;
            if (item.dataset.solved !== "1") item.dataset.wrong = "1";
        });
        if (input) input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") { e.preventDefault(); check(); }
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
            var shown = item.dataset.full || (item.dataset.answers || "").split("|")[0];
            var input = item.querySelector("input, textarea");
            if (input) { input.value = shown; input.readOnly = true; }
            item.dataset.solved = "1";
            item.dataset.wrong = "";
            var fb = item.querySelector(".quiz-feedback");
            if (fb) {
                fb.className = "quiz-feedback ok";
                fb.innerHTML = "✅ 정답: <b>" + esc(shown) + "</b>" + (item.dataset.explain ? '<span class="ans">' + esc(item.dataset.explain) + "</span>" : "");
            }
        });
    }

    updateScore();
})();
