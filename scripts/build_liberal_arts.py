# -*- coding: utf-8 -*-
"""전공 첫 화면(index.html)을 그대로 복사해 교양 첫 화면(liberal-arts-courses/index.html)을 만든다.

사용: python3 scripts/build_liberal_arts.py   (전공 index.html 을 고친 뒤 다시 실행하면 교양도 똑같이 따라감)

바뀌는 것은 '과목 선택 내용물'뿐이다.
- 제목 · 설명: 전공 → 교양
- 공용 파일 경로: theme.js · schedule.js · haksa.json → ../ (한 폴더 아래라서)
- 1학년 1학기: 버튼만 남기고 잠금 (1학기 화면 · 과목 허브는 만들지 않음)
- 1학년 2학기: 중간·기말 과목 카드를 교양 과목으로 교체, 시험 시각·기말 잠금 기준도 교양 과목으로
- 전공 사이트에는 교양으로 가는 링크를 만들지 않는다 (즐겨찾기로만 들어옴)
- (숨김) 첫 화면 카운트다운 카드를 일→시간→분→초 순서로 누르면 전공 ↔ 교양 이동 — 교양 쪽 목적지는 "../"
"""
import os
import re

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SRC = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "liberal-arts-courses", "index.html")

# 교양 2학기 과목 — 시험 시각은 schedule.js 와 맞춤 (과목 공지가 없어 시험 주간의 수업 시간)
G = 'fill="#d7ebe0" stroke="#2d6a4f" stroke-width="1.5"'
SUBJECTS = [
    {
        "file": "공동체와배려의실천.html", "name": "공동체와배려의실천",
        "mid": "2026-10-22T09:00:00", "final": "2026-12-10T09:00:00",
        "desc": "<b>목 09:00</b> · 토론 vs 토의 · 하비거스트 · 프로이트 · 매슬로",
        "icon": '<svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8.2" r="2.9" %s/><circle cx="16" cy="8.2" r="2.9" %s/>'
                '<path d="M2.8 19.6c.4-3.2 2.5-5.1 5.2-5.1 1.6 0 2.9.7 4 1.8 1.1-1.1 2.4-1.8 4-1.8 2.7 0 4.8 1.9 5.2 5.1" stroke="#2d6a4f" stroke-width="1.5" stroke-linecap="round"/>'
                '<path d="M12 3.6c-.7-.8-1.9-.7-2.3.1-.4.8.2 1.7 2.3 3 2.1-1.3 2.7-2.2 2.3-3-.4-.8-1.6-.9-2.3-.1Z" fill="#d9772b" stroke="#d9772b" stroke-width=".8" stroke-linejoin="round"/></svg>' % (G, G),
    },
    {
        "file": "기업가정신과창업.html", "name": "기업가정신과창업",
        "mid": "2026-10-19T12:00:00", "final": "2026-12-07T12:00:00",
        "desc": "<b>월 12:00</b> · 기업가정신 교육 · 1차 산업혁명 · 신사문화 · 제임스 와트",
        "icon": '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2.8c3.2 2.2 4.8 5.6 4.3 10.2l-2.3 2.6h-4l-2.3-2.6C7.2 8.4 8.8 5 12 2.8Z" %s stroke-linejoin="round"/>'
                '<circle cx="12" cy="9" r="1.8" stroke="#2d6a4f" stroke-width="1.4"/>'
                '<path d="M7.7 12.4 5 15.2l2.6 1.1M16.3 12.4 19 15.2l-2.6 1.1" stroke="#2d6a4f" stroke-width="1.4" stroke-linejoin="round"/>'
                '<path d="M10.6 17.6c0 1.6.7 2.7 1.4 3.6.7-.9 1.4-2 1.4-3.6" stroke="#d9772b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' % G,
    },
    {
        "file": "인공지능과뇌인지과학.html", "name": "인공지능과뇌인지과학",
        "mid": "2026-10-22T11:00:00", "final": "2026-12-10T11:00:00",
        "desc": "<b>목 11:00</b> · 인지과학 역사 · 행동주의 · 인지혁명 · 인지심리학 3대 접근",
        "icon": '<svg viewBox="0 0 24 24" fill="none"><path d="M10.6 4.3A3 3 0 0 0 7.2 6.6a3 3 0 0 0-2 4.7 3 3 0 0 0 1.3 4.8 3 3 0 0 0 4.1 3.4V4.3Z" %s stroke-linejoin="round"/>'
                '<path d="M13.4 4.3a3 3 0 0 1 3.4 2.3 3 3 0 0 1 2 4.7 3 3 0 0 1-1.3 4.8 3 3 0 0 1-4.1 3.4V4.3Z" %s stroke-linejoin="round"/>'
                '<path d="M7.8 10.2h2.8M13.4 13.4h2.8M10.6 13.8 8.6 15.6M13.4 10 15.4 8.2" stroke="#d9772b" stroke-width="1.4" stroke-linecap="round"/></svg>' % (G, G),
    },
]


