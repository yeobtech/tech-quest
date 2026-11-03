import * as T from 'three';

// Proportions and front silkscreen follow the supplied Yurobot reference photograph.
export function createDht11(x,z) {
  const group=new T.Group();
  group.position.set(x,0,z);
  const material=color=>new T.MeshStandardMaterial({color});
  const pcb=material(0x171b20),blue=material(0x229ae4),gold=material(0xf3c654),silver=material(0xc1c6c8);
  function box(x,y,z,w,h,d,mat){
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;
  }
  function plate(shape,height,y,mat){
    const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:12}),mat);
    mesh.rotation.x=-Math.PI/2;mesh.position.y=y;group.add(mesh);
  }
  function rounded(left,bottom,w,h,r){
    const s=new T.Shape(),right=left+w,top=bottom+h;
    s.moveTo(left+r,bottom);s.lineTo(right-r,bottom);s.quadraticCurveTo(right,bottom,right,bottom+r);
    s.lineTo(right,top-r);s.quadraticCurveTo(right,top,right-r,top);s.lineTo(left+r,top);
    s.quadraticCurveTo(left,top,left,top-r);s.lineTo(left,bottom+r);s.quadraticCurveTo(left,bottom,left+r,bottom);return s;
  }
  const outline=rounded(-11,-7.5,22,15,1.5);
  for(const zz of [-5.5,5.5]){
    const hole=new T.Path();hole.absarc(8.8,-zz,1.18,0,Math.PI*2,true);outline.holes.push(hole);
    const rim=new T.Mesh(new T.RingGeometry(1.18,1.48,32),silver);rim.rotation.x=-Math.PI/2;rim.position.set(8.8,.83,zz);group.add(rim);
  }
  plate(outline,.8,0,pcb);
  box(-4.5,2.05,0,11.7,2.5,9.4,blue);
  box(-4.5,3.36,0,11.25,.14,8.95,material(0x104771));
  const grille=rounded(-10.4,-4.8,11.8,9.6,.36);
  for(let row=0;row<4;row++)for(let col=0;col<6;col++)
    grille.holes.push(rounded(-9.8+col*1.85,-3.95+row*2.05,1.05,1.22,.08));
  plate(grille,.7,3.75,blue);
  for(const zz of [-3,-1,1,3])box(1.95,1.06,zz,1.15,.42,.46,silver);
  for(const zz of [4.2,5.45]){box(3.5,1,zz,1.65,.38,.7,silver);box(3.5,1.18,zz,.9,.25,.74,pcb)}
  function print(text,x,z,w,d){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
    const ctx=canvas.getContext('2d');ctx.font='bold 48px monospace';ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,32,250);
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
    const mesh=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.84,z);group.add(mesh);
  }
  print('DHT11 Sensor',-5,-6.1,10.2,1.6);print('YUROBOT',-5,6.15,8.6,1.65);
  const contacts={};
  ['DATA','VCC','GND'].forEach((key,i)=>{
    const zz=(i-1)*2.54;
    print(key==='DATA'?'DAT':key,5.85,zz,3.15,1.2);
    box(9.25,1.78,zz,2.65,1.96,2.4,pcb);
    const pin=box(12.35,1.82,zz,4.8,.44,.48,gold);
    pin.userData.id='S:'+key;
    pin.userData.anchor=new T.Vector3(2.34,0,0);
    contacts[key]=pin;
  });
  return {group,contacts};
}
export function terminalPoint(mesh){return mesh.localToWorld(mesh.userData.anchor?.clone()??new T.Vector3())}

export const boardContacts={
  GND:[-8.6,4.8,-5], '3V3':[-8.6,4.8,-2.46], GPIO4:[-8.6,4.8,2.62], '5V':[-6+4*2.54,4.8,24]
};
export function createBoardContacts(scene,positions){
  return Object.entries(positions).map(([key,pos])=>{
    const color=key==='GND'?0x99aebc:key.endsWith('V')||key==='3V3'?0xef736d:0xffcc68;
    const pin=new T.Mesh(new T.SphereGeometry(.82,10,8),new T.MeshBasicMaterial({color}));
    pin.position.set(...pos);pin.userData.id='B:'+key;scene.add(pin);return pin;
  });
}
