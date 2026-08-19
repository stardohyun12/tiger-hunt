// CODEMAP
// role : 입력 델타 기록·직렬화·재생과 결정론 상태 해시
// 핵심 : record(), serialize(), deserialize(), playback(), hashState()
// 의존 : state, sim
// 연관 : 브라우저 main과 서버 검증기가 같은 입력 스트림을 재생한다
// 주의 : 브라우저 API 없이 동작해야 하며 직렬화 payload에는 정수만 둔다.

import { createState } from './state.js';
import { updateSimulation } from './sim.js';

export function record(S, input) {
  const replay = S.replay;
  const previous = replay.inputs[replay.inputs.length - 1];
  if (!previous || previous[1] !== input.k || previous[2] !== input.ax ||
      previous[3] !== input.ay || previous[4] !== input.c) {
    replay.inputs.push([input.f, input.k, input.ax, input.ay, input.c]);
  }
  replay.frames = input.f + 1;
  return replay;
}

export function serialize(replay) {
  return JSON.stringify([replay.seed >>> 0, replay.frames, replay.inputs]);
}

export function deserialize(str) {
  const data = JSON.parse(str);
  return { seed: data[0] >>> 0, frames: data[1], inputs: data[2] };
}

export function playback(replay) {
  const S = createState(replay.seed);
  S.phase = 'play';
  let markerIndex = 0;
  let k = 0, ax = S.aimX, ay = S.aimY, c = 0;

  for (let f = 0; f < replay.frames && S.phase === 'play'; f++) {
    const marker = replay.inputs[markerIndex];
    if (marker && marker[0] === f) {
      [, k, ax, ay, c] = marker;
      markerIndex++;
    }
    updateSimulation(S, { f, k, ax, ay, c });
  }
  return S;
}

export function hashState(S) {
  // presentation/기기 전용 값, 한 프레임짜리 events, 기록 metadata는 gameplay 해시에서 제외한다.
  const json = JSON.stringify(S, (key, value) =>
    key === 'trauma' || key === 'events' || key === 'replay' ||
    key === 'bestScore' || key === 'isNewBest' ? undefined : value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}
