import type {Progress} from '../systems/ProgressionSystem';
import {makeBoard} from '../observatory/board';
import {labAction,labStatus,recordWiring,recordMeasurement,recordFields,findingRoles,jumperTasks,exportPractical2,type MissionLevel,type Finding,type LabNotes} from '../education/practical2';
import './learning.css';
import {practicalTitles as titles} from '../education/questMenu';
export function openPractical2(p:Progress,save:(p:Progress)=>boolean,questLevel?:MissionLevel,done=()=>{}){
 const d=document.createElement('dialog');d.className='workshop learning';d.setAttribute('aria-label','스테이지 2 실제 수행');
 d.innerHTML='<h2>보드 실습 퀘스트</h2><p>실습한 뒤 기록을 남겨 주세요. 선생님 확인은 따로 받아요.</p><nav></nav><section data-activity></section><details><summary>실습 기록 쓰기</summary><section data-notes></section></details><p role="status" aria-live="polite"></p><button data-export>기록 파일 내려받기</button> <button data-close>퀘스트 목록으로</button>';
 const area=d.querySelector<HTMLElement>('[data-activity]')!,notes=d.querySelector<HTMLElement>('[data-notes]')!,status=d.querySelector<HTMLElement>('[role=status]')!;
 let level:MissionLevel=questLevel??11,summary:HTMLElement|undefined;
 const updateSummary=()=>{if(summary)summary.textContent=`Lv.${level} · ${titles[level]} — ${labStatus(p,level)}`};
 const button=(parent:Element,text:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;parent.append(b);return b};
 const text=(parent:Element,value:string)=>{const e=document.createElement('p');e.textContent=value;parent.append(e);return e};
 const fields={} as Record<keyof LabNotes,HTMLTextAreaElement>;
 const draft=()=>Object.fromEntries(Object.keys(recordFields).map(k=>[k,fields[k as keyof LabNotes].value])) as LabNotes;
 function saveDraft(){const r=labAction(p,level,{kind:'notes',notes:draft(),submit:false},save);status.textContent=r==='saved'?'초안 저장 완료':'저장 실패 · 입력은 화면에 남아 있습니다.';if(r==='saved')updateSummary();return r==='saved'}
 function render(){
  area.replaceChildren();notes.replaceChildren();const r=p.practical2[level];summary=text(area,'');updateSummary();
  d.querySelector('h2')!.textContent=`Lv.${level} · ${titles[level]}`;
  if(level===11){
   text(area,'보드에서 USB PROG, USB OTG, GPIO, 3V3, GND를 찾아 눌러 보세요. 각 단자가 하는 일을 적으면 돼요.');
   text(area,'확인한 단자: '+Object.keys(r.findings).join(', '));
   button(area,'3D 보드 탐험 열기',()=>{
    if(!saveDraft())return;
    const panel=document.createElement('dialog');panel.className='workshop learning';panel.style.width='min(1300px,97vw)';panel.innerHTML='<h2>KS5034 주요 단자 찾기</h2><div data-view style="height:55dvh;min-height:280px"></div><p data-selected>3D 모델에서 단자를 선택하세요.</p><label>선택한 단자의 역할 설명<textarea rows="2" maxlength="2000"></textarea></label><button data-record>설명 저장</button> <button data-close>실습 기록으로 복귀</button><p role="status"></p>';
    let selected:Finding|undefined;const label=panel.querySelector<HTMLElement>('[data-selected]')!,feedback=panel.querySelector<HTMLElement>('[role=status]')!,input=panel.querySelector('textarea')!;
    const host=panel.querySelector<HTMLElement>('[data-view]')!;
    const board=makeBoard(host,()=>{},(key,name)=>{selected=key?key as Finding:undefined;label.textContent=selected?name+' · '+findingRoles[selected]:name+' · 학습 대상 단자를 선택하세요.';input.value=selected?p.practical2[11].findings[selected]??'':''},'explore');
    const frame=host.querySelector('iframe')!;frame.style.cssText='width:100%;height:100%;border:0';
    panel.querySelector<HTMLButtonElement>('[data-record]')!.onclick=()=>{if(!selected){feedback.textContent='먼저 모델의 단자를 선택하세요.';return}const result=labAction(p,11,{kind:'finding',key:selected,explanation:input.value},save);feedback.textContent=result==='saved'?'선택·설명 저장 완료 · 설명의 정확성과 실물 수행은 교사가 확인합니다.':result==='failed'?'저장 실패':'역할 설명을 2자 이상 작성하세요.'};
    panel.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>panel.close();panel.onclose=()=>{board.dispose();panel.remove();render()};document.body.append(panel);panel.showModal();
   });
  }
  if(level===12){
   text(area,'수 단자는 돌출 핀, 암 단자는 핀을 받는 소켓입니다. 실물은 전원을 분리하고 관찰하세요. 아래 활동은 가상 선택 연습입니다.');
   for(const q of jumperTasks){const f=document.createElement('fieldset');text(f,q.prompt);const feedback=text(f,r.jumpers.includes(q.id)?'✓ 확인됨':'');for(const answer of q.choices)button(f,answer,()=>{const result=labAction(p,12,{kind:'jumper',id:q.id,answer},save);feedback.textContent=result==='saved'?'✓ 정답 · '+q.hint:result==='wrong'?'다시 시도하세요. '+q.hint:'저장 실패';if(result==='saved'){f.querySelectorAll('button').forEach(b=>b.disabled=true);updateSummary()}}).disabled=r.jumpers.includes(q.id);area.append(f)}
  }
  if(level===13){
   text(area,'센서와 보드를 선 3개로 연결해요. 점선을 따라 연결하고 검사 버튼을 누르세요.');
   if(r.wiring)text(area,'마지막 정상 배선 기록: VCC → 3V3, DATA → GPIO21, GND → GND. 다시 입장하면 빈 회로에서 재연습합니다.');
   button(area,'배선 연습 시작',async()=>{
    if(!saveDraft())return;try{const {openStation}=await import('../observatory/station');if(d.open)openStation([],()=>false,()=>render(),{mode:'wiring',onWiring:(w,profile,other)=>recordWiring(p,w,profile,other,save)})}catch{status.textContent='배선 실습을 열지 못했습니다. 다시 시도하세요.'}
   });
  }
  if(level===14){
   text(area,'① 데이터 전송이 되는 USB 케이블로 보드의 USB PROG와 컴퓨터를 연결해요. 장치 관리자에서 COM 번호를 찾으세요.');
   text(area,'② 선생님과 기존 프로그램을 백업해요. 새 프로그램을 넣으면 보드의 기존 프로그램이 바뀌어요.');
   text(area,'③ 전원을 뺀 상태에서 센서의 DATA→GPIO21, VCC→3V3, GND→GND를 확인해요. 선생님과 함께 측정 프로그램을 넣으세요.');
   text(area,'④ 온도와 습도가 나오는지 확인하고, 브라우저 연결 전에 시리얼 모니터를 닫으세요. 결과는 아래 실습 기록에 적어요.');
   const help=document.createElement('details');help.innerHTML='<summary>선생님과 함께 보는 프로그램 설정</summary><p>별도 예제: firmware/observatory_dht11 · DATA_PIN=21 · DHT11 3핀 3.3V.</p><p>예제 폴더에서 pio run으로 확인한 뒤, 교사 확인 후 pio run -t upload --upload-port COM번호로 올립니다. COM 번호는 컴퓨터마다 달라요. 기존 프로젝트 설정은 덮어쓰지 마세요.</p><p>시리얼 모니터 속도: 115200 baud. DATA=GPIO21, 2초 간격 JSON, valid:true/false를 확인하세요. 업로드 성공과 센서 측정 성공은 서로 달라요.</p>';area.append(help);
  }
  if(level===15){
   text(area,'배선을 검사한 뒤 실제 USB 연결을 눌러요. 온도와 습도를 2초 간격으로 3번 읽으면 돼요. 모의 데이터는 횟수에 들어가지 않아요.');
   if(r.measurement)for(const v of r.measurement.samples)text(area,`저장된 USB 측정 기록 · ${new Date(v.at).toLocaleString('ko-KR')} · ${v.temperature} °C / ${v.humidity} %`);
   button(area,'관측소 · 실제 온습도 수신',async()=>{
    if(!saveDraft())return;try{const {openStation}=await import('../observatory/station');if(d.open)openStation([],()=>false,()=>render(),{mode:'measurement',onWiring:(w,profile,other)=>recordWiring(p,w,profile,other,save),onMeasurement:run=>recordMeasurement(p,run,save)})}catch{status.textContent='관측소를 열지 못했습니다. 다시 시도하세요.'}
   });
  }
  text(notes,'실습 기록 · 문제가 없었다면 “문제 없음”과 점검 결과를 적으세요. 비밀번호 등 개인정보는 기록하지 마세요.');
  for(const [key,title] of Object.entries(recordFields)){const label=document.createElement('label');label.textContent=title;const input=document.createElement('textarea');input.rows=2;input.maxLength=2000;input.value=r.draft[key as keyof LabNotes];fields[key as keyof LabNotes]=input;label.append(input);notes.append(label)}
  button(notes,'초안 저장',saveDraft);
  button(notes,'결과 제출 / 재제출 · 교사 확인 대기',()=>{const result=labAction(p,level,{kind:'notes',notes:draft(),submit:true},save);status.textContent=result==='saved'?'이 기기에 제출본 저장 · 교사에게 자동 전송되지 않았습니다. 결과 파일을 지정 장소에 제출하세요.':result==='incomplete'?'여섯 항목을 각각 2자 이상 작성하세요.':'저장 실패';if(result==='saved')updateSummary();});
 }
 d.querySelector('nav')!.hidden=questLevel!==undefined;
 if(questLevel===undefined)for(const l of [11,12,13,14,15] as MissionLevel[])button(d.querySelector('nav')!,`Lv.${l} ${titles[l]}`,()=>{if(saveDraft()){level=l;render()}});
 d.querySelector<HTMLButtonElement>('[data-export]')!.onclick=()=>{if(!saveDraft())return;const url=URL.createObjectURL(new Blob([JSON.stringify(exportPractical2(p),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='TECH_QUEST-stage2-practical.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='로컬 기록 내보내기 완료 · 공식 인증서가 아닙니다.'};
 d.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>{if(saveDraft())d.close()};d.oncancel=e=>{e.preventDefault();if(saveDraft())d.close()};d.onclose=()=>{d.remove();done()};document.body.append(d);render();d.showModal();
}
