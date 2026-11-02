# 고장 난 환경 관측소 실습 안내

이 폴더는 독립 예제다. 게임에서 보드를 플래시하거나 기존 MQTT 펌웨어를 변경하지 않는다.

1. [Keyestudio KS5034 공식 핀맵](https://docs.keyestudio.com/projects/KS5034/en/latest/docs/KS5034%20Keyestudio%20ESP32%20S3%20PRO%20Development%20Board.html#pin-out)에서 보드 방향, IO4 표기와 전원 선택부를 실물과 대조한다. 공식 표에서 IO45는 RGB, IO1은 전류 센서, IO19/20은 USB OTG다. 게임 화면의 배치는 물리 핀 위치가 아니다.
2. 전원을 끈 상태에서 **정확한 DHT11 모듈의 자료**와 실크 인쇄로 VCC/GND/DATA 순서, 3.3V 동작, DATA 풀업이 어느 전원에 연결됐는지 확인한다. [Keyestudio KS6033](https://docs.keyestudio.com/projects/KS6033/en/latest/docs/KS6033%20Humidity%20temperature%20Module.html)은 5V로 명시된 반례다. DHT11이라는 이름만으로 3.3V 호환을 추정하지 않는다.
3. **모두 확인된 3.3V 모듈에만** VCC→확인된 3V3, DATA→IO4, GND→GND 후보를 적용한다. 보드의 V핀이나 점퍼가 항상 3.3V라고 가정하지 않는다. 맨 센서 등 외부 풀업이 필요한 제품은 해당 제품 자료에 따라 3.3V 풀업 회로를 갖춰야 한다. 5V DATA 직결 금지. 전압이나 핀 배열이 불명확하면 연결하지 않는다. [ESP32-S3 데이터시트](https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf)
4. 기존 보드 프로그램을 보존해야 한다면 별도 실습용 보드를 사용한다. Arduino IDE에서 ESP32 보드 패키지의 **ESP32S3 Dev Module**과 보드에 맞는 포트를 선택한다. 라이브러리 관리자에서 Adafruit **DHT sensor library**, **Adafruit Unified Sensor**를 설치하고 이 폴더의 스케치를 검증한 뒤, 사용자가 업로드한다. 데이터 지원 USB 케이블로 연결한다. 115200 baud 시리얼 모니터에서 2초 간격 JSON을 확인한 다음 모니터를 닫아 포트를 브라우저에 넘긴다.
5. 게임은 프로젝트에서 `npm.cmd ci`, `npm.cmd run dev`. 데스크톱 Chrome에서 터미널에 나온 localhost 주소를 연다. 마을 기술 교관 옆에서 E → 교관 의뢰 → 관측소. 3D 핀 또는 아래 핀 버튼으로 양 끝을 선택한다. 연결선 버튼은 삭제, 같은 센서 핀을 새 보드 핀과 연결하면 교체다.
6. 가상 사양과 배선을 검증하고 확인된 실물 장치에 한해 USB 연결을 누른다. 정상적인 USB 측정이 세 번 연속 들어오면 원리 문제를 풀 수 있다. 측정 실패, 5.5초 무응답, 해제는 연속 횟수를 초기화한다. Mock은 별도 연습 경로이며 보상에 포함하지 않는다. 칭호는 기존 학습 기록에 한 번만 저장된다. 보상 전 중단한 실습은 다시 시작한다.

교사 대체 처리는 `TeacherReview` 어댑터를 위한 설계만 제공한다. 향후 학교 인증 서비스가 현재 학습자·미션의 교사 승인을 검증해야 한다. 학생 화면에 우회 버튼은 없다. 로컬 RPG와 Web Serial은 수신 포트를 구분하지만 센서의 물리적 진위나 로컬 저장 변조를 인증하지 않는다.
