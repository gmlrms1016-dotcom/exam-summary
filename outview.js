/* =====================================================================
   outview.js  ·  ▶ 출력 결과 상자를 읽기 쉽게 + 줄마다 설명 — 전 페이지 공용 (theme.js 가 함께 불러옴)
   - 대상: pre.io (2진수 풀이 pre.io.bits · 결과 맞히기 .oq · 코딩테스트 .ct · 실제시험 안은 제외)
   - 가독성: 줄 번호 · 키보드 입력 부분 ⌨️ 강조 · 오류 줄 빨간색 · [␣ 공백] 버튼(줄 끝 공백 · 탭 · 줄바꿈 표시)
   - 설명(💡): 바로 앞 코드 블록에서 그 줄을 찍은 출력문(printf · console.log · System.out · print)을 찾아
       ① 코드 줄의 주석(단계별 설명) ② %d ← c = 31 처럼 들어간 값 ③ 반복이면 "3번째" 를 줄 옆에 붙인다
     리눅스 출력은 /etc/passwd · /etc/group · /etc/shadow · ls -l 줄을 칸별로 풀어 준다
   - 확실하지 않은 줄은 설명을 붙이지 않는다 (틀린 설명보다 없는 게 낫다)
   - 복사하면 줄 번호 · 설명은 빠지고 원래 출력만 복사된다
   ===================================================================== */
