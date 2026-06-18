/* =====================================================================
   pyrun.js  ·  브라우저 안에서 파이썬 코드 직접 실행 + 채점 (Pyodide)
   - 각 .pyprob 카드의 [실행 & 채점] 버튼 → 코드 실행 후 정답/오답 표시
   - 채점 로직은 grader.py 를 fetch 해서 Pyodide에 로드(escape 문제 회피)
   - 틀린 문제는 window.__examWrong 에 기록 → review.js '틀린 문제 복사'와 연동
   ===================================================================== */
(function () {
    "use strict";

    var pyReady = null;   // Pyodide + grader 로드 Promise (최초 1회)

    function loadPyodideScript() {
        return new Promise(function (resolve, reject) {
            if (typeof loadPyodide !== "undefined") return resolve();
            var s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
            s.onload = resolve;
            s.onerror = function () { reject(new Error("Pyodide 스크립트를 불러오지 못했습니다(인터넷 연결 확인).")); };
            document.head.appendChild(s);
        });
    }

    function ensurePy(setStatus) {
        if (pyReady) return pyReady;
        pyReady = (async function () {
            setStatus("⏳ 파이썬 실행환경 준비 중… (최초 1회 수십 초, 이후 빠름)");
            await loadPyodideScript();
            var py = await loadPyodide();
            setStatus("⏳ 채점기 불러오는 중…");
            var src = await fetch("grader.py").then(function (r) {
                if (!r.ok) throw new Error("grader.py 로드 실패");
                return r.text();
            });
            py.runPython(src);
            return py;
        })();
        return pyReady;
    }

    async function runProblem(card) {
        var pid = +card.dataset.pid;
        var code = card.querySelector(".py-editor").value;
        var resEl = card.querySelector(".py-result");
        var outEl = card.querySelector(".py-output");
        var runBtn = card.querySelector(".py-run");
        runBtn.disabled = true;
        resEl.className = "py-result"; outEl.textContent = "";
        var setStatus = function (m) { resEl.className = "py-result"; resEl.textContent = m; };
        setStatus("⏳ 실행 중…");
        try {
            var py = await ensurePy(setStatus);
            py.globals.set("user_code", code);
            var raw = py.runPython("import json; json.dumps(grade(" + pid + ", user_code), ensure_ascii=False)");
            var res = JSON.parse(raw);
            resEl.className = "py-result " + (res.ok ? "ok" : "no");
            resEl.textContent = (res.ok ? "✅ " : "❌ ") + res.msg;
            outEl.textContent = res.output || "";
            // '틀린 문제 복사'(review.js) 연동
            var key = "py" + pid;
            window.__examWrong = window.__examWrong || {};
            if (res.ok) { delete window.__examWrong[key]; }
            else { window.__examWrong[key] = { q: "[파이썬 " + pid + "번] " + (card.dataset.title || ""), opts: [], ans: '정답: 페이지의 "정답 코드 보기" 참고' }; }
        } catch (e) {
            resEl.className = "py-result no";
            resEl.textContent = "⚠️ 실행 환경 오류: " + (e && e.message ? e.message : e);
        } finally {
            runBtn.disabled = false;
        }
    }

    document.querySelectorAll(".pyprob").forEach(function (card) {
        var ta = card.querySelector(".py-editor");
        var starter = ta.value;
        var runBtn = card.querySelector(".py-run");
        var resetBtn = card.querySelector(".py-reset");
        if (runBtn) runBtn.addEventListener("click", function () { runProblem(card); });
        if (resetBtn) resetBtn.addEventListener("click", function () {
            ta.value = starter;
            card.querySelector(".py-result").textContent = "";
            card.querySelector(".py-output").textContent = "";
        });
        // Tab 키 → 4칸 들여쓰기 (편집 편의)
        ta.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                e.preventDefault();
                var s = ta.selectionStart, en = ta.selectionEnd;
                ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(en);
                ta.selectionStart = ta.selectionEnd = s + 4;
            }
        });
    });
})();
