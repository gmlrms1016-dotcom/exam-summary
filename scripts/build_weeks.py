# -*- coding: utf-8 -*-
"""weeks/src/*.md (노션 주차 정리 원고) → weeks/*.html 주차 페이지 + weeks.js 버튼 데이터 갱신.

사용: python3 scripts/build_weeks.py                        전공 사이트 (weeks/)
      python3 scripts/build_weeks.py liberal-arts-courses   교양 사이트 (liberal-arts-courses/weeks/)
      (표준 라이브러리만 사용)

원고 규칙
- 파일 이름: <과목>-<N>주차.md · 8주차 중간고사는 <과목>-8주차-중간고사.md · 15주차 기말고사는 <과목>-15주차-기말고사.md
- 첫 줄 `# 제목` = 버튼과 페이지에 보이는 주차 제목
- `## ` 마다 카드 1개 · `### ` 소제목 · `#### ` 작은 소제목 · `> ` 안내 상자 · `- ` / `1. ` 목록(2칸 들여쓰기 = 하위 목록)
- ``` 코드 블록 (```output = ▶ 출력 결과 상자 · ```bits = 2진수 풀이 상자 · ```term 프롬프트 = 명령을 누르면 출력이 펼쳐지는 터미널 — `$ 명령  ## 설명` 다음 줄부터 그 명령의 출력) · `| a | b |` 표(첫 줄 머리글, 칸 안의 | 는 \\|) · <details> / <summary> 접기
- `🔒 [이름](주소)` 한 줄 = 오른쪽에 작은 버튼 (실제시험 같은 숨은 페이지로 가는 입구)
- 표 칸에 `{빈칸}` = 손으로 써 보는 빈 칸 (높이 넉넉 · 줄 2개)
- `:::toc` 한 줄 = 그 자리에 ‘바로 가기’ 칩 (이 원고의 `## ` 절 목록 · 누르면 그 카드로 이동 · 긴 중간고사 정리용)
- `🎬 [이름](주소)` 한 줄 = 그 자리에 애니메이션 · 데모 페이지를 끼워 넣음(iframe · 주소는 주차 페이지 기준) + 아래에 '새 창으로 크게 보기' 버튼
- ```sheet 제목 = 📗 엑셀 모양 표 (교수님 엑셀 설명처럼 · 2026-11-24 사용자: “엑셀로 설명이 있으면 좋겠어”) — 한 줄 = 한 행 · `|` 로 칸 나눔(칸 안의 | 는 \\|) · `--- 탭 이름` 줄 = 아래 시트 탭을 하나 더(누르면 바뀜) · 칸을 누르면 위 수식 줄에 그 칸 내용
  칸 앞 표시(여러 개 가능): `{y}` 노란 칸(이번에 바뀐 값) · `{b}` 테두리 상자(배열 칸) · `{h}` 회색 머리글 · `{k}` 주황 머리글(조인 열쇠 열) · `{c}` 파란 머리글 · `{r}` 빨간 글씨 · `{n}` 굵게 · `{g}` 회색 글씨(힌트 · SQL) · `{m}` 코드 글꼴(줄 앞 들여쓰기는 NBSP) · `{o}` 긴 글을 엑셀처럼 오른쪽 빈 칸으로 넘쳐 보이게(열 폭은 그대로 · 모자라면 빈 열을 더 둠) · `{2}`~`{99}` 칸 합치기(오른쪽으로 N칸) · 칸 끝 `{=4*6}` = 엑셀 수식(칸에는 값 · 누르면 수식 줄에 =4*6)
  ✏️ 입력 칸 (2026-11-25 사용자: “문제를 만들고 푸는 방식이 입력이 되고 채점이 되었으면”): `{?24}` = 답을 쓰는 칸(그 자리 그대로 채점 · `/` 로 여러 정답) · `{?~김광식}` = 행 순서와 상관없이 채점하는 결과 표 칸(같은 표 안에서 ~ 칸이 있는 행끼리 한 행씩 비교 · 빈 행은 `{?~}`) → 입력 칸이 있으면 엑셀 리본(붙여넣기 · 행 삭제 · ✔ 채점 · 👁 정답 보기 · ↺ 다시 풀기)
  🎲 조인 숫자 바꾸기 (2026-11-26): 탭 안에 `@join {"L":"A3:B7","R":"D3:E7","key":[1,0]}` 한 줄 = 원본 표 두 개의 범위 · 조인 열쇠 열(각 표 안에서 0부터) → 리본에 🎲 숫자 바꾸기 · ↩ 원래 문제 (표 값을 새로 만들고 ✏️ 결과 표 · 카디날리티 정답을 다시 계산 · 제목 글자로 내부 · 왼쪽 · 오른쪽 · 완전 · 자연 · 동등 · X(카티션) 구분)
- ```variant c 제목 = 🎲 숫자 바꾼 변형 문제 (2026-11-26) — 코드 안 «이름=100|200|300» 자리를 바꿔 8가지 (첫 값 = 원래 코드 · 다시 쓰면 «이름» · 범위 «n=1..9/2») → 빌드할 때 맥에서 컴파일 · 실행한 결과가 정답 (weeks/variants/*.json 에 저장 · 컴파일러 없으면 저장본) · ```variant c exact 제목 = 칸 수까지 채점
  표 여러 개를 한 시트에 세로로 (2026-11-25 사용자: “엑셀처럼 세로로 길게해서 한꺼번에 다 보이게 · 완전외부조인 풀 때 왼쪽 · 오른쪽을 붙여넣고 중복된 걸 빼서”): `✏️ 1) 내부조인 실행결과` 처럼 **✏️ 로 시작하는 칸 = 표 제목** → 그 아래(다음 ✏️ 제목 전까지) 입력 칸이 한 문제 · 채점 · 행 삭제 · 붙여넣기 · 👁 정답 보기가 표마다 따로 · 제목 칸에 ✅ ❌
- `⭐ **강조**` `✍️ **필기**` `✍️ **필기 정정**` `📝 **교수님 메모**` `⚠️ **정정**` 은 색 배지로 바뀝니다
원고 파일이 있는 주차만 과목 페이지에서 버튼이 열리고, 나머지는 잠깁니다.
"""
import hashlib
import html
import json
import os
import random
import re
import shutil
import subprocess
import tempfile

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


