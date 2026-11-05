import {lessons,type Question} from './stage1Data';
export interface BankQuestion extends Question {conceptId:string;difficulty:1|2}
// Each concept has two distinct situations. Correct choices are shuffled by the UI.
const rows:[number,string,string,string,string,string,string,string,string,string][]=[
[11,'board-label','KS5034 단자 표기','센서 전원 단자를 고르기 전에 확인할 것은?','보드 표기와 센서 사양','친구가 꽂은 위치만','보드 방향을 돌려 놓았습니다. 단자는 어떻게 찾나요?','회전 방향 대신 인쇄된 핀 이름을 읽는다','원래 화면 위치로 추측한다','색과 화면 위치만으로 역할을 확정하지 않고 표기와 사양을 확인합니다.'],
[11,'usb-data','USB 데이터 연결','보드는 켜지지만 PC가 인식하지 못합니다. 먼저 비교할 것은?','데이터 지원 케이블과 연결 포트','센서의 온도','충전 케이블을 바꾼 뒤 장치가 나타났습니다. 알 수 있는 것은?','전원 공급과 데이터 전송은 별도 기능이다','모든 USB 케이블이 동일하다','전원이 켜져도 데이터 통신을 보장하지 않습니다.'],
[12,'gpio-match','GPIO와 코드','DATA 배선을 GPIO21로 옮겼다면 코드에서 확인할 것은?','센서 핀 설정이 GPIO21인지','항상 GPIO4인지','코드는 GPIO4인데 DATA는 GPIO21입니다. 먼저 할 일은?','전원을 분리한 뒤 배선과 설정을 일치시킨다','측정값을 임의로 만든다','사용 가능한 GPIO를 선택하고 코드와 실제 DATA 배선 번호를 맞춥니다.'],
[12,'pin-role','신호와 전원','GPIO를 3V3 전원 단자와 바꿔 생각해도 되나요?','아니요. 신호와 전원은 역할이 다르다','모든 노란 단자는 전원이다','센서의 VCC와 DATA를 연결하려 합니다. 무엇을 구별하나요?','전원 공급 단자와 입출력 신호 단자','선의 길이만','GPIO는 신호 입출력이며 3V3 전원 단자와 동일하지 않습니다.'],
[13,'voltage','신호 전압','5V 출력 센서를 ESP32-S3 GPIO에 연결하기 전 필요한 것은?','신호 전압 확인과 적절한 레벨 변환','직접 연결해 보기','센서는 켜지는데 DATA가 5V로 올라갑니다. 판단은?','전원 동작과 GPIO 신호 안전성은 별도로 확인한다','켜지면 안전하다','5V 신호를 ESP32-S3 GPIO에 직접 입력하지 않습니다.'],
[13,'ground','공통 기준','장치 사이 신호 전압을 비교할 기준은?','회로의 GND 기준','USB 케이블 색','센서 VCC와 DATA만 연결했습니다. 빠진 배선 점검은?','GND 연결 여부','게임 레벨','GND는 신호 전압의 기준이며 배선도에 맞게 연결해야 합니다.'],
[14,'connector','점퍼선 선택','수 핀 두 개를 잇는 선은?','암-암 점퍼선','수-수 점퍼선','한쪽은 소켓, 다른 쪽은 수 핀입니다. 필요한 선은?','수-암 점퍼선','암-암만 가능','연결 대상의 양끝 형상을 보고 맞는 단자를 선택합니다.'],
[14,'power-off','배선 점검','잘못 꽂은 점퍼선을 옮기기 전에는?','전원을 분리한다','전원이 켜진 채 반복해서 찌른다','연결 후 전원을 넣기 전 확인할 것은?','VCC·GND·DATA와 단락 여부','캐릭터 장비','전원을 분리하고 배선과 단락 여부를 점검한 다음 전원을 공급합니다.'],
[15,'ipo','입력 처리 출력','온도가 높으면 경고를 표시합니다. 온도 측정은?','입력','출력','센서값과 기준 온도를 비교하는 단계는?','처리','입력 장치 자체','측정은 입력, 판단은 처리, 화면이나 장치의 반응은 출력입니다.'],
[15,'condition','조건 판단','온도에 따라 팬을 켜려면 필요한 것은?','측정값과 기준을 비교하는 조건','항상 같은 화면만 표시','경고가 너무 자주 바뀝니다. 먼저 조사할 것은?','측정 기록과 판단 조건','점퍼선 색만','기록과 조건을 비교해 동작 원인을 조사합니다.'],
[16,'dht-data','DHT11 측정','DHT11이 제공하는 두 측정값은?','온도와 습도','거리와 속도','관측소에 온도만 나타납니다. 추가 확인할 값은?','습도 데이터','모터 회전수','DHT11은 온습도 센서이며 두 측정값을 구별해 표시합니다.'],
[16,'invalid','측정 실패','valid:false가 도착했습니다. 표시 방법은?','측정 실패로 표시하고 정상 횟수에서 제외한다','온도 0도로 정상 처리','마지막 정상값만 계속 보입니다. 필요한 정보는?','마지막 정상 측정 시간과 오래된 값 경고','정상이라는 문구만','측정 실패와 정상값을 구분하고 오래된 값을 현재 측정처럼 표시하지 않습니다.'],
[17,'json-lines','시리얼 데이터','JSON Lines 수신에서 한 줄이 아직 다 오지 않았다면?','남은 조각을 기다려 줄 단위로 파싱한다','조각을 모두 정상 데이터로 센다','부팅 안내문과 센서 JSON이 섞여 있습니다. 어떻게 처리하나요?','종류와 형식을 확인해 센서 데이터만 검증한다','모든 문장을 온도로 변환한다','줄 단위로 모으고 형식·데이터 종류·유효성을 검증합니다.'],
[17,'real-source','실측과 모의 데이터','Mock 온도 3회를 받았습니다. 실물 검증인가요?','아니요. 모의 데이터다','실물 검증 완료다','USB 연결은 성공했지만 센서값은 없습니다. 상태는?','장치 연결과 정상 데이터 수신을 구분한다','측정 성공이다','연결 성공, 실제 정상 수신, Mock 수신은 서로 다른 상태입니다.'],
[18,'ultrasonic','초음파 센서','초음파 센서가 거리를 추정할 때 사용하는 정보는?','신호가 왕복하는 시간','공기 색상','물체 위치를 바꿔 거리 센서를 시험합니다. 비교할 것은?','실제 거리와 측정값의 변화','DHT11 습도만','왕복 시간을 이용한 거리 추정이 상황에 맞는지 비교합니다.'],
[18,'echo-safe','Echo 안전','HC-SR04의 5V Echo를 받으려면?','적절한 레벨 변환으로 GPIO 허용 전압에 맞춘다','GPIO에 바로 연결한다','센서 전원을 5V로 공급했습니다. Echo 안전성이 보장되나요?','아니요. 신호 전압을 따로 확인한다','전원이 맞으면 모든 신호도 안전하다','센서 전원과 Echo 신호 전압을 구별하고 GPIO를 보호합니다.'],
[19,'diagnosis','원인 좁히기','측정이 실패합니다. 좋은 점검 방법은?','배선·핀 설정·데이터를 하나씩 비교한다','설정을 모두 동시에 바꾼다','케이블을 바꾸고 문제가 해결됐습니다. 남길 기록은?','증상·변경한 항목·확인 결과','성공이라는 말만','한 항목씩 확인하고 결과를 기록해야 원인을 설명할 수 있습니다.'],
[19,'reconnect','재연결','USB를 뺐는데 화면에 과거 값이 남았습니다. 표시해야 할 것은?','연결 끊김과 마지막 수신 시간','계속 정상 측정 중','USB를 다시 꽂았습니다. 무엇을 다시 확인하나요?','연결 상태와 새로운 정상 측정 수신','이전 값 세 개만 재사용','재연결 후 새 데이터가 들어오는지 검증하며 과거값을 새 실측으로 세지 않습니다.'],
[20,'project','문제 해결 프로젝트','교실 환기 알림을 만들기 전 정할 것은?','해결할 문제와 확인 가능한 성공 기준','경고음을 가장 크게 만드는 법만','장치를 만들었지만 효과를 모르겠습니다. 필요한 것은?','사용 전후 기록과 성공 기준 비교','외형만 꾸미기','문제 정의와 관찰 가능한 기준을 정하고 결과를 비교합니다.'],
[20,'evidence','실제 수행 증거','객관식 시험에 합격했습니다. 회로 제작도 완료인가요?','아니요. 실제 수행과 검증이 따로 필요하다','자동으로 실제 배선 인증이다','프로젝트 결과를 제출할 때 포함할 것은?','측정 기록·실패와 수정 과정·개선점','정답 개수만','개념 이해와 실제 수행 증거를 구분해 설명합니다.']
];
export const stage2Bank:BankQuestion[]=rows.flatMap(([level,conceptId,objective,p1,a1,w1,p2,a2,w2,explanation])=>[[p1,a1,w1],[p2,a2,w2]].map(([prompt,answer,wrong],i)=>({id:`s2-${level}-${conceptId}-${i}`,level,conceptId,difficulty:i===0?1:2,objective,kind:i===0?'concept':'application',prompt,choices:[{id:'correct',text:answer},{id:'wrong',text:wrong}],answer:'correct',explanation,wrongFeedback:'다시 생각해 보세요. '+explanation,concepts:[conceptId]})));
export const reviewBank:BankQuestion[]=lessons.filter(l=>[4,8,9,10].includes(l.level)).flatMap(l=>l.questions.map(q=>({...q,conceptId:`s1-${l.level}`,difficulty:2 as const})));
export const questionBank:BankQuestion[]=[...stage2Bank,...reviewBank];
export const stage2Level=(level:number)=>level>=11&&level<=20;
export function readHistory(raw:unknown):string[]{return Array.isArray(raw)?raw.filter((id):id is string=>typeof id==='string'&&questionBank.some(q=>q.id===id)).slice(-80):[]}
// Least recently used variants first; stable IDs resolve ties for reproducible reloads.
export function selectQuestions(level:number,history:string[]=[],bank:BankQuestion[]=questionBank):BankQuestion[]{
 const used=new Set<string>();
 const ordered=(pool:BankQuestion[])=>pool.filter(q=>!used.has(q.id)).sort((a,b)=>history.lastIndexOf(a.id)-history.lastIndexOf(b.id)||b.difficulty-a.difficulty||a.id.localeCompare(b.id));
 const pick=(pool:BankQuestion[],count:number,distinct=false)=>{const result:BankQuestion[]=[];for(const q of ordered(pool)){if(distinct&&result.some(r=>r.conceptId===q.conceptId))continue;used.add(q.id);result.push(q);if(result.length===count)break}return result};
 const fresh=pick(bank.filter(q=>q.level===level),2,true);
 const review=level===11?pick(bank.filter(q=>q.level<=10),2,true):level===12?pick(bank.filter(q=>q.level===11),2,true):[...pick(bank.filter(q=>q.level===level-1),1),...pick(bank.filter(q=>q.level>=11&&q.level<=level-2),1)];
 // Never silently reduce the exam or promote on an empty bank.
 return fresh.length===2&&review.length===2?[...fresh,...review]:[];
}
export function validSelection(level:number,ids:unknown):ids is string[]{
 if(!Array.isArray(ids)||ids.length!==4||new Set(ids).size!==4)return false;
 const qs=ids.map(id=>questionBank.find(q=>q.id===id));if(qs.some(q=>!q))return false;
 const [a,b,c,d]=qs as BankQuestion[];
 return a.level===level&&b.level===level&&a.conceptId!==b.conceptId&&(level===11?c.level<=10&&d.level<=10:level===12?c.level===11&&d.level===11:c.level===level-1&&d.level>=11&&d.level<=level-2);
}
