import {inputs,type SensorPin} from './wiring';

export type Circuit = {
  wires: Partial<Record<SensorPin,{net:string,label:string}>>;
  otherWires:number;
};

export function makeBoard(host:HTMLElement,onCircuit:(state:Circuit)=>void,onSelection?:(target:string|null,name:string)=>void,mode:'observatory'|'explore'='observatory') {
  const frame=document.createElement('iframe');
  frame.title='KS5034 배선 실습실';
  frame.src=new URL('./lab/index.html?mode='+mode,document.baseURI).href;
  function receive(event:MessageEvent){
    if(event.source!==frame.contentWindow || event.origin!==location.origin)return;
    const data=event.data;
    if(data?.type==='ks5034:selection'&&(data.target===null||['USB PROG','USB OTG','GPIO','3V3','GND'].includes(data.target))&&typeof data.name==='string'){onSelection?.(data.target,data.name.slice(0,160));return}
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
