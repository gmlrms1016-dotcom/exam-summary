/* =====================================================================
   codecopy.js — 소스코드 복사 버튼 (전 페이지 공통 · theme.js 가 불러옴)
   - 모든 <pre><code> 코드블록 오른쪽 위에 “⧉ 복사” 버튼 → 누르면 코드 글자 그대로 클립보드로
   - 과목 페이지 · 주차 페이지 · 교양 · 1학기 페이지 모두 + 나중에 화면에 생기는 코드(정답 코드 보기 · 풀이 등)까지
   - 제외: 실행 화면 · 출력 결과(pre.io · .py-output), 코드 입력창(textarea), 실제시험을 푸는 동안의 문제 코드
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
        + "@media print{.codecopy>.cc-btn{display:none;}}";

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
