// CODEMAP
// role : 호랑이 상태머신 — 추격 / 정지 후 앞발 후려치기
// 핵심 : updateTiger(), damageTiger()
// 의존 : config, state(gapOf), player(존 판정), fx
// 연관 : arrow(피해 적용), render(텔레그래프 표시)
// 주의 : windup 진입 시점의 플레이어 자세를 '거울처럼' 노린다.
//        서 있으면 상단, 수그려 있으면 하단 → 0.5초 안에 자세를 바꿔야 피한다.
//        recover 구간에만 피해 배율이 붙는다. 붙는 이유가 여기 있다.

import { CFG } from './config.js';
import { gapOf, newTiger } from './state.js';
import { inHighZone, inLowZone } from './player.js';
import { triggerFx } from './fx.js';

export function tigerVulnerable(S) {
  return S.tiger.state === 'recover';
}

export function damageTiger(S, dmg, push, strong) {
  const T = S.tiger;
  T.hp -= dmg * (tigerVulnerable(S) ? CFG.tiger.recoverDmgMul : 1);
  T.x -= push;
  triggerFx(S, strong ? CFG.fx.hitStrong : CFG.fx.hitWeak);

  if (T.hp <= 0) {
    triggerFx(S, CFG.fx.kill);
    S.kills++; S.wave++;
    S.tiger = newTiger(S.wave);
    S.tiger.x = S.worldX - CFG.tiger.gapStart;
  }
}

function clawHit(S) {
  const p = S.player;
  if (p.invuln > 0) return;
  p.hp--; p.invuln = CFG.player.invuln;
  S.tiger.x = S.worldX - CFG.tiger.clawKnockback;
  triggerFx(S, CFG.fx.claw);
  if (p.hp <= 0) S.phase = 'over';
}

export function updateTiger(S, dt) {
  const T = S.tiger, K = CFG.tiger;
  const gap = gapOf(S);

  if (T.state === 'chase') {
    T.x += T.chaseSpeed * dt;
    if (gap <= K.engageGap) {
      T.state = 'windup'; T.timer = K.windup; T.swung = false;
      T.zone = inHighZone(S) ? 'high' : 'low';   // 지금 자세를 노린다
    }
  } else {
    // 교전 중에는 더 이상 좁혀오지 않는다. 거리는 플레이어가 A/D로 만든다.
    T.x += CFG.player.speedBase * dt;
    T.timer -= dt;

    if (T.state === 'windup' && T.timer <= 0) {
      T.state = 'swing'; T.timer = K.swing; T.swung = false;
    } else if (T.state === 'swing') {
      if (!T.swung) {
        T.swung = true;
        const reached = gapOf(S) <= K.reach;
        const exposed = T.zone === 'high' ? inHighZone(S) : inLowZone(S);
        if (reached && exposed) clawHit(S);
      }
      if (T.timer <= 0) { T.state = 'recover'; T.timer = K.recover; }
    } else if (T.state === 'recover' && T.timer <= 0) {
      T.state = 'cooldown'; T.timer = K.cooldown;
    } else if (T.state === 'cooldown' && T.timer <= 0) {
      if (gapOf(S) > K.disengageGap) {
        T.state = 'chase';
      } else {
        T.state = 'windup'; T.timer = K.windup; T.swung = false;
        T.zone = inHighZone(S) ? 'high' : 'low';
      }
    }

    if (gapOf(S) > K.disengageGap && T.state !== 'swing') T.state = 'chase';
  }

  T.x = Math.max(T.x, S.worldX - K.gapMax);
}
