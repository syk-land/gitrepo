# 💀 Necro Survivors — 반응형 해상도 · 고급 타이포그래피 · 버그 수정 마스터 플랜

> **문서 목적**: `necro-survivors`에서 화면 크기(해상도)가 바뀔 때 발생하는 **폰트 및 이미지 깨짐 현상**의 근본 원인을 분석하고, **반응형 레이아웃 전환 · 고급 다크 판타지 폰트 도입 · 에셋 렌더링 보정 · 인게임 버그 7종 패치**를 수행하기 위한 종합 분석 및 실행 계획서입니다.

---

## 1. 폰트 · 이미지 · 에셋 현황 및 깨짐 원인 분석

### 1.1 해상도 변경 시 폰트 및 이미지가 깨지는 근본 원인

| 현상 | 관련 파일 및 위치 | 근본 원인 진단 |
| :--- | :--- | :--- |
| **해상도 변경 시 폰트 획 탈락 / 깨짐** | [`index.html`](../index.html)<br>[`src/main.ts`](../src/main.ts) | 1. **비트맵 폰트의 비정수 크기 사용**: `NeoDunggeunmo`는 `16px` 정수 배수(`16px`, `32px`)에서만 도트 격자가 맞는 비트맵 폰트이나, 인게임 UI 전반에서 `11px`, `12px`, `13px`, `14px`, `15px`, `17px`, `18px`, `20px`, `22px` 등 비정수 크기로 렌더링됨.<br>2. **WebGL `NEAREST` 강제 샘플링**: `src/main.ts`의 `antialias: false`, `antialiasGL: false` 설정으로 인해 Phaser가 `GameObjects.Text`의 내부 캔버스 텍스처까지 `NEAREST`(최근접 이웃) 필터로 샘플링함. 브라우저 창 크기가 변해 캔버스가 소수점 배율(예: `0.81x`, `1.17x`)로 스케일링될 때 글자 픽셀 행/열이 불균일하게 탈락함.<br>3. **이모지 상하단 클리핑**: `Text` 객체에 기본 `padding`이 없어 도트 폰트 메트릭 높이를 초과하는 이모지(`💀`, `⚔️`, `📜`, `✨`)의 상하단 1~2px이 잘림. |
| **이미지 미세 깨짐 (계단 현상 · 울렁임)** | [`src/main.ts`](../src/main.ts)<br>[`src/entities/Player.ts`](../src/entities/Player.ts)<br>[`src/entities/Enemy.ts`](../src/entities/Enemy.ts)<br>[`src/scenes/UIScene.ts`](../src/scenes/UIScene.ts) | 원본 PNG 에셋(`810x810`, `224x224`, `190x190`, `180x180`, `128x128`)을 인게임에서 `setDisplaySize(64, 64)`, `48x48`, `54x54`, `62x62`, `72x72`, `110x110` 등 **비정수 비율로 축소**하면서 `NEAREST` 필터가 적용되어, 특정 픽셀 줄이 건너뛰어지며 도트 외곽선이 찌그러지고 이동 시 울렁임(Shimmering)이 발생함. |
| **고정 뷰포트 한계** | [`index.html`](../index.html)<br>[`src/main.ts`](../src/main.ts) | `#app` 컨테이너가 고정 `max-width: 540px; max-height: 960px;`에 묶여 있고, 창 리사이즈(`resize`) 시 동적 DPI 및 캔버스 리프레시 처리가 없어 다양한 모바일·태블릿·데스크톱 해상도에 유연하게 대응하지 못함. |

