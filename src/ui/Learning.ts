import {openStage2Practice} from './Stage2Practice';
import {openCertification} from './Certification';
import {helperResource} from '../education/teacherReview';
import {lessons,shuffle} from '../education/stage1Data';
import {study,questionKnown,learningLevel,lessonDone,knowledgeDone,bossReady} from '../education/stage1';
import type {Progress} from '../systems/ProgressionSystem';
import './learning.css';
export function openLearning(p:Progress,save:(p:Progress)=>boolean,done:()=>void,boss?:()=>void,questLevel?:number){
 const d=document.createElement('dialog');d.className='workshop learning';d.setAttribute('aria-label','디지털 기술자 훈련소');
 let level=questLevel??learningLevel(p.stage1);
 d.innerHTML='<h2>스테이지 1 · 디지털 기술자 훈련소</h2><p data-summary></p><nav aria-label="학습 미션 목록"></nav><section data-content></section><p role="status" aria-live="polite"></p><button data-close>교관으로 돌아가기</button>';
 const area=d.querySelector<HTMLElement>('[data-content]')!,status=d.querySelector<HTMLElement>('[role=status]')!;
 const button=(parent:Element,text:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;parent.append(b);return b};
 function render(){
  const s=p.stage1,l=lessons[level-1];
  d.querySelector('h2')!.textContent=`Lv.${level} · ${l.title}`;
  d.querySelector('[data-summary]')!.textContent='문제 2개를 풀고, 직접 해 본 내용을 적어 주세요.';
  const nav=d.querySelector('nav')!;nav.replaceChildren();nav.hidden=questLevel!==undefined;if(questLevel===undefined)for(const item of lessons){const b=button(nav,`Lv.${item.level} ${item.title} ${lessonDone(s,item.level)?'✓ 기록 있음':''}`,()=>{level=item.level;status.textContent='';render()});b.disabled=item.level>learningLevel(s);b.setAttribute('aria-current',String(level===item.level))}
    area.replaceChildren();
  if(questLevel===undefined)button(area,'전자 부품 개념 연습',openStage2Practice);
  if(s.bossCleared&&questLevel===undefined)button(area,'교사에게 보여 줄 실습 기록',()=>openCertification(p,save,()=>{}));
  if(!s.accepted){button(area,'교관 미션 수락',()=>{status.textContent=study(p,{kind:'accept'},save)==='saved'?'미션을 수락했습니다.':'저장 실패 · 다시 시도하세요.';render()});return}
  const h=document.createElement('h3');h.textContent=`학습 Lv.${level} · ${l.title}`;area.append(h);
    if(level>=5&&level<=7){const link=document.createElement('a');link.href=helperResource.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Surface Go 3 Helper · 증상별 단계 안내 (새 창)';area.append(link);const safe=document.createElement('p');safe.textContent='증상 분류: '+helperResource.categories.join(', ')+'. 도움말은 읽기·원인 추정에 활용하세요. 초기화·삭제·시스템 설정 변경은 실행하지 말고 교사에게 요청하세요.';area.append(safe)}
  const text=document.createElement('p');text.textContent=l.content;area.append(text);
  for(const [i,q] of l.questions.entries()){
   const field=document.createElement('fieldset'),legend=document.createElement('legend'),feedback=document.createElement('p');legend.textContent=`문제 ${i+1}/2 · ${q.kind==='concept'?'개념':'상황 적용'} · ${q.prompt}`;field.append(legend);feedback.setAttribute('role','status');
   const solved=questionKnown(s,q.id);for(const c of shuffle(q.choices))button(field,c.text,()=>{
    const result=study(p,{kind:'answer',id:q.id,choice:c.id},save);
    if(result==='saved'){render();status.textContent='정답 · '+q.explanation}else feedback.textContent=result==='wrong'?q.wrongFeedback:'저장 실패 · 다시 시도하세요.';
   }).disabled=solved;
   feedback.textContent=solved?(s.examCredits.includes(q.id)?'✓ 승급 시험에서 확인한 개념 · ':'✓ 정답 · ')+q.explanation:'';field.append(feedback);area.append(field);
  }
  const activity=document.createElement('p');activity.textContent='실제 수행 활동 (객관식과 별도): '+l.activity;area.append(activity);
  const note=document.createElement('p');note.textContent='해 본 결과를 10자 이상 적어 주세요. 기록은 이 기기에 저장되며, 선생님 확인은 따로 받아야 해요.';area.append(note);
  const label=document.createElement('label');label.textContent='수행 결과 설명';const input=document.createElement('textarea');input.maxLength=2000;input.rows=3;input.value=s.activities[level]?.text??'';label.append(input);area.append(label);
  button(area,'수행 결과 제출',()=>{const r=study(p,{kind:'submit',level,text:input.value},save);status.textContent=r==='saved'?'이 기기에 결과 제출 완료 · 교사에게 전송되지 않았습니다. 다음 학습을 선택하세요.':r==='failed'?'저장 실패 · 변경되지 않았습니다.':'두 문제를 풀고 수행 결과를 10자 이상 작성하세요.';render()}).disabled=!knowledgeDone(s,level);
  if(s.activities[level]){const info=document.createElement('p');info.textContent=s.activities[level].review?.verification==='verified'?'외부 교사 확인됨 · 게임 진행과 별도 기록':s.activities[level].review?'교사 확인 이력 보관 · 서버 재검증 대기':'이 기기에 결과 저장됨 · 교사 미검증';area.append(info)}
    button(area,'수행 결과 내보내기',()=>{
    const blob=new Blob([JSON.stringify({stage:'디지털 기술자 훈련소',note:'학생 제출 결과이며 실제 수행 인증이나 성적이 아닙니다.',solved:s.solved,examCredits:s.examCredits,activities:s.activities},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='TECH_QUEST-stage1-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='결과 파일을 저장했습니다. 교사가 안내한 제출 장소에 직접 제출하세요. 이름·비밀번호 등 개인정보는 넣지 마세요.';
  });
  if(bossReady(s)&&boss)button(area,s.bossCleared?'오류 바이러스 재도전':'오류 바이러스 도전',()=>{d.addEventListener('close',boss,{once:true});d.close()});
 }
 d.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>d.close();d.onclose=()=>{d.remove();done()};document.body.append(d);render();d.showModal();
}
