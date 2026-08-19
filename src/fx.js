// CODEMAP
// role : 타격감 레이어 (hitstop / 화면 흔들림 / 진동)
// 핵심 : triggerFx(), decayFx(), shakeOf()
// 의존 : config
// 연관 : tiger(피격/처치), player(비틀거림/발톱)
// 주의 : hitstop은 월드 갱신만 멈추고 렌더는 계속 돈다. main 루프의 분기와 짝을 이룬다.

import { CFG } from './config.js';

export function triggerFx(S, tier) {
  const [hs, tr, vib] = tier;
  S.hitstop = Math.max(S.hitstop, hs);
  S.trauma = Math.min(1, S.trauma + tr);
  if (vib > 0 && navigator.vibrate) navigator.vibrate(vib);
}

export function decayFx(S, dt) {
  S.trauma = Math.max(0, S.trauma - CFG.fx.traumaDecay * dt);
}

export function shakeOf(S) {
  const m = S.trauma * S.trauma * CFG.fx.shakeMax;
  return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m };
}
