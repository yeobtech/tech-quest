import Phaser from 'phaser';
import { PLAYER } from '../data/config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
export class CombatSystem {
  private nextAttack = 0;
  constructor(private scene: Phaser.Scene) {}
  attack(player: Player, enemies: Enemy[], damage: number, onKill: (enemy: Enemy) => void) {
    const now = this.scene.time.now;
    if (!player.canAttack || now < this.nextAttack) return;
    this.nextAttack = now + PLAYER.cooldown;
    player.startAttack();
    const facing = player.facing;
    this.scene.time.delayedCall(PLAYER.windup, () => {
      if (!player.canAttack) return;
      player.setTexture('player-attack-2');
      this.strike(player, enemies, damage, onKill, facing);
    });
  }
  private strike(player: Player, enemies: Enemy[], damage: number, onKill: (enemy: Enemy) => void, facing: number) {
    const range = new Phaser.Geom.Rectangle(player.x + (facing > 0 ? 5 : -105), player.y - 35, 100, 70);
    const slash = this.scene.add.graphics({ x: player.x, y: player.y }).setDepth(20);
    slash.fillStyle(0xe4ffac, 0.13).fillRect(5, -35, 100, 70);
    slash.lineStyle(11, 0xf2ffce, 0.85).beginPath().arc(0, 0, 65, -0.9, 0.85).strokePath();
    slash.lineStyle(3, 0xffffff, 1).beginPath().arc(0, 0, 65, -0.9, 0.85).strokePath();
    slash.setScale(facing, 1);
    this.scene.tweens.add({ targets: slash, alpha: 0, duration: 135, onComplete: () => slash.destroy() });
    enemies.filter(e => e.active && Phaser.Geom.Intersects.RectangleToRectangle(range, new Phaser.Geom.Rectangle(e.body!.x, e.body!.y, e.body!.width, e.body!.height))).forEach(enemy => {
      enemy.hp -= damage; enemy.stagger(); this.float(enemy.x, enemy.y - 45, `${damage}`, '#fff0a9');
      if (enemy.hp <= 0) { enemy.die(); onKill(enemy); }
    });
  }
  hit(player: Player, enemy: Enemy): boolean {
    if (!player.hp || !enemy.active || this.scene.time.now < player.invulnerableUntil) return false;
    player.invulnerableUntil = this.scene.time.now + PLAYER.invulnerability;
    player.hp = Math.max(0, player.hp - enemy.stats.damage);
    player.hurt();
    this.float(player.x, player.y - 50, `−${enemy.stats.damage}`, '#ff9a96'); return true;
  }
  float(x: number, y: number, value: string, color = '#e2ffc1') {
    const text = this.scene.add.text(x, y, value, { fontFamily: 'sans-serif', fontSize: '21px', color, stroke: '#152a25', strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
    this.scene.tweens.add({ targets: text, y: y - 65, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
  }
}
