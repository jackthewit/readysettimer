# 짹짹이짐 ONLINE — 짹짹이 바른자세 스튜디오 온라인 헬스장

짹짹이 바른자세 스튜디오의 캐릭터와 공간을 그대로 옮긴 **동시접속 온라인 헬스장**입니다.

- **샵 선택**: 필라테스샵(매트 필라테스 · 가동성) / 웨이트샵(프리웨이트 · 근력)
- **같이 운동**: 방마다 공용 시계가 하나라서, 언제 들어와도 모두가 같은 세트·같은 쉬는 시간을 보냅니다.
- **채팅은 쉬는 시간에만**: 세트 중에는 입력창이 잠기고, 서버도 세트 중 채팅을 거부합니다. 응원 이모지(💪🔥👏🐥💦)는 언제든 보낼 수 있어요.
- **AI PT 부리부리 쌤**
  - `PT` 탭: 1:1 질문, 세트 중에도 가능. 지금 하는 동작을 알고 답합니다.
  - 채팅에서 `@쌤 질문` (쉬는 시간): 방 전체 앞에서 공개 답변.
  - 답변은 실시간 스트리밍. 통증·질환 이야기는 진단하지 않고 전문가 상담을 권합니다.
- **아바타**: 짹짹이 6가지 나시 색 (원본 일러스트의 주황 나시 픽셀만 바꿔서 칠함), 채팅은 머리 위 말풍선으로도 뜹니다.

## 실행

```bash
cd jjackgym
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start
# → http://localhost:8787
```

API 키 없이 실행하면 부리부리 쌤이 **오프라인 모드**(키워드 기반 기본 답변)로 동작합니다. 로컬에서 화면·채팅만 볼 때 편해요.

| 환경변수 | 기본값 | 설명 |
|---|---|---|
| `PORT` | `8787` | 서버 포트 |
| `ANTHROPIC_API_KEY` | — | 부리부리 쌤 AI 답변용 Claude API 키 |
| `PT_MODEL` | `claude-opus-5-5` | 쌤이 쓰는 모델 |
| `PT_AI` | — | `off`면 API 키가 있어도 오프라인 답변만 |
| `MAX_PER_ROOM` | `50` | 샵당 최대 인원 (무대에는 18명까지 보이고 나머지는 "+N명") |
| `ALLOWED_ORIGINS` | — | 쉼표로 구분한 허용 Origin (예: `https://gym.rstimer.kr`). 비우면 제한 없음 |
| `TIME_SCALE` | `1` | 개발·데모용. `0.2`면 세트/휴식이 1/5로 짧아짐 |

```bash
npm test     # 스케줄·채팅 잠금·한도·AI 스트리밍(가짜 API) 테스트
```

## 구조

```
jjackgym/
├─ server.js          HTTP(정적 파일 + /api/rooms) + WebSocket(/ws)
├─ lib/
│  ├─ routines.js     샵별 루틴과 부리부리 쌤 큐 (카드뉴스 1~4회차 멘트 기반)
│  ├─ schedule.js     서버 시작 시각 기준 결정적 세트/휴식 계산
│  ├─ room.js         입장·자리 배정·채팅 잠금·도배/질문 한도·입력 정제
│  └─ coach.js        AI PT (Claude 스트리밍, 거절 시 안내, 오프라인 대체 답변)
├─ public/            로비·운동 화면 (순수 HTML/CSS/JS)
│  └─ assets/         짹짹이·부리부리 일러스트, 웨이트룸 배경, 필라테스룸 SVG
└─ test/
```

### 루틴 바꾸기

`lib/routines.js`에서 샵별 `work`(세트 초) · `rest`(쉬는 시간 초) · `roundBreak`(라운드 휴식 초)와 동작 목록을 고치면 됩니다.
`anim`은 아바타 동작 애니메이션입니다: `breathe` `nod` `wave` `twist` `stretch` `lift` `hinge` `squat` `row` `press` `bob`.
웨이트샵에서 `lift` `row` `press` `squat`일 땐 덤벨이 같이 움직입니다.

## 배포

rstimer.kr는 Vercel **정적** 배포라 WebSocket 서버를 띄울 수 없습니다. 짹짹이짐은 Node 서버가 계속 떠 있어야 하니
Render · Railway · Fly.io 같은 곳에 따로 올려 주세요. (루트 `.vercelignore`로 이 폴더는 Vercel 배포에서 빠집니다.)

**Render 예시**: New → Web Service → 이 저장소 선택

- Root Directory: `jjackgym`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: `ANTHROPIC_API_KEY`, (선택) `ALLOWED_ORIGINS`
- 헬스 체크 경로: `/healthz`

커스텀 도메인(예: `gym.rstimer.kr`)을 붙이면 HTTPS/WSS는 자동입니다.

> 방 상태(접속자·채팅 기록)는 메모리에만 있어서 **인스턴스는 1개**로 운영해야 합니다. 서버를 재시작하면 채팅 기록과 라운드가 초기화돼요.
> 여러 대로 늘려야 할 때는 Redis pub/sub 같은 공용 브로커가 필요합니다.

## 비용 메모

부리부리 쌤 답변 1번 ≈ 입력 1~2천 토큰 + 출력 수백 토큰 (짧게 답하도록 프롬프트·`effort: low` 설정).
한 사람당 10분에 15개까지만 질문할 수 있고(`LIMITS.askPerWindow`), 공개 `@쌤` 답변은 방마다 한 번에 하나씩만 처리합니다.
