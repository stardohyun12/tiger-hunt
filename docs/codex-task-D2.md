# Codex 작업 지시 — D2: 결정론화 + 구조 정리

**먼저 `AGENTS.md` 와 `docs/design/HANDOFF.md` 를 읽어라.** 거기 규칙이 이 지시보다 우선한다.

지금 게임은 **손으로 플레이하면 잘 돈다.** 이 작업은 **게임플레이 감각을 하나도 바꾸지 않으면서** 결정론을 얻는 것이다. 밸런스 수치(`config.js`)는 건드리지 마라.

> 왜 하는가: 리플레이 · 고스트 · 실시간 동시주행 · 서버측 스코어 검증이 전부 여기 얹힌다.
> 이 넷이 이 출품작이 다른 프로토타입과 갈리는 지점이다.

---

## 1. 의존 방향 바로잡기

현재 위반 세 개를 걷어낸다. **sim 은 입력도 렌더도 모른다.**

| 위반 | 고칠 방법 |
|---|---|
| `arrow.js` 가 `input.js` 의 `mouse` 를 직접 읽는다 | 조준값을 **인자로 받는다** (아래 `Input` 형식) |
| `arrow.js` 에 `drawAimPreview` 가 있다 | `render.js` 로 옮긴다 |
| `tiger.js` · `obstacle.js` 가 `triggerFx` 를 호출한다 | sim 은 **이벤트를 남기고**, `main.js` 가 그걸 읽어 fx 를 친다 |

이벤트는 상태 안에 둔다(그래야 결정론이 유지된다):

```js
// update 시작 시 S.events = [] 로 비운다. sim 은 push 만 한다.
S.events.push({ kind: 'hitStrong' });   // 문자열은 CFG.fx 의 키와 같게
```
`main.js` 는 `update()` 직후 `S.events` 를 훑어 `triggerFx` 를 호출한다. `fx.js` 자체는 그대로 둔다.

파일 이동은 하지 마라 — `src/` 는 평평한 채로 둔다. import 관계만 바로잡는다.

## 2. 고정 timestep

`src/config.js` 에 추가:
```js
export const FIXED_DT = 1 / 60;
```

`main.js` 를 누적기 패턴으로 바꾼다:
- 실제 경과 시간을 누적하고, `FIXED_DT` 단위로 `update()` 를 **0회 이상 반복** 호출
- 누적치 상한을 둬라 (예: 한 프레임에 최대 5회) — 탭 전환 후 폭주 방지
- 렌더는 프레임레이트대로 계속 돈다. hitstop 분기 순서는 바꾸지 마라

**모든 sim 함수에서 `dt` 인자를 없앤다.** 내부에서 `FIXED_DT` 를 쓴다.
`updatePlayer(S, dt)` → `updatePlayer(S, input)` 처럼 시그니처가 바뀐다.

## 3. seeded PRNG

새 파일 `src/rng.js` — 순수 함수형, 정수 연산만:
```js
export function rngFromSeed(seed)                      // → RngState (32비트 정수)
export function rngNext(s)                             // → { state, value }  value: 0..2^32-1 정수
export function rngRange(s, lo, hiExclusive)           // → { state, value }  정수
export function rngUnit(s)                             // → { state, value }  0..1 float (나눗셈 한 번)
```
xorshift32 또는 mulberry32 의 정수판. `>>> 0` 으로 부호를 관리하라. **초월함수를 쓰지 마라.**

`obstacle.js` 의 `Math.random()` 3곳을 `S.rng` 를 통과시키는 형태로 바꾼다.
`fx.js` 의 `Math.random()` 은 **그대로 둬라** — 화면 흔들림이라 게임플레이에 영향이 없다.

`createState(seed)` 로 시그니처를 바꾸고 `S.seed`, `S.rng` 를 넣는다.
시드를 만드는 건 sim 밖이다 — `main.js` 가 데일리 시드(`YYYYMMDD` 정수)나 랜덤 시드를 정해서 넣는다.

## 4. 입력 형식

한 논리 프레임의 입력. **전부 정수:**
```js
{ f: 0,          // 프레임 번호
  k: 0,          // 키 비트마스크  1=W(점프) 2=S(수그림) 4=A(뒤) 8=D(앞)
  ax: 0, ay: 0,  // 조준 방향 — 뷰포트 좌표를 정수로 반올림한 값
  c: 0 }         // 0=변화없음  1=차지시작  2=발사
```
`input.js` 는 이 객체를 만들어 `main.js` 에 넘기는 역할만 한다. `held`/`mouse` 를 sim 이 직접 보지 않는다.

조준 방향 정규화에 `Math.hypot` 을 쓰고 있다면 `Math.sqrt(x*x + y*y)` 로 바꿔라.

## 5. `src/replay.js`

```js
// inputs 는 델타 인코딩 — 직전 프레임과 값이 달라진 프레임만 담는다.
// 재생 시에는 다음 마커가 나올 때까지 마지막 입력을 유지한다.
export function record(S, input)                 // 진행 중 기록
export function serialize(replay)                // → 문자열 (정수만)
export function deserialize(str)                 // → replay
export function playback(replay)                 // → 최종 GameState (처음부터 재생)
export function hashState(S)                     // → 정수 해시(FNV-1a). 결정론 비교용
```
`playback` 은 **브라우저 API 를 쓰면 안 된다.** Cloudflare Worker 에서 그대로 돌려 점수를 검증할 것이기 때문이다.

`hashState` 는 화면 흔들림(`trauma`)처럼 게임플레이와 무관한 필드를 **제외**하고 해싱하라. 무엇을 뺐는지 주석으로 남겨라.

## 6. `tests/determinism.test.mjs`

`node --test` 로 돈다. 세 가지:

1. **재현성** — 시드 100개 각각에 대해 같은 입력열로 두 번 돌린 `hashState` 가 일치
2. **리플레이 왕복** — 플레이 → `serialize` → `deserialize` → `playback` 해시가 원본과 일치
3. **정적 스캔** — sim 소스(`config state player tiger arrow obstacle rng replay`)를 읽어 금지 패턴 검출.
   위반 시 **파일명과 줄 번호를 출력**하고 실패.
   - `Math.random` `Date.now` `performance.now` `document` `window` `localStorage` `fetch`
   - `Math.sin` `cos` `tan` `asin` `acos` `atan` `atan2` `pow` `exp` `log` `hypot` `cbrt`, 그리고 `**` 연산자
   - 주석과 문자열 리터럴은 검사에서 제외하라

입력열은 손으로 만들지 말고 **PRNG 로 생성**해라 (테스트용 시드 고정). 그래야 다양한 경로를 밟는다.

---

## 완료 판정

```bash
node --test tests/determinism.test.mjs     # 3개 전부 통과
node build.mjs                             # dist/play.html 생성
```
그리고 **손으로 플레이해서 감각이 이전과 같은지** 확인해라. 다르면 고정 timestep 전환에서 뭔가 어긋난 것이다.

## 끝나면

`docs/codex-log/D2.md` 를 만들어 네 줄(받은 것 / 구현한 것 / 막힌 곳 / 사람이 정한 것)을 남겨라. 이건 대회 제출물이다.

## 하지 말 것

- `config.js` 의 밸런스 수치를 바꾸지 마라
- 게임 규칙을 바꾸지 마라 (텔레그래프 0.5초, 자세 거울 규칙 포함)
- 라이브러리를 추가하지 마라. Vite·TypeScript 도입 금지
- 커밋하지 마라
