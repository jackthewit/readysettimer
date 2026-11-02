# ONLINE GYM (짹짹이짐 3D)

운동하는 삶. 켜면 첫 페이지 없이 바로 3D 짐 안으로 들어가는 온라인 헬스장.
3D 엔진·캐릭터·기구·동작은 「짹짹이 모션 스튜디오」에서 가져왔어요.

| 파일 | 내용 |
|---|---|
| `assets.js`, `presets1.js`, `presets2.js`, `engine.js` | 모션 스튜디오 원본 (고치지 않음) |
| `world3d.part.js` | 넓은 방·거울·입구·안내 데스크·이 짐 전용 기구 |
| `moves3d.part.js` | 이 짐 전용 동작 (풀업, 랫풀다운, 로잉, 캐딜락, 운다 체어 등) |
| `pt-knowledge.part.js` | 부리부리 쌤의 지식: 동작마다 효과·자세·실수·쉬운 법 (AI 안 씀) |
| `room-supabase.part.js` | Vercel판 동시 접속: Supabase Realtime을 room 모양으로 감쌈 (`supabase.config.json`이 있을 때만 켜짐) |
| `app3d.part.js` | 화면 로직 (`RULES`, `SHOPS`, `PT_PLANS`에서 규칙·기구·금액 조정) |
| `body.part.html`, `extra3d.part.css` | 화면 구조·스타일 |
| `build.py` | 위 조각을 합쳐 `index.html` 생성 |
| `e2e3d.mjs`, `mock-claude.js` | 두 명 동시 접속 시험 + 기구 전부 올라가 보기 (`QUICK=1`이면 기구 확인 생략) |

빌드·시험 준비: 아래 파일은 저장소에 올리지 않아요(`.gitignore`).
- `models/jjak.glb.b64.txt`, `models/buri.glb.b64.txt` — `~/barun-studio/dist/models/`에서 복사
- `buri.png` — `../public/assets/`에서 복사
- `lib/` — 시험할 때만 필요. three.js r128 파일(`build.py`의 주소들)을 받아 넣기

```bash
python3 build.py
PW_DIR=<playwright가 깔린 폴더> node e2e3d.mjs <스크린샷 폴더>
```

## 규칙
- 켜면 잔잔한 자동 닉네임으로 바로 입장, 마지막에 있던 샵으로. 메뉴에서 닉네임·나시·머리띠·바지 색, 샵 이동, 방 옮기기, 소리, 후원, 사진·링크를 다룸
- 기구는 한 명씩, 쓰는 중이면 줄 서기. 줄이 있는데 90초 멈춰 있으면 다음 사람에게
- 세트가 끝나면 20초 휴식, 그때만 채팅. 채팅은 화면에 늘 보임(휴대폰은 몇 줄만)
- 유산소 기구(러닝머신·천국의 계단·자전거)는 누를수록 빨라지고, 안 누르면 느려짐
- 몸짓(인사·박수·엄지척·만세·앉기)은 말 없이 소통. 숫자 1~5 / 이동은 WASD·방향키
- 함께 스트레칭: 매시 정각과 30분에 2분. 시각으로 맞춰서 서버 없이 모두 같은 동작
- 오늘의 루틴: 유산소 → 근력 → 스트레칭. 오늘 횟수·연속 일수는 브라우저에 저장
- PT: 누구나 언제든. 쌤을 부르면 옆으로 와서 3분 봐 줌. AI 없이 `pt-knowledge.part.js`로 답함
- 후원: PT와 별개. **결제는 아직 없음.** `startCheckout()`만 채우면 되고, `DONATIONS` 금액은 임시
- 동시 접속 시험은 `jg.fast`가 켜져 있으면 실제 손님과 다른 채널(`onlinegym-test-N`)을 씀. 한 방 40명, 차면 다음 방

## 공유 페이지로 올릴 때
`index.html` + `assets.js`, `presets1.js`, `presets2.js`, `engine.js`, `buri.png`, `models/*.b64.txt`.
권한: `{ room: { topics: { chat: "interact" } } }`

## Vercel로 올릴 때
`python3 build.py`가 `web/`을 만들어요. `web/`에서 `npx vercel deploy --prod`. 주소는 https://onlinegym.vercel.app
동시 접속을 켜려면 `supabase.config.json`에 `{"url": "...", "anonKey": "..."}`를 넣고 빌드해요. 표는 만들지 않고 Realtime만 씁니다.
