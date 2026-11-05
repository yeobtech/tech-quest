import Phaser from 'phaser';
import {Enemy} from './Enemy';
import {VirusChallenge,virusConfig} from '../education/virus';
export class Virus extends Enemy {
 readonly stats={...virusConfig,name:'오류 바이러스',respawn:0,color:0xc47ef1};
 constructor(scene:Phaser.Scene,public challenge:VirusChallenge){
  super(scene,'bot',850,500,1100,590);this.hp=virusConfig.hp;
  if(!scene.textures.exists('error-virus')){const g=scene.make.graphics({x:0,y:0});g.fillStyle(0x51336e).fillRect(8,8,32,32);g.fillStyle(0xcc83ef).fillRect(12,12,24,24);for(const x of [4,20,36])g.fillStyle(0xcc83ef).fillRect(x,0,8,8).fillRect(x,40,8,8);g.fillStyle(0xffed96).fillRect(15,18,6,6).fillRect(28,18,6,6);g.fillStyle(0x51336e).fillRect(20,29,12,4);g.generateTexture('error-virus',48,48);g.destroy()}
  this.setTexture('error-virus').setSize(34,36).setOffset(7,10);
 }
 canReceiveDamage(){return !this.challenge.shielded}
 tick(){super.tick();if(this.active&&this.challenge.shielded){this.setTint(0x83dfff);this.label.setText('◇ 오류 바이러스 · 방어막')}}
 die(){this.disableBody(true,true);this.label.setVisible(false);this.bar.clear()}
}
