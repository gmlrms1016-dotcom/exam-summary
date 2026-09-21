/* =====================================================================
   codetest.js  ·  언어 과목 코딩테스트 — 소스코드를 붙여넣으면 채점
   - <div class="ct" data-lang="c|java|js"> 한 개 = 문제 한 개
       <script type="application/json" class="ct-tests">[{"stdin":"…","expect":"…"}, …]</script>  테스트 케이스
       <script type="text/plain" class="ct-answer">…</script>                                     정답 코드(정답 보기)
       data-must='["정규식", …]'  data-must-msg="…"  (선택) 코드에 꼭 들어가야 하는 것 — 목록의 정규식이 모두 맞아야 함
       data-exam="출처 설명"  (선택) 교수님이 "시험문제" 라고 한 코드 → 🔥 시험문제 배지와 빨간 테두리
   - 실행: C · Java = Wandbox 온라인 컴파일러(gcc · OpenJDK) / JS = 브라우저 Web Worker (prompt() 는 입력 줄을 차례로 돌려줌)
   - 채점: 줄 끝 공백 · 마지막 빈 줄만 무시하고 출력이 기대값과 같아야 통과
   - #ct-score 에 통과 개수 표시 · 시험 종료(?done=1) 면 정답 코드 모두 공개
   사용: 과목 페이지 끝에 <script src="codetest.js"></script>
   ===================================================================== */
