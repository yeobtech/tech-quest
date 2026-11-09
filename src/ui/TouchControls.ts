import {TouchState} from './TouchState';
import './touch.css';
export class TouchControls extends TouchState {
  constructor(){
    super();
    const panel=document.createElement('section');panel.className='touch-controls';panel.setAttribute('aria-label','화면 게임 조작');
    panel.innerHTML='<p>화면 버튼 · 이동과 점프를 함께 누를 수 있어요. 가로 화면을 권장합니다.</p><div class="touch-row"><div data-pad></div><div data-actions></div></div><div data-menu></div>';
    const groups=[['pad',[['LEFT','←','왼쪽 이동'],['UP','↑','사다리 오르기'],['RIGHT','→','오른쪽 이동'],['SHIFT','걷기','천천히 걷기'],['DOWN','↓','사다리 내려가기']]],['actions',[['Z','공격','공격'],['SPACE','점프','점프'],['E','대화 / 사용','상호작용']]],['menu',[['I','가방','인벤토리'],['Q','퀘스트','퀘스트'],['X','측정','발판 측정'],['B','마을 복귀','디지털 훈련장 나가기']]]] as const;
    const blocked=()=>!!document.querySelector('dialog[open]');
    for(const [group,keys] of groups)for(const [key,text,label] of keys){
      const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.dataset.key=key;
      b.onpointerdown=e=>{if(blocked()||e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);this.press(e.pointerId,key);b.classList.add('held');document.querySelector('#focus-game')?.classList.add('hidden')};
      const release=(e:PointerEvent)=>{this.release(e.pointerId);if(!this.down(key))b.classList.remove('held')};
      b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;
      b.onclick=e=>{if(e.detail===0&&!blocked()){this.press(-1,key);this.release(-1)}};
      b.oncontextmenu=e=>e.preventDefault();panel.querySelector('[data-'+group+']')!.append(b);
    }
    document.querySelector('.game-shell')!.after(panel);
    const toggle=document.createElement('button');toggle.className='touch-toggle';toggle.textContent='화면 버튼 표시 / 숨기기';toggle.setAttribute('aria-label','화면 버튼 표시 전환');
    toggle.onclick=()=>{const show=getComputedStyle(panel).display==='none';panel.classList.toggle('force-show',show);panel.classList.toggle('force-hide',!show);this.reset()};
    panel.after(toggle);
    const reset=()=>{this.reset();panel.querySelectorAll('.held').forEach(b=>b.classList.remove('held'))};
    window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
    new MutationObserver(()=>{if(blocked())reset()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
  }
}
