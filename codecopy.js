/* =====================================================================
   codecopy.js — 소스코드 복사 버튼 (전 페이지 공통 · theme.js 가 불러옴)
   - 모든 <pre><code> 코드블록 오른쪽 위에 “⧉ 복사” 버튼 → 누르면 코드 글자 그대로 클립보드로
   - 과목 페이지 · 주차 페이지 · 교양 · 1학기 페이지 모두 + 나중에 화면에 생기는 코드(정답 코드 보기 · 풀이 등)까지
   - 제외: 실행 화면 · 출력 결과(pre.io · .py-output), 코드 입력창(textarea), 실제시험을 푸는 동안의 문제 코드
   - 폰(폭 600px 이하): 긴 줄은 화면 폭에서 줄바꿈해서 보여 줌 (옆으로 밀지 않고 위아래로만 읽기 · 2026-10-29)
     → 긴 줄이 있는 코드에만 “↩ 줄바꿈” 버튼 · 누르면 모든 코드가 원래처럼 한 줄(가로 스크롤) · 고른 값은 이 기기에 저장
     → 출력 결과 상자(outview.js) · 누르면 펼쳐지는 터미널(termclick.js)의 출력도 같은 설정을 따름 — 줄 번호 칸은 그대로 두고 긴 글자만 줄바꿈
     → 줄마다 상자로 나눠 “내어쓰기”: 넘친 부분은 그 줄의 들여쓰기 + 2칸에서 이어짐 (끝 주석이 맨 앞으로 떨어져 다른 줄처럼 보이지 않게)
     → 보이는 모양만 바뀌고 복사되는 코드 글자(textContent)는 그대로
   ===================================================================== */
