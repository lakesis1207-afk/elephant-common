// 새 마을 게임들의 문제 만들기 (화면과 상관없는 계산). 모두 새 값을 돌려주고 받은 값은 바꾸지 않는다.
import { randInt, shuffle } from './logic.js';

const MAX_TRIES = 50;
const MAX_ADD_SUB = 10;
const STEP_COUNT = 5;
const OPTION_COUNT = 3;

/** 정답 + 범위 안의 다른 수들 (모두 다름, 섞음) */
export function pickDistinct(answer, lo, hi, count, rnd = Math.random) {
  const others = [];
  for (let v = lo; v <= hi; v += 1) if (v !== answer) others.push(v);
  return shuffle([answer, ...shuffle(others, rnd).slice(0, count - 1)], rnd);
}

/** 많다/적다를 비교할 두 수 (서로 다름, minDiff 이상 차이) */
export function comparePair([lo, hi], minDiff = 1, rnd = Math.random) {
  const diff = Math.min(minDiff, hi - lo);
  for (let i = 0; i < MAX_TRIES; i += 1) {
    const a = randInt(lo, hi, rnd);
    const b = randInt(lo, hi, rnd);
    if (a !== b && Math.abs(a - b) >= diff) return [a, b];
  }
  return rnd() < 0.5 ? [lo, hi] : [hi, lo];
}

/** 무늬 규칙 (쉬운 것부터). 글자 하나가 친구 하나 */
export const PATTERN_TYPES = Object.freeze(['AB', 'AAB', 'ABB', 'ABC']);

/**
 * 무늬 잇기: 규칙을 두 번 넘게 보여 주고, 다음 자리를 묻는다.
 * @param type PATTERN_TYPES의 번호
 * @param items 쓸 수 있는 친구들 (4개 이상)
 * @returns {{ sequence: string[], answer: string, options: string[] }}
 */
export function patternQuestion(type, items, rnd = Math.random) {
  const rule = PATTERN_TYPES[type];
  const letters = [...new Set(rule)];
  const picked = shuffle(items, rnd);
  const itemOf = Object.fromEntries(letters.map((l, i) => [l, picked[i]]));
  const length = rule.length * 2 + randInt(0, rule.length - 1, rnd);
  const sequence = Array.from({ length }, (_, i) => itemOf[rule[i % rule.length]]);
  const used = letters.map((l) => itemOf[l]);
  const extra = picked.filter((it) => !used.includes(it));
  return { sequence, answer: itemOf[rule[length % rule.length]], options: shuffle([...used, ...extra].slice(0, OPTION_COUNT), rnd) };
}

/**
 * 1씩 커지는 수 5개 중 하나가 빈칸.
 * @param range [작은 수, 큰 수, 'end'(늘 마지막이 빈칸) | 'any']
 */
export function stepsQuestion([lo, hi, mode], rnd = Math.random) {
  const start = randInt(lo, hi - (STEP_COUNT - 1), rnd);
  const numbers = Array.from({ length: STEP_COUNT }, (_, i) => start + i);
  const blank = mode === 'end' ? STEP_COUNT - 1 : randInt(1, STEP_COUNT - 1, rnd);
  return { numbers, blank, answer: numbers[blank] };
}

/** 10 이하 더하기·빼기: 답(answer)이 범위 안. start에서 change만큼 더하거나(add) 뺀다(sub). */
export function addSubQuestion([lo, hi], rnd = Math.random) {
  const answer = randInt(lo, hi, rnd);
  const canAdd = answer >= 2;
  const canSub = answer < MAX_ADD_SUB;
  const op = canAdd && (!canSub || rnd() < 0.5) ? 'add' : 'sub';
  if (op === 'add') {
    const change = randInt(1, answer - 1, rnd);
    return { op, start: answer - change, change, answer };
  }
  const change = randInt(1, MAX_ADD_SUB - answer, rnd);
  return { op, start: answer + change, change, answer };
}

/** 10개씩 묶음과 낱개: 23 → { bundles: 2, ones: 3 } */
export const splitTens = (n) => ({ bundles: Math.floor(n / 10), ones: n % 10 });