### 1.2 게임 에셋(총 200종) 전수 감사 결과
- **파일 무결성**: `src/` 코드에서 참조하는 `public/assets/` 내 200개 PNG 파일 및 `public/gallery/legacy/` 비교용 에셋 전원 실재 확인 (`Missing: 0`).
- **알파 채널(투명도)**: 캐릭터(1종), 소환수(5종), 몬스터(84종), 스킬 아이콘(45종), 인게임 VFX(26종), 게이트(6종) 모두 `RGBA (Color Type 6)` 투명 배경 적용 완료.
- **추가 개선이 필요한 에셋/시각 요소**:
  1. **인게임 VFX 미분리 12종 ([`BootScene.ts`](../src/scenes/BootScene.ts))**: 신규 분리된 원소·창술 계열 12개 스킬(`storm_thunder`, `cryo_snowball`, `fire_ball`, `fire_storm`, `spear_crimson`, `spear_heaven` 및 각성 6종)이 전용 VFX 대신 UI 아이콘(`skill.icon`)을 투사체/장판 텍스처로 공유 중.
  2. **스킬 아이콘 중복 3쌍 ([`skillsData.ts`](../src/data/skillsData.ts))**:
     - `파이어스톰`(`fire_storm`) & `인페르노 헬파이어`(`awakened_firestorm`) ➔ `assets/pixel_vfx/skills/vfx_mk_ult.png`
     - `파천적호창`(`spear_heaven`) & `패왕: 파천만리창`(`awakened_spear_heaven`) ➔ `assets/pixel_vfx/skills/vfx_guard_ult.png`
     - `템페스트 아크 노바`(`awakened_chain`) & `천벌: 뇌제 강림`(`awakened_thunder`) ➔ `assets/pixel_vfx/skills/vfx_storm_ult.png`
  3. **캔버스 대비 실루엣이 작은 스프라이트**: `assets/monsters/m_7_3.png`(불투명 픽셀 비율 6.5%), `assets/skills/vfx/vfx_sniper_shot.png`(3.9%)는 여백 비율이 높아 인게임 `setDisplaySize` 적용 시 상대적으로 작게 보임.
  4. **부트 씬 안내 문구 불일치 ([`BootScene.ts`](../src/scenes/BootScene.ts))**: 실제 에셋 수(200종)와 다른 `'1,950개 도트 에셋 및 차원문 동기화 중...'` 문구 표시.

---

## 2. 반응형 레이아웃 · 고급 폰트 · 이미지 선명도 개선 계획

### 2.1 고급 다크 판타지 타이포그래피 도입
- **폰트 스택 개편 (`index.html`, `public/gallery/index.html`, `src/main.ts`)**:
  - 기존 비트맵 도트 폰트(`NeoDunggeunmo`)를 제거하고, 해상도 무관 벡터 윤곽선 기반의 고급 다크 판타지 타이포그래피로 교체합니다.
  - **타이틀 / 헤더 / 모달 제목**: `'Cinzel'`, `'Gowun Batang'`, `'Noto Serif KR'`, `serif` (중후하고 고급스러운 사령군주 다크 판타지 분위기 연출)
  - **HUD 수치 / 스킬 설명 / 본문 UI**: `'Pretendard Variable'`, `'Pretendard'`, `-apple-system`, `sans-serif` (작은 크기 및 화면 축소 시에도 극강의 가독성 확보)
- **Phaser `Text` 슈퍼샘플링 & `LINEAR` 필터 강제 (`src/main.ts`)**:
  - `Phaser.GameObjects.GameObjectFactory.prototype.text` 패치 고도화:
    - `resolution`: `Math.min(3, Math.max(2, Math.ceil((window.devicePixelRatio || 1) * 2)))`로 고밀도 캔버스 텍스처 생성.
    - 생성된 텍스트 객체에 `textObj.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)`를 즉시 적용하여 축소·확대 시 글자 획 깨짐을 원천 차단.
    - `padding: { x: 4, y: 3 }` 및 기본 텍스트 그림자(`shadow`) 보강으로 이모지 클리핑 방지 및 시인성 강화.

### 2.2 반응형 해상도 대응 및 이미지 깨짐 방지
- **WebGL 바이리니어 보간(Linear Filtering) 활성화 (`src/main.ts`)**:
  - `pixelArt: false`, `antialias: true`, `antialiasGL: true` 설정으로 비정수 배율(`setDisplaySize`) 축소 시 발생하는 픽셀 탈락 및 외곽선 자글거림(Aliasing)을 방지합니다.
