# 웹 배포 + Google AdSense 가이드 (처음이신 분용)

이 앱은 **정적(static)** 웹앱입니다 — HTML/CSS/JS 파일 3개만 있으면 어디든 올릴 수 있습니다. 서버·DB·빌드 도구 필요 없음.

---

## 1. 어디에 배포할까? (무료 옵션 중 추천 순)

| 서비스 | 특징 | 난이도 |
|---|---|---|
| **Vercel** | 한 번 클릭 배포, 커스텀 도메인 무료, CDN 자동 | ★☆☆ 쉬움 |
| **Netlify** | 드래그앤드롭도 가능, UI 직관적 | ★☆☆ 쉬움 |
| **Cloudflare Pages** | 속도 빠름, 트래픽 무제한 | ★★☆ |
| **GitHub Pages** | GitHub 저장소에서 바로 | ★★☆ |

처음이라면 **Vercel** 또는 **Netlify**를 추천합니다.

---

## 2. Vercel로 배포 (가장 쉬운 방법)

### 2-1. GitHub에 코드 올리기
이미 GitHub 저장소 `jackthewit/readysettimer`가 있으니, 이 브랜치를 `main`에 머지한 상태를 기준으로 설명합니다.

### 2-2. Vercel 가입·연결
1. https://vercel.com 접속 → **Sign up** → GitHub 계정으로 로그인
2. 대시보드에서 **Add New → Project**
3. `readysettimer` 저장소 선택 → **Import**
4. 설정 화면에서 **Framework Preset**: `Other` 그대로 두기
5. **Build & Output Settings**는 건드리지 않음 (이 앱은 빌드 불필요)
6. **Deploy** 클릭

1~2분 뒤 `https://readysettimer.vercel.app` 같은 주소로 바로 접속 가능합니다.

### 2-3. 커스텀 도메인 (선택)
- 도메인 구매: 가비아, 후이즈, Namecheap 등 (.com 기준 연 15,000원 내외)
- Vercel 대시보드 → **Project → Settings → Domains** → 도메인 입력
- Vercel이 안내하는 DNS 레코드를 도메인 제공사에 설정
- 10분~수 시간 뒤 HTTPS 인증서 자동 발급

> AdSense 승인을 받으려면 **도메인이 있는 편이 훨씬 유리**합니다. 서브도메인 기반의 기본 주소로도 신청은 되지만 심사가 더 까다롭습니다.

---

## 3. Netlify 드래그앤드롭 (GitHub 없이 바로)

1. https://app.netlify.com/drop 접속
2. `index.html`, `styles.css`, `app.js` 세 파일을 폴더째로 드래그
3. 끝. 즉시 `https://XXXX.netlify.app` 주소 발급

---

## 4. Google AdSense 신청·게재

### 4-1. 사전 조건
AdSense는 "콘텐츠가 충분한 사이트"를 요구합니다. 타이머 앱 한 페이지만 있으면 **승인이 거절되기 쉽습니다**. 다음 중 하나라도 갖추세요:
- 간단한 **소개 페이지**, **사용 가이드**, **개인정보처리방침**, **이용약관** 페이지 추가
- 블로그 섹션에 3~5개의 글 추가 (타이머 활용법, 뽀모도로 이야기 등)
- 최소한 `about.html`, `privacy.html`, `terms.html` 세 페이지는 만드시길 권장

### 4-2. 신청 순서
1. https://adsense.google.com 접속 → 구글 계정으로 로그인
2. **사이트 URL** 입력 (Vercel/Netlify/커스텀 도메인 주소)
3. **주소·연락처·결제 정보** 입력 (승인 후 수익 지급에 필요)
4. AdSense가 주는 **확인 코드**를 `<head>` 안에 붙이라고 함 — 이미 [index.html:11–12](index.html)에 자리가 있습니다:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
   `ca-pub-XXXXXXXXXXXXXXXX`의 X를 **본인 퍼블리셔 ID**(AdSense에서 준 것)로 바꿔 commit·push하면 Vercel이 자동 재배포합니다.
