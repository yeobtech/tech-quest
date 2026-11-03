import {installPalette} from './components/palette.js';
import {createBoardContacts,boardContacts,terminalPoint} from './dht11.js';
import { setupViewer } from './viewer.js';
import * as T from 'three';
import { mountMission } from './mission.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const $=id=>document.getElementById(id), scene=new T.Scene(), canvas=document.querySelector('canvas');
const renderer=new T.WebGLRenderer({canvas,antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2));scene.background=new T.Color(0xe6eee8);
const cam=new T.PerspectiveCamera(35,1,1,400), orbit=new OrbitControls(cam,canvas); orbit.enablePan=false;orbit.minDistance=38;orbit.maxDistance=200;
scene.add(new T.HemisphereLight(0xffffff,0xb5bdb7,2));const lamp=new T.DirectionalLight(0xffffff,2);lamp.position.set(-30,60,20);scene.add(lamp);
const categories=[], hits=[];let current=null;
function part(name,type,gpio,volts,use){current={name,type,gpio,volts,use,objects:[]};categories.push(current);return current}
function block(x,z,w,d,h,color,y=h/2){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color}));m.position.set(x,y,z);scene.add(m);if(current){current.objects.push(m);m.userData.part=current;hits.push(m)}return m}
function label(str,x,z,w,y=0.15){const c=document.createElement('canvas');c.width=512;c.height=64;const g=c.getContext('2d');g.fillStyle='#ffe287';g.font='bold 47px sans-serif';g.textAlign='center';g.fillText(str,256,49);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,w/8),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);scene.add(m)}
const gray=0xbac4ca,black=0x232829,yellow=0xffbc30,red=0xb73b39,blue=0x217bb1,unknown='소켓별 GPIO 미확정',io='신호 3.3 V',port='소자 연결',built='보드 기능';
block(0,0,69,54,1.4,0x202828,-.7);label('keyestudio S3 Pro',20,-10,25);label('I2C BUS',-1,-5,11);label('POWER',1,19,10);label('ANALOG',21,19,11);label('DIGITAL',7,-22,13);
function row(x,z,n,c,vertical=false,female=false){for(let i=0;i<n;i++){const a=x+(vertical?0:i*2.54),b=z+(vertical?i*2.54:0);block(a,b,2.5,2.5,female?4:1.7,c);block(a,b,female?1:.63,female?1:.63,female?.12:2.8,female?black:gray,female?4.06:3.1)}}
for(const [x,z] of [[-20,-24],[-20,24],[31.7,-10],[32,18]]){const pad=new T.Mesh(new T.RingGeometry(.95,1.55,32),new T.MeshStandardMaterial({color:0xb49559}));pad.rotation.x=-Math.PI/2;pad.position.set(x,.04,z);scene.add(pad)}
function contact(group, role, color, x, z, gpio, rail) {
  const signal = !['G','V'].includes(role);
  const voltage = role==='G'?'0 V':role==='V'?rail:io;
  const purpose = {S:'센서 신호',SCL:'I²C 클록',SDA:'I²C 데이터',V:'센서 전원',G:'공통 접지'}[role];
  part(group+' · '+role,port,signal?gpio:'해당 없음',voltage,purpose);
  row(x,z,1,color);
}
const digital=[12,13,11,10,48,47,42,41,40,38,21];
part('DIGITAL 상단 암헤더',port,unknown,io,'디지털 점퍼 연결');row(-15,-25,10,yellow,false,true);row(12.5,-25,8,yellow,false,true);
const loc={};
digital.forEach((pin,i)=>{
  const x=i<6?-4.7+i*2.54:12.6+(i-6)*2.54;
  loc[pin]=x;
  ['S','V','G'].forEach((role,j)=>contact('DIGITAL · IO'+pin,role,[yellow,red,black][j],x,-19+j*2.54,'GPIO '+pin,'V 레일 · 설정 확인'));
});
for(let i=0;i<3;i++){
  ['SCL','SDA','V','G'].forEach((role,j)=>contact('I2C BUS '+(i+1)+'열',role,[0xe1ded6,yellow,red,black][j],-4.5+i*2.54,-2+j*2.54,unknown,'V 레일 · 설정 확인'));
}
part('I2C BUS 암헤더',port,unknown,io,'SCL / SDA / V / G');
row(3.4,-2,4,yellow,true,true);
for(let i=0;i<4;i++){
  ['G','V','S'].forEach((role,j)=>contact('ANALOG '+(i+1)+'행',role,[black,red,yellow][j],-4.5+j*2.54,9+i*2.54,['GPIO19','GPIO14','GPIO3','GPIO2'][i],'3.3 V'));
}
for(const [name,z] of [['I2C 왼쪽',-5],['ANALOG 왼쪽',9]]){
  const names=name==='I2C 왼쪽'?['GND','3V3','GPIO6','GPIO4','GPIO5']:['GND','3V3','GPIO15','GPIO16','GPIO7'];
  names.forEach((pin,i)=>{
    part('파란 핀열 · '+name+' · '+pin,port,pin.startsWith('GPIO')?pin:'해당 없음',pin==='GND'?'0 V':'3.3 V',pin==='GND'?'공통 접지':pin==='3V3'?'센서 전원':'디지털 신호 단자');
    row(-8.6,z+i*2.54,1,blue);
  });
}
part('POWER 암헤더','전원 연결','해당 없음','3.3 V / 5 V(V) / GND / VIN','전원 및 공통 접지. VIN은 입력입니다. 개별 소켓은 실크 확인.');row(-6,24,8,yellow,false,true);
part('하단 ANALOG 암헤더',port,unknown,io,'왼쪽부터 IO2, IO3, IO14, IO19, IO8/SDA, IO9/SCL.');row(17,24,6,yellow,false,true);
const uartRoles=['V','G','RX','TX'];
const uartUses={V:'모듈 전원',G:'공통 접지',RX:'데이터 수신',TX:'데이터 송신'};
uartRoles.forEach((role,i)=>{
  const signal=role==='RX'||role==='TX';
  part('UART · '+role,'통신 연결',signal?unknown:'해당 없음',signal?io:role==='G'?'0 V':'전원 전압 미확정',uartUses[role]);
  row(29,-20+i*2.54,1,blue);
});
part('TFT','화면 연결',unknown,io+' · V 레일 확인','전용 디스플레이 확장.');row(10,-8,8,yellow,false,true);
label('USB PROG',-28,-19.7,10);label('OTG',-29,-7.5,6);for(const [name,z,g,use] of [['USB PROG',-14,'미확정','PC에서 코드를 올릴 때 USB-C 데이터 케이블을 꽂는 위쪽 단자'],['USB OTG',-2,'GPIO20 D+ / GPIO19 D−','아래쪽 USB-C 단자 · USB OTG 실습용']]){part(name,built,g,'USB VBUS 5 V',use);block(-31,z,8,8,3,gray);block(-35.1,z,.3,6,1.7,black,1.6)}
part('DC 잭',built,'해당 없음','DC 7–12 V','외부 전원 입력');block(-28,16,13,10,8,black);block(-34.6,16,.25,6,5,0x101112,4);
part('ESP32-S3-WROOM-1',built,'여러 GPIO','3.3 V','메인 모듈 및 PCB 안테나');block(22,7,25,17,1.3,black);block(19,7,18,16,2.4,gray,2.3);label('ESP32-S3',19,7,16,3.53);
part('MicroSD · 뒷면',built,'CS 39 / MOSI 35 / SCK 37 / MISO 36','3.3 V','SD 저장장치 · 뒷면에서 확인');block(-24,-12,13,11,2,gray,-2.4);
for(const [name,x,g] of [['RESET',-31,'EN'],['BOOT',-26,'GPIO0']]){part(name,built,g,'3.3 V 로직',name==='BOOT'?'부팅 모드 선택':'재시작');block(x,-23,3.7,4.4,1.3,gray);block(x,-23,2.5,3,1.2,0xf3efe3,1.8)}
const legend=document.createElement('details');legend.open=false;
legend.innerHTML='<summary><b>핀 번호표</b></summary><p>숫자는 GPIO 번호입니다. 가로 핀열은 왼쪽부터, 세로 핀열은 위에서부터 읽으세요. ?는 미확정입니다.</p>';
document.querySelector('aside').append(legend);
function strip(name,values,x,z,vertical=false,dx=0,dz=0){
  const line=document.createElement('div');line.style.marginBottom='7px';
  line.innerHTML='<b>'+name+'</b><br>'+values.join(' · ');legend.append(line);
  values.forEach((value,i)=>{
    const c=document.createElement('canvas');c.width=128;c.height=80;const g=c.getContext('2d');
    g.fillStyle='#12251f';g.fillRect(0,0,128,80);g.fillStyle='#ffea91';g.textAlign='center';g.textBaseline='middle';g.font='bold 62px sans-serif';g.fillText(value,64,41,122);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    const badge=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true}));
    badge.position.set(x+(vertical?0:i*2.54)+dx,5.5,z+(vertical?i*2.54:0)+dz);badge.scale.set(2.47,1.65,1);badge.userData.pinLabel=true;badge.visible=document.getElementById("labels").checked;scene.add(badge);
  });
}
strip('DIGITAL 상단 왼쪽',['SCL','SDA','V','G',...digital.slice(0,6)],-15,-25,false,0,-1.7);
strip('DIGITAL 상단 오른쪽',[...digital.slice(6),20,'TX','RX'],12.5,-25,false,0,-1.7);
strip('DIGITAL S/V/G 왼쪽',digital.slice(0,6),-4.7,-19,false,0,0.2);
strip('DIGITAL S/V/G 오른쪽',digital.slice(6),12.6,-19,false,0,0.2);
strip('파란 핀열 위',['G','3V3',6,4,5],-8.6,-5,true,-2.4);
strip('파란 핀열 아래',['G','3V3',15,16,7],-8.6,9,true,-2.4);
strip('I2C BUS',['SCL','SDA','V','G'],3.4,-2,true,2);
strip('좌측 ANALOG',[19,14,3,2],0.58,9,true,2.6);
strip('POWER',['NC','V','RST','3V3','V','G','G','VIN'],-6,24,false,0,-1.8);
strip('하단 ANALOG',[2,3,14,19,'8/SDA','9/SCL'],17,24,false,0,-1.8);
strip('TFT',['G','V',20,21,38,40,41,42],10,-8,false,0,-1.8);
strip('UART',uartRoles,29,-20,true,2);
const select=$('parts');
categories.forEach((part,index)=>select.add(new Option(part.name,index)));
const reserved={1:'INA180',19:'USB OTG',20:'USB OTG',35:'MicroSD',36:'MicroSD',37:'MicroSD',39:'MicroSD',45:'RGB LED'};
const wiring=new T.Group();scene.add(wiring);
function wire(start,end,color,label,sideExit=false){
  const mid=start.clone().lerp(end,.5);mid.y=11;
  const points=sideExit?[start,start.clone().add(new T.Vector3(3,0,0)),mid,end]:[start,mid,end];
  const curve=new T.CatmullRomCurve3(points);
  const mesh=new T.Mesh(new T.TubeGeometry(curve,32,.23,6,false),new T.MeshStandardMaterial({color}));
  mesh.userData.cable={label,points:curve.getPoints(32)};
  wiring.add(mesh);
}
current=null;
const inMission=new URLSearchParams(location.search).get('mode')==='observatory';
const palette=inMission?null:installPalette({scene,cam,canvas,onPartsChange:refresh});
const freePositions={...boardContacts};
for(const [gpio,x] of Object.entries(loc))freePositions['GPIO'+gpio]=[x,4.6,-19];
const freeBoard=inMission?[]:createBoardContacts(scene,freePositions);
const freeTargets=[];
const partWires=new Map();
let partPins=[];
let pending='';
const directHint=document.createElement('p');directHint.setAttribute('role','status');$('levelShift').after(directHint);
const pinButtons=document.createElement('details');
pinButtons.innerHTML='<summary>접점 버튼으로 연결</summary>';
for(const [prefix,names] of [['S',['DATA','VCC','GND']],['B',Object.keys(freePositions)]]){
  const row=document.createElement('p');row.append(prefix==='S'?'DHT11 ':'KS5034 ');
  for(const name of names){
    const button=document.createElement('button');button.textContent=name==='DATA'?'DAT':name;
    button.onclick=()=>directPin(prefix==='S'?'S:dht11/'+['DATA','VCC','GND'].indexOf(name):'B:'+name);row.append(button);
  }
  pinButtons.append(row);
}
directHint.after(pinButtons);
function directPin(id,start){
  if(start)pending=start;
  if(!pending||pending[0]===id[0])pending=pending===id?'':id;
  else {
    const board=id.startsWith('B:')?id:pending;
    const sensor=id.startsWith('S:')?id:pending;
    const socket=partPins.find(o=>o.userData.id===sensor);
    if(!socket){pending='';return}
    partWires.set(sensor,board.slice(2));
    pending='';refresh();
  }
  directHint.textContent=pending?'● 선택됨 · '+pending.slice(2)+' — 반대쪽 접점을 누르세요.':'부품의 핀 또는 핀 이름표를 보드 접점까지 끌어 놓으세요.';
}
const list=document.createElement('div');
list.id='connections';
$('status').before(list);
function refresh(){
  for(const mesh of [...wiring.children]){
    wiring.remove(mesh);mesh.geometry.dispose();mesh.material.map?.dispose();mesh.material.dispose();
  }
  list.replaceChildren();
  const messages=[],used=new Map();
  let connected=0,total=0;
  const contacts=palette?.contacts()??[];
  partPins=contacts.filter(o=>!o.userData.contact);
  freeTargets.splice(0,freeTargets.length,...freeBoard,...contacts);
  const live=new Set(partPins.map(o=>o.userData.id));
  for(const address of partWires.keys())if(!live.has(address))partWires.delete(address);
  if(pending.includes('/')&&!live.has(pending))pending='';
  freeBoard.forEach(pin=>{pin.visible=partPins.length>0});
  pinButtons.hidden=!partPins.some(p=>p.userData.component==='dht11');
  const hasSonar=partPins.some(p=>p.userData.component==='hc-sr04');
  $('levelShift').hidden=!hasSonar;
  if(!hasSonar)$('shift').checked=false;
  let studyLeads=0,studyPins=0;
  for(const socket of partPins){
    const {id,component,componentName,pin}=socket.userData;
    const sonar=component==='hc-sr04',dht=component==='dht11';
    const end=partWires.get(id);
    if(!sonar&&!dht)studyPins++;
    total++;
    if(!end&&!sonar&&!dht)continue;
    const label=componentName+' '+pin.label+' → '+(end?'KS5034 '+end:'미연결');
    const row=document.createElement('div');row.textContent=label+' ';list.append(row);
    if(!end){messages.push(componentName+' '+pin.label+' 미연결');continue}
    connected++;
    const color=pin.role==='g'?black:pin.role==='v'?red:0x1d9876;
    wire(terminalPoint(socket),new T.Vector3(...freePositions[end]),color,label,dht);
    const remove=document.createElement('button');remove.textContent='삭제';
    remove.onclick=()=>{partWires.delete(id);refresh()};row.append(remove);
    if(!sonar&&!dht){studyLeads++;continue}
    if(pin.role==='s'){
      const gpio=Number(end.slice(4));
      if(!end.startsWith('GPIO'))messages.push(pin.label+'에는 GPIO를 선택하세요.');
      else if(reserved[gpio]||used.has(gpio))messages.push(end+' 충돌 · 다른 GPIO를 선택하세요.');
      used.set(gpio,pin.label);
    }else if(end!==(pin.role==='g'?'GND':sonar?'5V':'3V3'))messages.push(label+' 전원 배선을 확인하세요.');
  }
  if(hasSonar&&!$('shift').checked)messages.push('5 V ECHO 직결 위험 · ESP32 입력 전에 3.3 V로 변환하세요.');
  const heading=document.createElement('h2');heading.textContent='연결 목록 · '+connected+' / '+total;list.prepend(heading);
  $('status').className=messages.length?'bad':'';
  $('status').textContent=messages.length?'⚠ '+messages.join('\n'):!connected?(total?'연결된 선이 없습니다. 부품 단자를 보드 접점까지 끌어 놓으세요.':'부품을 배치하고 핀을 연결하세요.'):studyPins?'일반 소자 연결 '+studyLeads+' / '+studyPins+' · 일반 소자의 전기적 동작은 검증되지 않습니다.':'✓ 가상 배선 검사 통과';
}
$('shift').onchange=refresh;
refresh();
$('clearWires').onclick=()=>{pending='';directHint.textContent='';partWires.clear();refresh()};
const missionTargets=new URLSearchParams(location.search).get('mode')==='observatory'
  ? mountMission({T,scene,wire,wiring,cam,orbit}) : null;
setupViewer({T,scene,wiring,cam,orbit,renderer,canvas,categories,hits,missionTargets,freeTargets,onFreePin:directPin});
