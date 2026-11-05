import {requiredExp} from '../data/config';
import {lessons} from './stage1Data';
import type {Progress} from '../systems/ProgressionSystem';
export const MAX_GAME_LEVEL=100;
export interface PromotionExam {level:number;solved:string[]}
// Lv.1 -> 2 uses lesson 1; after ten topics, review the same curriculum in order.
export const examLesson=(level:number)=>lessons[(level-1)%lessons.length];
export const examEligible=(p:Pick<Progress,'level'|'exp'>)=>p.level<MAX_GAME_LEVEL&&p.exp>=requiredExp(p.level);
export function readExam(raw:unknown,p:Pick<Progress,'level'|'exp'>):PromotionExam|null {
 if(!examEligible(p))return null;
 const value=raw as Partial<PromotionExam>|null;
 return {level:p.level,solved:examLesson(p.level).questions.filter(q=>value?.level===p.level&&Array.isArray(value.solved)&&value.solved.includes(q.id)).map(q=>q.id)};
}
export type ExamAction={kind:'answer';level:number;id:string;choice:string}|{kind:'abandon';level:number;confirmed:boolean};
export type ExamResult='saved'|'wrong'|'promoted'|'abandoned'|'failed'|'blocked';
export function takeExam(p:Progress,a:ExamAction,save:(p:Progress)=>boolean):ExamResult {
 if(!examEligible(p)||a.level!==p.level)return 'blocked';
 const exam=readExam(p.exam,p)!;
 const next={...p,exam:{...exam,solved:[...exam.solved]}} as Progress;
 let result:ExamResult='saved';
 if(a.kind==='abandon'){
  if(!a.confirmed)return 'blocked';
  next.exp=0;next.exam=null;result='abandoned';
 }else{
  const q=examLesson(p.level).questions.find(q=>q.id===a.id);
  if(!q)return 'blocked';if(q.answer!==a.choice)return 'wrong';
  if(!next.exam!.solved.includes(q.id))next.exam!.solved.push(q.id);
  if(examLesson(p.level).questions.every(q=>next.exam!.solved.includes(q.id))){
   const credits=examLesson(p.level).questions.map(q=>q.id).filter(id=>!p.stage1.solved.includes(id));
   next.stage1={...p.stage1,examCredits:[...new Set([...p.stage1.examCredits,...credits])]};
   next.exp-=requiredExp(p.level);next.level=p.level+1;
   next.exam=readExam(null,next);result='promoted';
  }
 }
 if(!save(next))return 'failed';Object.assign(p,next);return result;
}
