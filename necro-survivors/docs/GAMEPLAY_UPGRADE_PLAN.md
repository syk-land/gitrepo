# Necro Survivors 게임성 고도화 마스터 계획서 (`GAMEPLAY_UPGRADE_PLAN.md`)

본 문서는 [necro-survivors](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Ftree%252Fmain%252Fnecro-survivors)의 현재 코드베이스(Phaser 3 + TypeScript + Vite)를 기준으로 전투 리듬, 사령군주 정체성, 빌드 깊이, 메타 성장을 4단계(Phase 1\~4)에 걸쳐 고도화하기 위한 실행 계획서입니다. 프로젝트 규칙([GEMINI.md](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252FGEMINI.md))에 따라 각 단계별 **수정 대상 파일, 변경 요지, 데이터/타입 설계, 예상 사이드이펙트(밸런스·성능·세이브 호환성), 검증 방법**을 명시합니다.

## 전체 고도화 로드맵 요약

| 단계 | 핵심 목표 | 주요 기능 | 우선순위 | 세이브 호환 영향 | 
| ----- | ----- | ----- | ----- | ----- | 
| **Phase 1** | 전투 긴장감과 보스전 고도화 | 적 아키타입 4종, 보스/수문장 예고 패턴 3종, 웨이브 포메이션 이벤트, 지역별 스탯 스케일링 연동 | 최상 | 없음 | 
| **Phase 2** | 사령군주 손맛과 필드 인터랙션 | 그림자 대시(회피기), 사령 추출(정예 임시 부활), 필드 파괴 오브젝트·저주 제단, 시체/드랍 시인성·히트스톱 | 상 | 없음 | 
| **Phase 3** | 빌드 깊이와 각성 템포 개선 | 3계열 원소 반응 시너지 5종, 레벨업 리롤·제외(밴), 정예 각성 상자 확장, 연속 처치 피버 | 중상 | 없음 | 
| **Phase 4** | 장기 리플레이와 메타 성장 | 결과창 스킬별 DPS 미터, 보스 영혼 유물 3슬롯, 무한 모드(Endless) & 스테이지 미션 | 중 | `SaveData` 확장 (하위 호환) | 

## Phase 1. 전투 리듬과 보스전 고도화

현재 [Enemy.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fentities%252FEnemy.ts)는 일반·정예·네임드·보스 모두 타겟으로 직진해 접촉 피해만 주며, [WaveSpawner.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fsystems%252FWaveSpawner.ts)는 4변 랜덤 스폰만 수행하고 [regionsData.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fdata%252FregionsData.ts)의 `baseEnemyHp`·`baseEnemyAtk`를 사용하지 않고 있습니다.

### 1.1 수정 및 신설 대상 파일

| 구분 | 파일 경로 | 변경 요지 | 
| ----- | ----- | ----- | 
| 수정 | [src/data/types.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fdata%252Ftypes.ts) | `EnemyBehaviorType`, `BossPatternId`, `EnemyProjectileSpec`, `WaveFormationType` 타입 추가 | 
| 신설 | `src/data/enemyPatternsData.ts` | 적 아키타입별 수치, 보스/네임드 패턴 쿨타임·예고 시간·피해 배율, 웨이브 포메이션 테이블 선언 | 
| 신설 | `src/entities/EnemyProjectile.ts` | 적 전용 투사체(플레이어·소환수 피격 판정, 오브젝트 풀링 또는 수명 관리) | 
| 수정 | [src/entities/Enemy.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fentities%252FEnemy.ts) | `behaviorType`별 AI 분기(직진/원거리/돌진/자폭), 보스 예고 장판(텔레그래프) 및 패턴 실행 FSM 추가 | 
| 수정 | [src/systems/WaveSpawner.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fsystems%252FWaveSpawner.ts) | `regionsData.ts`의 `baseEnemyHp`/`baseEnemyAtk` 스케일링 연결, 100초 주기 포메이션 스폰(포위 링·일렬 러시) 추가 | 
| 수정 | [src/scenes/BattleScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FBattleScene.ts) | `enemyProjectiles` 배열 업데이트 및 플레이어/소환수 충돌 처리, 보스 예고 그래픽 레이어 정리 | 

### 1.2 상세 설계

#### 적 아키타입 4종 (`EnemyBehaviorType`)

지역별 4종 일반 몬스터(`m_{r}_1` \~ `m_{r}_4`)에 웨이브별로 역할을 자동 배정해 에셋 추가 없이 전투 밀도를 높입니다.

