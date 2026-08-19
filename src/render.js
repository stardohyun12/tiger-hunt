// CODEMAP
// role : 전 화면 벡터 렌더링
// 핵심 : render(), drawBackground(), drawPlayer(), drawTiger()
// 의존 : config, state, fx, tiger, arrow(읽기 전용 계산)
// 연관 : sim 상태를 읽어 패럴랙스·달리기·뒤돌기·타격 피드백을 표현한다
// 주의 : 상태를 바꾸지 말 것. 반복 애니메이션 위상은 S.worldX와 S.t에서만 유도한다.

import { CFG, C } from './config.js';
import { gapOf } from './state.js';
import { shakeOf } from './fx.js';
import { tigerVulnerable } from './tiger.js';
import { aimVector, bowScreen } from './arrow.js';

const V = CFG.view;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function scrollOffset(distance, period) {
  return -(((distance % period) + period) % period);
}

function bar(ctx, x, y, w, h, v, col, bgc) {
  ctx.fillStyle = bgc; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp01(v), h);
}

function drawBackground(ctx, S) {
  ctx.fillStyle = C.sky;
  ctx.fillRect(-40, -40, V.w + 80, V.groundY + 40);

  // 먼 산 — 월드 이동량의 0.15배.
  const farStep = V.w / 3;
  const farOff = scrollOffset(S.worldX * 0.15, farStep);
  ctx.save();
  ctx.globalAlpha = 0.58;
  ctx.fillStyle = C.bg;
  for (let x = farOff - farStep; x < V.w + farStep; x += farStep) {
    ctx.beginPath();
    ctx.moveTo(x, V.groundY);
    ctx.lineTo(x + farStep * 0.18, V.groundY - 92);
    ctx.lineTo(x + farStep * 0.38, V.groundY - 164);
    ctx.lineTo(x + farStep * 0.55, V.groundY - 72);
    ctx.lineTo(x + farStep * 0.76, V.groundY - 126);
    ctx.lineTo(x + farStep, V.groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 중간 언덕과 나무 — 월드 이동량의 0.4배.
  const hillStep = V.w / 4;
  const hillOff = scrollOffset(S.worldX * 0.4, hillStep);
  ctx.save();
  ctx.globalAlpha = 0.66;
  ctx.fillStyle = C.groundLine;
  for (let x = hillOff - hillStep; x < V.w + hillStep; x += hillStep) {
    ctx.beginPath();
    ctx.moveTo(x, V.groundY);
    ctx.quadraticCurveTo(x + hillStep * 0.5, V.groundY - 118, x + hillStep, V.groundY);
    ctx.closePath();
    ctx.fill();
  }
  const treeStep = V.w / 5;
  const treeOff = scrollOffset(S.worldX * 0.4, treeStep);
  ctx.fillStyle = C.branch;
  for (let x = treeOff - treeStep; x < V.w + treeStep; x += treeStep) {
    ctx.fillRect(x - 5, V.groundY - 112, 10, 112);
    ctx.beginPath();
    ctx.ellipse(x, V.groundY - 126, 38, 54, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 28, V.groundY - 106, 28, 38, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 28, V.groundY - 104, 30, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = C.ground;
  ctx.fillRect(-40, V.groundY, V.w + 80, V.h - V.groundY + 40);
  ctx.fillStyle = C.groundLine;
  ctx.fillRect(-40, V.groundY, V.w + 80, 4);
}

function drawGroundMarkers(ctx, S) {
  // 지면 디테일 — 월드 이동량 1.0배. 풀과 돌이 실제 속도로 흘러간다.
  const step = 96;
  const off = scrollOffset(S.worldX, step);
  ctx.save();
  ctx.strokeStyle = C.groundLine;
  ctx.fillStyle = C.obs;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  let index = 0;
  for (let x = off - step; x < V.w + step; x += step) {
    const grassX = x + 20 + (index % 2) * 18;
    ctx.beginPath();
    ctx.moveTo(grassX, V.groundY + 3);
    ctx.lineTo(grassX - 7, V.groundY - 13);
    ctx.moveTo(grassX, V.groundY + 3);
    ctx.lineTo(grassX + 4, V.groundY - 18);
    ctx.moveTo(grassX + 1, V.groundY + 3);
    ctx.lineTo(grassX + 11, V.groundY - 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + 66, V.groundY + 12, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    index++;
  }
  ctx.restore();
}

function drawSpeedLines(ctx, S) {
  const speed = clamp01(S.player.speed / CFG.player.speedFwd);
  ctx.save();
  ctx.strokeStyle = C.hud;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.03 + speed * 0.12;
  for (let row = 0; row < 8; row++) {
    const step = 170 + row * 17;
    const off = scrollOffset(S.worldX * (0.72 + row * 0.025), step);
    const y = 62 + row * 39;
    for (let x = off - step; x < V.w + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18 + speed * 82, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawRock(ctx, sx, height) {
  ctx.fillStyle = C.obs;
  ctx.beginPath();
  ctx.moveTo(sx - CFG.obs.w / 2, V.groundY);
  ctx.lineTo(sx - CFG.obs.w * 0.36, V.groundY - height * 0.62);
  ctx.lineTo(sx - CFG.obs.w * 0.08, V.groundY - height);
  ctx.lineTo(sx + CFG.obs.w * 0.32, V.groundY - height * 0.74);
  ctx.lineTo(sx + CFG.obs.w / 2, V.groundY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.groundLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx - CFG.obs.w * 0.08, V.groundY - height);
  ctx.lineTo(sx + CFG.obs.w * 0.04, V.groundY - height * 0.45);
  ctx.stroke();
}

function drawBranch(ctx, sx) {
  const clearY = V.groundY - CFG.obs.branchClearY;
  ctx.save();
  ctx.strokeStyle = C.branch;
  ctx.fillStyle = C.branch;
  ctx.lineCap = 'round';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(sx - CFG.obs.w, -20);
  ctx.quadraticCurveTo(sx - 18, clearY - 96, sx, clearY - 12);
  ctx.quadraticCurveTo(sx + 18, clearY - 34, sx + CFG.obs.w, clearY - 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(sx - 20, clearY - 62, 32, 22, -0.4, 0, Math.PI * 2);
  ctx.ellipse(sx + 26, clearY - 35, 36, 18, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawObstacles(ctx, S) {
  for (const obstacle of S.obstacles) {
    const sx = V.playerScreenX + obstacle.x - S.worldX;
    if (sx < -90 || sx > V.w + 90) continue;
    if (obstacle.kind === 'rock') drawRock(ctx, sx, obstacle.h);
    else drawBranch(ctx, sx);
  }
}

function drawTelegraph(ctx, S, sx, gap) {
  const T = S.tiger;
  if (T.state !== 'windup' && T.state !== 'swing') return;

  const K = CFG.tiger;
  const direction = gap >= 0 ? 1 : -1;
  const edge = sx + direction * K.w / 2;
  const y0 = T.zone === 'high' ? V.groundY - 132 : V.groundY - 44;
  const h = T.zone === 'high' ? 92 : 44;

  if (T.state === 'windup') {
    const progress = 1 - T.timer / K.windup;
    const width = K.reach * progress;
    const x = direction > 0 ? edge : edge - width;
    ctx.globalAlpha = 0.20 + 0.30 * progress;
    ctx.fillStyle = C.telegraph;
    ctx.fillRect(x, y0, width, h);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = C.telegraph;
    ctx.lineWidth = 2;
    ctx.strokeRect(direction > 0 ? edge : edge - K.reach, y0, K.reach, h);
  } else {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = C.hud;
    ctx.fillRect(direction > 0 ? edge : edge - K.reach, y0, K.reach, h);
  }
  ctx.globalAlpha = 1;
}

function drawDeerLeg(ctx, x, ground, phase, color) {
  const kneeX = x + phase * 13;
  const kneeY = ground - 21;
  const hoofX = x - phase * 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, ground - 42);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(hoofX, ground - 2);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(hoofX - 5, ground - 1);
  ctx.lineTo(hoofX + 5, ground - 1);
  ctx.stroke();
}

function drawRider(ctx, S, ground, color, flash) {
  const p = S.player;
  const crouch = p.crouch && p.grounded;
  const shoulderX = crouch ? -2 : -5;
  const shoulderY = crouch ? ground - 62 : ground - 82;
  const hipX = crouch ? -18 : -12;
  const hipY = ground - 55;
  const headX = crouch ? -15 : -6;
  const headY = crouch ? ground - 75 : ground - 99;
  const bow = bowScreen(S);
  const bowX = bow.x - V.playerScreenX;
  const bowY = bow.y - (V.groundY - p.y) + ground;
  const direction = S.aiming ? aimVector(S, S.aimX, S.aimY) : { x: 1, y: 0 };

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(headX, headY, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(bowX, bowY);
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(12, ground - 43);
  ctx.stroke();

  ctx.save();
  ctx.translate(bowX, bowY);
  ctx.rotate(Math.atan2(direction.y, direction.x));
  ctx.strokeStyle = flash ? C.hud : C.arrow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(13, 0, 0, 18);
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 18);
  ctx.stroke();
  if (S.aiming) {
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(ctx, S, flash) {
  const p = S.player;
  const ground = V.groundY - p.y;
  const gait = Math.sin(S.worldX * 0.075);
  const color = flash ? C.hud : C.player;
  const riderColor = flash ? C.hud : C.rider;

  ctx.save();
  ctx.translate(V.playerScreenX, 0);
  if (!flash && p.invuln > 0 && Math.floor(S.t * 22) % 2) ctx.globalAlpha = 0.35;

  drawDeerLeg(ctx, -30, ground, gait, color);
  drawDeerLeg(ctx, -13, ground, -gait, color);
  drawDeerLeg(ctx, 16, ground, -gait, color);
  drawDeerLeg(ctx, 32, ground, gait, color);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, ground - 46, 43, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(25, ground - 57);
  ctx.lineTo(34, ground - 82);
  ctx.lineTo(50, ground - 76);
  ctx.lineTo(40, ground - 48);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(49, ground - 79, 18, 11, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(38, ground - 86);
  ctx.lineTo(33, ground - 101);
  ctx.lineTo(46, ground - 89);
  ctx.moveTo(53, ground - 88);
  ctx.lineTo(60, ground - 100);
  ctx.lineTo(62, ground - 86);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-40, ground - 53);
  ctx.quadraticCurveTo(-57, ground - 66, -62, ground - 53);
  ctx.quadraticCurveTo(-53, ground - 48, -39, ground - 43);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(53, ground - 88);
  ctx.lineTo(57, ground - 102);
  ctx.lineTo(68, ground - 109);
  ctx.moveTo(57, ground - 102);
  ctx.lineTo(49, ground - 111);
  ctx.stroke();

  drawRider(ctx, S, ground, riderColor, flash);
  ctx.restore();
}

function drawTigerLeg(ctx, x, ground, phase, color) {
  const kneeX = x + phase * 15;
  const hoofX = x - phase * 18;
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, ground - 42);
  ctx.lineTo(kneeX, ground - 20);
  ctx.lineTo(hoofX, ground - 2);
  ctx.stroke();
}

function drawTigerClaw(ctx, T, face, color) {
  const swinging = T.state === 'swing';
  const endX = swinging ? face * (CFG.tiger.w / 2 + 42) : face * 58;
  const endY = swinging ? (T.zone === 'high' ? -104 : -30) : -92;
  const elbowX = face * 48;
  const elbowY = swinging ? endY - 4 : -66;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(face * 30, -52);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let claw = -1; claw <= 1; claw++) {
    ctx.beginPath();
    ctx.moveTo(endX, endY + claw * 5);
    ctx.lineTo(endX + face * 12, endY + claw * 7);
    ctx.stroke();
  }
}

function drawTiger(ctx, S, sx, gap, flash) {
  const T = S.tiger;
  const gait = Math.sin(S.t * CFG.tiger.blockSpeed * 0.06);
  const attacking = T.state === 'windup' || T.state === 'swing';
  let face = gap >= 0 ? 1 : -1;
  let headSide = face;
  let bodyWidth = 1;

  if (T.state === 'chase' || T.state === 'overtake') {
    face = 1;
    headSide = 1;
  } else if (T.state === 'brace') {
    const turn = 1 - clamp01(T.timer / CFG.tiger.turnTime);
    headSide = 1 - turn * 2;
    face = headSide >= 0 ? 1 : -1;
    bodyWidth = 0.72 + Math.abs(headSide) * 0.28;
  }

  const baseColor = tigerVulnerable(S) ? C.tigerVuln : C.tiger;
  const color = flash ? C.hud : baseColor;
  const stripe = flash ? C.hud : C.tigerDark;
  const ground = V.groundY;

  ctx.save();
  ctx.translate(sx, ground);

  const legs = [-38, -18, 18, 38];
  for (let index = 0; index < legs.length; index++) {
    const isFront = face > 0 ? index === legs.length - 1 : index === 0;
    if (attacking && isFront) continue;
    const phase = index % 2 ? -gait : gait;
    drawTigerLeg(ctx, legs[index] * bodyWidth, 0, phase, color);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headSide * 43 * bodyWidth, -52);
  ctx.bezierCurveTo(-headSide * 70, -76, -headSide * 78, -28, -headSide * 96, -42);
  ctx.stroke();

  ctx.save();
  ctx.scale(bodyWidth, 1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -48, 53, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const headX = headSide * 51;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(headX, -55, 24, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX - 15, -70);
  ctx.lineTo(headX - 9, -83);
  ctx.lineTo(headX - 2, -72);
  ctx.moveTo(headX + 15, -70);
  ctx.lineTo(headX + 9, -83);
  ctx.lineTo(headX + 2, -72);
  ctx.fill();

  ctx.strokeStyle = stripe;
  ctx.lineWidth = 6;
  for (let stripeX = -24; stripeX <= 24; stripeX += 24) {
    ctx.beginPath();
    ctx.moveTo(stripeX * bodyWidth, -69);
    ctx.lineTo((stripeX + headSide * 7) * bodyWidth, -49);
    ctx.stroke();
  }
  ctx.fillStyle = stripe;
  ctx.beginPath();
  ctx.arc(headX + face * 8, -59, 3, 0, Math.PI * 2);
  ctx.fill();

  if (attacking) drawTigerClaw(ctx, T, face, color);
  ctx.restore();
}

function drawAimPreview(ctx, S) {
  const t = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const direction = aimVector(S, S.aimX, S.aimY);
  const bow = bowScreen(S);
  const power = CFG.aim.powerMin + (CFG.aim.powerMax - CFG.aim.powerMin) * t;
  let x = bow.x;
  let y = bow.y;
  let vx = direction.x * power;
  let vy = direction.y * power;
  const step = 0.026;
  ctx.fillStyle = C.aim;
  for (let index = 0; index < 44; index++) {
    vy += CFG.aim.gravity * step;
    x += vx * step;
    y += vy * step;
    if (y > V.groundY || x < -80 || x > V.w + 80) break;
    ctx.globalAlpha = 0.5 * (1 - index / 44);
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}

function drawArrows(ctx, S) {
  ctx.fillStyle = C.arrow;
  for (const arrow of S.arrows) {
    const sx = V.playerScreenX + arrow.x - S.worldX;
    ctx.save();
    ctx.translate(sx, arrow.y);
    ctx.rotate(Math.atan2(arrow.vy, arrow.vx));
    ctx.fillRect(-14, -2, 28, 4);
    ctx.restore();
  }
}

function drawHeart(ctx, x, y, filled) {
  ctx.save();
  ctx.fillStyle = filled ? C.vermilion : C.ink;
  ctx.strokeStyle = C.paper;
  ctx.globalAlpha = filled ? 1 : 0.28;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 9);
  ctx.bezierCurveTo(x - 20, y - 7, x - 28, y + 17, x, y + 34);
  ctx.bezierCurveTo(x + 28, y + 17, x + 20, y - 7, x, y + 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, S) {
  if (S.phase !== 'play') return;

  for (let index = 0; index < CFG.player.hp; index++) {
    drawHeart(ctx, 34 + index * 38, 24, index < S.player.hp);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = C.paper;
  ctx.font = '800 36px system-ui';
  ctx.fillText(String(S.score), V.w - 28, 48);
  ctx.fillStyle = C.ochre;
  ctx.font = '700 14px system-ui';
  ctx.fillText('점수 · 처치 ' + S.kills, V.w - 28, 70);

  if (S.aiming) {
    const t = Math.min(S.charge / CFG.aim.chargeTime, 1);
    const width = 280;
    const x = (V.w - width) / 2;
    const y = V.h - 38;
    bar(ctx, x, y, width, 14, t,
      t > CFG.aim.strongCharge ? C.vermilion : C.ochre, C.ink);
    ctx.strokeStyle = C.paper;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, 14);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.paper;
    ctx.font = '700 13px system-ui';
    ctx.fillText('시위 당기기', V.w / 2, y - 8);
  }
}

function drawControl(ctx, key, label, x, y) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = C.ink;
  ctx.fillRect(x, y, 320, 44);
  ctx.restore();

  ctx.fillStyle = C.ochre;
  ctx.fillRect(x + 8, y + 7, 82, 30);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.paper;
  ctx.font = '800 14px system-ui';
  ctx.fillText(key, x + 49, y + 27);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = '650 15px system-ui';
  ctx.fillText(label, x + 106, y + 28);
}

function drawTitleOverlay(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, V.w, V.h);
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = C.paper;
  ctx.fillRect(80, 28, V.w - 160, V.h - 56);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.ochre;
  ctx.lineWidth = 4;
  ctx.strokeRect(91, 39, V.w - 182, V.h - 78);

  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = '900 49px serif';
  ctx.fillText('《호랑이 추격》', V.w / 2, 94);
  ctx.fillStyle = C.ochre;
  ctx.font = '700 17px system-ui';
  ctx.fillText('활 하나로 호랑이를 따돌려라', V.w / 2, 124);

  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.fillStyle = C.vermilion;
  ctx.fillRect(125, 145, V.w - 250, 48);
  ctx.restore();
  ctx.fillStyle = C.vermilion;
  ctx.font = '750 14px system-ui';
  ctx.fillText('빨간 예고가 뜨면 0.5초 — 서 있으면 위를, 수그리면 아래를 노린다',
    V.w / 2, 175);

  ctx.fillStyle = C.ink;
  ctx.font = '800 17px system-ui';
  ctx.fillText('조작법', V.w / 2, 225);
  drawControl(ctx, 'W', '점프', 140, 242);
  drawControl(ctx, 'S', '수그리기', 140, 298);
  drawControl(ctx, 'A / D', '거리 조절', 140, 354);
  drawControl(ctx, '마우스', '조준', 500, 242);
  drawControl(ctx, '좌클릭', '홀드 → 놓기 발사', 500, 298);
  drawControl(ctx, 'Space', '시작', 500, 354);

  ctx.fillStyle = C.vermilion;
  ctx.fillRect(V.w / 2 - 170, 435, 340, 44);
  ctx.fillStyle = C.paper;
  ctx.font = '800 18px system-ui';
  ctx.fillText('Space — 추격 시작', V.w / 2, 463);
  ctx.restore();
}

function drawGameOverOverlay(ctx, S) {
  const distance = Math.max(0, Math.floor(S.worldX / CFG.score.meterPx));
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, V.w, V.h);
  ctx.globalAlpha = 0.97;
  ctx.fillStyle = C.paper;
  ctx.fillRect(250, 42, 460, 456);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.ochre;
  ctx.lineWidth = 4;
  ctx.strokeRect(261, 53, 438, 434);

  ctx.textAlign = 'center';
  ctx.fillStyle = C.vermilion;
  ctx.font = '900 42px serif';
  ctx.fillText('쓰러졌다', V.w / 2, 112);
  ctx.fillStyle = C.ink;
  ctx.font = '700 15px system-ui';
  ctx.fillText('최종 점수', V.w / 2, 149);
  ctx.font = '900 58px system-ui';
  ctx.fillText(String(S.score), V.w / 2, 209);

  ctx.fillStyle = C.ochre;
  ctx.font = '700 14px system-ui';
  ctx.fillText('처치 수', 380, 251);
  ctx.fillText('달린 거리', 580, 251);
  ctx.fillStyle = C.ink;
  ctx.font = '850 26px system-ui';
  ctx.fillText(String(S.kills), 380, 282);
  ctx.fillText(distance + 'm', 580, 282);

  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = S.isNewBest ? C.vermilion : C.ink;
  ctx.fillRect(310, 313, 340, 76);
  ctx.restore();
  ctx.fillStyle = S.isNewBest ? C.vermilion : C.ochre;
  ctx.font = '850 17px system-ui';
  ctx.fillText(S.isNewBest ? '신기록!' : '최고 기록', V.w / 2, 340);
  ctx.fillStyle = C.ink;
  ctx.font = '850 28px system-ui';
  ctx.fillText(String(S.bestScore), V.w / 2, 374);

  ctx.fillStyle = C.vermilion;
  ctx.fillRect(V.w / 2 - 120, 417, 240, 44);
  ctx.fillStyle = C.paper;
  ctx.font = '800 18px system-ui';
  ctx.fillText('Space — 다시 도전', V.w / 2, 445);
  ctx.restore();
}

function drawOverlay(ctx, S) {
  if (S.phase === 'title') drawTitleOverlay(ctx);
  else if (S.phase === 'over') drawGameOverOverlay(ctx, S);
}

export function render(ctx, S) {
  const gap = gapOf(S);
  const tigerX = V.playerScreenX - gap;
  const tigerFlash = S.flash.tigerUntil > 0 && S.frame <= S.flash.tigerUntil;
  const playerFlash = S.flash.playerUntil > 0 && S.frame <= S.flash.playerUntil;

  ctx.save();
  const shake = shakeOf(S);
  ctx.translate(shake.x, shake.y);

  drawBackground(ctx, S);
  drawGroundMarkers(ctx, S);
  drawSpeedLines(ctx, S);
  drawObstacles(ctx, S);
  drawTelegraph(ctx, S, tigerX, gap);
  drawTiger(ctx, S, tigerX, gap, tigerFlash);
  bar(ctx, tigerX - CFG.tiger.w / 2, V.groundY - CFG.tiger.h - 18,
    CFG.tiger.w, 7, S.tiger.hp / S.tiger.hpMax, C.danger, '#00000066');
  drawPlayer(ctx, S, playerFlash);
  if (S.aiming) drawAimPreview(ctx, S);
  drawArrows(ctx, S);
  ctx.restore();

  drawHud(ctx, S);
  drawOverlay(ctx, S);
}
