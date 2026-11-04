# 양현석 포트폴리오

Notion을 콘텐츠 원본으로 사용하는 게임 클라이언트 개발자 포트폴리오입니다. GitHub Pages용 정적 HTML을 생성합니다.

- 공개 주소: `https://hyunseok.teamhjd.com/`
- 원본: https://anyanyang.notion.site/2e9c8404c9328051ab45c80805366ec1
- 16개 프로젝트, 대표작 4개, 주요 작품 갤러리·보조 작품 리스트, 프로젝트 팝업 및 직접 접근 가능한 상세 페이지
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

미리보기: http://127.0.0.1:4193/

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

개인 저장소 `yanggogi1423/portfolio`의 GitHub Pages를 사용합니다. Custom domain은 `hyunseok.teamhjd.com`이며 Cloudflare DNS의 `hyunseok` CNAME을 `yanggogi1423.github.io`에 DNS only로 연결합니다. 사이트는 별도 하위 경로 없이 루트(`/`)에서 제공합니다. 대표 홈페이지의 apex·www·기존 Pages 도메인·메일 레코드는 바꾸지 않습니다. 인증서 발급 후 HTTPS 강제를 켭니다.

## 콘텐츠 출처와 한계

본문의 수치와 개인·팀 기여 구분은 Notion 원문을 따릅니다. 사이트 제작 과정에서 엔진·게임 빌드나 성능 측정을 새로 수행한 것은 아닙니다. 수료증, 상장, PlanetX 포스터, 그래픽스 보고서 5개는 원본을 보존하고 이미지 썸네일을 제공합니다. PDF 타일을 누르면 새 탭에서 전체 PDF를 바로 열며, 브라우저의 PDF 리더로 페이지 이동·확대·다운로드를 할 수 있습니다. 이미지인 상장은 확대 팝업으로 봅니다. PDF 썸네일 생성에는 Poppler의 `pdftoppm`이 필요하며 Actions에서 준비합니다. 실제 YouTube 영상은 개인정보 보호 강화 도메인의 지연 로딩 iframe으로 표시하며 자동 재생하지 않습니다.

## 화면 기준

다크 모드를 기본으로 소개·기술·학력·수상을 가장 위에 둡니다. 원문 분류를 유지하고 대표작은 PlanetX → Custom Engine → The Developer → Runster 순서입니다. 장식용 로고·기울어진 이미지·채용 문구를 추가하지 않습니다. 개인 문체와 미디어 기준은 상위 `design.md`를 따릅니다.

프로젝트는 목록에서 팝업으로 열며 X·Escape·배경 클릭으로 닫습니다. 닫으면 기존 목록 위치와 포커스로 돌아가고 영상도 정리합니다. 일반 링크를 보존하여 새 탭·직접 방문·JavaScript 미사용 환경에서는 상세 페이지를 열 수 있습니다. 수료증·보고서 등 PDF는 작은 이미지 박스를 누르면 전체 원본을 새 탭에서 바로 엽니다. 프로필 사진은 원본 세로 비율로 PC 240px·태블릿 160px·모바일 128px 너비로 표시하며, 사진을 누르면 화면 안에 맞춘 확대 팝업으로 원본을 봅니다.

## 2026-11-02 이전

기존 조직 저장소를 개인 저장소로 이전해 커밋 기록을 보존했습니다. 이전 `/hyunseok/` 및 각 프로젝트 경로는 현재 루트 경로로 이동하는 호환 페이지를 생성합니다. 기존 `portfolio.teamhjd.com` 호스트는 Cloudflare에서 새 도메인으로 301 이동시키며, `/hyunseok/` 접두어도 제거합니다.

## 브라우저 파비콘

`assets/favicons/v1/portfolio/`는 TeamHJD 공통 로켓에 사람 배지를 붙인 공식 v1 자산입니다. 회사 저장소 `Team-HJD-21/team-hjd-site`의 커밋 `22c596ac6ea86edd5e0f7adee07875c49e0e449a`에서 파일과 상위 `.gitattributes`, 원본 `manifest.json`을 바이트 변경 없이 복사했습니다. 기준은 해당 저장소의 `scripts/favicon-brand.md`를 따릅니다.

공통 head에서 ICO → PNG → SVG 및 Apple touch icon을 같은 버전 경로로 연결합니다. 빌드는 새 아이콘을 생성하지 않으며 `npm run check`가 9개 자산의 크기·SHA256과 모든 일반 페이지의 아이콘 링크를 확인합니다. 공개된 v1 파일을 덮어쓰지 않고 디자인 개정은 v2로 분리합니다. 본문·헤더 로고·Notion 원본과는 별개인 브라우저 탭 자산입니다.
