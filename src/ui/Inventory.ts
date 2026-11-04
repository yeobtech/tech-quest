import {materials,type Inventory,type MaterialId} from '../data/materials';

export function openInventory(items:Inventory, done:()=>void){
  const panel=document.createElement('dialog');
  panel.className='workshop';panel.setAttribute('aria-label','인벤토리');
  panel.innerHTML='<small>인벤토리 / 수집 재료</small><h2>재료 가방</h2>';
  for(const id of Object.keys(materials) as MaterialId[]){
    if(!items[id])continue;
    const item=materials[id], row=document.createElement('p');
    const title=document.createElement('strong');
    title.textContent=item.icon+' '+item.name+' × '+items[id];
    row.append(title,document.createElement('br'),item.description);panel.append(row);
  }
  if(!Object.keys(items).length)panel.append('아직 재료가 없습니다. 몬스터가 떨어뜨린 재료에 다가가 보세요.');
  const close=document.createElement('button');close.textContent='가방 닫기 · I';close.onclick=()=>panel.close();
  panel.onkeydown=e=>{if(e.code==='KeyI'&&!e.repeat){e.preventDefault();panel.close()}};
  panel.onclose=()=>{panel.remove();done()};
  panel.append(close);document.body.append(panel);panel.showModal();
}