XL_CSS = r""".xl{--xg:#217346;--xbg:#fff;--xgrid:#e1e1e1;--xhd:#f3f3f3;--xhdl:#c8c8c8;--xhdt:#444;--xrib:#f3f3f3;--xtx:#222;--xmut:#6b6b6b;--xsel:rgba(33,115,70,.17);--xhsel:#d2d2d2;--xgt:#217346;--xsb:#217346;
 position:relative;border:1px solid #c8c8c8;border-radius:8px;overflow:hidden;margin:14px 0;background:var(--xbg);color:var(--xtx);font-family:"맑은 고딕","Malgun Gothic","Apple SD Gothic Neo",-apple-system,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.16);}
html[data-theme=dark] .xl{--xbg:#1f1f1f;--xgrid:#3a3a3a;--xhd:#2b2b2b;--xhdl:#474747;--xhdt:#cfcfcf;--xrib:#2b2b2b;--xtx:#e8e8e8;--xmut:#a3a3a3;--xsel:rgba(110,205,150,.22);--xhsel:#3d3d3d;--xgt:#7ad7a2;--xsb:#4fbf7f;border-color:#474747;}
.xl-title{display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;background:var(--xg);color:#fff;font-size:12.5px;}
.xl-logo{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:3px;background:#fff;color:#217346;font-weight:900;font-size:12px;flex:none;}
.xl-name{font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.xl-app{opacity:.85;flex:none;}
.xl-menu{display:flex;gap:2px;padding:0 6px;background:var(--xg);overflow-x:auto;scrollbar-width:none;}
.xl-menu span{padding:5px 10px 6px;font-size:12.5px;color:#fff;opacity:.9;white-space:nowrap;border-radius:4px 4px 0 0;}
.xl-menu span.on{background:var(--xrib);color:var(--xgt);font-weight:800;opacity:1;}
.xl-rib{display:flex;align-items:stretch;padding:6px 4px 2px;background:var(--xrib);border-bottom:1px solid var(--xhdl);overflow-x:auto;}
.xl-grp{display:flex;flex-direction:column;justify-content:space-between;padding:0 8px;border-right:1px solid var(--xhdl);flex:none;}
.xl-grp:last-child{border-right:0;}
.xl-gb{display:flex;align-items:flex-start;gap:4px;}
.xl-col{display:flex;flex-direction:column;gap:1px;}
.xl-gl{text-align:center;font-size:11px;color:var(--xmut);padding-top:3px;}
.xl-rib button{border:1px solid transparent;background:transparent;color:var(--xtx);font:inherit;font-size:12px;padding:2px 6px;border-radius:3px;cursor:pointer;text-align:left;white-space:nowrap;}
.xl-rib button:hover{background:rgba(33,115,70,.12);border-color:rgba(33,115,70,.35);}
.xl-rib button:active{background:rgba(33,115,70,.25);}
.xl-rib .xl-big{display:flex;flex-direction:column;align-items:center;gap:2px;padding:3px 8px;min-width:52px;text-align:center;}
.xl-rib .xl-big i{font-style:normal;font-size:21px;line-height:1.15;}
.xl-rib .xl-chk{color:var(--xgt);font-weight:800;}
.xl-bar{display:flex;align-items:center;gap:6px;padding:4px 6px;border-bottom:1px solid var(--xhdl);background:var(--xbg);font-size:12.5px;}
.xl-ref{min-width:64px;padding:2px 6px;border:1px solid var(--xhdl);background:var(--xbg);font-family:Consolas,Menlo,monospace;}
.xl-dots{color:var(--xmut);}
.xl-bx{border:0;background:transparent;color:var(--xtx);font:inherit;font-size:13px;padding:0 3px;cursor:pointer;}
.xl-bx:disabled{opacity:.3;cursor:default;}
.xl-fx{font-style:italic;font-weight:700;color:var(--xmut);font-family:Georgia,"Times New Roman",serif;}
.xl-f{flex:1;min-width:0;min-height:20px;padding:2px 6px;border-left:1px solid var(--xhdl);font-family:Consolas,Menlo,"맑은 고딕",monospace;white-space:pre;overflow-x:auto;}
.xl-wrap{overflow-x:auto;background:var(--xbg);}
.xl-sheet{border-collapse:collapse;font-size:13px;margin:0;width:auto;background:var(--xbg);color:var(--xtx);}
.xl-sheet[hidden]{display:none!important;}
.xl-sheet th{background:var(--xhd);color:var(--xhdt);font-weight:400;border:1px solid var(--xhdl);padding:1px 6px;min-width:28px;font-size:11.5px;text-align:center;}
.xl-sheet th.xl-corner{position:relative;cursor:pointer;}
.xl-sheet th.xl-corner::after{content:"";position:absolute;right:2px;bottom:2px;border-left:9px solid transparent;border-bottom:9px solid var(--xhdl);}
.xl-sheet td{border:1px solid var(--xgrid);text-align:left;padding:3px 8px;min-width:44px;height:22px;white-space:pre;cursor:cell;position:relative;}
.xl-sheet td.num{text-align:right;}
.xl-sheet td.y{background:#fff2cc;}
.xl-sheet td.b{border:1.5px solid var(--xtx);}
.xl-sheet td.h{background:#d9d9d9;font-weight:700;text-align:center;}
.xl-sheet td.k{background:#f8cbad;font-weight:700;text-align:center;}
.xl-sheet td.c{background:#bdd7ee;font-weight:700;text-align:center;}
.xl-sheet td.r{color:#c00000;font-weight:700;}
.xl-sheet td.n{font-weight:800;}
html[data-theme=dark] .xl-sheet td.y{background:#5c4d1f;}
html[data-theme=dark] .xl-sheet td.h{background:#3a3a3a;}
html[data-theme=dark] .xl-sheet td.k{background:#6a4630;}
html[data-theme=dark] .xl-sheet td.c{background:#28465f;}
html[data-theme=dark] .xl-sheet td.r{color:#ff7b7b;}
.xl-sheet td.sel::before,.xl-sheet td.rng::before{content:"";position:absolute;inset:-1px;pointer-events:none;z-index:1;}
.xl-sheet td.sel1::before{box-shadow:inset 0 0 0 2px var(--xsb);}
.xl-sheet td.rng::before{background:var(--xsel);box-shadow:inset 0 var(--et,0) 0 var(--xsb),inset 0 calc(var(--eb,0px)*-1) 0 var(--xsb),inset var(--el,0) 0 0 var(--xsb),inset calc(var(--er,0px)*-1) 0 0 var(--xsb);}
.xl-sheet td.rng.sel::before{background:transparent;}
.xl-sheet td.et{--et:2px;}.xl-sheet td.eb{--eb:2px;}.xl-sheet td.el{--el:2px;}.xl-sheet td.er{--er:2px;}
.xl-sheet td.fh::after{content:"";position:absolute;right:-4px;bottom:-4px;width:7px;height:7px;background:var(--xsb);border:1px solid var(--xbg);z-index:2;pointer-events:none;}
.xl-sheet th.hl{background:var(--xhsel);color:var(--xgt);font-weight:700;}
.xl-sheet thead th.hl{box-shadow:inset 0 -2px 0 var(--xsb);}
.xl-sheet tbody th.hl{box-shadow:inset -2px 0 0 var(--xsb);}
.xl-sheet td.in{padding:0;background:#fff;box-shadow:inset 0 0 0 1px #f4b183;}
html[data-theme=dark] .xl-sheet td.in{background:#262626;box-shadow:inset 0 0 0 1px #a8683a;}
.xl-in{display:block;width:100%;min-width:64px;box-sizing:border-box;border:0;background:transparent;color:#1f4e9e;font:inherit;padding:3px 6px;height:24px;outline:none;}
html[data-theme=dark] .xl-in{color:#9cc3ff;}
.xl-in.ok{background:#c6efce;color:#006100;}
.xl-in.no{background:#ffc7ce;color:#9c0006;}
html[data-theme=dark] .xl-in.ok{background:#1f4d2c;color:#b6f2c2;}
html[data-theme=dark] .xl-in.no{background:#5c1f26;color:#ffc2c9;}
.xl-sheet .xl-in.shown{color:#8a6d00;font-style:italic;}
html[data-theme=dark] .xl-sheet .xl-in.shown{color:#f0c674;}
.xl-in.nav{caret-color:transparent;cursor:cell;}
.xl-in.nav::selection{background:transparent;}
.xl-q .xl-sheet td:not(.in){-webkit-user-select:none;user-select:none;}
.xl-q .xl-sheet th{cursor:pointer;-webkit-user-select:none;user-select:none;}
.xl-tabs{display:flex;align-items:stretch;padding:0 6px;border-top:1px solid var(--xhdl);background:var(--xhd);overflow-x:auto;}
.xl-nav{display:flex;align-items:center;gap:2px;padding-right:6px;margin-right:4px;border-right:1px solid var(--xhdl);flex:none;}
.xl-nav button{border:0;background:transparent;color:var(--xmut);font-size:11px;padding:2px 5px;cursor:pointer;}
.xl-tab{border:0;border-bottom:3px solid transparent;background:transparent;color:var(--xtx);font:inherit;font-size:12.5px;padding:5px 12px 3px;cursor:pointer;white-space:nowrap;opacity:.85;}
.xl-tab.on{background:var(--xbg);color:var(--xgt);font-weight:800;border-bottom-color:var(--xgt);opacity:1;}
.xl-plus{display:flex;align-items:center;padding:0 10px;color:var(--xmut);font-size:15px;flex:none;}
.xl-status{display:flex;align-items:center;gap:12px;min-height:24px;padding:3px 10px;background:var(--xhd);border-top:1px solid var(--xhdl);color:var(--xtx);font-size:12px;}
.xl-mode{font-weight:700;flex:none;}
.xl-msg{flex:1;min-width:0;color:var(--xmut);line-height:1.5;}
.xl-msg.all{color:var(--xgt);font-weight:700;}
.xl-stat{flex:none;white-space:pre;}
.xl-zoom{flex:none;color:var(--xmut);white-space:nowrap;}
.xl-kb{position:absolute;left:0;top:0;width:1px;height:1px;opacity:0;border:0;padding:0;resize:none;pointer-events:none;}
@media (max-width:640px){.xl-status{flex-wrap:wrap;gap:4px 10px;}.xl-zoom{display:none;}.xl-app{display:none;}}
@media (pointer:coarse){.xl-in{font-size:16px;height:28px;}}
.xl-sheet td.g{color:var(--xmut);}
.xl-sheet td.m{font-family:Consolas,Menlo,"D2Coding",monospace;font-size:12.5px;}
.xl-sheet td.xh{font-weight:700;}
.xl-sheet td.ov{overflow:visible;}
.xl-sheet td.ov>.ov-t{position:absolute;left:0;top:0;bottom:0;display:flex;align-items:center;padding:0 8px;white-space:pre;z-index:1;pointer-events:none;}
html[data-theme=dark] .xl-sheet th{background:var(--xhd);color:var(--xhdt);border-color:var(--xhdl);}
html[data-theme=dark] .xl-sheet th.hl{background:var(--xhsel);color:var(--xgt);}
html[data-theme=dark] .xl-sheet td{border-color:var(--xgrid);}
html[data-theme=dark] .xl-sheet td.b{border-color:var(--xtx);}
"""

