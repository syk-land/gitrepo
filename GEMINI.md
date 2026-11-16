# Monorepo Root Rules (`GEMINI.md`)

> 본 문서는 `gitrepo` 워크스페이스 루트에 자동 로드되는 **최우선 통합 규칙**입니다.
> 모든 하위 프로젝트(`necro-survivors`, `project2100`, `gdrive-classifier` 등)의 `GEMINI.md` 및 주요 문서를 통합·정렬하였으며, 프로젝트별 세부 명세는 각 하위 문서를 함께 참조합니다.

---

## 1. 공통 개발 & 에이전트 행동 규칙

### 1.1 컨텍스트 관리 (Context Engineering)
- **Read before Write**: 수정 전 반드시 `view_file`로 대상 파일을 먼저 읽습니다.
- **탐색 전략**: `Glob → Grep → Read` 순서를 따르며, 존재한다고 가정하는 함수·변수·스킬 ID·컴포넌트는 `grep`으로 실재 여부를 확인합니다.
- **토큰 최적화**: 전체 디렉토리 덤프나 대용량 파일/로그 전체 출력을 지양하고, 라인 범위 지정 또는 `tail`/`grep`으로 필요한 부분만 읽습니다.
- **작업 시작 시 참조 순서**:
  1. 루트 `GEMINI.md` (본 문서)
  2. 해당 하위 프로젝트의 `GEMINI.md` (존재 시) 및 `docs/` 명세서
  3. 빌드/설정 파일 (`package.json`, `firebase.json`, `requirements.txt` 등)
  4. 작업과 직접 관련된 소스 파일

### 1.2 실행 및 검증 루프 (Explore → Plan → Code → Verify)
- **워크플로우**: `[Explore] 이해 → [Plan] 계획 수립 및 승인 → [Code] 구현 → [Verify] 빌드/테스트 검증 → [Report] 결과 보고`
- **Plan Mode 강제**: **2개 이상 파일 수정, 20줄 이상 변경, 또는 게임플레이/밸런스/핵심 동작이 바뀌는 변경**은 구현 전 계획을 먼저 제시하고 사용자 승인을 받습니다.
  - 계획 포함 항목: (1) 수정 대상 파일, (2) 변경 요지, (3) 예상 사이드이펙트(밸런스/성능/세이브 호환성), (4) 검증 방법
  - 단순 오타, 상수 한 줄 수정, 명백한 버그 수정은 생략 가능.
- **검증 및 실패 대응**:
  - 검증 실패 시 원인 기록 후 최대 3회 재시도하며, 3회 실패 시 현황과 가설을 보고하고 방향 결정을 요청합니다.
  - 임시 `try/catch`로 에러를 삼키거나 `any` 타입·테스트 비활성화로 우회하는 편법을 금지합니다.

### 1.3 안전 및 비밀 정보 보호 (Constraints & Safety)
- **Deny by Default (사전 승인 필요)**: `rm -rf`, `chmod 777`, `sudo`, 대규모 패키지/엔진 업그레이드, 운영 DB·백엔드·결제·푸시 호출, 바이너리/직렬화 에셋(`.meta`, `.prefab`, `.scene`, `.uasset` 등) 직접 수정.
- **Allowlist (자동 실행 가능)**: 읽기 전용(`ls`, `grep`, `find`, `git status`, `git diff`, `git log`), 빌드·타입체크·린트·단위 테스트.
- **비밀 정보 보호**: API 키(`nvapi-...` 등), 토큰(`token.json`, `credentials.json`), `.keystore`, `.p12`, 시크릿을 출력하거나 로그/커밋에 남기지 않습니다.
- **요청 없는 파일 생성 금지**: 요청되지 않은 `README`, 설정 파일, 샘플 파일을 선제적으로 생성하지 않습니다. 신규 설계서·분석 문서는 해당 프로젝트의 `docs/` 하위에 저장합니다.

### 1.4 편향 방지, 보고 형식 & 어조
- **검증 기반 보고**: 실제로 테스트/빌드를 통과한 항목만 완료로 보고하며, 확인하지 못한 항목은 `"실행 검증 불가"`로 명시합니다.
- **어조 및 가독성**: 아첨과 불필요한 서두("좋은 질문입니다", "도와드리겠습니다")를 금지하고 본론부터 간결하게 답합니다. 정보 전달 시 **표(Table)**를 적극 활용합니다.
- **이모지 제한**: 코드, 주석, 로그, 커밋 메시지에는 이모지를 사용하지 않습니다 (대화형 응답 및 게임 내 UI 문자열은 허용).
- **보고 형식** (구현/수정 작업 완료 시):
  - `진행 단계` / `참조한 컨텍스트` / `검증 결과` / `변경 파일` / `다음 단계 또는 승인 요청`