- **반응형 뷰포트 & 리사이즈 처리 (`index.html`, `src/main.ts`)**:
  - `100dvh` / `100vw` 기반 반응형 컨테이너(`#app`) 및 모바일 안전 영역(`env(safe-area-inset-*)`) 대응.
  - 데스크톱/태블릿에서는 우아한 다크 골드 프레임과 그림자를 유지하며 창 높이에 맞춰 비율을 자동 스케일링하고, 모바일 세로 화면에서는 꽉 찬 화면으로 매끄럽게 대응.
  - `window.addEventListener('resize')` 연동으로 브라우저 해상도 변경 시 `game.scale.refresh()` 즉시 수행.

---

## 3. 인게임 코드 & 밸런스 버그 7종 패치 계획

| 번호 | 심각도 | 대상 파일 및 위치 | 버그 현상 및 원인 | 패치 명세 |
| :---: | :---: | :--- | :--- | :--- |
| **1** | **Critical** | [`BattleScene.ts`](../src/scenes/BattleScene.ts) (`L237-L245`) | **드론 각성 시 데미지·관통력 역하락 버그**:<br>`외계 강습 드론`(`psi_drone`, Lv.5 계수 2.6, 관통 5)이 `이단참모 벨록의 함대`(`awakened_drone`)로 각성되면 `activeSkills`에서 `'psi_drone'`이 삭제됨. 이후 드론 사격 시 `activeSkills.get('psi_drone') ?? 1`을 참조해 Lv.1(계수 1.0, 관통 1)로 추락함 (-62% 화력 감소). | `this.player.activeSkills.has('awakened_drone')` 여부를 먼저 확인하여 각성 시 계수 `4.5`(각성 명세), 관통 `8`, 탄속 `600`을 적용하도록 수정. |
| **2** | **Critical** | [`BattleScene.ts`](../src/scenes/BattleScene.ts) (`L202-L329`) | **동일 프레임 모달 덮어쓰기(승리창 증발) 버그**:<br>`update()` 루프 중간에 보스 처치(`handleStageClear` ➔ 승리 모달 오픈)나 레벨업이 발생해 `this.isPaused = true`가 되어도 `update()`가 중단되지 않고 같은 프레임의 보석 수집·상자·양피지 접촉을 계속 실행함. 이로 인해 `modalContainer.removeAll(true)`가 호출되어 **승리 결과창이 레벨업/양피지 모달에 덮어써져 스테이지 클리어가 불가능**해짐. | `BattleScene.update()` 내 각 단계(소환수 공격, 투사체 업데이트, 보석 수집, 보물상자 접촉, 양피지 접촉) 직후 `if (this.isPaused) return;` 가드를 추가하여 모달 중첩 덮어쓰기를 차단. |
| **3** | **High** | [`BattleScene.ts`](../src/scenes/BattleScene.ts) (`L290`, `L622`)<br>[`UIScene.ts`](../src/scenes/UIScene.ts) (`L662`, `L867`, `L1047`) | **영혼 각인 제단 `골드 획득(talent_merchant)` 미작동 버그**:<br>`Player.getEffectiveStats()`에서 `stats.goldMul`(레벨당 +15%)을 계산하지만, 실제 골드 획득 코드에서 `goldMul`을 전혀 곱하지 않아 제단 강화 효과가 0%임. | 보석 골드 수집(`gem.goldValue`), 상자/양피지 대체 골드, 스테이지 클리어/패배 기본 골드 보상에 `stats.goldMul` 배율을 일관되게 적용. |
| **4** | **Medium** | [`LevelUpManager.ts`](../src/systems/LevelUpManager.ts) (`L43-L47`)<br>[`BattleScene.ts`](../src/scenes/BattleScene.ts) (`L602-L619`) | **`마력폭풍(necro_bone_storm)` 각성 후 재출현 버그**:<br>`necro_spear`(Lv.3~4) + `necro_bone_storm`(Lv.5) 상태에서 상자를 열면 `necro_bone_storm`이 `awakened_spear`로 진화하며 삭제됨. 그러나 `awakened_spear.evolvesFrom`은 `'necro_spear'`로만 등록되어 있어 다음 레벨업 시 `necro_bone_storm` Lv.1이 해금 확정 슬롯으로 다시 등장함. | `awakened_spear` 보유 시 `necro_spear`와 `necro_bone_storm` 모두 진화 완료된 것으로 간주하여 레벨업 후보군에서 제외. |
| **5** | **Medium** | [`SkillExecutor.ts`](../src/systems/SkillExecutor.ts)<br>[`Projectile.ts`](../src/entities/Projectile.ts)<br>[`MinionUnit.ts`](../src/entities/MinionUnit.ts) | **스킬/소환수 툴팁 명세 미구현 효과 6건**:<br>1) `리치 군주의 저주구체`(`necro_lich_curse`): 광역 둔화 폭발(`areaRadius: 60~115`) 미구현 (단일 타격만 수행)<br>2) `만검귀종: 진 청룡참`(`awakened_dragon`): *"전후좌우 8방향 동시 방출"* 미구현 (좁은 전방 부채꼴 발사)<br>3) `발키리 부대`(`awakened_armor`): *"타격 시 체력 회복(흡혈)"* 미구현<br>4) `아발론의 흑염 단두대`(`awakened_grip`): *"체력 35% 이하 즉사급 처형"* 미구현<br>5) `대구경 관통 저격 Lv.5` / `50km 공간 굴절 저격`: *"보스/엘리트 대상 확정 치명타"* 미구현<br>6) `해골 군단 소환`(`necro_legion` Lv.2/4/5) & `외계 강습 드론`(`psi_drone` Lv.2): 소환수 체력(+25%), 공격력(+30%), 부활시간 절반, 드론 공격주기(-20%) 미반영 | 1) `Projectile.ts`: `necro_lich_curse` 명중 시 `areaRadius` 반경 광역 폭발 피해(70%) 및 상태이상 부여 추가<br>2) `SkillExecutor.ts`: `awakened_dragon` 발사 시 `necro_bone_storm`과 동일하게 360도 균등 방사(`(Math.PI * 2) / totalProjectiles`) 적용<br>3) `Projectile.ts`: `awakened_armor` 적 타격 시 플레이어 체력 회복 추가<br>4) `Projectile.ts`: `awakened_grip` 타격 시 대상 체력 35% 이하일 때 일반/정예 즉사급(10배) 처형 및 보스/네임드 2배 처형 피해 적용<br>5) `Projectile.ts`: `sniper_shot`(Lv.5) 및 `awakened_sniper`가 보스/네임드/엘리트 타격 시 확정 치명타 적용<br>6) `MinionUnit.ts`: 플레이어의 `necro_legion` 및 `psi_drone`/`awakened_drone` 레벨을 조회하여 체력·공격력·부활시간·공격주기 보너스 실시간 반영 |
| **6** | **Low** | [`HubScene.ts`](../src/scenes/HubScene.ts) (`L28-L30`, `L131-L155`) | **거점 마을 배경(`town_bg`) 미갱신 버그**:<br>로비에서 `◀`/`▶` 버튼으로 1~14지역을 넘길 때 카드 텍스트만 바뀌고 배경 이미지(`town_bg_${this.selectedRegionId}`)가 갱신되지 않음. | 배경 이미지를 `private townBg!: Phaser.GameObjects.Image` 프로퍼티로 보관하고 지역 변경 시 `this.townBg.setTexture('town_bg_' + this.selectedRegionId)` 호출. |
| **7** | **Low** | [`Enemy.ts`](../src/entities/Enemy.ts) (`L213-L223`, `L273-L283`) | **감전(`shock`) 틴트 복구 누락 및 출혈(`bleed`) 판정 우회**:<br>- 피격 플래시 종료 시 `shockTimer` 분기가 없어 감전 보라색(`0xaa88ff`)이 둔화 파란색(`0x3388ff`)으로 덮어써짐.<br>- 출혈 도트 피해가 감전 피해 증폭(`shockAmp`) 및 화면 내 유효 범위 체크를 우회함. | 피격 플래시 복구 분기에 `else if (this.shockTimer > 0) this.sprite.setTint(0xaa88ff);`를 우선 배치하고, 출혈 틱 피해 계산 시 `shockAmp` 배율을 반영. |

