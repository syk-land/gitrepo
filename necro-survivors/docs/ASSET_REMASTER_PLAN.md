# 🎨 Necro Survivors — 16비트 픽셀 아트 에셋 고도화 마스터 플랜

> **문서 목적**: 구 버전 RPG(`project_necro`) 개발을 영구 동결하고, 현재 주력 프로젝트인 **뱀서류 액션 RPG `necro-survivors`**의 실사용 에셋 **총 200종**을 정통 16비트 레트로 도트 그래픽으로 일원화·고도화하기 위한 실행 계획서입니다.

---

## 1. 프로젝트 전환 및 기본 원칙

1. **구 RPG (`project_necro/`) 동결**
   - `project_necro/`의 추가 기능 및 에셋 개발은 중단합니다.
   - 단, `project_necro/`에서 이미 고품질 16비트 도트로 리마스터 완료된 에셋 중 **`necro-survivors`와 동일한 파일 경로를 쓰는 에셋(총 55종)**은 즉시 `necro-survivors/public/assets/`로 이관하여 재사용합니다.
2. **아트 디렉션 (16-Bit SNES Action RPG & Survivors)**
   - **영웅 & 소환수**: 우측(또는 정면 부유) 지향 깔끔한 16비트 도트 스프라이트, 바닥 그림자/발판/과도한 외곽 글로우 배제, `0px` 투명 누끼.
   - **몬스터 (84종)**: 좌측을 향해 돌진·공격하는 역동적인 16비트 픽셀 스프라이트 (`180x180`, 투명 배경).
   - **스킬 아이콘 & VFX**: 프로그래매틱(파이썬 도형 그리기)으로 임시 생성된 단조로운 아이콘/이펙트를 밀도 높은 16비트 도트 아트로 전면 교체.
   - **갤러리 연동**: 리마스터된 모든 에셋은 `necro-survivors/public/gallery/` (`https://project-necro-54deb.web.app/gallery/`)에서 구버전(`legacy/`) vs 신버전 비교 및 도감으로 즉시 확인 가능하도록 유지.

---

## 2. `necro-survivors` 전체 에셋 현황 감사 (총 200종)

현재 `necro-survivors/public/assets/`에 존재하는 200개 PNG 파일의 상태와 고도화 분류는 다음과 같습니다.

| 카테고리 | 경로 (`public/assets/...`) | 수량 | 현재 상태 진단 | 고도화 방식 |
| :--- | :--- | :---: | :--- | :--- |
| **1. 영웅** | `agents/agent_male_nemesis.png` | **1** | 구 버전 2D 벡터 일러스트 (`1024x1024`) | `project_necro`에서 완성한 **16비트 최미남 헌터 도트 스프라이트**로 즉시 교체 |
| **2. 전투 배경 (1~14지역)** | `ui/regions/battle_bg_1~14.png` | **14** | 구 버전 저해상도/일관성 부족 배경 | `project_necro`에서 Colab SDXL로 생성 완료한 **16비트 전투 배경 14종** 즉시 이관 |
| **3. 거점 배경 (1~14지역)** | `ui/regions/town_bg_1~14.png` | **14** | 구 버전 미개선 배경 | Colab API (`SDXL + Pixel Art XL LoRA`)로 **14개 지역 거점/마을 16비트 배경** 신규 생성 |
| **4. 게이트 & 한지 UI & 코어** | `ui/gates/gate_*.png` (6)<br>`ui/ui_*.png` (3)<br>`ui/items_sets/set_necro_core.png` (1)<br>`ui/item_parchment.png` (1) | **11** | `item_parchment` 외 10종이 구 버전 이미지 | `project_necro`에서 리마스터 완료된 **게이트 6종 + 한지/목판 UI 3종 + 네크로 코어 1종** 즉시 이관 (`item_parchment` 1종 추가 고도화) |
| **5. 몬스터 (1~5지역)** | `monsters/m_1_1` ~ `m_5_boss.png` | **30** | 구 버전 몬스터 스프라이트 | `project_necro`에서 `generate_image`로 완성한 **1~5지역 16비트 공격 포즈 몬스터 30종** 즉시 이관 |
| **6. 몬스터 (6~14지역)** | `monsters/m_6_1` ~ `m_14_boss.png` | **54** | 구 버전 몬스터 스프라이트 | `generate_image` 쿼터 복구 시(또는 고품질 크로마키 파이프라인) **6~14지역 54종** 순차 리마스터 |
| **7. 소환수 군단** | `summons/minion_*.png` (`warrior`, `archer`, `mage`, `arthur`, `drone`) | **5** | 파이썬 스크립트로 그린 단순 도형(해골 머리) 형태 |A안: `project_necro`의 **정통 16비트 전신 공격 도트 스프라이트 5종** 이관<br>B안: 부유 해골 컨셉 유지하되 고밀도 16비트 도트로 리마스터 |
| **8. 스킬/패시브/각성 아이콘 (구 VFX 참조분)** | `pixel_vfx/skills/vfx_*.png` | **23** | 구 `project_necro`의 저해상도(`64x64`) 구형 VFX 아이콘 | Colab API로 **16비트 고밀도 스킬/각성 아이콘 23종** 일괄 생성 (순수 흑색 배경 ➔ 알파 추출) |
| **9. 신규 스킬 & 패시브 아이콘** | `skills/skill_*.png` | **22** | `scripts_generate_cute_icons.py`로 그린 단순 도형 도트 (`64x64`) | Colab API로 **16비트 정통 RPG 스킬/패시브 아이콘 22종** 고도화 |
| **10. 인게임 스킬 & 소환수 투사체 VFX** | `skills/vfx/vfx_*.png` | **26** | `scripts_generate_ingame_vfx.py`로 그린 단순 원형/직선 도형 (`64x64`) | Colab API로 **인게임 타격/투사체/장판 전용 16비트 VFX 스프라이트 26종** 고도화 |
| **합계** | | **200** | **즉시 이관 가능: 55종 (또는 소환수 포함 60종)** | **신규 생성 대상: 140~145종** |

