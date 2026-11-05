import {stage2Bank} from '../education/stage2Data';
import {shuffle} from '../education/stage1Data';
export function openStage2Practice(){
 const d=document.createElement('dialog');d.className='workshop learning';d.setAttribute('aria-label','스테이지 2 자유 학습');
 d.innerHTML='<h2>스테이지 2 · 개념 연습</h2><p>게임 레벨·EXP 없이 모든 내용을 연습할 수 있습니다. 연습은 승급 시험 정답 기록이나 실제 배선·장치 조작 인증에 반영되지 않습니다.</p><label>학습 단계 <select></select></label><section></section><button data-close>학습으로 돌아가기</button>';
 const select=d.querySelector('select')!,area=d.querySelector('section')!;
 for(let i=11;i<=20;i++){const option=document.createElement('option');option.value=String(i);option.textContent=`학습 Lv.${i}`;select.append(option)}
 function render(){area.replaceChildren();for(const q of stage2Bank.filter(q=>q.level===Number(select.value))){
 const f=document.createElement('fieldset'),legend=document.createElement('legend'),feedback=document.createElement('p');legend.textContent=q.prompt;feedback.setAttribute('role','status');f.append(legend);
 for(const c of shuffle(q.choices)){const b=document.createElement('button');b.textContent=c.text;b.onclick=()=>{feedback.textContent=c.id===q.answer?'정답 · '+q.explanation:q.wrongFeedback};f.append(b)}f.append(feedback);area.append(f);
 }}
 select.onchange=render;d.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>d.close();d.onclose=()=>d.remove();document.body.append(d);render();d.showModal();
}
