import {craft,craftStatus,recipes,ingredients} from '../data/recipes';
import {materials} from '../data/materials';
import {catalog} from '../data/shop';
import type {Progress} from '../systems/ProgressionSystem';

export function openCrafting(p:Progress,save:(next:Progress)=>boolean,done:()=>void){
  const d=document.createElement('dialog');d.className='workshop';d.setAttribute('aria-label','제작 작업대');
  d.innerHTML='<small>기술자 마을 · 꾸미기</small><h2>제작 작업대</h2><section></section><p role="status"></p><button data-close>닫기 · E</button>';
  const area=d.querySelector('section')!,status=d.querySelector('[role=status]')!;
  function render(){
    area.replaceChildren();
    for(const r of recipes){
      const item=catalog.find(i=>i.id===r.result)!;
      const title=document.createElement('h3');title.textContent=item.name;area.append(title);
      for(const [id,n] of ingredients(r)){
        const line=document.createElement('p');line.textContent=materials[id].icon+' '+materials[id].name+' · 보유 '+(p.inventory[id]??0)+' / 필요 '+n;area.append(line);
      }
      const btn=document.createElement('button'),state=craftStatus(p,r);
      btn.textContent=state==='owned'?'제작 완료':state==='missing'?'재료 부족':'제작하기';btn.disabled=state!=='ready';
      btn.onclick=()=>{const result=craft(p,r,save);status.textContent=result==='crafted'?item.name+' 제작 완료! 작업복 가게에서 장착하세요.':result==='failed'?'저장 실패 · 재료가 보존되었습니다. 다시 시도하세요.':'';render()};
      area.append(btn);
    }
  }
  d.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>d.close();
  const close=(e:KeyboardEvent)=>{if(e.code==='KeyE'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)d.close()}};
  window.addEventListener('keydown',close,true);d.onclose=()=>{window.removeEventListener('keydown',close,true);d.remove();done()};
  render();document.body.append(d);d.showModal();
}
