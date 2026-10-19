# -*- coding: utf-8 -*-
"""weeks/src/*.md (노션 주차 정리 원고) → weeks/*.html 주차 페이지 + weeks.js 버튼 데이터 갱신.

사용: python3 scripts/build_weeks.py                        전공 사이트 (weeks/)
      python3 scripts/build_weeks.py liberal-arts-courses   교양 사이트 (liberal-arts-courses/weeks/)
      (표준 라이브러리만 사용)

원고 규칙
- 파일 이름: <과목>-<N>주차.md · 8주차 중간고사는 <과목>-8주차-중간고사.md · 15주차 기말고사는 <과목>-15주차-기말고사.md
- 첫 줄 `# 제목` = 버튼과 페이지에 보이는 주차 제목
- `## ` 마다 카드 1개 · `### ` 소제목 · `#### ` 작은 소제목 · `> ` 안내 상자 · `- ` / `1. ` 목록(2칸 들여쓰기 = 하위 목록)
- ``` 코드 블록 (```output = ▶ 출력 결과 상자 · ```bits = 2진수 풀이 상자) · `| a | b |` 표(첫 줄 머리글, 칸 안의 | 는 \\|) · <details> / <summary> 접기
- `🔒 [이름](주소)` 한 줄 = 오른쪽에 작은 버튼 (실제시험 같은 숨은 페이지로 가는 입구)
- 표 칸에 `{빈칸}` = 손으로 써 보는 빈 칸 (높이 넉넉 · 줄 2개)
- `:::toc` 한 줄 = 그 자리에 ‘바로 가기’ 칩 (이 원고의 `## ` 절 목록 · 누르면 그 카드로 이동 · 긴 중간고사 정리용)
- `🎬 [이름](주소)` 한 줄 = 그 자리에 애니메이션 · 데모 페이지를 끼워 넣음(iframe · 주소는 주차 페이지 기준) + 아래에 '새 창으로 크게 보기' 버튼
- `⭐ **강조**` `✍️ **필기**` `✍️ **필기 정정**` `📝 **교수님 메모**` `⚠️ **정정**` 은 색 배지로 바뀝니다
원고 파일이 있는 주차만 과목 페이지에서 버튼이 열리고, 나머지는 잠깁니다.
"""
import html
import os
import re

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

# 사이트별 설정 — dir: 사이트 폴더(저장소 기준) · asset: 주차 페이지에서 공용 파일(theme.js·style.css)까지의 경로
SITES = {
    "": {"dir": "", "asset": "../", "subjects": [
        ("프로그래밍언어실습", "💾"),
        ("운영체제실습", "🐧"),
        ("웹프로그래밍", "🕸️"),
        ("데이터베이스관리", "🗄️"),
        ("자바프로그래밍", "☕"),
    ]},
    "liberal-arts-courses": {"dir": "liberal-arts-courses", "asset": "../../", "subjects": [
        ("공동체와배려의실천", "🤝"),
        ("기업가정신과창업", "🚀"),
        ("인공지능과뇌인지과학", "🧠"),
    ]},
}
EXAMS = {8: "중간고사", 15: "기말고사"}

TAGS = [
    ("⭐ **강조**", "star", "⭐ 강조"),
    ("✍️ **필기 정정**", "fix", "✍️ 필기 정정"),
    ("✍️ **필기**", "note", "✍️ 필기"),
    ("📝 **교수님 메모**", "memo", "📝 교수님 메모"),
    ("⚠️ **정정 필요**", "fix", "⚠️ 정정 필요"),
    ("⚠️ **정정**", "fix", "⚠️ 정정"),
]


def inline(text):
    """한 줄 안의 마크다운(배지 · `코드` · **굵게** · [링크](주소))을 HTML 로."""
    keep = []

    def ph(fragment):
        keep.append(fragment)
        return "\x00%d\x00" % (len(keep) - 1)

    for raw, cls, label in TAGS:
        text = text.replace(raw, ph('<span class="wk-tag %s">%s</span>' % (cls, label)))

    def code(m):
        body = m.group(2)
        if len(m.group(1)) > 1 and body.startswith(" ") and body.endswith(" ") and body.strip():
            body = body[1:-1]
        return ph("<code>%s</code>" % html.escape(body, quote=False))

    text = re.sub(r"(`+)(.+?)(?<!`)\1(?!`)", code, text)
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)",
                  lambda m: '<a href="%s">%s</a>' % (html.escape(m.group(2), quote=True), m.group(1)), text)
    for _ in range(3):  # 배지 안에 코드가 들어가는 경우까지 복원
        text = re.sub(r"\x00(\d+)\x00", lambda m: keep[int(m.group(1))], text)
    return text


