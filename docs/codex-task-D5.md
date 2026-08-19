# Codex 작업 지시 — D5: 모바일 터치 조작

**먼저 `AGENTS.md` 를 읽어라.** 매 단계 `node --test tests/determinism.test.mjs` 유지.

목표: **도현이 지금 핸드폰에서 이 게임을 플레이할 수 있어야 한다.** 그것이 이 작업의 완료 조건이다.

---

## 0. 대전제 — sim 은 한 줄도 건드리지 않는다

`sim.js` 는 이미 정수 입력 `{f, k, ax, ay, c}` 하나만 받는다.
터치는 **입력 계층에서 같은 형식으로 변환만** 하면 끝이다.
`sim.js` · `player.js` · `tiger.js` · `arrow.js` · `obstacle.js` · `rng.js` · `replay.js` **수정 금지.**
결정론·리플레이가 그대로 유지되는지 스스로 확인하라 (터치로 만든 입력열도 리플레이돼야 한다).

건드릴 파일: `index.html` · `src/config.js` · `src/input.js` · `src/render.js` (+ 필요시 `src/viewport.js`, `src/main.js` 배선만)

---

## 1. 레이아웃 판정 — 조작 버튼은 **우하단**이다 (설계 결정, 바꾸지 마라)

`docs/design/night-research.md` §1 초안은 버튼을 좌하단에 뒀다. **그 안은 폐기한다.**

이유: 조준은 `arrow.js` 의 `aimVector()` 가 보여주듯 **활(화면 x≈466)에서 터치 지점으로의 방향**이다.
- 뒤에서 추격 중인 호랑이 → 화면 x ≈ 100~380, y ≈ 420 (지면). **좌하단**을 눌러야 쏜다
- 앞을 막은 교전 중 호랑이 → 화면 x ≈ 575~680. 우하단 x≥720 클러스터와 안 겹친다

⇒ **좌측·중앙 전부가 조준 영역**이어야 하고, 버튼은 우하단으로 간다.

## 2. `config.js` — 터치 기하를 여기에만 둔다

```js
touch: {
  r: 50,          // 패드 반지름 (뷰 단위). 가로 폰 scale≈0.72 → 실제 지름 ≈72css px
  slack: 24,      // 손가락이 패드 밖으로 미끄러졌다고 볼 여유
  pads: [
    { key: 'S', label: '수그림', x: 770, y: 368 },
    { key: 'W', label: '점프',   x: 884, y: 368 },
    { key: 'A', label: '뒤',     x: 770, y: 478 },
    { key: 'D', label: '앞',     x: 884, y: 478 }
  ]
}
```
`C` 에 필요하면 패드 색을 추가하되 기존 민화 팔레트(`paper`/`ink`/`ochre`/`vermilion`)를 재사용하라.

## 3. `input.js` — Pointer Events 로 통일

`mousedown`/`mousemove`/`mouseup` 을 **`pointerdown`/`pointermove`/`pointerup`/`pointercancel` 로 교체**한다.
Pointer Events 는 마우스·터치·펜을 한 경로로 준다 → 기존 마우스 조작은 그대로 동작해야 한다 (회귀 금지).

### 3-a. 부착 대상은 canvas 가 아니라 문서다
지금은 `canvas.addEventListener` 라, 레터박스(검은 여백)를 만지면 아무 일도 안 난다.
가로 폰에서는 좌우에 여백이 생기므로 **`document`(또는 `#wrap`)에 붙이고**, `toView()` 로 변환한 뒤
좌표를 `[0, CFG.view.w] × [0, CFG.view.h]` 로 **클램프**하라.

### 3-b. 포인터 역할 분배 (멀티터치)
포인터 하나하나를 `pointerId` 로 추적하고, **누른 순간 역할을 정한다**:

- **패드 위에서 시작** → 그 패드에 바인딩. 해당 키 비트가 눌린 상태가 된다
  - `pointermove` 마다 **역할을 재평가**한다: 현재 위치에서 `r + slack` 안에 드는 패드로 다시 바인딩(없으면 해제).
    손가락을 미끄러뜨려 A→D 로 갈아타거나, 패드에서 빠져나와 떼는 게 가능해야 한다
- **패드 밖에서 시작** → **조준/차지 포인터**. `chargeChanges.push(1)`, 이후 `pointermove` 로 `mouse.x/y` 갱신,
  `pointerup` 에 `chargeChanges.push(2)`
  - 조준 포인터는 **한 번에 하나만** (이미 있으면 새 포인터는 무시)
  - **한 번 조준 포인터가 되면 패드 위로 드래그해도 계속 조준한다** — 지면의 호랑이(y≈420)를 노리려면
    손가락이 아래로 내려가야 하는데 거기서 패드에 뺏기면 안 된다
- 이동 패드와 조준은 **동시에** 성립해야 한다 (엄지 두 개)

