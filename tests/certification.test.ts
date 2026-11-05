import {test} from 'node:test';import assert from 'node:assert/strict';
import {newProgress,ProgressionSystem} from '../src/systems/ProgressionSystem.ts';import {SaveSystem} from '../src/systems/SaveSystem.ts';
import {certificationAreas,newEvidence,readCertification,type PracticalEvidence} from '../src/education/certificationData.ts';
import {recordPractical,certificationStatus,verifyCertification} from '../src/education/certification.ts';
function complete():PracticalEvidence {const e=newEvidence();for(const a of certificationAreas)e.areas[a.id]={checked:a.items.map(([id])=>id),result:'실제 수행에서 확인한 내용과 결과입니다.'};e.problem='연결 상태를 찾기 어려웠음';e.solution='표기와 도움말을 순서대로 확인함';e.improvement='확인한 순서를 기록해 다음에 활용함';return e}
function store(){let data='';const save=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});return {save,raw:(p:unknown)=>{data=JSON.stringify({version:1,progress:p})}}}
test('certification locked before boss; historical boss unlock is retained without new certification data',()=>{
 const p=newProgress();assert.equal(recordPractical(p,complete(),true,()=>true),'locked');
 const s=store();s.raw({...p,stage1:{bossCleared:true},certification:undefined});const loaded=s.save.load();assert.equal(loaded.stage1.bossCleared,true);assert.equal(certificationStatus(loaded),'draft');assert.equal(new ProgressionSystem(loaded).clearDigital(()=>true),'repeat');
});
test('draft round trip, incomplete submission rejected, submission immutable while draft changes',()=>{
 const p=newProgress();p.stage1.bossCleared=true;const s=store(),partial=newEvidence();partial.problem='아직 연습 중';
 assert.equal(recordPractical(p,partial,false,n=>s.save.save(n)),'saved');assert.equal(s.save.load().certification.draft.problem,partial.problem);
 assert.equal(recordPractical(p,partial,true,()=>true),'incomplete');assert.equal(p.certification.submission,null);
 assert.equal(recordPractical(p,complete(),true,n=>s.save.save(n)),'submitted');const submitted=structuredClone(p.certification.submission);assert.equal(certificationStatus(p),'waiting');
 const edit=complete();edit.problem='수정한 다른 문제 설명';recordPractical(p,edit,false,n=>s.save.save(n));assert.deepEqual(p.certification.submission,submitted);assert.deepEqual(s.save.load().certification,p.certification);
});
test('identical submit is idempotent, changed resubmit increments and preserves RPG rewards',()=>{
 const p=newProgress();p.stage1.bossCleared=true;p.gold=40;p.exp=60;recordPractical(p,complete(),true,()=>true);const first=structuredClone(p.certification.submission);
 assert.equal(recordPractical(p,complete(),true,()=>true),'unchanged');assert.deepEqual(p.certification.submission,first);
 const edit=complete();edit.improvement='개선한 내용을 새롭게 설명합니다.';assert.equal(recordPractical(p,edit,true,()=>true),'submitted');assert.equal(p.certification.submission?.revision,2);assert.notEqual(p.certification.submission?.id,first?.id);
 assert.deepEqual([p.gold,p.exp,p.stage1.bossCleared],[40,60,true]);assert.equal(new ProgressionSystem(p).clearDigital(()=>true),'repeat');
});
test('storage failures roll back draft, submission and receipt without losing previous content',()=>{
 const p=newProgress();p.stage1.bossCleared=true;recordPractical(p,complete(),true,()=>true);const before=structuredClone(p),edit=complete();edit.solution='새로운 해결 방법입니다.';
 assert.equal(recordPractical(p,edit,false,()=>false),'failed');assert.deepEqual(p,before);assert.equal(recordPractical(p,edit,true,()=>false),'failed');assert.deepEqual(p,before);
});
test('serialized approval is never trusted; only external verified receipt for exact submission is accepted',async()=>{
 const p=newProgress();p.stage1.bossCleared=true;recordPractical(p,complete(),true,()=>true);const submission=p.certification.submission!;
 const receipt={id:'receipt-1',teacherId:'teacher-1',approvedAt:new Date().toISOString(),submissionId:submission.id,evidence:submission.evidence};
 const s=store();p.certification.receipt=receipt;s.save.save(p);const loaded=s.save.load();assert.equal(certificationStatus(loaded),'reverify');
 assert.equal(await verifyCertification(loaded,{}, {verify:async()=>null},()=>true),false);
 assert.equal(await verifyCertification(loaded,{}, {verify:async()=>{throw Error('offline')}},()=>true),false);
 assert.equal(await verifyCertification(loaded,{}, {verify:async()=>({...receipt,submissionId:'other'})},()=>true),false);
 assert.equal(await verifyCertification(loaded,{}, {verify:async()=>({...receipt,evidence:newEvidence()})},()=>true),false);
 assert.equal(await verifyCertification(loaded,{}, {verify:async()=>receipt},()=>false),false);assert.equal(certificationStatus(loaded),'reverify');
 assert.equal(await verifyCertification(loaded,{}, {verify:async()=>receipt},n=>s.save.save(n)),true);assert.equal(certificationStatus(loaded),'certified');assert.equal(certificationStatus(s.save.load()),'reverify');
 loaded.certification.submission!.evidence.problem='사용자가 수정한 제출 내용';assert.notEqual(certificationStatus(loaded),'certified');
});
test('resubmission invalidates approval and rejects late teacher response for an older submission',async()=>{
 const p=newProgress();p.stage1.bossCleared=true;recordPractical(p,complete(),true,()=>true);const old=structuredClone(p.certification.submission!);
 const receipt={id:'r',teacherId:'t',approvedAt:new Date().toISOString(),submissionId:old.id,evidence:old.evidence};
 await verifyCertification(p,{}, {verify:async()=>receipt},()=>true);assert.equal(certificationStatus(p),'certified');
 const edit=complete();edit.problem='다시 확인한 문제 내용입니다.';recordPractical(p,edit,true,()=>true);assert.equal(p.certification.receipt,null);assert.equal(certificationStatus(p),'waiting');
 assert.equal(await verifyCertification(p,{}, {verify:async()=>receipt},()=>true),false);
 const current=structuredClone(p.certification.submission!);assert.equal(await verifyCertification(p,{}, {verify:async()=>{edit.solution='검증 도중 다시 변경한 결과';recordPractical(p,edit,true,()=>true);return {...receipt,submissionId:current.id,evidence:current.evidence}}},()=>true),false);
});
test('malformed certification fields cannot crash or create complete records',()=>{
 assert.deepEqual(readCertification(null).draft,newEvidence());const c=readCertification({draft:{areas:{browser:{checked:['fake','launch','launch'],result:77}}},submission:{id:'x',revision:1,evidence:{}}});assert.deepEqual(c.draft.areas.browser.checked,['launch']);assert.equal(c.submission,null);
});
