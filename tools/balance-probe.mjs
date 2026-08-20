// CODEMAP
// role : 밸런스 검산 — 입력 패턴별 상태 히스토그램·교전 빈도·생존 시간
// 핵심 : node tools/balance-probe.mjs
// 의존 : src/state, src/sim, src/config (브라우저 API 없이 돈다)
// 연관 : Codex 산출물을 Claude 가 검산할 때 쓴다. 말이 아니라 수치로 판정한다.
// 주의 : sim 만 돌린다. 렌더/입력 계층은 여기서 검증하지 않는다.

import { createState, gapOf } from '../src/state.js';
import { updateSimulation } from '../src/sim.js';
import { CFG, INPUT_KEY } from '../src/config.js';

function run(label, k) {
  const S = createState(20260820);
  S.phase = 'play';
  const input = { f: 0, k, ax: 300, ay: 300, c: 0 };
  let prevState = S.tiger.state;
  let rearWindup = 0, frontWindup = 0, overtakes = 0;
  let maxAbsGap = 0, maxTigerStep = 0;
  let gapMaxStreak = 0, longestGapMaxStreak = 0;
  const hist = {};
  const clawGaps = [];
  for (let f = 0; f < 60 * 60 && S.phase === 'play'; f++) {
    input.f = f;
    const gapBefore = gapOf(S);
    const tigerXBefore = S.tiger.x;
    updateSimulation(S, input);
    const gapAfter = gapOf(S);
    maxAbsGap = Math.max(maxAbsGap, Math.abs(gapAfter));
    maxTigerStep = Math.max(maxTigerStep, Math.abs(S.tiger.x - tigerXBefore));
    if (Math.abs(gapAfter) >= CFG.tiger.gapMax - 0.001) {
      gapMaxStreak++;
      longestGapMaxStreak = Math.max(longestGapMaxStreak, gapMaxStreak);
    } else {
      gapMaxStreak = 0;
    }
    hist[S.tiger.state] = (hist[S.tiger.state] || 0) + 1;
    if (S.tiger.state !== prevState) {
      if (S.tiger.state === 'windup') (gapBefore > 0 ? rearWindup++ : frontWindup++);
      if (S.tiger.state === 'overtake') overtakes++;
      prevState = S.tiger.state;
    }
    if (S.events.some(e => e.kind === 'claw')) clawGaps.push(Math.round(gapBefore));
  }
  const total = Object.values(hist).reduce((a, b) => a + b, 0);
  const pct = Object.entries(hist).sort((a,b)=>b[1]-a[1])
    .map(([s, n]) => `${s} ${(n/total*100).toFixed(0)}%`).join(' · ');
  console.log(`[${label}] ${(S.frame/60).toFixed(1)}s phase=${S.phase} score=${S.score}`);
  console.log(`   예고: 후방 ${rearWindup}회 / 전방 ${frontWindup}회 · 추월 ${overtakes}회`);
  console.log(`   발톱 gap: [${clawGaps.join(', ')}]`);
  console.log(`   이동: 최대 |gap| ${maxAbsGap.toFixed(3)}px · 호랑이 최대 ${maxTigerStep.toFixed(6)}px/frame · gapMax 최장 ${longestGapMaxStreak}f`);
  console.log(`   상태: ${pct}\n`);
}

run('무입력', 0);
run('D 홀드(전속)', INPUT_KEY.D);
run('A 홀드(감속)', INPUT_KEY.A);
run('D+S(수그려 전속)', INPUT_KEY.D | INPUT_KEY.S);
