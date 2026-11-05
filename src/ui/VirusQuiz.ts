import {shuffle} from '../education/stage1Data';
import {coreQuestions,bonusQuestion,type VirusChallenge} from '../education/virus';
import './learning.css';
export function openVirusQuiz(challenge:VirusChallenge,now:()=>number,done:()=>void){
 const d=document.createElement('dialog');d.className='workshop learning';d.setAttribute('aria-label','오류 바이러스 복구 퀴즈');
 const heading=document.createElement('h2');heading.textContent='시스템 복구 · 전투 일시 정지';d.append(heading);
 const area=document.createElement('section'),status=document.createElement('p');status.setAttribute('role','status');d.append(area,status);
 function render(){
  area.replaceChildren();const q=coreQuestions.find(q=>!challenge.solved.has(q.id))??(!challenge.bonusAttempted?bonusQuestion:undefined);
  if(!q){status.textContent='방어막 해제 · 복귀하여 Z로 공격하세요. 보너스 효과는 전투 시간으로 20초 유지됩니다.';return}
  const h=document.createElement('h3');h.textContent=(q===bonusQuestion?'선택 보너스 · 한 번의 기회 (틀려도 기본 공격력 유지)':'핵심 문제 '+(challenge.solved.size+1)+'/'+coreQuestions.length)+' · '+q.prompt;area.append(h);
  for(const c of shuffle(q.choices)){const b=document.createElement('button');b.textContent=c.text;b.onclick=()=>{const correct=challenge.answer(q.id,c.id,now());status.textContent=correct?'정답 · '+q.explanation:q.wrongFeedback;area.querySelectorAll('button').forEach(b=>b.disabled=true);const next=document.createElement('button');next.textContent=correct?'다음':'계속 / 재도전';next.onclick=render;area.append(next)};area.append(b)}
 }
 const close=document.createElement('button');close.textContent='전투로 복귀';close.onclick=()=>d.close();d.append(close);d.onclose=()=>{d.remove();done()};document.body.append(d);render();d.showModal();
}
