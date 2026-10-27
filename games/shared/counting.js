// 새 마을 게임들이 함께 쓰는 "하나씩 눌러 세기"와 "같이 세어 주기(힌트)".
import { h } from '../../widgets/dom.js';
import { wait } from '../logic.js';

export const HINT_START_MS = 1400;
export const HINT_STEP_MS = 750;

/** 물건에 번호표를 붙인다 (이미 있으면 바꾼다) */
export function markCount(item, label) {
  item.classList.add('c');
  item.querySelector('.num')?.remove();
  item.append(h('span', { class: 'num' }, String(label)));
}

export function clearCount(items) {
  items.forEach((it) => {
    it.classList.remove('c', 'hl');
    it.querySelector('.num')?.remove();
  });
}

/**
 * 물건을 하나씩 누르면 번호표를 붙이고 세는 말을 한다.
 * @param wordOf (k) => 말 (k번째로 누른 것)
 * @param labelOf (k) => 번호표 글자
 */
export function tapToCount(items, { run, say, sfx }, { wordOf, labelOf = (k) => k }) {
  let counted = 0;
  items.forEach((item) => {
    item.addEventListener('click', () => {
      run.poke();
      if (item.classList.contains('c') || run.state.busy) return;
      counted += 1;
      markCount(item, labelOf(counted));
      sfx.pop();
      say(wordOf(counted));
    });
  });
  return {
    /** 힌트로 다 센 뒤: 번호표를 다시 붙이지 않게 */
    setAll() {
      counted = items.length;
    },
    reset() {
      counted = 0;
      clearCount(items);
    },
  };
}

/**
 * 하나씩 반짝이며 같이 센다. 화면을 떠났으면 멈추고 false.
 * @returns {Promise<boolean>} 끝까지 셌는지
 */
export async function countTogether(items, { run, say }, { wordOf, labelOf = (k) => k, stepMs = HINT_STEP_MS }) {
  for (let i = 0; i < items.length; i += 1) {
    if (run.state.stopped) return false;
    items[i].classList.add('hl');
    markCount(items[i], labelOf(i + 1));
    const word = wordOf(i + 1);
    if (word) say(word);
    await wait(stepMs);
    items[i].classList.remove('hl');
  }
  return !run.state.stopped;
}