| 아키타입 | 대상 슬롯 | 행동 패턴 | 전투 역할 | 
| ----- | ----- | ----- | ----- | 
| `chaser` | `m_{r}_1` | 기존 직진 추적 (이동속도 1.0배) | 기본 물량 및 경험치 공급 | 
| `charger` | `m_{r}_2` | 거리 220px 이내 진입 시 0.6초 멈춤(붉은 점멸) 후 직선 2.4배속 돌진 | 플레이어 동선 압박 | 
| `ranged` | `m_{r}_3` | 거리 260px 유지, 2.8초마다 플레이어 방향 저속 탄환 1발 발사 | 제자리 버티기 방지 | 
| `exploder` | `m_{r}_4` | 사망 시 0.45초 팽창 예고 후 반경 75px 자폭 (주변 적에게도 약한 넉백) | 근접 겹침 리스크 유도 | 

#### 네임드·보스 패턴 3종 (`BossPatternId`)

* **예고 돌진 (`telegraph_dash`)**: 바닥에 붉은 반투명 직사각 경로(0.8초) 표시 후 고속 돌파. 수문장(400초) 기본 보유.

* **원형 장판 폭격 (`aoe_ring`)**: 플레이어 주변 3\~5곳에 원형 경고(1.0초) 표시 후 동시 폭발. 지역 보스(500초) 보유.

* **부채꼴 탄막 (`radial_barrage`)**: 보스 중심 8\~12방향 저속 탄환 발사. 체력 50% 이하(2페이즈) 진입 시 2연속 발사로 강화.

#### 지역별 스탯 스케일링 정상화

* [WaveSpawner.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fsystems%252FWaveSpawner.ts)의 일반 몬스터 체력/공격력을 `this.region.baseEnemyHp * waveHpMul[currentWave]` 및 `this.region.baseEnemyAtk * waveAtkMul[currentWave]` 기반으로 교체해 1\~14지역 간 체감 난이도 곡선을 복원합니다.

* 웨이브 전환 시점(100초, 200초, 300초)에 **포위 링(16기 원형 배치)** 또는 **양측 협공 러시(12기 동시 진입)** 이벤트를 1회 트리거합니다.

### 1.3 예상 사이드이펙트 및 대응

* **밸런스**: 원거리 탄막과 보스 패턴 추가로 초반 피격 빈도가 증가할 수 있음. 1웨이브(0\~100초)는 `chaser` 위주로 유지하고, 적 투사체 속도는 플레이어 기본 이속(165px/s)보다 약간 빠른 210\~240px/s로 제한해 회피 가능하게 설계합니다.

* **성능(GC)**: `EnemyProjectile` 최대 동시 활성 수를 60개로 상한하고, 텔레그래프용 `Phaser.GameObjects.Graphics`는 매 프레임 새로 생성하지 않고 보스/씬 단위 단일 객체를 `clear()` 재사용합니다.

* **세이브 호환성**: 영향 없음.

### 1.4 검증 방법

* `npm run build` (`tsc && vite build`) 0 errors 확인.

* 1지역(서울)과 8지역(시베리아)에서 1\~6웨이브 2배속 테스트: (1) 2\~4웨이브 아키타입별 행동 분기, (2) 400초 수문장 예고 돌진 및 500초 보스 2페이즈 패턴 발동, (3) 60fps 유지 및 씬 종료 시 `EnemyProjectile`/예고 그래픽 메모리 누수 없음 확인.

## Phase 2. 사령군주 손맛과 필드 인터랙션

현재 [Player.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fentities%252FPlayer.ts)는 이동과 12초 쿨타임 광역기만 존재하고, [BattleScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FBattleScene.ts)는 빈 무한 평지이며, `recentCorpses`는 눈에 잘 띄지 않아 전략적 활용이 어렵습니다.

### 2.1 수정 및 신설 대상 파일

