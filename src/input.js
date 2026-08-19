// CODEMAP
// role : 키보드/마우스 입력 수집
// 핵심 : bindInput(), sampleInput()
// 의존 : config(키 비트), viewport(좌표 변환)
// 연관 : main이 논리 프레임마다 정수 입력 하나를 꺼내 sim에 전달
// 주의 : 입력은 여기서 '수집·양자화'만 한다. 게임 판단은 sim에서.
//        W=점프 S=수그리기 A=뒤로 D=앞으로 / 마우스=조준, 좌클릭 홀드=차지

import { INPUT_KEY } from './config.js';
import { toView } from './viewport.js';

const keys = new Set();
const mouse = { x: 300, y: 300, down: false };
const chargeChanges = [];

export function bindInput(canvas, hooks) {
  addEventListener('keydown', (e) => {
    if (['KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (hooks.onAnyKey && hooks.onAnyKey(e) === true) return;
    keys.add(e.code);
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => {
    keys.clear();
    if (mouse.down) chargeChanges.push(2);
    mouse.down = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const p = toView(e); mouse.x = p.x; mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (hooks.onPrimaryDown && hooks.onPrimaryDown() === true) return;
    mouse.down = true;
    chargeChanges.push(1);
  });
  addEventListener('mouseup', (e) => {
    if (e.button !== 0 || !mouse.down) return;
    mouse.down = false;
    chargeChanges.push(2);
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function sampleInput(frame) {
  let k = 0;
  if (keys.has('KeyW')) k |= INPUT_KEY.W;
  if (keys.has('KeyS')) k |= INPUT_KEY.S;
  if (keys.has('KeyA')) k |= INPUT_KEY.A;
  if (keys.has('KeyD')) k |= INPUT_KEY.D;
  return {
    f: frame,
    k,
    ax: Math.round(mouse.x),
    ay: Math.round(mouse.y),
    c: chargeChanges.length ? chargeChanges.shift() : 0
  };
}
