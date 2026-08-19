// CODEMAP
// role : 결정론적 난수 생성
// 핵심 : rngFromSeed(), rngNext(), rngRange(), rngUnit()
// 의존 : 없음
// 연관 : state가 상태를 소유하고 obstacle과 테스트가 순수 함수로 전진시킨다
// 주의 : xorshift32 정수 연산만 사용한다. 반환된 state를 반드시 S.rng에 되넣을 것.

export function rngFromSeed(seed) {
  const state = seed >>> 0;
  return state || 0x6d2b79f5;
}

export function rngNext(s) {
  let state = s >>> 0;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  state >>>= 0;
  return { state, value: state };
}

export function rngRange(s, lo, hiExclusive) {
  const next = rngNext(s);
  const span = hiExclusive - lo;
  return { state: next.state, value: lo + next.value % span };
}

export function rngUnit(s) {
  const next = rngNext(s);
  return { state: next.state, value: next.value / 0x100000000 };
}
