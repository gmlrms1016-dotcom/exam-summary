# ============================================================
# grader.py  ·  파이썬 4문제 인앱 채점기 (Pyodide에서 실행)
#   pyrun.js 가 이 파일을 fetch 해서 runPython 으로 정의한 뒤 grade(pid, code) 호출
#   - 표준입력(input)·표준출력(print)을 가로채서 실행/채점
#   - turtle 은 모의 모듈로 가상 실행(구조 채점)
# ============================================================
import sys, io, builtins, traceback, re, random, types


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
    # ---------- 1번: get_grade (함수 호출 채점) ----------
    if pid == 1:
        out, ns, err = _run(code, [], as_main=False)   # main()은 실행 안 함
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        gg = ns.get('get_grade')
        if not callable(gg):
            return {'ok': False, 'msg': 'get_grade(score) 함수를 정의하세요.', 'output': ''}
        cases = {100: 'A+', 95: 'A+', 90: 'A+', 89: 'A', 80: 'A', 75: 'B+', 70: 'B+',
                 69: 'B', 60: 'B', 55: 'C+', 50: 'C+', 49: 'C', 40: 'C', 39: 'F', 10: 'F', 0: 'F'}
        bad = []
        for k, v in cases.items():
            try:
                r = gg(k)
            except Exception as e:
                r = 'ERR(' + type(e).__name__ + ')'
            if str(r).strip() != v:
                bad.append((k, r, v))
        if bad:
            lines = '\n'.join('  %d점 → 내 답 "%s" (정답 "%s")' % (k, r, v) for k, r, v in bad[:8])
            return {'ok': False, 'msg': '오답 — %d개 점수에서 학점이 틀렸어요.' % len(bad), 'output': lines}
        return {'ok': True, 'msg': '정답! 모든 점수 케이스를 통과했어요 🎉',
                'output': '예) 90→%s, 80→%s, 75→%s, 40→%s, 30→%s' % (gg(90), gg(80), gg(75), gg(40), gg(30))}

    # ---------- 2번: lengths (출력 정확 비교) ----------
    if pid == 2:
        inp = "Your submitted manuscript is currently under review"
        out, ns, err = _run(code, [inp], as_main=True)
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        exp = ["각 단어의 길이:", "Your: 4글자", "submitted: 9글자", "manuscript: 10글자",
               "is: 2글자", "currently: 9글자", "under: 5글자", "review: 6글자"]
        got = [l.rstrip() for l in out.strip().splitlines() if l.strip()]
        if "각 단어의 길이:" in got:
            got = got[got.index("각 단어의 길이:"):]
        ok = got == exp
        return {'ok': ok, 'msg': '정답! 출력이 정확해요 🎉' if ok else '오답 — 출력이 정답과 달라요.',
                'output': out.strip() + ('' if ok else '\n\n[기대한 출력]\n' + '\n'.join(exp))}

    # ---------- 3번: turtle (가상 실행 + 구조 채점) ----------
    if pid == 3:
        ops = []
        tmod = types.ModuleType('turtle')

        def mk(name):
            def f(*a, **k):
                ops.append((name, a))
                return None
            return f
        for n in ['shape', 'setup', 'speed', 'pu', 'pd', 'penup', 'pendown', 'goto', 'setpos', 'setposition',
                  'fillcolor', 'color', 'pencolor', 'begin_fill', 'forward', 'fd', 'backward', 'bk',
                  'left', 'lt', 'right', 'rt', 'end_fill', 'done', 'bgcolor', 'width', 'pensize',
                  'circle', 'hideturtle', 'showturtle', 'title', 'tracer', 'update', 'home', 'clear', 'reset']:
            setattr(tmod, n, mk(n))
        sys.modules['turtle'] = tmod
        out, ns, err = _run(code, ["3"], as_main=True)   # 개수 3 입력(입력 안 받으면 무시됨)
        sys.modules.pop('turtle', None)
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        shapes = sum(1 for n, a in ops if n == 'begin_fill')
        fwd100 = sum(1 for n, a in ops if n in ('forward', 'fd') and a and abs(a[0] - 100) < 1e-6)
        fills = sum(1 for n, a in ops if n == 'fillcolor')
        colors = set(str(a[0]) for n, a in ops if n in ('fillcolor', 'color') and a)
        detail = '거북이 동작: 도형 %d개, forward(100) %d회, fillcolor %d회, 사용한 색 %d종\n(그래픽 창은 미리보기 불가 — 동작만 검증합니다.)' % (
            shapes, fwd100, fills, len(colors))
        ok = shapes >= 1 and fwd100 >= shapes * 3 and fills >= shapes and len(colors) >= 2
        return {'ok': ok, 'msg': '정답! 임의 위치에 도형을 색칠해 그렸어요 🎉' if ok else
                '오답 — 도형 그리기/색칠 동작이 부족해요. (begin_fill·forward(100)·fillcolor 확인)',
                'output': detail}

    # ---------- 4번: locker (출력 구조 채점) ----------
    if pid == 4:
        out, ns, err = _run(code, ["10"], as_main=True)
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        ok = False
        m = re.findall(r'\[([^\]]*)\]', out)
        if m:
            arr = [int(x) for x in re.findall(r'\d+', m[-1])]
            ok = len(arr) == 10 and len(set(arr)) == 10 and all(10 <= x <= 99 for x in arr)
        if not ok:
            # 리스트 대괄호가 없을 때: 출력에서 두 자리 수 10개 추출 시도
            nums = [int(x) for x in re.findall(r'\b\d{2}\b', out)]
            ok = len(set(nums)) >= 10
        return {'ok': ok, 'msg': '정답! 두 자리 사물함 번호 10개를 중복 없이 배정했어요 🎉' if ok else
                '오답 — 두 자리(10~99) 번호 10개를 중복 없이 출력했는지 확인하세요.',
                'output': out.strip()}

    return {'ok': False, 'msg': '알 수 없는 문제 번호', 'output': ''}
