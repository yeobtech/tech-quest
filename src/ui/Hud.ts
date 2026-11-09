import {examEligible} from '../education/promotion';
import {TouchControls} from './TouchControls';
import {learningLevel} from '../education/stage1';
import { requiredExp } from '../data/config';
import type { ProgressionSystem } from '../systems/ProgressionSystem';
export class Hud {
  private root: HTMLElement;
  private digital=false;
  readonly touch:TouchControls;
  onPromotion?:()=>void;
  constructor() {
    document.querySelector('#app')!.innerHTML = `<header><a class="brand" href="./">T<span>✦</span>Q <b>TECH QUEST</b></a><div class="edition">기술을 배우는 작은 모험 <span>PROTOTYPE 01</span></div></header><main><div class="world-heading"><div><small>WORLD 01 / BEGINNER'S FOREST</small><h1>초보자의 숲 <span>탐험 중</span></h1></div><p>첫 모험은 작은 한 걸음부터.</p></div><section class="game-shell"><div id="game"></div><div class="top-overlay"><span>◈ 초보자의 숲</span><span>안전한 학습 환경 · 로컬 플레이</span></div><div class="player-panel"><div class="avatar">⚒</div><div><div class="player-name">견습 기술자 <b id="level"></b></div><div class="meter-label"><span>HP</span><span id="hp"></span></div><div class="meter"><i id="hp-bar"></i></div><div class="meter-label"><span>EXP</span><span id="exp"></span></div><div class="meter exp"><i id="exp-bar"></i></div></div><div class="gold">● <strong id="gold"></strong><small>GOLD</small></div></div><div class="mission"><small>YOUR FIRST ADVENTURE</small><b>숲의 작은 수호자</b><p>몬스터를 사냥하며 조작을 익혀 보세요.</p><span id="kills"></span></div><div id="notice" role="status" aria-live="polite">숲에 오신 것을 환영합니다. Z로 공격해 보세요!</div><button id="focus-game">클릭하여 모험 시작 ↗</button></section><button id="promotion-exam" hidden>EXP 가득 참 · 승급 시험 시작</button><footer><div><kbd>A</kbd><kbd>D</kbd> 이동 <kbd>SHIFT</kbd> 걷기 <kbd>SPACE</kbd> 점프 <kbd>Z</kbd> 공격 <kbd>X</kbd> 발판 너비 측정 <kbd>E</kbd> 상호작용 <kbd>I</kbd> 가방 <kbd>Q</kbd> 퀘스트</div><span id="save-status">진행 상황 자동 저장</span></footer><div class="below"><span>01 <b>탐험하고</b></span><span>02 <b>도전하고</b></span><span>03 <b>성장하세요</b></span><p>기술 학습과 만나는 나만의 모험, TECH QUEST</p></div></main>`;
    this.root = document.querySelector('.game-shell')!;
    this.touch=new TouchControls();
    document.querySelector<HTMLButtonElement>('#promotion-exam')!.onclick=()=>this.onPromotion?.();
    document.querySelector('#focus-game')!.addEventListener('click', () => { document.querySelector('canvas')?.focus(); document.querySelector('#focus-game')?.classList.add('hidden'); });
  }
  talk(npc: { name: string; speech: string }, done: () => void) {
    const panel = document.createElement('dialog');
    panel.className = 'workshop';
    panel.setAttribute('aria-label', npc.name);
    const title = document.createElement('h2');
    title.textContent = npc.name;
    const speech = document.createElement('p');
    speech.textContent = npc.speech;
    const close = document.createElement('button');
    close.textContent = '대화 마치기';
    close.onclick = () => panel.close();
    panel.append(title, speech, close);
    document.body.append(panel);
    panel.addEventListener('close', () => { panel.remove(); done(); }, { once: true });
    panel.showModal();
  }
  location(map: { id: string; name: string }) {
    this.digital=map.id==='digital-training';
    const name = map.name;
    const training = map.id === 'training-yard';
    const factory=map.id==='abandoned-factory';
    const village = map.id === 'technician-village';
    document.querySelector('h1')!.firstChild!.textContent = name + ' ';
    document.querySelector('.world-heading small')!.textContent = this.digital?'STAGE 01 / DIGITAL TRAINING':factory?'AREA / ABANDONED FACTORY':village ? 'VILLAGE / TECHNICIAN TOWN' : training ? 'TRAINING / ENGINEERING YARD' : "WORLD 01 / BEGINNER'S FOREST";
    this.root.querySelector('.top-overlay span')!.textContent = '◈ ' + name;
    this.root.querySelector('.mission b')!.textContent = this.digital?'오류 바이러스 방어막 해제':factory?'제어실로 올라가세요':village ? '마을 주민 만나기' : training ? '출구 포털에 도달하세요' : '숲의 작은 수호자';
    this.root.querySelector('.mission p')!.textContent = this.digital?'E: 복구 퀴즈 · Z: 공격 · B: 마을 복귀':factory?'5층 차단기 E · 6층 제어실로 이동':village ? '주민 곁에서 E · 왼쪽 포털로 숲 이동' : training ? 'A D 이동 · SPACE 점프 · Z 공격 · ↑↓ 사다리 · E 상호작용' : '몬스터를 사냥하며 조작을 익혀 보세요.';
  }
  update(p: ProgressionSystem, hp: number) {
    const pending=examEligible(p.state);
    const examButton=document.querySelector<HTMLButtonElement>('#promotion-exam')!;examButton.hidden=!pending;examButton.textContent=`EXP 가득 참 · Lv.${p.state.level+1} 승급 시험 시작`;
    const named=this.root.querySelector('.player-name')!.firstChild!;
    named.textContent=p.state.learning.completedMissionIds.some(id=>id==='observatory:serial'||id==='observatory:teacher')?'센서 견습 기술자 ':'견습 기술자 ';
    const set = (id: string, text: string) => { this.root.querySelector(`#${id}`)!.textContent = text; };
    set('level', `Lv. ${p.state.level}`); set('hp', `${hp} / ${p.maxHp}`); set('exp', p.state.level>=100?`${p.state.exp} · 최고 레벨`:`${p.state.exp} / ${requiredExp(p.state.level)}${pending?" · 시험 대기":""}`); set('gold', p.state.gold.toLocaleString()); set('kills', this.digital?`학습 Lv. ${learningLevel(p.state.stage1)} / 10`:`누적 처치 ${p.state.kills}마리`);
    (this.root.querySelector('#hp-bar') as HTMLElement).style.width = `${hp / p.maxHp * 100}%`;
    (this.root.querySelector('#exp-bar') as HTMLElement).style.width = `${Math.min(100, p.state.exp / requiredExp(p.state.level) * 100)}%`;
  }
  notice(message: string) { this.root.querySelector('#notice')!.textContent = message; }
  saveStatus(ok: boolean) { document.querySelector('#save-status')!.textContent = ok ? '● 이 브라우저에 자동 저장됨' : '저장 불가 · 현재 플레이는 계속할 수 있습니다'; }
}