(function () {
    "use strict";

    var WANDBOX = "https://wandbox.org/api/compile.json";
    var COMPILER = { c: "gcc-13.2.0-c", java: "openjdk-jdk-22+36" };
    var LANG_NAME = { c: "C", java: "Java", js: "JavaScript" };

    var css = ""
        + ".ct{border:1px solid var(--line);border-radius:12px;padding:16px;margin:16px 0;background:var(--card);}"
        + ".ct-q{font-weight:700;margin:0 0 8px;line-height:1.65;}"
        + ".ct-no{display:inline-block;min-width:26px;height:24px;line-height:24px;text-align:center;background:var(--main);color:#fff;border-radius:6px;font-size:13px;margin-right:8px;}"
        + ".ct-tag{display:inline-block;font-size:12px;font-weight:800;padding:1px 8px;border-radius:999px;background:#eaf2ec;color:var(--main);margin-left:6px;vertical-align:1px;}"
        + ".ct-desc{margin:4px 0 10px;line-height:1.7;}"
        + ".ct.ct-exam{border:2px solid #d9534f;box-shadow:0 0 0 3px rgba(217,83,79,.12);}"
        + ".ct-examtag{display:inline-block;font-size:12px;font-weight:900;padding:2px 9px;border-radius:999px;background:#d9534f;color:#fff;margin-right:8px;vertical-align:1px;}"
        + ".ct-examsrc{display:block;font-size:12.5px;font-weight:700;color:#b34727;margin:2px 0 0;}"
        + ".ct-group{margin:22px 0 4px;}"
        + ".ct-ex{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:8px 0 12px;}"
        + ".ct-ex pre{margin:0;}"
        + ".ct-ex pre.ct-in::before{content:\"⌨️ 입력 예\";}"
        + ".ct-ex pre.ct-out::before{content:\"🖥️ 출력 예\";}"
        + ".ct-code{display:block;width:100%;min-height:190px;resize:vertical;box-sizing:border-box;font-family:Consolas,\"D2Coding\",Menlo,monospace;"
        + "font-size:13px;line-height:1.55;tab-size:4;background:#1e2530;color:#e6edf3;border:1px solid var(--line);border-radius:10px;padding:12px 14px;}"
        + ".ct-btns{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0;}"
        + ".ct-btns button{font:inherit;font-size:14px;font-weight:800;border:none;border-radius:8px;padding:9px 16px;cursor:pointer;}"
        + ".ct-run{background:var(--main);color:#fff;}"
        + ".ct-run[disabled]{opacity:.6;cursor:wait;}"
        + ".ct-show,.ct-clear{background:#eaf2ec;color:var(--main);}"
        + ".ct-result{margin-top:12px;}"
        + ".ct-sum{font-weight:800;margin:0 0 8px;}"
        + ".ct-sum.ok{color:#176c3a;}.ct-sum.no{color:#b34727;}"
        + ".ct-case{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:8px 0;font-size:13.5px;}"
        + ".ct-case.ok{background:#e7f6ec;}.ct-case.no{background:#fdecec;}"
        + ".ct-case b{display:block;margin-bottom:4px;}"
        + ".ct-case pre{margin:6px 0 0;font-size:12.5px;}"
        + ".ct-case pre.ct-exp::before{content:\"✅ 기대 출력\";}"
        + ".ct-case pre.ct-mine::before{content:\"🙋 내 출력\";}"
        + ".ct-case pre.ct-err::before{content:\"⚠️ 오류 메시지\";}"
        + ".ct-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;}"
        + ".ct-err{white-space:pre-wrap;}"
        + ".ct-answer-box{margin-top:10px;}"
        + "#ct-score{font-weight:800;color:var(--main);margin:6px 0 2px;}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    function esc(s) {
        return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    // 줄 끝 공백과 끝의 빈 줄만 무시
    function norm(s) {
        return String(s == null ? "" : s).replace(/\r\n?/g, "\n").split("\n").map(function (l) { return l.replace(/[ \t]+$/, ""); })
            .join("\n").replace(/\n+$/, "");
    }
    // 공백·줄바꿈을 전부 빼고도 같으면 "형식만 다름"
    function squash(s) { return norm(s).replace(/\s+/g, ""); }

    // ---- 실행기 ----
    function prepJava(src) {
        return src.replace(/^\s*package\s+[\w.]+\s*;\s*$/m, "")                       // 패키지 줄 제거
                  .replace(/\bpublic\s+((?:final\s+|abstract\s+)*)class\s+/g, "$1class ");  // 파일 이름 제약 없애기
    }
    var BUSY = /OCI runtime error|Resource temporarily unavailable|too many|timed? ?out/i;
    var queue = Promise.resolve();                 // 채점 서버에는 한 번에 요청 하나씩만 보낸다
    function enqueue(job) {
        var p = queue.then(job, job);
        queue = p.catch(function () { });
        return p;
    }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function runRemote(lang, code, stdin, onStart) {
        return enqueue(function () { if (onStart) onStart(); return runRemoteTry(lang, code, stdin, 0); });
    }
    function runRemoteTry(lang, code, stdin, attempt) {
        return runRemoteOnce(lang, code, stdin).then(function (r) {
            var text = (r.detail || "") + (r.runtimeErr || "");
            if (BUSY.test(text) && attempt < 4) return wait(1200 * (attempt + 1)).then(function () { return runRemoteTry(lang, code, stdin, attempt + 1); });
            return r;
        });
    }
    function runRemoteOnce(lang, code, stdin) {
        var body = { compiler: COMPILER[lang], code: lang === "java" ? prepJava(code) : code, stdin: stdin };
        if (lang === "java") body["runtime-option-raw"] = "-Dstdout.encoding=UTF-8";
        return fetch(WANDBOX, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
            .then(function (r) { if (!r.ok) throw new Error("채점 서버 응답 " + r.status); return r.json(); })
            .then(function (j) {
                var compileErr = (j.compiler_error || "").trim();
                var failed = String(j.status) !== "0";
                if (compileErr && !j.program_output && failed) return { error: "컴파일 오류", detail: compileErr };
                return { out: j.program_output || "", runtimeErr: failed ? ((j.program_error || "") + (j.signal ? "\n" + j.signal : "")).trim() : "" };
            });
    }
    var WORKER_SRC = [
        "self.onmessage = function (e) {",
        "  var lines = e.data.stdin.split('\\n'), k = 0, out = [];",
        "  function show(v) {",
        "    if (typeof v === 'string') return v;",
        "    if (Array.isArray(v)) return '[ ' + v.map(function (x) { return typeof x === 'string' ? \"'\" + x + \"'\" : String(x); }).join(', ') + ' ]';",
        "    if (v && typeof v === 'object') { try { return JSON.stringify(v); } catch (x) { return String(v); } }",
        "    return String(v);",
        "  }",
        "  var cons = { log: function () { out.push([].map.call(arguments, show).join(' ')); } };",
        "  var prompt = function () { return k < lines.length ? lines[k++] : null; };",
        "  var win = { prompt: prompt, alert: function (v) { out.push(show(v)); } };",
        "  try { new Function('console', 'prompt', 'window', 'alert', e.data.code)(cons, prompt, win, win.alert);",
        "        self.postMessage({ out: out.join('\\n') }); }",
        "  catch (err) { self.postMessage({ out: out.join('\\n'), runtimeErr: String(err) }); }",
        "};"
    ].join("\n");
    var workerUrl = null;
    function runJs(code, stdin) {
        if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
        return new Promise(function (resolve) {
            var w = new Worker(workerUrl);
            var timer = setTimeout(function () { w.terminate(); resolve({ out: "", runtimeErr: "3초 안에 끝나지 않았어요 (무한 반복?)" }); }, 3000);
            w.onmessage = function (e) { clearTimeout(timer); w.terminate(); resolve(e.data); };
            w.onerror = function (e) { clearTimeout(timer); w.terminate(); resolve({ out: "", error: "문법 오류", detail: e.message }); e.preventDefault(); };
            w.postMessage({ code: code, stdin: stdin });
        });
    }
    function run(lang, code, stdin, onStart) {
        if (lang === "js") { if (onStart) onStart(); return runJs(code, stdin); }
        return runRemote(lang, code, stdin, onStart);
    }

    // ---- 점수 ----
    var probs = [].slice.call(document.querySelectorAll(".ct"));
    function updateScore() {
        var el = document.getElementById("ct-score");
        if (!el) return;
        var passed = probs.filter(function (p) { return p.dataset.passed === "1"; }).length;
        var exams = probs.filter(function (p) { return p.dataset.exam; });
        var examPassed = exams.filter(function (p) { return p.dataset.passed === "1"; }).length;
        el.textContent = "💻 통과한 문제 — " + passed + " / " + probs.length + (exams.length ? " · 🔥 시험문제 " + examPassed + " / " + exams.length : "");
    }

    function showView(res, tests, lang) {
        var html = "", pass = 0;
        res.forEach(function (r, i) {
            var t = tests[i];
            var ok = !r.error && norm(r.out) === norm(t.expect);
            var nearly = !ok && !r.error && squash(r.out) === squash(t.expect);
            if (ok) pass++;
            html += '<div class="ct-case ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "✅" : "❌") + " 테스트 " + (i + 1)
                + (t.stdin ? " · 입력 <code>" + esc(t.stdin.trim().replace(/\n/g, " ⏎ ")) + "</code>" : " · 입력 없음") + "</b>";
            if (r.error) {
                html += '<pre class="ct-err"><code>' + esc(r.error + (r.detail ? "\n\n" + r.detail : "")) + "</code></pre>";
            } else if (!ok) {
                if (nearly) html += "⚠️ 값은 맞는데 <b>띄어쓰기 · 줄바꿈</b>이 달라요. 출력 예와 똑같이 맞춰 보세요.";
                html += '<div class="ct-cols"><pre class="io ct-exp"><code>' + esc(norm(t.expect)) + '</code></pre><pre class="io ct-mine"><code>' + esc(norm(r.out) || "(출력 없음)") + "</code></pre></div>";
                if (r.runtimeErr) html += '<pre class="ct-err"><code>' + esc("실행 중 오류: " + r.runtimeErr) + "</code></pre>";
            }
            html += "</div>";
        });
        var all = pass === tests.length;
        return { all: all, html: '<p class="ct-sum ' + (all ? "ok" : "no") + '">' + (all ? "🎉 통과! 테스트 " : "테스트 ") + pass + " / " + tests.length + " 개 맞음</p>" + html };
    }

    probs.forEach(function (p) {
        var lang = p.dataset.lang;
        if (p.dataset.exam) {                                    // 시험문제 강조
            p.classList.add("ct-exam");
            var q = p.querySelector(".ct-q");
            q.insertAdjacentHTML("afterbegin", '<span class="ct-examtag">🔥 시험문제</span>');
            q.insertAdjacentHTML("beforeend", '<span class="ct-examsrc">📌 ' + esc(p.dataset.exam) + "</span>");
        }
        var tests = JSON.parse(p.querySelector(".ct-tests").textContent);
        var answerEl = p.querySelector(".ct-answer");
        var answer = answerEl ? answerEl.textContent.replace(/^\n/, "") : "";
        var ta = p.querySelector(".ct-code");
        var btnRun = p.querySelector(".ct-run"), btnShow = p.querySelector(".ct-show"), btnClear = p.querySelector(".ct-clear");
        var box = p.querySelector(".ct-result");
        var key = "ct:" + location.pathname + ":" + (p.id || "");

        try { var saved = localStorage.getItem(key); if (saved) ta.value = saved; } catch (e) { }
        ta.addEventListener("input", function () { try { localStorage.setItem(key, ta.value); } catch (e) { } });
        ta.addEventListener("keydown", function (e) {            // Tab 키로 들여쓰기
            if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                var s = ta.selectionStart, en = ta.selectionEnd;
                ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(en);
                ta.selectionStart = ta.selectionEnd = s + 4;
            }
        });

        btnRun.addEventListener("click", function () {
            var code = ta.value;
            if (!code.trim()) { box.innerHTML = '<p class="ct-sum no">소스코드를 붙여넣고 채점하세요.</p>'; return; }
            var must = []; try { must = JSON.parse(p.dataset.must || "[]"); } catch (e) { }
            var missing = must.filter(function (m) { return !new RegExp(m).test(code); });
            btnRun.disabled = true;
            box.innerHTML = '<p class="ct-sum">⏳ 채점 중…</p>';
            var res = [];
            var chain = Promise.resolve();
            tests.forEach(function (t, i) {
                chain = chain.then(function () {
                    btnRun.textContent = "⏳ 채점 대기 중…";
                    return run(lang, code, t.stdin || "", function () {
                        btnRun.textContent = "⏳ 테스트 " + (i + 1) + " / " + tests.length + (lang === "js" ? " 실행 중…" : " 채점 서버에서 실행 중…");
                    }).catch(function (e) {
                        return { error: "채점 서버에 연결하지 못했어요", detail: String(e.message || e) + "\n인터넷 연결을 확인하고 잠시 뒤 다시 눌러 주세요." };
                    }).then(function (r) { res.push(r); });
                });
            });
            chain.then(function () {
                var v = showView(res, tests, lang);
                var passed = v.all && !missing.length;
                var warn = missing.length ? '<p class="ct-sum no">⚠️ 조건 미충족 — ' + esc(p.dataset.mustMsg || "문제에서 쓰라고 한 문법을 사용하세요.") + "</p>" : "";
                if (missing.length && v.all) v.html = v.html.replace('<p class="ct-sum ok">🎉 통과! 테스트 ', '<p class="ct-sum no">출력은 맞았지만 아직 미통과 — 테스트 ');
                box.innerHTML = warn + v.html;
                p.dataset.passed = passed ? "1" : "";
                if (passed) p.dataset.wrong = ""; else p.dataset.wrong = "1";
                updateScore();
            }).finally(function () { btnRun.disabled = false; btnRun.textContent = "▶ 채점하기"; });
        });
        btnShow.addEventListener("click", function () {
            var open = box.querySelector(".ct-answer-box");
            if (open) { open.remove(); return; }
            box.insertAdjacentHTML("beforeend", '<div class="ct-answer-box"><pre><code class="language-' + (lang === "js" ? "javascript" : lang) + '">'
                + esc(answer) + "</code></pre></div>");
            if (window.hljs) try { window.hljs.highlightElement(box.querySelector(".ct-answer-box code")); } catch (e) { }
        });
        if (btnClear) btnClear.addEventListener("click", function () {
            ta.value = ""; box.innerHTML = ""; p.dataset.passed = "";
            try { localStorage.removeItem(key); } catch (e) { }
            updateScore();
        });
        if (/[?&]done=1/.test(location.search)) btnShow.click();   // 시험 끝나면 정답 공개
        ta.setAttribute("placeholder", LANG_NAME[lang] + " 소스코드를 여기에 붙여넣으세요 (전체 코드 · Tab 키 = 들여쓰기)");
    });
    updateScore();
})();
