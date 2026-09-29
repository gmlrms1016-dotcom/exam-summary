/* =====================================================================
   codetest.js  ·  언어 과목 코딩테스트 — 소스코드를 붙여넣으면 채점
   - <div class="ct" data-lang="c|java|js|sql"> 한 개 = 문제 한 개
       <script type="application/json" class="ct-tests">[{"stdin":"…","expect":"…"}, …]</script>  테스트 케이스
       <script type="text/plain" class="ct-answer">…</script>                                     정답 코드(정답 보기)
       data-must='["정규식", …]'  data-must-msg="…"  (선택) 코드에 꼭 들어가야 하는 것 — 목록의 정규식이 모두 맞아야 함 (SQL 은 대소문자 무시)
       data-exam="출처 설명"  (선택) 교수님이 "시험문제" 라고 한 코드 → 🔥 시험문제 배지와 빨간 테두리
   - 실행: C · Java = Wandbox 온라인 컴파일러(gcc · OpenJDK) / JS = 브라우저 Web Worker (prompt() 는 입력 줄을 차례로 돌려줌 ·
           setTimeout · setInterval 은 가상 시계 — 기다리지 않고 본 코드가 끝난 뒤 예약 시각 순서대로 실행, 콜백 1000번이 넘으면 멈추지 않는 것으로 봄)
           SQL = 브라우저 안의 SQLite(sql.js · cdnjs → 안 되면 jsDelivr)를 MySQL 처럼 맞춰서 실행 (아래 "SQL 실행기" 설명)
   - 채점: 줄 끝 공백 · 마지막 빈 줄만 무시하고 출력이 기대값과 같아야 통과
   - SQL 테스트 한 개 = 빈 DB → setup → 붙여넣은 코드 → check 순서로 실행
       {"label":"설명", "setup":"준비 SQL(CREATE TABLE·INSERT)", "check":"채점 SQL", "expect":{"columns":[…],"rows":[[…],…]}}
         → check 의 마지막 SELECT 결과(check 가 없으면 붙여넣은 코드의 마지막 SELECT 결과)가 expect 와 같아야 통과
           열은 이름·순서까지(대소문자 무시), 행은 순서 무시(투플의 무순서성) · 값은 글자로 비교, NULL 은 NULL 끼리만 같음
       {"label":"…", "check":"INSERT …", "error":"FOREIGN KEY", "why":"설명"}
         → check 의 마지막 문장이 오류로 거부돼야 통과 (error = 오류 메시지에 들어 있어야 하는 글자 · 제약조건 검사용)
   - #ct-score 에 통과 개수 표시 · 시험 종료(?done=1) 면 정답 코드 모두 공개
   사용: 과목 페이지 끝에 <script src="codetest.js"></script>
   ===================================================================== */
