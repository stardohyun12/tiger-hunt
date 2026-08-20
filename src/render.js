// CODEMAP
// role : 민화 4색 픽셀 렌더링
// 핵심 : render(), blit(), drawBackground(), drawPlayer(), drawTiger()
// 의존 : config, state, fx, arrow, input(표현 상태 읽기)
// 연관 : sim 상태를 문자열 스프라이트와 격자 정렬 도형으로만 표현한다
// 주의 : 상태를 바꾸지 말 것. 반복 애니메이션은 월드 이동 거리에서만 유도한다.

import { CFG, C } from './config.js';
import { gapOf } from './state.js';
import { shakeOf } from './fx.js';
import { aimVector, bowScreen } from './arrow.js';
import { touchActive, touchKeyDown } from './input.js';

const V = CFG.view;
const A = CFG.art;
const SPRITES = A.sprites;

function validateSprites() {
  for (const [name, sprite] of Object.entries(SPRITES)) {
    const width = sprite[0]?.length ?? 0;
    for (let row = 0; row < sprite.length; row++) {
      if (sprite[row].length === width) continue;
      console.error(`[sprite:${name}] ${row + 1}행 길이 ${sprite[row].length}, 기준 ${width}`);
    }
  }
}
validateSprites();

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function snap(value, px = A.px) {
  return Math.round(value / px) * px;
}

function scrollOffset(distance, period) {
  return -(((distance % period) + period) % period);
}

function setFont(ctx, font, tracking) {
  ctx.font = font;
  ctx.letterSpacing = tracking;
}

/** 문자열 행의 같은 색 런을 한 번의 fillRect로 묶어 그린다. */
function blit(ctx, sprite, x, y, { color, alt = color, flip = false, px = A.px }) {
  if (!sprite?.length) return;
  const width = sprite[0].length;
  const sx = snap(x, px);
  const sy = snap(y, px);
  for (let row = 0; row < sprite.length; row++) {
    let column = 0;
    while (column < width) {
      const cell = sprite[row][column];
      if (cell === '.') {
        column++;
        continue;
      }
      let end = column + 1;
      while (end < width && sprite[row][end] === cell) end++;
      const run = end - column;
      const drawColumn = flip ? width - end : column;
      ctx.fillStyle = cell === 'o' ? alt : color;
      ctx.fillRect(sx + drawColumn * px, sy + row * px, run * px, px);
      column = end;
    }
  }
}

function blitAtBase(ctx, name, centerX, baseY, options) {
  const sprite = SPRITES[name];
  const width = sprite[0].length * A.px;
  const height = sprite.length * A.px;
  blit(ctx, sprite, centerX - width / 2, baseY - height, options);
}

function drawSteppedLayer(ctx, S, layer, color) {
  const offset = scrollOffset(S.worldX * layer.speed, layer.step);
  ctx.fillStyle = color;
  for (let x = offset - layer.step; x < V.w + layer.step; x += layer.step) {
    for (let index = 0; index < layer.heights.length; index++) {
      const height = layer.heights[index];
      ctx.fillRect(snap(x + index * layer.blockW), snap(layer.baseY - height),
        layer.blockW, snap(height));
    }
  }
}

function drawClouds(ctx, S) {
  const P = A.scene;
  const offset = scrollOffset(S.worldX * P.cloudSpeed, P.cloudStep);
  ctx.fillStyle = C.inkFar;
  for (let x = offset - P.cloudStep; x < V.w + P.cloudStep; x += P.cloudStep) {
    ctx.fillRect(snap(x), P.cloudY + A.px * 2, A.px * 15, A.px * 3);
    ctx.fillRect(snap(x + A.px * 3), P.cloudY, A.px * 8, A.px * 3);
    ctx.fillRect(snap(x + A.px * 8), P.cloudY - A.px * 2, A.px * 5, A.px * 3);
  }
}

