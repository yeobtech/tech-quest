export const certificationAreas = [
 {id:'browser',title:'A. 브라우저·클래스룸',guide:'교사가 안내한 주소와 학교 계정으로 접속하세요. 비밀번호는 기록하지 마세요.',items:[['launch','웹브라우저 실행'],['classroom','클래스룸 접속'],['assignment','지정 과제 찾기']]},
 {id:'files',title:'B. 파일 관리',guide:'교사가 허용한 개인 연습 공간에서만 작업하세요. 시스템 파일이나 다른 사람의 파일은 변경하지 마세요.',items:[['explorer','파일 탐색기 실행'],['folder','폴더 생성'],['copy','파일 복사·붙여넣기'],['submit','이름 변경 및 지정 장소에 파일 제출']]},
 {id:'troubleshooting',title:'C. 컴퓨터 문제 해결',guide:'Helper에서 증상을 찾아 가능한 원인과 안전한 해결 순서를 설명하세요. 시스템 설정 변경이나 초기화는 교사에게 요청하세요.',items:[['search','Surface Go 3 Helper에서 증상 검색'],['reason','가능한 원인과 해결 순서 작성']]},
 {id:'hardware',title:'D. 하드웨어 기초',guide:'전원을 분리한 상태에서 관찰하세요. 색만으로 판단하지 말고 단자 표기를 읽으세요. 실제 통전·배선은 교사 확인 후 진행하세요.',items:[['jumpers','수-수·수-암·암-암 점퍼선 구별'],['pins','KS5034 USB 및 GPIO 단자 찾기'],['power','전원과 신호 단자 구분']]}
] as const;
export type CertificationAreaId=typeof certificationAreas[number]['id'];
export interface PracticalEvidence {areas:Record<CertificationAreaId,{checked:string[];result:string}>;problem:string;solution:string;improvement:string}
export interface PracticalSubmission {id:string;revision:number;submittedAt:string;evidence:PracticalEvidence}
export interface CertificationReceipt {id:string;teacherId:string;approvedAt:string;submissionId:string}
export interface CertificationProgress {draft:PracticalEvidence;submission:PracticalSubmission|null;receipt:CertificationReceipt|null}
export function newEvidence():PracticalEvidence{return {areas:{browser:{checked:[],result:''},files:{checked:[],result:''},troubleshooting:{checked:[],result:''},hardware:{checked:[],result:''}},problem:'',solution:'',improvement:''}}
export const newCertification=():CertificationProgress=>({draft:newEvidence(),submission:null,receipt:null});
export function readEvidence(raw:unknown):PracticalEvidence {
 const e=newEvidence(),r=raw as Partial<PracticalEvidence>|null;
 for(const area of certificationAreas){const a=r?.areas?.[area.id];e.areas[area.id]={checked:area.items.filter(([id])=>Array.isArray(a?.checked)&&a.checked.includes(id)).map(([id])=>id),result:typeof a?.result==='string'?a.result.slice(0,2000):''}}
 for(const key of ['problem','solution','improvement'] as const)e[key]=typeof r?.[key]==='string'?r[key].slice(0,1000):'';
 return e;
}
export function evidenceComplete(e:PracticalEvidence){return certificationAreas.every(a=>a.items.every(([id])=>e.areas[a.id].checked.includes(id))&&e.areas[a.id].result.trim().length>=10)&&[e.problem,e.solution,e.improvement].every(t=>t.trim().length>=2)}
export const sameEvidence=(a:PracticalEvidence,b:PracticalEvidence)=>JSON.stringify(readEvidence(a))===JSON.stringify(readEvidence(b));
export function readCertification(raw:unknown):CertificationProgress{
 const c=newCertification(),r=raw as Partial<CertificationProgress>|null;c.draft=readEvidence(r?.draft);
 const s=r?.submission;
 if(s&&typeof s.id==='string'&&s.id.length<=100&&Number.isSafeInteger(s.revision)&&s.revision>0&&typeof s.submittedAt==='string'&&Number.isFinite(Date.parse(s.submittedAt))&&evidenceComplete(readEvidence(s.evidence)))c.submission={id:s.id,revision:s.revision,submittedAt:s.submittedAt,evidence:readEvidence(s.evidence)};
 const receipt=r?.receipt;
 if(c.submission&&receipt&&receipt.submissionId===c.submission.id&&typeof receipt.id==='string'&&typeof receipt.teacherId==='string'&&typeof receipt.approvedAt==='string'&&Number.isFinite(Date.parse(receipt.approvedAt)))c.receipt={id:receipt.id,teacherId:receipt.teacherId,approvedAt:receipt.approvedAt,submissionId:receipt.submissionId};
 return c;
}
