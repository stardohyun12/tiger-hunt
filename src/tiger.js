// CODEMAP
// role : 호랑이 상태머신 — 추격 / 추월 / 앞을 막고 뒤돈 뒤 앞발 후려치기
// 핵심 : updateTiger(), damageTiger()
// 의존 : config, state(gapOf), player(존 판정)
// 연관 : arrow(피해 적용), render(텔레그래프 표시)
// 주의 : windup 진입 시점의 플레이어 자세를 '거울처럼' 노린다.
//        서 있으면 상단, 수그려 있으면 하단 → 0.5초 안에 자세를 바꿔야 피한다.
//        overtake와 recover 구간에 피해 배율이 붙는다. 붙는 이유가 여기 있다.

import { CFG, FIXED_DT } from './config.js';
import { gapOf, newTiger } from './state.js';
import { inHighZone, inLowZone } from './player.js';

export function tigerVulnerable(S) {
  return S.tiger.state === 'overtake' || S.tiger.state === 'recover';
}

export function damageTiger(S, dmg, push, strong) {
  const T = S.tiger;
  const dmgMul = T.state === 'recover' ? CFG.tiger.recoverDmgMul :
    T.state === 'overtake' ? CFG.tiger.overtakeDmgMul : 1;
  T.hp -= dmg * dmgMul;
  S.score += strong ? CFG.score.strongHit : CFG.score.hit;
  S.flash.tigerUntil = S.frame + 2;
  T.x += gapOf(S) < 0 ? push : -push;
  S.events.push({ kind: strong ? 'hitStrong' : 'hitWeak' });

  if (T.hp <= 0) {
    S.events.push({ kind: 'kill' });
    S.score += CFG.score.kill;
    S.kills++; S.wave++;
    S.tiger = newTiger(S.wave);
    S.tiger.x = S.worldX - CFG.tiger.gapStart;
  }
}

function clawHit(S) {
  const p = S.player;
  if (p.invuln > 0) return;
  p.hp--; p.invuln = CFG.player.invuln;
  S.flash.playerUntil = S.frame + 2;
  S.worldX -= CFG.tiger.clawKnockback;
  S.events.push({ kind: 'claw' });
  if (p.hp <= 0) S.phase = 'over';
}

function startWindup(S) {
  const T = S.tiger;
  T.state = 'windup'; T.timer = CFG.tiger.windup; T.swung = false;
  T.zone = inHighZone(S) ? 'high' : 'low';   // 진입 시점의 지금 자세를 노린다
}

function blockPlayerBody(S) {
  const T = S.tiger;
  if (T.state === 'chase' || T.state === 'overtake') return;
  const gap = gapOf(S);
  if (gap >= 0 || Math.abs(gap) >= CFG.tiger.bodyGap) return;
  S.worldX = T.x - CFG.tiger.bodyGap;
  S.player.stumble = CFG.player.stumbleTime;
  S.events.push({ kind: 'stumble' });
}

export function updateTiger(S) {
  const T = S.tiger, K = CFG.tiger;

  if (T.state === 'chase') {
    const chaseSpeed = gapOf(S) < 0 ? K.blockSpeed * K.aheadChaseMul : T.chaseSpeed;
    T.x += chaseSpeed * FIXED_DT;
    const gap = gapOf(S);
    if (gap >= 0 && gap <= K.engageGap) {
      T.state = 'overtake';
    }
  } else if (T.state === 'overtake') {
    T.x += K.overtakeSpeed * FIXED_DT;
    if (gapOf(S) <= -K.blockGap) {
      T.state = 'brace'; T.timer = K.turnTime;
    }
  } else if (T.state === 'brace') {
    const turn = Math.max(0, T.timer / K.turnTime);
    T.x += (K.blockSpeed + (K.overtakeSpeed - K.blockSpeed) * turn) * FIXED_DT;
    T.timer -= FIXED_DT;
    if (T.timer <= 0) startWindup(S);
  } else {
    // windup 동안에는 현재 gap 방향으로 다가가되, A의 후퇴 속도보다 느리게 접근한다.
    const approach = T.state === 'windup' ? Math.sign(gapOf(S)) * K.approachSpeed : 0;
    T.x += (K.blockSpeed + approach) * FIXED_DT;
    T.timer -= FIXED_DT;

    if (T.state === 'windup' && T.timer <= 0) {
      T.state = 'swing'; T.timer = K.swing; T.swung = false;
    } else if (T.state === 'swing') {
      if (!T.swung) {
        T.swung = true;
        const reached = Math.abs(gapOf(S)) <= K.reach;
        const exposed = T.zone === 'high' ? inHighZone(S) : inLowZone(S);
        if (reached && exposed) clawHit(S);
      }
      if (T.timer <= 0) { T.state = 'recover'; T.timer = K.recover; }
    } else if (T.state === 'recover' && T.timer <= 0) {
      T.state = 'cooldown'; T.timer = K.cooldown;
    } else if (T.state === 'cooldown' && T.timer <= 0) {
      if (Math.abs(gapOf(S)) > K.disengageGap) {
        T.state = 'chase';
      } else {
        startWindup(S);
      }
    }
  }

  blockPlayerBody(S);
  T.x = Math.max(T.x, S.worldX - K.gapMax);
  T.x = Math.min(T.x, S.worldX + K.gapMax);   // 앞쪽도 대칭 클램프 — 후퇴 홀드 시 이탈 방지
}