(function (global) {
    "use strict";

    // ------------------------------------------------------------ 문자열 · 주석 나누기
    function splitComment(line, lang) {
        var mark = (lang === "python" || lang === "bash") ? "#" : "//";
        var q = null;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (q) {
                if (ch === "\\") { i++; continue; }
                if (ch === q) q = null;
            } else if (ch === '"' || ch === "'" || ch === "`") {
                if (lang === "bash" && ch === "'" ) { q = ch; continue; }
                q = ch;
            } else if (line.substr(i, mark.length) === mark) {
                if (mark === "#" && lang === "bash" && i > 0 && !/\s/.test(line[i - 1])) continue;
                return [line.slice(0, i), line.slice(i + mark.length).trim()];
            }
        }
        return [line, ""];
    }
    // 괄호 짝 맞춰 인자 목록 꺼내기 (문자열 · 템플릿 안의 괄호 무시)
    function readArgs(s, open) {
        var depth = 0, q = null, args = [], cur = "", tdepth = 0;
        for (var i = open; i < s.length; i++) {
            var ch = s[i];
            if (q) {
                cur += ch;
                if (ch === "\\") { cur += s[++i] || ""; continue; }
                if (q === "`" && ch === "$" && s[i + 1] === "{") { tdepth++; cur += s[++i]; q = null; continue; }
                if (ch === q) q = null;
                continue;
            }
            if (ch === '"' || ch === "'" || ch === "`") { q = ch; cur += ch; continue; }
            if (tdepth && ch === "}" && depth === 1) { tdepth--; cur += ch; q = "`"; continue; }
            if (ch === "(" || ch === "[" || ch === "{") { depth++; if (depth === 1 && ch === "(") continue; }
            else if (ch === ")" || ch === "]" || ch === "}") {
                depth--;
                if (depth === 0) { if (cur.trim() || args.length) args.push(cur.trim()); return { args: args, end: i }; }
            } else if (ch === "," && depth === 1) { args.push(cur.trim()); cur = ""; continue; }
            if (depth >= 1) cur += ch;
        }
        return null;
    }
    function esc(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    // C · Java · JS 문자열 리터럴 → 실제 글자
    function unq(lit) {
        var q = lit[0], body = lit.slice(1, -1), out = "";
        for (var i = 0; i < body.length; i++) {
            var c = body[i];
            if (c === "\\") {
                var n = body[++i];
                out += n === "n" ? "\n" : n === "t" ? "\t" : n === "0" ? "" : n;
            } else out += c;
        }
        return out;
    }
    function isStr(a) { return /^(["'])(?:\\.|(?!\1).)*\1$/.test(a); }
    function isTpl(a) { return /^`[\s\S]*`$/.test(a); }

    // ------------------------------------------------------------ 출력문 → 정규식 조각
    // 조각 = { re: 정규식 문자열, caps: [인자 이름…], fixed: 고정 글자 수, input: 키보드 입력인지 }
    function piece() { return { re: "", caps: [], fixed: 0, lit: 0 }; }
    function tidy(p) {                           // 맨 끝의 "아무 글자" 자리는 비어 버리지 않게 → 공백 · 탭 전까지
        p.re = p.re.replace(/\(\[\^\\n\]\*\?\)$/, "([^\\s]+|[^\\n]*?)");
        return p;
    }
    function addText(p, t) { p.re += esc(t); p.fixed += t.replace(/\s/g, "").length; p.lit += t.length; }
    function addWild(p, name, kind, pad) {         // pad: "L" = 폭 있는 오른쪽 맞춤(앞 공백) · "R" = 왼쪽 맞춤(뒤 공백)
        var r = "([^\\n]*?)", a = pad === "L" ? " *" : "", b = pad === "R" ? " *" : "";
        if (kind === "int") r = "(" + a + "[-+]?\\d+" + b + ")";
        else if (kind === "float") r = "(" + a + "[-+]?(?:\\d+\\.?\\d*(?:e[-+]?\\d+)?|inf|nan|NaN|Infinity)" + b + ")";
        else if (kind === "hex") r = "(" + a + "(?:0[xX])?[0-9a-fA-F]+" + b + ")";
        else if (kind === "char") r = "([^\\n])";
        p.re += r; p.caps.push(name);
    }
    var SPEC = /%([-+ #0]*)(\d+|\*)?(?:\.(\d+|\*))?(hh|h|ll|l|L|z|j|t)?([diouxXfFeEgGcsp%n])/g;
    function fromFormat(p, fmt, args) {       // printf 서식 문자열
        var i = 0, a = 0, m;
        SPEC.lastIndex = 0;
        while ((m = SPEC.exec(fmt))) {
            addText(p, fmt.slice(i, m.index));
            var c = m[5];
            if (c === "%") addText(p, "%");
            else if (c === "n") addText(p, "\n");
            else {
                var kind = /[diu]/.test(c) ? "int" : /[fFeEgG]/.test(c) ? "float" : /[xXo]/.test(c) ? "hex" : c === "c" ? "char" : "str";
                addWild(p, (args[a] !== undefined ? args[a] : "?") + " (" + m[0] + ")", kind, /-/.test(m[1] || "") ? "R" : m[2] ? "L" : "");
                a++;
            }
            i = m.index + m[0].length;
        }
        addText(p, fmt.slice(i));
    }
    function fromConcat(p, expr, lang) {      // "합은" + sum · f"{a}" · `${a}`
        var parts = [], depth = 0, q = null, cur = "";
        for (var i = 0; i < expr.length; i++) {
            var ch = expr[i];
            if (q) { cur += ch; if (ch === "\\") { cur += expr[++i] || ""; continue; } if (ch === q) q = null; continue; }
            if (ch === '"' || ch === "'" || ch === "`") { q = ch; cur += ch; continue; }
            if ("([{".indexOf(ch) >= 0) depth++;
            if (")]}".indexOf(ch) >= 0) depth--;
            if (ch === "+" && depth === 0) { parts.push(cur.trim()); cur = ""; continue; }
            cur += ch;
        }
        parts.push(cur.trim());
        // 앞쪽 숫자끼리의 + 는 계산 (i + 1 + "번") → 문자열이 나오기 전까지는 한 덩어리
        var firstStr = -1;
        for (var k = 0; k < parts.length; k++) if (isStr(parts[k]) || isTpl(parts[k])) { firstStr = k; break; }
        if (firstStr > 0 && lang !== "python") parts = [parts.slice(0, firstStr).join(" + ")].concat(parts.slice(firstStr));
        if (firstStr < 0 && parts.length > 1) parts = [parts.join(" + ")];
        parts.forEach(function (x) {
            if (isStr(x)) addText(p, unq(x));
            else if (isTpl(x)) fromTemplate(p, x);
            else if (/^f["']/.test(x)) fromFString(p, x);
            else addWild(p, x.replace(/^\((.*)\)$/, "$1"), "str");
        });
    }
    function fromTemplate(p, t) {
        var body = t.slice(1, -1), re = /\$\{([^}]*)\}/g, i = 0, m;
        while ((m = re.exec(body))) { addText(p, unq("`" + body.slice(i, m.index) + "`")); addWild(p, m[1].trim(), "str"); i = m.index + m[0].length; }
        addText(p, unq("`" + body.slice(i) + "`"));
    }
    function fromFString(p, t) {
        var body = t.slice(2, -1), re = /\{([^}]*)\}/g, i = 0, m;
        while ((m = re.exec(body))) { addText(p, body.slice(i, m.index)); addWild(p, m[1].trim(), "str"); i = m.index + m[0].length; }
        addText(p, body.slice(i));
    }

    // 코드 한 줄에서 출력문 · 입력문 찾기
    var CALLS = {
        c: /\b(printf|puts|putchar|scanf_s|scanf|getchar|gets)\s*\(/g,
        java: /\b(System\.out\.println|System\.out\.printf|System\.out\.print|\w+\.nextInt|\w+\.nextDouble|\w+\.nextLine|\w+\.nextBoolean|\w+\.nextFloat|\w+\.nextLong|\w+\.next)\s*\(/g,
        javascript: /\b(console\.log)\s*\(/g,
        python: /\b(print|input)\s*\(/g
    };
    function emittersOf(code, lang) {
        var lines = code.split("\n"), list = [], rx = CALLS[lang];
        if (!rx) return list;
        // 함수 정의 안의 출력문이면, 그 함수를 부르는 줄의 주석을 대신 쓰기 위해 함수 이름 기억
        var fnAt = [], fnName = null, depth = 0, fnDepth = -1;
        var HEAD = /^\s*(?:(?:static|public|private|protected|final|void|int|double|char|float|String|boolean|long|short|unsigned)\s+)+(\w+)\s*\([^;]*\)\s*\{/;
        lines.forEach(function (ln, idx) {
            var sc = splitComment(ln, lang), c = sc[0];
            var fm = HEAD.exec(c) || /^\s*function\s+(\w+)\s*\(/.exec(c) || /^\s*def\s+(\w+)\s*\(/.exec(c)
                || /^\s*(?:let|const|var)\s+(\w+)\s*=\s*(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/.exec(c);
            var opens = (c.match(/\{/g) || []).length, closes = (c.match(/\}/g) || []).length;
            if (fm && !/^(if|for|while|switch|main|catch)$/.test(fm[1]) && fnDepth < 0) {
                if (lang !== "python" && opens && opens === closes) { fnAt[idx] = fm[1]; return; }   // 한 줄짜리 함수
                fnName = fm[1]; fnDepth = depth;
            }
            if (lang === "python" && fnName && /^\S/.test(ln) && !/^\s*def\s/.test(ln)) { fnName = null; fnDepth = -1; }
            fnAt[idx] = fnName;
            depth += opens - closes;
            if (lang !== "python" && fnDepth >= 0 && depth <= fnDepth && closes) { fnName = null; fnDepth = -1; }
        });
        lines.forEach(function (ln, idx) {
            var sc = splitComment(ln, lang), c = sc[0], m;
            rx.lastIndex = 0;
            while ((m = rx.exec(c))) {
                var name = m[1], r = readArgs(c, m.index + m[0].length - 1);
                if (!r) continue;
                var a = r.args, p = piece(), ok = true;
                p.src = c.slice(m.index, r.end + 1).trim();
                p.line = idx; p.comment = sc[1]; p.fn = fnAt[idx];
                if (lang === "c") {
                    if (name === "printf") { if (!isStr(a[0] || "")) ok = false; else fromFormat(p, unq(a[0]), a.slice(1)); }
                    else if (name === "puts") { if (isStr(a[0] || "")) addText(p, unq(a[0])); else addWild(p, a[0], "str"); addText(p, "\n"); }
                    else if (name === "putchar") { if (/^'.+'$/.test(a[0])) addText(p, unq(a[0])); else addWild(p, a[0], "char"); }
                    else { p.input = true; }
                } else if (lang === "java") {
                    if (/println$/.test(name)) { if (a.length) fromConcat(p, a[0], lang); addText(p, "\n"); }
                    else if (/printf$/.test(name)) { if (!isStr(a[0] || "")) ok = false; else fromFormat(p, unq(a[0]), a.slice(1)); }
                    else if (/print$/.test(name)) { if (a.length) fromConcat(p, a[0], lang); else ok = false; }
                    else p.input = true;
                } else if (lang === "javascript") {
                    a.forEach(function (x, k) { if (k) addText(p, " "); if (isStr(x)) addText(p, unq(x)); else if (isTpl(x)) fromTemplate(p, x); else fromConcatJs(p, x); });
                    addText(p, "\n");
                } else if (lang === "python") {
                    if (name === "input") { if (a[0] && isStr(a[0])) addText(p, unq(a[0])); p.input = true; }
                    else {
                        var end = "\n", sep = " ", vals = [];
                        a.forEach(function (x) {
                            var kw = /^(end|sep)\s*=\s*(.+)$/.exec(x);
                            if (kw) { if (isStr(kw[2])) { if (kw[1] === "end") end = unq(kw[2]); else sep = unq(kw[2]); } }
                            else vals.push(x);
                        });
                        vals.forEach(function (x, k) { if (k) addText(p, sep); if (isStr(x)) addText(p, unq(x)); else if (/^f["']/.test(x)) fromFString(p, x); else addWild(p, x, "str"); });
                        addText(p, end);
                    }
                }
                if (ok) list.push(tidy(p));
            }
        });
        return list;
    }
    function fromConcatJs(p, x) {
        if (/[+]/.test(x) && /["'`]/.test(x)) fromConcat(p, x, "javascript");
        else addWild(p, x, "str");
    }

    // ------------------------------------------------------------ 반복문 안인지 (줄마다)
    function loopFlags(code, lang) {
        var lines = code.split("\n"), flags = [], stack = [], single = false;
        if (lang === "python") {
            var ind = [];                                    // [들여쓰기, 반복인지]
            lines.forEach(function (ln, i) {
                var c = splitComment(ln, lang)[0];
                if (!c.trim()) { flags[i] = ind.some(function (x) { return x[1]; }); return; }
                var n = /^\s*/.exec(c)[0].length;
                while (ind.length && n <= ind[ind.length - 1][0]) ind.pop();
                flags[i] = ind.some(function (x) { return x[1]; });
                if (/:\s*$/.test(c)) ind.push([n, /^\s*(for|while)\b/.test(c)]);
            });
            return flags;
        }
        lines.forEach(function (ln, i) {
            var c = splitComment(ln, lang)[0];
            var header = /^\s*(for|while)\s*\(/.test(c) && !/^\s*while\s*\(.*\)\s*;\s*$/.test(c) || /^\s*do\b/.test(c) ||
                /\.(forEach|map)\s*\(|setInterval\s*\(|setTimeout\s*\(|=>/.test(c) || /\brepeat\s*\(/.test(c);
            var inLoop = single || stack.some(function (x) { return x; });
            flags[i] = inLoop || header;
            if (c.trim()) single = false;
            for (var k = 0; k < c.length; k++) {
                if (c[k] === "{") stack.push(header || false);
                else if (c[k] === "}") stack.pop();
            }
            if (header && !/\{/.test(c) && !/;\s*$/.test(c)) single = true;     // for (…) 다음 한 줄
        });
        return flags;
    }

    function branchFlags(code, lang) {
        var lines = code.split("\n"), flags = [], stack = [], single = false;
        lines.forEach(function (ln, i) {
            var c = splitComment(ln, lang)[0];
            var header = /^\s*(\}\s*)?(if|else|switch|case\b|default\s*:)/.test(c) || /\?[^:]*:/.test(c) && !/::/.test(c);
            flags[i] = single || stack.some(function (x) { return x; }) || header;
            if (c.trim()) single = false;
            for (var k = 0; k < c.length; k++) { if (c[k] === "{") stack.push(header); else if (c[k] === "}") stack.pop(); }
            if (/^\s*(\}\s*)?(if|else)\b/.test(c) && !/\{/.test(c) && !/;\s*$/.test(c)) single = true;
            if (lang === "python" && /^\s*(if|elif|else)\b.*:\s*$/.test(c)) single = true;
        });
        return flags;
    }

    // ------------------------------------------------------------ 출력과 짝 맞추기
    // 출력 글자를 앞에서부터 읽으며 그 자리에서 맞는 출력문을 고른다
    //  · 고정 글자(문자열)가 맞으면 믿는다 · 값만 찍는 출력문은 코드 순서(차례)로 고르고, 반복문 안에 그런 게 여럿이면 "확실하지 않음"
    //  · 함수 안의 출력문은 호출한 곳으로 돌아가니 차례를 바꾸지 않는다 · 반복문 밖의 출력문은 한 번만 쓴다
    var ERR = /^\s*([\w.$]*(Error|Exception)\b|Traceback|Exception in thread|at [\w.$<>]+\(|.*\berror\s+C\d{4}|.*: error:)/;
    function match(em, out) {
        var N = em.length, p = 0, expected = 0, segs = [], guard = 0, used = [];
        var comp = em.map(function (e) {
            var re = e.input ? "([^\\n]*\\n)" : e.re;
            try { return new RegExp(re, "yd"); } catch (x) { try { return new RegExp(re, "y"); } catch (y) { return null; } }
        });
        var repW = em.filter(function (e) { return !e.input && e.fixed === 0 && (e.loop || e.fn); }).length;
        while (p < out.length && guard++ < 5000) {
            var lineEnd = out.indexOf("\n", p); if (lineEnd < 0) lineEnd = out.length;
            var atLineStart = p === 0 || out[p - 1] === "\n";
            if (atLineStart && ERR.test(out.slice(p, lineEnd))) { segs.push({ start: p, end: lineEnd + 1, e: null, err: true }); p = lineEnd + 1; continue; }
            var cands = [];
            for (var k = 0; k < N; k++) {
                if (used[k] || !comp[k]) continue;
                var re = comp[k]; re.lastIndex = p;
                var m = re.exec(out);
                if (!m || m[0].length === 0) continue;
                if (ERR.test(m[0]) && !em[k].fixed) continue;
                var dist = (k - expected + N) % N;
                if (em[k].input && !atLineStart && dist !== 0) continue;        // 줄 중간의 입력은 바로 다음 차례일 때만
                cands.push({ k: k, m: m, dist: dist, fixed: em[k].input ? 0 : em[k].fixed, input: !!em[k].input });
            }
            if (!cands.length) { segs.push({ start: p, end: lineEnd + 1, e: null }); p = lineEnd + 1; continue; }
            var F = cands.filter(function (c) { return c.fixed > 0; });
            var best, sure = true;
            var byScore = function (a, b) { return (b.fixed * 4 - b.dist * 3) - (a.fixed * 4 - a.dist * 3); };
            if (F.length) {
                best = F.sort(byScore)[0];
                // 같은 문장을 찍는 출력문이 여러 갈래(if · else)에 있으면 어느 쪽인지 모름
                var twin = F.filter(function (c) { return c !== best && em[c.k].re === em[best.k].re; });
                if (twin.length && (em[best.k].branch || twin.some(function (c) { return em[c.k].branch; }))) sure = false;
                // 차례상 바로 다음이 입력문이면 (안내문 뒤 입력) 입력이 먼저
                var inp = cands.filter(function (c) { return c.input && c.dist === 0; })[0];
                if (inp && best.dist > 0 && best.fixed < 4 && p > 0 && out[p - 1] !== "\n") best = inp;
            } else {
                cands.sort(function (a, b) { return a.dist - b.dist; });
                // 줄 맨 앞에서는 입력보다 출력문이 먼저 (입력은 보통 안내문 바로 뒤)
                if (atLineStart && cands[0].input && cands.some(function (c) { return !c.input; })) cands = cands.filter(function (c) { return !c.input; }).concat(cands.filter(function (c) { return c.input; }));
                best = cands[0];
                var reps = cands.filter(function (c) { var e = em[c.k]; return !c.input && (e.loop || e.fn); });
                if (!best.input && (repW >= 2 && reps.length && (em[best.k].loop || em[best.k].fn) || best.dist > 0 && cands.length > 1)) sure = false;
            }
            var e = em[best.k];
            if (e.loop && !e.input && !e.lit) sure = false;          // 구분 글자 없이 이어 찍는 반복 → 어디까지가 한 번인지 모름
            segs.push({ start: p, end: p + best.m[0].length, e: e, m: best.m, sure: sure });
            p += best.m[0].length;
            if (!e.loop && !e.fn) used[best.k] = true;
            if (!e.fn) expected = (best.k + 1) % N;
        }
        return segs;
    }

    // ------------------------------------------------------------ 줄마다 설명 만들기
    function shortSrc(s) { return s.length > 60 ? s.slice(0, 57) + "…" : s; }
    function bindsOf(seg) {                       // [{at: 출력 안 위치, text: "%d ← c = 31"}]
        var e = seg.e, m = seg.m, out = [];
        (e.caps || []).forEach(function (name, i) {
            var v = (m[i + 1] || "").trim();
            var nm = name.replace(/\s*\(%[^)]*\)$/, "").trim();
            var spec = (/\((%[^)]*)\)$/.exec(name) || [])[1];
            if (isStr(nm) || nm === v || nm === "?") return;
            var at = m.indices && m.indices[i + 1] ? m.indices[i + 1][0] : seg.start;
            out.push({ at: at, name: (spec ? spec + " ← " : "") + nm, val: v, text: (spec ? spec + " ← " : "") + nm + " = " + (v === "" ? '""' : v) });
        });
        return out;
    }
    function assignNote(name, e, code, lang) {   // area = 314.0 → "double area = pizza.getArea(); // radius = 10 → …"
        if (!/^[A-Za-z_]\w*$/.test(name)) return "";
        var lines = code.split("\n"), rx = new RegExp("\\b" + name + "\\s*(<<=|>>=|[-+*/%&|^]?=)(?!=)");
        for (var i = e.line - 1; i >= 0; i--) {
            var sc = splitComment(lines[i], lang);
            if (rx.test(sc[0])) return sc[1] || "";
        }
        return "";
    }
    function commentFor(e, code, lang) {
        if (e.comment) return e.comment;
        if (e.fn) {                                   // 함수 안의 출력문 → 그 함수를 부른 줄의 주석
            var lines = code.split("\n"), found = [];
            for (var i = 0; i < lines.length; i++) {
                if (i === e.line) continue;
                var sc = splitComment(lines[i], lang);
                if (new RegExp("\\b" + e.fn + "\\s*\\(").test(sc[0]) && sc[1] && !/^\s*(void|int|double|char|float|public|static|function|def)\b/.test(sc[0])) found.push(sc[1]);
            }
            if (found.length === 1) return found[0];
        }
        return "";
    }
    function analyze(code, lang, out) {
        var text = out.replace(/\r/g, "");
        var lines = text.split("\n");
        if (lines.length && lines[lines.length - 1] === "") lines.pop();
        var res = lines.map(function (t) { return { text: t, notes: [], inputs: [], error: ERR.test(t) }; });
        if (!code || !lang || lang === "bash" || lang === "sql") return annotateSys(res);
        var em = emittersOf(code, lang);
        if (!em.length) return annotateSys(res);
        var lf = loopFlags(code, lang);
        var bf = branchFlags(code, lang);
        em.forEach(function (e) { e.loop = !!lf[e.line]; e.branch = !!bf[e.line]; });
        var full = lines.join("\n") + "\n";
        var segs = match(em, full), count = new Map(), total = new Map();
        var lastSeg = segs[segs.length - 1];
        res.trailingNl = !!(lastSeg && lastSeg.e && !lastSeg.e.input && lastSeg.end === full.length && /\n$/.test(lastSeg.e.re));   // 마지막 출력문이 \n 으로 끝남
        var starts = [], pos = 0;
        lines.forEach(function (t) { starts.push(pos); pos += t.length + 1; });
        function lineOf(ch) { var i = 0; while (i + 1 < starts.length && starts[i + 1] <= ch) i++; return i; }
        segs.forEach(function (sg) { if (sg.e) total.set(sg.e, (total.get(sg.e) || 0) + 1); });
        var partial = {};
        segs.forEach(function (sg) { if (!sg.e && !sg.err && sg.end - sg.start > 1) partial[lineOf(sg.start)] = true; });
        // 같은 코드 줄에 출력문이 둘 이상이면(안내 글자 + 결과) 설명은 마지막 출력문에만
        var lastOnLine = {};
        em.forEach(function (e, i) { lastOnLine[e.line] = i; });
        segs.forEach(function (sg) {
            if (!sg.e) { if (sg.err) { var Le = lineOf(sg.start); if (Le < res.length) res[Le].error = true; } return; }
            var n = (count.get(sg.e) || 0) + 1; count.set(sg.e, n);
            var chunk = full.slice(sg.start, sg.end);
            var lead = chunk.length - chunk.replace(/^\n+/, "").length;
            if (!chunk.replace(/\n/g, "").length) return;                 // 줄바꿈만 찍은 것
            var L = lineOf(sg.start + lead);
            if (L >= res.length) return;
            if (sg.e.input) {
                var body = chunk.slice(lead).replace(/\n$/, "");
                var s0 = sg.start + lead - starts[L];
                res[L].inputs.push([s0, s0 + body.length]);
                res[L].notes.push({ kind: "in", text: "⌨️ 키보드 입력" + (body.trim() ? " " + body.trim() : "") });
                return;
            }
            if (sg.sure === false) { res[L].unsure = true; return; }      // 어느 출력문인지 확실하지 않음 → 설명 안 붙임
            var repeated = (total.get(sg.e) || 0) > 1;
            var binds = bindsOf(sg);
            var isLabel = !(sg.e.caps || []).length && em.indexOf(sg.e) !== lastOnLine[sg.e.line];
            var cm = isLabel ? "" : commentFor(sg.e, code, lang);
            // 첫 줄: 반복이면 "k번째", 아니면 주석(없으면 값) · 여러 줄이면 값은 그 값이 찍힌 줄에
            var byLine = {};
            binds.forEach(function (b) { var l = lineOf(b.at); (byLine[l] = byLine[l] || []).push(b.text); });
            var lastL = lineOf(Math.max(sg.start, sg.end - 2));
            if (repeated && L === lastL) {                               // 반복 출력은 줄마다 모아서 나중에 요약
                var reps = res[L].reps || (res[L].reps = []);
                var acc = reps.filter(function (x) { return x.e === sg.e; })[0];
                if (!acc) { acc = { e: sg.e, from: n, to: n, vals: {}, order: [] }; reps.push(acc); }
                acc.to = n;
                binds.forEach(function (b) { if (!acc.vals[b.name]) { acc.vals[b.name] = []; acc.order.push(b.name); } acc.vals[b.name].push(b.val); });
                acc.src = shortSrc(sg.e.src);
                return;
            }
            for (var l = L; l <= Math.min(lastL, res.length - 1); l++) {
                var parts = [];
                if (l === L) {
                    if (repeated) parts.push(n + "번째");
                    if (cm && !repeated) parts.push(cm);
                }
                if (byLine[l] && (repeated || !cm || l !== L)) parts = parts.concat(byLine[l]);
                if (l === L && !repeated && !cm) binds.forEach(function (b) {      // 값만 있으면 그 변수를 계산한 줄의 주석
                    var an = assignNote(b.name.replace(/^%\S* ← /, ""), sg.e, code, lang);
                    if (an && parts.join(" ").indexOf(an) < 0) parts.push("(" + an + ")");
                });
                if (parts.length) res[l].notes.push({ kind: "why", text: parts.join(" · "), src: shortSrc(sg.e.src) });
            }
        });
        res.forEach(function (r) {                                        // 반복 출력 요약 (출력문마다)
            if (!r.reps) return;
            var many = r.reps.length > 1;
            r.reps.slice().reverse().forEach(function (a) {
                if (!a.order.length && (a.from !== a.to || many || r.unsure)) return;   // 값 없이 "3~5번째" 만이면 생략
                var parts = [a.from === a.to ? a.from + "번째" : a.from + "~" + a.to + "번째"];
                a.order.forEach(function (nm) {
                    var v = a.vals[nm], uniq = v.filter(function (x, i) { return v.indexOf(x) === i; });
                    parts.push(nm + " = " + (uniq.length === 1 ? uniq[0] : uniq.length <= 4 ? uniq.join(", ") : uniq[0] + " ~ " + uniq[uniq.length - 1]));
                });
                r.notes.unshift({ kind: "why", text: (many ? "[" + a.src + "] " : "") + parts.join(" · "), src: a.src });
            });
            delete r.reps;
        });
        res.forEach(function (r, i) {
            if (partial[i]) r.notes = r.notes.filter(function (n) { return n.kind === "in"; });
            var why = r.notes.filter(function (n) { return n.kind === "why"; });
            if (why.length > 2) {
                var keep = why.slice(0, 2); keep[1] = { kind: "why", text: keep[1].text + " · …", src: keep[1].src };
                r.notes = r.notes.filter(function (n) { return n.kind !== "why"; }).concat(keep);
            }
        });
        // 오류 줄: 코드에서 "오류"라고 적어 둔 줄이 하나면 그 설명
        var errNotes = code.split("\n").map(function (l) { return splitComment(l, lang)[1]; }).filter(function (c) { return /오류|Error|에러|Exception/.test(c); });
        res.forEach(function (r) { if (r.error && !r.notes.length && errNotes.length === 1) r.notes.push({ kind: "why", text: "⚠️ " + errNotes[0].replace(/^←\s*/, "") }); });
        return annotateSys(res);
    }

    // ------------------------------------------------------------ 리눅스 출력 칸별 풀이
    function dayToDate(n) {                       // /etc/shadow 의 날짜 = 1970-01-01 부터 며칠째
        if (!/^\d+$/.test(n)) return "(없음)";
        var d = new Date(Number(n) * 86400000);
        return d.toISOString().slice(0, 10) + " (1970-01-01 부터 " + n + "일)";
    }
    var CHAGE = [
        [/^마지막으로 암호를 바꾼 날/, "암호를 마지막으로 바꾼 날 (chage -d)"],
        [/^암호 만료\s*:/, "마지막 변경일 + 최대 날 수 → 이 날 암호 만료 (chage -M)"],
        [/^암호가 비활성화 기간/, "만료 뒤 계정이 잠기기까지 (chage -I)"],
        [/^계정 만료/, "이 날 계정 자체가 막힘 (chage -E)"],
        [/^암호를 바꿀 수 있는 최소 날 수/, "바꾼 뒤 이 날수가 지나야 다시 바꿀 수 있음 (chage -m)"],
        [/^암호를 바꿔야 하는 최대 날 수/, "이 날수 안에 바꿔야 함 · 99999 = 사실상 무제한 (chage -M)"],
        [/^암호 만료 예고를 하는 날 수/, "만료 며칠 전부터 경고 (chage -W)"]
    ];
    function annotateSys(res) {
        res.forEach(function (r) {
            if (r.notes.length) return;
            var t = r.text, m;
            if ((m = /^([a-z_][\w.-]*\$?):([^:]*):(\d+):(\d+):([^:]*):([^:]*):([^:]*)$/.exec(t))) {
                r.sys = "passwd";
                r.notes.push({ kind: "sys", text: "계정 " + m[1] + " · 암호 " + (m[2] === "x" ? "x(/etc/shadow 에)" : m[2]) + " · UID " + m[3] + " · GID " + m[4] + (m[5] ? " · 설명 " + m[5] : "") + " · 홈 " + m[6] + " · 셸 " + m[7] });
            } else if ((m = /^([a-z_][\w.-]*):([^:]*):(\d+):([^:]*)$/.exec(t))) {
                r.sys = "group";
                r.notes.push({ kind: "sys", text: "그룹 " + m[1] + " · GID " + m[3] + " · 구성원 " + (m[4] || "(없음)") });
            } else if ((m = /^([a-z_][\w.-]*):([^:]*):(\d*):(\d*):(\d*):(\d*):(\d*):(\d*):(\d*)$/.exec(t))) {
                r.sys = "shadow";
                var pw = m[2] === "!!" || m[2] === "!" || m[2] === "*" ? "암호 잠김(" + m[2] + ")" : /^\$/.test(m[2]) ? "암호화된 암호" : m[2] || "암호 없음";
                r.notes.push({ kind: "sys", text: "계정 " + m[1] + " · " + pw + " · 마지막 변경 " + dayToDate(m[3]) + " · 최소 " + (m[4] || "-") + " · 최대 " + (m[5] || "-") + " · 경고 " + (m[6] || "-") + "일" });
            } else if ((m = /^([a-z_][\w.-]*):([^:]*):([^:]*):([^:]*)$/.exec(t)) && !/^\d+$/.test(m[3])) {
                r.sys = "gshadow";
                r.notes.push({ kind: "sys", text: "그룹 암호 파일(/etc/gshadow) · 그룹 " + m[1] + " · " + (/^\$/.test(m[2]) ? "그룹 암호 설정됨" : m[2] === "!" || m[2] === "!!" ? "그룹 암호 잠김" : "그룹 암호 없음") + " · 관리자 " + (m[3] || "(없음)") + " · 구성원 " + (m[4] || "(없음)") });
            } else if ((m = /^([-dlcbps])([r-][w-][xsS-])([r-][w-][xsS-])([r-][w-][xtT-])[.+@]?\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+[KMGT]?)\s+(.+?)\s+(\S+(?: -> \S+)?)$/.exec(t))) {
                r.sys = "ls";
                var type = { "-": "파일", d: "디렉터리", l: "심볼릭 링크", c: "문자 장치", b: "블록 장치", p: "파이프", s: "소켓" }[m[1]];
                r.notes.push({ kind: "sys", text: type + " · 소유자 " + m[2] + " · 그룹 " + m[3] + " · 기타 " + m[4] + " · 링크 " + m[5] + " · " + m[6] + "/" + m[7] + " · " + m[8] + "B" });
            } else if ((m = /^(?:합계|total)\s+(\d+\w?)$/.exec(t))) {
                r.notes.push({ kind: "sys", text: "합계 = 아래 파일들이 차지하는 블록 수" });
            } else if ((m = /^uid=(\d+)\(([^)]+)\)\s+gid=(\d+)\(([^)]+)\)\s+groups=(.+)$/.exec(t))) {
                r.notes.push({ kind: "sys", text: "UID " + m[1] + "(" + m[2] + ") · 기본 그룹 GID " + m[3] + "(" + m[4] + ") · 속한 그룹 " + m[5].split(",").join(" · ") });
            } else {
                for (var i = 0; i < CHAGE.length; i++) if (CHAGE[i][0].test(t)) {
                    r.notes.push({ kind: "sys", text: (/:\s*안함\s*$/.test(t) ? "안함 = 설정 안 됨 · " : "") + CHAGE[i][1] }); break;
                }
            }
        });
        // 같은 형식이 12줄 넘게 이어지면 처음 3줄만 풀고 나머지는 생략
        var run = [];
        function flush() {
            if (run.length > 12) {                        // 처음 2줄 · 마지막 2줄만 풀고 가운데는 생략
                run.slice(2, run.length - 2).forEach(function (r) { r.notes = r.notes.filter(function (n) { return n.kind !== "sys"; }); });
                run[1].notes.push({ kind: "sys", text: "… 아래 " + (run.length - 4) + "줄도 같은 형식 (마지막 2줄도 풀이)" });
            }
            run = [];
        }
        res.forEach(function (r) { if (r.sys && run.length && run[0].sys === r.sys) run.push(r); else { flush(); if (r.sys) run.push(r); } });
        flush();
        return res;
    }

    var OV = { analyze: analyze, emittersOf: emittersOf, splitComment: splitComment };
    if (typeof module !== "undefined" && module.exports) { module.exports = OV; return; }
    global.OutView = OV;

    // ------------------------------------------------------------ 화면에 그리기
    var CSS =
        "pre.ov{position:relative}" +
        "pre.ov .ov-bar{position:absolute;top:6px;right:8px;display:flex;gap:6px;z-index:1}" +
        "pre.ov .ov-bar button{font-size:11px;line-height:1.6;font-family:inherit;padding:1px 8px;border-radius:10px;border:1px solid rgba(127,212,154,.45);background:rgba(127,212,154,.1);color:#9fe0b5;cursor:pointer}" +
        "pre.ov .ov-bar button[aria-pressed=false]{opacity:.55}" +
        "pre.ov code{display:block}" +
        ".ov-l{display:block;min-height:1.2em}" +
        ".ov-n{display:inline-block;min-width:2.2em;margin-right:.9em;padding-right:.5em;text-align:right;color:#5f8a70;border-right:1px solid rgba(127,212,154,.25);user-select:none;-webkit-user-select:none}" +
        ".ov-in{background:rgba(0,149,246,.22);border-radius:3px;box-shadow:0 0 0 1px rgba(0,149,246,.35) inset}" +
        ".ov-err .ov-t{color:#ff8a80}" +
        ".ov-w{margin-left:1.4em;color:#8fb3a0;font-size:.86em;user-select:none;-webkit-user-select:none;white-space:pre-wrap}" +
        ".ov-w b{font-style:normal;color:#b8e0c8;font-weight:600}" +
        ".ov-w .ov-k{color:#7fb2ff}" +
        "pre.ov.ov-nowhy .ov-w{display:none}" +
        "pre.ov .ov-sp,pre.ov .ov-tb{border-radius:2px}" +
        "pre.ov.ov-ws .ov-sp{background:rgba(255,196,0,.35)}" +
        "pre.ov.ov-ws .ov-tb{background:rgba(255,120,0,.3)}" +
        "pre.ov.ov-ws .ov-eol::after{content:'⏎';color:#c9a24a;margin-left:2px;user-select:none;-webkit-user-select:none}" +
        "@media (max-width:640px){.ov-w{display:block;margin-left:3.4em;white-space:normal}}";
    function h(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function renderText(t, inputs, last) {
        // 입력 구간 · 줄 끝 공백 · 탭 표시
        var trail = /[ \t]*$/.exec(t)[0], core = t.slice(0, t.length - trail.length), out = "", i = 0;
        var marks = (inputs || []).slice().sort(function (a, b) { return a[0] - b[0]; });
        function seg(s, e) {
            var part = core.slice(s, Math.min(e, core.length));
            return h(part).replace(/\t/g, '<span class="ov-tb">\t</span>');
        }
        marks.forEach(function (r) {
            if (r[0] > i) out += seg(i, r[0]);
            out += '<span class="ov-in" title="키보드로 입력한 부분">' + seg(Math.max(r[0], i), r[1]) + "</span>";
            i = Math.max(i, r[1]);
        });
        if (i < core.length) out += seg(i, core.length);
        out += trail.replace(/ /g, '<span class="ov-sp"> </span>').replace(/\t/g, '<span class="ov-tb">\t</span>');
        return out + (last ? "" : '<span class="ov-eol"></span>');
    }
    function codeBefore(pre) {
        var start = pre.parentElement && pre.parentElement.classList.contains("codecopy") ? pre.parentElement : pre;
        var el = start.previousElementSibling, hops = 0;
        while (el && hops++ < 6) {
            if (/^H[1-4]$/.test(el.tagName)) return null;
            // 복사 버튼 상자(div.codecopy) 안의 <pre> 도 코드 블록으로
            var box = el.tagName === "PRE" ? el : (el.classList && el.classList.contains("codecopy") ? el.querySelector("pre") : null);
            if (box) {
                var c = box.querySelector("code");
                if (!box.classList.contains("io") && c && /language-(c|java|javascript|js|python|bash|shell|sh)\b/.test(c.className)) return c;
                if (!box.classList.contains("io")) return null;
            }
            el = el.previousElementSibling;
        }
        return null;
    }
    function langOf(code) {
        var m = /language-(\w+)/.exec(code.className) || [];
        var l = m[1];
        return l === "js" ? "javascript" : (l === "shell" || l === "sh") ? "bash" : l;
    }
    function enhance(pre) {
        if (pre.classList.contains("ov") || pre.classList.contains("bits")) return;
        if (pre.closest(".oq, .ct, .ct-result, .ex-q, #ex-exam, .quiz-item")) return;
        var code = pre.querySelector("code") || pre;
        var raw = code.textContent;
        if (!raw.trim()) return;
        var src = codeBefore(pre);
        var res;
        try { res = analyze(src ? src.textContent : "", src ? langOf(src) : "", raw); } catch (e) { return; }
        var endsNl = /\n$/.test(raw) || res.trailingNl;
        var html = res.map(function (r, i) {
            var notes = r.notes.filter(function (n) { return n.text; }).map(function (n) {
                return n.kind === "in" ? '<span class="ov-k">' + h(n.text) + "</span>" : h(n.text);
            });
            var why = notes.length ? '<span class="ov-w" title="' + h((r.notes.filter(function (n) { return n.src; }).map(function (n) { return n.src; })).join("\n")) + '">← ' + notes.join("  ·  ") + "</span>" : "";
            return '<span class="ov-l' + (r.error ? " ov-err" : "") + '"><span class="ov-n">' + (i + 1) + '</span><span class="ov-t">' +
                renderText(r.text, r.inputs, i === res.length - 1 && !endsNl) + "</span>" + why + "</span>";
        }).join("");
        code.innerHTML = html;
        pre.classList.add("ov");
        var bar = document.createElement("div");
        bar.className = "ov-bar";
        var hasWhy = res.some(function (r) { return r.notes.length; });
        if (hasWhy) bar.appendChild(btn("💡 풀이", true, function (on) { pre.classList.toggle("ov-nowhy", !on); }));
        bar.appendChild(btn("␣ 공백", false, function (on) { pre.classList.toggle("ov-ws", on); }));
        pre.insertBefore(bar, pre.firstChild);
    }
    function btn(label, on, fn) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = label; b.setAttribute("aria-pressed", on ? "true" : "false");
        b.title = label.indexOf("공백") >= 0 ? "줄 끝 공백 · 탭 · 줄바꿈(⏎)을 표시" : "줄마다 붙은 설명 보이기 / 숨기기";
        b.addEventListener("click", function () { var v = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", v ? "true" : "false"); fn(v); });
        return b;
    }
    function run() {
        if (!document.getElementById("outview-css")) {
            var st = document.createElement("style"); st.id = "outview-css"; st.textContent = CSS; document.head.appendChild(st);
        }
        document.querySelectorAll("pre.io").forEach(enhance);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})(typeof window !== "undefined" ? window : this);
