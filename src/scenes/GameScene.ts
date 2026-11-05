import {openCertification} from '../ui/Certification';
import {openPromotion} from '../ui/PromotionExam';
import {examEligible} from '../education/promotion';
import {DIGITAL_ARENA,VirusChallenge,virusConfig} from '../education/virus';
import {bossReady} from '../education/stage1';
import {Virus} from '../entities/Virus';
import {openVirusQuiz} from '../ui/VirusQuiz';
import {FACTORY,factoryLadders,factoryGate,traps,switchX,exitX,floorY,checkpoint,factoryReward} from '../data/factory';
import {buildFactory} from './factory';
import {openCrafting} from '../ui/Crafting';
import {openQuests} from '../ui/QuestBoard';
import {quests,ready} from '../data/quests';
const BOARD_X=675;
const BENCH_X=1190;
import {rollDrops,materials,type MaterialId} from '../data/materials';
import {openInventory} from '../ui/Inventory';
import Phaser from 'phaser';
import { FOREST, TRAINING, YARD, type MapData } from '../data/maps';
import { VILLAGE, VILLAGERS, FOREST_GATE } from '../data/village';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { Hud } from '../ui/Hud';
import { preloadApprentice, assembleApprentice, applyWardrobe, preview } from './apprentice';
import { openShop } from '../ui/ClothingShop';
import { openToolBench } from '../ui/ToolBench';
import { createTextures } from './textures';
export class GameScene extends Phaser.Scene {
  private combatElapsed=0;
  private virus?:Virus;
  private challenge?:VirusChallenge;
  private virusStatus?:Phaser.GameObjects.Text;
  private map: MapData = FOREST;
  private chest?: Phaser.GameObjects.Container;
  private chestPrompt?: Phaser.GameObjects.Text;
  private factory?:ReturnType<typeof buildFactory>;
  private finished = false;
  private climbing?: typeof YARD.ladders[number];
  private ladderDirection: -1 | 1 = -1;
  private player!: Player;
  private enemies: Enemy[] = [];
  private loot = new Map<Phaser.GameObjects.Text, MaterialId>();
  private combat!: CombatSystem;
  private progress!: ProgressionSystem;
  private save!: SaveSystem;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private coordinates?: Phaser.GameObjects.Text;
  private measurement?: Phaser.GameObjects.Container;
  constructor(private hud: Hud) { super('forest'); }
  preload() { preloadApprentice(this); }
  create(data: { map?: MapData; hp?: number; message?: string } = {}) {
    this.combatElapsed=0;this.virus=undefined;this.challenge=undefined;this.virusStatus=undefined;
    this.hud.onPromotion=()=>this.promotionExam();
    this.loot.clear();
    this.map = data.map ?? FOREST;
    this.finished = false; this.climbing = undefined; this.chest = undefined; this.chestPrompt = undefined; this.measurement = undefined;
    assembleApprentice(this);
    if (!this.textures.exists('platform')) createTextures(this);
    let storage;
    try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
    this.save = new SaveSystem(storage); this.progress ??= new ProgressionSystem(this.save.load());
    this.applyEquipment();
    this.physics.world.setBounds(0, 0, this.map.width, this.map.height??720);
    this.factory=this.map===FACTORY?buildFactory(this):undefined;
    if(this.factory)this.hud.notice('1층 공장 입구');
    else if (this.map === DIGITAL_ARENA) this.drawDigital();
    else if (this.map === TRAINING) this.drawTraining();
    else if (this.map === VILLAGE) this.drawVillage();
    else this.drawForest();
    this.hud.location(this.map);
    this.hud.notice(data.message ?? (this.map===DIGITAL_ARENA?'E로 복구 퀴즈를 풀어 방어막을 해제하세요.':this.factory?'주황 사다리로 등반 · 5층 차단기를 찾으세요.':this.map === VILLAGE ? '마을 주민 가까이에서 E로 대화하세요.' : this.map === TRAINING ? '훈련 시작! 오른쪽 출구로 이동하세요.' : '훈련장 입구에서 E를 누르세요.'));
    if (this.physics.world.drawDebug) this.coordinates = this.add.text(12, 190, '', { backgroundColor: '#142d27' }).setScrollFactor(0).setDepth(100);
    const platforms = this.physics.add.staticGroup();
    this.map.platforms.forEach((p, index) => {
      const tile = platforms.create(p.x, p.y + 20, 'platform') as Phaser.Physics.Arcade.Image;
      tile.setDisplaySize(p.w, 40).setVisible(false).refreshBody();
      // Elevated platforms are one-way: jump through from below and land on top.
      if (index > 0) { const body = tile.body as Phaser.Physics.Arcade.StaticBody; body.checkCollision.down = false; body.checkCollision.left = false; body.checkCollision.right = false; }
    });
    this.player = new Player(this, this.map.spawn.x, this.map.spawn.y); this.player.hp = data.hp ?? this.progress.maxHp;
    this.physics.add.collider(this.player, platforms, undefined, (_player,tile) => {
      const ladder=this.climbing;
      const body=(tile as Phaser.Physics.Arcade.Image).body!;
      return !ladder || this.ladderDirection !== 1 || body.top !== ladder.top || ladder.x < body.left || ladder.x > body.right;
    });
    if(this.factory)this.physics.add.collider(this.player,this.factory.lift);
    this.enemies = this.map.enemies.map(e => new Enemy(this, e.kind, e.x, e.min, e.max,e.y));
    if(this.map===DIGITAL_ARENA){this.challenge=new VirusChallenge();this.virus=new Virus(this,this.challenge);this.enemies.push(this.virus)}
    this.enemies.forEach(enemy => { this.physics.add.collider(enemy, platforms); this.physics.add.overlap(this.player, enemy, () => {
      if (enemy.active) this.receiveDamage(enemy.stats.damage);
    }); });
    this.combat = new CombatSystem(this);
    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,SPACE,Z,X,E,UP,W,DOWN,S,SHIFT,I,Q,B') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['SPACE', 'LEFT', 'RIGHT', 'UP', 'DOWN']);
    this.cameras.main.setBounds(0, 0, this.map.width, this.map.height??720).startFollow(this.player, true, 0.09, 0.09);
    this.game.canvas.setAttribute('tabindex', '0'); this.game.canvas.setAttribute('aria-label', 'TECH QUEST 게임. A D 이동, Space 점프, Z 공격, X 발판 측정');
    this.input.on('pointerdown', () => this.game.canvas.focus());
    this.refresh(); this.hud.saveStatus(this.save.save(this.progress.state));
  }
  update(_time:number,delta:number) {
    this.combatElapsed+=delta;
    if (!this.player) return;
    if(Phaser.Input.Keyboard.JustDown(this.keys.Q) && !document.querySelector('dialog[open]')){
      this.questBoard();return;
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.I) && !document.querySelector('dialog[open]')){
      this.scene.pause();this.input.keyboard!.enabled=false;
      openInventory(this.progress.state.inventory,()=>{
        this.input.keyboard!.resetKeys();this.input.keyboard!.enabled=true;
        this.scene.resume();this.game.canvas.focus();
      });
      return;
    }
    if(this.player.hp)this.collectLoot();
    this.player.move(this.keys.A.isDown || this.keys.LEFT.isDown, this.keys.D.isDown || this.keys.RIGHT.isDown, Phaser.Input.Keyboard.JustDown(this.keys.SPACE), !!this.climbing, this.keys.SHIFT.isDown);
    if (Phaser.Input.Keyboard.JustDown(this.keys.X)) this.measurePlatform();
    const interact = Phaser.Input.Keyboard.JustDown(this.keys.E);
    if(this.map===DIGITAL_ARENA){
      const c=this.challenge!;
      this.virusStatus?.setText((c.shielded?'◇ 방어막 활성 · 핵심 문제 필요':'✓ 방어막 해제')+' · '+(c.multiplier(this.combatElapsed)>1?'공격 +50% '+Math.ceil((c.buffUntil-this.combatElapsed)/1000)+'초':'기본 공격력')+'\nE: 복구 퀴즈 / 처치 후 보상 · B: 마을로 복귀');
      if(Phaser.Input.Keyboard.JustDown(this.keys.B)){this.travel(VILLAGE);return}
      if(interact){if(this.virus&&!this.virus.active)this.finishDigital();else this.virusQuiz();return}
    }
    if(this.factory){
      this.factory.tick();
      if(this.player.hp){
        this.useLadders(false);
        const feet=this.player.body!.bottom;
        for(const t of traps)if((this.factory.powered||t.y===floorY(0))&&Math.abs(this.player.x-t.x)<28&&feet>t.y-26&&feet<=t.y+6)this.receiveDamage(8);
        const near=(x:number,y:number)=>Math.abs(this.player.x-x)<58&&Math.abs(feet-y)<35;
        if(!this.player.hp)return;
        if(!this.factory.checkpointActive && near(checkpoint.x,checkpoint.y) && (this.player.body!.blocked.down || this.player.body!.touching.down)){
          this.factory.activateCheckpoint();this.hud.notice('3층 체크포인트 활성 · 공장 안에서 사망하면 여기서 복귀합니다.');
        }
        if(interact && near(switchX,floorY(4)))this.factory.cutPower();
        if(interact && near(exitX,floorY(5))){
          if(this.factory.powered)this.hud.notice('5층 차단기를 먼저 내리세요.');
          else{
            const reward=this.progress.clearFactory(next=>this.save.save(next));
            if(reward==='failed')this.hud.notice('보상을 저장하지 못했습니다. 출구에서 E로 다시 시도하세요.');
            else this.travel(VILLAGE,reward==='first'?'공장 최초 복구 · EXP +'+factoryReward.exp+' · 골드 +'+factoryReward.gold:'제어실 복구 완료 · 마을로 복귀했습니다.');
            return;
          }
        }
        if(interact && near(230,floorY(0))){this.travel(VILLAGE);return}
      }
    }else if (this.player.hp && this.map === TRAINING) this.train(interact);
    else if (this.player.hp && interact) {
      if (this.map === VILLAGE) {
        if (Math.abs(this.player.x - VILLAGE.spawn.x) < 60) this.travel(FOREST);
        else if(Math.abs(this.player.x-factoryGate)<55){this.travel(FACTORY);return}
        else if(Math.abs(this.player.x-BENCH_X)<65){
          this.scene.pause();this.input.keyboard!.enabled=false;
          openCrafting(this.progress.state,next=>{
            const ok=this.save.save(next);this.hud.saveStatus(ok);return ok;
          },()=>{this.input.keyboard!.resetKeys();this.input.keyboard!.enabled=true;this.scene.resume();this.game.canvas.focus()});
          return;
        }
        else if(Math.abs(this.player.x-BOARD_X)<65){this.questBoard();return}
        else {
          const npc = VILLAGERS.find(npc => Math.abs(this.player.x - npc.x) < 70 && Math.abs(this.player.y - 602) < 65);
          if (npc) {
            this.player.setVelocity(0).setAccelerationX(0);
            this.scene.pause();
            this.input.keyboard!.enabled = false;
            const done = () => {
              this.input.keyboard!.resetKeys();
              this.input.keyboard!.enabled = true;
              this.scene.resume();
              this.game.canvas.focus();
            };
            const persist=()=>{
              const ok=this.save.save(this.progress.state); this.hud.saveStatus(ok); return ok;
            };
            if(npc.shop) openShop(this.progress.state,persist,()=>this.applyEquipment(),(w,a,t)=>preview(this,w,a,t),()=>{this.refresh();done()});
            else if(npc.instructor) openToolBench(this.progress.state,npc.speech,persist,()=>this.applyEquipment(),()=>{this.refresh();done()},next=>this.save.save(next),()=>{if(bossReady(this.progress.state.stage1))this.travel(DIGITAL_ARENA)});
            else this.hud.talk(npc,done);
            return;
          }
        }
      } else if (Math.abs(this.player.x - FOREST_GATE) < 55) this.travel(VILLAGE);
      else if (Math.abs(this.player.x - FOREST.spawn.x) < 120) this.travel(TRAINING);
    }
    this.enemies.forEach(e => e.tick());
    this.coordinates?.setText(`x ${Math.round(this.player.x)}  y ${Math.round(this.player.y)}`);
    if (this.keys.Z.isDown) this.combat.attack(this.player, this.enemies, this.progress.attack, enemy => {
      if(enemy===this.virus){this.finishDigital();return}
      const q=quests.find(q=>q.id===enemy.kind);
      const wasReady=q && ready(this.progress.state,q);
      const kills=q && this.progress.state.journal[q.id];
      if(q && typeof kills==='number')this.progress.state.journal[q.id]=Math.min(q.target,kills+1);
      this.dropLoot(enemy);
      this.progress.reward(enemy.stats.exp, enemy.stats.gold);
      this.combat.float(enemy.x, enemy.y - 70, `+${enemy.stats.exp} EXP · +${enemy.stats.gold} G`);
      this.hud.notice(`${enemy.stats.name} 처치 · 경험치 +${enemy.stats.exp}, 골드 +${enemy.stats.gold}`);
      if(q && !wasReady && ready(this.progress.state,q))this.hud.notice('목표 달성 · '+q.name+' (Q: 보상 수령)');
      this.hud.saveStatus(this.save.save(this.progress.state)); this.refresh();
    },this.progress.state.tool,()=>this.challenge?.multiplier(this.combatElapsed)??1);
  }
  private promotionExam(){
    if(!this.scene.isActive()||!this.player.hp||!examEligible(this.progress.state)||document.querySelector('dialog[open]'))return;
    this.player.setVelocity(0).setAccelerationX(0);this.scene.pause();this.input.keyboard!.enabled=false;
    let leveled=false;
    openPromotion(this.progress.state,next=>{const ok=this.save.save(next);this.hud.saveStatus(ok);return ok},()=>{
      this.input.keyboard!.resetKeys();this.input.keyboard!.enabled=true;this.scene.resume();this.game.canvas.focus();
      if(leveled){this.combat.float(this.player.x,this.player.y-80,'LEVEL UP!','#f3d98b');this.hud.notice(`승급 시험 합격 · 게임 Lv.${this.progress.state.level}`)}
      this.refresh();
    },()=>{leveled=true;this.player.hp=this.progress.maxHp;this.refresh()});
  }
  private virusQuiz(){
    if(!this.player.hp || document.querySelector('dialog[open]'))return;
    this.player.setVelocity(0).setAccelerationX(0);this.scene.pause();this.input.keyboard!.enabled=false;
    openVirusQuiz(this.challenge!,()=>this.combatElapsed,()=>{this.input.keyboard!.resetKeys();this.input.keyboard!.enabled=true;this.scene.resume();this.game.canvas.focus()});
  }
  private practicalCertification(){
    if(document.querySelector('dialog[open]'))return;
    this.player.setVelocity(0).setAccelerationX(0);this.scene.pause();this.input.keyboard!.enabled=false;
    openCertification(this.progress.state,next=>{const ok=this.save.save(next);this.hud.saveStatus(ok);return ok},()=>{
      this.input.keyboard!.resetKeys();this.input.keyboard!.enabled=true;this.scene.resume();this.game.canvas.focus();this.refresh();
    });
  }
  private finishDigital(){
    const result=this.progress.clearDigital(next=>this.save.save(next));
    if(result==='failed'){this.hud.notice('보상 저장 실패 · E로 다시 저장하세요.');return}
    if(result==='blocked')return;
    this.time.delayedCall(0,()=>this.practicalCertification());
    this.refresh();this.hud.notice(result==='first'?`오류 바이러스 복구! ${virusConfig.title} · EXP +${virusConfig.exp} · ${virusConfig.gold}G · 스테이지 2 해금 (준비 중). B: 마을`:'복구 완료 · 최초 보상은 이미 받았습니다. B: 마을');
  }
  private drawDigital(){
    this.cameras.main.setBackgroundColor('#20213b');const g=this.add.graphics();
    for(let x=0;x<1280;x+=64)g.lineStyle(1,0x343e59).lineBetween(x,200,x,630);
    g.fillStyle(0x477c82).fillRect(0,630,1280,90).fillStyle(0xb4ebd1).fillRect(0,630,1280,6);
    this.add.text(640,260,'디지털 기술자 훈련소 · 시스템 복구실',{fontSize:'26px',color:'#e4e3ff'}).setOrigin(.5);
    this.virusStatus=this.add.text(640,330,'',{fontSize:'20px',color:'#ffe5ac',align:'center',backgroundColor:'#27273c'}).setOrigin(.5).setDepth(20);
    this.add.text(640,410,'E · 핵심 문제와 보너스 / Z · 공격 / B · 마을',{fontSize:'19px',color:'#a9eaff'}).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(this.virus?.active)this.virusQuiz()});
  }
  private dropLoot(enemy:Enemy){
    rollDrops(enemy.kind).forEach((id,index)=>{
      const x=Phaser.Math.Clamp(enemy.x+index*24,14,this.map.width-14);
      const tops=this.map.platforms.filter(p=>Math.abs(p.x-x)<=p.w/2 && p.y>=enemy.y).map(p=>p.y);
      const floor=Math.min(...tops);
      if(!Number.isFinite(floor))return;
      const sprite=this.add.text(x,enemy.y-12,materials[id].icon,{fontSize:'22px',backgroundColor:'#243d39'}).setOrigin(.5,1).setDepth(8);
      this.tweens.add({targets:sprite,y:floor,duration:320,ease:'Quad.easeIn',onComplete:()=>this.loot.set(sprite,id)});
    });
  }
  private collectLoot(){
    const collection=quests.find(q=>q.id==='gear')!;
    const wasReady=ready(this.progress.state,collection);
    const picked:string[]=[];
    for(const [sprite,id] of this.loot){
      if(Math.hypot(sprite.x-this.player.x,sprite.y-12-this.player.y)>52)continue;
      this.loot.delete(sprite);sprite.destroy();
      const bag=this.progress.state.inventory, count=bag[id]??0;
      bag[id]=Math.min(Number.MAX_SAFE_INTEGER,count+1);
      picked.push(materials[id].name);
      if(!count)this.combat.float(this.player.x,this.player.y-55-picked.length*22,'✦ 새 재료 · '+materials[id].name,'#ffe099');
    }
    if(picked.length){
      this.hud.notice('획득 · '+picked.join(', ')+(!wasReady&&ready(this.progress.state,collection)?' · 수집 목표 달성 (Q: 보상 수령)':'  (I: 재료 가방)'));
      this.hud.saveStatus(this.save.save(this.progress.state));
    }
  }
  private applyEquipment(){ applyWardrobe(this,this.progress.state.wardrobe.equipped,this.progress.state.tool); }
  private receiveDamage(damage: number) {
      if (!this.combat.hit(this.player, damage)) return;
      if (this.player.hp <= 0) {
        this.climbing = undefined;
        this.player.setVelocity(0).setAccelerationX(0);
        this.time.delayedCall(650, () => {
          if(this.map===DIGITAL_ARENA){this.scene.restart({map:DIGITAL_ARENA,message:'다시 도전 · 방어막과 보너스가 초기화되었습니다.'});return}
          const spawn=this.factory?.checkpointActive?{x:checkpoint.x,y:checkpoint.y-32}:this.map.spawn;
          (this.player.body as Phaser.Physics.Arcade.Body).reset(spawn.x,spawn.y);
          this.player.hp = this.progress.maxHp; this.refresh();
          this.hud.notice(this.factory?.checkpointActive?'3층 체크포인트에서 체력을 회복했습니다.':'다시 도전! 시작 지점에서 체력을 회복했습니다.');
        });
      }
      this.refresh();
  }
  private measurePlatform() {
    const tiles = this.map.platforms.slice(1);
    const distance = (tile: typeof tiles[number]) => Math.hypot(tile.x - this.player.x, tile.y - this.player.y);
    if (!tiles.length) { this.hud.notice('측정할 공중 발판이 없습니다.'); return; }
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
  private useLadders(interact:boolean){
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.keys.DOWN.isDown || this.keys.S.isDown) this.grabLadder(1);
    else if (interact || this.keys.UP.isDown || this.keys.W.isDown) this.grabLadder(-1);
    if (this.climbing) {
      if (this.ladderDirection < 0 ? body.bottom <= this.climbing.top : body.bottom >= this.climbing.bottom) {
        this.player.setVelocity(0);
        this.climbing = undefined;
      } else {
        this.player.setAccelerationX(0).setVelocityX(Phaser.Math.Clamp((this.climbing.x - body.center.x) * 8, -160, 160));
        this.player.setVelocityY(this.ladderDirection * 180);
      }
    }
  }
  private train(interact:boolean){
    this.useLadders(interact);
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    for (const spike of YARD.spikes) {
      if (body.right > spike.x - 20 && body.left < spike.x + 20 && body.bottom > spike.y - 18 && body.top < spike.y)
        this.receiveDamage(10);
    }

    const near = (point: { x: number; y: number }) =>
      Math.abs(body.center.x - point.x) < 55 && Math.abs(body.bottom - point.y) < 42;
    const canCollect = !!this.chest?.visible && near(YARD.chest);
    this.chestPrompt?.setVisible(canCollect);
    if (!interact || !this.player.hp) return;
    if (this.chest && canCollect) {
      this.chest.setVisible(false);
      this.player.hp = Math.min(this.progress.maxHp, this.player.hp + 25);
      this.hud.notice('구급 상자 획득 · 체력 최대 25 회복'); this.refresh();
    }
    if (!this.finished && near(YARD.exit)) {
      this.finished = true;
      if(!this.progress.state.achieved.includes('yard'))this.progress.state.achieved.push('yard');
      this.progress.reward(15, 5, false);
      this.hud.saveStatus(this.save.save(this.progress.state));
      this.travel(FOREST, '훈련장 클리어! 경험치 +15 · 골드 +5');
    }
  }
  private grabLadder(direction: -1 | 1 = -1) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!this.player.hp) return;
    const target = this.climbing ?? (this.factory?factoryLadders:YARD.ladders).find(ladder =>
      body.right >= ladder.x - 32 && body.left <= ladder.x + 32 &&
      (direction < 0 ? body.bottom > ladder.top + 1 && body.bottom <= ladder.bottom + 3 :
        body.bottom >= ladder.top - 3 && body.bottom < ladder.bottom - 1));
    if (target) { this.climbing = target; this.ladderDirection = direction; }
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
      this.add.zone(ladder.x, (ladder.top + ladder.bottom) / 2, 72, ladder.bottom - ladder.top)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.grabLadder());
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
    sign(1110, 454, '↑ / W / E 오르기 · ↓ / S 내려가기');
    const { x, y } = YARD.chest;
    const kit = this.add.graphics();
    kit.lineStyle(4, 0x233b41).strokeRoundedRect(-8, -35, 16, 10, 3);
    kit.fillStyle(0x213a40).fillRoundedRect(-22, -29, 44, 29, 5);
    kit.fillStyle(0xf8efe2).fillRoundedRect(-20, -27, 40, 25, 4);
    kit.fillStyle(0xd34e51).fillRect(-4, -23, 8, 17).fillRect(-9, -18, 18, 7);
    this.chestPrompt = sign(0, -40, 'E · 구급 상자 획득').setVisible(false);
    this.chest = this.add.container(x, y, [kit, this.chestPrompt]).setDepth(6);
    const gate = YARD.exit;
    g.lineStyle(6, 0x78e7cc).strokeRoundedRect(gate.x - 24, gate.y - 65, 48, 65, 12);
    sign(gate.x, gate.y - 73, 'EXIT · E');
  }
  private travel(map: MapData, message?: string) {
    this.scene.restart({ map, hp: this.player.hp, message });
  }
  private portal(x: number, name: string) {
    this.add.graphics().lineStyle(5, 0x78e7cc).strokeRoundedRect(x - 18, 564, 36, 66, 12);
    this.add.text(x, 560, name + ' · E', { fontSize: '14px', backgroundColor: '#254541' }).setOrigin(0.5, 1);
  }
  private questBoard(){
    this.scene.pause();this.input.keyboard!.enabled=false;
    const atBoard=this.map===VILLAGE && Math.abs(this.player.x-BOARD_X)<65;
    openQuests(this.progress,atBoard,state=>{
      const ok=this.save.save(state);this.hud.saveStatus(ok);return ok;
    },()=>{
      this.input.keyboard!.resetKeys();this.input.keyboard!.enabled=true;
      this.scene.resume();this.game.canvas.focus();this.refresh();
    });
  }
  private drawVillage() {
    this.add.rectangle(BOARD_X,599,10,62,0x69462b);
    this.add.rectangle(BOARD_X,566,128,52,0x493323).setStrokeStyle(4,0xbe9664);
    this.add.text(BOARD_X,566,'퀘스트 게시판 · E',{fontSize:'14px',color:'#ffe6a7'}).setOrigin(.5);
    this.cameras.main.setBackgroundColor('#b7d9cc');
    const g = this.add.graphics();
    g.fillStyle(0x667565).fillRect(0, 630, this.map.width, 90);
    g.fillStyle(0xdfc491).fillRect(0, 630, this.map.width, 8);
    for (const npc of VILLAGERS) {
      const x = npc.x;
      g.fillStyle(0x526b68).fillRect(x - 105, 470, 210, 160);
      g.fillStyle(npc.coat).fillTriangle(x - 118, 470, x, 409, x + 118, 470);
      g.fillStyle(0x2d4543).fillRect(x - 22, 552, 44, 78);
      for (const dx of [-78, 50]) g.fillStyle(0xf6d99b).fillRect(x + dx, 516, 28, 35);
      this.add.text(x, 484, npc.building, { color: '#fff2ce', fontSize: '18px' }).setOrigin(0.5);
      g.fillStyle(0x203c40).fillRect(x - 13, 612, 10, 18).fillRect(x + 3, 612, 10, 18);
      g.fillStyle(npc.coat).fillRect(x - 16, 590, 32, 26);
      g.fillStyle(0xe8b783).fillRect(x - 10, 570, 20, 20);
      g.fillStyle(0x354e53).fillRect(x - 14, 568, 28, 7).fillRect(x + 4, 579, 3, 3);
      if (npc.name === '기술 교관') {
        // Rolled blueprint, goggles and a high, square work cap.
        g.fillStyle(0xb8783c).fillRect(x - 12, 560, 22, 9);
        g.fillStyle(0x9de0d6).fillRect(x - 7, 576, 6, 4).fillRect(x + 2, 576, 6, 4);
        g.fillStyle(0xe0ebc4).fillRect(x + 12, 590, 8, 23);
        g.fillStyle(0x5896a2).fillRect(x + 13, 595, 6, 3);
      } else if (npc.name === '상점 주인') {
        // Soft kerchief, broad apron and a pocket for a measuring tape.
        g.fillStyle(0xb75144).fillTriangle(x - 15, 572, x + 10, 569, x - 8, 560);
        g.fillStyle(0xf3d390).fillRect(x - 10, 596, 21, 22);
        g.fillStyle(0x884c34).fillRect(x - 6, 606, 12, 6);
        g.fillStyle(0xf7c456).fillRect(x + 7, 601, 6, 8);
      } else {
        // Long split coat, epaulets and a guild insignia.
        g.fillStyle(0x4e5176).fillTriangle(x - 12, 598, x - 20, 626, x - 3, 618)
          .fillTriangle(x + 11, 598, x + 19, 626, x + 3, 618);
        g.fillStyle(0xe0c17d).fillRect(x - 18, 590, 10, 5).fillRect(x + 8, 590, 10, 5);
        g.fillStyle(0xf5d899).fillTriangle(x, 595, x + 4, 599, x, 604);
      }
      this.add.text(x, 550, npc.name + ' · E', { fontSize: '15px', backgroundColor: '#26463e' }).setOrigin(0.5, 1);
    }
    for(const dx of [-36,36])this.add.rectangle(BENCH_X+dx,610,10,40,0x674635);
    this.add.rectangle(BENCH_X,587,100,12,0xba8654);
    this.add.rectangle(BENCH_X-22,575,23,14,0x546c71);
    this.add.text(BENCH_X,546,'제작 작업대 · E',{fontSize:'14px',backgroundColor:'#254541'}).setOrigin(.5);
    this.portal(factoryGate,'버려진 기계공장');
    this.portal(VILLAGE.spawn.x, '숲');
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
    this.portal(FOREST_GATE, '마을');
    this.add.text(110, 536, 'E · 기술자 훈련장 입장', { fontSize: '17px', color: '#f0e6c2', backgroundColor: '#456457', padding: { x: 12, y: 10 } });
  }
}
