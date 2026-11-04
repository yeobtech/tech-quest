import type {Progress} from '../systems/ProgressionSystem';
import {tools} from './tools';

export const quests=[
  {id:'slime',name:'슬라임 5마리 처치',target:5,exp:30,gold:20},
  {id:'bot',name:'로봇 3마리 처치',target:3,exp:40,gold:30},
  {id:'gear',name:'고장 난 톱니 3개 수집',target:3,exp:40,gold:30}
] as const;
export type Quest=typeof quests[number];
export type Journal=Partial<Record<Quest['id'],number|'claimed'>>;
export const achievements=[
  {id:'first',name:'첫 몬스터 처치',title:'새내기 사냥꾼',met:(p:Progress)=>p.kills>=1},
  {id:'ten',name:'누적 10마리 처치',title:'숲의 파수꾼',met:(p:Progress)=>p.kills>=10},
  {id:'badge',name:'첫 희귀 기술 배지',title:'별 수집가',met:(p:Progress)=>!!p.inventory.badge},
  {id:'yard',name:'훈련장 최초 클리어',title:'훈련장 수료생',met:(_p:Progress)=>false},
  {id:'nippers',name:'니퍼 학습 완료',title:'절단 공구 견습생',met:(p:Progress)=>p.learning.completedMissionIds.includes(tools.nippers.mission)}
] as const;
export function earned(p:Progress){
  return achievements.filter(a=>p.achieved.includes(a.id)||a.met(p)).map(a=>a.id);
}
export function readJournal(raw?:Record<string,unknown>):Journal{
  const journal:Journal={};
  for(const q of quests){
    const n=raw?.[q.id];
    if(n==='claimed')journal[q.id]=n;
    else if(typeof n==='number' && Number.isSafeInteger(n)&&n>=0)journal[q.id]=Math.min(q.target,n);
  }
  return journal;
}
export function count(p:Progress,q:Quest){
  if(p.journal[q.id]==='claimed')return q.target;
  return Math.min(q.target,q.id==='gear'?(p.inventory.gear??0):Number(p.journal[q.id]??0));
}
export function ready(p:Progress,q:Quest){
  return typeof p.journal[q.id]==='number' && count(p,q)>=q.target;
}
