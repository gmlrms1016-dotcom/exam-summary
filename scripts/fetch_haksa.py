# -*- coding: utf-8 -*-
"""동양미래대학교 학사일정 페이지를 읽어 haksa.json 으로 저장한다. (표준 라이브러리만 사용)
GitHub Actions 에서도 그대로 실행된다. 일정이 너무 적게 잡히면(차단·레이아웃 변경) 실패로 끝낸다."""
import re, json, html, sys, os, urllib.request

URL = "https://www.dongyang.ac.kr/dmu/4749/subview.do"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "haksa.json")

def fetch(path=None):
    if path:
        return open(path, encoding="utf-8", errors="ignore").read()
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (exam-summary haksa updater)"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "ignore")

def clean(fragment):
    text = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()

def parse(page):
    events = []
    for li in re.finditer(r'<li>\s*<div class="scd-month">(.*?)</li>', page, re.S):
        block = li.group(1)
        y = re.search(r'class="box-year[^"]*">\s*(\d{4})', block)
        m = re.search(r'class="box-month">\s*(\d{1,2})\s*월', block)
        if not (y and m):
            continue
        year, month = int(y.group(1)), int(m.group(1))
        for box in re.finditer(r'class="list-date">(.*?)</p>\s*<p class="list-content">(.*?)</p>', block, re.S):
            label, title = clean(box.group(1)), clean(box.group(2))
            days = re.findall(r"(\d{2})\.(\d{2})", label)
            if not days or not title:
                continue
            sm, sd = map(int, days[0])
            em, ed = map(int, days[-1])
            sy = year
            ey = sy + 1 if (em, ed) < (sm, sd) else sy          # 12.28 ~ 01.02 처럼 해를 넘기는 경우
            events.append({
                "group": "%04d-%02d" % (year, month),              # 학교 목록의 월 묶음 그대로
                "start": "%04d-%02d-%02d" % (sy, sm, sd),
                "end":   "%04d-%02d-%02d" % (ey, em, ed),
                "label": label,
                "title": title,
            })
    return events

def main():
    page = fetch(sys.argv[1] if len(sys.argv) > 1 else None)
    events = parse(page)
    if len(events) < 30:
        sys.exit("일정이 %d건만 잡혔습니다. 차단되었거나 페이지 구조가 바뀐 것 같아 저장하지 않습니다." % len(events))
    ay = re.search(r"(\d{4})\s*학년도", page)
    data = {"source": URL, "academicYear": ay.group(1) if ay else "", "events": events}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("저장: %s (%d건)" % (os.path.normpath(OUT), len(events)))

if __name__ == "__main__":
    main()
