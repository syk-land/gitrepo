# ⚔️ Necro Survivors — 10개 계열 스킬 시스템 명세서

## 1. 핵심 획득 및 조합 규칙

| 항목 | 규칙 |
| :--- | :--- |
| **액티브 계열 제한** | 런당 최대 **3개 계열**까지 선택 가능 (하위 + 상위 총 `6`슬롯) |
| **일반 레벨업 선택지** | **액티브 스킬만** 등장 (`LevelUpManager.ts` — 패시브 미등장) |
| **상위 스킬(Tier 2) 해금** | 동일 계열 하위 스킬(Tier 1) **Lv.3** 달성 시 레벨업 풀에 해금 |
| **패시브 스킬 획득** | **보물 상자**에서만 획득 (최대 `6`슬롯, 하위 스킬만 보유해도 등장) |
| **각성 스킬(Awakened)** | 액티브 **Lv.5** + **짝꿍 패시브** 보유 시 보물 상자에서 진화 |

---

## 2. 10개 스킬 계열 전체 구성표

| 계열 | 하위 스킬 (Tier 1) | 상위 스킬 (Tier 2) | 짝꿍 패시브 | 각성 스킬 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 무속성** | 마력탄 (`necro_spear`) | 마력폭풍 (`necro_bone_storm`) | 극한의 심장 (`pas_frost_heart`) | 진(眞) 마력폭풍 |
| **2. 사령속성** | 해골 군단 소환 (`necro_legion`) | 리치 군주의 저주구체 (`necro_lich_curse`) | 포식자의 본능 & 잔상 보법 (`pas_speed`) | 제1군단장: 듀라한 아서 |
| **3. 성속성** | 홀리 아머 (`necro_armor`) | 정화의 성염 장판 (`priest_sanctuary`) | 육체의 기억 (`pas_iron_body`) | 발키리 부대 / 대성역: 천벌의 빛기둥 |
| **4. 어둠속성** | 죽음의 손아귀 (`dk_grip`) | 중력장 압축 (`psi_blackhole`) | 선혈의 서약 (`pas_blood_vamp`) | 아발론의 흑염 단두대 / 궤도 모함 플라즈마 폭격 |
| **5. 베기속성** | 청룡참 검기 (`sm_dragon`) | 중력 도끼 휠윈드 (`ber_whirlwind`) | 카게미츠의 수리검 (`pas_amount`) | 만검귀종: 진 청룡참 / 라그나로크: 중력 붕괴 |
| **6. SF속성** | 대구경 관통 저격 (`sniper_shot`) | 외계 강습 드론 (`psi_drone`) | 매의 눈 (`pas_hawk_eye`) | 50km 공간 굴절 저격 / 이단참모 벨록의 함대 |
| **7. 번개속성** | 체인 라이트닝 (`storm_chain`) | 번개 (`storm_thunder`) | 뇌신의 분노 (`pas_thunder_wrath`) | 템페스트 아크 노바 / 천벌: 뇌제 강림 |
| **8. 빙결속성** | 스노우볼 (`cryo_snowball`) | 프로스트 노바 (`cryo_nova`) | 초월적 연산 (`pas_cooldown`) | 영겁의 빙하탄 / 절대영도: 다이아몬드 더스트 |
| **9. 화염속성** | 파이어볼 (`fire_ball`) | 파이어스톰 (`fire_storm`) | 폭염의 지팡이 (`pas_fire_staff`) | 메테오 스트라이크 / 인페르노 헬파이어 |
| **10. 창술속성** | 적호창 (`spear_crimson`) | 파천적호창 (`spear_heaven`) | 무신의 투지 (`pas_spear_spirit`) | 적호멸살창 / 패왕: 파천만리창 |

---

## 3. 최근 주요 업데이트 내역

| 항목 | 변경 내용 | 관련 파일 |
| :--- | :--- | :--- |
| **감전(`shock`) 상태이상** | `뇌신의 분노` 보유 시 확률적으로 2.5초 감전 적용 (받는 피해 `+25%~+65%` 증가, 이동속도 `30%` 둔화) | [`types.ts`](../src/data/types.ts), [`Enemy.ts`](../src/entities/Enemy.ts), [`Projectile.ts`](../src/entities/Projectile.ts) |
| **원소·창술 계열 분리/신규** | 7번 원소 ➔ 번개/빙결/화염 3개 계열로 분리, 10번 창술 계열(`적호창` ➔ `파천적호창`, `무신의 투지`) 신설 | [`skillsData.ts`](../src/data/skillsData.ts) |
| **패시브 효과 스왑** | `카게미츠의 수리검`(`pas_amount`) ➔ 치명타 확률/피해, `매의 눈`(`pas_hawk_eye`) ➔ 투사체 수/비행 속도 | [`skillsData.ts`](../src/data/skillsData.ts) |
| **파이어볼 폭발 판정** | `fire_ball` 및 `awakened_fireball` 명중 시 주변 적에게 75% 광역 화염 폭발 피해 적용 | [`Projectile.ts`](../src/entities/Projectile.ts) |
| **소환수 수량 % 스케일링** | 제단 소환수 수량 특성을 `%` 증가로 변경 (100% 달성 시 전사/궁수/마법사 각 2배 소환) | [`altarData.ts`](../src/data/altarData.ts) |
