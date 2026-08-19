// CODEMAP
// role : 진입점 — 루프와 모듈 배선
// 핵심 : frame(), 리셋/시작 처리
// 의존 : 전 모듈
// 연관 : index.html이 이 파일 하나만 로드한다
// 주의 : hitstop 동안 update를 건너뛰되 render는 계속 돈다. 순서를 바꾸지 말 것.

import { CFG, FIXED_DT, FIXED_STEPS_MAX } from './config.js';
import { createState } from './state.js';
import { initViewport } from './viewport.js';
import { bindInput, sampleInput } from './input.js';
import { updateSimulation } from './sim.js';
import { record } from './replay.js';
import { decayFx, triggerFx } from './fx.js';
import { render } from './render.js';

const canvas = document.getElementById('cv');
const ctx = initViewport(canvas);
const BEST_SCORE_KEY = 'tiger-chase-best-score-v1';

function dailySeed() {
  const date = new Date();
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

const seed = dailySeed();
let S = createState(seed);

function loadBestScore() {
  try {
    const value = Number(localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // 저장소가 차단된 환경에서도 게임 진행은 유지한다.
  }
}

S.bestScore = loadBestScore();

function resetState(phase) {
  const bestScore = S.bestScore;
  S = createState(seed);
  S.bestScore = bestScore;
  S.phase = phase;
}

function restartIfNeeded() {
  if (S.phase === 'play') return false;
  resetState('play');
  return true;
}

// 재시작은 스페이스/엔터/좌클릭으로만. 이동키로 실수 리셋되는 걸 막는다.
bindInput(canvas, {
  onAnyKey: (e) => (e.code === 'Space' || e.code === 'Enter') && restartIfNeeded(),
  onPrimaryDown: () => restartIfNeeded()
});

function applyPresentationFx(advanced) {
  for (const event of S.events) triggerFx(S, CFG.fx[event.kind]);
  decayFx(S, FIXED_DT * (advanced ? 1 : 0.4));
}

function finishRun() {
  S.isNewBest = S.score > S.bestScore;
  if (!S.isNewBest) return;
  S.bestScore = S.score;
  saveBestScore(S.bestScore);
}

function updatePlay() {
  const input = sampleInput(S.frame);
  record(S, input);
  const advanced = updateSimulation(S, input);
  applyPresentationFx(advanced);
  if (S.phase === 'over') finishRun();
}

function updateTitleDemo() {
  const input = { f: S.frame, k: 0, ax: 0, ay: 0, c: 0 };
  const advanced = updateSimulation(S, input);
  applyPresentationFx(advanced);
  if (S.phase === 'over') resetState('title');
}

let last = performance.now();
let accumulator = 0;
function frame(now) {
  const elapsed = Math.min((now - last) / 1000, FIXED_DT * FIXED_STEPS_MAX);
  last = now;
  accumulator = Math.min(accumulator + elapsed, FIXED_DT * FIXED_STEPS_MAX);
  while (accumulator >= FIXED_DT) {
    if (S.phase === 'play') updatePlay();
    else if (S.phase === 'title') updateTitleDemo();
    accumulator -= FIXED_DT;
  }
  render(ctx, S);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