(function () {
    "use strict";
    if (window.__codecopy) return;
    window.__codecopy = true;

    var css = ""
        + ".codecopy{position:relative;}"
        + ".codecopy>.cc-btn{position:absolute;top:7px;right:8px;z-index:6;"
        + "background:rgba(255,255,255,.14);color:#e6edf3;border:1px solid rgba(255,255,255,.34);"
        + "border-radius:7px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer;"
        + "font-family:inherit;line-height:1.2;transition:background .12s;}"
        + ".codecopy>.cc-btn:hover{background:rgba(255,255,255,.3);}"
        + ".codecopy>.cc-btn.done{background:#2d6a4f;color:#fff;border-color:#2d6a4f;}"
        + ".codecopy>.cc-wrapbtn{display:none;right:84px;}"
        + ".codecopy>.cc-wrapbtn[aria-pressed=true]{background:rgba(126,168,201,.3);border-color:#7ea8c9;}"
        + "html[data-theme=dark] .codecopy>.cc-wrapbtn[aria-pressed=true]{background:#1f3a4d;border-color:#4a7fa3;}"
        + "@media (max-width:600px){.codecopy.cc-long>.cc-wrapbtn{display:block;}"
        + "html.cc-wrapon .codecopy.cc-long>pre,html.cc-wrapon .codecopy.cc-long>pre code{white-space:pre-wrap;overflow-wrap:anywhere;}"
        + "html.cc-wrapon .codecopy.cc-long .cc-ln{display:block;padding-left:var(--ccind);text-indent:calc(-1 * var(--ccind));}"
        + "html.cc-wrapon pre.ov .ov-l{display:flex;}html.cc-wrapon pre.ov .ov-n{flex:none;}"          // 출력 결과(outview.js): 줄 번호는 그대로 · 긴 글자만 오른쪽 칸 안에서 줄바꿈
        + "html.cc-wrapon pre.ov .ov-t{flex:1 1 auto;min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;}"
        + "html.cc-wrapon .tclick .tc-out{white-space:pre-wrap;overflow-wrap:anywhere;}}"          // 명령을 누르면 펼쳐지는 터미널(termclick.js)의 긴 출력 줄도
        + "@media print{.codecopy>.cc-btn{display:none;}}";

    var WRAP_KEY = "codecopy:wrap", LONG = 32;                  // 한 줄이 32자를 넘으면 폰(375px)에서 잘려 보임
    var wrapOn = true;
    try { wrapOn = localStorage.getItem(WRAP_KEY) !== "0"; } catch (e) { }
    var NARROW = !!(window.matchMedia && matchMedia("(max-width: 600px)").matches);

    // 줄마다 <span class="cc-ln"> 로 나눔 — 색칠(codecolor.js)이 끝난 뒤에만 (먼저 나누면 색칠이 안 됨)
    //  · 줄을 넘지 않는 요소는 원래 요소를 그대로 옮김 (빈칸 · 클릭 이벤트 유지) · 여러 줄에 걸친 색 span(긴 주석 등)만 줄마다 복제
    //  · 줄 끝 "\n" 은 그 줄 상자 안에 그대로 → code.textContent(복사 · 필기 기준)가 바뀌지 않음
    function splitLines(pre) {
        var code = pre.querySelector("code");
        if (!code || code.getAttribute("data-cclines") || code.querySelector("input,textarea,select,button")) return;
        if (code.textContent.indexOf("\n") < 0) return;
        var lines = [], stack = [], path;
        function newLine() {
            var ln = document.createElement("span");
            ln.className = "cc-ln";
            lines.push(ln); path = [ln];
            stack.forEach(function (el) { var c = el.cloneNode(false); path[path.length - 1].appendChild(c); path.push(c); });
        }
        newLine();
        (function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
                if (ch.nodeType === 3) {
                    ch.nodeValue.split("\n").forEach(function (t, i) {
                        if (i) { path[path.length - 1].appendChild(document.createTextNode("\n")); newLine(); }
                        if (t) path[path.length - 1].appendChild(document.createTextNode(t));
                    });
                } else if (ch.nodeType === 1) {
                    if (ch.textContent.indexOf("\n") < 0) { path[path.length - 1].appendChild(ch); return; }
                    var c = ch.cloneNode(false);
                    path[path.length - 1].appendChild(c);
                    stack.push(ch); path.push(c);
                    walk(ch);
                    stack.pop(); path.pop();
                }
            });
        })(code);
        while (code.firstChild) code.removeChild(code.firstChild);
        lines.forEach(function (ln) {
            var lead = (ln.textContent.match(/^[ \t]*/)[0]).replace(/\t/g, "    ").length;
            ln.style.setProperty("--ccind", Math.min(lead + 2, 24) + "ch");
            code.appendChild(ln);
        });
        code.setAttribute("data-cclines", "1");
    }
    function splitWhenColored(pre) {                            // 색칠이 끝나면(data-hl) 나눔 · 색칠하지 않는 블록은 그대로 줄바꿈만
        if (pre.getAttribute("data-hl")) { splitLines(pre); return; }
        if (!window.MutationObserver) return;
        var mo = new MutationObserver(function () {
            if (!pre.getAttribute("data-hl")) return;
            mo.disconnect();
            splitLines(pre);
        });
        mo.observe(pre, { attributes: true, attributeFilter: ["data-hl"] });
    }

    function syncWrap() {
        document.documentElement.classList.toggle("cc-wrapon", wrapOn);
        document.querySelectorAll(".codecopy>.cc-wrapbtn").forEach(function (b) { b.setAttribute("aria-pressed", wrapOn ? "true" : "false"); });
    }

    function fallbackCopy(text) {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.top = "-9999px"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand("copy"); } catch (e) { }
        document.body.removeChild(ta);
    }

    function skip(pre) {
        if (pre.classList.contains("io") || pre.classList.contains("py-output")) return true;   // 실행 화면 · 출력 결과
        if (!pre.querySelector("code")) return true;                                            // <code> 없는 블록
        if (pre.parentNode && pre.parentNode.classList && pre.parentNode.classList.contains("codecopy")) return true;   // 이미 붙음
        if (document.body.classList.contains("ex-live") && pre.closest("#ex-exam")) return true;   // 실제시험 푸는 중
        return false;
    }

    function decorate(pre) {
        if (skip(pre)) return;
        var code = pre.querySelector("code");
        var wrap = document.createElement("div");
        wrap.className = "codecopy";
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);

        var btn = document.createElement("button");
        btn.type = "button"; btn.className = "cc-btn"; btn.textContent = "⧉ 복사";
        btn.setAttribute("aria-label", "코드 복사");
        wrap.appendChild(btn);

        var long = code.textContent.split("\n").some(function (l) { return l.replace(/\t/g, "    ").length > LONG; });
        if (long) {
            wrap.classList.add("cc-long");
            if (NARROW) splitWhenColored(pre);
            var wb = document.createElement("button");
            wb.type = "button"; wb.className = "cc-btn cc-wrapbtn"; wb.textContent = "↩ 줄바꿈";
            wb.setAttribute("aria-label", "긴 줄 줄바꿈 켜기 · 끄기");
            wb.setAttribute("aria-pressed", wrapOn ? "true" : "false");
            wrap.appendChild(wb);
            wb.addEventListener("click", function () {
                wrapOn = !wrapOn;
                try { localStorage.setItem(WRAP_KEY, wrapOn ? "1" : "0"); } catch (e) { }
                syncWrap();
                if (window.moToast) window.moToast(wrapOn ? "긴 줄을 줄바꿈해서 보여 줘요" : "코드를 원래처럼 한 줄로 (옆으로 밀어서 보기)");
            });
        }

        btn.addEventListener("click", function () {
            var text = code.textContent;
            function done() {
                btn.textContent = "복사됨 ✓"; btn.classList.add("done");
                if (window.moToast) window.moToast("코드를 복사했어요");
                setTimeout(function () { btn.textContent = "⧉ 복사"; btn.classList.remove("done"); }, 1600);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
            } else { fallbackCopy(text); done(); }
        });
    }

    function scan(root) {
        if (!root || !root.querySelectorAll) return;
        if (root.tagName === "PRE") decorate(root);
        root.querySelectorAll("pre").forEach(decorate);
    }

    function start() {
        var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
        syncWrap();
        scan(document.body);
        // 나중에 생기는 코드(정답 코드 보기 · 시험 풀이 · 접기 안 코드 등)에도 붙이기
        var pending = false, roots = [];
        new MutationObserver(function (list) {
            list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && !(n.classList && n.classList.contains("codecopy"))) roots.push(n); }); });
            if (pending || !roots.length) return;
            pending = true;
            setTimeout(function () { pending = false; var r = roots; roots = []; r.forEach(scan); }, 60);
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
})();
