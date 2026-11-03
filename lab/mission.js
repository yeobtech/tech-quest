import {createDht11,createBoardContacts,boardContacts,terminalPoint} from './dht11.js';
// Observatory mode uses the same v4 model and inspector as the standalone lab.
export function mountMission({T,scene,wire,wiring,cam,orbit}) {
  document.body.classList.add('mission');
  document.querySelector('aside details').open=false;
  document.querySelector('.hint').textContent='색 핀 선택 · 드래그 회전 · 휠 확대';


  const sensor=createDht11(10,-38);
  scene.add(sensor.group);
  const targets=[...createBoardContacts(scene,boardContacts),...Object.values(sensor.contacts)];
  const colors={VCC:0xef736d,DATA:0xffcc68,GND:0x99aebc};
  function sync(event){
    if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='ks5034:wires')return;
    for(const mesh of [...wiring.children]){wiring.remove(mesh);mesh.geometry.dispose();mesh.material.dispose()}
    for(const key of ['VCC','DATA','GND']){
      const end=boardContacts[event.data.wires?.[key]];
      if(end)wire(terminalPoint(sensor.contacts[key]),new T.Vector3(...end),colors[key],true);
    }
  }
  window.addEventListener('message',sync);
  window.parent.postMessage({type:'ks5034:ready'},location.origin);
  return targets;
}
