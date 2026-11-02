import Phaser from 'phaser';
import { PLAYER } from '../data/config';
export class Player extends Phaser.Physics.Arcade.Sprite {
  facing = 1;
  hp = 100;
  invulnerableUntil = 0;
  private attackUntil = 0;
  private attackStarted = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle'); scene.add.existing(this); scene.physics.add.existing(this);
    this.setSize(24, 46).setOffset(28, 10).setCollideWorldBounds(true).setDepth(10);
  }
  move(left: boolean, right: boolean, jump: boolean) {
    const direction = Number(right) - Number(left);
    this.setVelocityX(direction * PLAYER.speed);
    if (direction) { this.facing = direction; this.setFlipX(direction < 0); }
    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    if (jump && grounded) this.setVelocityY(-PLAYER.jump);
    const now = this.scene.time.now;
    const pose = now < this.attackUntil ? (now - this.attackStarted < 100 ? 'attack-1' : 'attack-2') : !grounded || (jump && grounded) ? 'jump' : direction ? (Math.floor(now / 120) % 2 ? 'run-1' : 'run-2') : 'idle';
    this.setTexture(`player-${pose}`);
    this.setAlpha(this.scene.time.now < this.invulnerableUntil ? (Math.floor(this.scene.time.now / 80) % 2 ? 0.4 : 1) : 1);
  }
  startAttack() { this.attackStarted = this.scene.time.now; this.attackUntil = this.attackStarted + 230; this.setTexture('player-attack-1'); }
}
