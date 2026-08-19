// CODEMAP
// role : 키보드/포인터 입력 수집
// 핵심 : bindInput(), sampleInput(), touchActive()
// 의존 : config(키 비트), viewport(좌표 변환)
// 연관 : main이 논리 프레임마다 정수 입력 하나를 꺼내 sim에 전달
// 주의 : 입력은 여기서 '수집·양자화'만 한다. 게임 판단은 sim에서.
//        W=점프 S=수그리기 A=뒤로 D=앞으로 / 포인터=조준, 홀드=차지

import { CFG, INPUT_KEY } from './config.js';
import { toView } from './viewport.js';

const keys = new Set();
const mouse = { x: 300, y: 300, down: false };
const chargeChanges = [];
const pointerRoles = new Map();
let touchMode = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

function clampedView(e) {
  const p = toView(e);
  return {
    x: Math.max(0, Math.min(CFG.view.w, p.x)),
    y: Math.max(0, Math.min(CFG.view.h, p.y))
  };
}

function padAt(p, radius) {
  let best = -1;
  let bestDistance = radius * radius;
  for (let index = 0; index < CFG.touch.pads.length; index++) {
    const pad = CFG.touch.pads[index];
    const dx = p.x - pad.x;
    const dy = p.y - pad.y;
    const distance = dx * dx + dy * dy;
    if (distance <= bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

function releasePointers() {
  pointerRoles.clear();
  if (mouse.down) chargeChanges.push(2);
  mouse.down = false;
}

function finishPointer(e) {
  const role = pointerRoles.get(e.pointerId);
  if (!role) return;
  pointerRoles.delete(e.pointerId);
  if (role.kind !== 'aim') return;
  const p = clampedView(e);
  mouse.x = p.x;
  mouse.y = p.y;
  mouse.down = false;
  chargeChanges.push(2);
}

export function bindInput(_canvas, hooks) {
  addEventListener('keydown', (e) => {
    if (['KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (hooks.onAnyKey && hooks.onAnyKey(e) === true) return;
    keys.add(e.code);
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => {
    keys.clear();
    releasePointers();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    keys.clear();
    releasePointers();
  });

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch') touchMode = true;
    e.preventDefault();
    if (hooks.onPrimaryDown && hooks.onPrimaryDown() === true) return;

    const p = clampedView(e);
    const padIndex = e.pointerType === 'touch' ? padAt(p, CFG.touch.r) : -1;
    if (padIndex >= 0) {
      pointerRoles.set(e.pointerId, { kind: 'pad', padIndex });
      return;
    }
    if (mouse.down) return;

    mouse.x = p.x;
    mouse.y = p.y;
    mouse.down = true;
    pointerRoles.set(e.pointerId, { kind: 'aim' });
    chargeChanges.push(1);
  }, { passive: false });

  document.addEventListener('pointermove', (e) => {
    const role = pointerRoles.get(e.pointerId);
    if (!role) {
      if (e.pointerType !== 'touch') {
        const p = clampedView(e);
        mouse.x = p.x;
        mouse.y = p.y;
      }
      return;
    }
    e.preventDefault();
    const p = clampedView(e);
    if (role.kind === 'aim') {
      mouse.x = p.x;
      mouse.y = p.y;
      return;
    }
    role.padIndex = padAt(p, CFG.touch.r + CFG.touch.slack);
  }, { passive: false });

  document.addEventListener('pointerup', (e) => finishPointer(e), { passive: false });
  document.addEventListener('pointercancel', () => releasePointers(), { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function touchActive() {
  return touchMode;
}

export function touchKeyDown(key) {
  for (const role of pointerRoles.values()) {
    if (role.kind === 'pad' && role.padIndex >= 0 &&
        CFG.touch.pads[role.padIndex].key === key) return true;
  }
  return false;
}

export function sampleInput(frame) {
  let k = 0;
  if (keys.has('KeyW')) k |= INPUT_KEY.W;
  if (keys.has('KeyS')) k |= INPUT_KEY.S;
  if (keys.has('KeyA')) k |= INPUT_KEY.A;
  if (keys.has('KeyD')) k |= INPUT_KEY.D;
  for (const pad of CFG.touch.pads) {
    if (touchKeyDown(pad.key)) k |= INPUT_KEY[pad.key];
  }
  return {
    f: frame,
    k,
    ax: Math.round(mouse.x),
    ay: Math.round(mouse.y),
    c: chargeChanges.length ? chargeChanges.shift() : 0
  };
}
