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