# 다크 모드 색 변환(theme.js)이 엑셀 색을 바꾸지 않게 data-theme-skip · 다크 색은 위 XL_CSS 가 직접 지정
XL_JS = '<style data-theme-skip>' + XL_CSS + '</style>' + r"""<script data-xl-js>(function(){if(window.__xl)return;window.__xl=1;
var NL=String.fromCharCode(10),TB=String.fromCharCode(9),MOD=/Mac|iP(hone|ad|od)/.test(navigator.platform||"")?"⌘":"Ctrl";
function xn(s){s=String(s==null?"":s).normalize("NFKC").trim().toLowerCase().replace(/\s+/g,"");s=s.replace(/(개|행)$/,"");if(s==="(null)"||s==="널")s="null";return s;}
function alts(i){return i.getAttribute("data-ans").split("/").map(xn);}
function colNum(L){var c=0;for(var k=0;k<L.length;k++)c=c*26+(L.charCodeAt(k)-64);return c-1;}
function pos(td){var m=/^([A-Z]+)(\d+)$/.exec(td&&td.dataset&&td.dataset.r||"");return m?{r:+m[2],c:colNum(m[1]),w:td.colSpan||1}:null;}
function sheetOf(x){return [].filter.call(x.querySelectorAll(".xl-sheet"),function(t){return !t.hidden;})[0];}
function dims(t){return {R:t.tBodies[0].rows.length,C:t.tHead.rows[0].cells.length-1};}
function cellAt(t,r,c){var tr=t.tBodies[0].rows[r-1];if(!tr)return null;for(var k=0;k<tr.cells.length;k++){var td=tr.cells[k];if(td.tagName!=="TD")continue;var p=pos(td);if(p&&c>=p.c&&c<p.c+p.w)return td;}return null;}
var S=typeof WeakMap!=="undefined"?new WeakMap():null,DRAG=null;
function st(x){var s=S.get(x);if(!s){s={a:null,b:null,mode:"sel",kind:"",orig:"",undo:[],redo:[],rows:false};S.set(x,s);}return s;}
function rect(s){if(!s.a)return null;var b=s.b||s.a;return {r1:Math.min(s.a.r,b.r),r2:Math.max(s.a.r,b.r),c1:Math.min(s.a.c,b.c),c2:Math.max(s.a.c+(s.a.w||1)-1,b.c+(b.w||1)-1)};}
function inputs(x){return [].slice.call(x.querySelectorAll("input.xl-in"));}
function actTd(x){var s=st(x),t=sheetOf(x);return s.a&&t?cellAt(t,s.a.r,s.a.c):null;}
function actIn(x){var td=actTd(x);return td?td.querySelector("input.xl-in"):null;}
function bar(x,td){var r=x.querySelector(".xl-ref"),f=x.querySelector(".xl-f");if(!td){r.textContent="A1";f.textContent="";return;}r.textContent=td.dataset.r;var i=td.querySelector("input");f.textContent=i?(i.value||"✏️ 입력 칸"):(td.dataset.f||td.textContent);}
function paint(x){var s=st(x),t=sheetOf(x);[].forEach.call(x.querySelectorAll("td.sel,td.rng,td.fh,th.hl"),function(e){e.classList.remove("sel","sel1","rng","et","eb","el","er","fh","hl");});if(!t||!s.a){bar(x,null);return;}
 var R=rect(s),a=cellAt(t,s.a.r,s.a.c),cells=[];
 for(var r=R.r1;r<=R.r2;r++){var tr=t.tBodies[0].rows[r-1];if(!tr)continue;tr.cells[0].classList.add("hl");for(var c=R.c1;c<=R.c2;c++){var td=cellAt(t,r,c);if(td&&cells.indexOf(td)<0)cells.push(td);}}
 var one=cells.length<=1;
 if(!one)cells.forEach(function(td){var p=pos(td);td.classList.add("rng");if(p.r===R.r1)td.classList.add("et");if(p.r===R.r2)td.classList.add("eb");if(p.c<=R.c1)td.classList.add("el");if(p.c+p.w-1>=R.c2)td.classList.add("er");});
 for(var c2=R.c1;c2<=R.c2;c2++){var h=t.tHead.rows[0].cells[c2+1];if(h)h.classList.add("hl");}
 if(a){a.classList.add("sel");if(one)a.classList.add("sel1","fh");bar(x,a);}
 if(!one){var br=cellAt(t,R.r2,R.c2);if(br)br.classList.add("fh");}
 stats(x);}
function setMode(x){var s=st(x),m=x.querySelector(".xl-mode");if(m)m.textContent=s.mode==="edit"?(s.kind==="f2"?"편집":"입력"):"준비";[].forEach.call(x.querySelectorAll(".xl-bx"),function(b){b.disabled=s.mode!=="edit";});}
function stats(x){var el=x.querySelector(".xl-stat");if(!el)return;var s=st(x),t=sheetOf(x),R=rect(s);if(!R||!t||(R.r1===R.r2&&R.c1===R.c2)){el.textContent="";return;}var n=0,k=0,sum=0;for(var r=R.r1;r<=R.r2;r++){var prev=null;for(var c=R.c1;c<=R.c2;c++){var td=cellAt(t,r,c);if(!td||td===prev)continue;prev=td;var i=td.querySelector("input.xl-in"),v=(i?i.value:td.textContent).trim();if(!v)continue;n++;if(/^-?\d+(\.\d+)?$/.test(v)){k++;sum+=parseFloat(v);}}}el.textContent=k>1?"평균: "+(Math.round(sum/k*100)/100)+"   개수: "+n+"   합계: "+sum:(n?"개수: "+n:"");}
function kb(x){var k=x.querySelector(".xl-kb");if(!k){k=document.createElement("textarea");k.className="xl-kb";k.setAttribute("aria-hidden","true");k.tabIndex=-1;k.value=" ";x.appendChild(k);}return k;}
function focusCell(x,touch){var s=st(x),i=actIn(x);s.mode="sel";s.kind="";setMode(x);inputs(x).forEach(function(n){if(n!==i)n.classList.remove("nav");});
 if(i){s.orig=i.value;i.classList.add("nav");if(document.activeElement!==i)try{i.focus({preventScroll:true});}catch(e){i.focus();}i.select();}
 else if(!touch){var k=kb(x);k.value=" ";try{k.focus({preventScroll:true});}catch(e){k.focus();}k.select();}
 else if(document.activeElement&&x.contains(document.activeElement))document.activeElement.blur();
 var td=actTd(x);if(td&&td.scrollIntoView){var w=x.querySelector(".xl-wrap"),tr=td.getBoundingClientRect(),wr=w.getBoundingClientRect();if(tr.left<wr.left||tr.right>wr.right)w.scrollLeft+=tr.left<wr.left?tr.left-wr.left-8:tr.right-wr.right+8;}}
function push(x,ch){ch=ch.filter(function(c){return c.o!==c.n;});if(!ch.length)return;var s=st(x);s.undo.push(ch);if(s.undo.length>200)s.undo.shift();s.redo=[];ch.forEach(function(c){c.i.classList.remove("ok","no","shown");});}
function setv(x,list){var ch=list.map(function(p){return {i:p[0],o:p[0].value,n:p[1]};});ch.forEach(function(c){c.i.value=c.n;});push(x,ch);}
function commit(x){var s=st(x),i=actIn(x);if(s.mode==="edit"&&i&&i.value!==s.orig){var c={i:i,o:s.orig,n:i.value};push(x,[c]);}s.mode="sel";s.kind="";if(i){s.orig=i.value;}setMode(x);}
function cancel(x){var s=st(x),i=actIn(x);if(i)i.value=s.orig;s.mode="sel";focusCell(x);paint(x);}
function startEdit(x,kind){var s=st(x),i=actIn(x);if(!i)return;if(s.mode!=="edit"){s.mode="edit";s.kind=kind;}else if(kind==="f2")s.kind="f2";setMode(x);i.classList.remove("nav");if(document.activeElement!==i)i.focus();if(kind==="f2"){var n=i.value.length;try{i.setSelectionRange(n,n);}catch(e){}}}
function undo(x,re){var s=st(x),a=re?s.redo:s.undo,b=re?s.undo:s.redo;commit(x);var ch=a.pop();if(!ch){note(x,re?"다시 할 것이 없어요":"되돌릴 것이 없어요");return;}ch.forEach(function(c){c.i.value=re?c.n:c.o;c.i.classList.remove("ok","no","shown");});b.push(ch);focusCell(x);paint(x);note(x,re?"↷ 다시 실행":"↶ 실행 취소 — "+MOD+"Shift+Z 로 다시");}
function vis(td){if(!td)return;var vr=td.getBoundingClientRect(),vh=window.innerHeight||document.documentElement.clientHeight;if(vr.bottom>vh-12)window.scrollBy(0,vr.bottom-vh+60);else if(vr.top<64)window.scrollBy(0,vr.top-96);}
function jump(x,r,c){var s=st(x),t=sheetOf(x);if(!t)return;var D=dims(t);r=Math.max(1,Math.min(D.R,r));var td=cellAt(t,r,c);s.a=td?pos(td):{r:r,c:c,w:1};s.b=null;s.rows=false;paint(x);focusCell(x);vis(td);}
function enter(x,back){var s=st(x);commit(x);if(s.tabCol!=null&&!back){var tc=s.tabCol;s.tabCol=null;jump(x,s.a.r+1,tc);return;}s.tabCol=null;move(x,back?-1:1,0,false);}
function tab(x,back){var s=st(x);commit(x);if(s.tabCol==null)s.tabCol=s.a.c;move(x,0,back?-1:1,false,true);}
function move(x,dr,dc,ext,keepTab){var s=st(x),t=sheetOf(x);if(!t||!s.a)return;if(!keepTab)s.tabCol=null;var D=dims(t);commit(x);var base=ext?(s.b||s.a):s.a;var r=Math.max(1,Math.min(D.R,base.r+dr)),c=base.c+(dc>0?(base.w||1):dc<0?-1:0);c=Math.max(0,Math.min(D.C-1,c));var td=cellAt(t,r,c);var p=td?pos(td):{r:r,c:c,w:1};if(ext){s.b=p;}else{s.a=p;s.b=null;}s.rows=false;paint(x);focusCell(x);vis(td);}
function tsv(x){var s=st(x),t=sheetOf(x),R=rect(s);if(!R)return null;var out=[];for(var r=R.r1;r<=R.r2;r++){var row=[],prev=null;for(var c=R.c1;c<=R.c2;c++){var td=cellAt(t,r,c);if(!td||td===prev){row.push("");continue;}prev=td;var i=td.querySelector("input.xl-in");row.push(i?i.value:td.textContent);}out.push(row.join(TB));}return out.join(NL);}
function rangeInputs(x){var s=st(x),t=sheetOf(x),R=rect(s),out=[];if(!R)return out;for(var r=R.r1;r<=R.r2;r++){var prev=null;for(var c=R.c1;c<=R.c2;c++){var td=cellAt(t,r,c);if(!td||td===prev)continue;prev=td;var i=td.querySelector("input.xl-in");if(i)out.push(i);}}return out;}
function clearRange(x){var l=rangeInputs(x);if(!l.length){note(x,"지울 입력 칸이 없어요 (입력 칸만 고칠 수 있어요)");return;}setv(x,l.map(function(i){return [i,""];}));paint(x);focusCell(x);}
function paste(x,txt){var s=st(x),t=sheetOf(x),R=rect(s);if(!R||txt==null)return;txt=String(txt).replace(/\r\n?/g,NL);if(txt.slice(-1)===NL)txt=txt.slice(0,-1);var rows=txt.split(NL).map(function(l){return l.split(TB);});var list=[],skip=0,cut=0;
 if(!(rows.length===1&&rows[0].length===1)){var bk=blockAt(t,R.r1);if(bk){var end=bk[bk.length-1].r;if(R.r1+rows.length-1>end){cut=R.r1+rows.length-1-end;rows=rows.slice(0,end-R.r1+1);}}}
 if(rows.length===1&&rows[0].length===1&&(R.r1!==R.r2||R.c1!==R.c2)){rangeInputs(x).forEach(function(i){list.push([i,rows[0][0]]);});}
 else{rows.forEach(function(row,ri){var prev=null;row.forEach(function(v,ci){var td=cellAt(t,R.r1+ri,R.c1+ci);if(!td||td===prev)return;prev=td;var i=td.querySelector("input.xl-in");if(i)list.push([i,v.trim()]);else if(v.trim()!==(td.textContent||"").trim())skip++;});});
  s.a=pos(cellAt(t,R.r1,R.c1))||s.a;s.b=pos(cellAt(t,Math.min(R.r1+rows.length-1,dims(t).R),R.c1+Math.max.apply(null,rows.map(function(r){return r.length;}))-1))||null;}
 if(!list.length){note(x,"여기는 붙여 넣을 수 있는 칸이 아니에요 — 입력 칸을 고르고 붙여넣기");return;}setv(x,list);paint(x);focusCell(x);note(x,"붙여넣기 "+list.length+"칸"+(skip?" · 입력 칸이 아닌 "+skip+"칸은 건너뜀":"")+(cut?" · 표가 모자라 "+cut+"행은 못 붙였어요":""));}
function blocks(t){var out=[],cur=null;[].forEach.call(t.tBodies[0].rows,function(tr,k){var f=[].slice.call(tr.querySelectorAll("input.xl-in[data-free]"));if(!f.length){cur=null;return;}if(!cur){cur=[];out.push(cur);}cur.push({r:k+1,ins:f});});return out;}
function blockAt(t,r){var b=blocks(t);for(var j=0;j<b.length;j++){if(r>=b[j][0].r&&r<=b[j][b[j].length-1].r)return b[j];}return null;}
function sections(t){var out=[],cur={head:null,r1:1,pos:[],rows:[]};out.push(cur);[].forEach.call(t.tBodies[0].rows,function(tr,k){var h=tr.querySelector("td.xh");if(h){cur={head:h,r1:k+1,pos:[],rows:[]};out.push(cur);}
  var f=[].slice.call(tr.querySelectorAll("input.xl-in[data-free]"));if(f.length)cur.rows.push(f);[].forEach.call(tr.querySelectorAll("input.xl-in:not([data-free])"),function(i){cur.pos.push(i);});});
 out.forEach(function(q,j){q.r2=j+1<out.length?out[j+1].r1-1:t.tBodies[0].rows.length;});return out.filter(function(q){return q.pos.length||q.rows.length;});}
function secIns(q){var a=q.pos.slice();q.rows.forEach(function(f){a=a.concat(f);});return a;}
function hl(h){var el=h.querySelector(".ov-t")||h;if(!h.dataset.l)h.dataset.l=el.textContent.replace(/^(✏️|✅|❌)\s*/,"");return el;}
function setHead(h,mark){hl(h).textContent=mark+" "+h.dataset.l;}
function secLabel(q,tb){if(q.head){hl(q.head);return q.head.dataset.l.replace(/^--\s*/,"");}return (tb.dataset.l||tb.textContent).replace(/^(✏️|✅|❌)\s*/,"");}
function delRows(x,force){var s=st(x),t=sheetOf(x),R=rect(s);if(!R)return;var hit=[],cnt=0;
 blocks(t).forEach(function(b){var sel=b.filter(function(o){return o.r>=R.r1&&o.r<=R.r2;});if(sel.length)hit.push({b:b,sel:sel});});
 if(!hit.length){var l=rangeInputs(x);if(l.length){setv(x,l.map(function(i){return [i,""];}));paint(x);focusCell(x);note(x,"지웠어요");}else note(x,"지울 칸이 없어요 — 결과 표의 행(입력 칸)을 드래그하고 눌러 주세요");return;}
 if(!force){var full=hit.every(function(h){return h.sel.every(function(o){var p0=pos(o.ins[0].closest("td")),p1=pos(o.ins[o.ins.length-1].closest("td"));return R.c1<=p0.c&&R.c2>=p1.c+p1.w-1;});});if(!full){clearRange(x);return;}}
 var list=[];hit.forEach(function(h){var gone={};h.sel.forEach(function(o){gone[o.r]=1;});cnt+=h.sel.length;var vals=h.b.filter(function(o){return !gone[o.r];}).map(function(o){return o.ins.map(function(i){return i.value;});});
  h.b.forEach(function(o,k){var v=vals[k]||[];o.ins.forEach(function(i,j){list.push([i,v[j]||""]);});});});
 setv(x,list);s.b=null;s.rows=false;var td=cellAt(t,R.r1,R.c1);s.a=td?pos(td):s.a;paint(x);focusCell(x);note(x,"행 "+cnt+"개 삭제 — 그 표의 아래 행이 올라왔어요 ("+MOD+"Z = 되돌리기)");}
function fillDown(x){var s=st(x),t=sheetOf(x),R=rect(s);if(!R||R.r1===R.r2)return;var list=[];for(var c=R.c1;c<=R.c2;c++){var top=cellAt(t,R.r1,c),ti=top&&top.querySelector("input.xl-in");var v=ti?ti.value:(top?top.textContent:"");for(var r=R.r1+1;r<=R.r2;r++){var td=cellAt(t,r,c),i=td&&td.querySelector("input.xl-in");if(i)list.push([i,v]);}}if(list.length){setv(x,list);paint(x);focusCell(x);}}
function note(x,m){var n=x.querySelector(".xl-msg");if(!n)return;n.classList.remove("all");n.textContent=m;}
function copyOut(x,cut){var v=tsv(x);if(v==null)return;x.__clip=v;var ok=function(){note(x,(cut?"잘라내기":"복사")+" — 붙여 넣을 칸을 고르고 "+MOD+"V");};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(v).then(ok,ok);else ok();if(cut)clearRange(x);}
function gradeSec(q){var ok=true,bad=0,miss=0,ins=secIns(q);ins.forEach(function(i){i.classList.remove("ok","no");});var any=ins.some(function(i){return i.value.trim();});if(!any)return {any:false};
 q.pos.forEach(function(i){var g=alts(i).indexOf(xn(i.value))>=0;i.classList.add(g?"ok":"no");if(!g){ok=false;bad++;}});
 if(q.rows.length){var exp=[];q.rows.forEach(function(f){var e=f.map(function(i){return alts(i)[0];});if(e.join("")!=="")exp.push(e.join("\u0001"));});
  q.rows.forEach(function(f){var u=f.map(function(i){return xn(i.value);});if(u.join("")==="")return;var k=u.join("\u0001"),p=exp.indexOf(k);if(p>=0){exp.splice(p,1);f.forEach(function(i){i.classList.add("ok");});}else{ok=false;bad++;f.forEach(function(i){i.classList.add("no");});}});if(exp.length){ok=false;miss=exp.length;}}
 return {any:true,ok:ok,bad:bad,miss:miss};}
function hh(s){var h=5381;s=String(s);for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);}
function wnKey(x,sv,q){var tbs=x.querySelectorAll(".xl-tabs .xl-tab"),tb=tbs[[].indexOf.call(x.querySelectorAll(".xl-sheet"),sv)],name=(x.querySelector(".xl-name")||{}).textContent||"";if(q.head)hl(q.head);var lab=q.head?q.head.dataset.l:(tb?(tb.dataset.l||tb.textContent):"");return "xl:"+hh(name+"|"+lab);}
function wnMark(x){[].forEach.call(x.querySelectorAll(".xl-sheet"),function(sv){sections(sv).forEach(function(q){var k=wnKey(x,sv,q);if(q.head)q.head.setAttribute("data-wn",k);else if(!x.getAttribute("data-wn"))x.setAttribute("data-wn",k);});});}
function rowsTxt(rows,ans){return rows.map(function(f){return f.map(function(i){return ans?i.getAttribute("data-ans").split("/")[0]:i.value.trim();}).join(" | ");}).filter(function(l){return l.replace(/[ |]/g,"")!=="";}).join(NL);}
function posTxt(q,ans){return q.pos.map(function(i){var td=i.closest("td"),pv=td&&td.previousElementSibling,lb=pv&&pv.tagName==="TD"?pv.textContent.trim():"";return (lb?lb+" → ":"")+(ans?i.getAttribute("data-ans").split("/")[0]:i.value.trim());}).join(NL);}
function rangeOf(a){var m=/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(a||"");return m?{c1:colNum(m[1]),r1:+m[2],c2:colNum(m[3]),r2:+m[4]}:null;}
function jspec(t){if(!t||!t.dataset.join)return null;try{var j=JSON.parse(t.dataset.join);j.LR=rangeOf(j.L);j.RR=rangeOf(j.R);return j.LR&&j.RR?j:null;}catch(e){return null;}}
function tblRows(t,g){var out=[];for(var r=g.r1;r<=g.r2;r++){var tds=[],v=[];for(var c=g.c1;c<=g.c2;c++){var td=cellAt(t,r,c);tds.push(td);v.push(td?td.textContent.trim():"");}if(v.join("")!=="")out.push({tds:tds,v:v});}return out;}
function srcTxt(t){var j=jspec(t);if(!j)return "";return [j.LR,j.RR].map(function(g){var nm=cellAt(t,g.r1-2,g.c1),hd=[];for(var c=g.c1;c<=g.c2;c++){var h=cellAt(t,g.r1-1,c);hd.push(h?h.textContent.trim():"");}return (nm?nm.textContent.trim():"표")+" ("+hd.join(", ")+"): "+tblRows(t,g).map(function(o){return o.v.join(" ");}).join(" / ");}).join(NL);}
function secCtx(sv,q){var out=[];for(var r=q.r1;r<q.r1+4&&r<=q.r2;r++){var tr=sv.tBodies[0].rows[r-1];if(!tr||tr.querySelector("input.xl-in"))break;var g=tr.querySelector("td.g");if(g)out.push(g.textContent.trim());}return out.join(NL);}
function wnSec(x,sv,q,lb,r){if(!r.any)return;var k=wnKey(x,sv,q),W=window.wrongNote;if(q.head)q.head.setAttribute("data-wn",k);if(!W)return;var peek=secIns(q).some(function(i){return i.classList.contains("shown");});if(r.ok&&!peek){W.solve(k);return;}
 var name=(x.querySelector(".xl-name")||{}).textContent||"",ctx=secCtx(sv,q),src=srcTxt(sv);
 W.record({key:k,kind:"엑셀",q:"[엑셀] "+name+NL+"✏️ "+lb+(ctx?NL+ctx:"")+(src?NL+"— 표 —"+NL+src:""),ans:[posTxt(q,true),rowsTxt(q.rows,true)].filter(Boolean).join(NL),my:peek&&r.ok?"(👁 정답 보기로 채운 답)":[posTxt(q,false),rowsTxt(q.rows,false)].filter(Boolean).join(NL)});}
var CITY="서울 부산 대구 인천 광주 대전 울산 수원 춘천 청주 전주 제주 포항 창원 강릉 목포".split(" "),NAME="홍길동 임꺽정 박찬호 신동엽 김연아 이순신 강감찬 유관순 장보고 손흥민 김유신 이몽룡 성춘향 심청이 허준혁".split(" "),WORD="작전중 특공대 유레카 다모여 새싹반 해오름 별빛팀 꿈나무 개척단 한마음 나래반 무지개".split(" ");
function shuf(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function ctype(v){var a=v.filter(function(s){return s&&s!=="NULL";});if(!a.length)return "han";if(a.every(function(s){return /^-?\d+$/.test(s);}))return "num";if(a.every(function(s){return /^[a-z]$/.test(s);}))return "low";if(a.every(function(s){return /^[A-Z]$/.test(s);}))return "up";return "han";}
function cpool(v,need){var a=v.filter(function(s){return s&&s!=="NULL";}),ty=ctype(v),c=[];
 if(ty==="num"){var n=a.map(Number),mn=Math.min.apply(null,n),mx=Math.max.apply(null,n),d=String(Math.abs(mx)).length,lo=d===1?1:Math.pow(10,d-1),hi=Math.pow(10,d)-1,st=n.every(function(z){return z%100===0;})?100:n.every(function(z){return z%10===0;})?10:1;
  for(var z=Math.max(lo,mn-5*st);z<=Math.min(hi,mx+8*st);z+=st)c.push(String(z));if(c.length<need+2){c=[];for(z=lo;z<=hi&&c.length<500;z+=st)c.push(String(z));}}
 else if(ty==="low")c="abcdefghijklmnopqrstuvwxyz".split("");else if(ty==="up")c="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
 else c=a.every(function(s){return CITY.indexOf(s)>=0;})?CITY.slice():a.every(function(s){return /^[가-힣]{3}$/.test(s)&&WORD.indexOf(s)<0;})?NAME.slice():WORD.slice();
 return shuf(c);}
function remap(col){var u=[];col.forEach(function(s){if(s&&s!=="NULL"&&u.indexOf(s)<0)u.push(s);});var p=cpool(col,u.length),m={};u.forEach(function(s,i){m[s]=p[i%p.length];});return col.map(function(s){return s&&s!=="NULL"?m[s]:s;});}
function genJoin(L,R,lk,rk){var keys=L.map(function(r){return r[lk];}).concat(R.map(function(r){return r[rk];}));
 for(var t=0;t<80;t++){var p=cpool(keys,R.length+3);if(p.length<R.length+1)return null;var rk2=p.slice(0,R.length),oth=p.slice(R.length,R.length+3);
  var lk2=L.map(function(r){var k=r[lk];if(!k||k==="NULL")return k;return Math.random()<0.68?rk2[Math.floor(Math.random()*rk2.length)]:oth[Math.floor(Math.random()*oth.length)];});
  var mL=lk2.filter(function(k){return rk2.indexOf(k)>=0;}).length,uR=rk2.filter(function(k){return lk2.indexOf(k)<0;}).length;
  if(mL>=1&&mL<L.length&&(R.length<2||uR>=1))break;}
 var nL=L.map(function(r){return r.slice();}),nR=R.map(function(r){return r.slice();});
 for(var c=0;c<(L[0]||[]).length;c++){if(c===lk)continue;var col=remap(L.map(function(r){return r[c];}));nL.forEach(function(r,i){r[c]=col[i];});}
 for(c=0;c<(R[0]||[]).length;c++){if(c===rk)continue;var col2=remap(R.map(function(r){return r[c];}));nR.forEach(function(r,i){r[c]=col2[i];});}
 nL.forEach(function(r,i){r[lk]=lk2[i];});nR.forEach(function(r,i){r[rk]=rk2[i];});return {L:nL,R:nR};}
function jkind(s){s=String(s||"");return /자연/.test(s)?"natural":/X\s*DEPT|카티션|CROSS|×/i.test(s)?"cross":/왼쪽/.test(s)?"left":/오른쪽/.test(s)?"right":/완전/.test(s)?"full":/내부|동등/.test(s)?"inner":"";}
function joinRows(kind,L,R,lk,rk){var out=[],used={},nl=(L[0]||[]).length,nr=(R[0]||[]).length,nul=function(n){var a=[];for(var i=0;i<n;i++)a.push("NULL");return a;};
 if(kind==="cross"){L.forEach(function(l){R.forEach(function(r){out.push(l.concat(r));});});return out;}
 L.forEach(function(l){var hit=false;R.forEach(function(r,j){if(l[lk]&&l[lk]!=="NULL"&&l[lk]===r[rk]){hit=true;used[j]=1;out.push(kind==="natural"?l.concat(r.filter(function(_,c){return c!==rk;})):l.concat(r));}});if(!hit&&(kind==="left"||kind==="full"))out.push(l.concat(nul(nr)));});
 if(kind==="right"||kind==="full")R.forEach(function(r,j){if(!used[j])out.push(nul(nl).concat(r));});return out;}
function keepOrig(x,t){if(t.__orig)return;var o={cells:[],ans:[]},j=jspec(t);[j.LR,j.RR].forEach(function(g){tblRows(t,g).forEach(function(rw){rw.tds.forEach(function(td){if(td)o.cells.push([td,td.textContent,td.classList.contains("num")]);});});});
 [].forEach.call(t.querySelectorAll("input.xl-in"),function(i){o.ans.push([i,i.getAttribute("data-ans")]);});t.__orig=o;}
function fresh(x,t){var s=st(x);inputs(x).forEach(function(i){i.value="";i.classList.remove("ok","no","shown");});[].forEach.call(x.querySelectorAll("td.xh"),function(h){setHead(h,"✏️");});[].forEach.call(x.querySelectorAll(".xl-tabs .xl-tab"),function(tb){if(tb.dataset.l)tb.textContent=tb.dataset.l;});s.undo=[];s.redo=[];s.b=null;var m=x.querySelector(".xl-msg");if(m)m.classList.remove("all");paint(x);}
function randJoin(x){var t=sheetOf(x),j=jspec(t);if(!j){note(x,"이 시트는 숫자 바꾸기가 없어요");return;}keepOrig(x,t);
 var Lr=tblRows(t,j.LR),Rr=tblRows(t,j.RR),lk=j.key[0],rk=j.key[1],nd=genJoin(Lr.map(function(o){return o.v;}),Rr.map(function(o){return o.v;}),lk,rk);if(!nd){note(x,"숫자를 바꾸지 못했어요");return;}
 Lr.forEach(function(o,i){o.tds.forEach(function(td,c){if(td){td.textContent=nd.L[i][c];td.classList.toggle("num",/^-?\d+$/.test(nd.L[i][c]));}});});
 Rr.forEach(function(o,i){o.tds.forEach(function(td,c){if(td){td.textContent=nd.R[i][c];td.classList.toggle("num",/^-?\d+$/.test(nd.R[i][c]));}});});
 var skip=0;sections(t).forEach(function(q){var kind=jkind(q.head?(hl(q.head),q.head.dataset.l):"");
  if(q.rows.length&&kind){var rows=joinRows(kind,nd.L,nd.R,lk,rk);if(rows.length>q.rows.length||(rows[0]&&rows[0].length!==q.rows[0].length)){skip++;return;}q.rows.forEach(function(f,i){f.forEach(function(inp,c){inp.setAttribute("data-ans",rows[i]?rows[i][c]:"");});});}
  q.pos.forEach(function(inp){var td=inp.closest("td"),pv=td&&td.previousElementSibling,k2=jkind(pv?pv.textContent:"");if(k2)inp.setAttribute("data-ans",String(joinRows(k2,nd.L,nd.R,lk,rk).length));});});
 fresh(x,t);x.__rand=(x.__rand||0)+1;note(x,"🎲 숫자를 바꾼 "+x.__rand+"번째 문제 — 위 표가 바뀌었어요 · 다시 풀고 ✔ 채점"+(skip?" · (표 "+skip+"개는 칸이 모자라 그대로)":"")+" · ↩ 원래 문제");}
function origJoin(x){var t=sheetOf(x);if(!t||!t.__orig){note(x,"지금이 원래 문제예요");return;}t.__orig.cells.forEach(function(c){c[0].textContent=c[1];c[0].classList.toggle("num",c[2]);});t.__orig.ans.forEach(function(a){a[0].setAttribute("data-ans",a[1]);});fresh(x,t);x.__rand=0;note(x,"↩ 원래 문제로 돌아왔어요");}
function act(x,b){var tabs=[].slice.call(x.querySelectorAll(".xl-tabs .xl-tab")),sh=[].slice.call(x.querySelectorAll(".xl-sheet")),msg=x.querySelector(".xl-msg"),k=b.getAttribute("data-a");commit(x);
 if(k==="chk"){var n=0,good=0,parts=[];sh.forEach(function(sv,j){var tb=tabs[j];if(!tb.dataset.l)tb.dataset.l=tb.textContent;var secs=sections(sv);if(!secs.length){tb.textContent=tb.dataset.l;return;}var tAll=true,tBad=false;
   secs.forEach(function(q){var r=gradeSec(q),lb=secLabel(q,tb);n++;if(!r.any){if(q.head)setHead(q.head,"✏️");parts.push(lb+" (아직 안 씀)");tAll=false;return;}if(r.ok)good++;else{tAll=false;tBad=true;}if(q.head)setHead(q.head,r.ok?"✅":"❌");wnSec(x,sv,q,lb,r);
    parts.push(lb+(r.ok?" ✅":" ❌"+(r.bad?" 틀린 칸·행 "+r.bad:"")+(r.miss?" · 빠진 행 "+r.miss:"")));});
   tb.textContent=tBad||tAll?(tBad?"❌ ":"✅ ")+tb.dataset.l.replace(/^✏️\s*/,""):tb.dataset.l;});
  msg.textContent="";var bb=document.createElement("b");bb.textContent=good+" / "+n;msg.appendChild(bb);msg.appendChild(document.createTextNode(" 맞음 — "+parts.join(" · ")));msg.classList.toggle("all",good===n);return;}
 if(k==="show"){var s0=sheetOf(x),a0=st(x).a,secs0=sections(s0),pick=null;if(a0)secs0.forEach(function(q){if(a0.r>=q.r1&&a0.r<=q.r2)pick=q;});var ins=pick?secIns(pick):[].slice.call(s0.querySelectorAll("input.xl-in"));
  if(!ins.length){note(x,"이 시트에는 입력 칸이 없어요 — ✏️ 시트에서 눌러 주세요");return;}setv(x,ins.map(function(i){return [i,i.getAttribute("data-ans").split("/")[0]];}));ins.forEach(function(i){i.classList.remove("ok","no");i.classList.add("shown");});paint(x);
  note(x,pick&&secs0.length>1?"👁 "+secLabel(pick,tabs[sh.indexOf(s0)])+" — 정답을 채웠어요 · 다른 표는 그 표의 칸을 고르고 👁 ("+MOD+"Z = 되돌리기)":"👁 정답을 채웠어요 ("+MOD+"Z = 되돌리기)");return;}
 if(k==="rst"){setv(x,inputs(x).map(function(i){return [i,""];}));inputs(x).forEach(function(i){i.classList.remove("ok","no","shown");});tabs.forEach(function(tb){if(tb.dataset.l)tb.textContent=tb.dataset.l;});[].forEach.call(x.querySelectorAll("td.xh"),function(h){setHead(h,"✏️");});msg.classList.remove("all");msg.textContent="✏️ 다시 풀어 보세요 ("+MOD+"Z = 되돌리기)";return;}
 if(k==="copy"||k==="cut"){if(!st(x).a){note(x,"먼저 칸을 고르세요");return;}copyOut(x,k==="cut");return;}
 if(k==="paste"){if(!st(x).a){note(x,"먼저 붙여 넣을 칸을 고르세요");return;}var fb=function(){if(x.__clip!=null)paste(x,x.__clip);else note(x,"붙여 넣을 내용이 없어요 — "+MOD+"V 로 해 보세요");};if(navigator.clipboard&&navigator.clipboard.readText)navigator.clipboard.readText().then(function(v){paste(x,v);},fb);else fb();return;}
 if(k==="rand"){randJoin(x);return;}if(k==="orig"){origJoin(x);return;}
 if(k==="esc"){cancel(x);return;}if(k==="ent"){focusCell(x);paint(x);return;}if(k==="del"){delRows(x,true);return;}if(k==="clr"){clearRange(x);return;}if(k==="undo"){undo(x,false);return;}if(k==="redo"){undo(x,true);return;}}
function init(x){if(x.__xi)return;x.__xi=1;kb(x);if(x.classList.contains("xl-q"))try{wnMark(x);}catch(e){}
 x.addEventListener("pointerdown",function(e){var b=e.target.closest&&e.target.closest(".xl-rib button, .xl-bar .xl-bx");if(b){e.preventDefault();return;}
  var cell=e.target.closest&&e.target.closest(".xl-sheet td, .xl-sheet th");if(!cell||(e.pointerType==="mouse"&&e.button!==0))return;var s=st(x),t=sheetOf(x);if(!t||!t.contains(cell))return;if(cell.parentNode.parentNode.tagName==="THEAD"){commit(x);if(e.pointerType!=="touch")e.preventDefault();var D0=dims(t),ci=cell.cellIndex-1;s.tabCol=null;if(ci<0){s.a={r:1,c:0,w:1};s.b={r:D0.R,c:D0.C-1,w:1};}else if(e.shiftKey&&s.a){s.b={r:D0.R,c:ci,w:1};}else{s.a={r:1,c:ci,w:1};s.b={r:D0.R,c:ci,w:1};}paint(x);focusCell(x,e.pointerType==="touch");return;}
  var i=cell.querySelector&&cell.querySelector("input.xl-in");if(s.mode==="edit"&&i&&i===actIn(x)&&e.target===i&&s.kind==="f2")return;
  var touch=e.pointerType==="touch";commit(x);
  if(cell.tagName==="TH"){var r=+cell.textContent,D=dims(t);if(!touch)e.preventDefault();if(e.shiftKey&&s.a){s.b={r:r,c:D.C-1,w:1};s.a={r:s.a.r,c:0,w:1};}else{s.a={r:r,c:0,w:1};s.b={r:r,c:D.C-1,w:1};}s.rows=true;paint(x);focusCell(x,touch);if(!touch)DRAG={x:x,rows:true};return;}
  var p=pos(cell);s.tabCol=null;if(!touch)e.preventDefault();if(e.shiftKey&&s.a&&!touch){s.b=p;}else{s.a=p;s.b=null;}s.rows=false;paint(x);focusCell(x,touch);if(!touch)DRAG={x:x,rows:false};});
 x.addEventListener("dblclick",function(e){var cell=e.target.closest&&e.target.closest(".xl-sheet td");if(!cell)return;var i=cell.querySelector("input.xl-in");if(!i)return;var s=st(x);s.a=pos(cell);s.b=null;paint(x);startEdit(x,"f2");});
 x.addEventListener("input",function(e){var i=e.target;if(i.classList.contains("xl-kb")){i.value=" ";i.select();return;}if(!i.classList.contains("xl-in"))return;var s=st(x);if(s.mode==="sel"&&i===actIn(x))startEdit(x,"type");i.classList.remove("ok","no","shown");bar(x,i.closest("td"));});
 x.addEventListener("focusout",function(e){if(!e.relatedTarget||!x.contains(e.relatedTarget))commit(x);});
 x.addEventListener("keydown",function(e){var s=st(x),t=sheetOf(x);if(!t||!s.a||e.isComposing||e.key==="Process")return;var k=e.key,m=e.metaKey||e.ctrlKey,kl=k.length===1?k.toLowerCase():k;
  var done=function(){e.preventDefault();e.stopPropagation();};
  if(s.mode==="edit"){if(k==="Enter"&&!m){done();enter(x,e.shiftKey);return;}if(k==="Tab"){done();tab(x,e.shiftKey);return;}if(k==="Escape"){done();cancel(x);return;}
   if(s.kind==="type"&&/^Arrow/.test(k)&&!m&&!e.shiftKey){done();commit(x);move(x,k==="ArrowUp"?-1:k==="ArrowDown"?1:0,k==="ArrowLeft"?-1:k==="ArrowRight"?1:0,false);return;}
   if(m&&k==="Enter"){done();commit(x);var cb=x.querySelector('[data-a="chk"]');if(cb)act(x,cb);return;}e.stopPropagation();return;}
  if(m&&(kl==="c"||kl==="x"||kl==="v")){e.stopPropagation();return;}
  if(m&&kl==="z"){done();undo(x,e.shiftKey);return;}if(m&&kl==="y"){done();undo(x,true);return;}
  if(m&&kl==="a"){done();var D=dims(t);s.a={r:1,c:0,w:1};s.b={r:D.R,c:D.C-1,w:1};paint(x);return;}
  if(m&&kl==="d"){done();fillDown(x);return;}if(m&&k==="Enter"){done();var cb2=x.querySelector('[data-a="chk"]');if(cb2)act(x,cb2);return;}
  if(/^Arrow/.test(k)){done();move(x,k==="ArrowUp"?-1:k==="ArrowDown"?1:0,k==="ArrowLeft"?-1:k==="ArrowRight"?1:0,e.shiftKey);return;}
  if(k==="Enter"){done();enter(x,e.shiftKey);return;}if(k==="Tab"){done();tab(x,e.shiftKey);return;}
  if(k==="Delete"||k==="Backspace"){done();if(x.classList.contains("xl-q"))delRows(x,false);return;}if(k==="F2"){done();startEdit(x,"f2");return;}
  if(k==="Escape"){done();s.b=null;paint(x);return;}e.stopPropagation();});
 x.addEventListener("copy",function(e){var s=st(x);if(s.mode==="edit"||!s.a)return;var v=tsv(x);if(v==null)return;e.preventDefault();e.clipboardData.setData("text/plain",v);x.__clip=v;note(x,"복사 — 붙여 넣을 칸을 고르고 "+MOD+"V");});
 x.addEventListener("cut",function(e){var s=st(x);if(s.mode==="edit"||!s.a)return;var v=tsv(x);if(v==null)return;e.preventDefault();e.clipboardData.setData("text/plain",v);x.__clip=v;if(x.classList.contains("xl-q"))clearRange(x);else note(x,"복사 — 이 표는 설명용이라 잘라내기 대신 복사만 돼요");});
 x.addEventListener("paste",function(e){var s=st(x);if(!s.a)return;var v=(e.clipboardData||window.clipboardData).getData("text/plain");if(v==null)return;var multi=/[\t\n]/.test(v.replace(/\r?\n$/,""));if(s.mode==="edit"&&!multi)return;e.preventDefault();if(s.mode==="edit")commit(x);paste(x,v);});}
document.addEventListener("pointermove",function(e){if(!DRAG)return;var el=document.elementFromPoint(e.clientX,e.clientY),x=DRAG.x,t=sheetOf(x),s=st(x);if(!el||!t)return;var cell=el.closest&&el.closest(".xl-sheet td, .xl-sheet tbody th");if(!cell||!t.contains(cell))return;
 if(DRAG.rows){var r=cell.tagName==="TH"?+cell.textContent:pos(cell).r,D=dims(t);s.b={r:r,c:D.C-1,w:1};}else{if(cell.tagName==="TH")return;s.b=pos(cell);}paint(x);});
document.addEventListener("pointerup",function(){if(DRAG){var x=DRAG.x;DRAG=null;var R=rect(st(x));if(R&&(R.r1!==R.r2||R.c1!==R.c2))note(x,"범위 선택 — "+MOD+"C 복사 · Del · 🗑 행 삭제 · "+MOD+"X 잘라내기");}});
function showTab(x,i){var tb=x.querySelectorAll(".xl-tabs .xl-tab");if(i<0||i>=tb.length)return;commit(x);[].forEach.call(tb,function(b,k){b.classList.toggle("on",k===i);});x.querySelectorAll(".xl-sheet").forEach(function(s,k){s.hidden=k!==i;});var s=st(x);s.a=null;s.b=null;paint(x);}
document.addEventListener("click",function(e){var nv=e.target.closest&&e.target.closest(".xl-tabs [data-nav]");if(nv){var xx=nv.closest(".xl"),tb=[].slice.call(xx.querySelectorAll(".xl-tabs .xl-tab")),cur=tb.findIndex(function(b){return b.classList.contains("on");});showTab(xx,cur+(+nv.getAttribute("data-nav")));return;}var t=e.target.closest&&e.target.closest(".xl-tabs .xl-tab");if(t){var x=t.closest(".xl");showTab(x,[].indexOf.call(x.querySelectorAll(".xl-tabs .xl-tab"),t));return;}
 var b=e.target.closest&&e.target.closest(".xl-q .xl-rib button, .xl-q .xl-bar .xl-bx");if(b){act(b.closest(".xl"),b);return;}
 });
function boot(){[].forEach.call(document.querySelectorAll(".xl"),init);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();</script>"""


