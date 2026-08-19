// CODEMAP
// role : 키보드/마우스 입력 수집
// 핵심 : keys(Set), mouse{x,y,down}, bindInput()
// 의존 : viewport(좌표 변환)
// 연관 : player(WASD), arrow(마우스 조준/차지)
// 주의 : 입력은 여기서 '수집'만 한다. 게임 판단은 player/arrow 쪽에서.
//        W=점프 S=수그리기 A=뒤로 D=앞으로 / 마우스=조준, 좌클릭 홀드=차지

import { toView } from './viewport.js';

export const keys = new Set();
export const mouse = { x: 300, y: 300, down: false };

export function bindInput(canvas, hooks) {
  addEventListener('keydown', (e) => {
    if (['KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (hooks.onAnyKey && hooks.onAnyKey(e) === true) return;
    keys.add(e.code);
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => { keys.clear(); mouse.down = false; });

  canvas.addEventListener('mousemove', (e) => {
    const p = toView(e); mouse.x = p.x; mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (hooks.onPrimaryDown && hooks.onPrimaryDown() === true) return;
    mouse.down = true;
  });
  addEventListener('mouseup', (e) => {
    if (e.button !== 0 || !mouse.down) return;
    mouse.down = false;
    if (hooks.onPrimaryUp) hooks.onPrimaryUp();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

export const held = (code) => keys.has(code);
