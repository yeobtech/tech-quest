import {wiringError,type Wires,type Profile} from '../observatory/wiring';
import type {Progress} from '../systems/ProgressionSystem';
import type {PracticalEvidence,CertificationReceipt} from './certificationData';
export const missionLevels=[11,12,13,14,15] as const;
export type MissionLevel=typeof missionLevels[number];
export const recordFields={task:'수행한 작업',result:'실제 결과 또는 측정값',problem:'발생한 문제',cause:'원인에 대한 추정',solution:'해결 방법',improvement:'개선할 점'} as const;
export type LabNotes=Pick<PracticalEvidence,'problem'|'solution'|'improvement'>&{task:string;result:string;cause:string};
export type Finding='USB PROG'|'USB OTG'|'GPIO'|'3V3'|'GND';
export const findingRoles:Record<Finding,string>={'USB PROG':'PC에서 펌웨어를 업로드하고 USB 직렬 통신에 사용하는 연결 단자','USB OTG':'USB 장치를 다루는 별도 USB 연결 단자','GPIO':'프로그램으로 사용하는 입출력 신호 단자','3V3':'3.3V 전원을 공급하는 단자','GND':'회로의 공통 접지 기준'};
export const jumperTasks=[
 {id:'mm',prompt:'양쪽 장치가 모두 암 소켓입니다. 맞는 점퍼선은?',answer:'수-수',choices:['수-수','수-암','암-암'],hint:'암 소켓은 튀어나온 수 핀을 받습니다.'},
 {id:'mf',prompt:'한쪽은 수 핀, 다른 쪽은 암 소켓입니다.',answer:'수-암',choices:['수-수','수-암','암-암'],hint:'양끝의 모양을 각각 맞추세요.'},
 {id:'ff',prompt:'양쪽 장치 모두 수 핀이 튀어나와 있습니다.',answer:'암-암',choices:['수-수','수-암','암-암'],hint:'튀어나온 핀에는 구멍이 있는 암 단자를 연결합니다.'},
 {id:'roles',prompt:'전원·접지·신호를 구분한 것은?',answer:'3V3 전원 / GND 기준 / GPIO 신호',choices:['3V3 전원 / GND 기준 / GPIO 신호','GPIO는 항상 전원 / GND는 신호'],hint:'단자 색만 보지 말고 표기와 역할을 확인하세요.'},
 {id:'safe',prompt:'5V Echo를 ESP32-S3 GPIO에 직접 연결하려 합니다.',answer:'중지하고 적절한 3.3V 레벨 변환 확인',choices:['중지하고 적절한 3.3V 레벨 변환 확인','직접 꽂아서 시험'],hint:'5V 신호 직결은 위험합니다. 배선 변경 전 전원을 분리하세요.'}
];
export interface LabSubmission {id:string;revision:number;submittedAt:string;notes:LabNotes}
export interface LabRecord {started:boolean;draft:LabNotes;wiring:Wires|null;findings:Partial<Record<Finding,string>>;jumpers:string[];virtualAt:string|null;submission:LabSubmission|null;receipt:CertificationReceipt|null}
export type Practical2=Record<MissionLevel,LabRecord>;
export const newNotes=():LabNotes=>({task:'',result:'',problem:'',cause:'',solution:'',improvement:''});
export function newPractical2():Practical2{return Object.fromEntries(missionLevels.map(l=>[l,{started:false,draft:newNotes(),wiring:null,findings:{},jumpers:[],virtualAt:null,submission:null,receipt:null}])) as unknown as Practical2}
const date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function readNotes(raw:unknown):LabNotes{const n=newNotes(),r=raw as Partial<LabNotes>|null;for(const k of Object.keys(n) as (keyof LabNotes)[])n[k]=typeof r?.[k]==='string'?r[k]!.slice(0,2000):'';return n}
export const notesComplete=(n:LabNotes)=>Object.values(n).every(v=>v.trim().length>=2);
export function readPractical2(raw:unknown):Practical2{
 const out=newPractical2(),r=raw as Partial<Practical2>|null;
 for(const l of missionLevels){const a=r?.[l];if(!a)continue;const n=out[l];n.started=a.started===true;n.draft=readNotes(a.draft);
 for(const key of Object.keys(findingRoles) as Finding[])if(typeof a.findings?.[key]==='string'&&a.findings[key]!.trim().length>=2)n.findings[key]=a.findings[key]!.slice(0,2000);
 n.jumpers=jumperTasks.filter(t=>Array.isArray(a.jumpers)&&a.jumpers.includes(t.id)).map(t=>t.id);
 // These are local activity history, never official approval.
 n.virtualAt=date(a.virtualAt)?a.virtualAt:null;
 if(a.wiring&&missionWiringError(a.wiring,'3v3',0)===null)n.wiring={VCC:'3V3',DATA:'GPIO21',GND:'GND'};
 const s=a.submission;if(s&&typeof s.id==='string'&&s.id.length<=100&&Number.isSafeInteger(s.revision)&&s.revision>0&&date(s.submittedAt)&&notesComplete(readNotes(s.notes)))n.submission={id:s.id,revision:s.revision,submittedAt:s.submittedAt,notes:readNotes(s.notes)};
 // Serialized teacher approval is deliberately not restored as authority.
 }
 return out;
}
export type LabAction={kind:'start'}|{kind:'notes';notes:LabNotes;submit:boolean}|{kind:'finding';key:Finding;explanation:string}|{kind:'jumper';id:string;answer:string};
export function labAction(p:Progress,level:MissionLevel,a:LabAction,save:(p:Progress)=>boolean){
 const state=structuredClone(p.practical2),r=state[level];if(!r)return 'blocked';r.started=true;
 if(a.kind==='notes'){
 r.draft=readNotes(a.notes);if(a.submit){if(!notesComplete(r.draft))return 'incomplete';if(JSON.stringify(r.submission?.notes)!==JSON.stringify(r.draft)){r.submission={id:crypto.randomUUID(),revision:(r.submission?.revision??0)+1,submittedAt:new Date().toISOString(),notes:structuredClone(r.draft)};r.receipt=null}}
 }else if(a.kind==='finding'){
 if(level!==11||!Object.hasOwn(findingRoles,a.key)||a.explanation.trim().length<2)return 'incomplete';r.findings[a.key]=a.explanation.slice(0,2000);
 if(Object.keys(findingRoles).every(k=>r.findings[k as Finding]))r.virtualAt=new Date().toISOString();
 }else if(a.kind==='jumper'){
 const q=jumperTasks.find(q=>q.id===a.id);if(level!==12||!q)return 'blocked';if(q.answer!==a.answer)return 'wrong';if(!r.jumpers.includes(a.id))r.jumpers.push(a.id);if(r.jumpers.length===jumperTasks.length)r.virtualAt=new Date().toISOString();
 }
 const next={...p,practical2:state};if(!save(next))return 'failed';Object.assign(p,next);return 'saved';
}
export function labStatus(p:Progress,l:MissionLevel){const r=p.practical2[l];return r.submission?'교사 확인 대기 · 로컬 제출, 공식 승인 아님':r.virtualAt?'가상 실습 완료 · 로컬 활동 기록':r.started?'진행 중':'시작 전'}
export const exportPractical2=(p:Progress)=>({format:'tech-quest-practical2-v1',notice:'학생 로컬 기록입니다. 교사에게 자동 전송되지 않으며 공식 인증이 아닙니다.',missions:readPractical2(p.practical2)});

export function missionWiringError(w:Wires,profile:Profile,otherWires:number){return wiringError(w,profile)??(w.DATA!=='GPIO21'?'이번 미션의 펌웨어는 DATA=GPIO21입니다. 배선과 코드의 핀을 일치시키세요.':otherWires!==0?'DHT11 이외의 배선을 분리하세요.':null)}
export function recordWiring(p:Progress,w:Wires,profile:Profile,otherWires:number,save:(p:Progress)=>boolean){
 if(missionWiringError(w,profile,otherWires))return false;
 const next={...p,practical2:{...p.practical2,13:{...p.practical2[13],started:true,wiring:{VCC:w.VCC,DATA:w.DATA,GND:w.GND},virtualAt:new Date().toISOString()}}};
 if(!save(next))return false;Object.assign(p,next);return true;
}