def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|") and not line.endswith("\\|"):
        line = line[:-1]
    return [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", line)]


def render_table(rows):
    head = split_row(rows[0])
    body = [split_row(r) for r in rows[2:]] if len(rows) > 1 and re.match(r"^\|?\s*:?-{2,}", rows[1].strip()) else [split_row(r) for r in rows[1:]]
    cols = len(head)
    widths = [0] * cols
    for r in [head] + body:
        for i, c in enumerate(r[:cols]):
            plain = "x" * 9 if c.strip() == "{빈칸}" else re.sub(r"[`*]", "", c)
            widths[i] = max(widths[i], min(len(plain), 34))
    tbody = "<tbody>"
    if cols >= 4:
        tbody = '<tbody style="min-width:%dpx;">' % min(760, sum(w * 13 + 22 for w in widths))
    out = ['<table class="ref">', tbody, "<tr>" + "".join("<th>%s</th>" % inline(c) for c in head) + "</tr>"]
    for r in body:
        r = (r + [""] * cols)[:cols]
        out.append("<tr>" + "".join('<td class="wk-blank"></td>' if c.strip() == "{빈칸}" else "<td>%s</td>" % inline(c) for c in r) + "</tr>")   # {빈칸} = 손으로 써 보는 빈 칸
    out.append("</tbody></table>")
    return "\n".join(out)


def render_list(items, pos):
    indent, kind = items[pos][0], items[pos][1]
    out = ["<%s>" % kind]
    while pos < len(items) and items[pos][0] == indent and items[pos][1] == kind:
        li = "<li>" + inline(items[pos][2])
        pos += 1
        while pos < len(items) and items[pos][0] > indent:
            sub, pos = render_list(items, pos)
            li += sub
        out.append(li + "</li>")
    out.append("</%s>" % kind)
    return "".join(out), pos


def render_exam(block):
    """:::exam 블록 → 📋 교수님 시험 안내 카드 (2026-10-16 사용자: 교수님이 찝어 주신 시험 방식 · 범위를 더 가독성 좋게)
    줄 모양:  일시 :: 10월 22일(목) 14:00 · 6관 406호   (맨 위에 크게)
             🗂 범위 :: 1장 · 2장 · 3장                 (' · ' 로 나눈 조각을 칩으로)
             🔥 찍어 준 것 ::                           (값이 비면 아래 '  - ' 줄들을 번호 목록으로 · '  - [7주차] …' 은 주차 꼬리표)
             🔎 자세히 :: 부제                          (바로 위 칸 밑에 '자세히 보기' 버튼 · 아래 2칸 들여쓴 줄 = 펼치면 보이는 원고)
             ❌ 안 나옴 :: …                            (빨간 칩)
             📌 :: …                                    (키 없이 = 작은 설명 줄)"""
    when, rows, cur, more = "", [], None, None
    for ln in block:
        if more is not None:                              # 🔎 자세히 :: 아래 2칸 들여쓴 줄 = 펼치면 보이는 원고 (표 · 목록 · 코드 그대로)
            if ln.startswith("  ") or not ln.strip():
                more["raw"].append(ln[2:] if ln.startswith("  ") else "")
                continue
            more = None
        if not ln.strip():
            continue
        if ln.lstrip().startswith("🔎") and "::" in ln:
            k, _, v = ln.partition("::")
            more = {"k": k.strip(), "v": v.strip(), "items": [], "raw": []}
            rows.append(more)
            cur = None
            continue
        m = re.match(r"^\s+- (?:\[([^\]]+)\]\s*)?(.*)$", ln)
        if m and cur is not None:
            cur["items"].append((m.group(1) or "", m.group(2)))
            continue
        k, _, v = ln.partition("::")
        k, v = k.strip(), v.strip()
        if k == "일시":
            when = v
            continue
        cur = {"k": k, "v": v, "items": []}
        rows.append(cur)
    out = ['<section class="wk-exam" aria-label="교수님 시험 안내">',
           '<div class="wk-exam-head"><span class="wk-exam-badge">📋 교수님 시험 안내</span>']
    if when:
        bits = [b.strip() for b in when.split(" · ")]
        out.append('<span class="wk-exam-when">%s</span>' % inline(bits[0]))
        if len(bits) > 1:
            out.append('<span class="wk-exam-where">%s</span>' % " · ".join(inline(b) for b in bits[1:]))
    out.append("</div><dl class=\"wk-exam-grid\">")
    for r in rows:
        if "raw" in r:                                    # 🔎 자세히 보기 — 바로 위 칸(찍어 준 것 · 강조)의 내용 정리를 접어 둠 (2026-10-18 사용자: 찝어 준 것을 일일이 찾기 힘듦)
            body = render_md("\n".join(r["raw"]))[1]
            out.append('<dd class="wk-exam-more"><details><summary><span class="wm-open">🔎 자세히 보기</span><span class="wm-close">▲ 접기</span>'
                       '<span class="wm-sub">%s</span></summary><div class="wm-body">%s</div></details></dd>' % (inline(r["v"]), body))
            continue
        if r["k"] in ("", "📌"):                          # 설명 줄 (키 없음 · 📌)
            out.append('<dd class="wk-exam-note">📌 %s</dd>' % inline(r["v"]))
            continue
        bad = "안 나옴" in r["k"] or "제외" in r["k"]
        out.append("<dt>%s</dt><dd>" % inline(r["k"]))
        if r["v"]:
            out.append("".join('<span class="wk-chip%s">%s</span>' % (" bad" if bad else "", inline(c.strip())) for c in r["v"].split(" · ") if c.strip()))
        if r["items"]:
            out.append('<ol class="wk-exam-list">' + "".join(
                "<li>%s%s</li>" % ('<span class="wk-exam-wk">%s</span>' % html.escape(t) if t else "", inline(x)) for t, x in r["items"]) + "</ol>")
        out.append("</dd>")
    out.append("</dl></section>")
    return "".join(out)


def render_md(md):
    lines = md.splitlines()
    title, parts, in_card, i = "", [], False, 0
    para, tip, items = [], [], []
    secs = []                                   # ## 절 (바로 가기용 · :::toc)

    def flush():
        if para:
            parts.append("<p>%s</p>" % "<br>".join(inline(x) for x in para))
            para.clear()
        if tip:
            parts.append('<div class="tip">%s</div>' % "<br>".join(inline(x) for x in tip))
            tip.clear()
        if items:
            pos = 0
            while pos < len(items):
                s, pos = render_list(items, pos)
                parts.append(s)
            items.clear()

    while i < len(lines):
        line = lines[i]
        m_list = re.match(r"^( *)(- |\d+\. )(.*)$", line)
        if line.startswith("```"):
            flush()
            lang = line[3:].strip()
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            body = html.escape("\n".join(code), quote=False)
            if lang in ("output", "bits"):   # 실행 결과 · 2진수 풀이 상자 (코드 색칠 안 함)
                parts.append('<pre class="io%s"><code class="language-text">%s</code></pre>' % (" bits" if lang == "bits" else "", body))
            else:
                cls = ' class="language-%s"' % lang if lang else ""
                parts.append("<pre><code%s>%s</code></pre>" % (cls, body))
        elif line.strip() == ":::exam":                  # 📋 교수님 시험 안내 카드
            flush()
            blk = []
            i += 1
            while i < len(lines) and lines[i].strip() != ":::":
                blk.append(lines[i])
                i += 1
            parts.append(render_exam(blk))
        elif line.startswith("# ") and not title:
            flush()
            title = line[2:].strip()
        elif line.startswith("## "):
            flush()
            if in_card:
                parts.append("</section>")
            secs.append(("s%d" % (len(secs) + 1), line[3:].strip()))
            parts.append('<section class="card" id="%s">\n<h2>%s</h2>' % (secs[-1][0], inline(line[3:].strip())))
            in_card = True
        elif line.strip() == ":::toc":                   # 바로 가기 칩 (## 절 목록 · 2026-10-17 운영체제 가독성)
            flush()
            parts.append("\x00TOC\x00")
        elif line.startswith("#### "):
            flush()
            parts.append("<h4>%s</h4>" % inline(line[5:].strip()))
        elif line.startswith("### "):
            flush()
            parts.append("<h3>%s</h3>" % inline(line[4:].strip()))
        elif line.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(lines[i])
                i += 1
            parts.append(render_table(rows))
            continue
        elif line.startswith("> "):
            if para or items:
                flush()
            tip.append(line[2:])
        elif m_list:
            if para or tip:
                flush()
            items.append((len(m_list.group(1)), "ol" if m_list.group(2)[0].isdigit() else "ul", m_list.group(3)))
        elif re.match(r"^🔒 \[[^\]]+\]\([^)\s]+\)$", line.strip()):   # 🔒 [이름](주소) → 크고 잘 보이는 입구 버튼 (예: 실제시험 · 2026-10-16 스터디원이 못 찾아서 크게)
            flush()
            m_btn = re.match(r"^🔒 \[([^\]]+)\]\(([^)\s]+)\)$", line.strip())
            parts.append('<p class="wk-exambtn"><a href="%s"><span class="eb-ic">📝</span>'
                         '<span class="eb-body"><span class="eb-t">%s 모드</span><span class="eb-s">여기를 누르면 시험 화면으로 → 비밀번호 넣고 시작 · 관리자가 없으면 혼자 풀기</span></span>'
                         '<span class="eb-go">시작하기 →</span></a></p>' % (html.escape(m_btn.group(2), quote=True), html.escape(m_btn.group(1), quote=False)))
        elif re.match(r"^🎬 \[[^\]]+\]\([^)\s]+\)$", line.strip()):   # 🎬 [이름](주소) → 애니메이션 페이지를 그 자리에 (예: 뇌인지 7주차 광수용체)
            flush()
            m_an = re.match(r"^🎬 \[([^\]]+)\]\(([^)\s]+)\)$", line.strip())
            src, name = html.escape(m_an.group(2), quote=True), html.escape(m_an.group(1), quote=False)
            parts.append('<div class="wk-anim" style="margin:12px 0 4px;"><iframe src="%s" title="%s" loading="lazy" '
                         'style="display:block;width:100%%;height:min(660px,calc(50vw + 340px));border:1px solid var(--line);border-radius:14px;background:var(--card);"></iframe>'
                         '<p class="wk-lockbtn"><a href="%s" target="_blank" rel="noopener">🎬 %s — 새 창으로 크게 보기</a></p></div>' % (src, name, src, name))
            if not any('data-wk-anim-size' in x for x in parts):   # 끼운 페이지가 알려 주는 높이로 창 크기 맞춤 (한 번만)
                parts.append('<script data-wk-anim-size>window.addEventListener("message",function(e){var h=e.data&&e.data.wkAnimH;if(!h)return;'
                             'document.querySelectorAll(".wk-anim iframe").forEach(function(f){if(f.contentWindow===e.source)f.style.height=Math.min(h,1400)+"px";});});</script>')
        elif line.strip() == "<details>":
            flush()
            parts.append('<details class="wk-details">')
        elif line.strip().startswith("<summary>"):
            flush()
            parts.append("<summary>%s</summary>" % inline(re.sub(r"</?summary>", "", line.strip())))
        elif line.strip() == "</details>":
            flush()
            parts.append("</details>")
        elif not line.strip():
            flush()
        else:
            if tip or items:
                flush()
            para.append(line)
        i += 1
    flush()
    if in_card:
        parts.append("</section>")
    out = "\n".join(parts)
    if "\x00TOC\x00" in out:
        chips = "".join('<a href="#%s">%s</a>' % (sid, inline(re.sub(r"\s*\(\[[^\]]*\]\([^)]*\)\)", "", s))) for sid, s in secs)
        out = out.replace("\x00TOC\x00", '<nav class="wk-toc"><span class="wk-toc-t">바로 가기</span>%s</nav>' % chips)
    return title, out


PAGE_CSS = """
.wk-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 14px;margin:0 0 14px;padding-right:58px;}
.wk-bar a{color:var(--main);font-weight:800;text-decoration:none;font-size:14px;}
.wk-hint{font-size:12.5px;color:#6b776e;}
.wk-tag{display:inline-block;font-size:12px;font-weight:800;line-height:1.55;padding:0 8px;border-radius:999px;margin-right:2px;vertical-align:1px;white-space:nowrap;}
.wk-tag.star{background:#fff1d6;color:#8a5a00;}
.wk-tag.note{background:#e4efff;color:#1f5aa6;}
.wk-tag.fix{background:#fde8e0;color:#b34727;}
.wk-tag.memo{background:#efe7fb;color:#5b3a99;}
.card ul,.card ol{margin:8px 0;padding-left:22px;}
.card li{margin:6px 0;line-height:1.75;}
.card li>ul,.card li>ol{margin:4px 0;}
.card h3{margin:18px 0 8px;color:var(--main);}
.card h4{margin:16px 0 6px;font-size:15.5px;}
.card p{line-height:1.75;}
.wk-lockbtn{text-align:right;margin:4px 0 10px;}
.wk-lockbtn a{display:inline-block;font-size:12px;font-weight:800;padding:4px 11px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:#6b776e;text-decoration:none;}
.wk-exambtn{margin:4px 0 18px;--eb-glow:45,106,79;}
.wk-exambtn a{display:flex;align-items:center;gap:14px;padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,var(--main,#2d6a4f),var(--main-d,#1b4d39));color:#fff;text-decoration:none;box-shadow:0 8px 24px rgba(var(--eb-glow),.32);animation:wkEbPulse 2.4s ease-out infinite;transition:transform .15s,box-shadow .15s;}
.wk-exambtn a:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(var(--eb-glow),.42);}
.wk-exambtn a:active{transform:scale(.98);}
.wk-exambtn .eb-ic{flex:none;font-size:36px;line-height:1;}
.wk-exambtn .eb-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.wk-exambtn .eb-t{font-size:23px;font-weight:900;letter-spacing:-.02em;line-height:1.25;}
.wk-exambtn .eb-s{font-size:13.5px;font-weight:600;line-height:1.45;opacity:.92;}
.wk-exambtn .eb-go{flex:none;font-size:16px;font-weight:900;padding:10px 18px;border-radius:999px;background:#fff;color:var(--main);white-space:nowrap;}
@keyframes wkEbPulse{0%{box-shadow:0 8px 24px rgba(var(--eb-glow),.32),0 0 0 0 rgba(var(--eb-glow),.5);}70%{box-shadow:0 8px 24px rgba(var(--eb-glow),.32),0 0 0 14px rgba(var(--eb-glow),0);}100%{box-shadow:0 8px 24px rgba(var(--eb-glow),.32),0 0 0 0 rgba(var(--eb-glow),0);}}
@media (prefers-reduced-motion:reduce){.wk-exambtn a{animation:none;}}
@media (max-width:520px){.wk-exambtn a{flex-wrap:wrap;gap:10px 12px;padding:16px;}.wk-exambtn .eb-ic{font-size:30px;}.wk-exambtn .eb-t{font-size:20px;}.wk-exambtn .eb-go{flex:1 1 100%;text-align:center;}}
.wk-exam{margin:6px 0 18px;padding:16px 18px 14px;border:2px solid var(--main);border-radius:18px;background:var(--card);box-shadow:0 6px 20px rgba(45,106,79,.10);}
.wk-exam-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;margin:0 0 12px;padding:0 0 12px;border-bottom:1px solid var(--line);}
.wk-exam-badge{flex:0 0 100%;font-size:13px;font-weight:900;color:var(--main);letter-spacing:.02em;}
.wk-exam-when{font-size:22px;font-weight:900;line-height:1.3;}
.wk-exam-where{font-size:15px;font-weight:700;color:#5e6b62;}
.wk-exam-grid{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:10px 16px;margin:0;}
.wk-exam-grid dt{font-weight:900;font-size:14.5px;white-space:nowrap;padding-top:4px;}
.wk-exam-grid dd{margin:0;line-height:1.7;min-width:0;}
.wk-exam-grid dd.wk-exam-more{grid-column:1 / -1;margin:-2px 0 4px;}
.wk-exam-more summary{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;cursor:pointer;list-style:none;-webkit-user-select:none;user-select:none;}
.wk-exam-more summary::-webkit-details-marker{display:none;}
.wk-exam-more .wm-open,.wk-exam-more .wm-close{display:inline-block;padding:7px 16px;border-radius:999px;background:var(--main);color:#fff;font-size:14px;font-weight:900;box-shadow:0 3px 10px rgba(45,106,79,.22);}
.wk-exam-more .wm-close{display:none;background:#6b776e;}
.wk-exam-more details[open] .wm-open{display:none;}
.wk-exam-more details[open] .wm-close{display:inline-block;}
.wk-exam-more .wm-sub{font-size:12.5px;color:#6b776e;font-weight:700;}
.wk-exam-more .wm-body{margin-top:10px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--bg);}
.wk-exam-more .wm-body h4{margin:14px 0 6px;font-size:15px;}
.wk-exam-more .wm-body h4:first-child{margin-top:2px;}
.wk-exam-more .wm-body ul{margin:4px 0 8px;padding-left:20px;}
.wk-exam-grid dd.wk-exam-note{grid-column:1 / -1;margin-top:4px;padding-top:10px;border-top:1px dashed var(--line);font-size:13px;line-height:1.65;color:#6b776e;}
.wk-chip{display:inline-block;margin:2px 6px 2px 0;padding:3px 11px;border-radius:999px;background:rgba(45,106,79,.09);font-size:14.5px;line-height:1.55;}
.wk-chip.bad{background:rgba(220,60,60,.10);color:#b33a3a;font-weight:700;}
.wk-exam-list{margin:4px 0 0;padding-left:22px;}
.wk-exam-list li{margin:5px 0;line-height:1.65;}
.wk-exam-wk{display:inline-block;margin-right:6px;padding:0 7px;border-radius:6px;background:#fff1d6;color:#8a5a00;font-size:12px;font-weight:800;vertical-align:1px;}
@media (max-width:560px){.wk-exam{padding:14px;}.wk-exam-when{font-size:19px;}.wk-exam-grid{grid-template-columns:minmax(0,1fr);gap:4px 0;}.wk-exam-grid dt{padding-top:10px;}}
.card td.wk-blank{height:64px;min-width:96px;background:repeating-linear-gradient(transparent 0 31px,rgba(127,127,127,.16) 31px 32px);}
.wk-toc{display:flex;flex-wrap:wrap;align-items:center;gap:6px 6px;margin:0 0 18px;}
.wk-toc-t{font-size:12.5px;font-weight:800;color:#6b776e;margin-right:2px;}
.wk-toc a{display:inline-block;padding:5px 11px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--main);font-size:13px;font-weight:700;text-decoration:none;line-height:1.4;}
.wk-toc a:hover{border-color:var(--main);}
.card[id^="s"]{scroll-margin-top:16px;}
.wk-details{border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:14px 0;background:var(--bg);}
.wk-details>summary{cursor:pointer;font-weight:800;color:var(--main);}
.wk-pager{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0;}
.wk-pager a,.wk-pager span{flex:1 1 220px;display:block;border:1px solid var(--line);background:var(--card);border-radius:12px;padding:10px 14px;text-decoration:none;color:var(--ink);font-size:14px;line-height:1.5;}
.wk-pager a b{color:var(--main);}
.wk-pager .next{text-align:right;}
.wk-pager span{visibility:hidden;}
.wk-src{font-size:12.5px;color:#6b776e;text-align:center;margin:20px 0 0;}
pre.io{background:#0f1b14;}
pre.io::before{content:"▶ 출력 결과";color:#7fd49a;}
pre.io code{color:#dff5e6;}
pre.io.bits::before{content:"🧮 2진수로 풀어 보기";}
"""

PAGE = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <script src="{asset}theme.js?v=202610191809"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject} {week_label} · {title}</title>
    <link rel="stylesheet" href="{asset}style.css?v=202610191809">
    <style>{css}</style>
