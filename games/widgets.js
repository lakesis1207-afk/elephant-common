// 게임들이 함께 쓰는 화면 조각: 숫자 보기 버튼(숫자만 크게), 점 그림(텐프레임), 흔들기, 반짝 강조
import { h } from '../widgets/dom.js';
import { nearChoices, tenFrame } from './logic.js';

/** 점 그림 10칸 (채운 칸 = 수) */
export const tenFrameEl = (n) =>
  h('span', { class: 'tf', 'aria-hidden': 'true' }, tenFrame(n).map((on) => h('i', { class: on ? 'f' : '' })));

/** 숫자 보기 버튼들 (주어진 수). 누르면 onPick(값, 버튼) */
export function numberButtons(values, onPick) {
  return h(
    'div',
    { class: 'opts' },
    values.map((v) => {
      const btn = h('button', { class: 'opt press pick', 'data-n': v, 'data-value': v, 'aria-label': String(v) }, h('b', {}, String(v)));
      btn.addEventListener('click', () => onPick(v, btn));
      return btn;
    }),
  );
}

/** 숫자 보기 3개: 정답 + 가까운 수 2개. 누르면 onPick(값, 버튼) */
export const numberOptions = (answer, min, max, onPick) => numberButtons(nearChoices(answer, min, max), onPick);

/** 애니메이션 클래스를 다시 붙여 처음부터 재생 */
export function replayClass(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // 브라우저가 제거를 반영하게 한 번 읽는다
  el.classList.add(cls);
}

/**
 * 숫자 보기를 눌렀을 때 공통 처리: 틀리면 바로 흔들고, 맞으면 초록색.
 * run.answer가 힌트까지 기다리므로 흔들기는 먼저 한다.
 */
export function pickHandler(run, answer, onRight = () => {}) {
  return async (value, btn) => {
    run.poke();
    if (run.state.busy) return;
    const isRight = value === answer;
    if (!isRight) replayClass(btn, 'no');
    const result = await run.answer(isRight);
    if (result === 'right') {
      btn.classList.add('right');
      onRight();
    }
  };
}
