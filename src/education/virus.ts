import {lessons,type Question} from './stage1Data';
import type {MapData} from '../data/maps';
export const DIGITAL_ARENA:MapData={id:'digital-training',name:'디지털 기술자 훈련소 · 오류 바이러스',width:1280,spawn:{x:220,y:580},platforms:[{x:640,y:630,w:1280}],enemies:[]};
export const virusConfig={hp:180,speed:62,damage:8,exp:60,gold:40,title:'디지털 기술자',buffMs:20000,multiplier:1.5};
// Boss questions are separate from the twenty lesson questions.
export const coreQuestions:Question[]=[1,6,8,10].map(level=>({...lessons[level-1].questions[1],id:`virus-core-${level}`}));
export const bonusQuestion:Question={...lessons[6].questions[1],id:'virus-bonus',prompt:'보드가 켜져 있지만 PC가 인식하지 못합니다. 문제 범위를 좁히는 순서는?',choices:[{id:'check',text:'데이터 케이블·USB 포트·장치 인식 상태를 차례로 확인하고 기록한다'},{id:'reset',text:'먼저 PC 전체를 초기화한다'},{id:'random',text:'여러 설정을 동시에 바꾼다'}],answer:'check',explanation:'한 번에 하나씩 안전한 조건을 비교하면 원인을 좁힐 수 있습니다.',wrongFeedback:'전원 공급과 데이터 연결은 다릅니다. 증상을 기록하고 안전한 점검부터 진행하세요.'};
export class VirusChallenge {
 solved=new Set<string>();buffUntil=0;bonusAttempted=false;
 get shielded(){return this.solved.size<coreQuestions.length}
 answer(id:string,choice:string,now:number){
  const q=coreQuestions.find(q=>q.id===id);if(q){if(choice!==q.answer)return false;this.solved.add(q.id);return true}
  if(this.shielded||id!==bonusQuestion.id||this.bonusAttempted)return false;this.bonusAttempted=true;
  if(choice!==bonusQuestion.answer)return false;this.buffUntil=now+virusConfig.buffMs;return true;
 }
 multiplier(now:number){return now<this.buffUntil?virusConfig.multiplier:1}
}
