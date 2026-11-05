import {test} from 'node:test';
import assert from 'node:assert/strict';
import {questionBank,stage2Bank,selectQuestions,validSelection,readHistory} from '../src/education/stage2Data.ts';
import {beginExam,examQuestions,takeExam,readExam} from '../src/education/promotion.ts';
import {newProgress,ProgressionSystem} from '../src/systems/ProgressionSystem.ts';
import {SaveSystem} from '../src/systems/SaveSystem.ts';
import {requiredExp} from '../src/data/config.ts';
const pending=(level:number)=>{const p=newProgress();p.level=level;new ProgressionSystem(p).reward(requiredExp(level)+77,0,false);return p};
test('stage2 bank metadata and exactly two new plus two review questions at all ten levels',()=>{
 assert.equal(stage2Bank.length,40);assert.equal(new Set(questionBank.map(q=>q.id)).size,questionBank.length);
 for(let level=11;level<=20;level++){
 const pool=stage2Bank.filter(q=>q.level===level);assert.equal(pool.length,4);assert.equal(new Set(pool.map(q=>q.conceptId)).size,2);
 for(const q of pool){assert.ok(q.choices.some(c=>c.id===q.answer));assert.ok(q.explanation&&q.wrongFeedback);assert.ok([1,2].includes(q.difficulty))}
 const qs=selectQuestions(level);assert.equal(qs.length,4);assert.ok(validSelection(level,qs.map(q=>q.id)));assert.equal(qs.filter(q=>q.level===level).length,2);assert.equal(new Set(qs.map(q=>q.id)).size,4);
 }
});
test('recent variants rotate; history is bounded; insufficient banks do not duplicate or shorten exams',()=>{
 const first=selectQuestions(15),second=selectQuestions(15,first.map(q=>q.id));assert.ok(second.slice(0,2).every(q=>!first.some(a=>a.id===q.id)));
 assert.deepEqual(selectQuestions(15,[],[]),[]);assert.deepEqual(selectQuestions(15,[],questionBank.filter(q=>q.level!==14)),[]);
 assert.deepEqual(selectQuestions(15,[],questionBank.filter(q=>q.level!==15||q.conceptId==='ipo')),[]);
 assert.equal(readHistory(Array(100).fill(first[0].id)).length,80);assert.deepEqual(readHistory(['fake',null,{}]),[]);
 assert.equal(validSelection(15,Array(4).fill(first[0].id)),false);
});
test('all ten exams require four correct answers; promote once, preserve overflow and practical separation',()=>{
 for(let level=11;level<=20;level++){
 const p=pending(level),before=structuredClone(p.stage1);assert.ok(beginExam(p,()=>true));const qs=examQuestions(p);
 for(const [i,q] of qs.entries()){assert.equal(takeExam(p,{kind:'answer',level,id:q.id,choice:q.answer},()=>true),i===3?'promoted':'saved');assert.equal(p.level,i===3?level+1:level)}
 assert.equal(p.exp,77);assert.deepEqual(p.stage1.activities,before.activities);assert.equal(p.stage1.bossCleared,false);
 assert.equal(takeExam(p,{kind:'answer',level,id:qs[3].id,choice:qs[3].answer},()=>true),'blocked');
 }
});
test('save failures roll back; wrong retry keeps EXP; reload preserves selected questions and history',()=>{
 const p=pending(15),before=structuredClone(p);assert.equal(beginExam(p,()=>false),false);assert.deepEqual(p,before);
 let value='';const save=new SaveSystem({getItem:()=>value,setItem:(_,v)=>{value=v}});assert.ok(beginExam(p,n=>save.save(n)));
 const qs=examQuestions(p);assert.equal(p.examHistory.length,4);assert.ok(beginExam(p,n=>save.save(n)));assert.equal(p.examHistory.length,4);
 assert.equal(takeExam(p,{kind:'answer',level:15,id:qs[0].id,choice:'wrong'},()=>{throw Error('no write')}),'wrong');
 const snapshot=structuredClone(p);assert.equal(takeExam(p,{kind:'answer',level:15,id:qs[0].id,choice:qs[0].answer},()=>false),'failed');assert.deepEqual(p,snapshot);
 takeExam(p,{kind:'answer',level:15,id:qs[0].id,choice:qs[0].answer},n=>save.save(n));const restored=save.load();assert.deepEqual(restored.exam,p.exam);assert.deepEqual(restored.examHistory,p.examHistory);assert.equal(restored.exp,before.exp);
 for(const q of qs.slice(1,3))takeExam(restored,{kind:'answer',level:15,id:q.id,choice:q.answer},()=>true);
 const final=structuredClone(restored);assert.equal(takeExam(restored,{kind:'answer',level:15,id:qs[3].id,choice:qs[3].answer},()=>false),'failed');assert.deepEqual(restored,final);
});
test('only confirmed abandonment resets EXP; retake rotates; legacy and corrupt selections migrate safely',()=>{
 const p=pending(12);beginExam(p,()=>true);const ids=p.exam!.questionIds!;
 assert.equal(takeExam(p,{kind:'abandon',level:12,confirmed:false},()=>true),'blocked');
 const before=structuredClone(p);assert.equal(takeExam(p,{kind:'abandon',level:12,confirmed:true},()=>false),'failed');assert.deepEqual(p,before);
 assert.equal(takeExam(p,{kind:'abandon',level:12,confirmed:true},()=>true),'abandoned');assert.equal(p.exp,0);assert.equal(p.exam,null);assert.equal(p.level,12);
 new ProgressionSystem(p).reward(requiredExp(12),0,false);assert.notDeepEqual(p.exam!.questionIds,ids);
 const migrated=readExam({level:12,solved:['s1-2-concept']},p)!;assert.equal(migrated.questionIds?.length,4);assert.deepEqual(migrated.solved,[]);
 const malformed=readExam({level:12,questionIds:['fake'],solved:['fake']},p)!;assert.equal(malformed.questionIds?.length,4);assert.deepEqual(malformed.solved,[]);
});

test('large overflow opens the next four-question exam without auto-promotion; abandon persists through reload',()=>{
 const p=pending(11);p.exp=requiredExp(11)+requiredExp(12)+50;
 let data='';const save=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});
 beginExam(p,n=>save.save(n));for(const q of examQuestions(p))takeExam(p,{kind:'answer',level:11,id:q.id,choice:q.answer},n=>save.save(n));
 const restored=save.load();assert.equal(restored.level,12);assert.equal(restored.exp,requiredExp(12)+50);assert.equal(restored.exam?.questionIds?.length,4);assert.deepEqual(restored.exam?.solved,[]);
 takeExam(restored,{kind:'abandon',level:12,confirmed:true},n=>save.save(n));const abandoned=save.load();assert.equal(abandoned.exp,0);assert.equal(abandoned.exam,null);assert.equal(abandoned.level,12);
});
