import { inputs, outputs, type Wires } from './wiring';

// The author's standalone v4 lab owns its Three.js scene. The RPG owns wiring validation.
export function makeBoard(host: HTMLElement, choose: (id: string) => void) {
  const frame = document.createElement('iframe');
  frame.title = 'KS5034 Lab v4 · 보드 탐색과 관측소 배선';
  frame.src = new URL('./lab/index.html?mode=observatory', document.baseURI).href;
  frame.style.cssText = 'width:100%;height:390px;border:0;display:block';
  const valid = new Set([...outputs.map(pin => 'B:'+pin), ...inputs.map(pin => 'S:'+pin)]);
  let wires: Wires = {};
  const sync = () => frame.contentWindow?.postMessage({type:'ks5034:wires', wires}, location.origin);
  function receive(event: MessageEvent) {
    if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type === 'ks5034:ready') sync();
    if (event.data?.type === 'ks5034:pin' && valid.has(event.data.id)) choose(event.data.id);
  }
  window.addEventListener('message',receive);
  host.append(frame);
  return {
    update(value: Wires) { wires = {...value}; sync(); },
    dispose() { window.removeEventListener('message',receive); frame.remove(); }
  };
}
