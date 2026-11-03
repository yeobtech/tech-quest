// Observatory mode uses the same v4 model and inspector as the standalone lab.
export function mountMission({T,scene,wire,wiring,cam,orbit}) {
  document.body.classList.add('mission');
  document.querySelector('aside details').open=false;
  document.querySelector('.hint').textContent='색 핀 선택 · 드래그 회전 · 휠 확대';


  // Blue upper header: G, 3V3, IO6, IO4, IO5. The V socket assumes a 5V rail in this simulation.
  const positions={
    'B:GND':[-8.6,4.8,-5], 'B:3V3':[-8.6,4.8,-2.46], 'B:GPIO4':[-8.6,4.8,2.62],
    'B:5V':[-6+4*2.54,4.8,24],
    'S:VCC':[10,4,-35], 'S:DATA':[15,4,-35], 'S:GND':[20,4,-35]
  };
  const colors={VCC:0xef736d,DATA:0xffcc68,GND:0x99aebc};
  const sensor=new T.Mesh(new T.BoxGeometry(17,4,7),new T.MeshStandardMaterial({color:0x258cc5}));
  sensor.position.set(15,1,-38);scene.add(sensor);
  const targets=[];
  for(const [id,pos] of Object.entries(positions)){
    const key=id.split(':')[1],color=colors[key]??(key==='3V3'||key==='5V'?colors.VCC:colors.DATA);
    const dot=new T.Mesh(new T.SphereGeometry(1,10,8),new T.MeshBasicMaterial({color}));
    dot.position.set(...pos);dot.userData.id=id;scene.add(dot);targets.push(dot);
  }
  const sensorLabel=document.createElement('canvas');sensorLabel.width=256;sensorLabel.height=52;
  const c=sensorLabel.getContext('2d');c.fillStyle='#133831';c.fillRect(0,0,256,52);c.fillStyle='white';c.font='bold 30px sans-serif';c.fillText('DHT11',76,36);
  const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(sensorLabel)}));label.position.set(15,5,-41);label.scale.set(13,2.6,1);scene.add(label);
  function sync(event){
    if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='ks5034:wires')return;
    for(const mesh of [...wiring.children]){wiring.remove(mesh);mesh.geometry.dispose();mesh.material.dispose()}
    for(const key of ['VCC','DATA','GND']){
      const end=positions['B:'+event.data.wires?.[key]];if(end)wire(new T.Vector3(...positions['S:'+key]),new T.Vector3(...end),colors[key]);
    }
  }
  window.addEventListener('message',sync);
  window.parent.postMessage({type:'ks5034:ready'},location.origin);
  return targets;
}
