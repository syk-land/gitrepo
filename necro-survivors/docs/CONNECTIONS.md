# 🔗 Necro Survivors — 접속 정보 및 프로젝트 리소스 목록

> 본 문서는 프로젝트 운영·배포·협업에 필요한 URL, 프로젝트 ID, 저장소 및 CLI 경로를 정리한 문서입니다. (비밀번호·토큰·API 키 등 민감 정보는 저장하지 않습니다.)

---

## 1. 서비스 접속 URL

| 구분 | URL | 비고 |
| :--- | :--- | :--- |
| **라이브 게임 (Firebase)** | https://project-necro-54deb.web.app/ | 메인 게임 (Phaser 3) |
| **에셋 비교 & 도감 갤러리** | https://project-necro-54deb.web.app/gallery/ | 구버전 vs 신규 에셋 비교 · 10개 계열 · 14지역 |
| **Firebase Console** | https://console.firebase.google.com/project/project-necro-54deb/overview | 호스팅 및 프로젝트 관리 |
| **GitHub 저장소** | https://github.com/syk-genon/gitrepo | 기본 브랜치: `main` |

---

## 2. Firebase 프로젝트 목록

| Project Display Name | Project ID | Project Number | 용도 |
| :--- | :--- | :--- | :--- |
| **project-necro (현재)** | `project-necro-54deb` | `473214344056` | Necro Survivors 메인 게임 & 갤러리 |
| agy-web | `agy-web-9f33e` | `780600760377` | 웹 프로젝트 |
| ddongtop | `ddongtop-bea1d` | `765295712321` | 기타 프로젝트 |
| Smart Checklist | `smart-checklist-27254` | `448754856589` | 기타 프로젝트 |

---

## 3. 로컬/개발 환경 및 CLI 경로

| 항목 | 경로 / 명령어 |
| :--- | :--- |
| **프로젝트 루트** | `/home/antigravity/syk-genon/gitrepo/necro-survivors` |
| **Git 원격 저장소** | `origin` ➔ `https://github.com/syk-genon/gitrepo.git` |
| **Firebase CLI** | `/home/antigravity/.local/bin/firebase` |
| **개발 서버 실행** | `npm run dev` |
| **프로덕션 빌드** | `npm run build` (`dist/` 생성) |
| **Firebase 배포** | `/home/antigravity/.local/bin/firebase deploy --only hosting` |