---

## 4. 수정 대상 파일 요약 (총 12개 파일)

| 순번 | 파일 경로 | 주요 변경 내용 |
| :---: | :--- | :--- |
| 1 | [`index.html`](../index.html) | 고급 폰트(`Cinzel`, `Gowun Batang`, `Pretendard`) 로드 및 반응형 레이아웃 CSS |
| 2 | [`public/gallery/index.html`](../public/gallery/index.html) | 갤러리 고급 타이포그래피 통일 및 반응형 그리드 다듬기 |
| 3 | [`src/main.ts`](../src/main.ts) | `Text` 슈퍼샘플링 + `LINEAR` 필터 패치, `antialias: true`, 리사이즈 핸들러 |
| 4 | [`src/scenes/BootScene.ts`](../src/scenes/BootScene.ts) | 부트 로딩 UI 타이포그래피 및 에셋 수량 문구(`200종`) 정정 |
| 5 | [`src/scenes/HubScene.ts`](../src/scenes/HubScene.ts) | 지역 변경 시 `townBg` 배경 텍스처 실시간 교체 및 고급 폰트 스타일 반영 |
| 6 | [`src/scenes/BattleScene.ts`](../src/scenes/BattleScene.ts) | 모달 덮어쓰기 방지 가드, 드론 각성 스탯 수정, 골드 획득 배율(`goldMul`) 반영 |
| 7 | [`src/scenes/UIScene.ts`](../src/scenes/UIScene.ts) | 상자/양피지/정산 골드 `goldMul` 반영 및 HUD/모달 타이포그래피 개선 |
| 8 | [`src/systems/LevelUpManager.ts`](../src/systems/LevelUpManager.ts) | `awakened_spear` 보유 시 `necro_bone_storm` 재등장 차단 |
| 9 | [`src/systems/SkillExecutor.ts`](../src/systems/SkillExecutor.ts) | `awakened_dragon` 360도 8방향 방출 및 저격 확정 치명타 정보 전달 |
| 10 | [`src/entities/Projectile.ts`](../src/entities/Projectile.ts) | `necro_lich_curse` 광역 폭발, `awakened_armor` 흡혈, `awakened_grip` 처형, 저격 보스 확정 치명타 |
| 11 | [`src/entities/MinionUnit.ts`](../src/entities/MinionUnit.ts) | `necro_legion` Lv.2/4/5 및 `psi_drone` Lv.2/각성 스탯·공격주기·부활시간 보너스 반영 |
| 12 | [`src/entities/Enemy.ts`](../src/entities/Enemy.ts) | 피격 후 감전(`shock`) 보라색 틴트 복구 및 출혈 감전 증폭 반영 |

---

## 5. 사이드이펙트 및 검증 절차

### 5.1 예상 사이드이펙트
- **세이브 호환성**: `SaveData`(`PROJECT_NECRO_SURVIVORS_SAVE_V1`) 구조 변경 없음 (기존 진행도·골드·제단 레벨 100% 유지).
- **성능**: WebGL 하드웨어 `LINEAR` 샘플링과 `Text` 생성 시점 필터 지정만 사용하므로 `update()` 루프 내 GC 할당이나 프레임 드랍 없음.
- **밸런스**: 기존에 작동하지 않던 각성 드론, 골드 특성, 리치 저주구체 폭발, 진 청룡참 8방향, 해골 군단 레벨업 보너스가 설명대로 작동하여 중후반 성장 체감이 정상화됨.

### 5.2 검증 명령어
```bash
cd /home/syk4441/gitrepo/necro-survivors
npm run build   # tsc && vite build (0 errors 필수)
```
