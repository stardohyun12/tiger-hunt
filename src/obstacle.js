// CODEMAP
// role : 장애물 생성/충돌 — 바위(점프)와 늘어진 가지(수그리기)
// 핵심 : updateObstacles()
// 의존 : config, player, fx
// 연관 : 두 장애물이 W/S 키의 존재 이유를 만든다
// 주의 : 충돌은 체력이 아니라 '비틀거림 감속'만 준다. 체력 손실은 호랑이 발톱뿐.

import { CFG } from './config.js';
import { playerHeight } from './player.js';
import { triggerFx } from './fx.js';

export function updateObstacles(S) {
  const O = CFG.obs;

  while (S.nextObsX < S.worldX + CFG.view.w) {
    const isBranch = Math.random() < 0.4;
    S.obstacles.push({
      x: S.nextObsX, hit: false, kind: isBranch ? 'branch' : 'rock',
      h: O.rockMin + Math.random() * (O.rockMax - O.rockMin)
    });
    S.nextObsX += O.gapMin + Math.random() * (O.gapMax - O.gapMin);
  }
  S.obstacles = S.obstacles.filter(o => o.x > S.worldX - 500);

  const p = S.player;
  for (const o of S.obstacles) {
    if (o.hit) continue;
    if (Math.abs(o.x - S.worldX) > (O.w + CFG.player.w) * 0.42) continue;

    const top = p.y + playerHeight(S);
    const collide = o.kind === 'rock' ? (p.y < o.h) : (top > O.branchClearY);
    if (collide) {
      o.hit = true;
      p.stumble = CFG.player.stumbleTime;
      triggerFx(S, CFG.fx.stumble);
    }
  }
}
