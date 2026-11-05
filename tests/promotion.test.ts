import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProgress,ProgressionSystem,type Progress} from '../src/systems/ProgressionSystem.ts';
import {SaveSystem} from '../src/systems/SaveSystem.ts';
import {ExamPrompt,takeExam,examLesson,examEligible,readExam} from '../src/education/promotion.ts';
import {study,knowledgeDone,learningLevel,bossReady} from '../src/education/stage1.ts';
import {requiredExp} from '../src/data/config.ts';
import {quests} from '../src/data/quests.ts';
function storage(){let value='';const system=new SaveSystem({getItem:()=>value,setItem:(_,v)=>{value=v}});return {system,set:(p:unknown)=>{value=JSON.stringify({version:1,progress:p})}}}
function answer(p:Progress,index:number,save:(p:Progress)=>boolean=()=>true){const q=examLesson(p.level).questions[index];return takeExam(p,{kind:'answer',level:p.level,id:q.id,choice:q.answer},save)}
test('partial exam survives refresh and wrong answers without spending EXP; overflow requires separate exams',()=>{
 const p=newProgress(),g=new ProgressionSystem(p),s=storage();g.reward(290,24);s.system.save(p);
 assert.equal(answer(p,0,n=>s.system.save(n)),'saved');const loaded=s.system.load();assert.equal(loaded.exam?.solved.length,1);assert.equal(loaded.exp,290);
 const q=examLesson(1).questions[1];assert.equal(takeExam(loaded,{kind:'answer',level:1,id:q.id,choice:'wrong'},()=>{throw Error('must not write')}),'wrong');assert.equal(loaded.exp,290);
 assert.equal(answer(loaded,1,n=>s.system.save(n)),'promoted');assert.deepEqual([loaded.level,loaded.exp,loaded.exam?.level],[2,190,2]);
 assert.equal(takeExam(loaded,{kind:'answer',level:1,id:q.id,choice:q.answer},()=>true),'blocked');
 assert.equal(answer(loaded,0),'saved');assert.equal(answer(loaded,1),'promoted');assert.deepEqual([loaded.level,loaded.exp,loaded.exam],[3,10,null]);
 assert.equal(new ProgressionSystem(loaded).maxHp,130);assert.equal(new ProgressionSystem(loaded).attack,24);
});
test('failed answer, promotion and abandonment writes preserve every field; explicit confirmed abandon resets full EXP only',()=>{
 const p=newProgress();new ProgressionSystem(p).reward(1000,12);const before=structuredClone(p);
 assert.equal(answer(p,0,()=>false),'failed');assert.deepEqual(p,before);answer(p,0);const partial=structuredClone(p);
 assert.equal(answer(p,1,()=>false),'failed');assert.deepEqual(p,partial);
 assert.equal(takeExam(p,{kind:'abandon',level:1,confirmed:false},()=>true),'blocked');assert.deepEqual(p,partial);
 assert.equal(takeExam(p,{kind:'abandon',level:1,confirmed:true},()=>false),'failed');assert.deepEqual(p,partial);
 const s=storage();assert.equal(takeExam(p,{kind:'abandon',level:1,confirmed:true},n=>s.system.save(n)),'abandoned');
 const restored=s.system.load();assert.deepEqual([restored.level,restored.exp,restored.gold,restored.kills,restored.exam],[1,0,12,1,null]);assert.deepEqual(restored.stage1,partial.stage1);
 assert.equal(answer(restored,0),'blocked');new ProgressionSystem(restored).reward(100,0,false);assert.deepEqual(restored.exam,{level:1,solved:[]});
});
test('legacy levels are retained, pending exams derived, stale and malformed answer IDs discarded',()=>{
 const p=newProgress(),s=storage();p.level=8;p.exp=requiredExp(8)+50;p.gold=99;const {exam,...legacy}=p;s.set(legacy);
 let loaded=s.system.load();assert.deepEqual([loaded.level,loaded.exp,loaded.gold],[8,p.exp,99]);assert.deepEqual(loaded.exam,{level:8,solved:[]});
 s.set({...p,exam:{level:7,solved:examLesson(8).questions.map(q=>q.id)}});assert.equal(s.system.load().exam?.solved.length,0);
 const id=examLesson(8).questions[0].id;s.set({...p,exam:{level:8,solved:[id,id,'fake']}});assert.deepEqual(s.system.load().exam?.solved,[id]);
 assert.equal(readExam({level:1,solved:[]},{level:1,exp:99}),null);
});
test('shared concept credit never grants a practical submission, boss clear or duplicate reward; teacher path needs no EXP',()=>{
 const p=newProgress();new ProgressionSystem(p).reward(100,0,false);answer(p,0);answer(p,1);
 assert.equal(knowledgeDone(p.stage1,1),true);assert.equal(p.stage1.accepted,false);assert.equal(bossReady(p.stage1),false);assert.deepEqual(p.stage1.activities,{});
 const s=storage();s.system.save(p);const loaded=s.system.load();assert.equal(knowledgeDone(loaded.stage1,1),true);
 study(loaded,{kind:'accept'},()=>true);const q=examLesson(1).questions[0];study(loaded,{kind:'answer',id:q.id,choice:q.answer},()=>true);
 assert.equal(loaded.stage1.solved.length,0);assert.equal(loaded.stage1.examCredits.length,2);assert.equal(loaded.exp,0);assert.equal(loaded.gold,0);
 study(loaded,{kind:'submit',level:1,text:'실제로 수행한 활동 결과를 정리했습니다.'},()=>true);assert.equal(learningLevel(loaded.stage1),2);assert.equal(loaded.level,2);
 const teacherPath=newProgress();study(teacherPath,{kind:'accept'},()=>true);for(const q of examLesson(1).questions)study(teacherPath,{kind:'answer',id:q.id,choice:q.answer},()=>true);study(teacherPath,{kind:'submit',level:1,text:'교사와 함께 확인한 활동 결과입니다.'},()=>true);
 assert.equal(learningLevel(teacherPath.stage1),2);assert.equal(teacherPath.exp,0);assert.equal(teacherPath.level,1);
});
test('quest threshold and repeated rewards retain answered questions; tenth topic cycles and max level never opens exams',()=>{
 const p=newProgress(),g=new ProgressionSystem(p);p.exp=80;p.journal.slime=5;
 assert.equal(g.questAction(quests[0],true,()=>true),'claimed');assert.equal(p.level,1);assert.equal(examEligible(p),true);answer(p,0);g.reward(30,0);assert.equal(p.exam?.solved.length,1);
 assert.equal(examLesson(10).level,10);assert.equal(examLesson(11).level,1);assert.equal(examLesson(99).level,9);
 p.level=100;p.exp=Number.MAX_SAFE_INTEGER;g.reward(100,0);assert.equal(p.exp,Number.MAX_SAFE_INTEGER);assert.equal(p.exam,null);assert.equal(answer(p,0),'blocked');
});
test('real storage exception during final answer keeps prior answer and replay cannot grant twice',()=>{
 const p=newProgress();new ProgressionSystem(p).reward(100,0,false);let text='';let fail=false;const saves=new SaveSystem({getItem:()=>text,setItem:(_,v)=>{if(fail)throw new Error('quota');text=v}});
 answer(p,0,n=>saves.save(n));fail=true;assert.equal(answer(p,1,n=>saves.save(n)),'failed');assert.equal(saves.load().level,1);assert.equal(p.exam?.solved.length,1);
 fail=false;assert.equal(answer(p,1,n=>saves.save(n)),'promoted');assert.equal(saves.load().level,2);assert.equal(answer(p,1,n=>saves.save(n)),'blocked');
});

test('automatic exam waits for an available game, opens once, and re-arms only after abandon or level change',()=>{
 const prompt=new ExamPrompt(),p=newProgress();assert.equal(prompt.shouldOpen(p,true),false);
 p.exp=requiredExp(1);assert.equal(prompt.shouldOpen(p,false),false);assert.equal(prompt.shouldOpen(p,true),true);
 prompt.opened(1);assert.equal(prompt.shouldOpen(p,true),false);assert.equal(prompt.shouldOpen(p,false),false);assert.equal(prompt.shouldOpen(p,true),false);
 p.exp=0;assert.equal(prompt.shouldOpen(p,true),false);p.exp=requiredExp(1);assert.equal(prompt.shouldOpen(p,true),true);
 prompt.opened(1);p.level=2;p.exp=requiredExp(2);assert.equal(prompt.shouldOpen(p,true),true);prompt.opened(2);assert.equal(prompt.shouldOpen(p,true),false);
 assert.equal(new ExamPrompt().shouldOpen(p,true),true); // Reload resumes pending exam.
});
