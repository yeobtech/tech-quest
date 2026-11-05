import {lessons} from './stage1Data';
import type {Progress} from '../systems/ProgressionSystem';
export interface ActivityRecord {text:string; submittedAt:string; selfReported:boolean; review?:{id:string;teacherId:string;approvedAt:string;verification:'verified'|'pending'}}
export interface Stage1Progress {accepted:boolean; examCredits:string[]; solved:string[]; activities:Record<string,ActivityRecord>; bossCleared:boolean}
export const newStage1=():Stage1Progress=>({accepted:false,examCredits:[],solved:[],activities:{},bossCleared:false});
export const questionKnown=(s:Stage1Progress,id:string)=>s.solved.includes(id)||s.examCredits.includes(id);
export const knowledgeDone=(s:Stage1Progress,level:number)=>lessons[level-1]?.questions.every(q=>questionKnown(s,q.id))??false;
export const lessonDone=(s:Stage1Progress,level:number)=>knowledgeDone(s,level)&&!!s.activities[level];
export function learningLevel(s:Stage1Progress){return lessons.find(l=>!lessonDone(s,l.level))?.level??10}
export const bossReady=(s:Stage1Progress)=>s.accepted&&lessons.every(l=>lessonDone(s,l.level));
export function readStage1(raw:any):Stage1Progress {
 const s=newStage1();s.accepted=raw?.accepted===true;s.bossCleared=raw?.bossCleared===true;
 s.examCredits=lessons.flatMap(l=>l.questions).filter(q=>Array.isArray(raw?.examCredits)&&raw.examCredits.includes(q.id)).map(q=>q.id);
 if(!s.accepted)return s;
 for(const l of lessons){
  for(const q of l.questions)if(Array.isArray(raw?.solved)&&raw.solved.includes(q.id)){s.solved.push(q.id);s.examCredits=s.examCredits.filter(id=>id!==q.id)};
  const a=raw?.activities?.[l.level];
  if(knowledgeDone(s,l.level)&&typeof a?.text==='string'&&a.text.trim().length>=10&&a.text.length<=2000&&typeof a.submittedAt==='string'&&Number.isFinite(Date.parse(a.submittedAt)))s.activities[l.level]={text:a.text,submittedAt:a.submittedAt,selfReported:a.selfReported===true};
    // Preserve receipt history, but never trust local storage as teacher authentication.
  if(s.activities[l.level] && typeof a?.review?.id==='string' && typeof a.review.teacherId==='string' && typeof a.review.approvedAt==='string')s.activities[l.level].review={id:a.review.id,teacherId:a.review.teacherId,approvedAt:a.review.approvedAt,verification:'pending'};
  if(!lessonDone(s,l.level))break;
 }
 // Preserve historical boss/stage-2 unlock even if old lesson evidence is incomplete.
 return s;
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
   if(!questionKnown(s,q.id))s.solved.push(q.id);
  }else{
   if(!Number.isInteger(a.level)||a.level<1||a.level>10||a.level>learningLevel(s)||!knowledgeDone(s,a.level)||a.text.trim().length<10||a.text.length>2000)return 'blocked';
   s.activities[a.level]={text:a.text.trim(),submittedAt:new Date().toISOString(),selfReported:true};
  }
 }
 if(!save(next))return 'failed';Object.assign(p,next);return 'saved';
}