### 3-c. 취소 처리 — 빼먹으면 폰에서 게임이 굳는다
`pointercancel`(iOS 제스처·전화 수신 등) 과 `visibilitychange`(숨김) 에서:
- 바인딩된 패드 전부 해제 (키 비트 0)
- 조준 포인터가 살아 있으면 **`chargeChanges.push(2)` 로 발사 처리하고 해제**
  (그냥 지우면 `S.aiming` 이 켜진 채 남아 조준 감속(`aimMul`)이 영원히 걸린다)

기존 `blur` 핸들러가 하는 일과 같은 성질이다 — 그쪽도 유지하라.

### 3-d. 터치 모드 감지
`pointerdown` 의 `e.pointerType === 'touch'` 를 한 번이라도 보면 터치 모드로 **고정**(다시 안 꺼진다).
초기값은 `navigator.maxTouchPoints > 0` 으로 추정해도 된다.
`export function touchActive()` 로 렌더가 읽게 하라.

### 3-e. 재시작 훅
`main.js` 의 `onPrimaryDown` 이 타이틀/게임오버에서 재시작을 건다.
**터치로도 재시작이 돼야 한다** — 조준 포인터가 되기 전에 이 훅을 먼저 태워라 (기존 마우스 경로와 동일 순서).

## 4. `render.js` — 패드를 그리고, 조작법을 터치용으로 바꾼다

### 4-a. 패드 드로잉 (`touchActive()` 일 때만)
- 원: 채움 `C.paper` alpha 0.16, 테두리 `C.paper` alpha 0.55, 선 2px
- 눌린 상태: 채움 `C.ochre` alpha 0.45, 테두리 `C.ochre`, 반지름 +4
  **터치는 물리 피드백이 없다 — 눌림이 눈에 확 보여야 한다**
- 라벨: `C.paper`, 가운데 정렬, 볼드
- 게임 오브젝트 위·HUD 아래 레이어. 타이틀/게임오버 오버레이보다는 **아래**

### 4-b. 조작법 표 (대회 필수 요건)
타이틀 화면의 조작법은 터치 모드에서 **터치 기준으로 바뀌어야 한다**:
```
좌·중앙 화면을 눌러 조준 → 홀드하면 차지 → 떼면 발사
우하단 4버튼: 앞 · 뒤 · 점프 · 수그림
화면 아무 데나 탭하면 시작
```
데스크톱 모드에서는 지금 문구 그대로. 두 분기 모두 화면에 상시 보여야 한다.

### 4-c. 조준 조력
`drawAimPreview()` 가 이미 궤적 아크를 그린다 — 손가락이 조준점을 가려도 궤적으로 읽힌다.
**조준점을 손가락 위로 오프셋하지 마라.** 방향각이 거리에 따라 비선형으로 뒤틀려 마우스와 감각이 갈린다.
대신 차지 중 조준 지점에 작은 표적 마크(`C.aim`) 하나를 더 그려라.

## 5. `index.html` — 폰 브라우저 대응

- viewport 메타: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`
- `html, body { overscroll-behavior:none; touch-action:none; -webkit-tap-highlight-color:transparent;
  -webkit-touch-callout:none; }` (당겨서 새로고침·롱프레스 메뉴·더블탭 확대 차단)
- `height:100dvh` 를 `100%` 와 함께 (주소창 때문에 뷰포트가 줄었다 늘었다 한다)
- **세로 모드 안내 오버레이**: `@media (orientation: portrait)` 로만 보이는 전체화면 div.
  "가로로 돌려주세요 📱↻ / 《호랑이 추격》은 가로 화면 게임입니다". **JS 없이 CSS 만으로.**
  (16:9 게임을 세로 폰에 넣으면 화면의 26% 만 쓴다)
- `build.mjs` 가 `index.html` 을 그대로 인라인하므로 이 변경은 `dist/play.html` 에 자동 반영된다

## 6. 검증 — 말로 때우지 말고 실제로 확인하라

1. `node --test tests/determinism.test.mjs` 3/3
2. `node build.mjs` 성공, `dist/play.html` 생성
3. **헤드리스 브라우저(D4 에서 쓴 Edge CDP)로 실제 확인**:
   - 터치 에뮬레이션으로 패드 4개 각각 눌러 키 비트가 서는지
   - 이동 패드 + 조준을 **동시에** 눌러 둘 다 먹는지
   - 조준 포인터를 패드 위로 드래그해도 조준이 유지되는지
   - `pointercancel` 후 `S.aiming === false` 인지
   - 세로/가로 리사이즈에서 안내 오버레이가 뜨고 사라지는지
   - 런타임 예외 0건
4. 마우스 회귀 확인: 마우스로도 조준·차지·발사·재시작이 그대로 되는지

## 7. 로그

`docs/codex-log/D5.md` 에 네 줄 (받은 것 / 구현한 것 / 막힌 곳 / 사람이 정한 것).
**사람이 정한 것**에 반드시 포함: 우하단 배치 결정과 그 근거(조준 방향이 활에서 나가므로 좌측이 조준 영역),
조준점 오프셋 거부, 세로 모드는 안내 오버레이로 처리.
