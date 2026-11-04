import Phaser from 'phaser';
import {FACTORY,floors,floorY,factoryLadders,traps,ferry,switchX,exitX,checkpoint} from '../data/factory';

export function buildFactory(s:Phaser.Scene){
  s.cameras.main.setBackgroundColor('#101328');
  const layer=(depth:number,scroll=1)=>s.add.graphics().setDepth(depth).setScrollFactor(1,scroll);
  const glow=layer(-9,.55),wall=layer(-8,.8),pipes=layer(-7,.92),machines=layer(-5),deck=layer(0),front=layer(9);
  for(let x=0;x<1280;x+=96){
    glow.fillStyle(0x2c3055).fillRect(x,40+(x%5)*28,62,1420);
    for(let y=80;y<1500;y+=64)glow.fillStyle(0x485273).fillRect(x+8,y,22,4);
  }
  for(let y=0;y<1520;y+=120)for(let x=0;x<1280;x+=160){
    wall.fillStyle(0x212139).fillRect(x+4,y+4,146,108);
    wall.fillStyle(0x37334d).fillRect(x+6,y+6,142,3);
    wall.fillStyle(0x45405b).fillRect(x+12,y+13,4,4);
    pipes.fillStyle(0x35324d).fillRect(x+64,y,12,120).fillRect(x+60,y+42,20,8);
  }
  const label=(x:number,y:number,t:string)=>s.add.text(x,y,t,{fontFamily:'monospace',fontSize:'17px',color:'#ffe3ab',backgroundColor:'#252139',padding:{x:7,y:4}}).setOrigin(.5,1).setDepth(4);
  floors.forEach((name,i)=>{
    const y=floorY(i);
    label(i%2?958:315,y-88,(i+1)+'F  '+name+(i%2?'  ◀':'  ▶'));
    for(let x=120;x<1260;x+=240){
      machines.fillStyle(0x39354b).fillRect(x,y-78,90,72);
      machines.fillStyle(0x22263d).fillCircle(x+28,y-42,21);
      machines.lineStyle(4,0x53506a).strokeCircle(x+28,y-42,15);
      for(let j=0;j<3;j++)machines.fillStyle(0x666079).fillRect(x+59,y-60+j*9,18,3);
      machines.fillStyle(0xff9d4c).fillRect(x+72,y-84,8,6);
    }
    // Each floor has a landmark behind the walkable silhouette.
    if(i===0){
      machines.fillStyle(0x282d42).fillRect(150,y-146,158,146);
      for(let dy=16;dy<140;dy+=12)machines.fillStyle(0x414154).fillRect(157,y-dy,144,3);
    }else if(i===1){
      machines.fillStyle(0x464257).fillRect(340,y-60,570,28);
      for(let x=360;x<900;x+=32)machines.fillStyle(0x282c42).fillCircle(x,y-47,9);
    }else if(i===2){
      for(let dy=70;dy<=120;dy+=25){
        machines.fillStyle(0x54526b).fillRect(290,y-dy,650,9);
        for(let x=305;x<930;x+=78)machines.fillStyle(0x68637b).fillRect(x,y-dy-3,6,15);
      }
    }else if(i===3){
      for(let x=340;x<1000;x+=160)machines.fillStyle(0x675971).fillRect(x,y-147,64,7).fillRect(x+27,y-165,9,18);
    }else if(i===4){
      for(let x=490;x<890;x+=120){
        machines.fillStyle(0x43394f).fillRect(x,y-95,54,80);
        for(let dy=30;dy<88;dy+=10)machines.fillStyle(0x795775).fillRect(x+9,y-dy,36,4);
      }
    }else{
      machines.fillStyle(0x32384e).fillRect(308,y-125,230,109);
      for(let x=320;x<520;x+=72){
        machines.fillStyle(0x486773).fillRect(x,y-112,59,44);
        for(let j=0;j<4;j++)machines.fillStyle(0x7eaca3).fillRect(x+5,y-105+j*7,36-j*6,2);
      }
    }
    front.lineStyle(2,0x606078,.5);
    for(let x=18;x<132;x+=18)front.lineBetween(x,y-120,x+40,y-74).lineBetween(x,y-74,x+40,y-120);
  });
  for(const p of FACTORY.platforms){
    const x=p.x-p.w/2;
    deck.fillStyle(0x16474f).fillRect(x,p.y,p.w,23);
    deck.fillStyle(0x83ead4).fillRect(x,p.y,p.w,5);
    for(let k=8;k<p.w-4;k+=32)deck.fillStyle(0x3b8590).fillRect(x+k,p.y+12,5,4);
  }
  for(const l of factoryLadders){
    deck.lineStyle(4,0xf5b768);
    for(const dx of [-12,12])deck.lineBetween(l.x+dx,l.top,l.x+dx,l.bottom);
    for(let y=l.top;y<l.bottom;y+=16)deck.lineBetween(l.x-12,y,l.x+12,y);
  }
  const sparks=s.add.graphics().setDepth(4);
  const drawHazards=(on:boolean)=>{
    sparks.clear();
    for(const t of traps){
      const active=on||t.y===floorY(0);
      sparks.fillStyle(0x9a7589).fillRect(t.x-20,t.y-4,40,4);
      if(active){sparks.lineStyle(3,0xff74ca);for(let dx=-14;dx<=10;dx+=12)sparks.beginPath().moveTo(t.x+dx,t.y-5).lineTo(t.x+dx+6,t.y-16).lineTo(t.x+dx+2,t.y-17).lineTo(t.x+dx+9,t.y-26).strokePath()}
    }
  };
  drawHazards(true);
  label(230,floorY(0)-42,'마을 복귀 · E');label(436,floorY(2)-45,'SPACE ▶');label(915,floorY(3)-36,'◀ 운반대 탑승');
  const beacon=label(checkpoint.x,checkpoint.y-38,'◇ 복귀 지점');
  let checkpointActive=false;
  const control=label(switchX,floorY(4)-36,'차단기 · E');
  label(exitX,floorY(5)-45,'제어실 출구 · E');
  deck.lineStyle(5,0x8bf4df).strokeRect(exitX-27,floorY(5)-68,54,68);
  const lift=s.add.rectangle(ferry.right,ferry.y+6,ferry.width,12,0x35868a).setStrokeStyle(3,0xadefe4).setDepth(2);
  s.physics.add.existing(lift);const body=lift.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false).setImmovable(true).setVelocityX(-ferry.speed);
  body.checkCollision.down=body.checkCollision.left=body.checkCollision.right=false;
  for(const kind of ['motor','drone','drill'] as const){
    if(s.textures.exists(kind))continue;
    const g=s.add.graphics();
    if(kind==='drill'){
      g.fillStyle(0x232335).fillRect(13,20,25,8);
      for(let x=15;x<36;x+=7)g.fillStyle(0x817884).fillRect(x,23,4,3);
      g.fillStyle(0xaa612b).fillRect(14,8,23,14);
      g.fillStyle(0xffc45b).fillRect(17,5,15,5).fillRect(16,10,5,4);
      g.fillStyle(0xaabdc8).fillTriangle(0,16,15,10,15,21);
      g.fillStyle(0x536678).fillRect(8,14,2,5).fillRect(12,12,2,8);
    }else if(kind==='motor'){
      g.fillStyle(0x211c37).fillRect(3,21,34,7);g.fillStyle(0xce7043).fillRoundedRect(4,5,32,18,3);
      for(let x=8;x<26;x+=5)g.fillStyle(0x904937).fillRect(x,6,2,13);
      g.fillStyle(0xffd367).fillRect(28,10,6,5);
    }else{
      g.fillStyle(0x93b9cc).fillRect(0,3,15,3).fillRect(25,3,15,3);
      g.fillStyle(0x81729f).fillRect(6,6,3,8).fillRect(31,6,3,8).fillRect(7,12,26,10);
      g.fillStyle(0xff86c5).fillRect(16,14,9,3);
    }
    g.generateTexture(kind,40,30);g.destroy();
  }
  let powered=true;
  return {lift,get checkpointActive(){return checkpointActive},
    activateCheckpoint(){checkpointActive=true;beacon.setText('◆ 복귀 지점 활성').setColor('#89ffdc')},
    cutPower(){powered=false;drawHazards(false);control.setText('차단 완료 ✓')},
    get powered(){return powered},tick(){if(lift.x>=ferry.right)body.setVelocityX(-ferry.speed);if(lift.x<=ferry.left)body.setVelocityX(ferry.speed)}};
}
