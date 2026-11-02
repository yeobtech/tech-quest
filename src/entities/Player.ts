import Phaser from 'phaser';
import { PLAYER } from '../data/config';
export class Player extends Phaser.Physics.Arcade.Sprite {
  facing = 1;
  hp = 100;
  invulnerableUntil = 0;
  private groundedAt = -Infinity;
  private jumpAt = -Infinity;
  private attackAt = -Infinity;
  private hurtUntil = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle');
    scene.add.existing(this); scene.physics.add.existing(this);
    this.setSize(30, 56).setOffset(26, 2).setMaxVelocity(PLAYER.speed, 1000).setCollideWorldBounds(true).setDepth(10);
  }
  move(left: boolean, right: boolean, jump: boolean) {
    if (!this.hp) return;
    const direction = Number(right) - Number(left);
    const now = this.scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setAccelerationX(direction * PLAYER.acceleration).setDragX(PLAYER.drag);
    const attacking = now - this.attackAt < PLAYER.swing;
    if (direction && !attacking) { this.facing = direction; this.setFlipX(direction < 0); }
    const grounded = (body.blocked.down || body.touching.down) && body.velocity.y >= 0;
    if (grounded) this.groundedAt = now;
    if (jump) this.jumpAt = now;
    if (now - this.jumpAt <= PLAYER.buffer && now - this.groundedAt <= PLAYER.coyote) {
      this.setVelocityY(-PLAYER.jump);
      this.jumpAt = this.groundedAt = -Infinity;
    }
    let pose = 'idle';
    if (now < this.hurtUntil) pose = 'hurt';
    else if (attacking) pose = now - this.attackAt < PLAYER.windup ? 'attack-1' : 'attack-2';
    else if (body.velocity.y < 0) pose = 'jump';
    else if (!grounded) pose = 'fall';
    else if (Math.abs(body.velocity.x) > 5) pose = Math.floor(now / 95) % 2 ? 'run-1' : 'run-2';
    this.setTexture('player-' + pose);
    this.setAlpha(now < this.invulnerableUntil && Math.floor(now / 80) % 2 ? 0.55 : 1);
  }
  get canAttack() { return this.hp > 0 && this.scene.time.now >= this.hurtUntil; }
  startAttack() { this.attackAt = this.scene.time.now; this.setTexture('player-attack-1'); }
  hurt() {
    this.attackAt = this.jumpAt = this.groundedAt = -Infinity;
    this.hurtUntil = this.scene.time.now + 170;
    this.setTexture(this.hp ? 'player-hurt' : 'player-death').setAlpha(1);
  }
}
