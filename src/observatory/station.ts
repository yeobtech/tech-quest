import {makeBoard} from './board';
import {inputs,outputs,wiringError,type BoardPin,type SensorPin,type Profile,type Wires} from './wiring';
import {readSerial} from './sensor';
import {badges,Observatory,principle,recordTitle,title} from './mission';
import './station.css';

export function openStation(ids:string[],save:()=>boolean,done:()=>void){
 const d=document.createElement('dialog');d.className='workshop station';d.setAttribute('aria-labelledby','station-title');
 d.innerHTML=`<small>기술 교관의 의뢰 · 첫 번째 보스</small><h2 id="station-title">고장 난 환경 관측소</h2>
 <div class="shield"><span class="golem" aria-hidden="true">▣ ▣</span><div><b>센서 오류 골렘</b><p data-shield></p></div></div>
 <h3>1 · 관측소 회로 복구</h3><p>가상 KS5034 + DHT11입니다. 위치는 실물 핀맵이 아닙니다. 드래그로 회전하고 휠로 확대하세요.</p>
 <div data-board></div><label>가상 센서 사양 <select data-profile><option value="unknown">미확인</option><option value="3v3">3.3V 호환 · DATA 풀업 3.3V</option><option value="5v">5V 전원 또는 DATA 풀업 5V</option></select></label>
 <p>보드 핀 하나와 센서 핀 하나를 차례로 선택하세요. 같은 센서 핀에 다시 연결하면 선이 교체됩니다.</p><div data-pins></div><small data-selected></small><div data-wires></div><button data-check>배선 검사</button><p data-wiremsg role="status"></p>
 <h3>2 · 온습도 수신</h3><p>실물은 전원 차단 후 모듈 핀 배열과 전압을 확인하세요. 5V DATA를 GPIO에 직접 연결하지 마세요.</p>
 <label><input type="checkbox" data-safe> 실물의 VCC·GND·DATA 배열, 3.3V 동작 및 DATA 풀업 3.3V를 확인함</label>
 <div><button data-connect>실제 USB 장치 연결</button> <button data-stop>연결 해제</button> <button data-mock>Mock 연습</button></div>
 <p data-link role="status"></p><output data-reading>온도 — °C · 습도 — %</output>
 <h3>3 · 방어막 진단</h3><label>입력 → 처리 → 출력에 해당하는 순서는?<select data-answer><option value="">선택하세요</option><option>USB로 출력 → 센서 측정 → 보드에서 검사</option><option>${principle}</option></select></label>
 <button data-unlock>방어막 해제</button><p data-result role="status"></p><button data-exit>마을로 복귀</button>`;
 document.body.append(d);d.showModal();
 const get=<T extends HTMLElement>(k:string)=>d.querySelector<T>('[data-'+k+']')!;
 const btn=(k:string)=>get<HTMLButtonElement>(k);
 const m=new Observatory(),w:Wires={};let selected='',controller:AbortController|undefined,mock=0,last=0;
 const completed=()=>Object.values(badges).some(id=>ids.includes(id));
 let board:ReturnType<typeof makeBoard>|undefined;
 const controls=(label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b};
 function refresh(){
   const safe=get<HTMLInputElement>('safe').checked;
   btn('connect').disabled=!safe||!m.wired||!!controller||!!mock||completed();
   btn('stop').disabled=!controller&&!mock;btn('mock').disabled=!!controller||!!mock||!m.wired;
   btn('unlock').disabled=completed()||!m.connected||m.count<3||!m.wired;
   get('shield').textContent=completed()?'방어막 해제 · '+title+(ids.includes(badges.teacher)?' (교사 확인)':''):'방어막 작동 · 실제 정상 측정 '+m.count+' / 3';
   d.classList.toggle('restored',completed());
 }
 function stop(){
   controller?.abort();if(mock)window.clearInterval(mock);mock=0;m.resetConnection();last=0;
   get('link').textContent='연결 안 됨';get('reading').textContent='온도 — °C · 습도 — %';refresh();
 }
 function changed(){
   stop();m.setWired(false);get('wiremsg').textContent='배선 검사 후 진행하세요.';
   const list=get('wires');list.replaceChildren();
   for(const pin of inputs)if(w[pin])list.append(controls(w[pin]+' → '+pin+' · 삭제',()=>{delete w[pin];changed()}));
   board?.update(w);refresh();
 }
 function choose(id:string){
   if(!selected||selected[0]===id[0])selected=selected===id?'':id;
   else{const [b,s]=id[0]==='B'?[id,selected]:[selected,id];w[s.slice(2) as SensorPin]=b.slice(2) as BoardPin;selected='';changed()}
   get('selected').textContent=selected?'선택한 핀: '+selected:'';
 }
 for(const [prefix,pins] of [['B',outputs],['S',inputs]] as const){const row=document.createElement('div');row.append(prefix==='B'?'KS5034 ':'DHT11 ');for(const pin of pins)row.append(controls(pin,()=>choose(prefix+':'+pin)));get('pins').append(row)}
 try{board=makeBoard(get('board'),choose)}catch{get('board').textContent='WebGL을 사용할 수 없습니다. 아래 핀 버튼으로 같은 회로를 연결하세요.'}
 get('profile').onchange=changed;get<HTMLInputElement>('safe').onchange=()=>{if(!get<HTMLInputElement>('safe').checked)stop();refresh()};
 btn('check').onclick=()=>{stop();const msg=wiringError(w,get<HTMLSelectElement>('profile').value as Profile);m.setWired(!msg);get('wiremsg').textContent=msg??'가상 회로 정상 · 실물 배선 확인과는 별개입니다.';refresh()};
 btn('mock').onclick=()=>{stop();let n=0;const tick=()=>{const v={temperature:24+(n++%3),humidity:55};m.receive('mock',v);get('link').textContent='Mock 연습 · 실제 측정 횟수에 포함되지 않습니다.';get('reading').textContent='Mock · '+v.temperature+' °C / '+v.humidity+' %'};tick();mock=window.setInterval(tick,2000);refresh()};
 btn('stop').onclick=stop;
 btn('connect').onclick=async()=>{
   stop();const c=new AbortController();controller=c;refresh();get('link').textContent='실제 USB · 장치 선택 대기';
   let end='실제 USB 연결이 종료됐습니다.';
   try{await readSerial(c.signal,()=>{m.connected=true;last=Date.now();get('link').textContent='실제 USB 연결 · 수신 대기';refresh()},v=>{
     last=Date.now();m.receive('serial',v);get('reading').textContent=v?'실제 USB · '+v.temperature+' °C / '+v.humidity+' %':'측정 실패 · 값 없음';get('link').textContent='실제 USB 연결';refresh();
   })}catch(e){end='연결 실패 · '+(e instanceof Error?e.message:String(e))}
   finally{controller=undefined;m.resetConnection();if(d.open){get('link').textContent=c.signal.aborted?'연결 해제':end;get('reading').textContent='온도 — °C · 습도 — %';refresh()}}
 };
 const timer=window.setInterval(()=>{if(m.connected&&Date.now()-last>5500){m.receive('serial',null);get('link').textContent='실제 USB · 수신 시간 초과';get('reading').textContent='측정값 없음';refresh()}},500);
 btn('unlock').onclick=()=>{
   if(!m.answer(get<HTMLSelectElement>('answer').value)){get('result').textContent='측정 3회와 입력·처리·출력 순서를 확인하세요.';return}
   if(recordTitle(ids,m.cleared)){
     if(!save()){ids.pop();get('result').textContent='저장 실패 · 다시 시도하세요.';refresh();return}
     stop();get('result').textContent='관측소 복구! 칭호 획득: '+title;
   }refresh();
 };
 btn('exit').onclick=()=>d.close();d.addEventListener('close',()=>{stop();clearInterval(timer);board?.dispose();d.remove();done()},{once:true});changed();refresh();
}