### 1.5 Git 커밋 & 언어 규칙
- **Atomic & Conventional Commits**: 한 커밋에 한 가지 목적만 포함하며, `<type>(<scope>): <subject>` (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`) 형식을 따릅니다.
- **커밋 금지사항**: `Co-Authored-By` 서명 금지, 이모지 금지, 모호한 메시지(`WIP`, `temp`) 금지.
- **언어**: 대화는 **한국어**, 코드·식별자·기술 용어·커밋 메시지·로그는 **영어**를 유지합니다.

---

## 2. Python & AI API 연동 공통 규칙

### 2.1 Python 3.12 Windows SSL Bug (truststore recursion)
- **현상**: Windows 환경 Python 3.12에서 `openai` SDK(또는 `httpx`+`truststore`) 사용 시 SSL 컨텍스트 검증 과정에서 `RecursionError: maximum recursion depth exceeded` 발생.
- **해결책**: 해당 환경에서는 SDK에 의존하지 말고 파이썬 내장 `urllib.request` 또는 `requests` 모듈로 직접 REST API 엔드포인트와 통신합니다.

### 2.2 대규모 LLM 텍스트 생성 스크립트 (Robust Scripting)
- **자동 재시도 (Resiliency)**: `503`, `429` 및 일시적 통신 끊김에 대비해 `try-except`로 감싸고 최소 5~10회 재시도(Retry) + 백오프(Backoff) 로직을 필수로 구현합니다.
- **넉넉한 타임아웃**: 기본 120초 이상(권장 300초) 설정.
- **이어쓰기 (Auto-Resume)**: 시작 전 기존 결과물 파일/디렉토리를 스캔하여 마지막 생성 인덱스를 파악하고 그다음 번호부터 이어서 실행하도록 상태 추적 로직을 구현합니다.

### 2.3 Google OAuth API & Python 백그라운드 실행 (`gdrive-classifier`)
- **CSRF Mismatch 주의**: `google_auth_oauthlib.flow.InstalledAppFlow` 사용 시 `flow.run_local_server()`를 쓸 예정이라면 `flow.authorization_url()`을 수동 호출하지 않습니다(내부 `state` 불일치로 `MismatchingStateError` 발생). `authorization_prompt_message` 인자 또는 서브클래싱을 사용하고, `flow.redirect_uri`를 사전에 설정합니다.
- **Stdout 버퍼링 방지**: 비동기 백그라운드 실행 시 실시간 프롬프트(OAuth URL 등)가 로그에 즉시 남도록 `python -u`로 실행하거나 `sys.stdout.flush()`를 명시 호출합니다.
- **참고 가이드**: NVIDIA Nemotron / Flux.1-dev / Google Drive 업로드 예제는 루트 [AI_Cheat_Sheet.md](AI_Cheat_Sheet.md) 참조.

---

## 3. 저장소 및 프로젝트별 운영 규칙

### 3.1 전체 프로젝트 현황
| 프로젝트 경로 | 상태 | 기술 스택 / 성격 | 세부 규칙 및 문서 |
| :--- | :--- | :--- | :--- |
| **`necro-survivors/`** | **주력 개발** | 뱀서류 액션 RPG (Phaser 3 + TS + Vite + Firebase) | [`necro-survivors/GEMINI.md`](necro-survivors/GEMINI.md) |
| **`project_necro/`** | **영구 동결** | 구 RPG 버전 (신규 개발·에셋 생성 중단) | 기완료 리마스터 에셋 이관 용도로만 참조 |
| **`project2100/`** | **개별 프로젝트** | 조선 시대 레트로 도트 게임 | [`project2100/GEMINI.md`](project2100/GEMINI.md) |
| **`gdrive-classifier/`** | **유틸리티** | Google Drive 압축 해제·분류 자동화 (Python) | [`gdrive-classifier/GEMINI.md`](gdrive-classifier/GEMINI.md) |
| **`saryung_200/`** | **시나리오/데이터** | 시나리오 생성 프로젝트 | [`saryung_200/scenario_200.md`](saryung_200/scenario_200.md) |

### 3.2 GitHub 저장소 경로
- **푸시 저장소 (`origin` / `syk-land`)**: `https://github.com/syk-land/gitrepo.git`
- **업스트림 (`upstream` / `syk-genon`)**: `https://github.com/syk-genon/gitrepo.git`

---

## 4. `necro-survivors/` (주력) 핵심 규칙

> 상세 규칙은 [`necro-survivors/GEMINI.md`](necro-survivors/GEMINI.md) 및 `necro-survivors/docs/` 문서(`CONNECTIONS.md`, `SKILLS_SYSTEM.md`, `ASSET_REMASTER_PLAN.md`, `GALLERY_AND_DEPLOY.md`)를 따릅니다.

### 4.1 코딩 컨벤션 & 밸런스 불변식
- 밸런스 수치(데미지 계수, 쿨타임, 투사체 수, 범위 등)는 `src/data/*.ts`에 선언하고 로직 내 매직 넘버 하드코딩을 지양합니다.
- `Update()` 루프 내 불필요한 객체 할당 및 GC 유발 코드를 피하고, `TODO: fix later` 같은 임시방편 주석을 남기지 않습니다.
- **핵심 밸런스 불변식**:
  - **10개 스킬 계열**, 런당 **액티브 최대 3개 계열**(하위+상위 6슬롯).
  - **일반 레벨업**에는 **액티브 스킬만** 등장하며, **패시브 및 각성 스킬**은 **보물 상자 전용**입니다.
  - `src/data/*.ts` 수정 후 갤러리 데이터 동기화가 필요하면 `docs/GALLERY_AND_DEPLOY.md` 절차에 따라 `public/gallery/gallery_data.js`를 재생성합니다.

### 4.2 빌드 검증 및 Firebase Hosting 배포
- **검증 우선순위**:
  1. `npm run build` (`tsc && vite build`) — **0 errors 필수**
  2. `src/`에서 참조하는 모든 `assets/` 경로가 `public/assets/`에 실재하는지 확인
- **Firebase 프로젝트 ID**: `project-necro-54deb`
- **라이브 게임 URL**: https://project-necro-54deb.web.app/
- **라이브 갤러리 URL**: https://project-necro-54deb.web.app/gallery/
- **배포 대상 디렉토리**: `necro-survivors/dist` (`npm run build` 시 `public/assets` 및 `public/gallery` 자동 포함)
- **배포 명령어**:
  ```bash
  cd necro-survivors
  npm run build
  firebase deploy --only hosting
  # (환경에 따라 /home/antigravity/.local/bin/firebase deploy --only hosting 사용)
  ```

### 4.3 에셋 리마스터용 Colab 외부 API
- **모델**: SDXL + `nerijs/pixel-art-xl` LoRA (Google Colab 무료 Tesla T4 GPU + `cloudflared` 터널)
- **주의**: Colab 런타임 재시작 시 `https://<random>.trycloudflare.com` URL이 매번 새로 발급됨. 요청 시 `lora_scale` 파라미터는 생략할 것.

---

## 5. `project2100/` 핵심 규칙

> 상세 규칙은 [`project2100/GEMINI.md`](project2100/GEMINI.md) 및 [`project2100/docs/project_2100_integrated_spec.md`](project2100/docs/project_2100_integrated_spec.md)를 따릅니다.

- **주인공 요원 듀얼 뷰 (1순위 규칙)**:
  - **전투 씬 (횡스크롤)**: 무조건 우향(Facing Right). 오른팔 전면 노출, 왼팔 몸통 뒤(Z-index) 독립 파츠 조립.
  - **비전투 씬 (로비/대기)**: 정면(Front View). 양팔·양다리 좌우 대칭 완전 노출.
- **비주얼 & 리소스 규격**:
  - 조선 시대 배경의 아기자기하고 발랄한 레트로 **2D 도트(픽셀 아트)** 스타일.
  - 캐릭터 애니메이션은 **10프레임** 규격 통일.
  - 스프라이트 시트 대신 **단일 파츠 세트(머리, 몸통, 손, 발)**를 **PNG/JPG 비트맵**으로 제작(SVG 배제) 후 키프레임/스켈레탈 방식으로 구동.
- **에셋/메타 보호**: Unity `.meta` GUID, Unreal redirector 및 바이너리 에셋을 사용자 확인 없이 임의로 수정하지 않습니다.
