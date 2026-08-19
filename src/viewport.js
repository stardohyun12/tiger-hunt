// CODEMAP
// role : 캔버스 크기/스케일과 좌표 변환
// 핵심 : initViewport(), toView()
// 의존 : config
// 연관 : input(마우스 좌표), main(렌더 컨텍스트)
// 주의 : 내부 해상도는 CFG.view 고정. 실제 크기는 CSS로만 늘린다.

import { CFG } from './config.js';

export const vp = { scale: 1, offX: 0, offY: 0, ctx: null, canvas: null };

export function initViewport(canvas) {
  vp.canvas = canvas;
  vp.ctx = canvas.getContext('2d');
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    vp.scale = Math.min(innerWidth / CFG.view.w, innerHeight / CFG.view.h);
    const w = CFG.view.w * vp.scale, h = CFG.view.h * vp.scale;
    vp.offX = (innerWidth - w) / 2;
    vp.offY = (innerHeight - h) / 2;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    vp.ctx.setTransform(vp.scale * dpr, 0, 0, vp.scale * dpr, 0, 0);
    vp.ctx.imageSmoothingEnabled = false;
  };
  addEventListener('resize', resize);
  resize();
  return vp.ctx;
}

export function toView(e) {
  return { x: (e.clientX - vp.offX) / vp.scale, y: (e.clientY - vp.offY) / vp.scale };
}
