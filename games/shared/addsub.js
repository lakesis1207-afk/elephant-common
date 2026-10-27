// 10 이하 더하기·빼기 게임 틀 (공룡 "알 더하기·빼기", 농장 "달걀 바구니").
// 더하기: 처음 있던 것만 보이다가, 새로 온 것이 잠시 뒤(TAKE_AT_MS) 톡 나타난다(반짝).
// 빼기: 처음엔 모두 있다가, 가져간 것만 위로 떠오르며 사라지고 흐린 자리(그림자)가 남는다.
// 남은(있는) 것을 하나씩 눌러 세고 숫자를 고른다. 힌트는 같이 세어 준다.
import { h, art } from '../../widgets/dom.js';
import { NATIVE, wait } from '../logic.js';
import { numberOptions, pickHandler } from '../widgets.js';
import { addSubQuestion } from '../questions.js';
import { tapToCount, countTogether, HINT_START_MS } from './counting.js';

const MAX = 10;
const TAKE_AT_MS = 1100; // 문제를 보여 준 뒤 새로 온 것이 나타나고, 가져간 것이 사라지기 시작하는 때
const nativeWord = (k) => NATIVE[k];

/**
 * @param item {kind,name} 세는 물건 그림
 * @param container {kind,name} 담는 곳 그림 (둥지, 바구니)
 * @param prompts { add, sub } 묻는 말 (처음 수, 바뀐 수) => 문장
 * @param hints { start, end } 힌트 문구. start: 문장, end: (정답) => 문장 (앱마다 다른 음성 문구)
 */
export function makeAddSubGame({ key, background, levels, item, container, prompts, hints }) {
  return {
    key,
    background,
    levels,

    ask(play, ctx, { range }) {
      const { run, bubble } = ctx;
      const q = addSubQuestion(range);
      const thing = (cls) => h('button', { class: `asitem ${cls}`.trim(), 'aria-label': '하나' }, art(item.kind, item.name));
      // 가져갈 것: 처음엔 그대로 보이다가 TAKE_AT_MS 뒤 흐린 자리로 바뀐다 (누를 수 없다)
      const ghost = () => h('span', { class: 'asitem', 'aria-hidden': 'true' }, art(item.kind, item.name));

      const first = Array.from({ length: q.op === 'add' ? q.start : q.answer }, () => thing(''));
      const added = q.op === 'add' ? Array.from({ length: q.change }, () => thing('new wait')) : [];
      const taken = q.op === 'sub' ? Array.from({ length: q.change }, ghost) : [];
      const solid = [...first, ...added];
      const counter = tapToCount(solid, ctx, { wordOf: nativeWord });

      const groups = [h('span', { class: 'asgroup' }, first)];
      if (added.length) groups.push(h('span', { class: 'asgroup' }, added));
      if (taken.length) groups.push(h('span', { class: 'asgroup' }, taken));

      const box = h('div', { class: `asbox ${q.op} in-${container.name}` }, art(container.kind, container.name, { class: 'ascont' }), h('div', { class: 'asitems' }, groups));
      play.replaceChildren(h('div', { class: 'asq' }, box, numberOptions(q.answer, 1, MAX, pickHandler(run, q.answer))));
      setTimeout(() => {
        if (run.state.stopped) return;
        added.forEach((t) => t.classList.replace('wait', 'appear'));
        taken.forEach((t) => t.classList.add('gone', 'taken'));
      }, TAKE_AT_MS);

      async function hint() {
        counter.reset();
        bubble(hints.start, true);
        await wait(HINT_START_MS);
        if (!(await countTogether(solid, ctx, { wordOf: nativeWord }))) return;
        counter.setAll();
        bubble(hints.end(q.answer), true);
      }

      return { n: q.answer, answer: q.answer, prompt: (q.op === 'add' ? prompts.add : prompts.sub)(q.start, q.change), hint };
    },
  };
}