</head>
<body>
<div class="wrap">

    <div class="wk-bar">
        <a href="../{subject}.html">← {subject} 정리 페이지</a>
        <span class="wk-hint">새 탭으로 열렸어요 · 다 봤으면 탭을 닫으면 됩니다</span>
    </div>

    <header class="page-head">
        <h1>{emoji} {subject} · {label}</h1>
        <p>{title_html}</p>
    </header>

{pager}

{body}

{pager}

    <p class="wk-src">{source}</p>

    <footer class="page-head" style="margin-top:30px;">
        <p>COPYRIGHT © 2026 HEEGEUN YOON. ALL RIGHTS RESERVED.</p>
    </footer>
</div>
<script src="{asset}ink.js?v=202610191809"></script>
</body>
</html>
"""


def page_name(subject, week):
    if week in EXAMS:
        return "%s-%d주차-%s" % (subject, week, EXAMS[week])
    return "%s-%d주차" % (subject, week)


def main(site_key=""):
    site = SITES[site_key]
    base = os.path.join(ROOT, site["dir"])
    SRC = os.path.join(base, "weeks", "src")
    OUT = os.path.join(base, "weeks")
    WEEKS_JS = os.path.join(base, "weeks.js")
    SUBJECTS = site["subjects"]
    data = {}
    written = []
    for subject, emoji in SUBJECTS:
        weeks = {}
        for week in range(1, 16):
            src = os.path.join(SRC, page_name(subject, week) + ".md")
            if os.path.exists(src):
                weeks[week] = render_md(open(src, encoding="utf-8").read())
        data[subject] = {w: t for w, (t, _) in weeks.items()}
        order = sorted(weeks)
        for idx, week in enumerate(order):
            title, body = weeks[week]
            label = "%d주차" % week + (" · %s" % EXAMS[week] if week in EXAMS else "")

            def link(w, cls, arrow):
                if w is None:
                    return "<span></span>"
                lab = "%d주차" % w + (" %s" % EXAMS[w] if w in EXAMS else "")
                text = "‹ 이전 · <b>%s</b>" % lab if arrow == "prev" else "다음 · <b>%s</b> ›" % lab
                return '<a class="%s" href="%s.html">%s<br><small>%s</small></a>' % (
                    cls, html.escape(page_name(subject, w), quote=True), text, html.escape(weeks[w][0]))

            prev_w = order[idx - 1] if idx > 0 else None
            next_w = order[idx + 1] if idx + 1 < len(order) else None
            pager = '    <nav class="wk-pager">%s%s</nav>' % (link(prev_w, "prev", "prev"), link(next_w, "next", "next"))
            source = ("노션 「%s」 주차 페이지들의 시험 포인트를 모은 정리입니다." % subject if week in EXAMS
                      else "노션 「%s · %d주차」 페이지를 정리한 내용입니다." % (subject, week))
            out = PAGE.format(asset=site["asset"], subject=subject, emoji=emoji, label=label, week_label="%d주차" % week, title=html.escape(title),
                              title_html=html.escape(title), css=PAGE_CSS, pager=pager, body=body, source=source)
            path = os.path.join(OUT, page_name(subject, week) + ".html")
            open(path, "w", encoding="utf-8").write(out)
            written.append(os.path.basename(path))

    # weeks.js 의 데이터 부분만 교체
    js = open(WEEKS_JS, encoding="utf-8").read()
    lines = ["    var WEEK_DATA = {"]
    for subject, _ in SUBJECTS:
        entries = ", ".join('%d: "%s"' % (w, data[subject][w].replace("\\", "\\\\").replace('"', '\\"'))
                            for w in sorted(data[subject]))
        lines.append('        "%s": { %s },' % (subject, entries))
    lines[-1] = lines[-1].rstrip(",")
    lines.append("    };")
    new_js, n = re.subn(r"/\* DATA:BEGIN \*/.*?/\* DATA:END \*/",
                        lambda m: "/* DATA:BEGIN */\n" + "\n".join(lines) + "\n    /* DATA:END */", js, flags=re.S)
    assert n == 1, "weeks.js 에 DATA:BEGIN / DATA:END 표시가 없습니다"
    open(WEEKS_JS, "w", encoding="utf-8").write(new_js)
    print("주차 페이지 %d개 생성 · weeks.js 데이터 갱신" % len(written))
    for subject, _ in SUBJECTS:
        print("  %-10s %s" % (subject, ", ".join("%d주차" % w for w in sorted(data[subject]))))


if __name__ == "__main__":
    import sys
    main(sys.argv[1].strip("/") if len(sys.argv) > 1 else "")
