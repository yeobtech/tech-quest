import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { outputs, inputs, type Wires } from './wiring';

// Pin spacing and positions are a teaching diagram, not a physical header map.
export function makeBoard(host:HTMLElement,choose:(id:string)=>void) {
  const r=new T.WebGLRenderer({antialias:true});host.append(r.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0x18323a);
  const cam=new T.PerspectiveCamera(40,1,.1,50);cam.position.set(0,6.5,6.8);
  const controls=new OrbitControls(cam,r.domElement);controls.enablePan=false;controls.minDistance=4;controls.maxDistance=15;
  scene.add(new T.HemisphereLight(0xffffff,0x86c4ac,2));
  const light=new T.DirectionalLight(0xffffff,2);light.position.set(1,6,3);scene.add(light);
  function box(x:number,y:number,z:number,w:number,h:number,d:number,color:number){
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color}));mesh.position.set(x,y,z);scene.add(mesh);return mesh;
  }
  box(-1.65,0,0,3.1,.2,2.45,0x202a30);box(-2.1,.2,.17,1.1,.25,1,0x9da7ac);
  for(const z of [-.62,.32])box(-3.16,.16,z,.36,.32,.55,0xc8cfd0);
  box(1.9,0,0,1.65,.18,2.4,0x255a53);box(2.15,.38,.06,.87,.65,1.22,0x318cd2);
  for(let j=0;j<5;j++)box(2.15,.72,-.4+j*.22,.66,.02,.06,0x224a6b);
  const pins=new Map<string,T.Mesh>(),labels:T.Sprite[]=[];
  function pin(id:string,x:number,z:number,color:number){
    const m=box(x,.24,z,.29,.25,.25,color);m.userData.id=id;pins.set(id,m);
    const cv=document.createElement('canvas');cv.width=128;cv.height=40;const c=cv.getContext('2d')!;
    c.fillStyle='#10252a';c.fillRect(0,0,128,40);c.fillStyle='#fff';c.font='bold 26px sans-serif';c.textAlign='center';c.fillText(id.split(':')[1],64,29);
    const l=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv)}));l.position.set(x+(id.startsWith('B')?-.58:.58),.49,z);l.scale.set(.78,.25,1);scene.add(l);labels.push(l);
  }
  outputs.forEach((p,i)=>pin('B:'+p,-.36,-.93+i*.61,[0xcc5656,0xe0b752,0x637882,0xfb814d][i]));
  inputs.forEach((p,i)=>pin('S:'+p,1.23,-.78+i*.78,[0xcc5656,0xe0b752,0x637882][i]));
  let cables:T.Mesh[]=[];
  function clear(){for(const c of cables){scene.remove(c);c.geometry.dispose();(c.material as T.Material).dispose()}cables=[]}
  function update(w:Wires){
    clear();for(const p of inputs){if(!w[p])continue;const a=pins.get('B:'+w[p])!.position,b=pins.get('S:'+p)!.position;
      const mid=a.clone().lerp(b,.5);mid.y=1;
      const m=new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(a,mid,b),24,.04,6,false),new T.MeshBasicMaterial({color:p==='DATA'?0xffc953:p==='VCC'?0xe46c67:0xb0cad0}));scene.add(m);cables.push(m)}
  }
  let start=[0,0];r.domElement.onpointerdown=e=>{start=[e.clientX,e.clientY]};
  r.domElement.onpointerup=e=>{if(Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;
    const rect=r.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),cam);
    const hit=ray.intersectObjects([...pins.values()])[0];if(hit)choose(hit.object.userData.id);
  };
  const resize=()=>{const w=host.clientWidth||500;cam.aspect=w/235;cam.updateProjectionMatrix();r.setSize(w,235);r.render(scene,cam)};
  const render=()=>r.render(scene,cam);controls.addEventListener('change',render);const ro=new ResizeObserver(resize);ro.observe(host);resize();
  return {update(w:Wires){update(w);render()},dispose(){ro.disconnect();controls.dispose();clear();for(const l of labels){l.material.map?.dispose();l.material.dispose()}scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();o.material.dispose()}});r.dispose();r.forceContextLoss();r.domElement.remove()}};
}
