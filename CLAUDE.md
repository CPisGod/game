# 게임 프로젝트 규칙

각 게임은 `<게임이름>/index.html` 폴더 구조이며, 루트 `index.html`이 메인 메뉴다.

## 새 게임을 만들 때 반드시 지킬 것
- 모든 게임 화면 **오른쪽 아래**에 메인 메뉴(`../`)로 돌아가는 버튼을 넣는다.
  - `<body>` 바로 안에 `<a class="home-btn" href="../">🏠 메인 메뉴</a>` 추가
  - 스타일은 기존 게임(`doo/index.html`)의 `.home-btn` CSS를 그대로 복사 (`position: fixed; right/bottom; z-index: 9999`로 오버레이 위에 항상 보이게)
- 새 게임을 추가하면 루트 `index.html` 메인 메뉴에도 링크를 추가한다.