| 구분 | 파일 경로 | 변경 요지 | 
| ----- | ----- | ----- | 
| 수정 | [src/entities/Player.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fentities%252FPlayer.ts) | **그림자 대시(`triggerDash`)** 추가 (쿨타임 3.5초, 0.22초 무적 + 3.2배속 이동 + 잔상 3개) | 
| 수정 | [src/entities/MinionUnit.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fentities%252FMinionUnit.ts) | **임시 부활 소환수(`isTemporary`, `lifeTimer`)** 모드 지원 (사령 추출로 소환된 정예 언데드 20초 전투 후 소멸) | 
| 신설 | `src/entities/FieldInteractable.ts` | 파괴형 오브젝트(화로/항아리: 회복 고기·전체 자석·화면 폭탄 드랍) 및 **점령형 저주 제단**(원형 영역 5초 유지 시 보상) | 
| 신설 | `src/data/fieldEventsData.ts` | 오브젝트 스폰 주기, 드랍 확률 테이블, 저주 제단 점령 시간·보상 수치 정의 | 
| 수정 | [src/scenes/BattleScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FBattleScene.ts) | `recentCorpses` 바닥 영혼 불꽃(청록 글로우) 렌더링, 정예 처치 시 **사령 추출(20초 아군화)** 옵션/자동 발동, 히트스톱(35ms) 추가 | 
| 수정 | [src/scenes/UIScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FUIScene.ts) | 우측 하단 **대시 버튼(Space/Shift 키 바인딩)**, 화면 밖 핵심 드랍(상자·양피지·제단) **가장자리 방향 화살표** 추가 | 

### 2.2 상세 설계

#### 1) 그림자 대시 (회피기)

* **조작**: 모바일 우측 하단 필살기 버튼 옆 전용 대시 버튼 + PC `Space` / `Shift` 키 지원.

* **스펙**: 이동 입력 방향(정지 시 `facingDir`)으로 0.22초간 520px/s 이동, 대시 중 완전 무적(`invulnTimer >= 0.22`) 및 적 충돌 통과. 쿨타임 3.5초(플레이어 `cooldownMul`의 50% 반영, 최소 1.8초).

#### 2) 사령군주 고유 기믹 — 시체 가시화 & 사령 추출

* **시체 영혼 불꽃**: [BattleScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FBattleScene.ts)의 `recentCorpses` 등록 시 해당 좌표에 청록색 영혼 불꽃 스프라이트/파티클을 유지해 플레이어가 시체 밀집 구역으로 적을 유인한 뒤 `시체 폭발`을 터뜨리는 전술 플레이를 유도합니다.

* **정예 사령 추출**: 정예 몬스터 처치 시 일정 확률(기본 50%, 사령 계열 보유 시 100%)로 해당 정예의 청록 반투명 언데드 버전이 20초간 아군으로 부활해 주변 적을 공격합니다. 어떤 무기 계열을 골라도 ‘사령군주’의 정체성이 살아납니다.

#### 3) 필드 오브젝트 & 저주 제단

* **파괴 오브젝트(45초마다 화면 외곽 1\~2개)**: 플레이어 투사체에 1타 파괴 → `회복 육포(+30% HP)`, `영혼 자석(전체 보석 흡인)`, `영혼 폭탄(화면 일반몹 즉사)`, `골드 주머니` 중 1종 드랍.

* **저주 제단(120초마다 1개, 화면 밖 화살표 안내)**: 반경 110px 마법진 안에서 5초간 버티면(이탈 시 게이지 유지, 제단 주변 소규모 러시 발생) 즉시 **패시브 1레벨 업** 또는 **영구 15% 공격력 버프(런 한정)** 지급.

#### 4) 타격감(Game Feel) & 시인성

* **히트스톱**: 보스/네임드/정예 처치 및 궁극기 발동 시 `timeScale`을 35ms간 `0.08`로 낮췄다 복귀해 묵직한 타격감을 구현합니다.

* **오프스크린 인디케이터**: `evolutionChest`, `awakeningDrops`, 활성 `저주 제단`이 카메라 밖일 때 화면 가장자리에 아이콘+거리 화살표를 표시합니다.

### 2.3 예상 사이드이펙트 및 대응

* **밸런스**: 대시 무적 + 회복 육포로 생존력이 과도하게 올라갈 수 있음. Phase 1의 원거리/보스 패턴 피해량과 함께 테스트하며 회복 육포 드랍률(25%)과 대시 쿨타임(3.5초)을 조정합니다.

* **성능(GC)**: 바닥 영혼 불꽃은 최대 35개(`recentCorpses` 상한과 동일)로 제한하고, 대시 잔상은 Phaser 트윈 종료 즉시 `destroy()` 처리합니다.

* **세이브 호환성**: 영향 없음.

### 2.4 검증 방법

* `npm run build` 0 errors 확인.

