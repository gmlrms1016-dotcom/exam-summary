#!/usr/bin/env python3
"""공용 파일 주소에 버전(?v=)을 붙여 브라우저 캐시를 끊는다.

GitHub Pages 는 JS·CSS 를 10분(max-age=600) 캐시하고, 크롬은 일반 새로고침 때 HTML 만 새로 받는다.
그래서 theme.js · style.css 같은 공용 파일을 고친 뒤에는 이 스크립트로 모든 페이지의 ?v= 값을 올린다.

    python3 scripts/bump_assets.py          # 지금 시각으로 버전 갱신
    python3 scripts/bump_assets.py 20261019 # 버전 직접 지정

바꾸는 곳: 루트 *.html · weeks/*.html · scripts/build_weeks.py(주차 페이지 틀)
"""
import glob
import os
import re
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = r"style\.css|theme\.js|quiz\.js|review\.js|weeks\.js|schedule\.js|pyrun\.js"
PATTERN = re.compile(r'((?:src|href)=["\'])((?:\.\./)?(?:' + ASSETS + r'))(?:\?v=[\w.-]*)?(["\'])')


def main():
    version = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y%m%d%H%M")
    files = sorted(glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "weeks", "*.html")))
    files.append(os.path.join(ROOT, "scripts", "build_weeks.py"))
    total = 0
    for path in files:
        if not os.path.exists(path):
            continue
        text = open(path, encoding="utf-8").read()
        new, n = PATTERN.subn(lambda m: m.group(1) + m.group(2) + "?v=" + version + m.group(3), text)
        if new != text:
            open(path, "w", encoding="utf-8").write(new)
        total += n
    print("버전 %s · 파일 %d개에서 주소 %d곳 갱신" % (version, len(files), total))


if __name__ == "__main__":
    main()
