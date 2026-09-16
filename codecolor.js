/* =====================================================================
   codecolor.js  ·  소스코드 색칠 — VS Code "Dark High Contrast" 색 (전 페이지 공용)
   - theme.js 가 자동으로 불러오므로 페이지에 따로 넣지 않아도 됨
   - 구문 분석은 highlight.js(cdnjs), 색은 아래 CSS 로 직접 지정 (화이트·다크 모드 모두 같은 색)
   - 언어: <code class="language-sql"> 처럼 적혀 있으면 그 언어, 없으면 과목별 기본 언어
   - 칠하지 않는 블록: 실행 결과(pre.io · pre.py-output · language-text) · Git 로그 퀴즈(pre.lqlog · pre.finlog) · pre.no-hl
   - 블록 안의 기존 <span>(빈칸 · 주석 등)은 그대로 두고 그 주변 코드만 칠함
   ===================================================================== */
(function () {
    "use strict";

    // 구문 분석기 — 첫 CDN 이 막혀 있으면 다음 CDN 으로 다시 시도
    var HLJS_URLS = [
        "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
        "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js",
        "https://unpkg.com/@highlightjs/cdn-assets@11.9.0/highlight.min.js"
    ];

    // VS Code Dark High Contrast 토큰 색
    var CSS = [
        "pre.hl-pre{background:#000!important;color:#fff!important;border:1px solid #3c3c3c!important}",
        "pre.hl-pre code{color:#fff;background:transparent}",
        ".hl-pre .hljs-comment,.hl-pre .hljs-quote{color:#7ca668;font-style:italic}",
        ".hl-pre .hljs-keyword,.hl-pre .hljs-type,.hl-pre .hljs-literal,.hl-pre .hljs-meta,.hl-pre .hljs-meta .hljs-keyword," +
        ".hl-pre .hljs-name,.hl-pre .hljs-doctag,.hl-pre .hljs-symbol,.hl-pre .hljs-section{color:#569cd6}",
        ".hl-pre .hl-ctrl{color:#c586c0}",
        ".hl-pre .hljs-built_in,.hl-pre .hljs-title.class_,.hl-pre .hljs-class .hljs-title,.hl-pre .hl-type{color:#4ec9b0}",
        ".hl-pre .hljs-title,.hl-pre .hljs-title.function_,.hl-pre .hl-fn{color:#dcdcaa}",
        ".hl-pre .hljs-string,.hl-pre .hljs-meta .hljs-string{color:#ce9178}",
        ".hl-pre .hljs-number{color:#b5cea8}",
        ".hl-pre .hljs-variable,.hl-pre .hljs-params,.hl-pre .hljs-attr,.hl-pre .hljs-attribute,.hl-pre .hljs-property," +
        ".hl-pre .hljs-template-variable,.hl-pre .hl-var,.hl-pre .hl-fmt{color:#9cdcfe}",
        ".hl-pre .hl-const{color:#4fc1ff}",
        ".hl-pre .hl-esc{color:#d7ba7d}",
        ".hl-pre .hljs-regexp{color:#d16969}",
        ".hl-pre .hljs-selector-tag,.hl-pre .hljs-selector-class,.hl-pre .hljs-selector-id,.hl-pre .hljs-selector-pseudo,.hl-pre .hljs-selector-attr{color:#d7ba7d}",
        ".hl-pre .hljs-tag{color:#808080}",
        ".hl-pre .hljs-tag .hljs-name{color:#569cd6}",
        ".hl-pre .hljs-tag .hljs-attr{color:#9cdcfe}",
        ".hl-pre .hljs-tag .hljs-string{color:#ce9178}",
        ".hl-pre .hljs-subst,.hl-pre .hljs-operator,.hl-pre .hljs-punctuation{color:#fff}",
        ".hl-pre .hljs-addition{color:#b5cea8}",
        ".hl-pre .hljs-deletion{color:#ce9178}",
        ".hl-pre .hljs-emphasis{font-style:italic}",
        ".hl-pre .hljs-strong{font-weight:bold}",
        ".hl-lang-sql .hljs-built_in,.hl-lang-bash .hljs-built_in{color:#dcdcaa}"
    ].join("\n");

    // 과목(파일 이름)별 기본 언어
    var BY_PAGE = [
        [/프로그래밍언어실습/, ["c"]],
        [/자바프로그래밍/, ["java"]],
        [/웹프로그래밍/, ["xml", "javascript", "css"]],
        [/데이터베이스관리/, ["sql"]],
        [/운영체제실습|SW개발도구활용/, ["bash"]],
        [/파이썬프로그래밍|프로그래밍방법론/, ["python"]]
    ];
    var ALIAS = { js: "javascript", html: "xml", sh: "bash", shell: "bash", py: "python", "c++": "cpp" };
    var PLAIN = /^(text|plaintext|plain|output|txt|none)$/;
    var SKIP_PRE = /(^|\s)(io|py-output|lqlog|finlog|no-hl)(\s|$)/;
    var IDENT_LANGS = { c: 1, cpp: 1, java: 1, javascript: 1, python: 1 };
    var CTRL = {};
    ("if else for while do switch case default break continue return goto try catch finally throw throws " +
     "import from export await yield with elif pass raise except in of").split(" ").forEach(function (w) { CTRL[w] = 1; });
    var ALLOWED_CHILD = /^(SPAN|B|STRONG|EM|I|U|MARK|SMALL|SUB|SUP)$/;

    function pageLangs() {
        var path = "";
        try { path = decodeURIComponent(location.pathname); } catch (e) { path = location.pathname; }
        for (var i = 0; i < BY_PAGE.length; i++) if (BY_PAGE[i][0].test(path)) return BY_PAGE[i][1];
        return null;
    }

    function pickLang(code, text) {
        var m = /(?:^|\s)(?:language|lang)-([\w+-]+)/.exec(code.className || "");
        if (m) {
            var l = m[1].toLowerCase();
            if (PLAIN.test(l)) return null;
            l = ALIAS[l] || l;
            return hljs.getLanguage(l) ? l : null;
        }
        var langs = pageLangs();
        if (langs && langs.length === 1) return langs[0];
        var res = hljs.highlightAuto(text, langs || undefined);
        return res && res.language && res.relevance > 2 ? res.language : null;
    }

    function wrapText(textNode, re, classify) {
        var s = textNode.nodeValue, last = 0, m, frag = null;
        re.lastIndex = 0;
        while ((m = re.exec(s))) {
            var cls = classify(m, s);
            if (!cls) continue;
            if (!frag) frag = document.createDocumentFragment();
            if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
            var sp = document.createElement("span");
            sp.className = cls;
            sp.textContent = m[0];
            frag.appendChild(sp);
            last = m.index + m[0].length;
        }
        if (!frag) return;
        if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
        textNode.parentNode.replaceChild(frag, textNode);
    }

    function textNodes(root, accept) {
        var out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        while (w.nextNode()) if (accept(w.currentNode)) out.push(w.currentNode);
        return out;
    }

    function postProcess(code, lang, originals) {
        // ① 흐름 제어 키워드(if·for·return…)는 VS Code 처럼 분홍 보라 (SQL 은 키워드 전부 파랑)
        if (lang !== "sql") {
            code.querySelectorAll(".hljs-keyword").forEach(function (k) {
                if (CTRL[k.textContent.trim()]) k.classList.add("hl-ctrl");
            });
        }
        // 대문자로 시작하는 자료형(String · Scanner …)은 클래스 색(청록), int · char 는 파랑 그대로
        code.querySelectorAll(".hljs-type").forEach(function (t) {
            if (/^[A-Z]/.test(t.textContent.trim())) t.classList.add("hl-type");
        });
        if (IDENT_LANGS[lang]) {
            // ② 문자열 안의 서식 지정자(%d)와 이스케이프(\n)
            code.querySelectorAll(".hljs-string").forEach(function (str) {
                textNodes(str, function () { return true; }).forEach(function (t) {
                    wrapText(t, /%[-+ #0]*\d*(?:\.\d+)?(?:hh|h|ll|l|L|z|j|t)?[diouxXeEfFgGaAcspn%]|\\(?:[ntrbfav0'"\\]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/g,
                        function (m) { return m[0].charAt(0) === "%" ? "hl-fmt" : "hl-esc"; });
                });
            });
            // ③ 이름: 함수(뒤에 괄호) · 클래스(대문자 시작) · 상수(전부 대문자) · 변수
            textNodes(code, function (t) {
                var p = t.parentNode;
                if (originals.some(function (o) { return o === p || o.contains(p); })) return false;
                return p === code || (p.classList && (p.classList.contains("hljs-function") || p.classList.contains("hljs-class") ||
                    p.classList.contains("hljs-subst") || p.classList.contains("hljs-meta")));
            }).forEach(function (t) {
                wrapText(t, /[A-Za-z_$][\w$]*/g, function (m, s) {
                    var prev = m.index > 0 ? s.charAt(m.index - 1) : "";
                    if (/[\w$]/.test(prev)) return null;
                    var after = s.slice(m.index + m[0].length).match(/^\s*(\S)?/);
                    if (after && after[1] === "(") return "hl-fn";
                    if (/^[A-Z][A-Z0-9_]+$/.test(m[0])) return "hl-const";
                    if (/^[A-Z]/.test(m[0])) return "hl-type";
                    return "hl-var";
                });
            });
        } else if (lang === "bash") {
            // 줄 맨 앞 명령어(git · cd · ls …)는 함수 색
            var atLineStart = true;
            Array.prototype.slice.call(code.childNodes).forEach(function (n) {
                if (n.nodeType === 3) {
                    var s = n.nodeValue, frag = document.createDocumentFragment(), last = 0, re = /(^|\n)([ \t]*)([A-Za-z_][\w.-]*)/g, m, hit = false;
                    while ((m = re.exec(s))) {
                        if (m.index === 0 && m[1] === "" && !atLineStart) continue;
                        var start = m.index + m[1].length + m[2].length;
                        frag.appendChild(document.createTextNode(s.slice(last, start)));
                        var sp = document.createElement("span");
                        sp.className = "hl-fn";
                        sp.textContent = m[3];
                        frag.appendChild(sp);
                        last = start + m[3].length;
                        hit = true;
                    }
                    if (hit) {
                        frag.appendChild(document.createTextNode(s.slice(last)));
                        atLineStart = /\n[ \t]*$/.test(s);
                        n.parentNode.replaceChild(frag, n);
                    } else {
                        atLineStart = /\n[ \t]*$/.test(s) || (atLineStart && /^[ \t]*$/.test(s));
                    }
                } else {
                    atLineStart = /\n\s*$/.test(n.textContent || "");
                }
            });
        }
    }

    function colorize(pre) {
        if (pre.getAttribute("data-hl") || SKIP_PRE.test(pre.className || "")) return;
        var code = pre.querySelector("code");
        if (!code || code.parentNode !== pre) return;
        var originals = [], text = "", ok = true;
        Array.prototype.forEach.call(code.childNodes, function (n) {
            if (n.nodeType === 3) text += n.nodeValue;
            else if (n.nodeType === 1) {
                if (!ALLOWED_CHILD.test(n.tagName) || n.querySelector("input,textarea,select,button")) ok = false;
                originals.push(n);
                text += String.fromCharCode(0xE000 + originals.length - 1);   // 기존 요소 자리표시
            }
        });
        if (!ok || !text.trim()) return;
        var lang = pickLang(code, text.replace(/[\uE000-\uF8FF]/g, " "));
        if (!lang) return;

        var html;
        try { html = hljs.highlight(text, { language: lang, ignoreIllegals: true }).value; }
        catch (e) { return; }
        var tpl = document.createElement("template");
        tpl.innerHTML = html;
        // 자리표시 문자를 원래 요소(이벤트·참조 유지)로 되돌림
        textNodes(tpl.content, function (t) { return /[\uE000-\uF8FF]/.test(t.nodeValue); }).forEach(function (t) {
            var s = t.nodeValue, frag = document.createDocumentFragment(), last = 0;
            for (var i = 0; i < s.length; i++) {
                var cc = s.charCodeAt(i);
                if (cc >= 0xE000 && cc - 0xE000 < originals.length) {
                    if (i > last) frag.appendChild(document.createTextNode(s.slice(last, i)));
                    frag.appendChild(originals[cc - 0xE000]);
                    last = i + 1;
                }
            }
            if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
            t.parentNode.replaceChild(frag, t);
        });
        while (code.firstChild) code.removeChild(code.firstChild);
        code.appendChild(tpl.content);
        postProcess(code, lang, originals);
        pre.setAttribute("data-hl", lang);
        pre.classList.add("hl-pre", "hl-lang-" + lang);
    }

    function run() {
        if (!window.hljs) return;
        document.querySelectorAll("pre").forEach(function (pre) {
            try { colorize(pre); } catch (e) { /* 한 블록이 실패해도 나머지는 계속 */ }
        });
    }

    function start() {
        if (!document.querySelector("pre > code")) return;
        var st = document.createElement("style");
        st.id = "codecolor-css";
        st.setAttribute("data-theme-skip", "");
        st.textContent = CSS;
        document.head.appendChild(st);
        if (window.hljs) { run(); return; }
        (function load(i) {
            if (i >= HLJS_URLS.length) return;                 // 모두 실패하면 색칠 없이 원래 모습
            var s = document.createElement("script");
            s.src = HLJS_URLS[i];
            s.onload = function () { if (window.hljs) run(); else load(i + 1); };
            s.onerror = function () { load(i + 1); };
            document.head.appendChild(s);
        })(0);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
})();