def sub(text, old, new, count=1):
    n = text.count(old)
    assert n == count, "전공 index.html 구조가 바뀌어 교체할 곳을 못 찾음: %r (%d곳)" % (old[:70], n)
    return text.replace(old, new)


def cards(kind):
    out = []
    for s in SUBJECTS:
        out.append(
            '            <a class="subject" data-file="%s" data-exam="%s" href="%s">\n'
            '                <span class="subj-ic">%s</span>\n'
            '                <span class="subj-body"><span class="subj-name">%s</span><span class="subj-desc">%s</span></span>\n'
            '                <span class="subj-state"></span>\n'
            '            </a>' % (s["file"], s[kind], s["file"], s["icon"], s["name"], s["desc"]))
    return "\n".join(out)


def main():
    s = open(SRC, encoding="utf-8").read()
    first_mid = min(x["mid"] for x in SUBJECTS)
    first_final = min(x["final"] for x in SUBJECTS)

    # ① 제목 · 설명 · 머리 주석
    s = sub(s, "<!-- 전공 정리 허브(index) · 화면(해시 라우팅)                              -->",
            "<!-- 교양 정리 허브(liberal-arts-courses/index) · 화면(해시 라우팅)         -->\n"
            "<!--  ⚠️ 이 파일은 scripts/build_liberal_arts.py 가 전공 index.html 을 복사해 만듭니다 — 직접 고치지 마세요 -->")
    s = sub(s, "동양미래대학교 컴퓨터정보공학과 전공 시험 정리", "동양미래대학교 교양 시험 정리")
    s = sub(s, "<title>전공 학습 정리</title>", "<title>교양 학습 정리</title>")

    # ② 공용 파일 경로 (한 폴더 아래)
    s = re.sub(r'src="(theme\.js|schedule\.js)(\?v=[\w.-]*)?"', lambda m: 'src="../%s%s"' % (m.group(1), m.group(2) or ""), s)
    s = sub(s, 'fetch("haksa.json"', 'fetch("../haksa.json"')

    # ③ 1학년 1학기: 버튼만 두고 잠금 + 1학기 화면 두 개 삭제
    m = re.search(r'            <button class="bigbtn" type="button" data-go="sem1">\n(.*?)\n            </button>\n', s, re.S)
    assert m, "홈의 1학년 1학기 버튼을 못 찾음"
    icon = re.search(r'(<span class="bb-ic[^"]*">.*?</svg></span>)', m.group(1), re.S).group(1)
    locked = ('            <button class="bigbtn soon" type="button" disabled aria-disabled="true" title="교양 1학기는 정리하지 않아요">\n'
              '                %s\n'
              '                <span class="bb-body"><span class="bb-t">1학년 1학기 <span class="tag-done">잠김</span></span></span>\n'
              '            </button>\n' % icon)
    s = s[:m.start()] + locked + s[m.end():]
    a = s.index("    <!-- ════════ 1학년 1학기 ════════ -->")
    b = s.index("    <!-- ════════ 1학년 2학기 ════════ -->")
    s = s[:a] + s[b:]
    assert 'id="sem1"' not in s and 'id="sem1-final"' not in s

    # ④ 1학년 2학기: 시험 버튼 시각 · 기말 잠금 기준 · 과목 카드
    s = sub(s, 'data-go="sem2-mid" data-exam-target="2026-10-19T14:00:00"', 'data-go="sem2-mid" data-exam-target="%s"' % first_mid)
    s = sub(s, 'data-go="sem2-final" data-exam-target="2026-12-07T14:00:00"', 'data-go="sem2-final" data-exam-target="%s"' % first_final)
    s = re.sub(r'data-unlock-after="[^"]*"', 'data-unlock-after="%s"' % ",".join(x["file"] for x in SUBJECTS), s)
    for kind, list_id in (("mid", "sem2-mid-list"), ("final", "sem2-final-list")):
        pat = re.compile(r'(<div class="subjects" id="%s">\n)(.*?)(\n        </div>)' % list_id, re.S)
        assert pat.search(s), list_id
        s = pat.sub(lambda mm: mm.group(1) + cards(kind) + mm.group(3), s, count=1)

    # ⑤ (숨김) 카운트다운 일→시간→분→초 이스터에그: 교양에서는 전공 첫 화면으로
    s = sub(s, 'var SWITCH_TO = "liberal-arts-courses/";', 'var SWITCH_TO = "../";')

    # ⑥ 2학기 중간 · 기말 카운트다운 기준 시각
    s = re.sub(r'(mid:\s*")[^"]*(")', lambda mm: mm.group(1) + first_mid + mm.group(2), s, count=1)
    s = re.sub(r'(final:\s*")[^"]*(")', lambda mm: mm.group(1) + first_final + mm.group(2), s, count=1)

    for word in ("프로그래밍언어실습.html", "운영체제실습.html", "데이터베이스관리.html", "자바프로그래밍.html"):
        assert word not in s.split("<script>")[0] or word in s.split("과목 추가법")[1][:2000], word
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write(s)
    print("교양 첫 화면 생성: liberal-arts-courses/index.html · 중간 %s · 기말 %s" % (first_mid, first_final))


if __name__ == "__main__":
    main()
