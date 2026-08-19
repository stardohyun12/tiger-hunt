# 밤 조사 정리 — 2026-08-19 → 08-20 새벽

> 도현 지시: "코드는 D4 까지, 이후는 조사만." 이 문서는 전부 **제안**이다 — 채택은 도현이 아침에 판정.

---

## 1. 모바일 터치 조작안 (D6 예정 작업의 설계 초안)

현 조작(W/S/A/D + 마우스 조준 + 홀드 발사)을 **엄지 두 개**로 옮기는 안:

```
┌────────────────────────────────────────────┐
│                                    (화면)   │
│                                            │
│  ◄ ▬▬▬ ►          우측 화면 전체 =         │
│  [뒤] [앞]          드래그 조준 + 홀드 차지  │
│                     놓으면 발사              │
│  ▲점프  ▼수그림                             │
└────────────────────────────────────────────┘
   좌하단 4버튼            우측 반면 제스처
```

- **좌하단**: 앞/뒤(홀드) + 점프/수그림(탭) — 4버튼, 각 ≥100px, 간격 확보
- **우측 반면 전체가 활**: 아무 데나 터치 = 차지 시작, 드래그 = 조준, 놓기 = 발사. 조준점을 손가락에서 위로 오프셋해 엄지가 가리는 문제 회피
- 근거: 랜드스케이프에서 엄지가 닿는 곳은 좌우 하단 사분면. 버튼은 시각 피드백(눌림 상태 색/스케일) 필수 — 터치는 물리 피드백이 없다
- **입력 계층만 추가하면 된다** — sim 은 이미 정수 입력 `{k,ax,ay,c}` 만 받으므로 `input.js` 에 터치 → 같은 형식 변환만 붙이면 끝. 결정론·리플레이 전부 그대로 동작
- 출처: [터치 컨트롤 패턴](https://cursa.app/en/page/touch-controls-for-mobile-games-input-patterns-and-feedback) · [MS 터치 레이아웃 가이드](https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/building-touch-layouts/game-streaming-tak-designers-guide?view=gdk-2604) · [모바일 조작 설계](https://mobilefreetoplay.com/control-mechanics/)

## 2. 배포 절차 (D7 예정 — 실행 대기)

**1단계 (지금 가능): GitHub Pages** — `dist/play.html` 이 완전 자립 파일이라 즉시 가능.
```
gh repo edit --enable-pages 또는 Settings→Pages, dist/ 를 gh-pages 브랜치로
```
로그인 불필요·조작법 표시 요건 이미 충족. **제출 최소선이 이걸로 확보된다.**

**2단계: Cloudflare Workers** — 랭킹 API + 1v1 룸(Durable Object)을 얹을 때.
`wrangler init` → 정적 자산(assets 바인딩) + `worker/` 에 DO. `npx wrangler deploy`.
⚠ wrangler 는 devDependency 추가가 필요하다 → **도현 승인 후** (AGENTS.md 의존성 정책).

## 3. SFX 설계표 (WebAudio 합성 — 구현 대기)

| 소리 | 합성 레시피 | 트리거 |
|---|---|---|
| 시위 당김 | 노이즈 + 로우패스 스윕 200→800Hz, 차지에 비례 | `c===1` 이후 홀드 |
| 발사 | 80ms 노이즈 버스트 + 220Hz 사인 감쇠 | `c===2` |
| 약명중 | 440Hz 삼각파 60ms | `hitWeak` 이벤트 |
| 강명중 | 110Hz 사각파 + 노이즈 120ms (북) | `hitStrong` |
| 발톱 피격 | 화이트노이즈 하이패스 찢는 소리 180ms | `claw` |
| 처치 | 55Hz 사인 300ms + 880Hz 벨 (북+공) | `kill` |
| 착지/비틀 | 90Hz 60ms 퍽 | `stumble` |

`S.events` 가 이미 이벤트 버스라 **`audio.js` 하나 추가 + `main.js` 에서 이벤트 구독**이면 끝. iOS 정책상 첫 터치에서 `AudioContext.resume()` 필요.

## 4. 아침에 도현이 정할 것 (우선순위 제안 순)

1. **직접 플레이 판정** — `dist/play.html`. 추월→차단→뒤돌기가 읽히는가, 속도감 개선됐는가
2. 까치 텔레그래프 채택 여부 (`ux-research.md` §2-A)
3. SFX 구현 승인 (위 표대로면 코드만, 파일 0개)
4. 모바일 조작안 승인 (위 §1)
5. wrangler devDependency 승인 (실시간 1v1 전제조건)
6. Nano Banana 첫 배치 — 민화 프롬프트로 타이틀·호랑이·배경 (도현이 웹UI에서 생성)

## 밤 사이 일어난 일 요약

- **D3 커밋** `10d0189`: 교전 재설계(추월→차단→뒤돌기), 넉백·수그리기 버그 수정, 벡터 렌더링(패럴랙스·다리 애니메이션·히트 플래시)
- **D4 커밋** `3e071ec`: 무입력 무피해/호랑이 이탈 버그 수정, 점수 체계, 타이틀(조작법 상시)·HUD·게임오버 화면
- 검산 전부 통과: 테스트 3/3 · 무입력 40.2초 사망 · A홀드 |gap|≤620 · 순간이동 소멸
- Claude 직접 수정 1줄 (전방 클램프, D4 로그에 기록)