---

## 3. 단계별 실행 로드맵 (4-Phase Pipeline)

### 🚀 Phase 1: 기완료 고품질 16비트 에셋 즉시 이관 (0분 소요 · 총 55~60종)
이미 `project_necro`에서 검증 완료된 16비트 리마스터 에셋을 `necro-survivors/public/assets/`로 복사합니다. (구 원본은 필요 시 `public/gallery/legacy/`에 보존)
- **영웅 (1종)**: `hero_choiminam_clean_hunter.png` ➔ `public/assets/agents/agent_male_nemesis.png`
- **전투 배경 (14종)**: `battle_bg_1~14.png` ➔ `public/assets/ui/regions/`
- **게이트 & UI & 코어 (10종)**: `gate_iron~diamond.png` (6종), `ui_joseon_frame_cropped.png`, `ui_hanji_card_cropped.png`, `ui_hanji_center_tile.png`, `set_necro_core.png`
- **1~5지역 몬스터 (30종)**: `m_1_1.png` ~ `m_5_boss.png` ➔ `public/assets/monsters/`
- **(선택) 소환수 (5종)**: `minion_skeleton_warrior`, `archer`, `mage`, `minion_death_knight`(`minion_arthur.png`), `combat_drone_trans`(`minion_drone.png`)

### 🌐 Phase 2: Colab 무료 T4 API 기반 배경 · 아이콘 · VFX 고도화 (총 86종)
Colab `SDXL + Pixel Art XL LoRA` 서버가 열려 있는 동안, 캐릭터 외 배경/아이콘/이펙트 에셋을 20~25개 단위 배치(Auto-Resume 적용)로 생성합니다.
1. **14개 지역 거점 배경 (`town_bg_1~14.png`, 14종)**
   - 해상도: `1024x576` 생성 후 `640x360` (`Image.NEAREST`) 리사이즈.
   - 컨셉: 각 지역(서울 지하철 캠프, 북한산 진지, 인천항 부두, 설악산 산장, 벙커 지휘소, 도쿄 신사, 마카오 카지노 등)의 안전한 전초기지/야영지 16비트 풍경.
2. **각성/상위 스킬 아이콘 (`pixel_vfx/skills/vfx_*.png`, 23종)**
   - `skillsData.ts`에서 액티브 6종(`storm_3`, `cryo_1`, `mk_2`, `mk_ult`, `guard_2`, `guard_ult`), 패시브 2종(`storm_4`, `guard_4`), 각성 스킬 18종의 아이콘으로 사용되는 파일들.
   - 해상도: `128x128` 정통 16비트 스킬 아이콘.
3. **신규 스킬 & 패시브 아이콘 (`skills/skill_*.png`, 22종)** + **양피지 (`ui/item_parchment.png`, 1종)**
   - 파이썬 코드로 임시 제작된 22종을 고밀도 16비트 도트 아이콘(`128x128`)으로 업그레이드.
4. **인게임 전투 VFX & 투사체 (`skills/vfx/vfx_*.png`, 26종)**
   - 인게임 `SkillExecutor.ts`에서 회전·발사·장판으로 렌더링되는 투사체/이펙트(`vfx_necro_spear`, `vfx_sm_dragon`, `vfx_minion_arrow` 등 26종).
   - 순수 흑색 배경 생성 ➔ 루미넌스 알파 추출(`black_to_alpha_vfx`)로 외곽 사각 테두리 없이 깔끔하게 인게임 합성.

### 👾 Phase 3: 6~14지역 몬스터 54종 리마스터
- **대상**: `public/assets/monsters/m_6_1.png` ~ `m_14_boss.png` (총 54종: 일반 36 · 네임드 9 · 보스 9)
- **도구**: 내장 `generate_image` (`gemini-3.1-flash-image`) 쿼터 복구 시 최우선 생성 (좌측 지향 역동적 물리 공격 포즈, 바닥 그림자/이펙트 배제, `180x180` 투명 누끼).

### 🖼️ Phase 4: 갤러리(`public/gallery/`) 업데이트 및 Firebase 배포
1. `public/gallery/legacy/`에 구버전 샘플 백업 추가 및 `public/gallery/index.html` 비교 탭에 **영웅 · 배경 · 몬스터 · 스킬 아이콘 · 인게임 VFX Before/After** 반영.
2. `npm run build` 실행으로 `dist/` 프로덕션 번들 생성 및 검증.
3. GitHub(`syk-land/gitrepo`) 푸시 및 Firebase Hosting(`project-necro-54deb`) 배포.
