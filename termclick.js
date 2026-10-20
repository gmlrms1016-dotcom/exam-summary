/* =====================================================================
   termclick.js  ·  명령을 누르면 출력이 펼쳐지는 터미널 (2026-10-20 · 운영체제 링크 정리 때 사용자 요청)
   - 마크업 (과목 페이지에 직접 · 주차 원고는 ```term 블록 → build_weeks.py 가 이 모양으로)
       <div class="tclick" data-prompt="root@localhost:~/linktest#" data-title="교재 실습 9">
         <script type="text/plain" class="tc-src">
       $ ln basefile hardlink  ## 💡 설명  ## 🪟 윈도우로 치면 …
       출력 줄 …
         </script>
       </div>
     · "$ " 로 시작하는 줄 = 명령 한 줄 = 누르는 버튼 하나 · 그 아래 줄들(다음 "$ " 전까지) = 그 명령의 출력, 칸 그대로
     · 명령 줄의 "  ## " 뒤 = 펼쳤을 때 출력 아래에 보이는 설명 (## 가 여러 개면 한 줄씩) · `코드` 는 코드 글씨로
     · 출력이 없으면 "(화면에 찍히는 결과 없음 …)" 로 알려 줌
   - 동작: 명령을 누르면 펼치기 / 다시 누르면 접기 · 펼친 칸 아래 [닫기] · 위쪽 [모두 펼치기 ↔ 모두 닫기]
           출력이 8줄보다 길면 앞 6줄만 보이고 그 아래 "… N줄 더" (누르면 전부)
   - 꾸밈: "-> 대상" (심볼릭 링크) 은 하늘색 · "cat: x: 그런 파일이나 …" 같은 오류 줄은 빨강
   - theme.js 가 모든 페이지에서 불러옴 · 나중에 생긴 상자는 window.termclickInit(루트) 로
   ===================================================================== */