function drawBackground(ctx, S) {
  const P = A.scene;
  ctx.fillStyle = C.paper;
  ctx.fillRect(-P.overscan, -P.overscan, V.w + P.overscan * 2, V.h + P.overscan * 2);
  drawClouds(ctx, S);
  drawSteppedLayer(ctx, S, {
    speed: P.farSpeed, step: P.farStep, baseY: P.farBaseY,
    blockW: P.farBlockW, heights: P.farHeights
  }, C.inkFar);
  drawSteppedLayer(ctx, S, {
    speed: P.midSpeed, step: P.midStep, baseY: P.midBaseY,
    blockW: P.midBlockW, heights: P.midHeights
  }, C.inkMid);
  ctx.fillStyle = C.paper;
  ctx.fillRect(-P.overscan, V.groundY, V.w + P.overscan * 2, V.h - V.groundY + P.overscan);
  ctx.fillStyle = C.ink;
  ctx.fillRect(-P.overscan, V.groundY, V.w + P.overscan * 2, P.groundLineH);
}

function drawGroundMarkers(ctx, S) {
  const P = A.scene;
  const offset = scrollOffset(S.worldX, P.groundMarkStep);
  ctx.fillStyle = C.ink;
  for (let x = offset - P.groundMarkStep; x < V.w + P.groundMarkStep; x += P.groundMarkStep) {
    ctx.fillRect(snap(x), P.groundRowA, P.groundDashW, P.groundDashH);
    ctx.fillRect(snap(x + P.groundMarkStep / 2), P.groundRowB, P.groundDot, P.groundDot);
  }
}

function drawShadow(ctx, centerX, airY, width) {
  const K = A.shadow;
  const air = clamp01(airY / K.height);
  const scale = 1 - air * (1 - K.minScale);
  const alpha = K.groundAlpha + air * (K.airAlpha - K.groundAlpha);
  const shadowW = snap(width * scale);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.ink;
  ctx.fillRect(snap(centerX - shadowW / 2), V.groundY + A.px, shadowW, K.h);
  ctx.restore();
}

function drawDust(ctx, distance, centerX, offsetX) {
  const K = A.dust;
  ctx.save();
  ctx.fillStyle = C.ink;
  ctx.globalAlpha = K.alpha;
  for (let index = 0; index < 3; index++) {
    const phase = (((distance + index * K.phaseStep) % K.cycle) + K.cycle) % K.cycle / K.cycle;
    const x = centerX + offsetX - phase * K.spread - index * A.px;
    const y = V.groundY - K.size - phase * K.lift - (index % 2) * A.px;
    ctx.fillRect(snap(x), snap(y), K.size, K.size);
  }
  ctx.restore();
}

function drawObstacles(ctx, S) {
  const splitHeight = (CFG.obs.rockMin + CFG.obs.rockMax) / 2;
  for (const obstacle of S.obstacles) {
    const sx = V.playerScreenX + obstacle.x - S.worldX;
    if (sx < -CFG.obs.w * 2 || sx > V.w + CFG.obs.w * 2) continue;
    if (obstacle.kind === 'rock') {
      const name = obstacle.h > splitHeight ? 'rockHigh' : 'rockLow';
      blitAtBase(ctx, name, sx, V.groundY, { color: C.ink });
    } else {
      blitAtBase(ctx, 'branch', sx, V.groundY - CFG.obs.branchClearY, { color: C.ink });
    }
  }
}

function drawTelegraph(ctx, S, sx, gap) {
  const T = S.tiger;
  if (T.state !== 'windup' && T.state !== 'swing') return;
  if (T.state === 'windup' && Math.floor(S.frame / A.telegraph.blinkFrames) % 2) return;
  const direction = gap >= 0 ? 1 : -1;
  const edge = sx + direction * CFG.tiger.w / 2;
  const y = T.zone === 'high' ? A.telegraph.highY : A.telegraph.lowY;
  const height = T.zone === 'high' ? A.telegraph.highH : A.telegraph.lowH;
  ctx.fillStyle = C.vermilion;
  ctx.fillRect(snap(direction > 0 ? edge : edge - CFG.tiger.reach), y,
    snap(CFG.tiger.reach), height);
}

