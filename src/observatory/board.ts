import {inputs,type SensorPin} from './wiring';

type Circuit = {
  wires: Partial<Record<SensorPin,{net:string,label:string}>>;
  otherWires:number;
};

export function makeBoard(host:HTMLElement,onCircuit:(state:Circuit)=>void) {
  const frame=document.createElement('iframe');
  frame.title='KS5034 배선 실습실';
  frame.src=new URL('./lab/index.html?mode=observatory',document.baseURI).href;
  function receive(event:MessageEvent){
    if(event.source!==frame.contentWindow || event.origin!==location.origin)return;
    const data=event.data;
    if(data?.type!=='ks5034:circuit' || !data.wires || !Number.isSafeInteger(data.otherWires) || data.otherWires<0)return;
    const wires:Circuit['wires']={};
    for(const pin of inputs){
      const item=data.wires[pin];
      if(item===undefined)continue;
      if(typeof item?.net!=='string' || typeof item.label!=='string')return;
      wires[pin]={net:item.net,label:item.label};
    }
    onCircuit({wires,otherWires:data.otherWires});
  }
  window.addEventListener('message',receive);
  host.append(frame);
  return {dispose(){window.removeEventListener('message',receive);frame.remove()}};
}
