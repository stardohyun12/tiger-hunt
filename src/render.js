// CODEMAP
// role : 전 화면 그리기 (도형 플레이스홀더)
// 핵심 : render()
// 의존 : config, state, fx, player, tiger, arrow(읽기 전용 조준 계산)
// 연관 : Day 3에 이 파일만 스프라이트로 교체하면 된다
// 주의 : 상태를 바꾸지 말 것. 읽기 전용.

import { CFG, C } from './config.js';
import { gapOf } from './state.js';
import { shakeOf } from './fx.js';
import { playerHeight } from './player.js';
import { tigerVulnerable } from './tiger.js';
import { aimVector, bowScreen } from './arrow.js';

const V = CFG.view;

function bar(ctx, x, y, w, h, v, col, bgc) {
  ctx.fillStyle = bgc; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, v)), h);
}

function drawTelegraph(ctx, S, sx) {
  const T = S.tiger;
  if (T.state !== 'windup' && T.state !== 'swing') return;
  const K = CFG.tiger;
  const y0 = T.zone === 'high' ? V.groundY - 132 : V.groundY - 44;
  const h  = T.zone === 'high' ? 92 : 44;

  if (T.state === 'windup') {
    const p = 1 - T.timer / K.windup;
    ctx.globalAlpha = 0.20 + 0.30 * p;
    ctx.fillStyle = C.telegraph;
    ctx.fillRect(sx, y0, K.reach * p, h);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = C.telegraph; ctx.lineWidth = 2;
    ctx.strokeRect(sx, y0, K.reach, h);
  } else {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx, y0, K.reach, h);
  }
  ctx.globalAlpha = 1;
}

