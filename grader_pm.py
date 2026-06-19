# ============================================================
# grader_pm.py  ·  프로그래밍방법론 기말 인앱 채점기 (Pyodide에서 실행)
#   pyrun.js 가 window.GRADER_SRC="grader_pm.py" 로 이 파일을 불러와 grade(pid, code) 호출
#   범위: 9~14주차 (선택구조 / 반복구조 / 함수·재귀 / 클래스) + 순서도→파이썬
#   - 표준입력(input)·표준출력(print)을 가로채서 실행/채점
# ============================================================
import sys, io, builtins, traceback, re, math


def _run(code, inputs, as_main=True):
    """학생 코드를 input/print 가로채서 실행. (출력문자열, 네임스페이스, 에러트레이스)"""
    out = io.StringIO()
    old_out, old_in = sys.stdout, builtins.input
    it = iter(inputs)
    sys.stdout = out
    builtins.input = lambda *a: next(it, '')
    ns = {'__name__': '__main__' if as_main else 'grading'}
    err = None
    try:
        exec(code, ns)
    except SystemExit:
        pass
    except Exception:
        err = traceback.format_exc()
    finally:
        sys.stdout = old_out
        builtins.input = old_in
    return out.getvalue(), ns, err


def grade(pid, code):
    # ---------- 1번: 윤년 판별 (선택구조 · 함수 호출 채점) ----------
    if pid == 1:
        out, ns, err = _run(code, [], as_main=False)   # 입력 루프는 실행 안 함
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        f = ns.get('leap')
        if not callable(f):
            return {'ok': False, 'msg': 'leap(year) 함수를 정의하세요.', 'output': ''}
        cases = {2000: '윤년', 1900: '평년', 2024: '윤년', 2023: '평년', 2400: '윤년',
                 2100: '평년', 2012: '윤년', 2021: '평년', 1600: '윤년', 1700: '평년'}
        bad = []
        for k, v in cases.items():
            try:
                r = f(k)
            except Exception as e:
                r = 'ERR(' + type(e).__name__ + ')'
            if str(r).strip() != v:
                bad.append((k, r, v))
        if bad:
            lines = '\n'.join('  %d년 → 내 답 "%s" (정답 "%s")' % (k, r, v) for k, r, v in bad[:8])
            return {'ok': False, 'msg': '오답 — %d개 연도에서 틀렸어요.' % len(bad), 'output': lines}
        return {'ok': True, 'msg': '정답! 윤년 규칙(4의배수 ∧ ¬100의배수 ∨ 400의배수)을 통과했어요 🎉',
                'output': '예) 2000→%s, 1900→%s, 2024→%s, 2023→%s' % (f(2000), f(1900), f(2024), f(2023))}

    # ---------- 2번: 가위바위보 승부 판정 (중첩 if · 함수 호출 채점) ----------
    if pid == 2:
        out, ns, err = _run(code, [], as_main=False)
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        f = ns.get('judge')
        if not callable(f):
            return {'ok': False, 'msg': 'judge(player, computer) 함수를 정의하세요.', 'output': ''}
        cases = [
            (('가위', '가위'), '비김'), (('바위', '바위'), '비김'), (('보', '보'), '비김'),
            (('가위', '보'), '이김'), (('바위', '가위'), '이김'), (('보', '바위'), '이김'),
            (('가위', '바위'), '짐'), (('바위', '보'), '짐'), (('보', '가위'), '짐'),
        ]
        bad = []
        for (p, c), v in cases:
            try:
                r = f(p, c)
            except Exception as e:
                r = 'ERR(' + type(e).__name__ + ')'
            if str(r).strip() != v:
                bad.append((p, c, r, v))
        if bad:
            lines = '\n'.join('  나=%s, 컴=%s → 내 답 "%s" (정답 "%s")' % (p, c, r, v) for p, c, r, v in bad[:9])
            return {'ok': False, 'msg': '오답 — %d개 경우에서 판정이 틀렸어요.' % len(bad), 'output': lines}
        return {'ok': True, 'msg': '정답! 모든 승부 판정을 통과했어요 🎉',
                'output': '예) (가위,보)→%s, (가위,바위)→%s, (바위,바위)→%s' % (f('가위', '보'), f('가위', '바위'), f('바위', '바위'))}

    # ---------- 3번: 별 삼각형 (중첩 반복 · 출력 비교) ----------
    if pid == 3:
        out, ns, err = _run(code, ["5"], as_main=True)   # 줄 수 5 입력(input 없으면 무시)
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        exp = ["*", "**", "***", "****", "*****"]
        got = [l.rstrip() for l in out.splitlines() if l.strip() != ""]
        ok = got == exp
        return {'ok': ok, 'msg': '정답! 별 삼각형을 정확히 출력했어요 🎉' if ok else '오답 — 출력이 정답과 달라요.',
                'output': out.rstrip() + ('' if ok else '\n\n[기대한 출력]\n' + '\n'.join(exp))}

    # ---------- 4번: 구구단 한 단 (중첩/단일 반복 · 출력 비교) ----------
    if pid == 4:
        out, ns, err = _run(code, ["3"], as_main=True)   # 3단 입력
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        exp = ["3 * %d = %d" % (j, 3 * j) for j in range(1, 10)]
        norm = lambda s: re.sub(r'\s+', ' ', s.strip())
        lines = [norm(l) for l in out.splitlines() if re.match(r'^\s*\d+\s*\*\s*\d+\s*=\s*\d+\s*$', l)]
        ok = lines == [norm(e) for e in exp]
        return {'ok': ok, 'msg': '정답! 3단을 정확히 출력했어요 🎉' if ok else '오답 — 출력이 정답(3단)과 달라요.',
                'output': out.rstrip() + ('' if ok else '\n\n[기대한 출력]\n' + '\n'.join(exp))}

    # ---------- 5번: 팩토리얼 (재귀 함수 · 함수 호출 채점) ----------
    if pid == 5:
        out, ns, err = _run(code, [], as_main=False)
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        f = ns.get('factorial') or ns.get('fac')
        if not callable(f):
            return {'ok': False, 'msg': 'factorial(n) 함수를 정의하세요.', 'output': ''}
        bad = []
        for k in [1, 2, 3, 4, 5, 6, 7, 8]:
            try:
                r = f(k)
            except Exception as e:
                r = 'ERR(' + type(e).__name__ + ')'
            if str(r).strip() != str(math.factorial(k)):
                bad.append((k, r, math.factorial(k)))
        if bad:
            lines = '\n'.join('  %d! → 내 답 "%s" (정답 "%s")' % (k, r, v) for k, r, v in bad[:8])
            return {'ok': False, 'msg': '오답 — %d개에서 팩토리얼 값이 틀렸어요.' % len(bad), 'output': lines}
        return {'ok': True, 'msg': '정답! 재귀 팩토리얼이 정확해요 🎉',
                'output': '예) 1!→%s, 3!→%s, 5!→%s' % (f(1), f(3), f(5))}

    # ---------- 6번: Student 클래스 (객체 생성·메서드 채점) ----------
    if pid == 6:
        out, ns, err = _run(code, [], as_main=True)
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        C = ns.get('Student')
        if C is None:
            return {'ok': False, 'msg': 'Student 클래스를 정의하세요.', 'output': ''}
        try:
            s = C("홍길동", 100, 80, 90, 70)        # 합 340, 평균 85.0
            ssum = s.get_sum()
            savg = s.get_average()
        except Exception as e:
            return {'ok': False, 'msg': 'Student 객체 생성/메서드 호출에서 오류가 났어요.',
                    'output': type(e).__name__ + ': ' + str(e)}
        ok_sum = (ssum == 340)
        ok_avg = abs(float(savg) - 85.0) < 1e-6
        ok = ok_sum and ok_avg
        detail = 'get_sum() = %s (정답 340), get_average() = %s (정답 85.0)' % (ssum, savg)
        return {'ok': ok, 'msg': '정답! 클래스 속성·메서드가 올바르게 동작해요 🎉' if ok else
                '오답 — get_sum/get_average 결과를 확인하세요.', 'output': detail}

    return {'ok': False, 'msg': '알 수 없는 문제 번호', 'output': ''}
