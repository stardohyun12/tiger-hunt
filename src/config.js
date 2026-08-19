// CODEMAP
// role : 전 튜닝값의 단일 출처
// 핵심 : CFG(수치) / C(색상)
// 의존 : 없음
// 연관 : 모든 모듈이 여기서만 숫자를 읽는다
// 주의 : 다른 파일에 숫자를 하드코딩하지 말 것. 감각 튜닝은 전부 이 파일에서만.

export const FIXED_DT = 1 / 60;
export const FIXED_STEPS_MAX = 5;

export const INPUT_KEY = {
  W: 1,
  S: 2,
  A: 4,
  D: 8
};

export const CFG = {
  view: { w: 960, h: 540, groundY: 420, playerScreenX: 480 },

  // 사슴+기수. speedBack < tiger.chaseSpeed 여야 A키로 뒤로 붙을 수 있다.
  player: {
    w: 70, h: 96, crouchH: 52,
    speedBase: 250, speedFwd: 340, speedBack: 120,
    aimMul: 0.55, crouchMul: 0.72, // crouchMul은 현재 사용 안 함
    stumbleMul: 0.35, stumbleTime: 0.6,
    jumpV: 660, gravity: 1900,
    airClearY: 58,          // 이 높이 위면 하단 후려치기를 넘긴다
    hp: 3, invuln: 1.2
  },

  // 호랑이. 뒤에서 추격한 뒤 추월해 앞을 막고 교전한다.
  tiger: {
    w: 120, h: 74,
    chaseSpeed: 245, chaseSpeedPerWave: 14,
    overtakeSpeed: 430,
    blockSpeed: 250,
    approachSpeed: 115,
    aheadChaseMul: 0.7,
    hp: 110, hpPerWave: 60,
    gapStart: 380, gapMax: 620,
    engageGap: 175,         // 이보다 가까우면 멈춰서 공격
    disengageGap: 255,      // 이보다 멀어지면 다시 추격
    blockGap: 210,
    bodyGap: 95,
    turnTime: 0.35,
    windup: 0.50,           // 빨간 예고 시간
    swing: 0.16,            // 판정 프레임
    recover: 0.75,          // 빈틈 (피해 배율 적용 구간)
    cooldown: 0.40,
    reach: 195,
    overtakeDmgMul: 1.5,
    recoverDmgMul: 2.0,
    clawKnockback: 130
  },

  aim: {
    chargeTime: 1.0,
    powerMin: 620, powerMax: 1180,
    dmgMin: 9, dmgMax: 32,
    pushMin: 20, pushMax: 150,
    gravity: 820, life: 2.4,
    strongCharge: 0.6
  },

  score: {
    distancePx: 10,
    meterPx: 50,
    hit: 25,
    strongHit: 60,
    kill: 500
  },

  obs: {
    gapMin: 540, gapMax: 1020, w: 48,
    rockMin: 40, rockMax: 70,
    branchClearY: 66        // 이 높이보다 낮아야(수그려야) 통과
  },

  // [hitstop(초), trauma(0~1), 진동(ms)]
  fx: {
    hitWeak:   [0.04, 0.18, 0],
    hitStrong: [0.09, 0.40, 0],
    kill:      [0.18, 0.70, 0],
    stumble:   [0.03, 0.22, 0],
    claw:      [0.12, 0.60, 0],
    traumaDecay: 2.6, shakeMax: 24
  }
};

export const C = {
  paper:'#E8DCC0', ink:'#2B2320', ochre:'#C8862A', vermilion:'#B03A2E',
  bg:'#12101a', sky:'#1b1726', ground:'#2b2434', groundLine:'#3d3350',
  player:'#e9dcc4', rider:'#f4f2ec',
  tiger:'#e0742f', tigerDark:'#a44d18', tigerVuln:'#ffd166',
  arrow:'#ffe9b0', obs:'#4a3d58', branch:'#5a4a3a',
  hud:'#f2f0ea', hudDim:'#7d7288',
  aim:'#7fe3d4', danger:'#ff4d4d', telegraph:'#ff2e2e', charge:'#ffd166'
};
