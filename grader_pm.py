# ============================================================
# grader_pm.py  ·  프로그래밍방법론 기말 인앱 채점기 (Pyodide에서 실행)
#   pyrun.js 가 window.GRADER_SRC="grader_pm.py" 로 이 파일을 불러와 grade(pid, code) 호출
#   범위: 9~14주차 (선택구조 / 반복구조 / 함수·재귀 / 클래스) + 순서도→파이썬
#
#   ▣ 채점 원칙 (★중요)
#     - 모든 문제는 "입력(input) → 계산 → print 출력" 하는 '완성된 프로그램'을 작성하는 방식.
#     - 채점은 학생 코드의 '표준출력(print 결과)'을 비교한다.
#       → return 만 하고 print 를 안 하면 출력이 없어 '오답' 으로 처리된다. (print 까지 써야 정답)
#     - input() 은 가로채어 미리 정한 값을 넣어 주고, 프롬프트는 출력에 섞이지 않는다.
# ============================================================
import sys, io, builtins, traceback, re, math


def _run(code, inputs):
    """학생 코드를 input/print 가로채서 실행. 반환: (출력문자열, 네임스페이스, 에러트레이스)"""
    out = io.StringIO()
    old_out, old_in = sys.stdout, builtins.input
    it = iter(inputs)
    sys.stdout = out
    builtins.input = lambda *a: next(it, '')   # 프롬프트는 출력하지 않음
    ns = {'__name__': '__main__'}
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


def _blank(code):
    """주석(#)·공백만 있으면 '아직 안 쓴 코드'로 판단."""
    for line in code.splitlines():
        s = line.strip()
        if s and not s.startswith('#'):
            return False
    return True


def _nums(s):
    """문자열에서 숫자(정수/실수)를 모두 뽑아 float 집합으로."""
    return set(float(x) for x in re.findall(r'-?\d+\.\d+|-?\d+', s))


def _empty_msg():
    return {'ok': False, 'msg': '아직 코드가 비어 있어요. 위 설명을 보고 직접 작성해 보세요.', 'output': ''}


