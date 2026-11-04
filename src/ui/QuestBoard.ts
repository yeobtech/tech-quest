import {quests,achievements,earned,count,ready,type Quest} from '../data/quests';
import {ProgressionSystem,type Progress} from '../systems/ProgressionSystem';

export function openQuests(progress:ProgressionSystem, board:boolean, save:(p:Progress)=>boolean, done:()=>void){
  const d=document.createElement('dialog');d.className='workshop';d.setAttribute('aria-label','퀘스트와 업적');
  d.innerHTML='<h2>퀘스트 게시판</h2><p></p><section></section><h3>업적 · 획득 칭호</h3><ul></ul><p role="status"></p><button>닫기 · Q</button>';
  d.querySelector('p')!.textContent=board?'마을 의뢰를 선택하세요.':'새 의뢰는 기술자 마을 게시판에서 수락하세요.';
  const status=d.querySelector('[role=status]')!;
  function act(q:Quest){
    const result=progress.questAction(q,board,save);
    status.textContent=result==='failed'?'저장 실패 · 다시 시도하세요.':result==='claimed'?'보상 수령 · EXP +'+q.exp+' · 골드 +'+q.gold:result==='accepted'?(ready(progress.state,q)?'목표 달성 · 보상을 수령하세요.':'퀘스트를 수락했습니다.'):'';
    render();
  }
  function render(){
    const p=progress.state,area=d.querySelector('section')!;area.replaceChildren();
    for(const q of quests){
      const state=p.journal[q.id],canClaim=ready(p,q);
      const row=document.createElement('p'),button=document.createElement('button');
      row.textContent=q.name+' · '+count(p,q)+'/'+q.target+' · EXP '+q.exp+' / '+q.gold+'G ';
      button.textContent=state==='claimed'?'보상 수령 완료':canClaim?'완료 가능 · 보상 수령':state===undefined?'수락 가능':'진행 중';
      button.disabled=!canClaim && !(board&&state===undefined);button.onclick=()=>act(q);row.append(button);area.append(row);
    }
    const list=d.querySelector('ul')!;list.replaceChildren();
    for(const a of achievements){
      const li=document.createElement('li');li.textContent=a.name+' · '+(earned(p).includes(a.id)?'달성 · 칭호 「'+a.title+'」':'미달성');list.append(li);
    }
  }
  d.querySelector<HTMLButtonElement>(':scope > button')!.onclick=()=>d.close();
  const closeKey=(e:KeyboardEvent)=>{if(e.code==='KeyQ'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();d.close()}};
  window.addEventListener('keydown',closeKey,true);
  d.onclose=()=>{window.removeEventListener('keydown',closeKey,true);d.remove();done()};render();document.body.append(d);d.showModal();
}
