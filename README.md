# 양현석 포트폴리오

Notion을 콘텐츠 원본으로 사용하는 게임 클라이언트 개발자 포트폴리오입니다. GitHub Pages용 정적 HTML을 생성합니다.

- 공개 주소: `https://portfolio.teamhjd.com/hyunseok/`
- 원본: https://anyanyang.notion.site/2e9c8404c9328051ab45c80805366ec1
- 16개 프로젝트, 대표작 4개, Notion 분류별 갤러리·검색, 프로젝트별 상세 페이지
- 초기 콘텐츠는 2026-10-31에 연결된 Notion 도구로 읽었습니다. Notion에는 쓰지 않았습니다.

## 편집 기준

**본문·기여·회고·소개·학력은 Notion에서 수정합니다.** `content/notion.json`은 읽기용 스냅샷이며 두 번째 원고가 아닙니다. `content/presentation.json`은 경로, 대표작 순서, 카드 표기 등 사이트 표시 설정만 관리합니다.

- `content/notion.json`: 허용한 원본 페이지 ID와 가져온 본문
- `content/presentation.json`: 사이트 주소와 프로젝트 표시 설정
- `content/gallery.json`, `content/assets.json`: 영구 보관한 실제 이미지의 로컬 경로
- `content/documents.json`: Notion 첨부 문서의 원본·첫 페이지 미리보기 경로
- `dark.css`, `scripts/templates.mjs`: 다크 기본 화면과 소개·갤러리 배치
- `assets/`: 실제 작품 화면. AI로 만든 가짜 화면이나 임시 서명 URL을 사용하지 않습니다.
- `scripts/build.mjs`: 정적 HTML 생성 및 HTML 정제
- `scripts/sync-notion.mjs`: Notion 공식 API를 통한 읽기 전용 동기화

GitHub Pages의 방문자 브라우저는 Notion API를 호출하지 않습니다. Notion 토큰은 정적 사이트에 포함하지 않습니다. 원본의 미지원 GitHub 북마크 4개는 추정 URL을 추가하지 않았으며, 모든 상세 페이지에서 Notion 원본을 열 수 있습니다.

## 로컬 실행

Node.js 24 LTS와 npm을 권장합니다.

```sh
npm ci
npm run render:pdf
npm run build
npm run check
npm run preview
```

미리보기: http://127.0.0.1:4193/hyunseok/

`dist/`는 생성물입니다. 콘텐츠 또는 CSS를 바꿨으면 빌드 후 브라우저를 새로고침합니다.

## Notion 자동 동기화 연결

**현재 초기 스냅샷은 실제 Notion 원문이지만, 자동 동기화는 `NOTION_API_KEY`를 설정한 뒤부터 작동합니다.** 키가 없으면 기존 검수 스냅샷을 배포하고 Actions에 안내를 남깁니다. 자동 갱신이 되는 것처럼 표시하지 않습니다.

1. Notion Developer Portal에서 이 포트폴리오 전용 읽기 연결을 만듭니다. 읽기 권한만 사용하고 콘텐츠 삽입·수정과 사용자 정보 권한은 주지 않습니다.
2. 연결에 메인 포트폴리오와 전시할 프로젝트 16개에 대한 읽기 접근만 허용합니다. 조사 노트나 다른 비공개 페이지는 추가하지 않습니다.
3. GitHub 저장소의 **Settings → Secrets and variables → Actions → New repository secret**에서 이름 `NOTION_API_KEY`로 토큰을 저장합니다. 토큰을 채팅·소스·문서·`.env` 파일에 쓰지 않습니다.
4. **Actions → Deploy portfolio → Run workflow**를 실행합니다.
5. 동기화 성공 후부터 Notion 수정 사항이 수동 실행 또는 6시간 간격 빌드로 반영됩니다. 변경 즉시 실시간 반영은 아닙니다.

동기화가 실패하거나 지원하지 않는 블록이 발견되면 배포를 중단하여 이미 공개된 사이트를 유지합니다. Notion을 수정하거나 이전 콘텐츠를 삭제하지 않습니다. 만료되는 Notion 이미지 주소는 빌드 중 파일로 내려받고 로컬 경로로 바꾸므로 정적 사이트에 서명 URL을 남기지 않습니다.

새 작품 추가는 먼저 Notion에서 작성한 뒤, 해당 페이지 ID를 `content/notion.json`의 목록과 `content/presentation.json`의 표시 설정에 추가합니다. 사이트에 표시할 페이지를 명시적으로 선택하며, 작업공간 전체를 자동 수집하지 않습니다. 이 초기 버전은 알려진 16개 페이지에 맞춰 검수합니다.

기존 Codex Notion 연결은 GitHub Actions 인증으로 자동 전달되지 않습니다. 초기 스냅샷 가져오기·본문 렌더링은 검증했지만, 연결 키 설정 전의 공식 API 자동 동기화 경로는 실제 계정으로 실행 검증하지 않았습니다.

## GitHub Pages 배포

`.github/workflows/deploy.yml`이 main push, 수동 실행과 정기 실행을 처리합니다. 빌드·경로·콘텐츠 검증을 통과한 `dist/`만 Pages에 배포합니다. 저장소 Pages 설정의 Source는 **GitHub Actions**입니다.

기존 TeamHJD 홈페이지와 별도 저장소·Pages 사이트를 사용합니다. 이 사이트의 Custom domain만 `portfolio.teamhjd.com`으로 설정하고 Cloudflare DNS의 `portfolio` CNAME을 `team-hjd-21.github.io`에 연결합니다. 대표 홈페이지의 apex·www·기존 Pages 도메인·메일 레코드는 바꾸지 않습니다. 인증서 발급 후 HTTPS 강제를 켭니다.

## 콘텐츠 출처와 한계

본문의 수치와 개인·팀 기여 구분은 Notion 원문을 따릅니다. 사이트 제작 과정에서 엔진·게임 빌드나 성능 측정을 새로 수행한 것은 아닙니다. 수료증, 상장, PlanetX 포스터, 그래픽스 보고서 5개는 원본을 보존하고 이미지 미리보기를 제공합니다. 클릭하면 모달에서 첫 페이지를 보고 원본 PDF 전체를 열 수 있습니다. PDF 미리보기 생성에는 Poppler의 `pdftoppm`이 필요하며 Actions에서 준비합니다. 실제 YouTube 영상은 개인정보 보호 강화 도메인의 지연 로딩 iframe으로 표시하며 자동 재생하지 않습니다.

## 화면 기준

다크 모드를 기본으로 소개·기술·학력·수상을 가장 위에 둡니다. 원문 분류를 유지하고 대표작은 PlanetX → Custom Engine → The Developer → Runster 순서입니다. 장식용 로고·기울어진 이미지·채용 문구를 추가하지 않습니다. 개인 문체와 미디어 기준은 상위 `design.md`를 따릅니다.