def grade(pid, code):
    # ---------- 1번: 윤년 판별 (선택구조 · 입력→print 출력) ----------
    if pid == 1:
        if _blank(code):
            return _empty_msg()
        cases = [(2000, '윤년'), (1900, '평년'), (2024, '윤년'), (2023, '평년'),
                 (2400, '윤년'), (2100, '평년'), (2012, '윤년'), (2021, '평년')]
        bad = []
        for year, ans in cases:
            out, ns, err = _run(code, [str(year)])
            if err:
                return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
            other = '평년' if ans == '윤년' else '윤년'
            if (ans not in out) or (other in out):
                bad.append((year, out.strip() or '(출력 없음)', ans))
        if bad:
            lines = '\n'.join('  %d년 → 내 출력 "%s" (정답 "%s")' % (y, g, a) for y, g, a in bad[:8])
            return {'ok': False,
                    'msg': '오답 — %d개 연도에서 출력이 틀렸어요. (결과를 print 로 출력했는지 확인!)' % len(bad),
                    'output': lines}
        return {'ok': True, 'msg': '정답! 연도를 입력받아 윤년/평년을 정확히 출력했어요 🎉',
                'output': '예) 2000→윤년, 1900→평년, 2024→윤년, 2023→평년'}

    # ---------- 2번: 가위바위보 승부 판정 (중첩 if · 입력→print 출력) ----------
    if pid == 2:
        if _blank(code):
            return _empty_msg()
        cases = [
            (('가위', '가위'), '비김'), (('바위', '바위'), '비김'), (('보', '보'), '비김'),
            (('가위', '보'), '이김'), (('바위', '가위'), '이김'), (('보', '바위'), '이김'),
            (('가위', '바위'), '짐'), (('바위', '보'), '짐'), (('보', '가위'), '짐'),
        ]
        bad = []
        for (p, c), ans in cases:
            out, ns, err = _run(code, [p, c])   # 입력 순서: player 먼저, computer 다음
            if err:
                return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
            others = [w for w in ('비김', '이김', '짐') if w != ans]
            if (ans not in out) or any(w in out for w in others):
                bad.append((p, c, out.strip() or '(출력 없음)', ans))
        if bad:
            lines = '\n'.join('  나=%s, 컴=%s → 내 출력 "%s" (정답 "%s")' % (p, c, g, a) for p, c, g, a in bad[:9])
            return {'ok': False,
                    'msg': '오답 — %d개 경우에서 출력이 틀렸어요. (결과를 print 로 출력했는지 확인!)' % len(bad),
                    'output': lines}
        return {'ok': True, 'msg': '정답! 나·컴퓨터를 입력받아 승부를 정확히 출력했어요 🎉',
                'output': '예) (가위,보)→이김, (가위,바위)→짐, (바위,바위)→비김'}

    # ---------- 3번: 별 삼각형 (중첩 반복 · 출력 비교) ----------
    if pid == 3:
        if _blank(code):
            return _empty_msg()
        out, ns, err = _run(code, ["5"])   # 줄 수 5 입력
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        exp = ["*", "**", "***", "****", "*****"]
        got = [l.rstrip() for l in out.splitlines() if l.strip() != ""]
        ok = got == exp
        return {'ok': ok,
                'msg': '정답! n=5 별 삼각형을 정확히 출력했어요 🎉' if ok else
                       '오답 — 출력이 정답과 달라요. (print 로 출력했는지 확인!)',
                'output': out.rstrip() + ('' if ok else '\n\n[기대한 출력]\n' + '\n'.join(exp))}

    # ---------- 4번: 구구단 한 단 (반복 · 출력 비교) ----------
    if pid == 4:
        if _blank(code):
            return _empty_msg()
        out, ns, err = _run(code, ["3"])   # 3단 입력
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        exp = ["3 * %d = %d" % (j, 3 * j) for j in range(1, 10)]
        norm = lambda s: re.sub(r'\s+', ' ', s.strip())
        lines = [norm(l) for l in out.splitlines() if re.match(r'^\s*\d+\s*\*\s*\d+\s*=\s*\d+\s*$', l)]
        ok = lines == [norm(e) for e in exp]
        return {'ok': ok,
                'msg': '정답! 3단을 정확히 출력했어요 🎉' if ok else
                       '오답 — 출력(3단)이 정답과 달라요. (print 로 출력했는지 확인!)',
                'output': out.rstrip() + ('' if ok else '\n\n[기대한 출력]\n' + '\n'.join(exp))}

    # ---------- 5번: 팩토리얼 (재귀 함수 · 입력→print 출력) ----------
    if pid == 5:
        if _blank(code):
            return _empty_msg()
        bad = []
        for n in [1, 3, 5, 6, 4, 7, 8]:
            out, ns, err = _run(code, [str(n)])
            if err:
                return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
            want = math.factorial(n)
            if float(want) not in _nums(out):
                bad.append((n, out.strip() or '(출력 없음)', want))
        if bad:
            lines = '\n'.join('  %d! → 내 출력 "%s" (정답 "%s")' % (n, g, v) for n, g, v in bad[:8])
            return {'ok': False,
                    'msg': '오답 — %d개에서 출력이 틀렸어요. (결과를 print 로 출력했는지 확인!)' % len(bad),
                    'output': lines}
        return {'ok': True, 'msg': '정답! n을 입력받아 재귀로 n!을 계산해 출력했어요 🎉',
                'output': '예) 1→1, 3→6, 5→120, 6→720'}

    # ---------- 6번: Student 클래스 (객체 생성·메서드 + print 출력) ----------
    if pid == 6:
        if _blank(code):
            return _empty_msg()
        out, ns, err = _run(code, [])
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
        printed = (340.0 in _nums(out)) and (85.0 in _nums(out))
        if ok_sum and ok_avg and not printed:
            return {'ok': False,
                    'msg': '클래스는 맞지만 결과를 print 로 출력하지 않았어요. 총점·평균을 print 하세요!',
                    'output': '예) print(s.get_sum())  →  340\n     print(s.get_average())  →  85.0'}
        ok = ok_sum and ok_avg and printed
        detail = 'get_sum()=%s (정답 340), get_average()=%s (정답 85.0)\n내 출력: %s' % (ssum, savg, out.strip() or '(없음)')
        return {'ok': ok,
                'msg': '정답! 클래스로 총점·평균을 구해 출력까지 완성했어요 🎉' if ok else
                       '오답 — 총점/평균 또는 출력값을 확인하세요.',
                'output': detail}

    # ---------- 7번: Cars 클래스 (속성·setter·동작 메서드 + print 출력) ----------
    if pid == 7:
        if _blank(code):
            return _empty_msg()
        out, ns, err = _run(code, [])
        if err:
            return {'ok': False, 'msg': '실행 오류가 났어요.', 'output': err}
        C = ns.get('Cars')
        if C is None:
            return {'ok': False, 'msg': 'Cars 클래스를 정의하세요.', 'output': ''}

        def _call(obj, name, *args):   # 메서드 호출 시 print 출력을 가로채는 헬퍼
            buf = io.StringIO(); old = sys.stdout; sys.stdout = buf
            try:
                m = getattr(obj, name, None)
                if not callable(m):
                    return None, '__NOMETHOD__'
                r = m(*args)
            except Exception as e:
                sys.stdout = old
                return None, 'ERR(' + type(e).__name__ + ')'
            finally:
                sys.stdout = old
            return r, buf.getvalue()

        try:
            car = C("DYU", "red", 2, "2Ton")
        except Exception as e:
            return {'ok': False, 'msg': 'Cars("DYU","red",2,"2Ton") 객체 생성에서 오류가 났어요.',
                    'output': type(e).__name__ + ': ' + str(e)}
        bad = []
        # (1) __init__ 속성 저장
        for k, v in {'model': 'DYU', 'color': 'red', 'number': 2, 'weight': '2Ton'}.items():
            if getattr(car, k, '__MISS__') != v:
                bad.append('속성 self.%s 저장값이 달라요 (기대 %r)' % (k, v))
        # (2) 동작/설정 메서드 존재
        for m in ['forward', 'backward', 'stop', 'getcolor', 'modelname', 'setcolor']:
            if not callable(getattr(car, m, None)):
                bad.append('%s() 메서드를 정의하세요' % m)
        # (3) setter: setcolor 가 self.color 를 실제로 바꾸는지
        _r, _o = _call(car, 'setcolor', 'blue')
        if _o != '__NOMETHOD__' and getattr(car, 'color', None) != 'blue':
            bad.append('setcolor("blue") 후 self.color 가 "blue" 로 바뀌어야 해요')
        # (4) 동작 메서드가 실제로 print 하는지
        if '앞으로' not in _call(car, 'forward')[1]:
            bad.append('forward() 가 "앞으로 갑니다." 를 print 해야 해요')
        if bad:
            return {'ok': False, 'msg': '오답 — %d군데를 확인하세요.' % len(bad),
                    'output': '\n'.join('  · ' + b for b in bad[:8])}
        # (5) 학생이 객체를 만들어 '사용 예'를 print 로 출력했는지
        need = [('앞으로', 'forward() 호출 → "앞으로 갑니다."'),
                ('blue', 'setcolor("blue") 후 getcolor() → "...색상은 blue..."'),
                ('DYU', 'modelname() → "...모델 이름은 DYU..."')]
        miss = [desc for key, desc in need if key not in out]
        if miss:
            return {'ok': False,
                    'msg': '클래스는 맞지만 사용 예를 print 로 출력하지 않았어요.',
                    'output': '객체를 만들어 아래가 출력되도록 메서드를 호출하세요:\n  · ' + '\n  · '.join(miss)}
        return {'ok': True, 'msg': '정답! 속성·동작 메서드·setter + 출력까지 모두 완성했어요 🎉',
                'output': '내 출력:\n' + out.strip()}

    return {'ok': False, 'msg': '알 수 없는 문제 번호', 'output': ''}
