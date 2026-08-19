// CODEMAP
// role : 한 고정 논리 프레임의 sim 배선
// 핵심 : updateSimulation()
// 의존 : config, player, tiger, arrow, obstacle
// 연관 : main과 replay가 반드시 이 동일한 진입점을 사용한다
// 주의 : 이벤트는 매 프레임 비우며, hitstop은 입력 반영 뒤 월드 update만 멈춘다.

import { CFG, FIXED_DT } from './config.js';
import { updatePlayer } from './player.js';
import { updateTiger } from './tiger.js';
import { fireArrow, startCharge, updateArrows } from './arrow.js';
import { updateObstacles } from './obstacle.js';

function updateDistanceScore(S) {
  const points = Math.floor(S.worldX / CFG.score.distancePx);
  if (points <= S.scoredDistance) return;
  S.score += points - S.scoredDistance;
  S.scoredDistance = points;
}

export function updateSimulation(S, input) {
  S.events = [];
  S.aimX = input.ax;
  S.aimY = input.ay;

  if (input.c === 1) startCharge(S);
  else if (input.c === 2) fireArrow(S, input);

  if (S.hitstop > 0) {
    S.hitstop = Math.max(0, S.hitstop - FIXED_DT);
    S.frame++;
    return false;
  }

  S.t += FIXED_DT;
  if (S.aiming) S.charge = Math.min(S.charge + FIXED_DT, CFG.aim.chargeTime);
  updatePlayer(S, input);
  updateDistanceScore(S);
  updateObstacles(S);
  updateTiger(S);
  updateArrows(S);
  if (S.phase === 'over') { S.aiming = false; S.charge = 0; }

  // hitstop은 gameplay 시간축에 영향을 주므로 sim이 적용한다. trauma·진동은 main의 fx 처리 몫이다.
  for (const event of S.events) {
    const tier = CFG.fx[event.kind];
    if (tier) S.hitstop = Math.max(S.hitstop, tier[0]);
  }
  S.frame++;
  return true;
}
