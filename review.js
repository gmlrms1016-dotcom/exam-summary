/* =====================================================================
   review.js  ·  "내가 틀린 문제 모아 복사" 공용 기능 (전 과목 공통)
   - 객관식(.mcq): 틀린 보기를 클릭한 문항을 수집
   - 빈칸채우기(.quiz-item): 틀리게 답했거나 '정답 보기'를 누른(=몰랐던) 문항 수집
   - 플로팅 버튼 → 모달에 [문제 / 모든 보기 / 정답·해설] 나열 + 클립보드 복사
   목적: 틀린 문제를 복사해 AI에게 "비슷한 문제 내줘" 프롬프트로 사용
   ===================================================================== */
(function () {
    "use strict";

    // 빈칸채우기 채점과 동일한 정규화(띄어쓰기·괄호·대소문자 무시)
    function norm(s) { return (s || "").trim().toLowerCase().replace(/\s+/g, "").replace(/[()]/g, ""); }

    // ---- 빈칸채우기: 오답/정답보기 여부를 data 속성으로 기록 (기존 스크립트와 별개로 동작) ----
    document.querySelectorAll(".quiz-item").forEach(function (item) {
        var input = item.querySelector("input");
        var answers = (item.dataset.answers || "").split("|");
        var checkBtn = item.querySelector(".check");
        var showBtn = item.querySelector(".show");
        if (checkBtn && input) {
            checkBtn.addEventListener("click", function () {
                var ok = answers.some(function (a) { return norm(a) === norm(input.value); });
                if (ok) { item.dataset.solved = "1"; item.dataset.wrong = ""; }
                else { item.dataset.wrong = "1"; }
                updateBadge();
            });
        }
        if (showBtn) {
            showBtn.addEventListener("click", function () {
                if (item.dataset.solved !== "1") item.dataset.wrong = "1";  // 정답 보기 = 몰랐던 문제
                updateBadge();
            });
        }
    });

    // 객관식 보기 클릭 후 배지 갱신
    document.querySelectorAll(".mcq .opt").forEach(function (opt) {
        opt.addEventListener("click", function () { setTimeout(updateBadge, 0); });
    });

    // ---- 틀린 문제 수집 ----
    function collectWrong() {
        var out = [];
        // 1) 객관식: 틀린 보기를 클릭한 문항
        document.querySelectorAll(".mcq").forEach(function (q) {
            if (!q.querySelector(".opt.wrong")) return;             // 오답 클릭 안 했으면 제외
            var noEl = q.querySelector(".mcq-no");
            var no = noEl ? noEl.textContent.trim() : "";
            var full = (q.querySelector(".mcq-q") || {}).textContent || "";
            var stem = no && full.indexOf(no) === 0 ? full.slice(no.length).trim() : full.trim();
            var opts = [].map.call(q.querySelectorAll(".opt"), function (o) { return o.textContent.trim(); });
            var exp = ((q.querySelector(".mcq-exp") || {}).textContent || "").trim();
            out.push({ no: no, q: stem, opts: opts, ans: exp });
        });
        // 2) 빈칸채우기: 틀렸거나 정답보기 사용 & 아직 못 맞힌 문항
        document.querySelectorAll(".quiz-item").forEach(function (item) {
            if (item.dataset.wrong !== "1" || item.dataset.solved === "1") return;
            var full = ((item.querySelector(".quiz-q") || {}).textContent || "").trim();
            var ans = (item.dataset.answers || "").split("|")[0];
            out.push({ no: "", q: full, opts: [], ans: "정답: " + ans });
        });
        // 3) 커스텀 엔진(예: 웹 태그 퀴즈)이 전역에 보고한 오답
        var extra = window.__examWrong;
        if (extra) Object.keys(extra).forEach(function (k) {
            var r = extra[k]; if (r) out.push({ no: r.no || "", q: r.q || "", opts: r.opts || [], ans: r.ans || "" });
        });
        return out;
    }

    // ---- AI 프롬프트용 텍스트 생성 ----
    function buildText(list) {
        var subject = (document.title || "").replace(/기말.*$/, "").replace(/정리.*$/, "").trim() || "이 과목";
        var L = [];
        L.push("아래는 내가 [" + subject + "]에서 틀린 문제들이야. (문제 / 보기 / 정답·해설 포함)");
        L.push("이 문제들과 같은 개념·난이도로 새 연습문제를 만들어서 내줘.");
        L.push("· 먼저 문제만 쭉 보여주고, 정답과 해설은 맨 아래에 따로 모아줘.");
        L.push("· 객관식은 보기 4개를 유지하고, 한국어로 내줘.");
        L.push("");
        L.push("과목: " + subject + " / 틀린 문제 수: " + list.length + "개");
        L.push("════════════════════════════");
        list.forEach(function (it, i) {
            L.push("");
            L.push((i + 1) + ". " + it.q);
            it.opts.forEach(function (o) { L.push("   " + o); });
            L.push("   ▶ " + it.ans);
        });
        return L.join("\n");
    }

    // ---- 스타일 주입 ----
    var css = ""
        + "#rv-fab{position:fixed;right:18px;bottom:18px;z-index:9998;background:#d9772b;color:#fff;border:none;"
        + "border-radius:50px;padding:13px 18px;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25);font-family:inherit;}"
        + "#rv-fab:hover{filter:brightness(1.05);}"
        + "#rv-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;padding:18px;}"
        + "#rv-modal{background:#fff;color:#1d241e;max-width:760px;width:100%;max-height:86vh;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;font-family:inherit;}"
        + "#rv-head{background:#2d6a4f;color:#fff;padding:16px 20px;}"
        + "#rv-head h3{margin:0;font-size:18px;}"
        + "#rv-head p{margin:4px 0 0;font-size:13px;color:#d8efe2;}"
        + "#rv-body{padding:16px 20px;overflow:auto;}"
        + "#rv-text{width:100%;min-height:320px;font-family:Consolas,'D2Coding',monospace;font-size:13px;line-height:1.5;"
        + "border:1px solid #d7ddd7;border-radius:8px;padding:12px;white-space:pre;color:#1d241e;background:#fbfdfb;}"
        + "#rv-foot{display:flex;gap:10px;padding:14px 20px;border-top:1px solid #e6ebe6;flex-wrap:wrap;}"
        + ".rv-btn{border:none;border-radius:8px;padding:11px 18px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;}"
        + ".rv-btn.copy{background:#2d6a4f;color:#fff;}.rv-btn.close{background:#eceeec;color:#444;}"
        + "#rv-empty{padding:8px 0;color:#5b675d;font-size:14px;}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

    // ---- DOM (버튼 + 모달) ----
    var fab = document.createElement("button");
    fab.id = "rv-fab"; fab.type = "button"; fab.textContent = "📋 틀린 문제 복사";
    document.body.appendChild(fab);

    var overlay = document.createElement("div"); overlay.id = "rv-overlay";
    overlay.innerHTML =
        '<div id="rv-modal" role="dialog" aria-modal="true">'
        + '<div id="rv-head"><h3>📋 내가 틀린 문제 모음 <span id="rv-count"></span></h3>'
        + '<p>아래 내용을 복사해 AI에게 붙여넣고 “비슷한 문제 내줘”라고 하세요. (복습용)</p></div>'
        + '<div id="rv-body"><div id="rv-empty" style="display:none;">아직 틀린 문제가 없어요! 문제를 풀어본 뒤 다시 눌러주세요. 🙂</div>'
        + '<textarea id="rv-text" readonly></textarea></div>'
        + '<div id="rv-foot"><button class="rv-btn copy" id="rv-copy" type="button">📋 클립보드에 복사</button>'
        + '<button class="rv-btn close" id="rv-close" type="button">닫기</button></div>'
        + '</div>';
    document.body.appendChild(overlay);

    var elText = overlay.querySelector("#rv-text");
    var elEmpty = overlay.querySelector("#rv-empty");
    var elCount = overlay.querySelector("#rv-count");
    var elCopy = overlay.querySelector("#rv-copy");

    function updateBadge() {
        var n = collectWrong().length;
        fab.textContent = n > 0 ? ("📋 틀린 문제 " + n + "개 복사") : "📋 틀린 문제 복사";
    }

    function openModal() {
        var list = collectWrong();
        elCount.textContent = "(" + list.length + "개)";
        elCopy.textContent = "📋 클립보드에 복사";
        if (list.length === 0) {
            elEmpty.style.display = "block"; elText.style.display = "none"; elCopy.style.display = "none";
        } else {
            elEmpty.style.display = "none"; elText.style.display = "block"; elCopy.style.display = "inline-block";
            elText.value = buildText(list);
        }
        overlay.style.display = "flex";
        if (list.length) { elText.focus(); elText.select(); }
    }
    function closeModal() { overlay.style.display = "none"; }

    function doCopy() {
        var text = elText.value;
        function done() { elCopy.textContent = "복사됨 ✓"; setTimeout(function () { elCopy.textContent = "📋 클립보드에 복사"; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { elText.focus(); elText.select(); document.execCommand("copy"); done(); });
        } else { elText.focus(); elText.select(); document.execCommand("copy"); done(); }
    }

    fab.addEventListener("click", openModal);
    elCopy.addEventListener("click", doCopy);
    overlay.querySelector("#rv-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

    // 어떤 퀴즈 엔진이든 클릭 후 배지 자동 갱신 (웹 태그퀴즈 data-act 버튼 포함)
    document.addEventListener("click", function (e) {
        if (overlay.contains(e.target) || e.target === fab) return;  // 모달/버튼 자체는 제외
        setTimeout(updateBadge, 0);
    });

    updateBadge();
})();
