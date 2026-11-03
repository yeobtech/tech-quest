import * as T from 'three';
import {catalog,createPart} from './parts.js';

// The catalogue uses metres; the board scene uses millimetres.
export function installPalette({scene,cam,canvas,onPartsChange}){
  const placed=new Map(),cards=new Map();
  const panel=document.createElement('section');
  panel.className='part-palette';
  panel.innerHTML='<h2>전자 부품함 <small>15종</small></h2><p>카드를 작업대로 끌어 놓으세요. 카드를 고른 뒤 작업대를 눌러도 됩니다.</p><div class="part-groups"></div><p class="placement-status" role="status"></p><div class="placed-list"></div>';
  document.querySelector('aside').prepend(panel);
  const status=panel.querySelector('.placement-status'),list=panel.querySelector('.placed-list');
  const ray=new T.Raycaster(),floor=new T.Plane(new T.Vector3(0,1,0),0);
  const boardParts=scene.children.filter(o=>o.userData.part).map(o=>new T.Box3().setFromObject(o));
  let armed=null,drag=null,ghost=null;
  function arm(id){
    armed=id;
    for(const [key,card] of cards)card.setAttribute('aria-pressed',String(key===id));
    canvas.classList.toggle('placing',!!id);
    if(id)status.textContent=cards.get(id).title+' · 둘 위치를 선택하세요.';
  }
  function renderList(){
    list.replaceChildren();
    for(const [id,{name}] of placed){
      const row=document.createElement('div'),remove=document.createElement('button');
      row.append(name+' ');remove.textContent='제거';remove.setAttribute('aria-label',name+' 제거');
      remove.onclick=()=>takeOff(id);row.append(remove);list.append(row);
    }
    for(const [id,card] of cards)card.classList.toggle('on-bench',placed.has(id));
  }
  function takeOff(id){
    const item=placed.get(id);if(!item)return;
    scene.remove(item.model);placed.delete(id);
    const materials=new Set();
    item.model.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material)});
    for(const mat of materials){mat.map?.dispose();mat.dispose()}
    onPartsChange();renderList();status.textContent=item.name+' 제거됨';
  }
  function place(id,point){
    let item=placed.get(id);
    if(!item){
      const model=createPart(id);model.scale.setScalar(id==='dht11'?1:.55);
      const [,name,variant]=catalog.find(entry=>entry[0]===id);
      item={model,name:id==='dht11'?name+' · '+variant:name};placed.set(id,item);
      const marks=model.getObjectByName('Terminal labels');marks.userData.pinLabel=true;
      marks.visible=document.getElementById('labels').checked;
      item.bounds=new T.Box3().setFromObject(model);
      scene.add(model);
    }
    const footprint=item.bounds.clone().translate(point);
    let supportY=0;
    for(const bounds of boardParts){
      if(footprint.max.x>=bounds.min.x && footprint.min.x<=bounds.max.x &&
         footprint.max.z>=bounds.min.z && footprint.min.z<=bounds.max.z){
        supportY=Math.max(supportY,bounds.max.y);
      }
    }
    item.model.position.set(point.x,supportY-item.bounds.min.y,point.z);
    item.model.updateMatrixWorld(true);
    onPartsChange();renderList();arm(null);status.textContent=item.name+' 배치됨 · 카드를 다시 끌면 위치를 옮깁니다.';
  }
  function drop(x,y){
    const rect=canvas.getBoundingClientRect();
    if(!armed||x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return false;
    ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),cam);
    const point=ray.ray.intersectPlane(floor,new T.Vector3());if(!point)return false;
    place(armed,point);return true;
  }
  function endDrag(){ghost?.remove();ghost=null;drag=null}
  function cancel(){endDrag();arm(null);status.textContent=''}
  for(const [title,entries] of [['센서·입력',catalog.slice(0,9)],['출력',catalog.slice(9)]]){
    const group=document.createElement('details');group.open=true;
    const titleEl=document.createElement('summary');titleEl.textContent=title+' · '+entries.length+'종';
    const grid=document.createElement('div');grid.className='part-grid';group.append(titleEl,grid);panel.querySelector('.part-groups').append(group);
    for(const [id,name,variant] of entries){
      const card=document.createElement('button');card.type='button';card.dataset.part=id;card.title=name+' · '+variant;
      card.setAttribute('aria-pressed','false');
      const img=new Image();img.src=new URL('../part-previews/'+id+'.png',document.baseURI).href;img.alt='';img.draggable=false;
      card.append(img,document.createTextNode(id==='dht11'?'온습도 · DHT11':name));grid.append(card);cards.set(id,card);
      card.onpointerdown=e=>{
        if(e.button!==0||!e.isPrimary)return;
        drag={id,card,pointer:e.pointerId,x:e.clientX,y:e.clientY};
        card.setPointerCapture(e.pointerId);
      };
      card.onpointermove=e=>{
        if(!drag||drag.pointer!==e.pointerId)return;
        if(!ghost && Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
        if(!ghost){arm(id);ghost=img.cloneNode();ghost.className='part-ghost';document.body.append(ghost)}
        ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
      };
      card.onpointerup=e=>{
        if(!drag||drag.pointer!==e.pointerId)return;
        if(ghost){if(!drop(e.clientX,e.clientY))cancel()}
        else arm(armed===id?null:id);
        endDrag();
      };
      card.onpointercancel=cancel;
      card.onclick=e=>{if(e.detail===0){arm(armed===id?null:id);if(armed){canvas.focus();status.textContent+=' Enter로 작업대 중앙에 배치합니다.'}}};
    }
  }
  canvas.tabIndex=0;
  canvas.addEventListener('pointerdown',e=>{
    if(armed&&e.button===0&&drop(e.clientX,e.clientY)){e.stopImmediatePropagation();e.preventDefault()}
  },true);
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&(armed||drag)){cancel();return}
    if(armed&&document.activeElement===canvas&&e.key==='Enter'){
      const rect=canvas.getBoundingClientRect();drop(rect.left+rect.width/2,rect.top+rect.height/2);e.preventDefault();
    }
  });
  return {
    contacts(){
      const targets=[];
      for(const {model,name} of placed.values())model.traverse(o=>{
        if(o.userData.pin){o.userData.componentName=name;targets.push(o)}
      });
      return targets;
    }
  };
}
