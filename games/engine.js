// 게임 흐름: 세 게임이 함께 쓴다. 화면(DOM)은 모르고, 문제 진행·정답/오답·힌트·난이도만 맡는다.
// 화면 쪽은 ask()로 문제를 만들고, 아이가 답하면 answer(맞았는지)를 부른다.
import { GENERAL_PRAISE, pickOne } from './logic.js';
import { startDifficulty, nextDifficulty, rangeOf } from './difficulty.js';

export const QUESTIONS_PER_GAME = 5;
export const NEXT_DELAY_MS = 1600;
/** 칭찬이 길어도 이만큼 지나면 다음으로 (말 끝 알림이 오지 않는 브라우저 대비) */
export const PRAISE_MAX_MS = 4000;
export const IDLE_REMIND_MS = 8000;
/** 첫 오답 뒤 잠깐 누르기를 막는 시간 (연타가 바로 두 번째 오답이 되지 않게) */
export const RETRY_LOCK_MS = 700;
export const RETRY_TEXT = '다시 해 볼까?';
export const IDLE_TEXT = '스피커를 누르면 다시 들을 수 있어!';

/**
 * @param levels 난이도 단계별 수 범위 [[1,3],[2,5],...]
 * @param fx { say, bubble(text, speak), cheer, sfx: { yes, boing } }
 * @param ask ({ index, range, last }) => { n, prompt?, hint: async () => void }
 * @param shouldPause () => boolean  놀이 시간이 다 됐는지. 맞힌 뒤 다음 문제로 가기 전에 확인한다.
 * @param onPause 멈췄을 때 (잠금 화면으로)
 * @param praise 맞혔을 때 고를 칭찬 목록 (세기·고르기·그리기 중 게임에 맞는 것). 주지 않으면 어디에나 맞는 GENERAL_PRAISE
 * @param retryText 첫 오답 때 말풍선 문구 (다른 언어 앱용). 주지 않으면 RETRY_TEXT
 * @param idleText 가만히 있을 때 알림 문구. 주지 않으면 IDLE_TEXT
 */
export function createGameRun({
  levels, fx, ask, onProgress = () => {}, onFinish = () => {}, shouldPause = () => false, onPause = () => {},
  total = QUESTIONS_PER_GAME, praise = GENERAL_PRAISE, retryText = RETRY_TEXT, idleText = IDLE_TEXT,
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
      fx.bubble(idleText, true);
    }, IDLE_REMIND_MS);
  }

  function setPrompt(text, speak = true) {
    prompt = text;
    return fx.bubble(text, speak);
  }

  /** 문제 읽기가 끝난 뒤부터 8초를 잰다 (긴 이야기 문제를 알림이 끊지 않게) */
  function armIdleAfter(spoken) {
    clearTimeout(idleTimer);
    if (typeof spoken?.then !== 'function') return armIdle();
    const asked = question;
    const rearm = () => {
      if (question === asked) armIdle();
    };
    spoken.then(rearm, rearm);
  }

  function nextQuestion() {
    if (stopped) return;
    attempts = 0;
    hinted = false;
    busy = false;
    reminded = false;
    const last = question?.n ?? 0;
    question = ask({ index, range: rangeOf(difficulty, levels), last });
    armIdleAfter(question.prompt ? setPrompt(question.prompt) : undefined);
  }

  function goNext() {
    if (stopped) return;
    if (index >= total) {
      stopped = true;
      onFinish(); // 마지막 문제면 보상부터 (잠금은 보상 화면 뒤)
    } else if (shouldPause()) {
      stopped = true;
      onPause();
    } else nextQuestion();
  }

  /**
   * 칭찬이 끝난 뒤 다음으로 (다음 문제 안내나 잠금 화면이 칭찬을 끊지 않게).
   * 적어도 NEXT_DELAY_MS는 기다리고, 말이 길어도 PRAISE_MAX_MS가 지나면 넘어간다.
   * fx.say가 끝을 알려 주지 않으면(Promise가 아니면) NEXT_DELAY_MS 뒤에 넘어간다.
   */
  function afterPraise(spoken) {
    let praiseDone = typeof spoken?.then !== 'function';
    let waiting = false;
    let moved = false;
    const move = () => {
      if (moved) return;
      moved = true;
      clearTimeout(nextTimer);
      goNext();
    };
    if (!praiseDone) {
      spoken.then(() => {
        praiseDone = true;
        if (waiting) move();
      }, () => {
        praiseDone = true;
        if (waiting) move();
      });
    }
    nextTimer = setTimeout(() => {
      if (praiseDone) return move();
      waiting = true;
      nextTimer = setTimeout(move, PRAISE_MAX_MS - NEXT_DELAY_MS);
    }, NEXT_DELAY_MS);
  }

  function onRight() {
    busy = true;
    clearTimeout(idleTimer);
    fx.sfx.yes();
    const spoken = fx.say(pickOne(praise));
    fx.cheer();
    const result = hinted ? 'hinted' : attempts === 0 ? 'first' : 'retry';
    difficulty = nextDifficulty(difficulty, result, levels.length);
    index += 1;
    onProgress(index, total);
    afterPraise(spoken);
    return 'right';
  }

  async function onWrong() {
    attempts += 1;
    fx.sfx.boing();
    if (attempts === 1) {
      fx.bubble(retryText, true);
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
