// CODEMAP
// role : 강무 과녁 생성·통과·콤보·명중 보상
// 핵심 : updateTargets(), hitTarget(), breakTargetCombo()
// 의존 : config, rng
// 연관 : arrow가 명중을 전달하고 player가 질주 시간을 속도로 바꾼다
// 주의 : 배치 난수와 모든 지속 상태는 S 안에만 둔다.

import { CFG, FIXED_DT } from './config.js';
import { rngRange, rngUnit } from './rng.js';

export function breakTargetCombo(S) {
  S.combo = 0;
}

export function hitTarget(S, target) {
  if (target.hit) return false;
  target.hit = true;
  S.combo++;
  S.bestCombo = Math.max(S.bestCombo, S.combo);
  S.targetHits++;
  const multiplier = Math.min(S.combo, CFG.score.targetComboMax);
  const points = CFG.score.targetHit * multiplier;
  S.score += points;
  S.player.boost = Math.max(S.player.boost, CFG.target.dashTime);
  S.targetBursts.push({
    x: target.x, y: target.y, life: CFG.target.feedbackTime,
    points, combo: S.combo
  });
  S.events.push({ kind: 'targetHit' });
  return true;
}

export function updateTargets(S) {
  const K = CFG.target;

  for (const burst of S.targetBursts) burst.life -= FIXED_DT;
  S.targetBursts = S.targetBursts.filter(burst => burst.life > 0);

  while (S.nextTargetX < S.worldX + CFG.view.w) {
    let roll = rngRange(S.rng, 0, K.centerYs.length);
    S.rng = roll.state;
    let tier = roll.value;
    if (tier === S.lastTargetTier) tier = (tier + 1) % K.centerYs.length;
    S.lastTargetTier = tier;
    S.targets.push({
      x: S.nextTargetX,
      y: K.centerYs[tier],
      hit: false
    });
    roll = rngUnit(S.rng);
    S.rng = roll.state;
    S.nextTargetX += K.gapMin + roll.value * (K.gapMax - K.gapMin);
  }

  let passed = false;
  for (const target of S.targets) {
    if (!target.hit && target.x < S.worldX - K.missBehind) passed = true;
  }
  if (passed) breakTargetCombo(S);
  S.targets = S.targets.filter(target =>
    !target.hit && target.x >= S.worldX - K.missBehind);
}
