# 🌸 스텔라이브 바운스 배틀 (StelLive Bounce Battle Simulator)
> **도메인**: `hanakonana.cloud`  
> 인스타그램 릴스 / 틱톡 / 유튜브 쇼츠에서 유행하는 **벽 튕기기 & 궁극기 난사 물리 배틀 시뮬레이터**입니다.

---

## 🎮 게임 특징 및 기능

1. **인스타 숏폼 감성 바운스 물리 배틀**
   - 벽에 튕길 때마다 탄성 가속 + SP(스킬 게이지) 충전.
   - 캐릭터 간 충돌 시 속도와 공격력에 비례한 데미지 교환 및 넉백.
   - 크리티컬 히트 이펙트, 스파크, 화면 흔들림(Screen Shake), 플로팅 데미지 폰트.
   - **배속 조절 (0.5x, 1x, 2x, 5x, ⚡10x 터보)** 지원.

2. **스텔라이브 멤버별 시그니처 스킬 & 궁극기(ULT)**
   - **하나코 나나 (Hanako Nana)**: 맹독 버섯 포자 살포 & **[황홀경 버섯 대폭발]** (전 화면 광역 폭격)
   - **아이리 칸나 (Airi Kanna)**: 푸른 화염탄 & **[청룡 초신성 (Dragon Nova)]**
   - **아야츠노 유니 (Ayatsuno Yuni)**: 빙결 스탬프 & **[절대영도 블리자드]**
   - **시라유키 히나 (Shirayuki Hina)**: 별빛 비둘기 탄환 & **[스텔라 하모니 저격 레이저]**
   - **아카네 리제 (Akane Lize)**: 블러드 슬래시(흡혈) & **[진조의 핏빛 참격]**
   - **네네코 마시로 (Neneko Mashiro)**: 냥냥 펀치 & **[기간틱 츄르 메테오]**
   - **유즈하 리코 / 텐코 시부키 / 히텐 카나데 / 아오쿠모 린** 등 1~3기 전원 구현.

3. **다채로운 아레나 & 게임 모드**
   - **게임 모드**: 배틀로얄(자기장 축소), 1 vs 1 듀얼, 팀 데스매치(블루 vs 레드), 무한 난투.
   - **아레나 형태**: 원형(Circle), 사각(Box), 육각형 네온 링(Hexagon), 핀볼 범퍼, 회전 장애물(Spinner).
   - **실시간 상호작용**: 마우스로 캐릭터를 직접 잡고 던질 수 있는 드래그 & 플링 물리 지원.
   - **커스텀 파이터 제작**: 나만의 이미지, 이름, 색상, 스킬을 부여하여 참전 가능.

4. **100% 내장 오디오 신디사이저 (Web Audio API)**
   - 외부 음원 다운로드 오류 없이 바운스음, 타격음, 레이저, 궁극기 베이스 드롭, 승리 팡파르 자체 생성.

---

## 🚀 로컬 실행 방법

브라우저에서 `index.html` 파일을 직접 열거나, 간단한 로컬 웹 서버로 실행할 수 있습니다.

### 방법 1. 파이썬 로컬 서버
```bash
python -m http.server 8080
```
브라우저에서 `http://localhost:8080` 접속

### 방법 2. Node.js (npx)
```bash
npx serve .
```

---

## 🌐 가비아 도메인 (`hanakonana.cloud`) 연결 및 무료 배포 가이드

순수 웹 정적 파일(HTML/CSS/JS)로 구성되어 있어 **Cloudflare Pages**, **GitHub Pages**, **Vercel** 중 하나를 이용하면 평생 무료로 SSL(HTTPS) 인증서와 함께 배포할 수 있습니다.

### 추천: Cloudflare Pages / GitHub Pages 배포 단계
1. **GitHub에 소스 코드 업로드**:
   - 새 저장소(예: `hanakonana-battle`)를 생성하고 현재 폴더의 파일들을 푸시합니다.
2. **Cloudflare Pages 또는 GitHub Pages 활성화**:
   - **Cloudflare Pages**: GitHub 계정 연동 후 레포지토리 선택 -> 배포 클릭 (30초 완료).
   - **Custom Domain 설정**: Cloudflare Pages 대시보드에서 `Custom Domains` -> `hanakonana.cloud` 입력.
3. **가비아(Gabia) DNS 레코드 등록**:
   - 가비아 도메인 관리 (`domains.gabia.com`) 접속
   - `hanakonana.cloud` DNS 설정 -> `DNS 레코드 추가`
   - **CNAME 레코드**:
     - 호스트: `@` (또는 비워둠)
     - 값/목적지: `[Cloudflare에서 제공하는 프로젝트주소.pages.dev]` (또는 GitHub Pages 주소)
     - 호스트: `www`
     - 값/목적지: `[동일한 주소]`
4. 몇 분 후 `https://hanakonana.cloud`로 전 세계 어디서나 접속할 수 있습니다!
