import Phaser from 'phaser';
import { APPRENTICE } from '../scenes/apprentice';
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
    super(scene, x, y, APPRENTICE, 'idle-0');
    scene.add.existing(this); scene.physics.add.existing(this);
    this.setSize(30, 56).setOffset(26, 4).setMaxVelocity(PLAYER.speed, 1000).setCollideWorldBounds(true).setDepth(10);
  }
  move(left: boolean, right: boolean, jump: boolean, climbing: boolean, walking: boolean) {
    if (!this.hp) return;
    const direction = Number(right) - Number(left);
    const now = this.scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setMaxVelocity(walking ? PLAYER.speed / 2 : PLAYER.speed, 1000);
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
    else if (attacking) pose = this.anims.currentAnim?.key === 'tech-impact' ? 'impact' : 'windup';
    else if (climbing) pose = 'climb';
    else if (body.velocity.y < 0) pose = 'jump';
    else if (!grounded) pose = 'fall';
    else if (Math.abs(body.velocity.x) > 5) pose = Math.abs(body.velocity.x) < PLAYER.speed * 0.65 ? 'walk' : 'run';
    this.play('tech-' + pose, true);
    this.setAlpha(now < this.invulnerableUntil && Math.floor(now / 80) % 2 ? 0.55 : 1);
  }
  get canAttack() { return this.hp > 0 && this.scene.time.now >= this.hurtUntil; }
  startAttack() { this.attackAt = this.scene.time.now; this.play('tech-windup'); }
  hurt() {
    this.attackAt = this.jumpAt = this.groundedAt = -Infinity;
    this.hurtUntil = this.scene.time.now + 170;
    this.play(this.hp ? 'tech-hurt' : 'tech-death').setAlpha(1);
  }
}
