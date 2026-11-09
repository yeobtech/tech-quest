# 모바일 조작과 외부 접속

- 터치 기기 또는 너비 900px 이하에서 화면 버튼 표시. PC에서도 '화면 버튼 표시 / 숨기기'로 전환.
- 방향키: 이동·사다리, 공격: 누르고 있으면 기존 쿨다운에 맞춰 공격, 점프: 누를 때 한 번.
- 대화 / 사용: NPC·상자·포털. 가방·퀘스트·측정·디지털 훈련장 복귀도 화면 버튼 제공.
- 창이 열리거나 앱이 백그라운드로 가면 터치 입력 해제. 게임 물리·피해 판정은 기존 값을 사용.
- 기기/브라우저/사이트 주소마다 localStorage가 별도입니다. PC의 기록이 모바일에 자동 동기화되지 않습니다.
- 모바일 RPG 조작 지원과 실제 USB 센서 지원은 별개입니다. USB는 지원되는 데스크톱 Chrome/Edge에서 검증하세요.

## GitHub Pages

GitHub 저장소에 업로드한 뒤 Settings → Pages → Source를 GitHub Actions로 설정합니다.
`.github/workflows/pages.yml`이 master/main의 변경마다 설치·테스트·빌드 후 dist만 배포합니다.
Actions의 deploy 작업에 반환된 주소가 실제 접속 주소입니다. 배포 성공 전에는 공개 완료가 아닙니다.
상대 경로 빌드를 사용하므로 저장소 하위 경로에서도 게임·PNG·배선실을 로딩합니다.
공개 저장소는 소스 및 public 이미지도 공개됩니다. 업로드 전에 공개 범위를 확정하세요.

공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
