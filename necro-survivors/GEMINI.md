# 💀 Necro Survivors — Project Rules (`GEMINI.md`)

> 본 문서는 `necro-survivors` 프로젝트의 개발 규칙입니다. 레포 내 기존 `GEMINI.md` 및 전역 규칙을 통합하여 본 프로젝트(Phaser 3 + TypeScript + Vite + Firebase Hosting)에 맞게 정의합니다.

---

## 1. Context Engineering (컨텍스트 관리)

### 1.1 세션 시작 시 참조 순서
1. `necro-survivors/GEMINI.md` (본 문서)
2. `docs/CONNECTIONS.md` — 접속 URL, Firebase 프로젝트 ID, 저장소 및 CLI 경로 확인
3. `package.json`, `firebase.json` — 의존성, 빌드 스크립트, 호스팅 설정 확인
4. `docs/SKILLS_SYSTEM.md`, `docs/GALLERY_AND_DEPLOY.md` — 스킬/갤러리/배포 명세 확인
5. 작업과 직접 관련된 `src/` 파일만 선택적으로 읽기

### 1.2 Read before Write & 탐색 전략
- 수정 전 반드시 `view_file`로 대상 파일을 먼저 읽습니다.
- 존재한다고 가정하는 함수/변수/스킬 ID는 `grep`으로 실재 여부를 확인합니다.
- **Glob → Grep → Read** 순서를 따르며, 전체 디렉토리 덤프나 대용량 파일 전체 출력을 지양합니다.

### 1.3 토큰 예산 최적화
- 로그는 `tail` 또는 `grep`으로 필요한 부분만 추출합니다.
- 대용량 파일은 라인 범위(`StartLine`/`EndLine`)를 지정해 읽습니다.

---

## 2. Execution & Verification Loop (실행 및 검증 루프)

### 2.1 핵심 워크플로우: Explore → Plan → Code → Verify
```text
[Explore] 코드베이스/요구사항 이해
   ↓
[Plan]    계획 수립 → 사용자 승인 대기
   ↓
[Code]    구현
   ↓
[Verify]  타입체크 / 빌드 / 동작 확인
   ↓
[Report]  결과 보고
```

### 2.2 Plan Mode 강제
- **2개 이상의 파일을 수정하거나 20줄 이상의 변경, 혹은 게임플레이/밸런스 동작이 바뀌는 변경은 구현 전 계획을 먼저 제시하고 사용자 승인 후 작성합니다.**
- 계획 포함 항목: (1) 수정 대상 파일, (2) 변경 요지, (3) 예상 사이드이펙트(밸런스/성능/세이브 호환성), (4) 검증 방법.
- 단순 오타·한 줄 수정·명백한 버그 수정은 건너뛸 수 있습니다.

### 2.3 검증 우선순위 및 실패 대응
1. 타입체크 및 프로덕션 빌드: `npm run build` (`tsc && vite build`) — `0 errors` 필수
2. 에셋 무결성: `src/`에서 참조하는 모든 `assets/` 경로가 `public/assets/`에 실재하는지 확인
3. 검증 실패 시 원인 기록 후 최대 3회 재시도, 3회 실패 시 현황과 가설을 보고하고 방향 결정을 요청합니다.
4. 임시 `try/catch`로 에러를 삼키거나 타입을 `any`로 우회하는 편법을 지양합니다.

---

## 3. Constraints & Safety (제약 및 안전)

### 3.1 Deny by Default / Allowlist
- **사전 승인 필요**: `rm -rf`, `chmod 777`, `sudo`, 대규모 패키지 업그레이드
- **자동 실행 가능**: 읽기 전용(`ls`, `grep`, `find`, `git status`, `git diff`, `git log`), 빌드 검증(`npm run build`, `npx tsc --noEmit`)

### 3.2 코딩 컨벤션
- 프로젝트 기존 TypeScript / Phaser 3 패턴을 우선 일치시킵니다.
- 밸런스 수치(데미지 계수, 쿨타임, 투사체 수, 범위 등)는 `src/data/*.ts`에 선언하고 로직 내 매직 넘버 하드코딩을 지양합니다.
- `Update()` 루프 내 불필요한 객체 할당 및 GC 유발 코드를 피합니다.
- `TODO: fix later`, `# 임시` 같은 임시방편 주석을 남기지 않습니다.

### 3.3 산출물 및 문서 저장
- 모든 설계서·명세서·접속정보·분석 문서는 `necro-survivors/docs/` 하위에 저장합니다.

---

## 4. Bias Mitigation & Reporting Format (보고 형식)

- 검증이 실제로 통과한 항목만 완료로 보고하며, 확인하지 못한 항목은 `"실행 검증 불가"`로 명시합니다.
- 아첨, 불필요한 서두("좋은 질문입니다", "도와드리겠습니다")를 금지하고 본론부터 보고합니다.
- 정보 전달 시 **표(Table)**를 적극 활용해 가독성을 높이고, 답변 길이를 질문에 맞게 간결히 유지합니다.
- 코드·커밋 메시지·로그에 이모지를 사용하지 않습니다 (대화형 응답 및 게임 내 UI 문자열은 허용).

### 보고 형식
```markdown
## 진행 단계
- [완료한 작업]

## 참조한 컨텍스트
- 읽은 파일: ...

## 검증 결과
- 빌드: `npm run build` → 0 errors

## 변경 파일
- path/to/file.ts (+N/-M)

## 다음 단계 또는 승인 요청
- [필요 시 기재]
```

---

## 5. Git Commit Conventions & Language

- **Atomic Commits**: 한 커밋에 한 가지 목적의 변경만 포함합니다.
- **Conventional Commits**: `<type>(<scope>): <subject>` (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`)
- **금지사항**: `Co-Authored-By` 서명 금지, 커밋 메시지 내 이모지 금지, 모호한 메시지(`WIP`, `temp`) 금지.
- **언어**: 대화는 **한국어**, 코드·식별자·기술 용어·커밋 메시지는 **영어**를 유지합니다.

---

## 6. Project: Necro Survivors 아키텍처 & 운영 규칙

### 6.1 기술 스택 및 주요 경로
| 항목 | 내용 |
| :--- | :--- |
| **엔진 / 번들러** | Phaser 3, TypeScript, Vite |
| **접속 및 배포 정보** | [`docs/CONNECTIONS.md`](docs/CONNECTIONS.md) (`project-necro-54deb`) |
| **스킬/게임 데이터** | `src/data/skillsData.ts`, `minionsData.ts`, `regionsData.ts`, `altarData.ts`, `types.ts` |
| **상세 명세서** | [`docs/SKILLS_SYSTEM.md`](docs/SKILLS_SYSTEM.md), [`docs/GALLERY_AND_DEPLOY.md`](docs/GALLERY_AND_DEPLOY.md) |

### 6.2 게임 핵심 밸런스 불변식
- **10개 스킬 계열**, 런당 **액티브 최대 3개 계열**(하위+상위 6슬롯).
- **일반 레벨업**에는 **액티브 스킬만** 등장하며, **패시브 및 각성 스킬**은 **보물 상자 전용**입니다.
- `src/data/*.ts` 수정 후 갤러리 데이터 동기화가 필요하면 `docs/GALLERY_AND_DEPLOY.md`의 `gallery_data.js` 재생성 절차를 따릅니다.

### 6.3 빌드 및 배포 명령어
```bash
npm run build                                        # 타입체크 + Vite 프로덕션 빌드 (dist/)
/home/antigravity/.local/bin/firebase deploy --only hosting   # Firebase Hosting 배포
```
