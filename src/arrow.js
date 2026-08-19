// CODEMAP
// role : 활 차지-릴리스와 화살 물리/명중
// 핵심 : startCharge(), fireArrow(), updateArrows(), aimPreview()
// 의존 : config, input(마우스), viewport, tiger(피해)
// 연관 : player(조준 중 감속은 player.js에서 처리)
// 주의 : 좌표계는 화면 y가 아래로 증가. 월드 x만 카메라로 환산한다.

import { CFG, C } from './config.js';
import { mouse } from './input.js';
import { damageTiger } from './tiger.js';

export function bowScreen(S) {
  return {
    x: CFG.view.playerScreenX - 14,
    y: CFG.view.groundY - S.player.y - (S.player.crouch ? 34 : 62)
  };
}

export function startCharge(S) { S.aiming = true; S.charge = 0; }

export function aimVector(S) {
  const b = bowScreen(S);
  let dx = mouse.x - b.x, dy = mouse.y - b.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function fireArrow(S) {
  if (!S.aiming) return;
  const t = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const d = aimVector(S);
  const b = bowScreen(S);
  const p = CFG.aim.powerMin + (CFG.aim.powerMax - CFG.aim.powerMin) * t;
  S.arrows.push({
    x: S.worldX + (b.x - CFG.view.playerScreenX), y: b.y,
    vx: d.x * p, vy: d.y * p,
    charge: t, life: CFG.aim.life
  });
  S.aiming = false; S.charge = 0;
}

export function updateArrows(S, dt) {
  const T = S.tiger;
  for (const a of S.arrows) {
    a.vy += CFG.aim.gravity * dt;
    a.x += a.vx * dt; a.y += a.vy * dt;
    a.life -= dt;

    const inX = a.x > T.x - CFG.tiger.w / 2 && a.x < T.x + CFG.tiger.w / 2;
    const inY = a.y > CFG.view.groundY - CFG.tiger.h && a.y < CFG.view.groundY;
    if (inX && inY) {
      a.life = 0;
      const k = a.charge;
      damageTiger(S,
        CFG.aim.dmgMin + (CFG.aim.dmgMax - CFG.aim.dmgMin) * k,
        CFG.aim.pushMin + (CFG.aim.pushMax - CFG.aim.pushMin) * k,
        k > 0.6);
    }
    if (a.y > CFG.view.groundY) a.life = 0;
  }
  S.arrows = S.arrows.filter(a => a.life > 0);
}

export function drawAimPreview(ctx, S) {
  const t = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const d = aimVector(S), b = bowScreen(S);
  const p = CFG.aim.powerMin + (CFG.aim.powerMax - CFG.aim.powerMin) * t;
  let x = b.x, y = b.y, vx = d.x * p, vy = d.y * p;
  const step = 0.026;
  ctx.fillStyle = C.aim;
  for (let i = 0; i < 44; i++) {
    vy += CFG.aim.gravity * step;
    x += vx * step; y += vy * step;
    if (y > CFG.view.groundY || x < -80 || x > CFG.view.w + 80) break;
    ctx.globalAlpha = 0.5 * (1 - i / 44);
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}
