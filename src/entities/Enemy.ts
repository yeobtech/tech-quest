import Phaser from 'phaser';
import { ENEMIES, type EnemyKind } from '../data/config';
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  direction = -1;
  private staggerUntil = 0;
  stagger() { this.staggerUntil = this.scene.time.now + 140; this.setTint(0xffaaa0); }
  readonly stats;
  readonly label: Phaser.GameObjects.Text;
  readonly bar: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, public kind: EnemyKind, public homeX: number, public minX: number, public maxX: number) {
    super(scene, homeX, 580, kind); this.stats = ENEMIES[kind]; this.hp = this.stats.hp;
    scene.add.existing(this); scene.physics.add.existing(this); this.setCollideWorldBounds(true).setSize(34, 30).setDepth(5);
    this.label = scene.add.text(0, 0, this.stats.name, { fontFamily: 'sans-serif', fontSize: '13px', color: '#e1f4df', backgroundColor: '#152d2a' }).setOrigin(0.5).setDepth(15);
    this.bar = scene.add.graphics().setDepth(15);
  }
  tick() {
    if (!this.active) return;
    if (this.x <= this.minX) this.direction = 1;
    if (this.x >= this.maxX) this.direction = -1;
    if (this.scene.time.now >= this.staggerUntil) this.clearTint();
    this.setVelocityX(this.scene.time.now < this.staggerUntil ? 0 : this.stats.speed * this.direction).setFlipX(this.direction > 0);
    this.label.setPosition(this.x, this.y - 42);
    this.bar.clear().fillStyle(0x203b36).fillRect(this.x - 23, this.y - 29, 46, 5).fillStyle(0xb4ee8c).fillRect(this.x - 23, this.y - 29, 46 * this.hp / this.stats.hp, 5);
  }
  die() {
    this.clearTint(); this.disableBody(true, true); this.label.setVisible(false); this.bar.clear();
    this.scene.time.delayedCall(this.stats.respawn, () => { this.hp = this.stats.hp; this.enableBody(true, this.homeX, 580, true, true); this.label.setVisible(true); });
  }
}
