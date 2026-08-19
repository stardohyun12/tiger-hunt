# 호랑이 추격

2D 사이드뷰 기마궁술 액션. 사슴을 타고 달리며 뒤쫓는 호랑이를 활로 상대한다.

- `W` 점프 · `S` 수그리기 · `A`/`D` 거리 조절
- 마우스로 조준, 좌클릭을 눌렀다 놓아 발사
- 빨간 칸이 뜨면 0.5초 안에 자세를 바꿔야 한다

## 개발
```bash
python3 -m http.server 8000
```

## 배포용 단일 파일
```bash
node build.mjs   # → dist/play.html
```

설계 의도와 작업 규칙은 [HANDOFF.md](./HANDOFF.md)에 있다.
