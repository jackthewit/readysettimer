# ReadySetTimer — Desktop

오프라인에서 쓰는 macOS / Windows 데스크탑 버전. 웹의 정적 파일을 그대로 감싸는 얇은 Electron 셸.

## 실행

```bash
cd desktop
npm install
npm start
```

`npm start`는 `build:web` (`build/build.js`)을 먼저 돌려서 `../` 웹 소스를 `app/`로 복사하고 광고·GA·동의 배너·SEO 메타를 제거한 뒤 Electron을 띄웁니다. 웹 소스는 건드리지 않습니다.

## 빌드

```bash
npm run dist:mac        # → dist/*.dmg + dist/*.zip (universal binary)
npm run dist:win        # → dist/*.exe (NSIS + Portable, x64)
npm run dist            # 둘 다
```

첫 실행 시 아이콘이 없으면 `npm run icon`이 자동 실행돼서 `build/icon.png`(1024×1024)를 생성하고, electron-builder가 이걸로 .icns / .ico를 만듭니다.

## 메뉴 · 단축키

- **Toggle Fullscreen**: macOS `Ctrl+Cmd+F`, Windows `F11`
- **Always on Top**: macOS `Cmd+Alt+T`, Windows `Ctrl+Alt+T` — 발표 슬라이드 위에 타이머를 띄우는 용도
- 그 외 앱 내부 단축키(Space/R/F/M/숫자키)는 웹과 동일

## 소스 구조

```
main.js         Electron 메인 — 창 생성 · 메뉴 · 외부 링크 처리
preload.js      (자리만 잡아 둠, IPC 아직 없음)
build/
  build.js      웹 정적 파일 복사 + 온라인 전용 태그 제거
  make-icon.js  SVG → 1024×1024 PNG 아이콘 생성
app/            빌드 산출물 (gitignored)
dist/           설치본 산출물 (gitignored)
```

## 웹과의 관계

- 웹(rstimer.kr) 소스가 원본. `build:web`이 매 빌드마다 다시 복사·정제.
- 오프라인 앱에는 광고 스크립트, GA, 동의 배너, JSON-LD, OG/Twitter 메타, 사이트 인증 토큰, hreflang, 캐노니컬 링크가 모두 제거됩니다.
- 따라서 웹의 아무 페이지나 수정하면 다음 데스크탑 빌드에 자동 반영됩니다 — 수동 동기화 없음.

## macOS에서 Windows 빌드

macOS에서 `--win`을 돌리려면 Wine이 필요합니다. 없으면 NSIS 서명 단계에서 실패할 수 있어요. GitHub Actions에서 `windows-latest` 러너로 빌드하는 게 가장 안정적입니다.
