import {catalog, purchase, equip, type Wardrobe} from '../data/shop';
import type { Progress } from '../systems/ProgressionSystem';
import './shop.css';
import type { ActiveTool } from '../data/tools';

export function openShop(state:Progress, save:()=>boolean, apply:()=>void,
preview:(look:Wardrobe['equipped'],action?:'idle'|'attack',tool?:ActiveTool)=>HTMLCanvasElement, done:()=>void) {
  const panel=document.createElement('dialog');
  panel.className='workshop clothing-shop'; panel.setAttribute('aria-labelledby','shop-title');
  panel.innerHTML='<small>기술자 마을 · OUTFITTER</small><h2 id="shop-title">작업복 가게</h2><div class="fitting"><div data-model></div><div><b data-gold></b><p>장착한 모습 · 스킨은 성능에 영향을 주지 않습니다.</p></div></div><div class="shelves"></div><p role="status"></p><button data-close>가게 나가기 · E</button>';
  const shelves=panel.querySelector<HTMLElement>('.shelves')!, status=panel.querySelector('[role=status]')!;
  function render() {
    const w=state.wardrobe;
    panel.querySelector('[data-gold]')!.textContent='보유 골드 · '+state.gold+' G';
    panel.querySelector('[data-model]')!.replaceChildren(preview(w.equipped,'idle',state.tool));
    shelves.replaceChildren();
    for(const item of catalog){
      const owned=w.owned.includes(item.id), worn=w.equipped[item.slot]===item.id && (!item.tool || state.tool===item.tool);
      if(item.crafted && !owned)continue;
      const row=document.createElement('article');row.dataset.item=item.id;
      const picture=preview({...w.equipped,[item.slot]:item.id},item.tool?'attack':'idle',item.tool==='scissors'?'scissors':state.tool);
      picture.setAttribute('aria-label',item.name+' 착용 예시');picture.setAttribute('role','img');
      const details=document.createElement('div');
      const name=document.createElement('b');name.textContent=item.name;
      const desc=document.createElement('p');desc.textContent=item.description;
      const price=document.createElement('small');price.textContent=(item.crafted?'제작품':item.price+' G')+(worn?' · 장착 중':owned?' · 보유':'');
      details.append(name,desc,price);
      const btn=document.createElement('button');btn.textContent=!owned?'구매':worn?(item.price||item.crafted?'해제':'장착 중'):'장착';
      btn.disabled=(!owned && state.gold<item.price)||(worn&&!item.price&&!item.crafted);
      btn.onclick=()=>{
        const before=structuredClone(state.wardrobe),gold=state.gold,previousTool=state.tool;
        const resumeSkin=owned && item.tool==='scissors' && state.tool!=='scissors' && w.equipped.WeaponSkin===item.id;
        const ok=owned?(resumeSkin || equip(state.wardrobe,item.id)):purchase(state,item.id);
        if(ok && owned && item.tool==='scissors')state.tool='scissors';
        if(!ok)return;
        if(!save()){state.wardrobe=before;state.gold=gold;state.tool=previousTool;status.textContent='저장할 수 없어 변경을 취소했습니다.';}
        else {if(owned)apply();status.textContent=item.name+' · '+(!owned?'구매했습니다.':worn?'해제했습니다.':'장착했습니다.');}
        render();
        const next=shelves.querySelector<HTMLButtonElement>('[data-item="'+item.id+'"] button');
        (next && !next.disabled ? next : panel.querySelector<HTMLButtonElement>('[data-close]'))?.focus();
      };
      row.append(picture,details,btn);shelves.append(row);
    }
  }
  panel.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>panel.close();
  const closeKey=(e:KeyboardEvent)=>{if(e.code==='KeyE'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)panel.close()}};
  window.addEventListener('keydown',closeKey,true);
  panel.addEventListener('close',()=>{window.removeEventListener('keydown',closeKey,true);panel.remove();done()},{once:true});
  document.body.append(panel);render();panel.showModal();
}
