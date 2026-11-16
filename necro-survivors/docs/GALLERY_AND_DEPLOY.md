# 💀 Necro Survivors — 에셋 비교 갤러리 & Firebase 배포 가이드

## 1. 갤러리 개요 및 접속 URL

| 항목 | 내용 |
| :--- | :--- |
| **라이브 게임 URL** | https://project-necro-54deb.web.app/ |
| **비교 & 도감 갤러리 URL** | https://project-necro-54deb.web.app/gallery/ |
| **위치** | `necro-survivors/public/gallery/` |

---

## 2. 갤러리 구성 및 기능

### 2.1 탭 구성
1. **🔄 구버전 vs 신규 에셋 비교 (기본 탭)**
   - **소환수 군단 5종**: 구 `project_necro` 스프라이트(`legacy/summons/`)와 신규 제작 도트 스프라이트(`../assets/summons/`) 좌우 비교
   - **스킬 아이콘 & 인게임 VFX 14종**: 구 공용 VFX(`legacy/pixel_vfx_skills/`)와 신규 UI 아이콘(`../assets/skills/skill_*.png`) + 인게임 전용 전투 VFX(`../assets/skills/vfx/vfx_*.png`) 비교
2. **⚔️ 10개 스킬 계열 트리**
   - 무속성 · 사령속성 · 성속성 · 어둠속성 · 베기속성 · SF속성 · 번개속성 · 빙결속성 · 화염속성 · 창술속성
   - 각 계열의 하위(Tier 1) · 상위(Tier 2) · 짝꿍 패시브 · 각성 스킬 트리 표시 및 클릭 시 `Lv.1~5` 상세 수치 모달 조회
3. **💎 패시브 & 각성 전체**
   - 패시브 10종(`Lv.1`, `Lv.5` 효과) 및 각성 스킬 18종(진화 조건 및 효과) 목록
4. **🗺️ 14개 지역 & 84종 괴수**
   - 1~14지역 게이트 아이콘, 거점/전투 배경, 일반 4종 + 네임드 + 보스 스프라이트 일괄 조회
5. **🕯️ 영혼 각인 제단**
   - 전투 특성 9종, 생존 재능 9종, 회귀 영혼 각인 12종

### 2.2 파일 구조 및 에셋 최적화
```text
necro-survivors/public/
├── assets/                  # 실사용 게임 에셋 200개 (19MB) — 미사용 구 에셋 1,802개 삭제 완료
└── gallery/
    ├── index.html           # 갤러리 UI 및 탭/비교/모달 로직
    ├── gallery_data.js      # src/data/*.ts 에서 추출한 정적 JSON 데이터
    └── legacy/              # 버전 비교용 구 에셋 최소본 (740KB)
        ├── summons/
        └── pixel_vfx_skills/
```

### 2.3 게임 데이터 변경 시 `gallery_data.js` 갱신 방법
`src/data/skillsData.ts`, `minionsData.ts`, `regionsData.ts`, `altarData.ts`를 수정한 뒤 아래 명령으로 `gallery_data.js`를 재생성합니다.

```bash
cd necro-survivors
npx tsc --ignoreConfig --outDir /tmp/necro-data --module commonjs --target es2020 --skipLibCheck \
  src/data/skillsData.ts src/data/minionsData.ts src/data/regionsData.ts src/data/altarData.ts

node -e '
const fs = require("fs");
const skills = require("/tmp/necro-data/skillsData.js");
const minions = require("/tmp/necro-data/minionsData.js");
const regions = require("/tmp/necro-data/regionsData.js");
const altar = require("/tmp/necro-data/altarData.js");
const data = {
  activeSkills: skills.ACTIVE_SKILLS,
  passiveSkills: skills.PASSIVE_SKILLS,
  awakenedSkills: skills.AWAKENED_SKILLS,
  minions: Object.values(minions.MINIONS_DATA),
  regions: Object.values(regions.REGIONS_DATA),
  combatTraits: altar.COMBAT_TRAITS,
  survivalTraits: altar.SURVIVAL_TRAITS,
  legacyAltarItems: altar.LEGACY_ALTAR_ITEMS,
};
fs.writeFileSync("public/gallery/gallery_data.js", "window.GALLERY_DATA = " + JSON.stringify(data) + ";\n");
' && rm -rf /tmp/necro-data
```

---

## 3. Firebase Hosting 배포 가이드

### 3.1 프로젝트 설정
- **Firebase Project ID**: `project-necro-54deb` (`.firebaserc`에 기본 프로젝트로 지정됨)
- **Hosting 설정 (`firebase.json`)**:
  - `public`: `"dist"` (Vite 빌드 시 `public/` 하위의 `assets/`와 `gallery/`가 `dist/`로 자동 복사됨)
  - `rewrites`: `**` ➔ `/index.html` (단, `dist/gallery/index.html`처럼 실제 파일이 존재하면 정적 파일이 우선 서빙됨)

### 3.2 빌드 및 배포 명령어
```bash
cd necro-survivors

# 1. TypeScript 타입 체크 및 Vite 프로덕션 빌드 (dist/ 생성)
npm run build

# 2. Firebase Hosting 배포
firebase deploy --only hosting
# (환경에 따라 /home/antigravity/.local/bin/firebase deploy --only hosting 사용)
```

### 3.3 배포 확인
- 배포 완료 시 `dist/` 내 정적 파일(`index.html`, JS 번들, `assets/`, `gallery/`)이 일괄 업로드됩니다.
- 메인 게임: `https://project-necro-54deb.web.app/`
- 비교 갤러리: `https://project-necro-54deb.web.app/gallery/`
