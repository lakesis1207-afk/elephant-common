// 많다/적다 비교 게임 틀 (숲속 "어느 쪽이 많아?", 농장 "누가 더 많아?").
// 두 줄에 물건이 있고, 더 많은(4번째 문제부터는 더 적은) 줄을 누른다.
// 힌트: 위아래를 하나씩 짝 지어 보여 주고, 짝 없이 남은 쪽을 반짝인다.
import { h, art } from '../../widgets/dom.js';
import { wait } from '../logic.js';
import { pickHandler } from '../widgets.js';
import { comparePair } from '../questions.js';

const FEWER_FROM = 3; // 이 번호(0부터)의 문제부터 "더 적은 쪽"을 묻는다
const PAIR_START_MS = 1200;
const PAIR_STEP_MS = 450;

/**
 * @param rows 두 줄: [{ label, icon?: {kind,name}, item: {kind,name} }]
 * @param prompts { more, fewer } 묻는 말
 * @param hints { pair, more, fewer } 힌트 문구 (앱마다 다른 음성 문구)
 * @param levels [[작은 수, 큰 수, 최소 차이], ...]
 */
export function makeCompareGame({ key, background, levels, rows, prompts, hints }) {
  return {
    key,
    background,
    levels,

    ask(play, { run, bubble }, { index, range }) {
      const counts = comparePair(range, range[2] ?? 1);
      const fewer = index >= FEWER_FROM;
      const answer = counts[0] > counts[1] !== fewer ? 0 : 1;
      const onPick = pickHandler(run, answer);

      const lines = rows.map((row, r) => {
        const items = Array.from({ length: counts[r] }, () => h('span', { class: 'citem' }, art(row.item.kind, row.item.name)));
        const btn = h(
          'button',
          { class: 'crow press pick', 'data-value': r, 'data-count': counts[r], 'aria-label': row.label },
          row.icon ? art(row.icon.kind, row.icon.name, { class: 'cicon' }) : null,
          h('span', { class: 'citems' }, items),
        );
        btn.addEventListener('click', () => onPick(r, btn));
        return { btn, items };
      });
      play.replaceChildren(h('div', { class: 'compareq' }, lines.map((l) => l.btn)));

      async function hint() {
        bubble(hints.pair, true);
        await wait(PAIR_START_MS);
        const pairs = Math.min(...counts);
        for (let i = 0; i < pairs; i += 1) {
          if (run.state.stopped) return;
          lines.forEach((l) => l.items[i].classList.add('pair'));
          await wait(PAIR_STEP_MS);
        }
        if (run.state.stopped) return; // 힌트 중에 화면을 떠났으면 말하지 않는다
        lines.forEach((l) => l.items.slice(pairs).forEach((it) => it.classList.add('extra')));
        bubble(fewer ? hints.fewer : hints.more, true);
      }

      return { n: counts[0] * 100 + counts[1], answer, prompt: fewer ? prompts.fewer : prompts.more, hint };
    },
  };
}
