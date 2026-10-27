// 적응형 난이도: 한 번에 3번 연속 맞히면 한 단계 위로, 힌트를 받으면(2번 틀림) 한 단계 아래로.
// 결과 종류: 'first'(한 번에 맞힘) | 'retry'(한 번 틀리고 맞힘) | 'hinted'(힌트 후 맞힘)

const STREAK_TO_LEVEL_UP = 3;

export const startDifficulty = () => Object.freeze({ level: 0, streak: 0 });

export function nextDifficulty(state, result, levelCount) {
  const top = levelCount - 1;
  if (result === 'first') {
    const streak = state.streak + 1;
    if (streak >= STREAK_TO_LEVEL_UP) return Object.freeze({ level: Math.min(state.level + 1, top), streak: 0 });
    return Object.freeze({ level: state.level, streak });
  }
  if (result === 'retry') return Object.freeze({ level: state.level, streak: 0 });
  if (result === 'hinted') return Object.freeze({ level: Math.max(state.level - 1, 0), streak: 0 });
  throw new Error(`[difficulty] 모르는 결과입니다: ${result}`);
}

/** 지금 단계의 수 범위 [작은 수, 큰 수] */
export const rangeOf = (state, levels) => levels[Math.min(state.level, levels.length - 1)];
