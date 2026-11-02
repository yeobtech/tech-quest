import type { Sample } from './sensor';
export const badges={serial:'observatory:serial',teacher:'observatory:teacher'} as const;
export const title='센서 견습 기술자';
export const principle='센서 측정 → 보드에서 유효성 검사 → USB로 결과 출력';
export type Completion=keyof typeof badges;
// An integration must verify a teacher-issued approval for this learner and mission on a trusted service.
// The local game intentionally provides no student-controlled approval flag or teacher PIN.
export interface TeacherReview {verifyForCurrentLearner(mission:'observatory'):Promise<boolean>}
export class Observatory {
  wired=false;connected=false;count=0;cleared:Completion|null=null;
  resetConnection(){this.connected=false;this.count=0}
  setWired(ok:boolean){this.wired=ok;this.resetConnection()}
  receive(source:'serial'|'mock',sample:Sample|null){
    if(source!=='serial'||!this.wired||!this.connected)return;
    this.count=sample?Math.min(3,this.count+1):0;
  }
  answer(answer:string){
    if(!this.wired||!this.connected||this.count!==3||answer!==principle)return false;
    this.cleared='serial';return true;
  }
  async teacherComplete(answer:string,review:TeacherReview){
    if(this.wired&&answer===principle&&await review.verifyForCurrentLearner('observatory'))this.cleared='teacher';
  }
}
export function recordTitle(ids:string[],result:Completion|null) {
  if(!result||Object.values(badges).some(id=>ids.includes(id)))return false;
  ids.push(badges[result]);return true;
}
