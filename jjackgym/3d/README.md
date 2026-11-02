# 짹짹이짐 3D (작업 중)

「짹짹이 모션 스튜디오」의 3D 엔진·캐릭터·기구·동작을 그대로 가져와 만든 3D 온라인 헬스장.

| 파일 | 내용 |
|---|---|
| `assets.js` | 모션 스튜디오 기구·배경 라이브러리 (원본 839~1464줄) |
| `presets1.js`, `presets2.js` | 모션 스튜디오 동작 모음 (원본 1467~2305줄) |
| `engine.js` | 모션 스튜디오 엔진 (원본 2308~4516줄) + 연결 코드(`window.GymEngine`, 매 프레임 `hooks`) |
| `app3d.part.js` | 짹짹이짐 화면 로직 (기구 점유, 1회씩 동작, 랜덤 휴식, 쉬는 시간 채팅, PT 체험/이용권) |
| `body.part.html`, `extra3d.part.css` | 화면 구조·3D용 스타일 |
| `build.py` | 위 조각 + `../artifact/index.html`의 스타일을 합쳐 `index.html` 생성 |
| `e2e3d.mjs`, `mock-claude.js` | 두 명 동시 접속 브라우저 테스트 |

빌드·시험 준비: 아래 파일은 저장소에 올리지 않아요(`.gitignore`).
- `models/jjak.glb.b64.txt`, `models/buri.glb.b64.txt` — `~/barun-studio/dist/models/`에서 복사(모션 스튜디오 공유 페이지의 `models/`와 같음)
- `jjack.png`, `buri.png` — `../public/assets/`에서 복사
- `lib/` — 시험할 때만 필요. three.js r128 파일(`build.py`의 주소 6개)을 받아 넣기

```bash
python3 build.py
PW_DIR=<playwright가 깔린 폴더> node e2e3d.mjs <스크린샷 폴더>
```

## 산사·사우나 고요 감각으로 넣은 것
- **몸짓**: 왼쪽 버튼(인사·박수·엄지척·만세). 내 3D 짹짹이가 직접 하고 모두에게 보임. room presence(`gest`, `gestN`)라 보기 권한만 있는 사람도 보낼 수 있음. 기구 위에서는 머리 위 그림만 뜸
- **줄 서기**: 쓰는 중인 기구를 누르면 그 앞에 줄을 섬(presence `queue`, `queuedAt`). 비면 맨 앞사람이 자동으로 시작. 줄이 있는데 `RULES.idleHoldSec`(90초) 동안 멈춰 있으면 다음 사람에게 넘어감. 탭을 내려 둔 사람은 차례가 오면 줄에서 빠짐
- **부리부리 쌤 상주**: 새로 온 사람을 쳐다보고 손 흔들며 인사, 30초마다 자리를 옮김(자리는 시각으로 정해져 모두 같은 곳에서 봄)
- **소리**: 🎧 은은한 짐 소리(파일 없이 합성, 샵마다 다름), 🔊 전체 소리. 운동 효과음은 누른 사람에게만 남
- **화면**: 3D가 화면 전체. 위에 「지금 N명이 함께 운동 중」, 채팅·PT는 💬🐦로 여는 창(넓은 화면은 쉬는 시간에 채팅이 알아서 열림)

## 공유 페이지로 올릴 때
`index.html` + `assets.js`, `presets1.js`, `presets2.js`, `engine.js`, `jjack.png`, `buri.png`, `models/*.b64.txt`.
권한: `{ room: { topics: { chat: "interact" } }, sample: {} }`
