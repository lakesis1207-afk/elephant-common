// 게임 흐름: 세 게임이 함께 쓴다. 화면(DOM)은 모르고, 문제 진행·정답/오답·힌트·난이도만 맡는다.
// 화면 쪽은 ask()로 문제를 만들고, 아이가 답하면 answer(맞았는지)를 부른다.
import { PRAISE, pickOne } from './logic.js';
import { startDifficulty, nextDifficulty, rangeOf } from './difficulty.js';

export const QUESTIONS_PER_GAME = 5;
export const NEXT_DELAY_MS = 1600;
export const IDLE_REMIND_MS = 8000;
/** 첫 오답 뒤 잠깐 누르기를 막는 시간 (연타가 바로 두 번째 오답이 되지 않게) */
export const RETRY_LOCK_MS = 700;
export const RETRY_TEXT = '다시 세어 볼까?';
export const IDLE_TEXT = '스피커를 누르면 다시 들을 수 있어!';

/**
 * @param levels 난이도 단계별 수 범위 [[1,3],[2,5],...]
 * @param fx { say, bubble(text, speak), cheer, sfx: { yes, boing } }
 * @param ask ({ index, range, last }) => { n, prompt?, hint: async () => void }
 * @param shouldPause () => boolean  놀이 시간이 다 됐는지. 맞힌 뒤 다음 문제로 가기 전에 확인한다.
 * @param onPause 멈췄을 때 (잠금 화면으로)
 */
export function createGameRun({
  levels, fx, ask, onProgress = () => {}, onFinish = () => {}, shouldPause = () => false, onPause = () => {},
  total = QUESTIONS_PER_GAME,
}) {
  let index = 0;
  let difficulty = startDifficulty();
  let question = null;
  let prompt = '';
  let attempts = 0;
  let hinted = false;
  let busy = false;
  let stopped = false;
  let reminded = false;
  let retryLock = false;
  let idleTimer = null;
  let nextTimer = null;
  let lockTimer = null;

  function armIdle() {
    clearTimeout(idleTimer);
    if (reminded || stopped) return;
    idleTimer = setTimeout(() => {
      if (busy || stopped) return; // 힌트 중에는 끼어들지 않는다 (힌트가 끝나면 다시 잰다)
      reminded = true;
      fx.bubble(IDLE_TEXT, true);
    }, IDLE_REMIND_MS);
  }

  function setPrompt(text, speak = true) {
    prompt = text;
    fx.bubble(text, speak);
  }

  function nextQuestion() {
    if (stopped) return;
    attempts = 0;
    hinted = false;
    busy = false;
    reminded = false;
    const last = question?.n ?? 0;
    question = ask({ index, range: rangeOf(difficulty, levels), last });
    if (question.prompt) setPrompt(question.prompt);
    armIdle();
  }

  function onRight() {
    busy = true;
    clearTimeout(idleTimer);
    fx.sfx.yes();
    fx.say(pickOne(PRAISE));
    fx.cheer();
    const result = hinted ? 'hinted' : attempts === 0 ? 'first' : 'retry';
    difficulty = nextDifficulty(difficulty, result, levels.length);
    index += 1;
    onProgress(index, total);
    nextTimer = setTimeout(() => {
      if (stopped) return;
      if (index >= total) {
        stopped = true;
        onFinish(); // 마지막 문제면 보상부터 (잠금은 보상 화면 뒤)
      } else if (shouldPause()) {
        stopped = true;
        onPause();
      } else nextQuestion();
    }, NEXT_DELAY_MS);
    return 'right';
  }

  async function onWrong() {
    attempts += 1;
    fx.sfx.boing();
    if (attempts === 1) {
      fx.bubble(RETRY_TEXT, true);
      retryLock = true;
      lockTimer = setTimeout(() => (retryLock = false), RETRY_LOCK_MS);
      armIdle();
      return 'retry';
    }
    busy = true;
    clearTimeout(idleTimer);
    hinted = true;
    try {
      await question.hint();
    } catch (error) {
      console.warn('[engine] 힌트를 보여 주지 못했습니다.', error);
    } finally {
      if (!stopped) {
        busy = false;
        armIdle();
      }
    }
    return 'hint';
  }

  return {
    start: nextQuestion,
    /** 아이가 답을 골랐을 때. 'right' | 'retry' | 'hint' | 'ignored' */
    async answer(isRight) {
      if (busy || retryLock || stopped || !question) return 'ignored';
      return isRight ? onRight() : onWrong();
    },
    /** 아이가 무엇이든 눌렀을 때 (8초 알림을 다시 잰다) */
    poke: armIdle,
    replay: () => prompt && fx.say(prompt),
    setPrompt,
    stop() {
      stopped = true;
      busy = true;
      clearTimeout(idleTimer);
      clearTimeout(nextTimer);
      clearTimeout(lockTimer);
    },
    get state() {
      return Object.freeze({ index, total, busy: busy || retryLock, attempts, level: difficulty.level, stopped });
    },
  };
}
