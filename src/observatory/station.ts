import {MeasurementRun} from '../education/measurement2';
import {missionWiringError} from '../education/practical2';
import {makeBoard} from './board';
import {inputs,outputs,wiringError,type BoardPin,type SensorPin,type Profile,type Wires} from './wiring';
import {readSerial} from './sensor';
import {badges,Observatory,principle,recordTitle,title} from './mission';
import './station.css';

export interface StationPractice {mode:'wiring'|'measurement';onWiring:(w:Wires,profile:Profile,otherWires:number)=>boolean;onMeasurement?:(run:MeasurementRun)=>boolean}
export function openStation(ids:string[],save:()=>boolean,done:()=>void,practice?:StationPractice){
 const d=document.createElement('dialog');d.className='workshop station';d.setAttribute('aria-labelledby','station-title');
 d.innerHTML=`<div class="station-head"><div><small>기술 교관 의뢰 · KS5034 LAB</small><h2 id="station-title">고장 난 온습도 관측소</h2></div><div><button data-toggle aria-expanded="false">미션 검사 · 0/3</button><button data-exit>실습 종료 · 마을로 복귀</button></div></div>
 <div class="station-body"><div data-board></div><aside aria-label="관측소 미션 검사" hidden>
 <section data-fallback><h3>선택 단자</h3><strong data-inspect>단자를 선택하세요</strong><p data-details>보드에서 핀을 누르거나 아래 버튼으로 선택하세요.</p>
 <div data-pins></div><p data-selected aria-live="polite"></p></section>
 <section class="station-step"><h3>1 · 배선 검사</h3><div class="station-step-actions"><label>센서 전압 <select data-profile><option value="unknown">미확인</option><option value="3v3" selected>3.3V · DATA 풀업 3.3V</option><option value="5v">5V 전원 / DATA 풀업</option></select></label>
 <button data-check>배선 검사</button></div><p data-wiremsg role="status"></p>
 <details><summary>연결 목록 <span data-count></span></summary><div class="wire-key" aria-label="케이블 색상"><span>전원</span><span>접지</span><span>신호</span></div><div data-wires></div><button data-reset>배선 초기화</button></details></section>
 <div data-hardware><section class="station-step"><h3>2 · USB 연결 및 측정</h3>
 <label class="station-safety"><input type="checkbox" data-safe> 실물 핀 배열·전원 3.3V·DATA 풀업 3.3V 확인</label>
 <div class="station-step-actions"><button data-connect>실제 USB 연결</button> <button data-stop>연결 해제</button></div>
 <p data-link role="status"></p><output data-reading>온도 — °C · 습도 — %</output><p data-last>마지막 정상 USB 측정 —</p>
 <details><summary>연결 도움말 · Mock 연습</summary><p>DATA → GPIO21 · VCC → 3V3 · GND → GND. 5V DATA를 GPIO에 직접 연결하지 마세요.</p><p>2초 간격의 정상 USB 측정 3회로 검증합니다. Mock은 실제 측정에 포함되지 않습니다.</p><button data-mock>Mock 연습</button></details></section>
 <section class="station-step" data-diagnosis><h3>3 · 방어막 진단</h3><div class="shield"><span class="golem" aria-hidden="true">▣ ▣</span><div><b>센서 오류 골렘</b><p data-shield></p></div></div>
 <label>입력 → 처리 → 출력 순서<select data-answer><option value="">선택하세요</option><option>USB로 출력 → 센서 측정 → 보드에서 검사</option><option>${principle}</option></select></label>
 <button data-unlock>방어막 해제</button></section><p data-result role="status"></p></div></aside></div>`;
 const intro=document.createElement('section');intro.className='station-intro';
 intro.innerHTML=`<small>${practice?.mode==='measurement'?'실제 센서 측정':'화면 속 배선 연습'}</small><h3>${practice?.mode==='measurement'?'실제 온도와 습도를 읽어 봐요.':'센서와 보드를 연결해 봐요.'}</h3>
 <p>점선을 따라 선 3개를 연결하고 <b>연결 확인·검사</b>를 누르세요.</p>
 <p class="station-pin-guide">DATA → 21번 S · VCC → V(3.3V) · GND → G</p>
 ${practice?.mode==='measurement'?'<p>배선 확인 후 USB를 연결해 온습도를 3번 읽어요.</p>':''}
 <details><summary>연결할 때 알아둘 점</summary><p>보드의 빨간 V는 3.3V 설정을 사용해요. 실제 전원을 연결하기 전에는 핀 이름과 전압을 확인하세요.</p><p>21번은 현재 센서를 읽는 프로그램의 핀 번호예요. 다른 GPIO를 쓰려면 프로그램의 번호도 바꿔야 해요.</p><p>장비가 없으면 화면 속 배선만 연습할 수 있어요. 나가려면 오른쪽 위 복귀 버튼을 누르세요.</p></details><button data-begin>배선 연습 시작</button>`;
 const workspace=d.querySelector<HTMLElement>('.station-body')!;workspace.hidden=true;
 workspace.before(intro);
 const guide=document.createElement('div');guide.className='station-guide';guide.hidden=true;
 guide.innerHTML='<div><strong data-next role="status"></strong><p>VCC → 3V3 · GND → GND · DATA → GPIO21</p></div><button data-next-action>연결 확인·검사</button>';
 workspace.before(guide);
 const help=document.createElement('button');help.textContent='실습 안내';help.hidden=true;
 d.querySelector('[data-toggle]')!.before(help);
 document.body.append(d);d.showModal();
 const get=<T extends HTMLElement>(k:string)=>d.querySelector<T>('[data-'+k+']')!;
 const btn=(k:string)=>get<HTMLButtonElement>(k);
 if(practice){d.querySelector('#station-title')!.textContent=practice.mode==='wiring'?'Lv.13 · DHT11 가상 배선':'Lv.15 · DHT11 실물 측정';get('hardware').hidden=practice.mode==='wiring';get('diagnosis').hidden=true;btn('exit').textContent='실습 기록으로 복귀'}
 const run=new MeasurementRun();let measured=false;
 const m=new Observatory(),w:Wires={};let selected='',controller:AbortController|undefined,mock=0,last=0;
 let shared=false,otherWires=0,lastCircuit='';
 const locations:Partial<Record<SensorPin,string>>={};
 const missionPanel=d.querySelector('aside')!;
 function showMission(visible:boolean){
   d.classList.toggle('checking',visible);
   missionPanel.hidden=!visible;
   get('board').hidden=visible;
   btn('toggle').setAttribute('aria-expanded',String(visible));
   btn('toggle').textContent=visible?'배선 실습으로 돌아가기':'연결 확인·검사 · '+Object.keys(w).length+'/3';
 }
 btn('toggle').onclick=()=>showMission(missionPanel.hidden);
 const completed=()=>Object.values(badges).some(id=>ids.includes(id));
 let board:ReturnType<typeof makeBoard>|undefined;
 const controls=(label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b};
 function refresh(){
   const count=Object.keys(w).length;
   get('next').textContent=!m.wired?(count<3?'선 3개를 연결하세요 · '+count+'/3':'연결 완료 · 배선을 검사하세요'):
     practice?.mode==='wiring'?'배선 검사 통과':m.count>=3?'정상 측정 3회 완료':'배선 통과 · USB를 연결하세요';
   const safe=get<HTMLInputElement>('safe').checked;
   btn('connect').disabled=!navigator.serial||!window.isSecureContext||!safe||!m.wired||!!controller||!!mock;
   btn('stop').disabled=!controller&&!mock;btn('mock').disabled=!!controller||!!mock||!m.wired;
   btn('unlock').disabled=completed()||!m.connected||m.count<3||!m.wired;
   btn('unlock').textContent=completed()?'해제 완료':!m.wired?'먼저 배선을 검사해 주세요':m.count<3?'실제 측정 '+m.count+'/3 · 수신 대기':'방어막 해제';
   get('answer').closest('label')!.hidden=completed();
   get('shield').textContent=completed()?'✓ 관측소 복구 완료 · 칭호: '+title+(ids.includes(badges.teacher)?' (교사 확인)':''):'실제 온습도를 3번 읽으면 방어막을 해제할 수 있어요. ('+m.count+'/3)';
   d.classList.toggle('restored',completed());
 }
 function stop(){
   run.close();measured=false;controller?.abort();if(mock)window.clearInterval(mock);mock=0;m.resetConnection();last=0;
   get('link').textContent=navigator.serial&&window.isSecureContext?'연결 안 됨':'USB 연결 미지원 · 데스크톱 Chrome 또는 Edge에서 localhost나 HTTPS로 여세요.';get('reading').textContent='온도 — °C · 습도 — %';refresh();
 }
 function changed(){
   stop();m.setWired(false);get('wiremsg').textContent='배선 검사 후 진행하세요.';
   const list=get('wires');list.replaceChildren();
   for(const pin of inputs)if(w[pin]){
     const line='DHT11 '+pin+' → KS5034 '+(locations[pin]??w[pin]);
     if(shared){const row=document.createElement('div');row.textContent=line;list.append(row)}
     else list.append(controls(line+' · 삭제',()=>{delete w[pin];changed()}));
   }
   const count=Object.keys(w).length;
   get('count').textContent=count+' / 3';
   if(!count)list.textContent='연결된 선이 없습니다.';
   btn('reset').disabled=!count && !selected;
   showMission(!missionPanel.hidden);refresh();
 }
 const description:Record<string,string>={
   'B:GPIO21':'GPIO21 · 3.3 V 로직 · DHT11 DATA를 읽는 디지털 입력',
   'B:3V3':'3.3 V · 센서에 전원을 공급하는 단자',
   'B:5V':'5 V · 이 실습에서는 연결하면 안 되는 전원',
   'B:GND':'0 V · 센서와 기준 전위를 공유하는 접지',
   'S:VCC':'전원 입력 · 3.3 V 호환 모듈을 가정합니다.',
   'S:DATA':'온습도 신호 · 사용할 GPIO와 펌웨어의 DATA_PIN 번호를 맞추세요.',
   'S:GND':'0 V · 보드 GND로 연결합니다.'
 };
 function inspect(name:string,details:string){get('inspect').textContent=name;get('details').textContent=details}
 function choose(id:string,start?:string){
   if(start)selected=start;
   inspect((id[0]==='B'?'KS5034 · ':'DHT11 · ')+id.slice(2),description[id]??'디지털 신호 핀 · 펌웨어의 DATA_PIN과 같은 번호를 사용하세요.');

   if(!selected||selected[0]===id[0])selected=selected===id?'':id;
   else{const [b,s]=id[0]==='B'?[id,selected]:[selected,id];w[s.slice(2) as SensorPin]=b.slice(2) as BoardPin;selected='';changed()}
   get('selected').textContent=selected?'● 선택됨 · '+selected.slice(2)+' — '+(selected[0]==='B'?'센서':'보드')+' 핀을 선택하세요.':'다음 연결을 선택할 수 있습니다.';
   for(const button of Array.from(get('pins').querySelectorAll('button')))button.setAttribute('aria-pressed',String(button.dataset.pin===selected));
   btn('reset').disabled=!Object.keys(w).length&&!selected;
 }
 for(const [prefix,pins] of [['B',outputs],['S',inputs]] as const){const row=document.createElement('div');row.append(prefix==='B'?'KS5034 ':'DHT11 ');for(const pin of pins){const id=prefix+':'+pin;const button=controls(pin,()=>choose(id));button.dataset.pin=id;row.append(button);}get('pins').append(row)}
 btn('reset').onclick=()=>{for(const pin of inputs)delete w[pin];selected='';inspect('단자를 선택하세요','보드 또는 센서의 핀을 선택하세요.');get('selected').textContent='';get('pins').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));changed()};
 function loadBoard(){board=makeBoard(get('board'),state=>{
   const next=JSON.stringify(state);
   if(next===lastCircuit)return;
   lastCircuit=next;shared=true;otherWires=state.otherWires;
   get('fallback').hidden=true;btn('reset').hidden=true;
   for(const pin of inputs){
     const item=state.wires[pin];
     if(item){w[pin]=item.net;locations[pin]=item.label}
     else{delete w[pin];delete locations[pin]}
   }
   changed();
 });}
 btn('toggle').hidden=true;
 btn('begin').onclick=()=>{
   intro.hidden=true;workspace.hidden=false;guide.hidden=false;btn('toggle').hidden=false;help.hidden=false;
   if(!board)loadBoard();showMission(false);help.focus();
 };
 help.onclick=()=>{intro.hidden=false;workspace.hidden=true;guide.hidden=true;btn('toggle').hidden=true;help.hidden=true;btn('begin').textContent='배선 실습 계속하기';btn('begin').focus()};
 btn('next-action').onclick=()=>{showMission(true);btn('check').focus()};
 btn('begin').focus();
 get('profile').onchange=changed;get<HTMLInputElement>('safe').onchange=()=>{if(!get<HTMLInputElement>('safe').checked)stop();refresh()};
 btn('check').onclick=()=>{stop();const msg=(practice?missionWiringError(w,get<HTMLSelectElement>('profile').value as Profile,otherWires):wiringError(w,get<HTMLSelectElement>('profile').value as Profile))??(otherWires?'관측소 검사에는 DHT11만 사용합니다. 다른 부품의 배선을 분리하세요.':null);m.setWired(!msg);
 get('wiremsg').textContent=msg?'⚠ '+msg:'✓ 가상 회로 정상 · 실물 펌웨어의 DATA_PIN을 '+w.DATA!.slice(4)+'로 설정하세요.';if(!msg&&practice)get('wiremsg').textContent=practice.onWiring({...w},get<HTMLSelectElement>('profile').value as Profile,otherWires)?'✓ 가상 배선 결과 저장 완료 · 실물 검증과 별도':'저장 실패 · 배선 검사 버튼으로 다시 저장하세요.';refresh()};
 btn('mock').onclick=()=>{stop();let n=0;const tick=()=>{const v={temperature:24+(n++%3),humidity:55};m.receive('mock',v);get('link').textContent='Mock 연습 · 실제 측정 횟수에 포함되지 않습니다.';get('reading').textContent='Mock · '+v.temperature+' °C / '+v.humidity+' %'};tick();mock=window.setInterval(tick,2000);refresh()};
 btn('stop').onclick=stop;
 btn('connect').onclick=async()=>{
   stop();const c=new AbortController();controller=c;refresh();get('link').textContent='실제 USB · 장치 선택 대기';
   let end='실제 USB 연결이 종료됐습니다.';
   try{await readSerial(c.signal,()=>{run.open();m.connected=true;last=Date.now();get('link').textContent='실제 USB 연결 · 수신 대기';refresh()},v=>{
     const now=Date.now();
     if(now-last>5500)m.receive('serial',null);
     if(v){last=now;get('last').textContent='마지막 정상 USB 측정 · '+new Date(now).toLocaleString('ko-KR')}
     m.receive('serial',v);
     if(practice?.mode==='measurement'){
       run.receive('serial',v,now);m.count=run.count;
       if(run.count===3&&!measured){measured=practice.onMeasurement?.(run)===true;get('result').textContent=measured?'✓ 3회 실측 결과 저장 완료 · 공식 교사 승인은 별도입니다.':'저장 실패 · 연결을 유지하면 다음 정상 측정에서 재시도합니다.'}
     }
     get('reading').textContent=v?'실제 USB · '+v.temperature+' °C / '+v.humidity+' %':'측정 실패 · 값 없음';get('link').textContent=!v?'USB 연결됨 · 측정 실패':m.count===3?'USB 연결됨 · 연속 3회 측정 검증 완료 (장치 검증 완료)':'USB 연결됨 · 정상 측정 '+m.count+' / 3';refresh();
   })}catch(e){end='연결 실패 · '+(e instanceof Error?e.message:String(e))}
   finally{run.close();controller=undefined;m.resetConnection();if(d.open){get('link').textContent=c.signal.aborted?'연결 해제':end;get('reading').textContent='온도 — °C · 습도 — %';refresh()}}
 };
 const timer=window.setInterval(()=>{if(m.connected&&Date.now()-last>5500){run.expire();m.receive('serial',null);get('link').textContent='실제 USB · 수신 시간 초과';get('reading').textContent='측정값 없음';refresh()}},500);
 btn('unlock').onclick=()=>{
   if(practice)return;
   if(!m.answer(get<HTMLSelectElement>('answer').value)){get('result').textContent='측정 3회와 입력·처리·출력 순서를 확인하세요.';return}
   if(recordTitle(ids,m.cleared)){
     if(!save()){ids.pop();get('result').textContent='저장 실패 · 다시 시도하세요.';refresh();return}
     stop();get('result').textContent='관측소 복구! 칭호 획득: '+title;
   }refresh();
 };
 btn('exit').onclick=()=>d.close();d.addEventListener('close',()=>{stop();clearInterval(timer);board?.dispose();d.remove();done()},{once:true});changed();refresh();
}
