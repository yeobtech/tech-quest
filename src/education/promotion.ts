import {missionLevels,type MissionLevel} from './practical2';
import {stage2Level,selectQuestions,validSelection,questionBank,readHistory} from './stage2Data';
import {requiredExp} from '../data/config';
import {lessons} from './stage1Data';
import type {Progress} from '../systems/ProgressionSystem';
export const MAX_GAME_LEVEL=100;
export interface PromotionExam {level:number;solved:string[];questionIds?:string[];recorded?:boolean}
// Legacy curriculum: Lv.1–10 and Lv.21+. Lv.11–20 use the selected stage 2 bank.
export const examLesson=(level:number)=>lessons[(level-1)%lessons.length];
export const examEligible=(p:Pick<Progress,'level'|'exp'>)=>p.level<MAX_GAME_LEVEL&&p.exp>=requiredExp(p.level);
export function readExam(raw:unknown,p:Pick<Progress,'level'|'exp'>&Partial<Pick<Progress,'examHistory'>>):PromotionExam|null {
 if(!examEligible(p))return null;
 const value=raw as Partial<PromotionExam>|null;
 if(stage2Level(p.level)){
  const retained=value?.level===p.level&&validSelection(p.level,value.questionIds);
  const questionIds=retained?value.questionIds!:selectQuestions(p.level,readHistory(p.examHistory)).map(q=>q.id);
  return {level:p.level,questionIds,recorded:retained&&value.recorded===true,solved:retained&&Array.isArray(value.solved)?questionIds.filter(id=>value.solved!.includes(id)):[]};
 }
 return {level:p.level,solved:examLesson(p.level).questions.filter(q=>value?.level===p.level&&Array.isArray(value.solved)&&value.solved.includes(q.id)).map(q=>q.id)};
}
export function examQuestions(p:Progress){
 const exam=readExam(p.exam,p);
 return stage2Level(p.level)?(exam?.questionIds??[]).flatMap(id=>{const q=questionBank.find(q=>q.id===id);return q?[q]:[]}):examLesson(p.level).questions;
}
function recordExam(p:Progress){
 if(p.exam?.questionIds&&!p.exam.recorded){p.examHistory=[...readHistory(p.examHistory),...p.exam.questionIds].slice(-80);p.exam={...p.exam,recorded:true}}
}
export function beginExam(p:Progress,save:(p:Progress)=>boolean):boolean{
 if(!examEligible(p))return false;
 const next={...p,exam:readExam(p.exam,p)};recordExam(next);
 if(stage2Level(p.level)&&examQuestions(next).length!==4)return false;
 if(!save(next))return false;Object.assign(p,next);return true;
}
export type ExamAction={kind:'answer';level:number;id:string;choice:string}|{kind:'abandon';level:number;confirmed:boolean};
export type ExamResult='saved'|'wrong'|'promoted'|'abandoned'|'failed'|'blocked';
export function takeExam(p:Progress,a:ExamAction,save:(p:Progress)=>boolean):ExamResult {
 if(!examEligible(p)||a.level!==p.level)return 'blocked';
 const exam=readExam(p.exam,p)!;
 const questions=examQuestions(p);
 if(stage2Level(p.level)&&questions.length!==4)return 'blocked';
 const next={...p,exam:{...exam,solved:[...exam.solved]}} as Progress;
 let result:ExamResult='saved';
 if(a.kind==='abandon'){
  if(!a.confirmed)return 'blocked';
  recordExam(next);
  next.exp=0;next.exam=null;result='abandoned';
 }else{
  const q=questions.find(q=>q.id===a.id);
  if(!q)return 'blocked';if(q.answer!==a.choice)return 'wrong';
  if(!next.exam!.solved.includes(q.id))next.exam!.solved.push(q.id);
  if(questions.every(q=>next.exam!.solved.includes(q.id))){
   const credits=questions.filter(q=>lessons.some(l=>l.questions.some(item=>item.id===q.id))).map(q=>q.id).filter(id=>!p.stage1.solved.includes(id));
   next.stage1={...p.stage1,examCredits:[...new Set([...p.stage1.examCredits,...credits])]};
   if(missionLevels.includes(p.level as MissionLevel)){const l=p.level as MissionLevel;next.practical2={...p.practical2,[l]:{...p.practical2[l],knowledgePassedAt:new Date().toISOString()}}}
   recordExam(next);
   next.exp-=requiredExp(p.level);next.level=p.level+1;
   next.exam=readExam(null,next);result='promoted';
  }
 }
 if(result==='saved')recordExam(next);
 if(!save(next))return 'failed';Object.assign(p,next);return result;
}

// Session-only prompt latch: closing is not abandonment; map changes keep the latch.
export class ExamPrompt {
 private openedLevel:number|undefined;
 shouldOpen(p:Pick<Progress,'level'|'exp'>,available:boolean){
  if(!examEligible(p)){this.openedLevel=undefined;return false}
  return available&&this.openedLevel!==p.level;
 }
 opened(level:number){this.openedLevel=level}
}
