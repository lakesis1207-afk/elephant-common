// 큰 수 읽는 말: 고유어로 세기(열하나, 스물셋)와 한자어로 숫자 읽기(십사, 삼십오).
// 1~10은 logic.js의 NATIVE·ADJ를 쓰고, 여기서는 그 위로 넓힌다.
import { NATIVE, ADJ, shuffle } from './logic.js';

const NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
const SINO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const MAX_NATIVE = 99;
const MAX_SINO = 100;

function checkRange(n, max) {
  if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`[numbers] 읽을 수 없는 수입니다: ${n}`);
}

/** 고유어로 세는 말: 1 → 하나, 11 → 열하나, 20 → 스물, 23 → 스물셋 */
export function nativeCount(n) {
  checkRange(n, MAX_NATIVE);
  return NATIVE_TENS[Math.floor(n / 10)] + NATIVE[n % 10];
}

/** 단위(개, 마리) 앞에 붙는 말: 3 → 세, 11 → 열한, 20 → 스무, 22 → 스물두 */
export function nativeAdj(n) {
  checkRange(n, MAX_NATIVE);
  if (n === 20) return '스무';
  return NATIVE_TENS[Math.floor(n / 10)] + ADJ[n % 10];
}

/** 한자어로 숫자 읽기: 14 → 십사, 35 → 삼십오, 100 → 백 */
export function sinoWord(n) {
  checkRange(n, MAX_SINO);
  if (n === MAX_SINO) return '백';
  const tens = Math.floor(n / 10);
  const ones = SINO_DIGITS[n % 10];
  if (tens === 0) return ones;
  return `${tens > 1 ? SINO_DIGITS[tens] : ''}십${ones}`;
}

/** 열 단위 보기 3개: 정답 + 10·20만큼 가까운 수 (10~100 안에서) */
export function tensChoices(answer, rnd = Math.random) {
  const near = [-20, -10, 10, 20].map((d) => answer + d).filter((v) => v >= 10 && v <= MAX_SINO);
  const closest = shuffle(near.filter((v) => Math.abs(v - answer) === 10), rnd);
  const farther = shuffle(near.filter((v) => Math.abs(v - answer) === 20), rnd);
  return shuffle([answer, ...[...closest, ...farther].slice(0, 2)], rnd);
}
