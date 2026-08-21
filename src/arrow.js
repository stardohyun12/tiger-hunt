// CODEMAP
// role : 활 차지-릴리스와 화살 물리/명중
// 핵심 : startCharge(), fireArrow(), updateArrows(), aimVector()
// 의존 : config, tiger(피해)
// 연관 : player(조준 중 감속은 player.js에서 처리)
// 주의 : 좌표계는 화면 y가 아래로 증가. 월드 x만 카메라로 환산한다.

import { CFG, FIXED_DT } from './config.js';
import { damageTiger } from './tiger.js';
import { breakTargetCombo, hitTarget } from './target.js';

export function bowScreen(S) {
  return {
    x: CFG.view.playerScreenX - 14,
    y: CFG.view.groundY - S.player.y - (S.player.crouch ? 34 : 62)
  };
}

export function startCharge(S) { S.aiming = true; S.charge = 0; }

export function aimVector(S, aimX, aimY) {
  const b = bowScreen(S);
  const dx = aimX - b.x, dy = aimY - b.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function fireArrow(S, input) {
  if (!S.aiming) return;
  const t = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const d = aimVector(S, input.ax, input.ay);
  const b = bowScreen(S);
  const p = CFG.aim.powerMin + (CFG.aim.powerMax - CFG.aim.powerMin) * t;
  S.arrows.push({
    x: S.worldX + (b.x - CFG.view.playerScreenX), y: b.y,
    vx: d.x * p, vy: d.y * p,
    charge: t, life: CFG.aim.life
  });
  S.aiming = false; S.charge = 0;
}

export function updateArrows(S) {
  const T = S.tiger;
  for (const a of S.arrows) {
    let hit = false;
    a.vy += CFG.aim.gravity * FIXED_DT;
    a.x += a.vx * FIXED_DT; a.y += a.vy * FIXED_DT;
    a.life -= FIXED_DT;

    for (const target of S.targets) {
      if (target.hit) continue;
      const inTargetX = a.x > target.x - CFG.target.w / 2 &&
        a.x < target.x + CFG.target.w / 2;
      const inTargetY = a.y > target.y - CFG.target.h / 2 &&
        a.y < target.y + CFG.target.h / 2;
      if (!inTargetX || !inTargetY) continue;
      a.life = 0;
      hit = hitTarget(S, target);
      break;
    }

    const inX = a.x > T.x - CFG.tiger.w / 2 && a.x < T.x + CFG.tiger.w / 2;
    const inY = a.y > CFG.view.groundY - CFG.tiger.h && a.y < CFG.view.groundY;
    if (!hit && T.state !== 'offstage' && inX && inY) {
      a.life = 0;
      hit = true;
      const k = a.charge;
      damageTiger(S,
        CFG.aim.dmgMin + (CFG.aim.dmgMax - CFG.aim.dmgMin) * k,
        CFG.aim.pushMin + (CFG.aim.pushMax - CFG.aim.pushMin) * k,
        k > CFG.aim.strongCharge);
    }
    if (a.y > CFG.view.groundY) a.life = 0;
    if (a.life <= 0 && !hit) breakTargetCombo(S);
  }
  S.arrows = S.arrows.filter(a => a.life > 0);
}
