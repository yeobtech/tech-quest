import {examLesson,examQuestions,beginExam,takeExam,type ExamResult} from '../education/promotion';
import {shuffle} from '../education/stage1Data';
import {requiredExp} from '../data/config';
import type {Progress} from '../systems/ProgressionSystem';
import './learning.css';
export function openPromotion(p:Progress,save:(p:Progress)=>boolean,done:()=>void,promoted:()=>void){
 const level=p.level,lesson=examLesson(level),ready=beginExam(p,save),questions=examQuestions(p),d=document.createElement('dialog');
 d.className='workshop learning';d.setAttribute('aria-label','승급 시험');
 d.innerHTML='<h2></h2><p data-info></p><section data-questions></section><p role="status" aria-live="polite"></p><button data-abandon>시험 포기</button> <button data-close>잠시 닫기 · 진행 유지</button>';
 d.querySelector('h2')!.textContent=`승급 시험 · 게임 Lv.${level} → ${level+1}`;
 d.querySelector('[data-info]')!.textContent=`${level>=11&&level<=20?`학습 Lv.${level} · 신규 2문제 + 누적 복습 2문제`:`학습 Lv.${lesson.level} · ${lesson.title}${level>20?' (순환 복습)':''}`}. ${questions.length}문제 모두 맞히면 승급합니다. 오답·닫기·새로고침은 EXP를 소모하지 않습니다. 합격 시 ${requiredExp(level)} EXP만 사용하고 초과분은 보관합니다.`;
 const area=d.querySelector('[data-questions]')!,status=d.querySelector<HTMLElement>('[role=status]')!,abandon=d.querySelector<HTMLButtonElement>('[data-abandon]')!;
 let finished=false;
 const resultText=(r:ExamResult)=>r==='failed'?'저장 실패 · EXP와 정답 기록은 변경되지 않았습니다. 다시 시도하세요.':r==='blocked'?'시험 상태가 변경되었습니다. 창을 닫고 다시 확인하세요.':'';
 function render(){
  area.replaceChildren();
  for(const [i,q] of questions.entries()){
   const field=document.createElement('fieldset'),legend=document.createElement('legend'),feedback=document.createElement('p');
   legend.textContent=`문제 ${i+1}/${questions.length} · ${level>=11&&level<=20?(q.level===level?'신규':'복습')+` Lv.${q.level} · `:''}${q.prompt}`;field.append(legend);feedback.setAttribute('role','status');
   const solved=finished||!!p.exam?.solved.includes(q.id);
   for(const c of shuffle(q.choices)){
    const b=document.createElement('button');b.textContent=c.text;b.disabled=solved||!ready;
    b.onclick=()=>{
     if(finished)return;
     const r=takeExam(p,{kind:'answer',level,id:q.id,choice:c.id},save);
     if(r==='wrong'){feedback.textContent=q.wrongFeedback+' EXP는 그대로입니다.';return}
     if(r==='failed'||r==='blocked'){status.textContent=resultText(r);return}
     if(r==='promoted'){finished=true;abandon.hidden=true;promoted()}
     render();status.textContent=r==='promoted'?`승급 성공! 게임 Lv.${p.level} · 남은 EXP ${p.exp}. 다음 시험은 창을 닫은 후 시작하세요.`:'정답 · '+q.explanation;
    };field.append(b);
   }
   feedback.textContent=solved?'✓ 정답 · '+q.explanation:'';field.append(feedback);area.append(field);
  }
 }
 abandon.onclick=()=>{
  if(finished)return;
  const confirm=document.createElement('dialog');confirm.className='workshop';confirm.setAttribute('aria-label','시험 포기 확인');
  const warning=document.createElement('p');warning.textContent=`정말 시험을 포기할까요? 현재 EXP ${p.exp} 전체(초과분 포함)와 이번 시험 정답 기록이 초기화됩니다. 게임 레벨·기존 학습 기록은 유지됩니다.`;
  const yes=document.createElement('button'),no=document.createElement('button');yes.textContent='포기 확정 · EXP 초기화';no.textContent='시험 계속하기';confirm.append(warning,yes,no);document.body.append(confirm);confirm.showModal();no.focus();
  no.onclick=()=>confirm.close();confirm.onclose=()=>confirm.remove();yes.onclick=()=>{
   yes.disabled=true;const r=takeExam(p,{kind:'abandon',level,confirmed:true},save);
   confirm.close();if(r==='abandoned'){finished=true;area.replaceChildren();abandon.hidden=true;status.textContent='시험을 포기했습니다. EXP 0으로 저장했습니다. 경험치를 모아 다시 도전하세요.'}else status.textContent=resultText(r);
  };
 };
 d.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>d.close();d.onclose=()=>{d.remove();done()};document.body.append(d);render();if(!ready){status.textContent='시험 준비 또는 저장 실패 · EXP는 유지됩니다. 닫고 다시 시도하세요. 문제가 계속되면 문제은행을 확인하세요.';abandon.disabled=true}d.showModal();
}
