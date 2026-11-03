import * as T from 'three';
const names={v:'전원',g:'접지',s:'신호',n:'미연결',c:'접점'};
const colors={v:'#b93434',g:'#263446',s:'#176945',n:'#687384',c:'#68459a'};
const pin=(label,role,detail,x,y,z)=>({label,role,detail,x,y,z});
const header=(z,labels)=>labels.map(([name,role,detail],i)=>pin(name,role,detail,(i-(labels.length-1)/2)*2.54,6.4,z));
const v=['VCC','v','전원 +'],g=['GND','g','공통 접지'];
export const pins={
 dht11:[['DATA','s','온습도 신호'],v,g].map(([label,role,detail],i)=>pin(label,role,detail,14.69,1.82,(i-1)*2.54)),
 'hc-sr04':header(8,[v,['Trig','s','보드 → 센서 · 측정 시작'],['Echo','s','센서 → 보드 · 반사 시간'],g]),
 ldr:[pin('A','c','광저항 한쪽 다리',-2,-1,15),pin('B','c','다른 다리 · 극성 없음',2,-1,15)],
 soil:header(-12,[['E1','c','측정 회로에 연결하는 전극 1'],['E2','c','측정 회로에 연결하는 전극 2']]),
 mq2:header(14,[v,g,['D0','s','기준 농도 초과 여부'],['A0','s','가스 감지 아날로그 출력']]),
 ds18b20:[pin('VCC','v','이 모델의 빨간 선',5.7,0,37),pin('DQ','s','노란 선 · 온도 데이터',7,0,37),pin('GND','g','검은 선',8.3,0,37)],
 pot:[pin('VCC','v','분압 예시 · 바깥 단자',-4,.2,11.6),pin('OUT','s','가운데 가동 접점 · 아날로그 입력으로',0,.2,11.6),pin('GND','g','분압 예시 · 반대쪽 바깥 단자',4,.2,11.6)],
 tilt:header(9,[g,v,['OUT','s','기울기 상태 출력']]),
 button:[pin('A1','c','접점 A',-3.6,-2,-2.2),pin('B1','c','접점 B',3.6,-2,-2.2),pin('A2','c','A1과 내부 연결',-3.6,-2,2.2),pin('B2','c','B1과 내부 연결',3.6,-2,2.2)],
 buzzer:[pin('+','v','몸체의 + 표시 쪽',-2.5,-5,0),pin('−','g','음극',2.5,-6,0)],
 sg90:[pin('GND','g','갈색 선',6.7,1,25),pin('VCC','v','빨간 선',8,1,25),pin('PWM','s','주황 선 · 각도 제어',9.3,1,25)],
 oled:header(-10,[g,v,['SCL','s','I²C 클록'],['SDA','s','I²C 데이터']]),
 neopixel:[-27,27].flatMap(x=>[pin('VCC','v','전원 +',x,1.6,-2.4),pin(x<0?'DIN':'DOUT','s',x<0?'보드에서 들어오는 데이터':'다음 LED로 나가는 데이터',x,1.6,0),pin('GND','g','공통 접지',x,1.6,2.4)]),
 dc:[pin('M1','c','모터 드라이버 출력 1',-4,7.3,17),pin('M2','c','모터 드라이버 출력 2',4,7.3,17)],
 fan:[pin('GND','g','검은 선',19.35,0,29),pin('VCC','v','빨간 선 · 팬 정격 전원',20.65,0,29)]
};
export const notes={
 'hc-sr04':'일반 5V형의 Echo를 3.3V 입력으로 받을 때는 분압이나 레벨 변환이 필요해요.',
 ldr:'두 다리에는 극성이 없어요. 저항과 짝지어 만든 분압점에서 밝기를 읽어요.',
 soil:'이 부품은 두 전극만 있는 탐침이에요. 전원과 신호 단자는 별도 측정 모듈에 있어요.',
 button:'이 모델에서는 같은 글자끼리 항상 연결돼요. 누르면 A와 B가 이어져요. 실물은 도통 검사로 짝을 확인하세요.',
 pot:'양 끝을 서로 바꾸면 돌렸을 때 값이 커지는 방향도 바뀌어요.',
 buzzer:'이 2핀 능동 부저에는 별도의 신호선이 없어요.',
 dc:'전용 신호선은 없어요. 드라이버로 제어하며 두 단자의 극성을 바꾸면 회전 방향이 바뀌어요.',
 fan:'이 2선식 팬은 전원 두 가닥을 사용해요. 속도 신호선은 없어요.'
};
export function pinDescription(p){return names[p.role]+' · '+p.detail}
export function addPinLabels(group,id){
 const size=new T.Box3().setFromObject(group),extent=size.getSize(new T.Vector3());
 const unit=Math.max(extent.x,extent.y,extent.z)*.18;
 const marks=new T.Group();marks.name='Terminal labels';group.add(marks);
 const list=pins[id];
 list.forEach((p,i)=>{
  const at=new T.Vector3(p.x,p.y,p.z);
  const rear=id==='soil'||id==='oled'||(id==='button'&&i<2);
  const row=id==='button'?2:list.length;
  const end=new T.Vector3((i%row-(row-1)/2)*unit*1.28,p.y+unit*.35,rear?size.min.z-unit*1.1:size.max.z+unit*1.1);
  if(id==='neopixel'){end.x=p.x+(p.x<0?-1:1)*unit*1.15;end.z=(i%3-1)*unit*.76}
  const color=colors[p.role],mat=new T.MeshBasicMaterial({color});
  const dot=new T.Mesh(new T.SphereGeometry(unit*.085,12,8),mat);dot.position.copy(at);
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=80;const ctx=canvas.getContext('2d');
  ctx.fillStyle=color;ctx.fillRect(0,0,192,80);ctx.fillStyle='white';ctx.font='bold 54px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.label,96,42,180);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const tag=new T.Mesh(new T.PlaneGeometry(unit*1.17,unit*.5),new T.MeshBasicMaterial({map,side:T.DoubleSide}));
  tag.position.copy(end);tag.rotation.x=-Math.PI*.40;tag.name=p.label;tag.userData={role:names[p.role],description:p.detail};
  group.add(dot); // The physical contact remains pickable with the label overlay hidden.
  if(p.role!=='n'){
    const address='S:'+id+'/'+i;
    dot.userData={id:address,pin:p,component:id};
    tag.userData={...dot.userData,contact:dot};
  }
  marks.add(tag);
 });
}
