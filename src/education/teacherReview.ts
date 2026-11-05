import type {Progress} from '../systems/ProgressionSystem';
export interface TeacherDecision {id:string;teacherId:string;approvedAt:string;level:number;submissionText:string;submittedAt:string}
// Production integration must authenticate the teacher on a server and return a verified receipt.
// This port deliberately has no browser/localStorage/password implementation.
export interface TeacherReviewPort {verify(receipt:unknown):Promise<TeacherDecision|null>}
export async function applyTeacherReview(p:Progress,receipt:unknown,port:TeacherReviewPort,save:(p:Progress)=>boolean){
 const decision=await port.verify(receipt);if(!decision||!decision.id||!decision.teacherId||!Number.isFinite(Date.parse(decision.approvedAt)))return false;
 const a=p.stage1.activities[decision.level];if(!a||a.text!==decision.submissionText||a.submittedAt!==decision.submittedAt)return false;
 const next={...p,stage1:structuredClone(p.stage1)};next.stage1.activities[decision.level].review={id:decision.id,teacherId:decision.teacherId,approvedAt:decision.approvedAt};
 if(!save(next))return false;Object.assign(p,next);return true;
}
export const helperResource={url:'https://surface-go3-helper.vercel.app',source:'https://github.com/seyoeb/surface-go3-helper',categories:['전원·충전','키보드·한글 입력','화면·터치','Wi-Fi·네트워크','펜·기타 부속품','시스템 오류']};
