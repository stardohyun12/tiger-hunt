// CODEMAP
// role : 진입점 — 루프와 모듈 배선
// 핵심 : frame(), 리셋/시작 처리
// 의존 : 전 모듈
// 연관 : index.html이 이 파일 하나만 로드한다
// 주의 : hitstop 동안 update를 건너뛰되 render는 계속 돈다. 순서를 바꾸지 말 것.

import { CFG } from './config.js';
import { createState } from './state.js';
import { initViewport } from './viewport.js';
import { bindInput } from './input.js';
import { updatePlayer } from './player.js';
import { updateTiger } from './tiger.js';
import { updateArrows, startCharge, fireArrow } from './arrow.js';
import { updateObstacles } from './obstacle.js';
import { decayFx } from './fx.js';
import { render } from './render.js';

const canvas = document.getElementById('cv');
const ctx = initViewport(canvas);

let S = createState();

function restartIfNeeded() {
  if (S.phase === 'play') return false;
  S = createState();
  S.phase = 'play';
  return true;
}

// 재시작은 스페이스/엔터/좌클릭으로만. 이동키로 실수 리셋되는 걸 막는다.
bindInput(canvas, {
  onAnyKey: (e) => (e.code === 'Space' || e.code === 'Enter') && restartIfNeeded(),
  onPrimaryDown: () => { if (restartIfNeeded()) return true; startCharge(S); },
  onPrimaryUp: () => fireArrow(S)
});

function update(dt) {
  S.t += dt;
  if (S.aiming) S.charge = Math.min(S.charge + dt, CFG.aim.chargeTime);
  updatePlayer(S, dt);
  updateObstacles(S);
  updateTiger(S, dt);
  updateArrows(S, dt);
  decayFx(S, dt);
  if (S.phase === 'over') { S.aiming = false; S.charge = 0; }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (S.phase === 'play') {
    if (S.hitstop > 0) { S.hitstop -= dt; decayFx(S, dt * 0.4); }
    else update(dt);
  }
  render(ctx, S);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
