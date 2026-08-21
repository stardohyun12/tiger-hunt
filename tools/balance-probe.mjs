// CODEMAP
// role : 밸런스 검산 — 입력 패턴별 생존·점수·난입 전 안전 구간
// 핵심 : node tools/balance-probe.mjs
// 의존 : src/state, src/sim, src/config, src/arrow (브라우저 API 없이 돈다)
// 연관 : 도망 점수보다 과녁을 노리는 플레이 점수가 높은지 수치로 판정한다
// 주의 : sim 만 돌린다. 렌더/입력 계층은 여기서 검증하지 않는다.

import { createState, gapOf } from '../src/state.js';
import { updateSimulation } from '../src/sim.js';
import { bowScreen } from '../src/arrow.js';
import { CFG, FIXED_DT, INPUT_KEY } from '../src/config.js';

const RUN_FRAMES = 60 * 60;

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

// 실제 고정 timestep 탄도를 한 칸씩 미리 적분해 과녁 중심에 가장 가까운 정수 조준점을 고른다.
function targetAimY(S, target, aimX) {
  const bow = bowScreen(S);
  const startX = S.worldX + bow.x - CFG.view.playerScreenX;
  const targetDx = target.x - startX;
  const charge = Math.min(S.charge / CFG.aim.chargeTime, 1);
  const power = CFG.aim.powerMin + (CFG.aim.powerMax - CFG.aim.powerMin) * charge;
  let bestY = target.y;
  let bestError = Infinity;

  for (let aimY = 0; aimY <= CFG.view.groundY; aimY++) {
    const dx = aimX - bow.x;
    const dy = aimY - bow.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length <= 0 || dx <= 0) continue;
    const vx = dx / length * power;
    let vy = dy / length * power;
    let x = 0;
    let y = bow.y;
    let life = CFG.aim.life;
    while (x < targetDx + CFG.target.w / 2 && y <= CFG.view.groundY && life > 0) {
      vy += CFG.aim.gravity * FIXED_DT;
      x += vx * FIXED_DT;
      y += vy * FIXED_DT;
      life -= FIXED_DT;
      if (Math.abs(x - targetDx) > CFG.target.w / 2) continue;
      const error = Math.abs(y - target.y);
      if (error < bestError) {
        bestError = error;
        bestY = aimY;
      }
    }
  }
  return bestY;
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
    if (!S.aiming && S.arrows.length === 0 && target && distance <= 580 && distance >= 120) {
      c = 1;
    } else if (S.aiming && S.charge >= 0.65) {
      c = 2;
    }

    const ax = target
      ? Math.round(CFG.view.playerScreenX + target.x - S.worldX)
      : CFG.view.w;
    const ay = target
      ? (c === 2 ? targetAimY(S, target, ax) : Math.round(target.y))
      : Math.round(CFG.view.groundY / 2);
    return { f, k: INPUT_KEY.D, ax, ay, c };
  };
}

function run(label, inputFor) {
  const S = createState(20260820);
  S.phase = 'play';
  let prevState = S.tiger.state;
  let rearWindup = 0, frontWindup = 0, overtakes = 0;
  let maxAbsGap = 0, maxTigerStep = 0, maxPlayerStep = 0;
  let gapMaxStreak = 0, longestGapMaxStreak = 0;
  let preEntryCombatFrames = 0;
  const hist = {};
  const clawGaps = [];

  for (let f = 0; f < RUN_FRAMES && S.phase === 'play'; f++) {
    const input = inputFor(S, f);
    const gapBefore = gapOf(S);
    const tigerXBefore = S.tiger.x;
    const worldXBefore = S.worldX;
    const stateBefore = S.tiger.state;
    if (S.worldX < CFG.tiger.enterX && stateBefore !== 'offstage') preEntryCombatFrames++;
    updateSimulation(S, input);
    const gapAfter = gapOf(S);
    maxPlayerStep = Math.max(maxPlayerStep, Math.abs(S.worldX - worldXBefore));
    if (S.tiger.state !== 'offstage') {
      maxAbsGap = Math.max(maxAbsGap, Math.abs(gapAfter));
      if (stateBefore !== 'offstage') {
        maxTigerStep = Math.max(maxTigerStep, Math.abs(S.tiger.x - tigerXBefore));
      }
      if (Math.abs(gapAfter) >= CFG.tiger.gapMax - 0.001) {
        gapMaxStreak++;
        longestGapMaxStreak = Math.max(longestGapMaxStreak, gapMaxStreak);
      } else {
        gapMaxStreak = 0;
      }
    }
    hist[S.tiger.state] = (hist[S.tiger.state] || 0) + 1;
    if (S.tiger.state !== prevState) {
      if (S.tiger.state === 'windup') (gapBefore > 0 ? rearWindup++ : frontWindup++);
      if (S.tiger.state === 'overtake') overtakes++;
      prevState = S.tiger.state;
    }
    if (S.events.some(event => event.kind === 'claw')) clawGaps.push(Math.round(gapBefore));
  }

  const total = Object.values(hist).reduce((a, b) => a + b, 0);
  const pct = Object.entries(hist).sort((a, b) => b[1] - a[1])
    .map(([state, count]) => `${state} ${(count / total * 100).toFixed(0)}%`).join(' · ');
  console.log(`[${label}] ${(S.frame / 60).toFixed(1)}s phase=${S.phase} score=${S.score}`);
  console.log(`   과녁: ${S.targetHits}명중 · 최고 ${S.bestCombo}콤보`);
  console.log(`   예고: 후방 ${rearWindup}회 / 전방 ${frontWindup}회 · 추월 ${overtakes}회`);
  console.log(`   발톱 gap: [${clawGaps.join(', ')}]`);
  console.log(`   이동: 최대 |gap| ${maxAbsGap.toFixed(3)}px · 사슴 ${maxPlayerStep.toFixed(6)}px/frame · 호랑이 ${maxTigerStep.toFixed(6)}px/frame · gapMax 최장 ${longestGapMaxStreak}f`);
  console.log(`   난입 전 교전: ${preEntryCombatFrames}f · 상태: ${pct}\n`);
  return { S, maxAbsGap, maxTigerStep, maxPlayerStep, preEntryCombatFrames };
}

const idle = run('무입력', constantInput(0));
const flee = run('D 홀드(전속)', constantInput(INPUT_KEY.D));
run('A 홀드(감속)', constantInput(INPUT_KEY.A));
run('D+S(수그려 전속)', constantInput(INPUT_KEY.D | INPUT_KEY.S));
const archer = run('과녁 조준 봇', targetBot());

const checks = [
  ['과녁 봇 점수 > D 홀드 점수', archer.S.score > flee.S.score],
  ['무입력 사망 30~60초', idle.S.phase === 'over' && idle.S.frame >= 30 * 60 && idle.S.frame <= 60 * 60],
  ['활성 호랑이 |gap| 제한', Math.max(flee.maxAbsGap, archer.maxAbsGap) <= CFG.tiger.gapMax + 0.001],
  ['프레임당 이동은 설정된 질주·넉백 이내',
    [idle, flee, archer].every(result =>
      result.maxPlayerStep <= CFG.tiger.clawKnockback + CFG.target.dashSpeed * FIXED_DT &&
      result.maxTigerStep <= CFG.tiger.overtakeSpeed * FIXED_DT + 0.001)],
  ['난입 전 교전 0프레임', [idle, flee, archer].every(result => result.preEntryCombatFrames === 0)]
];
let failed = false;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