(function () {
    if (window.termclickInit) return;
    var MAX = 8, SHOW = 6;

    var css = ""
        + ".tclick{margin:12px 0 16px;border-radius:12px;overflow:hidden;background:#14171c;border:1px solid #2a2f36;font-size:14px;}"
        + ".tc-bar{display:flex;align-items:center;gap:8px;padding:8px 10px 8px 12px;background:#1f242b;color:#c9d1d9;font-size:12.5px;font-weight:700;}"
        + ".tc-dots{display:inline-flex;gap:5px;flex:none;}.tc-dots i{width:10px;height:10px;border-radius:50%;display:block;background:#4b525b;}"
        + ".tc-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}"
        + ".tc-all{flex:none;font:inherit;font-size:12px;font-weight:800;color:#f0f6fc;background:#30363d;border:0;border-radius:999px;padding:4px 11px;cursor:pointer;}"
        + ".tc-hint{padding:7px 12px 2px;color:#8b949e;font-size:12px;line-height:1.5;}"
        + ".tc-step{border-top:1px solid #20252b;}.tc-step:first-of-type{border-top:0;}"
        + ".tc-cmd{display:flex;align-items:baseline;gap:8px;width:100%;text-align:left;background:transparent;border:0;color:#f0f6fc;cursor:pointer;padding:9px 12px;font:13.5px/1.5 Consolas,\"D2Coding\",Menlo,monospace;}"
        + ".tc-cmd:hover,.tc-cmd:focus-visible{background:#1d232b;outline:none;}"
        + ".tc-ps{color:#7d8590;flex:none;}.tc-c{flex:1;min-width:0;word-break:break-all;}"
        + ".tc-ic{flex:none;color:#58a6ff;font-family:-apple-system,\"Apple SD Gothic Neo\",sans-serif;font-size:12px;font-weight:800;white-space:nowrap;}"
        + ".tc-step.open .tc-cmd{background:#1d232b;}"
        + ".tc-panel{margin:0 10px 10px;border-radius:10px;background:#0b0d10;border:1px solid #2a2f36;}"
        + ".tc-out{margin:0;padding:10px 12px;color:#e6edf3;font:12.5px/1.6 Consolas,\"D2Coding\",Menlo,monospace;white-space:pre;overflow-x:auto;background:transparent;border:0;}"
        + ".tclick pre.tc-out::before{content:\"▶ 출력 결과\";display:block;color:#7d8590;font:11.5px/1.4 -apple-system,\"Apple SD Gothic Neo\",sans-serif;margin-bottom:4px;}"   // style.css 의 pre::before(</> 코드) 대신
        + ".tc-scroll{margin:0;padding:0 12px 6px;color:#7d8590;font-size:11.5px;}"
        + ".tc-none{color:#7d8590;font-style:italic;white-space:normal;}"
        + ".tc-arrow{color:#79c0ff;}.tc-err{color:#ff9aa2;}"
        + ".tc-more{display:block;width:100%;text-align:left;background:transparent;border:0;border-top:1px dashed #2a2f36;color:#79c0ff;cursor:pointer;padding:6px 12px;font:800 12.5px/1.4 Consolas,\"D2Coding\",Menlo,monospace;}"
        + ".tc-notes{padding:8px 12px 2px;border-top:1px solid #20252b;color:#d0d7de;font-size:13px;line-height:1.65;}"
        + ".tc-notes p{margin:0 0 6px;}.tc-notes code{background:#21262d;color:#f0f6fc;border-radius:4px;padding:0 4px;font-size:12.5px;}"
        + ".tc-foot{display:flex;justify-content:flex-end;padding:2px 10px 10px;}"
        + ".tc-close{font:inherit;font-size:12.5px;font-weight:800;color:#f0f6fc;background:#30363d;border:0;border-radius:999px;padding:5px 14px;cursor:pointer;}"
        + ".tc-close:hover,.tc-all:hover{background:#3d444d;}";
    var st = document.createElement("style");
    st.id = "termclick-css";
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);

    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function noteHtml(s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>"); }
    function lineHtml(l) {                                   // 출력 한 줄 꾸미기
        if (/^\S+: .*(그런 파일이나 디렉터리가 없습니다|No such file|Permission denied|허가 거부|권한 없음)/.test(l))
            return '<span class="tc-err">' + esc(l) + "</span>";
        var m = / -> \S.*$/.exec(l);                         // 심볼릭 링크  이름 -> 대상
        if (m) return esc(l.slice(0, m.index)) + '<span class="tc-arrow">' + esc(m[0]) + "</span>";
        return esc(l);
    }

    function parse(text) {
        var steps = [], cur = null;
        text.replace(/\r/g, "").replace(/<\\\//g, "</").split("\n").forEach(function (l) {
            if (/^\$ /.test(l)) {
                var parts = l.slice(2).split(/\s{2,}##\s*/);
                cur = { cmd: parts[0].trim(), notes: parts.slice(1).map(function (x) { return x.trim(); }).filter(Boolean), out: [] };
                steps.push(cur);
            } else if (cur) cur.out.push(l);
        });
        steps.forEach(function (s) {                         // 앞뒤 빈 줄은 빼기 (출력 중간의 빈 줄은 그대로)
            while (s.out.length && !s.out[s.out.length - 1].trim()) s.out.pop();
            while (s.out.length && !s.out[0].trim()) s.out.shift();
        });
        return steps;
    }

    function build(box) {
        var src = box.querySelector("script.tc-src");
        if (!src) return;
        var steps = parse(src.textContent);
        box.classList.add("tc-ready");
        box.setAttribute("data-theme-skip", "");
        var prompt = box.getAttribute("data-prompt") || "$";
        var ps = /[#$]\s*$/.test(prompt) ? prompt.trim().slice(-1) : "$";          // 줄 앞에는 # / $ 만 (긴 프롬프트는 위 제목 줄에)
        var title = box.getAttribute("data-title") || "";
        var where = prompt.replace(/[#$]\s*$/, "").trim();

        var h = '<div class="tc-bar"><span class="tc-dots"><i></i><i></i><i></i></span><span class="tc-title">🖥️ '
              + esc(title ? title + (where ? " · " + where : "") : (where || "터미널")) + '</span><button class="tc-all" type="button">모두 펼치기</button></div>'
              + '<div class="tc-hint">명령을 한 줄씩 누르면 그 명령의 출력이 펼쳐져요 · 맨 앞 <b>' + esc(ps) + "</b> = 프롬프트(입력하는 자리 표시, 치는 글자 아님)</div>";
        steps.forEach(function (s, i) {
            var id = "tc" + Math.random().toString(36).slice(2, 8) + i;
            var out;
            if (!s.out.length) out = '<pre class="tc-out"><span class="tc-none">(화면에 찍히는 결과 없음 — 명령이 성공하면 아무것도 안 나와요)</span></pre>';
            else {
                var head = s.out.length > MAX ? s.out.slice(0, SHOW) : s.out;
                out = '<pre class="tc-out">' + head.map(lineHtml).join("\n") + "</pre>";
                if (s.out.length > MAX)
                    out += '<button class="tc-more" type="button" data-rest="' + esc(JSON.stringify(s.out.slice(SHOW))) + '">… ' + (s.out.length - SHOW) + "줄 더 (눌러서 전부 보기)</button>";
            }
            out += '<p class="tc-scroll" hidden>↔ 옆으로 밀면 나머지가 보여요</p>';
            var notes = s.notes.length ? '<div class="tc-notes">' + s.notes.map(function (n) { return "<p>" + noteHtml(n) + "</p>"; }).join("") + "</div>" : "";
            h += '<div class="tc-step"><button class="tc-cmd" type="button" aria-expanded="false" aria-controls="' + id + '">'
               + '<span class="tc-ps">' + esc(ps) + '</span><span class="tc-c">' + esc(s.cmd) + '</span><span class="tc-ic">▸ 출력</span></button>'
               + '<div class="tc-panel" id="' + id + '" hidden>' + out + notes
               + '<div class="tc-foot"><button class="tc-close" type="button">닫기 ✕</button></div></div></div>';
        });
        var wrap = document.createElement("div");
        wrap.innerHTML = h;
        while (wrap.firstChild) box.appendChild(wrap.firstChild);

        function setOpen(step, on) {
            var btn = step.querySelector(".tc-cmd"), panel = step.querySelector(".tc-panel");
            panel.hidden = !on;
            step.classList.toggle("open", on);
            btn.setAttribute("aria-expanded", on ? "true" : "false");
            btn.querySelector(".tc-ic").textContent = on ? "▾ 접기" : "▸ 출력";
            if (on) {                                         // 출력이 칸보다 넓으면 (폰 · 긴 ls -l 줄) 옆으로 밀라고 알려 줌
                var pre = panel.querySelector(".tc-out"), hint = panel.querySelector(".tc-scroll");
                if (pre && hint) hint.hidden = pre.scrollWidth <= pre.clientWidth + 2;
            }
        }
        function syncAll() {
            var any = box.querySelector(".tc-step:not(.open)");
            box.querySelector(".tc-all").textContent = any ? "모두 펼치기" : "모두 닫기";
        }
        box.addEventListener("click", function (e) {
            var t = e.target;
            var cmd = t.closest(".tc-cmd"), close = t.closest(".tc-close"), more = t.closest(".tc-more"), all = t.closest(".tc-all");
            if (cmd) { var st1 = cmd.closest(".tc-step"); setOpen(st1, !st1.classList.contains("open")); syncAll(); }
            else if (close) { var st2 = close.closest(".tc-step"); setOpen(st2, false); syncAll(); st2.querySelector(".tc-cmd").focus({ preventScroll: true }); }
            else if (more) {
                var rest = JSON.parse(more.getAttribute("data-rest"));
                var pre = more.previousElementSibling;
                pre.innerHTML += "\n" + rest.map(lineHtml).join("\n");
                more.remove();
                var h2 = pre.parentNode.querySelector(".tc-scroll"); if (h2) h2.hidden = pre.scrollWidth <= pre.clientWidth + 2;
            }
            else if (all) {
                var open = !!box.querySelector(".tc-step:not(.open)");
                box.querySelectorAll(".tc-step").forEach(function (s) { setOpen(s, open); });
                syncAll();
            }
        });
    }

    function init(root) {
        var r = root && root.querySelectorAll ? root : document;
        r.querySelectorAll(".tclick:not(.tc-ready)").forEach(build);
    }
    window.termclickInit = init;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
    else init();
})();
