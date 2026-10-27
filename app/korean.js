// 한국어 조사 도우미

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const FINALS_PER_SYLLABLE = 28;

function hasFinalConsonant(word) {
  const text = word.trim();
  const code = text.charCodeAt(text.length - 1);
  if (code < HANGUL_START || code > HANGUL_END) return false;
  return (code - HANGUL_START) % FINALS_PER_SYLLABLE !== 0;
}

/** 받침에 맞춰 "은/는"을 붙인다. 예: 숲속 마을은, 공룡 나라는 */
export const withTopic = (word) => word + (hasFinalConsonant(word) ? '은' : '는');

/** 받침에 맞춰 "이/가"를 붙인다. 예: 숲속 마을이, 공룡 나라가 */
export const withSubject = (word) => word + (hasFinalConsonant(word) ? '이' : '가');

/** 받침에 맞춰 "을/를"을 붙인다. 예: 숲속 마을을, 삼십오를 */
export const withObject = (word) => word + (hasFinalConsonant(word) ? '을' : '를');
