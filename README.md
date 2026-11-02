# TECH QUEST · Prototype 01

Vite + TypeScript + Phaser 3 Arcade Physics 기반 교육용 횡스크롤 RPG.

## 실행

Node.js 20.19+ 또는 22.12+가 필요합니다. 일반 Node.js 설치 환경:

```powershell
cd C:\Users\seyeo\tech-quest
npm install
npm run dev
```

이 컴퓨터에는 npm이 PATH에 없어 공식 npm 10.9.4를 프로젝트의 `package/`에 다운로드했습니다. 현재 컴퓨터에서는 `npm` 대신 `.\npm.cmd`를 사용하세요.

```powershell
.\npm.cmd install
.\npm.cmd run dev
.\npm.cmd run build
.\npm.cmd test
```

http://127.0.0.1:5173/ 에서 실행. 서버 종료는 Ctrl+C. 배포 산출물은 dist/. 파일을 더블클릭하지 말고 개발 서버 또는 `npm run preview`를 사용합니다.

## 조작과 구현 범위

- A/D 또는 좌우 방향키: 이동, Space: 점프, Z: 공격(누르고 있으면 쿨다운마다 공격).
- 초보자의 숲 3,200px, 아래에서 통과해 위에 착지하는 플랫폼, 추적 카메라, 두 몬스터의 순찰·HP·리스폰.
- 캐릭터의 걷기·점프·공격 자세와 공격 궤적. 점프 높이와 발판 간격에 여유를 두었습니다.
- 방향과 거리 기반 공격, 380ms 쿨다운, 접촉 피해와 1.1초 무적.
- 사망 시 시작점에서 체력 회복. 레벨업 시 HP·공격력 증가 및 체력 회복.
- 처치 시 경험치·골드 지급 및 localStorage 자동 저장. 위치와 현재 HP는 저장하지 않습니다.
- 아이템 드롭·기술자 마을·상점·인벤토리·꾸미기·X 스킬·E/I/K 창·퀴즈·ESP32는 다음 단계입니다.
- HUD의 처치 안내는 조작 연습용 카운터이며 교육 퀘스트 시스템은 아닙니다.
- 그래픽은 코드로 직접 그렸으며 게임 음원과 외부 이미지가 없습니다.

## 구조 / 파일 목록

| 파일 | 책임 |
| --- | --- |
| index.html, package.json, package-lock.json, tsconfig.json, .gitignore | 진입점·의존성·타입 설정 |
| npm.cmd | 현재 환경에서 공식 npm 실행 |
| src/main.ts, src/style.css | 게임 초기화·반응형 HTML HUD 스타일 |
| src/scenes/GameScene.ts | 월드 조립·입력·카메라·이벤트 연결 |
| src/scenes/textures.ts | 자체 제작 프로그래밍 그래픽 |
| src/entities/Player.ts, Enemy.ts | 플레이어·몬스터 동작 |
| src/systems/CombatSystem.ts | 공격 범위·쿨다운·피해 |
| src/systems/ProgressionSystem.ts | 보상·레벨·능력치 |
| src/systems/SaveSystem.ts | 버전 있는 저장·손상 복구·저장 실패 처리 |
| src/data/config.ts, maps.ts | 밸런스·경험치 표·맵 설정 |
| src/education/types.ts | 학습 등급·미션·장치 확장 계약 |
| src/ui/Hud.ts | DOM 기반 상태 표시 |
| tests/systems.test.ts | 성장·저장 자동 테스트 |
| tests/platforms.test.ts | 점프 물리와 발판 배치의 연결 가능성 검사 |

## 확장 순서

1. 기술자 마을과 포털, NPC 상호작용.
2. ItemData 및 InventorySystem/ShopSystem, 소유·장착·드롭과 저장 스키마 이전.
3. 독립된 학습 등급을 사용하는 NPC 퀴즈와 교사 승인.
4. DeviceGateway 구현으로 ESP32-S3 연결.

밸런스는 config.ts, 지형과 몬스터 배치는 maps.ts에서 조정합니다. 아직 사용하지 않는 상점/인벤토리의 빈 클래스는 만들지 않았습니다.

## 검증 결과 (2026-10-30)

- npm install 성공: 20개 패키지 설치, 취약점 0개 보고.
- TypeScript 검사 및 Vite 프로덕션 빌드 성공.
- 자동 테스트 4개 통과: 다중 레벨업·정확한 경험치 경계·저장 복원 및 손상 복구·저장 실패.
- Chrome 실제 플레이: 이동·점프·카메라·몬스터 피해·접촉 피격·사망 복귀 확인. 슬라임 처치 4회로 Lv.2, EXP 22/90, 골드 32, 최대 HP 115 확인. 리스폰 및 새로고침 후 레벨·EXP·골드·처치 수 복원 확인.
- 미검증: Edge, Surface Go 3 실기기 성능, 모든 플랫폼의 실제 착지, 로봇 처치 완료, 장시간 밸런스, 터치 조작. 키보드 사용을 전제로 합니다.
- 알려진 사항: Phaser 포함 JS 번들이 약 1.5MB(압축 전)로 Vite 크기 경고가 발생합니다. localStorage는 브라우저별이며 학생 간 동기화·교사 인증은 제공하지 않습니다. 플레이 검증으로 이 Chrome 프로필에 테스트 진행(Lv.2)이 저장되었습니다.

## 핵심 개념

1. Scene은 월드를 조립하고 Entity는 개체의 동작을 관리합니다. Combat/Progression은 전투·성장 규칙을 담당합니다.
2. 데이터 기반 설계는 능력치와 맵을 로직 밖에 둡니다. 코드 변경을 줄이며 수업 난이도를 조절할 수 있습니다.
3. 렌더링·게임 상태·영구 저장은 다릅니다. Phaser는 세계를 그리고, HTML HUD는 상태를 보여주며, SaveSystem은 진행만 저장합니다.
