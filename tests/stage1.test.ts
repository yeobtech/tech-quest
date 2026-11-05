import {test} from 'node:test';import assert from 'node:assert/strict';
import {lessons,shuffle} from '../src/education/stage1Data.ts';
import {study,learningLevel,readStage1,bossReady} from '../src/education/stage1.ts';
import {newProgress} from '../src/systems/ProgressionSystem.ts';import {SaveSystem} from '../src/systems/SaveSystem.ts';
test('stage1 has exactly two distinct questions per level and stable shuffled answer IDs',()=>{assert.equal(lessons.length,10);assert.equal(new Set(lessons.flatMap(l=>l.questions.map(q=>q.id))).size,20);for(const l of lessons){assert.equal(l.questions.length,2);for(const q of l.questions)assert.ok(shuffle(q.choices,()=>0).some(c=>c.id===q.answer))}});
test('ordered learning is independent, atomic, repeatable and restored with submissions distinct from approval',()=>{
 const p=newProgress();let data='';const save=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});const persist=()=>save.save(p);
 assert.equal(study(p,{kind:'answer',id:lessons[0].questions[0].id,choice:'c0'},()=>true),'blocked');
 study(p,{kind:'accept'},n=>save.save(n));
 assert.equal(study(p,{kind:'answer',id:lessons[1].questions[0].id,choice:'c0'},()=>true),'blocked');
 for(const l of lessons){for(const q of l.questions){assert.equal(study(p,{kind:'answer',id:q.id,choice:'c1'},()=>true),'wrong');assert.equal(study(p,{kind:'answer',id:q.id,choice:q.answer},()=>false),'failed');assert.ok(!p.stage1.solved.includes(q.id));study(p,{kind:'answer',id:q.id,choice:q.answer},n=>save.save(n))}assert.equal(learningLevel(p.stage1),l.level);assert.equal(study(p,{kind:'submit',level:l.level,text:'직접 연습한 결과를 정리한 내용입니다.'},n=>save.save(n)),'saved')}
 assert.ok(bossReady(p.stage1));assert.equal(p.level,1);assert.equal(p.gold,0);persist();assert.deepEqual(save.load().stage1,p.stage1);assert.equal(p.stage1.activities[1].review,undefined);assert.equal(readStage1({solved:['fake']}).solved.length,0);
});
import {applyTeacherReview} from '../src/education/teacherReview.ts';
test('teacher approval needs an external verified receipt bound to the current submission',async()=>{
 const p=newProgress();p.stage1.activities[1]={text:'수행 결과를 실제로 설명했습니다.',submittedAt:'2026-11-05T00:00:00Z',selfReported:true};
 const decision={id:'receipt',teacherId:'teacher',level:1,approvedAt:'2026-11-05T00:01:00Z',submissionText:p.stage1.activities[1].text,submittedAt:p.stage1.activities[1].submittedAt};
 assert.equal(await applyTeacherReview(p,{}, {verify:async()=>null},()=>true),false);
 assert.equal(await applyTeacherReview(p,{}, {verify:async()=>({...decision,submissionText:'other'})},()=>true),false);
 assert.equal(await applyTeacherReview(p,{}, {verify:async()=>decision},()=>false),false);assert.equal(p.stage1.activities[1].review,undefined);
 assert.equal(await applyTeacherReview(p,{}, {verify:async()=>decision},()=>true),true);
});
import {VirusChallenge,coreQuestions,bonusQuestion,virusConfig} from '../src/education/virus.ts';
import {ProgressionSystem} from '../src/systems/ProgressionSystem.ts';
test('virus core shield, bonus wrong answer, exactly 20 second buff and no stacking',()=>{
 const c=new VirusChallenge();assert.ok(c.shielded);
 for(const q of coreQuestions){assert.equal(c.answer(q.id,'invalid',0),false);assert.ok(c.shielded);assert.equal(c.answer(q.id,q.answer,0),true)}
 assert.equal(c.shielded,false);assert.equal(c.answer(bonusQuestion.id,bonusQuestion.answer,1000),true);
 assert.equal(c.multiplier(20999),1.5);assert.equal(c.multiplier(21000),1);assert.equal(c.answer(bonusQuestion.id,bonusQuestion.answer,30000),false);assert.equal(c.multiplier(30000),1);
 const wrong=new VirusChallenge();for(const q of coreQuestions)wrong.answer(q.id,q.answer,0);wrong.answer(bonusQuestion.id,'invalid',0);assert.equal(wrong.multiplier(0),1);assert.equal(wrong.answer(bonusQuestion.id,bonusQuestion.answer,0),false);
});
test('digital clear reward atomically persists once and is independent of material and hardware missions',()=>{
 const p=newProgress(),progress=new ProgressionSystem(p);assert.equal(progress.clearDigital(()=>true),'blocked');
 study(p,{kind:'accept'},()=>true);for(const l of lessons){for(const q of l.questions)study(p,{kind:'answer',id:q.id,choice:q.answer},()=>true);study(p,{kind:'submit',level:l.level,text:'학습 활동에서 확인한 결과 설명입니다.'},()=>true)}
 assert.equal(progress.clearDigital(()=>false),'failed');assert.equal(p.gold,0);assert.equal(p.stage1.bossCleared,false);
 let data='';const saves=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});
 assert.equal(progress.clearDigital(n=>saves.save(n)),'first');assert.equal(p.gold,virusConfig.gold);assert.equal(p.kills,0);assert.deepEqual(p.learning.completedMissionIds,[]);
 const restored=new ProgressionSystem(saves.load());assert.equal(restored.clearDigital(()=>true),'repeat');assert.equal(restored.state.gold,virusConfig.gold);
});
test('saved teacher review remains a history record requiring server verification after reload',()=>{
 const p=newProgress();study(p,{kind:'accept'},()=>true);for(const q of lessons[0].questions)study(p,{kind:'answer',id:q.id,choice:q.answer},()=>true);study(p,{kind:'submit',level:1,text:'실제 수행 기록을 정리한 예시입니다.'},()=>true);
 p.stage1.activities[1].review={id:'r',teacherId:'t',approvedAt:new Date().toISOString(),verification:'verified'};
 const loaded=readStage1(p.stage1);assert.equal(loaded.activities[1].review?.verification,'pending');assert.equal(loaded.activities[1].review?.id,'r');
 study(p,{kind:'submit',level:1,text:'다시 수행해서 수정한 새로운 결과입니다.'},()=>true);assert.equal(p.stage1.activities[1].review,undefined);
});