* 대시 중 보스 돌진/탄막 통과 무적 판정, 정예 처치 후 임시 언데드 20초 전투 및 정상 소멸, 저주 제단 5초 점령 보상, 오프스크린 화살표 방향 정확도 확인.

## Phase 3. 3계열 원소 반응과 각성 루프 리밸런싱

현재 [docs/SKILLS_SYSTEM.md](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fdocs%252FSKILLS_SYSTEM.md)에 정의된 **런당 3계열 제한**은 훌륭한 규칙이지만, 계열 간 상호작용이 없어 단순 화력 합산에 그칩니다. 또한 [BattleScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FBattleScene.ts)에서 각성 보물상자가 5웨이브(400초) 수문장 처치 시 단 1회만 나와 1개 스킬만 진화할 수 있어 후반 빌드 완성 쾌감이 부족합니다.

### 3.1 수정 및 신설 대상 파일

| 구분 | 파일 경로 | 변경 요지 | 
| ----- | ----- | ----- | 
| 신설 | `src/data/synergyData.ts` | 10개 계열 간 **원소·속성 반응 5종** 발동 조건, 내부 쿨타임, 피해 배율, 이펙트 색상 선언 | 
| 신설 | `src/systems/ElementalReactionSystem.ts` | 적의 기존 상태이상(`freeze`, `shock`, `bleed`, `burn`, `curse`)과 명중 속성 조합 시 반응 폭발 트리거 | 
| 수정 | [src/entities/Enemy.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fentities%252FEnemy.ts) | `burnTimer`(화염), `curseTimer`(어둠/사령) 상태이상 슬롯 및 반응 내부 쿨타임(`reactionCd`) 추가 | 
| 수정 | [src/entities/Projectile.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fentities%252FProjectile.ts) | 투사체 속성 태그(`elementTag`) 전달 및 명중 시 `ElementalReactionSystem.checkAndTrigger()` 호출 | 
| 수정 | [src/systems/LevelUpManager.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fsystems%252FLevelUpManager.ts) | 런당 **리롤(2회)·제외/밴(1회)** 상태 관리, 레벨업 카드에 조합 가능한 원소 반응 힌트 배지 표시 | 
| 수정 | [src/scenes/BattleScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FBattleScene.ts) | 3웨이브(200초) 이후 정예 처치 시에도 각성 조건 충족 시 진화 상자 드랍 허용, **연속 처치 피버 게이지(100킬마다 10초 공속/이속 +20%)** 추가 | 
| 수정 | [src/scenes/UIScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FUIScene.ts) | 레벨업 모달 하단 리롤·제외 버튼, HUD 상단 피버 게이지 바 추가 | 

### 3.2 상세 설계

#### 1) 3계열 조합 원소 반응 5종

기존 10개 계열의 특성을 살려 어떤 3계열을 조합해도 시너지가 나오도록 설계합니다(적 개체당 반응 쿨타임 1.2초로 무한 연쇄 방지).

| 반응명 | 선행 상태이상 (계열) | 트리거 공격 (계열) | 발동 효과 | 
| ----- | ----- | ----- | ----- | 
| **초전도 파쇄** | 빙결 (`빙결`) | 번개 (`번개`) | 반경 130px 광역 폭발 + 방어력 무시 220% 피해 + 감전 확산 | 
| **융해 폭염** | 빙결 (`빙결`) | 화염 (`화염`) | 빙결 해제 대신 단일/소범위 280% 치명타 증폭 폭발 | 
| **혈폭 (Blood Burst)** | 출혈 (`베기`/`창술`) | 어둠·사령 (`어둠`/`사령`) | 주변 110px 적에게 출혈 잔여 피해 즉시 폭발 + 플레이어 HP 2 회복 | 
| **성염 정화** | 저주 (`사령`/`어둠`) | 성속성 (`성속성`) | 반경 140px 신성 충격파 + 1.5초 기절(Stun) | 
| **과부하 레일건** | 감전 (`번개`) | 물리·SF (`무속성`/`SF`/`창술`) | 관통 번개 잔상 1회 추가 발사 (160% 피해) | 

#### 2) 각성 템포 및 레벨업 에이전시 개선

