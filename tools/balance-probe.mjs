// CODEMAP
// role : 밸런스 검산 — 다섯 입력 전략의 60초 생존·점수·헛스윙 비교
// 핵심 : node tools/balance-probe.mjs
// 의존 : src/state, src/sim, src/config, src/arrow (브라우저 API 없이 돈다)
// 연관 : 과녁 명중이 도망·연사보다 이득인지, 앞막기가 실제 사거리에서 공격하는지 검증한다
// 주의 : sim 만 돌린다. 렌더/입력 계층은 여기서 검증하지 않는다.

import { createState, gapOf } from '../src/state.js';
import { updateSimulation } from '../src/sim.js';
import { bowScreen } from '../src/arrow.js';
import { CFG, FIXED_DT, INPUT_KEY } from '../src/config.js';

const RUN_FRAMES = 60 * 60;
const PROBE_SEED = 20260820;

function constantInput(k) {
  return (_S, f) => ({ f, k, ax: 300, ay: 300, c: 0 });
}

function nearestTarget(S) {
  let nearest = null;
  for (const target of S.targets) {
    if (target.hit || target.x <= S.worldX) continue;
    if (!nearest || target.x < nearest.x) nearest = target;
  }
  return nearest;
}

// 실제 고정 timestep 탄도를 한 칸씩 미리 적분해 목표 중심에 가장 가까운 정수 조준점을 고른다.
function aimYForWorldPoint(S, targetX, targetY, halfWidth, aimX) {
  const bow = bowScreen(S);
  const startX = S.worldX + bow.x - CFG.view.playerScreenX;
  const targetDx = targetX - startX;
  const travelSign = targetDx >= 0 ? 1 : -1;
  const charge = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const power = CFG.aim.powerMin + (CFG.aim.powerMax - CFG.aim.powerMin) * charge;
  let bestY = Math.round(targetY);
  let bestError = Infinity;

  for (let aimY = 0; aimY <= CFG.view.groundY; aimY++) {
    const dx = aimX - bow.x;
    const dy = aimY - bow.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length <= 0 || Math.sign(dx) !== travelSign) continue;
    const vx = dx / length * power;
    let vy = dy / length * power;
    let x = 0;
    let y = bow.y;
    let life = CFG.aim.life;
    while ((travelSign > 0 ? x <= targetDx + halfWidth : x >= targetDx - halfWidth) &&
        y <= CFG.view.groundY && life > 0) {
      vy += CFG.aim.gravity * FIXED_DT;
      x += vx * FIXED_DT;
      y += vy * FIXED_DT;
      life -= FIXED_DT;
      if (Math.abs(x - targetDx) > halfWidth) continue;
      const error = Math.abs(y - targetY);
      if (error < bestError) {
        bestError = error;
        bestY = aimY;
      }
    }
  }
  return bestY;
}

function viewXOf(S, worldX) {
  return Math.round(Math.max(0, Math.min(CFG.view.w,
    CFG.view.playerScreenX + worldX - S.worldX)));
}

function targetBot() {
  let targetX = null;
  return (S, f) => {
    let target = S.targets.find(candidate => !candidate.hit && candidate.x === targetX);
    if (!target) {
      target = nearestTarget(S);
      targetX = target ? target.x : null;
    }

    let c = 0;
    const distance = target ? target.x - S.worldX : Infinity;
    if (!S.aiming && S.nock <= 0 && S.arrows.length === 0 &&
        target && distance <= 580 && distance >= 120) {
      c = 1;
    } else if (S.aiming && S.charge >= 0.65) {
      c = 2;
    }

    const ax = target ? viewXOf(S, target.x) : CFG.view.w;
    const ay = target
      ? (c === 2
        ? aimYForWorldPoint(S, target.x, target.y, CFG.target.w / 2, ax)
        : Math.round(target.y))
      : Math.round(CFG.view.groundY / 2);
    return { f, k: INPUT_KEY.D, ax, ay, c };
  };
}

