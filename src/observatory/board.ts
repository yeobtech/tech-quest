import { inputs, outputs, type Wires } from './wiring';

// The author's standalone v4 lab owns its Three.js scene. The RPG owns wiring validation.
export function makeBoard(host: HTMLElement, choose: (id: string,start?:string) => void, inspect:(name:string,details:string)=>void) {
  const frame = document.createElement('iframe');
  frame.title = 'KS5034 Lab v4 · 보드 탐색과 관측소 배선';
  frame.src = new URL('./lab/index.html?mode=observatory', document.baseURI).href;
  let lastPin = '';
  const valid = new Set([...outputs.map(pin => 'B:'+pin), ...inputs.map(pin => 'S:'+pin)]);
  let wires: Wires = {};
  const sync = () => frame.contentWindow?.postMessage({type:'ks5034:wires', wires}, location.origin);
  function receive(event: MessageEvent) {
    if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type === 'ks5034:ready') {sync(); highlight(lastPin)}
    if (event.data?.type === 'ks5034:inspect' && typeof event.data.name==='string' && typeof event.data.details==='string') inspect(event.data.name,event.data.details);
    if (event.data?.type === 'ks5034:pin' && valid.has(event.data.id)) {
      const {id,start}=event.data;
      if(start===undefined || (valid.has(start)&&start[0]!==id[0])) choose(id,start);
    }
  }
  window.addEventListener('message',receive);
  function highlight(id:string){
    lastPin=id;
    frame.contentWindow?.postMessage({type:'ks5034:select',id},location.origin);
  }
  host.append(frame);
  return {
    highlight,
    update(value: Wires) { wires = {...value}; sync(); },
    dispose() { window.removeEventListener('message',receive); frame.remove(); }
  };
}
