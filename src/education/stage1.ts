import {lessons} from './stage1Data';
import type {Progress} from '../systems/ProgressionSystem';
export interface ActivityRecord {text:string; submittedAt:string; selfReported:boolean; review?:{id:string;teacherId:string;approvedAt:string}}
export interface Stage1Progress {accepted:boolean; solved:string[]; activities:Record<string,ActivityRecord>; bossCleared:boolean}
export const newStage1=():Stage1Progress=>({accepted:false,solved:[],activities:{},bossCleared:false});
export const knowledgeDone=(s:Stage1Progress,level:number)=>lessons[level-1]?.questions.every(q=>s.solved.includes(q.id))??false;
export const lessonDone=(s:Stage1Progress,level:number)=>knowledgeDone(s,level)&&!!s.activities[level];
export function learningLevel(s:Stage1Progress){return lessons.find(l=>!lessonDone(s,l.level))?.level??10}
export const bossReady=(s:Stage1Progress)=>s.accepted&&lessons.every(l=>lessonDone(s,l.level));
export function readStage1(raw:any):Stage1Progress {
 const s=newStage1();s.accepted=raw?.accepted===true;
 if(!s.accepted)return s;
 for(const l of lessons){
  for(const q of l.questions)if(Array.isArray(raw?.solved)&&raw.solved.includes(q.id))s.solved.push(q.id);
  const a=raw?.activities?.[l.level];
  if(knowledgeDone(s,l.level)&&typeof a?.text==='string'&&a.text.trim().length>=10&&a.text.length<=2000&&typeof a.submittedAt==='string')s.activities[l.level]={text:a.text,submittedAt:a.submittedAt,selfReported:a.selfReported===true};
  // Local storage never authenticates a teacher. Reviews must be re-verified by the external adapter.
  if(!lessonDone(s,l.level))break;
 }
 s.bossCleared=bossReady(s)&&raw?.bossCleared===true;return s;
}
export type StudyAction={kind:'accept'}|{kind:'answer';id:string;choice:string}|{kind:'submit';level:number;text:string};
export function study(p:Progress,a:StudyAction,save:(p:Progress)=>boolean):'saved'|'wrong'|'blocked'|'failed'{
 const next={...p,stage1:structuredClone(p.stage1)},s=next.stage1;
 if(a.kind==='accept')s.accepted=true;
 else {
  if(!s.accepted)return 'blocked';
  if(a.kind==='answer'){
   const l=lessons.find(l=>l.questions.some(q=>q.id===a.id));if(!l||l.level>learningLevel(s))return 'blocked';
   const q=l.questions.find(q=>q.id===a.id)!;if(q.answer!==a.choice)return 'wrong';
   if(!s.solved.includes(q.id))s.solved.push(q.id);
  }else{
   if(!Number.isInteger(a.level)||a.level<1||a.level>10||a.level>learningLevel(s)||!knowledgeDone(s,a.level)||a.text.trim().length<10||a.text.length>2000)return 'blocked';
   s.activities[a.level]={text:a.text.trim(),submittedAt:new Date().toISOString(),selfReported:true};
  }
 }
 if(!save(next))return 'failed';Object.assign(p,next);return 'saved';
}