5. AdSense에 "사이트 확인" 클릭 → 심사 대기 (짧게는 수일, 길게는 수 주)

### 4-3. 승인 후 광고 단위 만들기
1. AdSense 대시보드 → **광고 → 광고 단위별 → 디스플레이 광고 만들기**
2. 이름 지정 (예: "Timer-Bottom"), **반응형** 선택 → 생성
3. 받은 코드에서 `data-ad-slot="XXXXXXXXXX"` 값만 복사
4. [index.html 하단 ad-slot 영역](index.html)에서 `XXXXXXXXXX`을 교체:
   ```html
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-본인ID"
        data-ad-slot="본인슬롯ID"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
   ```
5. commit·push → 30분~수 시간 뒤 광고가 표시됨

### 4-4. 한국 기준 수익 팁
- **클릭당 수익(CPC)**은 주제에 따라 200~1,500원 내외
- **생산성/타이머** 주제는 낮은 편이지만, 체류 시간이 길어 광고 노출(임프레션)이 많은 편
- 월 1,000 방문자 기준 월 1,000~5,000원 수준 — 절대 빠르게 돈 벌 수 없음을 먼저 인지
- 수익이 **100달러**를 넘으면 다음 달 말 지급
- 국세 신고: 기타/사업 소득. 세무 문의는 세무사에게

---

## 5. AdSense 승인을 위한 실전 체크리스트

- [ ] 사이트에 **콘텐츠가 최소 3페이지 이상** 있을 것 (index 외에 about/privacy/terms)
- [ ] **개인정보처리방침** 페이지 작성 (AdSense 쿠키·Google Analytics 사용 고지 포함)
- [ ] **저작권·연락처** 정보가 어딘가에 표시될 것
- [ ] 도메인이 **HTTPS**로 접속될 것 (Vercel/Netlify는 자동)
- [ ] 광고 클릭을 유도하는 문구 절대 금지 ("광고 클릭해주세요" 등)
- [ ] 자기 광고 클릭 금지 — 계정 정지됨
- [ ] 스마트폰·태블릿에서도 레이아웃이 깨지지 않을 것 (이 앱은 이미 대응됨)

---

## 6. 이 앱을 배포하기 전에 체크할 것

- **메타 태그 개선** (검색엔진 노출용)
  - [index.html](index.html)의 `<meta name="description">` 을 본인 사이트 설명으로 변경
  - Open Graph 태그 추가하면 카카오톡·SNS 공유 시 미리보기가 예뻐짐:
    ```html
    <meta property="og:title" content="ReadySetTimer" />
    <meta property="og:description" content="프레젠테이션 타이머·뽀모도로·스톱워치" />
    <meta property="og:image" content="https://본인도메인/preview.png" />
    ```
- **Google Analytics** (선택) — 방문자 분석. https://analytics.google.com 에서 코드 받아 `<head>`에 삽입
- **사이트맵** (선택) — SEO 용 `sitemap.xml` 작성 후 Google Search Console 제출

---

## 7. 문제가 생기면
- AdSense 승인 거절 메일이 오면 이유(콘텐츠 부족·탐색 불가 등)를 개선 후 재신청 (48시간 대기 필요할 수 있음)
- Vercel 배포가 실패하면 **Project → Deployments → 실패한 로그** 확인
- 광고가 안 보이면: 애드블로커 꺼보기, 크롬 개발자도구 콘솔 에러 확인, `data-ad-client`·`data-ad-slot` 오타 점검

---

## 참고 링크
- Vercel 공식 가이드: https://vercel.com/docs
- Netlify 공식 가이드: https://docs.netlify.com
- AdSense 정책 센터: https://support.google.com/adsense/answer/48182
- AdSense 한국 공식 블로그: https://adsense.googleblog.com
