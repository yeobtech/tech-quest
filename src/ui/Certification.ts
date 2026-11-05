import {certificationAreas,newEvidence,sameEvidence,type PracticalEvidence} from '../education/certificationData';
import {recordPractical,certificationStatus} from '../education/certification';
import {helperResource} from '../education/teacherReview';
import type {Progress} from '../systems/ProgressionSystem';
import './learning.css';
export function openCertification(p:Progress,save:(p:Progress)=>boolean,done:()=>void){
 if(!p.stage1.bossCleared){done();return}
 const d=document.createElement('dialog');d.className='workshop learning certification';d.setAttribute('aria-label','디지털 기술자 실습 인증');
 d.innerHTML='<h2>디지털 기술자 실습 인증</h2><p>오류 바이러스 격파 후에는 실제 조작 능력을 확인합니다. 아래 체크는 학생 자기 점검이며 교사 승인이 아닙니다. 스테이지 2 입장 권한은 이미 획득했으며 인증 여부와 별도로 유지됩니다.</p><p data-state></p><p>교사 인증 서버 미연결: 제출은 이 브라우저에만 저장됩니다. 결과 파일을 교사에게 직접 제출하고 대면 확인을 받으세요. 비밀번호 등 개인정보는 기록하지 마세요.</p><section data-areas></section><section data-reflection></section><p role="status" aria-live="polite"></p><button data-save>임시 저장</button> <button data-submit>활동 결과 제출</button> <button data-export>제출 결과 내보내기</button> <button data-close>닫기</button>';
 const status=d.querySelector<HTMLElement>('[role=status]')!;
 const inputs=new Map<string,HTMLTextAreaElement>(),checks=new Map<string,HTMLInputElement>();
 function text(parent:Element,key:string,title:string,value:string,max:number){const label=document.createElement('label');label.textContent=title;const input=document.createElement('textarea');input.rows=3;input.maxLength=max;input.value=value;label.append(input);parent.append(label);inputs.set(key,input)}
 for(const a of certificationAreas){
  const section=document.createElement('fieldset'),legend=document.createElement('legend'),guide=document.createElement('p');legend.textContent=a.title;guide.textContent=a.guide;section.append(legend,guide);
  for(const [id,title] of a.items){const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=p.certification.draft.areas[a.id].checked.includes(id);label.append(box,document.createTextNode(' '+title+' · 자기 점검'));label.style.display='block';section.append(label);checks.set(a.id+':'+id,box)}
  text(section,a.id,'수행 결과 · 확인한 내용과 실제 작업 경로/단자 역할 (10자 이상)',p.certification.draft.areas[a.id].result,2000);
  if(a.id==='troubleshooting'){const link=document.createElement('a');link.href=helperResource.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Surface Go 3 Helper 열기 (새 창)';section.append(link)}
  d.querySelector('[data-areas]')!.append(section);
 }
 for(const [key,title] of [['problem','겪은 문제 (없었다면 없었음과 확인한 점)'],['solution','해결 방법 · 원인 추정과 해결 순서'],['improvement','개선한 내용 · 다음에 더 잘할 점']] as const)text(d.querySelector('[data-reflection]')!,key,title,p.certification.draft[key],1000);
 function collect():PracticalEvidence{const e=newEvidence();for(const a of certificationAreas){e.areas[a.id]={checked:a.items.filter(([id])=>checks.get(a.id+':'+id)!.checked).map(([id])=>id),result:inputs.get(a.id)!.value}}for(const key of ['problem','solution','improvement'] as const)e[key]=inputs.get(key)!.value;return e}
 function refresh(){
  const c=p.certification,state=certificationStatus(p);
  d.querySelector('[data-state]')!.textContent='최종 인증: '+(state==='certified'?'교사 검증 완료 (제출본 기준)':state==='reverify'?'확인 이력 있음 · 서버 재검증 대기':'미완료')+' / '+(c.submission?`제출 ${c.submission.revision}차 · ${c.submission.submittedAt} · ${state==='certified'?'확인된 제출본':'교사 확인 대기 (직접 전달 필요)'}`:'아직 제출하지 않음')+(c.submission&&!sameEvidence(c.draft,c.submission.evidence)?' / 제출 이후 수정한 임시 저장본 있음':'');
  d.querySelector<HTMLButtonElement>('[data-submit]')!.textContent=c.submission?'활동 결과 재제출':'활동 결과 제출';d.querySelector<HTMLButtonElement>('[data-export]')!.disabled=!c.submission;
 }
 function persist(submit:boolean){const result=recordPractical(p,collect(),submit,save);status.textContent=result==='failed'?'저장 실패 · 이전 저장과 제출본은 유지됩니다. 입력 내용을 유지한 채 다시 시도하세요.':result==='incomplete'?'모든 자기 점검 항목을 확인하고 영역별 결과는 10자 이상, 문제·해결·개선은 각각 2자 이상 작성하세요.':result==='submitted'?'이 기기에 제출본을 저장했습니다. 내보낸 파일을 교사에게 직접 전달하세요. 자동 승인되지 않습니다.':result==='unchanged'?'이미 제출한 내용과 같아 제출 번호를 늘리지 않았습니다.':result==='saved'?'임시 저장 완료 · 최종 제출과 별개입니다.':'보스 클리어 후 이용할 수 있습니다.';refresh()}
 d.querySelector<HTMLButtonElement>('[data-save]')!.onclick=()=>persist(false);d.querySelector<HTMLButtonElement>('[data-submit]')!.onclick=()=>persist(true);
 d.querySelector<HTMLButtonElement>('[data-export]')!.onclick=()=>{const s=p.certification.submission;if(!s)return;const blob=new Blob([JSON.stringify({type:'TECH_QUEST_PRACTICAL_STUDENT_REPORT',notice:'학생이 작성한 제출본입니다. 교사 승인이나 인증서가 아닙니다.',submission:s},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`TECH_QUEST-practical-${s.revision}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='제출본 파일을 저장했습니다. 수정 중인 미제출 내용은 포함되지 않습니다.'};
 function close(){if(!sameEvidence(collect(),p.certification.draft)&&!window.confirm('아직 저장하지 않은 변경이 있습니다. 저장하지 않고 닫을까요?'))return;d.close()}
 d.querySelector<HTMLButtonElement>('[data-close]')!.onclick=close;d.oncancel=e=>{e.preventDefault();close()};d.onclose=()=>{d.remove();done()};document.body.append(d);refresh();d.showModal();
}
