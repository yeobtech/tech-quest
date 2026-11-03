// Shared camera and picking for the standalone lab and the embedded mission.
export function setupViewer({T,scene,cam,orbit,renderer,canvas,categories,hits,missionTargets}) {
  const el=id=>document.getElementById(id);
  const post=data=>{if(missionTargets)parent.postMessage(data,location.origin)};
  const markers=[0x1676ae,0xca5907].map(color=>{
    const box=new T.Box3Helper(new T.Box3(),color);
    box.material.depthTest=false;box.renderOrder=10;box.visible=false;scene.add(box);return box;
  });
  let selected=null, transition=null;
  const bounds=new T.Box3();
  function boxFor(objects){
    const box=new T.Box3();
    for(const o of objects)box.expandByObject(o);
    return box;
  }
  function fit(direction){
    transition=null;
    bounds.makeEmpty();
    for(const obj of scene.children)if(obj.visible&&!markers.includes(obj)&&(obj.isMesh||obj.isSprite||obj.isGroup))bounds.expandByObject(obj);
    const center=bounds.getCenter(new T.Vector3()), corners=[];
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new T.Vector3(x,y,z));
    direction.normalize();orbit.target.copy(center);
    let low=1,high=600;
    for(let i=0;i<16;i++){
      const distance=(low+high)/2;
      cam.position.copy(center).addScaledVector(direction,distance);cam.lookAt(center);cam.updateMatrixWorld();
      const fits=corners.every(v=>{const p=v.clone().project(cam);return p.z>0&&Math.max(Math.abs(p.x),Math.abs(p.y))<=.82});
      if(fits)high=distance;else low=distance;
    }
    cam.position.copy(center).addScaledVector(direction,high);orbit.update();
  }
  orbit.minDistance=8;orbit.maxDistance=650;cam.far=1000;
  const initial=()=>fit(new T.Vector3(0,1,missionTargets?1.15:.16));
  const front=()=>fit(new T.Vector3(0,1,.04));
  el('front').onclick=front;el('back').onclick=()=>fit(new T.Vector3(0,-1,.12));
  el('all').onclick=()=>fit(cam.position.clone().sub(orbit.target));
  function mark(marker,objects){marker.visible=!!objects?.length;if(marker.visible)marker.box.copy(boxFor(objects)).expandByScalar(.3)}
  function select(objects,part){
    selected=objects;mark(markers[1],objects);el('focus').disabled=!selected;
    el('pinName').textContent=part.name;
    el('info').textContent='GPIO '+part.gpio+' · '+part.volts+'\n'+part.use;
    if(categories.includes(part))el('parts').selectedIndex=categories.indexOf(part);
  }
  el('labels').onchange=()=>scene.traverse(o=>{if(o.userData.pinLabel)o.visible=el('labels').checked});
  el('home').onclick=()=>{el('labels').checked=el('labels').defaultChecked;el('labels').onchange();initial()};
  el('focus').onclick=()=>{
    if(!selected)return;
    const box=boxFor(selected),center=box.getCenter(new T.Vector3());
    const dist=Math.max(18,box.getSize(new T.Vector3()).length()*1.8);
    transition={time:performance.now(),from:cam.position.clone(),target:orbit.target.clone(),center,
      end:center.clone().addScaledVector(cam.position.clone().sub(orbit.target).normalize(),dist)};
  };
  const selectPart=part=>{select(part.objects,part);post({type:'ks5034:inspect',name:part.name,details:el('info').textContent})};
  el('parts').onchange=()=>{const part=categories[el('parts').selectedIndex];if(part.name.includes('뒷면'))el('back').click();selectPart(part)};
  el('usbGuide').onclick=()=>{front();selectPart(categories.find(p=>p.name==='USB PROG'))};
  const pinById=new Map((missionTargets??[]).map(o=>[o.userData.id,o]));
  function selectPin(o){const id=o.userData.id;select([o],{name:id,gpio:'',volts:'',use:''})}
  window.addEventListener('message',event=>{
    if(!missionTargets||event.origin!==location.origin||event.source!==parent||event.data?.type!=='ks5034:select')return;
    const mesh=pinById.get(event.data.id);if(mesh)selectPin(mesh);
    else {selected=null;mark(markers[1],null);el('focus').disabled=true}
  });
  const ray=new T.Raycaster();
  function pick(event){
    const r=canvas.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;
    ray.setFromCamera(new T.Vector2(2*x/r.width-1,1-2*y/r.height),cam);
    const solid=ray.intersectObjects(scene.children,false).find(h=>h.object.isMesh&&!h.object.material.transparent);
    // Resolve a slightly enlarged screen-space footprint by closest projected centre.
    // Occluded pins on the reverse side must not take precedence over the PCB.
    let nearest=null,best=Infinity;
    const candidates=missionTargets??hits.filter(o=>o.geometry.parameters.width<=2.54);
    for(const mesh of candidates){
      const world=mesh.position,depth=world.clone().applyMatrix4(cam.matrixWorldInverse).z;
      if(depth>=0||(solid&&cam.position.distanceTo(world)>solid.distance+2.2))continue;
      const pt=world.clone().project(cam);
      const distance=Math.hypot((pt.x+1)*r.width/2-x,(1-pt.y)*r.height/2-y);
      const pixelsPerUnit=r.height/(-2*depth*Math.tan(cam.fov*Math.PI/360));
      if(distance<=1.24*pixelsPerUnit+2&&distance<best){nearest=mesh;best=distance}
    }
    return nearest??solid?.object;
  }
  const objectsFor=o=>o?.userData.id?[o]:o?.userData.part?.objects;
  let down=null;
  canvas.addEventListener('pointerdown',e=>{transition=null;down=[e.clientX,e.clientY]});
  canvas.addEventListener('pointermove',e=>{
    if(e.buttons)return;
    const objects=objectsFor(pick(e));mark(markers[0],objects);canvas.style.cursor=objects?'pointer':'grab';
  });
  canvas.addEventListener('pointerleave',()=>mark(markers[0],null));
  canvas.addEventListener('pointerup',e=>{
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
    const obj=pick(e);down=null;
    if(obj?.userData.id){selectPin(obj);post({type:'ks5034:pin',id:obj.userData.id})}
    else if(obj?.userData.part)selectPart(obj.userData.part);
  });
  el('focus').disabled=true;
  new ResizeObserver(()=>{
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
    if(bounds.isEmpty())initial();else el('all').click();
  }).observe(canvas);
  renderer.setAnimationLoop(()=>{
    if(transition){const t=Math.min(1,(performance.now()-transition.time)/350),k=t*t*(3-2*t);
      orbit.target.lerpVectors(transition.target,transition.center,k);cam.position.lerpVectors(transition.from,transition.end,k);if(t===1)transition=null}
    orbit.update();renderer.render(scene,cam);
  });
}
