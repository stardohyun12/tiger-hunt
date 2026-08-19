// CODEMAP
// role : 사슴+기수의 이동/점프/수그리기/피격
// 핵심 : updatePlayer()
// 의존 : config
// 연관 : tiger(발톱 판정이 이 상태를 읽음), obstacle(충돌)
// 주의 : A/D가 곧 gap 조절이다. 속도 배율(조준·비틀거림)은 곱연산으로 누적된다.

import { CFG, FIXED_DT, INPUT_KEY } from './config.js';

export function playerHeight(S) {
  return S.player.crouch && S.player.grounded ? CFG.player.crouchH : CFG.player.h;
}

// 하이존(상단 후려치기)에 노출됐는가 — 수그리면 피한다
export function inHighZone(S) {
  return !(S.player.crouch && S.player.grounded);
}
// 로우존(하단 후려치기)에 노출됐는가 — 충분히 떠야 피한다
export function inLowZone(S) {
  return S.player.y < CFG.player.airClearY;
}

export function updatePlayer(S, input) {
  const p = S.player, K = CFG.player;

  p.crouch = !!(input.k & INPUT_KEY.S) && p.grounded;

  let base = K.speedBase;
  if (input.k & INPUT_KEY.D) base = K.speedFwd;
  else if (input.k & INPUT_KEY.A) base = K.speedBack;

  let mul = 1;
  if (S.aiming) mul *= K.aimMul;
  if (p.stumble > 0) mul *= K.stumbleMul;

  p.speed = base * mul;
  S.worldX += p.speed * FIXED_DT;

  if ((input.k & INPUT_KEY.W) && p.grounded && !p.crouch) {
    p.vy = K.jumpV; p.grounded = false;
  }
  if (!p.grounded) {
    p.vy -= K.gravity * FIXED_DT;
    p.y += p.vy * FIXED_DT;
    if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = true; }
  }

  if (p.stumble > 0) p.stumble -= FIXED_DT;
  if (p.invuln > 0) p.invuln -= FIXED_DT;
}
