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

  // 호랑이. 평소에는 뒤에서 교전하고, 실제로 따라잡았을 때만 추월해 앞을 막는다.
  tiger: {
    w: 120, h: 74,
    chaseSpeed: 245, chaseSpeedPerWave: 14,
    overtakeSpeed: 430,
    blockSpeed: 250,
    approachSpeed: 115,
    aheadChaseFrac: 0.7,
    hp: 110, hpPerWave: 60,
    gapStart: 380, gapMax: 620,
    engageGap: 175,         // 후방에서 앞발 공격을 예고하기 시작하는 거리
    disengageGap: 255,      // 이보다 멀어지면 다시 추격
    standoffGap: 115,       // 후방 교전 중 앞발 사거리를 유지하는 최소 거리
    blockGap: 210,
    bodyGap: 95,
    turnTime: 0.35,
    windup: 0.50,           // 빨간 예고 시간
    swing: 0.16,            // 판정 프레임
    recover: 0.75,          // 빈틈 (피해 배율 적용 구간)
    cooldown: 0.40,
    cooldownRear: 12,       // 후방 연타 간격 — 무입력 생존 시간을 35~60초로 유지
    reach: 195,
    overtakeDmgMul: 1.5,
    recoverDmgMul: 2.0,
    clawKnockback: 130,
    clawKnockbackRear: 45
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

  touch: {
    r: 50,
    slack: 24,
    pressedGrow: 4,
    fillAlpha: 0.16,
    strokeAlpha: 0.55,
    pressedAlpha: 0.45,
    lineWidth: 2,
    labelFont: '800 15px system-ui',
    aimMark: { r: 9, arm: 5, lineWidth: 2 },
    title: { y: 270, lineGap: 54, font: '750 17px system-ui' },
    pads: [
      { key: 'S', label: '수그림', x: 770, y: 368 },
      { key: 'W', label: '점프',   x: 884, y: 368 },
      { key: 'A', label: '뒤',     x: 770, y: 478 },
      { key: 'D', label: '앞',     x: 884, y: 478 }
    ]
  },

  obs: {
    gapMin: 540, gapMax: 1020, w: 48,
    rockMin: 40, rockMax: 70,
    branchClearY: 66        // 이 높이보다 낮아야(수그려야) 통과
  },

  // 렌더 전용 골격. 보폭은 월드 거리 기반이며 다리 길이는 2본 IK로 보존한다.
  rig: {
    deer: {
      lift: 10, bodyRy: 19,
      strideLen: 72, duty: 0.6, liftMax: 16, footInset: 2,
      hipY: 54, legX: [-30, -13, 16, 32],
      legOffset: [0, 0.5, 0.5, 0],
      thigh: [32, 29, 29, 32], shin: [29, 29, 29, 29],
      bend: [1, 1, 1, 1],
      legWidth: 7, hoofWidth: 4, hoofHalf: 5,
      shadowRx: 47, shadowRy: 8, shadowAlpha: 0.22,
      shadowMinScale: 0.48, shadowMinAlpha: 0.18, shadowHeight: 180,
      dustPhase: 0.11, dustCount: 3, dustSpread: 17,
      dustLift: 9, dustRadius: 2.4, dustAlpha: 0.34
    },
    tiger: {
      lift: 7, bodyRy: 22,
      strideLen: 68, duty: 0.6, liftMax: 13, footInset: 2,
      hipY: 49, legX: [-38, -18, 18, 38],
      legOffset: [0.5, 0.6, 0, 0.1],
      thigh: [29, 29, 26, 26], shin: [27, 27, 27, 27],
      bend: [1, 1, 1, 1], frontStart: 2, attackLeg: 3,
      legWidth: 10, pawWidth: 7, pawHalf: 6,
      shadowRx: 55, shadowRy: 9, shadowAlpha: 0.22,
      dustPhase: 0.09, dustCount: 3, dustSpread: 19,
      dustLift: 8, dustRadius: 2.7, dustAlpha: 0.32
    },
    rider: {
      bounce: 2,
      shoulderXStand: -5, shoulderXCrouch: -2,
      shoulderYStand: 82, shoulderYCrouch: 62,
      hipXStand: -12, hipXCrouch: -18, hipY: 55,
      headXStand: -6, headXCrouch: -15,
      headYStand: 99, headYCrouch: 75,
      kneeX: 4, kneeY: 50, footX: 14, footY: 43,
      torsoWidth: 10, limbWidth: 6, headR: 10
    },
    ikMinDistance: 0.001, ikReachInset: 0.01,
    dustSeedA: 37, dustSeedB: 17, dustModulus: 101,
    dustStartScale: 0.35, dustEndScale: 0.65,
    dustRadiusMin: 0.7, dustRadiusRange: 0.5
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
