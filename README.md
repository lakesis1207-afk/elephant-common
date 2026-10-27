# 공통 코드 (elephant-common)

「코끼리와 숫자친구들」 여러 앱이 함께 쓰는 코드. 앱에서는 `@공통/...` 경로로 불러온다.

- `games/` 게임 진행(engine), 난이도(difficulty), 문제 만들기, 게임 틀(shared/)
- `widgets/dom.js` 화면 요소 도우미 (앱 시작 때 `setArtLookup(artUrl)`로 그림 찾는 함수를 등록)
- `app/korean.js` 한국어 조사 처리

앱마다 다른 것(마을, 그림 목록, 음성 문구)은 이 폴더에 두지 않고 앱에서 인자로 넘긴다.
