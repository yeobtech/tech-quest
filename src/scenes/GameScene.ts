import Phaser from 'phaser';
import { FOREST, TRAINING, YARD, type MapData } from '../data/maps';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { Hud } from '../ui/Hud';
import { createTextures } from './textures';
export class GameScene extends Phaser.Scene {
  private map: MapData = FOREST;
  private chest?: Phaser.GameObjects.Text;
  private finished = false;
  private player!: Player;
  private enemies: Enemy[] = [];
  private combat!: CombatSystem;
  private progress!: ProgressionSystem;
  private save!: SaveSystem;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private coordinates?: Phaser.GameObjects.Text;
  private measurement?: Phaser.GameObjects.Container;
  constructor(private hud: Hud) { super('forest'); }
  create(data: { training?: boolean; message?: string } = {}) {
    this.map = data.training ? TRAINING : FOREST;
    this.finished = false; this.chest = undefined; this.measurement = undefined;
    if (!this.textures.exists('player-idle')) createTextures(this);
    let storage;
    try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
    this.save = new SaveSystem(storage); this.progress ??= new ProgressionSystem(this.save.load());
    this.physics.world.setBounds(0, 0, this.map.width, 720);
    if (data.training) this.drawTraining(); else this.drawForest();
    this.hud.location(!!data.training);
    this.hud.notice(data.message ?? (data.training ? '훈련 시작! 오른쪽 출구로 이동하세요.' : '훈련장 입구에서 E를 누르세요.'));
    if (this.physics.world.drawDebug) this.coordinates = this.add.text(12, 190, '', { backgroundColor: '#142d27' }).setScrollFactor(0).setDepth(100);
    const platforms = this.physics.add.staticGroup();
    this.map.platforms.forEach((p, index) => {
      const tile = platforms.create(p.x, p.y + 20, 'platform') as Phaser.Physics.Arcade.Image;
      tile.setDisplaySize(p.w, 40).setVisible(false).refreshBody();
      // Elevated platforms are one-way: jump through from below and land on top.
      if (index > 0) { const body = tile.body as Phaser.Physics.Arcade.StaticBody; body.checkCollision.down = false; body.checkCollision.left = false; body.checkCollision.right = false; }
    });
    this.player = new Player(this, this.map.spawn.x, this.map.spawn.y); this.player.hp = this.progress.maxHp;
    this.physics.add.collider(this.player, platforms);
    this.enemies = this.map.enemies.map(e => new Enemy(this, e.kind, e.x, e.min, e.max));
    this.enemies.forEach(enemy => { this.physics.add.collider(enemy, platforms); this.physics.add.overlap(this.player, enemy, () => {
      if (enemy.active) this.receiveDamage(enemy.stats.damage);
    }); });
    this.combat = new CombatSystem(this);
    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,SPACE,Z,X,E,UP') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['SPACE', 'LEFT', 'RIGHT', 'UP', 'DOWN']);
    this.cameras.main.setBounds(0, 0, this.map.width, 720).startFollow(this.player, true, 0.09, 0.09);
    this.game.canvas.setAttribute('tabindex', '0'); this.game.canvas.setAttribute('aria-label', 'TECH QUEST 게임. A D 이동, Space 점프, Z 공격, X 발판 측정');
    this.input.on('pointerdown', () => this.game.canvas.focus());
    this.refresh(); this.hud.saveStatus(this.save.save(this.progress.state));
  }
  update() {
    if (!this.player) return;
    this.player.move(this.keys.A.isDown || this.keys.LEFT.isDown, this.keys.D.isDown || this.keys.RIGHT.isDown, Phaser.Input.Keyboard.JustDown(this.keys.SPACE));
    if (Phaser.Input.Keyboard.JustDown(this.keys.X)) this.measurePlatform();
    const interact = Phaser.Input.Keyboard.JustDown(this.keys.E);
    if (this.player.hp && this.map === TRAINING) this.train(interact);
    else if (this.player.hp && interact && Math.abs(this.player.x - this.map.spawn.x) < 120)
      this.scene.restart({ training: true });
    this.enemies.forEach(e => e.tick());
    this.coordinates?.setText(`x ${Math.round(this.player.x)}  y ${Math.round(this.player.y)}`);
    if (this.keys.Z.isDown) this.combat.attack(this.player, this.enemies, this.progress.attack, enemy => {
      const levels = this.progress.reward(enemy.stats.exp, enemy.stats.gold);
      this.combat.float(enemy.x, enemy.y - 70, `+${enemy.stats.exp} EXP · +${enemy.stats.gold} G`);
      if (levels) { this.player.hp = this.progress.maxHp; this.combat.float(this.player.x, this.player.y - 80, 'LEVEL UP!', '#f3d98b'); this.hud.notice(`레벨 ${this.progress.state.level} 달성! 체력과 공격력이 올랐습니다.`); }
      else this.hud.notice(`${enemy.stats.name} 처치 · 경험치 +${enemy.stats.exp}, 골드 +${enemy.stats.gold}`);
      this.hud.saveStatus(this.save.save(this.progress.state)); this.refresh();
    });
  }
  private receiveDamage(damage: number) {
      if (!this.combat.hit(this.player, damage)) return;
      if (this.player.hp <= 0) {
        this.player.setVelocity(0).setAccelerationX(0);
        this.time.delayedCall(650, () => {
          (this.player.body as Phaser.Physics.Arcade.Body).reset(this.map.spawn.x, this.map.spawn.y);
          this.player.hp = this.progress.maxHp; this.refresh();
          this.hud.notice('다시 도전! 시작 지점에서 체력을 회복했습니다.');
        });
      }
      this.refresh();
  }
  private measurePlatform() {
    const tiles = this.map.platforms.slice(1);
    const distance = (tile: typeof tiles[number]) => Math.hypot(tile.x - this.player.x, tile.y - this.player.y);
    const tile = tiles.reduce((a, b) => distance(a) <= distance(b) ? a : b);
    this.measurement?.destroy();
    const overlay = this.add.container(tile.x, tile.y).setDepth(10);
    this.measurement = overlay;
    const pen = this.add.graphics().lineStyle(2, 0xffffff);
    const half = tile.w / 2;
    pen.lineBetween(-half, -26, half, -26);
    for (const side of [-1, 1]) {
      const edge = side * half;
      pen.lineBetween(edge, -3, edge, -34);
      pen.lineBetween(edge, -26, edge - side * 8, -30);
      pen.lineBetween(edge, -26, edge - side * 8, -22);
    }
    const label = this.add.text(0, -31, tile.w + ' px', { fontSize: '16px', backgroundColor: '#263c39' }).setOrigin(0.5, 1);
    overlay.add([pen, label]);
    this.hud.notice('발판 너비 ' + tile.w + ' px · 양 끝에서 뻗은 선은 치수 보조선, 너비를 적은 화살표 선은 치수선입니다.');
    this.time.delayedCall(3500, () => { if (overlay.active) overlay.destroy(); });
  }
  private refresh() { this.hud.update(this.progress, this.player.hp); }
  private train(interact: boolean) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    for (const ladder of YARD.ladders) {
      if (this.keys.UP.isDown && Math.abs(body.center.x - ladder.x) < 30 &&
          body.bottom > ladder.top + 1 && body.bottom <= ladder.bottom + 2)
        this.player.setVelocityY(-160);
    }
    for (const spike of YARD.spikes) {
      if (body.right > spike.x - 20 && body.left < spike.x + 20 && body.bottom > spike.y - 18 && body.top < spike.y)
        this.receiveDamage(10);
    }
    if (!interact || !this.player.hp) return;
    const near = (point: { x: number; y: number }) =>
      Math.abs(body.center.x - point.x) < 55 && Math.abs(body.bottom - point.y) < 42;
    if (this.chest?.visible && near(YARD.chest)) {
      this.chest.setVisible(false);
      this.player.hp = Math.min(this.progress.maxHp, this.player.hp + 25);
      this.hud.notice('구급 상자 획득 · 체력 최대 25 회복'); this.refresh();
    }
    if (!this.finished && near(YARD.exit)) {
      this.finished = true;
      this.progress.reward(15, 5, false);
      this.hud.saveStatus(this.save.save(this.progress.state));
      this.scene.restart({ message: '훈련장 클리어! 경험치 +15 · 골드 +5' });
    }
  }
  private drawTraining() {
    this.cameras.main.setBackgroundColor('#243a49');
    const g = this.add.graphics();
    for (let x = 0; x < this.map.width; x += 100)
      g.lineStyle(1, 0x385263).lineBetween(x, 0, x, 720);
    for (let y = 0; y < 720; y += 100) g.lineBetween(0, y, this.map.width, y);
    for (const p of this.map.platforms) {
      g.fillStyle(0x455e68).fillRect(p.x - p.w / 2, p.y, p.w, 40);
      g.fillStyle(0xe8b963).fillRect(p.x - p.w / 2, p.y, p.w, 5);
      for (let x = p.x - p.w / 2 + 10; x < p.x + p.w / 2; x += 40)
        g.fillStyle(0x93adb5).fillCircle(x, p.y + 16, 3);
    }
    for (const ladder of YARD.ladders) {
      g.lineStyle(4, 0xf3cc79);
      for (const side of [-12, 12]) g.lineBetween(ladder.x + side, ladder.top, ladder.x + side, ladder.bottom);
      for (let y = ladder.top; y < ladder.bottom; y += 18)
        g.lineBetween(ladder.x - 12, y, ladder.x + 12, y);
    }
    for (const { x, y } of YARD.spikes) {
      for (let dx = -20; dx < 20; dx += 10)
        g.fillStyle(0xff8777).fillTriangle(x + dx, y, x + dx + 5, y - 18, x + dx + 10, y);
    }
    const sign = (x: number, y: number, title: string) => this.add.text(x, y, title,
      { fontSize: '16px', color: '#fcf2d2', backgroundColor: '#243840', padding: { x: 8, y: 5 } }).setOrigin(0.5, 1);
    sign(130, 520, 'START · A D 이동');
    sign(325, 530, 'SPACE · 점프');
    sign(830, 505, 'Z · 공격');
    sign(1110, 454, '↑ · 사다리 오르기');
    const { x, y } = YARD.chest;
    this.chest = sign(x, y, '▣ 구급 상자 · E');
    const gate = YARD.exit;
    g.lineStyle(6, 0x78e7cc).strokeRoundedRect(gate.x - 24, gate.y - 65, 48, 65, 12);
    sign(gate.x, gate.y - 73, 'EXIT · E');
  }
  private drawForest() {
    this.cameras.main.setBackgroundColor('#b5d8c5');
    const sky = this.add.graphics().setScrollFactor(0);
    sky.fillStyle(0xe3e4b6, 0.6).fillCircle(1030, 135, 66);
    for (let layer = 0; layer < 3; layer++) {
      const g = this.add.graphics().setScrollFactor(0.12 + layer * 0.14);
      const colors = [0x85b7a5, 0x649d8d, 0x39796c];
      for (let i = -1; i < 22; i++) { const x = i * 185 + layer * 60; const y = 255 + layer * 72 + Math.sin(i * 3) * 40; g.fillStyle(colors[layer], 0.8).fillRect(x - 10, y, 20, 440).fillTriangle(x - 125, y + 150, x, y - 150, x + 125, y + 150).fillTriangle(x - 100, y + 60, x, y - 200, x + 100, y + 60); }
    }
    const g = this.add.graphics();
    this.map.platforms.forEach((p, index) => { g.fillStyle(0x3e5544).fillRect(p.x - p.w / 2, p.y + 8, p.w, index === 0 ? 85 : 32); g.fillStyle(0x56734c).fillRect(p.x - p.w / 2, p.y + 8, p.w, 22); g.fillStyle(0x9abe70).fillRect(p.x - p.w / 2, p.y, p.w, 9); for (let x = p.x - p.w / 2 + 8; x < p.x + p.w / 2; x += 23) g.fillStyle(0xc5d991).fillRect(x, p.y - 5, 3, 8); });
    for (let x = 70; x < this.map.width; x += 137) { g.fillStyle(0xd5ca8a).fillRect(x, 621, 4, 9); g.fillStyle(0xefdfa8).fillRect(x - 3, 617, 10, 5); }
    this.add.text(110, 536, 'E · 기술자 훈련장 입장', { fontSize: '17px', color: '#f0e6c2', backgroundColor: '#456457', padding: { x: 12, y: 10 } });
  }
}

