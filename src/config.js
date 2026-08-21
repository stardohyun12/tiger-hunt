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
    r: 48,
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
      { key: 'A', label: '뒤',     x: 78,  y: 478 },
      { key: 'D', label: '앞',     x: 188, y: 478 },
      { key: 'W', label: '점프',   x: 884, y: 368 },
      { key: 'S', label: '수그림', x: 884, y: 478 }
    ]
  },

  obs: {
    gapMin: 540, gapMax: 1020, w: 48,
    rockMin: 40, rockMax: 70,
    branchClearY: 66        // 이 높이보다 낮아야(수그려야) 통과
  },

  // 렌더 전용 픽셀 아트. X=주색, o=보조색, .=투명.
  art: {
    px: 3,
    stridePx: 30,
    flashFrames: 2,
    blinkFps: 22,
    scene: {
      overscan: 42,
      ridgeFloor: 0,
      farStep: 1200, farSpeed: 0.12, farBaseY: 390, farBlockW: 6,
      farRidges: [
        { x: 90, h: 144, spread: 1180 },
        { x: 310, h: 225, spread: 1420 },
        { x: 555, h: 132, spread: 920 },
        { x: 760, h: 174, spread: 1160 },
        { x: 1010, h: 126, spread: 880 }
      ],
      midStep: 960, midSpeed: 0.28, midBaseY: 420, midBlockW: 6,
      midRidges: [
        { x: 40, h: 138, spread: 760 },
        { x: 185, h: 192, spread: 820 },
        { x: 365, h: 258, spread: 980 },
        { x: 555, h: 171, spread: 720 },
        { x: 710, h: 222, spread: 860 },
        { x: 875, h: 150, spread: 700 }
      ],
      cloudStep: 360, cloudSpeed: 0.06, cloudY: 84,
      cloudBlocks: [0, 15, 9, 24, 3, 30, 12, 21],
      groundLineH: 6,
      groundMarkStep: 96, groundDashW: 18, groundDashH: 3,
      groundDot: 3, groundRowA: 438, groundRowB: 459
    },
    shadow: {
      h: 6, playerW: 72, tigerW: 108,
      minScale: 0.42, height: 180,
      groundAlpha: 0.26, airAlpha: 0.10
    },
    dust: {
      cycle: 42, phaseStep: 14, size: 3,
      playerX: -39, tigerX: -57,
      spread: 12, lift: 12, alpha: 0.30
    },
    telegraph: {
      highY: 276, highH: 108,
      lowY: 366, lowH: 54,
      cells: 8, cellGap: 3, outline: 3, capH: 6,
      urgentStart: 0.8, urgentBlinkFrames: 2,
      markerHighY: 342, markerLowY: 399,
      markerW: 24, markerH: 12, markerLine: 3
    },
    bow: {
      halfH: 21, curve: 16, lineW: 6,
      restX: -1, restY: 0, aimBack: 17, aimFront: 22
    },
    arrow: { cells: 7, cell: 3, spacing: 3 },
    aim: { step: 0.052, dots: 14, dot: 5, fade: 0.62, markR: 9, markArm: 5, lineW: 2 },
    tigerBar: { yGap: 18, w: 120, h: 7, border: 2 },
    hud: {
      heartX: 24, heartY: 21, heartGap: 39, heartPx: 3,
      scoreX: 28, scoreY: 48, scoreSubY: 70,
      chargeW: 280, chargeH: 14, chargeY: 38, chargeLabelGap: 8,
      panelAlpha: 0.82, paperAlpha: 0.97, washAlpha: 0.10,
      fontScore: '900 36px system-ui', fontSmall: '800 14px system-ui',
      fontCharge: '800 13px system-ui', tracking: '1.5px'
    },
    overlay: {
      titlePanelX: 80, titlePanelY: 28, titlePanelW: 800, titlePanelH: 484,
      inset: 11, border: 4,
      titleY: 94, subtitleY: 124, warningX: 125, warningY: 145,
      warningW: 710, warningH: 48, warningTextY: 175,
      controlsTitleY: 225, controlLeftX: 140, controlRightX: 500,
      controlY: 242, controlGapY: 56, controlW: 320, controlH: 44,
      keyX: 8, keyY: 7, keyW: 82, keyH: 30,
      keyTextX: 49, keyTextY: 27, labelX: 106, labelY: 28,
      actionX: 280, actionY: 435, actionW: 400, actionH: 44, actionTextY: 463,
      overPanelX: 250, overPanelY: 42, overPanelW: 460, overPanelH: 456,
      overTitleY: 112, overLabelY: 149, overScoreY: 209,
      overStatLeftX: 380, overStatRightX: 580, overStatLabelY: 251, overStatY: 282,
      bestX: 310, bestY: 313, bestW: 340, bestH: 76,
      bestLabelY: 340, bestScoreY: 374,
      retryX: 330, retryY: 417, retryW: 300, retryH: 44, retryTextY: 445,
      fontTitle: '900 49px system-ui', fontSubtitle: '800 17px system-ui',
      fontWarning: '800 14px system-ui', fontControlTitle: '900 17px system-ui',
      fontKey: '900 14px system-ui', fontLabel: '750 15px system-ui',
      fontAction: '900 18px system-ui', fontOverTitle: '900 42px system-ui',
      fontOverLabel: '800 15px system-ui', fontOverScore: '900 58px system-ui',
      fontStat: '900 26px system-ui', fontBest: '900 28px system-ui', tracking: '2px'
    },
    sprites: {
      deerRunA: [
        '.........XXXXX..........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '.........XXXXX..........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '........XXXXXXXX........',
        '........XXXXXXXX....X.X.',
        '........XXXXXXXX...XXX..',
        '.......XXX.XXXXX..XXXXX.',
        '......XXXXXXXX...XXXXXXX',
        '........XXXXXX..XXXXXXXX',
        '.........XXXX..XXXXXXXXX',
        '...XXXXXXXXXXXXXXXXXXX..',
        '.XXXXXXXXXXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXXXXXXXXXXX',
        '..XXXXXXXXXXXXXXXXXXXXXX',
        '...XXXXXXXXXXXXXXXXXXXXX',
        '....XXXXXXXXXXXX.XXXXXXX',
        '.....XXXXXXXXXX...XXXXX.',
        '....XXX..XXX....XXX.XXX.',
        '....XXX..XXX....XXX.XXX.',
        '....XX...XX.....XX..XX..',
        '...XX....XX....XX...XX..',
        '..XX.....XX...XX....XX..',
        '.XX......XX..XX.....XX..',
        'XX.......XXXX........XX.',
        'XX........XX.........XX.',
        'XXX.......XXX........XXX',
        'XXXX......XXXX......XXXX'
      ],
      deerRunB: [
        '.........XXXXX..........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '.........XXXXX..........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '........XXXXXXXX........',
        '........XXXXXXXX....X.X.',
        '........XXXXXXXX...XXX..',
        '.......XXX.XXXXX..XXXXX.',
        '......XXXXXXXX...XXXXXXX',
        '........XXXXXX..XXXXXXXX',
        '.........XXXX..XXXXXXXXX',
        '...XXXXXXXXXXXXXXXXXXX..',
        '.XXXXXXXXXXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXXXXXXXXXXX',
        '..XXXXXXXXXXXXXXXXXXXXXX',
        '...XXXXXXXXXXXXXXXXXXXXX',
        '....XXXXXXXXXXXX.XXXXXXX',
        '.....XXXXXXXXXX...XXXXX.',
        '....XXX..XXX....XXX.XXX.',
        '.....XX.XX.....XX.XX....',
        '......XXXX.....XXXX.....',
        '......XX.XX...XX.XX.....',
        '......XX..XX.XX..XX.....',
        '......XX...XXX...XX.....',
        '......XX...XXX...XX.....',
        '.....XXX...XXX...XXX....',
        '....XXXX...XXX...XXXX...',
        '...XXXXX...XXX...XXXXX..'
      ],
      deerCrouch: [
        '.........XXXXX..........',
        '........XXXXXXX.........',
        '.........XXXXX..........',
        '........XXXXXXX.........',
        '........XXXXXXXX....X.X.',
        '.......XXX.XXXXX...XXX..',
        '..XXXXXXXXXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXXXXXXXXXXX',
        '.XXXXXXXXXXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXXXXXXXXXXX',
        '..XXXXXXXXXXXXXX.XXXXXXX',
        '...XXXXXXXXXXXX...XXXXXX',
        '....XXX..XXX....XXX.XXX.',
        '....XX...XX.....XX..XX..',
        '...XX....XX....XX...XX..',
        '..XXX....XXX...XXX..XXX.',
        '.XXXX....XXXX..XXXX.XXXX',
        'XXXXX....XXXX..XXXX.XXXX'
      ],
      deerJump: [
        '.........XXXXX..........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '.........XXXXX..........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '........XXXXXXX.........',
        '........XXXXXXXX........',
        '........XXXXXXXX....X.X.',
        '........XXXXXXXX...XXX..',
        '.......XXX.XXXXX..XXXXX.',
        '......XXXXXXXX...XXXXXXX',
        '........XXXXXX..XXXXXXXX',
        '.........XXXX..XXXXXXXXX',
        '...XXXXXXXXXXXXXXXXXXX..',
        '.XXXXXXXXXXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXXXXXXXXXXX',
        '..XXXXXXXXXXXXXXXXXXXXXX',
        '...XXXXXXXXXXXXXXXXXXXXX',
        '....XXXXXXXXXXXX.XXXXXXX',
        '.....XXXXX..XXXX..XXXXX.',
        '....XXXX....XXXX....XXXX',
        '....XXX.....XXXX.....XXX',
        '.....XXX....XXXX....XXX.',
        '......XXXX..XXXX..XXXX..',
        '.......XXXXXXXXXXXXXX...',
        '........XXXX....XXXX....'
      ],
      tigerRunA: [
        '...............................XX..XX...',
        '...............................XXXXXX...',
        '..............................XXXXXXXX..',
        '.............................XXXXXXXXXX.',
        '............................XXXXXXXXXXXX',
        '............................XXXXXXXXXXXX',
        '....XXX....................XXXXXXXXXXXXX',
        '...XXXXX...............XXXXXXXXXXXXXXXXX',
        '..XXXXXX.........XXXXXXXXXXXXXXXXXXXXXXX',
        '.XXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '..XXXXXXXXXXXXXXooXXXXooXXXXXXXXXXXXXXXX',
        '...XXXXXXXXXXXXXooXXXXooXXXXXXXXXXXXXXXX',
        '....XXXXXXXXXXooXXXXooXXXXooXXXXXXXXXXXX',
        '.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '......XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '....XXXX..XXXX........XXXX..XXXX........',
        '....XXX...XXX.........XXX...XXX.........',
        '...XXX....XXX........XXX....XXX.........',
        '..XXX.....XXX.......XXX.....XXX.........',
        '.XXX......XXX......XXX......XXX.........',
        'XXX.......XXXX....XXXX.......XXXX.......',
        'XXXX......XXXX....XXXX......XXXX........'
      ],
      tigerRunB: [
        '...............................XX..XX...',
        '...............................XXXXXX...',
        '..............................XXXXXXXX..',
        '.............................XXXXXXXXXX.',
        '............................XXXXXXXXXXXX',
        '............................XXXXXXXXXXXX',
        '....XXX....................XXXXXXXXXXXXX',
        '...XXXXX...............XXXXXXXXXXXXXXXXX',
        '..XXXXXX.........XXXXXXXXXXXXXXXXXXXXXXX',
        '.XXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '..XXXXXXXXXXXXXXooXXXXooXXXXXXXXXXXXXXXX',
        '...XXXXXXXXXXXXXooXXXXooXXXXXXXXXXXXXXXX',
        '....XXXXXXXXXXooXXXXooXXXXooXXXXXXXXXXXX',
        '.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '......XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '....XXXX..XXXX........XXXX..XXXX........',
        '.....XXX.XXX..........XXX.XXX...........',
        '......XXXXX............XXXXX............',
        '......XX.XXX..........XXX.XX............',
        '......XX..XXX........XXX..XX............',
        '......XX...XXXX....XXXX...XX............',
        '.....XXX...XXXX....XXXX...XXX...........'
      ],
      tigerBrace: [
        '.........................XX..XX.........',
        '........................XXXXXXXX........',
        '.......................XXXXXXXXXX.......',
        '......................XXXXXXXXXXXX......',
        '.......................XXXXXXXXXX.......',
        '.........................XXXXXX.........',
        '.....XX..................XXXXXX.........',
        '....XXXX...............XXXXXXXXXX.......',
        '...XXXXXX.........XXXXXXXXXXXXXXXXX.....',
        '..XXXXXX.......XXXXXXXXXXXXXXXXXXXXX....',
        '.XXXXXX.....XXXXXXXXXXXXXXXXXXXXXXXXX...',
        'XXXXXX..XXXXXXXXXXXXXXXXXXXXXXXXXXXXX...',
        '.XXXX.XXXXXXXXooXXXXXooXXXXXXooXXXXXX...',
        '..XX..XXXXXXooXXXXXooXXXXXXooXXXXXXX....',
        '...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.....',
        '.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXX......',
        '.......XXXXXXXXXXXXXXXXXXXXXXXXX........',
        '........XXXXX..XXXXX...XXXXX..XXXX......',
        '........XXXX...XXXX....XXXX...XXXX......',
        '.......XXXX....XXXX.....XXXX..XXXX......',
        '......XXXX....XXXX......XXXX...XXXX.....',
        '.....XXXX.....XXXX.......XXXX..XXXX.....',
        '....XXXX.....XXXX........XXXX...XXXX....',
        '...XXXXX.....XXXXX........XXXXX.XXXXX...',
        '..XXXXXX....XXXXXX........XXXXXX.XXXXXX.'
      ],
      tigerWindup: [
        '....XX...............XX.................',
        '...XXX..............XXXX................',
        '..XXX..............XXXXX..........XX..XX',
        '.XXX...............XXXXXX........XXXXXXX',
        '.XXX................XXXXXX......XXXXXXXX',
        '.XX..................XXXXXX....XXXXXXXXX',
        '.XX...................XXXXXX...XXXXXXXXX',
        '..XX...................XXXXXX..XXXXXXXXX',
        '...XX.....XXXXXXXXXXXXXXX..XXX..XXXXXXXX',
        '....XX..XXXXXXXXXXXXXXXXXXX.XXX..XXXXXXX',
        '.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '.....XXXXXXXXooXXXXXXXooXXXXXXXooXXX....',
        '.....XXXXXXXooXXXXXXooXXXXXXooXXXXX.....',
        '......XXXXXXXXXooXXXXXXXooXXXXXXXX......',
        '.......XXXXXXXXXXXXXXXXXXXXXXXXXX.......',
        '........XXXXXXXXXXXXXXXXXXXXXXXX........',
        '.........XXXXXXXXXXXXXXXXXXXXXX.........',
        '.......XXXX...XXXX.....XXXX...XXXX......',
        '.......XXXX...XXXX.....XXXX...XXXX......',
        '......XXXX....XXXX......XXXX...XXXX.....',
        '.....XXXX....XXXX........XXXX...XXXX....',
        '....XXXX....XXXX..........XXXX...XXXX...',
        '...XXXX....XXXX............XXXX...XXXX..',
        '..XXXXX...XXXXX.............XXXXX..XXXXX'
      ],
      tigerSwing: [
        '....XX..................................',
        '...XXX..................................',
        '..XXX.............................XX..XX',
        '.XXX.............................XXXXXXX',
        '.XXX............................XXXXXXXX',
        '.XX............................XXXXXXXXX',
        '.XX............................XXXXXXXXX',
        '..XX...........................XXXXXXXXX',
        '...XX.....XXXXXXXXXXXXXXX.......XXXXXXXX',
        '....XX..XXXXXXXXXXXXXXXXXXX......XXXXXXX',
        '.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        '.....XXXXXXXXooXXXXXXXooXXXXXXXooXXX..XX',
        '.....XXXXXXXooXXXXXXooXXXXXXooXXXXX..XXX',
        '......XXXXXXXXXooXXXXXXXooXXXXXXXX..XXXX',
        '.......XXXXXXXXXXXXXXXXXXXXXXXXXX..XXXXX',
        '........XXXXXXXXXXXXXXXXXXXXXXXX..XXXXXX',
        '.........XXXXXXXXXXXXXXXXXXXXXX..XXXXXXX',
        '.......XXXX...XXXX.....XXXX...XXXX......',
        '.......XXXX...XXXX.....XXXX...XXXX......',
        '......XXXX....XXXX......XXXX...XXXX.....',
        '.....XXXX....XXXX........XXXX...XXXX....',
        '....XXXX....XXXX..........XXXX...XXXX...',
        '...XXXX....XXXX............XXXX...XXXX..',
        '..XXXXX...XXXXX.............XXXXX..XXXXX'
      ],
      rockLow: [
        '................',
        '.......XX.......',
        '......XXXX......',
        '.....XXXXXX.....',
        '....XXXXXXXX....',
        '...XXXXXXXXXX...',
        '..XXXXXXXXXXXX..',
        '.XXXXXXXXXXXXXX.',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX'
      ],
      rockHigh: [
        '.......XX.......',
        '......XXXX......',
        '.....XXXXXX.....',
        '....XXXXXXXX....',
        '...XXXXXXXXXX...',
        '..XXXXXXXXXXXX..',
        '.XXXXXXXXXXXXXX.',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX'
      ],
      branch: [
        'XXXX................',
        'XXXXXX..............',
        'XXXXXXXX............',
        'XXXXXXXXXX..........',
        'XXXXXXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXXXXXX',
        '..XXXXXXXXXXXXXXXXXX',
        '....XXXXXXXXXXXXXXXX',
        '......XXXXXXXXXXXXXX',
        '........XXXXXXXXXXXX',
        '..........XXXXXXXXXX',
        '............XXXXXXXX',
        '..............XXXXXX',
        '................XXXX',
        '.................XXX',
        '..................XX',
        '..................XX',
        '..................XX',
        '..................XX'
      ],
      heartFull: [
        '.XX.XX.',
        'XXXXXXX',
        'XXXXXXX',
        '.XXXXX.',
        '..XXX..',
        '...X...'
      ],
      heartEmpty: [
        '.XX.XX.',
        'X..X..X',
        'X.....X',
        '.X...X.',
        '..X.X..',
        '...X...'
      ]
    }
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
  paper: '#E8DCC0',
  ink: '#2B2320',
  ochre: '#C8862A',
  vermilion: '#B03A2E',
  inkFar: '#2B232018',
  inkMid: '#2B232058'
};
