import type {Progress} from '../systems/ProgressionSystem';
import {makeBoard} from '../observatory/board';
import {labAction,labStatus,recordFields,findingRoles,jumperTasks,exportPractical2,type MissionLevel,type Finding,type LabNotes} from '../education/practical2';
import './learning.css';
const titles:Record<MissionLevel,string>={11:'ESP32-S3 구조 탐험',12:'점퍼선과 회로 기초',13:'DHT11 가상 배선',14:'실물 장치 연결',15:'DHT11 온습도 측정'};
export function openPractical2(p:Progress,save:(p:Progress)=>boolean){
 const d=document.createElement('dialog');d.className='workshop learning';d.setAttribute('aria-label','스테이지 2 실제 수행');
 d.innerHTML='<h2>스테이지 2 · 실제 수행</h2><p>지식 시험·게임 EXP와 별도입니다. 가상 활동은 실물 인증이 아닙니다. 교사 인증 서버가 없어 공식 최종 완료를 표시하지 않습니다.</p><nav></nav><section data-activity></section><section data-notes></section><p role="status" aria-live="polite"></p><button data-export>전체 결과 파일 내보내기</button> <button data-close>교관으로 돌아가기</button>';
 const area=d.querySelector<HTMLElement>('[data-activity]')!,notes=d.querySelector<HTMLElement>('[data-notes]')!,status=d.querySelector<HTMLElement>('[role=status]')!;
 let level:MissionLevel=11;
 const button=(parent:Element,text:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;parent.append(b);return b};
 const text=(parent:Element,value:string)=>{const e=document.createElement('p');e.textContent=value;parent.append(e);return e};
 const fields={} as Record<keyof LabNotes,HTMLTextAreaElement>;
 const draft=()=>Object.fromEntries(Object.keys(recordFields).map(k=>[k,fields[k as keyof LabNotes].value])) as LabNotes;
 function saveDraft(){const r=labAction(p,level,{kind:'notes',notes:draft(),submit:false},save);status.textContent=r==='saved'?'초안 저장 완료':'저장 실패 · 입력은 화면에 남아 있습니다.';return r==='saved'}
 function render(){
  area.replaceChildren();notes.replaceChildren();const r=p.practical2[level];text(area,`Lv.${level} · ${titles[level]} — ${labStatus(p,level)}`);
  button(area,'미션 시작 / 이어서 하기',()=>{status.textContent=labAction(p,level,{kind:'start'},save)==='saved'?'진행 중으로 저장했습니다.':'저장 실패';});
  if(level===11){
   text(area,'기존 KS5034 3D 모델에서 USB PROG·USB OTG·GPIO·3V3·GND를 직접 선택하고 역할을 자신의 말로 기록하세요. 모델의 부품 높이는 교육용 근사치이며 실물 위치는 보드 표기를 확인하세요.');
   text(area,'확인한 단자: '+Object.keys(r.findings).join(', '));
   button(area,'3D 보드 탐험 열기',()=>{
    if(!saveDraft())return;
    const panel=document.createElement('dialog');panel.className='workshop learning';panel.style.width='min(1300px,97vw)';panel.innerHTML='<h2>KS5034 주요 단자 찾기</h2><div data-view style="height:55dvh;min-height:280px"></div><p data-selected>3D 모델에서 단자를 선택하세요.</p><label>선택한 단자의 역할 설명<textarea rows="2" maxlength="2000"></textarea></label><button data-record>설명 저장</button> <button data-close>실습 기록으로 복귀</button><p role="status"></p>';
    let selected:Finding|undefined;const label=panel.querySelector<HTMLElement>('[data-selected]')!,feedback=panel.querySelector<HTMLElement>('[role=status]')!,input=panel.querySelector('textarea')!;
    const host=panel.querySelector<HTMLElement>('[data-view]')!;
    const board=makeBoard(host,()=>{},(key,name)=>{selected=key as Finding;label.textContent=name+' · '+findingRoles[selected];input.value=p.practical2[11].findings[selected]??''},'explore');
    const frame=host.querySelector('iframe')!;frame.style.cssText='width:100%;height:100%;border:0';
    panel.querySelector<HTMLButtonElement>('[data-record]')!.onclick=()=>{if(!selected){feedback.textContent='먼저 모델의 단자를 선택하세요.';return}const result=labAction(p,11,{kind:'finding',key:selected,explanation:input.value},save);feedback.textContent=result==='saved'?'선택·설명 저장 완료 · 설명의 정확성과 실물 수행은 교사가 확인합니다.':result==='failed'?'저장 실패':'역할 설명을 2자 이상 작성하세요.'};
    panel.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>panel.close();panel.onclose=()=>{board.dispose();panel.remove();render()};document.body.append(panel);panel.showModal();
   });
  }
  if(level===12){
   text(area,'수 단자는 돌출 핀, 암 단자는 핀을 받는 소켓입니다. 실물은 전원을 분리하고 관찰하세요. 아래 활동은 가상 선택 연습입니다.');
   for(const q of jumperTasks){const f=document.createElement('fieldset');text(f,q.prompt);const feedback=text(f,r.jumpers.includes(q.id)?'✓ 확인됨':'');for(const answer of q.choices)button(f,answer,()=>{const result=labAction(p,12,{kind:'jumper',id:q.id,answer},save);feedback.textContent=result==='saved'?'✓ 정답 · '+q.hint:result==='wrong'?'다시 시도하세요. '+q.hint:'저장 실패';}).disabled=r.jumpers.includes(q.id);area.append(f)}
  }
  if(level>=13)text(area,'이 단계는 다음 구현 단계에서 연결됩니다. 실물 완료로 기록되지 않습니다.');
  text(notes,'실습 기록 · 문제가 없었다면 “문제 없음”과 점검 결과를 적으세요. 비밀번호 등 개인정보는 기록하지 마세요.');
  for(const [key,title] of Object.entries(recordFields)){const label=document.createElement('label');label.textContent=title;const input=document.createElement('textarea');input.rows=2;input.maxLength=2000;input.value=r.draft[key as keyof LabNotes];fields[key as keyof LabNotes]=input;label.append(input);notes.append(label)}
  button(notes,'초안 저장',saveDraft);
  button(notes,'결과 제출 / 재제출 · 교사 확인 대기',()=>{const result=labAction(p,level,{kind:'notes',notes:draft(),submit:true},save);status.textContent=result==='saved'?'이 기기에 제출본 저장 · 교사에게 자동 전송되지 않았습니다. 결과 파일을 지정 장소에 제출하세요.':result==='incomplete'?'여섯 항목을 각각 2자 이상 작성하세요.':'저장 실패';});
 }
 for(const l of [11,12] as MissionLevel[])button(d.querySelector('nav')!,`Lv.${l} ${titles[l]}`,()=>{if(saveDraft()){level=l;render()}});
 d.querySelector<HTMLButtonElement>('[data-export]')!.onclick=()=>{if(!saveDraft())return;const url=URL.createObjectURL(new Blob([JSON.stringify(exportPractical2(p),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='TECH_QUEST-stage2-practical.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='로컬 기록 내보내기 완료 · 공식 인증서가 아닙니다.'};
 d.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>{if(saveDraft())d.close()};d.oncancel=e=>{e.preventDefault();if(saveDraft())d.close()};d.onclose=()=>d.remove();document.body.append(d);render();d.showModal();
}
