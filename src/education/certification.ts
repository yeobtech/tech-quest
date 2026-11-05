import type {Progress} from '../systems/ProgressionSystem';
import {readEvidence,evidenceComplete,sameEvidence,type PracticalEvidence,type PracticalSubmission,type CertificationReceipt} from './certificationData';
// Only a successful external verification in this running session is trusted.
// Serialized status flags cannot grant approval. Never implement a local teacher password here.
const verified=new WeakMap<Progress,string>();
const signature=(p:Progress)=>JSON.stringify({submission:p.certification.submission,receipt:p.certification.receipt});
export function certificationStatus(p:Progress){
 const c=p.certification;
 if(c.submission&&c.receipt&&verified.get(p)===signature(p))return 'certified';
 return c.receipt?'reverify':c.submission?'waiting':'draft';
}
export function recordPractical(p:Progress,evidence:PracticalEvidence,submit:boolean,save:(p:Progress)=>boolean){
 if(!p.stage1.bossCleared)return 'locked';
 const draft=readEvidence(evidence);if(submit&&!evidenceComplete(draft))return 'incomplete';
 const c=p.certification,next={...p,certification:{...c,draft}};
 const duplicate=!!c.submission&&sameEvidence(c.submission.evidence,draft);
 if(submit&&!duplicate){next.certification={draft,submission:{id:crypto.randomUUID(),revision:(c.submission?.revision??0)+1,submittedAt:new Date().toISOString(),evidence:structuredClone(draft)},receipt:null}}
 if(!save(next))return 'failed';Object.assign(p,next);
 if(submit&&!duplicate)verified.delete(p);
 return submit?(duplicate?'unchanged':'submitted'):'saved';
}
export interface CertificationVerifier {
 // A production server must authenticate the teacher and bind its decision to this exact submission.
 verify(receipt:unknown,submission:PracticalSubmission):Promise<(CertificationReceipt&{evidence:PracticalEvidence})|null>;
}
export async function verifyCertification(p:Progress,receipt:unknown,server:CertificationVerifier,save:(p:Progress)=>boolean){
 const submitted=p.certification.submission;if(!p.stage1.bossCleared||!submitted)return false;
 const original=structuredClone(submitted);
 let answer;try{answer=await server.verify(receipt,structuredClone(original))}catch{return false}
 if(!answer||!answer.id||!answer.teacherId||!Number.isFinite(Date.parse(answer.approvedAt))||answer.submissionId!==original.id||!sameEvidence(answer.evidence,original.evidence)||p.certification.submission?.id!==original.id||!sameEvidence(p.certification.submission.evidence,original.evidence))return false;
 const next={...p,certification:{...p.certification,receipt:{id:answer.id,teacherId:answer.teacherId,approvedAt:answer.approvedAt,submissionId:answer.submissionId}}};
 if(!save(next))return false;Object.assign(p,next);verified.set(p,signature(p));return true;
}
