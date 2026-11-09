import {materials,type Inventory,type MaterialId} from '../data/materials';
import './inventory.css';

export function openInventory(items:Inventory, done:()=>void){
  const panel=document.createElement('dialog');
  const owned=(Object.keys(materials) as MaterialId[]).filter(id=>(items[id]??0)>0);
  panel.className='workshop inventory';panel.setAttribute('aria-label','인벤토리');
  panel.innerHTML=`
    <div class="inventory-titlebar">
      <div><span class="inventory-emblem" aria-hidden="true">▦</span><h2>재료 가방</h2><span class="inventory-caption">INVENTORY</span></div>
      <button class="inventory-close" aria-label="인벤토리 닫기" title="닫기 · I / Esc">×</button>
    </div>
    <div class="inventory-body">
      <section class="inventory-bag" aria-label="수집 재료 가방">
        <div class="inventory-category"><strong>수집 재료</strong><span data-summary></span></div>
        <ul class="inventory-grid" aria-label="재료 슬롯"></ul>
      </section>
      <section class="inventory-detail" aria-label="선택한 재료" aria-live="polite" aria-atomic="true"></section>
    </div>
    <div class="inventory-footer"><span>장비는 작업복 가게에서 관리해요.</span><span><kbd>I</kbd> / <kbd>Esc</kbd> 닫기</span></div>`;
  panel.querySelector('[data-summary]')!.textContent=`보유 ${owned.length}종`;
  const grid=panel.querySelector('.inventory-grid')!;
  const detail=panel.querySelector<HTMLElement>('.inventory-detail')!;
  const buttons:HTMLButtonElement[]=[];
  const compact=new Intl.NumberFormat('ko-KR',{notation:'compact',maximumFractionDigits:1});
  function select(id:MaterialId){
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.material===id)));
    const item=materials[id];
    detail.innerHTML='<span class="inventory-detail-icon" aria-hidden="true"></span><span class="inventory-detail-type">수집 재료</span><h3></h3><p class="inventory-description"></p><dl><dt>보유 수량</dt><dd></dd></dl>';
    detail.querySelector('.inventory-detail-icon')!.textContent=item.icon;
    detail.querySelector('h3')!.textContent=item.name;
    detail.querySelector('.inventory-description')!.textContent=item.description;
    detail.querySelector('dd')!.textContent=items[id]!.toLocaleString('ko-KR')+'개';
  }
  // Empty slots are presentation only: they do not impose a new storage limit.
  for(let index=0;index<Math.max(30,Math.ceil(owned.length/5)*5);index++){
    const cell=document.createElement('li');cell.className='inventory-cell';
    const id=owned[index];
    if(id){
      const item=materials[id],count=items[id]!;
      const button=document.createElement('button');
      button.className='inventory-slot';button.dataset.material=id;
      button.setAttribute('aria-label',`${item.name}, ${count.toLocaleString('ko-KR')}개`);
      button.setAttribute('aria-pressed','false');button.title=item.name;
      const icon=document.createElement('span');icon.className='inventory-icon';icon.setAttribute('aria-hidden','true');icon.textContent=item.icon;
      const quantity=document.createElement('span');quantity.className='inventory-quantity';quantity.setAttribute('aria-hidden','true');
      quantity.textContent=count<10000?count.toLocaleString('ko-KR'):compact.format(count);
      button.append(icon,quantity);button.onclick=()=>select(id);
      button.onfocus=()=>select(id);
      button.onkeydown=e=>{
        const offset:{[key:string]:number}={ArrowLeft:-1,ArrowRight:1,ArrowUp:-5,ArrowDown:5};
        const target=e.key==='Home'?0:e.key==='End'?buttons.length-1:index+(offset[e.key]??0);
        if(e.key in offset || e.key==='Home' || e.key==='End'){
          e.preventDefault();buttons[Math.max(0,Math.min(buttons.length-1,target))]?.focus();
        }
      };
      buttons.push(button);cell.append(button);
    }else cell.setAttribute('aria-hidden','true');
    grid.append(cell);
  }
  // Keep an empty bag visibly empty, including the item-details area.
  if(owned[0])select(owned[0]);
  else detail.hidden=true;
  const close=panel.querySelector<HTMLButtonElement>('.inventory-close')!;
  close.onclick=()=>panel.close();
  panel.onkeydown=e=>{
    if(e.code==='KeyI'){
      e.preventDefault();e.stopPropagation();if(!e.repeat)panel.close();
    }
  };
  panel.addEventListener('close',()=>{panel.remove();done()},{once:true});
  document.body.append(panel);panel.showModal();
  (buttons[0]??close).focus();
}