(function () {
    "use strict";

    var WANDBOX = "https://wandbox.org/api/compile.json";
    var COMPILER = { c: "gcc-13.2.0-c", java: "openjdk-jdk-22+36" };
    var LANG_NAME = { c: "C", java: "Java", js: "JavaScript", sql: "SQL" };

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
        + ".ct-lbl{font-size:12.5px;font-weight:800;margin:6px 0 2px;}"
        + ".ct-tblwrap{overflow-x:auto;max-width:100%;}"
        + ".ct-tbl{border-collapse:collapse;width:auto;margin:2px 0 0;font-size:13px;background:var(--card);}"
        + ".ct-tbl th,.ct-tbl td{border:1px solid var(--line);padding:5px 10px;text-align:left;white-space:nowrap;}"
        + ".ct-tbl th{background:#eaf2ec;}"
        + ".ct-null{color:#9aa69c;font-style:italic;font-size:12px;}"
        + ".ct-note{font-size:13px;color:var(--ink-2,#5e6b62);margin:4px 0 8px;line-height:1.6;}"
        + ".ct-hint{margin:6px 0 0;line-height:1.6;}"
        + ".ct-case pre.ct-chk::before{content:\"🔎 채점 SQL\";}"
        + ".ct pre.ct-setup::before{content:\"📦 미리 준비된 표\";}"
        + ".ct-ex > div{min-width:0;}"
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
        // 가상 타이머 — setTimeout · setInterval 을 실제로 기다리지 않고, 본 코드가 끝난 뒤 예약 시각 순서대로 바로 실행 (같은 시각이면 먼저 예약한 것부터)
        "  var tq = [], tseq = 0, tnow = 0, tid = 0, tdead = {};",
        "  function tadd(fn, ms, args, rep) { ms = Number(ms); if (!(ms >= 1 && ms <= 2147483647)) ms = 1; var id = ++tid; tq.push({ id: id, at: tnow + ms, ms: ms, fn: fn, args: args, rep: rep, s: tseq++ }); return id; }",
        "  function sT(fn, ms) { return tadd(fn, ms, [].slice.call(arguments, 2), false); }",
        "  function sI(fn, ms) { return tadd(fn, ms, [].slice.call(arguments, 2), true); }",
        "  function cT(id) { tdead[id] = 1; tq = tq.filter(function (t) { return t.id !== id; }); }",
        "  function runTimers() {",
        "    for (var n = 0; tq.length; n++) {",
        "      if (n >= 1000) throw new Error('타이머가 끝나지 않아요 — setInterval 을 clearInterval 로 멈췄나요?');",
        "      var k = 0; for (var i = 1; i < tq.length; i++) if (tq[i].at < tq[k].at || (tq[i].at === tq[k].at && tq[i].s < tq[k].s)) k = i;",
        "      var t = tq.splice(k, 1)[0]; tnow = t.at;",
        "      if (typeof t.fn === 'function') t.fn.apply(null, t.args);",
        "      if (t.rep && !tdead[t.id]) { t.at = tnow + t.ms; t.s = tseq++; tq.push(t); }",
        "    }",
        "  }",
        "  var win = { prompt: prompt, alert: function (v) { out.push(show(v)); }, setTimeout: sT, setInterval: sI, clearTimeout: cT, clearInterval: cT };",
        "  try { new Function('console', 'prompt', 'window', 'alert', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', e.data.code)(cons, prompt, win, win.alert, sT, sI, cT, cT);",
        "        runTimers();",
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

    // ---- SQL 실행기 — sql.js(브라우저 안의 SQLite)를 수업의 MySQL 처럼 맞춰서 실행 ----
    //  · MySQL 전용 문장(USE · CREATE/DROP DATABASE · DESC · SHOW · SET · COMMIT)은 건너뛰고 알려 줌
    //  · MySQL(InnoDB)과 같게 맞춘 것: 외래키 검사 켜기 · 기본키 순서로 저장(WITHOUT ROWID) · 기본키는 자동으로 필수 입력
    //    · 문자 비교는 대소문자 무시(COLLATE NOCASE) · char(n)/varchar(n) 글자 수 제한 · DEFAULT NOW() · VALUES(…, DEFAULT) · 뷰에 INSERT
    //    · 부모보다 자식을 먼저 만들기 / 부모를 먼저 지우기 / 외래키 자료형이 다르면 MySQL 과 같은 오류
    //  · 못 맞춘 것(문제에서 피함): date 표시 형식('19900315' → MySQL 1990-03-15) · decimal 소수 자리(4 → MySQL 4.0) · 오류 문구
    var SQLJS_BASE = ["https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/", "https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/"];
    var sqlLoading = null;
    function loadSqlJs() {
        if (sqlLoading) return sqlLoading;
        function tryBase(i) {
            return new Promise(function (resolve, reject) {
                var s = document.createElement("script");
                s.src = SQLJS_BASE[i] + "sql-wasm.js";
                s.onload = resolve;
                s.onerror = function () { reject(new Error("sql.js 를 불러오지 못했어요 (" + SQLJS_BASE[i] + ")")); };
                document.head.appendChild(s);
            }).then(function () {
                return window.initSqlJs({ locateFile: function (f) { return SQLJS_BASE[i] + f; } });
            }).catch(function (e) {
                if (i + 1 < SQLJS_BASE.length) return tryBase(i + 1);
                throw e;
            });
        }
        sqlLoading = tryBase(0);
        sqlLoading.catch(function () { sqlLoading = null; });      // 실패하면 다음 클릭 때 다시 시도
        return sqlLoading;
    }

    function qid(s) { return '"' + String(s).replace(/"/g, '""') + '"'; }
    function unq(s) { s = String(s).trim().replace(/^[`"\[]|[`"\]]$/g, ""); return s.slice(s.lastIndexOf(".") + 1); }   // testdb.학생 → 학생
    function sqlShort(s) { s = String(s).replace(/\s+/g, " ").trim(); return s.length > 160 ? s.slice(0, 157) + "…" : s; }

    // 문장 단위로 나누기 (따옴표 안의 ; 는 그대로) · 주석(-- · # · /* */)은 지움 · MySQL 의 \' 는 SQLite 의 '' 로
    function sqlSplit(src) {
        var out = [], cur = "", q = "", i = 0, n = src.length, c, e;
        var ESC = { n: "\n", t: "\t", r: "\r", "0": "" };
        while (i < n) {
            c = src[i];
            if (q) {
                if (c === "\\" && q !== "`" && i + 1 < n) {
                    var d = src[i + 1];
                    cur += d === q ? q + q : (ESC.hasOwnProperty(d) ? ESC[d] : d);
                    i += 2; continue;
                }
                cur += c;
                if (c === q) {
                    if (src[i + 1] === q) { cur += q; i += 2; continue; }  // '' = 따옴표 글자 하나
                    q = "";
                }
                i++; continue;
            }
            if (c === "'" || c === '"' || c === "`") { q = c; cur += c; i++; continue; }
            if ((c === "-" && src[i + 1] === "-") || c === "#") {
                e = src.indexOf("\n", i); i = e < 0 ? n : e; continue;
            }
            if (c === "/" && src[i + 1] === "*") {
                e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; cur += " "; continue;
            }
            if (c === ";") { if (cur.trim()) out.push(cur.trim()); cur = ""; i++; continue; }
            cur += c; i++;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    }
    // 괄호 · 따옴표 밖의 쉼표로 나누기
    function splitTop(s) {
        var parts = [], depth = 0, q = "", cur = "";
        for (var i = 0; i < s.length; i++) {
            var c = s[i];
            if (q) { cur += c; if (c === q) q = ""; continue; }
            if (c === "'" || c === '"' || c === "`") q = c;
            else if (c === "(") depth++;
            else if (c === ")") depth--;
            else if (c === "," && !depth) { parts.push(cur); cur = ""; continue; }
            cur += c;
        }
        parts.push(cur);
        return parts;
    }

    // MySQL 의 CREATE TABLE 을 같은 동작의 SQLite 문장으로
    function sqlCreateTable(sql) {
        var m = /^CREATE\s+(TEMPORARY\s+)?TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(`[^`]+`|"[^"]+"|[^\s(]+)\s*\(/i.exec(sql);
        if (!m) return { sql: sql };
        var start = m[0].length, depth = 1, q = "", i = start;
        for (; i < sql.length && depth; i++) {
            var c = sql[i];
            if (q) { if (c === q) q = ""; continue; }
            if (c === "'" || c === '"' || c === "`") q = c;
            else if (c === "(") depth++;
            else if (c === ")") depth--;
        }
        if (depth) return { sql: sql };                           // 괄호가 안 맞으면 SQLite 오류 그대로
        var table = unq(m[3]), tail = sql.slice(i).trim(), hasPk = false, auto = /AUTO_INCREMENT/i.test(sql), defs = [];
        splitTop(sql.slice(start, i - 1)).forEach(function (p) {
            var t = p.trim();
            if (!t || /^(KEY|INDEX|FULLTEXT)\b/i.test(t)) return;          // MySQL 인덱스 정의는 무시
            if (/^(CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\b/i.test(t)) { hasPk = true; defs.push(t); return; }
            if (/^(CONSTRAINT|FOREIGN|UNIQUE|CHECK)\b/i.test(t)) { defs.push(t); return; }
            var c = /^(`[^`]+`|"[^"]+"|\S+)\s+([A-Za-z]+)(\s*\(\s*(\d+)\s*(?:,\s*\d+\s*)?\))?/.exec(t);
            if (!c) { defs.push(t); return; }
            var col = unq(c[1]), type = c[2].toLowerCase();
            var rest = t.slice(c[0].length)
                .replace(/\bDEFAULT\s+(NOW\s*\(\s*\)|CURRENT_TIMESTAMP(\s*\(\s*\))?)/ig, "DEFAULT (datetime('now','localtime'))")
                .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP(\s*\(\s*\))?/ig, "")
                .replace(/\bCOMMENT\s+'(?:[^']|'')*'/ig, "")
                .replace(/\bCHARACTER\s+SET\s+\w+|\bCOLLATE\s+\w+/ig, "");
            if (/\bPRIMARY\s+KEY\b/i.test(rest)) hasPk = true;
            var extra = "";
            if (/^(n?var)?char$|^(tiny|medium|long)?text$/.test(type)) {
                extra = " COLLATE NOCASE";                         // MySQL 기본 설정처럼 'kim' = 'Kim'
                if (c[4] && /char$/.test(type)) extra += " CONSTRAINT " + qid("__len " + col + " " + c[4]) + " CHECK (length(" + qid(col) + ") <= " + c[4] + ")";
            }
            defs.push(qid(col) + " " + t.slice(c[1].length, c[0].length).trim() + extra + rest);
        });
        return {
            table: table, tail: tail,
            sql: "CREATE " + (m[1] ? "TEMP " : "") + "TABLE " + (m[2] ? "IF NOT EXISTS " : "") + qid(table) + " (\n  " + defs.join(",\n  ") + "\n)"
                + (hasPk && !auto ? " WITHOUT ROWID" : "")         // 기본키 순서로 저장 = InnoDB · 기본키는 NULL 불가
        };
    }

    function sqlRows(db, sql, params) {
        var st = db.prepare(sql), out = [];
        try { if (params) st.bind(params); while (st.step()) out.push(st.getAsObject()); } finally { st.free(); }
        return out;
    }
    function sqlObj(db, name, type) {
        return sqlRows(db, "SELECT name, type FROM sqlite_master WHERE name = ? COLLATE NOCASE" + (type ? " AND type = '" + type + "'" : ""), [name])[0] || null;
    }
    function myErr(code, text, hint) {
        var e = new Error(text); e.mysql = "Error Code: " + code + ". " + text; e.hint = hint; return e;
    }
    function typeFamily(t) {
        t = String(t || "").toLowerCase().replace(/\s+/g, " ").trim();
        var base = t.replace(/\s*\(.*$/, "").replace(/\s+(un)?signed.*$/, "");
        if (/^(tinyint|smallint|mediumint|int|integer|bigint)$/.test(base)) return (base === "integer" ? "int" : base) + (/unsigned/.test(t) ? " unsigned" : "");
        if (/^(n?var)?char$|^(tiny|medium|long)?text$/.test(base)) return "문자형";
        return t;
    }
    // CREATE TABLE 뒤 외래키 검사 — MySQL 은 부모가 없거나 자료형이 다르면 테이블을 만들지 않음
    function sqlCheckFk(db, table) {
        var cols = sqlRows(db, "SELECT name, type FROM pragma_table_info(?)", [table]);
        sqlRows(db, "SELECT * FROM pragma_foreign_key_list(?)", [table]).forEach(function (fk) {
            var parent = fk.table, name = table + "_ibfk_" + (fk.id + 1);
            if (!sqlObj(db, parent, "table")) throw myErr(1824, "Failed to open the referenced table '" + parent + "'",
                "부모 테이블 " + parent + " 이(가) 아직 없어요 — ★ 테이블 생성 순서는 부모 → 자식이에요.");
            var pcols = sqlRows(db, "SELECT name, type, pk FROM pragma_table_info(?)", [parent]);
            var to = fk.to || (pcols.filter(function (c) { return c.pk; })[0] || {}).name;
            var pcol = pcols.filter(function (c) { return String(c.name).toLowerCase() === String(to).toLowerCase(); })[0];
            if (!pcol) throw myErr(3734, "Failed to add the foreign key constraint. Missing column '" + to + "' for constraint '" + name + "' in the referenced table '" + parent + "'",
                "부모 테이블 " + parent + " 에 " + to + " 열이 없어요.");
            var unique = pcol.pk > 0 || sqlRows(db, "SELECT il.name FROM pragma_index_list(?) il JOIN pragma_index_info(il.name) ii WHERE il.\"unique\" AND ii.seqno = 0 AND ii.name = ? COLLATE NOCASE", [parent, pcol.name]).length;
            if (!unique) throw myErr(1822, "Failed to add the foreign key constraint. Missing index for constraint '" + name + "' in the referenced table '" + parent + "'",
                "외래키는 부모 테이블의 기본키(" + parent + "의 PRIMARY KEY)를 참조해야 해요.");
            var ccol = cols.filter(function (c) { return String(c.name).toLowerCase() === String(fk.from).toLowerCase(); })[0] || {};
            if (typeFamily(ccol.type) !== typeFamily(pcol.type)) throw myErr(3780, "Referencing column '" + fk.from + "' and referenced column '" + pcol.name + "' in foreign key constraint '" + name + "' are incompatible.",
                "★시험 — 외래키 열과 참조되는 열의 데이터 형식이 같아야 해요: " + table + "." + fk.from + " " + String(ccol.type).toLowerCase() + " ↔ " + parent + "." + pcol.name + " " + String(pcol.type).toLowerCase());
        });
    }
    // DROP TABLE / VIEW — 없는 건 건너뛰고(알림), 자식이 참조 중인 부모는 MySQL 처럼 거부
    function sqlDrop(db, kind, ifExists, list, notes) {
        var names = splitTop(list).map(unq).filter(Boolean);
        names.forEach(function (nm) {
            var obj = sqlObj(db, nm, kind === "VIEW" ? "view" : "table");
            if (!obj) {
                if (!ifExists) notes.push("DROP " + kind + " " + nm + " — 아직 없는 " + (kind === "VIEW" ? "뷰" : "표") + "라 건너뛰었어요 (MySQL 이면 처음 실행할 때 Error 1051 · 그래서 IF EXISTS 를 붙여요)");
                return;
            }
            if (kind === "TABLE") {
                sqlRows(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").forEach(function (t) {
                    if (names.some(function (x) { return x.toLowerCase() === String(t.name).toLowerCase(); })) return;
                    sqlRows(db, "SELECT id FROM pragma_foreign_key_list(?) WHERE \"table\" = ? COLLATE NOCASE", [t.name, obj.name]).forEach(function (fk) {
                        throw myErr(3730, "Cannot drop table '" + obj.name + "' referenced by a foreign key constraint '" + t.name + "_ibfk_" + (fk.id + 1) + "' on table '" + t.name + "'.",
                            "자식 테이블 " + t.name + " 이(가) " + obj.name + " 을(를) 참조하고 있어요 — ★ 테이블 삭제 순서는 자식 → 부모예요.");
                    });
                });
            }
            db.run("DROP " + kind + " " + qid(obj.name));
        });
    }
    // 단순한 뷰(한 테이블의 열을 그대로 고른 뷰)는 MySQL 처럼 INSERT 가 되도록 INSTEAD OF 트리거를 붙임
    function sqlViewInsert(db, sql) {
        var m = /^CREATE\s+VIEW\s+(`[^`]+`|"[^"]+"|[^\s(]+)\s*(?:\([^)]*\))?\s+AS\s+SELECT\s+([\s\S]+?)\s+FROM\s+(`[^`]+`|"[^"]+"|[^\s;]+)(\s+WHERE\s[\s\S]*)?$/i.exec(sql);
        if (!m) return;
        var view = unq(m[1]), table = unq(m[3]);
        if (!sqlObj(db, table, "table")) return;
        var src;
        if (m[2].trim() === "*") src = sqlRows(db, "SELECT name FROM pragma_table_info(?)", [table]).map(function (c) { return c.name; });
        else {
            src = splitTop(m[2]).map(function (it) {
                var w = /^\s*(?:[^\s.]+\.)?(`[^`]+`|"[^"]+"|[^\s`"(),.'+\-*\/]+)(?:\s+(?:AS\s+)?\S+)?\s*$/i.exec(it);
                return w ? unq(w[1]) : null;
            });
            if (src.some(function (x) { return !x; })) return;     // 계산식이 섞인 뷰는 입력 불가(MySQL 과 같음)
        }
        var vcols = sqlRows(db, "SELECT name FROM pragma_table_info(?)", [view]).map(function (c) { return c.name; });
        if (vcols.length !== src.length) return;
        db.run("CREATE TRIGGER " + qid("__ins " + view) + " INSTEAD OF INSERT ON " + qid(view) + " BEGIN INSERT INTO " + qid(table)
            + " (" + src.map(qid).join(", ") + ") VALUES (" + vcols.map(function (c) { return "NEW." + qid(c); }).join(", ") + "); END");
    }
    // MySQL 의 VALUES(…, DEFAULT, …) — 그 열의 기본값(없으면 NULL)으로 바꿈
    function sqlInsertDefault(db, s) {
        var m = /^(INSERT\s+INTO\s+(`[^`]+`|"[^"]+"|[^\s(]+)\s*(?:\(([^)]*)\))?\s*VALUES\s*)([\s\S]+)$/i.exec(s);
        if (!m) return s;
        var info = sqlRows(db, "SELECT name, dflt_value FROM pragma_table_info(?)", [unq(m[2])]);
        var cols = m[3] ? splitTop(m[3]).map(unq) : info.map(function (c) { return c.name; });
        function dflt(name) {
            var c = info.filter(function (x) { return String(x.name).toLowerCase() === String(name).toLowerCase(); })[0];
            return c && c.dflt_value != null ? "(" + c.dflt_value + ")" : "NULL";
        }
        return m[1] + splitTop(m[4]).map(function (row) {
            var t = row.trim(), close = t.lastIndexOf(")");
            if (t[0] !== "(" || close < 0) return row;
            return " (" + splitTop(t.slice(1, close)).map(function (v, i) { return /^\s*DEFAULT\s*$/i.test(v) ? " " + dflt(cols[i]) : v; }).join(",") + ")" + t.slice(close + 1);
        }).join(",");
    }
    var SQL_SKIP = [
        [/^USE\s/i, "데이터베이스 선택"], [/^(CREATE|DROP)\s+(DATABASE|SCHEMA)\b/i, "데이터베이스 만들기·지우기"],
        [/^(DESC|DESCRIBE|EXPLAIN)\s/i, "테이블 구조 보기"], [/^SHOW\s/i, "SHOW"], [/^SET\s/i, "설정"],
        [/^(COMMIT|ROLLBACK|START\s+TRANSACTION|BEGIN)\b/i, "COMMIT · ROLLBACK"]
    ];
    // 문장 하나 실행 → SELECT 면 { columns, rows }
    function sqlStatement(db, s, notes) {
        for (var k = 0; k < SQL_SKIP.length; k++) if (SQL_SKIP[k][0].test(s)) {
            notes.push(sqlShort(s) + " — MySQL 전용(" + SQL_SKIP[k][1] + ")이라 건너뛰었어요 · 채점기는 빈 데이터베이스 하나에서 실행해요");
            return null;
        }
        if (/^CREATE\s+(TEMPORARY\s+)?TABLE\b/i.test(s)) {
            var ct = sqlCreateTable(s);
            if (ct.tail) notes.push("CREATE TABLE 뒤의 " + sqlShort(ct.tail) + " — MySQL 테이블 옵션이라 무시했어요");
            db.run(ct.sql);
            if (ct.table) try { sqlCheckFk(db, ct.table); } catch (e) { db.run("DROP TABLE " + qid(ct.table)); throw e; }
            return null;
        }
        var d = /^DROP\s+(TABLE|VIEW)\s+(IF\s+EXISTS\s+)?([\s\S]+?)(?:\s+(?:CASCADE|RESTRICT))?$/i.exec(s);
        if (d) { sqlDrop(db, d[1].toUpperCase(), !!d[2], d[3], notes); return null; }
        if (/^INSERT\b/i.test(s) && /[(,]\s*DEFAULT\s*[,)]/i.test(s)) s = sqlInsertDefault(db, s);
        var st = db.prepare(s), cols, rows = [];
        try { cols = st.getColumnNames(); while (st.step()) rows.push(st.get()); } finally { st.free(); }
        if (/^CREATE\s+VIEW\b/i.test(s)) sqlViewInsert(db, s);
        return cols.length ? { columns: cols, rows: rows } : null;
    }
    var SQL_HINT = [
        [/UNIQUE constraint failed: (.+)$/, "1062. Duplicate entry", "기본키(또는 UNIQUE) 중복 — $1 에 같은 값이 이미 있어요. 기본키는 중복 불가예요."],
        [/NOT NULL constraint failed: (\S+)/, "1048. Column cannot be null", "$1 은(는) 필수 입력 열이에요 (NOT NULL · 기본키는 필수 입력) — 값을 꼭 넣어야 해요."],
        [/FOREIGN KEY constraint failed/, "1452. Cannot add or update a child row: a foreign key constraint fails", "외래키 값이 부모 테이블의 기본키에 없어요 (참조 무결성) — 데이터 입력 순서는 부모 → 자식이에요."],
        [/CHECK constraint failed: __len (\S+) (\d+)/, "1406. Data too long for column '$1'", "$1 은(는) $2 글자까지만 들어가요 — char(n) · varchar(n) 의 n 을 확인하세요."],
        [/no such table: (?:main\.)?(\S+)/, "1146. Table 'testdb.$1' doesn't exist", "테이블 $1 이(가) 없어요 — 이름 오타인지, CREATE TABLE 을 먼저 했는지 확인하세요."],
        [/(?:table|view) (\S+) already exists/, "1050. Table '$1' already exists", "$1 이(가) 이미 있어요."],
        [/no such column: (\S+)/, "1054. Unknown column '$1'", "열 $1 이(가) 없어요 — 열 이름 오타인지 확인하고, 문자 값이면 '작은따옴표'로 감싸세요."],
        [/table (\S+) has (\d+) columns but (\d+) values were supplied/, "1136. Column count doesn't match value count", "$1 은(는) 열이 $2 개인데 값은 $3 개예요 — 열 이름을 생략하면 모든 열의 값을 순서대로 넣어야 해요."],
        [/(\d+) values for (\d+) columns/, "1136. Column count doesn't match value count", "값은 $1 개, 적은 열은 $2 개예요 — 열 개수와 값 개수가 같아야 해요."],
        [/near "AUTO_INCREMENT"/i, "", "AUTO_INCREMENT 는 아직 배우지 않은 문법이라 채점기가 지원하지 않아요."],
        [/near "([^"]*)": syntax error/, "1064. You have an error in your SQL syntax near '$1'", "문법 오류 — '$1' 근처를 확인하세요 (쉼표 · 괄호 · 오타 · 세미콜론)."],
        [/incomplete input|unrecognized token/, "1064. You have an error in your SQL syntax", "문장이 덜 끝났어요 — 괄호 ) 나 따옴표가 닫혔는지 확인하세요."],
        [/cannot modify (\S+) because it is a view/, "1471. The target table $1 of the INSERT is not insertable-into", "이 뷰에는 데이터를 넣을 수 없어요 (한 테이블의 열을 그대로 고른 뷰만 입력돼요)."],
        [/no such function: (\S+)/, "1305. FUNCTION $1 does not exist", "아직 배우지 않은 함수라 채점기가 지원하지 않아요."]
    ];
    function sqlError(e, no, s) {
        var msg = String(e && e.message || e), r = { no: no, sql: sqlShort(s), msg: msg, mysql: e && e.mysql || "", hint: e && e.hint || "" };
        if (!r.mysql) SQL_HINT.some(function (h) {
            var m = h[0].exec(msg);
            if (!m) return false;
            var fill = function (t) { return t.replace(/\$(\d)/g, function (_, k) { return m[k] || ""; }); };
            if (h[1]) r.mysql = "Error Code: " + fill(h[1]);
            r.hint = fill(h[2]);
            return true;
        });
        return r;
    }
    // 여러 문장을 차례로 — 오류가 나면 그 문장에서 멈춤 (MySQL Workbench 처럼)
    function sqlExec(db, src) {
        var list = sqlSplit(src || ""), result = null, notes = [];
        for (var k = 0; k < list.length; k++) {
            try { var r = sqlStatement(db, list[k], notes); if (r) result = r; }
            catch (e) { return { result: result, notes: notes, error: sqlError(e, k + 1, list[k]), count: list.length }; }
        }
        return { result: result, notes: notes, error: null, count: list.length };
    }
    function nowText() {
        var d = new Date(), p = function (x) { return (x < 10 ? "0" : "") + x; };
        return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    }
    // 테스트 한 개: 빈 DB → setup → 붙여넣은 코드 → check
    function sqlRunTest(SQL, code, t) {
        var db = new SQL.Database();
        try {
            db.run("PRAGMA foreign_keys = ON");
            db.create_function("NOW", nowText);
            var setup = sqlExec(db, t.setup);
            if (setup.error) return { broken: "준비 SQL(setup) 오류 — 문제를 고쳐야 해요", err: setup.error, notes: [] };
            var mine = sqlExec(db, code), r = { notes: mine.notes };
            if (mine.error) { r.err = mine.error; return r; }
            if (!t.check) { r.result = mine.result; return r; }
            var chk = sqlExec(db, t.check);
            if (t.error) {
                var e = chk.error;
                r.refused = !!e && e.no === chk.count && (e.msg + " " + e.mysql).indexOf(t.error) >= 0;
                r.checkErr = e;
                return r;
            }
            if (chk.error) { r.checkErr = chk.error; return r; }
            r.result = chk.result;
            return r;
        } finally { db.close(); }
    }
    function cellKey(v) { return v === null || v === undefined ? "\u0000NULL" : String(v); }
    function rowsKey(rows) { return rows.map(function (r) { return r.map(cellKey).join("\u0001"); }).sort(); }
    function colsKey(cols) { return cols.map(function (c) { return String(c).trim().toLowerCase(); }); }
    function sqlSame(a, b) {
        if (!a || !b) return false;
        if (colsKey(a.columns).join("\u0001") !== colsKey(b.columns).join("\u0001")) return false;
        return a.rows.length === b.rows.length && rowsKey(a.rows).join("\u0002") === rowsKey(b.rows).join("\u0002");
    }

    // ---- SQL 채점 화면 ----
    function sqlCell(v) { return v === null || v === undefined ? '<span class="ct-null">NULL</span>' : esc(v); }
    function sqlTable(r) {
        if (!r) return '<p class="ct-note">(결과 표 없음)</p>';
        var h = '<div class="ct-tblwrap"><table class="ct-tbl"><tr>' + r.columns.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr>";
        r.rows.forEach(function (row) { h += "<tr>" + row.map(function (v) { return "<td>" + sqlCell(v) + "</td>"; }).join("") + "</tr>"; });
        if (!r.rows.length) h += '<tr><td colspan="' + r.columns.length + '" class="ct-null">행 없음 (0 rows)</td></tr>';
        return h + "</table></div>";
    }
    function sqlChk(t) { return t.check ? '<pre class="ct-chk"><code class="language-sql">' + esc(t.check.trim()) + "</code></pre>" : ""; }
    function sqlErrHtml(e, where) {
        var text = where + e.no + "번째 문장에서 오류\n" + e.sql + "\n\n" + (e.mysql ? "MySQL 이라면 → " + e.mysql : "")
            + (e.mysql.indexOf(e.msg) < 0 ? (e.mysql ? "\n" : "") + "(채점기 메시지: " + e.msg + ")" : "");
        return '<pre class="ct-err"><code>' + esc(text) + "</code></pre>" + (e.hint ? '<p class="ct-hint">💡 ' + esc(e.hint) + "</p>" : "");
    }
    function sqlDiffHint(exp, mine) {
        if (!mine) return "결과 표가 없어요 — 마지막에 SELECT 문으로 조회해야 채점돼요.";
        var a = colsKey(exp.columns), b = colsKey(mine.columns);
        if (a.join("\u0001") !== b.join("\u0001")) {
            if (a.slice().sort().join("\u0001") === b.slice().sort().join("\u0001")) return "열은 맞는데 순서가 달라요 — 문제에 적힌 순서대로 SELECT 하세요.";
            return "열(속성)이 달라요 — 기대 결과의 열 이름 · 개수와 맞춰 보세요.";
        }
        if (exp.rows.length !== mine.rows.length) return "행(투플) 개수가 달라요 — 기대 " + exp.rows.length + "행 · 내 결과 " + mine.rows.length + "행 (WHERE 조건과 입력한 데이터를 확인하세요).";
        var asNull = function (rows, alt) { return rowsKey(rows.map(function (r) { return r.map(function (v) { return v === alt ? null : v; }); })).join("\u0002"); };
        if (asNull(exp.rows, "NULL") === asNull(mine.rows, "NULL")) return "따옴표로 감싼 'NULL' 은 널 값이 아니라 NULL 이라는 글자예요 — 널 값은 따옴표 없이 NULL.";
        if (asNull(exp.rows, "") === asNull(mine.rows, "")) return "빈 문자열('')과 널 값(NULL)은 달라요 — '' 는 빈칸, NULL 은 알려지지 않은 값 (널 값 = 0도 공백도 아님).";
        return "값이 다른 칸이 있어요 — 두 표를 칸별로 비교해 보세요. (행 순서는 채점하지 않아요)";
    }
    function showSqlView(res, tests) {
        var html = "", pass = 0, notes = [], lastErr = "";
        res.forEach(function (r, i) {
            var t = tests[i], ok = false, body = "";
            (r.notes || []).forEach(function (n) { if (notes.indexOf(n) < 0) notes.push(n); });
            if (r.broken || r.crash) body = '<pre class="ct-err"><code>' + esc((r.broken || r.crash) + (r.err ? "\n" + r.err.msg : "")) + "</code></pre>";
            else if (r.err && lastErr === r.err.no + r.err.msg) body = '<p class="ct-hint">⚠️ 위와 같은 오류 (붙여넣은 코드 ' + r.err.no + "번째 문장)</p>";
            else if (r.err) {
                lastErr = r.err.no + r.err.msg;
                body = sqlErrHtml(r.err, "붙여넣은 코드 ");
                if (t.setup && /already exists/.test(r.err.msg)) body += '<p class="ct-hint">💡 이 문제는 표와 데이터가 <b>미리 준비</b>돼 있어요 (숨은 테스트마다 데이터가 달라요). CREATE TABLE · INSERT 는 빼고 문제에서 쓰라고 한 문장만 붙여넣으세요.</p>';
            } else if (t.error) {
                ok = !!r.refused;
                body = ok ? '<p class="ct-hint">✅ 거부됨 — ' + esc(r.checkErr.mysql || r.checkErr.msg) + "</p>"
                    : sqlChk(t) + '<p class="ct-hint">❌ ' + (r.checkErr ? "다른 오류가 났어요 — " + esc(r.checkErr.mysql || r.checkErr.msg) : "오류로 거부돼야 하는데 그냥 실행됐어요") + "</p>"
                        + (t.why ? '<p class="ct-hint">📌 ' + esc(t.why) + "</p>" : "");
            } else if (r.checkErr) {
                body = sqlChk(t) + sqlErrHtml(r.checkErr, "채점 SQL ");
            } else {
                ok = sqlSame(t.expect, r.result);
                if (!ok) body = sqlChk(t) + '<p class="ct-hint">⚠️ ' + esc(sqlDiffHint(t.expect, r.result)) + "</p>"
                    + '<div class="ct-cols"><div><div class="ct-lbl">✅ 기대 결과</div>' + sqlTable(t.expect) + '</div><div><div class="ct-lbl">🙋 내 결과</div>' + sqlTable(r.result) + "</div></div>";
            }
            if (ok) pass++;
            html += '<div class="ct-case ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "✅" : "❌") + " 테스트 " + (i + 1) + (t.label ? " · " + esc(t.label) : "") + "</b>" + body + "</div>";
        });
        var all = pass === tests.length;
        var noteHtml = notes.length ? '<p class="ct-note">ℹ️ ' + notes.map(esc).join("<br>ℹ️ ") + "</p>" : "";
        return { all: all, html: '<p class="ct-sum ' + (all ? "ok" : "no") + '">' + (all ? "🎉 통과! 테스트 " : "테스트 ") + pass + " / " + tests.length + " 개 맞음</p>" + noteHtml + html };
    }
    function gradeSql(code, tests, btn) {
        btn.textContent = "⏳ SQL 실행기(sql.js) 불러오는 중…";
        return loadSqlJs().then(function (SQL) {
            return showSqlView(tests.map(function (t) {
                try { return sqlRunTest(SQL, code, t); } catch (e) { return { crash: "채점기 오류: " + String(e && e.message || e) }; }
            }), tests);
        }, function (e) {
            return { all: false, html: '<p class="ct-sum no">SQL 실행기를 불러오지 못했어요</p><pre class="ct-err"><code>' + esc(String(e && e.message || e)) + "\n인터넷 연결을 확인하고 잠시 뒤 다시 눌러 주세요.</code></pre>" };
        });
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
            var missing = must.filter(function (m) { return !new RegExp(m, lang === "sql" ? "i" : "").test(code); });
            btnRun.disabled = true;
            box.innerHTML = '<p class="ct-sum">⏳ 채점 중…</p>';
            var res = [];
            var chain = Promise.resolve();
            if (lang === "sql") chain = gradeSql(code, tests, btnRun);
            else tests.forEach(function (t, i) {
                chain = chain.then(function () {
                    btnRun.textContent = "⏳ 채점 대기 중…";
                    return run(lang, code, t.stdin || "", function () {
                        btnRun.textContent = "⏳ 테스트 " + (i + 1) + " / " + tests.length + (lang === "js" ? " 실행 중…" : " 채점 서버에서 실행 중…");
                    }).catch(function (e) {
                        return { error: "채점 서버에 연결하지 못했어요", detail: String(e.message || e) + "\n인터넷 연결을 확인하고 잠시 뒤 다시 눌러 주세요." };
                    }).then(function (r) { res.push(r); });
                });
            });
            chain.then(function (sqlView) {
                var v = lang === "sql" ? sqlView : showView(res, tests, lang);
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
        ta.setAttribute("placeholder", lang === "sql" ? "SQL 문을 여기에 붙여넣으세요 (MySQL 문법 그대로 · 문장 끝은 ; · Tab 키 = 들여쓰기)"
            : LANG_NAME[lang] + " 소스코드를 여기에 붙여넣으세요 (전체 코드 · Tab 키 = 들여쓰기)");
    });
    updateScore();
})();
