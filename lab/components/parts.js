import {createDht11} from '../dht11.js';
import {addPinLabels} from './pins.js';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const metal=0xbac4cc, gold=0xdab26a, black=0x202530, blue=0x174e80, white=0xf1eee3, green=0x176447;
export const catalog=[
 ['dht11','온습도 센서','DHT11','파란 센서와 세 개의 금색 단자를 살펴보세요.'],
 ['hc-sr04','초음파 거리 센서','HC-SR04','두 금속 통 중 하나는 초음파를 보내고 다른 하나는 메아리를 받아요.'],
 ['ldr','조도 센서','원판형 광저항','작은 원판 위에 구불구불한 감광 무늬가 있어요.'],
 ['soil','토양 수분 센서','저항식 포크형 프로브','두 갈래 전극을 흙에 꽂는 형태예요.'],
 ['mq2','가스 센서','MQ-2 모듈','둥근 금속 망 아래에 가스를 감지하는 소자가 있어요.'],
 ['ds18b20','방수 온도 센서','DS18B20 프로브형','스테인리스 탐침과 검은 케이블이 이어져 있어요.'],
 ['pot','가변 저항','회전형 전위차계','홈이 난 축을 돌려 저항값을 바꿔요.'],
 ['tilt','틸트 센서','볼 스위치 모듈','금속 통 속의 볼이 움직이면 접점 상태가 달라져요.'],
 ['button','버튼','택트 스위치','검은 누름판 아래에 금속 덮개와 네 다리가 있어요.'],
 ['buzzer','부저','원통형 능동 부저','검은 케이스 윗면의 작은 구멍으로 소리가 나와요.'],
 ['sg90','서보 모터','SG90','파란 몸체 위 흰 회전 팔과 세 가닥 선을 살펴보세요.'],
 ['oled','OLED 디스플레이','0.96형 I²C 모듈','유리 화면 아래 주황색 필름이 기판과 연결돼요.'],
 ['neopixel','NeoPixel LED','WS2812B 6구 바','기판 위 흰 패키지마다 한 점의 색을 바꿀 수 있어요.'],
 ['dc','DC 모터','130형 브러시 모터','금속 몸체 앞에는 회전축, 뒤에는 두 전원 단자가 있어요.'],
 ['fan','팬모터','사각 축류팬','사각 틀 안에 굽은 날개와 중심 모터가 있어요.']
];
export function createPart(id){
 if(id==='dht11'){
   const {group,contacts}=createDht11(0,0);
   addPinLabels(group,id);
   Object.values(contacts).forEach((pin,i)=>{
     const dot=group.children.find(mesh=>mesh.userData.id==='S:dht11/'+i);
     pin.userData={...pin.userData,...dot.userData,contact:dot};
   });
   return group;
 }
 const g=new T.Group(); g.name=id;
 const mats=new Map();
 function mesh(geo,color,x,y,z){
  if(!mats.has(color)) mats.set(color,new T.MeshStandardMaterial({color,metalness:[metal,gold].includes(color)?.58:.06,roughness:.42}));
  const m=new T.Mesh(geo,mats.get(color));m.position.set(x,y,z);g.add(m);return m;
 }
 function box(x,y,z,w,h,d,c,r=0){return mesh(r?new RoundedBoxGeometry(w,h,d,2,r):new T.BoxGeometry(w,h,d),c,x,y,z)}
 function cyl(x,y,z,r,h,c,n=32){return mesh(new T.CylinderGeometry(r,r,h,n),c,x,y,z)}
 function tube(points,r,c){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(new T.TubeGeometry(curve,Math.max(10,points.length*5),r,7,false),c,0,0,0)}
 function path(points,h,c,y=0,holes=[]){
  const s=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));s.closePath();
  for(const [x,z,r] of holes){const p=new T.Path();p.absarc(x,-z,r,0,2*Math.PI,true);s.holes.push(p)}
  const geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:32});geo.rotateX(-Math.PI/2);return mesh(geo,c,0,y,0)
 }
 function plate(w,d,c=blue,r=1.6){const a=w/2,b=d/2;
  const holes=[[-a+2.6,-b+2.6,r],[a-2.6,-b+2.6,r]];
  path([[-a+1,-b],[a-1,-b],[a,-b+1],[a,b-1],[a-1,b],[-a+1,b],[-a,b-1],[-a,-b+1]],1.4,c,0,holes);
  for(const [x,z,ri] of holes)ring(x,1.42,z,ri+.45,ri,gold);
 }
 function ring(x,y,z,ro,ri,c){const m=mesh(new T.RingGeometry(ri,ro,48),c,x,y,z);m.rotation.x=-Math.PI/2;return m}
 function header(n,z,y=1.4){box(0,y+1,z,n*2.54,2,2.5,black,.25);for(let i=0;i<n;i++)box((i-(n-1)/2)*2.54,y+1,z,.63,8,.63,gold)}
 function smd(x,z){box(x,2,z,3,1.1,1.55,black);for(const dx of [-1.15,1.15])box(x+dx,2.05,z,.65,1.2,1.6,metal)}
 function wire(colors,from,to){colors.forEach((c,i)=>{const dx=(i-(colors.length-1)/2)*1.3;tube([[from[0]+dx,from[1],from[2]],[from[0]+dx,from[1]-.4,from[2]+4],[to[0]+dx,to[1],to[2]-4],[to[0]+dx,to[1],to[2]]],.57,c)})}
 if(id==='hc-sr04'){
  plate(45,20);header(4,8);smd(0,-4);smd(0,1);
  for(const x of [-12.5,12.5]){cyl(x,7.1,-.3,8,11.4,metal);cyl(x,12.87,-.3,6.95,.12,black);
   for(let i=-6;i<=6;i++){const l=2*Math.sqrt(47-i*i);box(x+i,13,-.3,.16,.18,l,metal);box(x,13.05,i-.3,l,.18,.16,metal)}
   ring(x,13.15,-.3,8,6.9,metal)}
 }else if(id==='ldr'){
  cyl(0,.8,0,5,1.6,0xce9663);const pts=[];
  for(let i=0;i<7;i++){const z=i-3,w=Math.sqrt(17-z*z);pts.push([i%2?w:-w,.0,z],[i%2?-w:w,0,z])}
  for(let i=1;i<pts.length;i++)tube([pts[i-1],pts[i]].map(([x,y,z])=>[x,1.65,z]),.19,0x9d422d);
  for(const x of [-2,2])tube([[x,0,1],[x,-1,4],[x,-1,15]],.25,metal);
 }else if(id==='soil'){
  path([[-6,-16],[6,-16],[7,-11],[7,13],[4.6,19],[2.4,13],[2.4,-4],[-2.4,-4],[-2.4,13],[-4.6,19],[-7,13],[-7,-11]],1.3,green);
  for(const x of [-4.7,4.7]){box(x,1.38,4.5,.8,.14,21,gold);for(let z=-5;z<14;z+=1.7)box(x,1.4,z,3.6,.16,.7,gold)}
  header(2,-12);
 }else if(id==='mq2'){
  plate(22,33);header(4,14);smd(-6,8);box(4,3.8,8,5.4,4.8,5,0x267cc1);cyl(4,6.4,8,1.5,.7,metal);
  cyl(0,3.1,-3,9.3,3.3,black);cyl(0,9,-3,8.7,9,0x525a60);
  for(let i=0;i<48;i++){let t=i*Math.PI/24;cyl(8.72*Math.cos(t),9,-3+8.72*Math.sin(t),.14,8.8,metal,6)}
  for(let y=5;y<14;y+=1.1){const m=mesh(new T.TorusGeometry(8.7,.15,6,50),metal,0,y,-3);m.rotation.x=Math.PI/2}
  for(let i=-8;i<=8;i++){const l=2*Math.sqrt(75-i*i);box(i,13.58,-3,.23,.16,l,metal);box(0,13.6,-3+i,l,.16,.23,metal)}
  ring(0,13.8,-3,8.9,8,metal);
 }else if(id==='ds18b20'){
  cyl(0,0,-7,3,25,metal).rotation.x=Math.PI/2;cyl(0,0,7,3.05,5,black).rotation.x=Math.PI/2;
  tube([[0,0,9],[0,0,14],[2,.3,20],[5,0,28]],1.7,black);
  wire([0xc44541,0xe7b343,black],[5,0,28],[7,0,37]);
 }else if(id==='pot'){
  cyl(0,3,0,8,6,metal);cyl(0,.15,0,8.2,1.2,0x815035);cyl(0,7,0,4.4,2,metal,6);cyl(0,12,0,2.9,9,metal,18);
  for(let i=0;i<16;i++){let a=i*Math.PI/8;cyl(2.9*Math.cos(a),13,2.9*Math.sin(a),.24,7,metal,6)}
  box(0,16.55,0,.55,.1,5,black);for(let x of [-4,0,4])box(x,.2,8.6,1.1,.55,6,metal);
 }else if(id==='tilt'){
  plate(14,23,green,1);header(3,9);smd(3,2);
  tube([[-2,1.4,2],[-2,3,2],[-2,5,0]],.35,metal);
  const shell=cyl(-2,6.4,-3,3,12,metal);shell.rotation.x=-.92;
  cyl(-2,3.2,1.4,3.1,1.6,black).rotation.x=-.92;
 }else if(id==='button'){
  box(0,1.6,0,6,3.2,6,black,.35);box(0,3.35,0,5.9,.4,5.9,metal,.3);cyl(0,4.25,0,1.85,1.6,black);
  for(let x of [-2.2,2.2])for(let z of [-2.2,2.2]){cyl(x,3.6,z,.43,.25,black);const s=Math.sign(x);tube([[x,1,z],[3.45*s,1,z],[3.6*s,-1,z],[3.6*s,-2,z]],.23,metal)}
 }else if(id==='buzzer'){
  cyl(0,3.7,0,6,7.4,black);cyl(0,.5,0,6.3,1,black);ring(0,7.47,0,5.8,1.3,0x333944);cyl(0,7.42,0,1.3,.03,0x090b0e);
  for(const x of [-2.5,2.5])cyl(x,-2.5,0,.28,x<0?5:7,metal);box(-3.5,7.52,0,1.4,.12,.32,white);box(-3.5,7.52,0,.32,.12,1.4,white);
 }else if(id==='sg90'){
  box(0,10,0,12,20,23,0x2161ad,1);box(0,15,0,12.5,2,32,0x3776bd,.7);for(const z of [-14,14])cyl(0,16.05,z,1.1,.12,black);
  cyl(0,21.3,-5,5.6,3.8,0x24599d);cyl(0,22,1,3.8,3,0x24599d);cyl(0,24,-5,2.7,3,white);
  box(0,25.8,-1,3.7,1.8,21,white,.8);cyl(0,26.8,-5,1.35,.4,metal);
  for(let z of [-9,-7,0,2,4,6])cyl(0,26.72,z,.47,.09,black);
  wire([0x754232,0xc63b35,0xf5a13b],[0,4,11],[8,1,26]);box(8,1,28,5.5,3.5,6,black,.4);
 }else if(id==='oled'){
  plate(28,27);header(4,-10);box(0,2.5,2,25,2,18,black,.6);box(0,3.55,2,21.8,.18,11.3,0x152c38,.4);
  for(let i=0;i<12;i++){const h=1.4+3*(.5+.5*Math.sin(i*.68));box(-8+i*1.45,3.67,4-h/2,.85,.06,h,0x71d8df)}
  box(0,1.78,11.6,9,.45,3.8,0xb4692e);for(let i=-3;i<=3;i++)box(i,2.03,11.8,.32,.12,3.2,gold);
 }else if(id==='neopixel'){
  plate(58,9,black,.85);for(let i=0;i<6;i++){const x=-20+i*8;box(x,2.2,0,5,1.6,5,white,.35);cyl(x,3.04,0,1.85,.15,0xe3dfbf);for(const [j,c] of [0xc87570,0x8ba48c,0x819fc1].entries())box(x-.65+j*.65,3.15,0,.38,.1,.52,c)}
  for(const x of [-27,27])for(const z of [-2.4,0,2.4])box(x,1.5,z,1.9,.15,1.3,gold);
 }else if(id==='dc'){
  box(0,0,0,15,20,24,metal,5.5);box(0,0,12,14.8,19.7,4.8,0xf0e6c8,2);
  cyl(0,0,-13,4,3.5,metal).rotation.x=Math.PI/2;cyl(0,0,-18,1,9,metal).rotation.x=Math.PI/2;
  for(const x of [-4,4]){box(x,7.3,14.5,2,.7,5,gold);box(x,9.84,-4,1.9,.2,6,black,.2)}
 }else if(id==='fan'){
  const holes=[[0,0,16.8],...[-15.8,15.8].flatMap(x=>[-15.8,15.8].map(z=>[x,z,1.55]))];
  path([[-18,-20],[18,-20],[20,-18],[20,18],[18,20],[-18,20],[-20,18],[-20,-18]],8,black,0,holes);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;box(9*Math.cos(a),1,9*Math.sin(a),19,1.6,2,black).rotation.y=-a}
  cyl(0,4,0,6.5,6.3,0x303640);cyl(0,7.22,0,3.9,.2,0x465466);
  for(let i=0;i<7;i++){const blade=path([[4,0],[7,-2],[12,-2.6],[15,-1],[16,2],[15,5],[12,7],[10,4],[7,3],[4,3]],1.35,0x39434d,4);blade.rotation.y=i*2*Math.PI/7;blade.rotateX(.18)}
  wire([black,0xc4423e],[17,2,15],[20,0,29]);
 }
 // GLB coordinates are metres. Model construction uses approximate millimetres.
 addPinLabels(g,id);
 g.scale.setScalar(.001);return g;
}