function tapSpamBot() {
  return (S, f) => {
    let c = 0;
    if (S.tiger.state !== 'offstage') {
      if (!S.aiming && S.nock <= 0) c = 1;
      else if (S.aiming && S.charge >= CFG.aim.minCharge) c = 2;
    }
    const ax = viewXOf(S, S.tiger.x);
    const centerY = CFG.view.groundY - CFG.tiger.h / 2;
    const ay = c === 2
      ? aimYForWorldPoint(S, S.tiger.x, centerY, CFG.tiger.w / 2, ax)
      : Math.round(centerY);
    return { f, k: 0, ax, ay, c };
  };
}

function run(label, inputFor) {
  const S = createState(PROBE_SEED);
  S.phase = 'play';
  let damage = 0;
  let swings = 0;
  let whiffs = 0;
  let preEntryCombatFrames = 0;
  const swingGaps = [];

  for (let f = 0; f < RUN_FRAMES && S.phase === 'play'; f++) {
    const input = inputFor(S, f);
    const stateBefore = S.tiger.state;
    if (S.worldX < CFG.tiger.enterX && stateBefore !== 'offstage') preEntryCombatFrames++;
    updateSimulation(S, input);
    if (S.events.some(event => event.kind === 'claw')) damage++;
    if (stateBefore === 'windup' && S.tiger.state === 'swing') {
      const gap = Math.abs(gapOf(S));
      swings++;
      swingGaps.push(Math.round(gap));
      if (gap > CFG.tiger.reach) whiffs++;
    }
  }

  return {
    label, S, damage, swings, whiffs, swingGaps, preEntryCombatFrames,
    seconds: S.frame / 60
  };
}

const archer = run('과녁 봇', targetBot());
const tap = run('연사 봇', tapSpamBot());
const holdA = run('A 홀드', constantInput(INPUT_KEY.A));
const holdD = run('D 홀드', constantInput(INPUT_KEY.D));
const idle = run('무입력', constantInput(0));
const results = [archer, tap, holdA, holdD, idle];

console.table(results.map(result => ({
  '봇': result.label,
  '결과': result.S.phase === 'over' ? '사망' : '생존',
  '시간(초)': result.seconds.toFixed(1),
  'HP': result.S.player.hp,
  '피격': result.damage,
  '점수': result.S.score,
  '과녁': result.S.targetHits,
  '처치': result.S.kills,
  '스윙': result.swings,
  '헛스윙': result.whiffs,
  '헛스윙%': result.swings ? (result.whiffs / result.swings * 100).toFixed(1) : '0.0'
})));

const totalSwings = results.reduce((sum, result) => sum + result.swings, 0);
const totalWhiffs = results.reduce((sum, result) => sum + result.whiffs, 0);
const whiffRatio = totalSwings ? totalWhiffs / totalSwings : 0;
console.log(`전체 헛스윙: ${totalWhiffs}/${totalSwings} (${(whiffRatio * 100).toFixed(1)}%)`);
console.log(`A 홀드 windup→swing |gap|: [${holdA.swingGaps.join(', ')}] / reach ${CFG.tiger.reach}`);

const checks = [
  ['과녁 봇 최고점', results.every(result => result === archer || archer.S.score > result.S.score)],
  ['과녁 봇 점수 > D 홀드 점수', archer.S.score > holdD.S.score],
  ['연사 봇 점수 < 과녁 봇 점수', tap.S.score < archer.S.score],
  ['연사 봇 60초 무피해 생존 불가', tap.S.phase === 'over' || tap.damage > 0],
  ['A 홀드 사망 30~60초', holdA.S.phase === 'over' && holdA.seconds >= 30 && holdA.seconds <= 60],
  ['무입력 사망 30~60초', idle.S.phase === 'over' && idle.seconds >= 30 && idle.seconds <= 60],
  ['헛스윙 비율 10% 미만', whiffRatio < 0.10],
  ['난입 전 교전 0프레임', results.every(result => result.preEntryCombatFrames === 0)]
];

let failed = false;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
