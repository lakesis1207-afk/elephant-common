// 화면과 상관없는 계산 도우미: 수 읽는 말, 칭찬, 문제 수 고르기, 보기 만들기

export const NATIVE = Object.freeze(['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열']);
/** 단위 앞에 붙는 말: "세 마리", "네 개" */
export const ADJ = Object.freeze(['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열']);

// 결과("똑똑해")보다 과정("끝까지 세었네")을 칭찬한다
export const PRAISE = Object.freeze([
  '하나씩 끝까지 세었네!',
  '잘 보고 골랐구나!',
  '딩동댕! 천천히 잘 했어!',
  '우와, 맞았어!',
  '끝까지 잘 했어!',
  '꼼꼼하게 세었구나!',
]);

/** 주사위 무늬 자리 (3×3 칸 번호 0~8) */
export const DICE = Object.freeze({
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
});

const MAX_NEAR = 2; // 보기는 정답에서 2 이내
const MAX_RETRY = 10;

export const randInt = (lo, hi, rnd = Math.random) => lo + Math.floor(rnd() * (hi - lo + 1));

/** 섞은 새 배열 (원래 배열은 그대로) */
export function shuffle(arr, rnd = Math.random) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i, rnd);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const pickOne = (arr, rnd = Math.random) => arr[randInt(0, arr.length - 1, rnd)];

/** lo~hi 중 하나. 바로 앞 문제(last)와 같은 수는 되도록 피한다. */
export function pickNumber(lo, hi, last, rnd = Math.random) {
  let n = randInt(lo, hi, rnd);
  for (let tries = 0; n === last && hi > lo && tries < MAX_RETRY; tries++) n = randInt(lo, hi, rnd);
  return n;
}

/** 정답 + 가까운 수(±2 이내) 2개를 섞은 보기 (범위가 좁으면 있는 만큼) */
export function nearChoices(answer, min, max, count = 3, rnd = Math.random) {
  const near = [];
  for (let d = -MAX_NEAR; d <= MAX_NEAR; d++) {
    const v = answer + d;
    if (d !== 0 && v >= min && v <= max) near.push(v);
  }
  return shuffle([answer, ...shuffle(near, rnd).slice(0, count - 1)], rnd);
}

/** 10칸 텐프레임: 앞에서부터 n칸 채움 */
export const tenFrame = (n) => Array.from({ length: 10 }, (_, i) => i < n);

/** 기다리기 (힌트 연출용) */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
