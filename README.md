# 호랑이 추격

> ▶ **[지금 플레이](https://stardohyun12.github.io/tiger-hunt/)** — 설치·로그인 불필요, 브라우저에서 바로

2D 사이드뷰 기마궁술 액션. 사슴을 타고 달리며 뒤쫓는 호랑이를 활로 상대한다.
OpenAI Game Builders Seoul 2026 출품작.

## 조작

**PC** — `W` 점프 · `S` 수그리기 · `A`/`D` 거리 조절 · 마우스로 조준 · 좌클릭 홀드했다 놓아 발사
**모바일** — 가로로 돌린 뒤, 우하단 4버튼으로 이동 · 화면 좌·중앙을 눌러 조준하고 떼서 발사

빨간 예고가 뜨면 **0.5초**. 서 있으면 위를, 수그리면 아래를 노린다.

## 이 게임의 유일한 자원은 거리(gap)다

장애물·조준·후퇴가 전부 거리 손실로 수렴하고, 명중이 거리를 회복시킨다.
설계 정본은 [docs/design/HANDOFF.md](./docs/design/HANDOFF.md).

## 개발

의존성 0. 순수 JS ESM — 설치할 게 없다.

```bash
python3 -m http.server 8000   # ESM 이라 file:// 로는 안 열린다
node --test tests/determinism.test.mjs
node build.mjs                # → dist/play.html (단일 자립 파일)
```

`main` 에 푸시하면 [Actions](.github/workflows/pages.yml)가 테스트 → 빌드 → Pages 배포까지 자동으로 한다.

## 결정론

리플레이·고스트·실시간 1v1·서버측 스코어 검증이 전부 여기에 얹혀 있다.
초월함수 금지 · 고정 timestep 1/60 · seeded PRNG · 입력 정수 양자화 — 규약은 [AGENTS.md](./AGENTS.md).