function drawBow(ctx, S, flash) {
  const K = A.bow;
  const bow = bowScreen(S);
  const direction = S.aiming ? aimVector(S, S.aimX, S.aimY) : { x: 1, y: 0 };
  ctx.save();
  ctx.translate(bow.x, bow.y);
  ctx.rotate(Math.atan2(direction.y, direction.x));
  ctx.strokeStyle = flash ? C.vermilion : C.ink;
  ctx.lineWidth = K.lineW;
  ctx.beginPath();
  ctx.moveTo(0, -K.halfH);
  ctx.quadraticCurveTo(K.curve, 0, 0, K.halfH);
  ctx.moveTo(0, -K.halfH);
  ctx.lineTo(0, K.halfH);
  if (S.aiming) {
    ctx.moveTo(-K.aimBack, 0);
    ctx.lineTo(K.aimFront, 0);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(ctx, S, flash) {
  const P = S.player;
  const baseY = V.groundY - P.y;
  const runFrame = Math.floor(S.worldX / A.stridePx) % 2;
  const name = !P.grounded ? 'deerJump' : P.crouch ? 'deerCrouch' : runFrame ? 'deerRunB' : 'deerRunA';
  drawShadow(ctx, V.playerScreenX, P.y, A.shadow.playerW);
  if (P.grounded && P.speed > 0) drawDust(ctx, S.worldX, V.playerScreenX, A.dust.playerX);
  ctx.save();
  if (!flash && P.invuln > 0 && Math.floor(S.frame / A.flashFrames) % 2) ctx.globalAlpha = 0.32;
  blitAtBase(ctx, name, V.playerScreenX, baseY, {
    color: flash ? C.vermilion : C.ink,
    alt: flash ? C.vermilion : C.ink
  });
  drawBow(ctx, S, flash);
  ctx.restore();
}

function tigerSprite(S) {
  const T = S.tiger;
  if (T.state === 'brace') return 'tigerBrace';
  if (T.state === 'windup') return 'tigerWindup';
  if (T.state === 'swing' || T.state === 'recover') return 'tigerSwing';
  return Math.floor(T.x / A.stridePx) % 2 ? 'tigerRunB' : 'tigerRunA';
}

function tigerFlip(S, gap) {
  const T = S.tiger;
  if (T.state === 'chase' || T.state === 'overtake') return false;
  if (T.state === 'brace') return T.timer < CFG.tiger.turnTime / 2;
  return gap < 0;
}

function drawTiger(ctx, S, sx, gap, flash) {
  const name = tigerSprite(S);
  const flip = tigerFlip(S, gap);
  drawShadow(ctx, sx, 0, A.shadow.tigerW);
  if (S.tiger.state === 'chase' || S.tiger.state === 'overtake') {
    drawDust(ctx, S.tiger.x, sx, flip ? -A.dust.tigerX : A.dust.tigerX);
  }
  blitAtBase(ctx, name, sx, V.groundY, {
    color: flash ? C.vermilion : C.ochre,
    alt: flash ? C.vermilion : C.ink,
    flip
  });
}

function drawAimPreview(ctx, S) {
  const K = A.aim;
  const charge = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const direction = aimVector(S, S.aimX, S.aimY);
  const bow = bowScreen(S);
  const power = CFG.aim.powerMin + (CFG.aim.powerMax - CFG.aim.powerMin) * charge;
  let x = bow.x;
  let y = bow.y;
  const vx = direction.x * power;
  let vy = direction.y * power;
  ctx.save();
  ctx.fillStyle = C.ink;
  ctx.globalAlpha = K.fade;
  for (let index = 0; index < K.dots; index++) {
    vy += CFG.aim.gravity * K.step;
    x += vx * K.step;
    y += vy * K.step;
    if (y > V.groundY || x < -CFG.obs.w || x > V.w + CFG.obs.w) break;
    ctx.fillRect(x - K.dot / 2, y - K.dot / 2, K.dot, K.dot);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = K.lineW;
  ctx.beginPath();
  ctx.arc(S.aimX, S.aimY, K.markR, 0, Math.PI * 2);
  ctx.moveTo(S.aimX - K.markR - K.markArm, S.aimY);
  ctx.lineTo(S.aimX - K.markR, S.aimY);
  ctx.moveTo(S.aimX + K.markR, S.aimY);
  ctx.lineTo(S.aimX + K.markR + K.markArm, S.aimY);
  ctx.moveTo(S.aimX, S.aimY - K.markR - K.markArm);
  ctx.lineTo(S.aimX, S.aimY - K.markR);
  ctx.moveTo(S.aimX, S.aimY + K.markR);
  ctx.lineTo(S.aimX, S.aimY + K.markR + K.markArm);
  ctx.stroke();
  ctx.restore();
}

function drawArrows(ctx, S) {
  const K = A.arrow;
  ctx.fillStyle = C.ink;
  for (const arrow of S.arrows) {
    const sx = V.playerScreenX + arrow.x - S.worldX;
    const length = Math.sqrt(arrow.vx * arrow.vx + arrow.vy * arrow.vy) || 1;
    const dx = arrow.vx / length;
    const dy = arrow.vy / length;
    const center = (K.cells - 1) / 2;
    for (let cell = 0; cell < K.cells; cell++) {
      const offset = (cell - center) * K.spacing;
      ctx.fillRect(snap(sx + dx * offset), snap(arrow.y + dy * offset), K.cell, K.cell);
    }
  }
}

function bar(ctx, x, y, width, height, value) {
  const border = A.tigerBar.border;
  ctx.fillStyle = C.paper;
  ctx.fillRect(snap(x), snap(y), snap(width), height);
  ctx.fillStyle = C.ink;
  ctx.fillRect(snap(x), snap(y), snap(width * clamp01(value)), height);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = border;
  ctx.strokeRect(snap(x), snap(y), snap(width), height);
}

function drawHud(ctx, S) {
  if (S.phase !== 'play') return;
  const H = A.hud;
  const playerFlash = S.flash.playerUntil > 0 && S.frame <= S.flash.playerUntil;
  for (let index = 0; index < CFG.player.hp; index++) {
    blit(ctx, index < S.player.hp ? SPRITES.heartFull : SPRITES.heartEmpty,
      H.heartX + index * H.heartGap, H.heartY, {
        color: playerFlash ? C.vermilion : C.ink,
        px: H.heartPx
      });
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = C.ink;
  setFont(ctx, H.fontScore, H.tracking);
  ctx.fillText(String(S.score), V.w - H.scoreX, H.scoreY);
  setFont(ctx, H.fontSmall, H.tracking);
  ctx.fillText('점수 · 처치 ' + S.kills, V.w - H.scoreX, H.scoreSubY);
  if (!S.aiming) return;
  const charge = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const x = (V.w - H.chargeW) / 2;
  const y = V.h - H.chargeY;
  ctx.fillStyle = C.paper;
  ctx.fillRect(x, y, H.chargeW, H.chargeH);
  ctx.fillStyle = C.ink;
  ctx.fillRect(x, y, H.chargeW * charge, H.chargeH);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = A.tigerBar.border;
  ctx.strokeRect(x, y, H.chargeW, H.chargeH);
  ctx.textAlign = 'center';
  setFont(ctx, H.fontCharge, H.tracking);
  ctx.fillText('시위 당기기', V.w / 2, y - H.chargeLabelGap);
}

function drawControl(ctx, key, label, x, y) {
  const O = A.overlay;
  ctx.save();
  ctx.globalAlpha = A.hud.washAlpha;
  ctx.fillStyle = C.ink;
  ctx.fillRect(x, y, O.controlW, O.controlH);
  ctx.restore();
  ctx.fillStyle = C.ink;
  ctx.fillRect(x + O.keyX, y + O.keyY, O.keyW, O.keyH);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.paper;
  setFont(ctx, O.fontKey, O.tracking);
  ctx.fillText(key, x + O.keyTextX, y + O.keyTextY);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  setFont(ctx, O.fontLabel, O.tracking);
  ctx.fillText(label, x + O.labelX, y + O.labelY);
}

function drawTouchControls(ctx) {
  const lines = [
    '좌·중앙 화면을 눌러 조준 → 홀드하면 차지 → 떼면 발사',
    '우하단 4버튼: 앞 · 뒤 · 점프 · 수그림',
    '화면 아무 데나 탭하면 시작'
  ];
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  setFont(ctx, CFG.touch.title.font, A.overlay.tracking);
  for (let index = 0; index < lines.length; index++) {
    ctx.fillText(lines[index], V.w / 2, CFG.touch.title.y + index * CFG.touch.title.lineGap);
  }
}

function drawTouchPads(ctx) {
  if (!touchActive()) return;
  for (const pad of CFG.touch.pads) {
    const pressed = touchKeyDown(pad.key);
    const radius = CFG.touch.r + (pressed ? CFG.touch.pressedGrow : 0);
    ctx.save();
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, radius, 0, Math.PI * 2);
    ctx.globalAlpha = pressed ? CFG.touch.pressedAlpha : CFG.touch.fillAlpha;
    ctx.fillStyle = pressed ? C.ochre : C.paper;
    ctx.fill();
    ctx.globalAlpha = pressed ? 1 : CFG.touch.strokeAlpha;
    ctx.strokeStyle = pressed ? C.ochre : C.ink;
    ctx.lineWidth = CFG.touch.lineWidth;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    setFont(ctx, CFG.touch.labelFont, A.hud.tracking);
    ctx.fillText(pad.label, pad.x, pad.y);
    ctx.restore();
  }
}

function drawPanel(ctx, x, y, width, height) {
  ctx.save();
  ctx.globalAlpha = A.hud.panelAlpha;
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, V.w, V.h);
  ctx.globalAlpha = A.hud.paperAlpha;
  ctx.fillStyle = C.paper;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = A.overlay.border;
  ctx.strokeRect(x + A.overlay.inset, y + A.overlay.inset,
    width - A.overlay.inset * 2, height - A.overlay.inset * 2);
}

function drawTitleOverlay(ctx) {
  const O = A.overlay;
  ctx.save();
  drawPanel(ctx, O.titlePanelX, O.titlePanelY, O.titlePanelW, O.titlePanelH);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  setFont(ctx, O.fontTitle, O.tracking);
  ctx.fillText('《호랑이 추격》', V.w / 2, O.titleY);
  setFont(ctx, O.fontSubtitle, O.tracking);
  ctx.fillText('활 하나로 호랑이를 따돌려라', V.w / 2, O.subtitleY);
  ctx.fillStyle = C.vermilion;
  ctx.fillRect(O.warningX, O.warningY, O.warningW, O.warningH);
  ctx.fillStyle = C.paper;
  setFont(ctx, O.fontWarning, O.tracking);
  ctx.fillText('예고가 뜨면 0.5초 — 서 있으면 위를, 수그리면 아래를 노린다',
    V.w / 2, O.warningTextY);
  ctx.fillStyle = C.ink;
  setFont(ctx, O.fontControlTitle, O.tracking);
  ctx.fillText('조작법', V.w / 2, O.controlsTitleY);
  if (touchActive()) {
    drawTouchControls(ctx);
  } else {
    drawControl(ctx, 'W', '점프', O.controlLeftX, O.controlY);
    drawControl(ctx, 'S', '수그리기', O.controlLeftX, O.controlY + O.controlGapY);
    drawControl(ctx, 'A / D', '거리 조절', O.controlLeftX, O.controlY + O.controlGapY * 2);
    drawControl(ctx, '마우스', '조준', O.controlRightX, O.controlY);
    drawControl(ctx, '좌클릭', '홀드 → 놓기 발사', O.controlRightX, O.controlY + O.controlGapY);
    drawControl(ctx, 'Space', '시작', O.controlRightX, O.controlY + O.controlGapY * 2);
  }
  ctx.fillStyle = C.ink;
  ctx.fillRect(O.actionX, O.actionY, O.actionW, O.actionH);
  ctx.fillStyle = C.paper;
  setFont(ctx, O.fontAction, O.tracking);
  ctx.fillText(touchActive() ? '탭 — 추격 시작' : 'Space — 추격 시작', V.w / 2, O.actionTextY);
  ctx.restore();
}

function drawGameOverOverlay(ctx, S) {
  const O = A.overlay;
  const distance = Math.max(0, Math.floor(S.worldX / CFG.score.meterPx));
  ctx.save();
  drawPanel(ctx, O.overPanelX, O.overPanelY, O.overPanelW, O.overPanelH);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.vermilion;
  setFont(ctx, O.fontOverTitle, O.tracking);
  ctx.fillText('쓰러졌다', V.w / 2, O.overTitleY);
  ctx.fillStyle = C.ink;
  setFont(ctx, O.fontOverLabel, O.tracking);
  ctx.fillText('최종 점수', V.w / 2, O.overLabelY);
  setFont(ctx, O.fontOverScore, O.tracking);
  ctx.fillText(String(S.score), V.w / 2, O.overScoreY);
  setFont(ctx, O.fontOverLabel, O.tracking);
  ctx.fillText('처치 수', O.overStatLeftX, O.overStatLabelY);
  ctx.fillText('달린 거리', O.overStatRightX, O.overStatLabelY);
  setFont(ctx, O.fontStat, O.tracking);
  ctx.fillText(String(S.kills), O.overStatLeftX, O.overStatY);
  ctx.fillText(distance + 'm', O.overStatRightX, O.overStatY);
  ctx.save();
  ctx.globalAlpha = A.hud.washAlpha;
  ctx.fillStyle = C.ink;
  ctx.fillRect(O.bestX, O.bestY, O.bestW, O.bestH);
  ctx.restore();
  ctx.fillStyle = C.ink;
  setFont(ctx, O.fontControlTitle, O.tracking);
  ctx.fillText(S.isNewBest ? '신기록!' : '최고 기록', V.w / 2, O.bestLabelY);
  setFont(ctx, O.fontBest, O.tracking);
  ctx.fillText(String(S.bestScore), V.w / 2, O.bestScoreY);
  ctx.fillStyle = C.ink;
  ctx.fillRect(O.retryX, O.retryY, O.retryW, O.retryH);
  ctx.fillStyle = C.paper;
  setFont(ctx, O.fontAction, O.tracking);
  ctx.fillText(touchActive() ? '화면 탭 — 다시 도전' : 'Space — 다시 도전',
    V.w / 2, O.retryTextY);
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
  ctx.translate(snap(shake.x), snap(shake.y));
  drawBackground(ctx, S);
  drawGroundMarkers(ctx, S);
  drawObstacles(ctx, S);
  drawTelegraph(ctx, S, tigerX, gap);
  drawTiger(ctx, S, tigerX, gap, tigerFlash);
  bar(ctx, tigerX - A.tigerBar.w / 2,
    V.groundY - CFG.tiger.h - A.tigerBar.yGap,
    A.tigerBar.w, A.tigerBar.h, S.tiger.hp / S.tiger.hpMax);
  drawPlayer(ctx, S, playerFlash);
  if (S.aiming) drawAimPreview(ctx, S);
  drawArrows(ctx, S);
  ctx.restore();
  drawTouchPads(ctx);
  drawHud(ctx, S);
  drawOverlay(ctx, S);
}
