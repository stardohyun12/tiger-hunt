// CODEMAP
// role : 게임 상태 생성/초기화
// 핵심 : createState(), newTiger()
// 의존 : config
// 연관 : main(리셋), 모든 update 모듈이 이 형태를 전제로 동작
// 주의 : 상태는 전부 이 객체 하나에 모은다. 모듈 안에 지역 상태를 두지 말 것.

import { CFG } from './config.js';

export function newTiger(wave) {
  const hp = CFG.tiger.hp + CFG.tiger.hpPerWave * wave;
  return {
    hpMax: hp, hp,
    x: 0,
    chaseSpeed: CFG.tiger.chaseSpeed + CFG.tiger.chaseSpeedPerWave * wave,
    state: 'chase',   // chase | windup | swing | recover | cooldown
    timer: 0,
    zone: 'high',     // high | low  — 이번 스윙이 노리는 높이
    swung: false
  };
}

export function createState() {
  const t = newTiger(0);
  const S = {
    phase: 'title',            // title | play | over
    t: 0, worldX: 0, wave: 0, kills: 0,

    player: {
      y: 0, vy: 0, grounded: true, crouch: false,
      hp: CFG.player.hp, invuln: 0, stumble: 0, speed: CFG.player.speedBase
    },
    tiger: t,

    aiming: false, charge: 0, aimDir: { x: -1, y: -0.2 },
    arrows: [], obstacles: [], nextObsX: 1000,

    hitstop: 0, trauma: 0
  };
  t.x = -CFG.tiger.gapStart;
  return S;
}

export const gapOf = (S) => S.worldX - S.tiger.x;
