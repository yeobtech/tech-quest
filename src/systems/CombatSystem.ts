import Phaser from 'phaser';
import { PLAYER } from '../data/config';
import { tools, type ActiveTool } from '../data/tools';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
export class CombatSystem {
  private nextAttack = 0;
  constructor(private scene: Phaser.Scene) {}
  attack(player: Player, enemies: Enemy[], damage: number, onKill: (enemy: Enemy) => void, tool:ActiveTool='scissors', multiplier:()=>number=()=>1) {
    const now = this.scene.time.now;
    if (!player.canAttack || now < this.nextAttack) return;
    this.nextAttack = now + PLAYER.cooldown;
    player.startAttack();
    const facing = player.facing;
    this.scene.time.delayedCall(PLAYER.windup, () => {
      if (!player.canAttack) return;
      player.play('tech-impact');
      this.strike(player, enemies, Math.round((damage+tools[tool].damageBonus)*multiplier()), onKill, facing, tools[tool].reach);
    });
  }
  private strike(player: Player, enemies: Enemy[], damage: number, onKill: (enemy: Enemy) => void, facing: number, reach:number) {
    const inset = 5;
    const range = new Phaser.Geom.Rectangle(player.x + (facing > 0 ? inset : -reach), player.y - 35, reach - inset, 70);
    enemies.filter(e => e.active && e.canReceiveDamage() && Phaser.Geom.Intersects.RectangleToRectangle(range, new Phaser.Geom.Rectangle(e.body!.x, e.body!.y, e.body!.width, e.body!.height))).forEach(enemy => {
      enemy.hp -= damage; enemy.stagger(); this.float(enemy.x, enemy.y - 45, `${damage}`, '#fff0a9');
      if (enemy.hp <= 0) { enemy.die(); onKill(enemy); }
    });
  }
  hit(player: Player, damage: number): boolean {
    if (!player.hp || this.scene.time.now < player.invulnerableUntil) return false;
    player.invulnerableUntil = this.scene.time.now + PLAYER.invulnerability;
    player.hp = Math.max(0, player.hp - damage);
    player.hurt();
    this.float(player.x, player.y - 50, `−${damage}`, '#ff9a96'); return true;
  }
  float(x: number, y: number, value: string, color = '#e2ffc1') {
    const text = this.scene.add.text(x, y, value, { fontFamily: 'sans-serif', fontSize: '21px', color, stroke: '#152a25', strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
    this.scene.tweens.add({ targets: text, y: y - 65, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
  }
}
