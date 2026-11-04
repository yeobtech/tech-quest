// Shared camera and picking for the standalone lab and the embedded mission.
export function setupViewer({T,scene,wiring,cam,orbit,renderer,canvas,categories,freeTargets=[],onFreePin}) {
  const el=id=>document.getElementById(id);
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
  const initial=()=>fit(new T.Vector3(0,1,.16));
  const front=()=>fit(new T.Vector3(0,1,.04));
  el('front').onclick=front;el('back').onclick=()=>fit(new T.Vector3(0,-1,.12));
  el('all').onclick=()=>fit(cam.position.clone().sub(orbit.target));
  function mark(marker,objects){marker.visible=!!objects?.length;if(marker.visible)marker.box.copy(boxFor(objects)).expandByScalar(.3)}
  function clearCable(){
    const mesh=selected?.[0];
    if(mesh?.userData.cable)mesh.material.emissive.setHex(0);
  }
  wiring.addEventListener('childremoved',({child})=>{
    if(child!==selected?.[0])return;
    selected=null;mark(markers[1],null);el('focus').disabled=true;
    el('pinName').textContent='단자를 선택하세요';el('info').textContent='';
  });
  function select(objects,part){
    clearCable();
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
  const selectPart=part=>select(part.objects,part);
  el('parts').onchange=()=>{const part=categories[el('parts').selectedIndex];if(part.name.includes('뒷면'))el('back').click();selectPart(part)};
  el('usbGuide').onclick=()=>{front();selectPart(categories.find(p=>p.name==='USB PROG'))};
  function selectPin(o){
    if(o.userData.pin){
      const p=o.userData.pin;
      select([o],{name:o.userData.componentName+' · '+p.label,gpio:'—',volts:'부품 단자',use:p.detail});return;
    }
    const [side,id]=o.userData.id.split(':');
    const key=o.userData.label??id;
    select([o],{name:(side==='S'?'DHT11 · ':'KS5034 · ')+(o.userData.location??(key==='DATA'?'DAT':key)),
      gpio:key.startsWith('GPIO')?key.slice(4):'—',volts:key==='GND'?'0 V':key==='5V'?'5 V':'3.3 V 실습',
      use:key==='GND'?'공통 접지':key==='DATA'||key.startsWith('GPIO')?'디지털 신호 접점':'전원 접점'})}
  const ray=new T.Raycaster();
  function pick(event){
    const r=canvas.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;
    ray.setFromCamera(new T.Vector2(2*x/r.width-1,1-2*y/r.height),cam);
    const solid=ray.intersectObjects(scene.children.filter(o=>o.visible),true).find(h=>{
      const socket=h.object.userData.contact;
      if(h.object.isSprite && socket?.visible)return true;
      if(!h.object.isMesh||h.object.material.transparent)return false;
      for(let parent=h.object;parent;parent=parent.parent)if(!parent.visible)return false;
      return true;
    });
    if(solid?.object.isSprite)return solid.object.userData.contact;
    if(solid?.object.userData.boardSocket?.visible)return solid.object.userData.boardSocket;
    if(solid?.object.userData.id)return solid.object;
    // Resolve a slightly enlarged screen-space footprint by closest projected centre.
    // Occluded pins on the reverse side must not take precedence over the PCB.
    let nearest=null,best=Infinity;
    const candidates=freeTargets.filter(o=>o.visible && o.parent.visible);
    for(const mesh of candidates){
      const world=mesh.getWorldPosition(new T.Vector3()),depth=world.clone().applyMatrix4(cam.matrixWorldInverse).z;
      if(depth>=0||(solid&&cam.position.distanceTo(world)>solid.distance+2.2))continue;
      const pt=world.clone().project(cam);
      const distance=Math.hypot((pt.x+1)*r.width/2-x,(1-pt.y)*r.height/2-y);
      const pixelsPerUnit=r.height/(-2*depth*Math.tan(cam.fov*Math.PI/360));
      const radius=Math.max(event.pointerType==='touch'?12:8,1.24*pixelsPerUnit+2);
      if(distance<=radius&&distance<best){nearest=mesh;best=distance}
    }
    if(nearest)return nearest;
    if(solid?.object.userData.cable)return solid.object;
    // Give thin leads a five-pixel pick tolerance. Work in model space so hidden
    // segments cannot be selected through the board and crossings prefer the closer lead.
    const point=new T.Vector3();
    let chosen=null,score=Infinity,front=Infinity;
    for(const mesh of wiring.children){
      const cable=mesh.userData.cable;if(!cable)continue;
      for(let i=1;i<cable.points.length;i++){
        const squared=ray.ray.distanceSqToSegment(cable.points[i-1],cable.points[i],undefined,point);
        const depth=cam.position.distanceTo(point);
        if(solid && depth>solid.distance+.4)continue;
        const pixels=Math.sqrt(squared)*r.height/(2*depth*Math.tan(cam.fov*Math.PI/360));
        if(pixels<=5 && (pixels<score-.25 || (Math.abs(pixels-score)<=.25 && depth<front))){
          chosen=mesh;score=pixels;front=depth;
        }
      }
    }
    return chosen??solid?.object;
  }
  const objectsFor=o=>(o?.userData.id||o?.userData.cable)?[o]:o?.userData.part?.objects;
  let down=null;
  const help=document.querySelector('.hint');
  const instructions='접점에서 접점으로 끌어 연결 · 빈 곳을 끌어 회전';
  const pinName=mesh=>mesh.userData.pin?.label??mesh.userData.location??mesh.userData.label??mesh.userData.id.slice(2);
  help.textContent=instructions;
  const ns='http://www.w3.org/2000/svg';
  const overlay=document.createElementNS(ns,'svg'), cord=document.createElementNS(ns,'path'), tip=document.createElementNS(ns,'circle');
  overlay.classList.add('cable-drag');overlay.setAttribute('aria-hidden','true');overlay.append(cord,tip);document.body.append(overlay);
  let gesture=null;
  function screenPoint(mesh){
    const rect=canvas.getBoundingClientRect();
    const socket=mesh.userData.contact??mesh;
    const v=socket.localToWorld(socket.userData.anchor?.clone()??new T.Vector3()).project(cam);
    return {x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};
  }
  function targetFor(e){
    const hit=pick(e);
    return hit?.userData.id && hit.userData.id[0]!==gesture.pin.userData.id[0]?hit:null;
  }
  function endGesture(){
    if(!gesture)return;
    const id=gesture.pointerId;gesture=null;down=null;
    overlay.classList.remove('active','snap');mark(markers[0],null);
    canvas.style.cursor='grab';help.textContent=instructions;
    if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  }
  canvas.addEventListener('pointerdown',e=>{
    transition=null;
    if(gesture){e.stopImmediatePropagation();return}
    down=[e.clientX,e.clientY];
    if(!e.isPrimary||e.button!==0)return;
    const pin=pick(e);if(!pin?.userData.id)return;
    gesture={pin,pointerId:e.pointerId,dragging:false};canvas.setPointerCapture(e.pointerId);
    e.stopImmediatePropagation(); // Reserve a terminal press before OrbitControls receives it.
  },true);
  canvas.addEventListener('pointercancel',endGesture);
  canvas.addEventListener('lostpointercapture',endGesture);
  window.addEventListener('blur',endGesture);
  window.addEventListener('keydown',e=>{if(gesture&&e.key==='Escape'){e.preventDefault();endGesture()}});
  canvas.addEventListener('pointermove',e=>{
    if(gesture){
      if(gesture.pointerId!==e.pointerId)return;
      if(!gesture.dragging&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5)return;
      gesture.dragging=true;
      const hit=targetFor(e),a=screenPoint(gesture.pin),b=hit?screenPoint(hit):{x:e.clientX,y:e.clientY};
      const lift=Math.min(48,Math.hypot(a.x-b.x,a.y-b.y)*.24);
      cord.setAttribute('d',`M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${(a.y+b.y)/2-lift} ${b.x} ${b.y}`);
      tip.setAttribute('cx',b.x);tip.setAttribute('cy',b.y);tip.setAttribute('r',hit?7:4);
      overlay.classList.add('active');overlay.classList.toggle('snap',!!hit);mark(markers[0],hit?[hit]:null);
      help.textContent=pinName(gesture.pin)+' → '+(hit?pinName(hit)+' · 놓으면 연결됩니다.':'반대쪽 접점이나 핀 이름표에 놓으세요.');
      canvas.style.cursor=hit?'copy':'crosshair';return;
    }
    if(e.buttons)return;
    const objects=objectsFor(pick(e));mark(markers[0],objects);canvas.style.cursor=objects?'pointer':'grab';
  });
  canvas.addEventListener('pointerleave',()=>mark(markers[0],null));
  canvas.addEventListener('pointerup',e=>{
    if(gesture){
      if(gesture.pointerId!==e.pointerId)return;
      const {pin,dragging}=gesture,hit=dragging?targetFor(e):pin;
      endGesture();
      if(hit){
        selectPin(hit);
        const id=hit.userData.id,start=dragging?pin.userData.id:undefined;
        onFreePin(id,start);
        if(dragging)help.textContent='✓ '+pinName(pin)+' ↔ '+pinName(hit)+' 연결';
      }
      return;
    }
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
    const obj=pick(e);down=null;
    if(obj?.userData.id){selectPin(obj);onFreePin(obj.userData.id)}
    else if(obj?.userData.cable){
      clearCable();selected=[obj];mark(markers[1],null);el('focus').disabled=false;
      obj.material.emissive.setHex(0xf89927);
      const name=obj.userData.cable.label,details='선택한 연결선 · 연결 목록에서 삭제할 수 있습니다.';
      el('pinName').textContent=name;el('info').textContent=details;
    }else if(obj?.userData.part)selectPart(obj.userData.part);
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