function drawAimPreview(ctx, S) {
  const t = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const d = aimVector(S, S.aimX, S.aimY), b = bowScreen(S);
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

export function render(ctx, S) {
  const p = S.player, T = S.tiger, gap = gapOf(S);

  ctx.save();
  const sk = shakeOf(S);
  ctx.translate(sk.x, sk.y);

  ctx.fillStyle = C.sky; ctx.fillRect(-40, -40, V.w + 80, V.groundY + 40);
  ctx.fillStyle = C.ground; ctx.fillRect(-40, V.groundY, V.w + 80, V.h);
  ctx.fillStyle = C.groundLine;
  const off = -(S.worldX % 96);
  for (let x = off - 96; x < V.w + 96; x += 96) ctx.fillRect(x, V.groundY, 48, 3);

  // 장애물
  for (const o of S.obstacles) {
    const sx = V.playerScreenX + (o.x - S.worldX);
    if (sx < -90 || sx > V.w + 90) continue;
    if (o.kind === 'rock') {
      ctx.fillStyle = C.obs;
      ctx.fillRect(sx - CFG.obs.w / 2, V.groundY - o.h, CFG.obs.w, o.h);
    } else {
      ctx.fillStyle = C.branch;
      ctx.fillRect(sx - CFG.obs.w / 2, 0, CFG.obs.w, V.groundY - CFG.obs.branchClearY);
    }
  }

  // 호랑이
  const tsx = V.playerScreenX - gap;
  drawTelegraph(ctx, S, tsx + CFG.tiger.w / 2);
  ctx.fillStyle = tigerVulnerable(S) ? C.tigerVuln : C.tiger;
  ctx.fillRect(tsx - CFG.tiger.w / 2, V.groundY - CFG.tiger.h, CFG.tiger.w, CFG.tiger.h);
  ctx.fillStyle = C.tigerDark;
  for (let i = 0; i < 3; i++)
    ctx.fillRect(tsx - 26 + i * 24, V.groundY - CFG.tiger.h, 8, CFG.tiger.h);
  if (T.state === 'swing') {
    ctx.fillStyle = C.tigerDark;
    ctx.fillRect(tsx + CFG.tiger.w / 2, V.groundY - (T.zone === 'high' ? 120 : 40), 46, 16);
  }
  bar(ctx, tsx - CFG.tiger.w / 2, V.groundY - CFG.tiger.h - 18, CFG.tiger.w, 7,
      T.hp / T.hpMax, C.danger, '#00000066');

  // 사슴 + 기수
  const ph = playerHeight(S), py = V.groundY - p.y;
  ctx.globalAlpha = (p.invuln > 0 && Math.floor(S.t * 22) % 2) ? 0.35 : 1;
  ctx.fillStyle = C.player;
  ctx.fillRect(V.playerScreenX - CFG.player.w / 2, py - ph * 0.55, CFG.player.w, ph * 0.55);
  ctx.fillRect(V.playerScreenX + 20, py - ph * 0.86, 16, ph * 0.34);
  ctx.fillStyle = C.rider;
  ctx.fillRect(V.playerScreenX - 14, py - ph, 26, ph * 0.5);
  ctx.globalAlpha = 1;

  if (S.aiming) drawAimPreview(ctx, S);

  ctx.fillStyle = C.arrow;
  for (const a of S.arrows) {
    const sx = V.playerScreenX + (a.x - S.worldX);
    ctx.save(); ctx.translate(sx, a.y);
    ctx.rotate(Math.atan2(a.vy, a.vx));
    ctx.fillRect(-14, -2, 28, 4);
    ctx.restore();
  }
  ctx.restore();

  // HUD
  ctx.textAlign = 'left';
  ctx.fillStyle = C.hud; ctx.font = '600 20px system-ui';
  ctx.fillText(Math.floor(S.worldX / 50) + 'm', 26, 40);
  ctx.fillStyle = C.hudDim; ctx.font = '500 15px system-ui';
  ctx.fillText((S.wave + 1) + '번째 호랑이 · 처치 ' + S.kills + ' · 거리 ' + Math.round(gap), 26, 64);

  for (let i = 0; i < CFG.player.hp; i++) {
    ctx.fillStyle = i < p.hp ? C.danger : '#ffffff20';
    ctx.fillRect(V.w - 34 - i * 30, 26, 20, 20);
  }

  if (S.aiming) {
    const t = Math.min(S.charge / CFG.aim.chargeTime, 1);
    bar(ctx, 26, V.h - 44, 220, 12, t, t > 0.6 ? C.charge : C.aim, '#ffffff18');
    ctx.fillStyle = C.hudDim; ctx.font = '500 13px system-ui';
    ctx.fillText('시위', 26, V.h - 52);
  }

  ctx.fillStyle = C.hudDim; ctx.font = '500 13px system-ui';
  ctx.fillText('W 점프 · S 수그리기 · A 뒤로 · D 앞으로 · 마우스 조준, 좌클릭 홀드 후 놓기',
               26, V.h - 16);

  if (S.phase !== 'play') {
    ctx.fillStyle = '#12101ae6'; ctx.fillRect(0, 0, V.w, V.h);
    ctx.textAlign = 'center'; ctx.fillStyle = C.hud;
    if (S.phase === 'title') {
      ctx.font = '700 46px system-ui';
      ctx.fillText('호랑이 추격', V.w / 2, V.h / 2 - 60);
      ctx.font = '500 17px system-ui'; ctx.fillStyle = C.hudDim;
      ctx.fillText('A로 물러서면 호랑이가 멈추고 앞발을 든다', V.w / 2, V.h / 2 - 16);
      ctx.fillText('빨간 칸이 뜨면 0.5초 안에 자세를 바꿔라 — 위쪽이면 S, 아래쪽이면 W', V.w / 2, V.h / 2 + 12);
      ctx.fillText('휘두른 직후가 유일한 빈틈이다', V.w / 2, V.h / 2 + 40);
      ctx.fillStyle = C.aim; ctx.font = '600 20px system-ui';
      ctx.fillText('스페이스를 눌러 시작', V.w / 2, V.h / 2 + 92);
    } else {
      ctx.font = '700 40px system-ui';
      ctx.fillText('따라잡혔다', V.w / 2, V.h / 2 - 26);
      ctx.font = '500 20px system-ui'; ctx.fillStyle = C.hudDim;
      ctx.fillText(Math.floor(S.worldX / 50) + 'm · 호랑이 ' + S.kills + '마리', V.w / 2, V.h / 2 + 10);
      ctx.fillStyle = C.aim; ctx.font = '600 20px system-ui';
      ctx.fillText('스페이스를 눌러 다시', V.w / 2, V.h / 2 + 58);
    }
  }
}