def xl_col(n):
    s = ""
    n += 1
    while n > 0:
        n, m = divmod(n - 1, 26)
        s = chr(65 + m) + s
    return s


def render_sheet(title, lines):
    """```sheet 블록 → 엑셀 모양 (제목 줄 · 이름 상자 + fx 수식 줄 · A B C 열 · 1 2 3 행 · 아래 시트 탭)"""
    sheets, name, cur = [], None, []
    for ln in lines:
        if ln.startswith("--- "):
            if cur or name is not None:
                sheets.append((name or "Sheet1", cur))
            name, cur = ln[4:].strip(), []
        else:
            cur.append(ln)
    sheets.append((name or "Sheet1", cur))
    tabs, tables, has_in, has_join = [], [], False, False
    for k, (nm, rows) in enumerate(sheets):
        grid, jspec = [], ""
        for ln in rows:
            if ln.startswith("@join "):                  # 🎲 조인 숫자 바꾸기 설정 (원본 표 두 개의 범위 · 열쇠 열) — 행으로 그리지 않음
                jspec, has_join = ln[6:].strip(), True
                continue
            cells = [c.replace("\\|", "|") for c in re.split(r"(?<!\\)\|", ln)] if ln.strip() else []
            out = []
            for c in cells:
                c = c.strip(" \t")                      # 줄 앞 NBSP(코드 들여쓰기)는 남김
                cls, span = [], 1
                while True:
                    m = re.match(r"\{([ybhkcrnogm]|[2-9]|[1-9]\d)\}", c)
                    if not m:
                        break
                    v = m.group(1)
                    if v.isdigit():
                        span = int(v)
                    else:
                        cls.append(v)
                    c = c[m.end():]
                im = re.fullmatch(r"\{\?(~?)([^{}]*)\}", c)
                if im:
                    out.append(("", cls + ["in"], span, None, (im.group(2).strip(), im.group(1) == "~")))
                    has_in = True
                    continue
                fm = re.match(r"^(.*?)\s*\{(=[^{}]+)\}$", c)
                f = None
                if fm:
                    c, f = fm.group(1), fm.group(2)
                if re.fullmatch(r"[+-]?\d+(\.\d+)?", c):
                    cls.append("num")
                if c.startswith("✏️"):                      # ✏️ 로 시작하는 칸 = 표 제목 (그 아래 입력 칸끼리 따로 채점 · ✅ ❌ 표시)
                    cls += ["xh", "o"]
                out.append((c, cls, span, f, None))
            grid.append(out)
        ncol = max([sum(sp for _, _, sp, _, _ in r) for r in grid] + [1])
        for r in grid:                                   # {o} 긴 글 = 엑셀처럼 오른쪽 빈 칸으로 넘쳐 보임 → 넘칠 만큼 빈 열을 더 둠
            col = 0
            for c, cls, sp, _, _ in r:
                if "o" in cls and c:
                    px = sum(13.2 if ord(ch) > 0x2000 else (7.0 if "m" in cls else 7.6) for ch in c) + 18
                    ncol = max(ncol, col + max(sp, -(-int(px) // 46)))   # 빈 열 1칸 ≈ 44px
                col += sp
        h = ['<table class="xl-sheet"%s%s><thead><tr><th class="xl-corner"></th>%s</tr></thead><tbody>' % (
            "" if k == 0 else " hidden", " data-join='%s'" % html.escape(jspec, quote=True) if jspec else "",
            "".join("<th>%s</th>" % xl_col(j) for j in range(ncol)))]
        for ri, r in enumerate(grid, 1):
            tds, col = [], 0
            for c, cls, sp, f, inp in r:
                body = html.escape(c, quote=False)
                if inp:
                    body = ('<input type="text" class="xl-in" size="1" data-ans="%s"%s autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="%s%d 칸">'
                            % (html.escape(inp[0]), ' data-free="1"' if inp[1] else "", xl_col(col), ri))
                if "o" in cls:
                    body = '<span class="ov-t">%s</span>' % body
                    cls = ["ov" if v == "o" else v for v in cls]
                lab = ' data-l="%s"' % html.escape(re.sub(r"^✏️\s*", "", c)) if "xh" in cls else ""
                tds.append('<td data-r="%s%d"%s%s%s%s>%s</td>' % (xl_col(col), ri, ' class="%s"' % " ".join(cls) if cls else "",
                                                            ' colspan="%d"' % sp if sp > 1 else "",
                                                            ' data-f="%s"' % html.escape(f) if f else "", lab, body))
                col += sp
            tds += ['<td data-r="%s%d"></td>' % (xl_col(j), ri) for j in range(col, ncol)]
            h.append("<tr><th>%d</th>%s</tr>" % (ri, "".join(tds)))
        h.append("</tbody></table>")
        tables.append("".join(h))
        tabs.append('<button type="button" class="xl-tab%s">%s</button>' % (" on" if k == 0 else "", html.escape(nm)))
    t = html.escape(title or "엑셀로 보기")
    menu = rib = ""
    hint = ""
    if has_in:
        menu = ('<div class="xl-menu"><span>파일</span><span class="on">홈</span><span>삽입</span><span>페이지 레이아웃</span>'
                '<span>수식</span><span>데이터</span><span>검토</span><span>보기</span></div>')
        rib = ('<div class="xl-rib">'
               '<div class="xl-grp"><div class="xl-gb"><button type="button" class="xl-big" data-a="paste" title="붙여넣기 (⌘/Ctrl+V)"><i>📋</i>붙여넣기</button>'
               '<div class="xl-col"><button type="button" data-a="cut" title="잘라내기 (⌘/Ctrl+X)">✂️ 잘라내기</button>'
               '<button type="button" data-a="copy" title="복사 (⌘/Ctrl+C)">⧉ 복사</button></div></div><div class="xl-gl">클립보드</div></div>'
               '<div class="xl-grp"><div class="xl-gb"><button type="button" class="xl-big" data-a="del" title="고른 행 삭제 — 아래 행이 올라옴 (행을 고르고 Del)"><i>🗑</i>행 삭제</button></div>'
               '<div class="xl-gl">셀</div></div>'
               '<div class="xl-grp"><div class="xl-gb"><div class="xl-col"><button type="button" data-a="clr" title="고른 칸 내용 지우기">🧽 지우기</button>'
               '<button type="button" data-a="undo" title="실행 취소 (⌘/Ctrl+Z)">↶ 실행 취소</button>'
               '<button type="button" data-a="redo" title="다시 실행 (⌘/Ctrl+Shift+Z)">↷ 다시 실행</button></div></div><div class="xl-gl">편집</div></div>'
               + ('<div class="xl-grp"><div class="xl-gb"><button type="button" class="xl-big" data-a="rand" title="원본 표의 숫자 · 값을 새로 만들고 정답을 다시 계산 (2026-11-26)"><i>🎲</i>숫자 바꾸기</button>'
                  '<div class="xl-col"><button type="button" data-a="orig" title="처음 문제로">↩ 원래 문제</button></div></div><div class="xl-gl">변형</div></div>' if has_join else '') +
               '<div class="xl-grp"><div class="xl-gb"><button type="button" class="xl-big xl-chk" data-a="chk" title="채점 (⌘/Ctrl+Enter)"><i>✔</i>채점</button>'
               '<div class="xl-col"><button type="button" data-a="show" title="고른 표의 답 보기 (표 밖을 고르면 시트 전체)">👁 정답 보기</button>'
               '<button type="button" data-a="rst" title="모두 지우기 (⌘/Ctrl+Z 로 되돌리기)">↺ 다시 풀기</button></div></div><div class="xl-gl">채점</div></div>'
               '</div>')
        hint = ('✏️ 주황 테두리 칸(입력)에 답 · 드래그 · Shift+방향키로 여러 칸 · ⌘/Ctrl + C · V · X · '
                '행 번호를 누르거나 행을 끌어 고르고 Del = 행 삭제 · ⌘/Ctrl+Z · ⌘/Ctrl+Enter = 채점 · 결과 표는 행 순서 상관없이 채점 · 빈 값은 NULL')
    else:
        hint = '칸을 누르면 위 수식 줄에 내용 · 드래그 · Shift+방향키 = 여러 칸 · ⌘/Ctrl+C = 복사 · 행 번호 · 열 이름을 누르면 줄 전체'
    head = ('<div class="xl-title"><span class="xl-logo">X</span><span class="xl-name">%s</span><span class="xl-app">- Excel</span></div>' % t)
    fbar = ('<div class="xl-bar"><span class="xl-ref">A1</span><span class="xl-dots">⋮</span>'
            '<button type="button" class="xl-bx" data-a="esc" title="취소 (Esc)" disabled>✕</button>'
            '<button type="button" class="xl-bx" data-a="ent" title="입력 (Enter)" disabled>✓</button>'
            '<span class="xl-fx">fx</span><span class="xl-f"></span></div>')
    tabsbar = ('<div class="xl-tabs"><span class="xl-nav"><button type="button" data-nav="-1" title="이전 시트">◀</button>'
               '<button type="button" data-nav="1" title="다음 시트">▶</button></span>%s<span class="xl-plus" title="시트">⊕</span></div>' % "".join(tabs))
    status = ('<div class="xl-status"><span class="xl-mode">준비</span><span class="xl-msg">%s</span>'
              '<span class="xl-stat"></span><span class="xl-zoom">－ ━━━●━━━ ＋ 100%%</span></div>' % hint)
    return '<div class="xl%s">%s%s%s%s<div class="xl-wrap">%s</div>%s%s</div>' % (" xl-q" if has_in else "", head, menu, rib, fbar, "".join(tables), tabsbar, status)


# ===================== 🎲 숫자 바꾼 변형 문제 (```variant c 제목) — 2026-11-26 =====================
# 사용자: “1,2해줘” — 추천 1번 “숫자만 바꾼 변형 문제” (C 11주차 수업 파일 “숫자만 바꿔서 기말고사 시험문제”)
#  - 코드 안 «이름=100|200|300» = 바꿀 숫자 자리 (첫 값 = 원래 코드) · 다시 쓰면 «이름» · 범위 «이름=10..90/10»
#  - 빌드할 때 숫자를 바꾼 코드 8가지를 맥에서 직접 컴파일 · 실행해 정답(실행 결과)을 만듦 → weeks/variants/<해시>.json 에 저장
#    (컴파일러가 없는 곳 · 클라우드 세션은 이 저장본을 그대로 씀)
#  - ```variant c exact 제목 = 줄 안의 칸 수까지 채점 (%2d 같은 문제) · 기본은 줄 앞뒤 공백 · 빈 줄 무시
VAR_RE = re.compile(r"«([A-Za-z_]\w*)(?:=([^»]*))?»")
VARIANTS_DIR = os.path.join(ROOT, "weeks", "variants")


def _choices(spec):
    m = re.fullmatch(r"\s*(-?\d+)\s*\.\.\s*(-?\d+)\s*(?:/\s*(\d+))?\s*", spec)
    if m:
        a, b, st = int(m.group(1)), int(m.group(2)), int(m.group(3) or 1)
        return [str(v) for v in range(a, b + 1, st)]
    return [c.strip() for c in spec.split("|") if c.strip() != ""]


def _run_c(code):
    cc = shutil.which("cc") or shutil.which("clang") or shutil.which("gcc")
    if not cc:
        return None
    with tempfile.TemporaryDirectory() as d:
        src, exe = os.path.join(d, "v.c"), os.path.join(d, "v")
        with open(src, "w", encoding="utf-8") as f:
            f.write(code + "\n")
        r = subprocess.run([cc, "-std=c11", "-w", "-O0", "-o", exe, src], capture_output=True, text=True)
        if r.returncode != 0:
            print("  ⚠️ 변형 문제 컴파일 실패:", r.stderr.strip()[:300])
            return None
        try:
            out = subprocess.run([exe], capture_output=True, timeout=5)
        except subprocess.TimeoutExpired:
            print("  ⚠️ 변형 문제 실행 시간 초과")
            return None
        return out.stdout.decode("utf-8", "replace")


def gen_variants(lang, tpl, n=8):
    key = hashlib.sha1((lang + "\n" + tpl).encode("utf-8")).hexdigest()[:12]
    path = os.path.join(VARIANTS_DIR, key + ".json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return key, json.load(f)["variants"]
    defs = {}
    for m in VAR_RE.finditer(tpl):
        if m.group(2) is not None and m.group(1) not in defs:
            defs[m.group(1)] = _choices(m.group(2))
    rnd = random.Random(int(key, 16))
    combos, tries = [{k: v[0] for k, v in defs.items()}], 0
    while len(combos) < n and tries < 300:
        c = {k: rnd.choice(v) for k, v in defs.items()}
        if c not in combos:
            combos.append(c)
        tries += 1
    out = []
    for c in combos:
        code = VAR_RE.sub(lambda m: c[m.group(1)], tpl)
        res = _run_c(code) if lang == "c" else None
        if res is None:
            if not out:
                print("  ⚠️ 변형 문제를 만들 컴파일러가 없거나 실패 — 원래 코드만 보여 줌")
                return key, []
            continue
        out.append({"code": code, "out": res})
    if out:
        os.makedirs(VARIANTS_DIR, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"lang": lang, "template": tpl, "variants": out}, f, ensure_ascii=False, indent=1)
        print("  🎲 변형 문제 %d가지 만듦 (%s)" % (len(out), key))
    return key, out


def render_variant(head, lines):
    parts = head.split()
    lang = parts[0] if parts else "c"
    exact = len(parts) > 1 and parts[1] == "exact"
    title = " ".join(parts[2 if exact else 1:]) or "숫자 바꾼 문제"
    tpl = "\n".join(lines).rstrip()
    key, vs = gen_variants(lang, tpl)
    if not vs:
        code = VAR_RE.sub(lambda m: next((x for x in [m.group(2)] if x), "").split("|")[0] if m.group(2) else m.group(1), tpl)
        return '<pre><code class="language-%s">%s</code></pre>' % (lang, html.escape(code, quote=False))
    codes = "".join('<pre class="vq-code"%s><code class="language-%s">%s</code></pre>' % ("" if i == 0 else " hidden", lang, html.escape(v["code"], quote=False))
                    for i, v in enumerate(vs))
    outs = "".join('<script type="text/plain" class="vq-out">%s</script>' % v["out"].replace("</", "<\\/") for v in vs)
    return ('<div class="vq" data-wn="vq:%s"%s><div class="vq-head"><span class="vq-badge">🎲 숫자 바꾼 문제</span><b class="vq-title">%s</b>'
            '<span class="vq-n">1 / %d · 원래 코드</span></div>%s%s'
            '<textarea class="vq-in" rows="4" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="실행 결과를 그대로 적어 보세요 (한 줄에 한 줄 · ⌘/Ctrl+Enter = 채점)"></textarea>'
            '<div class="vq-btns"><button type="button" class="vq-b main" data-v="chk">✔ 채점</button><button type="button" class="vq-b" data-v="show">👁 정답 보기</button>'
            '<button type="button" class="vq-b" data-v="next">🎲 다른 숫자로</button></div><div class="vq-res"></div></div>'
            % (key, ' data-exact="1"' if exact else "", html.escape(title), len(vs), codes, outs))


VQ_JS = r"""<style>
.vq{border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:14px 0;background:var(--card);}
.vq-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-bottom:8px;}
.vq-badge{background:#fdecdc;color:#a4520f;border-radius:6px;padding:2px 8px;font-size:12.5px;font-weight:800;}
.vq-title{font-size:15px;}
.vq-n{margin-left:auto;font-size:12.5px;color:#6b776e;}
.vq-code[hidden]{display:none!important;}
.vq-in{width:100%;box-sizing:border-box;min-height:88px;margin-top:6px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font-family:Consolas,"D2Coding",Menlo,monospace;font-size:14px;line-height:1.5;}
.vq-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}
.vq-b{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:8px 14px;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;}
.vq-b.main{background:var(--main);border-color:var(--main);color:#fff;}
.vq-res{margin-top:10px;font-size:14px;line-height:1.6;}
.vq-res pre{margin:6px 0 0;padding:9px 12px;border-radius:10px;background:#0f1b14;color:#dff5e6;font-family:Consolas,"D2Coding",Menlo,monospace;font-size:13.5px;white-space:pre;overflow-x:auto;}
.vq-res .vq-l{font-family:Consolas,"D2Coding",Menlo,monospace;font-size:13px;white-space:pre;}
.vq-ok{color:#176c3a;font-weight:800;}.vq-no{color:#c0392b;font-weight:800;}
html[data-theme=dark] .vq-ok{color:#7fd49a;}html[data-theme=dark] .vq-no{color:#ff8a80;}
</style><script data-vq-js>(function(){if(window.__vq)return;window.__vq=1;
var NL=String.fromCharCode(10);
function lines(s,ex){s=String(s||"").replace(/\r\n?/g,NL);var L=s.split(NL).map(function(l){return ex?l.replace(/\s+$/,""):l.trim().replace(/[ \t]+/g," ");});if(ex){while(L.length&&L[L.length-1]==="")L.pop();return L;}return L.filter(function(l){return l!=="";});}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
function cur(q){return +(q.dataset.i||0);}
function data(q){var i=cur(q);return {code:q.querySelectorAll(".vq-code")[i],out:q.querySelectorAll(".vq-out")[i].textContent};}
function title(q){return (q.querySelector(".vq-title")||{}).textContent||"";}
function rec(q,my){var W=window.wrongNote;if(!W)return;var d=data(q);W.record({key:q.getAttribute("data-wn"),kind:"변형 (실행결과)",q:"[🎲 숫자 바꾼 문제] "+title(q)+NL+d.code.textContent.replace(/\s+$/,""),ans:"실행 결과:"+NL+d.out.replace(/\s+$/,""),my:my});}
function chk(q){var ex=q.hasAttribute("data-exact"),d=data(q),ta=q.querySelector(".vq-in"),r=q.querySelector(".vq-res");
 var E=lines(d.out,ex),M=lines(ta.value,ex);if(!M.length){r.innerHTML='<span class="vq-no">실행 결과를 적고 채점을 눌러 주세요</span>';return;}
 var n=Math.max(E.length,M.length),good=0,rows=[];for(var i=0;i<n;i++){var ok=E[i]!==undefined&&M[i]===E[i];if(ok)good++;rows.push('<div class="vq-l">'+(ok?"✅ ":"❌ ")+(i+1)+"줄  "+esc(M[i]===undefined?"(안 씀)":M[i])+"</div>");}
 var all=good===E.length&&M.length===E.length;
 r.innerHTML=(all?'<span class="vq-ok">✅ 정답! ('+E.length+"줄 모두)</span>":'<span class="vq-no">❌ '+good+" / "+E.length+"줄 맞음"+(M.length!==E.length?" · 쓴 줄 "+M.length+" / 실제 "+E.length+"줄":"")+"</span>")+rows.join("")+(all?"":'<div style="margin-top:4px;font-size:13px;opacity:.8">💡 👁 정답 보기로 실제 출력과 비교 · 🎲 다른 숫자로 한 번 더</div>');
 q.dataset.state=all?"ok":"no";
 if(all){if(!q.__peek&&window.wrongNote)window.wrongNote.solve(q.getAttribute("data-wn"));}else rec(q,ta.value);}
function show(q){var d=data(q),r=q.querySelector(".vq-res");q.__peek=1;r.innerHTML='<b>👁 실제 실행 결과</b>'+(q.hasAttribute("data-exact")?' <span style="font-size:12.5px;opacity:.8">(칸 수까지 채점)</span>':"")+"<pre>"+esc(d.out.replace(/\s+$/,""))+"</pre>";if(q.dataset.state!=="ok")rec(q,q.querySelector(".vq-in").value||"(👁 정답 보기)");}
function next(q){var cs=q.querySelectorAll(".vq-code"),n=cs.length,i=(cur(q)+1)%n;cs.forEach(function(c,k){c.hidden=k!==i;});q.dataset.i=i;q.__peek=0;q.dataset.state="";q.querySelector(".vq-in").value="";q.querySelector(".vq-res").innerHTML="";q.querySelector(".vq-n").textContent=(i+1)+" / "+n+(i===0?" · 원래 코드":" · 숫자 바꿈");}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".vq [data-v]");if(!b)return;var q=b.closest(".vq"),v=b.getAttribute("data-v");if(v==="chk")chk(q);else if(v==="show")show(q);else next(q);});
document.addEventListener("keydown",function(e){var t=e.target;if(!t.classList||!t.classList.contains("vq-in"))return;if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)){e.preventDefault();chk(t.closest(".vq"));}});
})();</script>"""


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
            if lang.startswith("variant "):                 # 🎲 숫자 바꾼 변형 문제 (C 코드를 숫자만 바꿔 8가지 · 정답 = 실제 실행 결과)
                parts.append(render_variant(lang[8:].strip(), code))
                if not any("data-vq-js" in x for x in parts):
                    parts.append(VQ_JS)
            elif lang == "sheet" or lang.startswith("sheet "):   # 📗 엑셀 모양 표 (교수님 엑셀 설명처럼)
                parts.append(render_sheet(lang[5:].strip(), code))
                if not any("data-xl-js" in x for x in parts):
                    parts.append(XL_JS)
            elif lang == "term" or lang.startswith("term "):   # 🖥️ 명령을 누르면 출력이 펼쳐지는 터미널 (termclick.js)
                prompt = lang[4:].strip() or "$"
                raw = "\n".join(code).replace("</", "<\\/")      # <script> 안이라 </ 만 막아 둠 (termclick.js 가 되돌림)
                parts.append('<div class="tclick" data-prompt="%s"><script type="text/plain" class="tc-src">\n%s\n</script></div>' % (html.escape(prompt, quote=True), raw))
            elif lang in ("output", "bits"):   # 실행 결과 · 2진수 풀이 상자 (코드 색칠 안 함)
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
        elif line.startswith(":::wkexam "):           # 📝 이 주차가 나오는 시험 (중간 1~7 · 기말 9~14 · 빨간 얇은 테두리 · 2026-11-27 사용자) — lift_top 이 넣음
            flush()
            ex, rng, href = (line[10:].split("|") + ["", ""])[:3]
            inner = "📝 <b>%s</b> 범위 <small>(%s)</small>" % (html.escape(ex, quote=False), html.escape(rng, quote=False))
            if href.strip():
                parts.append('<a class="wk-examtag" href="%s"><span>%s</span><span class="go">%s 정리 보기 ›</span></a>' % (html.escape(href.strip(), quote=True), inner, html.escape(ex, quote=False)))
            else:
                parts.append('<div class="wk-examtag"><span>%s</span></div>' % inner)
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
.wk-examtag{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 12px;margin:14px 0 8px;padding:9px 14px;border:1.5px solid #e5484d;border-radius:12px;color:var(--ink);text-decoration:none;font-size:15px;line-height:1.5;}
.wk-examtag b{color:#e5484d;font-size:16px;}
.wk-examtag small{font-size:12.5px;font-weight:600;opacity:.75;}
.wk-examtag .go{font-size:13px;font-weight:800;color:#e5484d;white-space:nowrap;}
a.wk-examtag:hover{background:rgba(229,72,77,.06);}
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
.wk-pager>a,.wk-pager>span{flex:1 1 220px;display:block;border:1px solid var(--line);background:var(--card);border-radius:12px;padding:10px 14px;text-decoration:none;color:var(--ink);font-size:14px;line-height:1.5;}
.wk-pager a b{color:var(--main);}
.wk-pager .next{text-align:right;}
.wk-pager>span{visibility:hidden;}
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
    <script src="{asset}theme.js?v=202611260939"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject} {week_label} · {title}</title>
    <meta name="description" content="{subject} {week_label} 정리 — {title}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="{subject} {week_label} · {title}">
    <meta property="og:description" content="{subject} {week_label} 정리 — 필기 · 예제 · 그림">
    <meta property="og:image" content="https://gmlrms1016-dotcom.github.io/exam-summary/icon-512.png">
    <link rel="icon" href="{asset}favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="{asset}icon-180.png">
    <link rel="stylesheet" href="{asset}style.css?v=202611260939">
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
<script src="{asset}ink.js?v=202611260939"></script>
</body>
</html>
"""


LAB_LINE = re.compile(r"^🎬 \[[^\]]+\]\((anim/[^)?#\s]+)[^)\s]*\)$")


def lift_top(md, subject, week, src_dir):
    """주차 페이지(시험 주차 말고) — 맨 위 🎨 그림 절 바로 아래에 ① 이 주차가 나오는 시험(중간 1~7 · 기말 9~14 · 빨간 얇은 테두리)
    ② 버튼 실험실(🎬 anim/… 중 -그림정리.html 말고 · 파일마다 처음 것 하나)을 올림. 원고 중간의 실험실 🎬 줄은 빼서 같은 iframe 이 두 번 안 나오게.
    그림 절이 없으면 첫 ## 절 앞에. (2026-11-27 사용자: “맨처음에 그림 → 중간 · 기말을 빨간 얇은 테두리로 그림 바로 밑에 → 그 밑에 실습예제”)"""
    if week in EXAMS:
        return md
    lines, keep, labs = md.split("\n"), [], []
    for ln in lines:
        m = LAB_LINE.match(ln.strip())
        if m and "-그림정리.html" not in m.group(1):
            if m.group(1) not in [k for k, _ in labs]:
                labs.append((m.group(1), ln.strip()))
            if keep and not keep[-1].strip():          # 빼고 난 자리에 빈 줄이 두 번 남지 않게
                keep.pop()
            continue
        keep.append(ln)
    ew = 8 if week <= 7 else 15
    exam = EXAMS[ew]
    href = page_name(subject, ew) + ".html" if os.path.exists(os.path.join(src_dir, page_name(subject, ew) + ".md")) else ""
    block = [":::wkexam %s|%s|%s" % (exam, "1 ~ 7주차" if ew == 8 else "9 ~ 14주차", href), ""]
    for _, ln in labs:
        block += [ln, ""]
    fig = next((i for i, l in enumerate(keep) if l.startswith("## 🎨")), None)
    start = fig + 1 if fig is not None else 0
    at = next((i for i in range(start, len(keep)) if keep[i].startswith("## ")), len(keep))
    if fig is None:                                     # 그림 절이 없으면 첫 ## 절 앞 (제목 · 머리말 다음)
        at = next((i for i, l in enumerate(keep) if l.startswith("## ")), len(keep))
    if at > 0 and keep[at - 1].strip():
        block = [""] + block
    keep[at:at] = block
    return "\n".join(keep)


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
                weeks[week] = render_md(lift_top(open(src, encoding="utf-8").read(), subject, week, SRC))
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