* **진화 상자 해금 완화**: 기존 5웨이브 수문장 1회 한정에서, **3웨이브(200초) 이후 정예 처치 시 플레이어에게 각성 가능 스킬(Lv.5 + 짝꿍 패시브)이 존재하면** `각성 비급 양피지` 대신 `진화 보물상자`를 드랍하도록 변경합니다. 한 런(8분 20초) 동안 자연스럽게 2\~3개의 각성 스킬을 완성할 수 있습니다.

* **리롤 & 제외**: 런 시작 시 리롤 2회, 제외 1회 제공(제외된 스킬은 해당 런의 레벨업 풀에서 영구 제거).

### 3.3 예상 사이드이펙트 및 대응

* **밸런스**: 원소 반응과 다중 각성으로 후반(5\~6웨이브) 플레이어 DPS가 크게 상승합니다. 5\~6웨이브 수문장·보스 체력 계수를 테스트 결과에 맞춰 +25\~40% 상향 보정해 보스전이 3초 만에 끝나지 않도록 맞춥니다.

* **성능**: 원소 반응 폭발 VFX가 대량 동시 발생할 수 있으므로 `BattleScene`에 동시 반응 VFX 카운터(프레임당 최대 6회, 누적 텍스트 상한 32개 유지)를 둡니다.

* **세이브 호환성**: 영향 없음.

### 3.4 검증 방법

* `npm run build` 0 errors 확인.

* 5종 원소 반응 각각의 발동 로그/대미지 텍스트·쿨타임(1.2초) 검증, 리롤 시 동일 선택지 중복 방지 및 제외 스킬 재등장 차단 확인, 3\~5웨이브 중 각성 2회 이상 정상 진화 확인.

## Phase 4. 런 요약 DPS 미터와 보스 영혼 유물(메타 성장)

현재 [HubScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FHubScene.ts)는 골드로 제단 스탯 18종을 올리는 선형 구조만 존재하고, 런 종료 시 어떤 스킬이 강했는지 확인할 수 있는 통계가 없습니다.

### 4.1 수정 및 신설 대상 파일

| 구분 | 파일 경로 | 변경 요지 | 
| ----- | ----- | ----- | 
| 신설 | `src/data/relicsData.ts` | 14개 지역 보스 영혼 유물 정의(유물 ID, 획득 지역, 고유 패시브 효과, 아이콘 매핑) | 
| 신설 | `src/systems/DamageTracker.ts` | 런 중 스킬 ID·소환수·원소 반응·시체 폭발별 누적 피해량 및 DPS 기록 | 
| 수정 | [src/data/types.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fdata%252Ftypes.ts) | `SaveData`에 `unlockedRelics: string[]`, `equippedRelics: string[]`, `bestEndlessTime?: Record<number, number>`, `regionStars?: Record<number, number>` 옵셔널 필드 추가 | 
| 수정 | [src/core/SaveManager.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fcore%252FSaveManager.ts) | 기존 V1 세이브 자동 마이그레이션(기본값 병합), 유물 해금/장착(최대 3슬롯) 및 무한 모드 기록 저장 메서드 추가 | 
| 수정 | [src/entities/Player.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fentities%252FPlayer.ts) | 장착된 보스 유물 3종의 스탯/특수 기믹 효과 반영 | 
| 수정 | [src/scenes/BattleScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FBattleScene.ts) | `DamageTracker` 연동, 보스 처치 후 **무한 모드(Endless) 계속 도전** 분기 지원 | 
| 수정 | [src/scenes/UIScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FUIScene.ts) | `showResultModal`에 **스킬별 누적 피해량·DPS 막대 그래프** 추가, 클리어 시 무한 모드 진입 버튼 제공 | 
| 수정 | [src/scenes/HubScene.ts](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fsrc%252Fscenes%252FHubScene.ts) | 하단 메뉴에 **영혼 유물(Relics) 장착 모달** 추가, 지역 카드에 미션 별점(클리어 / 노데스·무피격 보스 / 10분 무한 생존) 표시 | 

### 4.2 상세 설계

#### 1) 스킬별 DPS 미터 (`DamageTracker`)

* 투사체·소환수·원소 반응·시체 폭발이 `enemy.takeDamage()`를 호출할 때 `sourceId`(스킬 ID 또는 `'corpse_explosion'`, `'reaction_superconduct'`)를 함께 기록합니다.

* 런 종료(`showResultModal`) 시 상위 6개 딜링 소스를 가로 막대 그래프 + 총 피해량 + 초당 DPS + 기여도(%)로 표시합니다.

#### 2) 보스 영혼 유물 3슬롯 (`relicsData.ts`)

