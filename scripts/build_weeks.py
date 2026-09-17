# -*- coding: utf-8 -*-
"""weeks/src/*.md (노션 주차 정리 원고) → weeks/*.html 주차 페이지 + weeks.js 버튼 데이터 갱신.

사용: python3 scripts/build_weeks.py                        전공 사이트 (weeks/)
      python3 scripts/build_weeks.py liberal-arts-courses   교양 사이트 (liberal-arts-courses/weeks/)
      (표준 라이브러리만 사용)

원고 규칙
- 파일 이름: <과목>-<N>주차.md · 8주차 중간고사는 <과목>-8주차-중간고사.md · 15주차 기말고사는 <과목>-15주차-기말고사.md
- 첫 줄 `# 제목` = 버튼과 페이지에 보이는 주차 제목
- `## ` 마다 카드 1개 · `### ` 소제목 · `> ` 안내 상자 · `- ` / `1. ` 목록(2칸 들여쓰기 = 하위 목록)
- ``` 코드 블록 · `| a | b |` 표(첫 줄 머리글, 칸 안의 | 는 \\|) · <details> / <summary> 접기
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
            plain = re.sub(r"[`*]", "", c)
            widths[i] = max(widths[i], min(len(plain), 34))
    tbody = "<tbody>"
    if cols >= 4:
        tbody = '<tbody style="min-width:%dpx;">' % min(760, sum(w * 13 + 22 for w in widths))
    out = ['<table class="ref">', tbody, "<tr>" + "".join("<th>%s</th>" % inline(c) for c in head) + "</tr>"]
    for r in body:
        r = (r + [""] * cols)[:cols]
        out.append("<tr>" + "".join("<td>%s</td>" % inline(c) for c in r) + "</tr>")
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


def render_md(md):
    lines = md.splitlines()
    title, parts, in_card, i = "", [], False, 0
    para, tip, items = [], [], []

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
            cls = ' class="language-%s"' % lang if lang else ""
            parts.append("<pre><code%s>%s</code></pre>" % (cls, html.escape("\n".join(code), quote=False)))
        elif line.startswith("# ") and not title:
            flush()
            title = line[2:].strip()
        elif line.startswith("## "):
            flush()
            if in_card:
                parts.append("</section>")
            parts.append('<section class="card">\n<h2>%s</h2>' % inline(line[3:].strip()))
            in_card = True
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
    return title, "\n".join(parts)


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
.card p{line-height:1.75;}
.wk-details{border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:14px 0;background:var(--bg);}
.wk-details>summary{cursor:pointer;font-weight:800;color:var(--main);}
.wk-pager{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0;}
.wk-pager a,.wk-pager span{flex:1 1 220px;display:block;border:1px solid var(--line);background:var(--card);border-radius:12px;padding:10px 14px;text-decoration:none;color:var(--ink);font-size:14px;line-height:1.5;}
.wk-pager a b{color:var(--main);}
.wk-pager .next{text-align:right;}
.wk-pager span{visibility:hidden;}
.wk-src{font-size:12.5px;color:#6b776e;text-align:center;margin:20px 0 0;}
"""

PAGE = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <script src="{asset}theme.js?v=202609180158"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject} {week_label} · {title}</title>
    <link rel="stylesheet" href="{asset}style.css?v=202609180158">
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
