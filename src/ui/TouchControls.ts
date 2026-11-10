import {TouchState} from './TouchState';
import './touch.css';
export class TouchControls extends TouchState {
  private clearStick=()=>{};
  private actionButton!:HTMLButtonElement;
  private actionKey='E';
  override reset(){super.reset();this.clearStick();document.querySelectorAll('.touch-controls .held').forEach(b=>b.classList.remove('held'))}
  setAction(label:string,key='E',enabled=true){
    this.actionKey=key;
    if(this.actionButton.textContent!==label){this.actionButton.textContent=label;this.actionButton.setAttribute('aria-label',label)}
    if(this.actionButton.disabled===enabled)this.actionButton.disabled=!enabled;
  }
  constructor(){
    super();
    const panel=document.createElement('section');panel.className='touch-controls';panel.setAttribute('aria-label','화면 게임 조작');
    panel.innerHTML='<p>왼쪽 손잡이를 좌우로 끌어 이동 · 손을 떼면 정지</p><div class="touch-row"><div data-pad role="slider" tabindex="0" aria-label="좌우 이동 조이스틱" aria-orientation="horizontal" aria-valuemin="-1" aria-valuemax="1" aria-valuenow="0"><span class="stick-track" aria-hidden="true"></span><span class="stick-knob" aria-hidden="true"></span></div><div data-actions></div></div><div data-menu></div>';
    const groups=[['actions',[['Z','공격','공격'],['SPACE','점프','점프'],['E','대상 없음','대상 없음']]],['menu',[['I','가방','인벤토리'],['Q','퀘스트','퀘스트'],['X','측정','발판 측정'],['B','마을 복귀','디지털 훈련장 나가기']]]] as const;
    const blocked=()=>!!document.querySelector('dialog[open]');
    const stick=panel.querySelector<HTMLElement>('[data-pad]')!,knob=panel.querySelector<HTMLElement>('.stick-knob')!;
    let pointer:number|undefined,startX=0;
    const position=(x:number)=>{knob.style.transform=`translateX(${x}px)`;stick.setAttribute('aria-valuenow',String(Math.abs(x)<=10?0:Math.sign(x)))};
    this.clearStick=()=>{const id=pointer;pointer=undefined;position(0);if(id!==undefined&&stick.hasPointerCapture(id))stick.releasePointerCapture(id)};
    stick.onpointerdown=e=>{if(blocked()||e.button!==0||pointer!==undefined)return;e.preventDefault();pointer=e.pointerId;startX=e.clientX;stick.setPointerCapture(pointer);position(0);document.querySelector('#focus-game')?.classList.add('hidden')};
    stick.onpointermove=e=>{if(pointer!==e.pointerId)return;e.preventDefault();const x=Math.max(-44,Math.min(44,e.clientX-startX));this.moveHorizontal(pointer,x);position(x)};
    const stopStick=(e:PointerEvent)=>{if(pointer===e.pointerId){this.release(pointer);this.clearStick()}};
    stick.onpointerup=stopStick;stick.onpointercancel=stopStick;stick.onlostpointercapture=stopStick;
    stick.oncontextmenu=e=>e.preventDefault();
    for(const [group,keys] of groups)for(const [key,text,label] of keys){
      const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.dataset.key=key;
      if(key==='E'){this.actionButton=b;b.disabled=true;b.title='가까운 NPC·포털·상자·사다리의 동작이 표시됩니다.'}
      b.onpointerdown=e=>{if(blocked()||b.disabled||e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);this.press(e.pointerId,key==='E'?this.actionKey:key);b.classList.add('held');document.querySelector('#focus-game')?.classList.add('hidden')};
      const release=(e:PointerEvent)=>{this.release(e.pointerId);if(!this.down(key))b.classList.remove('held')};
      b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;
      b.onclick=e=>{if(e.detail===0&&!blocked()&&!b.disabled){this.press(-1,key==='E'?this.actionKey:key);this.release(-1)}};
      b.oncontextmenu=e=>e.preventDefault();panel.querySelector('[data-'+group+']')!.append(b);
    }
    const shell=document.querySelector('.game-shell')!;shell.append(panel);
    const toggle=document.createElement('button');toggle.className='touch-toggle';toggle.textContent='조작';toggle.title='화면 버튼 표시 / 숨기기';toggle.setAttribute('aria-label','화면 버튼 표시 전환');
    toggle.onclick=()=>{const show=getComputedStyle(panel).display==='none';panel.classList.toggle('force-show',show);panel.classList.toggle('force-hide',!show);this.reset()};
    shell.append(toggle);
    const reset=()=>{this.reset();panel.querySelectorAll('.held').forEach(b=>b.classList.remove('held'))};
    window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
    window.addEventListener('resize',reset);
    new MutationObserver(()=>{if(blocked())reset()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
  }
}