각 지역 보스를 최초 클리어하면 해당 보스의 영혼 유물을 영구 해금하며, 거점에서 최대 3개까지 장착해 런의 플레이 스타일을 바꿉니다. (초기 1\~6지역 예시)

| 지역 보스 | 유물명 | 장착 시 고유 효과 | 
| ----- | ----- | ----- | 
| 1지역 아라크네 | **여왕의 맹독 샘** | 그림자 대시 시 출발 지점에 3초간 둔화·독 장판 생성 | 
| 2지역 듀라한 아서 | **단두대의 서약** | 출정 시 해골 전사 1기 기본 소환 + 소환수 부활 시간 -20% | 
| 3지역 카르텔 파괴자 | **암시장 개조 코어** | 레벨업 리롤 횟수 +2회, 골드 획득량 +15% | 
| 4지역 검왕 백도훈 | **청풍검의 잔영** | 치명타 발동 시 20% 확률로 전방에 검기 1발 추가 발사 | 
| 5지역 지휘관 카터 | **지하 암반 핵** | 저주 제단 점령 속도 +40%, 방어력 +5 | 
| 6지역 카게미츠 | **그림자 오니의 가면** | 그림자 대시 쿨타임 -25%, 대시 직후 2초간 치명타 확률 +25% | 

#### 3) 무한 모드(Endless)

* 6웨이브 보스 처치 시 클리어 보상과 유물을 즉시 정산한 뒤, `[거점으로 복귀]`와 `[심연 무한 도전 계속]` 중 선택할 수 있게 합니다.

* 무한 모드 진입 시 60초마다 적 체력 +35%, 공격력 +20%, 정예 스폰 주기 단축으로 점진적 한계 돌파 플레이를 제공합니다.

### 4.3 예상 사이드이펙트 및 대응

* **세이브 호환성 (핵심)**: 기존 `PROJECT_NECRO_SURVIVORS_SAVE_V1` 키를 유지하되, `SaveManager.load()`에서 누락된 신규 필드를 `unlockedRelics: []`, `equippedRelics: []`, `regionStars: {}` 등으로 안전하게 병합합니다. 이미 `highestClearedRegion >= r`인 기존 유저는 첫 로그인 시 `1..highestClearedRegion` 유물을 자동 소급 해금합니다.

* **밸런스**: 유물 3종 조합으로 인한 인플레이션은 7지역 이상 및 무한 모드 난이도 곡선으로 흡수합니다.

* **갤러리 동기화**: 신규 유물 데이터를 갤러리에도 노출할 경우 [docs/GALLERY_AND_DEPLOY.md](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252Fdocs%252FGALLERY_AND_DEPLOY.md) 절차에 따라 `gallery_data.js`를 재생성합니다.

### 4.4 검증 방법

* `npm run build` 0 errors 확인.

* 구버전 V1 `localStorage` JSON을 주입한 상태에서 로드 시 크래시 없이 기존 골드·제단·클리어 기록이 유지되고 유물이 소급 해금되는지 확인.

* 런 종료 결과창 DPS 합계와 실제 처치 몬스터 체력 총합 정합성 확인, 무한 모드 1분 경과 스케일링 및 정상 종료 저장 확인.

## 권장 실행 순서 및 커밋 전략

[GEMINI.md](https://www.google.com/search?q=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dhttps%253A%252F%252Fgithub.com%252Fsyk-land%252Fgitrepo%252Fblob%252Fmain%252Fnecro-survivors%252FGEMINI.md)의 Atomic Commits 규칙에 맞춰 각 Phase를 기능 단위 커밋으로 쪼개고, 단계가 끝날 때마다 `npm run build` → `firebase deploy --only hosting`으로 실기(모바일/PC) 플레이테스트를 거치는 것을 권장합니다.

1. `feat(combat): add enemy behavior archetypes and boss telegraph patterns` (Phase 1)

2. `feat(wave): connect region stat scaling and wave formation events` (Phase 1)

3. `feat(player): add shadow dash, corpse glow markers, and elite necro extraction` (Phase 2)

4. `feat(field): add breakable props, cursed shrines, hitstop, and offscreen arrows` (Phase 2)

5. `feat(skills): implement 5 elemental reactions, level-up reroll/banish, and early evolution chests` (Phase 3)

6. `feat(meta): add post-run DPS meter, boss soul relics, and endless mode` (Phase 4)